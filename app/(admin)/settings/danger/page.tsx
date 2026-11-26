'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS } from '@/lib/nav';

export default function Danger() {
  const [err, setErr] = React.useState<any>(null); const [msg, setMsg] = React.useState(''); const [confirm, setConfirm] = React.useState('');
  const purge = async () => { if (confirm !== 'PURGE') { setErr({ message: 'Type PURGE to confirm.' } as any); return; } try { await post('/admin/settings/purge', { confirm: 'PURGE' }); setMsg('Purge started — expired uploads, outputs and old events are being removed.'); setConfirm(''); } catch(e:any){ setErr(e); } };
  const exportAll = async () => { try { const j:any = await get('/admin/settings/export'); const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quick-img-convert-full-export.json'; a.click(); setMsg('Full data export downloaded.'); } catch(e:any){ setErr(e); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} /></div>}
    <Card className="border-red-200"><CardHead title="Danger zone" sub="These actions cannot be undone." />
      <div className="space-y-4 p-5">
        <div className="rounded-[12px] border border-line p-4"><h3 className="font-bold">Full data export</h3><p className="mt-1 text-sm text-muted">Downloads users, subscriptions, payments, jobs and settings as JSON for backup or migration.</p><Btn variant="secondary" onClick={exportAll} className="mt-3">Download full export</Btn></div>
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-4"><h3 className="font-bold text-danger">Purge expired data</h3><p className="mt-1 text-sm text-red-700">Deletes expired uploads, outputs and old events now, instead of waiting for the hourly purge.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Input label="" placeholder="Type PURGE to confirm" value={confirm} onChange={(e:any)=>setConfirm(e.target.value)} /><Btn variant="danger" onClick={purge}>Purge now</Btn></div></div>
      </div></Card>
  </>;
}
