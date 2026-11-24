import React from 'react';
import { G2, SZ2 } from '../../constants';

// ─── PageWave (Design System v2) ─────────────────────────────────────────────
// Decorative backdrop for the top of a detail page: a soft sky gradient (G2.pageWave — colour sampled from the
// unit detail design) behind the top bar, breadcrumb and header, melting into the page background at the
// bottom (G2.pageWaveMask). Pass it to PageShell — it then runs up BEHIND the top bar (the bar floats
// transparent over it and turns back into the glass bar once the content scrolls):
//
//   <PageShell backdrop={<PageWave />} …>…</PageShell>
//
// Props: height (CSS size, default SZ2.pageWave). Purely decorative (aria-hidden, no pointer events).

const S = {
  wrap: (height) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height, zIndex: -1, pointerEvents: 'none',
    background: G2.pageWave,
    WebkitMaskImage: G2.pageWaveMask,
    maskImage: G2.pageWaveMask,
  }),
};

export default function PageWave({ height = SZ2.pageWave }) {
  return <div style={S.wrap(height)} aria-hidden="true" />;
}
