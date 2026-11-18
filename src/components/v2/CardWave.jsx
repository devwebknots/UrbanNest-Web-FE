import React from 'react';
import waveArt from '../../assets/v2/card-wave.jpg';

// ─── CardWave (Design System v2) ─────────────────────────────────────────────
// The design's two-wave artwork (src/assets/v2/card-wave.jpg) laid along the
// bottom of a light card. `mix-blend-mode: multiply` drops the artwork's
// near-white background so only the blue waves show on the frosted card.
// Decorative only.
//
//   <SectionCard … decoration={<CardWave />}>
//   <SectionCard … decoration={<CardWave height="60%" opacity={0.8} />}>
//
// Props: height (CSS size of the wave strip, default 55% of the card),
//        opacity (0–1, default 1)

export default function CardWave({ height = '55%', opacity = 1 }) {
  return (
    <img
      src={waveArt}
      alt=""
      aria-hidden="true"
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        width: '100%', height, objectFit: 'cover', objectPosition: 'right bottom',
        mixBlendMode: 'multiply', opacity, pointerEvents: 'none', userSelect: 'none',
      }}
    />
  );
}
