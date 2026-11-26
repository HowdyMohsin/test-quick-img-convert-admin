'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

// The backend pair shape is { slug, from, to, status, ... } (CATALOG pairs);
// a newer backend may send { pair_slug, from_slug, to_slug, status, ... }.
// Normalize both so the table never renders the literal string "undefined".
const normPair = (r: any) => {
  const slug = r.pair_slug || r.slug || '';
  const from = r.from_slug || r.from || '';
  const to = r.to_slug || r.to || '';
  const label = slug || (from && to ? `${from} → ${to}` : '—');
  return { ...r, pair_slug: slug, from_slug: from, to_slug: to, label, status: r.status || 'healthy' };
};

export default function Formats() {
  const [rows, setRows] = React.useState<any[]>([]); const [q, setQ] = React.useState(''); const [filter, setFilter] = React.useState('');
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [checking, setChecking] = React.useState(false); const [progress, setProgress] = React.useState(0);
  const [sample, setSample] = React.useState({ format: 'jpg' });
  const load = React.useCallback(() => { setLoading(true); get('/admin/formats').then((j:any)=>setRows((j.items||j.pairs||[]).map(normPair))).catch(setErr).finally(()=>setLoading(false)); }, []);
  React.useEffect(load, []);
  const runCheck = async () => { setChecking(true); setProgress(0); try { await post('/admin/formats/health-check', {}); const t = setInterval(()=>setProgress(p=>{ if (p>=100){ clearInterval(t); setChecking(false); load(); } return Math.min(100, p+10); }), 200); } catch(e:any){ setErr(e); setChecking(false); } };
  // The backend pair-override route is PATCH /admin/formats/pairs/{slug}
  // with { visible }; it hides the pair from the public dropdowns.
  const toggle = async (r:any) => { try { await patch(`/admin/formats/pairs/${r.pair_slug}`, { visible: r.visible === false }); load(); } catch(e:any){ setErr(e); } };
  const filtered = rows.filter((r:any)=>{ const s = `${r.pair_slug||''} ${r.from_slug||''} ${r.to_slug||''}`.toLowerCase(); return (!q || s.includes(q.toLowerCase())) && (!filter || r.status===filter); });
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    <Card><div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-[200px] flex-1"><Input label="" placeholder="Filter pairs, e.g. jpg to png…" value={q} onChange={(e:any)=>setQ(e.target.value)} /></div>
      <Select label="" value={filter} onChange={(e:any)=>setFilter(e.target.value)}><option value="">All statuses</option><option value="healthy">Healthy</option><option value="disabled">Disabled</option></Select>
      <Btn onClick={runCheck} disabled={checking}>{checking ? `Health check… ${progress}%` : 'Run health check'}</Btn></div>
    {checking && <div className="px-5 pb-4"><div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full bg-primary transition-all" style={{width:`${progress}%`}} /></div></div>}
    <p className="px-5 pb-3 text-sm text-muted">{fmt(filtered.length)} of {fmt(rows.length)} pairs shown. A pair forced to fail disappears from the public dropdowns, the formats section and the sitemap.</p>
    {loading ? <Spinner /> : filtered.length===0 ? <Empty title="No pairs match" sub="Adjust the filter, or run a health check." /> :
    <div className="max-h-[560px] overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-soft"><tr className="text-left text-muted"><th className="px-5 py-3">Pair</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Last error</th><th className="px-3 py-3">Last checked</th><th className="px-3 py-3">Visible</th></tr></thead>
    <tbody>{filtered.map((r:any)=><tr key={r.pair_slug || r.label} className="border-t border-line"><td className="px-5 py-3 font-semibold">{r.label}</td>
      <td className="px-3 py-3"><Badge tone={r.status==='healthy'?'success':'danger'}>{r.status}</Badge></td><td className="px-3 py-3 text-muted">{r.last_error || '—'}</td><td className="px-3 py-3 text-muted">{timeAgo(r.last_checked_at)}</td>
      <td className="px-3 py-3"><Switch checked={r.visible !== false} onChange={()=>toggle(r)} label={`Toggle ${r.pair_slug}`} /></td></tr>)}</tbody></table></div>}</Card>
    <Card className="mt-4"><CardHead title="Sample files" sub="Bundled real samples used by Try with a sample file and by health checks." />
      <div className="flex flex-wrap items-end gap-3 p-5"><Input label="Format" value={sample.format} onChange={(e:any)=>setSample({format:e.target.value})} />
      <Btn variant="secondary" onClick={async()=>{ try { const j:any = await post(`/admin/formats/samples/${sample.format}/regenerate`, {}); setMsg(j.message || `Sample for ${sample.format} generated.`); } catch(e:any){ setErr(e); } }}>Generate sample</Btn></div></Card>
  </>;
}
