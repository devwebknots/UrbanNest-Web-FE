/**
 * pmScreeningConfigTokens.js — Shared design tokens + primitives for the
 * PM Portal's "Screening Configuration" screen (Configuration → Screening
 * Rules, the reserved `screening-rules` nav slot in NavB.jsx).
 * ─────────────────────────────────────────────────────────────────────────────
 * "Session 68". Copied from the UN Admin Screening Configuration screen's own
 * screeningConfigTokens.js (same convention that file documents — each
 * feature owns its own token copy) so this PM-side screen is visually
 * identical to the UN Admin one, per the explicit 2026-11-12 request
 * ("Ideally the screens should be same as the UrbanNest Admin"). Adds three
 * PM-specific primitives the UN Admin screen never needed, since UN Admin IS
 * the source of every default rather than a consumer of someone else's:
 *   - ProtectedField   — a field UrbanNest Admin has NOT allowed this PM to
 *                         override. Dashed border + lock icon, matching the
 *                         existing `lockedField` convention already used in
 *                         this exact folder (PMVerificationSettings.jsx),
 *                         not a new visual language.
 *   - OverrideStatusBadge — "UrbanNest Default" vs "Customized" pill, shown
 *                         next to any field the PM IS allowed to override.
 *   - SignoffPill      — small amber note for a RESTRICTED-permission
 *                         criterion (Tab 2 §01 drawers only) — PM can
 *                         propose a value, but the existing UN Admin data
 *                         already documents these as needing Lead
 *                         Admin/Compliance sign-off before taking effect.
 *                         No real sign-off workflow exists (no backend at
 *                         all yet — see PMScreeningConfiguration.jsx's own
 *                         header note), so this is a honesty label, not a
 *                         working approval queue.
 *
 * See screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
 * (Claude Project), new Section 18, for the full PM-side review/build this
 * implements.
 */
import React, { useState, useRef, useEffect } from 'react';
import { CustomDropdown } from '../../../components/ui';

// Identical values to screeningConfigTokens.js (UN Admin) — same palette,
// same fonts, by explicit request.
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
  purple:        '#6D28D9',
  purpleBg:      '#F5F3FF',
};

export const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

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

export const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
export const modalBase = { background: C.white, borderRadius: 12, padding: 28, width: '90%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' };
export const btnPrimary = { height: 40, padding: '0 20px', borderRadius: 9, border: 'none', background: C.primary, fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
export const btnCancel = { height: 40, padding: '0 20px', borderRadius: 9, border: `1.5px solid ${C.borderMedium}`, background: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary, cursor: 'pointer' };
export const fieldLabel = { display: 'block', fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
export const hintStyle = { fontFamily: F.body, fontSize: 11, fontWeight: 400, opacity: 1, color: C.textTertiary, marginTop: 4, lineHeight: 1.5 };
export const inputStyle = (disabled = false, error = false) => ({
  width: '100%', height: 40, boxSizing: 'border-box',
  background: disabled ? C.neutral : C.white,
  border: `1px solid ${error ? C.danger : disabled ? C.border : C.borderMedium}`,
  borderRadius: 8, padding: '0 12px',
  fontFamily: F.body, fontSize: 13,
  color: disabled ? C.textTertiary : C.textPrimary,
  cursor: disabled ? 'not-allowed' : 'text', outline: 'none',
});

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

const MSD_C = { inputBg: '#F8F9FA', inputBorder: '#E8ECF0', textPrimary: '#0F172A', textSecondary: '#64748B', textTertiary: '#94A3B8', white: '#FFFFFF', neutral: '#F8FAFC', hoverBg: '#F0F5FF', selectedBg: '#EFF6FF', primary: '#002D5B' };
export function MultiSelectDropdown({ options = [], value, onChange, placeholder = 'Select…', disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const selected = Array.isArray(value) ? value : [];
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const toggleOption = (v) => { if (disabled) return; onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]); };
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div onClick={() => !disabled && setOpen((o) => !o)} role="listbox" aria-multiselectable="true" aria-expanded={open}
        style={{ width: '100%', height: 38, boxSizing: 'border-box', background: disabled ? MSD_C.neutral : MSD_C.white, border: `1px solid ${MSD_C.inputBorder}`, borderRadius: open ? '6px 6px 0 0' : '6px', padding: '0 32px 0 11px', display: 'flex', alignItems: 'center', fontFamily: F.body, fontSize: 13, color: selectedLabels.length ? MSD_C.textPrimary : MSD_C.textTertiary, cursor: disabled ? 'not-allowed' : 'pointer', userSelect: 'none', opacity: disabled ? 0.6 : 1 }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabels.length ? selectedLabels.join(', ') : placeholder}</span>
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ position: 'absolute', right: 10, fontSize: 13, color: MSD_C.textSecondary, pointerEvents: 'none' }} />
      </div>
      {open && (
        <div role="listbox" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: MSD_C.white, border: `1px solid ${MSD_C.inputBorder}`, borderTop: 'none', borderRadius: '0 0 6px 6px', boxShadow: '0 6px 16px rgba(0,45,91,0.08)', maxHeight: 220, overflowY: 'auto' }}>
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <div key={o.value} role="option" aria-selected={checked} onClick={() => toggleOption(o.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', background: checked ? MSD_C.selectedBg : MSD_C.white, fontFamily: F.body, fontSize: 13, color: checked ? MSD_C.primary : MSD_C.textPrimary }}
                onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = MSD_C.hoverBg; }}
                onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = MSD_C.white; }}>
                <input type="checkbox" checked={checked} readOnly style={{ pointerEvents: 'none', margin: 0 }} />
                <span>{o.label}</span>
              </div>
            );
          })}
          {options.length === 0 && <div style={{ padding: 12, fontFamily: F.body, fontSize: 12, color: MSD_C.textTertiary, textAlign: 'center' }}>No options available</div>}
        </div>
      )}
    </div>
  );
}

export const noSpinnerClass = 'un-pm-sc-no-spinner';
export function NoSpinnerStyle() {
  return (
    <style>{`
      .${noSpinnerClass}::-webkit-outer-spin-button,
      .${noSpinnerClass}::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      .${noSpinnerClass} { -moz-appearance: textfield; }
    `}</style>
  );
}

// ─── PM-specific primitives (not present on the UN Admin screen, which has
// no "someone else's default" concept to protect fields against) ───────────

// Matches PMVerificationSettings.jsx's own `lockedField` convention in this
// same folder (dashed border, not-allowed cursor, lock icon) rather than
// inventing a new "protected" visual language for this screen alone.
export function ProtectedField({ children, note }) {
  return (
    <div>
      <div style={{
        ...inputStyle(true), display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: `1px dashed ${C.borderMedium}`, gap: 8,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
        <i className="ti ti-lock" style={{ fontSize: 12, color: C.textTertiary, flexShrink: 0 }} />
      </div>
      <div style={hintStyle}>{note || 'Set by UrbanNest Admin — not customizable for your account.'}</div>
    </div>
  );
}

export function OverrideStatusBadge({ customized }) {
  return customized
    ? <Pill bg={C.purpleBg} color={C.purple}><i className="ti ti-edit" style={{ fontSize: 10 }} />Customized</Pill>
    : <Pill bg={C.neutral} color={C.textSecondary}>UrbanNest Default</Pill>;
}

// RESTRICTED-permission criteria (Tab 2 §01 drawers only) — PM can propose a
// value, but the existing UN Admin data already documents these as needing
// Lead Admin/Compliance sign-off. No real approval queue exists (no backend
// at all for this screen yet), so this is an honesty label, not a working
// workflow — same spirit as this screen's SampleTag.
export function SignoffPill() {
  return (
    <Pill bg={C.amberBg} color={C.amberText}>
      <i className="ti ti-shield-check" style={{ fontSize: 10 }} />
      Restricted — Requires Sign-off
    </Pill>
  );
}
