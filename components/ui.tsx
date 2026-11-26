'use client';
import React from 'react';
import { useAnimatedOpen } from '@/lib/useAnimatedOpen';
export function Card({ children, className = '', interactive = false }: any) {
  // Subtle fade-up on mount; interactive cards (e.g. plan cards) also get
  // a gentle hover lift. `interactive` is opt-in — plain display cards
  // stay still so forms and stat cards don't feel jumpy.
  return <div className={`animate-fade-up rounded-[16px] border border-line bg-surface shadow-sm ${interactive ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}>{children}</div>;
}
export function CardHead({ title, sub, action }: any) {
  return <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
    <div><h2 className="text-base font-semibold text-ink">{title}</h2>{sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}</div>
    {action}
  </div>;
}
export function Btn({ children, onClick, variant = 'primary', disabled, type = 'button', className = '' }: any) {
  const styles: any = {
    primary: 'bg-primary text-white hover:bg-indigo-700',
    secondary: 'bg-soft text-ink border border-line hover:bg-slate-200',
    danger: 'bg-danger text-white hover:bg-red-700',
    ghost: 'text-primary hover:bg-indigo-50',
    success: 'bg-success text-white hover:bg-green-700',
  };
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${styles[variant]} ${className}`}>{children}</button>;
}
export function Badge({ children, tone = 'soft' }: any) {
  const tones: any = { soft: 'bg-soft text-ink', success: 'bg-green-100 text-green-800', warn: 'bg-amber-100 text-amber-800', danger: 'bg-red-100 text-red-800', primary: 'bg-indigo-100 text-primary', muted: 'bg-slate-100 text-muted' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone] || tones.soft}`}>{children}</span>;
}
export function Input({ label, action, ...props }: any) {
  return <label className="block text-sm font-medium text-ink">{label && <span className="mb-1 block">{label}</span>}
    <span className="relative block">
      <input {...props} className={`w-full rounded-[12px] border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary ${action ? 'pr-16' : ''}`} />
      {action && <span className="absolute right-2 top-1/2 -translate-y-1/2">{action}</span>}
    </span></label>;
}
export function Select({ label, children, ...props }: any) {
  return <label className="block text-sm font-medium text-ink">{label && <span className="mb-1 block">{label}</span>}
    <select {...props} className="w-full rounded-[12px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">{children}</select></label>;
}
export function Textarea({ label, ...props }: any) {
  return <label className="block text-sm font-medium text-ink">{label && <span className="mb-1 block">{label}</span>}
    <textarea {...props} className="w-full rounded-[12px] border border-line bg-surface px-3 py-2.5 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" /></label>;
}
export function Switch({ checked, onChange, label }: any) {
  return <button type="button" role="switch" aria-checked={!!checked} aria-label={label || 'Toggle'} onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-slate-300'}`}>
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} /></button>;
}
export function Stat({ label, value, sub, tone }: any) {
  return <Card className="p-5"><p className="text-sm font-medium text-muted">{label}</p>
    <p className={`mt-1 text-3xl font-extrabold ${tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{value}</p>
    {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}</Card>;
}
export function Empty({ title, sub }: any) {
  return <div className="px-5 py-10 text-center"><p className="font-semibold text-ink">{title}</p>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>;
}
export function Err({ error, onRetry }: any) {
  if (!error) return null;
  // Never show raw technical text (e.g. JSON parse errors) to an admin:
  // the API client already maps those to a plain message, this is a safety net.
  const raw = String(error.message || '');
  const msg = /Unexpected token|is not valid JSON|Failed to fetch|NetworkError|Network request failed/i.test(raw)
    ? 'Could not load data. Check the server connection and try again.'
    : (raw || 'Something went wrong');
  return <Card className="border-red-200 bg-red-50 p-4"><p className="font-semibold text-danger">{msg}</p>
    {error.hint && <p className="mt-1 text-sm text-red-700">{error.hint}</p>}
    {onRetry && <div className="mt-3"><Btn variant="secondary" onClick={onRetry}>Retry</Btn></div>}</Card>;
}
export function Spinner() { return <div className="flex animate-fade-in items-center gap-2 py-8 text-sm text-muted" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary" />Loading…</div>; }
export function Modal({ open, onClose, title, children }: any) {
  // Enter/exit animation: stays mounted ~200ms after closing so the
  // fade/scale-out can play instead of vanishing instantly.
  const { mounted, visible } = useAnimatedOpen(open, 200);
  // While open, remember the last rendered content. Call sites null their
  // state the moment they close (e.g. setArchiveTarget(null)), so during
  // the exit animation the live props would be empty — or a handler like
  // rejectSel.id would throw. Render the snapshot until unmounted.
  const lastContent = React.useRef<{ title: any; children: any } | null>(null);
  React.useEffect(() => { if (open) lastContent.current = { title, children }; }, [open, title, children]);
  if (!mounted) return null;
  const content = open ? { title, children } : (lastContent.current || { title, children });
  return <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 transition-opacity duration-200 sm:items-center ${visible ? 'opacity-100' : 'opacity-0'}`} role="dialog" aria-modal="true" aria-label={content.title} onClick={onClose}>
    <div className={`w-full max-w-lg rounded-[16px] bg-surface p-5 shadow-xl transition-all duration-200 ${visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.97] opacity-0'}`} onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-ink">{content.title}</h3>
      <button onClick={onClose} aria-label="Close" className="rounded-full px-2 py-1 text-xl text-muted transition-colors hover:bg-soft">×</button></div>
      {content.children}
    </div></div>;
}
export function Tabs({ tabs, active, onChange }: any) {
  return <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
    {tabs.map((t: any) => <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}
      className={`whitespace-nowrap rounded-t-[12px] px-4 py-2.5 text-sm font-semibold transition-colors ${active === t.id ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-ink'}`}>{t.label}</button>)}
  </div>;
}
export function CopyField({ value, label }: any) {
  const [copied, setCopied] = React.useState(false);
  return <div className="flex items-center gap-2"><code className="flex-1 break-all rounded-[12px] border border-line bg-soft px-3 py-2 text-xs text-ink">{value}</code>
    <Btn variant="secondary" onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? 'Copied' : 'Copy'}</Btn></div>;
}
export function Skeleton({ className = '' }: any) { return <div className={`animate-pulse rounded-[12px] bg-soft ${className}`} />; }
