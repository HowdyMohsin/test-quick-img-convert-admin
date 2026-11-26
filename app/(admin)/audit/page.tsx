'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';
import { ALL_PERMS } from '@/lib/nav';

export default function Audit() {
  const [rows, setRows] = React.useState<any[]>([]); const [admin, setAdmin] = React.useState(''); const [action, setAction] = React.useState('');
  const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [sel, setSel] = React.useState<any>(null);
  const load = React.useCallback(() => { setLoading(true); const p = new URLSearchParams({ ...(admin?{admin}:{}), ...(action?{action}:{}) }); get(`/admin/audit?${p}`).then((j:any)=>setRows(j.items||j.entries||[])).catch(setErr).finally(()=>setLoading(false)); }, [admin, action]);
  React.useEffect(load, [load]);
  const exportCsv = () => downloadCsv('quick-img-convert-audit.csv', [['time','admin','action','target'], ...rows.map((r:any)=>[r.ts||r.created_at, r.admin_email, r.action, r.target])]);
  return <>
    <Card><div className="flex flex-wrap items-end gap-3 p-4">
      <Input label="Admin email" value={admin} onChange={(e:any)=>setAdmin(e.target.value)} placeholder="Filter by admin…" />
      <Input label="Action" value={action} onChange={(e:any)=>setAction(e.target.value)} placeholder="e.g. plan.update" />
      <Btn onClick={load}>Filter</Btn><Btn variant="secondary" onClick={exportCsv}>Export CSV</Btn></div>
    {err && <div className="px-4 pb-4"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : rows.length===0 ? <Empty title="No audit entries" sub="Every admin mutation is written here with a before/after diff." /> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">Time</th><th className="px-3 py-3">Admin</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Target</th><th className="px-3 py-3" /></tr></thead>
    <tbody>{rows.map((r:any,i:number)=><tr key={r.id||i} className="border-b border-line"><td className="px-5 py-3 text-muted">{fmtDate(r.ts || r.created_at)}</td><td className="px-3 py-3">{r.admin_email}</td><td className="px-3 py-3 font-mono text-xs">{r.action}</td><td className="px-3 py-3">{r.target}</td><td className="px-3 py-3 text-right"><Btn variant="ghost" onClick={()=>setSel(r)}>Diff</Btn></td></tr>)}</tbody></table></div>}</Card>
    <Modal open={!!sel} onClose={()=>setSel(null)} title="Before / after">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="mb-1 text-sm font-semibold">Before</p><pre className="max-h-72 overflow-auto rounded-[12px] bg-soft p-3 text-xs">{JSON.stringify(sel?.before ?? {}, null, 2)}</pre></div>
        <div><p className="mb-1 text-sm font-semibold">After</p><pre className="max-h-72 overflow-auto rounded-[12px] bg-soft p-3 text-xs">{JSON.stringify(sel?.after ?? {}, null, 2)}</pre></div>
      </div>
    </Modal>
  </>;
}
