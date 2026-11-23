import React from 'react';
import { C2, TONES2, R2, SH2, FS2, FW2, LH2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants';

// ─── StatTile (Design System v2) ─────────────────────────────────────────────
// Small frosted tile: round tinted icon · big value · label. Put 4 in a
// <Grid layout="two" as="div"> for a 2×2 snapshot (e.g. Property Snapshot).
//
//   <StatTile icon="ti-box" label="Total Units" value={1} />
//   <StatTile icon="ti-check" label="Maintenance" value="Clear" tone={TONES2.success} labelFirst />
//   <StatTile icon="ti-wallet" label="Rent This Month" value="$0" tone={TONES2.purple}
//             labelAbove raised valueColor={C2.successStrong} />          ← page-level KPI row
//
// Props: icon, label, value, tone (TONES2 — tints the icon; status value colour), labelFirst,
//        labelAbove, raised, valueColor
//   labelFirst = status tile: label on top, value is a word ("Clear") → standard title text
//                (UI2.text.titleLg) in the tone's text colour instead of the big number style.
//   labelAbove = label on top of a big number (KPI summary row).
//   raised     = stands on the page (not inside a card): card shadow, card radius, roomier padding.
//                Put 4 in <Grid layout="four">.
//   valueColor = colour of the big value (e.g. C2.successStrong for money collected).
// Narrow tiles (< CQ2.xs) hide the icon so value + label keep the full width.

const S = {
  // Borderless tile: no outline / hairline ring, just the soft tile lift (SH2.tile)
  tile:   { ...UI2.tile, ...UI2.row(SP2.md), padding: SP2.md, minWidth: 0, border: 'none', boxShadow: SH2.tile },
  raised: { ...UI2.card, ...UI2.row(SP2.md), padding: pad(SP2.md, LAYOUT2.cardY), borderRadius: R2.xl, boxShadow: SH2.card, minWidth: 0 },
  value:  { fontSize: FS2.xxl, fontWeight: FW2.semibold, lineHeight: LH2.tight, color: C2.textPrimary, ...UI2.truncate },
  valueSm:{ fontSize: FS2.lg, fontWeight: FW2.semibold },   // 16px / 600
  status: (tone) => ({ ...UI2.text.titleLg, color: tone === TONES2.primary ? C2.textPrimary : tone.fg }),
  label:  { ...UI2.text.label, ...UI2.truncate },
};

export default function StatTile({
  icon, label, value, tone = TONES2.primary, labelFirst = false, labelAbove = false, raised = false, valueColor,
}) {
  const top = labelFirst || labelAbove;
  // In-card tiles (snapshot 2×2) use a smaller value: 16px / semibold. Raised page tiles keep the big KPI number.
  const valueStyle = labelFirst ? S.status(tone) : { ...S.value, ...(raised ? {} : S.valueSm), ...(valueColor ? { color: valueColor } : {}) };
  return (
    <div className={raised ? 'un2-cq un2-hover-lift' : 'un2-cq'} style={raised ? S.raised : S.tile}>
      {/* icon hides on very narrow tiles (un2-hide-xs) so the label never gets cut */}
      <div className="un2-hide-xs" style={UI2.iconBox(SZ2.icon.lg, tone, { round: true })}><i className={`ti ${icon}`} aria-hidden="true" /></div>
      <div style={UI2.minWidth0}>
        {top && <div style={S.label}>{label}</div>}
        <div style={valueStyle}>{value}</div>
        {!top && <div style={S.label}>{label}</div>}
      </div>
    </div>
  );
}
