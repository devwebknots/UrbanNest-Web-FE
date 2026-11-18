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

// Standard web type scale (px) — compact dashboard density. Use ONLY these sizes — no in-between values.
//   xxs 10 → badges, tags, eyebrows (minimum readable size)
//   xs  11 → captions, timestamps, meta text
//   sm  12 → secondary text, labels, links
//   base 13 → body text, buttons, nav items (default)
//   md  14 → emphasized body, list item titles
//   lg  16 → card titles (Playfair), stat values
//   xl  18 → topbar / page-section titles
//   xxl 20 → KPI values
//   xxxl 24 → hero / page headline (Playfair)
//   display 28 → big chart numbers
//   score   36 → gauge / headline scores
export const FS2 = { xxs: 10, xs: 11, sm: 12, base: 13, md: 14, lg: 16, xl: 18, xxl: 20, xxxl: 24, display: 28, score: 36 };

// Line heights paired with the scale: none for big numbers, tight for stats,
// heading for titles, body for paragraphs.
export const LH2 = { none: 1, tight: 1.15, snug: 1.2, heading: 1.25, body: 1.5 };

// Letter spacing (px)
export const LS2 = { tighter: -0.5, tight: -0.3, snug: -0.2, normal: 0, wide: 0.5, caps: 1.2 };

// Presets — named after the mobile `typographyPresets`
export const T2 = {
  heroTitle:      { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.bold, lineHeight: LH2.heading, letterSpacing: LS2.tighter, color: C2.white },
  pageTitle:      { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: FW2.bold, lineHeight: LH2.heading, letterSpacing: LS2.snug, color: C2.textPrimary },
  sectionTitle:   { fontFamily: F2.heading, fontSize: FS2.lg, fontWeight: FW2.bold, lineHeight: LH2.heading, letterSpacing: LS2.snug, color: C2.textPrimary },
  brandTitle:     { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: FW2.bold, color: C2.white },
  cardTitle:      { fontFamily: F2.body, fontSize: FS2.md, fontWeight: FW2.semibold, lineHeight: LH2.heading, color: C2.textPrimary },
  cardSubtitle:   { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textSecondary },
  body:           { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textBody },
  bodyMedium:     { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.medium, lineHeight: LH2.body, color: C2.textBody },
  bodyBold:       { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.semibold, lineHeight: LH2.body, color: C2.textPrimary },
  label:          { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textSecondary },
  caption:        { fontFamily: F2.body, fontSize: FS2.xs, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textMuted },
  badge:          { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: FW2.semibold, lineHeight: LH2.snug },
  button:         { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.semibold, lineHeight: LH2.snug },
  sectionLink:    { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.semibold, color: C2.primary },
  eyebrow:        { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: FW2.semibold, letterSpacing: LS2.caps, textTransform: 'uppercase', color: C2.textMuted },
  statValue:      { fontFamily: F2.body, fontSize: FS2.xxl, fontWeight: FW2.bold, lineHeight: LH2.tight, letterSpacing: LS2.tight, color: C2.textPrimary },
  price:          { fontFamily: F2.body, fontSize: FS2.md, fontWeight: FW2.bold, lineHeight: LH2.heading, color: C2.textPrimary },
};
