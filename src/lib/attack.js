// Picks the "you got phished" outcome for a card: which kind of attack it was, the story to show
// (rotating through several so it isn't repetitive), and the exact detail that gave it away.
import { officialBrandOf } from '../../server/lib/domains.js';
import { STORIES } from './stories.js';

export const START_LIVES = 3;
export const MISS_PENALTY = 100;
export const FALSE_ALARM_PENALTY = 50;

const DOMAIN_RE = /(?:[a-z0-9¡-￿-]+\.)+[a-z¡-￿]{2,}/i;
const SEV = { high: 3, medium: 2, low: 1 };

// Raw host as written (keeps lookalike letters instead of punycode; handles the user@host trick).
function hostOf(url) {
  return String(url || '').match(/^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?([^/:?#]+)/i)?.[1]?.toLowerCase() || null;
}
const unofficial = (h) => h && !officialBrandOf(h);

// The domain the scam actually used, so the story is about *this* message.
function scamDomain(card, fake) {
  const links = (fake.links || []).filter((l) => unofficial(hostOf(l.href)));
  const flagged = links.find((l) => card.flags.some((f) => f.quote === l.text || f.quote.includes(hostOf(l.href))));
  if (flagged) return hostOf(flagged.href);
  for (const f of card.flags.filter((x) => x.category === 'lookalike_domain' || x.category === 'risky_link')) {
    const m = f.quote.match(new RegExp(`@(${DOMAIN_RE.source})`, 'i'))?.slice(1) || f.quote.match(DOMAIN_RE);
    if (m && unofficial(m[0].replace(/^https?:\/\//i, '')) && !/\.(pdf|docx?|xlsx?|html?|zip|exe|js|png|jpe?g)$/i.test(m[0])) return m[0].toLowerCase();
  }
  if (links.length) return hostOf(links[0].href);
  return null; // the link itself was real: the trap was the request (reply-to, phone number, wording)
}

// Which family of story fits this scam.
export function storyKeyFor(card) {
  const fake = card.type === 'twin' ? card[card.phish] : card;
  const cats = new Set(card.flags.map((f) => f.category));
  if (cats.has('mfa_code')) return 'mfa';
  if (cats.has('credentials') || (cats.has('lookalike_domain') && fake.links?.length)) return 'password';
  if (cats.has('personal_info')) return 'personal_info';
  if (cats.has('job_scam')) return 'job_scam';
  if (cats.has('money') || cats.has('prize')) return 'money';
  if (cats.has('attachment')) return 'attachment';
  if (fake.links?.some((l) => /docs\.google\.com\/forms|forms\.gle/i.test(l.href || ''))) return 'gform';
  if (/\bqr\b|scan (?:the|this) code/i.test(fake.body || '')) return 'qr';
  if (!fake.links?.length && (cats.has('impersonation') || cats.has('sender_spoof') || cats.has('context'))) return 'reply';
  return 'generic';
}

/**
 * The attack story to show. `variant` chooses which of the several stories for this attack type
 * to use (Breach.jsx rotates it so players don't see the same one twice). Defaults to the first.
 */
export function attackPlan(card, variant = 0) {
  const fake = card.type === 'twin' ? card[card.phish] : card;
  const key = storyKeyFor(card);
  const ctx = { domain: scamDomain(card, fake), file: fake.attachments?.[0]?.name || null };
  const pool = STORIES[key] || STORIES.generic;
  const story = pool[((variant % pool.length) + pool.length) % pool.length](ctx);
  const tell = [...card.flags].sort((a, b) => SEV[b.severity] - SEV[a.severity])[0];
  return { ...story, tell, key };
}

// Rotate through every story for an attack type before repeating any (remembered per browser).
export function nextVariant(key) {
  const storeKey = `riptide.story.${key}`;
  let n = 0;
  try { n = parseInt(localStorage.getItem(storeKey) || '0', 10) || 0; localStorage.setItem(storeKey, String(n + 1)); } catch { n = Math.floor(Math.random() * 1000); }
  return n;
}
