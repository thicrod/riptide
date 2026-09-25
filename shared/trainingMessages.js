// Training content for the Spot the Phish game.
//
// Design goal: every scam here is caught by a REAL, visible detail (one letter, a dash, a dot,
// a swapped comma, a hidden link destination, a Reply-To header, one changed word), never by
// being confusing. About half of the messages are legit, and several legit messages look "scary"
// on purpose, so reflexively answering "phish" doesn't work.
//
// All people, companies, phone numbers (555) and domains below are fictional or used only as
// training examples. Links are never clickable in the game.
//
// Fields a flag's `quote` may point at: from.name, from.address, subject, body, a link's text,
// an attachment name, or details.mailedBy / signedBy / to / replyTo (a test enforces this).
//
// Email `details` mirror Gmail's "show details" panel. If omitted, mailed-by and signed-by
// default to the sender's own domain.

const P = 'Pepperdine';

export const TRAINING_MESSAGES = [
  // ───────────────────────── LEVEL 1: LOOK CLOSER ─────────────────────────
  // One small detail gives each scam away.
  {
    id: 'l1-onedrive', level: 1, channel: 'email', isPhish: true, time: 'Mon 7:42 AM',
    from: { name: 'Microsoft account team', address: 'no-reply@rnicrosoftonline.com' },
    subject: 'Your OneDrive storage is 98% full',
    body: `Hi,

Your OneDrive is almost full. Once you reach your limit, you won't be able to upload, edit or sync new files, and email attachments may stop working.

Review your storage

Thanks,
The Microsoft account team`,
    links: [{ text: 'Review your storage', href: 'https://rnicrosoftonline.com/onedrive/storage' }],
    flags: [
      { quote: 'rnicrosoftonline.com', category: 'lookalike_domain', severity: 'high', why: 'Look closely: "rn" (an r next to an n) is standing in for "m." The real domain is microsoftonline.com.' },
      { quote: 'Review your storage', category: 'link_mismatch', severity: 'high', why: 'The button goes to the same fake "rn" domain, where a copy of the Microsoft login page is waiting.' },
      { quote: 'email attachments may stop working', category: 'threat', severity: 'low', why: 'A mild, believable consequence to get you clicking.' },
    ],
    compare: [{ label: 'Sender domain', real: 'microsoftonline.com', fake: 'rnicrosoftonline.com', note: '"rn" pretending to be "m"' }],
    explanation: 'At normal reading speed "rn" and "m" look identical, especially in small fonts. Zoom in on the domain. If you really use OneDrive, check your storage by opening the app yourself.',
  },
  {
    id: 'l1-usps-fake', level: 1, channel: 'sms', isPhish: true, time: 'Tue 2:15 PM',
    from: { name: '+1 (213) 555-0187' },
    body: `USPS: Your package 9400 1118 9922 3857 0014 26 could not be delivered due to an incomplete address. Update your details here: https://usps.com-redeliver.info/track

(Reply Y, then close and reopen this message to activate the link.)`,
    links: [{ text: 'https://usps.com-redeliver.info/track', href: 'https://usps.com-redeliver.info/track' }],
    flags: [
      { quote: '+1 (213) 555-0187', category: 'sender_spoof', severity: 'medium', why: 'Real USPS texts come from the short code 28777, and only if you signed up. This is a personal phone number.' },
      { quote: 'usps.com-redeliver.info', category: 'lookalike_domain', severity: 'high', why: 'It starts with "usps.com", but the dash right after it changes everything. The real owner is com-redeliver.info.' },
      { quote: 'Reply Y, then close and reopen this message to activate the link', category: 'risky_link', severity: 'high', why: 'Phones disable links from unknown senders. Replying "Y" tells your phone you trust them and turns the link on. It is a known smishing trick.' },
    ],
    compare: [{ label: 'Tracking link', real: 'https://tools.usps.com/go/TrackConfirmAction', fake: 'https://usps.com-redeliver.info/track', note: 'A dash after ".com" makes it a different website', mode: 'tokens' }],
    explanation: 'The tracking number looks real and the tone is calm. The giveaways are small: a dash right after "usps.com", a regular phone number instead of the USPS short code, and the "Reply Y" trick.',
  },
  {
    id: 'l1-usps-real', level: 1, channel: 'sms', isPhish: false, time: 'Mon 2:16 PM',
    context: 'You signed up for USPS text tracking for a package you ordered.',
    from: { name: '28777' },
    body: 'USPS: Your item was delivered in or at the mailbox at 2:14 pm on September 21 in MALIBU, CA 90263. Reply STOP to cancel. Track: https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223857001426',
    links: [{ text: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223857001426', href: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223857001426' }],
    flags: [],
    goodSigns: ['Comes from the USPS short code (28777) you signed up with', 'The link is on tools.usps.com (the real domain ends in usps.com)', 'It is just an update and asks for nothing'],
    explanation: 'Legit. Compare it with the fake USPS text: a real domain, the official short code, and "Reply STOP" (to unsubscribe) instead of "Reply Y" (to switch on a link).',
  },
  {
    id: 'l1-handshake-fake', level: 1, channel: 'email', isPhish: true, time: 'Wed 11:03 AM',
    from: { name: 'Handshake', address: 'notifications@joinhandsahke.com' },
    subject: 'Coastline Labs sent you a message',
    body: `Coastline Labs sent you a message

"Hi! We reviewed your profile and think you'd be a great fit for our Data Analyst Intern role (Summer 2027). Are you free for a 15-minute call this week? Please confirm your availability through Handshake."

View message

You're receiving this email because you have a Handshake account.`,
    links: [{ text: 'View message', href: 'https://joinhandsahke.com/messages/48213' }],
    flags: [
      { quote: 'joinhandsahke.com', category: 'lookalike_domain', severity: 'high', why: 'Two letters are swapped: "handsahke" instead of "handshake." The real domain is joinhandshake.com.' },
      { quote: 'View message', category: 'link_mismatch', severity: 'high', why: 'The button goes to the misspelled domain, which shows a fake Handshake login page.' },
    ],
    compare: [{ label: 'Sender domain', real: 'joinhandshake.com', fake: 'joinhandsahke.com', note: 'Two letters swapped' }],
    explanation: 'Your brain reads words by their overall shape, so swapped letters in the middle slip right past. Students trust Handshake, which is exactly why it gets copied. Open the Handshake app yourself to read messages.',
  },
  {
    id: 'l1-handshake-real', level: 1, channel: 'email', isPhish: false, time: 'Thu 9:20 AM',
    context: 'You applied to this internship on Handshake last week.',
    from: { name: 'Handshake', address: 'notifications@joinhandshake.com' },
    subject: 'Your application to Coastline Labs was viewed',
    body: `Good news! An employer viewed your application.

Data Analyst Intern (Summer 2027)
Coastline Labs · Los Angeles, CA

View application

You're receiving this email because you have a Handshake account.`,
    links: [{ text: 'View application', href: 'https://app.joinhandshake.com/applications' }],
    flags: [],
    goodSigns: ['Sender is joinhandshake.com, spelled correctly', 'The button goes to app.joinhandshake.com', 'Matches an application you really sent'],
    explanation: 'Legit. It is the same template the fakes copy, but the domain is spelled correctly everywhere and it matches something you actually did.',
  },
  {
    id: 'l1-registrar', level: 1, channel: 'email', isPhish: true, time: 'Fri 8:30 AM',
    from: { name: 'Office of the Registrar', address: 'registrar@pepperdine-edu.us' },
    subject: 'Enrollment verification required for Spring 2027',
    body: `Hello,

As part of our annual compliance review, all Seaver College students must verify their enrollment status before Spring 2027 registration opens. Students who do not verify may experience a registration hold.

Verify enrollment

Office of the Registrar
${P} Univeristy
24255 Pacific Coast Highway, Malibu, CA 90263`,
    links: [{ text: 'Verify enrollment', href: 'https://pepperdine-edu.us/registrar/verify' }],
    flags: [
      { quote: 'pepperdine-edu.us', category: 'lookalike_domain', severity: 'high', why: 'A dash instead of a dot, and ".us" instead of ".edu". Only Pepperdine can use pepperdine.edu.' },
      { quote: 'Univeristy', category: 'sloppy', severity: 'medium', why: '"Univeristy": two letters swapped in the university\'s own name. A real office would not misspell it.' },
      { quote: 'may experience a registration hold', category: 'threat', severity: 'medium', why: 'A registration hold is a scary, believable threat for students.' },
      { quote: 'Verify enrollment', category: 'link_mismatch', severity: 'high', why: 'The button goes to pepperdine-edu.us, not pepperdine.edu.' },
    ],
    compare: [
      { label: 'Sender domain', real: 'pepperdine.edu', fake: 'pepperdine-edu.us' },
      { label: 'Signature', real: 'Pepperdine University', fake: 'Pepperdine Univeristy' },
    ],
    explanation: 'It looks official, down to the real campus address. The tells: a domain that only resembles pepperdine.edu, and a typo in the university\'s own name.',
  },
  {
    id: 'l1-maintenance', level: 1, channel: 'email', isPhish: false, time: 'Mon 10:00 AM',
    from: { name: 'Pepperdine Information Technology', address: 'it.announcements@pepperdine.edu' },
    subject: 'Scheduled maintenance this Saturday, 2–4 AM',
    body: `Hello Waves,

Some campus systems will be briefly unavailable this Saturday from 2:00 to 4:00 AM for scheduled maintenance. No action is needed on your part.

Details and status updates are posted at community.pepperdine.edu/it.

Questions? Call Tech Support at 310.506.4357, available 24/7.

Pepperdine Information Technology`,
    links: [{ text: 'community.pepperdine.edu/it', href: 'https://community.pepperdine.edu/it/' }],
    flags: [],
    goodSigns: ['Sent, mailed and signed by pepperdine.edu', 'The link really goes to pepperdine.edu', 'Asks you to do nothing', 'Lists the real Tech Support number'],
    explanation: 'Legit: official sender, the link goes where it says, and it asks nothing of you.',
  },

  // ───────────────────────── LEVEL 2: PIXEL-PERFECT ─────────────────────────
  // Real-looking senders, hidden headers, identical templates, invisible characters.
  {
    id: 'l2-finaid', level: 2, channel: 'email', isPhish: true, time: 'Mon 9:12 AM',
    from: { name: 'Pepperdine Financial Aid', address: 'finaid@pepperdine.edu' },
    details: { replyTo: 'finaid.pepperdine@outlook.com', mailedBy: 'mx4.bulk-relay.net', signedBy: null },
    subject: 'Your Fall 2026 refund is ready',
    body: `Hello,

Your Fall 2026 financial aid refund of $1.240,00 has been approved. To receive it by direct deposit, please confirm your banking details in the student portal within 3 business days.

View refund

If you have questions, simply reply to this email.

Office of Financial Assistance
Pepperdine University`,
    links: [{ text: 'View refund', href: 'https://pepperdine.edu@refund-portal.co/login' }],
    flags: [
      { quote: 'finaid.pepperdine@outlook.com', category: 'sender_spoof', severity: 'high', why: 'The From line says pepperdine.edu, but replies go to an Outlook account. From lines can be faked; Reply-To shows who you are really talking to.' },
      { quote: 'mx4.bulk-relay.net', category: 'sender_spoof', severity: 'high', why: '"Mailed-by" shows who actually sent it. Real Pepperdine mail is mailed by and signed by pepperdine.edu. This one is not signed at all.' },
      { quote: '$1.240,00', category: 'sloppy', severity: 'medium', why: 'The dot and comma are swapped. In the US it is written $1,240.00. A tiny hint the sender is not a US office.' },
      { quote: 'confirm your banking details', category: 'personal_info', severity: 'high', why: 'Changing where your money goes is exactly what the attacker wants.' },
      { quote: 'View refund', category: 'link_mismatch', severity: 'high', why: 'The link starts with "pepperdine.edu@", but browsers ignore everything before the @. It really goes to refund-portal.co.' },
    ],
    compare: [
      { label: 'Amount', real: '$1,240.00', fake: '$1.240,00', note: 'Comma and dot swapped' },
      { label: 'Link', real: 'https://pepperdine.edu/refunds', fake: 'https://pepperdine.edu@refund-portal.co/login', note: 'Everything before the "@" is ignored', mode: 'tokens' },
    ],
    explanation: 'The From address really says @pepperdine.edu, because it can be faked. To catch this one you had to open the sender details (Reply-To and mailed-by), hover the link, or notice one swapped comma.',
  },
  {
    id: 'l2-docusign-fake', level: 2, channel: 'email', isPhish: true, time: 'Tue 4:05 PM',
    from: { name: 'Pepperdine Human Resources via DocuSign', address: 'dse_na2@docusgn.net' },
    subject: 'Please DocuSign: Student Employment Offer – Fall 2026.pdf',
    body: `Pepperdine Human Resources sent you a document to review and sign.

REVIEW DOCUMENT

Student Employment Offer – Fall 2026.pdf

Please complete by September 25, 2026.

Do Not Share This Email
This email contains a secure link to DocuSign. Please do not share this email, link, or access code with others.`,
    links: [{ text: 'REVIEW DOCUMENT', href: 'https://docusgn.net/Signing/EmailStart.aspx?a=8f21c' }],
    flags: [
      { quote: 'docusgn.net', category: 'lookalike_domain', severity: 'high', why: 'Missing an "i": docusgn instead of docusign. Real DocuSign email comes from docusign.net.' },
      { quote: 'Student Employment Offer', category: 'context', severity: 'medium', why: 'Did you apply for a campus job? An offer you never applied for is bait.' },
      { quote: 'REVIEW DOCUMENT', category: 'link_mismatch', severity: 'high', why: 'The button goes to docusgn.net, the misspelled domain.' },
    ],
    compare: [{ label: 'Sender domain', real: 'docusign.net', fake: 'docusgn.net', note: 'One missing letter' }],
    explanation: 'A pixel-perfect copy of the real DocuSign template, even the "Do Not Share This Email" footer. One missing letter in the domain is the only visual clue, plus the question: were you expecting an offer?',
  },
  {
    id: 'l2-docusign-real', level: 2, channel: 'email', isPhish: false, time: 'Tue 4:05 PM',
    context: 'You accepted a job at Payson Library last week, and HR told you a DocuSign would arrive.',
    from: { name: 'Pepperdine Human Resources via DocuSign', address: 'dse_na3@docusign.net' },
    subject: 'Please DocuSign: Student Employment Offer – Fall 2026.pdf',
    body: `Pepperdine Human Resources sent you a document to review and sign.

REVIEW DOCUMENT

Student Employment Offer – Fall 2026.pdf

Please complete by September 25, 2026.

Do Not Share This Email
This email contains a secure link to DocuSign. Please do not share this email, link, or access code with others.`,
    links: [{ text: 'REVIEW DOCUMENT', href: 'https://na3.docusign.net/Signing/EmailStart.aspx?a=4c77d' }],
    flags: [],
    goodSigns: ['Sender is docusign.net, spelled correctly', 'The button goes to na3.docusign.net', 'You were told to expect it'],
    explanation: 'Legit. It is word-for-word the same as the fake DocuSign email. The difference is one letter in the domain, plus context: you knew it was coming.',
  },
  {
    id: 'l2-paypal', level: 2, channel: 'email', isPhish: true, time: 'Wed 6:48 PM',
    from: { name: 'PayPal', address: 'service@pаypal.com' },
    details: { mailedBy: 'xn--pypal-4ve.com', signedBy: 'xn--pypal-4ve.com' },
    subject: 'We noticed a new login to your account',
    body: `Hi,

We noticed a login to your PayPal account from a new device.

Device: Windows PC · Chrome
Location: Houston, TX, United States

If this was you, you can ignore this email. If not, please secure your account right away:

www.pаypal.com/security

Thanks,
PayPal`,
    links: [{ text: 'www.pаypal.com/security', href: 'https://www.xn--pypal-4ve.com/security' }],
    flags: [
      { quote: 'www.pаypal.com/security', category: 'lookalike_domain', severity: 'high', why: 'That first "a" is actually the Cyrillic letter "а". It looks identical but it is a different website. Hovering shows its real name: xn--pypal-4ve.com.' },
      { quote: 'xn--pypal-4ve.com', category: 'lookalike_domain', severity: 'high', why: 'The sender details show the "xn--" form of the name, the telltale sign of lookalike letters from another alphabet.' },
      { quote: 'right away', category: 'urgency', severity: 'medium', why: 'A security scare plus urgency, so you click before checking.' },
    ],
    compare: [{ label: 'Domain', real: 'paypal.com', fake: 'pаypal.com', note: 'The "а" is Cyrillic, a different character that looks the same' }],
    explanation: 'This is a homograph attack: letters from another alphabet that look exactly the same. You can\'t catch it by reading. You catch it by hovering, opening the sender details, or typing paypal.com yourself. Even "If this was you, ignore this email" is there to make it feel real.',
  },
  {
    id: 'l2-hacked-classmate', topic: 'drive', level: 2, channel: 'email', isPhish: true, time: 'Thu 10:41 PM',
    from: { name: 'Maya Chen', address: 'maya.chen@pepperdine.edu' },
    details: { to: 'undisclosed-recipients:;', mailedBy: 'pepperdine.edu', signedBy: 'pepperdine.edu' },
    subject: 'Group Project - Final Draft',
    body: `Hi,

I have shared the final draft with you via Google Drive. Please review it before our meeting.

Group_Project_Final_Draft.pdf
Open document

Thanks,
Maya`,
    links: [{ text: 'Open document', href: 'https://docs.google.com/forms/d/e/1FAIpQLSd8x2Kq9/viewform' }],
    flags: [
      { quote: 'undisclosed-recipients:;', category: 'context', severity: 'medium', why: 'It went to a hidden list of people, not to you. Hacked accounts blast the same message to everyone in their contacts.' },
      { quote: 'Please review it before our meeting', category: 'context', severity: 'medium', why: 'Vague on purpose ("the final draft," "our meeting") so it fits almost anyone.' },
      { quote: 'Open document', category: 'link_mismatch', severity: 'high', why: 'It says "document," but the link is a Google Form (docs.google.com/forms). Anyone can make one, and this one asks for your Pepperdine password.' },
    ],
    compare: [{ label: 'Link', real: 'https://drive.google.com/file/d/1x9Ab/view', fake: 'https://docs.google.com/forms/d/e/1FAIpQLSd8x2Kq9/viewform', note: 'A shared file lives at drive.google.com/file, not /forms', plain: true }],
    explanation: 'The hardest kind: the sender is a REAL Pepperdine account, probably hacked, so the domain and signature check out. The clues are the hidden recipient list, the vague story, and a "document" that is really a Google Form. When in doubt, text the person on a number you already have.',
  },
  {
    id: 'l2-emergency-contact', level: 2, channel: 'email', isPhish: false, time: 'Mon 8:00 AM',
    from: { name: 'Pepperdine Office of Emergency Management', address: 'oem@pepperdine.edu' },
    subject: 'Action required: confirm your emergency contact by Friday',
    body: `Hello Waves,

Wildfire season is here. So we can reach your family quickly in an emergency, please confirm your emergency contact information by Friday, September 25.

Update your emergency contact: pepperdine.edu/emergency/contact-update

It takes about a minute. Questions? Reply to this email or stop by the Public Safety office.`,
    links: [{ text: 'pepperdine.edu/emergency/contact-update', href: 'https://pepperdine.edu/emergency/contact-update' }],
    flags: [],
    goodSigns: ['Sender and link are both on pepperdine.edu, and they match', 'Mailed-by and signed-by pepperdine.edu in the sender details', 'A timely request with a reasonable deadline', 'Asks for no password or payment in the email'],
    explanation: 'Legit, even though it says "Action required" and has a deadline. Urgency alone is not proof of a scam. The sender, the signature and the link destination all check out.',
  },
  {
    id: 'l2-bank-alert', level: 2, channel: 'sms', isPhish: false, time: 'Thu 6:48 PM',
    context: "You're buying a laptop online right now. Your credit union's alerts always come from 73981.",
    from: { name: '73981' },
    body: 'Coastal Credit Union: Did you attempt a $749.99 purchase at BESTBUY.COM on card ending 4417? Reply YES or NO. We will never ask for your PIN or password.',
    flags: [],
    goodSigns: ['Matches what you are doing right now', 'Same short code as your earlier alerts', 'No link, and it never asks for a PIN or password'],
    explanation: 'Legit. Real fraud alerts ask a simple YES/NO about a specific purchase, with no link. If a "bank" then CALLS you asking for a code, hang up and call the number on your card.',
  },

  // ───────────────────────── LEVEL 3: AI-ERA ─────────────────────────
  // Flawless writing, real names, hacked or spoofed senders, cloned voices. Context is everything.
  {
    id: 'l3-professor-fake', level: 3, channel: 'email', isPhish: true, time: 'Wed 4:36 PM',
    from: { name: 'Daniel Reyes', address: 'daniel.reyes@pepperdine.edu' },
    details: { replyTo: 'dreyes.office@gmail.com', mailedBy: 'gmail.com', signedBy: 'gmail.com' },
    subject: 'Re: Midterm regrade request',
    body: `Hi,

Thanks for stopping by office hours on Tuesday. I went back through your midterm and you were right about question 4, so I have adjusted your score.

Before I can submit the grade change to the registrar, FERPA requires me to verify your identity. Could you reply with your full student ID number and date of birth? I'd like to get this in before the deadline tonight.

Best,
Daniel Reyes
Associate Professor of Computer Science`,
    flags: [
      { quote: 'gmail.com', category: 'sender_spoof', severity: 'high', why: 'Mailed-by gmail.com: this email did not come from Pepperdine\'s mail servers, even though the From line says pepperdine.edu.' },
      { quote: 'dreyes.office@gmail.com', category: 'sender_spoof', severity: 'high', why: 'Your reply would go to a Gmail address, not to the professor.' },
      { quote: 'Thanks for stopping by office hours on Tuesday', category: 'context', severity: 'medium', why: 'Real-sounding details are easy to guess, and AI makes them sound natural.' },
      { quote: 'reply with your full student ID number and date of birth', category: 'personal_info', severity: 'high', why: 'Your professor already knows who you are. No FERPA process works by emailing your ID and birthday.' },
      { quote: 'before the deadline tonight', category: 'urgency', severity: 'medium', why: 'A soft deadline so you reply before thinking.' },
    ],
    compare: [{ label: 'Your reply goes to', real: 'daniel.reyes@pepperdine.edu', fake: 'dreyes.office@gmail.com', plain: true }],
    explanation: 'No typos, no links, and a real-looking professor address in the From line. The clues hide in the sender details and in the request itself.',
  },
  {
    id: 'l3-professor-real', level: 3, channel: 'email', isPhish: false, time: 'Wed 4:36 PM',
    context: 'You asked Professor Reyes about question 4 in office hours on Tuesday.',
    from: { name: 'Daniel Reyes', address: 'daniel.reyes@pepperdine.edu' },
    subject: 'Re: Midterm regrade request',
    body: `Hi,

Thanks for stopping by office hours on Tuesday. I went back through your midterm and you were right about question 4, so I have adjusted your score.

The updated grade is posted on the course site now. Let me know if anything looks off.

Best,
Daniel Reyes
Associate Professor of Computer Science`,
    flags: [],
    goodSigns: ['Mailed-by and signed-by pepperdine.edu', 'No Reply-To trick: replies go to his real address', 'Points you to the course site you already use and asks for nothing'],
    explanation: 'Legit. Almost word-for-word the same as the fake regrade email. The difference is what it asks for (nothing) and where your reply would go.',
  },
  {
    id: 'l3-voice', level: 3, channel: 'voicemail', isPhish: true, time: 'Fri 10:14 PM',
    context: 'Voicemail transcript. Caller ID shows "Mom" from your contacts, and it sounds exactly like her.',
    from: { name: 'Mom', address: 'mobile' },
    body: "Hi honey, it's me. Don't panic, I'm okay, but I was in a small car accident and the other driver says I have to pay for his repairs right now or he'll call the police. My bank card isn't working. Can you Zelle $600 to his number, 424-555-0138? Please do it right away and don't tell Dad yet, he'll just worry. I'll pay you back tonight. Love you.",
    flags: [
      { quote: 'Mom', category: 'impersonation', severity: 'medium', why: 'Caller ID can be spoofed. Seeing "Mom" on screen does not prove it is her.' },
      { quote: "or he'll call the police", category: 'threat', severity: 'medium', why: 'Panic plus a threat leaves no time to think.' },
      { quote: 'Zelle $600 to his number', category: 'money', severity: 'high', why: 'Paying a stranger by Zelle is instant and almost impossible to reverse.' },
      { quote: 'right away', category: 'urgency', severity: 'medium', why: 'Emotional pressure plus urgency.' },
      { quote: "don't tell Dad yet", category: 'impersonation', severity: 'high', why: 'Secrecy keeps you from checking with someone who could confirm.' },
    ],
    explanation: 'AI can clone a voice from a few seconds of video, and caller ID can be faked. Hang up and call Mom back on her saved number, or ask a family "safe word" only she would know.',
  },
  {
    id: 'l3-dean', level: 3, channel: 'sms', isPhish: true, time: 'Tue 10:02 AM',
    from: { name: 'dean.whitaker.seaver@icloud.com' },
    body: "Hi, this is Dean Whitaker. Are you on campus today? I need a quick favor for a student event and I'm stuck in back-to-back meetings, so I can't take calls. Reply when you get this.",
    flags: [
      { quote: 'dean.whitaker.seaver@icloud.com', category: 'sender_spoof', severity: 'high', why: 'A dean would not text you from a personal iCloud address you have never seen.' },
      { quote: 'quick favor', category: 'impersonation', severity: 'medium', why: 'The classic opener of the "boss needs help" scam.' },
      { quote: "I can't take calls", category: 'impersonation', severity: 'medium', why: 'Blocks you from verifying by phone.' },
      { quote: 'Reply when you get this', category: 'context', severity: 'medium', why: 'No link and no request yet. The first message only starts a conversation; the gift-card ask comes after you reply.' },
    ],
    explanation: 'Many real attacks start with a harmless-looking opener that spam filters (and people) wave through. Scammers pull names from department web pages. Verify through the dean\'s office number on pepperdine.edu.',
  },
  {
    id: 'l3-quishing', level: 3, channel: 'email', isPhish: true, time: 'Mon 8:05 AM',
    qr: 'https://pepperdine.edu.parking-renew.site/renew',
    from: { name: 'Pepperdine Transportation & Parking', address: 'permits@pepperdine.edu' },
    details: { mailedBy: 'parking-renew.site', signedBy: null },
    subject: 'Parking permit renewal: scan to avoid a citation',
    body: `Your 2026–27 campus parking permit has not been renewed. Vehicles without a valid permit will receive a $75 citation starting Monday.

Scan the QR code below with your phone to renew in under a minute.`,
    flags: [
      { quote: 'parking-renew.site', category: 'sender_spoof', severity: 'high', why: 'Mailed-by parking-renew.site and not signed by pepperdine.edu. The From line was faked.' },
      { quote: 'Scan the QR code', category: 'risky_link', severity: 'high', why: '"Quishing": a QR code hides the link and moves you to your phone, where the address is harder to check and email filters can\'t help.' },
      { quote: '$75 citation', category: 'threat', severity: 'medium', why: 'A penalty to scare you into acting.' },
    ],
    explanation: 'QR-code phishing is growing fast because email security can\'t read the link and you can\'t hover it. The sender details give it away. Renew permits by typing the official site yourself.',
  },
  {
    id: 'l3-code', level: 3, channel: 'sms', isPhish: false, time: 'Mon 9:58 AM',
    context: "You're signing in to your Pepperdine account on your laptop right now.",
    from: { name: '41532' },
    body: "Pepperdine: Your verification code is 482913. It expires in 10 minutes. Never share this code. We will never call or text you to ask for it.",
    flags: [],
    goodSigns: ['YOU started the sign-in', 'It only delivers the code and does not ask you to send it anywhere', 'Tells you never to share it'],
    explanation: 'Legit. The danger is when someone asks you to read this code back to them, by text, email or phone.',
  },
  {
    id: 'l3-alert', level: 3, channel: 'sms', isPhish: false, time: 'Wed 7:10 AM',
    context: 'You signed up for Pepperdine emergency alerts. They always come from this number.',
    from: { name: '67283' },
    body: 'Pepperdine Alert: A Red Flag Warning (high fire danger) is in effect for Malibu through Friday 6 PM. No action is needed right now. Review wildfire safety info at emergency.pepperdine.edu',
    links: [{ text: 'emergency.pepperdine.edu', href: 'https://emergency.pepperdine.edu' }],
    flags: [],
    goodSigns: ['Comes from the alert number you signed up for', 'The link is on pepperdine.edu', 'Informs you and asks for nothing'],
    explanation: 'Legit. Real emergency alerts inform you and point to official pages. Scam "alerts" ask you to log in, pay or download something.',
  },
  {
    id: 'l3-google', level: 3, channel: 'email', isPhish: false, time: 'Sat 1:22 PM',
    context: 'You just signed in on your new laptop.',
    from: { name: 'Google', address: 'no-reply@accounts.google.com' },
    subject: 'Security alert: New sign-in on Mac',
    body: `A new sign-in on Mac

We noticed a new sign-in to your Google Account on a Mac device. If this was you, you don't need to do anything. If not, we'll help you secure your account.

Check activity

You can also see security activity at https://myaccount.google.com/notifications`,
    links: [
      { text: 'Check activity', href: 'https://myaccount.google.com/notifications' },
      { text: 'https://myaccount.google.com/notifications', href: 'https://myaccount.google.com/notifications' },
    ],
    flags: [],
    goodSigns: ['Sent from accounts.google.com and signed by it', 'The button goes to myaccount.google.com', 'Matches what you just did', 'Tells you that you do not need to do anything'],
    explanation: 'Legit. Compare it with the fake PayPal alert: same kind of message, but here the sender AND the link really belong to google.com.',
  },
];

// ───────────────────────── SPOT THE DIFFERENCE ─────────────────────────
// Two near-identical messages; exactly one is a scam. The server randomizes which side is A or B.
export const TRAINING_TWINS = [
  {
    id: 'twin-password', level: 2, type: 'twin',
    prompt: 'Both say your Pepperdine password is expiring. One is real. Which one is the scam?',
    real: {
      channel: 'email', time: 'Mon 9:02 AM',
      from: { name: 'Pepperdine Information Technology', address: 'it.notifications@pepperdine.edu' },
      subject: 'Your Pepperdine password expires in 5 days',
      body: `Hello,

Your Pepperdine account password will expire in 5 days. To avoid losing access to email and campus systems, please change your password before it expires.

Change password: https://password.pepperdine.edu

For help, contact Tech Support at 310.506.4357 (24/7).

Pepperdine Information Technology`,
      links: [{ text: 'https://password.pepperdine.edu', href: 'https://password.pepperdine.edu' }],
    },
    fake: {
      channel: 'email', time: 'Mon 9:02 AM',
      from: { name: 'Pepperdine Information Technology', address: 'it.notifications@pepperdine.edu' },
      details: { mailedBy: 'pepperdine-edu.help', signedBy: null },
      subject: 'Your Pepperdine password expires in 5 days',
      body: `Hello,

Your Pepperdine account password will expire in 5 days. To avoid losing access to email and campus systems, please confirm your current password before it expires.

Change password: https://password.pepperdine.edu

For help, contact Tech Support at 310.506.4357 (24/7).

Pepperdine Information Technology`,
      links: [{ text: 'https://password.pepperdine.edu', href: 'https://password.pepperdine.edu.reset-now.co' }],
    },
    flags: [
      { quote: 'pepperdine-edu.help', category: 'sender_spoof', severity: 'high', why: 'The From line is identical, but the sender details show it was mailed by pepperdine-edu.help and not signed by pepperdine.edu.' },
      { quote: 'confirm your current password', category: 'credentials', severity: 'high', why: 'Two words changed. Real IT asks you to CHANGE your password on their site; the fake asks you to CONFIRM your current one, so it can be stolen.' },
      { quote: 'https://password.pepperdine.edu', category: 'link_mismatch', severity: 'high', why: 'The link text is identical, but hovering shows it really goes to password.pepperdine.edu.reset-now.co.' },
    ],
    goodSigns: ['Mailed-by and signed-by pepperdine.edu', 'The link really goes to password.pepperdine.edu', 'Asks you to change your password on the official site, not to "confirm" it'],
    compare: [
      { label: 'Wording', real: 'please change your password', fake: 'please confirm your current password', mode: 'tokens' },
      { label: 'Where the link really goes', real: 'https://password.pepperdine.edu', fake: 'https://password.pepperdine.edu.reset-now.co' },
    ],
    explanation: 'The two emails are identical except for two words, a hidden link destination and the sender details. Attackers copy real IT emails word for word, so you have to hover links and open the details.',
  },
  {
    id: 'twin-drive', level: 2, type: 'twin',
    prompt: 'Your lab partner said she would share the lab report. Two share emails arrived. Which one is the scam?',
    real: {
      channel: 'email', time: 'Thu 3:14 PM',
      from: { name: 'Maya Chen (via Google Docs)', address: 'drive-shares-dm-noreply@google.com' },
      subject: 'Document shared with you: "CS 230 Lab 3 Report"',
      body: `Maya Chen (maya.chen@pepperdine.edu) has shared the following document:

CS 230 Lab 3 Report

Open

Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA
You have received this email because maya.chen@pepperdine.edu shared a document with you from Google Docs.`,
      links: [{ text: 'Open', href: 'https://docs.google.com/document/d/1Qx7Lm2vR8/edit?usp=sharing' }],
    },
    fake: {
      channel: 'email', time: 'Thu 3:14 PM',
      from: { name: 'Maya Chen (via Google Docs)', address: 'drive-shares-dm-noreply@googIe.com' },
      subject: 'Document shared with you: "CS 230 Lab 3 Report"',
      body: `Maya Chen (maya.chen@pepperdine.edu) has shared the following document:

CS 230 Lab 3 Report

Open

Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA
You have received this email because maya.chen@pepperdine.edu shared a document with you from Google Docs.`,
      links: [{ text: 'Open', href: 'https://docs.google.com.document-share.link/d/1Qx7Lm2vR8/edit' }],
    },
    flags: [
      { quote: 'googIe.com', category: 'lookalike_domain', severity: 'high', why: 'That is a capital "I", not a lowercase "l". In most fonts they look identical: googIe.com is not google.com.' },
      { quote: 'Open', category: 'link_mismatch', severity: 'high', why: 'Hovering shows docs.google.com.document-share.link. The real owner is document-share.link.' },
    ],
    goodSigns: ['Sender is google.com (lowercase l)', 'The Open button goes to docs.google.com/document', 'Matches what your lab partner told you'],
    compare: [
      { label: 'Sender', real: 'drive-shares-dm-noreply@google.com', fake: 'drive-shares-dm-noreply@googIe.com', note: 'Capital I instead of lowercase l' },
      { label: 'Open button goes to', real: 'https://docs.google.com/document/d/1Qx7Lm2vR8/edit', fake: 'https://docs.google.com.document-share.link/d/1Qx7Lm2vR8/edit' },
    ],
    explanation: 'Attackers time these to match something you expect, like a classmate sharing a file. The body is identical; only one letter in the sender and the link destination differ.',
  },
  {
    id: 'twin-code', level: 3, type: 'twin',
    context: "You're signing in to your Pepperdine account on a new laptop right now.",
    prompt: 'Two texts arrived while you were signing in. One is real. Which one is the scam?',
    real: {
      channel: 'sms', time: 'Mon 9:58 AM',
      from: { name: '41532' },
      body: 'Pepperdine: Your verification code is 482913. It expires in 10 minutes. Never share this code. We will never call or text you to ask for it.',
    },
    fake: {
      channel: 'sms', time: 'Mon 9:58 AM',
      from: { name: '+1 (786) 555-0199' },
      body: 'Pepperdine: A verification code was just sent to this phone. It expires in 10 minutes. To confirm this sign-in is you, reply with the 6-digit code now.',
    },
    flags: [
      { quote: '+1 (786) 555-0199', category: 'sender_spoof', severity: 'medium', why: 'Not the short code your real sign-in codes come from.' },
      { quote: 'reply with the 6-digit code now', category: 'mfa_code', severity: 'high', why: 'A real code message tells you NOT to share it. Anyone asking for your code is trying to log in as you.' },
    ],
    goodSigns: ['From the short code your codes always come from', 'Tells you never to share the code'],
    compare: [{ label: 'The key sentence', real: 'Never share this code.', fake: 'reply with the 6-digit code now.', plain: true }],
    explanation: 'Attackers who already have your password trigger a real code, then text you pretending to be IT so you send it to them. Same timing, same tone, opposite instruction.',
  },
  {
    id: 'twin-zoom', level: 3, type: 'twin',
    context: 'You have a video interview with Coastline Labs on Thursday at 2 PM.',
    prompt: 'Two interview confirmations arrived. Which one is the scam?',
    real: {
      channel: 'email', time: 'Tue 11:30 AM',
      from: { name: 'Coastline Labs Recruiting', address: 'recruiting@coastlinelabs.com' },
      subject: 'Interview confirmed: Data Analyst Intern, Thu 2:00 PM',
      body: `Hi,

Your interview is confirmed for Thursday at 2:00 PM (Pacific). You'll meet with Priya Nair, Analytics Lead.

Join Zoom Meeting
https://coastlinelabs.zoom.us/j/88213460117
Meeting ID: 882 1346 0117

See you Thursday!
Coastline Labs Recruiting`,
      links: [{ text: 'https://coastlinelabs.zoom.us/j/88213460117', href: 'https://coastlinelabs.zoom.us/j/88213460117' }],
    },
    fake: {
      channel: 'email', time: 'Tue 11:30 AM',
      from: { name: 'Coastline Labs Recruiting', address: 'recruiting@coastline-labs.com' },
      subject: 'Interview confirmed: Data Analyst Intern, Thu 2:00 PM',
      body: `Hi,

Your interview is confirmed for Thursday at 2:00 PM (Pacific). You'll meet with Priya Nair, Analytics Lead.

Join Zoom Meeting
https://coastlinelabs.zoom.us/j/88213460117
Meeting ID: 882 1346 0117

Before joining, please install the updated meeting plugin: ZoomInstaller_v6.2.pkg

See you Thursday!
Coastline Labs Recruiting`,
      links: [{ text: 'https://coastlinelabs.zoom.us/j/88213460117', href: 'https://coastlinelabs.zoom.us.meeting-join.app/j/88213460117' }],
    },
    flags: [
      { quote: 'coastline-labs.com', category: 'lookalike_domain', severity: 'high', why: 'A dash the real company doesn\'t use: coastline-labs.com is not coastlinelabs.com.' },
      { quote: 'https://coastlinelabs.zoom.us/j/88213460117', category: 'link_mismatch', severity: 'high', why: 'Same link text, but it really goes to zoom.us.meeting-join.app, not zoom.us.' },
      { quote: 'ZoomInstaller_v6.2.pkg', category: 'attachment', severity: 'high', why: 'Zoom never asks you to install a "plugin" from an email. A .pkg file installs software on a Mac: this is malware.' },
    ],
    goodSigns: ['Sender is coastlinelabs.com, the company\'s real domain', 'The link really goes to coastlinelabs.zoom.us', 'Nothing to download or install'],
    compare: [
      { label: 'Sender domain', real: 'coastlinelabs.com', fake: 'coastline-labs.com', note: 'One extra dash' },
      { label: 'Join link really goes to', real: 'https://coastlinelabs.zoom.us/j/88213460117', fake: 'https://coastlinelabs.zoom.us.meeting-join.app/j/88213460117' },
    ],
    explanation: 'Fake recruiters target CS students right when they are excited about an interview. One dash, one hidden link and one extra sentence are the only differences.',
  },
];

// Level names and points live in levels.js so the browser can load them without the whole question bank.
export { LEVELS, LEVEL_POINTS, TWIN_POINTS } from './levels.js';
