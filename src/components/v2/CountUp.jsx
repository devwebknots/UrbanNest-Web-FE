import { useEffect, useRef, useState } from 'react';
import { MOTION2 } from '../../constants/v2';

// ─── CountUp (Design System v2) ──────────────────────────────────────────────
// Animates a number from its previous value (0 on first render) to `value`,
// easing out. Non-numbers ('—' while loading, text) render unchanged.
// Respects prefers-reduced-motion (jumps straight to the value).
//
//   <CountUp value={428500} format={v => '$' + Math.round(v).toLocaleString()} />
//   <CountUp value={96.4} format={v => v.toFixed(1) + '%'} />
//
// Props: value, format (number → display string; default rounds), duration (ms, MOTION2.countMs)

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeOut = t => 1 - Math.pow(1 - t, 3);
const round = v => Math.round(v).toLocaleString('en-US');

export default function CountUp({ value, format = round, duration = MOTION2.countMs }) {
  const target = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const [shown, setShown] = useState(target === null ? null : (reduceMotion() ? target : 0));
  const fromRef = useRef(0);

  useEffect(() => {
    if (target === null) return undefined;
    if (reduceMotion()) { setShown(target); fromRef.current = target; return undefined; }
    const from = fromRef.current;
    let raf;
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      setShown(from + (target - from) * easeOut(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  if (target === null) return value ?? null;
  return format(shown ?? target);
}
