# Low-Level Design (LLD) — BrandPilot AI

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

## 2. API Reference

All routes below except `POST /api/auth/signup` and `POST /api/auth/login` require
`Authorization: Bearer <JWT>` (enforced by `authMiddleware.protect`).

### Auth — `/api/auth`
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/signup` | `{ name, email, password, industry?, careerStage?, goals? }` | `{ success, message }` — password must be 8+ chars incl. a number and a special character |
| POST | `/login` | `{ email, password }` | `{ success, token, user }` |
| GET | `/me` | — | `{ success, user }` |

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
client/brandai/src/
├── pages/            # one component per route (Landing, Login, Signup, Onboarding,
│                      # Dashboard, ContentStudio, WeeklyPlanner, BrandBrief (Profile
│                      # Makeover), Settings, Canvas)
├── components/        # shared UI (Reveal — scroll-in animation wrapper)
├── context/            # AuthContext — user/loading state + login/signup/logout
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

## 5. Error Handling Conventions

- Every controller action follows the same shape: `try { ... } catch (error) { return
  res.status(500).json({ success: false, message: error.message }) }`, with explicit
  `4xx` responses for validation failures (missing fields, invalid enum values, no Brand Brief
  yet).
- AI-facing service functions (`aiService.js`) never let a raw parse exception leak to the
  client — malformed model output is caught and re-thrown as a descriptive `Error` (e.g. "AI
  returned an unparseable Brand Brief. Please try again.") that the controller's catch block
  turns into a clean JSON error response.
