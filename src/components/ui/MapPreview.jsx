import React from 'react';
import { C2, R2, FS2, FW2, SP2, SZ2, pad, UI2 } from '../../constants';

// ─── MapPreview (Design System v2) ───────────────────────────────────────────
// Illustrative (static) neighbourhood map: soft map tint, a few white streets, dark pins + one
// highlighted pin, "Google" mark bottom-left and a "Street View" chip bottom-right. Not interactive —
// a live map isn't wired up yet (say so in the text above it).
//
//   <MapPreview />                     default pins
//   <MapPreview pins={[{ x: '16%', y: '16%' }, { x: '47%', y: '44%', active: true }]} />

const PINS = [
  { x: '22%', y: '16%' }, { x: '68%', y: '24%' }, { x: '34%', y: '56%' }, { x: '48%', y: '40%', active: true },
];

// streets, drawn in a 100 × 60 box stretched over the map
const STREETS = [
  'M-5 18 L60 70', 'M10 -5 L80 65', 'M45 -5 L105 45', 'M-5 48 L40 8', 'M55 70 L105 20', 'M70 -5 L105 25',
];

const S = {
  box:    { position: 'relative', overflow: 'hidden', height: SZ2.mapPreview.h, borderRadius: R2.lg, background: `linear-gradient(135deg, ${C2.successTint} 0%, ${C2.primaryTint} 100%)` },
  svg:    { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' },
  pin:    (p) => ({ position: 'absolute', left: p.x, top: p.y, width: SZ2.mapPreview.pin, height: SZ2.mapPreview.pin * 1.25, transform: 'translate(-50%, -100%)', color: p.active ? C2.purple : C2.navyDeep}),
  google: { position: 'absolute', left: SP2.md, bottom: SP2.sm, fontSize: FS2.sm, fontWeight: FW2.medium, color: C2.textSecondary },
  street: { ...UI2.btn.dark, ...UI2.btnSm, position: 'absolute', right: SP2.sm, bottom: SP2.sm, padding: pad(0, SP2.md), cursor: 'default', opacity: 0.85 },
};

function Pin() {
  return (
    <svg viewBox="0 0 24 30" fill="currentColor" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18C24 5.4 18.6 0 12 0zm0 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
    </svg>
  );
}

export default function MapPreview({ pins = PINS }) {
  return (
    <div style={S.box} role="img" aria-label="Illustrative neighbourhood map">
      <svg style={S.svg} viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        {STREETS.map(d => <path key={d} d={d} stroke={C2.white} strokeWidth={SZ2.hairline * 2} vectorEffect="non-scaling-stroke" fill="none" />)}
      </svg>
      {pins.map((p, i) => <span key={i} style={S.pin(p)}><Pin /></span>)}
      <span style={S.google}>Google</span>
      <span style={S.street} aria-hidden="true">Street View</span>
    </div>
  );
}
