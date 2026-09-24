// "You got phished" outcomes. Each attack type has several variations (a headline + a short list of
// consequences), so players don't see the same wording every time they get caught. These describe the
// harm to the victim; they are awareness copy, not instructions.
// `c` = { domain: fake site or null, file: attachment name or null }.

const on = (c) => (c.domain ? ` on ${c.domain}` : '');

export const STORIES = {
  mfa: [
    () => ({ headline: 'You handed over the last lock.', steps: [
      'The code was for the scammer\'s login, not yours. They were already on the sign-in page waiting for it.',
      'Two-step verification is meant to stop exactly this. Sharing the code cancels it out.',
      'Now they can read your email, Drive and financial aid portal as if they were you.',
      'Real offices never ask you to read back a code. That request is the scam.',
    ] }),
    () => ({ headline: 'Six digits was the whole defense.', steps: [
      'Your password had probably already leaked somewhere. The code was the only thing left protecting you.',
      'With it, they signed in and marked their device as trusted, so they won\'t be asked again.',
      'They quietly set your account to notify them, not you, of anything important.',
      'One code became full access to everything tied to that account.',
    ] }),
    () => ({ headline: 'You verified them, not you.', steps: [
      'A verification code only ever proves who is signing in right now. You just proved it was them.',
      'They opened your student portal and looked at where your refunds are sent.',
      'That destination can be changed to an account they control.',
      'The office would see a normal-looking request, coming from your account.',
    ] }),
    () => ({ headline: 'The code was the key. They kept a copy.', steps: [
      'The moment you sent it, an automated login used it within seconds.',
      'They added a way to keep reading your mail even after a password change.',
      'Your account started replying to real email threads with a bad link.',
      'People trusted it, because it was a reply from you in a conversation they knew.',
    ] }),
    () => ({ headline: 'Real companies never ask for that code.', steps: [
      'The message called it a code to "verify you." It was really the login code for your own account.',
      'Once inside, they turned off your security alerts.',
      'Your account messaged your friends asking for a code they\'d just been sent.',
      'The same trick then worked on the people who trust you most.',
    ] }),
    () => ({ headline: 'The code only helps if you keep it.', steps: [
      'A code sent to you is meant for you alone, never to be read to anyone.',
      'Passing it along let the scammer finish a login they had already started.',
      'They can now change your recovery settings so future warnings go to them.',
      'Getting the account back can take days of proving it\'s really yours.',
    ] }),
    () => ({ headline: 'You unlocked the account for them.', steps: [
      'They had your password already; the code was the last thing in the way.',
      'Once in, they look through your mail for anything worth money or access.',
      'They can reset your other accounts using the inbox they now read.',
      'A single shared code can spread far beyond the one account.',
    ] }),
    () => ({ headline: 'That "verification" was the break-in.', steps: [
      'The message made the code sound like a safety step. It was the opposite.',
      'It let a stranger sign in as you from their own device.',
      'They turn off alerts so you stay unaware.',
      'The safest habit: never share a code, even with someone claiming to be support.',
    ] }),
    () => ({ headline: 'One number, full access.', steps: [
      'The code was the only barrier left, and now it\'s gone.',
      'They can read, send and delete mail as you.',
      'They may add a rule that quietly copies your incoming mail to them.',
      'Even after a password reset, hidden rules like that can keep working.',
    ] }),
    () => ({ headline: 'They asked, you told, they\'re in.', steps: [
      'Legit sign-ins never need someone else to read you the code.',
      'The request itself was proof it was a scam.',
      'Now they hold the account and can lock you out at will.',
      'Report it fast so IT can cut off the access before more damage.',
    ] }),
  ],

  password: [
    (c) => ({ headline: c.domain ? `You signed in on ${c.domain}.` : 'You gave them your password.', steps: [
      c.domain ? `That page only looked like the real one. What you typed went to ${c.domain}.` : 'Your password went to the scammer, not the office the message pretended to be.',
      'If you reuse that password, they now have the key to your other accounts too.',
      'They can read your mail and quietly hide the warning emails from you.',
      'Your account can be used to send the same scam to everyone you know.',
    ] }),
    (c) => ({ headline: `That login page${on(c)} was a copy.`, steps: [
      'It may have shown "wrong password, try again" just to get you to type it a second time.',
      'Then it sent you to the real site, so nothing felt off.',
      'Meanwhile someone signs in as you and reads your recent messages.',
      'They can reply from your account and ask people to move money or grades.',
    ] }),
    (c) => ({ headline: 'Your password now sits in a list.', steps: [
      `What you typed${on(c)} joins thousands of other stolen logins.`,
      'Pepperdine logins are worth more, because a .edu account unlocks student perks and access.',
      'A buyer signs in and uses your account for things you never agreed to.',
      'IT eventually locks it for odd activity, and you find out when you can\'t log in.',
    ] }),
    (c) => ({ headline: 'One password, several accounts.', steps: [
      `You typed your password${on(c)}. Is it the same one you use elsewhere?`,
      'Tools try it on other big sites within seconds.',
      'Wherever it matches, they get in, and change the password before you notice.',
      'This is why one reused password can unravel everything at once.',
    ] }),
    (c) => ({ headline: 'They waited for the right moment.', steps: [
      `Your password${on(c)} is saved. Nothing happens at first, on purpose.`,
      'Around refund or payday, they sign in and change where your money is sent.',
      'The payment goes out to an account they control.',
      'Getting money back after it lands in the wrong account can take weeks, if it works at all.',
    ] }),
    (c) => ({ headline: `You just handed over your login${on(c)}.`, steps: [
      'The scammer now has your username and password.',
      'They sign in and look for anything valuable in your account.',
      'They can lock you out by changing the password themselves.',
      'A real login page lives on the official site, not on a link from a message.',
    ] }),
    () => ({ headline: 'The "urgent" warning was the trap.', steps: [
      'Fear of losing access rushed you past the warning signs.',
      'The page collected your password the moment you typed it.',
      'Scammers rely on urgency so you don\'t stop to check the address.',
      'When a message pressures you to log in fast, that\'s the moment to slow down.',
    ] }),
    () => ({ headline: 'Saved, and waiting to be used.', steps: [
      'Your password sits in their hands until it\'s useful to them.',
      'They may sign in weeks later, when you\'ve forgotten the message.',
      'By then, unusual activity is harder to connect to this moment.',
      'Changing the password now is the only way to close that door.',
    ] }),
    () => ({ headline: 'It looked official. It wasn\'t.', steps: [
      'The logo, colors and layout were copied from the real site.',
      'Only the address was wrong, and that\'s the part that matters.',
      'What you typed went to whoever built the fake page.',
      'Check the address bar before you ever enter a password.',
    ] }),
    () => ({ headline: 'Your account is now theirs to use.', steps: [
      'With your password, they can send mail and messages as you.',
      'People who trust you get the next scam from your address.',
      'That\'s how this message likely reached you: a real account got taken first.',
      'Resetting your password stops it from spreading further through you.',
    ] }),
  ],

  personal_info: [
    () => ({ headline: 'Your identity is now for sale.', steps: [
      'Your ID photo or card and bank details went to a stranger.',
      'They can use them to open accounts in your name.',
      'You may not find out until a bill or collections call arrives for something you never did.',
      'Cleaning up identity theft can mean credit freezes, reports and months of paperwork.',
    ] }),
    () => ({ headline: 'You filled in more than you meant to.', steps: [
      'Name, birth date and ID number together are enough to impersonate you.',
      'They can pass "security questions" at your bank as if they were you.',
      'They may redirect your mail or phone number to lock you out.',
      'A real office already has this info and would never ask you to send it.',
    ] }),
    () => ({ headline: 'That was the last piece they needed.', steps: [
      'Scammers collect details in bits. You just gave them the one that completes the picture.',
      'Combined with data from old breaches, it\'s enough to take over accounts.',
      'The first sign is often a "did you just log in?" alert you didn\'t expect.',
      'The safest move now is to treat your key accounts as exposed and reset them.',
    ] }),
    () => ({ headline: 'A copy of you is now out there.', steps: [
      'They can build a fake ID or loan application using your real details.',
      'It gets used far from you, so you don\'t see it happening.',
      'Months later, a debt or record shows up under your name.',
      'Proving it wasn\'t you is slow and stressful, which is why this data matters so much.',
    ] }),
  ],

  money: [
    () => ({ headline: 'The money is gone.', steps: [
      'Gift card codes and transfers are almost impossible to reverse.',
      'A balance you sent is drained within minutes and moved on.',
      'The real person or office never asked for it.',
      'You\'re now on a list of people who paid, so expect more attempts.',
    ] }),
    () => ({ headline: 'You paid a scammer, not a bill.', steps: [
      'The "fee" or "fine" went straight to them.',
      'They keep the pressure up and invent a second charge.',
      'Each payment makes the next demand feel more normal.',
      'Legitimate fees never require gift cards or crypto.',
    ] }),
    () => ({ headline: 'Gift cards are cash to a scammer.', steps: [
      'The moment you shared the codes, the value was theirs.',
      'There is no chargeback and no bank to call.',
      'Anyone urgently demanding gift cards is running a scam, full stop.',
      'A real boss or office will never ask you to buy them.',
    ] }),
    () => ({ headline: 'A transfer you can\'t undo.', steps: [
      'Instant payment apps move money in seconds, with no take-backs.',
      'By the time it feels wrong, it\'s already been passed along.',
      'Banks rarely recover money you sent yourself, even under pressure.',
      'That\'s exactly why scammers push for speed and secrecy.',
    ] }),
  ],

  job_scam: [
    () => ({ headline: 'The check was fake. The money you sent was real.', steps: [
      'You deposited their check and sent part of it back, as instructed.',
      'Your bank showed it as "available," which is not the same as cleared.',
      'Days later the check bounces and the bank takes the full amount back.',
      'You\'re out the money you sent, and the "employer" has vanished.',
    ] }),
    () => ({ headline: 'The dream job was the bait.', steps: [
      'The offer came fast, paid well, and needed no interview. That was the warning.',
      'The "equipment funds" they sent you were never real.',
      'The money you forwarded to a "vendor" was yours.',
      'Real employers never ask you to move money to get started.',
    ] }),
    () => ({ headline: 'You paid to get "hired."', steps: [
      'They asked for a fee, a deposit, or your bank login for "payroll."',
      'That was the whole goal: your money or your account.',
      'The job never existed.',
      'A legitimate job costs you nothing to accept.',
    ] }),
  ],

  attachment: [
    (c) => ({ headline: c.file ? `You opened ${c.file}.` : 'You opened the attachment.', steps: [
      'Files like that can run hidden code the moment they open.',
      'It can copy passwords and sign-in data saved in your browser.',
      'With those, they may reach your accounts without needing your password again.',
      'Some versions also lock your files and demand payment.',
    ] }),
    (c) => ({ headline: c.file ? `${c.file} wasn't a document.` : 'That wasn\'t really a document.', steps: [
      'The "invoice" or "scan" was a program in disguise.',
      'Opening it can quietly install something that watches what you type.',
      'It looks for banking and email logins first.',
      'When in doubt, don\'t open it; confirm with the sender another way.',
    ] }),
    () => ({ headline: 'You installed the "update."', steps: [
      'The "plugin" or "update" was malware.',
      'It starts running the moment it\'s installed.',
      'From there it can reach files and accounts on your device.',
      'Real updates come from the app itself, never from an email link.',
    ] }),
  ],

  gform: [
    () => ({ headline: "You filled in a stranger's form.", steps: [
      'Anyone can make a form that asks for your email and password.',
      'Your answers land in the scammer\'s spreadsheet.',
      'They sign in as you and read your mail and files.',
      'Your account may send the same "document" to your classmates next.',
    ] }),
    () => ({ headline: 'That "document" was a trap.', steps: [
      'To "view" it, the form asked for your login. Real documents never do that.',
      'What you entered went straight to whoever made the form.',
      'They now have what they need to get into your account.',
      'This is how one hacked friend spreads it to a whole class.',
    ] }),
  ],

  qr: [
    () => ({ headline: 'You scanned the code.', steps: [
      'Your phone opened a page you couldn\'t preview first.',
      'On a small screen, a fake address is easy to miss.',
      'The page asked for a payment or login, and captured it.',
      'Email filters never saw the link, because it was hidden inside an image.',
    ] }),
    () => ({ headline: 'The QR code hid the destination.', steps: [
      'You can\'t hover a QR code to check where it goes.',
      'It sent you to a lookalike site built to take your details.',
      'Whatever you entered there went to the scammer.',
      'When a code appears in an unexpected message, type the official address yourself instead.',
    ] }),
  ],

  reply: [
    () => ({ headline: 'You replied. That was all they needed.', steps: [
      'Answering told the scammer your address is real and you\'re willing to help.',
      'The next message adds urgency: a quick favor, a gift card, kept quiet.',
      'Once you act on it, the loss is hard to reverse.',
      'The real person never wrote to you.',
    ] }),
    () => ({ headline: 'A short reply opened the door.', steps: [
      'Scammers sort out who responds; that\'s who they focus on.',
      'They build trust over a few messages, then make the ask.',
      'By then it feels like a favor for someone you know.',
      'Check with the real person on a number you already have before doing anything.',
    ] }),
  ],

  generic: [
    (c) => ({ headline: c.domain ? `You clicked through to ${c.domain}.` : 'You did what the message asked.', steps: [
      c.domain ? `A page that copies the real site loaded from ${c.domain}.` : 'You followed the instructions in the message.',
      'You entered your details, and they went to the scammer.',
      'They use them to read your mail and reach your other accounts.',
      'Your account can then send the same scam to people who trust you.',
    ] }),
    () => ({ headline: 'The link led somewhere it shouldn\'t.', steps: [
      'The page looked right but wasn\'t the real site.',
      'Anything you typed there was captured.',
      'Small giveaways in the address were the only clue.',
      'When in doubt, open the site yourself instead of using the link.',
    ] }),
  ],
};
