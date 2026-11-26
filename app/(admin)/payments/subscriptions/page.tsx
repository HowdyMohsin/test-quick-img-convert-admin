'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Subs() {
  const [rows, setRows] = React.useState<any[]>([]); const [status, setStatus] = React.useState('');
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(() => { setLoading(true); get(`/admin/payments/subscriptions${status?`?status=${status}`:''}`).then((j:any)=>setRows(j.items||j.subscriptions||[])).catch(setErr).finally(()=>setLoading(false)); }, [status]);
  React.useEffect(load, [load]);
  return <Shell title="Subscriptions" breadcrumb="Customers / Payments / Subscriptions">
    <Card><div className="flex gap-3 p-4"><Select label="" value={status} onChange={(e:any)=>setStatus(e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="past_due">Past due</option><option value="canceled">Canceled</option><option value="expired">Expired</option></Select><Btn variant="secondary" onClick={load}>Refresh</Btn></div>
    {err && <div className="px-4 pb-4"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No subscriptions" sub="Subscriptions appear here once a payment is approved or a checkout completes." /> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">User</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Period ends</th><th className="px-3 py-3">Grace ends</th></tr></thead>
    <tbody>{rows.map((s:any)=><tr key={s.id} className="border-b border-line"><td className="px-5 py-3">{s.user_email || s.user_id}</td><td className="px-3 py-3">{s.plan_id || s.plan}</td><td className="px-3 py-3">{s.provider_key}</td><td className="px-3 py-3"><Badge tone={s.status==='active'?'success':s.status==='past_due'?'warn':'soft'}>{s.status}</Badge></td><td className="px-3 py-3">{fmtDate(s.current_period_end)}</td><td className="px-3 py-3">{fmtDate(s.grace_ends_at)}</td></tr>)}</tbody></table></div>}</Card>
  </Shell>;
}
