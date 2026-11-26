'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Coupons() {
  const [rows, setRows] = React.useState<any[]>([]); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [form, setForm] = React.useState({ code:'', type:'percent', value:10, max_uses:100, expires_at:'', active:true });
  const [bulk, setBulk] = React.useState({ count: 10, prefix: 'QIC', value: 10 });
  const load = () => { setLoading(true); get('/admin/coupons').then((j:any)=>setRows(j.items||j.coupons||[])).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const create = async (e:any) => { e.preventDefault(); try { await post('/admin/coupons', form); setMsg('Coupon created.'); load(); } catch (er:any){ setErr(er); } };
  const bulkGen = async () => { try { const j:any = await post('/admin/coupons/bulk-generate', bulk); setMsg(`Generated ${j.count ?? bulk.count} coupons.`); load(); } catch(er:any){ setErr(er); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Create coupon" /><form onSubmit={create} className="space-y-3 p-5">
        <Input label="Code" value={form.code} onChange={(e:any)=>setForm({...form,code:e.target.value.toUpperCase()})} required placeholder="WELCOME10" />
        <div className="grid grid-cols-2 gap-3"><Select label="Type" value={form.type} onChange={(e:any)=>setForm({...form,type:e.target.value})}><option value="percent">Percent off</option><option value="fixed">Fixed amount off (cents)</option></Select>
        <Input label="Value" type="number" min={1} value={form.value} onChange={(e:any)=>setForm({...form,value:Number(e.target.value)})} /></div>
        <div className="grid grid-cols-2 gap-3"><Input label="Max uses" type="number" min={1} value={form.max_uses} onChange={(e:any)=>setForm({...form,max_uses:Number(e.target.value)})} />
        <Input label="Expires at" type="date" value={form.expires_at} onChange={(e:any)=>setForm({...form,expires_at:e.target.value})} /></div>
        <Btn type="submit">Create coupon</Btn></form></Card>
      <Card><CardHead title="Bulk generate" sub="Creates a batch of unique codes with the same value." /><div className="space-y-3 p-5">
        <Input label="Prefix" value={bulk.prefix} onChange={(e:any)=>setBulk({...bulk,prefix:e.target.value})} />
        <div className="grid grid-cols-2 gap-3"><Input label="Count" type="number" min={1} max={500} value={bulk.count} onChange={(e:any)=>setBulk({...bulk,count:Number(e.target.value)})} />
        <Input label="Value (% off)" type="number" min={1} max={100} value={bulk.value} onChange={(e:any)=>setBulk({...bulk,value:Number(e.target.value)})} /></div>
        <Btn variant="secondary" onClick={bulkGen}>Generate {bulk.count} coupons</Btn></div></Card>
    </div>
    <Card className="mt-4"><CardHead title="Coupons" sub="Usage is counted server-side on every redemption." />
      {loading ? <Spinner /> : rows.length===0 ? <Empty title="No coupons yet" sub="Create your first coupon above." /> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">Code</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Used</th><th className="px-3 py-3">Expires</th><th className="px-3 py-3">Status</th><th className="px-3 py-3" /></tr></thead>
      <tbody>{rows.map((c:any)=><tr key={c.code} className="border-b border-line"><td className="px-5 py-3 font-mono font-semibold">{c.code}</td><td className="px-3 py-3">{c.type==='percent' ? `${c.value}% off` : money(c.value)}</td><td className="px-3 py-3">{fmt(c.used)} / {fmt(c.max_uses)}</td><td className="px-3 py-3">{fmtDate(c.expires_at)}</td><td className="px-3 py-3"><Badge tone={c.active?'success':'muted'}>{c.active?'Active':'Inactive'}</Badge></td>
      <td className="px-3 py-3 text-right"><Btn variant="ghost" onClick={async()=>{ try { await patch(`/admin/coupons/${c.code}`, { active: !c.active }); load(); } catch(er:any){ setErr(er); } }}>{c.active?'Deactivate':'Activate'}</Btn></td></tr>)}</tbody></table></div>}</Card>
  </>;
}
