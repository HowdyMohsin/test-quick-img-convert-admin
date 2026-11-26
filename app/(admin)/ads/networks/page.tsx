'use client';
import React from 'react';
import { get, post, patch, del, ApiException } from '@/lib/api';
import { Card, CardHead, Btn, Badge, Input, Select, Textarea, Switch, Stat, Empty, Err, Spinner, Modal, Tabs, CopyField } from '@/components/ui';
import { fmt, money, pct, timeAgo, fmtDate, downloadCsv } from '@/lib/utils';

export default function Networks() {
  const [s, setS] = React.useState<any>({}); const [err, setErr] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [msg, setMsg] = React.useState('');
  const [adsTxt, setAdsTxt] = React.useState(''); const [consent, setConsent] = React.useState({ enabled: true, banner: true });
  const load = () => { setLoading(true); get('/admin/ads/networks').then((j:any)=>{ const d=j.settings||j; setS(d); setAdsTxt(d.ads_txt||''); setConsent(d.consent||{enabled:true,banner:true}); }).catch(setErr).finally(()=>setLoading(false)); };
  React.useEffect(load, []);
  const save = async () => { try { await patch('/admin/ads/networks', { ...s, ads_txt: adsTxt, consent }); setMsg('Ad network settings saved.'); } catch(e:any){ setErr(e); } };
  return <>
    {msg && <p className="mb-3 rounded-[12px] bg-green-50 p-3 text-sm font-medium text-green-800">{msg}</p>}
    {err && <div className="mb-3"><Err error={err} onRetry={load} /></div>}
    {loading ? <Spinner /> : <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHead title="Networks" /><div className="space-y-3 p-5">
        <Input label="AdSense publisher id" value={s.adsense_publisher_id||''} onChange={(e:any)=>setS({...s,adsense_publisher_id:e.target.value})} placeholder="pub-0000000000000000" />
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!s.adsense_auto_ads} onChange={(v:boolean)=>setS({...s,adsense_auto_ads:v})} label="AdSense Auto Ads" /> AdSense Auto Ads</div>
        <Input label="Adsterra key" type="password" autoComplete="off" value={s.adsterra_key||''} onChange={(e:any)=>setS({...s,adsterra_key:e.target.value})} placeholder="Leave blank to keep the current key" />
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!consent.enabled} onChange={(v:boolean)=>setConsent({...consent,enabled:v})} label="Consent mode" /> Consent mode enabled</div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={!!consent.banner} onChange={(v:boolean)=>setConsent({...consent,banner:v})} label="Consent banner" /> Show consent banner</div>
        <Btn onClick={save}>Save network settings</Btn></div></Card>
      <Card><CardHead title="ads.txt" sub="Served publicly at /ads.txt by the web app." /><div className="space-y-3 p-5">
        <Textarea label="ads.txt content" rows={10} value={adsTxt} onChange={(e:any)=>setAdsTxt(e.target.value)} />
        <Btn variant="secondary" onClick={save}>Save ads.txt</Btn></div></Card>
      <Card className="lg:col-span-2"><CardHead title="Safety rules" sub="These rules are enforced by the ad engine, not by individual slots." />
        <ul className="list-disc space-y-1 p-5 pl-8 text-sm text-muted">
          <li>No ads inside the converter tool, between file selection and download completion.</li>
          <li>No ads on /account, on the pricing checkout modal, or on any payment step.</li>
          <li>No ads for Basic or Pro subscribers, ever.</li>
          <li>When an ad blocker is detected, slots fall back to house ads and the tool is unaffected.</li>
          <li>Frequency caps apply per session, per slot.</li>
        </ul></Card>
    </div>}
  </>;
}
