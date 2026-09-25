// "Spot the difference": shows the real vs fake version of a detail with the
// changed characters highlighted, so players SEE how small the change is.

// Split into characters (default) or into words/URL parts (mode: 'tokens'), which reads
// better when whole words or path pieces change.
const split = (s, mode) => (mode === 'tokens' ? s.split(/([\s./@:?=&-]+)/).filter(Boolean) : [...s]);

// Longest-common-subsequence diff: marks which pieces of each string are unchanged.
function diff(a, b, mode) {
  const A = split(a, mode);
  const B = split(b, mode);
  const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) {
    for (let j = B.length - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const keepA = new Array(A.length).fill(false);
  const keepB = new Array(B.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { keepA[i] = true; keepB[j] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { A, B, keepA, keepB };
}

function Marked({ chars, keep, tone }) {
  const cls = tone === 'fake' ? 'rounded-sm bg-red-200 font-bold text-critical-ink' : 'rounded-sm bg-green-200 font-bold text-good-ink';
  return chars.map((ch, i) => (keep[i] ? <span key={i}>{ch}</span> : <span key={i} className={cls}>{ch === ' ' ? ' ' : ch}</span>));
}

export default function SpotDiff({ items }) {
  if (!items?.length) return null;
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-navy-950">Spot the difference</h3>
      <p className="text-xs text-slate-500">What changed is highlighted.</p>
      <div className="mt-3 space-y-3">
        {items.map((c) => {
          const d = diff(c.real, c.fake, c.mode);
          return (
            <div key={c.label} className="rounded-xl bg-sand-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.label}</div>
              <div className="mt-1.5 grid grid-cols-[3rem_1fr] items-baseline gap-x-2 gap-y-1 font-mono text-[13px]">
                <span className="text-xs font-semibold text-good-ink">Real</span>
                <span className="break-all text-slate-800">{c.plain ? c.real : <Marked chars={d.A} keep={d.keepA} tone="real" />}</span>
                <span className="text-xs font-semibold text-critical-ink">Fake</span>
                <span className="break-all text-slate-800">{c.plain ? c.fake : <Marked chars={d.B} keep={d.keepB} tone="fake" />}</span>
              </div>
              {c.note && <p className="mt-1.5 text-xs text-slate-600">{c.note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
