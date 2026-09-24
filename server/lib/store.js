// Tiny JSON-file database. Good enough for a hackathon demo; swap for Supabase/Postgres later.
// Privacy by design: we store COUNTS for every check, and message text ONLY when a user opts in.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { scrub } from './scrub.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'server', 'data');
const FILE = path.join(DATA_DIR, 'store.json');

const defaults = () => ({
  sampleData: false,
  stats: { checks: 0, byVerdict: { safe: 0, suspicious: 0, scam: 0 }, byCategory: {}, daily: {} },
  submissions: [],
  leaderboard: [],
});

let state = load();
let saveTimer = null;

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    const d = defaults();
    return { ...d, ...raw, stats: { ...d.stats, ...raw.stats } };
  } catch {
    return defaults();
  }
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 200);
}

export function isEmpty() {
  return state.stats.checks === 0 && state.submissions.length === 0 && state.leaderboard.length === 0;
}

export function flush() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, FILE);
}

export function replaceState(next) {
  state = { ...defaults(), ...next };
  flush();
}

const today = () => new Date().toISOString().slice(0, 10);

export function recordCheck(result) {
  const s = state.stats;
  s.checks += 1;
  s.byVerdict[result.verdict] = (s.byVerdict[result.verdict] || 0) + 1;
  for (const cat of new Set(result.flags.map((f) => f.category))) {
    s.byCategory[cat] = (s.byCategory[cat] || 0) + 1;
  }
  const d = today();
  s.daily[d] = (s.daily[d] || 0) + 1;
  save();
}

export function getStats() {
  const s = state.stats;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, checks: s.daily[d] || 0 });
  }
  const topCategories = Object.entries(s.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, count]) => ({ category, count }));
  return {
    sampleData: state.sampleData,
    checks: s.checks,
    byVerdict: s.byVerdict,
    topCategories,
    last7Days: days,
    reports: {
      pending: state.submissions.filter((x) => x.status === 'pending').length,
      approved: state.submissions.filter((x) => x.status === 'approved').length,
    },
    players: state.leaderboard.length,
  };
}

export function addSubmission({ text, result }) {
  const clean = scrub(String(text || '').slice(0, 10000)).text;
  const flags = (result?.flags || [])
    .filter((f) => typeof f.quote === 'string' && clean.includes(f.quote))
    .slice(0, 10)
    .map(({ quote, category, severity, why }) => ({ quote, category, severity, why: String(why).slice(0, 300) }));
  const item = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    text: clean,
    verdict: ['safe', 'suspicious', 'scam'].includes(result?.verdict) ? result.verdict : 'suspicious',
    score: Math.max(0, Math.min(100, Number(result?.score) || 0)),
    flags,
    status: 'pending',
  };
  state.submissions.unshift(item);
  state.submissions = state.submissions.slice(0, 500);
  save();
  return item;
}

export function listSubmissions() {
  return state.submissions;
}

export function setSubmissionStatus(id, status) {
  const item = state.submissions.find((x) => x.id === id);
  if (!item) return null;
  item.status = status;
  save();
  return item;
}

export function approvedSubmissions() {
  return state.submissions.filter((x) => x.status === 'approved');
}

export function addScore({ name, score, correct, total }) {
  const t = Math.max(1, Math.min(20, Math.round(Number(total) || 10)));
  const c = Math.max(0, Math.min(t, Math.round(Number(correct) || 0)));
  // Max possible: 250 pts per correct answer (spot-the-difference) + 50 streak bonus (keeps fake scores out).
  const maxScore = c * 300;
  const entry = {
    name: String(name || 'Anonymous').replace(/[^\w .\-]/g, '').trim().slice(0, 20) || 'Anonymous',
    score: Math.max(0, Math.min(maxScore, Math.round(Number(score) || 0))),
    correct: c,
    total: t,
    createdAt: new Date().toISOString(),
  };
  state.leaderboard.push(entry);
  state.leaderboard.sort((a, b) => b.score - a.score);
  state.leaderboard = state.leaderboard.slice(0, 100);
  save();
  return entry;
}

export function topScores(n = 10) {
  return state.leaderboard.slice(0, n);
}
