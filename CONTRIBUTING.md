# Contributing to BrandPilot AI

## Branching

- `main` is always deployable. Never commit directly to it.
- Create a feature branch off `main` named `feature/<short-description>` for new work, or
  `fix/<short-description>` for bug fixes (e.g. `feature/onboarding-richer-profile`,
  `fix/auth-guard-redirect`).
- Keep branches scoped to one feature or fix — smaller PRs are easier to review.

## Commits

- Write commit messages in the imperative mood, summarizing the *why* when it isn't obvious from
  the diff: `Add deeper onboarding questions and wire them into every AI feature`, not
  `updated stuff`.
- Prefer a small number of meaningful commits over one commit per file save.

## Pull requests

1. Push your feature branch and open a PR against `main` (use the PR template — it's applied
   automatically).
2. Fill in what changed and why, and how you verified it (manual test steps, or automated tests
   if present).
3. Squash-merge or merge-commit once approved — avoid rebasing a branch that's already been
   pushed if anyone else might have it checked out.
4. Delete the branch after merge.

## Environment setup

- Copy `.env.example` to `.env` in the repo root and fill in real values — see that file for
  what each variable is for and where to get it. The server fails fast on boot
  (`server/utils/validateEnv.js`) if a required secret is missing.
- Never commit `.env` or any real credentials — it's gitignored; keep it that way.

## Before opening a PR

- `cd server && npm install && npm run dev` boots without errors.
- `cd client/brandai && npm install && npm run lint && npm run build` passes.
