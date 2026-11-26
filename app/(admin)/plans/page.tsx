'use client';
import React from 'react';
import { get, post, patch } from '@/lib/api';
import { Card, Btn, Badge, Input, Switch, Empty, Err, Spinner, Modal } from '@/components/ui';
import { fmt, money } from '@/lib/utils';
import { Archive, Check, Clock, Copy, Image as ImageIcon, Layers, Music, Pencil, Plus, Star, Video, X, Zap, type LucideIcon } from 'lucide-react';

const LIMIT_FIELDS = ['daily', 'batch', 'img_mb', 'aud_mb', 'vid_mb', 'vid_min', 'parallel'];

const LIMITS: { key: string; label: string; unit: string; icon: LucideIcon }[] = [
  { key: 'daily', label: 'Daily conversions', unit: '', icon: Zap },
  { key: 'batch', label: 'Per batch', unit: '', icon: Layers },
  { key: 'img_mb', label: 'Image size', unit: ' MB', icon: ImageIcon },
  { key: 'aud_mb', label: 'Audio size', unit: ' MB', icon: Music },
  { key: 'vid_mb', label: 'Video size', unit: ' MB', icon: Video },
  { key: 'vid_min', label: 'Video length', unit: ' min', icon: Clock },
  { key: 'parallel', label: 'Parallel jobs', unit: '', icon: Copy },
];

// Free-plan limits used as the starting point for a new plan.
const NEW_PLAN_LIMITS = { daily: 25, batch: 10, img_mb: 200, aud_mb: 100, vid_mb: 500, vid_min: 30, parallel: 2, ads: true, editor: false, priority: false, gps_remover: false, compare: false, batch_rename: false, target_size: false, compress_toggle: false, ai_data_remover: false };

const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

function PlanLimits({ limits }: { limits: any }) {
  const features = [
    { label: 'Ads', on: !!limits?.ads, onText: 'Shown', offText: 'Hidden' },
    { label: 'Priority processing', on: !!limits?.priority, onText: 'Yes', offText: 'No' },
    { label: 'Image editor', on: !!limits?.editor, onText: 'Included', offText: 'Not included' },
    // Converter features — same per-plan flags the backend reads from plan
    // limits (GET /v1/features); anonymous/free off, basic/pro on by default.
    { label: 'GPS location remover', on: !!limits?.gps_remover, onText: 'Included', offText: 'Not included' },
    { label: 'Before/After compare', on: !!limits?.compare, onText: 'Included', offText: 'Not included' },
    { label: 'Batch rename pattern', on: !!limits?.batch_rename, onText: 'Included', offText: 'Not included' },
    { label: 'Target file size', on: !!limits?.target_size, onText: 'Included', offText: 'Not included' },
    { label: 'Compress toggle', on: !!limits?.compress_toggle, onText: 'Included', offText: 'Not included' },
    { label: 'AI data remover', on: !!limits?.ai_data_remover, onText: 'Included', offText: 'Not included' },
  ];
  return <ul className="space-y-2 text-sm text-muted">
    {LIMITS.map(({ key, label, unit, icon: Icon }) => (
      <li key={key} className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span className="flex-1">{label}</span>
        <b className="font-semibold text-ink">{limits?.[key] == null ? '—' : `${fmt(limits[key])}${unit}`}</b>
      </li>
    ))}
    {features.map(f => (
      <li key={f.label} className="flex items-center gap-2">
        {f.on ? <Check className="h-4 w-4 shrink-0 text-green-600" aria-hidden /> : <X className="h-4 w-4 shrink-0 text-muted" aria-hidden />}
        <span className="flex-1">{f.label}</span>
        <b className="font-semibold text-ink">{f.on ? f.onText : f.offText}</b>
      </li>
    ))}
  </ul>;
}

function StatusBadge({ p }: { p: any }) {
  if (p.archived) return <Badge tone="muted">Archived</Badge>;
  if (p.active === false) return <Badge tone="muted">Inactive</Badge>;
  return <Badge tone="success">Active</Badge>;
}

export default function Plans() {
  const [rows, setRows] = React.useState<any[]>([]); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null); const [isNew, setIsNew] = React.useState(false); const [form, setForm] = React.useState<any>({});
  const [archiveTarget, setArchiveTarget] = React.useState<any>(null); const [archiving, setArchiving] = React.useState(false); const [archiveErr, setArchiveErr] = React.useState<any>(null);
  const load = () => { setLoading(true); get('/admin/plans').then((j:any)=>setRows(j.items||j.plans||[])).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const openEdit = (p:any) => { setIsNew(false); setEdit(p); setForm({ name: p.name, price_cents: p.price_cents, price_yearly_cents: p.price_yearly_cents, limits: { ...(p.limits||{}) }, featured: p.featured||0, active: p.active!==false, provider_price_ids: { ...(p.provider_price_ids||{}) } }); };
  const openCreate = () => { setIsNew(true); setEdit({ id: '' }); setForm({ name: '', price_cents: 0, price_yearly_cents: 0, limits: { ...NEW_PLAN_LIMITS }, featured: 0, active: true, provider_price_ids: {} }); };
  const closeModal = () => { setEdit(null); setIsNew(false); };
  const save = async () => {
    const name = (form.name || '').trim();
    if (!name) { setErr({ message: 'Give the plan a name first.' } as any); return; }
    const pc = Number(form.price_cents); const yc = Number(form.price_yearly_cents);
    if (isNaN(pc) || pc < 0 || isNaN(yc) || yc < 0) { setErr({ message: 'Prices must be 0 or more.' } as any); return; }
    for (const f of LIMIT_FIELDS) { const v = Number(form.limits?.[f]); if (isNaN(v) || v < 0) { setErr({ message: `Limit "${f}" must be 0 or more.` } as any); return; } }
    try {
      if (isNew) {
        const id = slugify(name);
        if (!id) { setErr({ message: 'The name must contain at least one letter or number.' } as any); return; }
        if (rows.some((r:any) => r.id === id)) { setErr({ message: `A plan with the id "${id}" already exists.` } as any); return; }
        const sort = rows.reduce((m:number, r:any) => Math.max(m, r.sort || 0), 0) + 1;
        await post('/admin/plans', { id, name, price_cents: pc, price_yearly_cents: yc, limits: form.limits, featured: form.featured || 0, sort });
        setMsg('Plan created — live immediately, no deploy needed.');
      } else {
        await patch(`/admin/plans/${edit.id}`, form);
        setMsg('Plan saved — live immediately, no deploy needed.');
      }
      closeModal(); load();
    } catch(e:any){ setErr(e); }
  };
  // Archive uses an in-app modal, not window.confirm(): the native dialog
  // never completes in the live browser, so Archive silently did nothing.
  const archive = async () => {
    if (!archiveTarget || archiving) return;
    setArchiving(true); setArchiveErr(null);
    try {
      await post(`/admin/plans/${archiveTarget.id}/archive`, {});
      setMsg('Plan archived; existing subscribers are grandfathered.');
      setArchiveTarget(null); load();
    } catch (e: any) { setArchiveErr(e); } finally { setArchiving(false); }
  };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{loading ? 'Loading plans…' : `${rows.length} plan${rows.length === 1 ? '' : 's'} · changes go live immediately, no deploy needed`}</p>
      <Btn onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> Add plan</Btn>
    </div>
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No plans yet" sub="Plans are seeded by the backend; they will appear here — or add one now." /> :
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rows.map((p:any)=><Card key={p.id} interactive className={`flex flex-col p-5 ${p.featured ? 'border-2 border-primary shadow-md' : ''} ${p.archived ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{p.name}</h3>{p.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white"><Star className="h-3 w-3" aria-hidden />Most popular</span> : null}</div>
          <p className="mt-0.5 truncate text-xs text-muted">ID: {p.id}</p>
        </div>
        <StatusBadge p={p} />
      </div>
      <div className="mt-3"><p className="text-3xl font-extrabold">{money(p.price_cents)}<span className="text-sm font-normal text-muted">/mo</span></p><p className="text-sm text-muted">{money(p.price_yearly_cents)} / year</p></div>
      <div className="my-4 border-t border-line" />
      <div className="flex-1"><PlanLimits limits={p.limits} /></div>
      <div className="mt-4 flex gap-2"><Btn variant="secondary" onClick={()=>openEdit(p)}><Pencil className="h-4 w-4" aria-hidden /> Edit</Btn>{!p.archived && <Btn variant="danger" onClick={()=>{ setArchiveErr(null); setArchiveTarget(p); }}><Archive className="h-4 w-4" aria-hidden /> Archive</Btn>}</div>
    </Card>)}</div>}
    <Modal open={!!archiveTarget} onClose={()=>{ if (!archiving) setArchiveTarget(null); }} title={`Archive plan — ${archiveTarget?.name || ''}`}>
      <div className="space-y-3">
        <p className="text-sm">Archive <b>{archiveTarget?.name}</b> ({money(archiveTarget?.price_cents)}/mo)? The plan stops being offered to new subscribers.</p>
        <p className="rounded-[12px] bg-soft p-3 text-sm text-muted">Existing subscribers keep their plan (grandfathered) — archiving never cancels anyone.</p>
        {archiveErr && <p className="rounded-[12px] border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger">{String(archiveErr.message || archiveErr)}</p>}
        <div className="flex justify-end gap-2"><Btn variant="secondary" disabled={archiving} onClick={()=>setArchiveTarget(null)}>Cancel</Btn><Btn variant="danger" disabled={archiving} onClick={archive}>{archiving ? 'Archiving…' : 'Archive plan'}</Btn></div>
      </div>
    </Modal>
    <Modal open={!!edit} onClose={closeModal} title={isNew ? 'Add plan' : `Edit plan — ${edit?.name || ''}`}>
      <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <Input label="Name" value={form.name||''} onChange={(e:any)=>setForm({...form,name:e.target.value})} />
        {isNew && <p className="-mt-1 text-xs text-muted">Plan id: <code className="rounded bg-soft px-1 py-0.5">{slugify(form.name || '') || '—'}</code> — generated from the name, used in checkout links.</p>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Monthly price (cents)" type="number" min={0} value={form.price_cents??''} onChange={(e:any)=>setForm({...form,price_cents:Number(e.target.value)})} />
          <Input label="Yearly price (cents)" type="number" min={0} value={form.price_yearly_cents??''} onChange={(e:any)=>setForm({...form,price_yearly_cents:Number(e.target.value)})} />
        </div>
        <p className="text-sm font-semibold">Limits (floors: 0 or more)</p>
        <div className="grid grid-cols-2 gap-3">{LIMIT_FIELDS.map(f=><Input key={f} label={LIMITS.find(l=>l.key===f)?.label ?? f} type="number" min={0} value={form.limits?.[f]??''} onChange={(e:any)=>setForm({...form,limits:{...form.limits,[f]:Number(e.target.value)}})} />)}</div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.featured} onChange={(v:boolean)=>setForm({...form,featured:v?1:0})} label="Most popular" /> Most popular <span className="text-muted">— highlight this plan on the pricing page</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.priority} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,priority:v}})} label="Priority processing" /> Priority processing</div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={form.limits?.ads!==false} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,ads:v}})} label="Show ads" /> Show ads to this plan</div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.editor} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,editor:v}})} label="Image editor" /> Image editor <span className="text-muted">— allow users on this plan to use the image editor</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.gps_remover} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,gps_remover:v}})} label="GPS location remover" /> GPS location remover <span className="text-muted">— strip GPS location data from converted images</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.compare} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,compare:v}})} label="Before/After compare" /> Before/After compare <span className="text-muted">— compare original vs converted with a slider</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.batch_rename} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,batch_rename:v}})} label="Batch rename pattern" /> Batch rename pattern <span className="text-muted">— rename a whole batch with a pattern like photo-&#123;n&#125;</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.target_size} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,target_size:v}})} label="Target file size" /> Target file size <span className="text-muted">— convert to a target file size, quality adjusts automatically</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.compress_toggle} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,compress_toggle:v}})} label="Compress toggle" /> Compress toggle <span className="text-muted">— let users turn compression on or off (off = no compression)</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!form.limits?.ai_data_remover} onChange={(v:boolean)=>setForm({...form,limits:{...form.limits,ai_data_remover:v}})} label="AI data remover" /> AI data remover <span className="text-muted">— strip AI metadata (EXIF, XMP, C2PA, PNG text) from converted images</span></div>
        <Input label="Paddle monthly price id" value={form.provider_price_ids?.paddle_monthly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,paddle_monthly:e.target.value}})} />
        <Input label="Paddle yearly price id" value={form.provider_price_ids?.paddle_yearly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,paddle_yearly:e.target.value}})} />
        <Input label="Lemon Squeezy monthly variant id" value={form.provider_price_ids?.lemonsqueezy_monthly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,lemonsqueezy_monthly:e.target.value}})} />
        <Input label="Lemon Squeezy yearly variant id" value={form.provider_price_ids?.lemonsqueezy_yearly||''} onChange={(e:any)=>setForm({...form,provider_price_ids:{...form.provider_price_ids,lemonsqueezy_yearly:e.target.value}})} />
        <div className={`rounded-[12px] border p-4 ${form.featured ? 'border-2 border-primary' : 'border-line'}`}><p className="text-xs font-semibold uppercase text-muted">Live pricing-card preview</p>
          <div className="mt-2 flex items-start justify-between gap-2"><p className="text-lg font-bold">{form.name || 'New plan'}</p>{form.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white"><Star className="h-3 w-3" aria-hidden />Most popular</span> : null}</div>
          <p className="text-3xl font-extrabold">{money(form.price_cents)}<span className="text-sm font-normal text-muted">/mo</span></p>
          <p className="text-sm text-muted">{money(form.price_yearly_cents)} / year</p>
          <div className="my-3 border-t border-line" />
          <PlanLimits limits={form.limits} /></div>
        <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={closeModal}>Cancel</Btn><Btn onClick={save}>{isNew ? 'Create plan' : 'Save plan'}</Btn></div>
      </div>
    </Modal>
  </>;
}
