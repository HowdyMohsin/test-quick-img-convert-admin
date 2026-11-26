'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Requests() {
  const [rows, setRows] = React.useState<any[]>([]); const [status, setStatus] = React.useState('pending');
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [sel, setSel] = React.useState<any>(null); const [rejectReason, setRejectReason] = React.useState('');
  const load = React.useCallback(() => { setLoading(true); get(`/admin/payments/requests?status=${status}`).then((j:any)=>setRows(j.items||j.requests||[])).catch(setErr).finally(()=>setLoading(false)); }, [status]);
  React.useEffect(load, [load]);
  const decide = async (id: string, action: string, body?: any) => { try { await post(`/admin/payments/requests/${id}/${action}`, body||{}); setMsg(action==='approve' ? 'Approved — plan upgraded, receipt emailed, user notified.' : 'Request rejected.'); setSel(null); load(); } catch (e:any) { setErr(e); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    <Card><div className="flex flex-wrap gap-2 p-4">{['pending','approved','rejected','expired','all'].map(s=><button key={s} onClick={()=>setStatus(s)} className={`rounded-full px-4 py-2 text-sm font-semibold ${status===s?'bg-primary text-white':'bg-soft'}`}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div>
    {err && <div className="px-4 pb-4"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No requests here" sub="Manual payment requests awaiting a decision will appear here." /> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">Reference</th><th className="px-3 py-3">User</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Submitted</th><th className="px-3 py-3" /></tr></thead>
    <tbody>{rows.map((r:any)=><tr key={r.id} className="border-b border-line"><td className="px-5 py-3 font-semibold">{r.reference}</td><td className="px-3 py-3">{r.user_email || r.user_id}</td><td className="px-3 py-3">{r.plan_id || r.plan} · {r.interval}</td><td className="px-3 py-3">{money(r.amount_cents)} {r.display_amount ? `(${r.display_amount})` : ''}</td><td className="px-3 py-3">{r.provider_key}</td><td className="px-3 py-3 text-muted">{timeAgo(r.created_at)}</td>
    <td className="px-3 py-3 text-right">{r.status==='pending' ? <span className="flex justify-end gap-2"><Btn variant="success" onClick={()=>decide(r.id,'approve')}>Approve</Btn><Btn variant="danger" onClick={()=>setSel(r)}>Reject</Btn></span> : <Badge tone={r.status==='approved'?'success':r.status==='rejected'?'danger':'soft'}>{r.status}</Badge>}</td></tr>)}</tbody></table></div>}</Card>
    <Modal open={!!sel} onClose={()=>setSel(null)} title="Reject payment request">
      <p className="mb-3 text-sm text-muted">The user is notified with this reason.</p>
      <Textarea label="Rejection reason (required)" rows={3} value={rejectReason} onChange={(e:any)=>setRejectReason(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setSel(null)}>Cancel</Btn><Btn variant="danger" disabled={!rejectReason.trim()} onClick={()=>decide(sel.id,'reject',{reason:rejectReason})}>Reject request</Btn></div>
    </Modal>
  </>;
}
