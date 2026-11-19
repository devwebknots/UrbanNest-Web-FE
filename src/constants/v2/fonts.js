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

// ─── TYPE RULES (one weight per role — never pick a weight per page) ─────────
//
//  PLAYFAIR DISPLAY  (F2.heading) — headings + editorial voice only, never numbers or UI controls
//    600 SemiBold ........ every heading: hero / page / section (card) titles, brand, promo heading,
//                          property names on photo cards / heroes
//    400 Regular ......... greeting under a hero title (T2.lead), description line under an item
//                          title (UI2.text.meta)
//    400 Italic .......... ONLY real quotations (T2.quote — quoted messages). Nowhere else.
//    700 Bold ............ not used (too heavy)
//
//  INTER  (F2.body) — all UI text and every number
//    400 Regular ......... body, labels, captions, card subtitles, table cells
//    500 Medium .......... display figures >= 24px (T2.figure 28, T2.figureMd 24, gauge / donut score),
//                          buttons + text links (all UI2.btn.*), item / row titles (UI2.text.rowTitle),
//                          nav items, status text, KPI labels
//    300 Light ........... not used (too thin for figures — user feedback 2026-11-19)
//    600 SemiBold ........ pills, tags, eyebrows (caps), numbers 16-20px
//                          (T2.statValue, UI2.text.stat), amounts, emphasised values in a sentence
//    700 Bold ............ not used
//    400 Italic .......... ONLY insight / recommendation descriptions, wrapped in double quotes
//                          (T2.insight — InsightCard body)
//
export const FW2 = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 };   // bold: legacy only — see rules above

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
// Keep weights light: titles / figures semibold; bold is not used for headings or numbers.
export const T2 = {
  heroTitle:      { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.heading, letterSpacing: LS2.tighter, color: C2.white },
  pageTitle:      { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: FW2.semibold, lineHeight: LH2.heading, letterSpacing: LS2.snug, color: C2.textPrimary },
  sectionTitle:   { fontFamily: F2.heading, fontSize: FS2.lg, fontWeight: FW2.semibold, lineHeight: LH2.heading, letterSpacing: LS2.snug, color: C2.textPrimary },
  brandTitle:     { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: FW2.semibold, color: C2.white },
  // Playfair: greeting / tagline under a hero title (upright) · quoted message text (italic — quotes only)
  lead:           { fontFamily: F2.heading, fontSize: FS2.base, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textSecondary },
  insight:        { fontFamily: F2.body, fontStyle: 'italic', fontSize: FS2.sm, fontWeight: FW2.regular, lineHeight: LH2.body },
  quote:          { fontFamily: F2.heading, fontStyle: 'italic', fontSize: FS2.sm, fontWeight: FW2.regular, lineHeight: LH2.body },
  cardTitle:      { fontFamily: F2.body, fontSize: FS2.md, fontWeight: FW2.semibold, lineHeight: LH2.heading, color: C2.textPrimary },
  // Card subtitle sits one step quieter than list content (muted grey) so it never reads as an item
  cardSubtitle:   { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textMuted },
  body:           { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textBody },
  bodyMedium:     { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.medium, lineHeight: LH2.body, color: C2.textBody },
  bodyBold:       { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.semibold, lineHeight: LH2.body, color: C2.textPrimary },
  label:          { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textSecondary },
  caption:        { fontFamily: F2.body, fontSize: FS2.xs, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textMuted },
  badge:          { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: FW2.semibold, lineHeight: LH2.snug },
  button:         { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.medium, lineHeight: LH2.snug },
  sectionLink:    { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, color: C2.primary },
  eyebrow:        { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: FW2.semibold, letterSpacing: LS2.caps, textTransform: 'uppercase', color: C2.textMuted },
  statValue:      { fontFamily: F2.body, fontSize: FS2.xxl, fontWeight: FW2.semibold, lineHeight: LH2.tight, letterSpacing: LS2.tight, color: C2.textPrimary },
  // Display figures (>= 24px) — Inter Medium: rent total (figure), KPI strip values (figureMd)
  figure:         { fontFamily: F2.body, fontSize: FS2.display, fontWeight: FW2.medium, lineHeight: LH2.none, letterSpacing: LS2.tight, color: C2.navyDeep },
  figureMd:       { fontFamily: F2.body, fontSize: FS2.xxxl, fontWeight: FW2.medium, lineHeight: LH2.none, letterSpacing: LS2.tight, color: C2.navyDeep },
  price:          { fontFamily: F2.body, fontSize: FS2.md, fontWeight: FW2.semibold, lineHeight: LH2.heading, color: C2.textPrimary },
};
