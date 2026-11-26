import React, { useId } from 'react';
import { C2 } from '../../constants';

// ─── NavyGlow (Design System v2) ─────────────────────────────────────────────
// Background layer for a NAVY feature card (PM Subscription "Activate a Plan" banner + plan-card heads —
// Downloads/image 181):
//   · deep navy → royal blue base
//   · a bright blue glow (behind the artwork)
//   · a lighter blue wave band with thin white sweep lines
// Pure SVG in C2 colours, no filters (crisp). Sits absolutely behind the card content:
//
//   <div style={{ ...UI2.darkCard, position: 'relative', overflow: 'hidden' }}>
//     <NavyGlow />                       ← variant 0 (default)
//     …content (position: relative)…
//   </div>
//
// VARIANTS (0–3) — same palette, different composition, so a row of cards never repeats one pattern
// (plan cards: variant = index % 4):
//   0  glow right · wave band rising bottom-right            (the banner look)
//   1  glow top-left · diagonal light beam · low wave         (lighter, airy)
//   2  deep navy · glow low-right · tight double wave          (darkest)
//   3  glow top-right · tall sweeping curves across the card   (most movement)
//
// Props: variant (0–3, default 0) · glowX / glowY (override the glow centre, 0–1 of the card)

const VARIANTS = [
  {
    glow: [0.78, 0.42], glowR: 0.55, base: ['navyDeep', 'navy', 'primaryDark'], baseMid: 0.45,
    bands: ['M180 360 C300 330 380 300 460 250 C520 212 565 200 600 196 V360 Z', 'M300 360 C390 340 460 312 520 280 C556 262 582 254 600 252 V360 Z'],
    lines: ['M150 352 C290 322 380 284 470 236 C530 204 572 192 600 189', 'M200 360 C320 336 410 300 490 258 C545 228 580 218 600 216', 'M260 362 C370 344 440 318 510 284 C556 262 584 254 600 252'],
  },
  {
    glow: [0.2, 0.15], glowR: 0.6, base: ['navy', 'primaryDark', 'primary'], baseMid: 0.55,
    beam: 'M380 0 L520 0 L260 360 L120 360 Z',
    bands: ['M0 330 C140 300 300 320 420 300 C500 288 560 292 600 300 V360 H0 Z'],
    lines: ['M0 318 C150 288 300 308 430 288 C510 276 565 280 600 288'],
  },
  {
    glow: [0.85, 0.85], glowR: 0.5, base: ['navyDeep', 'navyDeep', 'navy'], baseMid: 0.5,
    bands: ['M260 360 C360 320 440 300 520 300 C560 300 585 306 600 312 V360 Z', 'M380 360 C450 334 510 322 560 322 C580 322 592 326 600 328 V360 Z'],
    lines: ['M240 360 C350 316 440 292 520 292 C562 292 586 298 600 304', 'M360 362 C440 330 505 314 560 314 C582 314 594 318 600 320'],
  },
  {
    glow: [0.92, 0.1], glowR: 0.65, base: ['navyDeep', 'navy', 'primaryDark'], baseMid: 0.4,
    bands: ['M0 360 C120 250 260 210 380 200 C480 192 550 150 600 90 V360 Z'],
    lines: ['M-10 340 C120 236 260 196 380 186 C482 178 552 136 600 76', 'M40 360 C160 262 290 226 400 216 C496 208 560 168 600 116', 'M120 366 C230 290 340 258 430 250 C512 243 566 210 600 170'],
  },
];

export default function NavyGlow({ variant = 0, glowX, glowY }) {
  const id = useId().replace(/:/g, '');
  const g = name => `${name}-${id}`;
  const url = name => `url(#${g(name)})`;
  const v = VARIANTS[((variant % VARIANTS.length) + VARIANTS.length) % VARIANTS.length];
  const gx = glowX ?? v.glow[0];
  const gy = glowY ?? v.glow[1];
  return (
    <svg aria-hidden="true" focusable="false" preserveAspectRatio="none" viewBox="0 0 600 360"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={g('base')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2[v.base[0]]} />
          <stop offset={v.baseMid} stopColor={C2[v.base[1]]} />
          <stop offset="1" stopColor={C2[v.base[2]]} />
        </linearGradient>
        <radialGradient id={g('glow')} cx={gx} cy={gy} r={v.glowR} gradientTransform={`translate(${gx} ${gy}) scale(1 1.4) translate(${-gx} ${-gy})`}>
          <stop offset="0" stopColor={C2.primaryLight} stopOpacity="0.75" />
          <stop offset="0.45" stopColor={C2.primary} stopOpacity="0.35" />
          <stop offset="1" stopColor={C2.primary} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('band')} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={C2.primaryLight} stopOpacity="0" />
          <stop offset="0.6" stopColor={C2.primaryLight} stopOpacity="0.35" />
          <stop offset="1" stopColor={C2.heroWaveBase} stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={g('beam')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C2.white} stopOpacity="0.14" />
          <stop offset="1" stopColor={C2.white} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g('line')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C2.white} stopOpacity="0" />
          <stop offset="0.55" stopColor={C2.white} stopOpacity="0.55" />
          <stop offset="1" stopColor={C2.white} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <rect width="600" height="360" fill={url('base')} />
      <rect width="600" height="360" fill={url('glow')} />
      {v.beam && <path d={v.beam} fill={url('beam')} />}
      {v.bands.map((d, i) => <path key={d} d={d} fill={url('band')} opacity={i === 0 ? 1 : 0.7} />)}
      {v.lines.map((d, i) => <path key={d} d={d} fill="none" stroke={url('line')} strokeWidth={[1.6, 1.1, 0.9][i] || 0.9} opacity={[1, 0.8, 0.6][i] || 0.6} />)}
    </svg>
  );
}
