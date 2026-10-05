/**
 * promotionTokens.js — Shared design tokens + primitives for the Promotion
 * Engine screens (UN Admin Portal → Advertise & Monetise → Promotion Engine).
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48.
 *
 * IMPORTANT — design source of truth: these tokens are copied from the REAL
 * live UN Admin screens (UNAdminShell.jsx / NavE.jsx / UNAdminPlanCatalog.jsx
 * / PMListingsOverview.jsx), NOT from the Figma reference the feature was
 * designed against. Per the user's explicit Session 48 direction: "UN
 * standard design principles for UN Admin screen — like Font, Primary/
 * Secondary color, Background color, Dropdowns size, color etc of the
 * existing Admin screens will take precedent over the figma." The Figma is a
 * content/layout/field reference only.
 *
 * Every Promotion Engine screen file should import C/F from here rather than
 * redefining its own local copy, so the four tabs (and the shell) can never
 * visually drift from each other — one deliberate difference from
 * UNAdminPlanCatalog.jsx's pattern of an inline per-file token object, made
 * because this feature is one cohesive page with several sibling files
 * rather than several independent config pages.
 *
 * Also exports the Sample Data watermark + dead-end action primitives, taken
 * from the locked convention in PMListingsOverview.jsx (see
 * claude/Listings_Overview_Design_Review.md §7) — reused as-is so sample
 * data reads identically here as it does everywhere else in the app.
 */

import React, { useState } from 'react';
import RealCustomDropdown from '../../../../components/ui/CustomDropdown';

// ─── Design tokens — copied from UNAdminShell.jsx / NavE.jsx / UNAdminPlanCatalog.jsx ──
export const C = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  navBg:         '#111827',
  pageBg:        '#F8FAFC',
  cardBg:        '#FFFFFF',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  white:         '#FFFFFF',
  neutral:       '#F1F5F9',
  green:         '#16A34A',
  danger:        '#E53E3E',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FCD34D',
  amberText:     '#92400E',
  blue:          '#1D4ED8',
  blueLight:     '#EFF6FF',
  // Sample Data watermark — exact colors from PMListingsOverview.jsx
  sampleTag:     '#B45309',
  sampleTagBg:   '#FFFBEB',
  sampleTagBdr:  '#FDE68A',
};

export const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── CustomDropdown wrapper ──────────────────────────────────────────────
// Use `import { CustomDropdown } from './promotionTokens'` for every
// dropdown/select on these screens — never a native <select> — per the
// Design System §9 standard.
//
// This wraps the real, shared components/ui/CustomDropdown rather than
// re-exporting it directly, so every Promotion Engine dropdown's closed
// (trigger) background can be white (C.white / #FFFFFF) — matching the
// real UN Admin "Operations → Applications" screen's FilterSelect — without
// changing the shared component's own default (#F8F9FA) for every other
// screen in the app that also uses it. The shared component's `bg` prop
// (added for this) makes that override possible with no other screen
// affected.
export function CustomDropdown(props) {
  return <RealCustomDropdown bg={C.white} {...props} />;
}

// ─── Sample Data watermark primitives (copied from PMListingsOverview.jsx) ──
export function SampleTag({ style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: C.sampleTagBg, border: `1px solid ${C.sampleTagBdr}`,
      fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.sampleTag,
      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
      ...style,
    }}>
      <i className="ti ti-flask" style={{ fontSize: 10 }} />
      Sample Data
    </span>
  );
}

export function SampleCard({ children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>
        <SampleTag />
      </div>
      {children}
    </div>
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

export function DeadEndButton({ label, icon, tooltip, style, small }) {
  return (
    <ActionTooltip text={tooltip}>
      <button disabled style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: small ? '5px 10px' : '7px 14px',
        background: '#F1F5F9', border: `1px solid ${C.border}`, borderRadius: 7,
        fontFamily: F.body, fontSize: small ? 11 : 12, fontWeight: 700,
        color: C.textTertiary, cursor: 'not-allowed',
        ...style,
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 13 }} />}
        {label}
      </button>
    </ActionTooltip>
  );
}

// ─── Generic stat tile — same visual language as PMListingsOverview.jsx's
// StatTile, kept generic (no samplePill baked in) since Promotion Engine
// tabs will decide per-stat whether it's sample-sourced.
export function StatTile({ label, value, subtitle, accent, icon, sample }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 150, background: C.cardBg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${accent || C.primary}`, borderRadius: 9, padding: '10px 14px 9px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {sample && <div style={{ position: 'absolute', top: 8, right: 8 }}><SampleTag /></div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {icon && (
          <div style={{ width: 24, height: 24, borderRadius: 6, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${icon}`} style={{ fontSize: 13, color: accent || C.primary }} />
          </div>
        )}
        <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 3 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Status pill — small colored badge for plan/campaign/purchase status ───
// Sizing/weight matches the real Pill component in
// UNAdminListingReadiness.jsx exactly (padding 3px 10px, radius 999,
// fontSize 11, fontWeight 500, letterSpacing 0.02em, no border) — that's
// the live convention for this kind of pill elsewhere in UN Admin, so this
// one shouldn't drift from it.
export function StatusPill({ status, tone }) {
  const tones = {
    green:  { bg: '#ECFDF5', text: '#047857' },
    amber:  { bg: C.amberBg, text: C.amberText },
    grey:   { bg: '#F1F5F9', text: C.textSecondary },
    red:    { bg: '#FEF2F2', text: '#B91C1C' },
    blue:   { bg: C.blueLight, text: C.blue },
  };
  const t = tones[tone] || tones.grey;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      background: t.bg, color: t.text,
      fontFamily: F.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
