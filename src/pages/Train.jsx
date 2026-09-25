import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, loadSeen, rememberSeen } from '../lib/api.js';
import { LEVELS, LEVEL_POINTS, TWIN_POINTS } from '../../shared/levels.js';
import { CATEGORIES } from '../../shared/categories.js';
import MessageCard from '../components/MessageCard.jsx';
import FlagList from '../components/FlagList.jsx';
import SpotDiff from '../components/SpotDiff.jsx';
import Breach, { Lives, START_LIVES, MISS_PENALTY, FALSE_ALARM_PENALTY } from '../components/Breach.jsx';
import { CountUp } from '../components/ui.jsx';
import {
  Hook, CheckCircle, Octagon, Arrow, ArrowLeft, Trophy, Flame, Refresh, ShieldCheck, Info, Check, XIcon, Eye, LinkIcon, Mail,
} from '../components/Icons.jsx';

const RANKS = [
  { min: 90, title: 'Lifeguard', text: 'Nothing gets past you. Share Riptide with your friends.' },
  { min: 75, title: 'Beach Patrol', text: 'Sharp instincts. A couple of sneaky ones slipped through.' },
  { min: 50, title: 'Wave Rider', text: 'Solid start. Scammers still have a few tricks that work on you.' },
  { min: 0, title: 'Caught in the Current', text: "Don't worry, that's why you practice. Try again and watch the red flags." },
];

function InspectTips() {
  const tips = [
    [Mail, <>Tap <b>show details</b> under an email sender: check <b>reply-to</b> and <b>mailed-by</b>.</>],
    [LinkIcon, <><b>Hover</b> (or tap) every link to see where it really goes.</>],
    [Eye, <>Read domains letter by letter: <b>rn</b> vs <b>m</b>, <b>I</b> vs <b>l</b>, an extra dash or dot.</>],
    [Info, <>Watch for one changed word, a swapped comma, or a request that doesn't fit.</>],
  ];
  return (
    <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
      {tips.map(([Ico, t], i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><Ico className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" /><span>{t}</span></li>
      ))}
    </ul>
  );
}

const isScamCard = (card) => card.type === 'twin' || card.isPhish;

// Animated ring for the Phish IQ score.
function IQRing({ value }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(value), 120); return () => clearTimeout(t); }, [value]);
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? '#7fc8f8' : value >= 50 ? '#fab219' : '#f07a3a';
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <CountUp value={value} duration={1100} className="font-display text-4xl font-extrabold" />
      </div>
    </div>
  );
}

function cardTitle(card) {
  if (card.type === 'twin') return `Spot the difference: ${card.prompt}`;
  return card.subject || card.body.split('\n')[0].slice(0, 70) + (card.body.length > 70 ? '…' : '');
}

function Leaderboard({ scores, highlight }) {
  if (!scores?.length) return <p className="text-sm text-slate-500">No scores yet. Be the first!</p>;
  return (
    <ol className="space-y-1">
      {scores.map((s, i) => (
        <li key={`${s.name}-${s.createdAt}-${i}`} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${highlight === s.createdAt ? 'bg-sunset-100' : ''}`}>
          <span className={`w-5 text-right font-bold tabular-nums ${i < 3 ? 'text-sunset-600' : 'text-slate-400'}`}>{i + 1}</span>
          <span className="flex-1 truncate font-medium text-slate-800">{s.name}</span>
          <span className="tabular-nums text-slate-500">{s.correct}/{s.total}</span>
          <span className="w-14 text-right font-semibold tabular-nums text-navy-950">{s.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}

export default function Train() {
  const [phase, setPhase] = useState('intro');
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [activeN, setActiveN] = useState(null);
  const [dx, setDx] = useState(0);
  const [error, setError] = useState('');
  const [scores, setScores] = useState([]);
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [lives, setLives] = useState(START_LIVES);
  const [breach, setBreach] = useState(null);
  const drag = useRef(null);
  const feedbackRef = useRef(null);

  useEffect(() => { api.leaderboard().then((d) => setScores(d.scores)).catch(() => {}); }, []);

  const card = cards[idx];
  const items = useMemo(() => (card?.flags || []).map((f, i) => ({ ...f, n: i + 1 })), [card]);
  const last = answers[answers.length - 1];

  async function start() {
    setError('');
    setPhase('loading');
    try {
      const { cards: c } = await api.round(loadSeen());
      setCards(c);
      setIdx(0);
      setAnswers([]);
      setScore(0);
      setStreak(0);
      setRevealed(false);
      setActiveN(null);
      setSubmitted(null);
      setLives(START_LIVES);
      setBreach(null);
      setPhase('play');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (e) {
      setError(e.message);
      setPhase('intro');
    }
  }

  const answer = useCallback((choice) => {
    if (!card || revealed) return;
    const correct = card.type === 'twin' ? choice === card.phish : (choice === 'phish') === card.isPhish;
    const newStreak = correct ? streak + 1 : 0;
    const bonus = correct && newStreak >= 3 ? 50 : 0;
    const base = card.type === 'twin' ? TWIN_POINTS : LEVEL_POINTS[card.level];
    // Falling for a scam costs a life and points; a false alarm costs points (ignoring real mail has a price too).
    const hooked = !correct && (card.type === 'twin' || card.isPhish);
    const penalty = correct ? 0 : hooked ? MISS_PENALTY : FALSE_ALARM_PENALTY;
    const points = correct ? base + bonus : -penalty;
    rememberSeen([card.id]);
    setStreak(newStreak);
    setScore((s) => Math.max(0, s + points));
    setAnswers((a) => [...a, { card, choice, correct, points, bonus, hooked, penalty }]);
    setRevealed(true);
    setDx(0);
    if (hooked) {
      const left = lives - 1;
      setLives(left);
      setBreach({ card, lives: left, penalty });
    }
    setTimeout(() => {
      if (window.innerWidth < 1024) feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, [card, revealed, streak, lives]);

  const next = useCallback(() => {
    if (idx + 1 >= cards.length || lives <= 0) {
      setPhase('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIdx((i) => i + 1);
    setRevealed(false);
    setActiveN(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idx, cards.length, lives]);

  // Keyboard: ← legit, → phish, Enter/→ next
  useEffect(() => {
    if (phase !== 'play' || breach) return undefined;
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const twin = cards[idx]?.type === 'twin';
      if (!revealed && e.key === 'ArrowLeft') { e.preventDefault(); answer(twin ? 'a' : 'legit'); }
      else if (!revealed && e.key === 'ArrowRight') { e.preventDefault(); answer(twin ? 'b' : 'phish'); }
      else if (revealed && (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ')) { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, revealed, answer, next, cards, idx, breach]);

  // Swipe (touch or mouse drag)
  const onPointerDown = (e) => {
    if (revealed || e.button !== 0 || card?.type === 'twin') return;
    drag.current = { x: e.clientX, id: e.pointerId, moved: false };
  };
  const onPointerMove = (e) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const d = e.clientX - drag.current.x;
    if (Math.abs(d) > 8 && !drag.current.moved) {
      drag.current.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (drag.current.moved) setDx(d);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const d = dx;
    drag.current = null;
    if (d > 110) answer('phish');
    else if (d < -110) answer('legit');
    else setDx(0);
  };

  // ---------------- Intro ----------------
  if (phase === 'intro' || phase === 'loading') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white sm:p-10">
            <div className="hero-grid pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sunset-500/20 blur-3xl" />
            <div className="relative">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sunset-500"><Hook className="h-7 w-7" /></div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Spot the Phish</h1>
            <p className="mt-3 max-w-xl text-lg text-navy-100">10 rounds, drawn from thousands of possible messages, so you won't see the same one twice. About half are real. The scams hide in tiny details: one letter, a dash, a dot, a swapped comma, a hidden header. Slow down and inspect.</p>
            <ul className="mt-6 space-y-3">
              {Object.entries(LEVELS).map(([lvl, l]) => (
                <li key={lvl} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold">L{lvl}</span>
                  <span><span className="font-semibold">{l.name}.</span> <span className="text-navy-100">{l.blurb}</span> <span className="text-xs text-sea-300">{LEVEL_POINTS[lvl]} pts</span></span>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-sunset-500 px-2 py-0.5 text-xs font-bold">2×</span>
                <span><span className="font-semibold">Spot the difference.</span> <span className="text-navy-100">Two near-identical messages. One is fake. Find it.</span> <span className="text-xs text-sea-300">{TWIN_POINTS} pts</span></span>
              </li>
            </ul>
            <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-navy-50">
              <b>How to play:</b> inspect it like a security analyst. <b>Hover or tap links</b> to see where they really go, and open
              <b> show details</b> under an email's sender to check reply-to and mailed-by. Answer with the buttons, a swipe, or your
              <b> ← →</b> keys. 3+ correct in a row earns a streak bonus.
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-critical/20 p-4 text-sm text-red-50 ring-1 ring-red-400/30">
              <Lives lives={START_LIVES} className="mt-0.5 shrink-0" />
              <span><b>You have 3 lives.</b> Fall for a scam and you'll watch what the attacker does next, and lose a life and {MISS_PENALTY} points. Flag a real message as fake and you lose {FALSE_ALARM_PENALTY}. Three strikes and your account is compromised.</span>
            </div>
            {error && <p className="mt-4 rounded-lg bg-red-500/20 p-3 text-sm">{error}</p>}
            <button onClick={start} disabled={phase === 'loading'} className="btn btn-primary btn-lg mt-6 px-8">
              {phase === 'loading' ? 'Loading…' : <>Start <Arrow className="h-5 w-5" /></>}
            </button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-sunset-600" /><h2 className="font-bold text-navy-950">Leaderboard</h2></div>
              <div className="mt-3"><Leaderboard scores={scores} /></div>
            </div>
            <div className="card p-6">
              <h2 className="font-bold text-navy-950">Tricks you'll learn to catch</h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                {[
                  ['rn', 'posing as m', 'rnicrosoft.com'],
                  ['I', 'posing as l', 'paypaI.com'],
                  ['-', 'after .com', 'usps.com-track.info'],
                  ['@', 'hiding the real site', 'google.com@evil.co'],
                  [',', 'swapped with a dot', '$1.240,00'],
                  ['✉', 'faked sender, real reply-to', 'reply-to: gmail.com'],
                ].map(([sym, what, ex]) => (
                  <li key={what} className="flex items-center gap-3 rounded-xl bg-sand-50 px-3 py-2.5 ring-1 ring-slate-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white font-mono text-sm font-bold text-sunset-600 ring-1 ring-slate-200">{sym}</span>
                    <span className="min-w-0 flex-1"><span className="font-semibold text-navy-950">{what}</span><span className="block truncate font-mono text-xs text-slate-500">{ex}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Results ----------------
  if (phase === 'done') {
    const correctCount = answers.filter((a) => a.correct).length;
    const compromised = lives <= 0;
    const accuracy = Math.round((correctCount / answers.length) * 100);
    const rank = RANKS.find((r) => accuracy >= r.min);
    const misses = {};
    for (const a of answers.filter((x) => !x.correct)) {
      const cats = isScamCard(a.card) ? [...new Set(a.card.flags.map((f) => f.category))] : ['false_alarm'];
      cats.forEach((c) => { misses[c] = (misses[c] || 0) + 1; });
    }
    const weak = Object.entries(misses).sort((x, y) => y[1] - x[1])[0]?.[0];
    const missed = answers.filter((a) => !a.correct);

    async function submitScore(e) {
      e.preventDefault();
      try {
        const r = await api.submitScore({ name: name || 'Anonymous', score, correct: correctCount, total: answers.length });
        setScores(r.scores);
        setSubmitted(r.entry.createdAt);
      } catch (err) {
        setError(err.message);
      }
    }

    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="space-y-5">
            {compromised && (
              <div className="pop-in flex items-start gap-3 rounded-3xl bg-[#1a0707] p-5 text-white ring-1 ring-red-500/40 sm:p-6">
                <Octagon className="mt-0.5 h-7 w-7 shrink-0 text-critical" />
                <div>
                  <p className="text-xl font-bold">Account compromised</p>
                  <p className="mt-1 text-sm text-red-100">Scammers got you 3 times in {answers.length} rounds, so the game ended early. Real attackers only need once. Review the misses below, then try again.</p>
                </div>
              </div>
            )}
            <div className="pop-in rounded-3xl bg-navy-900 p-6 text-white sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-sea-300">Your Phish IQ</p>
                {!compromised && <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Lives lives={lives} /> Survived all {cards.length} rounds</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                <IQRing value={accuracy} />
                <div className="pb-2">
                  <div className="text-2xl font-bold text-sunset-500">{rank.title}</div>
                  <div className="text-navy-100">{correctCount} of {answers.length} correct · {score.toLocaleString()} points · hooked {answers.filter((a) => a.hooked).length}×</div>
                </div>
              </div>
              <p className="mt-4 text-navy-100">{rank.text}</p>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-navy-950">Your weak spot</h2>
              {weak ? (
                <div className="mt-2 rounded-xl bg-sunset-100 p-4">
                  <div className="font-semibold text-sunset-600">{CATEGORIES[weak]?.label}</div>
                  <p className="mt-1 text-sm text-slate-700">{CATEGORIES[weak]?.tip}</p>
                </div>
              ) : (
                <p className="mt-2 flex items-center gap-2 text-sm text-good-ink"><CheckCircle className="h-4 w-4" /> No weak spots this round. Impressive.</p>
              )}
            </div>

            {missed.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-navy-950">Review what you missed</h2>
                <div className="mt-3 space-y-3">
                  {missed.map((a) => (
                    <details key={a.card.id} className="rounded-xl border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm">
                        <span className="font-medium text-navy-950">{cardTitle(a.card)}</span>
                        <span className="ml-2 text-xs text-critical-ink">
                          {a.card.type === 'twin'
                            ? `You picked ${a.choice.toUpperCase()}, the scam was ${a.card.phish.toUpperCase()}`
                            : `You said ${a.choice === 'phish' ? 'Phish' : 'Legit'}, it was ${a.card.isPhish ? 'a phish' : 'legit'}`}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3">
                        {a.card.type === 'twin' ? (
                          <MessageCard card={{ ...a.card[a.card.phish], id: `${a.card.id}-review` }} items={a.card.flags.map((f, i) => ({ ...f, n: i + 1 }))} revealed />
                        ) : (
                          <MessageCard card={a.card} items={a.card.flags.map((f, i) => ({ ...f, n: i + 1 }))} revealed />
                        )}
                        <SpotDiff items={a.card.compare} />
                        <p className="text-sm text-slate-700">{a.card.explanation}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={start} className="btn btn-primary btn-lg"><Refresh className="h-5 w-5" /> Play again</button>
              <a href="#/check" className="btn btn-outline btn-lg"><ShieldCheck className="h-5 w-5" /> Check a real message</a>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-sunset-600" /><h2 className="font-bold text-navy-950">Leaderboard</h2></div>
              {!submitted ? (
                <form onSubmit={submitScore} className="mt-3 flex gap-2">
                  <label htmlFor="nick" className="sr-only">Nickname</label>
                  <input id="nick" value={name} onChange={(e) => setName(e.target.value.slice(0, 20))} placeholder="Nickname (no real names)" className="field min-w-0 flex-1 px-3 py-2 text-sm" />
                  <button className="btn btn-dark btn-sm">Save score</button>
                </form>
              ) : (
                <p className="mt-2 text-sm text-good-ink">Score saved!</p>
              )}
              {error && <p className="mt-2 text-sm text-critical-ink">{error}</p>}
              <div className="mt-3"><Leaderboard scores={scores} highlight={submitted} /></div>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-navy-950">Round recap</h2>
              <ol className="mt-3 space-y-1.5">
                {answers.map((a, i) => (
                  <li key={a.card.id} className="flex items-center gap-2 text-sm">
                    {a.correct ? <Check className="h-4 w-4 shrink-0 text-good-ink" title="Correct" /> : <XIcon className="h-4 w-4 shrink-0 text-critical-ink" title="Missed" />}
                    <span className="w-6 text-xs text-slate-400">L{a.card.level}</span>
                    <span className="flex-1 truncate text-slate-700">{i + 1}. {cardTitle(a.card)}</span>
                    <span className={`text-xs font-semibold ${isScamCard(a.card) ? 'text-critical-ink' : 'text-good-ink'}`}>{a.card.type === 'twin' ? `Scam: ${a.card.phish.toUpperCase()}` : a.card.isPhish ? 'Phish' : 'Legit'}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Playing ----------------
  const isTwin = card.type === 'twin';
  const tilt = Math.max(-12, Math.min(12, dx / 18));
  const stamp = dx > 40 ? 'phish' : dx < -40 ? 'legit' : null;
  const scamSide = isTwin ? card.phish.toUpperCase() : null;
  const realSide = isTwin ? (card.phish === 'a' ? 'B' : 'A') : null;

  const resultBanner = revealed && (
    <div className={`rounded-2xl p-5 ${last.correct ? 'bg-green-50 ring-1 ring-green-200' : 'bg-red-50 ring-1 ring-red-200'}`}>
      <div className="flex items-center gap-2">
        {last.correct ? <CheckCircle className="h-6 w-6 text-good-ink" /> : <Octagon className="h-6 w-6 text-critical-ink" />}
        <h2 className={`text-xl font-bold ${last.correct ? 'text-good-ink' : 'text-critical-ink'}`}>
          {isTwin
            ? (last.correct ? `Sharp eyes! ${scamSide} was the scam.` : `Hooked! ${scamSide} was the scam.`)
            : last.correct ? (card.isPhish ? 'Nice catch!' : "Correct, it's legit.") : (card.isPhish ? 'Hooked! That was a phish.' : 'False alarm. This one was legit.')}
        </h2>
      </div>
      {last.correct ? (
        <p className="mt-1 text-sm font-semibold text-navy-950">+{last.points - last.bonus} pts{last.bonus ? ` · +${last.bonus} streak bonus` : ''}</p>
      ) : last.hooked ? (
        <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-critical-ink">−{last.penalty} pts · −1 life <Lives lives={lives} /></p>
      ) : (
        <p className="mt-1 text-sm font-semibold text-critical-ink">−{last.penalty} pts. False alarms have a cost too: people who distrust everything end up ignoring real deadlines, refunds and security alerts.</p>
      )}
      <p className="mt-2 text-sm text-slate-700">{card.explanation}</p>
    </div>
  );
  const flagsPanel = isScamCard(card) && items.length > 0 && (
    <div className="card p-5">
      <h3 className="mb-3 font-semibold text-navy-950">The red flags <span className="font-normal text-slate-500">(highlighted in {isTwin ? `message ${scamSide}` : 'the message'})</span></h3>
      <FlagList items={items} activeN={activeN} onActivate={setActiveN} />
    </div>
  );
  const goodPanel = card.goodSigns?.length > 0 && (!card.isPhish || isTwin) && (
    <div className="card p-5">
      <h3 className="mb-2 font-semibold text-navy-950">{isTwin ? `Why ${realSide} is real` : "Why it's legit"}</h3>
      <ul className="space-y-1.5">
        {card.goodSigns.map((g) => <li key={g} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-good-ink" />{g}</li>)}
      </ul>
    </div>
  );
  const nextButton = (
    <>
      <button onClick={next} className="btn btn-dark btn-lg w-full">
        {lives <= 0 ? 'See what happened' : idx + 1 >= cards.length ? 'See my results' : 'Next round'} <Arrow className="h-5 w-5" />
      </button>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-400"><Info className="h-3.5 w-3.5" /> Press Enter to continue</p>
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {breach && <Breach card={breach.card} lives={breach.lives} penalty={breach.penalty} onClose={() => setBreach(null)} />}
      {/* Top bar */}
      <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-slate-200 bg-sand-50/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="whitespace-nowrap rounded-full bg-navy-900 px-2.5 py-1 text-xs font-bold text-white">L{card.level}<span className="hidden sm:inline"> · {LEVELS[card.level].name}</span></span>
          <span className="whitespace-nowrap text-sm text-slate-500"><span className="hidden sm:inline">Round </span>{idx + 1}<span className="sm:hidden">/</span><span className="hidden sm:inline"> of </span>{cards.length}</span>
          <Lives lives={lives} className="ml-auto" />
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-sunset-600" title="Streak">
            <Flame className="h-4 w-4" /> {streak}
          </span>
          <span className="whitespace-nowrap text-sm font-bold tabular-nums text-navy-950">{score.toLocaleString()} pts</span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {cards.map((c, i) => {
            const a = answers[i];
            const cls = a ? (a.correct ? 'bg-good' : 'bg-critical') : i === idx ? 'bg-navy-900' : 'bg-slate-200';
            return <span key={c.id} className={`h-1.5 flex-1 rounded-full ${cls}`} />;
          })}
        </div>
      </div>

      {isTwin ? (
        <div key={card.id} className="fade-in">
          <div className="mb-4 rounded-2xl bg-navy-900 p-4 text-white sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sea-300"><Eye className="h-4 w-4" /> Spot the difference · {TWIN_POINTS} pts</div>
            <p className="mt-1 text-lg font-semibold">{card.prompt}</p>
            {card.context && <p className="mt-1 text-sm text-navy-100"><span className="font-semibold">Context:</span> {card.context}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {['a', 'b'].map((side) => {
              const isScam = side === card.phish;
              return (
                <div key={side} className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">{side.toUpperCase()}</span>
                    {revealed && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isScam ? 'bg-red-50 text-critical-ink ring-1 ring-red-200' : 'bg-green-50 text-good-ink ring-1 ring-green-200'}`}>
                        {isScam ? 'SCAM' : 'REAL'}
                      </span>
                    )}
                  </div>
                  <div className={`rounded-2xl ${revealed ? (isScam ? 'ring-2 ring-critical' : 'ring-2 ring-good') : ''}`}>
                    <MessageCard card={{ ...card[side], id: `${card.id}-${side}` }} items={isScam ? items : []} revealed={revealed} activeN={activeN} onActivate={setActiveN} />
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={feedbackRef} className="mt-5 scroll-mt-32">
            {!revealed ? (
              <div className="card p-5">
                <h2 className="text-lg font-bold text-navy-950">Which one is the scam?</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {['a', 'b'].map((side) => (
                    <button key={side} onClick={() => answer(side)} className="flex flex-col items-center gap-1 rounded-2xl border-2 border-red-200 bg-red-50 px-3 py-5 text-lg font-bold text-critical-ink transition hover:-translate-y-0.5 hover:border-critical hover:bg-red-100 hover:shadow-md active:scale-[.98]">
                      <Hook className="h-6 w-6" /> {side.toUpperCase()} is the scam
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        {side === 'a' ? <><ArrowLeft className="h-3 w-3" /> key</> : <>key <Arrow className="h-3 w-3" /></>}
                      </span>
                    </button>
                  ))}
                </div>
                <InspectTips />
              </div>
            ) : (
              <div className="pop-in grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">{resultBanner}<SpotDiff items={card.compare} /></div>
                <div className="space-y-4">{flagsPanel}{goodPanel}{nextButton}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div
            className="relative select-none"
            style={{ touchAction: 'pan-y', transform: `translateX(${dx}px) rotate(${tilt}deg)`, transition: drag.current ? 'none' : 'transform 200ms ease' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {stamp && (
              <div className={`pointer-events-none absolute left-1/2 top-24 z-20 -translate-x-1/2 -rotate-12 rounded-xl border-4 px-4 py-1 text-3xl font-black tracking-widest ${stamp === 'phish' ? 'border-critical text-critical' : 'border-good text-good'} bg-white/90`}>
                {stamp === 'phish' ? 'PHISH' : 'LEGIT'}
              </div>
            )}
            <div key={card.id} className="fade-in">
              <MessageCard card={card} items={items} revealed={revealed} activeN={activeN} onActivate={setActiveN} />
            </div>
          </div>

          <div ref={feedbackRef} className="scroll-mt-32">
            {!revealed ? (
              <div className="card p-5 lg:sticky lg:top-40">
                <h2 className="text-lg font-bold text-navy-950">Legit or phish?</h2>
                <p className="mt-1 text-sm text-slate-600">About half of these are real. Inspect before you answer.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => answer('legit')} className="group flex flex-col items-center gap-1 rounded-2xl border-2 border-green-200 bg-green-50 px-3 py-5 text-lg font-bold text-good-ink transition hover:-translate-y-0.5 hover:border-good hover:bg-green-100 hover:shadow-md active:scale-[.98]">
                    <CheckCircle className="h-7 w-7" /> Legit
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500"><ArrowLeft className="h-3 w-3" /> key</span>
                  </button>
                  <button onClick={() => answer('phish')} className="group flex flex-col items-center gap-1 rounded-2xl border-2 border-red-200 bg-red-50 px-3 py-5 text-lg font-bold text-critical-ink transition hover:-translate-y-0.5 hover:border-critical hover:bg-red-100 hover:shadow-md active:scale-[.98]">
                    <Hook className="h-7 w-7" /> Phish
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">key <Arrow className="h-3 w-3" /></span>
                  </button>
                </div>
                <InspectTips />
                <p className="mt-3 text-center text-xs text-slate-400 lg:hidden">You can also swipe the card left or right.</p>
              </div>
            ) : (
              <div className="pop-in space-y-4 lg:sticky lg:top-40">
                {resultBanner}
                {flagsPanel}
                <SpotDiff items={card.compare} />
                {goodPanel}
                {nextButton}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
