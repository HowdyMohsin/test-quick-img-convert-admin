export function fmt(n: any): string {
  if (n === null || n === undefined || n === '') return '—';
  if (typeof n === 'number') return n.toLocaleString('en-US');
  return String(n);
}
export function money(cents: any, currency = 'USD'): string {
  if (cents === null || cents === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents as number) / 100);
}
export function pct(n: any): string { return n === null || n === undefined ? '—' : `${Number(n).toFixed(1)}%`; }
export function timeAgo(iso: any): string {
  if (!iso) return '—';
  const d = new Date(iso); if (isNaN(d.getTime())) return String(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function fmtDate(iso: any): string {
  if (!iso) return '—';
  const d = new Date(iso); return isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
}
export function downloadCsv(filename: string, rows: any[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
export function initials(name: string, email: string): string {
  const src = (name || email || '?').trim();
  return src.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
}
