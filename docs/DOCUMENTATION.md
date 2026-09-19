# Verve AI (BrandPilot-AI) — Complete System Documentation

> **Implementation-Accurate Engineering & Architecture Documentation**  
> **Source-of-Truth:** Verified against codebase repository files (`server/`, `client/verve/`, configuration manifests, schemas, and routes).

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Project Objectives](#3-project-objectives)
4. [System Overview](#4-system-overview)
5. [Features](#5-features)
6. [Technology Stack](#6-technology-stack)
7. [Architecture](#7-architecture)
8. [Project Structure](#8-project-structure)
9. [Application Workflow](#9-application-workflow)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Backend Architecture](#11-backend-architecture)
12. [Database Architecture](#12-database-architecture)
13. [API Documentation](#13-api-documentation)
14. [Core Processing Logic](#14-core-processing-logic)
15. [AI/ML / LLM Pipeline](#15-aiml--llm-pipeline)
16. [File/Data Processing](#16-filedata-processing)
17. [Authentication & Security](#17-authentication--security)
18. [Configuration & Environment Variables](#18-configuration--environment-variables)
19. [Local Development Setup](#19-local-development-setup)
20. [Docker & Infrastructure](#20-docker--infrastructure)
21. [Testing](#21-testing)
22. [Error Handling](#22-error-handling)
23. [Logging & Monitoring](#23-logging--monitoring)
24. [Deployment](#24-deployment)
25. [Performance Considerations](#25-performance-considerations)
26. [Limitations](#26-limitations)
27. [Future Improvements](#27-future-improvements)
28. [Troubleshooting](#28-troubleshooting)
29. [FAQ](#29-faq)
30. [Developer Onboarding](#30-developer-onboarding)
31. [Contribution Guide](#31-contribution-guide)
32. [Code Quality Review](#32-code-quality-review)
33. [Implementation Status](#33-implementation-status)
34. [Glossary](#34-glossary)

---

## 1. Executive Summary

### A. One-Sentence Description
**Verve AI** is an AI-driven personal branding and content management platform that constructs a persistent, structured Brand Brief from user intake and grounds all multi-platform content generation, weekly planning, idea synthesis, and profile optimization in that unique brand voice.

### B. One-Paragraph Overview
Verve AI addresses the widespread challenge of generic, disconnected personal branding. Rather than asking users to repeatedly re-explain their tone, target audience, and niche for every generated social post, Verve AI conducts a 5-step strategic intake that yields a centralized `BrandBrief` document (containing positioning, tagline, mission, voice tone, target audience, and weighted content pillars). This brief serves as the persistent system context for all downstream generation: LinkedIn, Instagram, and Twitter posts, AI-powered weekly content schedule orchestration, freeform visual/note canvas idea clustering, and LinkedIn profile rewrites.

### C. Technical Explanation
The application is structured as a decoupled full-stack architecture with a hybrid dual-datastore persistence layer. The client is a React 19 Single Page Application (Vite, React Router v7, Tailwind CSS v4) with an opt-in Server-Side Rendered (SSR) landing page for fast initial load. The backend is a Node.js Express 5 REST API communicating with Google Gemini (`gemini-3.1-flash-lite` via `@google/genai`) strictly mediated through isolated prompt builders and an AI abstraction layer. MongoDB (via Mongoose) stores core application documents (`User`, `BrandBrief`, `ContentDraft`, `CanvasNote`, `Analytics`), while PostgreSQL (via Prisma ORM) isolates the relational billing domain (`Plan`, `Subscription`, `Invoice`). Real-time cross-tab synchronization is achieved via JWT-authenticated Socket.IO rooms, and read operations are optionally cached in Redis with strict write-invalidation hooks.

---

## 2. Problem Statement

### Existing Problem
- **Cost & Inaccessibility:** Professional personal branding coaches and agencies charge thousands of dollars, making dedicated strategic branding inaccessible to students, early-career engineers, freelance creators, and career changers.
- **Inconsistent Voice & Blank-Page Fatigue:** Creators struggle to publish consistently across multiple platforms (LinkedIn, Instagram, Twitter) without drifting into generic clichés or suffering creative burnout.
- **Context-Blind AI Generators:** Standard generative AI interfaces (ChatGPT, general writing tools) have no persistent memory of user positioning or audience constraints; users must repeatedly paste lengthy context prompts to avoid robotic, generic outputs.

### How Verve AI Solves This
Verve AI establishes a **single source of truth**—the structured `BrandBrief`. Every post generation, weekly calendar distribution, idea query, and profile rewrite programmatically injects the user's positioning, target audience, negative constraints (`thingsToAvoid`), and content pillar weights directly into Gemini prompts. Users obtain targeted, on-brand content tailored to specific platform conventions in seconds.

---

## 3. Project Objectives

1. **Rapid Brand Identification:** Allow any user to go from zero defined personal brand to an actionable, structured Brand Brief within 10 minutes through a structured 5-step intake.
2. **Persistent Voice Grounding:** Ensure zero generic AI hallucinations by requiring the user's stored Brand Brief across 100% of generation pathways.
3. **Multi-Platform Content Automation:** Enable 1-click generation across LinkedIn, Instagram, and Twitter, complete with length presets and one-click refinement actions (e.g., "Add Hook", "Shorten", "More Engaging").
4. **Autonomous Weekly Scheduling:** Dynamically plan and draft an entire week of targeted content across days, pillars, and platforms based on the user's preferred frequency.
5. **System Resilience & Degradability:** Build a system that fails fast on required core secrets while degrading gracefully when optional components (Redis, SMTP, Stripe, Google OAuth) are absent.

---

## 4. System Overview

```mermaid
flowchart TB
    subgraph Client["Client Tier (React 19 + Vite)"]
        UI["Pages: Landing, Auth, Onboarding, Dashboard,\nContent Studio, Weekly Planner, Canvas, Profile Makeover, Settings"]
        AuthCtx["AuthContext (JWT in localStorage)"]
        ThemeCtx["ThemeContext (data-theme attribute)"]
        AxiosInst["Axios Client (services/api.js)"]
        SocketClient["Socket.IO Client (services/socket.js)"]
    end

    subgraph Server["API Tier (Express 5 Node.js)"]
        App["server.js (CORS, Helmet, Sanitize, Static)"]
        AuthMW["authMiddleware.protect (JWT Verification)"]
        SanitizeMW["sanitizeMiddleware (NoSQL injection guard)"]
        Controllers["Controllers: Auth, Brand, Content, Canvas, Profile, Analytics, Billing"]
        AIService["services/aiService.js"]
        Prompts["prompts/*.js (Pure Functions)"]
        SocketSvc["services/socketService.js"]
        CronJobs["jobs/index.js (node-cron daily 03:00)"]
    end

    subgraph Datastores["Data & External Services"]
        Mongo[("MongoDB Atlas / Local Mongo 7\nUsers, BrandBriefs, ContentDrafts,\nCanvasNotes, Analytics")]
        Postgres[("PostgreSQL 16 (Prisma ORM)\nPlans, Subscriptions, Invoices")]
        Redis[("Redis 7 (ioredis)\n5-min Cache with Write Invalidation")]
        Gemini["Google Gemini API\n(gemini-3.1-flash-lite)"]
        Stripe["Stripe API / Webhooks\n(Checkout Sessions & Invoicing)"]
        SMTP["SMTP Mailer / Console Fallback\n(Password Reset)"]
    end

    UI --> AuthCtx --> AxiosInst
    AxiosInst -->|HTTP REST + Bearer JWT| App
    SocketClient <-->|WebSocket Handshake with JWT| SocketSvc
    App --> SanitizeMW --> AuthMW --> Controllers
    Controllers --> Mongo
    Controllers --> Postgres
    Controllers --> Redis
    Controllers --> AIService --> Prompts
    AIService -->|generateContent| Gemini
    Controllers --> Stripe
    Controllers --> SMTP
    Controllers --> SocketSvc
    CronJobs --> Postgres
    CronJobs --> Mongo
```

---

## 5. Features

### Implemented Features

1. **Authentication & Session Management:**
   - Email/password signup with validation rules (min 8 chars, 1 number, 1 special character via `server/utils/validators.js`).
   - Bcrypt password hashing (10 salt rounds).
   - JWT token issuance (`server/utils/generateToken.js`) with 7-day expiration.
   - Google Sign-In via Google Identity Services (`google-auth-library` ID token verification) with verified-email enforcement and automatic account linking or creation.
   - Secure password reset flow using 32-byte cryptographically secure random tokens hashed with SHA-256 and stored with a 1-hour expiration; email delivery via Nodemailer or console logging fallback.

2. **AI Onboarding & Brand Brief Generation:**
   - 5-step intake wizard collecting role, industry, career stage, goals, current LinkedIn About, proud projects, and a 3-question forced-choice voice quiz.
   - Generation of positioning statement, tagline, tone, target audience, mission, content pillars, and percentage weights summing to 100%.
   - Persistent storage in MongoDB and user profile synchronization.

3. **Dashboard & Metric Overview:**
   - Overview cards for total drafts, published posts, scheduled posts, and content pillar counts.
   - Interactive breakdown of Brand Brief components and content pillar weight visual meters.
   - Aggregated draft counts by platform, pillar, and status via MongoDB `$facet` aggregation, cached in Redis.

4. **Content Studio & Multi-Platform Generation:**
   - Single-platform post generation targeting LinkedIn, Instagram, or Twitter.
   - Concurrent multi-platform generation in a single click using `Promise.allSettled`.
   - Length control (short, medium, long/thread) and tone override options.
   - Content ideas generator with deduplication and history exclusion (`exclude` payload).
   - In-place AI draft refinement actions: `improve`, `shorten`, `more_engaging`, `add_hook`, `add_cta`, `more_professional`, `more_casual`, `add_storytelling`.
   - Native search with 300ms debounce, platform filtering, and status filtering.

5. **AI Weekly Planner & Drag-and-Drop Scheduling:**
   - AI generation of a full week schedule mapping day offsets (0–6), platforms, pillars, and post topics.
   - Automated creation of scheduled drafts mapped to calendar dates starting from a selected Monday.
   - Rescheduling via native HTML5 drag-and-drop between day columns using `dataTransfer` draft ID transfer.
   - Native date picker fallback for manual scheduling.

6. **Profile Makeover (LinkedIn Optimizer):**
   - Stateless optimization of current LinkedIn Headline and About section.
   - Before/after comparison interface with one-click copy buttons and changes summary.

7. **Brand Canvas (Freeform Idea Board):**
   - Sticky note creation for raw thoughts, text snippets, and inspiration.
   - Local image upload via Multer (disk storage in `server/uploads/`, 5MB limit, PNG/JPEG/WEBP/GIF validation).
   - AI Board Analysis: extracts text notes, evaluates themes against the user's Brand Brief, and returns a high-level summary and tactical content suggestions.

8. **Settings & Brief Editing:**
   - Manual editing of all Brand Brief fields.
   - Dynamic adding/removing of content pillars and live adjustment of pillar weight percentages.

9. **Billing & Subscriptions (Backend Infrastructure):**
   - PostgreSQL schema with Prisma ORM for `Plan`, `Subscription`, and `Invoice`.
   - Stripe Checkout session creation for subscription purchases.
   - Stripe raw webhook endpoint (`/api/billing/webhook`) verifying signatures and executing transactional upserts (`prisma.$transaction`).
   - Monthly and status billing rollups (`/api/billing/summary`) utilizing Prisma `$queryRaw` SQL queries.

10. **Real-Time Cross-Tab Synchronization:**
    - Socket.IO connection authenticated with JWT in handshake.
    - Server broadcasts `draft:created` and `draft:statusChanged` to user-isolated rooms.
    - Client coalesces rapid burst events using `queueMicrotask` to avoid redundant network refetches.

11. **Scoped Server-Side Rendering (SSR):**
    - Scoped SSR specifically for the static Landing page (`/`) via `entry-server.jsx` using `renderToString`.
    - Client `main.jsx` hydrates with `hydrateRoot` when pre-rendered markup exists or falls back to `createRoot`.

### Partially Implemented Features
- **Billing UI Frontend:** The backend `/api/billing` routes and Prisma database schema are completely implemented. However, the client route table in `client/verve/src/App.jsx` currently lacks a dedicated `/billing` page component; Stripe success/cancel URLs point to `/billing?checkout=...`.

### Planned / Future Scope (Explicitly Not Implemented)
- Direct automated publishing / OAuth integration to live social networks (LinkedIn API, Meta Graph API, Twitter v2 API).
- Live social media performance analytics (followers, engagement rate, impressions).
- Conversational "Brand Coach" interactive chat sidecar.
- Video and audio intake processing.

---

## 6. Technology Stack

| Layer | Technology | Purpose | Evidence / Location |
|---|---|---|---|
| **Frontend Framework** | React 19.2.7 | UI component library | `client/verve/package.json` |
| **Frontend Build Tool** | Vite 8.1.1 | Dev server, HMR, client/SSR bundler | `client/verve/vite.config.js` |
| **Frontend Routing** | React Router DOM 7.18.1 | Client-side routing and layout rendering | `client/verve/src/App.jsx` |
| **Frontend Styling** | Tailwind CSS 4.3.2 + Vanilla CSS Tokens | Design system, responsive layout, CSS custom properties | `client/verve/src/index.css` |
| **HTTP Client** | Axios 1.18.1 | REST API communication with Bearer interceptors | `client/verve/src/services/api.js` |
| **Real-Time Client** | Socket.IO Client 4.8.3 | WebSocket client for live state updates | `client/verve/src/services/socket.js` |
| **Backend Framework** | Node.js + Express 5.2.1 | HTTP web server, routing, REST controllers | `server/package.json`, `server/server.js` |
| **Primary Database** | MongoDB (v7) via Mongoose 9.7.4 | Document storage for users, briefs, drafts, canvas, analytics | `server/config/db.js`, `server/models/` |
| **Billing Database** | PostgreSQL 16 via Prisma 6.12.0 | Relational database for plans, subscriptions, and invoices | `server/prisma/schema.prisma` |
| **Cache Layer** | Redis 7 via ioredis 6.0.0 | 5-minute cache for drafts and analytics with invalidation | `server/config/redis.js` |
| **Real-Time Server** | Socket.IO 4.8.3 | User room management and event dispatching | `server/services/socketService.js` |
| **AI / LLM Engine** | Google Gemini (`@google/genai` 2.12.0) | `gemini-3.1-flash-lite` LLM inference | `server/services/aiService.js` |
| **Authentication** | JSON Web Token (jsonwebtoken 9.0.3) | Stateless session tokens | `server/middleware/authMiddleware.js` |
| **Password Hashing** | bcrypt 6.0.0 | Salted password hashing | `server/controllers/authController.js` |
| **OAuth Integration** | google-auth-library 11.0.2 | Google ID token server-side verification | `server/controllers/authController.js` |
| **Payments** | Stripe Node SDK 22.5.0 | Checkout sessions and webhook event verification | `server/services/stripeService.js` |
| **File Uploads** | Multer 2.2.0 | Multipart/form-data parser for canvas images | `server/middleware/uploadMiddleware.js` |
| **Email Service** | Nodemailer 9.0.5 | SMTP password reset email delivery | `server/services/mailerService.js` |
| **Scheduled Tasks** | node-cron 4.6.0 | Nightly subscription expiration and analytics pruning | `server/jobs/index.js` |
| **Security Headers** | Helmet 8.3.0 | Secure HTTP response headers | `server/server.js` |
| **Input Sanitization** | express-mongo-sanitize 2.2.0 | Stripping NoSQL `$` and `.` operator injection keys | `server/middleware/sanitizeMiddleware.js` |
| **Containerization** | Docker & Docker Compose | Multi-container stack (mongo, postgres, redis, api, nginx) | `docker-compose.yml`, `server/Dockerfile` |

---

## 7. Architecture

### Comprehensive Architectural View
Verve AI operates as an asynchronous, decoupled system. The client makes authenticated REST calls to Express, which acts as the orchestrator across primary storage, secondary relational billing, cache, and Google Gemini.

```mermaid
flowchart TD
    subgraph Client["Client Browser"]
        SPA["React 19 SPA"]
        WSClient["Socket.IO Client"]
    end

    subgraph Edge["Web & Reverse Proxy"]
        Nginx["Nginx Container (Port 8080)"]
        SSR["Express SSR Engine (Port 5000: /)"]
    end

    subgraph API["Backend Core (Express 5)"]
        Router["Express Router (/api/*)"]
        MW["Security & Auth Middleware\n(Helmet, Sanitize, JWT Protect)"]
        Ctrl["Controllers"]
        AISvc["AI Service Layer"]
    end

    subgraph Cache["Caching"]
        RedisNode[("Redis 7")]
    end

    subgraph Storage["Datastores"]
        MongoNode[("MongoDB 7")]
        PGNode[("PostgreSQL 16")]
    end

    subgraph External["External Services"]
        GeminiAPI["Google Gemini AI"]
        StripeAPI["Stripe Payments"]
        GoogleAuth["Google OAuth2"]
        SMTPHost["SMTP Server"]
    end

    SPA -->|Static Assets| Nginx
    SPA -->|SSR Request| SSR
    SPA -->|API Requests| Router
    WSClient <-->|WebSockets| API
    Router --> MW --> Ctrl
    Ctrl <-->|Cache Read/Write| RedisNode
    Ctrl <-->|CRUD Operations| MongoNode
    Ctrl <-->|Prisma ORM| PGNode
    Ctrl --> AISvc --> GeminiAPI
    Ctrl --> StripeAPI
    Ctrl --> GoogleAuth
    Ctrl --> SMTPHost
```

---

## 8. Project Structure

```text
BrandPilot-AI/
├── .env.example                  # Template for root backend environment variables
├── .gitignore                    # Git ignore file for root
├── docker-compose.yml            # Docker Compose specification (5 services + volumes)
├── render.yaml                   # Render Blueprint for deploying server as a web service
├── CONTRIBUTING.md               # Developer contribution rules and branching guidelines
├── HLD.md                        # High-Level Design document
├── LLD.md                        # Low-Level Design document
├── PRD.md                        # Product Requirements Document
├── CLAUDE.md                     # Engineering assistant reference instructions
├── README.md                     # Root project overview and quickstart guide
├── docs/                         # Project documentation directory
│   ├── docs                      # Master prompt reference specification
│   └── DOCUMENTATION.md          # Comprehensive technical documentation (this file)
├── client/
│   └── verve/                    # React 19 + Vite frontend package (ESM)
│       ├── .dockerignore
│       ├── .env.example          # Vite client environment template
│       ├── Dockerfile            # Multi-stage build -> Nginx static serving
│       ├── eslint.config.js      # ESLint 10 flat configuration
│       ├── index.html            # HTML entry point with inline zero-FOUC theme bootstrapper
│       ├── nginx.conf            # Nginx static file & SPA fallback rewrite config
│       ├── package.json          # Frontend dependencies and build scripts
│       ├── vercel.json           # Vercel SPA rewrite specification
│       ├── vite.config.js        # Vite configuration with React & Tailwind plugins
│       ├── public/               # Public static assets
│       └── src/
│           ├── main.jsx          # Client hydration / mount logic
│           ├── entry-server.jsx  # Scoped SSR renderer for landing page
│           ├── App.jsx           # Route declarations and ProtectedRoute bindings
│           ├── index.css         # Tailwind v4 directives and design token variables
│           ├── assets/           # Local UI assets
│           ├── components/       # Reusable UI primitives and specialized widgets
│           │   ├── ui.jsx        # Button, Field, Textarea, Select, Alert, Skeleton, etc.
│           │   ├── Logo.jsx      # Brand SVG icon and wordmark
│           │   ├── ThemeToggle.jsx # Light/dark theme switch
│           │   ├── PasswordInput.jsx # Password field with visibility toggle
│           │   ├── GoogleSignInButton.jsx # Google Identity Services GIS button
│           │   └── Reveal.jsx    # IntersectionObserver scroll animation wrapper
│           ├── context/
│           │   ├── AuthContext.jsx   # Auth provider: login, signup, token management
│           │   └── ThemeContext.jsx  # Theme provider: toggle and localStorage persistence
│           ├── hooks/
│           │   └── useToast.jsx      # Toast notifications context and hook
│           ├── layouts/
│           │   └── AppLayout.jsx     # Authenticated shell layout (nav, sidebar, header)
│           ├── pages/
│           │   ├── Landing.jsx       # Public landing page (SSR supported)
│           │   ├── Login.jsx         # Sign in page
│           │   ├── Signup.jsx        # User registration page
│           │   ├── ForgotPassword.jsx # Password reset request page
│           │   ├── ResetPassword.jsx  # Password reset token confirmation page
│           │   ├── Onboarding.jsx    # 5-step interactive brand intake wizard
│           │   ├── Dashboard.jsx     # KPI metrics and Brand Brief display
│           │   ├── ContentStudio.jsx # Post generation, refinement, and content library
│           │   ├── WeeklyPlanner.jsx # Drag-and-drop calendar and weekly AI planner
│           │   ├── BrandBrief.jsx    # Profile Makeover page (LinkedIn rewrite tool)
│           │   ├── Canvas.jsx        # Freeform sticky notes and board analysis
│           │   └── Settings.jsx      # Brand Brief and pillar weight editor
│           ├── routes/
│           │   └── ProtectedRoute.jsx # Client route guard redirecting unauthenticated users
│           ├── services/
│           │   ├── api.js            # Axios instance with Bearer JWT interceptor
│           │   └── socket.js         # Socket.IO client instance and singleton getter
│           └── utils/
│               └── async.js          # debounce, readFileAsDataURL, coalesceMicrotask, retryWithBackoff
└── server/                       # Express 5 REST API package (CommonJS)
    ├── .dockerignore
    ├── Dockerfile                # Multi-stage production container for API
    ├── docker-entrypoint.sh      # Container boot script applying migrations & starting app
    ├── package.json              # Server dependencies and lifecycle scripts
    ├── server.js                 # Primary entry point: Express app, middleware, routes, listener
    ├── config/
    │   ├── db.js                 # Mongoose connection and lifecycle listeners
    │   ├── prisma.js             # PrismaClient singleton instance
    │   ├── redis.js              # ioredis client with fail-soft error handling
    │   └── repairIndexes.js      # Startup migration for partial unique googleId index
    ├── controllers/
    │   ├── authController.js     # Auth actions (signup, login, google, me, reset)
    │   ├── brandController.js    # Brand brief creation, retrieval, and updates
    │   ├── contentController.js  # Post generation, multi-gen, planner, refinement
    │   ├── profileController.js  # Headline & About section rewrite optimizer
    │   ├── canvasController.js   # Canvas notes CRUD, image upload, board analysis
    │   ├── analyticsController.js # Aggregation overview and historical metrics
    │   └── billingController.js  # Plans, checkout sessions, invoices, summaries, webhooks
    ├── jobs/
    │   └── index.js              # Daily 03:00 cron tasks (subscription sweep & snapshot pruning)
    ├── middleware/
    │   ├── authMiddleware.js     # JWT Bearer token validation middleware
    │   ├── sanitizeMiddleware.js # express-mongo-sanitize operator stripper
    │   ├── uploadMiddleware.js   # Multer diskStorage image upload handler
    │   └── errorMiddleware.js    # Global centralized Express error responder
    ├── models/
    │   ├── User.js               # Mongoose schema for user accounts
    │   ├── BrandBrief.js         # Mongoose schema for strategic brand briefs
    │   ├── ContentDraft.js       # Mongoose schema for posts and scheduled items
    │   ├── CanvasNote.js         # Mongoose schema for freeform notes and images
    │   └── Analytics.js          # Mongoose schema for embedded daily metrics
    ├── prisma/
    │   ├── schema.prisma         # Prisma schema defining Plan, Subscription, Invoice
    │   └── seed.js               # Database seeder initializing Free and Pro plans
    ├── prompts/
    │   ├── brandBriefPrompt.js   # Prompt builder for structured Brand Brief generation
    │   ├── contentPrompt.js      # Unified post prompt (LinkedIn, Instagram, Twitter)
    │   ├── contentIdeasPrompt.js # Prompt builder for accumulating topic ideas
    │   ├── plannerPrompt.js      # Prompt builder for 7-day schedule distribution
    │   ├── profileOptimizerPrompt.js # Prompt builder for headline & about section rewrites
    │   ├── canvasAnalyzePrompt.js    # Prompt builder for summarizing idea boards
    │   ├── refineContentPrompt.js    # Prompt builder for atomic post rewrites
    │   ├── instagramPrompt.js    # 0 bytes (deprecated stub; logic consolidated in contentPrompt.js)
    │   └── linkedinPrompt.js     # 0 bytes (deprecated stub; logic consolidated in contentPrompt.js)
    ├── routes/
    │   ├── authRoutes.js         # Mounts /api/auth
    │   ├── brandRoutes.js        # Mounts /api/brand
    │   ├── contentRoutes.js      # Mounts /api/content
    │   ├── profileRoutes.js      # Mounts /api/profile
    │   ├── canvasRoutes.js       # Mounts /api/canvas
    │   ├── analyticsRoutes.js    # Mounts /api/analytics
    │   ├── billingRoutes.js      # Mounts /api/billing
    │   └── onboardingRoutes.js   # 0 bytes (deprecated stub; routes handled by brandRoutes.js)
    ├── services/
    │   ├── aiService.js          # Gemini SDK integration and JSON response parsers
    │   ├── analyticsService.js   # Incremental event counter updating daily snapshots
    │   ├── socketService.js      # Socket.IO room join and event broadcast logic
    │   ├── stripeService.js      # Stripe Checkout sessions and webhook validation
    │   ├── mailerService.js      # Nodemailer transport and password reset sender
    │   ├── brandService.js       # 0 bytes (deprecated stub; logic in aiService.js)
    │   └── contentService.js     # 0 bytes (deprecated stub; logic in aiService.js)
    ├── uploads/                  # Local filesystem storage for uploaded canvas images
    └── utils/
        ├── validateEnv.js        # Fast-fail boot check for mandatory env variables
        ├── validators.js         # Email, password regex rules and HTML tag sanitizer
        ├── generateToken.js      # jsonwebtoken signing utility
        └── httpError.js          # Environment-aware 500 server error response formatter
```

---

## 9. Application Workflow

### Complete User Workflow
```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Browser as React SPA
    participant Server as Express API
    participant DB as MongoDB
    participant AI as Gemini API

    User->>Browser: Enters signup/login credentials
    Browser->>Server: POST /api/auth/login
    Server->>DB: Validate user & bcrypt password
    Server-->>Browser: Return JWT + User Profile
    Browser->>Browser: Store JWT in localStorage

    alt First-time User (No Brand Brief)
        Browser->>Browser: Redirect to /onboarding
        User->>Browser: Completes 5-step intake wizard
        Browser->>Server: POST /api/brand/generate (intake answers)
        Server->>AI: generateBrandBrief(answers)
        AI-->>Server: JSON Brand Brief
        Server->>DB: Upsert BrandBrief & update User
        Server-->>Browser: Return Brand Brief
        Browser->>Browser: Navigate to /dashboard
    else Returning User
        Browser->>Server: GET /api/brand
        Server->>DB: Query BrandBrief
        Server-->>Browser: Return BrandBrief
        Browser->>Browser: Render Dashboard KPIs & pillars
    end

    opt Content Studio Generation
        User->>Browser: Enters topic, selects LinkedIn & Twitter, clicks Generate
        Browser->>Server: POST /api/content/generate-multi
        Server->>DB: Load user's BrandBrief
        par Concurrent Generation
            Server->>AI: generateContentPost(brief, linkedin, topic)
            Server->>AI: generateContentPost(brief, twitter, topic)
        end
        AI-->>Server: Return generated texts
        Server->>DB: Save ContentDraft documents
        Server-->>Browser: Return created drafts
        Browser->>User: Displays new drafts in library
    end
```

---

## 10. Frontend Architecture

### State & Communication Design
The client application avoids heavy external state libraries (Redux, Zustand) in favor of lightweight React primitives:
1. **`AuthContext.jsx`:** Owns the global session state (`user`, `loading`). On app mount, it inspects `localStorage` for a `token`. If found, it dispatches `GET /api/auth/me` to hydrate the user profile; if invalid or expired, it clears storage and resets session state.
2. **`ThemeContext.jsx`:** Controls the UI theme. Verve AI is dark-mode by default. The theme choice (`dark` or `light`) is saved to `localStorage` under key `theme` and toggles the `data-theme` attribute on the root `<html>` element. An inline script in `index.html` runs synchronously before DOM paint to prevent Theme Flash of Unstyled Content (FOUC).
3. **Local Page State:** Pages fetch data on mount using standard `useEffect` hooks calling the configured Axios instance (`services/api.js`).
4. **WebSocket Integration:** Components subscribe to socket events (`draft:created`, `draft:statusChanged`) via `services/socket.js`. Burst events are coalesced into a single re-fetch via `coalesceMicrotask`.

### Frontend Route Map

| Path | Component | Protected | Purpose |
|---|---|---|---|
| `/` | `Landing.jsx` | No | Public presentation page with hero, features, and pricing table (SSR supported). |
| `/login` | `Login.jsx` | No | Email/password login and Google Sign-In button. |
| `/signup` | `Signup.jsx` | No | User registration with inline password complexity validation. |
| `/forgot-password`| `ForgotPassword.jsx` | No | Input email to request password reset link. |
| `/reset-password/:token` | `ResetPassword.jsx` | No | Submit new password using emailed token. |
| `/onboarding` | `Onboarding.jsx` | Yes | 5-step brand intake wizard leading to Brand Brief generation. |
| `/dashboard` | `Dashboard.jsx` | Yes | Main hub displaying brief details, content pillar distribution, and KPIs. |
| `/content-studio` | `ContentStudio.jsx` | Yes | Post generation, topic idea discovery, draft refinement, and post library. |
| `/planner` | `WeeklyPlanner.jsx` | Yes | Interactive 7-day calendar view with drag-and-drop scheduling. |
| `/profile-makeover` | `BrandBrief.jsx` | Yes | LinkedIn Headline and About section rewrite tool. |
| `/settings` | `Settings.jsx` | Yes | Editor for modifying Brand Brief fields and adjusting pillar weights. |
| `/canvas` | `Canvas.jsx` | Yes | Freeform board for text notes, image uploads, and AI board synthesis. |

---

## 11. Backend Architecture

### Request-Response Processing Pipeline
Every incoming HTTP request flows through a sequential pipeline in `server/server.js`:

```mermaid
flowchart LR
    Req[Incoming HTTP Request] --> CORS[CORS Middleware]
    CORS --> Helmet[Helmet Security Headers]
    Helmet --> WebhookCheck{Path is /api/billing/webhook?}
    WebhookCheck -- Yes --> RawBody[express.raw - Stripe Signature]
    WebhookCheck -- No --> JSONBody[express.json Body Parser]
    RawBody --> Sanitize[sanitizeInputs Middleware]
    JSONBody --> StaticUploads["/uploads Static Handler"]
    StaticUploads --> Sanitize
    Sanitize --> SSREngine{GET / and SSR build exists?}
    SSREngine -- Yes --> RenderHTML[entry-server.jsx renderToString]
    SSREngine -- No --> Routes[API Route Handlers]
    Routes --> AuthCheck{Route is Protected?}
    AuthCheck -- Yes --> JWTAuth[authMiddleware.protect]
    AuthCheck -- No --> Controller[Controller Logic]
    JWTAuth --> Controller
    Controller --> DB[(MongoDB / Postgres / Redis)]
    Controller --> GlobalErr[errorMiddleware]
    GlobalErr --> Res[HTTP Response]
```

### Core Architectural Patterns
- **Triple Separation of AI Concerns:**
  1. `server/prompts/*.js`: Pure functions that return clean prompt strings. Zero side effects or network calls.
  2. `server/services/aiService.js`: Encapsulates Gemini SDK instantiation, model selection (`gemini-3.1-flash-lite`), fence-stripping, JSON parsing, and error sanitization.
  3. `server/controllers/*`: Focuses purely on HTTP validation, DB persistence, caching, and responding with standard `{ success: true, ... }` payloads.
- **Fail-Soft Degradability:**
  - Redis cache failure degrades to uncached database reads without throwing.
  - Missing SMTP credentials logs password reset links to the server console rather than crashing.
  - Missing `GOOGLE_CLIENT_ID` cleanly disables the endpoint with HTTP 501.

---

## 12. Database Architecture

### Dual-Datastore Strategy
- **MongoDB (Document Domain):** Houses rapidly evolving, hierarchical entities that benefit from dynamic schemaless fields (e.g. `BrandBrief.pillarWeights` as a dynamic Map, freeform `rawAnswers`, embedded `dailySnapshots`).
- **PostgreSQL via Prisma (Relational Billing Domain):** Strictly isolates plans, subscriptions, and financial invoices to guarantee ACID transactions, strict foreign keys, and precise grouping.

### MongoDB Entity Relationship Diagram
```mermaid
erDiagram
    User ||--o| BrandBrief : "has one"
    User ||--o{ ContentDraft : "owns many"
    User ||--o{ CanvasNote : "creates many"
    User ||--o| Analytics : "tracks one"

    User {
        ObjectId _id PK
        string name
        string email UK
        string password
        string googleId UK "partial index"
        string industry
        string careerStage
        string goals
        string ageRange
        string gender
        string[] interests
        string resetPasswordTokenHash
        date resetPasswordExpires
        date createdAt
        date updatedAt
    }

    BrandBrief {
        ObjectId _id PK
        ObjectId userId FK, UK
        string positioning
        string tagline
        string tone
        string targetAudience
        string mission
        string[] contentPillars
        Map pillarWeights
        string[] preferredPlatforms
        string postingFrequency
        string[] topicsLoved
        string thingsToAvoid
        string inspirations
        string biggestChallenge
        string notFor
        string differentiator
        Mixed rawAnswers
    }

    ContentDraft {
        ObjectId _id PK
        ObjectId userId FK
        string platform "linkedin|instagram|twitter"
        string topic
        string pillar
        string content
        string status "draft|scheduled|posted"
        date scheduledDate
        date createdAt
    }

    CanvasNote {
        ObjectId _id PK
        ObjectId userId FK
        string type "text|image"
        string content
        number x
        number y
        date createdAt
    }

    Analytics {
        ObjectId _id PK
        ObjectId userId FK, UK
        dailySnapshot[] dailySnapshots "embedded 90-day window"
    }
```

### PostgreSQL Relational Schema
```mermaid
erDiagram
    Plan ||--o{ Subscription : "defines"
    Subscription ||--o{ Invoice : "bills"

    Plan {
        int id PK
        string name UK
        int priceCents
        BillingInterval interval "monthly|yearly"
        json features
        datetime createdAt
    }

    Subscription {
        int id PK
        string mongoUserId "Index -> Mongo User._id"
        int planId FK
        SubscriptionStatus status "trialing|active|past_due|canceled"
        string stripeCustomerId
        string stripeSubscriptionId UK
        datetime currentPeriodEnd
        datetime createdAt
        datetime updatedAt
    }

    Invoice {
        int id PK
        int subscriptionId FK
        int amountCents
        InvoiceStatus status "open|paid|void"
        string stripeInvoiceId UK
        datetime issuedAt "Index"
    }
```

### Database Indexes

| Collection / Table | Index Keys | Type | Purpose |
|---|---|---|---|
| `users` | `{ email: 1 }` | Unique | Enforce unique user email addresses. |
| `users` | `{ googleId: 1 }` | Partial Unique (`$type: "string"`) | Prevent duplicate Google IDs while allowing multiple accounts without Google ID. |
| `brandbriefs` | `{ userId: 1 }` | Unique | Guarantee 1:1 relationship between user and brief. |
| `contentdrafts` | `{ userId: 1, status: 1 }` | Compound | Fast filtering of user drafts by status. |
| `contentdrafts` | `{ userId: 1, scheduledDate: 1 }` | Compound | Fast date-range queries for Weekly Planner calendar. |
| `canvasnotes` | `{ content: "text" }` | Full-Text | Enable text search across board notes. |
| `analytics` | `{ userId: 1 }` | Unique | Guarantee 1:1 relationship between user and analytics document. |
| `Subscription` (Postgres) | `[mongoUserId]` | Standard B-Tree | Application-layer linking to MongoDB user ID. |
| `Subscription` (Postgres) | `[status]` | Standard B-Tree | Fast lookup for nightly expired subscription sweep. |
| `Invoice` (Postgres) | `[subscriptionId]` | Standard B-Tree | Foreign key lookup optimization. |
| `Invoice` (Postgres) | `[issuedAt]` | Standard B-Tree | Fast chronological ordering and monthly revenue aggregation. |

---

## 13. API Documentation

All endpoints (except public authentication and health routes) require an `Authorization: Bearer <JWT>` header.

### Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/signup`
- **Purpose:** Registers a new user account.
- **Authentication:** Public.
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "industry": "Software Engineering",
    "careerStage": "mid-career",
    "goals": "Build thought leadership"
  }
  ```
- **Validation:** Name, email, password required; email format checked; password must have min 8 chars, 1 number, 1 special character.
- **Responses:**
  - `201 Created`: `{"success": true, "message": "User created successfully"}`
  - `400 Bad Request`: `{"success": false, "message": "Password must be at least 8 characters..."}`
  - `409 Conflict`: `{"success": false, "message": "User already exists with this email"}`

#### `POST /api/auth/login`
- **Purpose:** Authenticates user credentials and issues a JWT session token.
- **Authentication:** Public.
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
      "user": {
        "_id": "66914f1b88e1a1234567890a",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "industry": "Software Engineering",
        "careerStage": "mid-career",
        "goals": "Build thought leadership"
      }
    }
    ```
  - `401 Unauthorized`: `{"success": false, "message": "Invalid email or password"}`

#### `POST /api/auth/google`
- **Purpose:** Authenticates with Google ID token; creates or links account.
- **Authentication:** Public.
- **Request Body:** `{"credential": "<google_id_token_string>"}`
- **Responses:**
  - `200 OK`: `{"success": true, "token": "...", "needsOnboarding": false, "user": {...}}`
  - `401 Unauthorized`: `{"success": false, "message": "That Google sign-in couldn't be verified."}`
  - `501 Not Implemented`: `{"success": false, "message": "Google sign-in isn't configured on this server."}`

#### `GET /api/auth/me`
- **Purpose:** Fetches currently authenticated user profile from token.
- **Authentication:** Required.
- **Responses:**
  - `200 OK`: `{"success": true, "user": {...}}`
  - `401 Unauthorized`: `{"success": false, "message": "Not authorized, invalid token"}`

#### `POST /api/auth/forgot-password`
- **Purpose:** Initiates password reset by issuing a 1-hour secure hashed token.
- **Authentication:** Public.
- **Request Body:** `{"email": "jane@example.com"}`
- **Responses:**
  - `200 OK`: `{"success": true, "message": "If an account exists for that email, we've sent a password reset link."}`

#### `POST /api/auth/reset-password`
- **Purpose:** Resets password using raw emailed token.
- **Authentication:** Public.
- **Request Body:** `{"token": "4f9a3e...", "password": "NewPassword123!"}`
- **Responses:**
  - `200 OK`: `{"success": true, "message": "Password updated — you can now log in."}`
  - `400 Bad Request`: `{"success": false, "message": "That reset link is invalid or has expired."}`

---

### Brand Endpoints (`/api/brand`)

#### `POST /api/brand/generate`
- **Purpose:** Takes intake answers, prompts Gemini for a Brand Brief, and upserts to MongoDB.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "whatTheyDo": "Senior Frontend Developer",
    "industry": "FinTech",
    "careerStage": "mid-career",
    "goal": "Attract consulting leads",
    "audience": "Startup founders and CTOs",
    "personality": "Direct, technical, practical",
    "achievements": "Scaled frontend at Series B startup"
  }
  ```
- **Responses:**
  - `201 Created`: `{"success": true, "message": "Brand Brief generated successfully", "brief": {...}}`

#### `GET /api/brand`
- **Purpose:** Retrieves user's active Brand Brief.
- **Authentication:** Required.
- **Responses:**
  - `200 OK`: `{"success": true, "brief": {...}}`
  - `404 Not Found`: `{"success": false, "message": "No Brand Brief found yet — generate one first"}`

#### `PUT /api/brand`
- **Purpose:** Updates specific fields on the Brand Brief (including pillarWeights).
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "tone": "Warm, educational, authoritative",
    "pillarWeights": { "Architecture": 40, "Career Advice": 30, "Tech Reviews": 30 }
  }
  ```
- **Responses:**
  - `200 OK`: `{"success": true, "message": "Brand Brief updated successfully", "brief": {...}}`

---

### Content Endpoints (`/api/content`)

#### `POST /api/content/generate`
- **Purpose:** Generates a single post for a chosen platform grounded in the Brand Brief.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "platform": "linkedin",
    "topic": "Why clean code matters in startups",
    "pillar": "Software Engineering",
    "tone": "Bold",
    "length": "medium"
  }
  ```
- **Responses:**
  - `201 Created`: `{"success": true, "message": "Content generated successfully", "draft": {...}}`

#### `POST /api/content/generate-multi`
- **Purpose:** Generates posts across multiple platforms in parallel (`Promise.allSettled`).
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "platforms": ["linkedin", "twitter"],
    "topic": "Microservices vs Modular Monoliths",
    "length": "short"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "Generated 2 of 2 posts",
      "drafts": [{...}, {...}],
      "failures": []
    }
    ```

#### `GET /api/content`
- **Purpose:** Retrieves all drafts for the authenticated user (cached in Redis for 300s).
- **Authentication:** Required.
- **Responses:**
  - `200 OK`: `{"success": true, "drafts": [...]}`

#### `DELETE /api/content/:id`
- **Purpose:** Deletes a draft and invalidates user content/analytics cache.
- **Authentication:** Required.
- **Responses:**
  - `200 OK`: `{"success": true, "message": "Draft deleted"}`

#### `PUT /api/content/:id/schedule`
- **Purpose:** Sets the scheduled calendar date and updates status to `scheduled`.
- **Authentication:** Required.
- **Request Body:** `{"scheduledDate": "2026-09-18"}`
- **Responses:**
  - `200 OK`: `{"success": true, "draft": {...}}`

#### `PUT /api/content/:id/status`
- **Purpose:** Updates post status (`draft`, `scheduled`, `posted`).
- **Authentication:** Required.
- **Request Body:** `{"status": "posted"}`
- **Responses:**
  - `200 OK`: `{"success": true, "draft": {...}}`

#### `PUT /api/content/:id/refine`
- **Purpose:** Rewrites draft content in-place based on a strategic action.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "action": "add_hook"
  }
  ```
  *(Allowed: `improve`, `shorten`, `more_engaging`, `more_professional`, `more_casual`, `add_hook`, `add_cta`, `add_storytelling`)*
- **Responses:**
  - `200 OK`: `{"success": true, "draft": {...}}`

#### `POST /api/content/planner/generate`
- **Purpose:** AI distributes a week of posts (Monday to Sunday) and generates draft posts for each slot.
- **Authentication:** Required.
- **Request Body:** `{"weekStart": "2026-09-14"}`
- **Responses:**
  - `201 Created`: `{"success": true, "message": "Planned 5 posts for the week", "drafts": [...]}`

#### `GET /api/content/planner`
- **Purpose:** Queries scheduled drafts within a specified date window.
- **Authentication:** Required.
- **Query Params:** `?start=2026-09-14&end=2026-09-20`
- **Responses:**
  - `200 OK`: `{"success": true, "drafts": [...]}`

#### `POST /api/content/ideas`
- **Purpose:** Generates a list of fresh topic ideas consistent with the user's pillars.
- **Authentication:** Required.
- **Request Body:** `{"count": 8, "exclude": ["Topic 1", "Topic 2"]}`
- **Responses:**
  - `200 OK`: `{"success": true, "ideas": ["Idea A", "Idea B", ...]}`

---

### Canvas Endpoints (`/api/canvas`)

#### `POST /api/canvas/notes`
- **Purpose:** Adds a new sticky note (text or image) to the board.
- **Request Body:** `{"type": "text", "content": "Explore Rust on AWS Lambda", "x": 100, "y": 150}`
- **Responses:** `201 Created`

#### `GET /api/canvas/notes`
- **Purpose:** Retrieves all user canvas notes.
- **Responses:** `200 OK: {"success": true, "notes": [...]}`

#### `PUT /api/canvas/notes/:id`
- **Purpose:** Updates position or text of a note.
- **Responses:** `200 OK`

#### `DELETE /api/canvas/notes/:id`
- **Purpose:** Removes a note from the canvas.
- **Responses:** `200 OK`

#### `POST /api/canvas/upload`
- **Purpose:** Multipart image upload via Multer.
- **Request Form-Data:** `image` file field (max 5MB, PNG/JPEG/WEBP/GIF).
- **Responses:** `201 Created: {"success": true, "url": "http://localhost:5000/uploads/c4a9..."}`

#### `POST /api/canvas/analyze`
- **Purpose:** Sends all text notes to Gemini with the Brand Brief to surface cohesive content ideas.
- **Responses:** `200 OK: {"success": true, "summary": "...", "suggestions": [{"idea": "...", "basedOn": "..."}]}`

---

### Profile Endpoints (`/api/profile`)

#### `POST /api/profile/optimize`
- **Purpose:** Rewrites LinkedIn Headline and About section against the Brand Brief.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "currentHeadline": "Software Engineer at Acme Corp",
    "currentAbout": "I build web applications using React and Node.js."
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Profile optimized successfully",
      "optimizedHeadline": "Full-Stack Engineer | Scaling Resilient Distributed Systems",
      "optimizedAbout": "...",
      "changesSummary": "Shifted focus from generic duties to impact and architecture leadership."
    }
    ```

---

### Analytics Endpoints (`/api/analytics`)

#### `GET /api/analytics/overview`
- **Purpose:** Returns `$facet` aggregations by platform, pillar, status, and 30-day snapshot history.
- **Authentication:** Required (Cached in Redis 300s).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "byPlatform": [{"_id": "linkedin", "count": 12}, {"_id": "twitter", "count": 8}],
      "byPillar": [{"_id": "Architecture", "count": 14}],
      "byStatus": [{"_id": "posted", "count": 10}, {"_id": "draft", "count": 10}],
      "recentSnapshots": [...],
      "profileContext": {"name": "Jane Doe", "industry": "FinTech"}
    }
    ```

---

### Billing Endpoints (`/api/billing`)

#### `GET /api/billing/plans`
- **Purpose:** Public listing of available subscription plans from PostgreSQL.
- **Authentication:** Public.
- **Responses:** `200 OK: {"success": true, "plans": [...]}`

#### `POST /api/billing/checkout`
- **Purpose:** Initiates a Stripe Checkout Session for a plan.
- **Authentication:** Required.
- **Request Body:** `{"planName": "Pro"}`
- **Responses:** `200 OK: {"success": true, "url": "https://checkout.stripe.com/c/pay/cs_test_..."}`

#### `POST /api/billing/webhook`
- **Purpose:** Receives asynchronous Stripe events; verifies signature using `STRIPE_WEBHOOK_SECRET`.
- **Authentication:** Stripe Signature Header.
- **Responses:** `200 OK: {"received": true}`

#### `GET /api/billing/invoices`
- **Purpose:** Retrieves user invoices from PostgreSQL with sorting and status filtering.
- **Authentication:** Required.
- **Query Params:** `?status=paid&sort=issuedAt:desc`
- **Responses:** `200 OK: {"success": true, "invoices": [...]}`

#### `GET /api/billing/summary`
- **Purpose:** Rollup summary by invoice status and month via raw parameterized SQL query.
- **Authentication:** Required.
- **Responses:** `200 OK: {"success": true, "byStatus": [...], "byMonth": [...]}`

---

## 14. Core Processing Logic

### 1. Incremental Analytics Snapshotting
Located in `server/services/analyticsService.js`:
- Rather than running expensive full-database aggregations every time metrics are viewed, `recordDraftEvent(userId, { platform, status, isNew })` updates the user's embedded `dailySnapshots` array on every draft creation or status mutation.
- Avoids the classic MongoDB duplicate-key race condition on upsert:
  1. `updateOne` with `$setOnInsert` ensures the parent user document exists.
  2. `updateOne` with `dailySnapshots.date: { $ne: today }` pushes a new day entry if absent.
  3. `updateOne` with `$inc` increments counters (`postsCreated`, `postsByPlatform.<platform>`, `postsByStatus.<status>`).

### 2. Microtask Event Coalescing
Located in `client/verve/src/utils/async.js`:
- In batch operations (like `generateMultiPlatform` or `generateWeeklyPlanContent`), multiple WebSocket `draft:created` events are fired back-to-back.
- `coalesceMicrotask(fn)` leverages JavaScript's event loop:
  ```javascript
  export const coalesceMicrotask = (fn) => {
    let pending = false;
    return () => {
      if (pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        fn();
      });
    };
  };
  ```
  This collapses multiple synchronous socket dispatches into a single network refetch after the microtask queue drains.

### 3. Native HTML5 Drag-and-Drop Rescheduling
Located in `client/verve/src/pages/WeeklyPlanner.jsx`:
- Avoids bloated external DnD libraries.
- Draft cards set `draggable` and transfer `draft._id` via `event.dataTransfer.setData("text/plain", draft._id)`.
- Calendar day cells accept `onDragOver` (calling `preventDefault()`) and on `drop` read the draft ID and trigger `PUT /api/content/:id/schedule` with the target column's date.

---

## 15. AI/ML / LLM Pipeline

### Gemini Integration Architecture
Verve AI utilizes Google Gemini (`@google/genai`, model `gemini-3.1-flash-lite`).

```mermaid
flowchart TD
    PromptBuilder["prompts/*.js\n(Pure function injects BrandBrief & rules)"] --> PromptStr[Prompt String]
    PromptStr --> GenAI["ai.models.generateContent({ model: 'gemini-3.1-flash-lite' })"]
    GenAI --> RawText[Raw Model Text Response]
    RawText --> FenceCleaner["Strip Markdown Fences (```json / ```)"]
    FenceCleaner --> Parser{"JSON.parse() Valid?"}
    Parser -- Yes --> CleanData[Structured JSON Result]
    Parser -- No --> ErrHandler["Throw Descriptive Exception\n(Never leak raw parse error)"]
    CleanData --> ControllerPersistence[Controller Saves to MongoDB]
```

### Prompt Engineering Specifications

| Prompt File | Outputs | Special Guardrails & Rules |
|---|---|---|
| `brandBriefPrompt.js` | JSON Object: `positioning, tagline, tone, targetAudience, mission, contentPillars, pillarWeights` | Weights must sum exactly to 100; enforce 3 to 5 content pillars; tone must reflect voice quiz answers. |
| `contentPrompt.js` | Plain Text: One social post | Strict negative constraints (`thingsToAvoid`); platform-specific rules (LinkedIn: max 3 hashtags, professional; Instagram: conversational, punchy, 5-8 hashtags; Twitter: concise, thread if long); length bands (short, medium, long). |
| `refineContentPrompt.js` | Plain Text: One rewritten post | Action-specific instructions (`add_hook`: rewrite opening lines; `shorten`: cut 30-50% word count; `more_engaging`: add questions/provocations); preserves core topic and Brand Brief tone. |
| `plannerPrompt.js` | JSON Array: `[{ dayOffset, platform, pillar, topic }]` | Constrained strictly to the brief's pillars and platforms; day offsets bounded 0 to 6; respects posting frequency. |
| `contentIdeasPrompt.js` | JSON Array of strings | Excludes previous ideas provided in `excludeIdeas` array; grounds topics in the user's specific content pillars. |
| `profileOptimizerPrompt.js` | JSON Object: `optimizedHeadline, optimizedAbout, changesSummary` | Grounded in positioning and achievements; removes passive resume speak. |
| `canvasAnalyzePrompt.js` | JSON Object: `summary, suggestions: [{ idea, basedOn }]` | Excludes image notes (only analyzes text notes); traces every suggestion back to specific user notes. |

---

## 16. File/Data Processing

### Local Image Upload Pipeline
Canvas notes support attaching inspiration images:

```mermaid
flowchart LR
    ClientFile[User Selects Image in Canvas.jsx] --> ClientPreview[FileReader.readAsDataURL - Local Preview]
    ClientPreview --> UserConfirm[User Clicks 'Add to board']
    UserConfirm --> FormDataReq[POST /api/canvas/upload - multipart/form-data]
    FormDataReq --> MulterMW[Multer Middleware]
    MulterMW --> ValidateExt{Mime: PNG, JPEG, WEBP, GIF & Size <= 5MB?}
    ValidateExt -- No --> Err400[HTTP 400 Bad Request]
    ValidateExt -- Yes --> DiskWrite[Write to server/uploads/ with crypto random hex name]
    DiskWrite --> ReturnURL[Return Public URL: http://host/uploads/uuid.png]
    ReturnURL --> CreateNote[POST /api/canvas/notes with type: 'image' and content: URL]
```

---

## 17. Authentication & Security

### Security Architecture & Hardening
1. **Password Security:** Salted and hashed using `bcrypt` (10 rounds). Passwords must satisfy regex: min 8 characters, at least 1 digit, at least 1 special character (`server/utils/validators.js`).
2. **Stateless JWT:** Signed with HMAC SHA-256 (`JWT_SECRET`) expiring in 7 days (`JWT_EXPIRES_IN`). Verified on protected routes by `authMiddleware.protect`.
3. **NoSQL Injection Guard:** Custom middleware `server/middleware/sanitizeMiddleware.js` invokes `express-mongo-sanitize.sanitize()` directly on `req.body`, `req.params`, and `req.query`, stripping malicious MongoDB query operators (`$gt`, `$ne`, `.`).
4. **Stored XSS Prevention:** Freeform inputs (note text, post topics) pass through `sanitizeText()` (`server/utils/validators.js`) which strips HTML tags (`/<[^>]*>/g`) before database storage.
5. **Secure Password Reset:** Reset tokens are generated via `crypto.randomBytes(32).toString("hex")`. Only the SHA-256 hash is persisted in the database; raw tokens expire in 1 hour and are cleared immediately upon successful password change.
6. **HTTP Security Headers:** Integrated `helmet()` configuring CSP, HSTS, and frameguards. The `/uploads` route explicitly sets `Cross-Origin-Resource-Policy: cross-origin` so static images can be displayed across ports in development.
7. **Production Error Masking:** `respondServerError` in `server/utils/httpError.js` logs the full stack trace on the server but sends a generic `"Something went wrong. Please try again."` message when `NODE_ENV === "production"`, preventing ORM/database leakages.

---

## 18. Configuration & Environment Variables

### Root Server Environment (`.env`)

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `PORT` | Port the Express API server listens on | No (default: 5000) | `5000` |
| `NODE_ENV` | Runtime environment (`production` or `development`) | No | `production` |
| `CLIENT_URL` | Frontend URL allowed by CORS & used for reset links | No (default: `http://localhost:5173`) | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection URI (must include database name) | **Yes (Fails Boot)** | `mongodb://localhost:27017/verve` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | **Yes (Fails Boot)** | `long-random-48-char-hex-string` |
| `JWT_EXPIRES_IN` | Duration before JWT session tokens expire | No (default: `7d`) | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key for all AI generation calls | Yes (for AI features) | `AIzaSy...` |
| `DATABASE_URL` | PostgreSQL connection URI for billing schema | Yes (for Billing) | `postgresql://postgres:postgres@localhost:5432/verve_billing` |
| `REDIS_URL` | Redis connection URL for content & analytics cache | No (fails soft) | `redis://localhost:6379` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for verifying Google Identity tokens | No (returns 501 if unset) | `xxx.apps.googleusercontent.com` |
| `STRIPE_SECRET_KEY` | Stripe secret key for checkout session creation | Yes (for Billing) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret for signature check | Yes (for Billing) | `whsec_...` |
| `SMTP_HOST` | SMTP server host for sending password reset emails | No (logs to console if unset) | `smtp.example.com` |
| `SMTP_PORT` | SMTP server port | No (default: 587) | `587` |
| `SMTP_USER` | SMTP username | No | `support@verve.ai` |
| `SMTP_PASS` | SMTP password | No | `secret` |
| `EMAIL_FROM` | Outgoing sender display and address | No | `Verve AI <no-reply@verve.ai>` |

### Client Environment (`client/verve/.env`)

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID for rendering GIS button | No (hides button if unset) | `xxx.apps.googleusercontent.com` |
| `VITE_API_URL` | Base URL for Express backend API | No (default: `http://localhost:5000/api`) | `https://api.verve.ai/api` |

---

## 19. Local Development Setup

### Prerequisites
- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **MongoDB:** Local MongoDB daemon or MongoDB Atlas URI
- **PostgreSQL:** PostgreSQL 16 (for billing schema)
- **Redis (Optional):** Local Redis server (runs fine without it)

### Step-by-Step Installation

1. **Clone the Repository:**
   ```bash
   git clone <repo-url> BrandPilot-AI
   cd BrandPilot-AI
   ```

2. **Configure Environment Files:**
   ```bash
   # Root backend configuration
   cp .env.example .env

   # Client configuration
   cp client/verve/.env.example client/verve/.env
   ```
   *Edit `.env` to supply `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, and `DATABASE_URL`.*

3. **Install & Initialize Backend:**
   ```bash
   cd server
   npm install
   npx prisma generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Install Frontend:**
   ```bash
   cd ../client/verve
   npm install
   ```

5. **Running Locally:**
   - **Terminal 1 (Backend):**
     ```bash
     cd server
     npm run dev
     # Runs nodemon on port 5000
     ```
   - **Terminal 2 (Frontend):**
     ```bash
     cd client/verve
     npm run dev
     # Runs Vite dev server on http://localhost:5173
     ```

6. **Verification:**
   - Open `http://localhost:5000/api/health` in browser: returns `{"success": true, "status": "ok"}`.
   - Open `http://localhost:5173`: displays Verve AI landing page.

---

## 20. Docker & Infrastructure

The project includes a complete multi-container configuration in `docker-compose.yml`:

```yaml
services:
  mongo:        # MongoDB 7 with healthcheck ping (port 27017)
  postgres:     # PostgreSQL 16 Alpine for verve_billing (port 5432)
  redis:        # Redis 7 Alpine with ping healthcheck (port 6379)
  server:       # Multi-stage Node.js container for Express API (port 5000)
  client:       # Multi-stage Nginx container serving built static SPA (port 8080)
```

### Running with Docker Compose
```bash
# Build and boot all 5 services in background
docker compose up -d

# Check health of all services
docker compose ps

# View API server logs
docker compose logs -f server
```
*The client is available at `http://localhost:8080`, and the backend API at `http://localhost:5000`.*

---

## 21. Testing

### Current Status
- There is currently **no automated unit or integration test suite** in the codebase.
- The `server/package.json` test script is a placeholder:
  ```json
  "test": "echo \"Error: no test specified\" && exit 1"
  ```
- **CI Validation:** The GitHub Actions workflow (`.github/workflows/ci.yml`) enforces code quality on pull requests to `main` via:
  1. Client linting: `npm run lint` (ESLint 10).
  2. Client bundling: `npm run build` and `npm run build:ssr`.
  3. Server boot validation: spins up ephemeral Mongo & Postgres containers, runs `npx prisma migrate deploy`, boots `node server.js`, and verifies `curl -sf http://localhost:5000/api/health`.

---

## 22. Error Handling

### Error Flow Architecture
```mermaid
flowchart TD
    ErrSource[Error Occurs in Controller / Service] --> ErrType{Type of Error?}
    
    ErrType -- Missing required fields / Invalid enum --> Client4xx[Explicit HTTP 400/401/404 Response]
    ErrType -- AI parse exception / Model error --> AISvcCatch[aiService catches & rethrows descriptive Error]
    ErrType -- Multer file too large / bad extension --> MulterNext[next err passed to errorMiddleware.js]
    ErrType -- Unhandled exception / DB error --> ServerCatch[respondServerError in server/utils/httpError.js]
    
    MulterNext --> ErrMWResponse[HTTP 400 Clean JSON Error]
    AISvcCatch --> ServerCatch
    
    ServerCatch --> CheckEnv{NODE_ENV === 'production'?}
    CheckEnv -- Yes --> Masked500[HTTP 500: 'Something went wrong. Please try again.']
    CheckEnv -- No --> Dev500[HTTP 500: error.message]
```

---

## 23. Logging & Monitoring

- **Application Logs:** Structured console logging on startup detailing port, Mongo connection status, index repair status, cron execution, and Stripe webhook handling.
- **Fail-Soft Warnings:** `validateEnv.js` warns on missing recommended variables; `redis.js` logs degradation notice if Redis is absent; `mailerService.js` logs password reset links to console if SMTP is unconfigured.
- **Health Check Endpoint:** `GET /api/health` returns:
  ```json
  {
    "success": true,
    "status": "ok",
    "uptime": 142.58
  }
  ```
  *(Deliberately decouples from databases so container orchestrators can check process liveness independent of downstream database failovers).*

---

## 24. Deployment

The project supports three distinct production deployment models:

1. **Split Static + API (Recommended Default):**
   - **Frontend:** Built with `npm run build` in `client/verve/` and deployed to Vercel, Netlify, or AWS S3/CloudFront. The included `client/verve/vercel.json` provides the rewrite rule: `{"source": "/(.*)", "destination": "/index.html"}`.
   - **Backend:** Deployed as a standalone Node service on Render, Railway, or AWS ECS running `node server.js`. The included `render.yaml` specifies an automated blueprint.
2. **Single-Process Monolith:**
   - Execute `npm run build:all` inside `client/verve/` to produce both `dist/` and `dist-ssr/`.
   - Colocate with `server/`. When `server.js` starts, it detects the build, serves `/` using Server-Side Rendering (`entry-server.jsx`), and serves all other static assets and SPA fallbacks directly.
3. **Docker Compose Orchestration:**
   - Deployed on a single VPS (e.g. DigitalOcean, AWS EC2) using `docker-compose.yml`, putting Nginx on port 8080 and Express on port 5000.

---

## 25. Performance Considerations

1. **Redis Aggregation Caching:** `GET /api/analytics/overview` executes a 3-way `$facet` aggregation over `ContentDraft`. This result is cached in Redis with a 300-second TTL and actively invalidated whenever any draft is created, updated, or deleted.
2. **Parallel Generation via `Promise.allSettled`:** Multi-platform generation and weekly planner draft creation fire AI requests concurrently rather than sequentially, reducing total wall-clock time from ~10s down to ~2s.
3. **Bounded Analytics Window:** `Analytics.dailySnapshots` is embedded in the user's analytics document. To prevent unbounded document growth, the nightly cron job prunes entries older than 90 days.
4. **Debounced UI Search:** Draft search in Content Studio is debounced by 300ms (`debounce` in `client/verve/src/utils/async.js`) to avoid excessive filtering on every keystroke.

---

## 26. Limitations

1. **No Direct Social Publishing:** Posts cannot be automatically published to LinkedIn or Instagram accounts; users must manually copy content and paste it into their social apps.
2. **Absence of Automated Test Suite:** No Jest, Vitest, or Supertest suites exist. Regressions must currently be identified via manual smoke testing and CI build checks.
3. **Missing Client Billing Page:** While PostgreSQL and Stripe backend endpoints are complete, the React client currently lacks a dedicated `/billing` user interface.
4. **Local Disk Image Storage:** Canvas images are saved to local disk storage (`server/uploads/`). In multi-instance or serverless container environments, uploaded images will not persist across container restarts without a shared volume or S3 integration.
5. **Single AI Provider Dependency:** All generation logic is tightly coupled to Google Gemini; no dynamic fallback to Anthropic or OpenAI is currently implemented in `aiService.js` (despite `@anthropic-ai/sdk` being listed in `package.json`).

---

## 27. Future Improvements

### Recommended Engineering Enhancements
1. **Automated Test Coverage:** Implement unit tests for pure prompt builders and integration tests for Express routes using Vitest and Supertest.
2. **Cloud Object Storage (S3 / R2):** Replace Multer local disk storage with Amazon S3 or Cloudflare R2 for durable, multi-region canvas image hosting.
3. **Client Billing Management Dashboard:** Implement a `/billing` page in React displaying subscription status, active plan features, and an invoice history table.
4. **Direct Social Media OAuth Publishing:** Integrate official LinkedIn Community Management API and Meta Graph API to allow 1-click scheduled auto-posting.
5. **AI Multi-Provider Fallback:** Implement a provider fallback pipeline in `aiService.js` utilizing the already-installed `@anthropic-ai/sdk` (Claude 3.5 Sonnet) if Gemini encounters rate limits or service outages.

---

## 28. Troubleshooting

### 1. Missing Required Environment Variables Crash
- **Symptom:** Server crashes immediately on `npm run dev` with message:
  ```text
  Missing required environment variable(s): MONGO_URI, JWT_SECRET. Copy .env.example to .env and fill them in.
  ```
- **Cause:** `validateEnv.js` halts process boot if core secrets are missing.
- **Solution:** Create `.env` in the repository root and provide valid `MONGO_URI` and `JWT_SECRET` strings.

### 2. Canvas Images Fail to Display in Browser
- **Symptom:** Uploaded image cards on Canvas show broken image icons.
- **Cause:** Helmet's default `Cross-Origin-Resource-Policy: same-origin` blocks cross-port resource requests between client (`:5173`) and server (`:5000`).
- **Solution:** Verified fixed in `server.js` by mounting explicit header:
  ```javascript
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  ```

### 3. Duplicate Key Error on Google Accounts (`E11000 dup key: { googleId: null }`)
- **Symptom:** Creating a second email/password account fails with a MongoDB duplicate key error on `googleId`.
- **Cause:** Legacy sparse unique indexes on MongoDB index `null` values when the field default is `null`.
- **Solution:** `server/config/repairIndexes.js` runs on server boot to drop the stale sparse index and establish a partial unique index filtering strictly on `{ googleId: { $type: "string" } }`.

### 4. Prisma Client Initialization Error
- **Symptom:** `/api/billing/*` returns 500 with message regarding Prisma connection.
- **Cause:** PostgreSQL daemon is not running or `DATABASE_URL` in `.env` is incorrect.
- **Solution:** Ensure PostgreSQL is running on port 5432 and run `npx prisma migrate dev` in `server/`.

---

## 29. FAQ

#### Q: Why are there two separate databases (MongoDB and PostgreSQL)?
**A:** MongoDB holds document-shaped, feature-fluid data like Brand Briefs, unstructured onboarding answers, and freeform canvas notes. PostgreSQL was deliberately introduced via Prisma exclusively for the billing slice (`Plan`, `Subscription`, `Invoice`) where relational integrity, foreign keys, and ACID transactions are required.

#### Q: Where does AI generation happen?
**A:** AI generation runs entirely on the backend in `server/services/aiService.js` calling Google Gemini (`gemini-3.1-flash-lite`). The client never interacts with AI APIs directly.

#### Q: Can the app run without Redis?
**A:** Yes. `server/config/redis.js` detects if `REDIS_URL` is unset or unreachable and degrades gracefully to uncached direct database queries without interrupting application flow.

#### Q: How does SSR work on the Landing page?
**A:** When `npm run build:all` has been run in `client/verve`, `server.js` detects `dist-ssr/entry-server.js` and server-renders the HTML for `GET /`. On client load, `main.jsx` detects existing child nodes and calls `hydrateRoot` rather than `createRoot`.

---

## 30. Developer Onboarding

### First 10 Minutes
1. Read the Architecture Overview in Section 4 and Section 7 of this document.
2. Copy `.env.example` to `.env` in root and `client/verve/.env.example` to `client/verve/.env`.
3. Provide your local MongoDB URI and a random string for `JWT_SECRET`.
4. Run `npm run dev` in both `server/` and `client/verve/`. Verify `http://localhost:5000/api/health`.

### First Hour: Inspect Key Files
1. `server/server.js`: Middleware stack, routes, and startup sequence.
2. `server/services/aiService.js` & `server/prompts/`: How prompts are structured and executed.
3. `server/controllers/contentController.js`: Primary business logic for post generation and scheduling.
4. `client/verve/src/App.jsx`: Frontend route map and route guards.
5. `client/verve/src/pages/ContentStudio.jsx`: Primary interactive generator and post manager.

### Common Developer Workflows

#### Adding a New Generation Feature
1. Create a pure prompt builder function in `server/prompts/<feature>Prompt.js`.
2. Add an execution function in `server/services/aiService.js` invoking `ai.models.generateContent()`.
3. Create the controller action in `server/controllers/` loading the user's `BrandBrief` and returning the generated result.
4. Expose the route in `server/routes/`.
5. Connect your React component in `client/verve/src/pages/` using `api.post()`.

---

## 31. Contribution Guide

- **Branching Strategy:**
  - Branch off `main` using standard naming prefixes: `feature/<name>` or `fix/<name>`.
  - Never commit directly to `main`.
- **Commit Conventions:**
  - Write imperative commit messages explaining the *why* (e.g., `Add negative constraint support to contentPrompt`).
- **Pre-PR Verification Checklist:**
  - Server boots cleanly: `cd server && npm install && node server.js`.
  - Frontend builds and lints cleanly: `cd client/verve && npm run lint && npm run build`.
  - Verify that no environment secrets or local credentials are committed.

---

## 32. Code Quality Review

### Strengths
1. **Strict Prompt-Service-Controller Separation:** AI logic is cleanly decoupled; prompts are pure, testable functions, keeping controllers focused solely on HTTP and persistence concerns.
2. **Resilient Fail-Soft Architecture:** Optional services (Redis, SMTP, Google Auth) degrade cleanly with warnings instead of crashing the system.
3. **Idempotent Self-Healing Migrations:** `repairUserIndexes.js` automatically repairs subtle MongoDB sparse index bugs on boot without requiring manual DB intervention.
4. **Thoughtful Async Utilities:** Custom client utilities like `coalesceMicrotask` and `debounce` prevent request flooding and race conditions.

### Architectural Risks & Discrepancies
1. **Unused Empty Files in Repository:**
   - `server/routes/onboardingRoutes.js` (0 bytes) — unused stub; routes handled in `brandRoutes.js`.
   - `server/services/brandService.js` & `server/services/contentService.js` (0 bytes) — logic consolidated in `aiService.js`.
   - `server/prompts/instagramPrompt.js` & `server/prompts/linkedinPrompt.js` (0 bytes) — consolidated into `contentPrompt.js`.
   *Recommendation:* Delete these empty stubs to avoid confusing new contributors.
2. **Missing Frontend Billing Page:**
   - The PostgreSQL and Stripe billing stack is functional on the backend, but the client router (`client/verve/src/App.jsx`) lacks a `/billing` page component.
3. **Local Filesystem Uploads in Multi-Container Setup:**
   - Multer writes image files to `server/uploads/` on the local disk. In containerized environments, these images will be lost unless a shared persistent Docker volume is mounted.

---

## 33. Implementation Status

| System Domain | Status | Notes |
|---|---|---|
| **User Authentication** | Implemented | Email/password signup/login, bcrypt hashing, JWT tokens, Google Sign-In, password resets. |
| **Brand Brief Engine** | Implemented | 5-step intake wizard, Gemini-powered Brand Brief generation, pillar weights, updates. |
| **Content Studio** | Implemented | Single/multi-platform posts (LinkedIn, IG, Twitter), length & tone controls, 8 refinement actions. |
| **Weekly Planner** | Implemented | 7-day AI schedule generator, scheduled draft creation, native HTML5 drag-and-drop. |
| **Brand Canvas** | Implemented | Text notes, Multer image uploads, Gemini board analysis and topic synthesis. |
| **Profile Makeover** | Implemented | Stateless optimization of LinkedIn Headline and About sections with copy buttons. |
| **Analytics** | Implemented | MongoDB `$facet` aggregation pipelines, embedded daily snapshots, Redis caching. |
| **Billing (Backend)** | Implemented | PostgreSQL schema (Prisma), Stripe checkout session creation, webhook verification, SQL rollups. |
| **Billing (Frontend)** | Missing | No `/billing` route or page component declared in `client/verve/src/App.jsx`. |
| **Caching Layer** | Implemented | Redis 5-min caching for drafts and analytics with write-invalidation hooks. |
| **Real-Time Sync** | Implemented | Socket.IO room subscriptions for instant cross-tab draft updates. |
| **Testing Suite** | Missing | No unit or integration test suite implemented; server `npm test` exits with code 1. |
| **Deployment / CI** | Implemented | Docker Compose (5 containers), Render Blueprint, GitHub Actions lint/build/boot CI workflow. |

---

## 34. Glossary

| Term | Definition |
|---|---|
| **Brand Brief** | The central strategic document generated by Verve AI containing a user's positioning, tagline, mission, target audience, tone, and weighted content pillars. |
| **Content Pillar** | A core thematic category that a creator focuses on (e.g., "Engineering Leadership", "Career Growth", "Cloud Architecture"). |
| **Pillar Weight** | A percentage allocation (summing to ~100%) indicating how frequently content should be generated for each respective content pillar. |
| **Coalesce Microtask** | A client-side scheduling technique utilizing `queueMicrotask` to bundle multiple rapid WebSocket events into a single component re-fetch. |
| **Prompt Builder** | A pure function in `server/prompts/` that formats context variables into a clean instruction string for Google Gemini without performing network I/O. |
| **Scoped SSR** | Server-Side Rendering restricted deliberately to the static Landing page (`/`) to optimize first contentful paint while preserving pure client-side SPA routing for all authenticated pages. |
| **NoSQL Operator Injection** | A vulnerability where untrusted JSON keys containing MongoDB operators (e.g. `{"$gt": ""}`) bypass authentication checks, mitigated by `sanitizeMiddleware.js`. |
| **Fail-Soft** | An engineering design pattern where non-essential service outages (Redis, SMTP, Google Auth) allow the application to continue running with reduced functionality rather than crashing. |
