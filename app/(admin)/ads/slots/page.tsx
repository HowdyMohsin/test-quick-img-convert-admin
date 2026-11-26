'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

const PLACEMENTS = ['home_top','home_mid','home_bottom','pair_top','pair_mid','pair_bottom','mobile_anchor'];
const BANNED_NOTE = 'Hard-banned placements (inside the converter tool, between file selection and download completion, on /account, on the pricing checkout modal and on any payment step) are not offered here.';
export default function Slots() {
  const [rows, setRows] = React.useState<any[]>([]); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [form, setForm] = React.useState({ key:'', label:'', placement:'home_top', size:'728x90', device:'all', freq_cap:3, network:'adsense', unit_id:'', code:'' });
  const [preview, setPreview] = React.useState<any>(null);
  const load = () => { setLoading(true); get('/admin/ads/slots').then((j:any)=>setRows(j.items||j.slots||[])).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const create = async (e:any) => { e.preventDefault(); try { await post('/admin/ads/slots', form); setMsg('Slot created.'); setForm({ key:'', label:'', placement:'home_top', size:'728x90', device:'all', freq_cap:3, network:'adsense', unit_id:'', code:'' }); load(); } catch(er:any){ setErr(er); } };
  const move = async (s:any, dir:number) => { try { await post(`/admin/ads/slots/${s.key}/reorder`, { direction: dir }); load(); } catch(er:any){ setErr(er); } };
  return <Shell title="Ad slots" breadcrumb="Monetization / Ads / Slots">
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Create slot" sub={BANNED_NOTE} /><form onSubmit={create} className="space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3"><Input label="Key" value={form.key} onChange={(e:any)=>setForm({...form,key:e.target.value})} required placeholder="home_top_2" />
        <Input label="Label" value={form.label} onChange={(e:any)=>setForm({...form,label:e.target.value})} required placeholder="Home top" /></div>
        <div className="grid grid-cols-2 gap-3"><Select label="Placement" value={form.placement} onChange={(e:any)=>setForm({...form,placement:e.target.value})}>{PLACEMENTS.map(p=><option key={p} value={p}>{p}</option>)}</Select>
        <Select label="Device" value={form.device} onChange={(e:any)=>setForm({...form,device:e.target.value})}><option value="all">All</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option></Select></div>
        <div className="grid grid-cols-2 gap-3"><Input label="Size" value={form.size} onChange={(e:any)=>setForm({...form,size:e.target.value})} placeholder="728x90" />
        <Input label="Frequency cap (per session)" type="number" min={0} value={form.freq_cap} onChange={(e:any)=>setForm({...form,freq_cap:Number(e.target.value)})} /></div>
        <div className="grid grid-cols-2 gap-3"><Select label="Network" value={form.network} onChange={(e:any)=>setForm({...form,network:e.target.value})}><option value="adsense">AdSense</option><option value="adsterra">Adsterra</option><option value="house">House ad</option></Select>
        <Input label="Unit id" value={form.unit_id} onChange={(e:any)=>setForm({...form,unit_id:e.target.value})} /></div>
        <Textarea label="Custom HTML (optional, overrides unit id)" rows={3} value={form.code} onChange={(e:any)=>setForm({...form,code:e.target.value})} />
        <Btn type="submit">Create slot</Btn></form></Card>
      <Card><CardHead title="Slots" sub="Ads show only to anonymous and free-plan users." />
        {loading ? <Spinner /> : rows.length===0 ? <Empty title="No slots yet" sub="Default slots are seeded by the backend." /> :
        <div className="divide-y divide-line">{rows.map((s:any)=><div key={s.key} className="flex items-center gap-3 px-5 py-3 text-sm">
          <div className="min-w-0 flex-1"><p className="font-semibold">{s.label || s.key}</p><p className="text-muted">{s.placement} · {s.size} · {s.device} · {s.network}</p></div>
          <Switch checked={!!s.enabled} onChange={async()=>{ try { await patch(`/admin/ads/slots/${s.key}`, { enabled: !s.enabled }); load(); } catch(er:any){ setErr(er); } }} label={`Toggle ${s.key}`} />
          <Btn variant="ghost" onClick={()=>setPreview(s)}>Preview</Btn>
          <Btn variant="ghost" onClick={()=>move(s,-1)} aria-label="Move up">↑</Btn><Btn variant="ghost" onClick={()=>move(s,1)} aria-label="Move down">↓</Btn>
        </div>)}</div>}</Card>
    </div>
    <Modal open={!!preview} onClose={()=>setPreview(null)} title={`Preview — ${preview?.label || ''}`}>
      <p className="mb-2 text-sm text-muted">Sandboxed preview; scripts in custom HTML cannot reach the admin.</p>
      <iframe title="Ad preview" sandbox="allow-scripts" className="h-40 w-full rounded-[12px] border border-line bg-soft" srcDoc={preview?.code || `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#64748B">Ad unit ${preview?.unit_id || preview?.key} · ${preview?.size}</div>`} />
    </Modal>
  </Shell>;
}
