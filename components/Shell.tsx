'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { filterNav } from '@/lib/nav';
import { api, get } from '@/lib/api';
import { initials } from '@/lib/utils';

export default function Shell({ children, title, breadcrumb }: { children: React.ReactNode; title: string; breadcrumb?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);
  const [me, setMe] = React.useState<any>(null);
  const [auth, setAuth] = React.useState<'checking' | 'ok'>('checking');
  const [pending, setPending] = React.useState<number | null>(null);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  // Auth guard: the admin panel never renders as a signed-in user until
  // /admin/auth/me succeeds. A 401 is redirected to /login by the API
  // client; any other failure (e.g. backend unreachable) also routes to
  // /login instead of showing a fake "Admin" dashboard.
  React.useEffect(() => {
    try { setCollapsed(localStorage.getItem('qic_admin_sidebar') === 'collapsed'); } catch {}
    try { const saved = JSON.parse(localStorage.getItem('qic_admin_groups') || '{}'); if (saved && typeof saved === 'object') setOpenGroups(saved); } catch {}
    get('/admin/auth/me')
      .then((j: any) => { setMe(j.admin || j.me || j); setAuth('ok'); })
      .catch(() => { router.replace('/login?next=' + encodeURIComponent(window.location.pathname)); });
  }, [router]);
  // Pending payment requests, only once we know the admin is signed in.
  React.useEffect(() => {
    if (auth !== 'ok') return;
    get('/admin/payments/requests?status=pending&limit=1').then((j: any) => {
      const total = j.total ?? j.count ?? (Array.isArray(j.items || j.requests) ? (j.items || j.requests).length : null);
      setPending(typeof total === 'number' ? total : null);
    }).catch(() => setPending(null));
  }, [auth]);
  const admin = me || {};
  const perms = admin.permissions ?? admin.perms;
  const groups = filterNav(perms, admin.role);
  const isActive = (href?: string) => !!href && (pathname === href || (href !== '/' && pathname.startsWith(href)));
  // Keep the group of the current page open so the active item stays visible.
  React.useEffect(() => {
    const activeId = groups.flatMap(g => g.items).find(it => it.children?.some(c => isActive(c.href)))?.id;
    if (activeId) setOpenGroups(s => (s[activeId] ? s : { ...s, [activeId]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const toggleGroup = (id: string) => setOpenGroups(s => {
    const next = { ...s, [id]: !(s[id] ?? false) };
    try { localStorage.setItem('qic_admin_groups', JSON.stringify(next)); } catch {}
    return next;
  });
  const toggleCollapsed = () => {
    const v = !collapsed; setCollapsed(v);
    try { localStorage.setItem('qic_admin_sidebar', v ? 'collapsed' : 'expanded'); } catch {}
  };
  const signOut = async () => { try { await api('/admin/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };
  const sidebar = (mobile: boolean) => (
    <div className={`flex h-full flex-col overflow-hidden bg-ink text-white ${collapsed && !mobile ? 'w-[72px]' : 'w-[264px]'}`} role="navigation" aria-label="Admin sections">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary text-lg font-extrabold" aria-hidden>⚡</span>
        {!collapsed && !mobile && <div className="min-w-0"><p className="truncate text-sm font-bold leading-tight">{BRAND.name}</p><p className="text-xs text-slate-400">Admin</p></div>}
        {mobile && <div className="min-w-0"><p className="truncate text-sm font-bold leading-tight">{BRAND.name}</p><p className="text-xs text-slate-400">Admin</p></div>}
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {groups.map(g => (
          <div key={g.label} className="mb-4">
            {(!collapsed || mobile) && <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p>}
            {g.items.map(it => {
              if (it.children) {
                const open = openGroups[it.id] ?? false;
                const activeChild = it.children.some(c => isActive(c.href));
                return <div key={it.id}>
                  <button onClick={() => toggleGroup(it.id)} aria-expanded={open} title={collapsed && !mobile ? it.label : undefined}
                    className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium ${activeChild ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                    <span className="w-5 text-center" aria-hidden>{it.icon}</span>
                    {(!collapsed || mobile) && <span className="flex-1 text-left">{it.label}</span>}
                    {(!collapsed || mobile) && <span aria-hidden>{open ? '▾' : '▸'}</span>}
                  </button>
                  {open && (!collapsed || mobile) && <div className="ml-4 mt-1 border-l-2 border-primary/60 pl-2">
                    {it.children.map(c => (
                      <Link key={c.id} href={c.href!} aria-current={isActive(c.href) ? 'page' : undefined}
                        className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm ${isActive(c.href) ? 'bg-primary/20 font-semibold text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                        <span className="w-4 text-center" aria-hidden>{c.icon}</span>{c.label}
                        {c.badge === 'pending' && pending !== null && pending > 0 && <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-white">{pending}</span>}
                      </Link>))}
                  </div>}
                </div>;
              }
              return <Link key={it.id} href={it.href!} aria-current={isActive(it.href) ? 'page' : undefined} title={collapsed && !mobile ? it.label : undefined}
                className={`relative mb-0.5 flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium ${isActive(it.href) ? 'bg-primary/20 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                {isActive(it.href) && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" aria-hidden />}
                <span className="w-5 text-center" aria-hidden>{it.icon}</span>
                {(!collapsed || mobile) && <span>{it.label}</span>}
              </Link>;
            })}
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-[12px] px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold" title={admin.display_name || admin.name || admin.email || 'Admin'}>{initials(admin.display_name || admin.name || admin.email || 'Admin', admin.email)}</span>
          {(!collapsed || mobile) && <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{admin.display_name || admin.name || admin.email || 'Admin'}</p><p className="truncate text-xs text-slate-400">{admin.role || 'admin'}</p></div>}
          {(!collapsed || mobile) && <button onClick={signOut} className="rounded-[8px] px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10" title="Sign out">Sign out</button>}
        </div>
        {collapsed && !mobile && <button onClick={signOut} className="mt-1 w-full rounded-[8px] px-2 py-1 text-xs text-slate-300 hover:bg-white/10">Sign out</button>}
      </div>
    </div>
  );
  if (auth === 'checking') {
    return <div className="flex min-h-screen items-center justify-center bg-soft text-sm text-muted" role="status">Loading…</div>;
  }
  return (
    <div className="flex min-h-screen bg-soft text-ink">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden transition-all lg:block ${collapsed ? 'w-[72px]' : 'w-[264px]'}`} aria-label="Sidebar">
        {sidebar(false)}
        <button className="absolute -right-0 top-[68px] z-50 hidden h-7 w-7 translate-x-1/2 items-center justify-center rounded-full border border-line bg-surface text-sm font-bold text-ink shadow-md hover:bg-soft lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={toggleCollapsed}>{collapsed ? '»' : '«'}</button>
      </aside>
      {drawer && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} /> <aside className="absolute inset-y-0 left-0">{sidebar(true)}</aside></div>}
      <div className={`flex min-w-0 flex-1 flex-col ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[264px]'}`}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
          <button className="rounded-[10px] px-3 py-2 text-lg hover:bg-soft lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}>☰</button>
          <div className="min-w-0 flex-1"><h1 className="truncate text-base font-bold">{title}</h1>{breadcrumb && <p className="truncate text-xs text-muted">{breadcrumb}</p>}</div>
          <Link href="/payments/requests" title="Payment requests awaiting approval" className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-soft">
            Pending payment approvals {pending !== null && pending > 0 ? <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{pending}</span> : <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-muted">{pending ?? 0}</span>}
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
