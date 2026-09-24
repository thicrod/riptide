import { Fragment } from 'react';
import { findRanges, buildSegments, hostOf } from '../lib/segments.js';

/**
 * Renders text with numbered red-flag highlights and "real destination" link tooltips.
 * items: [{ n, quote, start?, end?, severity, why }]
 * links: [{ text, href }]
 */
export default function RichText({ text, items = [], links = [], revealed = true, activeN, onActivate, className = '' }) {
  if (!text) return null;
  const ranges = revealed ? findRanges(text, items) : [];
  const segments = buildSegments(text, ranges, links);

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {segments.map((seg, i) => {
        let node = seg.text;
        const hasFlags = seg.items.length > 0;
        const isActive = hasFlags && seg.items.some((it) => it.n === activeN);
        const linkHost = seg.link ? hostOf(seg.link.href) : null;
        const tipLines = [
          ...seg.items.map((it) => `${it.n}. ${it.why}`),
          ...(seg.link ? [`Real destination: ${seg.link.href}`] : []),
        ];

        if (seg.link) {
          node = <span className="text-sea-500 underline decoration-1 underline-offset-2">{node}</span>;
        }
        const mismatch = seg.link && !seg.link.text.toLowerCase().includes(linkHost.replace(/^www\./, ''));
        const revealBadge = seg.link && revealed && seg.link.isEnd && mismatch ? (
          <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-navy-900 px-1 py-px align-middle text-[10px] font-semibold text-white no-underline">
            goes to {linkHost}
          </span>
        ) : null;

        if (hasFlags) {
          return (
            <Fragment key={i}>
            <mark
              tabIndex={0}
              className={`flag-mark flag-${seg.severity} tip-host text-inherit ${isActive ? 'is-active' : ''}`}
              onMouseEnter={() => onActivate?.(seg.items[0].n)}
              onFocus={() => onActivate?.(seg.items[0].n)}
              onClick={() => onActivate?.(seg.items[0].n)}
            >
              {seg.starts.map((it) => <span key={it.n} className="flag-num">{it.n}</span>)}
              {node}
              <span className="tip" role="tooltip">{tipLines.map((l, k) => <span key={k} className="block">{l}</span>)}</span>
            </mark>
            {revealBadge}
            </Fragment>
          );
        }
        if (seg.link) {
          return (
            <span key={i} className="tip-host cursor-help" tabIndex={0}>
              {node}
              <span className="tip" role="tooltip">Real destination: {seg.link.href}</span>
              {revealBadge}
            </span>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </span>
  );
}
