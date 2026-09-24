// Simple in-memory rate limiter so nobody can burn through the AI key.

export function rateLimit({ windowMs = 60000, max = 30 } = {}) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const n = (hits.get(key) || 0) + 1;
    hits.set(key, n);
    if (n > max) {
      res.status(429).json({ error: 'Too many requests. Take a breath and try again in a minute.' });
      return;
    }
    next();
  };
}
