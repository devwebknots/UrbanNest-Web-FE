import React from 'react';
import { C2, G2, R2, SH2, TONES2, F2, FS2, FW2, LH2, SP2, SZ2, pad, UI2 } from '../../constants';

// ─── Form controls (Design System v2) ────────────────────────────────────────
// VERSION 2 controls — the v1 equivalents are Checkbox / Toggle / RadioPillButton in
// pages/Landlord/Listing/listingWizardShared.jsx (older wizard steps).
// "On" / selected is ALWAYS the app's light primary blue (G2.primaryButton · C2.primaryLight · TONES2.primary) —
// never green (user rule 2026-11-23: selection = light blue theme everywhere).
//
//   <Switch on={v} onChange={() => setV(x => !x)} label="Show exact address publicly" />
//   <Checkbox checked={v} onChange={() => setV(x => !x)} label="Also update the Property record" hint="…" />
//   <RadioPill label="Rent" on={type === 'RENT'} onClick={() => setType('RENT')} />
//   <ChoiceTile icon="ti-wifi" label="WiFi" selected={sel} onClick={toggle} />      ← amenity picker tile
//
// All are real <button>s (keyboard + screen-reader friendly). disabled → muted, not clickable.

const S = {
  // Switch — track + knob
  track: (on) => ({
    position: 'relative', width: SZ2.switch.w, height: SZ2.switch.h, flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer',
    borderRadius: R2.pill, background: on ? G2.primaryButton : C2.border, transition: 'background 0.2s ease',
  }),
  knob: (on) => ({
    position: 'absolute', top: (SZ2.switch.h - SZ2.switch.knob) / 2, left: on ? SZ2.switch.w - SZ2.switch.knob - (SZ2.switch.h - SZ2.switch.knob) / 2 : (SZ2.switch.h - SZ2.switch.knob) / 2,
    width: SZ2.switch.knob, height: SZ2.switch.knob, borderRadius: R2.round, background: C2.white, boxShadow: SH2.control, transition: 'left 0.2s ease',
  }),

  // Checkbox — box + optional label / hint beside it
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: SP2.sm, padding: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F2.body },
  box: (on) => ({
    ...UI2.center, width: SZ2.check, height: SZ2.check, flexShrink: 0, borderRadius: R2.xs, boxSizing: 'border-box',
    background: on ? G2.primaryButton : C2.white, border: on ? 'none' : `1px solid ${C2.cardBorder}`, color: C2.white, fontSize: FS2.sm,
  }),
  checkLabel: (strong) => ({ fontSize: FS2.base, fontWeight: strong ? FW2.medium : FW2.regular, lineHeight: LH2.heading, color: strong ? C2.textPrimary : C2.textBody }),
  checkHint:  { ...UI2.text.meta, marginTop: SP2.xxs },

  // RadioPill — white pill with a radio circle
  pill: (on) => ({
    ...UI2.row(SP2.sm), minHeight: SZ2.control.lg, padding: pad(0, SP2.xl, 0, SP2.md), border: 'none', borderRadius: R2.pill, cursor: 'pointer',
    background: C2.white, boxShadow: SH2.control, fontFamily: F2.body, fontSize: FS2.base, fontWeight: on ? FW2.medium : FW2.regular,
    color: C2.textPrimary, whiteSpace: 'nowrap',
  }),
  radio: (on) => ({
    ...UI2.center, width: SZ2.check, height: SZ2.check, flexShrink: 0, borderRadius: R2.round, boxSizing: 'border-box',
    border: `2px solid ${on ? C2.primaryLight : C2.cardBorder}`, background: C2.white,
  }),
  radioDot: { width: SZ2.radioDot, height: SZ2.radioDot, borderRadius: R2.round, background: G2.primaryButton },

  // ChoiceTile — soft tinted tile (no border: grouping by tint only), selected = light primary-blue tint + check
  tile: (on) => ({
    ...UI2.row(SP2.sm), width: '100%', minWidth: 0, minHeight: SZ2.amenityTile, padding: pad(0, SP2.md), border: 'none', borderRadius: R2.lg,
    cursor: 'pointer', textAlign: 'left', fontFamily: F2.body,
    background: on ? TONES2.primary.soft : C2.background, transition: 'background 0.15s ease',
  }),
  tileIcon:  { fontSize: FS2.lg, color: C2.primary, flexShrink: 0 },
  tileLabel: (on) => ({ flex: 1, minWidth: 0, ...UI2.truncate, fontSize: FS2.base, fontWeight: FW2.medium, color: on ? TONES2.primary.fg : C2.textPrimary }),
  tileCheck: { fontSize: FS2.md, color: C2.primaryLight, flexShrink: 0 },

  disabled: { opacity: 0.5, cursor: 'not-allowed' },
};

export function Switch({ on, onChange, label, disabled = false }) {
  return (
    <button
      type="button" role="switch" aria-checked={!!on} aria-label={label} disabled={disabled}
      style={{ ...S.track(on), ...(disabled ? S.disabled : {}) }} onClick={onChange}
    >
      <span style={S.knob(on)} aria-hidden="true" />
    </button>
  );
}

export function Checkbox({ checked, onChange, label, hint, strong = false, disabled = false }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={!!checked} disabled={disabled}
      style={{ ...S.checkRow, ...(disabled ? S.disabled : {}) }} onClick={onChange}
    >
      <span style={S.box(checked)} aria-hidden="true">{checked && <i className="ti ti-check" />}</span>
      {(label || hint) && (
        <span>
          {label && <span style={S.checkLabel(strong)}>{label}</span>}
          {hint && <span style={{ ...S.checkHint, display: 'block' }}>{hint}</span>}
        </span>
      )}
    </button>
  );
}

export function RadioPill({ label, on, onClick, disabled = false }) {
  return (
    <button
      type="button" role="radio" aria-checked={!!on} disabled={disabled} className="un2-raise"
      style={{ ...S.pill(on), ...(disabled ? S.disabled : {}) }} onClick={onClick}
    >
      <span style={S.radio(on)} aria-hidden="true">{on && <span style={S.radioDot} />}</span>
      {label}
    </button>
  );
}

export function ChoiceTile({ icon, label, selected, onClick }) {
  return (
    <button type="button" role="checkbox" aria-checked={!!selected} style={S.tile(selected)} onClick={onClick} title={label}>
      {icon && <i className={`ti ${icon}`} style={S.tileIcon} aria-hidden="true" />}
      <span style={S.tileLabel(selected)}>{label}</span>
      {selected && <i className="ti ti-circle-check-filled" style={S.tileCheck} aria-hidden="true" />}
    </button>
  );
}
