// What an attacker does next when a player falls for a scam, tailored to what the scam wanted.
import { officialBrandOf } from '../../server/lib/domains.js';

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
// Links first (that's where the victim goes), then lookalike domains named in the flags, then the sender.
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

/** What the attacker does next, based on what the scam was after. */
export function attackPlan(card) {
  const fake = card.type === 'twin' ? card[card.phish] : card;
  const cats = new Set(card.flags.map((f) => f.category));
  const domain = scamDomain(card, fake);
  const file = fake.attachments?.[0]?.name;
  const tell = [...card.flags].sort((a, b) => SEV[b.severity] - SEV[a.severity])[0];

  let plan;
  if (cats.has('mfa_code')) {
    plan = {
      headline: 'You handed over the last lock.',
      steps: [
        ['0:00', 'You share the 6-digit code. The scammer already had your password and was waiting on the login screen.'],
        ['0:03', "They're inside your Pepperdine Google account. 2-step verification didn't help, because you gave them the code."],
        ['0:10', 'They add their own phone as a sign-in method, so resetting your password alone won\'t kick them out.'],
        ['0:30', 'Your email, Drive, class files and financial aid portal are theirs to read and change.'],
      ],
    };
  } else if (cats.has('credentials') || (cats.has('lookalike_domain') && fake.links?.length)) {
    plan = {
      headline: domain ? `You signed in on ${domain}.` : 'You gave them your password.',
      steps: [
        ['0:00', domain
          ? `Your email and password go straight to the scammer's server. ${domain} looked real enough.`
          : 'You did what the message asked. Your password goes to the scammer, not to the office the message pretended to be.'],
        ['0:02', 'A script tries the same password on your Pepperdine account, Instagram and your bank, in case you reuse it.'],
        ['0:05', 'A hidden mail filter starts deleting security alerts and replies, so you don\'t notice.'],
        ['0:15', 'Your account sends this same scam to hundreds of classmates and professors, from your real address.'],
        ['2:00', 'Your refund or direct-deposit details are switched to their bank account.'],
      ],
    };
  } else if (cats.has('personal_info')) {
    plan = {
      headline: 'Your identity is now for sale.',
      steps: [
        ['0:00', 'Your ID photo, card or bank details land in the scammer\'s inbox.'],
        ['Day 1', 'They open a credit card and a phone plan in your name.'],
        ['Month 2', 'Collections calls start for debts you never made.'],
        ['After', 'Cleaning up identity theft means credit freezes, police reports and months of paperwork.'],
      ],
    };
  } else if (cats.has('job_scam')) {
    plan = {
      headline: 'The check was fake. The money you sent was real.',
      steps: [
        ['Day 0', 'You deposit their check and send part of it back "for supplies," like they asked.'],
        ['Day 2', 'Your bank shows the money as available. Available isn\'t the same as cleared.'],
        ['Day 10', 'The check bounces. The bank takes the full amount back out of your account.'],
        ['After', "You're out the money you sent, plus fees. The \"employer\" has vanished."],
      ],
    };
  } else if (cats.has('money') || cats.has('prize')) {
    plan = {
      headline: 'The money is gone.',
      steps: [
        ['0:00', 'You pay: gift card codes, a "fee," or a transfer.'],
        ['0:01', 'Gift card balances get drained within minutes and resold. Transfers get moved on.'],
        ['Day 1', 'The real person or office never asked. This money is almost never recovered.'],
        ['After', 'You\'re now on a list of people who pay, so expect more scams.'],
      ],
    };
  } else if (cats.has('attachment')) {
    plan = {
      headline: file ? `You opened ${file}.` : 'You installed the "update."',
      steps: [
        ['0:00', file ? `${file} runs hidden code the moment it opens.` : 'The "plugin" or "update" is malware. It starts running the moment you install it.'],
        ['0:02', 'It copies the passwords and sign-in cookies saved in your browser.'],
        ['0:10', 'With those cookies they walk into your accounts without a password or a 2FA code.'],
        ['1:00', 'Some versions also lock your files and demand a ransom.'],
      ],
    };
  } else if (fake.links?.some((l) => /docs\.google\.com\/forms|forms\.gle/i.test(l.href || ''))) {
    plan = {
      headline: "You filled in a stranger's Google Form.",
      steps: [
        ['0:00', 'The "document" is a Google Form asking you to confirm your Pepperdine email and password to view it.'],
        ['0:01', "Anyone can make a Google Form. Your answers land in the scammer's spreadsheet."],
        ['0:05', 'They sign in as you and read your mail, Drive and class files.'],
        ['0:20', 'Your account sends the same "document" to your classmates. That is how it reached you: a friend got hacked first.'],
      ],
    };
  } else if (/\bqr\b|scan (?:the|this) code/i.test(fake.body || '')) {
    plan = {
      headline: 'You scanned the code.',
      steps: [
        ['0:00', 'Your phone opens a payment page. On a small screen, with no hover, the fake address is easy to miss.'],
        ['0:30', 'You pay the "renewal" and enter your card number and billing address.'],
        ['Day 1', 'Your card is charged again and again, in small amounts that are easy to overlook.'],
        ['After', 'Email filters never saw the link, because it was hidden inside an image.'],
      ],
    };
  } else if (!fake.links?.length && (cats.has('impersonation') || cats.has('sender_spoof') || cats.has('context'))) {
    plan = {
      headline: 'You replied. That was all they needed.',
      steps: [
        ['0:00', 'You answer "Sure, what do you need?" The scammer now knows you\'re real and willing to help.'],
        ['0:05', '"I\'m in a meeting and can\'t call. Can you buy a few gift cards for a student award? I\'ll pay you back today."'],
        ['0:40', 'You send photos of the codes. The balances are drained within minutes.'],
        ['Later', 'The real person never wrote to you. Gift card money is almost never recovered.'],
      ],
    };
  } else {
    plan = {
      headline: domain ? `You clicked through to ${domain}.` : 'You did what the message asked.',
      steps: [
        ['0:00', domain ? `A login page that looks exactly like the real one loads from ${domain}.` : 'You follow the instructions: call the number, reply, or sign in where it says.'],
        ['0:20', domain ? 'You sign in. Your password is theirs, and so is your session.' : 'The person on the other end is the scammer. They talk you into a password, a code or a payment.'],
        ['0:30', 'They read your mail and look for anything worth money: refunds, payroll, other accounts.'],
        ['1:00', 'Your account starts sending this scam to people who trust you.'],
      ],
    };
  }
  return { ...plan, tell };
}
