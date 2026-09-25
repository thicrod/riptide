# Riptide: 5-minute video script

**Target:** 4:45 to 5:00. The spoken parts are about 680 words, which is 5 minutes at a relaxed pace.
**Format:** screen recording (QuickTime → New Screen Recording, or Loom) with your voice. Face cam optional.

---

## Before you hit record

- [ ] Open https://riptide-i0pk.onrender.com a minute early so it's awake.
- [ ] **Dashboard numbers:** the live dashboard starts empty. Either run a few checks and one game first, or record the Dashboard part locally after `npm run seed`.
- [ ] **AI on (optional):** if you added `ANTHROPIC_API_KEY` in Render, the header says **AI on · Claude**. If not, skip the screenshot-text part; the QR demo works either way.
- [ ] Have `docs/demo-qr-scam.png` (in your project folder) ready to drag in.
- [ ] Browser zoom at 110 to 125% so text is readable. Close other tabs and notifications.
- [ ] Clear the game's memory for a fresh run: open the site, press F12 → Console, type `localStorage.clear()`, press Enter, reload.

---

## 1. The problem · 0:00 to 0:45

**Show:** the Riptide home page.

> Hi, I'm Joe, a Computer Science and Data Science student at Pepperdine, and this is Riptide.
>
> Phishing used to be easy to spot: bad grammar, weird requests. AI changed that. Today a scammer can write a perfect email in seconds, copy the look of Pepperdine IT or Financial Aid, and send thousands of personalized versions at once. The only tell left is often one tiny detail: an "rn" pretending to be an "m," a dash after ".com," a reply-to address that goes somewhere else.
>
> And the stakes are real. One typed password can give someone your email, your Drive, and your financial aid refund. Most people never get practice spotting these details until it's too late.

---

## 2. The approach · 0:45 to 1:20

**Show:** scroll the home page slowly; point at Check, Spot the Phish, Dashboard.

> Riptide attacks the problem from two sides, in one app.
>
> First, **Check**: when you get something suspicious, paste it in and get an instant, explained answer, plus what to do next at Pepperdine.
>
> Second, **Spot the Phish**: a training game that builds the instinct to catch these details before you ever need the checker.
>
> And they feed each other. People can choose to share a scam they received, IT reviews it, and it becomes a new training round. So the training keeps up with real attacks hitting our campus.

---

## 3. Demo: the checker · 1:20 to 2:25

**Show:** Check page → click the example chip **"Fake financial aid"** → the result.

> Here's a fake Financial Aid email. In about a second, Riptide gives a risk score, highlights every red flag right in the message, and explains each one in plain English. This sender domain looks like pepperdine.edu, but one letter is swapped.

**Show:** hover a highlight, then scroll to **What to do now** and **Report it to Pepperdine**.

> It also tells you exactly what to do, the Pepperdine way. If you didn't click anything, use the Phish Alert Button in Gmail. If you already clicked, it gives you the Information Security Office's number and builds a pre-filled incident report, with the links disabled so nobody opens them by accident.

**Show:** Screenshot tab → drag in `demo-qr-scam.png` → **Check this message**.

> Scammers now hide links in QR codes, because you can't hover over them. Riptide reads the QR code right on your device and checks where it really goes: here, a fake Pepperdine parking site asking for payment.

---

## 4. Demo: the game · 2:25 to 3:30

**Show:** Spot the Phish → Start. Answer one correctly, then deliberately fall for a scam.

> Spot the Phish is ten rounds across three levels, from "Look closer" to "AI-era." About half the messages are real, so you can't just call everything a scam. You inspect it like an analyst: hover links, open the sender details, read the domain letter by letter.

**Show:** the red **"You got phished"** screen as it plays out.

> And when you get it wrong, it's not just a red X. Riptide shows what actually happens next in an attack like this one, and points to the exact detail you missed. You have three lives. Three strikes and your account is compromised.

**Show:** click through to a **Spot the difference** round, then the Real vs Fake comparison.

> Some rounds put a real and a fake message side by side. After you answer, it highlights exactly which characters the scammer changed.

---

## 5. How it's built · 3:30 to 4:15

**Show:** GitHub repo page, or the "How it works" section of the README.

> Under the hood, Riptide is a React front end and a Node and Express server, deployed on Render.
>
> The checker has two layers. A rules engine I wrote catches lookalike domains, including swapped letters, digits posing as letters, and Cyrillic characters that look identical to English ones, plus hidden link destinations, faked senders, and dozens of pressure tactics. Every flag points to the exact characters, which is how the highlighting works. An optional AI layer adds context for subtle, AI-written scams, and hard evidence from the rules can never be outvoted by the AI.
>
> Privacy was a design rule: messages are never stored, and phone and ID numbers are removed before anything reaches the AI.
>
> The game uses a question generator: realistic templates combined with real-world tricks and randomized names, amounts and dates, so there are thousands of possible questions and players don't see repeats. Twenty-two automated tests check it, including three thousand generated questions with zero false alarms on the real messages.

---

## 6. Expected impact · 4:15 to 4:50

**Show:** Dashboard page.

> For the Pepperdine community, Riptide turns "is this a scam?" into a ten-second answer, and turns training into something people actually want to play.
>
> For IT, the dashboard shows anonymous trends: how many messages are being checked and which tricks are showing up most. Reports people share become new training within days, not months.
>
> Next steps would be a "Check with Riptide" button inside Gmail and Pepperdine sign-in for the IT dashboard.

---

## 7. Close · 4:50 to 5:00

**Show:** home page with the live link visible.

> Riptide: catch the phish before it pulls you under. Try it at riptide-i0pk.onrender.com. Thanks for watching.

---

## If you're running long

Cut in this order:
1. The Spot the difference part of section 4 (saves ~15 seconds).
2. The "Next steps" sentence in section 6 (saves ~8 seconds).
3. The Cyrillic detail in section 5 (saves ~5 seconds).

## Upload checklist

- [ ] YouTube → **Unlisted**, or Google Drive → **Anyone with the link can view**.
- [ ] Open the link in a private window to confirm it plays without signing in.
- [ ] Paste it into the form's "5-Minute Video Link" box.
