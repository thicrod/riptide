// Domain helpers: who really owns a link, and does it imitate a brand?

const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'edu.au',
  'co.jp', 'com.br', 'com.mx', 'co.in', 'co.nz', 'com.cn', 'com.tr', 'co.za',
  'com.sg', 'com.hk',
]);

// Brand keyword -> domains that brand actually owns.
export const BRANDS = {
  pepperdine: ['pepperdine.edu'],
  microsoft: ['microsoft.com', 'live.com', 'office.com', 'office365.com', 'microsoftonline.com', 'sharepoint.com', 'onedrive.com', 'outlook.com', 'microsoft365.com', 'office.net', 'msn.com', 'bing.com', 'azure.com', 'windows.net'],
  google: ['google.com', 'gmail.com', 'googlemail.com', 'youtube.com', 'googleusercontent.com', 'withgoogle.com', 'google-analytics.com', 'googleapis.com', 'gstatic.com', 'googlesyndication.com', 'goo.gl', 'g.co'],
  apple: ['apple.com', 'icloud.com', 'me.com', 'mzstatic.com', 'apple.news'],
  amazon: ['amazon.com', 'amazon.co.uk', 'amazonaws.com', 'amazon.jobs', 'amazonses.com', 'media-amazon.com', 'amazon-adsystem.com', 'a2z.com'],
  paypal: ['paypal.com'],
  venmo: ['venmo.com'],
  zelle: ['zellepay.com', 'zelle.com'],
  chase: ['chase.com'],
  wellsfargo: ['wellsfargo.com'],
  bankofamerica: ['bankofamerica.com', 'bofa.com'],
  usps: ['usps.com'],
  ups: ['ups.com'],
  fedex: ['fedex.com'],
  docusign: ['docusign.com', 'docusign.net'],
  dropbox: ['dropbox.com'],
  netflix: ['netflix.com', 'netflix.net'],
  instagram: ['instagram.com', 'cdninstagram.com'],
  linkedin: ['linkedin.com', 'licdn.com'],
  zoom: ['zoom.us', 'zoom.com', 'zoomgov.com'],
  joinhandshake: ['joinhandshake.com'],
  coinbase: ['coinbase.com'],
  irs: ['irs.gov'],
};

// Legit vendors that commonly host "pepperdine.<vendor>.com" style subdomains.
const KNOWN_VENDORS = new Set([
  'instructure.com', 'joinhandshake.com', 'zoom.us', 'okta.com', 'force.com',
  'salesforce.com', 'qualtrics.com', 'box.com', 'formstack.com', 'slate.org',
  'technolutions.net', 'libguides.com', 'kaltura.com', 'panopto.com',
  // Real Pepperdine-affiliated sites that use the name on their own domain.
  'pepperdine-graphic.com', 'pepperdinewaves.com',
]);

export function isKnownVendor(host) {
  return KNOWN_VENDORS.has(registrableDomain(host));
}

export const FREE_MAIL = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'outlook.com', 'hotmail.com',
  'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
  'gmx.com', 'mail.com', 'yandex.com', 'zoho.com',
]);

export const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly',
  'rebrand.ly', 'shorturl.at', 'rb.gy', 't.ly', 'tiny.cc', 'lnkd.in', 's.id', 'qrco.de',
]);

export const RISKY_TLDS = new Set([
  'zip', 'mov', 'xyz', 'top', 'click', 'link', 'country', 'gq', 'tk', 'ml', 'cf', 'ga',
  'work', 'support', 'icu', 'rest', 'cam', 'buzz', 'monster', 'quest', 'sbs', 'cfd',
  'lol', 'live', 'site', 'online', 'shop', 'app',
]);

// "Skeleton" of a name: collapse characters that LOOK alike, so 1googIe, g00gle, rnicrosoft and
// pepperdlne all reduce to the same shape as the real brand. (Lowercasing first turns a capital
// "I" into "i", which then maps to "l" like every other thin vertical stroke.)
const SKELETON_PAIRS = [[/rn/g, 'm'], [/vv/g, 'w'], [/[1il|!]/g, 'l'], [/0/g, 'o'], [/3/g, 'e'], [/5|\$/g, 's'], [/@/g, 'a'], [/7/g, 't']];
export function skeleton(s) {
  let out = String(s).toLowerCase();
  for (const [re, rep] of SKELETON_PAIRS) out = out.replace(re, rep);
  return out;
}

export function normalizeHost(host) {
  return String(host || '').toLowerCase().replace(/\.$/, '');
}

export function registrableDomain(host) {
  const parts = normalizeHost(host).split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

export function tldOf(host) {
  const parts = normalizeHost(host).split('.');
  return parts[parts.length - 1];
}

export function isIpHost(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[');
}

export function officialBrandOf(host) {
  const h = normalizeHost(host);
  for (const [brand, domains] of Object.entries(BRANDS)) {
    if (domains.some((d) => h === d || h.endsWith('.' + d))) return brand;
  }
  return null;
}

export function isOfficialPepperdine(host) {
  return officialBrandOf(host) === 'pepperdine';
}

// Edit distance where swapping two neighbouring letters counts as ONE edit
// ("handsahke" is 1 away from "handshake", like a missing or wrong letter).
export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

const splitTokens = (s) => s.split(/[.\-_]/).filter(Boolean);

/**
 * Looks at one hostname and reports brand impersonation.
 * Returns { host, registrable, officialBrand, findings: [{ type, brand, official }] }
 *   type: 'contains'  -> brand name used on a domain the brand does not own
 *         'lookalike' -> misspelled / homoglyph version of the brand
 *         'punycode'  -> internationalized domain (can hide lookalike letters)
 */
export function inspectHost(rawHost) {
  const host = normalizeHost(rawHost);
  const registrable = registrableDomain(host);
  const officialBrand = officialBrandOf(host);
  const findings = [];

  // "xn--" names and raw non-English letters can hide lookalikes (a Cyrillic "а" looks exactly like "a").
  if (host.includes('xn--') || /[^\x00-\x7F]/.test(host)) findings.push({ type: 'punycode' });
  if (KNOWN_VENDORS.has(registrable)) return { host, registrable, officialBrand, findings };

  const tokens = splitTokens(host);
  const joined = host.replace(/[.\-_]/g, '');
  const skelTokens = tokens.map(skeleton);
  const skelJoined = skeleton(joined);

  for (const [brand, domains] of Object.entries(BRANDS)) {
    if (officialBrand === brand) continue;
    const skelBrand = skeleton(brand);
    let hit = null;
    // 1. The real brand name used on a domain the brand doesn't own (pepperdine-edu.us, usps.com-track.info).
    if (tokens.includes(brand) || (brand.length >= 7 && joined.includes(brand))) hit = 'contains';
    // 2. Same shape as the brand once lookalike characters are collapsed (1googIe, g00gle, rnicrosoft).
    else if (skelTokens.includes(skelBrand) || (skelBrand.length >= 6 && skelJoined.includes(skelBrand))) hit = 'lookalike';
    // 3. One typo away from the brand: a missing, extra, wrong or swapped letter (peppedine, joinhandsahke).
    else if (brand.length >= 5 && skelTokens.some((t) => Math.abs(t.length - skelBrand.length) <= 1 && levenshtein(t, skelBrand) === 1)) hit = 'lookalike';
    // 4. Brand hidden inside a longer word with junk attached (1google, googlesecure, paypal1).
    else if (brand.length >= 5 && skelTokens.some((t) => t !== skelBrand && t.length <= skelBrand.length + 3 && (t.startsWith(skelBrand) || t.endsWith(skelBrand)) && /[0-9]/.test(tokens[skelTokens.indexOf(t)]))) hit = 'lookalike';
    if (hit) findings.push({ type: hit, brand, official: domains[0] });
  }
  return { host, registrable, officialBrand, findings };
}
