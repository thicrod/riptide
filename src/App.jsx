import { useEffect, useState } from 'react';
import { useHashRoute } from './lib/useHashRoute.js';
import { api } from './lib/api.js';
import { WaveLogo, Sparkles } from './components/Icons.jsx';
import { PEPPERDINE } from '../shared/categories.js';
import Home from './pages/Home.jsx';
import Check from './pages/Check.jsx';
import Train from './pages/Train.jsx';
import Dashboard from './pages/Dashboard.jsx';

const NAV = [
  { id: 'check', label: 'Check a message', short: 'Check' },
  { id: 'train', label: 'Spot the Phish', short: 'Train' },
  { id: 'dashboard', label: 'Dashboard', short: 'Dashboard' },
];

export default function App() {
  const route = useHashRoute();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false, ai: null }));
  }, []);

  let page;
  if (route === 'check') page = <Check health={health} />;
  else if (route === 'train') page = <Train />;
  else if (route === 'dashboard') page = <Dashboard />;
  else page = <Home />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-navy-800 bg-navy-900/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <a href="#/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-sea-300">
            <WaveLogo className="h-8 w-8" />
            <span className="hidden text-lg font-bold tracking-tight min-[400px]:inline">Riptide</span>
          </a>
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto text-sm">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#/${n.id}`}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium sm:px-3 transition ${route === n.id ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'}`}
              >
                <span className="sm:hidden">{n.short}</span>
                <span className="hidden sm:inline">{n.label}</span>
              </a>
            ))}
          </nav>
          {health && (
            <span
              className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-navy-100 md:inline-flex"
              title={health.ai ? `AI model: ${health.ai.model}` : 'Add an API key in .env to turn on the AI layer'}
            >
              <span className={`h-2 w-2 rounded-full ${health.ai ? 'bg-green-400' : 'bg-amber-400'}`} />
              {health.ai ? <>AI on · {health.ai.provider}</> : 'Rules-only mode'}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1">{page}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-600 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-semibold text-navy-950"><WaveLogo className="h-6 w-6" /> Riptide</div>
            <p className="mt-2">Catch the phish before it pulls you under. Built for the Pepperdine Cybersecurity &amp; Campus Safety Hackathon 2026.</p>
          </div>
          <div>
            <div className="font-semibold text-navy-950">Got a phishing message?</div>
            <p className="mt-2">Use the Phish Alert Button (the orange fish hook in Gmail on Chrome) or call Tech Support at <a className="font-medium text-navy-800 underline" href="tel:+13105064357">{PEPPERDINE.techSupportPhone}</a> (24/7).</p>
            <a className="mt-1 inline-block font-medium text-navy-800 underline" href={PEPPERDINE.reportIncidentUrl} target="_blank" rel="noreferrer">Report a security incident</a>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-navy-950"><Sparkles className="h-4 w-4" /> Privacy promise</div>
            <p className="mt-2">We never store the messages you check. Personal numbers are removed before AI analysis. Sharing a message for training is always opt-in and reviewed by IT.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
