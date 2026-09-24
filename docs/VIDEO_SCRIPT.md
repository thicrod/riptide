# Riptide — 5-minute video script

Record your screen (QuickTime → New Screen Recording, or Loom). Run `npm run seed` first so the
dashboard has sample data, and have the AI key on so the header says **AI on · Claude**.

---

## 0:00 – 0:45 · The problem (talk over the Home page)

> "Phishing used to be easy to spot: typos, weird greetings, obvious fakes. Not anymore.
> AI lets attackers write perfect, personal messages at scale, and even clone a voice."

- Pull **one** stat from the Google Cloud Cybersecurity Forecast linked in the hackathon brief
  (https://cloud.google.com/security/resources/cybersecurity-forecast) and say it here. Use their exact number.
- "Students get fake research-assistant jobs, financial aid 'refunds', gift-card texts from a 'dean'.
  Pepperdine already has great tools like the Phish Alert Button, but people need help *deciding* in the moment,
  and they need practice against the new AI-era scams."
- "So we built **Riptide**: catch the phish before it pulls you under."

## 0:45 – 2:00 · Demo 1: Check

1. Click **Check a message** → **Try an example → Fake financial aid**.
2. Point at: the **risk score**, the verdict, "How we scored it: rules + AI".
3. Hover the highlights: **pepperdlne.edu** ("the i is an l"), the link that *says* pepperdine.edu but really
   belongs to refund-verify.co, "verify your account", "within 48 hours".
4. Scroll to **What to do now**: Phish Alert Button, Tech Support 310.506.4357, what to do if you already clicked.
5. Click **AI-written professor email**: "No typos, real details, but the domain is pepperdine-edu.org
   and it asks for your credentials." (If you have time: upload a screenshot of a scam text.)
6. Open **Privacy: what happened to your message**: "Not stored. Phone numbers removed. Here's exactly what the AI saw."
7. Click **Share anonymously**.

## 2:00 – 3:15 · Demo 2: Spot the Phish

1. Click **Spot the Phish → Start**. "About half of these are real. The scams hide in one letter, a dash or a hidden header."
2. Play a Level 1 card and zoom in on the tell (e.g. **rnicrosoftonline.com**: "rn" posing as "m").
3. On an email, click **show details** under the sender: reply-to and mailed-by expose a faked From line.
4. Play a **spot-the-difference** round (two near-identical messages, pick the fake), then show the
   **Real vs Fake** comparison that highlights the exact changed characters.
5. Show a Level 3 card (the cloned-voice voicemail from "Mom" or the fake professor asking for your ID).
6. Finish (or jump to) the results: **Phish IQ**, rank, **weak spot** with a tip, missed-card review, leaderboard.

## 3:15 – 4:15 · How it works (show Home → "Two layers, one verdict", then Dashboard)

- "Two layers. A **rules engine** gives hard, explainable evidence: lookalike domains with homoglyph and
  typo detection, hidden link destinations, Gmail senders pretending to be offices, 30+ scam patterns.
  It runs instantly with no AI."
- "An **AI analyst** (Claude) reads the whole message with Pepperdine context, handles screenshots,
  and is told to treat the message as untrusted data, so prompt injection doesn't work."
- "We blend them, and hard evidence can never be outvoted."
- "Stack: React + Vite + Tailwind, Node/Express, Claude API. 15 automated tests."
- Dashboard: "IT sees trends, only counts, never content. Here's the review queue: approve a report and it
  becomes a 'Reported at Pepperdine' round in the game. That's the loop."
  (Enter the admin key, click **Approve for training**.)

## 4:15 – 5:00 · Impact & what's next

- "Riptide makes security **accessible** (paste and go), **actionable** (Pepperdine-specific next steps),
  and **effective** (practice against the scams actually hitting campus)."
- Privacy by design: nothing stored, opt-in sharing, IT review.
- Next: a Gmail/Chrome extension, Pepperdine SSO, a weekly "scam of the week" email, department leaderboards.
- "Riptide: catch the phish before it pulls you under. Thank you!"

---

## Submission checklist (due Wed Sept 23, 11:59 PM)

- [ ] Deployed link works in an incognito window (open it once to wake the free server)
- [ ] `ADMIN_KEY` changed from the default on the deployed site
- [ ] AI key added on the host; header shows "AI on"
- [ ] Video is under 5:00 and covers problem, approach, technical implementation, impact
- [ ] Demo day (Fri Sept 25, 3 PM): run `npm run seed`, have the examples ready, bring a phone to show mobile + swipe
