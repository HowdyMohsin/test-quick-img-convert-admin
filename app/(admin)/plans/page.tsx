'use client';
import React from 'react';
import Shell from '@/components/Shell';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

const LIMIT_FIELDS = ['daily','batch','img_mb','aud_mb','vid_mb','vid_min','parallel'];
export default function Plans() {
  const [rows, setRows] = React.useState<any[]>([]); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null); const [form, setForm] = React.useState<any>({});
  const load = () => { setLoading(true); get('/admin/plans').then((j:any)=>setRows(j.items||j.plans||[])).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const openEdit = (p:any) => { setEdit(p); setForm({ name: p.name, price_cents: p.price_cents, price_yearly_cents: p.price_yearly_cents, limits: { ...(p.limits||{}) }, featured: p.featured||0, active: p.active!==false, provider_price_ids: { ...(p.provider_price_ids||{}) } }); };
  const save = async () => {
    for (const f of LIMIT_FIELDS) { const v = Number(form.limits?.[f]); if (isNaN(v) || v < 0) { setErr({ message: `Limit "${f}" must be 0 or more.` } as any); return; } }
    try { await patch(`/admin/plans/${edit.id}`, form); setMsg('Plan saved — live immediately, no deploy needed.'); setEdit(null); load(); } catch(e:any){ setErr(e); }
  };
  const archive = async (p:any) => { if (!confirm(`Archive "${p.name}"? Existing subscribers keep their plan (grandfathered).`)) return; try { await post(`/admin/plans/${p.id}/archive`, {}); setMsg('Plan archived; existing subscribers are grandfathered.'); load(); } catch(e:any){ setErr(e); } };
  return <Shell title="Plans" breadcrumb="Catalog / Plans and Coupons / Plans">
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No plans yet" sub="Plans are seeded by the backend; they will appear here." /> :
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rows.map((p:any)=><Card key={p.id} className="p-5">
      <div className="flex items-start justify-between"><div><h3 className="text-lg font-bold">{p.name}</h3><p className="text-2xl font-extrabold">{money(p.price_cents)}<span className="text-sm font-normal text-muted">/mo</span></p><p className="text-sm text-muted">{money(p.price_yearly_cents)}/year</p></div>
      {p.archived ? <Badge tone="muted">Archived</Badge> : p.active===false ? <Badge tone="muted">Inactive</Badge> : <Badge tone="success">Active</Badge>}</div>
      <ul className="mt-3 space-y-1 text-sm text-muted">{LIMIT_FIELDS.map(f=><li key={f}>{f.replace('_',' ')}: <b className="text-ink">{fmt(p.limits?.[f])}</b></li>)}
      <li>Ads: <b className="text-ink">{p.limits?.ads ? 'shown' : 'hidden'}</b></li><li>Priority: <b className="text-ink">{p.limits?.priority ? 'yes' : 'no'}</b></li><li>Image editor: <b className="text-ink">{p.limits?.editor ? 'yes' : 'no'}</b></li></ul>
      <div className="mt-4 flex gap-2"><Btn variant="secondary" onClick={()=>openEdit(p)}>Edit</Btn>{!p.archived && <Btn variant="ghost" onClick={()=>archive(p)}>Archive</Btn>}</div>
    </Card>)}</div>}
    <Modal open={!!edit} onClose={()=>setEdit(null)} title={`Edit plan — ${edit?.name || ''}`}>
      <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <Input label="Name" value={form.name||''} onChange={(e:any)=>setForm({...form,name:e.target.value})} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Monthly price (cents)" type="number" min={0} value={form.price_cents??''} onChange={(e:any)=>setForm({...form,price_cents:Number(e.target.value)})} />
          <Input label="Yearly price (cents)" type="number" min={0} value={form.price_yearly_cents??''} onChange={(e:any)=>setForm({...form,price_yearly_cents:Number(e.target.value)})} />
        </div>
        <p className="text-sm font-semibold">Limits (floors: 0 or more)</p>
        <div className="grid grid-cols-2 gap-3">{LIMIT_FIELDS.map(f=><Input key={f} label={f} type="number" min={0} value={form.limits?.[f]??''} onChange={(e:any)=>setForm({...form,limits:{...form.limits,[f]:Number(e.target.value)}})} />)}</div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.priority} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,priority:v}})} label="Priority processing" /> Priority processing</div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={form.limits?.ads!==false} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,ads:v}})} label="Show ads" /> Show ads to this plan</div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.editor} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,editor:v}})} label="Image editor" /> Image editor <span className="text-muted">— allow users on this plan to use the image editor</span></div>
        <Input label="Paddle monthly price id" value={form.provider_price_ids?.paddle_monthly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,paddle_monthly:e.target.value}})} />
        <Input label="Paddle yearly price id" value={form.provider_price_ids?.paddle_yearly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,paddle_yearly:e.target.value}})} />
        <Input label="Lemon Squeezy monthly variant id" value={form.provider_price_ids?.lemonsqueezy_monthly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,lemonsqueezy_monthly:e.target.value}})} />
        <Input label="Lemon Squeezy yearly variant id" value={form.provider_price_ids?.lemonsqueezy_yearly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,lemonsqueezy_yearly:e.target.value}})} />
        <div className="rounded-[12px] border border-line p-4"><p className="text-xs font-semibold uppercase text-muted">Live pricing-card preview</p>
          <p className="mt-2 text-lg font-bold">{form.name}</p><p className="text-2xl font-extrabold">{money(form.price_cents)}/mo</p>
          <p className="text-sm text-muted">{fmt(form.limits?.daily)} conversions/day · {fmt(form.limits?.batch)} per batch · {fmt(form.limits?.img_mb)} MB images</p></div>
        <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save plan</Btn></div>
      </div>
    </Modal>
  </Shell>;
}
