/**
 * ruleEngineTokens.js — Shared design tokens + Sample Data primitives for
 * the Rule Engine's Market Display tab (UN Admin → Configurations → Rule
 * Engine → Market Display).
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 50 (continued). Copied from UNAdminListingReadiness.jsx's own
 * token block (NOT imported — each feature owns its own token copy, same
 * convention promotionTokens.js's header documents), so this tab never
 * visually drifts from its sibling Listings tab even though the two live in
 * separate files. Also carries the Sample Data watermark primitives
 * (SampleTag/ActionTooltip/DeadEndButton), copied from promotionTokens.js's
 * own copy of the locked PMListingsOverview.jsx convention, recolored to
 * this subtree's existing amber tokens instead of introducing new ones.
 */
import React, { useState } from 'react';

export const C = {
  primary:       '#002D5B',
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

// ─── Sample Data watermark (same convention as promotionTokens.js) ───────────
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
// convention/markup as promotionTokens.js's DeadEndButton.
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

// ─── Shared layout primitives (matches UNAdminListingReadiness.jsx) ───────────
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
export const btnPrimary = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: 'none', background: C.primary,
  fontFamily: F.body, fontSize: 13, fontWeight: 500,
  color: C.white, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
};
export const btnCancel = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: `1.5px solid ${C.borderMedium}`, background: C.white,
  fontFamily: F.body, fontSize: 13, fontWeight: 500,
  color: C.textPrimary, cursor: 'pointer',
};
export const fieldLabel = {
  fontFamily: F.body, fontSize: 10, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: C.textSecondary, display: 'block', marginBottom: 5,
};
export const hintStyle = {
  fontFamily: F.body, fontSize: 11,
  color: C.textTertiary, marginTop: 4, lineHeight: 1.5,
};
