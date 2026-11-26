import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  DollarSign,
  FileType,
  Gauge,
  Globe,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Mail,
  Megaphone,
  MessageSquare,
  Plug,
  RefreshCw,
  Scale,
  ScrollText,
  Settings,
  Tags,
  TicketPercent,
  UserCog,
  Users,
  Webhook,
} from 'lucide-react';

export type NavItem = { id: string; label: string; href?: string; icon: LucideIcon; perm: string; badge?: 'pending'; children?: NavItem[] };
export type NavGroup = { label: string; items: NavItem[] };
export const NAV: NavGroup[] = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard, perm: 'dashboard' }] },
  { label: 'Customers', items: [
    { id: 'users', label: 'Users', href: '/users', icon: Users, perm: 'users' },
    { id: 'payments', label: 'Payments', icon: CreditCard, perm: 'payments', children: [
      { id: 'requests', label: 'Requests', href: '/payments/requests', icon: Inbox, perm: 'payments', badge: 'pending' },
      { id: 'subscriptions', label: 'Subscriptions', href: '/payments/subscriptions', icon: RefreshCw, perm: 'payments' },
      { id: 'providers', label: 'Providers', href: '/payments/providers', icon: Plug, perm: 'payments' },
      { id: 'webhooks', label: 'Webhook Log', href: '/payments/webhooks', icon: Webhook, perm: 'payments' },
    ]},
  ]},
  { label: 'Catalog', items: [
    { id: 'plans-coupons', label: 'Plans and Coupons', icon: Tags, perm: 'plans', children: [
      { id: 'plans', label: 'Plans', href: '/plans', icon: Layers, perm: 'plans' },
      { id: 'coupons', label: 'Coupons', href: '/coupons', icon: TicketPercent, perm: 'plans' },
    ]},
    { id: 'formats', label: 'Formats', href: '/formats', icon: FileType, perm: 'formats' },
  ]},
  { label: 'Monetization', items: [
    { id: 'ads', label: 'Ads', icon: Megaphone, perm: 'ads', children: [
      { id: 'slots', label: 'Slots', href: '/ads/slots', icon: LayoutGrid, perm: 'ads' },
      { id: 'networks', label: 'Networks and ads.txt', href: '/ads/networks', icon: Globe, perm: 'ads' },
      { id: 'revenue', label: 'Revenue and RPM', href: '/ads/revenue', icon: DollarSign, perm: 'ads' },
    ]},
    { id: 'popups', label: 'Popups and Banners', href: '/popups', icon: MessageSquare, perm: 'popups' },
  ]},
  { label: 'Operations', items: [
    { id: 'jobs', label: 'Jobs', href: '/jobs', icon: ListChecks, perm: 'jobs' },
    { id: 'reports', label: 'Reports', href: '/reports', icon: BarChart3, perm: 'reports' },
  ]},
  { label: 'System', items: [
    { id: 'team', label: 'Team', href: '/team', icon: UserCog, perm: 'team' },
    { id: 'settings', label: 'Settings', icon: Settings, perm: 'settings', children: [
      { id: 'general', label: 'General', href: '/settings/general', icon: Settings, perm: 'settings' },
      { id: 'legal', label: 'Legal pages', href: '/settings/legal', icon: Scale, perm: 'settings' },
      { id: 'email', label: 'Email and templates', href: '/settings/email', icon: Mail, perm: 'settings' },
      { id: 'limits', label: 'Limits and retention', href: '/settings/limits', icon: Gauge, perm: 'settings' },
      { id: 'danger', label: 'Danger zone', href: '/settings/danger', icon: AlertTriangle, perm: 'settings' },
    ]},
    { id: 'audit', label: 'Audit Log', href: '/audit', icon: ScrollText, perm: 'audit' },
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
