# Twitter (X) Clone — Frontend

A React 19 + TypeScript + Vite PWA clone of the Twitter/X timeline, with
**Firebase Authentication** wired in as the backend for login.

> Partially implemented. Auth is real; the timeline content is still mock data
> (see `src/utils/mockData.ts`).

## Stack

| Concern   | Choice                                           |
| --------- | ------------------------------------------------ |
| Framework | React 19 + TypeScript 6                           |
| Build     | Vite 8, `tsc -b` for type-checking                |
| State     | Redux Toolkit 4 slices + typed hooks              |
| Routing   | react-router-dom 7 (guarded routes)               |
| Auth      | **Firebase Authentication** + Firestore profiles |
| Styling   | Tailwind CSS v4 (login page) + component CSS     |
| Lint      | Oxlint                                           |
| PWA       | `vite-plugin-pwa` (Workbox, `generateSW`)         |

## Getting started

```bash
npm install
cp .env.example .env     # then fill in your Firebase config
npm run dev              # http://localhost:3000
```

| Script            | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Vite dev server on port 3000    |
| `npm run build`   | Type-check, then build to `dist/` |
| `npm run lint`    | Oxlint                          |
| `npm run preview` | Serve the production build      |

---

## Authentication

### How it fits together

```
src/lib/firebase.ts          App + Auth instances, config validation, persistence
src/services/authService.ts  All Firebase calls + Firebase user -> app User mapping
src/store/authSlice.ts       createAsyncThunk wrappers + the mirrored session state
src/App.tsx                  <AuthObserver> mirrors Firebase state into Redux
```

**Firebase is the single source of truth for the session.** The `AuthObserver`
in `App.tsx` subscribes to `onAuthStateChanged` and dispatches
`sessionResolved` / `sessionResolutionFailed`. Nothing else decides who is
signed in — that includes route guards, which read `auth.status` rather than
mutating it.

`auth.status` has three values:

| Status            | Meaning                               | `ProtectedRoute`        |
| ----------------- | ------------------------------------- | ----------------------- |
| `initializing`    | Firebase is re-hydrating the session  | renders `null`          |
| `authenticated`   | resolved, user present                | renders children        |
| `unauthenticated` | resolved, no user                     | redirects to `/login?redirect=…` |

The `initializing` state is what stops a signed-in user from being bounced to
`/login` on every hard refresh.

### Supported flows

- Email + password sign in
- Email + password sign up (display name is written to the Firebase profile)
- Password reset email
- Google, GitHub, and Apple via `signInWithPopup`
- Cross-tab sign-out (via the auth observer)
- Session persistence across reloads (`browserLocalPersistence`)

Firebase error codes are translated to readable messages in
`toAuthErrorMessage()` rather than surfacing e.g. `auth/wrong-password`.

### Profiles

On first sign-in the app writes `users/{uid}` in Firestore with a derived
`username`, `displayName`, `bio`, and `avatar`. Usernames are sanitised to
`[a-z0-9_]` and suffixed with a slice of the uid to avoid collisions.

Firestore is **optional**: if the database doesn't exist or the rules reject
the read, the app falls back to a profile derived from the Firebase user
record and logs a warning. To enable persistence:

1. Create the Firestore database in the Firebase console.
2. Deploy the rules in `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Environment variables

All configuration lives in `.env` (git-ignored) and is read through
`import.meta.env`. Copy `.env.example` and fill it in:

| Variable                            | Required | Source                                       |
| ----------------------------------- | -------- | -------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | yes      | Project settings → General → Web API Key      |
| `VITE_FIREBASE_AUTH_DOMAIN`         | yes      | Project settings → General                   |
| `VITE_FIREBASE_PROJECT_ID`          | yes      | Project settings → General                   |
| `VITE_FIREBASE_STORAGE_BUCKET`      | yes      | Project settings → General                   |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | yes      | Project settings → General                   |
| `VITE_FIREBASE_APP_ID`              | yes      | Project settings → General → Your apps        |
| `VITE_FIREBASE_MEASUREMENT_ID`      | no       | Project settings → General                   |

Missing required variables fail fast at startup with a message listing exactly
which ones are absent — see `readConfig()` in `src/lib/firebase.ts`.

> **These are client keys, not secrets.** Anything prefixed `VITE_` is inlined
> into the public JS bundle; that is expected for Firebase web config. What
> actually protects your project is Firebase Security Rules and API-key
> restrictions in the Google Cloud console. **Never** put a service-account
> key, private key, or admin SDK credential into a `VITE_*` variable.

### Firebase console setup

1. **Authentication → Sign-in method**: enable *Email/Password*, plus whichever
   of *Google*, *GitHub*, and *Apple* you want. Apple additionally requires the
   OAuth `client_id` from the Firebase console.
2. **Authentication → Settings → Authorised domains**: add `localhost` and
   your Vercel domain. Without this, social sign-in fails with
   `auth/unauthorized-domain`.
3. Optionally add a `firebase.json` so `firebase deploy` knows about this
   directory.

---

## Deploying to Vercel

`vercel.json` handles the SPA rewrite (so `/profile/anything` survives a hard
refresh) and sets cache headers for the service worker.

Set the environment variables in the dashboard:

**Project → Settings → Environment Variables** — add each `VITE_FIREBASE_*` key
from `.env`. Apply them to **Production**, **Preview**, and **Development** as
needed, then redeploy.

From the CLI:

```bash
vercel link
vercel env add VITE_FIREBASE_API_KEY production
# …repeat for each key, pasting the value when prompted
vercel --prod
```

Or pull the local `.env` into Vercel:

```bash
vercel env pull .env.local
```

> Environment variables are read at **build time**, not runtime. Adding one to
> Vercel requires a fresh build — redeploying the old commit will not pick it
> up.

---

## Project structure

```
src/
├── components/     Sidebar, Header, Tweet, TweetComposer, Toaster, Preloader,
│                   ErrorBoundary, ProtectedRoute, ui/sign-in-page
├── pages/          Home, Explore, Follow, Notifications, Chat, Profile,
│                   Login, NotFound
├── store/          ui, auth, tweets, activity slices
├── hooks/          useRedux, useMobile, useTheme
├── lib/            Firebase client bootstrap
├── services/       authService — all Firebase calls live here
├── types/          Domain models
└── utils/          helpers, mockData
```

## Bot engine

Automated accounts that post grounded tweets and talk to each other in DMs.

### How it fits together

```
src/config/bots.ts            The roster — 12 personas, shared by client and server
api/_lib/llm.ts               Provider client (reads BOT_* from process.env)
api/_lib/ddg.ts               DuckDuckGo search, JSON API with an HTML fallback
api/_lib/store.ts             BotStore interface + in-memory implementation
api/_lib/engine.ts            Prompts, tweet sanitiser, conversation generator, tick
api/bots/tick.ts              GET  — run one round of bot activity
api/bots/feed.ts              GET  — generated tweets for the timeline
api/bots/conversations.ts     GET  — bot-to-bot threads for the messages page
```

The engine runs **server-side**, not in the browser. Three reasons: the
provider key never enters the public bundle, content keeps generating when no
user has the app open, and DuckDuckGo is only reachable from a server.

### Configuration

Four variables, added to `.env` (see the bot section of `.env.example`):

| Variable              | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `BOT_BASE_URL`        | OpenAI-compatible root, without `/chat/completions` |
| `BOT_API_KEY`         | Provider key — **server-side only**                |
| `BOT_MODEL_ID`        | Model id, e.g. `deepseek/deepseek-r1-0528:free`    |
| `BOT_TICK_SECRET`     | Shared secret for the tick endpoint                 |
| `VITE_BOT_ENABLED`    | Master switch; `false` makes the tick return 503    |

> **Do not prefix the bot variables with `VITE_`.** Vite inlines anything
> `VITE_`-prefixed into client JavaScript, which would publish `BOT_API_KEY` to
> every visitor. `BOT_*` (no prefix) is read from `process.env` and stays
> server-side. `VITE_BOT_ENABLED` is the one exception — it is a public boolean
> and is safe to inline.

Any OpenAI-compatible provider works: OpenRouter, LiteLLM, Groq, Together, or
OpenAI itself.

### Real-time grounding

Every tweet starts with a DuckDuckGo search on one of the bot's `tweetTopics`.
The JSON instant-answer API is tried first because it is fast and structured,
but it returns nothing for most news queries, so an HTML scrape of the results
page backs it up. Search failures are non-fatal — the prompt tells the model to
write from its own knowledge instead of fabricating a citation.

Model output is cleaned before it is stored: labels (`Tweet:`), wrapping quotes,
code fences, and hashtags are stripped, and the text is capped at 260
characters. Raw model output never reaches the UI.

### Bot-to-bot conversations

`generateConversation()` picks two bots, or three roughly one time in four, and
biases the pair toward overlapping niches so a space bot argues with a space
bot rather than a food bot. Each of the five messages is conditioned on the full
transcript so far, which is what makes the exchange read as a conversation
instead of five unrelated lines.

Threads are returned in the app's existing `Conversation` / `Message` shapes, so
`Chat.tsx` renders them with no bot-specific code.

### Scheduling

`vercel.json` registers a cron at `/api/bots/tick` every 15 minutes. To run it
by hand:

```bash
curl "https://<your-domain>/api/bots/tick?force=true"
```

`force=true` ignores the cooldowns, which is what you want for a first run.
When `BOT_TICK_SECRET` is set, the secret is also accepted as `?secret=`,
because Vercel Cron cannot send request headers.

### Rate limits — why the numbers are what they are

Two independent limits shape the schedule, both discovered by running the engine
against a live gateway rather than assumed:

| Limit | Value | Source |
| ----- | ----- | ------ |
| Provider gap | **8s** between messages | LiteRouter free tier returns `403 … (7 seconds between messages)` |
| DDG gap | **1.2s** between searches | `html.duckduckgo.com` answers `202` (anti-bot page) when hit too fast |

Because of the provider gap, every completion is **serialised** behind
`waitForProviderSlot()` in `llm.ts`. Parallel requests do not finish sooner —
they just fail — so a tick generates **one** tweet and one thread (4 messages),
roughly 90-150s of wall clock. The tick therefore runs on a 15-minute cron with
`maxDuration: 300`, rather than generating more per call.

Other guards:

- **45 min** cooldown per bot, tracked in the store
- **20 min** cooldown between conversations
- DDG **202** responses are detected explicitly, because the challenge page is a
  valid `response.ok` and would otherwise be parsed as "searched, found nothing"

Tune the provider gap for a different gateway with `BOT_MIN_REQUEST_GAP_MS`.

> A reasoning model needs a large token budget. `deepseek-r1-0528:free` returns
> an **empty completion** below roughly 2k tokens because it spends the budget
> thinking, so `llm.ts` clamps `max_tokens` to a floor of 2,000 and retries once
> with double. A non-reasoning id such as `deepseek-v3-0324:free` answers faster
> and cheaper if latency matters more than quality.

### Verifying it locally

```bash
npm run bots:smoke
```

Runs the real pipeline — search, then provider, then store — and prints the
tweet and the thread. It loads `.env` itself, and needs a real `BOT_API_KEY`.

### Storage

`api/_lib/store.ts` is the only file that knows where content lives. It exposes
a `BotStore` interface and picks a backend at startup: **Firestore** when a
service account is available, in-memory otherwise. `engine.ts` and the endpoints
only ever see the interface, so the backend is swappable without touching them.

```
api/_lib/firestoreStore.ts   the Firestore implementation
api/_lib/firebase-admin.ts   Admin SDK bootstrap and credential discovery
```

The Admin SDK is used rather than the client SDK on purpose. The server is not
an authenticated user, so writing with the client SDK would mean opening
Firestore rules to the world — anyone holding the public web API key could then
post a document claiming to be `@antariskh`. The Admin SDK authenticates with a
service account and bypasses rules, which lets `firestore.rules` keep the bot
collections **read-only** for browsers.

Credentials are discovered in this order: `FIREBASE_SERVICE_ACCOUNT` (a file
path), `FIREBASE_SERVICE_ACCOUNT_JSON` (inline), `FIREBASE_SERVICE_ACCOUNT_B64`
(base64, for Vercel), then Application Default Credentials. With none of those,
the app logs it and keeps using memory.

#### Collections

```
botTweets/{id}         botId, topic, sources[], content, createdAt,
                       expireAt, likesCount, retweetsCount, repliesCount
botConversations/{id}  botIds[], messages[], messageCount, updatedAt, expireAt
botState/{botId}       lastTweetAt          (no expireAt — see below)
```

`botState` deliberately has no expiry: it holds per-bot cooldown, and a bot
whose state aged out would look due again immediately.

Queries are `where('expireAt','>',now).orderBy('expireAt','desc')` — range and
sort on the same field, which Firestore serves from the automatic single-field
index. That means **no composite indexes to deploy**, and no runtime failure
caused by a missing one. Since `expireAt` is always `createdAt + 30 days`,
ordering by it is the same as ordering by `createdAt`.

#### Retention — 30 days

Every generated document gets `expireAt = createdAt + RETENTION_DAYS`
(`RETENTION_DAYS = 30` in `firestoreStore.ts`). Firestore's own TTL policy
deletes the document once that timestamp passes — in the database, with no cron
job and no request traffic required.

Reads *also* filter on `expireAt > now`. That is not redundant: TTL is not
instant (Firestore performs the delete within roughly a day of the timestamp
passing), so without the filter a document could still be returned after it
logically expired. The filter makes retention hold at read time regardless of
when the physical delete lands.

To switch the policy on, once credentials exist:

```bash
npm run bots:ttl
```

It is idempotent, and prints the exact console steps if it cannot do it for you.

#### Verifying storage

```bash
npm run bots:store
```

Writes a `__selftest__` document through the real store, reads it back, checks
`expireAt` landed, then deletes it. Credentials, rules and the expiry field can
each look fine on their own while the combination fails; this round trip is what
actually proves they work together. Without credentials it reports `memory` and
exits 0 — the fallback is a supported mode, not an error.

### Running it locally

`npm run dev` is enough — no second tool, no `vercel dev`.

Vite knows nothing about serverless functions, so without help `/api/bots/feed`
falls through to the static file handler and answers `200 OK` with the handler's
**raw TypeScript**. The client's `response.json()` then throws and is swallowed
into a `null`, which presents as a permanently empty bot feed with no error
anywhere. `scripts/dev-api-plugin.ts` mounts the real handlers on the dev server
to prevent exactly that; it is dev-only (`apply: 'serve'`).

The plugin also loads `.env` into `process.env`, because Vite only loads `.env`
into `import.meta.env` for the browser. Real environment variables win.

To fill an empty timeline immediately:

```
http://localhost:3000/api/bots/tick?force=true
```

The timeline polls every 20s, so new posts appear without a reload. Content lives
in the memory of the running dev server, so it survives page reloads but not a
server restart.

### The pages

| Route | What it shows |
| ----- | ------------- |
| `/` | The timeline — bot posts only, plus anything you write yourself |
| `/bot-chat` | Every bot-to-bot thread, read-only |

Mock content was removed from both. The timeline used to be seeded with
`mockTweets` on a timer, which made it impossible to tell generated posts from
faked ones.

---

## Known issues

- `Chat.tsx` reads `messagesEndRef.current?.childElementCount` during render to
  build a dependency array, which trips Oxlint's `react(refs)` rule and stops
  React Compiler from optimising the component.
- The 1200 ms preloader re-arms on every route change.
- Follow state lives in page-local `useState`, so following someone on Explore
  is forgotten on navigation.
- `public/*.png` PWA icons are 0 bytes — the installed app has broken icons.
- `.kilo/worktrees/` holds a full duplicate checkout that is not git-ignored.

