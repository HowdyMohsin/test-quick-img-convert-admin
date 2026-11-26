'use client';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { api, getCsrf, ApiException } from '@/lib/api';
import { Btn, Input, Card } from '@/components/ui';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter(); const sp = useSearchParams();
  const [email, setEmail] = React.useState(''); const [password, setPassword] = React.useState('');
  const [totp, setTotp] = React.useState(''); const [needTotp, setNeedTotp] = React.useState(false);
  const [mustChange, setMustChange] = React.useState(false);
  const [newPw, setNewPw] = React.useState(''); const [confirmPw, setConfirmPw] = React.useState('');
  const [err, setErr] = React.useState(''); const [lockout, setLockout] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  // Link back to the public site (configured via NEXT_PUBLIC_SITE_URL).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  React.useEffect(() => { getCsrf().catch(() => {}); }, []);
  React.useEffect(() => { if (lockout <= 0) return; const t = setInterval(() => setLockout(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [lockout]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const j: any = await api('/admin/auth/login', { method: 'POST', body: { email, password, ...(needTotp ? { totp_code: totp } : {}) } });
      if (j.must_change_password) { setMustChange(true); setBusy(false); return; }
      router.push(sp.get('next') || '/');
    } catch (e: any) {
      const ex = e as ApiException;
      if (ex.code === 'totp_required' || ex.code === 'totp_invalid') setNeedTotp(true);
      if (ex.code === 'locked_out' || ex.code === 'account_locked') { const m = ex.message.match(/(\d+)\s*(second|minute)/i); setLockout(m ? (m[2].toLowerCase().startsWith('min') ? parseInt(m[1]) * 60 : parseInt(m[1])) : 300); }
      setErr(ex.message || 'Sign in failed.');
    } finally { setBusy(false); }
  };
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (newPw.length < 12) { setErr('The new password must be at least 12 characters.'); return; }
    if (newPw !== confirmPw) { setErr('The new passwords do not match.'); return; }
    setBusy(true);
    try { await api('/admin/auth/change-password', { method: 'POST', body: { current_password: password, new_password: newPw } }); router.push('/'); }
    catch (e: any) { setErr((e as ApiException).message || 'Password change failed.'); } finally { setBusy(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-soft p-4">
    <div className="w-full max-w-md">
      <div className="mb-6 text-center"><span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary text-2xl font-extrabold text-white">⚡</span>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">{BRAND.adminTitle}</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage Quick IMG Convert.</p></div>
      <Card className="p-6">
        {mustChange ? (
          <form onSubmit={changePw} className="space-y-4">
            <p className="rounded-[12px] bg-amber-50 p-3 text-sm text-amber-800">This is your first sign-in. Choose a new password (at least 12 characters) before continuing.</p>
            <Input label="New password" type="password" autoComplete="new-password" value={newPw} onChange={(e: any) => setNewPw(e.target.value)} required minLength={12} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirmPw} onChange={(e: any) => setConfirmPw(e.target.value)} required minLength={12} />
            {err && <p role="alert" className="text-sm font-medium text-danger">{err}</p>}
            <Btn type="submit" disabled={busy} className="w-full">{busy ? 'Saving…' : 'Set password and continue'}</Btn>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e: any) => setEmail(e.target.value)} required autoFocus placeholder="admin@example.com" />
            <Input label="Password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e: any) => setPassword(e.target.value)} required placeholder="Your password"
              action={<button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} className="rounded px-1 text-xs font-semibold text-primary hover:underline">{showPw ? 'Hide' : 'Show'}</button>} />
            {needTotp && <Input label="Authenticator code" inputMode="numeric" autoComplete="one-time-code" value={totp} onChange={(e: any) => setTotp(e.target.value)} required placeholder="6-digit code" />}
            {lockout > 0 && <p role="alert" className="rounded-[12px] bg-red-50 p-3 text-sm font-medium text-danger">Too many attempts. Try again in {Math.floor(lockout / 60)}:{String(lockout % 60).padStart(2, '0')}.</p>}
            {err && !lockout && <p role="alert" className="text-sm font-medium text-danger">{err}</p>}
            <Btn type="submit" disabled={busy || lockout > 0} className="w-full">{busy ? 'Signing in…' : 'Sign in'}</Btn>
            <p className="text-center text-xs text-muted">No default credentials exist. Ask your server administrator to create the first admin account.</p>
          </form>
        )}
      </Card>
      {siteUrl && <p className="mt-4 text-center text-sm"><a className="font-semibold text-primary hover:underline" href={siteUrl}>← Back to Quick IMG Convert</a></p>}
    </div>
  </main>;
}

export default function LoginPage() { return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-soft p-4 text-sm text-muted">Loading…</main>}><LoginForm /></Suspense>; }
