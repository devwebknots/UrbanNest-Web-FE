import React, { useRef } from 'react';
import { TONES2 } from '../../constants/v2';
import waveArt from '../../assets/v2/card-wave.jpg';

// ─── CardWave (Design System v2) ─────────────────────────────────────────────
// Decorative wave along the bottom of a light card. Two looks:
//
//   variant="double" (default) — the design's two-wave artwork (src/assets/v2/card-wave.jpg),
//                                 `mix-blend-mode: multiply` drops its near-white background.
//   variant="single"           — one soft wave drawn in SVG, filled with the tone's light
//                                 colours (panelBorder → cardTint), e.g. Property Health.
//
//   <SectionCard … decoration={<CardWave />}>
//   <SectionCard … decoration={<CardWave variant="single" height="35%" />}>
//
// Props: variant, height (CSS size of the strip, default 55%), opacity (0–1, default 1),
//        tone (TONES2 entry, single variant only — default primary)

const fill = { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', pointerEvents: 'none', userSelect: 'none' };

// One small wave with three crests in the right half of the card: flat (hidden) until the
// middle, then a small crest, the tallest crest, and a third rising at the right edge.
const WAVE_PATH = 'M0,100 L190,100 C220,100 228,52 252,52 C270,52 274,78 286,78 '
  + 'C302,78 306,10 326,10 C346,10 350,64 365,64 C381,64 391,30 400,22 L400,100 Z';

let waveSeq = 0;

function SingleWave({ height, opacity, tone }) {
  const id = useRef(null);
  if (id.current === null) id.current = `un2-wave-${++waveSeq}`;
  return (
    <svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true" style={{ ...fill, height, opacity }}>
      <defs>
        <linearGradient id={id.current} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.panelBorder} />
          <stop offset="100%" stopColor={tone.cardTint} />
        </linearGradient>
      </defs>
      <path d={WAVE_PATH} fill={`url(#${id.current})`} />
    </svg>
  );
}

export default function CardWave({ variant = 'double', height = '55%', opacity = 1, tone = TONES2.primary }) {
  if (variant === 'single') return <SingleWave height={height} opacity={opacity} tone={tone} />;
  return (
    <img
      src={waveArt}
      alt=""
      aria-hidden="true"
      style={{ ...fill, height, objectFit: 'cover', objectPosition: 'right bottom', mixBlendMode: 'multiply', opacity }}
    />
  );
}
