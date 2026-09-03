# Low-Level Design (LLD) — Verve AI

## 1. Data Models (Mongoose schemas)

### `User` (`server/models/User.js`)
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercased |
| password | String | required — bcrypt hash, never returned (`.select("-password")`) |
| industry, careerStage, goals, ageRange, gender | String | populated from onboarding answers |
| interests | [String] | |
| timestamps | — | `createdAt` / `updatedAt` |

### `BrandBrief` (`server/models/BrandBrief.js`)
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId → User | required, unique (one brief per user) |
| positioning, tagline, tone, targetAudience, mission | String | AI-generated, user-editable |
| contentPillars | [String] | AI-generated, user-editable |
| pillarWeights | Map<String, Number> | percentage per pillar name, sums to ~100; AI-suggested, user-editable |
| preferredPlatforms | [String] | from onboarding-adjacent settings |
| postingFrequency | String | free text, used as guidance for the weekly planner |
| topicsLoved, thingsToAvoid, inspirations, biggestChallenge, notFor, differentiator | String/[String] | additional context captured to sharpen prompts |
| rawAnswers | Mixed | raw onboarding payload, kept for reference |

### `ContentDraft` (`server/models/ContentDraft.js`)
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId → User | required |
| platform | enum: `linkedin`, `instagram`, `twitter` | required |
| topic, pillar | String | |
| content | String | required — the generated/edited post text |
| status | enum: `draft`, `scheduled`, `posted` | default `draft` |
| scheduledDate | Date \| null | set when scheduled via Planner |

### `CanvasNote` (`server/models/CanvasNote.js`)
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId → User | required |
| type | enum: `text`, `image` | default `text` |
| content | String | required — text, or image URL if `type: image` |
| x, y | Number | board position, default `40, 40` |

### `Analytics` (`server/models/Analytics.js`)
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId → User | required, unique + indexed — one document per user |
| dailySnapshots | [{ date, postsCreated, postsByPlatform, postsByStatus }] | embedded, capped to a rolling ~90-day window (pruned by the nightly cron job) |

**Embedding vs. referencing**: `Analytics.dailySnapshots` is *embedded* inside the user's
document rather than living in its own collection keyed by `userId` — it's always read and
written together with "this user's analytics," and it's bounded (pruned nightly), so embedding
avoids an extra query for data that's never accessed independently. Everything else
(`BrandBrief`, `ContentDraft`, `CanvasNote`) *references* `User` via an `ObjectId` instead,
because those collections are unbounded, queried independently of the user record itself (e.g.
"all drafts scheduled this week" across the *drafts* collection), and don't need to be loaded
just because the user is.

### Indexes
- `ContentDraft`: compound `{ userId: 1, status: 1 }` and `{ userId: 1, scheduledDate: 1 }` —
  match the actual query shapes in `contentController.js` (status-filtered lists, planner
  date-range lookups), both always scoped to one user first.
- `CanvasNote`: text index on `content` for board search.
- `BrandBrief.userId`, `Analytics.userId`: unique indexes (one document per user).

## 1a. PostgreSQL schema (billing only — `server/prisma/schema.prisma`)

Billing/subscriptions are the one relational slice of the app — everything else stays on
Mongo (see HLD.md "Tech Stack" for why). Accessed exclusively through Prisma's query builder
(`config/prisma.js`), so there is no hand-built SQL string anywhere except the one intentional
`$queryRaw` in `billingController.getSummary`, which uses a parameterized tagged template
(never string concatenation) for the month-rollup GROUP BY that Prisma's `groupBy()` can't
express directly.

| Table | Key columns | Notes |
|---|---|---|
| `Plan` | `id` PK, `name` unique, `priceCents`, `interval`, `features` (Json) | seeded via `prisma/seed.js`, not user-created |
| `Subscription` | `id` PK, `mongoUserId` (indexed, references Mongo's `User._id` — enforced at the app layer since no cross-database FK is possible), `planId` FK → `Plan.id`, `status`, `stripeSubscriptionId` | |
| `Invoice` | `id` PK, `subscriptionId` FK → `Subscription.id`, `amountCents`, `status`, `issuedAt` (indexed) | `amountCents` is stored (not derived from `Plan.priceCents`) because it's a point-in-time billed fact — a plan's price can change after the invoice was issued |

`billingController.subscribeUser` wraps the `Subscription` upsert and its first `Invoice`
creation in a single `prisma.$transaction` — called from the Stripe webhook handler, so a
crash mid-write can never leave a subscription active with no corresponding invoice (or vice
versa).

## 2. API Reference

### Analytics — `/api/analytics`
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/overview` | — | `{ success, byPlatform, byPillar, byStatus, recentSnapshots, profileContext }` — `byPlatform`/`byPillar`/`byStatus` come from a single `$facet` aggregation pipeline over `ContentDraft`; `recentSnapshots` is the last 30 entries of the caller's `Analytics.dailySnapshots`; `profileContext` (`{ name, industry }`) comes from `.populate("userId", "name industry")` on the `Analytics` document — see §1's embedding-vs-referencing note |

All routes below except `POST /api/auth/signup` and `POST /api/auth/login` require
`Authorization: Bearer <JWT>` (enforced by `authMiddleware.protect`).

### Auth — `/api/auth`
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/signup` | `{ name, email, password, industry?, careerStage?, goals? }` | `{ success, message }` — password must be 8+ chars incl. a number and a special character |
| POST | `/login` | `{ email, password }` | `{ success, token, user }` |
| POST | `/google` | `{ credential }` — the Google ID token string from Identity Services | `{ success, token, needsOnboarding, user }` — `501` if `GOOGLE_CLIENT_ID` is unset |
| GET | `/me` | — | `{ success, user }` |
| POST | `/forgot-password` | `{ email }` | `{ success, message }` — always the same generic message whether or not the email is registered, to avoid leaking which emails have accounts |
| POST | `/reset-password` | `{ token, password }` | `{ success, message }` — `token` is the raw value from the emailed link; only its SHA-256 hash is ever stored (`User.resetPasswordTokenHash`), and it's single-use + expires after 1 hour (`User.resetPasswordExpires`) |

**Password reset flow**: `forgotPassword` (`authController.js`) generates a random token via
`crypto.randomBytes(32)`, stores only its SHA-256 hash + a 1-hour expiry on the `User`
document, and emails `${CLIENT_URL}/reset-password/<rawToken>` through
`services/mailerService.js`. The mailer needs `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` configured
(see `.env.example`) — without them, it logs the link to the server console instead of
throwing, so the whole flow still works end-to-end in local dev without real SMTP
credentials. `resetPassword` re-hashes the incoming token and looks up a `User` whose stored
hash matches and whose expiry hasn't passed; on success it clears both fields, so the same
link can't be reused. Client pages: `ForgotPassword.jsx` (`/forgot-password`) and
`ResetPassword.jsx` (`/reset-password/:token`), both linked from `Login.jsx`.

**Google sign-in flow**: `googleAuth` (`authController.js`) verifies the ID token with
`google-auth-library`'s `verifyIdToken` (signature, `aud` = `GOOGLE_CLIENT_ID`, `iss`,
expiry), then requires both a `sub` claim and a Google-**verified** `email` — an unverified
email is rejected with `401` for login, linking, and account creation alike (so nobody can
pre-register an address they don't control). Resolution order: match on `googleId` → else
link Google onto an existing account with that email → else create a new account (a
concurrent-first-login `E11000` is caught and re-resolved). `needsOnboarding` is `true` for a
newly created account or any account with no `BrandBrief` yet; the client
(`GoogleSignInButton.jsx` → `AuthContext.loginWithGoogle`) routes on it (`/onboarding` vs
`/dashboard`). Optional feature: with `GOOGLE_CLIENT_ID` unset the endpoint returns `501` and
the client hides the button (needs `VITE_GOOGLE_CLIENT_ID` too — see `.env.example` files).

### Brand — `/api/brand`
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/generate` | onboarding answers (see §3.1) | `{ success, brief }` — upserts the user's `BrandBrief` |
| GET | `/` | — | `{ success, brief }` (404 if none yet) |
| PUT | `/` | any subset of allow-listed brief fields (incl. `pillarWeights`) | `{ success, brief }` |

### Content — `/api/content`
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/generate` | `{ platform, topic, pillar?, tone?, length? }` | `{ success, draft }` |
| POST | `/generate-multi` | `{ platforms: [...], topic, pillar?, tone?, length? }` | `{ success, drafts, failures? }` — parallel generation via `Promise.allSettled` |
| POST | `/ideas` | `{ count?, exclude? }` | `{ success, ideas: [string] }` |
| POST | `/planner/generate` | `{ weekStart }` (Monday, `YYYY-MM-DD`) | `{ success, drafts, failures? }` — AI plans the week, then generates + saves a draft per slot |
| GET | `/planner?start=&end=` | — | `{ success, drafts }` — drafts scheduled in range |
| GET | `/` | — | `{ success, drafts }` — all of the user's drafts |
| PUT | `/:id/schedule` | `{ scheduledDate }` | `{ success, draft }` — sets date + `status: scheduled` |
| PUT | `/:id/status` | `{ status }` | `{ success, draft }` — enum-validated |
| PUT | `/:id/refine` | `{ action }` | `{ success, draft }` — rewrites `content` in place |
| DELETE | `/:id` | — | `{ success, message }` |

`action` for `/refine` is one of: `improve`, `shorten`, `more_engaging`, `more_professional`,
`more_casual`, `add_hook`, `add_cta`, `add_storytelling`.

### Canvas — `/api/canvas`
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/notes` | `{ type?, content, x?, y? }` | `{ success, note }` |
| GET | `/notes` | — | `{ success, notes }` |
| PUT | `/notes/:id` | subset of `{ content, x, y }` | `{ success, note }` |
| DELETE | `/notes/:id` | — | `{ success, message }` |
| POST | `/analyze` | — | `{ success, summary, suggestions: [{ idea, basedOn }] }` |

### Profile — `/api/profile`
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/optimize` | `{ currentHeadline?, currentAbout? }` (at least one required) | `{ success, optimizedHeadline, optimizedAbout, changesSummary }` |

### Billing — `/api/billing` (Postgres-backed, see §1a)
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/plans` | — (public, no auth) | `{ success, plans }` |
| POST | `/checkout` | `{ planName }` | `{ success, url }` — Stripe Checkout Session URL to redirect the browser to |
| POST | `/webhook` | raw Stripe event body + `stripe-signature` header | `{ received: true }` — verifies signature, then `checkout.session.completed` calls `subscribeUser` |
| GET | `/invoices?status=&sort=issuedAt:desc` | — | `{ success, invoices }` — filtered + ordered, scoped to the caller's own subscription(s) |
| GET | `/summary` | — | `{ success, byStatus, byMonth }` — `byStatus` via Prisma `groupBy()`, `byMonth` via a raw parameterized SQL `GROUP BY`/`JOIN` |

Canvas also has `POST /api/canvas/upload` (multipart, field `image`) → `{ success, url }`, used
by the client before creating an image-type `CanvasNote` with that URL as `content`.

## 3. Key Flows

### 3.1 Onboarding → Brand Brief generation
1. `Onboarding.jsx` collects answers across 5 steps (basics, pasted LinkedIn About, two free-text
   prompts, a 3-question forced-choice voice quiz) into a single payload:
   `{ whatTheyDo, industry, careerStage, goal, audience, personality, achievements }`.
2. `POST /api/brand/generate` → `brandController.generateBrand`:
   - Calls `aiService.generateBrandBrief(answers)`, which builds a prompt
     (`prompts/brandBriefPrompt.js`) instructing the model to return one JSON object with
     `positioning, tagline, tone, targetAudience, mission, contentPillars, pillarWeights`
     (weights required to sum to 100).
   - Response text is fence-stripped and `JSON.parse`d; a parse failure raises a clear error
     rather than silently storing garbage.
   - Result is upserted into `BrandBrief` (`findOneAndUpdate` with `upsert: true`), and
     onboarding-adjacent fields (`industry`, `careerStage`, etc.) are written onto `User`.

### 3.2 Content generation with tone/length override
- `buildContentPrompt(brief, platform, topic, pillar, tone, length)` — `tone` overrides
  `brief.tone` when supplied; `length` selects a word-count band per platform (short/medium/long,
  with Twitter's long band becoming a short thread) via a lookup table, `LENGTH_GUIDANCE`.
- Multi-platform generation (`generate-multi`) runs all requested platforms concurrently with
  `Promise.allSettled`, so one platform's failure (e.g. a transient AI error) doesn't block the
  others — each fulfilled result is saved as its own `ContentDraft`, failures are reported back
  alongside the successes.

### 3.3 AI Weekly Planner
1. `plannerPrompt.js` is given the brief (pillars, tone, preferred platforms, posting frequency)
   and asked to return a JSON array of `{ dayOffset (0-6), platform, pillar, topic }` — not every
   day needs an entry, and pillars/platforms are constrained to the ones defined on the brief.
2. `contentController.generateWeeklyPlanContent`:
   - Validates each assignment's `platform`/`dayOffset`, defaults an invalid `pillar` to `""`.
   - For each valid assignment (in parallel, `Promise.allSettled`), calls the same
     `generateContentPost` used by the single-post flow to produce real content, computes
     `scheduledDate = weekStart + dayOffset days`, and creates a `ContentDraft` with
     `status: "scheduled"`.
3. On the client, `WeeklyPlanner.jsx` re-fetches the week's drafts afterward via the existing
   `getPlanner` endpoint — no separate "plan" data structure exists; a plan **is** a set of
   `ContentDraft`s with dates.
4. **Drag-and-drop reschedule**: implemented with native HTML5 DnD (no library) — draft cards
   are `draggable` and stash their `_id` via `dataTransfer` on `dragstart`; each day column
   accepts the drop and calls the existing `PUT /:id/schedule`, so rescheduling by drag reuses
   the same code path as the manual date-picker.

### 3.4 Draft refinement
- `refineContentPrompt.js` maps each `action` to a specific rewrite instruction (e.g. `add_hook`
  → "rewrite with a much stronger opening hook, keep the rest intact"), and includes the brief's
  tone/positioning/`thingsToAvoid` so a refinement can't drift off-brand.
- `refineContent` controller loads the existing draft + brief, calls
  `aiService.refineContentPost(brief, platform, content, action)`, and overwrites
  `draft.content` in place (no version history is kept — refinement is destructive by design,
  matching the "Improve" button pattern of a single editable draft).

### 3.5 Canvas board analysis
- Only `type: "text"` notes are sent to the model (image notes are excluded from the prompt).
- `canvasAnalyzePrompt.js` + the brief produce a `{ summary, suggestions: [{ idea, basedOn }] }`
  shape, letting the UI show *why* each suggested content idea was surfaced (which note(s) it
  traces back to).

## 4. Frontend Structure

```
client/verve/src/
├── pages/            # one component per route (Landing, Login, Signup, Onboarding,
│                      # Dashboard, ContentStudio, WeeklyPlanner, BrandBrief (Profile
│                      # Makeover), Settings, Canvas)
├── components/        # shared UI (Reveal — scroll-in animation wrapper)
├── context/            # AuthContext — user/loading state + login/signup/logout
│                        # ThemeContext — dark/light theme + persistence
├── routes/             # ProtectedRoute — redirects to /login when no user
├── services/            # api.js — axios instance, attaches JWT from localStorage
└── App.jsx              # route table; protected pages wrapped in <ProtectedRoute>
```

- **Auth state**: `AuthContext` holds `{ user, loading }` plus `login/signup/logout`. On mount it
  calls `GET /auth/me` if a token exists in `localStorage`; on failure the token is cleared. All
  pages needing a logged-in user read this via `useAuth()`.
- **Data fetching**: plain `useEffect` + `axios` per page (no query-caching library) — acceptable
  given each page's data needs are simple and mostly single-purpose fetches.
- **Styling**: Tailwind v4 with a small custom design-token layer in `index.css` (`--color-*`,
  `--font-*` custom properties consumed as Tailwind utilities, plus hand-written component
  classes like `.btn-primary`, `.field-input`, `.auth-card` for the shared editorial visual style).
- **Theming**: dark is the app's default and brand identity (not the OS preference — see the
  bootstrap script in `index.html`, which deliberately ignores `prefers-color-scheme` so
  first-time visitors see the intended design rather than whatever their OS defaults to). Every
  `--color-*` token is redefined under `:root[data-theme="light"]` in `index.css` for the opt-in
  light theme, including role-shifted ones like `--color-cobalt` (glow-bright in dark, since it's
  only ever used as text/border/fill against a near-black ground; moss-olive in light, so the
  same uses stay readable against paper) and `--color-on-accent` (the color of text sitting on
  an accent-filled surface — dark in dark mode, light in light mode — kept independent of
  `--color-paper` specifically so accent-filled buttons/chips/`::selection` don't depend on
  whichever color the *page* background happens to be). `ThemeContext` toggles the `data-theme`
  attribute on `<html>` and persists the choice to `localStorage`; `ThemeToggle.jsx` is the
  button, rendered in `AppShell` (all authenticated pages) and in the headers of Landing/
  Login/Signup. The `index.html` bootstrap script applies the stored/default theme
  synchronously before first paint (avoids a flash of the wrong theme) and lives outside the
  React tree, so it can never cause a hydration mismatch on the SSR'd Landing route.

## 5. Error Handling Conventions

- Every controller action follows the same shape: `try { ... } catch (error) { return
  res.status(500).json({ success: false, message: error.message }) }`, with explicit
  `4xx` responses for validation failures (missing fields, invalid enum values, no Brand Brief
  yet).
- AI-facing service functions (`aiService.js`) never let a raw parse exception leak to the
  client — malformed model output is caught and re-thrown as a descriptive `Error` (e.g. "AI
  returned an unparseable Brand Brief. Please try again.") that the controller's catch block
  turns into a clean JSON error response.
- `server/middleware/errorMiddleware.js` is the final `app.use()` and catches anything passed
  to `next(err)` instead of being handled by a controller's own try/catch (currently just
  `multer` upload errors — bad file type, file too large — mapped to a clean `400`).

## 6. Background jobs, real-time, and caching

- **Cron** (`server/jobs/index.js`, `node-cron`, daily at 03:00): sweeps `Subscription`s whose
  `currentPeriodEnd` has passed into `past_due`, and prunes `Analytics.dailySnapshots` entries
  older than 90 days so that embedded array stays bounded (see §1's embedding note).
- **WebSockets** (`server/services/socketService.js`, Socket.IO): the handshake is
  authenticated with the same JWT as REST (`jsonwebtoken.verify`), and each socket joins a
  `user:<id>` room. `contentController` emits `draft:created`/`draft:statusChanged` after a
  mutation; the Stripe webhook emits `billing:updated`. Client pages (`ContentStudio.jsx`,
  `WeeklyPlanner.jsx`) subscribe and just re-fetch on any event — this keeps multiple open
  tabs for the same account in sync without a manual refresh.
- **Redis caching** (`server/config/redis.js`): `GET /api/content` and
  `GET /api/analytics/overview` are cached per-user for 5 minutes, invalidated on every
  `ContentDraft` write (`invalidateContentCaches` in `contentController.js`). Degrades to "no
  caching" if `REDIS_URL` is unset or unreachable — unlike the required auth secrets
  (`validateEnv.js`), a missing cache layer makes requests slower, never incorrect, so it
  fails soft rather than blocking boot.

## 7. Frontend JS notes

- **Hoisting**: elsewhere the codebase uses `const`/`let` exclusively (no `var`) and defines
  functions as `const fn = () => {}` rather than `function fn() {}`, sidestepping hoisting's
  more surprising failure modes. The one deliberate exception is
  `client/verve/src/utils/async.js`'s `retryWithBackoff`/`attempt` pair: `retryWithBackoff`
  (the public entry point, defined first) calls `attempt` (the recursive retry loop, defined
  below it) — legal only because `function` declarations hoist their full body, not just the
  binding. See the comment above `attempt` for why that ordering (entry point before its
  helper) is the actual reason to lean on hoisting instead of avoiding it.
- **Closures**: `debounce`/`coalesceMicrotask` (`client/verve/src/utils/async.js`) and the
  toast auto-dismiss timers (`client/verve/src/hooks/useToast.jsx`) all rely on values
  captured in an enclosing scope persisting across calls — see the inline comments in those
  files for the specific mechanism in each.
- **Event loop**: two real mechanisms, one per task type. `useToast`'s `setTimeout`-based
  auto-dismiss is a **macrotask**, scheduled to run after the current call stack (and any
  pending microtasks/state updates) finish — see the comment at the top of `useToast.jsx`.
  `coalesceMicrotask` (`utils/async.js`), used by `ContentStudio.jsx`/`WeeklyPlanner.jsx`'s
  socket listeners, defers via `queueMicrotask` — a **microtask**, which the event loop drains
  completely before the next macrotask — so a burst of `draft:created` events emitted
  back-to-back by `generateMultiPlatform`/`generateWeeklyPlanContent`
  (`contentController.js`) collapses into a single re-fetch instead of one per event.
- **Promises vs. callbacks / async-await**: `utils/async.js`'s `readFileAsDataURL` wraps
  `FileReader`'s callback-based API (`onload`/`onerror`) in a `Promise`, so the Canvas image
  upload flow (`Canvas.jsx`) can `await` it the same way it awaits the axios upload call right
  after — both read as sequential steps instead of nested callbacks.
