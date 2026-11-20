import React from 'react';
import { C2, G2, T2, F2, SP2, SZ2, LAYOUT2, pad } from '../../constants/v2';

// ─── OpenHero (Design System v2) ─────────────────────────────────────────────
// OPEN page hero for list pages (Landlord → Properties) — NOT a box: no border, radius or shadow.
// The photo IS the hero background, full width and edge to edge (sunset sky on the left, building
// on the right — assets/v2/landlord/portfolio-hero-sunset.jpg). With <PageShell heroBehindTopBar> it
// also runs up BEHIND the top bar (underTopBar). An optional stats band runs full width underneath.
//
//   [ top bar floats over the photo ]
//   PORTFOLIO
//   Property List                                   [ building in the photo ]
//   Explore and manage all your properties…
//   ───────────────────────────────────────────────────────────────────
//   (▦) Total Properties │ (≋) Total Units │ (%) Avg Occupancy │ (▭) Rent This Month
//
//   <OpenHero underTopBar eyebrow="Portfolio" title="Property List" subtitle="…" image={img}
//             stats={<StatGroup size="lg" items={…} />} />
//
// Props: eyebrow, title, subtitle, image (photo sized from the hero height — SZ2.openHeroPhotoH — and
//        right-aligned, so the whole building reads clearly; the sky continues to its left),
//        underTopBar (photo runs up behind the floating top bar; text pushed down by the bar's height),
//        stats (node, usually <StatGroup size="lg">)
// Height follows the width (SZ2.openHeroRatio, min SZ2.openHeroMin) → same framing at every width.
// The photo needs a light sky on its left so the dark text reads on it.
// Use it as the FIRST child of PageShell (the negative margins cancel the page padding).

const S = {
  hero:  { position: 'relative', margin: pad(-LAYOUT2.pageTop, -LAYOUT2.pageX, 0), background: G2.openHero, fontFamily: F2.body, overflow: 'hidden' },
  // sky = the photo's own left-edge colours (G2.openHeroSky) → it runs on seamlessly to the left of the photo
  top:   (underTopBar) => ({
    position: 'relative', minHeight: SZ2.openHeroMin, aspectRatio: SZ2.openHeroRatio, boxSizing: 'border-box',
    overflow: 'hidden',   // the photo is taller than this area (SZ2.openHeroPhotoH) — clip it here, never under the stats band
    display: 'flex', alignItems: 'center', background: G2.openHeroSky, ...(underTopBar ? { paddingTop: SZ2.topbar } : {}),
  }),
  // photo sized from the hero's HEIGHT (SZ2.openHeroPhotoH), its own ratio → never stretched; right + top
  // aligned so the roofline sits under the top bar and the floors / low wings below stay in view.
  // Left edge feathered into the sky (un2-ohero-photo in utilities.css).
  photo: (image) => ({
    position: 'absolute', top: 0, right: 0, height: SZ2.openHeroPhotoH, aspectRatio: SZ2.openHeroPhotoRatio, pointerEvents: 'none',
    backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat',
  }),
  text:  { position: 'relative', zIndex: 1, padding: pad(SP2.xxxl, LAYOUT2.pageX), maxWidth: SZ2.heroContentMax, minWidth: 0 },
  eyebrow: { ...T2.eyebrow, color: C2.textSecondary },
  title: { ...T2.pageHeroTitle, margin: pad(SP2.sm, 0, SP2.sm) },
  sub:   { ...T2.pageHeroSub },
  band:  { position: 'relative', zIndex: 1, padding: pad(SP2.lg, LAYOUT2.pageX), background: G2.openHeroBand, borderTop: `${SZ2.hairline}px solid ${C2.glassBorder}` },
};

export default function OpenHero({ eyebrow, title, subtitle, image, underTopBar = false, stats }) {
  return (
    <section className="un2-ohero" style={S.hero}>
      <div style={S.top(underTopBar)}>
        {image && <div className="un2-ohero-photo" style={S.photo(image)} aria-hidden="true" />}
        <div style={S.text}>
          {eyebrow && <div style={S.eyebrow}>{eyebrow}</div>}
          <h1 style={S.title}>{title}</h1>
          {subtitle && <div style={S.sub}>{subtitle}</div>}
        </div>
      </div>
      {stats && <div style={S.band}>{stats}</div>}
    </section>
  );
}
