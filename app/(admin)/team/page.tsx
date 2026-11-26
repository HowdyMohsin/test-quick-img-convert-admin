'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS, permLabel } from '@/lib/nav';

// The backend expects permissions as a dict keyed by sidebar section with
// read/write levels (TeamCreateBody.permissions: dict). A ticked section
// means the staff admin can use that section, i.e. read + write.
const permsToDict = (list: string[]) => Object.fromEntries(list.map((s) => [s, ['read', 'write']]));

const EMPTY_FORM = { email: '', display_name: '', password: '', role: 'staff', permissions: [] as string[] };

export default function Team() {
  const [rows, setRows] = React.useState<any[]>([]); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [form, setForm] = React.useState({ ...EMPTY_FORM });
  const [pwShow, setPwShow] = React.useState(false); const [pwErr, setPwErr] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null); const [resetLink, setResetLink] = React.useState('');
  const load = () => { setLoading(true); get('/admin/team').then((j:any)=>setRows(j.items||j.admins||[])).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const togglePerm = (p:string, list:string[], set:(v:string[])=>void) => set(list.includes(p) ? list.filter(x=>x!==p) : [...list, p]);
  const create = async (e:any) => {
    e.preventDefault(); setErr(null);
    if (!form.password || form.password.length < 12) { setPwErr('Password must be at least 12 characters long.'); return; }
    if (form.password.length > 128) { setPwErr('Password must be at most 128 characters long.'); return; }
    try {
      const j:any = await post('/admin/team', { email: form.email, display_name: form.display_name, password: form.password, role: form.role, permissions: permsToDict(form.permissions) });
      setMsg('Admin created. Share the password with them securely — they will be asked to change it when they first sign in.');
      setForm({ ...EMPTY_FORM }); setPwShow(false); setPwErr(''); load();
    } catch(er:any){ setErr(er); }
  };
  const savePerms = async () => { try { await patch(`/admin/team/${edit.id}`, { permissions: permsToDict(edit.permissions || []) }); setMsg('Permissions saved.'); setEdit(null); load(); } catch(er:any){ setErr(er); } };
  const resetPw = async (a:any) => { try { const j:any = await post(`/admin/team/${a.id}/reset-link`, {}); setResetLink(j.reset_link || j.reset_url || ''); setMsg('One-time password reset link created — it works once and expires. Share it directly with this admin.'); } catch(er:any){ setErr(er); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {resetLink && <div className="mb-3"><p className="mb-1 text-sm font-semibold">One-time password reset link</p><CopyField value={resetLink} /></div>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Add admin" sub="Role super_admin sees everything; staff sees only the sections you tick." /><form onSubmit={create} className="space-y-3 p-5">
        <Input label="Email" type="email" value={form.email} onChange={(e:any)=>setForm({...form,email:e.target.value})} required />
        <Input label="Name" value={form.display_name} onChange={(e:any)=>setForm({...form,display_name:e.target.value})} required />
        <Input label="Password" type={pwShow ? 'text' : 'password'} value={form.password} autoComplete="new-password" placeholder="At least 12 characters" onChange={(e:any)=>{ setForm({...form,password:e.target.value}); if (pwErr) setPwErr(''); }} required action={<button type="button" onClick={()=>setPwShow(!pwShow)} className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{pwShow ? 'Hide' : 'Show'}</button>} />
        {pwErr ? <p role="alert" className="-mt-1 text-xs font-medium text-danger">{pwErr}</p> : <p className="-mt-1 text-xs text-muted">The new admin signs in with this password and will be asked to change it at first sign-in.</p>}
        <Select label="Role" value={form.role} onChange={(e:any)=>setForm({...form,role:e.target.value})}><option value="staff">Staff</option><option value="super_admin">Super admin</option></Select>
        <fieldset><legend className="mb-1 text-sm font-medium">Section permissions</legend><div className="flex flex-wrap gap-2">{ALL_PERMS.map(p=><label key={p} className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm"><input type="checkbox" checked={form.permissions.includes(p)} onChange={()=>togglePerm(p, form.permissions, (v)=>setForm({...form,permissions:v}))} /> {permLabel(p)}</label>)}</div></fieldset>
        <Btn type="submit">Create admin</Btn></form></Card>
      <Card><CardHead title="Admins" />
        {loading ? <Spinner /> : rows.length===0 ? <Empty title="No other admins" sub="Add a staff admin with the form." /> :
        <div className="divide-y divide-line">{rows.map((a:any)=><div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{a.display_name || a.name || a.email}</p><p className="truncate text-muted">{a.email} · {a.role} {a.active===false && '· inactive'}</p></div>
          <div className="flex shrink-0 flex-wrap gap-2">
          <Btn variant="ghost" onClick={()=>setEdit({...a, permissions: Array.isArray(a.permissions) ? a.permissions : Object.keys(a.permissions||{}).filter((k:string)=>a.permissions[k])})}>Permissions</Btn>
          <Btn variant="secondary" onClick={()=>resetPw(a)}>Reset password</Btn>
          <Btn variant="ghost" onClick={async()=>{ try { await patch(`/admin/team/${a.id}`, { active: a.active===false }); load(); } catch(er:any){ setErr(er); } }}>{a.active===false?'Activate':'Deactivate'}</Btn>
          </div>
        </div>)}</div>}</Card>
    </div>
    <Modal open={!!edit} onClose={()=>setEdit(null)} title={`Permissions — ${edit?.email || ''}`}>
      <div className="flex flex-wrap gap-2">{ALL_PERMS.map(p=><label key={p} className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm"><input type="checkbox" checked={(edit?.permissions||[]).includes(p)} onChange={()=>setEdit({...edit, permissions: (edit.permissions||[]).includes(p) ? edit.permissions.filter((x:string)=>x!==p) : [...(edit.permissions||[]), p]})} /> {permLabel(p)}</label>)}</div>
      <div className="mt-4 flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setEdit(null)}>Cancel</Btn><Btn onClick={savePerms}>Save permissions</Btn></div>
    </Modal>
  </>;
}
