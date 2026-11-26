'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Webhooks() {
  const [rows, setRows] = React.useState<any[]>([]); const [provider, setProvider] = React.useState('');
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [sel, setSel] = React.useState<any>(null);
  const load = React.useCallback(() => { setLoading(true); get(`/admin/payments/webhooks${provider?`?provider=${provider}`:''}`).then((j:any)=>setRows(j.items||j.events||[])).catch(setErr).finally(()=>setLoading(false)); }, [provider]);
  React.useEffect(load, [load]);
  const replay = async (e:any) => { try { await post(`/admin/payments/webhooks/${e.event_id || e.id}/replay`, {}); setMsg('Webhook replayed.'); load(); } catch (er:any) { setErr(er); } };
  return <Shell title="Webhook log" breadcrumb="Customers / Payments / Webhook log">
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    <Card><div className="flex gap-3 p-4"><Select label="" value={provider} onChange={(e:any)=>setProvider(e.target.value)}><option value="">All providers</option><option value="paddle">Paddle</option><option value="lemonsqueezy">Lemon Squeezy</option><option value="stripe">Stripe</option></Select><Btn variant="secondary" onClick={load}>Refresh</Btn></div>
    {err && <div className="px-4 pb-4"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No webhook events yet" sub="Signed webhook events from automatic providers will be listed here." /> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">Event</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Received</th><th className="px-3 py-3" /></tr></thead>
    <tbody>{rows.map((e:any,i:number)=><tr key={e.event_id||e.id||i} className="border-b border-line"><td className="px-5 py-3 font-mono text-xs">{e.event_id || e.id}</td><td className="px-3 py-3">{e.provider_key}</td><td className="px-3 py-3">{e.type}</td><td className="px-3 py-3"><Badge tone={e.status==='processed'?'success':e.status==='failed'?'danger':'warn'}>{e.status}</Badge>{e.error && <p className="text-xs text-danger">{e.error}</p>}</td><td className="px-3 py-3 text-muted">{timeAgo(e.received_at)}</td>
    <td className="px-3 py-3 text-right"><Btn variant="ghost" onClick={()=>setSel(e)}>Payload</Btn><Btn variant="secondary" onClick={()=>replay(e)}>Replay</Btn></td></tr>)}</tbody></table></div>}</Card>
    <Modal open={!!sel} onClose={()=>setSel(null)} title="Webhook payload">
      <pre className="max-h-96 overflow-auto rounded-[12px] bg-ink p-4 text-xs text-white">{JSON.stringify(sel?.payload || sel, null, 2)}</pre>
    </Modal>
  </Shell>;
}
