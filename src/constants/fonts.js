import { C2 } from './colors';   // used by the Version 2 typography presets (T2) below

// ─────────────────────────────────────────────
// UrbanNest — Typography Tokens
// ─────────────────────────────────────────────

export const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// Font import — paste in index.html <head>
// <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

export const TEXT = {
  // Headings
  pageHeading:   { fontFamily: F.headline, fontSize: 28, fontWeight: 700 },
  sectionTitle:  { fontFamily: F.headline, fontSize: 16, fontWeight: 600 },
  panelLabel:    { fontFamily: F.headline, fontSize: 14, fontWeight: 600 },
  logoName:      { fontFamily: F.headline, fontSize: 14, fontWeight: 600 },

  // Body / UI
  heroSubtitle:  { fontFamily: F.body, fontSize: 13, fontWeight: 400 },
  tabLabel:      { fontFamily: F.body, fontSize: 13, fontWeight: 600 },
  fieldLabel:    { fontFamily: F.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  inputText:     { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
  buttonText:    { fontFamily: F.body, fontSize: 13, fontWeight: 700 },
  navItem:       { fontFamily: F.body, fontSize: 12, fontWeight: 500 },
  navSubItem:    { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
  navSection:    { fontFamily: F.body, fontSize: 9,  fontWeight: 700, textTransform: 'uppercase' },
  logoSubtitle:  { fontFamily: F.body, fontSize: 9,  fontWeight: 600, textTransform: 'uppercase' },
  caption:       { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
  footerText:    { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
};


// ═════════════════════════════════════════════════════════════════════════════
// VERSION 2 — Design System v2 tokens (all new / redesigned screens use these)
// The v1 tokens above stay for the screens that have not been redesigned yet.
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Design System v2 · Typography tokens
// Mirrors the UrbanNest mobile app (UrbanNestMobile/src/config/theme.ts):
//   Headings → Playfair Display   Body / UI → Inter
// Font files: src/assets/fonts, @font-face in src/styles/fonts.css.
// ─────────────────────────────────────────────────────────────────────────────


export const F2 = {
  heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
  body:    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ─── TYPE RULES (one weight per role — never pick a weight per page) ─────────
//
//  PLAYFAIR DISPLAY  (F2.heading) — headings + editorial voice only, never numbers or UI controls
//    600 SemiBold ........ every heading: hero / page / section (card) titles, brand, promo heading,
//                          property names on photo cards / heroes
//                          SIZE: max 24px (FS2.xxxl) for ANY heading — hero, page, detail title. 28 / 36 are numbers only.
//    400 Regular ......... greeting under a hero title (T2.lead), description line under an item
//                          title (UI2.text.meta)
//    400 Italic .......... ONLY real quotations (T2.quote — quoted messages). Nowhere else.
//    700 Bold ............ not used (too heavy)
//
//  INTER  (F2.body) — all UI text and every number
//    400 Regular ......... body, labels, captions, card subtitles, table cells, item / row titles (UI2.text.rowTitle)
//    500 Medium .......... display figures >= 24px (T2.figure 28, T2.figureMd 24, gauge / donut score),
//                          buttons + text links (all UI2.btn.*),
//                          nav items, status text, KPI labels
//    300 Light ........... not used (too thin for figures — user feedback 2026-11-19)
//    400 Regular (15px) ... small inline stat values next to a label (T2.statInline — header StatGroup)
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
//   stat 15 → inline stat values (T2.statInline — StatGroup / FactCard)
//   lg  16 → card titles (Playfair), stat values
//   xl  18 → topbar / page-section titles
//   xxl 20 → KPI values
//   xxxl 24 → hero / page headline (Playfair) — the MAXIMUM size for ANY heading in the app (rule, 2026-11-23)
//   display 28 → big chart numbers ONLY (never a heading)
//   score   36 → gauge / headline scores ONLY (never a heading)
export const FS2 = { xxs: 10, xs: 11, sm: 12, base: 13, md: 14, stat: 15, lg: 16, xl: 18, xxl: 20, xxxl: 24, display: 28, score: 36 };

// Line heights paired with the scale: none for big numbers, tight for stats,
// heading for titles, body for paragraphs.
export const LH2 = { none: 1, tight: 1.15, snug: 1.2, heading: 1.25, body: 1.5 };

// Letter spacing (px)
export const LS2 = { tighter: -0.5, tight: -0.3, snug: -0.2, normal: 0, wide: 0.5, caps: 1.2 };

// Presets — named after the mobile `typographyPresets`
// Keep weights light: titles / figures semibold; bold is not used for headings or numbers.
export const T2 = {
  heroTitle:      { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.heading, letterSpacing: LS2.tighter, color: C2.white },
  // Open page hero (OpenHero — list pages like Portfolio): big Playfair title + Inter sub line
  pageHeroTitle:  { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.tight, letterSpacing: LS2.tighter, color: C2.navyDeep },
  pageHeroSub:    { fontFamily: F2.body, fontSize: FS2.md, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textSecondary },
  // THE v2 page heading — single source for every light page / hero title: WaveHero (Portfolio "Property List"),
  // ProfileHero (Dashboard), ListingsHero, DetailHeader (property / unit), Create Listing wizard, PM Approvals.
  // Playfair 24 semibold navy. Subtitle = T2.lead (Playfair 13 grey), SP2.xs below. Spread it — never re-type these values.
  heroHeading:    { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.snug, letterSpacing: LS2.tight, color: C2.navyDeep },
  pageTitle:     { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: FW2.semibold, lineHeight: LH2.heading, letterSpacing: LS2.snug, color: C2.textPrimary },
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
  // KPI label above a big figure (KpiStrip, StatGroup size="lg") — Inter Medium 12px, grey
  kpiLabel:       { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, lineHeight: LH2.heading, color: C2.textSecondary },
  caption:        { fontFamily: F2.body, fontSize: FS2.xs, fontWeight: FW2.regular, lineHeight: LH2.body, color: C2.textMuted },
  badge:          { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: FW2.semibold, lineHeight: LH2.snug },
  button:         { fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.medium, lineHeight: LH2.snug },
  sectionLink:    { fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, color: C2.primary },
  eyebrow:        { fontFamily: F2.body, fontSize: FS2.xxs, fontWeight: FW2.semibold, letterSpacing: LS2.caps, textTransform: 'uppercase', color: C2.textMuted },
  statValue:      { fontFamily: F2.body, fontSize: FS2.xxl, fontWeight: FW2.regular, lineHeight: LH2.tight, letterSpacing: LS2.tight, color: C2.textPrimary },   // 20px / 400 — same standard as T2.kpiValue
  // Display figures (>= 24px) — Inter Medium: rent total (figure), KPI strip values (figureMd)
  figure:         { fontFamily: F2.body, fontSize: FS2.display, fontWeight: FW2.medium, lineHeight: LH2.none, letterSpacing: LS2.tight, color: C2.navyDeep },
  // Small inline stat value (header StatGroup, compact summaries) — calm, never bulky
  statInline:     { fontFamily: F2.body, fontSize: FS2.stat, fontWeight: FW2.regular, lineHeight: LH2.tight, letterSpacing: LS2.normal, color: C2.navyDeep },
  figureMd:       { fontFamily: F2.body, fontSize: FS2.xxxl, fontWeight: FW2.medium, lineHeight: LH2.none, letterSpacing: LS2.tight, color: C2.navyDeep },
  // KPI figure: big numbers in KPI strips / target blocks — Inter 20px Regular (one standard for every KPI value)
  kpiValue:       { fontFamily: F2.body, fontSize: FS2.xxl, fontWeight: FW2.regular, lineHeight: LH2.none, letterSpacing: LS2.tight, color: C2.navyDeep },
  price:          { fontFamily: F2.body, fontSize: FS2.md, fontWeight: FW2.semibold, lineHeight: LH2.heading, color: C2.textPrimary },
};
