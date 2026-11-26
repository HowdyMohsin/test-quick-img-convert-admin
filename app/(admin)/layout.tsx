import Shell from '@/components/Shell';

// Shared admin layout: the Shell (sidebar, header, auth guard) mounts
// ONCE for the whole admin section, so navigating between pages only
// swaps the page content — no auth re-check, no full-screen "Loading…"
// blink. Page titles come from the pathname (see Shell).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
