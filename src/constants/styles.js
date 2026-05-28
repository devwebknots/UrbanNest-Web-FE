// ─────────────────────────────────────────────
// UrbanNest — Shared Style Helpers
// Reusable style objects & factories used
// across all pages and components
// ─────────────────────────────────────────────

import { C } from './colors';
import { F, TEXT } from './fonts';

// ── Form field label ──────────────────────────
export const labelStyle = {
  display: 'block',
  ...TEXT.fieldLabel,
  color: C.textSecondary,
  marginBottom: 5,
};

// ── Text input / select (focus-aware factory) ─
export const inputStyle = (focused = false) => ({
  width: '100%',
  height: 42,
  background: focused ? C.white : C.neutral,
  border: `1px solid ${focused ? C.primary : C.border}`,
  borderRadius: 8,
  padding: '10px 12px',
  ...TEXT.inputText,
  color: C.textPrimary,
  outline: 'none',
  transition: 'border-color 0.18s, background 0.18s',
  boxSizing: 'border-box',
});

// ── Primary button ────────────────────────────
export const primaryBtnStyle = {
  width: '100%',
  height: 50,
  background: C.primary,
  color: C.white,
  border: 'none',
  borderRadius: 8,
  ...TEXT.buttonText,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: 'background 0.2s',
};

// ── Secondary / outline button ────────────────
export const secondaryBtnStyle = {
  height: 40,
  background: 'transparent',
  color: C.textSecondary,
  border: `1px solid ${C.borderMedium}`,
  borderRadius: 8,
  ...TEXT.buttonText,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '0 28px',
  transition: 'background 0.18s, border-color 0.18s',
};

// ── Social auth button ────────────────────────
export const socialBtnStyle = {
  flex: 1,
  height: 46,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  background: C.white,
  ...TEXT.tabLabel,
  color: C.textPrimary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  transition: 'border-color 0.18s, background 0.18s',
};

// ── Card container ────────────────────────────
export const cardStyle = {
  background: C.white,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '22px 24px',
};

// ── Page/modal backdrop (dot grid) ───────────
export const dotGridBg = {
  minHeight: '100vh',
  background: '#F0F2F5',
  backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
  backgroundSize: '28px 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

// ── Divider with label ────────────────────────
export const dividerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  margin: '22px 0',
};

export { C, F };
