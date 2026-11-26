'use client';
import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnimatedOpen } from '@/lib/useAnimatedOpen';

function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseISO(iso: string) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
function fmtShort(iso: string) {
  return parseISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Small custom date-range picker: no new dependency. The selected range
// highlights in the calendar — start and end dates dark (indigo), the days
// between them light indigo. Click once to set the start, again to set the end.
export function DateRangePicker({ value, onChange }: { value: { from: string; to: string }; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = React.useState(false);
  // Popover enter/exit: stays mounted ~180ms after closing so the
  // fade/scale-out can play instead of vanishing instantly.
  const { mounted: popMounted, visible: popVisible } = useAnimatedOpen(open, 180);
  const [view, setView] = React.useState(() => { const d = parseISO(value.to); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [start, setStart] = React.useState<string | null>(value.from);
  const [end, setEnd] = React.useState<string | null>(value.to);
  const [hover, setHover] = React.useState<string | null>(null);
  const today = toISO(new Date());

  // Keep the picker's selection in sync when the range changes from outside
  // (e.g. a preset button), but only while the popover is closed.
  React.useEffect(() => { if (!open) { setStart(value.from); setEnd(value.to); } }, [value.from, value.to, open]);

  // Escape closes the popover too — the backdrop only handles outside
  // clicks, and while open it sits above the controls it covers.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday-first
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISO(new Date(view.y, view.m, d)));

  const inRange = (iso: string) => {
    const hi = end || hover;
    if (!start || !hi) return false;
    const [a, b] = start <= hi ? [start, hi] : [hi, start];
    return iso > a && iso < b;
  };
  const isEndpoint = (iso: string) => iso === start || iso === end;

  const pick = (iso: string) => {
    if (iso > today) return;
    if (!start || (start && end)) { setStart(iso); setEnd(null); return; }
    if (iso < start) { setStart(iso); return; }
    setEnd(iso);
    onChange(start, iso);
    setOpen(false);
  };

  const monthName = new Date(view.y, view.m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const shiftMonth = (dir: number) => {
    const d = new Date(view.y, view.m + dir, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  return <div className="relative">
    <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-soft">
      <Calendar size={15} />
      <span>{fmtShort(value.from)} – {fmtShort(value.to)}</span>
    </button>
    {popMounted && <>
      <div className={`fixed inset-0 z-40 transition-opacity duration-150 ${popVisible ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <div className={`absolute right-0 z-50 mt-2 w-[300px] rounded-[16px] border border-line bg-surface p-4 shadow-lg transition-all duration-150 ${popVisible ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'}`} style={{ transformOrigin: 'top right' }}>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className="rounded-[8px] p-1.5 transition-colors hover:bg-soft"><ChevronLeft size={16} /></button>
          <p className="text-sm font-semibold text-ink">{monthName}</p>
          <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className="rounded-[8px] p-1.5 transition-colors hover:bg-soft"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-muted">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((iso, i) => {
            if (!iso) return <div key={`blank-${i}`} />;
            const future = iso > today;
            const endpoint = isEndpoint(iso);
            const between = inRange(iso);
            return <button key={iso} type="button" disabled={future} onClick={() => pick(iso)} onMouseEnter={() => setHover(iso)} onMouseLeave={() => setHover(null)}
              className={`rounded-full py-1.5 text-sm transition-colors ${future ? 'cursor-not-allowed text-line' : endpoint ? 'bg-primary font-semibold text-white' : between ? 'bg-primary/15 font-medium text-ink' : 'text-ink hover:bg-soft'}`}>
              {parseISO(iso).getDate()}
            </button>;
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          {start && !end ? `Start: ${fmtShort(start)} — now pick the end date.` : 'Pick a start date, then an end date.'}
        </p>
      </div>
    </>}
  </div>;
}
