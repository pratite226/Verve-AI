# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Verve AI (repo/folder still named `BrandPilot-AI`) — an AI-assisted personal-branding content tool.
React SPA + Node/Express REST API. AI generation is Google Gemini (`@google/genai`,
`gemini-3.1-flash-lite`) — note `@anthropic-ai/sdk` is in `server/package.json` but unused.

`HLD.md` and `LLD.md` are kept current and are the authoritative design docs — read them for
data-model fields, the full API reference, and the rationale behind cross-cutting decisions.
`README.md` is empty.

## Repository layout

Two independent npm packages, no root `package.json` / workspace:

- `server/` — Express API (CommonJS, `type: commonjs`). Entry `server/server.js`.
- `client/verve/` — Vite + React 19 SPA (ESM, `type: module`).

Run `npm install` separately in each. Env for the server comes from a **single root `.env`**
(`server/server.js` loads `../.env`); the client reads its own `client/verve/.env` (Vite
`VITE_*` vars). Copy `.env.example` and `client/verve/.env.example`.

## Commands

Server (`cd server`):
- `npm run dev` — nodemon on `server.js` (port 5000)
- `npm start` — plain `node server.js`
- `npm run db:migrate` — `prisma migrate dev` (Postgres billing schema; loads `../.env`)
- `npm run db:seed` — seed billing `Plan` rows (`prisma/seed.js`)
- `npm run db:studio` — Prisma Studio

Client (`cd client/verve`):
- `npm run dev` — Vite dev server (port 5173)
- `npm run lint` — ESLint (flat config `eslint.config.js`)
- `npm run build` — client bundle → `dist/`
- `npm run build:ssr` — SSR entry → `dist-ssr/`
- `npm run build:all` — both; required for the single-process monolith deploy mode where
  `server.js` serves the client and SSRs `/`

Full stack: `docker compose up` — brings up `mongo`, `postgres`, `redis`, `server`, `client`
(nginx static build on port 8080). SSR does **not** activate in this mode (client/server are
separate containers).

### Tests

There is **no test suite**. `server`'s `npm test` is a placeholder that exits 1. CI
(`.github/workflows/ci.yml`, on push/PR to `main`) only runs: client `lint` + `build` +
`build:ssr`, and a server "boot check" (`prisma generate`, start the process against dummy
env, curl `GET /api/health`). Match this bar before opening a PR — see `CONTRIBUTING.md`
(`main` is always deployable, branch as `feature/<desc>` or `fix/<desc>`).

`GET /api/health` deliberately touches no database, so it reflects only "process is alive".

## Architecture

### Dual datastore, application-level link

MongoDB (Mongoose) holds everything except billing: `User`, `BrandBrief`, `ContentDraft`,
`CanvasNote`, `Analytics`. PostgreSQL (Prisma, `server/prisma/schema.prisma`) holds **only**
billing: `Plan`, `Subscription`, `Invoice`. There is no cross-database FK — `Subscription.mongoUserId`
is a plain string referencing Mongo's `User._id`, enforced in application code. All Postgres
access goes through Prisma's query builder; the single exception is one parameterized
`$queryRaw` tagged template in `billingController.getSummary`.

`server/config/`: `db.js` (Mongo connect), `prisma.js` (Prisma singleton), `redis.js`.

### AI layer — strict three-way separation

- `server/prompts/*.js` — pure functions returning a prompt string. No I/O, no SDK.
- `server/services/aiService.js` — the **only** module that calls the Gemini SDK. Owns model
  selection, fence-stripping, `JSON.parse`, and converting malformed model output into a
  descriptive `Error` (never lets a raw parse exception reach the client).
- Controllers — HTTP only (validation, status codes, persistence). They call `aiService`, not
  the SDK.

Keep this separation when adding AI features: new prompt builder in `prompts/`, new function
in `aiService.js`, controller wires them together.

### Brand Brief is the single source of truth

Every generation path (content post, content ideas, weekly plan, profile rewrite, canvas
analysis) feeds the user's `BrandBrief` into its prompt. There is intentionally no code path
that generates content without one — endpoints 404/400 when the brief is missing. Onboarding
answers → `POST /api/brand/generate` → AI produces the structured brief (incl. `pillarWeights`
summing to 100) → upserted one-per-user.

### Scheduling reuses ContentDraft

There is no separate "plan" or "schedule" table. A scheduled/planned post is just a
`ContentDraft` with `status: "scheduled"` + `scheduledDate`. The AI Weekly Planner generates
real drafts (parallel `Promise.allSettled`), and `WeeklyPlanner.jsx` just re-fetches drafts in
the week's date range. Drag-and-drop reschedule uses native HTML5 DnD (no library) and calls
the same `PUT /api/content/:id/schedule` as the date picker.

### Real-time and caching are additive, fail-soft

- **Socket.IO** (`services/socketService.js`): handshake authed with the same JWT as REST;
  each socket joins room `user:<id>`. Mutations emit `draft:created` / `draft:statusChanged`
  (content) and `billing:updated` (Stripe webhook). Client pages just **re-fetch** on any
  event — this keeps multiple tabs of one account in sync. Client coalesces event bursts via
  `queueMicrotask` (`utils/async.js` `coalesceMicrotask`) into one re-fetch.
- **Redis** (`config/redis.js`): caches `GET /api/content` and `GET /api/analytics/overview`
  per-user for 5 min, invalidated on every `ContentDraft` write (`invalidateContentCaches` in
  `contentController.js`). If `REDIS_URL` is unset/unreachable it degrades to no caching —
  never blocks boot, never returns stale-incorrect data.
- **Cron** (`server/jobs/index.js`, `node-cron`, daily 03:00): flips lapsed `Subscription`s to
  `past_due`; prunes `Analytics.dailySnapshots` older than 90 days (that array is embedded in
  the user's analytics doc and must stay bounded).

### Config that fails fast vs. fails soft

`server/utils/validateEnv.js` runs before anything else in `server.js` and **exits** if a
required secret is missing (Mongo URI, JWT secret, etc.). Optional integrations degrade instead:
no `REDIS_URL` → no cache; no SMTP vars → password-reset links logged to console; no
`GOOGLE_CLIENT_ID` → `POST /api/auth/google` returns 501; Stripe/Gemini keys only needed when
those features are exercised.

### Stripe webhook ordering

`POST /api/billing/webhook` is mounted with `express.raw()` **before** `express.json()` in
`server.js` because signature verification needs the unparsed body. `subscribeUser` wraps the
`Subscription` upsert + first `Invoice` in one `prisma.$transaction`.

### SSR is deliberately scoped to `/` only

`client/verve/src/entry-server.jsx` server-renders **only** the static Landing page, and only
when a build exists at `client/verve/dist{,-ssr}/`. `main.jsx` picks `hydrateRoot` vs
`createRoot` based on whether `#root` already has children. Every other route is plain
client-rendered. Without a build present, `server.js` serves `/` as plain text and nothing
else changes. The `index.html` bootstrap script (theme, outside React) runs before first paint
so it can't cause a hydration mismatch.

### Frontend conventions

- Route table in `src/App.jsx`; protected pages wrapped in `<ProtectedRoute>` (redirects to
  `/login` when `AuthContext` has no user). `AuthContext` calls `GET /api/auth/me` on mount if
  a token is in `localStorage`.
- `src/services/api.js` — the axios instance that attaches the JWT bearer. Use it, not raw
  `axios`.
- Data fetching is plain `useEffect` + axios per page; no query-cache library.
- Tailwind v4 with a design-token layer in `src/index.css` (`--color-*` / `--font-*` custom
  properties + hand-written component classes like `.btn-primary`). Dark is the default theme
  and brand identity — `prefers-color-scheme` is intentionally ignored; light is opt-in via
  `data-theme="light"` on `<html>`, toggled by `ThemeContext`.
- JS style: `const`/`let` only (no `var`), functions as `const fn = () => {}`. The one
  intentional `function` declaration is `retryWithBackoff`/`attempt` in `src/utils/async.js`
  (relies on hoisting so the entry point can precede its helper — see the comment there).

### Backend error-handling shape

Every controller action: `try { ... } catch (error) { res.status(500).json({ success: false,
message: error.message }) }`, with explicit 4xx for validation failures. `middleware/errorMiddleware.js`
is the final `app.use()` and handles anything passed to `next(err)` (currently just multer
upload errors → 400). Successful responses are `{ success: true, ... }`.
