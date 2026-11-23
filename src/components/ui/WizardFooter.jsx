import React from 'react';
import { C2, BLUR2, FS2, LAYOUT2, SP2, SZ2, ZI2, pad, T2, UI2 } from '../../constants';

// ─── WizardFooter (Design System v2) ─────────────────────────────────────────
// VERSION 2 — the v1 equivalent is ListingFooter in pages/Landlord/Listing/listingWizardShared.jsx.
// Bar that sticks to the bottom of the page while the wizard step scrolls (last child of <PageShell>):
//
//   Step 1 of 4                          ⚠ note          [ ← Back ] [ Save & Exit ] [ Continue → ]
//
//   <WizardFooter step={1} total={4} onSaveExit={…} onContinue={…} continueLabel="Continue" busy={saving} note={error} />
//
// Secondary actions are soft (light surface → never white buttons); the main action is the brand button.
// Props: step, total, left (node, replaces "Step x of y"), note (error text), onBack, onSaveExit,
//        onContinue, continueLabel, busy (true → "Saving…" + disabled), continueDisabled

const S = {
  // full-bleed: cancels the page padding at the sides + bottom so the bar spans the content area
  bar:   {
    // sticky offsets are measured inside the scroll area's padding → pull it down by the page's bottom padding
    // so the bar sits flush on the screen edge (nothing scrolls visibly underneath it)
    position: 'sticky', bottom: -LAYOUT2.pageBottom, zIndex: ZI2.sticky,
    margin: pad(0, -LAYOUT2.pageX, -LAYOUT2.pageBottom), minHeight: SZ2.footerBar, padding: pad(SP2.md, LAYOUT2.pageX),
    ...UI2.row(SP2.md), flexWrap: 'wrap', rowGap: SP2.sm,
    background: C2.backgroundGlass, backdropFilter: BLUR2.md, WebkitBackdropFilter: BLUR2.md,
  },
  left:  { ...T2.label, flex: '1 1 auto', minWidth: 0 },
  note:  { ...UI2.row(SP2.xs), fontSize: FS2.sm, color: C2.errorDark },
  acts:  { ...UI2.row(SP2.sm), marginLeft: 'auto' },
  off:   { opacity: 0.6, cursor: 'not-allowed' },
};

export default function WizardFooter({
  step, total = 4, left, note, onBack, onSaveExit, onContinue, continueLabel = 'Continue', busy = false, continueDisabled = false,
}) {
  const off = busy || continueDisabled;
  return (
    <div style={S.bar}>
      <div style={S.left}>{left || (step ? `Step ${step} of ${total}` : null)}</div>
      {note && <span style={S.note} role="alert"><i className="ti ti-alert-circle" aria-hidden="true" />{note}</span>}
      <div style={S.acts}>
        {onBack && (
          <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={onBack}>
            <i className="ti ti-arrow-left" style={UI2.btnIcon} aria-hidden="true" /> Back
          </button>
        )}
        {onSaveExit && <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={onSaveExit} disabled={busy}>Save &amp; Exit</button>}
        {onContinue && (
          <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...(off ? S.off : {}) }} onClick={off ? undefined : onContinue} disabled={off}>
            {busy ? 'Saving…' : continueLabel}
            {!busy && <i className="ti ti-arrow-right" style={UI2.btnIcon} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
