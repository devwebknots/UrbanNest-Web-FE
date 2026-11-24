import React from 'react';
import { TONES2, G2, R2, SH2, F2, FS2, SP2, SZ2, pad, UI2 } from '../../constants';

// ─── ActionTile (Design System v2) ───────────────────────────────────────────
// Small tinted tile: icon · title · subtitle. Put 2×2 in <Grid layout="two" as="div">.
//
//   <ActionTile tone={TONES2.warning} icon="ti-clock" title="Lease renewal due" subtitle="Unit A1 · 14 days" />
//   <ActionTile tone={TONES2.primary} icon="ti-file-text" title="Lease Details" centered onClick={…} />
//
// Props: tone, icon, title, subtitle, onClick,
//        centered (shortcut tile: round tinted icon above a centred title, e.g. unit quick links),
//        plain    (quick-action shortcut, NO tile: rounded-square tinted icon above a centred label —
//                  put them in a 2 × 2 grid with UI2.quickActions, e.g. Portfolio → Quick Actions)
//   <ActionTile plain tone={TONES2.primary} icon="ti-file-text" title="Lease Details" onClick={…} />

// plain: icon box (rounded square, soft tint) + label, no tile surface — the icon lifts on hover
function PlainAction({ tone, icon, title, onClick }) {
  return (
    <button type="button" style={S.plain} onClick={onClick}>
      <span className="un2-raise" style={{ ...UI2.iconBox(SZ2.icon.lg, tone), borderRadius: R2.lg, fontSize: FS2.xl }}>
        <i className={`ti ${icon}`} aria-hidden="true" />
      </span>
      <span style={S.plainLbl}>{title}</span>
    </button>
  );
}

const S = {
  plain:    { ...UI2.stack(SP2.sm), alignItems: 'center', minWidth: 0, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: F2.body },
  plainLbl: { ...UI2.text.rowTitle, textAlign: 'center' },
  tile: (t, clickable, centered) => ({
    ...UI2.stack(SP2.xs), padding: pad(SP2.md, SP2.md), borderRadius: R2.lg,
    background: centered ? G2.glassTile : G2.panel(t), border: `1px solid ${centered ? t.cardBorder : t.panelBorder}`, boxShadow: SH2.tile,
    cursor: clickable ? 'pointer' : 'default', textAlign: centered ? 'center' : 'left', minWidth: 0,
    ...(centered ? { alignItems: 'center', justifyContent: 'center', gap: SP2.sm } : {}),
  }),
};

export default function ActionTile({ tone = TONES2.primary, icon, title, subtitle, onClick, centered = false, plain = false }) {
  if (plain) return <PlainAction tone={tone} icon={icon} title={title} onClick={onClick} />;
  const iconStyle = centered
    ? UI2.iconBox(SZ2.icon.md, tone, { round: true })
    : { ...UI2.iconBox(SZ2.icon.sm, tone, { round: true }), background: 'transparent', marginBottom: SP2.xs };
  const clickProps = onClick
    ? { onClick, role: 'button', tabIndex: 0, onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } }
    : {};
  return (
    <div className={onClick ? 'un2-raise' : undefined} style={S.tile(tone, !!onClick, centered)} {...clickProps}>
      {icon && (
        <div style={iconStyle}>
          <i className={`ti ${icon}`} aria-hidden="true" />
        </div>
      )}
      <div style={{ ...UI2.text.title, ...UI2.truncate, maxWidth: '100%' }}>{title}</div>
      {subtitle && <div style={{ ...UI2.text.meta, ...UI2.truncate, maxWidth: '100%' }}>{subtitle}</div>}
    </div>
  );
}
