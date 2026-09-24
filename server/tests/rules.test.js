import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWithRules } from '../lib/rules.js';
import { mergeResults, blendScores, locateQuote } from '../lib/analyze.js';
import { inspectHost } from '../lib/domains.js';
import { scrub } from '../lib/scrub.js';
import { TRAINING_MESSAGES, TRAINING_TWINS } from '../../shared/trainingMessages.js';
import { buildRound } from '../lib/training.js';
import { FLAG_CATEGORY_KEYS } from '../../shared/categories.js';

const cats = (r) => r.flags.map((f) => f.category);

test('lookalike Pepperdine sender domain is caught', () => {
  const r = analyzeWithRules('From: Financial Aid <finaid@pepperdlne.edu>\nSubject: Refund\n\nPlease verify your account today.');
  assert.ok(cats(r).includes('lookalike_domain'));
  assert.ok(cats(r).includes('credentials'));
  assert.equal(r.verdict, 'scam');
});

test('official office on Gmail is flagged as spoofed', () => {
  const r = analyzeWithRules('From: Pepperdine IT Help Desk <pepperdine.helpdesk@gmail.com>\n\nYour mailbox is full.');
  assert.ok(cats(r).includes('sender_spoof'));
});

test('legit IT notice from pepperdine.edu scores safe', () => {
  const r = analyzeWithRules(`From: Pepperdine Information Technology <it@pepperdine.edu>
Subject: Scheduled maintenance

Some systems will be unavailable Saturday 2-4 AM. No action is needed.
Details at community.pepperdine.edu/it`);
  assert.equal(r.verdict, 'safe');
  assert.equal(r.flags.length, 0);
  assert.ok(r.signals.length >= 1);
});

test('gift cards + secrecy text is a scam', () => {
  const r = analyzeWithRules("Hi it's Dean Whitaker, are you available? I need a quick favor. Buy 5 Apple gift cards and keep this between us.");
  assert.ok(cats(r).includes('money'));
  assert.ok(cats(r).includes('impersonation'));
  assert.equal(r.verdict, 'scam');
});

test('shorteners, subdomain tricks and link mismatches', () => {
  const r = analyzeWithRules('Go to bit.ly/abc or https://pepperdine.edu.secure-login.net/x or <a href="https://evil.example.co/login">https://pepperdine.edu/portal</a>');
  assert.ok(cats(r).includes('risky_link'));
  assert.ok(cats(r).includes('lookalike_domain'));
  assert.ok(cats(r).includes('link_mismatch'));
});

test('no false positives on common legit domains and words', () => {
  for (const host of ['mail.google.com', 'pepperdine.instructure.com', 'peppermint.com', 'groups.google.com', 'purchase.com', 'library.pepperdine.edu']) {
    assert.equal(inspectHost(host).findings.length, 0, host);
  }
  const r = analyzeWithRules('Email me at jane.doe@pepperdine.edu about the Node.js lab and README.md.');
  assert.equal(r.flags.length, 0);
});

test('risky attachments are flagged', () => {
  const r = analyzeWithRules('Please open the attached Invoice_4471.html and Setup.exe');
  assert.equal(r.flags.filter((f) => f.category === 'attachment').length, 2);
});

test('scrub redacts phone numbers, SSNs and recipients', () => {
  const s = scrub('To: joe@pepperdine.edu\nCall 310-555-0123. SSN 123-45-6789. ID 98765432');
  assert.ok(!s.text.includes('310-555-0123'));
  assert.ok(!s.text.includes('123-45-6789'));
  assert.ok(!s.text.includes('joe@pepperdine.edu'));
  assert.ok(s.redactions.length >= 3);
});

test('merge: AI flags are placed in the text and the blend respects hard evidence', () => {
  const text = 'From: Prof <prof@pepperdine-edu.org>\nI need you to log in so I can share your grade.';
  const rules = analyzeWithRules(text);
  const ai = {
    risk_score: 90, summary: 'Fake professor.', good_signs: [], actions: [],
    red_flags: [{ quote: 'log in so I can share your grade', category: 'credentials', severity: 'high', why: 'Login bait' },
      { quote: 'not in the text', category: 'context', severity: 'low', why: 'x' }],
  };
  const merged = mergeResults(text, rules, ai);
  const placed = merged.flags.find((f) => f.source === 'ai' && f.start != null);
  assert.ok(placed);
  assert.equal(text.slice(placed.start, placed.end), 'log in so I can share your grade');
  assert.ok(merged.flags.some((f) => f.start == null));
  assert.ok(merged.score >= 70);
  assert.equal(merged.verdict, 'scam');
});

test('blend: calm AI + calm rules stays low', () => {
  assert.ok(blendScores(5, 10, []) < 30);
});

test('locateQuote tolerates whitespace differences', () => {
  const loc = locateQuote('please\n  verify your   account now', 'verify your account');
  assert.ok(loc);
});

function cardFields(m) {
  const d = m.details || {};
  return [m.from?.name, m.from?.address, m.subject, m.body,
    ...(m.links || []).map((l) => l.text), ...(m.attachments || []).map((a) => a.name),
    d.mailedBy, d.signedBy, d.to, d.replyTo].filter(Boolean);
}

function checkLinks(id, m) {
  for (const l of m.links || []) assert.ok(m.body.includes(l.text), `${id}: link text "${l.text}" not in body`);
}

test('training content: every flag quote appears in the card', () => {
  const ids = new Set();
  for (const m of TRAINING_MESSAGES) {
    assert.ok(!ids.has(m.id), `duplicate id ${m.id}`);
    ids.add(m.id);
    checkLinks(m.id, m);
    const fields = cardFields(m);
    for (const f of m.flags) {
      assert.ok(fields.some((t) => t.includes(f.quote)), `${m.id}: quote "${f.quote}" not found`);
      assert.ok(FLAG_CATEGORY_KEYS.includes(f.category), `${m.id}: bad category ${f.category}`);
    }
    assert.equal(m.isPhish, m.flags.length > 0, `${m.id}: isPhish mismatch`);
    if (!m.isPhish) assert.ok(m.goodSigns?.length, `${m.id}: legit card needs goodSigns`);
  }
  const legit = TRAINING_MESSAGES.filter((m) => !m.isPhish).length;
  assert.ok(legit / TRAINING_MESSAGES.length >= 0.4, 'at least 40% of single cards should be legit');
});

test('spot-the-difference twins: flags live in the fake, and both sides look alike', () => {
  for (const t of TRAINING_TWINS) {
    assert.equal(t.type, 'twin');
    checkLinks(t.id, t.real);
    checkLinks(t.id, t.fake);
    const fields = cardFields(t.fake);
    for (const f of t.flags) assert.ok(fields.some((x) => x.includes(f.quote)), `${t.id}: quote "${f.quote}" not in fake`);
    assert.equal(t.real.channel, t.fake.channel, `${t.id}: both sides should use the same channel`);
    assert.ok(t.goodSigns?.length && t.compare?.length, `${t.id}: needs goodSigns and compare`);
  }
});

test('rounds: 10 rounds, 2 spot-the-difference, sides randomized, a real mix of legit cards', () => {
  for (let i = 0; i < 30; i++) {
    const round = buildRound();
    assert.equal(round.length, 10);
    const twins = round.filter((c) => c.type === 'twin');
    assert.equal(twins.length, 2);
    for (const t of twins) assert.ok(['a', 'b'].includes(t.phish) && t.a && t.b);
    const legit = round.filter((c) => c.type !== 'twin' && !c.isPhish).length;
    assert.ok(legit >= 3 && legit <= 5, `legit singles: ${legit}`);
  }
});

test('subtle tricks: transposed letters, Cyrillic lookalikes, Reply Y, swapped comma, fake support number', () => {
  assert.equal(analyzeWithRules('From: Handshake <notifications@joinhandsahke.com>').verdict, 'scam');
  assert.equal(analyzeWithRules('From: PayPal <service@p\u0430ypal.com>').verdict, 'scam');
  assert.ok(cats(analyzeWithRules('Update: https://usps.com-redeliver.info (Reply Y, then reopen this message to activate the link.)')).includes('risky_link'));
  assert.ok(cats(analyzeWithRules('Your refund of $1.240,00 is ready.')).includes('sloppy'));
  assert.ok(cats(analyzeWithRules('Questions? Call Tech Support at (310) 555-0143.')).includes('sender_spoof'));
  assert.equal(analyzeWithRules('Questions? Call Tech Support at 310.506.4357.').flags.length, 0);
  for (const host of ['pepperdine-graphic.com', 'onedrive.live.com', 'app.joinhandshake.com', 'na3.docusign.net']) {
    assert.equal(inspectHost(host).findings.length, 0, host);
  }
});

// ───────────── Stricter checker + generated questions ─────────────
import { generateSingle, generateTwin } from '../lib/generator.js';

test('unlabeled pasted sender with a digit + capital-I lookalike is a scam', () => {
  const r = analyzeWithRules(`Maya Chen (via Google Docs)
<drive-shares-dm-noreply@1googIe.com>
to me
Document shared with you: "CS 230 Lab 3 Report"

Open`);
  assert.equal(r.verdict, 'scam');
  assert.ok(r.flags.some((f) => f.quote.includes('1googIe.com')));
  assert.ok(cats(r).includes('sender_spoof'), 'display name says Google but the domain is not Google');
});

test('generated questions: 3000 cards are well-formed, and the checker never cries wolf on legit ones', () => {
  const legitFlagged = [];
  for (let i = 0; i < 3000; i++) {
    const level = 1 + (i % 3);
    const isPhish = i % 2 === 0;
    const c = generateSingle({ level, isPhish });
    assert.ok(c, `generator returned nothing for level ${level}`);
    const fields = cardFields(c);
    for (const f of c.flags) {
      assert.ok(fields.some((t) => t.includes(f.quote)), `${c.id}: quote "${f.quote}" not found`);
      assert.ok(FLAG_CATEGORY_KEYS.includes(f.category), `${c.id}: bad category ${f.category}`);
    }
    checkLinks(c.id, c);
    assert.equal(c.isPhish, c.flags.length > 0, `${c.id}: isPhish mismatch`);
    assert.ok(!/undefined|NaN/.test(JSON.stringify(c)), `${c.id}: contains undefined/NaN`);
    if (!c.isPhish) {
      assert.ok(c.goodSigns?.length, `${c.id}: legit card needs goodSigns`);
      const text = `${c.from.name} <${c.from.address || c.from.name}>\nSubject: ${c.subject || ''}\n\n${c.body}`;
      if (analyzeWithRules(text).verdict !== 'safe') legitFlagged.push(c.id);
    }
  }
  assert.deepEqual(legitFlagged, [], 'legit generated messages should not be flagged');
});

test('generated spot-the-difference pairs: same channel, flags in the fake side', () => {
  for (let i = 0; i < 600; i++) {
    const t = generateTwin({ level: 2 + (i % 2) });
    assert.ok(t);
    assert.equal(t.real.channel, t.fake.channel);
    const fields = cardFields(t.fake);
    for (const f of t.flags) assert.ok(fields.some((x) => x.includes(f.quote)), `${t.id}: "${f.quote}" not in fake`);
  }
});

test('no repeats: 40 games in a row never show the same question twice', () => {
  const seen = [];
  for (let game = 0; game < 40; game++) {
    const round = buildRound({ seen });
    assert.equal(round.length, 10);
    const topics = round.map((c) => c.topic || c.id);
    assert.equal(new Set(topics).size, topics.length, `game ${game}: same topic twice in one round`);
    for (const c of round) {
      assert.ok(!seen.includes(c.id), `game ${game}: repeated question ${c.id}`);
      seen.push(c.id);
    }
  }
});
