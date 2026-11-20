import React from 'react';
import { C2, ACCENT2, T2, F2, FS2, FW2, LH2, SP2, SZ2, pad, UI2 } from '../../constants/v2';
import { ProgressRing } from './Charts';

// ─── StatGroup (Design System v2) ────────────────────────────────────────────
// Open summary stats for a page header — NO box (no background / border / shadow).
// Stats sit on the page, split by short hairlines. Each has a small visual:
//   pct given  → mini ProgressRing drawn in the stat's accent colour (Occupancy, Collection)
//   otherwise  → its icon in a soft round accent tint (Total units, Maintenance)
// Type: label = small sentence-case grey (regular) · value = T2.statInline (Inter 16px Medium).
//
//   (▦)  Total units │ ◔  Occupancy │ ◔  Collection │ (⚒)  Maintenance
//        1 Unit      │    0%        │    0%         │      Clear
//
//   <StatGroup items={[
//     { icon: 'ti-building', label: 'Total units', value: '1 Unit', accent: ACCENT2.blue },
//     { label: 'Occupancy', value: '82%', pct: 82, accent: ACCENT2.teal },
//   ]} />
//
// Item: { icon, label, value (node), pct (0–100 → ring instead of icon), accent (ACCENT2, default blue), valueColor }
// size="lg": page-level summary row (Portfolio) — value T2.figureMd (Inter 24px Medium), label T2.label,
//            wider spacing; keeps its size + icons down to tablets (un2-stat-lg in utilities.css).
// Responsive (utilities.css): ≤ 1280px smaller visual + value · ≤ 1100px visuals hide ·
//                             ≤ 860px under the title, full width · ≤ 600px 2 × 2.

const S = {
  group: { fontFamily: F2.body },
  item:  { ...UI2.row(SP2.md), padding: pad(SP2.xs, SP2.xl), minWidth: 0 },
  label: { fontSize: FS2.xs, fontWeight: FW2.regular, lineHeight: LH2.heading, color: C2.textSecondary, whiteSpace: 'nowrap' },
  value: { ...T2.statInline, marginTop: SP2.xxs, whiteSpace: 'nowrap' },   // standard small stat: Inter 16px Medium
  // size="lg"
  itemLg:  { ...UI2.row(SP2.md), padding: pad(SP2.xs, SP2.xxxl), minWidth: 0 },
  labelLg: { ...T2.label, whiteSpace: 'nowrap' },
  valueLg: { ...T2.figureMd, marginTop: SP2.xs, whiteSpace: 'nowrap' },
};

const RING_STROKE = SP2.xs;   // 4px — thin ring at icon size

export default function StatGroup({ items = [], size }) {
  const lg = size === 'lg';
  return (
    <div className={`un2-stat-group un2-stat-open${lg ? ' un2-stat-lg' : ''}`} style={S.group}>
      {items.map(it => {
        const a = it.accent || ACCENT2.blue;
        const hasPct = it.pct != null;
        return (
          <div key={it.label} className="un2-stat" style={lg ? S.itemLg : S.item}>
            {hasPct ? (
              <div className="un2-stat-icon">
                <ProgressRing value={it.pct} size={SZ2.icon.lg} stroke={RING_STROKE} gradient={a.bar} track={a.soft} ariaLabel={`${it.label} ${it.pct}%`} />
              </div>
            ) : it.icon && (
              <div className="un2-stat-icon" style={UI2.iconBox(SZ2.icon.lg, { soft: a.soft, strong: a.fg }, { round: true })}>
                <i className={`ti ${it.icon}`} aria-hidden="true" />
              </div>
            )}
            <div style={UI2.minWidth0}>
              <div style={lg ? S.labelLg : S.label}>{it.label}</div>
              <div className="un2-stat-value" style={{ ...(lg ? S.valueLg : S.value), ...(it.valueColor ? { color: it.valueColor } : {}) }}>{it.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
