// Privacy: redact personal details BEFORE any text is sent to an AI provider.
// We keep sender/link domains because they are the evidence we need to analyze.

const RULES = [
  { label: 'SSN', re: /\b\d{3}-\d{2}-\d{4}\b/g, replace: '[redacted-ssn]' },
  { label: 'card/account number', re: /\b(?:\d[ -]?){13,19}\b/g, replace: '[redacted-number]' },
  { label: 'phone number', re: /(?<!\w)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, replace: '[redacted-phone]' },
  { label: 'ID or code', re: /\b\d{6,}\b/g, replace: '[redacted-number]' },
  // The recipient line identifies YOU, so it is removed entirely.
  { label: 'recipient', re: /^([ \t]*(?:to|cc)[ \t]*:).*$/gim, replace: '$1 [you]' },
];

export function scrub(text) {
  let out = String(text || '');
  const redactions = [];
  for (const rule of RULES) {
    out = out.replace(rule.re, (...args) => {
      redactions.push(rule.label);
      return rule.replace.replace('$1', args[1] ?? '');
    });
  }
  return { text: out, redactions };
}
