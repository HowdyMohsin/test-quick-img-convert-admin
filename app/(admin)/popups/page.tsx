'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Popups() {
  const [rows, setRows] = React.useState<any[]>([]); const [anns, setAnns] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null); const [form, setForm] = React.useState<any>({});
  const [ann, setAnn] = React.useState({ text:'', starts_at:'', ends_at:'', enabled:true });
  const [view, setView] = React.useState<'desktop'|'mobile'>('desktop');
  const load = () => { setLoading(true); Promise.all([get('/admin/popups').then((j:any)=>setRows(j.items||j.popups||[])), get('/admin/announcements').then((j:any)=>setAnns(j.items||j.announcements||[])).catch(()=>{})]).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const save = async () => { try { await patch(`/admin/popups/${edit.key}`, form); setMsg('Popup saved.'); setEdit(null); load(); } catch(e:any){ setErr(e); } };
  const saveAnn = async (e:any) => { e.preventDefault(); try { await post('/admin/announcements', ann); setMsg('Announcement scheduled.'); setAnn({ text:'', starts_at:'', ends_at:'', enabled:true }); load(); } catch(er:any){ setErr(er); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Popups" sub="One editor per popup; frequency and pages are enforced by the web app." />
        <div className="divide-y divide-line">{rows.length ? rows.map((p:any)=><div key={p.key} className="flex items-center gap-3 px-5 py-3 text-sm">
          <div className="min-w-0 flex-1"><p className="font-semibold">{p.title || p.key}</p><p className="truncate text-muted">{p.body || ''}</p></div>
          <Switch checked={!!p.enabled} onChange={async()=>{ try { await patch(`/admin/popups/${p.key}`, { enabled: !p.enabled }); load(); } catch(er:any){ setErr(er); } }} label={`Toggle ${p.key}`} />
          <Btn variant="secondary" onClick={()=>{ setEdit(p); setForm({ title:p.title, body:p.body, cta_text:p.cta_text, cta_href:p.cta_href, frequency:p.frequency, pages:p.pages }); }}>Edit</Btn>
        </div>) : <Empty title="No popups yet" sub="Popups are seeded by the backend." />}</div></Card>
      <div className="space-y-4">
        <Card><CardHead title="Announcement scheduler" /><form onSubmit={saveAnn} className="space-y-3 p-5">
          <Textarea label="Announcement text" rows={2} value={ann.text} onChange={(e:any)=>setAnn({...ann,text:e.target.value})} required />
          <div className="grid grid-cols-2 gap-3"><Input label="Starts at" type="datetime-local" value={ann.starts_at} onChange={(e:any)=>setAnn({...ann,starts_at:e.target.value})} />
          <Input label="Ends at" type="datetime-local" value={ann.ends_at} onChange={(e:any)=>setAnn({...ann,ends_at:e.target.value})} /></div>
          <Btn type="submit">Schedule announcement</Btn>
          {anns.map((a:any,i:number)=><p key={i} className="rounded-[12px] bg-soft p-3 text-sm">{a.text} <span className="text-muted">· {fmtDate(a.starts_at)} → {fmtDate(a.ends_at)}</span></p>)}
        </form></Card>
        <Card><CardHead title="Preview" action={<div className="flex gap-1"><button onClick={()=>setView('desktop')} className={`rounded-full px-3 py-1 text-xs font-semibold ${view==='desktop'?'bg-primary text-white':'bg-soft'}`}>Desktop</button><button onClick={()=>setView('mobile')} className={`rounded-full px-3 py-1 text-xs font-semibold ${view==='mobile'?'bg-primary text-white':'bg-soft'}`}>Mobile</button></div>} />
          <div className={`p-5 ${view==='mobile'?'mx-auto max-w-[320px]':''}`}><div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
            <p className="font-bold">{edit?.title || rows[0]?.title || 'Popup title'}</p><p className="mt-1 text-sm text-muted">{edit?.body || rows[0]?.body || 'Popup body copy.'}</p>
            <span className="mt-3 inline-block rounded-[12px] bg-primary px-4 py-2 text-sm font-semibold text-white">{edit?.cta_text || rows[0]?.cta_text || 'Learn more'}</span>
          </div></div></Card>
      </div>
    </div>}
    <Modal open={!!edit} onClose={()=>setEdit(null)} title={`Edit popup — ${edit?.key || ''}`}>
      <div className="space-y-3">
        <Input label="Title" value={form.title||''} onChange={(e:any)=>setForm({...form,title:e.target.value})} />
        <Textarea label="Body" rows={3} value={form.body||''} onChange={(e:any)=>setForm({...form,body:e.target.value})} />
        <div className="grid grid-cols-2 gap-3"><Input label="CTA text" value={form.cta_text||''} onChange={(e:any)=>setForm({...form,cta_text:e.target.value})} />
        <Input label="CTA link" value={form.cta_href||''} onChange={(e:any)=>setForm({...form,cta_href:e.target.value})} /></div>
        <Input label="Frequency" value={form.frequency||''} onChange={(e:any)=>setForm({...form,frequency:e.target.value})} placeholder="once_per_session" />
        <Input label="Pages (comma separated)" value={Array.isArray(form.pages)?form.pages.join(','):form.pages||''} onChange={(e:any)=>setForm({...form,pages:e.target.value.split(',').map((x:string)=>x.trim()).filter(Boolean)})} />
        <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save popup</Btn></div>
      </div>
    </Modal>
  </>;
}
