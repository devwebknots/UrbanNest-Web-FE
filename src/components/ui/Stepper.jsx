import React from 'react';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, LS2, SP2, SZ2, UI2 } from '../../constants';

// ─── Stepper (Design System v2) ──────────────────────────────────────────────
// VERSION 2 — the v1 equivalent is ListingStepper in pages/Landlord/Listing/listingWizardShared.jsx.
// Numbered circles joined by connector tracks (wizards: Create Listing …):
//
//   (✓) Property ━━━━ (✓) Unit ━━━━ ((3)) Promote ━╍╍╍ (4) Publish
//       Completed        Completed       In progress        Up next
//
//   done    = brand-gradient circle (G2.brandButton) with a white ✓ that pops in · glossy lift (SH2.stepDone)
//   current = white face inside a brand-gradient ring (G2.stepRing) + soft blue halo + a breathing outer ring
//             (.un2-step-pulse) · navy number · bold label · "In progress" caption in brand blue
//   to-do   = light blue circle (C2.chipBlue, the soft-button blue) · navy number · muted label + caption
//   track   = 3px rounded track (C2.border); finished connectors fill left → right in turn (G2.primaryBar,
//             .un2-step-fill), the connector after the current step carries a fading blue lead (G2.stepLead)
//
//   <Stepper current={1} steps={[{ n: 1, label: 'Property' }, { n: 2, label: 'Unit' }, …]} />
// Scrolls sideways on very narrow screens instead of wrapping.

const CAPTION = { done: 'Completed', current: 'In progress', todo: 'Up next' };

const S = {
  // overflowX:auto also clips vertically → pad generously so the current badge's halo / pulse ring and the ✓ badge's
  // shadow are never cut; the negative margin cancels the extra padding so the stepper sits exactly where it did.
  bar:   { display: 'flex', alignItems: 'center', overflowX: 'auto', fontFamily: F2.body, padding: `${SP2.md}px ${SP2.md}px`, margin: `-${SP2.sm}px -${SP2.md}px` },
  step:  { ...UI2.row(SP2.md), flexShrink: 0 },
  badge: { position: 'relative', display: 'inline-flex', flexShrink: 0 },
  pulse: { position: 'absolute', inset: 0, borderRadius: R2.round, boxShadow: SH2.stepPulse, pointerEvents: 'none' },
  dot:   (state) => ({
    ...UI2.center, position: 'relative', width: SZ2.stepBadge, height: SZ2.stepBadge, borderRadius: R2.round, boxSizing: 'border-box',
    fontSize: FS2.base, fontWeight: FW2.semibold, lineHeight: LH2.none,
    ...(state === 'done'    && { background: G2.brandButton, color: C2.white, boxShadow: SH2.stepDone }),
    ...(state === 'current' && { background: G2.stepRing, border: '2px solid transparent', color: C2.navy, boxShadow: SH2.stepCurrent }),
    ...(state === 'todo'    && { background: C2.chipBlue, color: C2.navy, boxShadow: SH2.stepTodo }),
  }),
  text:    { display: 'flex', flexDirection: 'column', gap: SP2.xxs, minWidth: 0 },
  label:   (state) => ({
    fontSize: FS2.md, lineHeight: LH2.snug, whiteSpace: 'nowrap',
    fontWeight: state === 'current' ? FW2.semibold : FW2.medium,
    color: state === 'todo' ? C2.textSecondary : C2.textPrimary,
  }),
  caption: (state) => ({
    fontSize: FS2.xxs, fontWeight: FW2.semibold, lineHeight: LH2.none, letterSpacing: LS2.wide, textTransform: 'uppercase', whiteSpace: 'nowrap',
    color: state === 'current' ? C2.primary : state === 'done' ? C2.navy : C2.textMuted,
    opacity: state === 'done' ? 0.7 : 1,
  }),
  track: { position: 'relative', width: SZ2.stepTrack.w, height: SZ2.stepTrack.h, flexShrink: 0, margin: `0 ${SP2.lg}px`, borderRadius: R2.pill, background: G2.stepTrack, overflow: 'hidden' },
  fill:  (kind) => ({
    position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%', borderRadius: R2.pill,   // full width → one continuous colour, no split
    background: kind === 'done' ? G2.primaryBar : G2.stepLead,
  }),
};

export default function Stepper({ steps = [], current = 1 }) {
  return (
    <nav aria-label="Progress" style={S.bar}>
      {steps.map((st, i) => {
        const state = st.n < current ? 'done' : st.n === current ? 'current' : 'todo';
        const line = st.n < current ? 'done' : st.n === current ? 'lead' : null;   // connector after this step
        return (
          <React.Fragment key={st.n}>
            <div style={S.step} aria-current={state === 'current' ? 'step' : undefined}>
              <span style={S.badge}>
                {state === 'current' && <span className="un2-step-pulse" style={S.pulse} aria-hidden="true" />}
                <span style={S.dot(state)}>
                  {state === 'done'
                    ? <i className="ti ti-check un2-step-check" style={{ '--k': i }} aria-hidden="true" />
                    : st.n}
                </span>
              </span>
              <span style={S.text}>
                <span style={S.label(state)}>{st.label}</span>
                <span style={S.caption(state)}>{CAPTION[state]}</span>
              </span>
            </div>
            {i < steps.length - 1 && (
              <span style={S.track} aria-hidden="true">
                {line && <span className="un2-step-fill" style={{ ...S.fill(line), '--k': i }} />}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
