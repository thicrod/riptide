import { categoryLabel } from '../../shared/categories.js';

const SEV = {
  high: { label: 'High', cls: 'bg-red-50 text-critical-ink ring-red-200', dot: 'bg-critical' },
  medium: { label: 'Medium', cls: 'bg-amber-50 text-warning-ink ring-amber-200', dot: 'bg-warning' },
  low: { label: 'Low', cls: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sea-500' },
};
const SOURCE = { rules: 'Rules', ai: 'AI', both: 'Rules + AI' };

export default function FlagList({ items, activeN, onActivate, showSource = false }) {
  if (!items.length) return null;
  return (
    <ol className="space-y-2">
      {items.map((f) => {
        const sev = SEV[f.severity] || SEV.medium;
        const active = f.n === activeN;
        return (
          <li
            key={f.n}
            onMouseEnter={() => onActivate?.(f.n)}
            className={`flex gap-3 rounded-xl border bg-white p-3 transition ${active ? 'border-navy-900 shadow-sm' : 'border-slate-200'}`}
          >
            <span className="flag-num mt-0.5 shrink-0" style={{ minWidth: '1.4rem', height: '1.4rem', fontSize: '0.75rem' }}>{f.n}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold text-navy-950">{categoryLabel(f.category)}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold ring-1 ${sev.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />{sev.label}
                </span>
                {showSource && f.source && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-600">{SOURCE[f.source] || f.source}</span>
                )}
              </div>
              {f.quote && <p className="mt-1 truncate font-mono text-xs text-slate-500">“{f.quote}”</p>}
              <p className="mt-1 text-sm text-slate-700">{f.why}</p>
              {f.start === null && f.source === 'ai' && (
                <p className="mt-1 text-[11px] text-slate-400">Spotted by the AI across the whole message (not tied to one phrase).</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
