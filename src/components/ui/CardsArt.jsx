import React, { useId } from 'react';
import { C2, SZ2 } from '../../constants';

// ─── CardsArt (Design System v2) ─────────────────────────────────────────────
// "Nothing selected" illustration for account / payment details (PM Bank Accounts → Account Details —
// user reference 2026-11-26): two light-blue bank cards stacked and tilted (back card more), the front
// card with a chip and two text lines, a soft ground shadow. Pure SVG in v2 colours (C2 tokens).
//
// CRISP BY DESIGN (same rule as BankArt): no SVG filters — depth from gradients, a white rim highlight
// and a separate gradient ground shadow, so edges stay sharp at any size / zoom.
//
//   <EmptyState illustration={<CardsArt />} />
//
// Props: width (default SZ2.cardsArt)

export default function CardsArt({ width = SZ2.cardsArt }) {
  const id = useId().replace(/:/g, '');
  const g = name => `${name}-${id}`;
  const url = name => `url(#${g(name)})`;
  return (
    <svg width={width} viewBox="0 0 240 170" role="img" aria-hidden="true" shapeRendering="geometricPrecision"
      style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={g('back')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.chipBlue} />
          <stop offset="1" stopColor={C2.heroWaveBase} />
        </linearGradient>
        <linearGradient id={g('front')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.white} />
          <stop offset="0.45" stopColor={C2.primaryTint} />
          <stop offset="1" stopColor={C2.chipBlue} />
        </linearGradient>
        <linearGradient id={g('rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.white} stopOpacity="0.95" />
          <stop offset="1" stopColor={C2.heroWaveBase} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={g('chip')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.primarySoft} />
          <stop offset="1" stopColor={C2.heroWaveBase} />
        </linearGradient>
        <radialGradient id={g('ground')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C2.heroWaveBase} stopOpacity="0.6" />
          <stop offset="1" stopColor={C2.heroWaveBase} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="124" cy="150" rx="84" ry="9" fill={url('ground')} />

      {/* back card — tilted more, deeper blue */}
      <g transform="rotate(-12 100 80)">
        <rect x="34" y="34" width="130" height="84" rx="10" fill={url('back')} />
        <rect x="34.75" y="34.75" width="128.5" height="82.5" rx="9.25" fill="none" stroke={url('rim')} strokeWidth="1.5" />
      </g>

      {/* front card — lighter, chip + two text lines */}
      <g transform="rotate(-6 136 98)">
        <rect x="68" y="54" width="136" height="88" rx="10" fill={url('front')} />
        <rect x="68.75" y="54.75" width="134.5" height="86.5" rx="9.25" fill="none" stroke={url('rim')} strokeWidth="1.5" />
        {/* chip */}
        <rect x="84" y="72" width="22" height="17" rx="3.5" fill={url('chip')} />
        <path d="M84 80.5h22M95 72v17M89 72v4M101 85v4" stroke={C2.white} strokeOpacity="0.85" strokeWidth="1.2" />
        {/* text lines */}
        <rect x="84" y="108" width="96" height="5" rx="2.5" fill={C2.heroWaveBase} />
        <rect x="84" y="118" width="62" height="5" rx="2.5" fill={C2.heroWaveBase} opacity="0.75" />
      </g>
    </svg>
  );
}
