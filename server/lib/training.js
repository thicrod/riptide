// Builds a 10-round game: 3 Level-1 cards, 3 Level-2 cards + 1 spot-the-difference,
// 2 Level-3 cards + 1 spot-the-difference. About half of the single cards are legit.
// Community reports approved by IT can appear as "Reported at Pepperdine" cards.

import { TRAINING_MESSAGES, TRAINING_TWINS } from '../../shared/trainingMessages.js';
import { approvedSubmissions } from './store.js';
import { generateSingle, generateTwin, comboOf } from './generator.js';


function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function communityCard(sub) {
  const lines = sub.text.split('\n');
  const fromLine = lines.find((l) => /^\s*from\s*:/i.test(l));
  const subjectLine = lines.find((l) => /^\s*subject\s*:/i.test(l));
  const body = lines.filter((l) => l !== fromLine && l !== subjectLine && !/^\s*(to|cc|date)\s*:/i.test(l)).join('\n').trim();
  const fromValue = fromLine ? fromLine.replace(/^\s*from\s*:\s*/i, '') : 'Unknown sender';
  const addr = fromValue.match(/<([^>]+)>/);
  return {
    id: `community-${sub.id}`,
    level: 3,
    channel: 'email',
    community: true,
    isPhish: sub.verdict !== 'safe',
    time: new Date(sub.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
    from: addr ? { name: fromValue.slice(0, addr.index).replace(/"/g, '').trim(), address: addr[1] } : { name: fromValue },
    subject: subjectLine ? subjectLine.replace(/^\s*subject\s*:\s*/i, '') : undefined,
    body,
    // One flag per quote so the same phrase isn't numbered twice.
    flags: sub.flags.filter((f, i, all) => all.findIndex((g) => g.quote.toLowerCase() === f.quote.toLowerCase()) === i),
    explanation: sub.id.startsWith('sample-')
      ? 'Sample community report (demo data). In real use, reports come from the Pepperdine community and are reviewed by IT before appearing here.'
      : 'This message was reported by someone in the Pepperdine community and reviewed by IT before being added to training.',
  };
}

// Randomize which side (A/B) holds the scam so the answer can't be memorized.
function twinRound(t) {
  const phish = Math.random() < 0.5 ? 'a' : 'b';
  const { real, fake, ...rest } = t;
  return { ...rest, phish, a: phish === 'a' ? fake : real, b: phish === 'a' ? real : fake };
}

// Hand-written cards share a "topic" with generated ones (usps, docusign, password...), so a round
// never shows two messages about the same thing.
const topicOf = (card) => card.topic || card.id.replace(/^(?:l\d|twin)-/, '').replace(/-(?:fake|real)$/, '');

/**
 * 10 rounds: Level 1 (3 singles), Level 2 (3 singles + 1 spot-the-difference),
 * Level 3 (2 singles + 1 spot-the-difference). About half of the singles are legit.
 *
 * `seen` = ids this player has already been shown (the browser remembers them). Hand-written cards
 * are used until the player has seen them all; generated cards fill the rest and prefer
 * template + trick combinations the player has never seen, so questions don't repeat.
 */
export function buildRound({ seen = [] } = {}) {
  // A question seen as a single card also counts as seen as a spot-the-difference pair, and vice versa.
  const seenIds = new Set(seen.flatMap((id) => (id.endsWith(':twin') ? [id, id.slice(0, -5)] : [id, `${id}:twin`])));
  const seenCombos = new Set(seen.filter((id) => id.startsWith('g:')).flatMap((id) => [comboOf(id), `${comboOf(id)}:twin`]));
  const usedTopics = new Set();
  const coin = () => Math.random() < 0.5;
  const plan = [
    { level: 1, legit: coin() ? 1 : 2, singles: 3, twins: 0 },
    { level: 2, legit: coin() ? 1 : 2, singles: 3, twins: 1 },
    { level: 3, legit: 1, singles: 2, twins: 1 },
  ];

  const take = (card) => { usedTopics.add(topicOf(card)); return card; };

  function single(level, isPhish) {
    const curated = shuffle(TRAINING_MESSAGES.filter((m) => m.level === level && m.isPhish === isPhish
      && !seenIds.has(m.id) && !usedTopics.has(topicOf(m))));
    if (curated.length && coin()) return take(curated[0]);
    // If this level's fresh questions are used up, borrow a fresh one from a neighboring level.
    for (const lv of [level, ...[1, 2, 3].filter((x) => x !== level)]) {
      const g = generateSingle({ level: lv, isPhish, avoidTopics: usedTopics, seen: seenIds, seenCombos });
      if (g && !seenIds.has(g.id)) return take({ ...g, level });
    }
    const g = generateSingle({ level, isPhish, avoidTopics: usedTopics, seen: seenIds, seenCombos });
    if (g) return take(g);
    return curated.length ? take(curated[0]) : null;
  }

  function twin(level) {
    const curated = shuffle(TRAINING_TWINS.filter((t) => t.level === level && !seenIds.has(t.id) && !usedTopics.has(topicOf(t))));
    if (curated.length && coin()) return take(twinRound(curated[0]));
    for (const lv of [level, ...[2, 3].filter((x) => x !== level)]) {
      const g = generateTwin({ level: lv, avoidTopics: usedTopics, seen: seenIds, seenCombos });
      if (g && !seenIds.has(g.id)) return take(twinRound({ ...g, level }));
    }
    const g = generateTwin({ level, avoidTopics: usedTopics, seen: seenIds, seenCombos });
    if (g) return take(twinRound(g));
    return curated.length ? take(twinRound(curated[0])) : null;
  }

  const cards = [];
  for (const { level, legit, singles, twins } of plan) {
    const chosen = [];
    for (let i = 0; i < singles; i++) chosen.push(single(level, i >= legit));
    for (let i = 0; i < twins; i++) chosen.push(twin(level));
    cards.push(...shuffle(chosen.filter(Boolean)));
  }

  // Swap in 1 real community report (as an AI-era phish card) when IT has approved one this player hasn't seen.
  const community = shuffle(approvedSubmissions().filter((s) => s.verdict !== 'safe' && s.flags.length && !seenIds.has(`community-${s.id}`)));
  if (community.length) {
    const idx = cards.findIndex((c) => c.level === 3 && c.isPhish && c.type !== 'twin');
    if (idx >= 0) cards[idx] = communityCard(community[0]);
  }
  return cards;
}
