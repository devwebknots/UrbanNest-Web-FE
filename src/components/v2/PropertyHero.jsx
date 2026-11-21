import React, { useState } from 'react';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, LS2, SP2, SZ2, LAYOUT2, pad, UI2, TONES2 } from '../../constants/v2';

// ─── PropertyHero (Design System v2) ─────────────────────────────────────────
// Photo slider banner for a property / unit detail page.
//
//   top-left   type pill · name · address · bold description · eyebrow line · feature chips
//   top-right  small glass icon buttons (gallery, add photo …) — `topActions`
//   bottom-right  slide dots + ‹ › arrows (only when there is more than one slide)
//
//   <PropertyHero
//     slides={[mainImg, ...galleryImgs]}
//     title="LL01" badge="Apartment Complex"
//     address="1391 Overcup Oak Ln, Centerton, US"
//     description="Beautiful Property" eyebrow="The vision of LL01"
//     features={[{ icon: 'ti-door', label: 'Balcony' }, { icon: 'ti-video', label: 'CCTV' }]}
//     topActions={[{ icon: 'ti-photo', label: 'Open gallery', onClick }]} />
//
// topActions: [{ icon, label (aria + tooltip), onClick, busy? }]
// Pair with a Property Snapshot card (StatTile ×4) in <Grid layout="mainSide">.

const fill = { position: 'absolute', inset: 0, pointerEvents: 'none' };

const S = {
  hero: (image) => ({
    position: 'relative', overflow: 'hidden', isolation: 'isolate', height: '100%', minHeight: SZ2.propertyHeroMin,
    borderRadius: R2.xxl, boxShadow: SH2.hero, background: C2.navyHero,
    backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center',
    padding: pad(LAYOUT2.heroY, LAYOUT2.heroX), color: C2.white, fontFamily: F2.body, boxSizing: 'border-box',
  }),
  scrim: { ...fill, background: G2.propertyHeroScrim },
  base:  { ...fill, background: G2.propertyHeroBase },
  content: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: SP2.xs, maxWidth: SZ2.heroContentMax, paddingRight: SZ2.control.lg },

  badge:  { ...UI2.pill(TONES2.primary, { solid: true }), alignSelf: 'flex-start', fontSize: FS2.sm, marginBottom: SP2.xs },
  title:  { fontFamily: F2.heading, fontSize: FS2.score, fontWeight: FW2.semibold, lineHeight: LH2.tight, letterSpacing: LS2.tighter },
  addr:   { ...UI2.row(SP2.xs), fontSize: FS2.sm, color: C2.onDark.textSoft },
  desc:   { ...UI2.clamp(2), fontSize: FS2.xxl, fontWeight: FW2.medium, lineHeight: LH2.heading, marginTop: SP2.sm },
  eyebrow:{ fontSize: FS2.sm, color: C2.onDark.textSoft },
  features: { display: 'flex', flexWrap: 'wrap', gap: SP2.sm, marginTop: SP2.md },

  topActions: { position: 'absolute', zIndex: 1, top: LAYOUT2.heroY, right: LAYOUT2.heroX, ...UI2.row(SP2.sm) },
  glassBtn: {
    ...UI2.btn.ghostOnDark, width: SZ2.control.lg, minHeight: SZ2.control.lg, padding: 0, borderRadius: R2.lg, fontSize: FS2.xl,
  },

  nav:    { position: 'absolute', zIndex: 1, right: LAYOUT2.heroX, bottom: LAYOUT2.heroY, ...UI2.row(SP2.md) },
  dots:   { ...UI2.row(SP2.xs), marginRight: SP2.sm },
  dotBtn: { padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'flex' },
  arrow:  { ...UI2.btn.light, width: SZ2.control.md, minHeight: SZ2.control.md, padding: 0, borderRadius: R2.round, fontSize: FS2.lg },
};

export default function PropertyHero({
  slides = [], title, badge, address, eyebrow, description, features = [], topActions = [],
}) {
  const [idx, setIdx] = useState(0);
  const count = slides.length;
  const cur = count ? Math.min(idx, count - 1) : 0;
  const step = d => setIdx((cur + d + count) % count);

  return (
    <section style={S.hero(slides[cur])}>
      <div style={S.scrim} />
      <div style={S.base} />

      <div style={S.content}>
        {badge && <span style={S.badge}>{badge}</span>}
        <div style={S.title}>{title}</div>
        {address && <div style={S.addr}><i className="ti ti-map-pin" aria-hidden="true" />{address}</div>}
        {description && <div style={S.desc}>{description}</div>}
        {eyebrow && <div style={S.eyebrow}>{eyebrow}</div>}
        {features.length > 0 && (
          <div style={S.features}>
            {features.map(f => (
              <span key={f.label} style={UI2.chipOnDark} title={f.title}>
                {f.icon && <i className={`ti ${f.icon}`} style={UI2.btnIcon} aria-hidden="true" />}{f.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {topActions.length > 0 && (
        <div style={S.topActions}>
          {topActions.map(a => (
            <button key={a.label} type="button" className="un2-ghost" style={{ ...S.glassBtn, ...(a.busy ? { cursor: 'wait' } : {}) }}
              onClick={a.onClick} aria-label={a.label} title={a.label}>
              <i className={`ti ${a.busy ? 'ti-loader-2' : a.icon}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {count > 1 && (
        <div style={S.nav}>
          <div style={S.dots}>
            {slides.map((s, i) => (
              <button key={s + i} type="button" style={S.dotBtn} onClick={() => setIdx(i)} aria-label={`Show photo ${i + 1}`}>
                <span style={UI2.dot(i === cur ? C2.white : C2.onDark.textMuted)} />
              </button>
            ))}
          </div>
          <button type="button" className="un2-raise" style={S.arrow} onClick={() => step(-1)} aria-label="Previous photo">
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <button type="button" className="un2-raise" style={S.arrow} onClick={() => step(1)} aria-label="Next photo">
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
