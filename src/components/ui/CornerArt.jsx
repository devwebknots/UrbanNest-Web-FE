import React from 'react';
import { C2, G2, OP2, SZ2, UI2 } from '../../constants';
import hillLines from '../../assets/landlord/corner-wave-hillLines.jpg';
import hill from '../../assets/landlord/corner-wave-hill.jpg';
import lines from '../../assets/landlord/corner-wave-lines.jpg';
import double from '../../assets/landlord/corner-wave-double.jpg';

// ─── CornerArt (Design System v2) ────────────────────────────────────────────
// Soft wave artwork in the TOP-RIGHT corner of a light card (behind the header) — the four wave panels of
// Downloads/image 103.png (assets/landlord/corner-wave-*.jpg). Their white background disappears on the white
// card (mix-blend-mode: multiply) and they already fade to white towards the left and bottom. A thin white
// rim runs along the card's top edge and around its top-right corner (fading out like the art) — the glassy
// edge from the Create Listing design.
//
//   <SectionCard … decoration={<CornerArt />}>                    hill + white lines (default, Create Listing)
//   <SectionCard … decoration={<CornerArt variant="lines" />}>    hillLines · hill · lines · double
//
// Props: variant, width / height (default SZ2.cornerArt). Purely decorative.
// (CardWave = art along the BOTTOM of a card; CornerArt = the top-right corner.)

const ART = { hillLines, hill, lines, double };

const S = {
  art: (image, w, h) => ({
    position: 'absolute', top: 0, right: 0, width: w, height: h, pointerEvents: 'none',
    backgroundImage: `url(${image})`, backgroundSize: '100% auto', backgroundPosition: 'right top', backgroundRepeat: 'no-repeat',
    mixBlendMode: 'multiply',
    opacity: OP2.cornerArt,                      // kept light so the card's title / fields stay clear on top
  }),
  // white rim on the card's top edge + rounded top-right corner (same radius as the card), full strength
  rim: (w, h) => ({
    position: 'absolute', top: 0, right: 0, width: w, height: h, pointerEvents: 'none', boxSizing: 'border-box',
    borderTop: `${SZ2.hairline * 3}px solid ${C2.white}`, borderRight: `${SZ2.hairline * 3}px solid ${C2.white}`,
    borderTopRightRadius: UI2.card.borderRadius,
    WebkitMaskImage: G2.cornerRimMask, maskImage: G2.cornerRimMask,
  }),
};

export default function CornerArt({ variant = 'hillLines', width = SZ2.cornerArt.w, height = SZ2.cornerArt.h }) {
  return (
    <>
      <div style={S.art(ART[variant] || ART.hillLines, width, height)} aria-hidden="true" />
      <div style={S.rim(width, height)} aria-hidden="true" />
    </>
  );
}
