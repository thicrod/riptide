// Orchestrates the two layers: privacy scrub -> rules -> AI -> merged verdict.

import { analyzeWithRules, scoreFlags, summarizeFlags, TECHNICAL_CATEGORIES } from './rules.js';
import { runAI, aiInfo } from './ai.js';
import { scrub } from './scrub.js';
import { verdictFor, PEPPERDINE } from '../../shared/categories.js';

export const MAX_TEXT = 10000;
const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

// Find where an AI quote appears in the original text (case/whitespace tolerant).
export function locateQuote(text, quote) {
  if (!quote || quote.length < 3) return null;
  const idx = text.toLowerCase().indexOf(quote.toLowerCase());
  if (idx >= 0) return { start: idx, end: idx + quote.length };
  // Tolerate collapsed whitespace / newlines.
  const escaped = quote.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  try {
    const m = new RegExp(escaped, 'i').exec(text);
    if (m) return { start: m.index, end: m.index + m[0].length };
  } catch { /* ignore */ }
  return null;
}

/**
 * Blend the two layers.
 * - AI gets 65% of the weight (it understands context), rules 35% (hard evidence).
 * - If either layer is highly confident (>= 80), or the rules found hard technical
 *   evidence (lookalike domain, spoofed sender, hidden link), the result can't drop below 70.
 */
export function blendScores(rulesScore, aiScore, flags) {
  if (aiScore == null) return rulesScore;
  let score = Math.round(0.65 * aiScore + 0.35 * rulesScore);
  const hardEvidence = flags.some((f) => f.source !== 'ai' && f.severity === 'high' && TECHNICAL_CATEGORIES.has(f.category));
  if (Math.max(aiScore, rulesScore) >= 80 || hardEvidence) score = Math.max(score, 70);
  return score;
}

export function mergeResults(text, rules, ai) {
  const flags = rules ? rules.flags.map((f) => ({ ...f })) : [];
  const unplaced = [];

  for (const f of ai?.red_flags || []) {
    const loc = locateQuote(text, f.quote);
    if (loc) {
      const twin = flags.find((r) => r.category === f.category && r.start < loc.end && loc.start < r.end);
      if (twin) {
        twin.source = 'both';
        if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[twin.severity]) twin.severity = f.severity;
        continue;
      }
      flags.push({ ...loc, quote: text.slice(loc.start, loc.end), category: f.category, severity: f.severity, why: f.why, source: 'ai' });
    } else {
      unplaced.push({ quote: f.quote, category: f.category, severity: f.severity, why: f.why, source: 'ai', start: null, end: null });
    }
  }
  flags.sort((a, b) => a.start - b.start);
  const allFlags = [...flags, ...unplaced];

  const rulesScore = rules ? rules.score : scoreFlags([]);
  const score = blendScores(rulesScore, ai ? ai.risk_score : null, allFlags);
  const verdict = verdictFor(score);

  const signals = [...new Set([...(rules?.signals || []), ...(ai?.good_signs || [])])].slice(0, 5);
  return {
    score,
    verdict,
    summary: ai?.summary || summarizeFlags(allFlags),
    flags: allFlags,
    signals: verdict === 'scam' ? signals.filter((s) => !/^Doesn't ask/.test(s)) : signals,
    actions: buildActions(verdict, allFlags, ai?.actions),
    layers: { rules: rulesScore, ai: ai ? ai.risk_score : null },
  };
}

function buildActions(verdict, flags, aiActions = []) {
  const cats = new Set(flags.map((f) => f.category));
  const out = [];
  if (verdict === 'scam') {
    out.push("Don't click the links, open attachments or reply.");
    out.push(`Report it with the Phish Alert Button (orange fish hook) in Gmail, or call Tech Support at ${PEPPERDINE.techSupportPhone} (24/7).`);
    if (cats.has('credentials') || cats.has('mfa_code')) {
      out.push(`Already typed your password or a code? Change your password now and call Pepperdine's Information Security Office at ${PEPPERDINE.isoPhone}.`);
    } else if (cats.has('money') || cats.has('job_scam')) {
      out.push("Already sent money or deposited a check? Contact your bank right away. Don't send more.");
    }
  } else if (verdict === 'suspicious') {
    out.push("Don't use the message's links. Go to the website yourself, or call the office using a number from pepperdine.edu.");
    out.push('Ask yourself: were you expecting this? If not, treat it as a scam.');
    out.push('Still unsure? Report it with the Phish Alert Button so IT can take a look.');
  } else {
    out.push('Looks okay, but stay alert if it later asks for a password, code or payment.');
    out.push('When in doubt, open the website yourself instead of clicking.');
  }
  for (const a of aiActions) {
    if (out.length >= 4) break;
    if (!out.some((o) => o.slice(0, 20).toLowerCase() === a.slice(0, 20).toLowerCase())) out.splice(1, 0, a);
  }
  return out.slice(0, 4);
}

// QR codes are decoded in the browser. Their destination is added as a line the rules engine checks
// like any other link (no AI needed). The label avoids the words "QR code" so it doesn't trip the QR rule.
export const QR_LABEL = 'Scanned code leads to:';
const qrLines = (qr) => (qr || []).map((u) => `${QR_LABEL} ${u}`).join('\n');

export async function analyzeMessage({ text, image, qr = [] }) {
  let original = String(text || '').slice(0, MAX_TEXT);
  const ai = aiInfo();
  qr = qr.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim().slice(0, 2000)).slice(0, 3);

  if (!original.trim() && !image) throw new HttpError(400, 'Paste a message or upload a screenshot first.');
  // Without AI we can't read the screenshot's text, but we can still check where its QR code goes.
  let qrOnly = false;
  if (image && !ai) {
    if (!qr.length) throw new HttpError(400, 'Reading screenshots needs an AI key (see README). For now, paste the message text instead.');
    qrOnly = true;
    image = null;
    original = qrLines(qr);
  }

  let rules = original.trim() ? analyzeWithRules(original) : null;
  const scrubbed = scrub(original);
  let aiResult = null;
  let aiError = null;

  if (ai) {
    try {
      aiResult = await runAI({ text: image && qr.length ? `(Decoded from a QR code in the screenshot)\n${qrLines(qr)}` : scrubbed.text, image, hints: rules?.flags });
    } catch (err) {
      aiError = err.message;
      console.warn('[ai] failed:', err.message);
    }
    if (image && aiResult?.extracted_text) {
      const extracted = aiResult.extracted_text.slice(0, MAX_TEXT);
      original = extracted.includes(QR_LABEL) ? extracted : [extracted, qrLines(qr)].filter(Boolean).join('\n\n');
      rules = analyzeWithRules(original);
    }
  }
  if (image && !aiResult) {
    if (!qr.length) throw new HttpError(502, `Couldn't read the screenshot (${aiError || 'no response'}). Try pasting the text.`);
    qrOnly = true;
    original = qrLines(qr);
    rules = analyzeWithRules(original);
  }
  if (image && aiResult && qr.length && !aiResult.extracted_text) {
    original = qrLines(qr);
    rules = analyzeWithRules(original);
  }

  const merged = mergeResults(original, rules, aiResult);
  return {
    ...merged,
    text: original,
    fromImage: !!image || qrOnly,
    qr: qr.length ? { codes: qr, only: qrOnly } : null,
    engine: {
      rules: true,
      ai: aiResult ? { provider: ai.label, model: ai.model } : null,
      aiError: aiError ? 'AI analysis was unavailable, so this result uses rules only.' : null,
    },
    privacy: {
      redactions: scrubbed.redactions.length,
      redactionTypes: [...new Set(scrubbed.redactions)],
      sentToAI: ai && !image ? scrubbed.text : null,
      stored: false,
    },
  };
}
