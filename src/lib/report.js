// Builds the pre-filled incident report for Pepperdine's Information Security Office.
import { CATEGORIES, VERDICTS } from '../../shared/categories.js';

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

// Make links unclickable in the report so nobody opens them by accident (security teams expect this).
export const defang = (s) => s.replace(/^http/i, 'hxxp').replace(/\./g, '[.]');

function senderLine(text) {
  const from = text.match(/^\s*from\s*:\s*(.+)$/im);
  if (from) return from[1].trim();
  const addr = text.match(/<([^<>\s@]+@[^<>\s]+)>/);
  return addr ? addr[1] : null;
}

export function buildReport(result) {
  const text = result.text || '';
  const sender = senderLine(text);
  const links = [...new Set(text.match(URL_RE) || [])].slice(0, 5);
  const flags = (result.flags || []).slice(0, 6);
  const lines = [
    'Hello ISO team,',
    '',
    'I received a suspicious message and I may have interacted with it. Details below.',
    '',
    'ABOUT ME (please fill in)',
    '- Name:',
    '- Student / job title and department:',
    '- Best callback number and time:',
    '- What I did (clicked the link / typed my password / shared a code / sent money or personal info):',
    '- When:',
    '',
    'ABOUT THE MESSAGE',
    `- Sender: ${sender ? defang(sender) : 'unknown'}`,
    ...(links.length ? ['- Links in it (defanged):', ...links.map((l) => `    ${defang(l)}`)] : []),
    `- Riptide check: ${VERDICTS[result.verdict]?.label || result.verdict} (risk ${result.score}/100)`,
    ...(flags.length ? ['- Red flags found:', ...flags.map((f) => `    * ${CATEGORIES[f.category]?.label || f.category}: "${defang(f.quote.slice(0, 80))}"`)] : []),
    '',
    'Thank you.',
  ];
  return lines.join('\n');
}
