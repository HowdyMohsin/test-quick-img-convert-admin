'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS } from '@/lib/nav';

export default function General() {
  const [s, setS] = React.useState<any>({}); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const load = () => { setLoading(true); get('/admin/settings').then((j:any)=>setS(j.settings||j)).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const save = async () => { try { await patch('/admin/settings', s); setMsg('Settings saved.'); } catch(e:any){ setErr(e); } };
  return <Shell title="General settings" breadcrumb="System / Settings / General">
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : <Card><CardHead title="General" sub="Public identity and money settings." /><div className="space-y-3 p-5">
      <Input label="Site name" value={s.site_name||'Quick IMG Convert'} onChange={(e:any)=>setS({...s,site_name:e.target.value})} />
      <div className="grid grid-cols-2 gap-3"><Input label="Site URL" value={s.site_url||''} onChange={(e:any)=>setS({...s,site_url:e.target.value})} placeholder="https://quickimgconvert.example" />
      <Input label="Support email" type="email" value={s.support_email||''} onChange={(e:any)=>setS({...s,support_email:e.target.value})} /></div>
      <div className="grid grid-cols-3 gap-3"><Input label="PKR per USD" type="number" min={0} step="0.01" value={s.pkr_per_usd??''} onChange={(e:any)=>setS({...s,pkr_per_usd:Number(e.target.value)})} />
      <Input label="Quota timezone" value={s.quota_timezone||'Asia/Karachi'} onChange={(e:any)=>setS({...s,quota_timezone:e.target.value})} />
      <Input label="Approval window (hours)" type="number" min={1} value={s.approval_window_hours??24} onChange={(e:any)=>setS({...s,approval_window_hours:Number(e.target.value)})} /></div>
      <Input label="Approval window text (shown on pricing)" value={s.approval_window_text||'Approved within 24 hours'} onChange={(e:any)=>setS({...s,approval_window_text:e.target.value})} />
      <div className="flex items-center gap-2 rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-sm"><Switch checked={!!s.maintenance_mode} onChange={(v:boolean)=>setS({...s,maintenance_mode:v})} label="Maintenance mode" />
        <span><b>Maintenance mode.</b> The public site shows a maintenance page; the admin panel and webhooks stay reachable.</span></div>
      <Btn onClick={save}>Save settings</Btn></div></Card>}
  </Shell>;
}
