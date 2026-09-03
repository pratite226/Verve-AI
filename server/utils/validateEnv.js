// Fails fast on boot if a genuinely required secret/config value is missing,
// instead of limping along and surfacing a confusing error deep in a request handler.
const REQUIRED = ["MONGO_URI", "JWT_SECRET"];

// Not fatal, but their feature is broken without them — warn loudly so a misconfigured
// deploy is obvious in the boot log rather than discovered via a 500 later. Mirrors the
// fail-soft convention used for Redis (config/redis.js).
const RECOMMENDED = {
  DATABASE_URL: "billing/subscriptions (Postgres) — /api/billing/* and the nightly subscription sweep are disabled without it",
};

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill them in."
    );
    process.exit(1);
  }

  for (const [key, why] of Object.entries(RECOMMENDED)) {
    if (!process.env[key]) {
      console.warn(`[env] ${key} is not set — ${why}.`);
    }
  }
};

module.exports = validateEnv;
