import React, { useId } from 'react';
import { C2, SZ2 } from '../../constants';

// ─── BankArt (Design System v2) ──────────────────────────────────────────────
// Empty-state illustration for bank accounts (PM Bank Accounts — user reference 2026-11-26):
// a soft blue blob, a shaded classical bank (roof · beam · three round columns · base) and a brand-blue
// "+" badge with a white ring and a soft glow. Pure SVG in v2 colours (C2 tokens).
//
// CRISP BY DESIGN: no SVG filters on the building or the badge (filters are rasterised → soft / blurry).
// Depth comes from gradients + solid shade shapes; only the badge's glow is a separate blurred circle
// BEHIND it, so every edge stays sharp at any size / zoom.
//
//   <EmptyState illustration={<BankArt />} title="No bank accounts added yet" … />
//
// Props: width (default SZ2.bankArt), plus (default true — show the "+" badge)

export default function BankArt({ width = SZ2.bankArt, plus = true }) {
  const id = useId().replace(/:/g, '');
  const g = name => `${name}-${id}`;
  const url = name => `url(#${g(name)})`;
  const cols = [84, 117, 150];   // column x positions (each 22 wide)
  return (
    <svg width={width} viewBox="0 0 260 210" role="img" aria-hidden="true" shapeRendering="geometricPrecision"
      style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={g('blob')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.chipBlue} />
          <stop offset="1" stopColor={C2.primaryTint} />
        </linearGradient>
        {/* roof: slate blue at the ridge → light at the eaves */}
        <linearGradient id={g('roof')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C2.primaryLight} stopOpacity="0.55" />
          <stop offset="1" stopColor={C2.heroWaveBase} />
        </linearGradient>
        <linearGradient id={g('beam')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C2.white} />
          <stop offset="0.6" stopColor={C2.primaryTint} />
          <stop offset="1" stopColor={C2.chipBlue} />
        </linearGradient>
        {/* round column: lit left edge → mid → shaded right edge */}
        <linearGradient id={g('col')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C2.primaryTint} />
          <stop offset="0.35" stopColor={C2.chipBlue} />
          <stop offset="1" stopColor={C2.heroWaveBase} />
        </linearGradient>
        <linearGradient id={g('cap')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C2.white} />
          <stop offset="1" stopColor={C2.chipBlue} />
        </linearGradient>
        <linearGradient id={g('step')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C2.primaryTint} />
          <stop offset="1" stopColor={C2.heroWaveBase} />
        </linearGradient>
        <linearGradient id={g('badge')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.primaryLight} />
          <stop offset="1" stopColor={C2.primaryDark} />
        </linearGradient>
        <radialGradient id={g('ground')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C2.heroWaveBase} stopOpacity="0.7" />
          <stop offset="1" stopColor={C2.heroWaveBase} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor={C2.primaryLight} stopOpacity="0.35" />
          <stop offset="1" stopColor={C2.primaryLight} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft organic blob behind */}
      <path fill={url('blob')}
        d="M40 122C26 84 56 44 108 36c40-6 68 6 98 19 34 15 52 46 41 80-11 37-50 58-100 60-52 2-94-22-107-73z" />
      {/* ground shadow (gradient, not a filter) */}
      <ellipse cx="128" cy="190" rx="92" ry="9" fill={url('ground')} />

      {/* roof — front face + darker right slope for depth */}
      <path d="M128 38 L52 84 H204 Z" fill={url('roof')} />
      <path d="M128 38 L204 84 H170 Z" fill={C2.heroWaveBase} opacity="0.55" />
      <path d="M128 38 L52 84 H204 Z" fill="none" stroke={C2.white} strokeOpacity="0.7" strokeWidth="1.5" strokeLinejoin="round" />

      {/* beam (entablature) — bright top, shaded underside */}
      <rect x="48" y="84" width="160" height="16" rx="5" fill={url('beam')} />
      <rect x="54" y="100" width="148" height="4" rx="2" fill={C2.heroWaveBase} opacity="0.8" />

      {/* columns: capital · round shaft (+ highlight line) · foot */}
      {cols.map(x => (
        <g key={x}>
          <rect x={x - 4} y="104" width="30" height="7" rx="2.5" fill={url('cap')} />
          <rect x={x} y="111" width="22" height="58" fill={url('col')} />
          <rect x={x + 4} y="113" width="3" height="54" rx="1.5" fill={C2.white} opacity="0.75" />
          <rect x={x - 4} y="169" width="30" height="6" rx="2.5" fill={url('cap')} />
        </g>
      ))}

      {/* base steps */}
      <rect x="58" y="175" width="140" height="8" rx="3" fill={url('step')} />
      <rect x="48" y="183" width="160" height="9" rx="3.5" fill={C2.chipBlue} />
      <rect x="48" y="183" width="160" height="2" rx="1" fill={C2.white} opacity="0.8" />

      {plus && (
        <g>
          {/* glow = a separate radial gradient circle behind the badge (badge itself stays sharp) */}
          <circle cx="200" cy="176" r="46" fill={url('glow')} />
          <circle cx="200" cy="174" r="30" fill={C2.white} />
          <circle cx="200" cy="174" r="24" fill={url('badge')} />
          <path d="M200 163v22M189 174h22" stroke={C2.white} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
