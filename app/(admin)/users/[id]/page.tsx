'use client';
import React from 'react';
import { PageTitleContext } from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function UserDetail({ params }: { params: { id: string } }) {
  const [u, setU] = React.useState<any>(null); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('overview'); const [banOpen, setBanOpen] = React.useState(false); const [banReason, setBanReason] = React.useState('');
  const [planOpen, setPlanOpen] = React.useState(false); const [newPlan, setNewPlan] = React.useState('basic'); const [planReason, setPlanReason] = React.useState(''); const [compDays, setCompDays] = React.useState(0);
  const [note, setNote] = React.useState(''); const [msg, setMsg] = React.useState('');
  const load = () => { setLoading(true); get(`/admin/users/${params.id}`).then((j:any)=>setU(j.user||j)).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const { setPageTitle } = React.useContext(PageTitleContext);
  const lastTitle = React.useRef('');
  React.useEffect(() => {
    if (!u) return;
    const title = u.display_name || u.email || 'User';
    if (lastTitle.current === title) return;
    lastTitle.current = title;
    setPageTitle(title, 'Customers / Users / Detail');
  }, [u, setPageTitle]);
  const act = async (fn: () => Promise<any>, ok: string) => { try { await fn(); setMsg(ok); load(); } catch (e:any) { setErr(e); } };
  if (loading && !u) return <Spinner />;
  if (err && !u) return <Err error={err} onRetry={load} />;
  const sub = u.subscription || {}; const usage = u.usage || {};
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} /></div>}
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-lg font-bold">{u.display_name || '—'}</p><p className="text-muted">{u.email} {u.email_verified_at ? <Badge tone="success">Verified</Badge> : <Badge tone="warn">Unverified</Badge>}</p>
      <p className="mt-1 text-sm text-muted">Member since {fmtDate(u.created_at)} · Last seen {timeAgo(u.last_seen_at || u.last_login_at)}</p></div>
      <div className="flex gap-2">{u.banned ? <Btn variant="success" onClick={()=>act(()=>post(`/admin/users/${u.id}/unban`,{}),'User unbanned.')}>Unban</Btn> : <Btn variant="danger" onClick={()=>setBanOpen(true)}>Ban user</Btn>}
      <Btn variant="secondary" onClick={()=>act(()=>post(`/admin/users/${u.id}/force-signout`,{}),'All sessions signed out.')}>Force sign-out</Btn></div></div>
    {u.banned && <p className="mt-3 rounded-[12px] bg-red-50 p-3 text-sm text-red-800">Banned: {u.ban_reason || 'No reason recorded.'}</p>}
    <div className="mt-4"><Tabs tabs={[{id:'overview',label:'Overview'},{id:'subscription',label:'Subscription'},{id:'payments',label:'Payments'},{id:'jobs',label:'Jobs'},{id:'notes',label:'Notes'}]} active={tab} onChange={setTab} /></div>
    {tab==='overview' && <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Usage" sub="Conversions against the plan limit" /><div className="space-y-2 p-5 text-sm"><p>Today: <b>{fmt(usage.today?.used ?? usage.used_today)} / {fmt(usage.today?.limit ?? usage.daily_limit)}</b></p><p>This month: <b>{fmt(usage.month?.used ?? usage.used_month)}</b></p><p>Plan: <Badge tone="primary">{u.plan || 'free'}</Badge></p></div></Card>
      <Card><CardHead title="Profile" /><div className="space-y-2 p-5 text-sm"><p>Name: {u.display_name || '—'}</p><p>Email: {u.email}</p><p>Status: {u.banned ? 'Banned' : 'Active'}</p><p>Created: {fmtDate(u.created_at)}</p></div></Card></div>}
    {tab==='subscription' && <Card className="mt-4"><CardHead title="Subscription" action={<Btn onClick={()=>setPlanOpen(true)}>Change plan</Btn>} />
      <div className="space-y-2 p-5 text-sm"><p>Plan: <b>{sub.plan || u.plan || 'free'}</b> · Status: <Badge tone={sub.status==='active'?'success':'soft'}>{sub.status || 'none'}</Badge></p>
      <p>Provider: {sub.provider_key || '—'} · Period ends: {fmtDate(sub.current_period_end)}</p><p>Interval: {sub.interval || '—'}</p>
      <div className="flex gap-2 pt-2"><Btn variant="secondary" onClick={()=>act(()=>post(`/admin/users/${u.id}/subscription/extend`,{days:30}),'Manual period extended by 30 days.')}>Extend 30 days</Btn>
      <Btn variant="danger" onClick={()=>act(()=>post(`/admin/users/${u.id}/subscription/cancel`,{}),'Subscription cancelled at period end.')}>Cancel subscription</Btn></div></div></Card>}
    {tab==='payments' && <Card className="mt-4"><CardHead title="Payment requests & payments" />
      <div className="divide-y divide-line">{(u.payment_requests||u.payments||[]).length ? (u.payment_requests||u.payments).map((p:any,i:number)=><div key={i} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"><span className="font-semibold">{p.reference || p.id}</span><Badge tone={p.status==='approved'?'success':p.status==='pending'?'warn':'soft'}>{p.status}</Badge><span className="text-muted">{money(p.amount_cents)} · {p.provider_key}</span>
        {p.status==='pending' && <span className="ml-auto flex gap-2"><Btn variant="success" onClick={()=>act(()=>post(`/admin/payments/requests/${p.id}/approve`,{}),'Request approved — plan upgraded.')}>Approve</Btn><Btn variant="danger" onClick={()=>act(()=>post(`/admin/payments/requests/${p.id}/reject`,{reason:'Rejected by admin'}),'Request rejected.')}>Reject</Btn></span>}</div>) : <Empty title="No payments yet" sub="Payment requests and receipts for this user will appear here." />}</div></Card>}
    {tab==='jobs' && <Card className="mt-4"><CardHead title="Jobs" /><div className="divide-y divide-line">{(u.jobs||[]).length ? u.jobs.map((j:any,i:number)=><div key={i} className="flex justify-between px-5 py-3 text-sm"><span>{j.pair_slug}</span><Badge tone={j.status==='done'?'success':j.status==='failed'?'danger':'soft'}>{j.status}</Badge></div>) : <Empty title="No jobs yet" sub="This user's conversions will appear here." />}</div></Card>}
    {tab==='notes' && <Card className="mt-4"><CardHead title="Internal notes" sub="Only admins see these notes." /><div className="space-y-3 p-5">
      {(u.notes||[]).map((n:any,i:number)=><p key={i} className="rounded-[12px] bg-soft p-3 text-sm">{n.body || n.text} <span className="text-muted">— {n.author || 'admin'}, {timeAgo(n.created_at)}</span></p>)}
      <Textarea label="Add a note" rows={3} value={note} onChange={(e:any)=>setNote(e.target.value)} />
      <Btn onClick={()=>act(()=>post(`/admin/users/${u.id}/notes`,{body:note}),'Note saved.')} disabled={!note.trim()}>Save note</Btn></div></Card>}
    <Modal open={banOpen} onClose={()=>setBanOpen(false)} title="Ban user">
      <p className="mb-3 text-sm text-muted">A reason is mandatory. Banning revokes all sessions immediately.</p>
      <Textarea label="Ban reason (required)" rows={3} value={banReason} onChange={(e:any)=>setBanReason(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setBanOpen(false)}>Cancel</Btn><Btn variant="danger" disabled={!banReason.trim()} onClick={async()=>{ await act(()=>post(`/admin/users/${u.id}/ban`,{reason:banReason}),'User banned.'); setBanOpen(false); }}>Ban user</Btn></div>
    </Modal>
    <Modal open={planOpen} onClose={()=>setPlanOpen(false)} title="Change plan">
      <div className="space-y-3"><Select label="New plan" value={newPlan} onChange={(e:any)=>setNewPlan(e.target.value)}><option value="free">Free</option><option value="basic">Basic</option><option value="pro">Pro</option></Select>
      <Input label="Complimentary days" type="number" min={0} value={compDays} onChange={(e:any)=>setCompDays(Number(e.target.value))} />
      <Textarea label="Reason (required)" rows={3} value={planReason} onChange={(e:any)=>setPlanReason(e.target.value)} />
      <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setPlanOpen(false)}>Cancel</Btn><Btn disabled={!planReason.trim()} onClick={async()=>{ await act(()=>post(`/admin/users/${u.id}/subscription/change-plan`,{plan:newPlan,reason:planReason,complimentary_days:compDays}),'Plan changed.'); setPlanOpen(false); }}>Change plan</Btn></div></div>
    </Modal>
  </>;
}
