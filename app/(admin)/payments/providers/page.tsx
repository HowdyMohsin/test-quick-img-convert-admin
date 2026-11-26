'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

const FLOWS: Record<string,string> = { manual: 'Manual approval', auto: 'Automatic checkout', link: 'Payment link' };
export default function Providers() {
  const [rows, setRows] = React.useState<any[]>([]); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null); const [cfg, setCfg] = React.useState<Record<string,string>>({}); const [check, setCheck] = React.useState('');
  const [keyShow, setKeyShow] = React.useState(false);
  // Show/hide for the API key / secret field only — same toggle pattern as
  // the Add-admin password field. It reveals only the current input text;
  // stored values are write-only and never returned by the API.
  const load = () => { setLoading(true); get('/admin/payments/providers').then((j:any)=>setRows(j.items||j.providers||[])).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const toggle = async (p:any) => { try { await patch(`/admin/payments/providers/${p.key}`, { enabled: !p.enabled }); setMsg(`${p.label} ${!p.enabled?'enabled':'disabled'}.`); load(); } catch(e:any){ setErr(e); } };
  const checkCfg = async (p:any) => { try { const j:any = await post(`/admin/payments/providers/${p.key}/check`, {}); setCheck(j.message || 'Configuration looks complete. No charge was created.'); } catch(e:any){ setErr(e); } };
  const saveCfg = async () => { try { await patch(`/admin/payments/providers/${edit.key}/config`, { config: cfg }); setMsg('Configuration saved (stored encrypted, write-only).'); setEdit(null); setCfg({}); load(); } catch(e:any){ setErr(e); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {check && <p className="mb-3 rounded-[12px] bg-indigo-50 p-3 text-sm text-indigo-800">{check}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No providers configured" sub="Providers are seeded by the backend; enable one after entering its details." /> :
    <div className="grid gap-4 lg:grid-cols-2">{rows.map((p:any)=><Card key={p.key} className="p-5">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{p.label || p.key}</h3><p className="text-sm text-muted">{p.key}</p></div>
      <div className="flex items-center gap-2"><Badge tone={p.flow==='manual'?'warn':p.flow==='auto'?'success':'primary'}>{FLOWS[p.flow] || p.flow}</Badge><Switch checked={!!p.enabled} onChange={()=>toggle(p)} label={`Enable ${p.label}`} /></div></div>
      <p className="mt-3 text-sm">Configuration: {p.configured || p.is_configured ? <Badge tone="success">Configured</Badge> : <Badge tone="muted">Not configured</Badge>} {p.config_masked && <span className="ml-2 font-mono text-xs text-muted">{p.config_masked}</span>}</p>
      <p className="mt-2 text-sm text-muted">What the user sees: {p.flow==='manual' ? 'Payment instructions with a reference form, approved within the stated window.' : p.flow==='auto' ? 'Redirect to a hosted checkout, instant activation.' : 'A payment link opens in a new tab, with the reference form as fallback.'}</p>
      {p.webhook_url && <div className="mt-3"><p className="mb-1 text-xs font-semibold text-muted">Webhook URL</p><CopyField value={p.webhook_url} /></div>}
      <div className="mt-4 flex flex-wrap gap-2"><Btn variant="secondary" onClick={()=>{ setEdit(p); setCfg({}); setKeyShow(false); }}>Edit configuration</Btn><Btn variant="secondary" onClick={()=>checkCfg(p)}>Check configuration</Btn></div>
    </Card>)}</div>}
    <Modal open={!!edit} onClose={()=>setEdit(null)} title={`Configure ${edit?.label || ''}`}>
      <p className="mb-3 text-sm text-muted">Fields are write-only: existing values are shown masked and are never returned by the API.</p>
      <div className="space-y-3">
        <Input label="Account / merchant id" value={cfg.account_id||''} onChange={(e:any)=>setCfg({...cfg,account_id:e.target.value})} placeholder="Stored encrypted" />
        <Input label="API key / secret" type={keyShow ? 'text' : 'password'} autoComplete="off" value={cfg.api_key||''} onChange={(e:any)=>setCfg({...cfg,api_key:e.target.value})} placeholder="Leave blank to keep the current value" action={<button type="button" aria-label={keyShow ? 'Hide API key' : 'Show API key'} title={keyShow ? 'Hide API key' : 'Show API key'} onClick={()=>setKeyShow(!keyShow)} className="rounded-[6px] p-1 text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{keyShow ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
        <Input label="Receiving account / wallet address" value={cfg.account||''} onChange={(e:any)=>setCfg({...cfg,account:e.target.value})} />
        <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setEdit(null)}>Cancel</Btn><Btn onClick={saveCfg}>Save configuration</Btn></div>
      </div>
    </Modal>
  </>;
}
