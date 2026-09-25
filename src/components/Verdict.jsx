import { useEffect, useState } from 'react';
import { VERDICTS } from '../../shared/categories.js';
import { CountUp } from './ui.jsx';
import { CheckCircle, Alert, Octagon } from './Icons.jsx';

const STYLE = {
  safe: { icon: CheckCircle, cls: 'bg-green-50 text-good-ink ring-green-200', bar: 'bg-good' },
  suspicious: { icon: Alert, cls: 'bg-amber-50 text-warning-ink ring-amber-200', bar: 'bg-warning' },
  scam: { icon: Octagon, cls: 'bg-red-50 text-critical-ink ring-red-200', bar: 'bg-critical' },
};

export function VerdictBadge({ verdict, size = 'md' }) {
  const s = STYLE[verdict] || STYLE.suspicious;
  const Ico = s.icon;
  const big = size === 'lg';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${s.cls} ${big ? 'px-3.5 py-1.5 text-base' : 'px-2.5 py-0.5 text-xs'}`}>
      <Ico className={big ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
      {VERDICTS[verdict]?.label || verdict}
    </span>
  );
}

export function RiskMeter({ score, verdict, layers }) {
  const s = STYLE[verdict] || STYLE.suspicious;
  const [pos, setPos] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setPos(score)); return () => cancelAnimationFrame(t); }, [score]);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <CountUp value={score} className="font-display text-6xl font-extrabold tracking-tight text-navy-950" />
          <span className="text-lg font-medium text-slate-500">/100 risk</span>
        </div>
        <VerdictBadge verdict={verdict} size="lg" />
      </div>

      <div className="relative mt-5" aria-hidden="true">
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          <div className="w-[30%] bg-green-200" />
          <div className="w-[35%] bg-amber-200" />
          <div className="w-[35%] bg-red-200" />
        </div>
        <div
          className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md transition-[left] duration-1000 ease-out ${s.bar}`}
          style={{ left: `${Math.min(98, Math.max(2, pos))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
        <span>0 · Looks safe</span>
        <span>30 · Suspicious</span>
        <span>65 · Likely scam · 100</span>
      </div>

      {layers && (
        <p className="mt-4 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100">
          <span className="font-semibold text-slate-700">How we scored it:</span>
          Rules engine <span className="font-semibold tabular">{layers.rules}</span>
          {layers.ai != null ? (
            <> · AI analyst <span className="font-semibold tabular">{layers.ai}</span> → combined <span className="font-semibold tabular">{score}</span></>
          ) : (
            <span>(AI layer off: rules-only mode)</span>
          )}
        </p>
      )}
    </div>
  );
}
