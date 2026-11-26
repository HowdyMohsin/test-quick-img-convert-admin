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
  return <div className="flex items-end gap-2" style={{ height }}>
    {data.map((d, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1">
      <span className="text-xs font-semibold text-ink">{d.value}</span>
      <div className="w-full rounded-t-[8px] bg-primary/80 transition-[height] duration-300 ease-out" style={{ height: `${Math.max((d.value / max) * (height - 48), 4)}px` }} title={`${d.label}: ${d.value}`} />
      <span className="truncate text-[11px] text-muted" style={{ maxWidth: 56 }}>{d.label}</span></div>)}
  </div>;
}
