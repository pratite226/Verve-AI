// Fails fast on boot if a genuinely required secret/config value is missing,
// instead of limping along and surfacing a confusing error deep in a request handler.
const REQUIRED = ["MONGO_URI", "JWT_SECRET"];

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill them in."
    );
    process.exit(1);
  }
};

module.exports = validateEnv;
