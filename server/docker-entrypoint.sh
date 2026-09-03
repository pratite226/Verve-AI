#!/bin/sh
# Container start: apply any pending Postgres migrations and seed the billing plans before
# the API comes up, so a fresh database (docker-compose volume, new Render Postgres) is
# usable immediately instead of every /api/billing/* call 500ing on a missing table.
#
# - `prisma migrate deploy` only applies already-committed migrations (never generates or
#   prompts) and is safe to run on every boot — it no-ops when the schema is current.
# - `prisma/seed.js` upserts the Free/Pro plans, so it is also idempotent; a failure here
#   is non-fatal (the API can still start; plans can be seeded later).
set -e

npx prisma migrate deploy
node prisma/seed.js || echo "[entrypoint] plan seed failed (non-fatal) — run 'npm run db:seed' later"

exec node server.js
