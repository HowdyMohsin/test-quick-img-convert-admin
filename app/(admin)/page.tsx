'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Dashboard() {
  const [d, setD] = React.useState<any>(null); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true);
  const load = () => { setLoading(true); setErr(null); get('/admin/dashboard').then(setD).catch(setErr).finally(() => setLoading(false)); };
  React.useEffect(load, []);
  const k = d?.kpis || d || {};
  const series = (d?.series_30d || d?.charts?.conversions_30d || []).map((x: any) => ({ label: x.date || x.label, value: x.conversions ?? x.value ?? 0 }));
  const top = d?.top_pairs || d?.topPairs || [];
  const errors = d?.recent_errors || d?.recentErrors || [];
  const disabled = d?.disabled_pairs || d?.disabledPairs || [];
  return <>
    {err && <Err error={err} onRetry={load} />}
    {loading && !d ? <Spinner /> : <>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Stat label="Users" value={fmt(k.users ?? k.total_users)} sub={k.new_users_30d ? `${fmt(k.new_users_30d)} new in 30 days` : undefined} />
      <Stat label="Conversions today" value={fmt(k.conversions_today ?? k.conversionsToday)} />
      <Stat label="Success rate" value={pct(k.success_rate ?? k.successRate)} />
      <Stat label="Active subscriptions" value={fmt(k.active_subscriptions ?? k.activeSubscriptions)} />
      <Stat label="MRR" value={money(k.mrr_cents ?? k.mrrCents)} sub="Monthly recurring revenue" />
      <Stat label="Pending approvals" value={fmt(k.pending_approvals ?? k.pendingApprovals)} tone="danger" sub="Payment requests awaiting approval" />
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Conversions — last 30 days" sub="Successful and failed conversions per day" />
        <div className="p-5">{series.length ? <div className="flex items-end gap-1" style={{height:160}}>{series.map((s:any,i:number)=><div key={i} className="flex-1 rounded-t bg-primary/80" style={{height:`${Math.max((s.value/Math.max(...series.map((x:any)=>x.value),1))*140,3)}px`}} title={`${s.label}: ${s.value}`} />)}</div> : <Empty title="No chart data yet" sub="Charts appear once conversions are recorded." />}</div></Card>
      <Card><CardHead title="Top conversion pairs" sub="Most used pairs in the last 30 days" />
        <div className="divide-y divide-line">{top.length ? top.map((t:any,i:number)=><div key={i} className="flex items-center justify-between px-5 py-3 text-sm"><span className="font-semibold">{t.pair || t.pair_slug || t.from + ' → ' + t.to}</span><span className="text-muted">{fmt(t.count ?? t.conversions)} conversions</span></div>) : <Empty title="No pairs yet" sub="Top pairs appear once conversions are recorded." />}</div></Card>
    </div>
    {disabled.length > 0 && <Card className="mt-4 border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-800">Disabled pairs</p>{disabled.map((x:any,i:number)=><p key={i} className="text-sm text-amber-700">{x.pair_slug || x.pair}: {x.last_error || 'disabled'}</p>)}</Card>}
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Recent errors" sub="Latest engine and conversion errors" />
        <div className="divide-y divide-line">{errors.length ? errors.slice(0,8).map((e:any,i:number)=><div key={i} className="px-5 py-3 text-sm"><span className="font-semibold">{e.error_code || e.code || 'error'}</span> <span className="text-muted">{e.message || e.pair_slug || ''} · {timeAgo(e.ts || e.created_at)}</span></div>) : <Empty title="No recent errors" sub="Errors from the conversion pipeline will appear here." />}</div></Card>
      <Card><CardHead title="Quick links" /><div className="flex flex-wrap gap-2 p-5">
        <a className="rounded-[12px] bg-primary px-4 py-2.5 text-sm font-semibold text-white" href="/payments/requests">Review payment requests</a>
        <a className="rounded-[12px] bg-soft px-4 py-2.5 text-sm font-semibold" href="/users">Users</a>
        <a className="rounded-[12px] bg-soft px-4 py-2.5 text-sm font-semibold" href="/formats">Formats</a>
        <a className="rounded-[12px] bg-soft px-4 py-2.5 text-sm font-semibold" href="/jobs">Jobs</a>
        <a className="rounded-[12px] bg-soft px-4 py-2.5 text-sm font-semibold" href="/reports">Reports</a>
      </div></Card>
    </div></>}
  </>;
}
