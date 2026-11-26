'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS } from '@/lib/nav';

export default function Legal() {
  const [s, setS] = React.useState<any>({}); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const load = () => { setLoading(true); get('/admin/settings').then((j:any)=>setS(j.settings||j)).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const save = async () => { try { await patch('/admin/settings', { privacy_policy: s.privacy_policy, terms: s.terms, owner_name: s.owner_name, contact_email: s.contact_email, address: s.address, governing_law: s.governing_law }); setMsg('Legal pages saved.'); } catch(e:any){ setErr(e); } };
  return <Shell title="Legal pages" breadcrumb="System / Settings / Legal pages">
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    <p className="mb-3 rounded-[12px] bg-amber-50 p-3 text-sm text-amber-800">Have these texts reviewed by a qualified lawyer before going live.</p>
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : <div className="space-y-4">
      <Card><CardHead title="Identity" /><div className="grid gap-3 p-5 sm:grid-cols-2">
        <Input label="Owner / company name" value={s.owner_name||''} onChange={(e:any)=>setS({...s,owner_name:e.target.value})} />
        <Input label="Contact email" type="email" value={s.contact_email||''} onChange={(e:any)=>setS({...s,contact_email:e.target.value})} />
        <Input label="Address" value={s.address||''} onChange={(e:any)=>setS({...s,address:e.target.value})} />
        <Input label="Governing law" value={s.governing_law||''} onChange={(e:any)=>setS({...s,governing_law:e.target.value})} />
      </div></Card>
      <Card><CardHead title="Privacy policy" sub="Markdown. Must cover 24-hour file deletion, logging, cookies, ad partners and consent, payment processors, data export and deletion, children, and contact details." />
        <div className="p-5"><Textarea label="" rows={12} value={s.privacy_policy||''} onChange={(e:any)=>setS({...s,privacy_policy:e.target.value})} /></div></Card>
      <Card><CardHead title="Terms" sub="Markdown." /><div className="p-5"><Textarea label="" rows={12} value={s.terms||''} onChange={(e:any)=>setS({...s,terms:e.target.value})} /></div></Card>
      <Btn onClick={save}>Save legal pages</Btn></div>}
  </Shell>;
}
