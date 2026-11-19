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
// Responsive (utilities.css): ≤ 1280px smaller visual + value · ≤ 1100px visuals hide ·
//                             ≤ 860px under the title, full width · ≤ 600px 2 × 2.

const S = {
  group: { fontFamily: F2.body },
  item:  { ...UI2.row(SP2.md), padding: pad(SP2.xs, SP2.xl), minWidth: 0 },
  label: { fontSize: FS2.xs, fontWeight: FW2.regular, lineHeight: LH2.heading, color: C2.textSecondary, whiteSpace: 'nowrap' },
  value: { ...T2.statInline, marginTop: SP2.xxs, whiteSpace: 'nowrap' },   // standard small stat: Inter 16px Medium
};

const RING_STROKE = SP2.xs;   // 4px — thin ring at icon size

export default function StatGroup({ items = [] }) {
  return (
    <div className="un2-stat-group un2-stat-open" style={S.group}>
      {items.map(it => {
        const a = it.accent || ACCENT2.blue;
        const hasPct = it.pct != null;
        return (
          <div key={it.label} className="un2-stat" style={S.item}>
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
              <div style={S.label}>{it.label}</div>
              <div className="un2-stat-value" style={{ ...S.value, ...(it.valueColor ? { color: it.valueColor } : {}) }}>{it.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
