import React from 'react';
import { C2, G2, R2, SH2, F2, FS2, FW2, SP2, SZ2, UI2 } from '../../constants';

// ─── Stepper (Design System v2) ──────────────────────────────────────────────
// VERSION 2 — the v1 equivalent is ListingStepper in pages/Landlord/Listing/listingWizardShared.jsx.
// Numbered steps joined by short lines (wizards: Create Listing …):
//
//   (1) Property ──── (2) Unit ──── (3) Promote ──── (4) Publish
//   current = brand gradient circle (dark blue) · done = light primary-blue circle (G2.primaryButton) with a white ✓ ·
//   to-do = white circle · line after a finished step = light primary blue (G2.primaryBar) — app theme, no green
//
//   <Stepper current={1} steps={[{ n: 1, label: 'Property' }, { n: 2, label: 'Unit' }, …]} />
// Scrolls sideways on very narrow screens instead of wrapping.

const S = {
  bar:   { display: 'flex', alignItems: 'center', overflowX: 'auto', fontFamily: F2.body },
  step:  { ...UI2.row(SP2.sm), flexShrink: 0 },
  dot:   (state) => ({
    ...UI2.center, width: SZ2.stepDot, height: SZ2.stepDot, borderRadius: R2.round, flexShrink: 0, boxSizing: 'border-box',
    fontSize: FS2.base, fontWeight: FW2.semibold,
    background: state === 'current' ? G2.brandButton : state === 'done' ? G2.primaryButton : C2.white,   // done = light primary blue
    color: state === 'todo' ? C2.textSecondary : C2.white,                                              // done = white ✓
    boxShadow: state === 'current' ? SH2.brandButton : state === 'done' ? SH2.primary : SH2.control,
  }),
  label: (state) => ({ fontSize: FS2.md, fontWeight: state === 'current' ? FW2.semibold : FW2.medium, color: state === 'current' ? C2.textPrimary : C2.textSecondary, whiteSpace: 'nowrap' }),
  line:  (done) => ({ width: SZ2.stepLine.w, height: SZ2.stepLine.h, flexShrink: 0, margin: `0 ${SP2.lg}px`, borderRadius: R2.pill, background: done ? G2.primaryBar : C2.border }),
};

export default function Stepper({ steps = [], current = 1 }) {
  return (
    <nav aria-label="Progress" style={S.bar}>
      {steps.map((st, i) => {
        const state = st.n < current ? 'done' : st.n === current ? 'current' : 'todo';
        return (
          <React.Fragment key={st.n}>
            <div style={S.step} aria-current={state === 'current' ? 'step' : undefined}>
              <span style={S.dot(state)}>{state === 'done' ? <i className="ti ti-check" aria-hidden="true" /> : st.n}</span>
              <span style={S.label(state)}>{st.label}</span>
            </div>
            {i < steps.length - 1 && <span style={S.line(st.n < current)} aria-hidden="true" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
