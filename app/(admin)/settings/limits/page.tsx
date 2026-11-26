'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS } from '@/lib/nav';

export default function Limits() {
  const [s, setS] = React.useState<any>({}); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const load = () => { setLoading(true); get('/admin/settings').then((j:any)=>setS(j.settings||j)).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const save = async () => { try { await patch('/admin/settings', { retention_hours: s.retention_hours, upload_rate_per_min: s.upload_rate_per_min, convert_rate_per_min: s.convert_rate_per_min, max_batch: s.max_batch, max_file_mb: s.max_file_mb }); setMsg('Limits saved.'); } catch(e:any){ setErr(e); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : <Card><CardHead title="Limits and retention" /><div className="space-y-3 p-5">
      <div className="grid grid-cols-2 gap-3"><Input label="Retention (hours)" type="number" min={1} value={s.retention_hours??24} onChange={(e:any)=>setS({...s,retention_hours:Number(e.target.value)})} />
      <Input label="Upload rate (per minute)" type="number" min={1} value={s.upload_rate_per_min??60} onChange={(e:any)=>setS({...s,upload_rate_per_min:Number(e.target.value)})} /></div>
      <div className="grid grid-cols-2 gap-3"><Input label="Convert rate (per minute)" type="number" min={1} value={s.convert_rate_per_min??120} onChange={(e:any)=>setS({...s,convert_rate_per_min:Number(e.target.value)})} />
      <Input label="Max batch size" type="number" min={1} value={s.max_batch??100} onChange={(e:any)=>setS({...s,max_batch:Number(e.target.value)})} /></div>
      <Input label="Max file size (MB)" type="number" min={1} value={s.max_file_mb??2048} onChange={(e:any)=>setS({...s,max_file_mb:Number(e.target.value)})} />
      <p className="text-sm text-muted">Uploads and outputs are auto-deleted after the retention period; files are stored with restrictive permissions.</p>
      <Btn onClick={save}>Save limits</Btn></div></Card>}
  </>;
}
