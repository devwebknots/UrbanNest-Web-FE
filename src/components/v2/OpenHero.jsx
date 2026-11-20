import React from 'react';
import { C2, G2, T2, F2, SP2, SZ2, LAYOUT2, pad } from '../../constants/v2';

// ─── OpenHero (Design System v2) ─────────────────────────────────────────────
// OPEN page hero for list pages (Landlord → Properties) — NOT a box: no border, radius or shadow.
// It bleeds to the page edges right under the top bar: pale sky wash with two soft waves sweeping
// across, the building photo (pale sky, assets/v2/landlord/portfolio-hero-building.jpg) on the right
// with its left edge feathered into the wash, and an optional stats band running full width underneath.
//
//   PORTFOLIO
//   Property List                                   [ building photo ]
//   Explore and manage all your properties…
//   ───────────────────────────────────────────────────────────────────
//   (▦) Total Properties │ (≋) Total Units │ (%) Avg Occupancy │ (▭) Rent This Month
//
//   <OpenHero eyebrow="Portfolio" title="Property List" subtitle="…" image={img}
//             stats={<StatGroup size="lg" items={…} />} />
//
// Props: eyebrow, title, subtitle, image, imagePosition, stats (node, usually <StatGroup size="lg">)
// The photo is shown whole at the hero's height, anchored bottom-right (never stretched or zoomed).
// Use it as the FIRST child of PageShell (the negative margins cancel the page padding).
// Responsive (utilities.css un2-ohero*): ≤ 860px photo fades behind the text · ≤ 600px photo hides.

const S = {
  hero:  { position: 'relative', margin: pad(-LAYOUT2.pageTop, -LAYOUT2.pageX, 0), background: G2.openHero, fontFamily: F2.body, overflow: 'hidden' },
  waves: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  top:   { position: 'relative', minHeight: SZ2.openHeroMin, display: 'flex', alignItems: 'center' },
  photo: (image, position) => ({
    position: 'absolute', top: 0, right: 0, bottom: 0, width: SZ2.openHeroPhotoW, pointerEvents: 'none',
    backgroundImage: `url(${image})`, backgroundSize: 'auto 100%', backgroundPosition: position, backgroundRepeat: 'no-repeat',
    mixBlendMode: 'multiply',   // the photo's sky is pure white → it vanishes and the wash + waves show through behind the building
  }),
  text:  { position: 'relative', zIndex: 1, padding: pad(SP2.xxxl, LAYOUT2.pageX), maxWidth: SZ2.heroContentMax, minWidth: 0 },
  eyebrow: { ...T2.eyebrow, color: C2.textSecondary },
  title: { ...T2.pageHeroTitle, margin: pad(SP2.sm, 0, SP2.sm) },
  sub:   { ...T2.pageHeroSub },
  band:  { position: 'relative', zIndex: 1, padding: pad(SP2.lg, LAYOUT2.pageX), background: G2.openHeroBand, borderTop: `${SZ2.hairline}px solid ${C2.glassBorder}` },
};

// ONE soft wave (design, Downloads/Gemini_Generated_Image_l552q1…): it starts at the BOTTOM about a
// third of the way across, curves up through the middle and runs on behind the building towards the
// top right. The swell UNDER the curve is a slightly deeper periwinkle (fading in from its left end);
// above / left of it stays the light sky wash (G2.openHero). No edge line. The swell fades out
// before the building (≈ 66% across), so it never shows through the gaps behind / beside it.
function Waves() {
  const blue = G2.openHeroWaves[1];
  // Same start (bottom, ~⅓ across); rises steeply so the crest sits up above the building's roofline
  const curve = 'M500,300 C640,196 790,96 980,44 C1140,4 1300,-6 1440,-4';
  return (
    <svg viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true" style={S.waves}>
      <defs>
        {/* fades in from its left end, fully gone before the building — nothing shows behind / beside it */}
        <linearGradient id="un2-ohero-swell" gradientUnits="userSpaceOnUse" x1="500" y1="0" x2="1440" y2="0">
          <stop offset="0%" stopColor={blue} stopOpacity="0" />
          <stop offset="25%" stopColor={blue} stopOpacity="0.85" />
          <stop offset="55%" stopColor={blue} stopOpacity="0.65" />
          <stop offset="80%" stopColor={blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${curve} L1440,300 Z`} fill="url(#un2-ohero-swell)" />
    </svg>
  );
}

export default function OpenHero({ eyebrow, title, subtitle, image, imagePosition = 'right bottom', stats }) {
  return (
    <section className="un2-ohero" style={S.hero}>
      <div style={S.top}>
        <Waves />
        {image && <div className="un2-ohero-photo" style={S.photo(image, imagePosition)} aria-hidden="true" />}
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
