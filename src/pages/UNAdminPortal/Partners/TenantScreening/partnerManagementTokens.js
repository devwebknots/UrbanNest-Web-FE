/**
 * partnerManagementTokens.js — Shared design tokens + Sample Data primitives
 * for UN Admin → Partners → Tenant Screening (Partner Management).
 * ─────────────────────────────────────────────────────────────────────────────
 * Approved wireframe: https://claude.ai/artifact/M7ZMt4KgSZBXBCxKCTApeJ
 * (Partner List + Add/Edit screens, approved 2026-11-16).
 *
 * Copied from Configurations/RuleEngine/ruleEngineTokens.js (NOT imported —
 * each feature owns its own token copy, same convention that file's own
 * header documents), so this screen never visually drifts from its siblings
 * even though it lives in a separate file.
 *
 * No backend model exists yet for Partner/Provider (confirmed via a
 * read-only backend audit, 2026-11-15 — there is no Partner/Provider table
 * anywhere in the Django backend). Per ARCH_001 ("FE first, always"), this
 * whole feature runs against mockPartnerData.js today, watermarked with
 * SampleTag everywhere, exactly like MarketDisplayRules.jsx did ahead of
 * its own backend.
 */
import React, { useState } from 'react';

export const C = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  pageBg:        '#F8FAFC',
  white:         '#FFFFFF',
  neutral:       '#F1F5F9',
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

// ─── Badge ──────────────────────────────────────────────────────────────────
export function Pill({ bg, color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      background: bg, color, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// ─── Sample Data watermark (same convention as ruleEngineTokens.js / promotionTokens.js) ───
export function SampleTag({ style }) {
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
      Sample Data
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
// convention/markup as ruleEngineTokens.js's DeadEndButton.
export function DeadEndButton({ label, icon, tooltip, style, small }) {
  return (
    <ActionTooltip text={tooltip}>
      <button disabled style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: small ? '5px 10px' : '0 18px',
        height: small ? undefined : 36,
        background: '#F1F5F9', border: `1px solid ${C.border}`, borderRadius: 8,
        fontFamily: F.body, fontSize: small ? 11 : 13, fontWeight: 600,
        color: C.textTertiary, cursor: 'not-allowed',
        ...style,
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 13 }} />}
        {label}
      </button>
    </ActionTooltip>
  );
}

// Status switch — used at the top of PartnerFormModal (Session 71: moved
// there from a plain checkbox near the bottom, per user feedback) and
// anywhere else a binary Active/Inactive needs to read as a toggle rather
// than a checkbox.
export function Toggle({ checked, onChange, disabled, onLabel = 'Active', offLabel = 'Inactive' }) {
  return (
    <div
      onClick={() => { if (!disabled) onChange(!checked); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <span style={{
        position: 'relative', width: 40, height: 22, borderRadius: 999, flexShrink: 0,
        background: checked ? C.green : C.borderMedium,
        transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          width: 18, height: 18, borderRadius: '50%', background: C.white,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.15s',
        }} />
      </span>
      <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: checked ? C.green : C.textSecondary }}>
        {checked ? onLabel : offLabel}
      </span>
    </div>
  );
}

// ─── Shared layout primitives ────────────────────────────────────────────────
export const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
};
export const modalBase = {
  background: C.white, borderRadius: 14,
  padding: 28, width: '94%', maxWidth: 760,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
};
export const btnPrimary = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: 'none', background: C.primary,
  fontFamily: F.body, fontSize: 13, fontWeight: 600,
  color: C.white, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
};
export const btnCancel = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: `1.5px solid ${C.borderMedium}`, background: C.white,
  fontFamily: F.body, fontSize: 13, fontWeight: 600,
  color: C.textPrimary, cursor: 'pointer',
};
export const fieldLabel = {
  fontFamily: F.body, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: C.textSecondary, display: 'block', marginBottom: 6,
};
export const hintStyle = {
  fontFamily: F.body, fontSize: 11,
  color: C.textTertiary, marginTop: 4, lineHeight: 1.5,
};
export const inputBase = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 13,
  color: C.textPrimary, background: C.white, boxSizing: 'border-box',
};
export const chip = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: F.body, fontSize: 11.5, fontWeight: 700,
  padding: '5px 11px', borderRadius: 999,
  background: C.blueBg, color: C.blue,
};
export const chipAdd = {
  ...chip, background: C.neutral, color: C.textTertiary, cursor: 'pointer',
};
