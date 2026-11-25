import React from 'react';
import { ACCENT2, SP2, R2 } from '../../constants';

// ─── StatSpark (Design System v2) ────────────────────────────────────────────
// A percentage with its recent trend: tiny month bars, then the current figure — one line,
// sized to sit inside a StatGroup value (replaces the old mini progress rings).
//
//   ▂▃▅▆▇  75%
//
//   <StatGroup items={[{ icon: 'ti-home-check', label: 'Occupancy', accent: ACCENT2.teal,
//     value: <StatSpark value={75} trend={[{ label: 'Jun', value: 60 }, …]} accent={ACCENT2.teal} /> }]} />
//
// Props: value (0–100, the figure shown) · trend ([{ label, value 0–100 }], oldest → newest; the
//        newest bar is the current month) · accent (ACCENT2, default blue) · label (aria / title)
// Bars scale against 100%, so heights read as the real rate. Older months use the accent's light
// stop; the newest bar runs the full accent gradient. Bars grow in on load (un2-grow-y).

const BAR_W = 4;
const BAR_H = 20;   // px — tallest bar (100%); fits the 15px stat line without growing the row

const S = {
  wrap: { display: 'inline-flex', alignItems: 'center', gap: SP2.sm },
  bars: { display: 'inline-flex', alignItems: 'flex-end', gap: SP2.xxs + 1, height: BAR_H },
  bar:  { width: BAR_W, borderRadius: R2.pill },
};

const clamp = v => Math.max(0, Math.min(100, Number(v) || 0));

export default function StatSpark({ value = 0, trend = [], accent = ACCENT2.blue, label }) {
  const v = clamp(value);
  const [from, to] = accent.bar;
  const last = trend.length - 1;
  const desc = trend.map(t => `${t.label} ${clamp(t.value)}%`).join(', ');
  return (
    <span style={S.wrap} role="img" aria-label={`${label ? `${label} ` : ''}${v}%${desc ? ` — ${desc}` : ''}`}>
      {trend.length > 0 && (
        <span style={S.bars} aria-hidden="true">
          {trend.map((t, i) => (
            <span
              key={`${t.label}-${i}`}
              className="un2-grow-y"
              title={`${t.label}: ${clamp(t.value)}%`}
              style={{
                ...S.bar,
                height: Math.max(BAR_W, (clamp(t.value) / 100) * BAR_H),
                background: i === last ? `linear-gradient(180deg, ${to}, ${from})` : to,
                opacity: i === last ? 1 : 0.45 + (i / Math.max(1, last)) * 0.35,
                '--un2-delay': `${0.3 + i * 0.05}s`,
              }}
            />
          ))}
        </span>
      )}
      <span aria-hidden="true">{v}%</span>
    </span>
  );
}
