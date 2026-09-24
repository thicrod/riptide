// Riptide API server (Express). In production it also serves the built React app from /dist.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

try { process.loadEnvFile?.(); } catch { /* no .env file — that's fine */ }

const { analyzeMessage, HttpError } = await import('./lib/analyze.js');
const { aiInfo } = await import('./lib/ai.js');
const store = await import('./lib/store.js');
const { buildRound } = await import('./lib/training.js');
const { rateLimit } = await import('./lib/rateLimit.js');
const { seedSampleData } = await import('./lib/sample.js');

// Free hosts (like Render's free plan) wipe files whenever the server sleeps or redeploys.
// With SEED_SAMPLE_DATA=true, an empty store is refilled with labeled sample data on startup.
if (process.env.SEED_SAMPLE_DATA === 'true' && store.isEmpty()) {
  seedSampleData();
  console.log('  Loaded sample dashboard data (SEED_SAMPLE_DATA=true).');
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3001;
const ADMIN_KEY = process.env.ADMIN_KEY || 'riptide-demo';
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Basic security headers.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!req.path.startsWith('/api')) {
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
  }
  next();
});
app.use(express.json({ limit: '8mb' }));

const requireAdmin = (req, res, next) => {
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'Wrong admin key.' });
  next();
};

// ---------- API ----------
app.get('/api/health', (req, res) => {
  const ai = aiInfo();
  res.json({ ok: true, ai: ai ? { provider: ai.label, model: ai.model } : null });
});

app.post('/api/analyze', rateLimit({ windowMs: 60000, max: 15 }), async (req, res) => {
  const { text, image, qr } = req.body || {};
  if (text != null && typeof text !== 'string') throw new HttpError(400, 'Text must be a string.');
  if (qr != null && (!Array.isArray(qr) || qr.length > 3 || qr.some((u) => typeof u !== 'string' || u.length > 2000))) throw new HttpError(400, 'Bad QR data.');
  if (image) {
    if (!IMAGE_TYPES.has(image.mediaType) || typeof image.data !== 'string') throw new HttpError(400, 'Unsupported image. Use PNG, JPG, WEBP or GIF.');
    if (image.data.length * 0.75 > 5 * 1024 * 1024) throw new HttpError(413, 'Image is too large (max 5 MB).');
  }
  const result = await analyzeMessage({ text, image, qr: qr || [] });
  store.recordCheck(result); // counts only, never the message
  res.json(result);
});

app.post('/api/submissions', rateLimit({ windowMs: 60000, max: 10 }), (req, res) => {
  const { text, result } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) throw new HttpError(400, 'Nothing to share.');
  const item = store.addSubmission({ text, result });
  res.status(201).json({ ok: true, id: item.id });
});

app.get('/api/stats', (req, res) => res.json(store.getStats()));

const roundLimiter = rateLimit({ windowMs: 60000, max: 30 });
app.get('/api/training/round', roundLimiter, (req, res) => res.json({ cards: buildRound() }));
// POST lets the browser send the ids it has already seen, so questions don't repeat.
app.post('/api/training/round', roundLimiter, (req, res) => {
  const raw = Array.isArray(req.body?.seen) ? req.body.seen : [];
  const seen = raw.filter((x) => typeof x === 'string' && x.length <= 200).slice(-3000);
  res.json({ cards: buildRound({ seen }) });
});

app.get('/api/leaderboard', (req, res) => res.json({ scores: store.topScores(10) }));
app.post('/api/leaderboard', rateLimit({ windowMs: 60000, max: 10 }), (req, res) => {
  const entry = store.addScore(req.body || {});
  res.status(201).json({ ok: true, entry, scores: store.topScores(10) });
});

app.get('/api/admin/submissions', requireAdmin, (req, res) => res.json({ submissions: store.listSubmissions() }));
app.post('/api/admin/submissions/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) throw new HttpError(400, 'Invalid status.');
  const item = store.setSubmissionStatus(req.params.id, status);
  if (!item) throw new HttpError(404, 'Report not found.');
  res.json({ ok: true, item });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Static app (production) ----------
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: 'index.html', maxAge: '1h' }));
  app.get(/.*/, (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

// ---------- Errors ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That upload is too large.' });
  if (!err.expose) console.error(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  const ai = aiInfo();
  console.log(`\n  Riptide API running on http://localhost:${PORT}`);
  console.log(`  AI layer: ${ai ? `${ai.label} (${ai.model})` : 'OFF (rules-only mode). Add a key to .env to enable.'}\n`);
});
