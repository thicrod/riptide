// Turns text + red flags + links into renderable pieces, so the same highlighter
// powers both the Check results and the game's reveal.

const RANK = { low: 1, medium: 2, high: 3 };

/** items: [{ quote, start?, end?, severity, n }] -> ranges in this text */
export function findRanges(text, items) {
  const ranges = [];
  for (const item of items) {
    let { start, end } = item;
    if (start == null || end == null || text.slice(start, end) !== item.quote) {
      if (!item.quote) continue;
      let idx = text.indexOf(item.quote);
      if (idx < 0) idx = text.toLowerCase().indexOf(item.quote.toLowerCase());
      if (idx < 0) continue;
      start = idx;
      end = idx + item.quote.length;
    }
    ranges.push({ start, end, item });
  }
  return ranges;
}

export function buildSegments(text, ranges, links = []) {
  const linkRanges = [];
  links.forEach((link, i) => {
    const idx = text.indexOf(link.text);
    if (idx >= 0) linkRanges.push({ start: idx, end: idx + link.text.length, link, i });
  });
  const points = new Set([0, text.length]);
  for (const r of [...ranges, ...linkRanges]) { points.add(r.start); points.add(r.end); }
  const sorted = [...points].sort((a, b) => a - b);

  const segments = [];
  for (let k = 0; k < sorted.length - 1; k++) {
    const a = sorted[k];
    const b = sorted[k + 1];
    if (a === b) continue;
    const covering = ranges.filter((r) => r.start <= a && r.end >= b);
    const link = linkRanges.find((r) => r.start <= a && r.end >= b);
    const starts = covering.filter((r) => r.start === a).map((r) => r.item);
    const top = covering.reduce((best, r) => (!best || RANK[r.item.severity] > RANK[best.severity] ? r.item : best), null);
    segments.push({
      text: text.slice(a, b),
      items: covering.map((r) => r.item),
      starts,
      severity: top?.severity,
      link: link ? { ...link.link, isEnd: link.end === b } : null,
    });
  }
  return segments;
}

export function hostOf(href) {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}
