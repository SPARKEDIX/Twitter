/**
 * Serves the `api/` serverless handlers from the Vite dev server.
 *
 * Why this exists
 * ---------------
 * In production Vercel runs `api/bots/*.ts` as Node functions. `npm run dev`
 * starts only Vite, which has no idea serverless functions exist — so
 * `/api/bots/feed` falls through to the static file handler and responds
 * `200 OK` with the **raw TypeScript source** of the handler instead of JSON.
 *
 * That failure is especially nasty because it looks like success: status 200,
 * no console error, and the client's `response.json()` throws and is swallowed
 * into a `null`. The symptom is a permanently empty bot feed with no clue why.
 *
 * This plugin mounts the real handlers on the dev server so local behaviour
 * matches production. It is dev-only — `apply: 'serve'` — so it never reaches
 * a build.
 *
 * The alternative, `vercel dev`, also works and is closer to production, but it
 * adds a CLI dependency and a second dev workflow to keep in sync. This keeps
 * `npm run dev` as the single command.
 */

import type { Connect, Plugin, ViteDevServer } from 'vite';
import type { ServerResponse } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Anything under this prefix is handled here rather than by Vite. */
const API_PREFIX = '/api/';

/**
 * Loads `.env` into `process.env` for the dev server only.
 *
 * Vite loads `.env` into `import.meta.env` for the browser bundle and nowhere
 * else. The bot handlers read `process.env` — correctly, because that is what
 * they get on Vercel — so without this the local server sees an unconfigured
 * provider and the tick endpoint returns a 500 about missing variables.
 *
 * Real environment variables win, so `vercel dev` or a CI run is unaffected.
 */
function loadDotEnv(root: string): void {
  const file = path.resolve(root, '.env');
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator < 0) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

/**
 * Minimal shape of a Vercel handler. Duplicated from `api/_lib/http.ts` so this
 * file does not import from `api/`, which would pull server-only code (and the
 * provider key) into the dev server's module graph at the wrong time.
 */
type HandlerRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
};

type HandlerResponse = {
  status(code: number): HandlerResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
};

/** Adapts a Node `ServerResponse` to the handler contract. */
function createHandlerResponse(res: ServerResponse): HandlerResponse {
  return {
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
    },
    json(payload: unknown) {
      // The handlers never set Content-Type themselves, so it is set here.
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload));
    },
    end() {
      res.end();
    },
  };
}

/** Collects the body for methods that carry one. GET/HEAD need nothing. */
async function readBody(req: Connect.IncomingMessage): Promise<string> {
  const method = (req.method ?? 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') return '';

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function safeParseJson(text: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function devApiPlugin(): Plugin {
  return {
    name: 'bot-dev-api',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      loadDotEnv(server.config.root);

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? '';
        if (!rawUrl.startsWith(API_PREFIX)) {
          next();
          return;
        }

        try {
          // "/api/bots/feed?limit=5" -> routePath "bots/feed", query "limit=5"
          const [routePath, queryString] = rawUrl.slice(API_PREFIX.length).split('?');

          // Guard against traversal such as /api/../../etc/passwd.
          const apiRoot = path.resolve(server.config.root, 'api');
          const resolved = path.resolve(apiRoot, routePath);
          if (!resolved.startsWith(apiRoot)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          const modulePath = [resolved, `${resolved}.ts`, `${resolved}.js`].find((candidate) =>
            existsSync(candidate)
          );

          if (!modulePath) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `No API route for /${routePath}` }));
            return;
          }

          // ssrLoadModule goes through Vite's module graph, so editing a handler
          // and saving re-runs it on the next request.
          const imported = (await server.ssrLoadModule(modulePath)) as {
            default?: (req: HandlerRequest, res: HandlerResponse) => Promise<void> | void;
          };

          if (typeof imported.default !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `${routePath} has no default export` }));
            return;
          }

          const query: Record<string, string | string[] | undefined> = {};
          if (queryString) {
            for (const [key, value] of new URLSearchParams(queryString)) query[key] = value;
          }

          const body = await readBody(req);
          const handlerRequest = {
            method: (req.method ?? 'GET').toUpperCase(),
            query,
            headers: req.headers as Record<string, string | string[] | undefined>,
            ...(body ? safeParseJson(body) : {}),
          } as HandlerRequest & Record<string, unknown>;

          await imported.default(handlerRequest, createHandlerResponse(res));
        } catch (error) {
          server.config.logger.error(
            `[dev-api] ${req.method} ${rawUrl} failed: ${
              error instanceof Error ? (error.stack ?? error.message) : String(error)
            }`
          );
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify({ error: 'Local API handler failed. See the terminal.' }));
        }
      });
    },
  };
}