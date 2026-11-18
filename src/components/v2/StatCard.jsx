import React from 'react';
import { C2, TONES2, FS2, FW2, LH2, T2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── StatCard (Design System v2) ─────────────────────────────────────────────
// Tinted KPI card: icon box · big value · name · label, a pill in the top
// right and a soft wave in the corner. Put 4 in a `un2-grid-4` section.
//
//   <StatCard tone={TONES2.success} icon="ti-file-text"
//             value={3} name="Signed" label="New leases"
//             pill="+5 this month" pillIcon="ti-arrow-up" />

const S = {
  card:  (t) => ({ ...UI2.toneCard(t), minHeight: SZ2.kpiMin, padding: pad(SP2.lg, SP2.lg, SP2.xl), display: 'flex', gap: SP2.md }),
  pill:  { position: 'absolute', top: SP2.lg, right: SP2.lg },
  value: { ...T2.statValue, marginTop: SP2.xxl },
  name:  { fontSize: FS2.md, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.heading },
  label: { ...UI2.text.label, marginTop: SP2.xxs },
  wave:  { position: 'absolute', right: 0, bottom: 0, width: '62%', height: SZ2.icon.lg + SP2.sm, pointerEvents: 'none' },
};

export function Wave({ color, style }) {
  return (
    <svg style={{ ...S.wave, ...style }} viewBox="0 0 200 56" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 56 C40 52 60 32 100 32 C140 32 160 8 200 4 L200 56 Z" fill={color} opacity="0.35" />
      <path d="M40 56 C80 54 100 40 140 38 C170 36 185 24 200 20 L200 56 Z" fill={color} opacity="0.5" />
    </svg>
  );
}

export default function StatCard({ tone = TONES2.primary, icon, value, name, label, pill, pillIcon, onClick }) {
  return (
    <div className="un2-hover-lift" style={{ ...S.card(tone), ...(onClick ? { cursor: 'pointer' } : {}) }} onClick={onClick}>
      <div style={UI2.iconBox(SZ2.icon.lg, tone)}><i className={`ti ${icon}`} aria-hidden="true" /></div>
      <div style={{ position: 'relative', minWidth: 0 }}>
        <div style={S.value}>{value}</div>
        {name && <div style={S.name}>{name}</div>}
        {label && <div style={S.label}>{label}</div>}
      </div>
      {pill && (
        <span style={{ ...UI2.pill(tone), ...S.pill }}>
          {pillIcon && <i className={`ti ${pillIcon}`} style={{ fontSize: FS2.sm }} aria-hidden="true" />}
          {pill}
        </span>
      )}
      <Wave color={tone.wave} />
    </div>
  );
}
