// websiteTheme.js — visual foundation for rendered websites (Phase 2).
//
// Fonts and neutral colours come from Design System v2 (F2, C2). Websites are
// marketing pages, so headings use a larger scale than the v2 dashboard scale;
// that scale lives here, in one place. Brand colours are NOT defined here:
// they come from the website's own content (site.primary_color /
// site.accent_color), with v2 colours only as fallbacks when none are set.

import { C2, F2 } from '../../constants/v2';

export const FONT = { heading: F2.heading, body: F2.body };

// Website type scale (px). [desktop, mobile]
export const TYPE = {
  display: [56, 34],   // hero headline
  h1: [44, 30],        // page titles
  h2: [34, 26],        // section titles
  h3: [22, 19],        // card titles
  price: [28, 24],
  lead: [17, 15],
  body: [15, 14],
  small: [13, 12],
  eyebrow: [11, 10],
};
export const size = (key, compact) => TYPE[key][compact ? 1 : 0];

export const NEUTRAL = {
  text: C2.textPrimary,
  body: C2.textBody,
  muted: C2.textSecondary,
  subtle: C2.textMuted,
  border: C2.border,
  surface: C2.white,
  white: C2.white,
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

// CSS custom properties for one website, from its site content.
export function themeVars(site = {}) {
  const primary = HEX.test(site.primary_color || '') ? site.primary_color : C2.navyDeep;
  const accent = HEX.test(site.accent_color || '') ? site.accent_color : C2.primary;
  return {
    '--site-primary': primary,
    '--site-accent': accent,
    // Soft page and panel tints derived from the brand colours, so every
    // website gets a coherent background without extra settings.
    '--site-bg': `color-mix(in srgb, ${accent} 5%, ${C2.white})`,
    '--site-panel': `color-mix(in srgb, ${accent} 9%, ${C2.white})`,
    '--site-panel-strong': `color-mix(in srgb, ${primary} 92%, ${C2.black})`,
  };
}

export const V = {
  primary: 'var(--site-primary)',
  accent: 'var(--site-accent)',
  bg: 'var(--site-bg)',
  panel: 'var(--site-panel)',
  dark: 'var(--site-panel-strong)',
};

export const RADIUS = { sm: 4, md: 8, lg: 14 };
export const SHADOW = {
  card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
  lift: '0 12px 32px rgba(15, 23, 42, 0.12)',
};
export const MAX_WIDTH = 1200;
export const COMPACT_BELOW = 760;   // container width (px) under which the mobile layout is used
