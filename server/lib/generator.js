// Procedural Spot the Phish questions.
//
// Every question = a realistic message template (Pepperdine IT, Financial Aid, Google Docs, PayPal,
// USPS, DocuSign, Handshake, Zoom...) + ONE subtle, visible trick (a swapped letter, a digit for a
// letter, a dash for a dot, a Cyrillic letter, a hidden link, a faked From line, one changed
// sentence...) + random details (names, amounts, dates, codes). The combinations run into the
// thousands, so players effectively never see the same question twice.
//
// Every card uses the same shape as the hand-written ones in shared/trainingMessages.js, and every
// flag quotes text that really appears in the card (a test checks thousands of generated cards).

import { domainToASCII } from 'node:url';
import { officialBrandOf } from './domains.js';

// ───────────── random helpers ─────────────
const rand = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rand(a.length)];
const pad2 = (n) => String(n).padStart(2, '0');
const digits = (n) => Array.from({ length: n }, () => rand(10)).join('');
const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[rand(16)]).join('');
const alnum = (n) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[rand(56)]).join('');

const FIRST = ['Maya', 'Ethan', 'Sofia', 'Liam', 'Ava', 'Noah', 'Priya', 'Mateo', 'Chloe', 'Daniel', 'Grace', 'Lucas',
  'Hannah', 'Omar', 'Isabella', 'Jordan', 'Camila', 'Tyler', 'Nina', 'Marcus', 'Leah', 'Caleb', 'Aria', 'Julian'];
const LAST = ['Chen', 'Park', 'Rivera', 'Nguyen', 'Patel', 'Johnson', 'Garcia', 'Kim', 'Silva', 'Brooks', 'Okafor',
  'Hughes', 'Ramos', 'Stein', 'Tanaka', 'Morales', 'Bennett', 'Foster', 'Alvarez', 'Hayes'];
const PROFS = [['Daniel', 'Reyes'], ['Laura', 'Bennett'], ['Samuel', 'Ortiz'], ['Rachel', 'Kim'], ['Thomas', 'Wright'],
  ['Elena', 'Marsh'], ['Victor', 'Huang'], ['Monica', 'Lee']];
const DEPTS = ['Computer Science', 'Mathematics', 'Biology', 'Economics', 'Psychology', 'Communication'];
const COURSES = ['CS 230 Lab 3 Report', 'BIO 210 Group Presentation', 'ECON 200 Case Study', 'COM 180 Speech Outline',
  'MATH 151 Study Guide', 'PHYS 210 Lab Data', 'Great Books Essay Draft', 'Data Science Project Proposal', 'PSYC 200 Survey Results'];
const COMPANIES = [
  { name: 'Coastline Labs', domain: 'coastlinelabs.com', hyphen: 'coastline-labs.com', slug: 'coastlinelabs', role: 'Data Analyst Intern' },
  { name: 'Harbor Analytics', domain: 'harboranalytics.com', hyphen: 'harbor-analytics.com', slug: 'harboranalytics', role: 'Software Engineering Intern' },
  { name: 'Tidewater Health', domain: 'tidewaterhealth.com', hyphen: 'tidewater-health.com', slug: 'tidewaterhealth', role: 'Product Design Intern' },
  { name: 'Sunset Robotics', domain: 'sunsetrobotics.io', hyphen: 'sunset-robotics.io', slug: 'sunsetrobotics', role: 'Machine Learning Intern' },
  { name: 'Canyon Financial', domain: 'canyonfinancial.com', hyphen: 'canyon-financial.com', slug: 'canyonfinancial', role: 'Finance Intern' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MONTHS = ['October', 'November', 'December'];
const clock = () => `${pick(DAYS)} ${1 + rand(12)}:${pad2(rand(60))} ${pick(['AM', 'PM'])}`;
const monthDay = () => `${pick(MONTHS)} ${2 + rand(26)}`;
const scamPhone = () => `+1 (${pick(['213', '323', '424', '626', '818', '786', '347', '917', '702', '469'])}) 555-01${pad2(rand(100))}`;
const cityLocal = () => pick(['Malibu, CA', 'Los Angeles, CA', 'Santa Monica, CA', 'Calabasas, CA']);
const cityFar = () => pick(['Houston, TX', 'Phoenix, AZ', 'Chicago, IL', 'Miami, FL', 'Denver, CO', 'Atlanta, GA']);
const device = () => pick(['Mac', 'Windows PC', 'iPhone', 'Android phone', 'iPad', 'Chromebook']);
const money = (min, max) => {
  const n = min + rand(max - min);
  const c = rand(100);
  return { us: `$${n.toLocaleString('en-US')}.${pad2(c)}`, eu: `$${n.toLocaleString('de-DE')},${pad2(c)}` };
};

function person() {
  const first = pick(FIRST);
  const last = pick(LAST);
  return { first, last, full: `${first} ${last}`, email: `${first}.${last}@pepperdine.edu`.toLowerCase() };
}

// ───────────── domain tricks ─────────────
const WORDS = ['secure', 'support', 'verify', 'account', 'login', 'help', 'portal', 'notice', 'services', 'update', 'auth', 'center', 'alerts', 'online'];
const ALT_TLDS = ['co', 'us', 'info', 'support', 'net', 'cc', 'site', 'help'];
const CYRILLIC = { a: 'а', e: 'е', o: 'о', c: 'с', p: 'р' };

function splitDomain(domain) {
  const p = domain.split('.');
  const tld = p.pop();
  const label = p.pop();
  return { sub: p.join('.'), label, tld };
}
const joinDomain = ({ sub, label, tld }) => [sub, label, tld].filter(Boolean).join('.');
const regOf = (domain) => { const d = splitDomain(domain); return `${d.label}.${d.tld}`; };

const positions = (s, test) => [...s].map((ch, i) => (test(ch, i) ? i : -1)).filter((i) => i >= 0);

// Each label trick returns { label, note, why } or null when it can't apply to this name.
const LABEL_TRICKS = {
  swap(l) {
    const idx = positions(l, (ch, i) => i >= 1 && i < l.length - 1 && /[a-z]/.test(ch) && /[a-z]/.test(l[i + 1]) && ch !== l[i + 1]);
    if (!idx.length) return null;
    const i = pick(idx);
    const fake = l.slice(0, i) + l[i + 1] + l[i] + l.slice(i + 2);
    return { label: fake, note: 'Two letters swapped', why: `Two letters are swapped: "${fake}" instead of "${l}".` };
  },
  drop(l) {
    let idx = positions(l, (ch, i) => i >= 1 && i < l.length - 1 && /[a-z]/.test(ch) && (l[i - 1] === ch || l[i + 1] === ch));
    if (!idx.length) idx = positions(l, (ch, i) => i >= 1 && i < l.length - 1 && /[a-z]/.test(ch));
    if (!idx.length || l.length < 5) return null;
    const i = pick(idx);
    const fake = l.slice(0, i) + l.slice(i + 1);
    return { label: fake, note: 'One letter missing', why: `One letter is missing: "${fake}" instead of "${l}".` };
  },
  double(l) {
    const idx = positions(l, (ch, i) => i >= 1 && i < l.length - 1 && /[a-z]/.test(ch) && l[i - 1] !== ch && l[i + 1] !== ch);
    if (!idx.length) return null;
    const i = pick(idx);
    const fake = l.slice(0, i + 1) + l[i] + l.slice(i + 1);
    return { label: fake, note: 'One extra letter', why: `There is an extra letter: "${fake}" instead of "${l}".` };
  },
  digit(l) {
    const map = { o: '0', l: '1', i: '1', e: '3', s: '5' };
    const idx = positions(l, (ch) => map[ch]);
    if (!idx.length) return null;
    const i = pick(idx);
    const fake = l.slice(0, i) + map[l[i]] + l.slice(i + 1);
    return { label: fake, note: `The number "${map[l[i]]}" instead of the letter "${l[i]}"`, why: `The letter "${l[i]}" was swapped for the number "${map[l[i]]}": "${fake}" is not "${l}".` };
  },
  rn(l) {
    const idx = positions(l, (ch) => ch === 'm');
    if (idx.length) {
      const i = pick(idx);
      const fake = `${l.slice(0, i)}rn${l.slice(i + 1)}`;
      return { label: fake, note: '"rn" pretending to be "m"', why: `"rn" (an r next to an n) is posing as an "m": "${fake}".` };
    }
    const w = positions(l, (ch) => ch === 'w');
    if (w.length) {
      const i = pick(w);
      const fake = `${l.slice(0, i)}vv${l.slice(i + 1)}`;
      return { label: fake, note: '"vv" pretending to be "w"', why: `Two v's ("vv") are posing as a "w": "${fake}".` };
    }
    return null;
  },
  capI(l) {
    const idx = positions(l, (ch) => ch === 'l');
    if (!idx.length) return null;
    const i = pick(idx);
    const fake = `${l.slice(0, i)}I${l.slice(i + 1)}`;
    return { label: fake, note: 'Capital I instead of lowercase l', why: `That is a capital "I", not a lowercase "l". In most fonts they look identical: "${fake}" is not "${l}".` };
  },
  lForI(l) {
    const idx = positions(l, (ch) => ch === 'i');
    if (!idx.length) return null;
    const i = pick(idx);
    const fake = `${l.slice(0, i)}l${l.slice(i + 1)}`;
    return { label: fake, note: 'Lowercase l instead of i', why: `An "l" is standing in for an "i": "${fake}" instead of "${l}".` };
  },
  cyrillic(l) {
    const idx = positions(l, (ch) => CYRILLIC[ch]);
    if (!idx.length) return null;
    const i = pick(idx);
    const fake = l.slice(0, i) + CYRILLIC[l[i]] + l.slice(i + 1);
    return { label: fake, note: `The "${l[i]}" is a Cyrillic letter that looks identical`, why: `One letter is from the Cyrillic alphabet. "${fake}" looks exactly like "${l}", but it is a different website. Hovering or the sender details show its real name, which starts with "xn--".`, unicode: true };
  },
};

// Tricks on a whole domain: the label tricks above, plus endings and dashes.
function fakeDomain(domain, trick) {
  const d = splitDomain(domain);
  if (LABEL_TRICKS[trick]) {
    const r = LABEL_TRICKS[trick](d.label);
    return r && { ...r, domain: joinDomain({ ...d, label: r.label }) };
  }
  if (trick === 'tld') {
    const alt = pick(ALT_TLDS.filter((t) => t !== d.tld));
    return { domain: joinDomain({ ...d, tld: alt }), note: `".${alt}" instead of ".${d.tld}"`, why: `Same name, different ending: ".${alt}" instead of ".${d.tld}". Anyone can register that.` };
  }
  if (trick === 'dash') {
    const alt = pick(['com', 'org', 'net', 'us', 'co']);
    const fake = joinDomain({ sub: d.sub, label: `${d.label}-${d.tld}`, tld: alt });
    return { domain: fake, note: 'A dash instead of a dot', why: `A dash instead of a dot: ${d.label}-${d.tld}.${alt} is a different website from ${d.label}.${d.tld}.` };
  }
  if (trick === 'append') {
    const w = pick(WORDS);
    const alt = pick(['com', 'net', 'co', 'info']);
    return { domain: joinDomain({ sub: d.sub, label: `${d.label}-${w}`, tld: alt }), note: `Extra word "-${w}"`, why: `An extra word was added: ${d.label}-${w}.${alt} is not owned by ${d.label}.${d.tld}.` };
  }
  return null;
}

// Hidden-link tricks: the link TEXT looks right; only hovering shows the real destination.
function fakeHref(realUrl, trick) {
  const u = new URL(realUrl);
  const host = u.hostname;
  const rest = realUrl.slice(realUrl.indexOf(host) + host.length);
  if (trick === 'subdomain') {
    const fakeHost = `${host}.${pick(WORDS)}-${pick(['view', 'share', 'portal', 'access', 'link'])}.${pick(['link', 'info', 'co', 'app', 'site', 'net'])}`;
    return { href: `https://${fakeHost}${rest}`, host: fakeHost, note: 'Extra words after the real name', why: `It looks right, but hovering shows it really goes to ${fakeHost}. The real owner is the last part: ${regOf(fakeHost)}.` };
  }
  if (trick === 'at') {
    const fakeHost = `${pick(WORDS)}-${pick(['portal', 'login', 'verify', 'access'])}.${pick(['co', 'net', 'info', 'app'])}`;
    return { href: `https://${host}@${fakeHost}${rest || '/'}`, host: fakeHost, note: 'Everything before the "@" is ignored', mode: 'tokens', why: `Hovering shows "${host}@${fakeHost}". Browsers ignore everything before the "@", so it really goes to ${fakeHost}.` };
  }
  if (trick === 'cyrillicLink') {
    const d = splitDomain(host);
    const r = LABEL_TRICKS.cyrillic(d.label);
    if (!r) return null;
    const unicodeHost = joinDomain({ ...d, label: r.label });
    const ascii = domainToASCII(unicodeHost);
    return { href: `https://${ascii}${rest}`, host: ascii, text: `https://${unicodeHost}${rest}`, note: r.note, why: `The link text looks identical, but one letter is Cyrillic. Hovering shows its real name: ${ascii}.` };
  }
  return null;
}

function shortHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

// "Combo" = template + trick + variant. Rounds prefer combos the player has never seen,
// then any card with an unseen id; a full repeat only happens if everything else is exhausted.
export const comboOf = (id) => id.split(':').slice(0, 4).join(':');

const relay = () => `${pick(['mx', 'smtp', 'mail', 'out'])}${1 + rand(9)}.${pick(['bulk-relay', 'sendfast', 'mailblast', 'secure-smtp', 'notify-hub'])}.${pick(['net', 'io', 'co', 'xyz'])}`;
const freeMail = (local) => `${local.replace(/[^a-z0-9.]/gi, '').toLowerCase()}.${pick(['desk', 'office', 'team', 'help'])}${rand(90) + 10}@${pick(['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me'])}`;

// ───────────── generic email engine ─────────────
// A template supplies realistic content; the engine applies one trick and writes the flags.
const EMAIL_DOMAIN_TRICKS = { 1: ['swap', 'drop', 'double', 'digit', 'dash', 'append', 'tld'], 2: ['rn', 'capI', 'lForI', 'cyrillic'] };
const EMAIL_LINK_TRICKS = ['subdomain', 'at', 'cyrillicLink'];

function emailCard(tpl, level, isPhish, trick) {
  const p = tpl.params();
  const sender = tpl.sender(p);
  const realUrl = tpl.link ? tpl.link.url(p) : null;
  // Each template has several [legit sentence, scam sentence, category, why] pairs. The pick is stored
  // on p so both sides of a spot-the-difference pair use the same one.
  const wordings = tpl.wording ? tpl.wording(p) : null;
  if (wordings && p.wi === undefined) p.wi = rand(wordings.length);
  const wording = wordings ? wordings[p.wi] : null;
  const signature = tpl.signature ? tpl.signature(p) : null; // [legit, typo]
  const m = {
    phrase: wording ? wording[0] : '',
    amount: p.amount ? p.amount.us : '',
    sig: signature ? signature[0] : '',
    extra: '',
    linkText: tpl.link ? (tpl.link.text === 'url' ? realUrl : tpl.link.text) : '',
  };
  let domain = sender.domain;
  let href = realUrl;
  let details = null;
  const flags = [];
  const compare = [];
  const why = [];
  let marker = '';

  const linkFlag = (host, reason) => flags.push({ quote: m.linkText, category: 'link_mismatch', severity: 'high', why: reason || `The link really goes to ${host}, not where it says.` });

  if (isPhish) {
    if (EMAIL_DOMAIN_TRICKS[1].includes(trick) || EMAIL_DOMAIN_TRICKS[2].includes(trick) || trick === 'hyphen') {
      const f = trick === 'hyphen' ? tpl.hyphen(p) : fakeDomain(domain, trick);
      if (!f || f.domain === domain) return null;
      // Never "fake" a domain the brand really owns (e.g. netflix.net is Netflix's).
      if (officialBrandOf(domainToASCII(f.domain)) && officialBrandOf(domainToASCII(f.domain)) === officialBrandOf(domain)) return null;
      const realReg = regOf(domain);
      const fakeReg = regOf(f.domain);
      domain = f.domain;
      marker = f.domain;
      if (f.unicode) details = { mailedBy: domainToASCII(f.domain), signedBy: domainToASCII(f.domain) };
      flags.push({ quote: f.domain, category: 'lookalike_domain', severity: 'high', why: `${f.why} The real address ends in ${realReg}.` });
      const u = realUrl ? new URL(realUrl) : null;
      if (u && u.hostname.endsWith(realReg)) {
        const fakeHost = u.hostname.slice(0, -realReg.length) + domainToASCII(fakeReg);
        href = realUrl.replace(u.hostname, fakeHost);
        linkFlag(fakeHost, `The link goes to ${fakeHost}, the same fake domain, not ${u.hostname}.`);
      }
      compare.push({ label: 'Sender domain', real: realReg, fake: fakeReg, note: f.note });
      why.push(f.why);
    } else if (EMAIL_LINK_TRICKS.includes(trick)) {
      if (!realUrl) return null;
      const f = fakeHref(realUrl, trick);
      if (!f) return null;
      href = f.href;
      marker = f.host;
      if (f.text) m.linkText = f.text;
      // A perfect-looking From line with a fake link means the From line was forged:
      // the sender details show it wasn't mailed or signed by the real domain.
      const r = relay();
      details = { mailedBy: r, signedBy: null };
      linkFlag(f.host, f.why);
      flags.push({ quote: r, category: 'sender_spoof', severity: 'high', why: `In the sender details, it was mailed by ${r} and not signed by ${regOf(domain)}. The From line was faked.` });
      compare.push({ label: 'Where the link really goes', real: realUrl, fake: href, note: f.note, mode: f.mode });
      why.push(f.why);
    } else if (trick === 'headers') {
      const reply = freeMail(sender.local);
      const r = relay();
      details = { replyTo: reply, mailedBy: r, signedBy: null };
      marker = reply;
      m.extra = tpl.replyLine || 'Questions? Just reply to this email.';
      flags.push({ quote: reply, category: 'sender_spoof', severity: 'high', why: `The From line says ${regOf(domain)}, but replies go to ${reply.split('@')[1]}. From lines can be faked; Reply-To shows who you are really talking to.` });
      flags.push({ quote: r, category: 'sender_spoof', severity: 'high', why: `Mailed by ${r} and not signed by ${regOf(domain)}: it didn't come from the real sender.` });
      compare.push({ label: 'Your reply goes to', real: `${sender.local}@${domain}`, fake: reply, plain: true });
      why.push('The From line looks perfect, but the sender details (Reply-To and mailed-by) show it came from somewhere else.');
    } else if (trick === 'wording') {
      if (!wording) return null;
      m.phrase = wording[1];
      marker = `w${p.wi}`;
      flags.push({ quote: wording[1], category: wording[2], severity: 'high', why: wording[3] });
      if (wording[0]) compare.push({ label: 'The sentence that changed', real: wording[0], fake: wording[1], mode: 'tokens' });
      why.push(`The sender and links check out. The scam is in one sentence: "${wording[1]}"`);
      if (tpl.wordingHeaders) {
        const reply = freeMail(sender.local);
        details = { replyTo: reply, mailedBy: reply.split('@')[1], signedBy: reply.split('@')[1] };
        flags.push({ quote: reply, category: 'sender_spoof', severity: 'high', why: `Your reply would go to ${reply}, not to ${sender.local}@${domain}.` });
      }
    } else if (trick === 'amount') {
      if (!p.amount || !realUrl) return null;
      m.amount = p.amount.eu;
      const f = fakeHref(realUrl, 'subdomain');
      href = f.href;
      marker = f.host;
      flags.push({ quote: p.amount.eu, category: 'sloppy', severity: 'medium', why: `The dot and comma are swapped (${p.amount.eu} instead of ${p.amount.us}). A US office wouldn't write it that way.` });
      linkFlag(f.host, f.why);
      compare.push({ label: 'Amount', real: p.amount.us, fake: p.amount.eu, note: 'Comma and dot swapped' });
      compare.push({ label: 'Where the link really goes', real: realUrl, fake: href });
      why.push('Two small tells: the amount is written the European way, and the link goes somewhere else.');
    } else if (trick === 'signature') {
      if (!signature || !realUrl) return null;
      m.sig = signature[1];
      const f = fakeHref(realUrl, 'subdomain');
      href = f.href;
      marker = signature[1];
      flags.push({ quote: signature[1], category: 'sloppy', severity: 'medium', why: `"${signature[1]}": a real office wouldn't misspell its own name.` });
      linkFlag(f.host, f.why);
      compare.push({ label: 'Signature', real: signature[0], fake: signature[1] });
      why.push('A typo in the signature, plus a link that goes somewhere else.');
    } else if (tpl.customTricks?.[trick]) {
      const r = tpl.customTricks[trick](p, m);
      if (!r) return null;
      href = r.href ?? href;
      marker = r.marker || trick;
      if (r.details) details = r.details;
      flags.push(...r.flags);
      if (r.compare) compare.push(...r.compare);
      why.push(r.why);
    } else {
      return null;
    }
  }

  const { subject, body, attachments } = tpl.render(p, m);
  const links = tpl.link && body.includes(m.linkText) ? [{ text: m.linkText, href }] : [];
  const variant = p.variant ?? 0;
  const card = {
    id: `g:${tpl.key}:${isPhish ? trick : 'legit'}:${variant}:${marker || shortHash(JSON.stringify(p))}`,
    generated: true,
    topic: tpl.key,
    level,
    channel: 'email',
    isPhish,
    time: clock(),
    from: { name: sender.name, address: `${sender.local}@${domain}` },
    subject,
    body,
    links,
    flags: isPhish ? flags : [],
    explanation: isPhish ? `${why.join(' ')} ${tpl.tip}` : `Legit. ${tpl.legitWhy || 'The sender, the signature and every link really belong to who it claims to be, and it asks for nothing unusual.'}`,
  };
  if (attachments) card.attachments = attachments;
  if (details) card.details = details;
  if (isPhish && compare.length) card.compare = compare;
  if (!isPhish) card.goodSigns = tpl.goodSigns(p);
  const ctx = isPhish ? tpl.phishContext?.(p) : tpl.legitContext?.(p);
  if (ctx) card.context = ctx;
  card._params = p;
  return card;
}

// ───────────── email templates ─────────────
const PEPP_TRICKS = { 1: ['swap', 'drop', 'double', 'digit', 'dash', 'append', 'tld'], 2: ['lForI', 'cyrillic', 'subdomain', 'at', 'headers'] };

const EMAIL_TEMPLATES = [
  {
    key: 'password', topic: 'Pepperdine password',
    params: () => ({ first: pick(FIRST), days: 3 + rand(12), date: monthDay(), variant: rand(2) }),
    sender: () => ({ name: 'Pepperdine Information Technology', local: 'it.notifications', domain: 'pepperdine.edu' }),
    link: { url: () => 'https://password.pepperdine.edu', text: 'url' },
    wording: () => [
      ['please change your password', 'please confirm your current password', 'credentials', 'Real IT asks you to CHANGE your password on its own site. "Confirm your current password" is how it gets stolen.'],
      ['change it at the link below', 'reply to this email with your current password so we can carry it over', 'credentials', 'IT will never ask you to email your password, for any reason.'],
      ['please choose a new password', 'please sign in with your current password to keep it active', 'credentials', 'Passwords don\'t need to be "kept active". Signing in from an email link is how they get stolen.'],
    ],
    render: (p, m) => (p.variant === 0 ? {
      subject: `Your Pepperdine password expires in ${p.days} days`,
      body: `Hello,\n\nYour Pepperdine account password will expire in ${p.days} days. To avoid losing access to email and campus systems, ${m.phrase} before it expires.\n\nChange password: ${m.linkText}\n\nFor help, contact Tech Support at 310.506.4357 (24/7).${m.extra ? `\n\n${m.extra}` : ''}\n\nPepperdine Information Technology`,
    } : {
      subject: 'Action needed: scheduled password update',
      body: `Hi ${p.first},\n\nAs part of our regular security schedule, ${m.phrase} by ${p.date}. Accounts that are not updated will be locked until you contact Tech Support.\n\nUpdate here: ${m.linkText}\n\nThank you for helping keep Pepperdine secure.${m.extra ? `\n\n${m.extra}` : ''}\n\nPepperdine Information Technology`,
    }),
    goodSigns: () => ['Sent, mailed and signed by pepperdine.edu', 'The link really goes to password.pepperdine.edu', 'Asks you to change your password on the official site, not to "confirm" it'],
    tricks: { ...PEPP_TRICKS, 3: ['wording', 'headers'] },
    tip: 'When in doubt, skip the link: type password.pepperdine.edu yourself or call Tech Support at 310.506.4357.',
  },
  {
    key: 'finaid', topic: 'Financial Aid',
    params: () => ({ first: pick(FIRST), amount: money(1000, 3800), term: pick(['Fall 2026', 'Spring 2027']), date: monthDay(), variant: rand(2) }),
    sender: () => ({ name: 'Pepperdine Financial Aid', local: 'finaid', domain: 'pepperdine.edu' }),
    link: { url: () => 'https://pepperdine.edu/financial-aid/refunds', text: 'View refund details' },
    wording: () => [
      ['review your refund in the student portal', 'confirm your banking details by replying to this email', 'personal_info', 'Financial Aid never asks for banking details by email. Changing where your money goes is the whole point of this scam.'],
      ['check your direct deposit settings in the student portal', 'send us your bank routing and account numbers', 'personal_info', 'No real office asks for routing and account numbers by email.'],
      ['review the details in the student portal', 'enter your Pepperdine password on the refund page to release it', 'credentials', 'Your password is never needed to "release" money. That page steals it.'],
    ],
    signature: () => ['Pepperdine University', pick(['Pepperdine Univeristy', 'Pepperdine Universty', 'Peppredine University'])],
    replyLine: 'If you have questions, simply reply to this email.',
    render: (p, m) => (p.variant === 0 ? {
      subject: `Your ${p.term} refund is ready`,
      body: `Hello,\n\nYour ${p.term} financial aid refund of ${m.amount} has been approved and will be sent by direct deposit. Please ${m.phrase} within 3 business days.\n\n${m.linkText}${m.extra ? `\n\n${m.extra}` : ''}\n\nOffice of Financial Assistance\n${m.sig}`,
    } : {
      subject: `Disbursement update: ${p.term}`,
      body: `Hi ${p.first},\n\nA refund of ${m.amount} from your ${p.term} aid package is scheduled for ${p.date}. To make sure it arrives on time, please ${m.phrase}.\n\n${m.linkText}${m.extra ? `\n\n${m.extra}` : ''}\n\nOffice of Financial Assistance\n${m.sig}`,
    }),
    goodSigns: () => ['Sent, mailed and signed by pepperdine.edu', 'The link stays on pepperdine.edu', 'Points you to the student portal instead of asking for bank details'],
    tricks: { 1: ['swap', 'drop', 'double', 'dash', 'append'], 2: ['lForI', 'subdomain', 'at', 'headers', 'amount', 'signature'], 3: ['wording', 'headers'] },
    tip: 'Check refunds by logging in to the student portal yourself, never through an email link.',
  },
  {
    key: 'registrar', topic: 'Registrar',
    params: () => ({ date: monthDay(), variant: 0 }),
    sender: () => ({ name: 'Office of the Registrar', local: 'registrar', domain: 'pepperdine.edu' }),
    link: { url: () => 'https://pepperdine.edu/registrar/enrollment', text: 'Review enrollment status' },
    wording: () => [
      ['No action is needed if your information is correct.', 'To avoid a hold, verify your identity with your Pepperdine username and password.', 'credentials', 'The Registrar never asks for your password. A "hold" threat plus a login request is the scam recipe.'],
      ['If you see a hold, contact the office that placed it.', 'Holds are cleared automatically once you pay the $25 processing fee by card.', 'money', 'The Registrar does not clear holds with card payments through an email.'],
      ['You can check holds in the student portal.', 'Reply with your student ID and date of birth so we can confirm your record.', 'personal_info', 'The Registrar already has your records. Never email your ID and birthday.'],
    ],
    signature: () => ['Pepperdine University', pick(['Pepperdine Univeristy', 'Pepperdine Universtiy', 'Pepperdine Unversity'])],
    render: (p, m) => ({
      subject: `Spring 2027 registration opens ${p.date}`,
      body: `Hello,\n\nSpring 2027 registration opens on ${p.date}. Before then, please review your enrollment status and any holds on your account. ${m.phrase}\n\n${m.linkText}${m.extra ? `\n\n${m.extra}` : ''}\n\nOffice of the Registrar\n${m.sig}\n24255 Pacific Coast Highway, Malibu, CA 90263`,
    }),
    goodSigns: () => ['Sent, mailed and signed by pepperdine.edu', 'The link stays on pepperdine.edu', 'No login request and no threats'],
    tricks: { ...PEPP_TRICKS, 2: [...PEPP_TRICKS[2], 'signature'], 3: ['wording'] },
    tip: 'Check holds by opening the student portal yourself from a bookmark.',
  },
  {
    key: 'library', topic: 'Payson Library',
    params: () => ({ date: monthDay(), book: pick(["Computer Systems: A Programmer's Perspective", 'Introduction to Algorithms', 'Calculus: Early Transcendentals', 'The Elements of Statistical Learning', 'Physics for Scientists and Engineers', 'The Republic']), variant: 0 }),
    sender: () => ({ name: 'Payson Library', local: 'library.notices', domain: 'pepperdine.edu' }),
    link: { url: () => 'https://library.pepperdine.edu/account', text: 'url' },
    wording: () => [
      ['You can renew it from your library account', 'To avoid a $45.00 replacement charge, pay the late fee by card', 'money', 'The library never collects fees by card through an email link. The "fee" is how they get your card number.'],
      ['Renew online', 'Confirm your library card by signing in with your Pepperdine password', 'credentials', 'Renewing a book never needs your password through an email link.'],
      ['Check your due dates any time', 'Pay the overdue balance now to keep borrowing', 'money', 'Payson Library does not collect payments through email links.'],
    ],
    render: (p, m) => ({
      subject: `Reminder: 1 item due ${p.date}`,
      body: `Hello,\n\nThis is a friendly reminder that the following item is due on ${p.date}:\n\n• ${p.book}\n\n${m.phrase}: ${m.linkText}\n\nIf you have already returned it, please ignore this message.\n\nPayson Library`,
    }),
    goodSigns: () => ['Sent, mailed and signed by pepperdine.edu', 'The link goes to library.pepperdine.edu', 'No payment or password request'],
    tricks: { 1: ['swap', 'drop', 'double', 'dash', 'append'], 2: ['lForI', 'subdomain', 'cyrillic'], 3: ['wording'] },
    tip: 'Check your library account by going to library.pepperdine.edu yourself.',
  },
  {
    key: 'drive', topic: 'Google Docs share',
    params: () => ({ mate: person(), course: pick(COURSES), doc: alnum(10), variant: 0 }),
    sender: (p) => ({ name: `${p.mate.full} (via Google Docs)`, local: 'drive-shares-dm-noreply', domain: 'google.com' }),
    link: { url: (p) => `https://docs.google.com/document/d/${p.doc}/edit?usp=sharing`, text: 'Open' },
    render: (p, m) => ({
      subject: `Document shared with you: "${p.course}"`,
      body: `${p.mate.full} (${p.mate.email}) has shared the following document:\n\n${p.course}\n\n${m.linkText}\n\nGoogle LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA\nYou have received this email because ${p.mate.email} shared a document with you from Google Docs.`,
    }),
    legitContext: (p) => `${p.mate.first} from your group said they would share "${p.course}" today.`,
    phishContext: (p) => (Math.random() < 0.5 ? `${p.mate.first} from your group said they would share "${p.course}" today.` : null),
    goodSigns: () => ['Sender is google.com, spelled correctly', 'The Open button goes to docs.google.com/document', 'Matches what your classmate told you'],
    tricks: { 1: ['digit', 'drop', 'double', 'swap', 'append', 'tld'], 2: ['capI', 'cyrillic', 'subdomain', 'at'], 3: ['form'] },
    customTricks: {
      form: (p, m) => {
        const href = `https://docs.google.com/forms/d/e/1FAIpQL${alnum(12)}/viewform`;
        return {
          href, marker: 'form',
          details: { to: 'undisclosed-recipients:;' },
          flags: [
            { quote: 'undisclosed-recipients:;', category: 'context', severity: 'medium', why: 'It went to a hidden list of people. Hacked accounts blast the same share email to everyone in their contacts.' },
            { quote: m.linkText, category: 'link_mismatch', severity: 'high', why: 'It says it opens a document, but the link is a Google Form (docs.google.com/forms) that asks for your password. Anyone can make one.' },
          ],
          compare: [{ label: 'Where "Open" really goes', real: `https://docs.google.com/document/d/${p.doc}/edit`, fake: href, plain: true, note: 'A real shared file opens on /document, never on /forms' }],
          why: 'This one really came through Google, from a hacked account. The clues: a hidden recipient list, and an "Open" button that leads to a Google Form instead of a document.',
        };
      },
    },
    tip: "If a share looks off, open Google Drive yourself and look in \"Shared with me\".",
  },
  {
    key: 'google', topic: 'Google security alert',
    params: () => ({ device: device(), city: cityLocal(), variant: 0 }),
    sender: () => ({ name: 'Google', local: 'no-reply', domain: 'accounts.google.com' }),
    link: { url: () => 'https://myaccount.google.com/notifications', text: 'Check activity' },
    wording: () => [
      ["If this was you, you don't need to do anything.", 'If this was you, confirm it by entering your password on the next page.', 'credentials', "Google's real alerts never ask you to enter your password to confirm a sign-in."],
      ['If this was you, you can ignore this message.', 'If this was you, reply with the verification code we just sent to your phone.', 'mfa_code', 'Google never asks you to send it a code. Whoever has the code can get into your account.'],
      ["You don't need to take any action.", 'To keep your account active, sign in again and re-enter your password within 24 hours.', 'credentials', 'A deadline plus "re-enter your password" is how fake alerts steal logins.'],
    ],
    render: (p, m) => ({
      subject: `Security alert: New sign-in on ${p.device}`,
      body: `A new sign-in on ${p.device}\n\nWe noticed a new sign-in to your Google Account on a ${p.device} near ${p.city}. ${m.phrase} If not, we'll help you secure your account.\n\n${m.linkText}\n\nYou received this email to let you know about important changes to your Google Account and services.`,
    }),
    legitContext: (p) => `You just signed in on your new ${p.device}.`,
    phishContext: (p) => `You just signed in on your new ${p.device}.`,
    goodSigns: () => ['Sent from accounts.google.com and signed by it', 'The button goes to myaccount.google.com', 'Tells you that you do not need to do anything'],
    tricks: { 1: ['digit', 'drop', 'double', 'append', 'dash'], 2: ['capI', 'cyrillic', 'subdomain', 'at'], 3: ['wording'] },
    tip: 'Check sign-ins by opening myaccount.google.com yourself.',
  },
  {
    key: 'onedrive', topic: 'Microsoft OneDrive',
    params: () => ({ first: pick(FIRST), pct: 90 + rand(10), variant: 0 }),
    sender: () => ({ name: 'Microsoft account team', local: 'account-security-noreply', domain: 'accountprotection.microsoft.com' }),
    link: { url: () => 'https://account.microsoft.com/storage', text: 'Review your storage' },
    wording: () => [
      ['You can also free up space by deleting files you no longer need.', 'To keep your files, verify your account and payment details within 24 hours.', 'credentials', 'A storage warning with a deadline and a "verify your account" request is a classic lure.'],
      ['You can get more storage anytime from your account page.', 'Your files will be deleted in 48 hours unless you confirm your payment details.', 'threat', 'Threatening to delete your files is a scare tactic to get your card number.'],
      ['Tip: empty your recycle bin to free up space.', 'To avoid losing your photos, sign in with your Microsoft password on the next page.', 'credentials', 'Fake storage warnings exist to collect your Microsoft password.'],
    ],
    render: (p, m) => ({
      subject: `Your OneDrive storage is ${p.pct}% full`,
      body: `Hi ${p.first},\n\nYour OneDrive is almost full (${p.pct}% of 5 GB used). Once you reach your limit, you won't be able to upload, edit or sync new files.\n\n${m.linkText}\n\n${m.phrase}\n\nThanks,\nThe Microsoft account team`,
    }),
    legitContext: () => 'You use a personal OneDrive account for your photos.',
    goodSigns: () => ['Sent from microsoft.com and signed by it', 'The button goes to account.microsoft.com', 'No deadline, no request for payment details'],
    tricks: { 1: ['drop', 'double', 'swap', 'append', 'tld'], 2: ['rn', 'cyrillic', 'subdomain'], 3: ['wording'] },
    tip: 'If you use OneDrive, check storage by opening the app yourself.',
  },
  {
    key: 'docusign', topic: 'DocuSign',
    params: () => ({ na: 1 + rand(4), code: hex(5), date: monthDay(), doc: pick(['Student Employment Offer – Fall 2026.pdf', 'Direct Deposit Authorization.pdf', 'Student Worker Agreement.pdf', 'W-4 Tax Withholding Form.pdf']), variant: 0 }),
    sender: (p) => ({ name: 'Pepperdine Human Resources via DocuSign', local: `dse_na${p.na}`, domain: 'docusign.net' }),
    link: { url: (p) => `https://na${p.na}.docusign.net/Signing/EmailStart.aspx?a=${p.code}`, text: 'REVIEW DOCUMENT' },
    render: (p, m) => ({
      subject: `Please DocuSign: ${p.doc}`,
      body: `Pepperdine Human Resources sent you a document to review and sign.\n\n${m.linkText}\n\n${p.doc}\n\nPlease complete by ${p.date}.\n\nDo Not Share This Email\nThis email contains a secure link to DocuSign. Please do not share this email, link, or access code with others.`,
    }),
    legitContext: () => 'You accepted a campus job last week, and HR told you a DocuSign would arrive.',
    phishContext: () => (Math.random() < 0.5 ? 'You accepted a campus job last week, and HR told you a DocuSign would arrive.' : null),
    goodSigns: () => ['Sender is docusign.net, spelled correctly', 'The button goes to a docusign.net address', 'You were told to expect it'],
    tricks: { 1: ['drop', 'swap', 'double', 'digit', 'append', 'tld'], 2: ['cyrillic', 'subdomain', 'lForI'] },
    tip: 'Real DocuSign email comes from docusign.net. When unsure, ask HR directly.',
  },
  {
    key: 'handshake', topic: 'Handshake',
    params: () => ({ first: pick(FIRST), co: pick(COMPANIES), num: digits(6), phone: scamPhone(), variant: 0 }),
    sender: () => ({ name: 'Handshake', local: 'notifications', domain: 'joinhandshake.com' }),
    link: { url: (p) => `https://app.joinhandshake.com/messages/${p.num}`, text: 'View message' },
    wording: (p) => [
      ['Please reply through Handshake with a few times that work.', `Please text me at ${p.phone} and send a photo of your ID for our background check.`, 'personal_info', 'Real recruiters keep the conversation on Handshake and never ask for your ID before an interview.'],
      ['You can book a time on my Handshake calendar.', 'We will send you a check for equipment before your start date, so please reply with your home address.', 'job_scam', 'The fake-check scam: they send a check, you buy "equipment", the check bounces and you owe the money.'],
      ['Looking forward to chatting!', 'The next step is a $60 background-check fee, which we refund after your first paycheck.', 'money', 'Real employers never charge you to be hired.'],
    ],
    render: (p, m) => ({
      subject: `${p.co.name} sent you a message`,
      body: `${p.co.name} sent you a message\n\n"Hi ${p.first}! We reviewed your profile and think you'd be a great fit for our ${p.co.role} role (Summer 2027). Are you free for a 15-minute call this week? ${m.phrase}"\n\n${m.linkText}\n\nYou're receiving this email because you have a Handshake account.`,
    }),
    legitContext: (p) => `You applied to ${p.co.name} on Handshake last week.`,
    phishContext: (p) => `You applied to ${p.co.name} on Handshake last week.`,
    goodSigns: () => ['Sender is joinhandshake.com, spelled correctly', 'The button goes to app.joinhandshake.com', 'Keeps the conversation on Handshake'],
    tricks: { 1: ['swap', 'drop', 'double', 'digit', 'append', 'tld'], 2: ['cyrillic', 'subdomain', 'lForI'], 3: ['wording'] },
    tip: 'Open the Handshake app yourself to read messages.',
  },
  {
    key: 'zoom', topic: 'interview invite',
    params: () => {
      const co = pick(COMPANIES);
      const [f, l] = [pick(FIRST), pick(LAST)];
      return { first: pick(FIRST), co, meet: `8${digits(10)}`, day: pick(WEEKDAYS), hour: `${1 + rand(5)}:${pick(['00', '30'])} PM`, interviewer: `${f} ${l}`, title: pick(['Analytics Lead', 'Engineering Manager', 'Senior Recruiter', 'Design Lead']), variant: 0 };
    },
    sender: (p) => ({ name: `${p.co.name} Recruiting`, local: 'recruiting', domain: p.co.domain }),
    link: { url: (p) => `https://${p.co.slug}.zoom.us/j/${p.meet}`, text: 'url' },
    wording: () => [
      ['', 'Before joining, please install the updated meeting plugin: ZoomInstaller_v6.2.pkg', 'attachment', 'Zoom never asks you to install a "plugin" from an email. A .pkg file installs software on a Mac: this is malware.'],
      ['', 'Please sign in to Zoom with your Pepperdine email and password using the link above to confirm your spot.', 'credentials', 'Joining a Zoom call never needs your Pepperdine password.'],
      ['', 'To complete onboarding, please reply with a photo of your ID before the interview.', 'personal_info', 'No real employer needs your ID before an interview.'],
    ],
    hyphen: (p) => ({ domain: p.co.hyphen, note: 'One extra dash', why: `A dash the real company doesn't use: ${p.co.hyphen} is not ${p.co.domain}.` }),
    render: (p, m) => ({
      subject: `Interview confirmed: ${p.co.role}, ${p.day} ${p.hour}`,
      body: `Hi ${p.first},\n\nYour interview is confirmed for ${p.day} at ${p.hour} (Pacific). You'll meet with ${p.interviewer}, ${p.title}.\n\nJoin Zoom Meeting\n${m.linkText}\nMeeting ID: ${p.meet.slice(0, 3)} ${p.meet.slice(3, 7)} ${p.meet.slice(7)}\n${m.phrase ? `\n${m.phrase}\n` : ''}\nSee you ${p.day}!\n${p.co.name} Recruiting`,
    }),
    // The company's real domain is part of the context, so a lookalike of it is fair to spot.
    legitContext: (p) => `You have a video interview with ${p.co.name} (their website is ${p.co.domain}) on ${p.day} at ${p.hour}.`,
    phishContext: (p) => `You have a video interview with ${p.co.name} (their website is ${p.co.domain}) on ${p.day} at ${p.hour}.`,
    goodSigns: (p) => [`Sender is ${p.co.domain}, the company's real domain`, `The link really goes to ${p.co.slug}.zoom.us`, 'Nothing to download or install'],
    tricks: { 1: ['hyphen', 'swap', 'drop', 'tld', 'append'], 2: ['subdomain'], 3: ['wording'] },
    tip: 'Join interviews from the calendar invite or the Zoom app, and never install software an email sends you.',
  },
  {
    key: 'paypal', topic: 'PayPal',
    params: () => ({ first: pick(FIRST), device: device(), browser: pick(['Chrome', 'Safari', 'Edge', 'Firefox']), city: cityFar(), variant: 0 }),
    sender: () => ({ name: 'PayPal', local: 'service', domain: 'paypal.com' }),
    link: { url: () => 'https://www.paypal.com/myaccount/security', text: 'url' },
    wording: () => [
      ['If this was you, you can ignore this email.', 'To keep your account open, confirm your card number and billing address today.', 'personal_info', 'PayPal already has your card on file. Asking you to "confirm" it by email is how card numbers get stolen.'],
      ["If this was you, there's nothing else you need to do.", 'If this was you, confirm by replying with the 6-digit code we sent to your phone.', 'mfa_code', 'PayPal never asks for codes by email. That code is the key to your account.'],
      ['If this was you, no action is needed.', 'Your account has been limited. Upload a photo of your ID and card to restore access.', 'personal_info', '"Limited account" plus "upload your ID and card" is identity theft.'],
    ],
    render: (p, m) => ({
      subject: 'We noticed a new login to your account',
      body: `Hi ${p.first},\n\nWe noticed a login to your PayPal account from a new device.\n\nDevice: ${p.device} · ${p.browser}\nLocation: ${p.city}\n\n${m.phrase} If this wasn't you, please secure your account:\n\n${m.linkText}\n\nThanks,\nPayPal`,
    }),
    legitContext: (p) => `You just logged in to PayPal on a ${p.device} while traveling.`,
    goodSigns: () => ['Sender is paypal.com, spelled correctly', 'The link really goes to www.paypal.com', 'Asks for nothing'],
    tricks: { 1: ['swap', 'drop', 'double', 'digit', 'append', 'tld'], 2: ['capI', 'cyrillic', 'subdomain', 'at'], 3: ['wording'] },
    tip: 'Check your account by typing paypal.com yourself or opening the app.',
  },
  {
    key: 'amazon', topic: 'Amazon order',
    params: () => ({ first: pick(FIRST), item: pick(['USB-C charging cable', 'wireless earbuds', 'TI-84 Plus graphing calculator', 'dorm desk lamp', 'laptop sleeve (14-inch)', 'notebook set (5-pack)']), order: `11${digits(1)}-${digits(7)}-${digits(7)}`, eta: `${pick(WEEKDAYS)}, ${monthDay()}`, variant: 0 }),
    sender: () => ({ name: 'Amazon.com', local: 'shipment-tracking', domain: 'amazon.com' }),
    link: { url: () => 'https://www.amazon.com/gp/your-account/order-history', text: 'View or manage order' },
    wording: (p) => [
      [`Good news: your order has shipped and will arrive ${p.eta}.`, 'There was a problem with your payment. Update your card within 24 hours or your order will be cancelled.', 'credentials', 'A payment problem plus a 24-hour deadline is bait to get your card details. Check orders in the Amazon app.'],
      [`Your order has shipped and will arrive ${p.eta}.`, 'Your order was flagged for suspicious activity. Confirm your card number and billing address to release it.', 'personal_info', 'Amazon never asks you to confirm your card number by email.'],
      [`Your package is on its way and should arrive ${p.eta}.`, 'Delivery failed. A redelivery fee of $1.99 is required to reschedule.', 'money', 'Tiny "redelivery fees" are bait to capture your card.'],
    ],
    render: (p, m) => ({
      subject: `Your Amazon.com order #${p.order}`,
      body: `Hello ${p.first},\n\n${m.phrase}\n\n${p.item}\nOrder #${p.order}\n\n${m.linkText}\n\nWe hope to see you again soon.\nAmazon.com`,
    }),
    legitContext: (p) => `You ordered a ${p.item} on Amazon two days ago.`,
    phishContext: (p) => `You ordered a ${p.item} on Amazon two days ago.`,
    goodSigns: () => ['Sender is amazon.com', 'The button goes to www.amazon.com', 'Matches an order you really placed'],
    tricks: { 1: ['swap', 'drop', 'double', 'digit', 'append', 'tld', 'dash'], 2: ['cyrillic', 'subdomain', 'at'], 3: ['wording'] },
    tip: 'Check orders by opening the Amazon app or typing amazon.com yourself.',
  },
  {
    key: 'netflix', topic: 'Netflix',
    params: () => ({ first: pick(FIRST), plan: pick(['Standard with ads', 'Standard', 'Premium']), date: monthDay(), variant: 0 }),
    sender: () => ({ name: 'Netflix', local: 'info', domain: 'account.netflix.com' }),
    link: { url: () => 'https://www.netflix.com/YourAccount', text: 'Manage your account' },
    wording: () => [
      ['Your membership has been renewed. No action is needed.', 'We could not process your payment. Update your billing details within 48 hours to keep watching.', 'credentials', 'A payment problem with a short deadline is bait. Check your account in the Netflix app.'],
      ['Your membership has been renewed. Enjoy!', 'Your account is on hold. Reply with your card number and expiration date to reactivate it.', 'personal_info', 'Nobody legit asks you to email your card number.'],
      ['Thanks for being a member. No action is needed.', 'Your membership will be cancelled today unless you update your billing details.', 'threat', 'A same-day cancellation threat is designed to rush you into typing your card details.'],
    ],
    render: (p, m) => ({
      subject: 'Your Netflix membership',
      body: `Hi ${p.first},\n\n${m.phrase}\n\nPlan: ${p.plan}\nNext billing date: ${p.date}\n\n${m.linkText}\n\nThe Netflix team`,
    }),
    goodSigns: () => ['Sender is netflix.com', 'The link goes to www.netflix.com', 'Just a receipt, nothing to do'],
    tricks: { 1: ['swap', 'drop', 'double', 'digit', 'append', 'tld'], 2: ['capI', 'cyrillic', 'subdomain'], 3: ['wording'] },
    tip: 'Check billing by opening the Netflix app yourself.',
  },
  {
    key: 'apple', topic: 'Apple receipt',
    params: () => {
      const first = pick(FIRST); const last = pick(LAST);
      return { account: `${first}.${last}@icloud.com`.toLowerCase(), order: `M${alnum(9).toUpperCase()}`, date: monthDay(), item: pick(['iCloud+ 200 GB (Monthly)', 'Apple Music Student (Monthly)', 'GoodNotes 6 (Annual)', 'Apple TV+ (Monthly)']), price: pick(['$2.99', '$5.99', '$9.99', '$12.99', '$19.99']), phone: scamPhone(), variant: 0 };
    },
    sender: () => ({ name: 'Apple', local: 'no_reply', domain: 'email.apple.com' }),
    link: { url: () => 'https://reportaproblem.apple.com', text: 'Report a Problem' },
    wording: (p) => [
      ['If you have questions about this purchase, use Report a Problem.', `If you did not make this purchase, call Apple Support within 24 hours at ${p.phone}.`, 'impersonation', "That is not Apple's number. Scammers print their own number so you call them (\"callback phishing\")."],
      ['If you have questions about this purchase, use Report a Problem.', 'To cancel this charge, reply with your Apple Account password.', 'credentials', 'Apple never asks for your password by email.'],
      ['You can manage subscriptions in Settings.', `If you did not authorize this charge, call our refund team at ${p.phone} today.`, 'impersonation', 'Callback phishing: the "refund team" is the scammer.'],
    ],
    render: (p, m) => ({
      subject: 'Your receipt from Apple',
      body: `Receipt\n\nApple Account: ${p.account}\nDate: ${p.date}\nOrder ID: ${p.order}\n\n${p.item}    ${p.price}\n\n${m.phrase}\n\n${m.linkText}\n\nApple`,
    }),
    legitContext: (p) => `You subscribe to ${p.item.replace(/ \(.*\)/, '')}.`,
    goodSigns: () => ['Sender is email.apple.com', 'The link goes to reportaproblem.apple.com', 'No phone number to call'],
    tricks: { 1: ['swap', 'drop', 'double', 'append', 'tld'], 2: ['capI', 'cyrillic', 'subdomain'], 3: ['wording'] },
    tip: "If a charge looks wrong, check it in your Apple account settings, not through the email.",
  },
  {
    key: 'instagram', topic: 'Instagram',
    params: () => ({ handle: `${pick(FIRST).toLowerCase()}.${pick(['waves', 'malibu', 'surf', 'studies', 'photos'])}${rand(99)}`, variant: 0 }),
    sender: () => ({ name: 'Instagram', local: 'security', domain: 'mail.instagram.com' }),
    link: { url: () => 'https://www.instagram.com/accounts/password/reset/', text: 'Reset your password' },
    wording: () => [
      ["If you didn't request this, you can ignore this email and your password won't change.", "If you didn't request this, reply with the 6-digit code we just texted you so we can cancel it.", 'mfa_code', 'Instagram never asks you to send it a code. Whoever gets that code gets your account.'],
      ["If you didn't request this, you can ignore this email.", "If you didn't request this, confirm your identity by signing in with your current password below.", 'credentials', 'Instagram will not ask you to sign in with your password to cancel a reset.'],
      ["If you didn't request a password reset, let us know.", 'Your account will be permanently deleted in 24 hours unless you verify it.', 'threat', 'Deletion threats with a short deadline are a classic account-takeover lure.'],
    ],
    render: (p, m) => ({
      subject: 'Reset your Instagram password',
      body: `Hi ${p.handle},\n\nWe got a request to reset your Instagram password.\n\n${m.linkText}\n\n${m.phrase}\n\nOnly people who know your Instagram password or click the link in this email can log in to your account.\n\nfrom Meta`,
    }),
    legitContext: () => 'You just tapped "Forgot password?" in the Instagram app.',
    goodSigns: () => ['Sender is mail.instagram.com', 'The link goes to www.instagram.com', 'You requested it, and it asks for nothing'],
    tricks: { 1: ['swap', 'drop', 'double', 'digit', 'append', 'tld'], 2: ['cyrillic', 'subdomain', 'at'], 3: ['wording'] },
    tip: 'Reset passwords from inside the app, not from an email you did not expect.',
  },
  {
    key: 'professor', topic: 'professor email',
    params: () => {
      const [first, last] = pick(PROFS);
      return { first, last, dept: pick(DEPTS), q: 2 + rand(6), exam: pick(['midterm', 'quiz 3', 'lab report', 'problem set 4']), variant: 0 };
    },
    sender: (p) => ({ name: `${p.first} ${p.last}`, local: `${p.first}.${p.last}`.toLowerCase(), domain: 'pepperdine.edu' }),
    wording: () => [
      ['The updated grade is posted on the course site now. Let me know if anything looks off.', 'Before I can submit the grade change, FERPA requires me to verify your identity. Could you reply with your full student ID number and date of birth?', 'personal_info', 'Your professor already knows who you are. No FERPA process works by emailing your ID and birthday.'],
      ['I updated the gradebook, so you should see the change on the course site.', 'To finalize the change, please send me your Pepperdine password so I can submit it through your student account.', 'credentials', 'No professor needs your password. Ever.'],
      ['Nice catch on that one. The change is already in the gradebook.', 'Before I submit it, please buy a $50 gift card for the department regrade fee and send me the code.', 'money', 'There is no such thing as a regrade fee, and gift cards are a scammer favorite.'],
    ],
    wordingHeaders: true,
    render: (p, m) => ({
      subject: `Re: ${p.exam[0].toUpperCase()}${p.exam.slice(1)} regrade request`,
      body: `Hi,\n\nThanks for stopping by office hours. I went back through your ${p.exam} and you were right about question ${p.q}, so I have adjusted your score.\n\n${m.phrase}\n\nBest,\n${p.first} ${p.last}\nProfessor of ${p.dept}`,
    }),
    legitContext: (p) => `You asked Professor ${p.last} about question ${p.q} of your ${p.exam} in office hours.`,
    phishContext: (p) => `You asked Professor ${p.last} about question ${p.q} of your ${p.exam} in office hours.`,
    goodSigns: () => ['Mailed and signed by pepperdine.edu', 'No Reply-To trick: replies go to the professor', 'Points you to the course site and asks for nothing'],
    tricks: { 3: ['wording'] },
    tip: 'When a "professor" asks for personal info, reply by starting a NEW email to their address from the course site.',
    legitWhy: 'Mailed and signed by pepperdine.edu, replies go to the professor, and it asks for nothing.',
  },
];

// ───────────── SMS templates (custom builders) ─────────────
function smsCard({ key, level, isPhish, trick, marker, from, body, links, flags, compare, explanation, goodSigns, context }) {
  const card = {
    id: `g:${key}:${isPhish ? trick : 'legit'}:0:${shortHash(`${marker || ''}|${body}`)}`,
    generated: true, topic: key, level, channel: 'sms', isPhish, time: clock(),
    from: { name: from }, body, links: links || [], flags: isPhish ? flags : [], explanation,
  };
  if (isPhish && compare?.length) card.compare = compare;
  if (!isPhish) card.goodSigns = goodSigns;
  if (context) card.context = context;
  return card;
}

const SMS_TEMPLATES = [
  {
    key: 'usps', topic: 'USPS text', tricks: { 1: ['smsDash', 'smsAppend'], 2: ['smsReplyY', 'smsSubdomain'] },
    build(level, isPhish, trick, p = { track: `9400 1118 ${digits(4)} ${digits(4)} ${digits(4)} ${digits(2)}`, date: monthDay(), hour: `${1 + rand(11)}:${pad2(rand(60))} ${pick(['am', 'pm'])}` }) {
      const trackRaw = p.track.replace(/ /g, '');
      const realUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackRaw}`;
      if (!isPhish) {
        const status = pick([`was delivered in or at the mailbox at ${p.hour} on ${p.date} in MALIBU, CA 90263`, `is out for delivery today in MALIBU, CA 90263`, 'is arriving tomorrow by 9:00 pm']);
        return smsCard({ key: 'usps', level, isPhish, from: '28777', body: `USPS: Your item ${status}. Reply STOP to cancel. Track: ${realUrl}`, links: [{ text: realUrl, href: realUrl }],
          goodSigns: ['Comes from the USPS short code 28777', 'The link is on tools.usps.com (the real domain ends in usps.com)', 'Just an update, and "Reply STOP" only unsubscribes'],
          context: 'You signed up for USPS text tracking for a package.', explanation: 'Legit: the official short code, a link that really ends in usps.com, and nothing asked of you.' });
      }
      const phone = scamPhone();
      const w = pick(['redeliver', 'tracking', 'reschedule', 'parcel', 'delivery']);
      const t = pick(['info', 'top', 'co', 'net', 'online']);
      const host = trick === 'smsSubdomain' ? `tools.usps.com.${w}-center.${t}` : trick === 'smsAppend' ? `usps-${w}.${t}` : `usps.com-${w}.${t}`;
      const url = `https://${host}/track`;
      const replyY = trick === 'smsReplyY' || trick === 'smsSubdomain';
      const body = `USPS: Your package ${p.track} could not be delivered due to an incomplete address. Update your details within 24 hours: ${url}${replyY ? '\n\n(Reply Y, then close and reopen this message to activate the link.)' : ''}`;
      const flags = [
        { quote: phone, category: 'sender_spoof', severity: 'medium', why: 'Real USPS texts come from the short code 28777, and only if you signed up. This is a personal phone number.' },
        { quote: host, category: 'lookalike_domain', severity: 'high', why: `The real owner of this link is ${regOf(host)}, not usps.com.` },
      ];
      if (replyY) flags.push({ quote: 'Reply Y, then close and reopen this message to activate the link', category: 'risky_link', severity: 'high', why: 'Phones disable links from unknown senders. Replying "Y" turns the link on: a known smishing trick.' });
      return smsCard({ key: 'usps', level, isPhish, trick, marker: host, from: phone, body, links: [{ text: url, href: url }], flags,
        compare: [{ label: 'Tracking link', real: 'https://tools.usps.com/go/TrackConfirmAction', fake: url, mode: 'tokens', note: 'The real domain is whatever comes right before the first single "/"' }],
        explanation: `A real-looking tracking number and a calm tone. The giveaways: a personal phone number instead of 28777, and a link owned by ${regOf(host)}${replyY ? ', plus the "Reply Y" trick' : ''}. Track packages at usps.com yourself.` });
    },
  },
  {
    key: 'bank-alert', topic: 'bank alert', tricks: { 1: ['smsDomain'], 2: ['smsDomainHidden'] },
    build(level, isPhish, trick) {
      const amount = money(40, 900).us;
      const merchant = pick(['BESTBUY.COM', 'TARGET', 'APPLE.COM/BILL', 'STARBUCKS', 'UBER *TRIP', 'WHOLE FOODS']);
      const last4 = digits(4);
      const context = `You're buying something at ${merchant.split(/[ *.]/)[0]} right now. Your credit union's alerts always come from 73981.`;
      if (!isPhish) {
        return smsCard({ key: 'bank-alert', level, isPhish, from: '73981', context, body: `Coastal Credit Union: Did you attempt a ${amount} purchase at ${merchant} on card ending ${last4}? Reply YES or NO. We will never ask for your PIN or password.`,
          goodSigns: ['From the short code your alerts always come from', 'No link, just YES or NO', 'Says it will never ask for your PIN'], explanation: 'Legit. Real fraud alerts ask a simple YES/NO about a specific purchase, with no link.' });
      }
      const phone = scamPhone();
      const f = fakeDomain('coastalcu.org', trick === 'smsDomainHidden' ? pick(['capI', 'lForI', 'rn', 'digit']) : pick(['swap', 'drop', 'append', 'dash', 'tld'])) || fakeDomain('coastalcu.org', 'append');
      const url = `https://${f.domain}/verify`;
      return smsCard({ key: 'bank-alert', level, isPhish, trick, marker: f.domain, from: phone, context,
        body: `Coastal Credit Union: A ${amount} purchase at ${merchant} on card ending ${last4} was declined. If this wasn't you, verify your card at ${url} to avoid a hold on your account.`,
        links: [{ text: url, href: url }],
        flags: [
          { quote: phone, category: 'sender_spoof', severity: 'high', why: 'Your credit union texts from 73981. This came from a regular phone number.' },
          { quote: f.domain, category: 'lookalike_domain', severity: 'high', why: `${f.why} The credit union's real site is coastalcu.org.` },
        ],
        compare: [{ label: 'Website', real: 'coastalcu.org', fake: f.domain, note: f.note }],
        explanation: 'Timed to match something you are doing, which makes it feel real. The number and the website are both wrong. Call the number on the back of your card instead.' });
    },
  },
  {
    key: 'code', topic: 'verification code', tricks: { 2: ['smsCodeNumber'], 3: ['smsCodeWording'] },
    build(level, isPhish, trick) {
      const code = digits(6);
      const context = "You're signing in to your Pepperdine account on your laptop right now.";
      if (!isPhish) {
        return smsCard({ key: 'code', level, isPhish, from: '41532', context, body: `Pepperdine: Your verification code is ${code}. It expires in 10 minutes. Never share this code. We will never call or text you to ask for it.`,
          goodSigns: ['YOU started the sign-in', 'Only delivers the code, does not ask for it back', 'Tells you never to share it'], explanation: 'Legit. The danger is when someone asks you to read this code back to them.' });
      }
      const phone = scamPhone();
      const ask = trick === 'smsCodeWording' ? 'To confirm this sign-in is you, reply with the 6-digit code now.' : 'Reply with the code to verify your identity and keep your account active.';
      return smsCard({ key: 'code', level, isPhish, trick, marker: trick, from: phone, context,
        body: `Pepperdine: A verification code was just sent to this phone. It expires in 10 minutes. ${ask}`,
        flags: [
          { quote: phone, category: 'sender_spoof', severity: 'medium', why: 'Not the short code your real sign-in codes come from.' },
          { quote: ask, category: 'mfa_code', severity: 'high', why: 'A real code message tells you NOT to share it. Anyone asking for your code is trying to log in as you.' },
        ],
        compare: [{ label: 'The key sentence', real: 'Never share this code.', fake: ask, plain: true }],
        explanation: 'Attackers who have your password trigger a real code, then text you pretending to be IT so you send it to them. Same timing, opposite instruction.' });
    },
  },
  {
    key: 'alert', topic: 'Pepperdine Alert', tricks: { 1: ['smsAlertAppend'], 2: ['smsAlertHidden'] },
    build(level, isPhish, trick) {
      const event = pick(['A Red Flag Warning (high fire danger) is in effect for Malibu through Friday 6 PM.', 'Pacific Coast Highway is closed near campus due to a traffic collision. Expect delays.', 'A power outage is affecting parts of campus. Crews are working to restore service.']);
      if (!isPhish) {
        return smsCard({ key: 'alert', level, isPhish, from: '67283', context: 'You signed up for Pepperdine emergency alerts. They always come from this number.',
          body: `Pepperdine Alert: ${event} No action is needed right now. Updates: emergency.pepperdine.edu`, links: [{ text: 'emergency.pepperdine.edu', href: 'https://emergency.pepperdine.edu' }],
          goodSigns: ['From the alert number you signed up for', 'The link is on pepperdine.edu', 'Informs you and asks for nothing'], explanation: 'Legit. Real alerts inform you and point to official pages.' });
      }
      const phone = scamPhone();
      const host = trick === 'smsAlertHidden' ? `emergency.pepperdine.edu.${pick(['status', 'safety', 'checkin'])}-${pick(['portal', 'now'])}.${pick(['info', 'co'])}` : `pepperdine-${pick(['alert', 'safety', 'emergency'])}.${pick(['info', 'co', 'net', 'org'])}`;
      const url = `https://${host}/checkin`;
      return smsCard({ key: 'alert', level, isPhish, trick, marker: host, from: phone, context: 'You signed up for Pepperdine emergency alerts. They always come from 67283.',
        body: `Pepperdine Alert: ${event} All students must confirm they are safe by signing in with their Pepperdine account: ${url}`,
        links: [{ text: url, href: url }],
        flags: [
          { quote: phone, category: 'sender_spoof', severity: 'high', why: 'Pepperdine Alerts come from 67283, not a personal number.' },
          { quote: host, category: 'lookalike_domain', severity: 'high', why: `The real owner of this link is ${regOf(host)}, not pepperdine.edu.` },
          { quote: 'signing in with their Pepperdine account', category: 'credentials', severity: 'high', why: 'Emergency alerts never ask you to log in. Scammers use real emergencies as bait.' },
        ],
        compare: [{ label: 'Link', real: 'https://emergency.pepperdine.edu', fake: url, mode: 'tokens' }],
        explanation: 'Scammers copy real campus news to make fake alerts believable. The number, the link and the login request give it away.' });
    },
  },
];

// ───────────── public API ─────────────
const ALL = [
  ...EMAIL_TEMPLATES.map((t) => ({ ...t, kind: 'email' })),
  ...SMS_TEMPLATES.map((t) => ({ ...t, kind: 'sms' })),
];
export const TEMPLATE_KEYS = ALL.map((t) => t.key);

function buildFrom(tpl, level, isPhish, trick) {
  if (tpl.kind === 'sms') return tpl.build(level, isPhish, trick);
  return emailCard(tpl, level, isPhish, trick);
}

// One single card, preferring combos (template + trick) and ids this player hasn't seen.
export function generateSingle({ level, isPhish, avoidTopics = new Set(), seen = new Set(), seenCombos = new Set() }) {
  const pool = ALL.filter((t) => !avoidTopics.has(t.key) && (!isPhish || t.tricks[level]?.length));
  let fallback = null;
  let fresh = null;
  for (let tries = 0; tries < 40 && pool.length; tries++) {
    const tpl = pick(pool);
    const trick = isPhish ? pick(tpl.tricks[level]) : null;
    const card = buildFrom(tpl, level, isPhish, trick);
    if (!card) continue;
    if (!seenCombos.has(comboOf(card.id)) && !seen.has(card.id)) return strip(card);
    if (!fresh && !seen.has(card.id)) fresh = card;
    if (!fallback) fallback = card;
  }
  const c = fresh || fallback;
  return c ? strip(c) : null;
}

// A spot-the-difference pair: the same message, same details, one real and one with a trick.
export function generateTwin({ level, avoidTopics = new Set(), seen = new Set(), seenCombos = new Set() }) {
  const pool = ALL.filter((t) => !avoidTopics.has(t.key) && t.tricks[level]?.length);
  let fallback = null;
  for (let tries = 0; tries < 30 && pool.length; tries++) {
    const tpl = pick(pool);
    const trick = pick(tpl.tricks[level]);
    let real;
    let fake;
    if (tpl.kind === 'email') {
      const p = tpl.params();
      const frozen = { ...tpl, params: () => p, phishContext: tpl.legitContext };
      fake = emailCard(frozen, level, true, trick);
      real = emailCard(frozen, level, false, null);
      if (real && fake) real.time = fake.time;
    } else {
      real = tpl.build(level, false, null);
      fake = tpl.build(level, true, trick);
      if (real && fake) fake.time = real.time;
    }
    if (!real || !fake) continue;
    const context = real.context || fake.context;
    const side = (c) => {
      const { id, generated, topic, level: _l, isPhish, flags, explanation, goodSigns, compare, context: _c, _params, ...rest } = c;
      return rest;
    };
    const twin = {
      id: `${fake.id}:twin`,
      generated: true,
      topic: tpl.key,
      level,
      type: 'twin',
      prompt: `Two ${tpl.topic} ${tpl.kind === 'sms' ? 'texts' : 'emails'} arrived. One is real. Which one is the scam?`,
      context,
      real: side(real),
      fake: side(fake),
      flags: fake.flags,
      goodSigns: real.goodSigns,
      compare: fake.compare || [],
      explanation: fake.explanation,
    };
    const combo = `${comboOf(twin.id)}:twin`;
    if (!seenCombos.has(combo) && !seen.has(twin.id)) return twin;
    if (!fallback || (seen.has(fallback.id) && !seen.has(twin.id))) fallback = twin;
  }
  return fallback;
}

function strip(card) {
  const { _params, ...rest } = card;
  return rest;
}
