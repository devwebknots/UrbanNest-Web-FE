import React, { useEffect, useId, useRef, useState } from 'react';
import { SH2, FS2, SP2, LAYOUT2, UI2 } from '../../constants';

// ─── ActionTray (Design System v2) ───────────────────────────────────────────
// A row of header buttons that stays tidy: the secondary actions sit behind one labelled toggle and
// SLIDE OPEN to its left when it's clicked; the primary action is always visible.
//
//   closed:                            [ ⚙ Options ‹ ]  [ ⬇ Download Report ]
//   open:   [ ✎ Edit ] [ Listed ] [ Share ]  [ ⚙ Options › ]  [ ⬇ Download Report ]
//
//   <ActionTray
//     label="Options"
//     primary={<button style={UI2.btn.brand}>Download Report</button>}>
//     <button …>Edit</button>
//     <button …>Share Detail</button>
//   </ActionTray>
//
// Motion: the tray width eases open with a soft spring (grid 0fr → 1fr), the buttons fade, de-blur and
// slide in one after another, the sliders icon turns, the chevron flips;
// toggle stays white (text stays "Options"). Closes on: toggle, choosing an
// action, a click outside, Esc. A labelled toggle (not a bare ⋯) — same pattern as Shopify / Stripe headers.
// Closed buttons are inert (not focusable / not read out). prefers-reduced-motion → no animation.
// Styles: utilities.css .un2-tray*. Props: children (secondary buttons), primary (node, always shown),
// label (toggle text when closed, default "Options"), closeLabel (when open, default "Options"),
// compact (true → soft toggle for light surfaces / card headers; its text hides on narrow cards).
// The toggle is ALWAYS the standard button height, the same as the action buttons it reveals.

const S = {
  wrap:     { ...UI2.row(LAYOUT2.inlineGap), justifyContent: 'flex-end' },
  // Labelled toggle: sliders icon · "Options" · small chevron — same white button open or closed
  // (the turning icon + flipping chevron show the state).
  toggle:   { ...UI2.btn.light, flexShrink: 0, boxShadow: SH2.glass },              // on the page (detail headers, PageWave)
  // STANDARD: the toggle is always the same height as the buttons it reveals (standard button height SZ2.control.md)
  toggleSm: { ...UI2.btn.soft, flexShrink: 0 },                                    // compact: light surface → soft colour, standard height
  chevron:  { fontSize: FS2.sm, marginLeft: -SP2.xxs },
};

export default function ActionTray({ children, primary, label = 'Options', closeLabel = 'Options', compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const trayId = useId();

  // Close on a click outside or Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <div ref={ref} style={S.wrap}>
      <div
        id={trayId}
        className={`un2-tray${open ? ' is-open' : ''}`}
        // choosing an action closes the tray (the action's own onClick still runs)
        onClick={e => { if (e.target.closest('button')) setOpen(false); }}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="un2-tray-inner">
          {/* frosted-glass capsule holding the actions */}
          <div className="un2-tray-capsule">
            {items.map((child, i) => (
              <span key={child.key ?? i} className="un2-tray-item" style={{ '--un2-i': items.length - 1 - i }}>{child}</span>
            ))}
          </div>
        </div>
      </div>
      {items.length > 0 && (
        <button
          type="button" className={`un2-btn un2-tray-toggle${open ? ' is-open' : ''}`} style={compact ? S.toggleSm : S.toggle} title={open ? closeLabel : label} aria-label={open ? closeLabel : label}
          aria-expanded={open} aria-controls={trayId}
          onClick={() => setOpen(o => !o)}
        >
          <i className="ti ti-adjustments-horizontal un2-tray-icon" style={UI2.btnIcon} aria-hidden="true" />
          {/* compact (in a card): label hides on a narrow card, like the other card buttons */}
          <span className={compact ? 'un2-hide-medium' : undefined}>{open ? closeLabel : label}</span>
          {/* chevron points to where the actions slide out; flips when open */}
          <i className="ti ti-chevron-left un2-tray-chevron" style={S.chevron} aria-hidden="true" />
        </button>
      )}
      {primary}
    </div>
  );
}
