'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Users() {
  const [q, setQ] = React.useState(''); const [plan, setPlan] = React.useState(''); const [status, setStatus] = React.useState('');
  const [rows, setRows] = React.useState<any[]>([]); const [total, setTotal] = React.useState(0); const [page, setPage] = React.useState(1);
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(() => { setLoading(true); setErr(null); const p = new URLSearchParams({ page: String(page), limit: '25', ...(q?{search:q}:{}), ...(plan?{plan}:{}), ...(status?{status}:{}) });
    get(`/admin/users?${p}`).then((j:any)=>{ setRows(j.items||j.users||[]); setTotal(j.total??j.count??(j.items||j.users||[]).length); }).catch(setErr).finally(()=>setLoading(false)); }, [q, plan, status, page]);
  React.useEffect(load, [load]);
  return <Shell title="Users" breadcrumb="Customers / Users">
    <Card><div className="flex flex-wrap gap-3 p-4">
      <div className="min-w-[220px] flex-1"><Input label="Search users" placeholder="Search name or email…" value={q} onChange={(e:any)=>{setQ(e.target.value); setPage(1);}} /></div>
      <Select label="Plan" value={plan} onChange={(e:any)=>{setPlan(e.target.value); setPage(1);}}><option value="">All plans</option><option value="free">Free</option><option value="basic">Basic</option><option value="pro">Pro</option></Select>
      <Select label="Status" value={status} onChange={(e:any)=>{setStatus(e.target.value); setPage(1);}}><option value="">All statuses</option><option value="active">Active</option><option value="banned">Banned</option></Select>
      <Btn variant="secondary" onClick={load}>Search</Btn></div>
    {err && <div className="px-4 pb-4"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : err ? null : rows.length === 0 ? <Empty title="No users found" sub="Try a different search or filter." /> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">User</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Usage today</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Joined</th><th className="px-3 py-3" /></tr></thead>
    <tbody>{rows.map((u:any)=><tr key={u.id} className="border-b border-line hover:bg-soft/60"><td className="px-5 py-3"><p className="font-semibold">{u.display_name || u.name || '—'}</p><p className="text-muted">{u.email}</p></td>
      <td className="px-3 py-3"><Badge tone="primary">{u.plan || 'free'}</Badge></td><td className="px-3 py-3">{fmt(u.usage_today?.used ?? u.used_today)} / {fmt(u.usage_today?.limit ?? u.daily_limit)}</td>
      <td className="px-3 py-3">{u.banned ? <Badge tone="danger">Banned</Badge> : <Badge tone="success">Active</Badge>}</td><td className="px-3 py-3 text-muted">{timeAgo(u.created_at)}</td>
      <td className="px-3 py-3 text-right"><a className="font-semibold text-primary" href={`/users/${u.id}`}>Open →</a></td></tr>)}</tbody></table></div>}
    <div className="flex items-center justify-between px-5 py-3 text-sm text-muted"><span>{!loading && !err ? `${fmt(total)} users` : ''}</span><div className="flex gap-2"><Btn variant="secondary" disabled={loading || !!err || page<=1} onClick={()=>setPage(page-1)}>Previous</Btn><Btn variant="secondary" disabled={loading || !!err || rows.length===0} onClick={()=>setPage(page+1)}>Next</Btn></div></div></Card>
  </Shell>;
}
