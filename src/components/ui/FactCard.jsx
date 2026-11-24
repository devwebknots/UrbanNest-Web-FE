import React from 'react';
import { ACCENT2, T2, SP2, SZ2, pad, UI2, LAYOUT2 } from '../../constants';

// ─── FactCard (Design System v2) ─────────────────────────────────────────────
// Compact fact tile for a detail page's summary row: caps label with a small round accent icon
// on the right, the value, and a quiet context line under it. Put 6 in <Grid layout="six">.
//
//   RENT / MO          (₹)
//   $1,200
//   Standard rate
//
//   <Grid layout="six">
//     <FactCard label="Rent / Mo" value="$1,200" sub="Standard rate" icon="ti-cash" accent={ACCENT2.blue} />
//   </Grid>
//
// Props: label, value (node), sub, icon (tabler class), accent (ACCENT2 entry, default blue), loading

const S = {
  card:  { ...UI2.card, ...UI2.stack(SP2.xs), padding: pad(SP2.lg, LAYOUT2.cardX), minWidth: 0 },
  head:  { ...UI2.row(SP2.sm), justifyContent: 'space-between', minWidth: 0 },
  label: { ...UI2.capsLabel, ...UI2.truncate },
  value: { ...T2.statInline, ...UI2.truncate, marginTop: SP2.xs },
  sub:   { ...UI2.text.meta, ...UI2.truncate },
};

export default function FactCard({ label, value, sub, icon, accent = ACCENT2.blue, loading = false }) {
  return (
    <div className="un2-hover-lift" style={S.card}>
      <div style={S.head}>
        <span style={S.label} title={label}>{label}</span>
        {icon && (
          <span style={UI2.iconBox(SZ2.icon.sm, { soft: accent.soft, strong: accent.fg }, { round: true })}>
            <i className={`ti ${icon}`} aria-hidden="true" />
          </span>
        )}
      </div>
      <div style={S.value}>{loading ? '—' : value}</div>
      {sub && <div style={S.sub} title={typeof sub === 'string' ? sub : undefined}>{loading ? ' ' : sub}</div>}
    </div>
  );
}
