'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { LineChart, BarChart } from '@/components/charts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function fmtShort(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
const PRESETS = [
  { label: 'Last 1 day', days: 1 },
  { label: 'Last 3 days', days: 3 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
];

export default function Dashboard() {
  const [d, setD] = React.useState<any>(null); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState('');
  const load = () => { setLoading(true); setErr(null); get('/admin/dashboard').then(setD).catch(setErr).finally(() => setLoading(false)); };
  React.useEffect(load, []);
  const k = d?.kpis || d || {};

  // Conversions chart: real data per selected range from GET /admin/reports
  // (daily series, zero-filled by the backend — never sliced client-side).
  const [range, setRange] = React.useState(() => { const to = new Date(); return { label: 'Last 30 days', from: toISO(addDays(to, -29)), to: toISO(to) }; });
  const [chartType, setChartType] = React.useState<'line' | 'bar'>('bar');
  const [report, setReport] = React.useState<any>(null);
  const [chartErr, setChartErr] = React.useState<any>(null);
  const [chartLoading, setChartLoading] = React.useState(false);
  React.useEffect(() => {
    let live = true; setChartLoading(true); setChartErr(null);
    get(`/admin/reports?from=${range.from}&to=${range.to}`)
      .then((j: any) => { if (live) setReport(j); })
      .catch((e: any) => { if (live) setChartErr(e); })
      .finally(() => { if (live) setChartLoading(false); });
    return () => { live = false; };
  }, [range.from, range.to]);
  const series = (report?.daily || []).map((x: any) => ({ label: fmtShort(x.date || ''), value: x.conversions ?? x.value ?? 0 }));
  const totalConversions = series.reduce((a: number, s: any) => a + s.value, 0);
  const rangeText = range.label === 'Custom range'
    ? `Custom range · ${fmtShort(range.from)} – ${fmtShort(range.to)}`
    : `${range.label} · ${fmtShort(range.from)} – ${fmtShort(range.to)}`;

  // Sales: revenue for the active range (same reports fetch) + recent
  // approved payments (GET /admin/payments/requests?status=approved).
  const revenueRows = report?.revenue_by_provider || [];
  const totalRevenueCents = revenueRows.reduce((a: number, r: any) => a + (r.amount_cents || 0), 0);
  const [approved, setApproved] = React.useState<any[]>([]);
  const loadSales = React.useCallback(() => {
    get('/admin/payments/requests?status=approved').then((j: any) => setApproved(j.requests || j.items || [])).catch(() => setApproved([]));
  }, []);
  React.useEffect(loadSales, [loadSales]);

  // Purchases: pending payment approvals (GET /admin/payments/requests?status=pending).
  const [purchases, setPurchases] = React.useState<any[]>([]);
  const [purchasesErr, setPurchasesErr] = React.useState<any>(null);
  const [purchasesLoading, setPurchasesLoading] = React.useState(true);
  const [rejectSel, setRejectSel] = React.useState<any>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const loadPurchases = React.useCallback(() => {
    setPurchasesLoading(true);
    get('/admin/payments/requests?status=pending').then((j: any) => setPurchases(j.requests || j.items || [])).catch(setPurchasesErr).finally(() => setPurchasesLoading(false));
  }, []);
  React.useEffect(loadPurchases, [loadPurchases]);
  const decide = async (id: string, action: string, body?: any) => {
    try {
      await post(`/admin/payments/requests/${id}/${action}`, body || {});
      setMsg(action === 'approve' ? 'Approved — plan upgraded, receipt emailed, user notified.' : 'Request rejected.');
      setRejectSel(null); setRejectReason('');
      loadPurchases(); loadSales(); load();
    } catch (e: any) { setPurchasesErr(e); }
  };

  const top = d?.top_pairs || d?.topPairs || [];
  const errors = d?.recent_errors || d?.recentErrors || [];
  const disabled = d?.disabled_pair_alerts || d?.disabled_pairs || d?.disabledPairs || [];
  const setPreset = (days: number, label: string) => { const to = new Date(); setRange({ label, from: toISO(addDays(to, -(days - 1))), to: toISO(to) }); };
  return <>
    {err && <Err error={err} onRetry={load} />}
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {loading && !d ? <Spinner /> : <>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Stat label="Users" value={fmt(k.users ?? k.total_users)} sub={k.new_users_30d ? `${fmt(k.new_users_30d)} new in 30 days` : undefined} />
      <Stat label="Conversions today" value={fmt(k.conversions_today ?? k.conversionsToday)} />
      <Stat label="Success rate" value={pct(k.success_rate ?? k.successRate)} />
      <Stat label="Active subscriptions" value={fmt(k.active_subscriptions ?? k.activeSubscriptions)} />
      <Stat label="MRR" value={money(k.mrr_cents ?? k.mrrCents)} sub="Monthly recurring revenue" />
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Conversions" sub={rangeText} />
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          {PRESETS.map(p => <button key={p.label} type="button" onClick={() => setPreset(p.days, p.label)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${range.label === p.label ? 'bg-primary text-white' : 'bg-soft text-ink hover:bg-soft'}`}>{p.label}</button>)}
          <DateRangePicker value={{ from: range.from, to: range.to }} onChange={(from, to) => setRange({ label: 'Custom range', from, to })} />
          <span className="ml-auto flex gap-1 rounded-[10px] border border-line p-0.5">
            <button type="button" aria-label="Line graph" title="Line graph" onClick={() => setChartType('line')} className={`rounded-[8px] p-1.5 ${chartType === 'line' ? 'bg-primary text-white' : 'text-muted hover:bg-soft'}`}><TrendingUp size={16} /></button>
            <button type="button" aria-label="Bar chart" title="Bar chart" onClick={() => setChartType('bar')} className={`rounded-[8px] p-1.5 ${chartType === 'bar' ? 'bg-primary text-white' : 'text-muted hover:bg-soft'}`}><BarChart3 size={16} /></button>
          </span>
        </div>
        <div className="p-5">
          {chartErr ? <Err error={chartErr} /> : chartLoading && !report ? <Spinner /> : series.length ? (
            chartType === 'line' ? <LineChart data={series} /> : <BarChart data={series} />
          ) : <Empty title="No chart data yet" sub="Charts appear once conversions are recorded." />}
          {report && <p className="mt-2 text-xs text-muted">{fmt(totalConversions)} conversions · {fmtShort(range.from)} – {fmtShort(range.to)}</p>}
        </div>
      </Card>
      <Card><CardHead title="Top conversion pairs" sub="Most used pairs in the last 30 days" />
        <div className="divide-y divide-line">{top.length ? top.map((t:any,i:number)=><div key={i} className="flex items-center justify-between px-5 py-3 text-sm"><span className="font-semibold">{t.pair || t.pair_slug || t.from + ' → ' + t.to}</span><span className="text-muted">{fmt(t.count ?? t.conversions)} conversions</span></div>) : <Empty title="No pairs yet" sub="Top pairs appear once conversions are recorded." />}</div></Card>
    </div>
    {disabled.length > 0 && <Card className="mt-4 border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-800">Disabled pairs</p>{disabled.map((x:any,i:number)=><p key={i} className="text-sm text-amber-700">{x.pair_slug || x.pair}: {x.last_error || 'disabled'}</p>)}</Card>}
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Recent errors" sub="Latest engine and conversion errors" />
        <div className="divide-y divide-line">{errors.length ? errors.slice(0,8).map((e:any,i:number)=><div key={i} className="px-5 py-3 text-sm"><span className="font-semibold">{e.error_code || e.code || 'error'}</span> <span className="text-muted">{e.message || e.pair_slug || ''} · {timeAgo(e.ts || e.created_at)}</span></div>) : <Empty title="No recent errors" sub="Errors from the conversion pipeline will appear here." />}</div></Card>
      <Card><CardHead title="Sales" sub={`Revenue · ${range.label}`} />
        <div className="p-5">
          {chartErr ? <Err error={chartErr} /> : chartLoading && !report ? <Spinner /> : <>
            <p className="text-3xl font-extrabold text-ink">{money(totalRevenueCents)}</p>
            <p className="mt-1 text-sm text-muted">Total revenue · {fmtShort(range.from)} – {fmtShort(range.to)}</p>
            {revenueRows.length ? <div className="mt-3 divide-y divide-line">{revenueRows.map((r:any,i:number)=><div key={i} className="flex items-center justify-between py-2 text-sm"><span className="font-semibold">{r.provider_key || r.provider} · {r.plan}</span><span className="text-muted">{money(r.amount_cents)}</span></div>)}</div> : <p className="mt-3 text-sm text-muted">No revenue in this range yet.</p>}
          </>}
        </div>
        <div className="border-t border-line px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-ink">Recent sales</p>
          {approved.length ? <div className="divide-y divide-line">{approved.slice(0,5).map((s:any)=><div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span><span className="font-semibold">{s.plan_name || s.plan}</span> <span className="text-muted">· {s.provider} · {timeAgo(s.created_at)}</span></span><span className="font-semibold">{money(s.amount_cents)}</span></div>)}</div> : <Empty title="No sales yet" sub="Approved payments will appear here." />}
        </div>
      </Card>
    </div>
    <Card className="mt-4"><CardHead title="Purchases" sub="Payment requests awaiting approval" />
      {purchasesErr && <div className="px-5 pt-4"><Err error={purchasesErr} onRetry={loadPurchases} /></div>}
      {purchasesLoading ? <Spinner /> : purchases.length === 0 ? <Empty title="No pending payment approvals" sub="Manual payment requests awaiting a decision will appear here." /> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-line bg-soft text-left text-muted"><th className="px-5 py-3">Reference</th><th className="px-3 py-3">User</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Submitted</th><th className="px-3 py-3" /></tr></thead>
      <tbody>{purchases.map((r:any)=><tr key={r.id} className="border-b border-line"><td className="px-5 py-3 font-semibold">{r.reference || '—'}</td><td className="px-3 py-3">{r.user_email || r.user_id}</td><td className="px-3 py-3">{r.plan_id || r.plan} · {r.interval}</td><td className="px-3 py-3">{money(r.amount_cents)}{r.display_amount ? ` (${r.display_amount})` : ''}</td><td className="px-3 py-3">{r.provider_key || r.provider}</td><td className="px-3 py-3 text-muted">{timeAgo(r.created_at)}</td>
      <td className="px-3 py-3 text-right"><span className="flex justify-end gap-2"><Btn variant="success" onClick={()=>decide(r.id,'approve')}>Approve</Btn><Btn variant="danger" onClick={()=>setRejectSel(r)}>Reject</Btn></span></td></tr>)}</tbody></table></div>}
    </Card>
    <Modal open={!!rejectSel} onClose={()=>setRejectSel(null)} title="Reject payment request">
      <p className="mb-3 text-sm text-muted">The user is notified with this reason.</p>
      <Textarea label="Rejection reason (required)" rows={3} value={rejectReason} onChange={(e:any)=>setRejectReason(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setRejectSel(null)}>Cancel</Btn><Btn variant="danger" disabled={!rejectReason.trim()} onClick={()=>decide(rejectSel.id,'reject',{reason:rejectReason})}>Reject request</Btn></div>
    </Modal>
    </>}
  </>;
}
