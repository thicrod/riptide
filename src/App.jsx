import { Suspense, lazy, useEffect, useState } from 'react';
import { useHashRoute } from './lib/useHashRoute.js';
import { api } from './lib/api.js';
import { WaveLogo, HomeIcon, ShieldCheck, Hook, BarChart, Lock, Phone } from './components/Icons.jsx';
import { PEPPERDINE } from '../shared/categories.js';
import Home from './pages/Home.jsx';

// Each page loads on demand, so the first visit only downloads what it shows.
const loaders = {
  check: () => import('./pages/Check.jsx'),
  train: () => import('./pages/Train.jsx'),
  dashboard: () => import('./pages/Dashboard.jsx'),
};
// If a page's code fails to load (e.g. the site was redeployed while this tab was open), reload once.
const lazyPage = (load) => lazy(() => load().then((m) => { try { sessionStorage.removeItem('riptide.reloaded'); } catch { /* ignore */ } return m; }).catch((err) => {
  let reloaded = false;
  try { reloaded = sessionStorage.getItem('riptide.reloaded') === '1'; sessionStorage.setItem('riptide.reloaded', '1'); } catch { /* ignore */ }
  if (!reloaded) { window.location.reload(); return new Promise(() => {}); }
  throw err;
}));
const Check = lazyPage(loaders.check);
const Train = lazyPage(loaders.train);
const Dashboard = lazyPage(loaders.dashboard);
const prefetch = (id) => loaders[id]?.();

const NAV = [
  { id: 'home', href: '#/', label: 'Home', icon: HomeIcon, mobileOnly: true },
  { id: 'check', href: '#/check', label: 'Check a message', short: 'Check', icon: ShieldCheck },
  { id: 'train', href: '#/train', label: 'Spot the Phish', short: 'Train', icon: Hook },
  { id: 'dashboard', href: '#/dashboard', label: 'Threat Pulse', short: 'Pulse', icon: BarChart },
];

const TITLES = {
  home: 'Riptide · Catch the phish before it pulls you under',
  check: 'Check a message · Riptide',
  train: 'Spot the Phish · Riptide',
  dashboard: 'Campus Threat Pulse · Riptide',
};

function AiStatus({ health, compact = false }) {
  if (!health) return null;
  const on = !!health.ai;
  const label = on ? `AI on · ${health.ai.provider}` : 'Rules-only mode';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 text-xs font-medium text-navy-100 ring-1 ring-white/10 ${compact ? 'p-1.5' : 'px-2.5 py-1'}`}
      title={on ? `AI analyst on (${health.ai.provider}, ${health.ai.model})` : 'AI analyst off: rules engine only'}
      aria-label={label}
    >
      <span className={`h-2 w-2 rounded-full ${on ? 'live-dot bg-green-400' : 'bg-amber-400'}`} />
      {!compact && label}
    </span>
  );
}

function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
      <div className="shimmer h-9 w-64 rounded-lg" />
      <div className="shimmer mt-3 h-4 w-96 max-w-full rounded" />
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="shimmer h-72 rounded-2xl" /><div className="shimmer h-72 rounded-2xl" /></div>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false, ai: null }));
  }, []);
  useEffect(() => { document.title = TITLES[route] || TITLES.home; }, [route]);

  let page;
  if (route === 'check') page = <Check health={health} />;
  else if (route === 'train') page = <Train />;
  else if (route === 'dashboard') page = <Dashboard />;
  else page = <Home />;
  const active = TITLES[route] ? route : 'home';

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:font-semibold focus:text-navy-900 focus:shadow-lg">Skip to content</a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900/90 text-white backdrop-blur-md supports-[backdrop-filter]:bg-navy-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <a href="#/" className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-sea-300" aria-label="Riptide home">
            <WaveLogo className="h-9 w-9 transition group-hover:scale-105" />
            <span className="font-display text-lg font-extrabold tracking-tight">Riptide</span>
          </a>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.filter((n) => !n.mobileOnly).map((n) => {
              const on = active === n.id;
              return (
                <a
                  key={n.id}
                  href={n.href}
                  onMouseEnter={() => prefetch(n.id)}
                  onFocus={() => prefetch(n.id)}
                  aria-current={on ? 'page' : undefined}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition ${on ? 'text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'}`}
                >
                  {n.label}
                  <span className={`absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-sunset-500 transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} />
                </a>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <span className="hidden lg:inline-flex"><AiStatus health={health} /></span>
            <span className="lg:hidden"><AiStatus health={health} compact /></span>
            {active !== 'check' && (
              <a href="#/check" onMouseEnter={() => prefetch('check')} className="btn btn-primary btn-sm hidden sm:inline-flex md:hidden lg:inline-flex">
                <ShieldCheck className="h-4 w-4" /> Check now
              </a>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 pb-24 md:pb-0">
        <div key={active} className="page-enter">
          <Suspense fallback={<PageFallback />}>{page}</Suspense>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white pb-24 md:pb-0">
        <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 px-4 py-12 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.2fr]">
          <div>
            <a href="#/" className="flex items-center gap-2 font-display text-base font-extrabold text-navy-950"><WaveLogo className="h-7 w-7" /> Riptide</a>
            <p className="mt-3 max-w-xs leading-relaxed">Catch the phish before it pulls you under. A scam checker and phishing trainer for the Pepperdine community.</p>
          </div>
          <div>
            <div className="font-semibold text-navy-950">Explore</div>
            <ul className="mt-3 space-y-2">
              {NAV.filter((n) => !n.mobileOnly).map((n) => <li key={n.id}><a className="transition hover:text-navy-900" href={n.href}>{n.label}</a></li>)}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-navy-950"><Phone className="h-4 w-4" /> Got a phishing message?</div>
            <p className="mt-3 leading-relaxed">Use the Phish Alert Button (orange fish hook) in Gmail, or call Tech Support 24/7 at <a className="font-medium text-navy-800 underline decoration-navy-200 underline-offset-2 hover:decoration-navy-800" href="tel:+13105064357">{PEPPERDINE.techSupportPhone}</a>.</p>
            <a className="mt-2 inline-block font-medium text-navy-800 underline decoration-navy-200 underline-offset-2 hover:decoration-navy-800" href={PEPPERDINE.reportIncidentUrl} target="_blank" rel="noreferrer">Report a security incident</a>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-navy-950"><Lock className="h-4 w-4" /> Privacy promise</div>
            <p className="mt-3 leading-relaxed">Messages you check are never stored. Personal numbers are removed before AI analysis. Sharing a scam for training is opt-in and reviewed by IT.</p>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-400">Built for the Pepperdine Cybersecurity &amp; Campus Safety Hackathon 2026. Student project, not an official Pepperdine service. Riptide gives advice, not guarantees.</p>
        </div>
      </footer>

      {/* Phone tab bar: every section one tap away */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Main">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((n) => {
            const on = active === n.id;
            const Ico = n.icon;
            return (
              <a
                key={n.id}
                href={n.href}
                onTouchStart={() => prefetch(n.id)}
                aria-current={on ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${on ? 'text-sunset-600' : 'text-slate-500 active:text-navy-900'}`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${on ? 'bg-sunset-100' : ''}`}><Ico className="h-5 w-5" /></span>
                {n.short || n.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
