/**
 * screeningConfigTokens.js — Shared design tokens + Sample Data primitives
 * for the Screening Configuration screen (UN Admin → Configurations →
 * Screening Config).
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 60. Copied from ruleEngineTokens.js (NOT imported — each feature
 * owns its own token copy, same convention that file's own header documents,
 * traced back to promotionTokens.js), so this screen never visually drifts
 * from its sibling Rule Engine/Listing Readiness screens even though it
 * lives in a separate folder. Carries the same Sample Data watermark
 * primitives (SampleTag/ActionTooltip/DeadEndButton) plus a Toggle switch
 * this screen's editable boolean fields need that the copied-from file
 * didn't have.
 *
 * See screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
 * (Claude Project) for the real-vs-sample split this screen implements:
 * every numeric/toggle/text POLICY VALUE here is real, editable, saved
 * (locally — no backend exists yet for this app); every named vendor/
 * engine/compliance-gateway claim (Socure, Persona, Plaid, Argyle,
 * TransUnion, LexisNexis, "ALL SCREENING GATEWAYS OPERATIONAL", audit
 * signatures, version/release tags) is sample-tagged, since none of those
 * integrations exist.
 */
import React, { useState, useRef, useEffect } from 'react';
import { CustomDropdown } from '../../../../components/ui';

// Session 62 — pageBg/neutral swapped to match Independent PM's own values
// (src/pages/IndependentPM/IndependentPM_Step1.jsx: pageBg #F1F5F9, neutral
// #F8FAFC) exactly, per the "adopt Independent PM's design methodology"
// request. These were already the same two hex values on this screen —
// just assigned to the opposite token name.
export const C = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  pageBg:        '#F1F5F9',
  white:         '#FFFFFF',
  neutral:       '#F8FAFC',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  danger:        '#E53E3E',
  dangerBg:      '#FEF2F2',
  green:         '#166534',
  greenBg:       '#F0FDF4',
  greenBorder:   '#BBF7D0',
  amberBg:       '#FEF3C7',
  amberText:     '#92400E',
  amberBorder:   '#FCD34D',
  blue:          '#1D4ED8',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
};

export const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── Badge (matches UNAdminListingReadiness.jsx's Pill exactly) ───────────────
export function Pill({ bg, color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
      background: bg, color,
    }}>
      {children}
    </span>
  );
}

// ─── Sample Data watermark (same convention as ruleEngineTokens.js /
// promotionTokens.js / PMListingsOverview.jsx) ────────────────────────────────
export function SampleTag({ style, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: C.amberBg, border: `1px solid ${C.amberBorder}`,
      fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.amberText,
      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
      ...style,
    }}>
      <i className="ti ti-flask" style={{ fontSize: 10 }} />
      {label || 'Sample / No Live Integration'}
    </span>
  );
}

export function ActionTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', fontFamily: F.body, fontSize: 10.5, fontWeight: 600, padding: '5px 9px', borderRadius: 5, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 400 }}>
          {text}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #0F172A' }} />
        </div>
      )}
    </div>
  );
}

// Disabled, tooltipped button for an action that genuinely needs a real
// endpoint that doesn't exist yet — never a fake success state. Same
// convention/markup as ruleEngineTokens.js's/promotionTokens.js's
// DeadEndButton. Used here for Validate Configuration / Submit for Review /
// View Version History — none of those have a real backend behind them yet.
export function DeadEndButton({ label, icon, tooltip, style, small }) {
  return (
    <ActionTooltip text={tooltip}>
      <button disabled style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: small ? '5px 10px' : '0 20px',
        height: small ? undefined : 38,
        background: '#F1F5F9', border: `1px solid ${C.border}`, borderRadius: 8,
        fontFamily: F.body, fontSize: small ? 11 : 13, fontWeight: 500,
        color: C.textTertiary, cursor: 'not-allowed',
        ...style,
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 13 }} />}
        {label}
      </button>
    </ActionTooltip>
  );
}

// ─── Toggle switch — this screen's editable boolean fields are real local
// state (see mockTenantScreeningConfig.js), so this is a genuine control,
// not a DeadEndButton. ─────────────────────────────────────────────────────
export function Toggle({ value, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: disabled ? C.borderMedium : (value ? C.green : C.textTertiary),
        display: 'flex', alignItems: 'center', padding: '0 3px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: C.white, marginLeft: value ? 'auto' : 0, transition: 'margin 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );
}

// ─── Heavy sample overlay — for content that doesn't just LABEL itself as
// sample but could be mistaken, out of context, for a real live action (e.g.
// a fabricated AI decision on a fabricated applicant). A small corner tag
// isn't enough here; this stamps the whole card so the "not real" framing
// survives a cropped screenshot. Session 61 — see
// screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
// §8.2 for why this card specifically needed heavier treatment than the
// vendor badges elsewhere on this screen. ────────────────────────────────────
export function SampleOverlayBanner({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 14px', borderRadius: '10px 10px 0 0',
      background: C.amberText, color: '#FFFBEB',
      fontFamily: F.body, fontSize: 11.5, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      <i className="ti ti-flask" style={{ fontSize: 14 }} />
      {label || 'Illustrative Example Only — No Live Model Exists'}
    </div>
  );
}

// 3-state permission radio group — "PM Customization Permission" in the
// Criterion Configuration drawer (Tab 2 §01). Richer than Tab 1's plain
// boolean `locked` flag; added per the Nov 12 decision to build it as a
// real, saved control, not just drawer decoration.
// Session 65 — `optionLabelStyle` is an optional override merged over the
// option-label text's default style, added so a single caller (the Income
// Qualification drawer) can request a slightly dimmer/lighter look for its
// Allowed/Restricted/Locked labels without changing every other drawer's
// PermissionRadioGroup, which still gets the default 700-weight/opaque text.
export function PermissionRadioGroup({ value, onChange, options, notes, disabled, optionLabelStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((opt) => (
        <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: disabled ? 'default' : 'pointer' }}>
          <input
            type="radio"
            checked={value === opt}
            disabled={disabled}
            onChange={() => onChange(opt)}
            style={{ marginTop: 3 }}
          />
          <div>
            <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, ...optionLabelStyle }}>
              {opt.charAt(0) + opt.slice(1).toLowerCase()}
              {value === opt && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: C.primary }}>(Selected)</span>}
            </div>
            {notes && notes[opt] && <div style={{ ...hintStyle, marginTop: 2 }}>{notes[opt]}</div>}
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── Shared layout primitives (matches UNAdminListingReadiness.jsx /
// ruleEngineTokens.js) ────────────────────────────────────────────────────────
export const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
};
export const modalBase = {
  background: C.white, borderRadius: 12,
  padding: 28, width: '90%', maxWidth: 560,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
};
// Height/radius/weight brought in line with Independent PM's own Save
// button (height 40 to match the new inputStyle rhythm, radius 9, bold 700).
export const btnPrimary = {
  height: 40, padding: '0 20px', borderRadius: 9,
  border: 'none', background: C.primary,
  fontFamily: F.body, fontSize: 13, fontWeight: 700,
  color: C.white, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
};
export const btnCancel = {
  height: 40, padding: '0 20px', borderRadius: 9,
  border: `1.5px solid ${C.borderMedium}`, background: C.white,
  fontFamily: F.body, fontSize: 13, fontWeight: 600,
  color: C.textPrimary, cursor: 'pointer',
};
export const dividerS = { borderTop: `1px solid ${C.border}`, margin: '20px 0' };
// Matches Independent PM's `FL` label style exactly (weight 700, not 500).
export const fieldLabel = {
  display: 'block', fontFamily: F.body, fontSize: 10, fontWeight: 700,
  color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};
// Session 64 — fontWeight/opacity made explicit (previously relied on CSS
// defaults of normal/1) so every hint/note across the screen is guaranteed
// the same four properties, not just visually similar by coincidence.
export const hintStyle = {
  fontFamily: F.body, fontSize: 11, fontWeight: 400, opacity: 1,
  color: C.textTertiary, marginTop: 4, lineHeight: 1.5,
};
// Independent PM's own `inputS(disabled, error)`, adopted verbatim —
// Session 62. White field lifted off the gray page when editable; neutral
// background + dimmed text when disabled — instead of the field blending
// into the page background, which is what this screen did before (its old
// inputStyle used `background: C.pageBg` unconditionally).
export const inputStyle = (disabled = false, error = false) => ({
  width: '100%', height: 40, boxSizing: 'border-box',
  background: disabled ? C.neutral : C.white,
  border: `1px solid ${error ? C.danger : disabled ? C.border : C.borderMedium}`,
  borderRadius: 8, padding: '0 12px',
  fontFamily: F.body, fontSize: 13,
  color: disabled ? C.textTertiary : C.textPrimary,
  cursor: disabled ? 'not-allowed' : 'text', outline: 'none',
});

// Dropdown + "Custom…" escape hatch — Independent PM imports and uses the
// real CustomDropdown component (Design System §9: "replaces all native
// <select> elements"); this screen previously had zero dropdowns, building
// every choice-like field as free text instead. Applied here to this
// screen's hardcoded-option fields. A value not on the list (or the
// "Custom…" option itself) reveals a plain text input below, so a value
// saved under an older scheme — or a genuinely one-off value — is never
// silently dropped. Session 62.
//
// Session 64 — CustomDropdown's own default trigger background (#F8F9FA)
// is nearly the same light gray as this screen's own card/section
// background (C.pageBg, #F1F5F9), so an enabled dropdown barely lifted off
// its card at all — the opposite of inputStyle()'s "white field on gray
// page" contrast that every text/number input on this screen already has.
// CustomDropdown exposes a `bg` prop for exactly this (its own file notes
// "lets a caller... opt into a different closed-state background"), so
// passing white here, same as inputStyle()'s enabled case, fixes it
// without touching the shared component's own default for every other
// screen that uses it. When disabled, CustomDropdown ignores `bg` and
// always uses its own neutral tone, so this is safe to pass unconditionally.
export function DropdownOrCustom({ options, value, onChange, disabled, placeholder }) {
  const matchesOption = options.some((o) => o.value === value);
  const [forceCustom, setForceCustom] = useState(!matchesOption);
  const showCustomInput = forceCustom || !matchesOption;
  const ddOptions = [...options, { value: '__CUSTOM__', label: 'Custom…' }];
  return (
    <div>
      <CustomDropdown
        options={ddOptions}
        value={showCustomInput ? '__CUSTOM__' : value}
        disabled={disabled}
        placeholder={placeholder}
        bg={C.white}
        onChange={(v) => {
          if (v === '__CUSTOM__') { setForceCustom(true); }
          else { setForceCustom(false); onChange(v); }
        }}
      />
      {showCustomInput && (
        <input
          value={matchesOption ? '' : value}
          placeholder="Enter a custom value…"
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle(disabled), marginTop: 8 }}
        />
      )}
    </div>
  );
}

// ─── Multi-select dropdown — Session 64. Two fields on this screen genuinely
// hold more than one value at once (Applicable Personas, Allowed ID Types);
// the real CustomDropdown component is single-select only (no multi-select/
// chip component previously existed anywhere in this codebase — flagged as
// a gap in the Session 62 re-skin, §12.2 of the Figma review doc). Built
// from scratch here rather than wrapping CustomDropdown, since the trigger,
// list-item (checkbox, not single-select-then-close) and value-shape
// (array, not a single value) behaviors all differ. Visually matches
// CustomDropdown's own hardcoded styling (height 38, radius 6, border
// #E8ECF0, bg #F8F9FA, Nunito Sans 13px) so the two controls still read as
// one family, per the Design System §9 standard this screen otherwise
// follows. `value` is always an array; selected labels are shown
// comma-joined in the trigger, same as a normal dropdown's single label.
const MSD_C = {
  inputBg: '#F8F9FA', inputBorder: '#E8ECF0', textPrimary: '#0F172A',
  textSecondary: '#64748B', textTertiary: '#94A3B8', white: '#FFFFFF',
  neutral: '#F8FAFC', hoverBg: '#F0F5FF', selectedBg: '#EFF6FF', primary: '#002D5B',
};
export function MultiSelectDropdown({ options = [], value, onChange, placeholder = 'Select…', disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const toggleOption = (v) => {
    if (disabled) return;
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        role="listbox"
        aria-multiselectable="true"
        aria-expanded={open}
        style={{
          width: '100%', height: 38, boxSizing: 'border-box',
          // Session 64 — same contrast fix as DropdownOrCustom above: white
          // when enabled (matches inputStyle()'s text/number fields), this
          // component's own neutral tone when disabled.
          background: disabled ? MSD_C.neutral : MSD_C.white,
          border: `1px solid ${MSD_C.inputBorder}`,
          borderRadius: open ? '6px 6px 0 0' : '6px',
          padding: '0 32px 0 11px',
          display: 'flex', alignItems: 'center',
          fontFamily: F.body, fontSize: 13,
          color: selectedLabels.length ? MSD_C.textPrimary : MSD_C.textTertiary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none', opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </span>
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ position: 'absolute', right: 10, fontSize: 13, color: MSD_C.textSecondary, pointerEvents: 'none' }} />
      </div>

      {open && (
        <div role="listbox" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
          background: MSD_C.white, border: `1px solid ${MSD_C.inputBorder}`, borderTop: 'none',
          borderRadius: '0 0 6px 6px', boxShadow: '0 6px 16px rgba(0,45,91,0.08)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <div
                key={o.value}
                role="option"
                aria-selected={checked}
                onClick={() => toggleOption(o.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', cursor: 'pointer',
                  background: checked ? MSD_C.selectedBg : MSD_C.white,
                  fontFamily: F.body, fontSize: 13,
                  color: checked ? MSD_C.primary : MSD_C.textPrimary,
                }}
                onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = MSD_C.hoverBg; }}
                onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = MSD_C.white; }}
              >
                <input type="checkbox" checked={checked} readOnly style={{ pointerEvents: 'none', margin: 0 }} />
                <span>{o.label}</span>
              </div>
            );
          })}
          {options.length === 0 && (
            <div style={{ padding: 12, fontFamily: F.body, fontSize: 12, color: MSD_C.textTertiary, textAlign: 'center' }}>No options available</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Removes the native number-input spin buttons (Chrome/Safari render
// them inside the content box; in a narrow fixed-width field — e.g. a PM
// Override Bounds min/max pair — they overlap and clip the digits). Inline
// styles can't target the `::-webkit-*-spin-button` pseudo-elements, so
// this is a one-time scoped <style> block; `noSpinnerClass` is applied to
// every narrow numeric input on this screen. Session 64.
export const noSpinnerClass = 'un-sc-no-spinner';
export function NoSpinnerStyle() {
  return (
    <style>{`
      .${noSpinnerClass}::-webkit-outer-spin-button,
      .${noSpinnerClass}::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      .${noSpinnerClass} { -moz-appearance: textfield; }
    `}</style>
  );
}
