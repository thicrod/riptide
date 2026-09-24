import { useEffect, useRef, useState } from 'react';
import { Octagon, Arrow } from './Icons.jsx';
import { CATEGORIES } from '../../shared/categories.js';
import { attackPlan, START_LIVES } from '../lib/attack.js';

export { START_LIVES, MISS_PENALTY, FALSE_ALARM_PENALTY } from '../lib/attack.js';

function Heart({ full, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.2C1.3 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.7 3.3 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"
        fill={full ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );
}

export function Lives({ lives, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${lives} of ${START_LIVES} lives left`}>
      {Array.from({ length: START_LIVES }, (_, i) => (
        <Heart key={i} full={i < lives} className={`h-4 w-4 ${i < lives ? 'text-critical' : 'text-slate-300'}`} />
      ))}
    </span>
  );
}

/** Full-screen "you got phished" moment: the attack plays out step by step. */
export default function Breach({ card, lives, penalty, onClose }) {
  const plan = attackPlan(card);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduce ? plan.steps.length : 0);
  const btn = useRef(null);
  const over = lives <= 0;

  useEffect(() => {
    if (shown >= plan.steps.length) return undefined;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 350 : 650);
    return () => clearTimeout(t);
  }, [shown, plan.steps.length]);

  useEffect(() => {
    btn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey, true); };
  }, [onClose]);

  const done = shown >= plan.steps.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="breach-title" aria-describedby="breach-steps">
      <div className="breach-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#1a0707] p-6 text-white shadow-2xl ring-1 ring-red-500/40 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-critical px-3 py-1 text-xs font-black uppercase tracking-widest">
            <Octagon className="h-4 w-4" /> {over ? 'Account compromised' : 'You got phished'}
          </span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-red-200">
            <Lives lives={lives} /> −{penalty} pts
          </span>
        </div>
        <h2 id="breach-title" className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">{plan.headline}</h2>
        <p className="mt-1 text-sm text-red-200">Here's what happens next in a real attack like this one:</p>

        <ol id="breach-steps" className="mt-5 space-y-3" aria-live="polite">
          {plan.steps.slice(0, shown).map(([time, text]) => (
            <li key={time + text} className="fade-in flex gap-3">
              <span className="w-16 shrink-0 pt-0.5 text-right font-mono text-xs font-bold text-red-300">{time}</span>
              <span className="border-l-2 border-red-500/60 pl-3 text-[15px] leading-snug text-red-50">{text}</span>
            </li>
          ))}
        </ol>

        {done && plan.tell && (
          <div className="fade-in mt-5 rounded-xl bg-white/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-sea-300">What gave it away</div>
            <p className="mt-1 font-mono text-sm text-white break-words">"{plan.tell.quote}"</p>
            <p className="mt-1 text-sm text-red-100">{plan.tell.why || CATEGORIES[plan.tell.category]?.tip}</p>
          </div>
        )}

        <p className="mt-5 text-sm text-red-200">
          {over
            ? 'Three strikes. In real life, one is enough, which is why you practice here.'
            : `${lives} ${lives === 1 ? 'life' : 'lives'} left. In real life, you only get one.`}
        </p>
        <button
          ref={btn}
          onClick={done ? onClose : () => setShown(plan.steps.length)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#1a0707] transition hover:bg-red-50"
        >
          {done ? 'Show me every red flag' : 'Skip ahead'} <Arrow className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
