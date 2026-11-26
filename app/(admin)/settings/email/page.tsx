'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS } from '@/lib/nav';

const TEMPLATES = ['welcome','verify_email','reset_password','password_changed','email_change_notice','payment_submitted','payment_approved','payment_rejected','past_due','subscription_ended'];
export default function EmailSettings() {
  const [s, setS] = React.useState<any>({}); const [tpls, setTpls] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [sel, setSel] = React.useState('welcome'); const [form, setForm] = React.useState({ subject:'', body:'' });
  const load = () => { setLoading(true); Promise.all([get('/admin/settings').then((j:any)=>setS(j.settings||j)), get('/admin/settings/email-templates').then((j:any)=>setTpls(j.items||j.templates||[])).catch(()=>{})]).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  React.useEffect(()=>{ const t = tpls.find((x:any)=>x.key===sel); if (t) setForm({ subject: t.subject||'', body: t.body||'' }); }, [sel, tpls]);
  const saveSmtp = async () => { try { await patch('/admin/settings', { smtp_host: s.smtp_host, smtp_port: s.smtp_port, smtp_user: s.smtp_user, smtp_from: s.smtp_from }); setMsg('SMTP settings saved.'); } catch(e:any){ setErr(e); } };
  const smtpCheck = async () => { try { const j:any = await post('/admin/settings/smtp-check', {}); setMsg(j.message || 'A check message was sent to your own admin address.'); } catch(e:any){ setErr(e); } };
  const saveTpl = async () => { try { await patch(`/admin/settings/email-templates/${sel}`, form); setMsg(`Template "${sel}" saved.`); load(); } catch(e:any){ setErr(e); } };
  return <Shell title="Email and templates" breadcrumb="System / Settings / Email and templates">
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="SMTP" sub="Transactional email for verification, resets, receipts and grace notices." /><div className="space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3"><Input label="SMTP host" value={s.smtp_host||''} onChange={(e:any)=>setS({...s,smtp_host:e.target.value})} />
        <Input label="SMTP port" type="number" value={s.smtp_port||587} onChange={(e:any)=>setS({...s,smtp_port:Number(e.target.value)})} /></div>
        <Input label="SMTP user" value={s.smtp_user||''} onChange={(e:any)=>setS({...s,smtp_user:e.target.value})} />
        <Input label="From address" type="email" value={s.smtp_from||''} onChange={(e:any)=>setS({...s,smtp_from:e.target.value})} />
        <div className="flex gap-2"><Btn onClick={saveSmtp}>Save SMTP</Btn><Btn variant="secondary" onClick={smtpCheck}>Send SMTP check email</Btn></div>
        <p className="text-xs text-muted">The check sends a real message to your own admin address.</p></div></Card>
      <Card><CardHead title="Message editor" sub="Placeholders: {name} {plan} {reference} {amount} {reason} {date} {link}" />
        <div className="space-y-3 p-5">
          <Select label="Template" value={sel} onChange={(e:any)=>setSel(e.target.value)}>{TEMPLATES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}</Select>
          <Input label="Subject" value={form.subject} onChange={(e:any)=>setForm({...form,subject:e.target.value})} />
          <Textarea label="Body" rows={10} value={form.body} onChange={(e:any)=>setForm({...form,body:e.target.value})} />
          <p className="text-xs text-muted">Available placeholders: {'{name} {plan} {reference} {amount} {reason} {date} {link}'}</p>
          <Btn onClick={saveTpl}>Save template</Btn></div></Card>
    </div>}
  </Shell>;
}
