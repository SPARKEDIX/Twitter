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

## Known issues

- `Chat.tsx` reads `messagesEndRef.current?.childElementCount` during render to
  build a dependency array, which trips Oxlint's `react(refs)` rule and stops
  React Compiler from optimising the component.
- The 1200 ms preloader re-arms on every route change.
- Follow state lives in page-local `useState`, so following someone on Explore
  is forgotten on navigation.
- `public/*.png` PWA icons are 0 bytes — the installed app has broken icons.
- `.kilo/worktrees/` holds a full duplicate checkout that is not git-ignored.

