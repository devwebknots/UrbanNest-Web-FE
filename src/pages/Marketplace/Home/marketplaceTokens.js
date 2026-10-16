// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Marketplace (public, consumer-facing) design tokens.
// Single source of truth for every page under src/pages/Marketplace/.
//
// This is UrbanNest's own brand surface (not a Landlord/PM-portal skin), so
// it reuses the base "platform" navy/serif system already established by
// CustomDropdown.jsx (#002D5B primary, Nunito Sans body) rather than
// inventing a third identity — see design-system/UrbanNest_DesignSystem-FE.md
// ("platform/PM navy-serif" vs. "Landlord Inter/landlordTokens.js"). Serif
// is added here for display headlines only (hero line, section titles),
// matching the Figma; body copy stays Nunito Sans throughout, same as every
// other portal.
//
// Session 50 — new, FE-first build against mock data (see
// mockMarketplaceData.js). No public marketplace backend exists yet; see
// that file's own header for the real-data mapping this mock stands in for.
// ─────────────────────────────────────────────────────────────────────────────

export const F = {
  serif: "'Noto Serif', serif",
  body: "'Nunito Sans', sans-serif",
};

export const C = {
  // Brand / primary
  primary:      '#002D5B',
  primaryDark:  '#001A38',
  accentGold:   '#C8A24A',   // "Exclusive" ribbon tags
  accentGoldBg: '#FBF3E0',

  // Nav / hero (dark, photo-backed)
  navOverlay:   'rgba(10, 22, 40, 0.55)',
  heroOverlay:  'linear-gradient(180deg, rgba(8,16,30,0.35) 0%, rgba(8,16,30,0.75) 100%)',
  heroText:     '#FFFFFF',
  heroSubtext:  'rgba(255,255,255,0.82)',

  // Page / layout — very light blue wash, reusing the same pale-blue value
  // already established elsewhere in the design system (CustomDropdown.jsx's
  // hoverBg) rather than inventing an unrelated new color.
  pageBg:       '#FCFDFF',
  sectionBg:    '#FCFDFF',
  cardBg:       '#FFFFFF',
  cardBorder:   '#E8ECF0',
  inputBg:      '#F8F9FA',
  inputBorder:  '#E8ECF0',

  // Text
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',

  // Badges
  premiumBg:   '#0F172A',
  premiumText: '#FFFFFF',

  // Sample Data watermark — same amber "flask" convention already used in
  // PMListingsOverview.jsx's <SampleTag>/<SampleCard> (UN Admin/PMS), reused
  // here verbatim (same hex values) rather than inventing a second palette
  // for the same concept. Session 50, Phase 2 — marks cards padded in from
  // mockMarketplaceData.js when the real ranking endpoint comes back short.
  sampleTag:    '#B45309',
  sampleTagBg:  '#FFFBEB',
  sampleTagBdr: '#FDE68A',

  // Semantic
  white: '#FFFFFF',
  divider: '#EEF1F4',

  // Footer
  footerBg:   '#0A1628',
  footerText: 'rgba(255,255,255,0.72)',
  footerHead: '#FFFFFF',
};
