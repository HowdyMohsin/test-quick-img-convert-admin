import { useEffect, useRef, useState } from 'react';

// Drives enter/exit animations for things that mount conditionally
// (Modal, mobile drawer, popovers): keeps the element mounted while it
// fades/slides out, then unmounts it. `visible` is false on the first
// paint so the CSS transition runs from the hidden state to the shown
// one; when `open` turns false it flips back and unmounts after `ms`.
export function useAnimatedOpen(open: boolean, ms = 200) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (timer.current) clearTimeout(timer.current);
      setMounted(true);
      // Two frames: paint the hidden state first, then transition in.
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    timer.current = setTimeout(() => setMounted(false), ms);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [open, ms]);

  return { mounted, visible };
}
