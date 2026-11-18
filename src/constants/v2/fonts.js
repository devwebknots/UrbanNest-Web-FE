// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Design System v2 · Typography tokens
// Mirrors the UrbanNest mobile app (UrbanNestMobile/src/config/theme.ts):
//   Headings → Playfair Display   Body / UI → Inter
// Font files: src/assets/fonts/v2, @font-face in src/styles/v2/fonts.css.
// ─────────────────────────────────────────────────────────────────────────────

import { C2 } from './colors';

export const F2 = {
  heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
  body:    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const FW2 = { regular: 400, medium: 500, semibold: 600, bold: 700 };

// Standard web type scale (px). Use ONLY these sizes — no in-between values.
//   xxs 11 → badges, tags, eyebrows (minimum readable size)
//   xs  12 → captions, timestamps, meta text
//   sm  13 → secondary text, labels, links
//   base 14 → body text, buttons, nav items (default)
//   md  16 → emphasized body, list item titles
//   lg  18 → card titles (Playfair), stat values
//   xl  20 → topbar / page-section titles
//   xxl 24 → KPI values
//   xxxl 28 → hero / page headline (Playfair)
//   display 32 → big chart numbers
export const FS2 = { xxs: 11, xs: 12, sm: 13, base: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 28, display: 32 };

// Line heights paired with the scale: none for big numbers, tight for stats,
// heading for titles, body for paragraphs.
export const LH2 = { none: 1, tight: 1.15, heading: 1.25, body: 1.5 };

// Letter spacing (px)
export const LS2 = { tighter: -0.5, tight: -0.3, snug: -0.2, normal: 0, wide: 0.5, caps: 1.2 };

// Presets — named after the mobile `typographyPresets`
export const T2 = {
  heroTitle:      { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: 700, lineHeight: LH2.heading, letterSpacing: LS2.tighter, color: C2.white },
  pageTitle:      { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: 700, lineHeight: LH2.heading, letterSpacing: LS2.snug, color: C2.textPrimary },
  sectionTitle:   { fontFamily: F2.heading, fontSize: FS2.lg, fontWeight: 700, lineHeight: LH2.heading, letterSpacing: LS2.snug, color: C2.textPrimary },
  brandTitle:     { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: 700, color: C2.white },
  cardTitle:      { fontFamily: F2.body, fontSize: FS2.md, fontWeight: 600, lineHeight: LH2.heading, color: C2.textPrimary },
  cardSubtitle:   { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: 400, lineHeight: LH2.body, color: C2.textSecondary },
  body:           { fontFamily: F2.body, fontSize: FS2.base, fontWeight: 400, lineHeight: LH2.body, color: C2.textBody },
  bodyMedium:     { fontFamily: F2.body, fontSize: FS2.base, fontWeight: 500, lineHeight: LH2.body, color: C2.textBody },
  bodyBold:       { fontFamily: F2.body, fontSize: FS2.base, fontWeight: 600, lineHeight: LH2.body, color: C2.textPrimary },
  label:          { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: 400, lineHeight: LH2.body, color: C2.textSecondary },
  caption:        { fontFamily: F2.body, fontSize: FS2.xs, fontWeight: 400, lineHeight: LH2.body, color: C2.textMuted },
  badge:          { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: 600, lineHeight: 1.2 },
  button:         { fontFamily: F2.body, fontSize: FS2.base, fontWeight: 600, lineHeight: 1.2 },
  sectionLink:    { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: 600, color: C2.primary },
  eyebrow:        { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: 600, letterSpacing: LS2.caps, textTransform: 'uppercase', color: C2.textMuted },
  statValue:      { fontFamily: F2.body, fontSize: FS2.xxl, fontWeight: 700, lineHeight: LH2.tight, letterSpacing: LS2.tight, color: C2.textPrimary },
  price:          { fontFamily: F2.body, fontSize: FS2.md, fontWeight: 700, lineHeight: LH2.heading, color: C2.textPrimary },
};
