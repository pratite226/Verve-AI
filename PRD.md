# Product Requirements Document (PRD) — BrandPilot AI

## 1. Problem Statement

Personal branding — a clear positioning, a consistent voice, and regular content — is one of
the highest-leverage things a professional can do for their career, but building one is slow
and unclear without expert help:

- Branding agencies and coaches are expensive and out of reach for students, early-career
  professionals, and independent creators.
- Writing on-brand content consistently (LinkedIn posts, Instagram captions, etc.) takes real
  strategic thinking most people haven't done — most people either post inconsistently or in a
  generic, forgettable voice.
- Existing AI writing tools generate generic copy with no memory of *who the user is* — every
  post has to be re-explained from scratch.

**BrandPilot AI** solves this by first building a structured "Brand Brief" for the user (their
positioning, tone, target audience, and content pillars), then using that brief as persistent
context for every piece of content the AI generates afterward — so content stays consistent
with a single, deliberate personal brand instead of reading like generic AI output.

## 2. Target Users

- **Students / early-career professionals** building a public presence to stand out for
  internships and jobs.
- **Independent professionals and freelancers** (developers, designers, consultants) who want
  to attract clients or opportunities through content but don't have time for a full content
  strategy.
- **Founders and career-changers** establishing authority in a new space.

## 3. Goals

- Let a user go from "I don't know what my personal brand even is" to a written, structured
  Brand Brief in under 10 minutes.
- Make every piece of generated content (post, idea, profile rewrite) consistent with that
  brief, without the user having to re-explain their voice each time.
- Reduce the blank-page problem: a user should always be able to get a concrete next post to
  write, and a concrete week of content to work from.
- Keep the loop tight: generate → review/refine → schedule → (mark as posted), all inside one
  product.

## 4. Core Features (implemented)

| # | Feature | Summary |
|---|---|---|
| 1 | **Auth** | Email/password signup and login, JWT-based sessions, protected routes on the client. |
| 2 | **AI Onboarding → Brand Brief** | A 5-step intake (basics, current LinkedIn About, achievements/positioning prompts, a short forced-choice voice quiz, review) is sent to the AI, which returns a structured Brand Brief: positioning statement, tagline, tone, target audience, mission, and weighted content pillars. |
| 3 | **Dashboard** | Shows the user's Brand Brief and content-pillar weight breakdown, with quick links into the other tools. |
| 4 | **Content Studio** | Generates platform-specific posts (LinkedIn / Instagram / Twitter) for a topic, with optional tone override, length control, and content-pillar targeting. Supports multi-platform generation in one action. Includes an AI "content idea" generator (with "generate more" to keep accumulating fresh ideas) and post-generation refinement actions (Improve, Shorten, More engaging, Add hook, Add CTA, More/less professional). |
| 5 | **Content Library** | All generated drafts in one place, filterable by platform and status (Draft / Planned / Published) and searchable by content or topic. |
| 6 | **Weekly Planner** | AI auto-assigns a week's worth of posts across days/platforms/pillars in one action (respecting the user's preferred platforms and posting frequency), generating real drafts for each slot. Drafts can be rescheduled by dragging them onto a different day. |
| 7 | **Profile Makeover** | Rewrites a pasted LinkedIn headline/About section using the Brand Brief as context, shown as a before/after with a one-line summary of what changed. |
| 8 | **Brand Canvas** | A freeform idea board (notes/screenshots/quotes) the user can dump ideas into, plus an "Analyze my board" action that asks the AI to summarize the board and suggest content angles from it. |
| 9 | **Settings** | Edit any field of the Brand Brief after generation, including adding/removing content pillars and adjusting their weight percentages. |

## 5. User Stories

- *As a student with no personal brand yet*, I want to answer a short set of questions and get
  back a clear positioning statement, so I know what to actually post about.
- *As someone who doesn't know what to write today*, I want the AI to hand me content ideas
  and let me turn one into a full post in a couple of clicks.
- *As someone who's inconsistent about posting*, I want the AI to lay out a whole week of posts
  for me at once, so I'm not starting from zero every day.
- *As someone refining a post*, I want one-click actions ("make this shorter," "add a hook")
  instead of having to re-prompt from scratch.
- *As someone job-hunting*, I want my LinkedIn headline and About section rewritten to actually
  reflect my positioning, not generic resume language.

## 6. Non-Functional Requirements

- **Consistency**: every AI generation call is grounded in the user's stored Brand Brief —
  no feature generates content without brand context.
- **Auth security**: passwords are hashed (bcrypt) before storage; all non-auth API routes
  require a valid JWT; protected client routes redirect unauthenticated users to `/login`.
- **Resilience to AI failures**: AI responses are parsed defensively (JSON-fence stripping,
  parse-error handling) and failures return a clear error message rather than corrupting stored
  data.

## 7. Out of Scope (for this phase)

- Real social-media integration / auto-posting to LinkedIn or Instagram.
- Real analytics (followers, engagement, reach) — the current pillar-weight view is
  brief-derived, not from live social data.
- A conversational "Brand Coach" chat assistant.
- Instagram-specific profile makeover (bio/username/highlights).
- Brand voice sliders (quantified professional/casual/humorous/etc. mix).
- A brand-consistency checker that flags off-brand drafts before publishing.
- Trend/topic research from external sources.

## 8. Success Metrics

- Time from signup to a completed Brand Brief.
- Number of content drafts generated per active user per week.
- % of generated drafts that get scheduled and marked posted (vs. abandoned as unused drafts).
- Refinement usage rate (proxy for how often first-draft AI output needs editing).
