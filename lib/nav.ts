export type NavItem = { id: string; label: string; href?: string; icon: string; perm: string; badge?: 'pending'; children?: NavItem[] };
export type NavGroup = { label: string; items: NavItem[] };
export const NAV: NavGroup[] = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', href: '/', icon: '▦', perm: 'dashboard' }] },
  { label: 'Customers', items: [
    { id: 'users', label: 'Users', href: '/users', icon: '◉', perm: 'users' },
    { id: 'payments', label: 'Payments', icon: '▤', perm: 'payments', children: [
      { id: 'requests', label: 'Requests', href: '/payments/requests', icon: '✉', perm: 'payments', badge: 'pending' },
      { id: 'subscriptions', label: 'Subscriptions', href: '/payments/subscriptions', icon: '↻', perm: 'payments' },
      { id: 'providers', label: 'Providers', href: '/payments/providers', icon: '⬡', perm: 'payments' },
      { id: 'webhooks', label: 'Webhook Log', href: '/payments/webhooks', icon: '⌁', perm: 'payments' },
    ]},
  ]},
  { label: 'Catalog', items: [
    { id: 'plans-coupons', label: 'Plans and Coupons', icon: '❖', perm: 'plans', children: [
      { id: 'plans', label: 'Plans', href: '/plans', icon: '▣', perm: 'plans' },
      { id: 'coupons', label: 'Coupons', href: '/coupons', icon: '✂', perm: 'plans' },
    ]},
    { id: 'formats', label: 'Formats', href: '/formats', icon: '⧉', perm: 'formats' },
  ]},
  { label: 'Monetization', items: [
    { id: 'ads', label: 'Ads', icon: '▭', perm: 'ads', children: [
      { id: 'slots', label: 'Slots', href: '/ads/slots', icon: '▤', perm: 'ads' },
      { id: 'networks', label: 'Networks and ads.txt', href: '/ads/networks', icon: '🌐', perm: 'ads' },
      { id: 'revenue', label: 'Revenue and RPM', href: '/ads/revenue', icon: '$', perm: 'ads' },
    ]},
    { id: 'popups', label: 'Popups and Banners', href: '/popups', icon: '▢', perm: 'popups' },
  ]},
  { label: 'Operations', items: [
    { id: 'jobs', label: 'Jobs', href: '/jobs', icon: '☰', perm: 'jobs' },
    { id: 'reports', label: 'Reports', href: '/reports', icon: '📊', perm: 'reports' },
  ]},
  { label: 'System', items: [
    { id: 'team', label: 'Team', href: '/team', icon: '👥', perm: 'team' },
    { id: 'settings', label: 'Settings', icon: '⚙', perm: 'settings', children: [
      { id: 'general', label: 'General', href: '/settings/general', icon: '⚙', perm: 'settings' },
      { id: 'legal', label: 'Legal pages', href: '/settings/legal', icon: '§', perm: 'settings' },
      { id: 'email', label: 'Email and templates', href: '/settings/email', icon: '✉', perm: 'settings' },
      { id: 'limits', label: 'Limits and retention', href: '/settings/limits', icon: '◷', perm: 'settings' },
      { id: 'danger', label: 'Danger zone', href: '/settings/danger', icon: '⚠', perm: 'settings' },
    ]},
    { id: 'audit', label: 'Audit Log', href: '/audit', icon: '≡', perm: 'audit' },
  ]},
];
export const ALL_PERMS = ['dashboard','users','payments','plans','formats','ads','popups','jobs','reports','team','settings','audit'];
export function canSee(perm: string, permissions: any, role?: string): boolean {
  if (role === 'super_admin') return true;
  if (!permissions) return true;
  if (Array.isArray(permissions)) {
    if (permissions.length === 0) return true;
    return permissions.includes(perm) || permissions.includes('*');
  }
  if (typeof permissions === 'object') {
    const v = permissions[perm];
    if (v === undefined) return true;
    if (typeof v === 'object') return !!(v.read || v.write);
    return !!v;
  }
  return true;
}
export function filterNav(permissions: any, role?: string): NavGroup[] {
  return NAV.map(g => ({ ...g, items: g.items.filter(it => {
    if (it.children) { const kids = it.children.filter(c => canSee(c.perm, permissions, role)); return kids.length > 0; }
    return canSee(it.perm, permissions, role);
  }).map(it => it.children ? { ...it, children: it.children.filter(c => canSee(c.perm, permissions, role)) } : it) })).filter(g => g.items.length > 0);
}
