import React from 'react';
import { TONES2, R2, SZ2, OP2 } from '../../constants';

// ─── CardPattern (Design System v2) ──────────────────────────────────────────
// Faint decorative art in the bottom-right corner of a light card (waves · bars · dots · skyline).
// Purely visual: drawn BEHIND the card content (z-index -1 inside the card's own stacking context),
// ignores clicks, and never changes the card's size or layout. Only its own box is clipped to the
// card's bottom-right radius, so the card itself keeps overflow visible (menus are never cut).
//
// SectionCard adds one automatically to every light card (variant picked from the title, so cards
// next to each other differ). Turn it off with <SectionCard pattern={false}>, or pick one:
//   <SectionCard pattern="bars" …>
//
// Props: variant ('waves' | 'bars' | 'dots' | 'skyline'), tone (TONES2 entry, default primary)

export const CARD_PATTERNS = ['waves', 'bars', 'dots', 'skyline'];

// Stable variant for a card from its title (same card → same pattern on every render)
export const patternFor = (key = '') => {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_PATTERNS[h % CARD_PATTERNS.length];
};

const S = {
  box: {
    position: 'absolute', right: 0, bottom: 0, zIndex: -1,
    width: SZ2.cardPattern.w, height: SZ2.cardPattern.h,
    overflow: 'hidden', borderBottomRightRadius: R2.xxl,
    pointerEvents: 'none', userSelect: 'none', opacity: OP2.pattern,
  },
  svg: { display: 'block', width: '100%', height: '100%' },
};

function Art({ variant, a, b }) {
  switch (variant) {
    case 'bars':
      return [18, 30, 24, 44, 58, 72].map((h, i) => (
        <rect key={i} x={46 + i * 19} y={100 - h} width="12" height={h + 6} rx="4" fill={i % 2 ? a : b} />
      ));
    case 'dots':
      return Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
        // fade towards the top-left so the grid melts into the card
        // (dots are tiny, so they get a larger radius and a higher floor than the filled patterns to read as clearly)
        const weight = (c + r) / 11;
        return weight > 0.3 && <circle key={`${r}-${c}`} cx={26 + c * 17} cy={22 + r * 17} r="3.2" fill={a} opacity={Math.min(1, 0.45 + weight)} />;
      }));
    case 'skyline':
      // Soft city skyline: back row in the lighter tint, front row in the stronger one, a few windows
      return (
        <>
          <path d="M40,100 L40,70 L58,70 L58,56 L76,56 L76,64 L92,64 L92,40 L110,40 L110,58 L126,58 L126,48 L142,48 L142,62 L160,62 L160,100 Z" fill={b} />
          <path d="M64,100 L64,78 L84,78 L84,66 L102,66 L102,82 L118,82 L118,60 L138,60 L138,76 L160,76 L160,100 Z" fill={a} />
          {[[96, 46], [96, 52], [104, 46], [104, 52], [131, 54], [131, 60]].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill={a} />
          ))}
        </>
      );
    case 'waves':
    default:
      return (
        <>
          <path d="M0,100 C34,92 46,58 82,58 C112,58 120,80 160,36 L160,100 Z" fill={b} />
          <path d="M40,100 C70,96 86,72 112,72 C134,72 142,86 160,70 L160,100 Z" fill={a} />
        </>
      );
  }
}

export default function CardPattern({ variant = 'waves', tone = TONES2.primary }) {
  return (
    <span style={S.box} aria-hidden="true">
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMaxYMax meet" style={S.svg}>
        <Art variant={variant} a={tone.panelBorder} b={tone.cardTint} />
      </svg>
    </span>
  );
}
