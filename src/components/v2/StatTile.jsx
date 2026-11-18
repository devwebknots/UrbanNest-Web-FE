import React from 'react';
import { C2, TONES2, FS2, FW2, LH2, SP2, SZ2, UI2 } from '../../constants/v2';

// ─── StatTile (Design System v2) ─────────────────────────────────────────────
// Small frosted tile: round tinted icon · big value · label. Put 4 in a
// <Grid layout="two" as="div"> for a 2×2 snapshot (e.g. Property Snapshot).
//
//   <StatTile icon="ti-box" label="Total Units" value={1} />
//   <StatTile icon="ti-check" label="Maintenance" value="Clear" tone={TONES2.success} labelFirst />
//
// Props: icon, label, value, tone (TONES2 — tints the icon; status value colour), labelFirst
//   labelFirst = status tile: label on top, value is a word ("Clear") → standard title text
//   (UI2.text.titleLg) in the tone's text colour instead of the big number style.

const S = {
  tile:   { ...UI2.tile, ...UI2.row(SP2.md), padding: SP2.md, minWidth: 0 },
  value:  { fontSize: FS2.xxl, fontWeight: FW2.bold, lineHeight: LH2.tight, color: C2.textPrimary },
  status: (tone) => ({ ...UI2.text.titleLg, color: tone === TONES2.primary ? C2.textPrimary : tone.fg }),
  label:  { ...UI2.text.label, ...UI2.truncate },
};

export default function StatTile({ icon, label, value, tone = TONES2.primary, labelFirst = false }) {
  return (
    <div style={S.tile}>
      <div style={UI2.iconBox(SZ2.icon.lg, tone, { round: true })}><i className={`ti ${icon}`} aria-hidden="true" /></div>
      <div style={UI2.minWidth0}>
        {labelFirst && <div style={S.label}>{label}</div>}
        <div style={labelFirst ? S.status(tone) : S.value}>{value}</div>
        {!labelFirst && <div style={S.label}>{label}</div>}
      </div>
    </div>
  );
}
