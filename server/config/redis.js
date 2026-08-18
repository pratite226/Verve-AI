const Redis = require("ioredis");

// Caching is an optimization, not a correctness dependency — unlike the fail-fast secrets
// in validateEnv.js, a missing/unreachable Redis should degrade the app to "slower", never
// crash it. `enableOfflineQueue: false` + a capped retry strategy means a command issued
// while Redis is down rejects immediately instead of hanging, so callers can catch and
// skip the cache rather than blocking the request.
let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
  });

  redis.on("error", (err) => console.error("Redis error:", err.message));
  redis.connect().catch((err) => console.error("Redis connection failed:", err.message));
} else {
  console.log("REDIS_URL not set — caching disabled, running without Redis.");
}

// Small helpers so callers don't each need their own try/catch around every redis call.
const cacheGet = async (key) => {
  if (!redis || redis.status !== "ready") return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`cacheGet(${key}) failed:`, err.message);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds) => {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`cacheSet(${key}) failed:`, err.message);
  }
};

const cacheDel = async (key) => {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`cacheDel(${key}) failed:`, err.message);
  }
};

const cacheDelByPrefix = async (prefix) => {
  if (!redis || redis.status !== "ready") return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) await redis.del(keys);
  } catch (err) {
    console.error(`cacheDelByPrefix(${prefix}) failed:`, err.message);
  }
};

module.exports = { redis, cacheGet, cacheSet, cacheDel, cacheDelByPrefix };
