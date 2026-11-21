import React from 'react';
import { C2, G2, TONES2, FS2, FW2, R2, SP2, SZ2, UI2 } from '../../constants/v2';

// ─── MetricBar (Design System v2) ────────────────────────────────────────────
// Label · value on one line, a thin progress bar under it.
// Works on light cards and on dark cards (dark).
//
//   <MetricBar label="Occupancy" value="92%" pct={92} tone={TONES2.success} />
//   <MetricBar dark label="Maintenance" value="Clear" pct={100} tone={TONES2.success} valueTone />
//
// Props: label, value, pct (0–100), tone (bar colour), valueTone (colour the value too), dark,
//        gradient (true → the standard green gradient G2.successBar, or any CSS gradient string)
//   <MetricBar label="Maintenance" value="Clear" pct={100} tone={TONES2.success} valueTone gradient />

export default function MetricBar({ label, value, pct = 0, tone = TONES2.primary, valueTone = false, dark = false, gradient }) {
  // Standard fill: red / green tones always use their gradient (G2.toneFill); `gradient` can still force one
  const fill = gradient ? (gradient === true ? G2.successBar : gradient) : (dark ? tone.wave : G2.toneFill(tone));
  const w = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div style={UI2.stack(SP2.xs)}>
      <div style={UI2.rowBetween()}>
        <span style={{ fontSize: FS2.sm, color: dark ? C2.onDark.textSoft : C2.textSecondary }}>{label}</span>
        <span style={{
          fontSize: FS2.sm, fontWeight: FW2.semibold,
          color: valueTone ? (dark ? tone.wave : tone.strong) : (dark ? C2.white : C2.textPrimary),
        }}>{value}</span>
      </div>
      <div style={{ height: SZ2.progress, borderRadius: R2.pill, overflow: 'hidden', background: dark ? C2.onDark.surfaceHover : C2.surfaceMuted }}>
        <div className="un2-grow-x" style={{ width: `${w}%`, height: '100%', borderRadius: R2.pill, background: fill }} />
      </div>
    </div>
  );
}
