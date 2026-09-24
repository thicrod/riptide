// Layer 1: fast, explainable rule-based checks. No AI, no network.
// Every flag points at the exact text it found (start/end), so the UI can highlight it.

import {
  inspectHost, registrableDomain, tldOf, isIpHost, officialBrandOf, isKnownVendor,
  FREE_MAIL, SHORTENERS, RISKY_TLDS,
} from './domains.js';
import { verdictFor, categoryLabel } from '../../shared/categories.js';

const SEVERITY_WEIGHT = { low: 0.08, medium: 0.2, high: 0.42 };
const NEGATABLE = new Set(['credentials', 'mfa_code', 'personal_info', 'money']);
const NEGATION_RE = /\b(?:never|don'?t|do not|won'?t|will not|not to|no one will)\b[^.!?\n]*$/i;
const ASK_CATEGORIES = new Set(['credentials', 'mfa_code', 'money', 'personal_info']);
// Categories that are hard technical evidence (used by the score blend).
export const TECHNICAL_CATEGORIES = new Set(['lookalike_domain', 'link_mismatch', 'sender_spoof']);

const BRAND_NAMES = {
  pepperdine: 'Pepperdine', microsoft: 'Microsoft', google: 'Google', apple: 'Apple', amazon: 'Amazon',
  paypal: 'PayPal', venmo: 'Venmo', zelle: 'Zelle', chase: 'Chase', wellsfargo: 'Wells Fargo',
  bankofamerica: 'Bank of America', usps: 'USPS', ups: 'UPS', fedex: 'FedEx', docusign: 'DocuSign',
  dropbox: 'Dropbox', netflix: 'Netflix', instagram: 'Instagram', linkedin: 'LinkedIn', zoom: 'Zoom',
  coinbase: 'Coinbase', irs: 'the IRS', joinhandshake: 'Handshake',
};

// Brand names as they appear in display names ("Google Docs", "PayPal Service", "Wells Fargo").
const BRAND_NAME_PATTERNS = {
  pepperdine: /\bpepperdine\b/i,
  google: /\b(?:google|gmail)\b/i,
  microsoft: /\b(?:microsoft|outlook|onedrive|office ?365)\b/i,
  apple: /\b(?:apple|icloud)\b/i,
  amazon: /\bamazon\b/i,
  paypal: /\bpaypal\b/i,
  venmo: /\bvenmo\b/i,
  zelle: /\bzelle\b/i,
  chase: /\bchase bank\b|^chase\b/i,
  wellsfargo: /\bwells ?fargo\b/i,
  bankofamerica: /\bbank of america\b/i,
  usps: /\bUSPS\b|\bpostal service\b/,
  ups: /\bUPS\b/,
  fedex: /\bfedex\b/i,
  docusign: /\bdocusign\b/i,
  dropbox: /\bdropbox\b/i,
  netflix: /\bnetflix\b/i,
  instagram: /\binstagram\b/i,
  linkedin: /\blinkedin\b/i,
  zoom: /\bzoom\b/i,
  coinbase: /\bcoinbase\b/i,
  irs: /\bIRS\b|\binternal revenue service\b/,
  joinhandshake: /\bhandshake\b/i,
};
function brandsNamedIn(name) {
  return Object.entries(BRAND_NAME_PATTERNS).filter(([, re]) => re.test(name || '')).map(([b]) => b);
}

// ---------- Phrase rules ----------
// Each rule: category, severity, regex (global, case-insensitive), plain-language reason.
const PHRASE_RULES = [
  // Urgency
  { category: 'urgency', severity: 'medium', re: /\b(?:within|in the next)\s+\d+\s*(?:hours?|hrs?|minutes?|mins?|business days?|days?)\b|\bin\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)\b/gi,
    why: 'A tight deadline pushes you to act before you think.' },
  { category: 'urgency', severity: 'medium', re: /\b(?:urgent(?:ly)?|immediately|right away|asap|as soon as possible|act now|final (?:notice|warning|reminder)|last (?:chance|warning)|expires? (?:today|tonight|soon)|time[- ]sensitive)\b/gi,
    why: 'Pressure language is designed to make you panic and skip checking.' },
  // Threats
  { category: 'threat', severity: 'medium', re: /\b(?:will|may|could) be (?:permanently )?(?:suspended|deactivated|disabled|locked|terminated|closed|deleted|cancell?ed|revoked|restricted|blocked)\b/gi,
    why: 'Threatening to shut down your account is a classic scare tactic.' },
  { category: 'threat', severity: 'medium', re: /\b(?:legal action|arrest(?:ed)?|warrant|lawsuit|collections agency|penalt(?:y|ies)|a fine of)\b/gi,
    why: 'Threats of legal trouble are meant to frighten you into complying.' },
  // Credentials
  { category: 'credentials', severity: 'high', re: /\b(?:verify|confirm|validate|re-?enter|update|reactivate|unlock|restore|re-?validate)\s+(?:your\s+)?(?:current\s+|existing\s+|old\s+|pepperdine\s+)?(?:account|password|credentials|log-?in|identity|mailbox|email account|net ?id|sign-?in)\b/gi,
    why: 'Asks you to "verify" your account, which usually means typing your password into a fake page.' },
  { category: 'credentials', severity: 'high', re: /\b(?:enter(?:ing)?|provid(?:e|ing)|send(?:ing)?|shar(?:e|ing)|typ(?:e|ing)|submit(?:ting)?)\s+(?:your\s+)?(?:current\s+|pepperdine\s+)?(?:password|passcode|log-?in details|credentials|(?:pepperdine\s+)?username and password)\b/gi,
    why: 'No legitimate office asks for your password in a message.' },
  { category: 'credentials', severity: 'medium', re: /\b(?:update|confirm|verify)\s+(?:your\s+)?(?:payment|billing|banking|direct deposit|account) (?:information|info|details)\b/gi,
    why: 'Asks you to update payment or account details through the message.' },
  { category: 'credentials', severity: 'medium', re: /\b(?:mailbox|inbox|email|storage)(?: (?:quota|storage|space))? (?:is |has )?(?:almost )?(?:full|exceeded|exceded|over|reached)\b/gi,
    why: '"Your mailbox is full" is one of the oldest login-stealing tricks.' },
  { category: 'credentials', severity: 'medium', re: /\b(?:log|sign)[ -]?in\s+(?:now|here|below|to (?:avoid|prevent|keep|restore|confirm|verify|continue))\b/gi,
    why: 'Pushes you to log in through the message instead of going to the site yourself.' },
  { category: 'credentials', severity: 'medium', re: /\b(?:sign|log)[ -]?in (?:with|using) your (?:[\w-]+ )?(?:credentials|password|account|email|net ?id)\b|\b(?:sign|log)[ -]?in (?:through|via|using|on) (?:our|this|the) (?:partner|secure|verification|link|page|form|portal)\b/gi,
    why: 'Asks you to sign in from the message. Fake sign-in pages are how passwords get stolen.' },
  // MFA codes
  { category: 'mfa_code', severity: 'high', re: /\b(?:send|give|share|forward|reply with|read me|text me|tell me|provide)\b[^.\n]{0,40}?\b(?:code|passcode|verification|one[- ]time|otp|pin)\b/gi,
    why: 'Asks you to share a verification code. That code is the key to your account.' },
  { category: 'mfa_code', severity: 'high', re: /\b(?:approve|accept|confirm) (?:the|this|my|a) (?:push|login|sign-?in|duo|notification|prompt|request)\b/gi,
    why: 'Asks you to approve a login you did not start ("MFA fatigue" attack).' },
  // Money
  { category: 'money', severity: 'high', re: /\b(?:gift ?cards?|itunes cards?|apple (?:gift )?cards?|google play cards?|steam cards?|amazon cards?|visa gift|prepaid cards?)\b/gi,
    why: 'Gift cards are the #1 payment scammers ask for, because they cannot be traced or refunded.' },
  { category: 'money', severity: 'high', re: /\b(?:scratch (?:off )?the (?:back|code)|send (?:me )?(?:the )?(?:codes?|pictures?|photos?) of (?:the )?(?:cards?|back))\b/gi,
    why: 'Asking for photos of gift card codes is a sure sign of a scam.' },
  { category: 'money', severity: 'medium', re: /\b(?:wire transfer|western union|moneygram|bitcoin|btc|crypto(?:currency)?|usdt|cash ?app|zelle|venmo)\b/gi,
    why: 'Mentions a payment method that is hard to reverse.' },
  { category: 'money', severity: 'medium', re: /\b(?:send|transfer|pay|wire)\s+(?:me\s+)?(?:the\s+)?\$\s?\d[\d,]*/gi,
    why: 'Asks you to send money.' },
  // Job scams
  { category: 'job_scam', severity: 'high', re: /\b(?:deposit|cash)\s+(?:the|this|a)\s+(?:check|cheque)\b|\bsend you a (?:check|cheque)\b|\bmobile deposit\b/gi,
    why: 'Fake-check scam: they send a check, you buy "supplies," then the check bounces and you owe the money.' },
  { category: 'job_scam', severity: 'medium', re: /\$\s?\d[\d,]*(?:\.\d\d)?\s*(?:\/|per|a|each)\s*(?:week|wk|hour|hr|day)\b/gi,
    why: 'Unusually high pay for very little work is a job-scam hallmark.' },
  { category: 'job_scam', severity: 'medium', re: /\b(?:purchase|buy)\s+(?:the\s+|some\s+)?(?:equipment|supplies|materials|software|items)\b/gi,
    why: 'Real employers do not ask new hires to buy equipment with their own money.' },
  { category: 'job_scam', severity: 'low', re: /\b(?:no experience (?:needed|required)|flexible hours|work from (?:home|anywhere)|few hours (?:a|per) week|(?:personal|virtual) assistant)\b/gi,
    why: 'Vague, flexible, easy work is common bait in fake job offers.' },
  // Impersonation / social engineering
  { category: 'impersonation', severity: 'medium', re: /\b(?:are you (?:available|free|around)(?: right now)?|quick favou?r|i need (?:a|your) (?:quick )?(?:favou?r|help)|can you do me a favou?r)\b/gi,
    why: '"Are you available?" is how boss or professor impersonation scams usually start.' },
  { category: 'impersonation', severity: 'medium', re: /\b(?:i'?m|i am) (?:in a meeting|busy|in class|traveling|boarding|unable to talk|in a conference)\b|\bcan'?t (?:talk|take calls?) (?:right )?now\b/gi,
    why: 'An excuse to avoid a phone call, where you could check who they really are.' },
  { category: 'impersonation', severity: 'high', re: /\b(?:keep (?:this|it) (?:confidential|between us|quiet|private)|don'?t tell (?:anyone|anybody|your)|do not (?:share|discuss) this with)\b/gi,
    why: 'Asking for secrecy stops you from checking with someone who could warn you.' },
  { category: 'impersonation', severity: 'high', re: /\b(?:lost my phone|new (?:phone )?number|this is my (?:friend'?s|new) (?:phone|number)|don'?t call (?:my|the) old number|my phone (?:is )?broke)\b/gi,
    why: 'A "new number" story is used in family-emergency scams, now often with AI voice cloning.' },
  // Prizes / refunds
  { category: 'prize', severity: 'medium', re: /\b(?:congratulations|you(?:'ve| have)? (?:won(?!['’]t)|been selected|been chosen)|claim your|free (?:iphone|ipad|gift|money|laptop|airpods|macbook))\b/gi,
    why: 'Surprise prizes are bait to get you to click or pay a "fee."' },
  { category: 'prize', severity: 'low', re: /\b(?:refund|reimbursement|overpayment|stimulus|tax return|unclaimed (?:funds|money))\b/gi,
    why: 'Money waiting for you is common bait. Check your real account directly.' },
  // Personal info
  { category: 'personal_info', severity: 'high', re: /\b(?:ssn|social security(?: number)?|bank account (?:number|details|info)|routing number|credit card (?:number|details)|card number|cvv|date of birth|mother'?s maiden name|driver'?s licen[sc]e)\b/gi,
    why: 'Asks for sensitive personal or financial information.' },
  // Generic greetings
  { category: 'generic_greeting', severity: 'low', re: /\b(?:dear|hello|hi|attention)\s+(?:student|user|customer|member|valued (?:customer|member|user|student)|account ?holder|sir\/madam|sir or madam|email user|beneficiary|client|staff)\b/gi,
    why: 'A generic greeting suggests a mass message rather than one meant for you.' },
  // Sloppy writing
  { category: 'sloppy', severity: 'low', re: /\b(?:recieve|exceded|acount|pasword|verifiy|securty|immediatly|click hear|dear esteemed|kindly (?:click|verify|confirm|send|revert|do the needful))\b/gi,
    why: 'Odd spelling or phrasing (though AI scams are now often perfectly written).' },
  // Sending bank/card details, or photos of your ID
  { category: 'personal_info', severity: 'high', re: /\b(?:send|reply with|provide|confirm|update|verify)\b[^.\n]{0,30}?\b(?:bank(?:ing)?|card|account|routing|payment) (?:details|information|info|numbers?)\b/gi,
    why: 'Asks for bank or card details through a message. Legit offices never collect them this way.' },
  { category: 'personal_info', severity: 'high', re: /\b(?:photo|picture|copy|scan) of your (?:id|student id|driver'?s licen[cs]e|passport|social security card)\b|\b(?:card number and (?:billing address|cvv|expiration))\b/gi,
    why: 'Asks for your ID or card details. That is identity-theft material.' },
  { category: 'credentials', severity: 'medium', re: /\b(?:verify|confirm|update|re-?enter)\s+(?:your\s+)?(?:card|credit card|debit card|billing details)\b/gi,
    why: 'Asks you to "verify" your card through a link.' },
  // Fees and "avoid a hold / charge / suspension" threats
  { category: 'money', severity: 'high', re: /\bpay (?:the|a|your) (?:small |late |overdue |processing |replacement |delivery |redelivery |reactivation |verification )?(?:fee|fine|charge|balance)\b|\b(?:processing|verification|background[- ]check|reactivation|redelivery|release|unlock|regrade) fee\b/gi,
    why: 'Asks you to pay a fee through the message. Fees are how they get your card number.' },
  { category: 'threat', severity: 'medium', re: /\bto avoid (?:a |an |the |any )?(?:\$[\d,.]+ )?(?:hold|registration hold|suspension|late fee|charge|replacement charge|penalty|fine|deactivation)\b|\bor your (?:order|account|membership|request) will be (?:cancell?ed|closed|suspended)\b/gi,
    why: 'A threat of a hold, fee or cancellation to rush you.' },
  // "If you didn't make this purchase, call ..." (callback phishing)
  { category: 'impersonation', severity: 'medium', re: /\bif you did(?: not|n'?t) (?:make|authorize|recognize|request) this (?:purchase|charge|order|payment|transaction)\b[^.\n]{0,20}?\bcall\b/gi,
    why: 'Callback phishing: scammers invent a charge so you call THEIR number. Check your account yourself.' },
  // Reply with a code
  { category: 'mfa_code', severity: 'high', re: /\breply(?:ing)? with (?:the|this|your)? ?(?:\d-digit |verification |security |one-time |login )?(?:code|passcode|pin)\b/gi,
    why: 'Asks you to send back a code. Whoever gets that code gets into your account.' },
  // Any request to send or type your password somewhere ("reply with your password", "sign in with your Microsoft password")
  { category: 'credentials', severity: 'high', re: /\b(?:send|email|text)\s+(?:(?:us|me|it|them)\s+)?your\b[^.\n]{0,25}?\bpassword\b|\breply(?:ing)?\b[^.\n]{0,30}?\bwith your\b[^.\n]{0,25}?\bpassword\b|\b(?:sign(?:ing)?|log(?:ging)?)[ -]?in\b[^.\n]{0,40}?\bwith your\b[^.\n]{0,30}?\bpassword\b|\bre-?enter your (?:current )?password\b/gi,
    why: 'Asks you to send or type your password from a message. No real service does this.' },
  // "...unless you verify", "your account has been limited / is on hold"
  { category: 'threat', severity: 'medium', re: /\bunless you (?:verify|confirm|update|pay|sign in|respond)\b|\byour (?:account|membership|order) (?:has been|is|was) (?:limited|on hold|locked|suspended|flagged)\b/gi,
    why: 'A threat to lock, limit or delete something unless you act now.' },
  // Smishing: "reply Y to activate the link"
  { category: 'risky_link', severity: 'high', re: /\breply\s+(?:with\s+)?["“']?(?:y|yes|1)["”']?(?:,|\b)[^.\n]{0,80}?\b(?:link|activate|reopen|re-open|enable)\b/gi,
    why: 'Phones disable links from unknown senders. Replying "Y" turns the link on. This is a known smishing trick.' },
  // Money written European-style ($1.240,00) in a message claiming to be a US office
  { category: 'sloppy', severity: 'medium', re: /\$\s?\d{1,3}(?:\.\d{3})+,\d{2}\b/g,
    why: 'The dot and comma are swapped ($1.240,00 instead of $1,240.00). A hint the sender is not a US office.' },
  // Hidden recipient list
  { category: 'context', severity: 'medium', re: /\bundisclosed[- ]recipients\b/gi,
    why: 'Sent to a hidden list of people, not to you personally. Hacked accounts do this.' },
  // QR codes
  { category: 'risky_link', severity: 'medium', re: /\bscan (?:the|this) (?:qr|code)\b|\bqr code\b/gi,
    why: 'QR codes hide where the link really goes ("quishing").' },
];

const MIXED_SCRIPT_RE = /[^\s<>"'()]*(?:[A-Za-z][\u0370-\u03FF\u0400-\u04FF]|[\u0370-\u03FF\u0400-\u04FF][A-Za-z])[^\s<>"'()]*/g;
const PHONE_RE = /(?<!\w)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const REAL_TECH_SUPPORT = '3105064357';
const SUPPORT_CONTEXT_RE = /\b(?:tech(?:nology)? support|support|help ?desk|service desk|customer (?:service|care)|fraud (?:team|department)|it (?:support|department|services)|information technology|call us|call our|call (?:the )?(?:billing|security|fraud) (?:team|line|department))\b[^\n]{0,60}$/i;
const ATTACHMENT_RE = /\b[\w\-]{1,60}(?:\.[\w\-]{1,20}){0,3}\.(html?|shtml|zip|rar|7z|exe|scr|js|vbs|bat|cmd|iso|img|msi|docm|xlsm|pptm|lnk|hta|jar|apk|pkg|dmg)\b/gi;
const JS_LIBRARY_NAMES = /^(?:node|next|vue|react|nuxt|three|chart|d3|express|angular|ember|backbone|p5|deno|bun|nest|svelte|solid)\.js$/i;
const DANGEROUS_EXT = new Set(['exe', 'scr', 'js', 'vbs', 'bat', 'cmd', 'msi', 'lnk', 'hta', 'jar', 'apk', 'pkg', 'dmg']);

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'`)\]]+/gi;
const BARE_DOMAIN_RE = /(?<![@\w.\-\/])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|edu|gov|io|co|us|info|biz|app|site|online|top|xyz|click|link|live|support|help|shop|store|tk|ml|ga|cf|gq|icu|rest|cam|buzz|work|me|ly|gl|to|ru|cn|cc|ws|page|dev|club|vip|win|bid|loan|monster|quest|sbs|cfd|lol|ai|uk|au|ca|de|fr|br|in)(?![\w\-])(?:\/[^\s<>"'`)\]]*)?/gi;
const ANCHOR_RE = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const MD_LINK_RE = /\[([^\]]{1,200})\]\((https?:\/\/[^)\s]+)\)/gi;
const EMAIL_RE = /[\w.+'-]+@[\w-]+(?:\.[\w-]+)+/g;
const EMAIL_ONE_RE = /[\w.+'-]+@[\w-]+(?:\.[\w-]+)+/; // non-global: safe to use with .match()
const HEADER_RE = /^[ \t]*(from|sender|reply-to|return-path)[ \t]*:[ \t]*(.+)$/gim;

const OFFICIAL_ROLE_RE = /\b(?:pepperdine|dean|provost|president|professor|prof\.?|dr\.?|registrar|financial aid|financial services|student accounts|bursar|housing|it (?:support|services|help ?desk|department)|help ?desk|tech(?:nology)? support|admissions|human resources|payroll|career (?:center|services)|office of|university|campus|security|public safety|seaver|graziadio|caruso)\b/i;

function trimTrailingPunct(str) {
  const m = str.match(/[.,;:!?'"]+$/);
  return m ? str.slice(0, -m[0].length) : str;
}

function parseUrl(raw) {
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'http://' + raw);
    return url;
  } catch {
    return null;
  }
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

// Set when we see near-conclusive evidence (a misspelled/homoglyph brand domain or hidden
// foreign letters). analyzeWithRules is synchronous, so a module-level flag is safe.
let strongEvidence = false;

// ---------- URL & domain checks ----------
// Keep the original capitalization when quoting a domain back ("1googIe.com", not "1googie.com"):
// a capital I posing as an l is exactly the detail people need to see.
function shownDomain(original, lower) {
  const o = String(original || '');
  return o.toLowerCase().endsWith(lower) ? o.slice(o.length - lower.length) : lower;
}

function checkHostFindings(host, flag, { as = 'link' } = {}) {
  const info = inspectHost(host);
  const reg = shownDomain(host, info.registrable);
  const out = [];
  for (const f of info.findings) {
    strongEvidence = true; // any brand impersonation (lookalike, brand on a foreign domain, hidden letters)
    if (f.type === 'punycode') {
      out.push(flag('lookalike_domain', 'high', `"${host}" contains letters from another alphabet that look like normal ones. It is not the site it pretends to be.`));
    } else if (f.type === 'contains') {
      out.push(flag('lookalike_domain', 'high',
        `Uses the name "${BRAND_NAMES[f.brand] || f.brand}" but the ${as} really belongs to ${reg}, not ${f.official}.`));
    } else if (f.type === 'lookalike') {
      out.push(flag('lookalike_domain', 'high',
        `"${reg}" is a lookalike of ${f.official}. Look closely at the spelling.`));
    }
  }
  return { info, flags: out };
}

function analyzeUrls(text, addFlag, signals) {
  const spans = [];
  const collect = (re) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const raw = trimTrailingPunct(m[0]);
      const span = { start: m.index, end: m.index + raw.length, raw };
      if (!spans.some((s) => overlaps(s, span))) spans.push(span);
    }
  };
  collect(URL_RE);
  collect(BARE_DOMAIN_RE);

  let officialCount = 0;
  for (const s of spans) {
    const url = parseUrl(s.raw);
    if (!url) continue;
    const host = url.hostname.toLowerCase();
    const flag = (category, severity, why) => addFlag({ start: s.start, end: s.end, category, severity, why });

    if (url.username) {
      flag('link_mismatch', 'high', `Everything before the "@" is ignored. This link really goes to ${host}.`);
    }
    if (isIpHost(host)) {
      flag('risky_link', 'high', 'Link goes to a raw IP address instead of a real website name.');
      continue;
    }
    const registrable = registrableDomain(host);
    if (SHORTENERS.has(registrable) || SHORTENERS.has(host)) {
      flag('risky_link', 'medium', `Shortened link (${registrable}) hides where it really goes.`);
      continue;
    }
    const shownHost = s.raw.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].split('@').pop().split(':')[0];
    const { info, flags } = checkHostFindings(shownHost.toLowerCase() === host ? shownHost : host, flag);
    const official = !!info.officialBrand;
    if (official) officialCount++;
    if (!flags.length && !official) {
      if (RISKY_TLDS.has(tldOf(host))) {
        flag('risky_link', 'medium', `".${tldOf(host)}" domains are cheap and often used for throwaway scam sites.`);
      } else if (/(?:login|log-in|signin|verify|secure|account|update|auth|wallet|helpdesk|refund|support)/i.test(registrable)) {
        flag('risky_link', 'low', `"${registrable}" uses security-sounding words to look official.`);
      }
      if (url.protocol === 'http:' && /^https?:\/\//i.test(s.raw)) {
        flag('risky_link', 'low', 'Link is not encrypted (http instead of https).');
      }
    }
  }
  if (spans.length && officialCount === spans.length) {
    signals.push('All links point to domains owned by the organizations they claim to be.');
  }
  return spans;
}

function analyzeLinkMismatches(text, addFlag) {
  const check = (re, hrefIdx, textIdx) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const href = m[hrefIdx];
      const shown = m[textIdx].replace(/<[^>]+>/g, '').trim();
      const hrefUrl = parseUrl(href);
      const shownUrl = /[a-z0-9-]+\.[a-z]{2,}/i.test(shown) ? parseUrl(shown.split(/\s/)[0]) : null;
      if (!hrefUrl) continue;
      if (shownUrl && registrableDomain(shownUrl.hostname) !== registrableDomain(hrefUrl.hostname)) {
        addFlag({
          start: m.index, end: m.index + m[0].length, category: 'link_mismatch', severity: 'high',
          why: `The link says "${shownUrl.hostname}" but really goes to ${hrefUrl.hostname}.`,
        });
      }
    }
  };
  check(ANCHOR_RE, 1, 2);
  check(MD_LINK_RE, 2, 1);
}

// ---------- Sender checks ----------
function parseAddress(value) {
  const angle = value.match(/<\s*([^>\s]+@[^>\s]+)\s*>/);
  const address = angle ? angle[1] : (value.match(EMAIL_ONE_RE) || [])[0];
  if (!address) return null;
  const name = angle ? value.slice(0, angle.index).replace(/["']/g, '').trim() : '';
  const domain = address.split('@')[1].toLowerCase();
  return { name, address, domain, local: address.split('@')[0].toLowerCase() };
}

function analyzeSenders(text, addFlag, signals) {
  const headers = {};
  HEADER_RE.lastIndex = 0;
  let m;
  while ((m = HEADER_RE.exec(text))) {
    const kind = m[1].toLowerCase();
    const value = m[2];
    const parsed = parseAddress(value);
    if (!parsed) continue;
    const valueStart = m.index + m[0].indexOf(value);
    const addrStart = text.indexOf(parsed.address, valueStart);
    parsed.start = addrStart;
    parsed.end = addrStart + parsed.address.length;
    parsed.lineStart = valueStart;
    headers[kind] = headers[kind] || parsed;
  }

  let from = headers.from || headers.sender;
  if (!from) {
    // No "From:" label: pasted emails usually start with "Name <address>" (or the name, then
    // "<address>" on the next line). Treat the first bracketed address near the top as the sender.
    const top = text.slice(0, 600);
    const bm = /<\s*([^<>\s]+@[^<>\s]+?)\s*>/.exec(top);
    if (bm) {
      const parsed = parseAddress(bm[0]);
      if (parsed) {
        const lineStart = top.lastIndexOf('\n', bm.index) + 1;
        let name = top.slice(lineStart, bm.index).trim();
        let nameStart = lineStart;
        if (!name) {
          const prevEnd = Math.max(0, lineStart - 1);
          const prevStart = top.lastIndexOf('\n', prevEnd - 1) + 1;
          const prev = top.slice(prevStart, prevEnd).trim();
          if (prev && prev.length <= 80) { name = prev; nameStart = prevStart; }
        }
        const addrStart = bm.index + bm[0].indexOf(parsed.address);
        from = { ...parsed, name: name.replace(/["']/g, ''), start: addrStart, end: addrStart + parsed.address.length, lineStart: nameStart };
      }
    }
  }
  if (from) {
    const flag = (category, severity, why, whole = false) =>
      addFlag({ start: whole ? from.lineStart : from.start, end: from.end, category, severity, why });
    const claimsOfficial = OFFICIAL_ROLE_RE.test(from.name) || OFFICIAL_ROLE_RE.test(from.local);
    const registrable = registrableDomain(from.domain);

    if (FREE_MAIL.has(registrable) && claimsOfficial) {
      flag('sender_spoof', 'high',
        `Claims to be "${from.name || from.local}" but was sent from a free ${registrable} account. Pepperdine offices use @pepperdine.edu.`, true);
    }
    const nameEmail = (from.name.match(EMAIL_ONE_RE) || [])[0];
    if (nameEmail && nameEmail.toLowerCase() !== from.address.toLowerCase()) {
      flag('sender_spoof', 'high', `The display name shows "${nameEmail}" but the real sender is ${from.address}.`, true);
    }
    const { flags } = checkHostFindings(from.address.split('@')[1], flag, { as: 'sender address' });

    // The display name names a brand, but the address doesn't belong to that brand.
    const named = brandsNamedIn(from.name);
    const senderBrand = officialBrandOf(from.domain);
    if (named.length && !named.some((b) => b === senderBrand) && !isKnownVendor(from.domain)) {
      strongEvidence = true;
      flag('sender_spoof', 'high',
        `The name says "${BRAND_NAMES[named[0]] || named[0]}", but the address is from ${shownDomain(from.address.split('@')[1], registrable)}, which ${BRAND_NAMES[named[0]] || named[0]} doesn't own.`, true);
    }
    if (!flags.length && officialBrandOf(from.domain) === 'pepperdine') {
      signals.push('Sent from an official @pepperdine.edu address (accounts can still be hacked, so verify unusual requests).');
    }
    const reply = headers['reply-to'];
    if (reply && registrableDomain(reply.domain) !== registrable) {
      const toFreeMail = FREE_MAIL.has(registrableDomain(reply.domain)) && !FREE_MAIL.has(registrable);
      addFlag({
        start: reply.start, end: reply.end, category: 'sender_spoof', severity: toFreeMail ? 'high' : 'medium',
        why: toFreeMail
          ? `The From line says ${from.domain}, but replies go to a personal ${registrableDomain(reply.domain)} account. From lines can be faked.`
          : `Replies go to ${reply.domain}, a different place than the sender (${from.domain}).`,
      });
    }
  }

  // Email addresses mentioned in the body (e.g. "reply to pepperdine.helpdesk@gmail.com").
  EMAIL_RE.lastIndex = 0;
  while ((m = EMAIL_RE.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (Object.values(headers).some((h) => h.start === start)) continue;
    const parsed = parseAddress(m[0]);
    if (!parsed) continue;
    const registrable = registrableDomain(parsed.domain);
    if (FREE_MAIL.has(registrable) && OFFICIAL_ROLE_RE.test(parsed.local)) {
      addFlag({ start, end, category: 'sender_spoof', severity: 'high',
        why: `"${m[0]}" pretends to be official but is a free ${registrable} address.` });
    } else {
      checkHostFindings(m[0].split('@')[1], (category, severity, why) => addFlag({ start, end, category, severity, why }), { as: 'email address' });
    }
  }
}

// ---------- Main ----------
export function analyzeWithRules(input) {
  const text = String(input || '');
  strongEvidence = false;
  const flags = [];
  const signals = [];
  const perRuleCount = new Map();

  const addFlag = ({ start, end, category, severity, why, ruleId }) => {
    if (start == null || start < 0 || end <= start) return;
    if (ruleId) {
      const n = perRuleCount.get(ruleId) || 0;
      if (n >= (severity === 'low' ? 1 : 2)) return;
      perRuleCount.set(ruleId, n + 1);
    }
    // De-duplicate: same category on an overlapping span -> keep the more severe one.
    const existing = flags.find((f) => f.category === category && overlaps(f, { start, end }));
    if (existing) {
      if (SEVERITY_WEIGHT[severity] > SEVERITY_WEIGHT[existing.severity]) {
        Object.assign(existing, { start, end, severity, why, quote: text.slice(start, end) });
      }
      return;
    }
    flags.push({ start, end, quote: text.slice(start, end), category, severity, why, source: 'rules' });
  };

  analyzeSenders(text, addFlag, signals);
  analyzeLinkMismatches(text, addFlag);
  const urlSpans = analyzeUrls(text, addFlag, signals);

  ATTACHMENT_RE.lastIndex = 0;
  let m;
  while ((m = ATTACHMENT_RE.exec(text))) {
    const span = { start: m.index, end: m.index + m[0].length };
    if (urlSpans.some((s) => overlaps(s, span))) continue;
    const ext = m[1].toLowerCase();
    if (ext === 'js' && JS_LIBRARY_NAMES.test(m[0])) continue; // "Node.js" is a tool, not a file
    addFlag({
      ...span, category: 'attachment', severity: DANGEROUS_EXT.has(ext) ? 'high' : 'medium', ruleId: 'attachment',
      why: DANGEROUS_EXT.has(ext)
        ? `".${ext}" files can run programs on your computer.`
        : `".${ext}" attachments are often used to hide fake login pages or malware.`,
    });
  }

  // Words mixing Latin letters with lookalike Cyrillic/Greek ones (e.g. "pаypal" with a Cyrillic "а").
  MIXED_SCRIPT_RE.lastIndex = 0;
  while ((m = MIXED_SCRIPT_RE.exec(text))) {
    strongEvidence = true;
    addFlag({
      start: m.index, end: m.index + m[0].length, category: 'lookalike_domain', severity: 'high', ruleId: 'mixed',
      why: `"${m[0]}" mixes in letters from another alphabet that look identical to normal ones. Classic lookalike trick.`,
    });
  }

  // "Call Tech Support at ..." with a number that isn't Pepperdine's real one (callback phishing).
  PHONE_RE.lastIndex = 0;
  while ((m = PHONE_RE.exec(text))) {
    const digits = m[0].replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    const before = text.slice(Math.max(0, m.index - 70), m.index);
    if (digits !== REAL_TECH_SUPPORT && SUPPORT_CONTEXT_RE.test(before)) {
      addFlag({
        start: m.index, end: m.index + m[0].length, category: 'sender_spoof', severity: 'medium', ruleId: 'phone',
        why: "Don't call numbers from a message: scammers list their own (\"callback phishing\"). Pepperdine Tech Support's real number is 310.506.4357; for other companies, look the number up yourself.",
      });
    }
  }

  // Google Forms links (anyone can make one; real IT never collects passwords this way).
  for (const s of urlSpans) {
    if (/^(?:https?:\/\/)?(?:docs\.google\.com\/forms|forms\.gle)\//i.test(s.raw)) {
      addFlag({ start: s.start, end: s.end, category: 'risky_link', severity: 'medium', ruleId: 'gform',
        why: 'This is a Google Form. Anyone can make one, and real IT never asks for passwords through a form.' });
    }
  }

  PHRASE_RULES.forEach((rule, i) => {
    rule.re.lastIndex = 0;
    let pm;
    while ((pm = rule.re.exec(text))) {
      if (!pm[0]) { rule.re.lastIndex++; continue; }
      // "Never share this code" / "Don't enter your password" are safety warnings, not requests.
      if (NEGATABLE.has(rule.category) && NEGATION_RE.test(text.slice(Math.max(0, pm.index - 25), pm.index))) continue;
      addFlag({ start: pm.index, end: pm.index + pm[0].length, category: rule.category, severity: rule.severity, why: rule.why, ruleId: `p${i}` });
    }
  });

  flags.sort((a, b) => a.start - b.start);

  const hasAsk = flags.some((f) => ASK_CATEGORIES.has(f.category));
  if (!hasAsk && text.trim().length > 20) signals.push("Doesn't ask for your password, codes, money or personal info.");

  let score = scoreFlags(flags);
  // A fake identity (lookalike domain / spoofed sender / hidden link) PLUS a request for
  // your login, codes, money or personal info is the core recipe of a scam.
  const hardEvidence = flags.some((f) => f.severity === 'high' && TECHNICAL_CATEGORIES.has(f.category));
  if (hardEvidence && hasAsk) score = Math.max(score, 80);
  // A misspelled or homoglyph copy of a brand's domain is almost never innocent.
  if (strongEvidence) score = Math.max(score, 75);
  return { score, verdict: verdictFor(score), flags, signals };
}

// Combine flag weights like independent probabilities; only the 2 strongest per category count.
export function scoreFlags(flags) {
  const byCategory = new Map();
  for (const f of flags) {
    const list = byCategory.get(f.category) || [];
    list.push(SEVERITY_WEIGHT[f.severity] || 0.07);
    byCategory.set(f.category, list);
  }
  let keep = 1;
  for (const list of byCategory.values()) {
    list.sort((a, b) => b - a).slice(0, 2).forEach((w) => { keep *= 1 - w; });
  }
  return Math.round(100 * (1 - keep));
}

export function summarizeFlags(flags) {
  if (!flags.length) return 'No common scam patterns found. That is a good sign, but not a guarantee.';
  const cats = [...new Set(flags.map((f) => f.category))].slice(0, 3).map(categoryLabel);
  return `Found ${flags.length} warning sign${flags.length === 1 ? '' : 's'}, including ${cats.join(', ').toLowerCase()}.`;
}
