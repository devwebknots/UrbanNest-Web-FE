import React, { useState } from 'react';
import { C2, G2, R2, SH2, FS2, FW2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants/v2';

// ─── MediaListItem (Design System v2) ────────────────────────────────────────
// Glass tile: photo (status tag on it) · title · subtitle · label/value rows · chevron.
// Used for units, listings, vendors — anything with a photo and a few facts.
//
//   <MediaListItem
//     image={unit.main_image_url} fallbackIcon="ti-home"
//     tag={{ tone: TONES2.neutral, label: 'VACANT' }}
//     title="LL01 — Unit 101" subtitle="Vacant"
//     details={[{ label: 'Lease ends', value: '—' },
//               { label: 'Maintenance', value: 'Clear', color: C2.successStrong }]}
//     onClick={() => …} />
//
// Optional:
//   actions          buttons instead of the chevron (e.g. View Unit · Message)
//   actionsPosition  'side' (default, right of the text) | 'below' (under the details — narrow cards)
//   size             'md' (default) | 'lg' — bigger photo, for one featured item
//   stacked          true → vertical card with the standard card shadow (SH2.card, lifts on hover):
//                    photo on top · title · subtitle · details as small label-over-value columns
//                    between hairlines · actions pinned to the bottom.
//                    For fixed-width cards in a sideways-scrolling row (e.g. Unit Inventory).
//
// A missing / broken image shows a soft placeholder with fallbackIcon.

const S = {
  item: (clickable) => ({
    ...UI2.tile, display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: SP2.lg, padding: SP2.sm,
    cursor: clickable ? 'pointer' : 'default', minWidth: 0,
  }),
  thumb: (lg) => ({
    position: 'relative', flexShrink: 0,
    width: lg ? SZ2.thumbFeature.w : SZ2.thumbXl.w, minHeight: lg ? SZ2.thumbFeature.h : SZ2.thumbXl.h,
    borderRadius: R2.lg, overflow: 'hidden', background: C2.surfaceMuted, boxShadow: SH2.md,
  }),
  img:   { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  shade: { position: 'absolute', inset: 0, background: G2.thumbShade },
  ph:    { ...UI2.center, position: 'absolute', inset: 0, color: C2.textMuted, fontSize: FS2.xxxl },
  tag:   { position: 'absolute', top: SP2.sm, right: SP2.sm, boxShadow: SH2.sm },
  body:  { ...UI2.stack(SP2.xxs), justifyContent: 'center', flex: 1, minWidth: SZ2.thumbXl.w, padding: pad(SP2.xs, 0) },
  title: (lg) => ({ ...(lg ? UI2.text.stat : UI2.text.titleLg), ...UI2.truncate }),
  sub:   { ...UI2.text.label, marginBottom: SP2.xs },
  row:   { display: 'flex', gap: SP2.md, fontSize: FS2.sm },
  lbl:   { color: C2.textSecondary, minWidth: SZ2.detailLabel },
  val:   { fontWeight: FW2.semibold, color: C2.textPrimary },
  chev:  { ...UI2.chevron, alignSelf: 'center', paddingRight: LAYOUT2.inlineGap },
  actions: { ...UI2.row(LAYOUT2.inlineGap), flexWrap: 'wrap', alignSelf: 'center', padding: pad(0, SP2.md) },
  actionsBelow: { ...UI2.row(LAYOUT2.inlineGap), flexWrap: 'wrap', marginTop: SP2.sm },

  // ── stacked card ──
  card: {
    ...UI2.tile, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', minWidth: 0,
    padding: SP2.sm, borderRadius: R2.xl, boxShadow: SH2.card,
  },
  cardThumb: {
    position: 'relative', flexShrink: 0, width: '100%', height: SZ2.thumbFeature.h,
    borderRadius: R2.lg, overflow: 'hidden', background: C2.surfaceMuted,
  },
  cardBody:  { ...UI2.stack(SP2.xxs), flex: 1, padding: pad(SP2.md, SP2.xs, SP2.xs) },
  cardHead:  { ...UI2.rowBetween(SP2.sm) },
  cardFacts: {
    display: 'flex', gap: SP2.md, margin: pad(SP2.sm, 0), padding: pad(SP2.sm, 0),
    borderTop: `${SZ2.hairline}px solid ${C2.border}`, borderBottom: `${SZ2.hairline}px solid ${C2.border}`,
  },
  fact:      { ...UI2.stack(SP2.xxs), flex: 1, minWidth: 0 },
  factVal:   { fontSize: FS2.sm, fontWeight: FW2.semibold, color: C2.textPrimary, ...UI2.truncate },
  cardActions: { ...UI2.row(LAYOUT2.inlineGap), marginTop: 'auto', paddingTop: SP2.xs },
};

function Photo({ image, fallbackIcon, tag, style }) {
  const [broken, setBroken] = useState(false);
  return (
    <div style={style}>
      {image && !broken
        ? <><img src={image} alt="" style={S.img} onError={() => setBroken(true)} /><div style={S.shade} /></>
        : <div style={S.ph}><i className={`ti ${fallbackIcon}`} aria-hidden="true" /></div>}
      {tag && <span style={{ ...UI2.tag(tag.tone), ...S.tag }}>{tag.label}</span>}
    </div>
  );
}

export default function MediaListItem({
  image, fallbackIcon = 'ti-photo', tag, title, subtitle, details = [], onClick,
  actions, actionsPosition = 'side', size = 'md', stacked = false,
}) {
  const stop = e => e.stopPropagation();

  if (stacked) {
    return (
      <div className="un2-hover-lift" style={{ ...S.card, ...(onClick ? { cursor: 'pointer' } : {}) }} onClick={onClick}>
        <Photo image={image} fallbackIcon={fallbackIcon} tag={tag} style={S.cardThumb} />
        <div style={S.cardBody}>
          <div style={S.cardHead}>
            <div style={S.title(false)}>{title}</div>
            {onClick && <i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />}
          </div>
          {subtitle && <div style={UI2.text.label}>{subtitle}</div>}
          {details.length > 0 && (
            <div style={S.cardFacts}>
              {details.map(d => (
                <div key={d.label} style={S.fact}>
                  <span style={UI2.text.caption}>{d.label}</span>
                  <span style={{ ...S.factVal, ...(d.color ? { color: d.color } : {}) }}>{d.value}</span>
                </div>
              ))}
            </div>
          )}
          {actions && <div style={S.cardActions} onClick={stop}>{actions}</div>}
        </div>
      </div>
    );
  }

  const lg = size === 'lg';
  const below = actions && actionsPosition === 'below';
  return (
    <div className={onClick ? 'un2-raise' : undefined} style={S.item(!!onClick)} onClick={onClick}>
      <Photo image={image} fallbackIcon={fallbackIcon} tag={tag} style={S.thumb(lg)} />
      <div style={S.body}>
        <div style={S.title(lg)}>{title}</div>
        {subtitle && <div style={S.sub}>{subtitle}</div>}
        {details.map(d => (
          <div key={d.label} style={S.row}>
            <span style={S.lbl}>{d.label}</span>
            <span style={{ ...S.val, ...(d.color ? { color: d.color } : {}) }}>{d.value}</span>
          </div>
        ))}
        {below && <div style={S.actionsBelow} onClick={stop}>{actions}</div>}
      </div>
      {actions && !below
        ? <div style={S.actions} onClick={stop}>{actions}</div>
        : onClick && <i className="ti ti-chevron-right" style={S.chev} aria-hidden="true" />}
    </div>
  );
}
