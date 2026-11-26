import React from 'react';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, SP2, SZ2, T2, UI2, pad } from '../../constants';

// ─── StepList (Design System v2) ─────────────────────────────────────────────
// VERTICAL step list for a form beside it (PM My Profile / registration — Downloads/image 171.png).
// The horizontal wizard stepper is Stepper.jsx; this is its side-column twin, same circle language:
//
//   (✓) Professional Profile           done    = light blue circle (C2.chipBlue) + navy ✓
//    │  Tell landlords about you…
//   (2) Service Area & License         current = brand-blue circle, white number (soft halo, SH2.stepCurrent)
//    │  Where you operate…                       + its text sits on a soft primary tint (C2.primaryTint)
//   (3) Fees & Identity                to-do   = white circle with a ring, navy number
//       Your fee structure…
//   connector = 2px line, brand blue once that step is done
//
//   <StepList current={1} steps={[{ n: 1, label: 'Professional Profile', sub: '…' }, …]} onSelect={n => …} />
// Props: steps [{ n, label, sub? }] · current · onSelect (optional → steps become buttons)
// Place it in <Grid layout="steps"> (fixed step column on the left, form on the right).

const DOT = SZ2.icon.sm;   // 28

const S = {
  list:  { display: 'flex', flexDirection: 'column', fontFamily: F2.body, margin: 0, padding: 0, listStyle: 'none' },
  item:  { display: 'flex', gap: SP2.sm },
  rail:  { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: DOT, paddingTop: SP2.xs },
  dot:   (state) => ({
    ...UI2.center, width: DOT, height: DOT, flexShrink: 0, borderRadius: R2.round, boxSizing: 'border-box',
    fontSize: FS2.sm, fontWeight: FW2.semibold, lineHeight: LH2.none,
    ...(state === 'current' && { background: G2.primaryButton, color: C2.white, boxShadow: SH2.stepCurrent }),
    ...(state === 'done'    && { background: C2.chipBlue, color: C2.navy }),
    ...(state === 'todo'    && { background: C2.white, color: C2.navy, border: `${SZ2.hairline}px solid ${C2.cardBorder}`, boxShadow: SH2.stepTodo }),
  }),
  line:  (done) => ({ width: SZ2.hairline * 2, flex: 1, minHeight: SP2.huge, margin: `${SP2.xs}px 0`, borderRadius: R2.pill, background: done ? C2.primaryLight : C2.border }),
  // text block — same padding on every step so labels line up; the current one sits on a soft tint
  body:  (last, current) => ({
    flex: 1, minWidth: 0, textAlign: 'left', alignSelf: 'flex-start', padding: pad(SP2.sm, SP2.md), marginBottom: last ? 0 : SP2.lg,
    borderRadius: R2.lg, background: current ? C2.primaryTint : 'transparent',
  }),
  btn:   { padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: F2.body },
  label: (state) => ({ ...UI2.text.titleLg, color: state === 'todo' ? C2.textSecondary : C2.navyDeep }),
  sub:   { ...T2.label, marginTop: SP2.xs },
};

export default function StepList({ steps = [], current = 1, onSelect }) {
  return (
    <ol aria-label="Progress" style={S.list}>
      {steps.map((st, i) => {
        const state = st.n < current ? 'done' : st.n === current ? 'current' : 'todo';
        const last = i === steps.length - 1;
        const text = (
          <>
            <div style={S.label(state)}>{st.label}</div>
            {st.sub && <div style={S.sub}>{st.sub}</div>}
          </>
        );
        return (
          <li key={st.n} style={S.item} aria-current={state === 'current' ? 'step' : undefined}>
            <div style={S.rail}>
              <span style={S.dot(state)} aria-hidden="true">
                {state === 'done' ? <i className="ti ti-check" /> : st.n}
              </span>
              {!last && <span style={S.line(state === 'done')} aria-hidden="true" />}
            </div>
            {onSelect
              ? <button type="button" style={{ ...S.btn, ...S.body(last, state === 'current') }} onClick={() => onSelect(st.n)}>{text}</button>
              : <div style={S.body(last, state === 'current')}>{text}</div>}
          </li>
        );
      })}
    </ol>
  );
}
