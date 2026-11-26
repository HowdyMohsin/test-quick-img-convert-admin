'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS } from '@/lib/nav';

export default function Reports() {
  const today = new Date().toISOString().slice(0,10);
  const monthAgo = new Date(Date.now()-29*86400000).toISOString().slice(0,10);
  const [from, setFrom] = React.useState(monthAgo); const [to, setTo] = React.useState(today);
  const [d, setD] = React.useState<any>(null); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true);
  // A missing /admin/reports route (404) means "no data yet", not a red banner:
  // render the empty aggregate so the page shows its empty states.
  const EMPTY_REPORT = { totals: {}, daily: [], revenue_by_provider: [], funnel: {}, top_pairs: [], engine_errors: [] };
  const load = React.useCallback(() => { setLoading(true); get(`/admin/reports?from=${from}&to=${to}`).then(setD).catch((e:any)=>{ if (e?.status === 404) { setD(EMPTY_REPORT); setErr(null); } else setErr(e); }).finally(()=>setLoading(false)); }, [from, to]);
  React.useEffect(load, [load]);
  const exportCsv = () => { const rows = (d?.top_pairs||[]).map((t:any)=>[t.pair||t.pair_slug, t.count??t.conversions]); downloadCsv(`quick-img-convert-report-${from}-to-${to}.csv`, [['pair','conversions'], ...rows]); };
  const series = (d?.daily||d?.series||[]).map((x:any)=>({ label: x.date||x.label, value: x.conversions ?? x.value ?? 0 }));
  return <>
    <Card><div className="flex flex-wrap items-end gap-3 p-4">
      <Input label="From" type="date" value={from} onChange={(e:any)=>setFrom(e.target.value)} />
      <Input label="To" type="date" value={to} onChange={(e:any)=>setTo(e.target.value)} />
      <Btn onClick={load}>Run report</Btn><Btn variant="secondary" onClick={exportCsv}>Export CSV</Btn></div></Card>
    {err && <div className="mt-4"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : d ? <>
    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat label="Conversions" value={fmt(d.totals?.conversions ?? d.conversions)} />
      <Stat label="Success rate" value={pct(d.totals?.success_rate ?? d.success_rate)} />
      <Stat label="Bytes out" value={fmt(d.totals?.bytes_out ?? d.bytes_out)} />
      <Stat label="MRR" value={money(d.totals?.mrr_cents ?? d.mrr_cents)} />
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Conversions per day" /><div className="p-5">{series.length ? <div className="flex items-end gap-1" style={{height:160}}>{series.map((s:any,i:number)=><div key={i} className="flex-1 rounded-t bg-primary/80" style={{height:`${Math.max((s.value/Math.max(...series.map((x:any)=>x.value),1))*140,3)}px`}} title={`${s.label}: ${s.value}`} />)}</div> : <Empty title="No data for this range" sub="Pick a wider date range." />}</div></Card>
      <Card><CardHead title="Revenue by provider and plan" /><div className="divide-y divide-line">{(d.revenue_by_provider||d.revenue||[]).length ? (d.revenue_by_provider||d.revenue).map((r:any,i:number)=><div key={i} className="flex justify-between px-5 py-3 text-sm"><span>{r.provider_key || r.provider} · {r.plan || ''}</span><b>{money(r.amount_cents)}</b></div>) : <Empty title="No revenue in this range" sub="Revenue appears once payments are recorded." />}</div></Card>
      <Card><CardHead title="Funnel — anonymous → free → paid" /><div className="space-y-2 p-5 text-sm">
        <p>Anonymous conversions: <b>{fmt(d.funnel?.anonymous)}</b></p><p>Free accounts: <b>{fmt(d.funnel?.free)}</b></p><p>Paid accounts: <b>{fmt(d.funnel?.paid)}</b></p>
        <p>Anonymous → free: <b>{pct(d.funnel?.anon_to_free_rate)}</b></p><p>Free → paid: <b>{pct(d.funnel?.free_to_paid_rate)}</b></p></div></Card>
      <Card><CardHead title="Top 20 pairs" /><div className="divide-y divide-line">{(d.top_pairs||[]).slice(0,20).map((t:any,i:number)=><div key={i} className="flex justify-between px-5 py-2.5 text-sm"><span>{t.pair || t.pair_slug}</span><span className="text-muted">{fmt(t.count ?? t.conversions)}</span></div>) || <Empty title="No pairs yet" sub="Top pairs appear once conversions are recorded." />}</div></Card>
      <Card className="lg:col-span-2"><CardHead title="Engine errors" /><div className="divide-y divide-line">{(d.engine_errors||[]).length ? d.engine_errors.map((e:any,i:number)=><div key={i} className="px-5 py-3 text-sm"><span className="font-semibold">{e.error_code || e.code}</span> <span className="text-muted">{e.pair_slug || ''} · {fmt(e.count)} times</span></div>) : <Empty title="No engine errors in this range" sub="Engine errors will be listed here." />}</div></Card>
    </div></> : null}
  </>;
}
