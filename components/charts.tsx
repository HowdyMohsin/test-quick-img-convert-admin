'use client';
export function LineChart({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data || data.length === 0) return <p className="py-6 text-center text-sm text-muted">No chart data yet.</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 560, h = height, pad = 24;
  const pts = data.map((d, i) => [pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1), h - pad - (d.value / max) * (h - pad * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Trend chart">
    <path d={`${line} L${pts[pts.length-1][0]},${h-pad} L${pts[0][0]},${h-pad} Z`} fill="#4F46E5" opacity="0.08" />
    <path d={line} fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#4F46E5"><title>{`${data[i].label}: ${data[i].value}`}</title></circle>)}
  </svg>;
}
export function BarChart({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data || data.length === 0) return <p className="py-6 text-center text-sm text-muted">No chart data yet.</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const n = data.length;
  // 30 bars must fit inside the card: flex columns have min-width: auto by
  // default, so without min-w-0 they refuse to shrink below their label
  // width and the row blows out of the card (and the grid track with it).
  // As the count grows, tighten the gap, stop printing a value on every
  // bar, and thin the x-labels out (every kth) — past 20 bars the labels
  // go away entirely. The bar itself still carries `label: value` in its
  // title tooltip, so no data is lost.
  const gap = n <= 10 ? 'gap-2' : n <= 20 ? 'gap-1' : 'gap-[2px]';
  const showValues = n <= 14;
  const showLabels = n <= 20;
  const labelEvery = showLabels ? Math.ceil(n / 10) : 1;
  return <div className={`flex w-full min-w-0 items-end overflow-hidden ${gap}`} style={{ height }}>
    {data.map((d, i) => <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className={`text-xs font-semibold text-ink ${showValues ? '' : 'invisible'}`}>{d.value}</span>
      <div className="w-full rounded-t-[8px] bg-primary/80 transition-[height] duration-300 ease-out" style={{ height: `${Math.max((d.value / max) * (height - 48), 4)}px` }} title={`${d.label}: ${d.value}`} />
      {showLabels && <span className={`w-full truncate text-center text-[11px] text-muted ${i % labelEvery !== 0 ? 'invisible' : ''}`}>{d.label}</span>}</div>)}
  </div>;
}
