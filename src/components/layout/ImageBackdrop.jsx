import React from 'react';
import { G2, OP2, SZ2 } from '../../constants';

// ─── ImageBackdrop (Design System v2) ────────────────────────────────────────
// Decorative artwork at the top of a page (behind the top bar, breadcrumb, header and stepper), melting into
// the page background from half-way down (G2.imageBackdropMask), at OP2.backdrop strength. Pass it to PageShell — it then
// runs up BEHIND the top bar (the bar floats transparent over it, glass again once the content scrolls):
//
//   <PageShell backdrop={<ImageBackdrop image={art} />} …>…</PageShell>
//
// Props: image (required), height (default SZ2.imageBackdrop), position (CSS background-position, default
// 'right top' — keeps the wave lines in the top-right corner like the Create Listing design).
// Separate from PageWave (Unit detail) — changing one never affects the other. Purely decorative.

const S = {
  wrap: (image, height, position) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height, zIndex: -1, pointerEvents: 'none',
    opacity: OP2.backdrop,                       // softer than the raw art — pastel like the design
    // sized by WIDTH (never by height): on smaller laptops the art shrinks with the page instead of zooming
    // in on the big hill — same composition at every width; the mask fades its lower edge away
    backgroundImage: `url(${image})`, backgroundSize: '100% auto', backgroundPosition: position, backgroundRepeat: 'no-repeat',
    // two fades, intersected: down (gone before the cards) × left → right (only on the right half — the waves
    // never reach the title / stepper, like the design)
    WebkitMaskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`,
    maskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`,
    WebkitMaskComposite: 'source-in',
    maskComposite: 'intersect',
  }),
};

export default function ImageBackdrop({ image, height = SZ2.imageBackdrop, position = 'right top' }) {
  return <div style={S.wrap(image, height, position)} aria-hidden="true" />;
}
