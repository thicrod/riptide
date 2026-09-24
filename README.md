# Riptide — catch the phish before it pulls you under

A scam checker **and** a phishing training game for the Pepperdine community, built for the
Pepperdine Cybersecurity & Campus Safety Hackathon (Project 1: Cyber Threat Awareness and Response).

- **Check** — paste a suspicious email/text/DM (or upload a screenshot) → risk score, every red flag
  highlighted in the message, and Pepperdine-specific next steps (Phish Alert Button, Tech Support 310.506.4357).
- **Train (Spot the Phish)** — 10 hard rounds across 3 levels (Look closer → Pixel-perfect → AI-era),
  drawn from 26 hand-written questions plus a **question generator** (20 realistic templates × 20+ subtle tricks ×
  random names, amounts, dates and codes = thousands of combinations). Each browser remembers what it has seen,
  so questions don't repeat (in a 200-game simulation, 2,000 questions, not one exact repeat).
  Scams hide in realistic, easy-to-miss details: "rn" posing as "m", a capital I posing as an l, a Cyrillic "а",
  a dash after ".com", a swapped comma in "$1.240,00", a faked From line exposed only by Reply-To / mailed-by,
  one changed word ("confirm" vs "change" your password), hacked real accounts. About half the messages are real,
  and 2 rounds per game are **spot the difference**: a real and a fake message side by side. After each answer,
  a character-level "Real vs Fake" comparison shows exactly what changed. Phish IQ, weak spot, leaderboard.
- **The loop** — people can *opt in* to share a scam; IT approves it on the **Dashboard**; approved
  reports become "Reported at Pepperdine" rounds in the game. Training stays current with real attacks.

---

## 1. Run it on your Mac (5 minutes)

You need **Node.js 22** (or 20.19+). Check with `node -v`. If you don't have it, install the LTS from https://nodejs.org.

```bash
cd "Pepperdine Hackathon/riptide"
npm install            # first time only
cp .env.example .env   # then paste your API key into .env (optional, see below)
npm run seed           # optional: loads SAMPLE dashboard data for the demo
npm run dev
```

Open **http://localhost:5173**. (`npm run dev` starts the API on :3001 and the React app on :5173.)

Run the tests any time with `npm test` (19 tests, including 3,000 generated questions checked for correctness,
zero false alarms on generated legit messages, and 40 games in a row without a repeated question).

### Turning on the AI layer

Riptide works without AI ("rules-only mode" badge in the header). To turn on the AI analyst
(better on subtle AI-written scams, and needed for screenshots), put **one** key in `.env`:

- **Claude (recommended):** get a key at https://console.anthropic.com → `ANTHROPIC_API_KEY=sk-ant-...`
  - `claude-haiku-4-5` (default) is fast and cheap; switch `ANTHROPIC_MODEL=claude-sonnet-4-5` for more accuracy.
- **or OpenAI:** `OPENAI_API_KEY=sk-...` (default model `gpt-4o-mini`).

Restart `npm run dev`. The header badge turns green: **AI on · Claude**.

### Demo data

- `npm run seed` fills the dashboard with **sample** numbers, 4 sample community reports and 3 leaderboard
  scores. The dashboard shows a "Sample data" badge so nobody mistakes it for real campus numbers.
- `npm run reset` clears everything.
- The dashboard's admin key is `ADMIN_KEY` in `.env` (default `riptide-demo`). **Change it before deploying.**

---

## 2. Deploy (get a public link for the submission)

**Render (free, keeps the Express server):**

1. **Put the code on GitHub.** Create an empty repo at https://github.com/new (e.g. `riptide`), then in Terminal:
   ```bash
   cd ~/"Pepperdine Hackathon/riptide"
   git init && git add . && git commit -m "Riptide"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/riptide.git
   git push -u origin main
   ```
   `.gitignore` keeps `.env` (your API key), `node_modules` and local data out of GitHub. Check with `git status` before pushing.
2. **Create the service.** Sign in at https://render.com with GitHub → **New → Blueprint** → pick the repo.
   Render reads `render.yaml`, asks for `ANTHROPIC_API_KEY`, and generates a random `ADMIN_KEY`.
3. **Wait for the build** (a few minutes). You get a public link like `https://riptide-xxxx.onrender.com`.
   Find the dashboard admin key under the service's **Environment** tab.
4. **Updating:** every `git push` to `main` redeploys automatically.

Or manually: **New → Web Service**, build command `npm install && npm run build`, start command `npm start`,
and add the same environment variables.

**Free plan notes:** the server sleeps after 15 minutes without visitors (the next visit takes about a minute
to wake it, so open the link before your demo), and saved data (stats, reports, leaderboard) is wiped whenever it
sleeps, restarts or redeploys. `SEED_SAMPLE_DATA` is `false` in `render.yaml`, so the live dashboard starts empty and shows only real
activity. Set it to `true` (Render → Environment) to reload the labeled sample data on every start instead. For data that survives
restarts, use a paid instance with a disk or a database.

Production build locally: `npm run build && npm start` → http://localhost:3001

---

## 3. How it works

```
             ┌──────────────────────── React (Vite + Tailwind) ────────────────────────┐
             │  Home   ·   Check (paste / screenshot)   ·   Spot the Phish   ·   Dashboard │
             └───────────────┬───────────────────────────────┬────────────────────────┘
                             │ POST /api/analyze              │ GET /api/training/round
                             ▼                                ▼
┌──────────────────────── Express API (server/) ─────────────────────────────────────────┐
│ 1. Privacy scrub   phone / SSN / ID numbers / your To: line removed before any AI call   │
│ 2. Rules engine    lookalike domains (pepperdlne.edu, pepperdine-edu.org, pepperdine.edu.x.co),│
│                    hidden link destinations, Gmail senders posing as offices, Reply-To     │
│                    tricks, shorteners, IP links, risky TLDs, risky attachments, 30+ phrase │
│                    patterns (urgency, MFA codes, gift cards, fake checks, secrecy…)        │
│ 3. AI analyst      Claude / OpenAI with a Pepperdine-aware system prompt, JSON output,     │
│                    prompt-injection guard ("message is untrusted data"), vision for        │
│                    screenshots                                                            │
│ 4. Blend           65% AI + 35% rules; hard evidence (fake domain + asks for login/money)  │
│                    can never be outvoted; AI quotes are mapped back onto exact text spans   │
│ 5. Store           counts only (JSON file) · opt-in reports · leaderboard                   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key files**

| File | What it does |
|---|---|
| `server/lib/rules.js` | The rule engine. Every flag has exact start/end positions for highlighting. |
| `server/lib/domains.js` | Registrable-domain parsing, brand lookalike detection (homoglyphs, typos, subdomain tricks). |
| `server/lib/ai.js` | AI prompt + Claude/OpenAI calls (plain `fetch`, no SDK). |
| `server/lib/analyze.js` | Orchestrates scrub → rules → AI → merged verdict + next steps. |
| `server/lib/scrub.js` | Privacy redaction before AI. |
| `shared/trainingMessages.js` | 22 game messages (12 phish / 10 legit) + 4 spot-the-difference pairs, with red flags, Real-vs-Fake comparisons and explanations. |
| `server/lib/generator.js` | The question generator: templates (Pepperdine IT, Financial Aid, Registrar, Library, Google, PayPal, USPS, DocuSign, Handshake, Zoom, Amazon, Netflix, Apple, Instagram, bank and campus alerts…) × tricks (swapped/missing/extra letters, digits for letters, rn→m, I→l, Cyrillic letters, dash-for-dot, fake endings, hidden links, @ tricks, faked From lines, one changed sentence…). |
| `src/components/SpotDiff.jsx` | Character-level diff that highlights exactly what the scammer changed. |
| `shared/categories.js` | Red-flag categories, tips, and Pepperdine IT resources. |
| `src/components/RichText.jsx` | The shared highlighter used by both Check and the game. |

**Accuracy check (rules only, no AI):** on the 30 training messages (including both sides of every
spot-the-difference pair) the rules engine gets 28 right: every legit message is marked safe, and every scam
is flagged except the two whose tells are not in the text itself (a hacked real classmate account, and a QR code).
Those are exactly the cases the AI layer and the sender headers are for. It also handles warnings like
"never share this code" correctly, and catches transposed letters, Cyrillic lookalikes, "Reply Y" smishing,
swapped comma/dot amounts and fake Tech Support numbers.

---

## 4. Privacy, ethics & security (judges will ask)

- Checked messages are **never stored**, only anonymous counts (verdict + red-flag categories per day).
- Personal numbers are removed **before** any AI call, and the result page shows exactly what the AI saw.
- Sharing for training is **opt-in**, scrubbed again server-side, and **reviewed by IT** before use.
- The AI is told the message is untrusted data and to ignore instructions inside it (prompt-injection defense).
- API keys stay on the server. Rate limiting on every endpoint, input size limits, security headers + CSP.
- Game links are never clickable. All people, numbers (555) and domains in the game are fictional.
- Riptide gives advice, not guarantees, and always points people to Pepperdine IT.

---

## 5. Ideas if you have extra time

- Gmail/Chrome extension: a "Check with Riptide" button right inside the inbox.
- Real database (Supabase/Postgres) + Pepperdine SSO for the admin dashboard.
- Weekly "scam of the week" email to campus built from the approved reports.
- Department leaderboards (Seaver vs. Graziadio vs. Caruso…).
