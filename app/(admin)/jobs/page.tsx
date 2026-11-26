'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Jobs() {
  const [rows, setRows] = React.useState<any[]>([]); const [status, setStatus] = React.useState('');
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [sel, setSel] = React.useState<any>(null);
  const [purgeOpen, setPurgeOpen] = React.useState(false); const [purging, setPurging] = React.useState(false);
  // A missing /admin/jobs route (404) means "no jobs yet", not a red banner.
  const load = React.useCallback(() => { setLoading(true); get(`/admin/jobs${status?`?status=${status}`:''}`).then((j:any)=>setRows(j.items||j.jobs||[])).catch((e:any)=>{ if (e?.status === 404) { setRows([]); setErr(null); } else setErr(e); }).finally(()=>setLoading(false)); }, [status]);
  React.useEffect(()=>{ load(); const t = setInterval(load, 15000); return ()=>clearInterval(t); }, [load]);
  const act = async (id:string, a:string) => { try { await post(`/admin/jobs/${id}/${a}`, {}); setMsg(`Job ${a==='cancel'?'cancelled':a==='retry'?'queued for retry':a}.`); load(); } catch(e:any){ setErr(e); } };
  const purge = async () => { setPurging(true); try { await post('/admin/jobs/purge-expired', {}); setMsg('Expired jobs purged.'); setPurgeOpen(false); load(); } catch(e:any){ setErr(e); setPurgeOpen(false); } finally { setPurging(false); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    <Card><div className="flex flex-wrap gap-3 p-4"><Select label="" value={status} onChange={(e:any)=>setStatus(e.target.value)}><option value="">All statuses</option><option value="queued">Queued</option><option value="running">Running</option><option value="done">Done</option><option value="failed">Failed</option><option value="canceled">Canceled</option></Select>
    <Btn variant="secondary" onClick={load}>Refresh</Btn>
    <Btn variant="danger" onClick={()=>setPurgeOpen(true)}>Purge expired</Btn></div>
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No jobs" sub="The live conversion queue will appear here." /> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">Job</th><th className="px-3 py-3">Pair</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Progress</th><th className="px-3 py-3">Created</th><th className="px-3 py-3" /></tr></thead>
    <tbody>{rows.map((j:any)=><tr key={j.id} className="border-b border-line"><td className="px-5 py-3 font-mono text-xs">{String(j.id).slice(0,12)}</td><td className="px-3 py-3">{j.pair_slug}</td>
      <td className="px-3 py-3"><Badge tone={j.status==='done'?'success':j.status==='failed'?'danger':j.status==='running'?'primary':'soft'}>{j.status}</Badge>{j.error_message && <p className="text-xs text-danger">{j.error_message}</p>}</td>
      <td className="px-3 py-3"><div className="h-2 w-24 overflow-hidden rounded-full bg-soft"><div className="h-full bg-primary" style={{width:`${j.progress||0}%`}} /></div></td>
      <td className="px-3 py-3 text-muted">{timeAgo(j.created_at)}</td>
      <td className="px-3 py-3 text-right"><Btn variant="ghost" onClick={()=>setSel(j)}>Inspect</Btn>{(j.status==='running'||j.status==='queued') && <Btn variant="danger" onClick={()=>act(j.id,'cancel')}>Cancel</Btn>}{j.status==='failed' && <Btn variant="secondary" onClick={()=>act(j.id,'retry')}>Retry</Btn>}</td></tr>)}</tbody></table></div>}</Card>
    <Modal open={!!sel} onClose={()=>setSel(null)} title="Job detail">
      <pre className="max-h-96 overflow-auto rounded-[12px] bg-ink p-4 text-xs text-white">{JSON.stringify(sel, null, 2)}</pre>
    </Modal>
    <Modal open={purgeOpen} onClose={()=>{ if (!purging) setPurgeOpen(false); }} title="Purge expired jobs">
      <div className="space-y-3">
        <p className="text-sm">Purge all expired jobs and their files? This cannot be undone.</p>
        <div className="flex justify-end gap-2"><Btn variant="secondary" disabled={purging} onClick={()=>setPurgeOpen(false)}>Cancel</Btn><Btn variant="danger" disabled={purging} onClick={purge}>{purging ? 'Purging…' : 'Purge expired'}</Btn></div>
      </div>
    </Modal>
  </>;
}
