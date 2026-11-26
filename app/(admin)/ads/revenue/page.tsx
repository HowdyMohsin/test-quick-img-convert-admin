'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Revenue() {
  const [rows, setRows] = React.useState<any[]>([]); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [entry, setEntry] = React.useState({ day: new Date().toISOString().slice(0,10), network:'adsense', amount_cents:0 });
  const load = () => { setLoading(true); get('/admin/ads/revenue').then((j:any)=>setRows(j.items||j.revenue||j.rpm||[])).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const add = async (e:any) => { e.preventDefault(); try { await post('/admin/ads/revenue', entry); setMsg('Revenue entry saved.'); load(); } catch(er:any){ setErr(er); } };
  const importCsv = async (e:any) => { const f = e.target.files?.[0]; if (!f) return; const text = await f.text(); try { await post('/admin/ads/revenue/import', { csv: text }); setMsg('CSV imported.'); load(); } catch(er:any){ setErr(er); } };
  return <Shell title="Revenue and RPM" breadcrumb="Monetization / Ads / Revenue and RPM">
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Daily revenue entry" /><form onSubmit={add} className="space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3"><Input label="Day" type="date" value={entry.day} onChange={(e:any)=>setEntry({...entry,day:e.target.value})} />
        <Select label="Network" value={entry.network} onChange={(e:any)=>setEntry({...entry,network:e.target.value})}><option value="adsense">AdSense</option><option value="adsterra">Adsterra</option></Select></div>
        <Input label="Amount (cents)" type="number" min={0} value={entry.amount_cents} onChange={(e:any)=>setEntry({...entry,amount_cents:Number(e.target.value)})} />
        <Btn type="submit">Save entry</Btn></form></Card>
      <Card><CardHead title="CSV import" sub="Columns: day, network, amount_cents" /><div className="p-5">
        <input type="file" accept=".csv" aria-label="Import revenue CSV" onChange={importCsv} className="text-sm" />
        <p className="mt-2 text-sm text-muted">RPM is computed from ad_events (impressions) joined to this revenue.</p></div></Card>
    </div>
    <Card className="mt-4"><CardHead title="RPM by slot, plan and device" />
      {loading ? <Spinner /> : rows.length===0 ? <Empty title="No revenue data yet" sub="Add a daily entry or import a CSV to see RPM." /> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">Slot</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Device</th><th className="px-3 py-3">Impressions</th><th className="px-3 py-3">Revenue</th><th className="px-3 py-3">RPM</th></tr></thead>
      <tbody>{rows.map((r:any,i:number)=><tr key={i} className="border-b border-line"><td className="px-5 py-3">{r.slot||r.day||'—'}</td><td className="px-3 py-3">{r.plan||'—'}</td><td className="px-3 py-3">{r.device||'—'}</td><td className="px-3 py-3">{fmt(r.impressions)}</td><td className="px-3 py-3">{money(r.amount_cents ?? r.revenue_cents)}</td><td className="px-3 py-3">{money(r.rpm_cents)}</td></tr>)}</tbody></table></div>}</Card>
  </Shell>;
}
