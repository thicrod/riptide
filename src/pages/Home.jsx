import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { PEPPERDINE } from '../../shared/categories.js';
import {
  ShieldCheck, Hook, Arrow, Users, Lock, Cpu, Sparkles, Eye, Refresh, Trophy, Phone,
} from '../components/Icons.jsx';

function Waves() {
  return (
    <svg className="absolute inset-x-0 bottom-0 h-24 w-full text-sand-50" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <path fill="currentColor" d="M0 64c120 24 240 36 360 24S600 32 720 40s240 48 360 48 240-24 360-40v72H0Z" />
    </svg>
  );
}

const LOOP = [
  { icon: ShieldCheck, title: 'Check', text: 'Paste a suspicious email or text, or upload a screenshot. Get a verdict and highlighted red flags in seconds.' },
  { icon: Users, title: 'Share (opt-in)', text: 'Choose to share a scam anonymously. Personal details are removed first.' },
  { icon: Eye, title: 'IT reviews', text: 'Pepperdine IT approves real reports on the dashboard and sees what is trending on campus.' },
  { icon: Refresh, title: 'Train', text: 'Approved scams become new rounds of Spot the Phish, so training keeps up with real attacks.' },
];

export default function Home() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.stats().then(setStats).catch(() => {}); }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sea-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-sunset-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-16 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sea-300">
            <Sparkles className="h-3.5 w-3.5" /> For the Pepperdine community
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Catch the phish before it <span className="text-sunset-500">pulls you under.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-navy-100">
            AI made scams personal, polished and cheap to send. Riptide checks suspicious messages in seconds,
            shows you exactly what gives them away, and trains you to spot the next one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#/check" className="inline-flex items-center gap-2 rounded-xl bg-sunset-500 px-5 py-3 font-semibold text-white shadow-lg shadow-sunset-500/25 transition hover:bg-sunset-600">
              <ShieldCheck className="h-5 w-5" /> Check a message
            </a>
            <a href="#/train" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20">
              <Hook className="h-5 w-5" /> Play Spot the Phish
            </a>
          </div>
        </div>
        <Waves />
      </section>

      {/* Stats strip */}
      <section className="relative mx-auto -mt-16 max-w-6xl px-4">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
          {[
            { label: 'Messages checked', value: stats?.checks },
            { label: 'Likely scams caught', value: stats?.byVerdict?.scam },
            { label: 'Community reports', value: stats ? stats.reports.pending + stats.reports.approved : undefined },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-sand-50 px-4 py-3">
              <div className="text-3xl font-bold text-navy-950">{s.value == null ? '·' : s.value.toLocaleString()}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
        {stats?.sampleData && <p className="mt-2 text-center text-xs text-slate-400">Showing sample demo data.</p>}
      </section>

      {/* Two modes */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          <a href="#/check" className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white"><ShieldCheck className="h-6 w-6" /></div>
            <h2 className="mt-4 text-xl font-bold text-navy-950">Check: defend right now</h2>
            <p className="mt-2 text-slate-600">Got something weird? Paste it or drop a screenshot. Riptide gives you a risk score, highlights every red flag and tells you exactly what to do next, including how to report it to Pepperdine IT.</p>
            <span className="mt-4 inline-flex items-center gap-1 font-semibold text-sunset-600">Check a message <Arrow className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </a>
          <a href="#/train" className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sunset-500 text-white"><Trophy className="h-6 w-6" /></div>
            <h2 className="mt-4 text-xl font-bold text-navy-950">Train: build the instinct</h2>
            <p className="mt-2 text-slate-600">10 rounds of realistic emails, texts and voicemails where the scam hides in one letter, a dash, a swapped comma or a hidden header. Plus spot-the-difference rounds where a real message and a fake look almost identical. Get your Phish IQ and your weak spot.</p>
            <span className="mt-4 inline-flex items-center gap-1 font-semibold text-sunset-600">Play Spot the Phish <Arrow className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </a>
        </div>
      </section>

      {/* The loop */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-navy-950 sm:text-3xl">The loop: real scams become training</h2>
          <p className="mt-2 max-w-2xl text-slate-600">Most awareness training uses the same old examples. Riptide learns from what is actually hitting Pepperdine inboxes this week.</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {LOOP.map((step, i) => (
              <li key={step.title} className="relative rounded-2xl bg-sand-50 p-5">
                <span className="absolute right-4 top-4 text-3xl font-bold text-navy-100">{i + 1}</span>
                <step.icon className="h-7 w-7 text-navy-800" />
                <h3 className="mt-3 font-semibold text-navy-950">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-navy-950 sm:text-3xl">Two layers, one verdict</h2>
        <p className="mt-2 max-w-2xl text-slate-600">Rules give hard, explainable evidence. AI understands context and tone. Together they catch what either would miss.</p>
        <div className="mt-8 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Cpu className="h-7 w-7 text-navy-800" />
            <h3 className="mt-3 font-semibold text-navy-950">1 · Rules engine</h3>
            <p className="mt-1 text-sm text-slate-600">Instant, no AI needed. Catches lookalike domains (pepperdlne.edu), hidden link destinations, Gmail senders posing as offices, shortened links, risky attachments and 30+ scam phrase patterns.</p>
          </div>
          <div className="hidden items-center text-slate-300 md:flex"><Arrow className="h-6 w-6" /></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Sparkles className="h-7 w-7 text-navy-800" />
            <h3 className="mt-3 font-semibold text-navy-950">2 · AI analyst</h3>
            <p className="mt-1 text-sm text-slate-600">Reads the whole message (even screenshots) like a security analyst who knows Pepperdine. Spots impersonation, emotional pressure and AI-written spear phishing. It ignores any instructions hidden inside the message.</p>
          </div>
          <div className="hidden items-center text-slate-300 md:flex"><Arrow className="h-6 w-6" /></div>
          <div className="rounded-2xl border border-navy-900 bg-navy-900 p-5 text-white">
            <ShieldCheck className="h-7 w-7 text-sea-300" />
            <h3 className="mt-3 font-semibold">3 · Blended verdict</h3>
            <p className="mt-1 text-sm text-navy-100">One risk score, every red flag highlighted in the message, and Pepperdine-specific next steps. Hard evidence (like a fake domain) can never be outvoted.</p>
          </div>
        </div>
      </section>

      {/* Privacy + resources */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-navy-800" /><h2 className="text-lg font-bold text-navy-950">Privacy by design</h2></div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Messages you check are <b>never stored</b>. We only count totals (like "12 scams today").</li>
              <li>• Phone numbers, ID numbers and your own address are <b>removed before AI analysis</b>, and you can see exactly what was sent.</li>
              <li>• Sharing a scam for training is <b>opt-in</b> and reviewed by IT before anyone sees it.</li>
              <li>• Riptide gives advice, not guarantees. When unsure, ask Pepperdine IT.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2"><Phone className="h-5 w-5 text-navy-800" /><h2 className="text-lg font-bold text-navy-950">Pepperdine resources</h2></div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• <b>Phish Alert Button:</b> the orange fish hook above a message in Gmail (signed into Chrome with your Pepperdine account). One click reports and removes it.</li>
              <li>• <b>Tech Support, 24/7:</b> <a className="font-medium text-navy-800 underline" href="tel:+13105064357">{PEPPERDINE.techSupportPhone}</a> ({PEPPERDINE.techSupportVanity})</li>
              <li>• <a className="font-medium text-navy-800 underline" href={PEPPERDINE.phishingGuideUrl} target="_blank" rel="noreferrer">How to spot and report phishing</a> · <a className="font-medium text-navy-800 underline" href={PEPPERDINE.reportIncidentUrl} target="_blank" rel="noreferrer">Report an incident</a></li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
