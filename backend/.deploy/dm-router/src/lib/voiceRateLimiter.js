const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 12;

const buckets = new Map();

function getLimitConfig() {
  const max =
    Number(process.env.VOICE_RATE_LIMIT_MAX) ||
    Number(process.env.VOICE_RATE_LIMIT_PER_MINUTE) ||
    DEFAULT_MAX_REQUESTS;
  const windowMs =
    Number(process.env.VOICE_RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS;
  return { max, windowMs };
}

function enforceRateLimit(key) {
  if (!key) return;
  const now = Date.now();
  const { max, windowMs } = getLimitConfig();
  const entry = buckets.get(key);
  if (!entry || now > entry.expiresAt) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return;
  }

  entry.count += 1;
  if (entry.count > max) {
    const error = new Error("Too many requests");
    error.code = "RATE_LIMIT";
    error.statusCode = 429;
    throw error;
  }
}

module.exports = { enforceRateLimit };
