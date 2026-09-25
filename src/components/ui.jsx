import { useEffect, useRef, useState } from 'react';

/** Consistent page title block used by Check, Train and Dashboard. */
export function PageHeader({ eyebrow, title, description, actions, icon: Ico }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <div className="eyebrow">{Ico && <Ico className="h-3.5 w-3.5" />}{eyebrow}</div>}
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-slate-600 sm:text-base">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Counts up to `value` once when it first appears. */
export function CountUp({ value, duration = 900, className = '' }) {
  const [shown, setShown] = useState(reduceMotion() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (value == null) return undefined;
    if (reduceMotion()) { setShown(value); return undefined; }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(a + (value - a) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={`tabular ${className}`}>{value == null ? '–' : shown.toLocaleString()}</span>;
}

/** Fades children in when they scroll into view. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

/** Small "Live" pill with a pulsing dot. */
export function LivePill({ children = 'Live' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-good-ink ring-1 ring-green-200">
      <span className="live-dot h-2 w-2 rounded-full bg-good" /> {children}
    </span>
  );
}
