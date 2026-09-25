import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { PEPPERDINE } from '../../shared/categories.js';
import { CountUp, Reveal, LivePill } from '../components/ui.jsx';
import {
  ShieldCheck, Hook, Arrow, Users, Lock, Sparkles, Eye, Refresh, Phone, Octagon, Cpu, Image, Zap, Target, BarChart, Check,
} from '../components/Icons.jsx';

/* ---------- Hero product preview: a scam being "caught" ---------- */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-sunset-500/20 via-sea-500/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl shadow-black/30 ring-1 ring-white/20">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          <span className="ml-3 text-[11px] font-medium text-slate-400">Inbox · Pepperdine</span>
        </div>
        <div className="relative p-5 pb-16 sm:p-6 sm:pb-16">
          <div className="scan-line" />
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-900">P</div>
            <div className="min-w-0 text-[13px] leading-snug">
              <div className="font-semibold text-slate-900">Pepperdine Financial Aid</div>
              <div className="text-slate-500">
                &lt;finaid@pepperd<mark className="fade-in delay-2 rounded-sm bg-red-100 px-0.5 font-semibold text-critical-ink ring-1 ring-red-300">l</mark>ne.edu&gt;
              </div>
            </div>
          </div>
          <div className="mt-4 text-[15px] font-semibold text-slate-900">Action required: refund disbursement pending</div>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
            Your Fall 2026 refund of $1,240.00 is ready. Please{' '}
            <mark className="fade-in delay-3 rounded-sm bg-red-100 px-0.5 text-critical-ink ring-1 ring-red-300">verify your account</mark>{' '}
            <mark className="fade-in delay-3 rounded-sm bg-amber-100 px-0.5 text-warning-ink ring-1 ring-amber-300">within 48 hours</mark>.
          </p>
          <div className="mt-3 inline-flex rounded-md bg-sea-100 px-2 py-1 text-[12px] font-medium text-sea-500">Verify now →</div>
        </div>
      </div>

      {/* Floating verdict */}
      <div className="pop-in delay-4 absolute -bottom-8 right-3 w-56 rounded-2xl bg-white p-4 shadow-xl shadow-black/25 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <span className="font-display text-3xl font-extrabold text-navy-950">92</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-critical-ink ring-1 ring-red-200"><Octagon className="h-3.5 w-3.5" /> Likely scam</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-amber-400 to-critical" /></div>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">3 red flags · don't click, report it</p>
      </div>
      {/* Floating callout */}
      <div className="pop-in delay-2 absolute -top-7 right-2 max-w-[13rem] rounded-xl bg-navy-950 px-3 py-2 text-[11px] leading-snug text-white shadow-lg ring-1 ring-white/15 sm:-right-4">
        <span className="font-semibold text-sunset-400">"l" posing as "i"</span><br />pepperd<b>l</b>ne.edu isn't Pepperdine
      </div>
    </div>
  );
}

function Waves() {
  return (
    <svg className="absolute inset-x-0 bottom-0 h-16 w-full text-sand-50 sm:h-24" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <path fill="currentColor" d="M0 64c120 24 240 36 360 24S600 32 720 40s240 48 360 48 240-24 360-40v72H0Z" />
    </svg>
  );
}

const STEPS = [
  { icon: Image, title: 'Paste or screenshot', text: 'Drop in the email, text or DM, straight from your inbox or phone.' },
  { icon: Cpu, title: 'Two layers inspect it', text: 'Rules catch hard evidence like fake domains. AI reads tone and context.' },
  { icon: ShieldCheck, title: 'Know what to do', text: 'A risk score, every red flag highlighted, and Pepperdine-specific next steps.' },
];

const LOOP = [
  { icon: ShieldCheck, title: 'Check', text: 'Someone checks a scam they received.' },
  { icon: Users, title: 'Share', text: 'They choose to share it anonymously.' },
  { icon: Eye, title: 'IT reviews', text: 'Pepperdine IT approves it on the dashboard.' },
  { icon: Refresh, title: 'Train', text: 'It becomes a new round of Spot the Phish.' },
];

export default function Home() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.stats().then(setStats).catch(() => {}); }, []);
  const live = stats && stats.checks > 0;

  const proof = live
    ? [
      { value: stats.checks, label: 'Messages checked', live: true },
      { value: stats.byVerdict?.scam || 0, label: 'Likely scams caught', live: true },
      { text: '1,000s', label: 'Practice messages' },
      { text: '0', label: 'Messages stored' },
    ]
    : [
      { text: '2', label: 'Layers of analysis' },
      { text: '1,000s', label: 'Practice messages' },
      { text: '10', label: 'Rounds per game' },
      { text: '0', label: 'Messages stored' },
    ];

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-sea-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-80 w-80 rounded-full bg-sunset-500/20 blur-3xl" />
        <div className="relative mx-auto grid grid-cols-1 max-w-6xl items-center gap-14 px-4 pb-28 pt-12 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-36">
          <div>
            <p className="fade-in inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sea-300 ring-1 ring-white/10">
              <Sparkles className="h-3.5 w-3.5" /> For the Pepperdine community
            </p>
            <h1 className="fade-in mt-5 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Catch the phish before it <span className="bg-gradient-to-r from-sunset-500 to-sunset-400 bg-clip-text text-transparent">pulls you under.</span>
            </h1>
            <p className="fade-in delay-1 mt-5 max-w-xl text-lg leading-relaxed text-navy-100">
              AI made scams personal, polished and cheap to send. Riptide checks suspicious messages in seconds,
              shows you exactly what gives them away, and trains you to spot the next one.
            </p>
            <div className="fade-in delay-1 mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#/check" className="btn btn-primary btn-lg"><ShieldCheck className="h-5 w-5" /> Check a message</a>
              <a href="#/train" className="btn btn-glass btn-lg"><Hook className="h-5 w-5" /> Play Spot the Phish</a>
            </div>
            <ul className="fade-in delay-2 mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-navy-100">
              {['Free, no sign-up', 'Messages never stored', 'Works on any phone'].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-sea-300" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="px-2 pb-6 sm:px-6 lg:px-0"><HeroPreview /></div>
        </div>
        <Waves />
      </section>

      {/* ---------- Proof strip ---------- */}
      <section className="relative mx-auto -mt-14 max-w-6xl px-4 sm:-mt-20">
        <Reveal className="card grid grid-cols-2 divide-slate-100 p-2 sm:grid-cols-4 sm:divide-x">
          {proof.map((s) => (
            <div key={s.label} className="px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="font-display text-3xl font-extrabold tracking-tight text-navy-950">
                  {s.text ?? <CountUp value={s.value} />}
                </span>
                {s.live && <span className="live-dot h-2 w-2 rounded-full bg-good" title="Live" />}
              </div>
              <div className="mt-0.5 text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ---------- Two tools ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <Reveal className="max-w-2xl">
          <div className="eyebrow">Two tools, one goal</div>
          <h2 className="section-title mt-2">Defend right now. Build the instinct for next time.</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-5">
          <Reveal as="a" href="#/check" className="card card-hover group relative overflow-hidden p-6 sm:p-8 lg:col-span-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white"><ShieldCheck className="h-6 w-6" /></div>
            <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-navy-950">Check</h3>
            <p className="mt-2 max-w-md text-slate-600">Got something weird? Paste it or drop a screenshot. Get a risk score, every red flag highlighted, and exactly how to report it at Pepperdine.</p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[['Lookalike domains', 'pepperd1ne.edu'], ['Hidden links', 'goes to refund-verify.co'], ['QR codes', 'decoded on your device']].map(([a, b]) => (
                <div key={a} className="rounded-xl bg-sand-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <div className="text-xs font-semibold text-navy-950">{a}</div>
                  <div className="truncate font-mono text-[11px] text-slate-500">{b}</div>
                </div>
              ))}
            </div>
            <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-sunset-600">Check a message <Arrow className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Reveal>
          <Reveal as="a" href="#/train" delay={80} className="card card-hover group relative overflow-hidden bg-navy-900 p-6 text-white sm:p-8 lg:col-span-2">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sunset-500/25 blur-2xl" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-sunset-500 text-white"><Target className="h-6 w-6" /></div>
            <h3 className="relative mt-5 text-2xl font-extrabold tracking-tight">Spot the Phish</h3>
            <p className="relative mt-2 text-navy-100">10 rounds where the scam hides in one letter, a dash or a faked sender. Fall for one and watch what an attacker would do next.</p>
            <div className="relative mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">3 levels</span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">3 lives</span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">Phish IQ score</span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">No repeats</span>
            </div>
            <span className="relative mt-6 inline-flex items-center gap-1.5 font-semibold text-sunset-400">Play now <Arrow className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Reveal>
        </div>
      </section>

      {/* ---------- How a check works ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal className="max-w-2xl">
          <div className="eyebrow">How it works</div>
          <h2 className="section-title mt-2">From "is this real?" to a clear answer in seconds</h2>
        </Reveal>
        <ol className="relative mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-navy-200 via-sunset-100 to-navy-200 md:block" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="relative flex items-start gap-4 text-left md:block md:text-center">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-slate-200 md:mx-auto md:h-16 md:w-16">
                <s.icon className="h-7 w-7 text-navy-800" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sunset-500 text-xs font-bold text-white">{i + 1}</span>
              </div>
              <div><h3 className="text-lg font-bold text-navy-950 md:mt-5">{s.title}</h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-600 md:mx-auto md:mt-1.5">{s.text}</p></div>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-10 grid grid-cols-1 gap-3 rounded-2xl bg-white p-5 text-sm ring-1 ring-slate-200 sm:grid-cols-3 sm:p-6">
          <div className="flex gap-3"><Zap className="mt-0.5 h-5 w-5 shrink-0 text-sunset-600" /><p className="text-slate-600"><b className="text-navy-950">Rules engine:</b> instant and explainable. Knows 30+ scam patterns and every lookalike trick.</p></div>
          <div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-sunset-600" /><p className="text-slate-600"><b className="text-navy-950">AI analyst:</b> reads screenshots and catches polished, AI-written spear phishing.</p></div>
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sunset-600" /><p className="text-slate-600"><b className="text-navy-950">Blended verdict:</b> hard evidence like a fake domain can never be outvoted.</p></div>
        </Reveal>
      </section>

      {/* ---------- The loop ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal className="card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr]">
            <div className="bg-sand-100 p-6 sm:p-10">
              <div className="eyebrow">The loop</div>
              <h2 className="section-title mt-2">Real scams become tomorrow's training</h2>
              <p className="mt-3 text-slate-600">Most awareness training reuses the same old examples. Riptide learns from what is actually hitting Pepperdine inboxes this week.</p>
              <a href="#/dashboard" className="btn btn-outline mt-6"><BarChart className="h-4 w-4" /> See the Threat Pulse</a>
            </div>
            <ol className="grid grid-cols-2 gap-px bg-slate-100">
              {LOOP.map((s, i) => (
                <li key={s.title} className="bg-white p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><s.icon className="h-5 w-5" /></span>
                    <span className="font-display text-sm font-bold text-slate-300">0{i + 1}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-navy-950 sm:mt-4">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* ---------- Privacy + help ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Reveal className="card p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><Lock className="h-5 w-5" /></div>
            <h2 className="mt-4 text-xl font-bold text-navy-950">Privacy by design</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                <>Messages you check are <b className="text-navy-950">never stored</b>, only anonymous totals.</>,
                <>Phone and ID numbers are <b className="text-navy-950">removed before AI analysis</b>, and you can see exactly what was sent.</>,
                <>Sharing a scam for training is <b className="text-navy-950">opt-in</b> and reviewed by IT first.</>,
              ].map((t, i) => <li key={i} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-good-ink" /><span>{t}</span></li>)}
            </ul>
          </Reveal>
          <Reveal delay={80} className="card p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sunset-50 text-sunset-600"><Phone className="h-5 w-5" /></div>
            <h2 className="mt-4 text-xl font-bold text-navy-950">Pepperdine help, 24/7</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2.5"><Hook className="mt-0.5 h-4 w-4 shrink-0 text-sunset-600" /><span><b className="text-navy-950">Phish Alert Button:</b> the orange fish hook above a message in Gmail. One click reports and removes it.</span></li>
              <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-sunset-600" /><span><b className="text-navy-950">Tech Support:</b> <a className="font-medium text-navy-800 underline decoration-navy-200 underline-offset-2" href="tel:+13105064357">{PEPPERDINE.techSupportPhone}</a> ({PEPPERDINE.techSupportVanity})</span></li>
              <li className="flex gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sunset-600" /><span><b className="text-navy-950">Already clicked?</b> Call the Information Security Office at <a className="font-medium text-navy-800 underline decoration-navy-200 underline-offset-2" href="tel:+13105064040">{PEPPERDINE.isoPhone}</a>.</span></li>
            </ul>
          </Reveal>
        </div>

        {/* Closing CTA */}
        <Reveal className="relative mt-16 overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-center text-white sm:px-12">
          <div className="hero-grid pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-sunset-500/25 blur-3xl" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Got a suspicious message right now?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-navy-100">Check it before you click. It takes seconds and nothing is saved.</p>
          <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#/check" className="btn btn-primary btn-lg"><ShieldCheck className="h-5 w-5" /> Check a message</a>
            <a href="#/train" className="btn btn-glass btn-lg"><Hook className="h-5 w-5" /> Practice first</a>
          </div>
          {live && <div className="relative mt-6 flex justify-center"><LivePill>{stats.checks.toLocaleString()} checked so far</LivePill></div>}
        </Reveal>
      </section>
    </>
  );
}
