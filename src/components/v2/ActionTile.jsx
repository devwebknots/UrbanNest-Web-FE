import React from 'react';
import { TONES2, G2, R2, SH2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── ActionTile (Design System v2) ───────────────────────────────────────────
// Small tinted tile: icon · title · subtitle. Put 2×2 in <Grid layout="two" as="div">.
//
//   <ActionTile tone={TONES2.warning} icon="ti-clock" title="Lease renewal due" subtitle="Unit A1 · 14 days" />

const S = {
  tile: (t, clickable) => ({
    ...UI2.stack(SP2.xs), padding: pad(SP2.md, SP2.md), borderRadius: R2.lg,
    background: G2.panel(t), border: `1px solid ${t.panelBorder}`, boxShadow: SH2.tile,
    cursor: clickable ? 'pointer' : 'default', textAlign: 'left', minWidth: 0,
  }),
};

export default function ActionTile({ tone = TONES2.primary, icon, title, subtitle, onClick }) {
  return (
    <div className={onClick ? 'un2-raise' : undefined} style={S.tile(tone, !!onClick)} onClick={onClick}>
      {icon && (
        <div style={{ ...UI2.iconBox(SZ2.icon.sm, tone, { round: true }), background: 'transparent', marginBottom: SP2.xs }}>
          <i className={`ti ${icon}`} aria-hidden="true" />
        </div>
      )}
      <div style={{ ...UI2.text.title, ...UI2.truncate }}>{title}</div>
      {subtitle && <div style={{ ...UI2.text.meta, ...UI2.truncate }}>{subtitle}</div>}
    </div>
  );
}
