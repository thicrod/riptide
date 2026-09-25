import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { categoryLabel } from '../../shared/categories.js';
import { VerdictBadge } from '../components/Verdict.jsx';
import { CheckCircle, Alert, Octagon, Lock, Users, Refresh, Info, Check, XIcon, BarChart, ShieldCheck, Hook } from '../components/Icons.jsx';
import { PageHeader, CountUp, LivePill } from '../components/ui.jsx';

const SERIES = '#2a78d6'; // single-series chart color (validated reference blue)

function StatTile({ icon: Ico, label, value, share, tone }) {
  const tones = {
    good: 'text-good-ink bg-green-50',
    warning: 'text-warning-ink bg-amber-50',
    critical: 'text-critical-ink bg-red-50',
  };
  const bars = { good: 'bg-good', warning: 'bg-warning', critical: 'bg-critical' };
  return (
    <div className="card p-5">
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
        <Ico className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-3 font-display text-4xl font-extrabold tracking-tight text-navy-950"><CountUp value={value} /></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-[width] duration-1000 ${bars[tone]}`} style={{ width: `${share}%` }} /></div>
      <div className="mt-1.5 text-sm text-slate-500">{share}% of checks</div>
    </div>
  );
}

function ColumnChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 560;
  const H = 220;
  const pad = { t: 24, r: 8, b: 28, l: 8 };
  const max = Math.max(1, ...data.map((d) => d.checks));
  const band = (W - pad.l - pad.r) / data.length;
  const barW = Math.min(24, band * 0.55);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const base = H - pad.b;
  const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Messages checked per day, last 7 days">
        <line x1={pad.l} x2={W - pad.r} y1={base} y2={base} stroke="#e2e8f0" strokeWidth="1" />
        {data.map((d, i) => {
          const cx = pad.l + band * i + band / 2;
          const top = y(d.checks);
          const h = base - top;
          const r = Math.min(4, h);
          const x0 = cx - barW / 2;
          const path = h > 0
            ? `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z`
            : '';
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={cx - band / 2} y={pad.t - 20} width={band} height={H - pad.t} fill="transparent" />
              {path && <path d={path} fill={SERIES} opacity={hover === null || hover === i ? 1 : 0.55} />}
              <text x={cx} y={top - 6} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold tabular-nums">{d.checks}</text>
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">{day(d.date)}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-navy-950 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${((pad.l + band * hover + band / 2) / W) * 100}%`, top: 0 }}
        >
          <div className="font-semibold">{new Date(`${data[hover].date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          <div>{data[hover].checks} messages checked</div>
        </div>
      )}
    </div>
  );
}

function BarList({ data, total }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) return <p className="text-sm text-slate-500">No red flags recorded yet.</p>;
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.category} className="tip-host grid grid-cols-[9rem_1fr] items-center gap-3 sm:grid-cols-[11rem_1fr]" tabIndex={0}>
          <span className="truncate text-sm text-slate-700">{categoryLabel(d.category)}</span>
          <span className="flex items-center gap-2">
            <span className="h-3.5 rounded-r-[4px]" style={{ width: `${(d.count / max) * 82}%`, background: SERIES }} />
            <span className="text-xs font-semibold tabular-nums text-slate-700">{d.count}</span>
          </span>
          <span className="tip" role="tooltip">{categoryLabel(d.category)}: seen in {d.count} checks{total ? ` (${Math.round((d.count / total) * 100)}%)` : ''}</span>
        </li>
      ))}
    </ul>
  );
}

function Reports() {
  const [key, setKey] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(e) {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api.adminList(key);
      setItems(d.submissions);
    } catch (err) {
      setError(err.message);
      setItems(null);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    try {
      const d = await api.adminSet(key, id, status);
      setItems((list) => list.map((x) => (x.id === id ? d.item : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-800"><Users className="h-5 w-5" /></span>
        <h2 className="font-bold text-navy-950">Community reports</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">IT review queue</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">Messages people chose to share (personal numbers already removed). Approved reports become "Reported at Pepperdine" rounds in Spot the Phish.</p>

      {!items ? (
        <form onSubmit={load} className="mt-4 flex max-w-md gap-2">
          <label htmlFor="adminkey" className="sr-only">Admin key</label>
          <div className="relative flex-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="adminkey" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="IT admin key" className="field py-2.5 pl-9 pr-3 text-sm" />
          </div>
          <button disabled={busy || !key} className="btn btn-dark">{busy ? 'Opening…' : 'Open queue'}</button>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          <button onClick={() => load()} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-800"><Refresh className="h-4 w-4" /> Refresh</button>
          {items.length === 0 && <p className="text-sm text-slate-500">No reports yet.</p>}
          {items.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <VerdictBadge verdict={s.verdict} />
                <span className="text-xs text-slate-500">risk {s.score} · {new Date(s.createdAt).toLocaleString()}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === 'approved' ? 'bg-green-50 text-good-ink' : s.status === 'rejected' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-warning-ink'}`}>
                  {s.status === 'approved' ? 'In training' : s.status === 'rejected' ? 'Rejected' : 'Pending review'}
                </span>
              </div>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-sand-50 p-3 font-mono text-xs text-slate-700">{s.text}</pre>
              {s.flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...new Set(s.flags.map((f) => f.category))].map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{categoryLabel(c)}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setStatus(s.id, 'approved')} disabled={s.status === 'approved'} className="btn btn-dark btn-sm"><Check className="h-3.5 w-3.5" /> Approve for training</button>
                <button onClick={() => setStatus(s.id, 'rejected')} disabled={s.status === 'rejected'} className="btn btn-outline btn-sm"><XIcon className="h-3.5 w-3.5" /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-critical-ink">{error}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="mx-auto max-w-6xl px-4 py-10"><div className="card p-6 text-critical-ink">{error}</div></div>;
  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="shimmer h-10 w-72 rounded-lg" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-36 rounded-2xl" />)}</div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="shimmer h-72 rounded-2xl" /><div className="shimmer h-72 rounded-2xl" /></div>
      </div>
    );
  }

  const total = stats.checks || 0;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <PageHeader
        eyebrow="Campus threat pulse"
        icon={BarChart}
        title="What Riptide is seeing"
        description="Live, anonymous totals from checks across Pepperdine. Never message content."
        actions={stats.sampleData ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-warning-ink ring-1 ring-amber-200">
            <Info className="h-3.5 w-3.5" /> Sample data for the demo
          </span>
        ) : <LivePill>Live</LivePill>}
      />

      {total === 0 && (
        <div className="card mt-8 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sunset-50 text-sunset-600"><ShieldCheck className="h-6 w-6" /></span>
          <div className="flex-1">
            <div className="font-bold text-navy-950">No checks yet. Be the first.</div>
            <p className="mt-0.5 text-sm text-slate-600">Every message someone checks adds to these anonymous totals, so IT can see which tricks are hitting campus.</p>
          </div>
          <div className="flex gap-2">
            <a href="#/check" className="btn btn-primary btn-sm"><ShieldCheck className="h-4 w-4" /> Check a message</a>
            <a href="#/train" className="btn btn-outline btn-sm"><Hook className="h-4 w-4" /> Play</a>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[1.25rem] bg-navy-900 p-5 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sea-500/30 blur-2xl" />
          <div className="relative text-xs font-semibold uppercase tracking-wider text-sea-300">Messages checked</div>
          <div className="relative mt-2 font-display text-5xl font-extrabold tracking-tight"><CountUp value={total} /></div>
          <div className="relative mt-2 text-sm text-navy-100">{stats.players} game score{stats.players === 1 ? '' : 's'} · {stats.reports.approved} report{stats.reports.approved === 1 ? '' : 's'} in training</div>
        </div>
        <StatTile icon={Octagon} label="Likely scam" value={stats.byVerdict.scam || 0} share={pct(stats.byVerdict.scam || 0)} tone="critical" />
        <StatTile icon={Alert} label="Suspicious" value={stats.byVerdict.suspicious || 0} share={pct(stats.byVerdict.suspicious || 0)} tone="warning" />
        <StatTile icon={CheckCircle} label="Looks safe" value={stats.byVerdict.safe || 0} share={pct(stats.byVerdict.safe || 0)} tone="good" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h2 className="font-bold text-navy-950">Messages checked, last 7 days</h2>
          <p className="text-xs text-slate-500">Hover a day for details</p>
          <div className="mt-3"><ColumnChart data={stats.last7Days} /></div>
        </div>
        <div className="card p-5 sm:p-6">
          <h2 className="font-bold text-navy-950">Most common red flags</h2>
          <p className="mb-4 text-xs text-slate-500">Number of checks where each warning sign appeared</p>
          <BarList data={stats.topCategories} total={total} />
        </div>
      </div>

      <details className="card group mt-4 p-5 text-sm sm:p-6">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-navy-950">
          View the data as a table
          <span className="text-slate-400 transition group-open:rotate-90">›</span>
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">
          <table className="w-full text-left">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-1 font-medium">Day</th><th className="py-1 text-right font-medium">Checks</th></tr></thead>
            <tbody>{stats.last7Days.map((d) => <tr key={d.date} className="border-b border-slate-100"><td className="py-1">{d.date}</td><td className="py-1 text-right tabular">{d.checks}</td></tr>)}</tbody>
          </table>
          <table className="w-full text-left">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-1 font-medium">Red flag</th><th className="py-1 text-right font-medium">Checks</th></tr></thead>
            <tbody>{stats.topCategories.map((d) => <tr key={d.category} className="border-b border-slate-100"><td className="py-1">{categoryLabel(d.category)}</td><td className="py-1 text-right tabular">{d.count}</td></tr>)}</tbody>
          </table>
        </div>
      </details>

      <div className="mt-6"><Reports /></div>
    </div>
  );
}
