// Shared between the server (rules + AI) and the React app (labels, tips).

export const CATEGORIES = {
  lookalike_domain: {
    label: 'Lookalike domain',
    tip: 'Read the domain right before the first single "/". The real owner is the last two parts (like pepperdine.edu). Anything like pepperdine-edu.com or pepperdlne.edu belongs to someone else.',
  },
  link_mismatch: {
    label: 'Hidden link destination',
    tip: 'Hover (or long-press on your phone) before you click. If the text says one site and the real link goes to another, it is a trap.',
  },
  risky_link: {
    label: 'Risky link',
    tip: 'Short links, QR codes and odd endings (.top, .xyz, .click) hide where you are going. Type the official address yourself instead.',
  },
  sender_spoof: {
    label: 'Suspicious sender',
    tip: 'Check the actual address, not the display name. Pepperdine offices email from @pepperdine.edu, never from Gmail or Yahoo.',
  },
  urgency: {
    label: 'Pressure / urgency',
    tip: 'Scammers rush you so you do not think. A real office will still be there in an hour. Slow down and verify.',
  },
  threat: {
    label: 'Threats',
    tip: 'Threats of suspension, fines or legal action are designed to scare you into clicking. Verify through an official channel.',
  },
  credentials: {
    label: 'Asks for your login',
    tip: 'Never enter your Pepperdine password from a link in a message. Open the site yourself from a bookmark.',
  },
  mfa_code: {
    label: 'Asks for a verification code',
    tip: 'A verification code is the last lock on your account. Nobody legit (not IT, not a professor) will ever ask you to share it.',
  },
  money: {
    label: 'Money / gift cards',
    tip: 'Gift cards, Zelle, crypto and wire transfers are scammer favorites because the money cannot be pulled back.',
  },
  job_scam: {
    label: 'Too-good job offer',
    tip: 'Real campus jobs go through official Pepperdine channels and never send you a check to buy "supplies."',
  },
  impersonation: {
    label: 'Impersonation',
    tip: 'AI can fake a voice, a writing style or a profile photo. If someone asks for money or secrecy, verify on a channel you already trust.',
  },
  prize: {
    label: 'Prize / refund bait',
    tip: 'Surprise money, prizes or refunds are bait. Check your real account directly instead of using the message link.',
  },
  personal_info: {
    label: 'Asks for personal info',
    tip: 'SSNs, bank numbers and birthdays are identity-theft gold. Legit offices use secure portals, not email replies.',
  },
  attachment: {
    label: 'Risky attachment',
    tip: '.html, .zip and .exe attachments can steal logins or install malware. When in doubt, do not open it. Ask IT.',
  },
  generic_greeting: {
    label: 'Generic greeting',
    tip: '"Dear Student" or "Dear User" suggests a mass scam. AI now personalizes messages, so do not rely on this sign alone.',
  },
  sloppy: {
    label: 'Typos / odd wording',
    tip: 'Typos used to be the giveaway. AI now writes perfect English, so check the sender and the request, not the grammar.',
  },
  context: {
    label: "Doesn't fit the context",
    tip: 'Ask yourself: was I expecting this? An unexpected request is the biggest red flag of all.',
  },
  false_alarm: {
    label: 'Legit messages flagged as scams',
    tip: 'Being careful is good! Legit messages come from official domains, link to official sites and never ask for secrets.',
  },
  other: {
    label: 'Other warning sign',
    tip: 'Trust your gut. If something feels off, verify through an official channel.',
  },
};

export const FLAG_CATEGORY_KEYS = Object.keys(CATEGORIES).filter((k) => k !== 'false_alarm');

export const SEVERITIES = ['low', 'medium', 'high'];

export const VERDICTS = {
  safe: { label: 'Looks safe', short: 'Safe' },
  suspicious: { label: 'Suspicious', short: 'Suspicious' },
  scam: { label: 'Likely scam', short: 'Scam' },
};

export function verdictFor(score) {
  if (score >= 65) return 'scam';
  if (score >= 30) return 'suspicious';
  return 'safe';
}

export function categoryLabel(key) {
  return (CATEGORIES[key] || CATEGORIES.other).label;
}

// Real, public Pepperdine IT resources (community.pepperdine.edu/it/security).
export const PEPPERDINE = {
  techSupportPhone: '310.506.4357',
  techSupportVanity: '310.506.HELP',
  reportIncidentUrl: 'https://community.pepperdine.edu/it/security/report-incident/',
  phishingGuideUrl: 'https://community.pepperdine.edu/it/security/training/phishing/',
  phishAlert: 'Phish Alert Button (the orange fish hook above the message in Gmail, when signed into Chrome with your Pepperdine account)',
};
