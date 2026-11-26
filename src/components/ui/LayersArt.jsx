import React, { useId } from 'react';
import { C2, SZ2 } from '../../constants';

// ─── LayersArt (Design System v2) ────────────────────────────────────────────
// Glassy 3D "stack of layers" mark for navy plan-card headers (PM Subscription → Available Plans, user
// reference 2026-11-26): three isometric slabs stacked with a gap, frosted light-blue faces, a brighter top
// edge and a darker side band so each slab reads as a solid tile. Pure SVG, C2 colours, no filters (crisp).
//
//   <LayersArt />            ← default width SZ2.layersArt
//
// Props: width

export default function LayersArt({ width = SZ2.layersArt }) {
  const id = useId().replace(/:/g, '');
  const g = name => `${name}-${id}`;
  const url = name => `url(#${g(name)})`;
  // one slab: top rhombus + front-left / front-right side bands, offset by y
  const slab = (y, op) => (
    <g key={y} opacity={op}>
      <path d={`M40 ${y} L72 ${y + 14} L40 ${y + 28} L8 ${y + 14} Z`} fill={url('top')} />
      <path d={`M8 ${y + 14} L40 ${y + 28} V${y + 33} L8 ${y + 19} Z`} fill={url('sideL')} />
      <path d={`M40 ${y + 28} L72 ${y + 14} V${y + 19} L40 ${y + 33} Z`} fill={url('sideR')} />
      <path d={`M40 ${y} L72 ${y + 14} L40 ${y + 28} L8 ${y + 14} Z`} fill="none" stroke={C2.white} strokeOpacity="0.7" strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  );
  return (
    <svg width={width} viewBox="0 0 80 72" aria-hidden="true" focusable="false" shapeRendering="geometricPrecision"
      style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={g('top')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.white} stopOpacity="0.85" />
          <stop offset="1" stopColor={C2.heroWaveBase} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={g('sideL')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C2.heroWaveBase} stopOpacity="0.75" />
          <stop offset="1" stopColor={C2.primaryLight} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={g('sideR')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C2.primaryLight} stopOpacity="0.55" />
          <stop offset="1" stopColor={C2.primary} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* bottom → top: lower slabs a little fainter */}
      {slab(36, 0.7)}
      {slab(22, 0.85)}
      {slab(8, 1)}
    </svg>
  );
}
