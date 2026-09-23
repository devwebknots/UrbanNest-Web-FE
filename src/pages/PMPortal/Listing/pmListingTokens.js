// src/pages/PMPortal/Listing/pmListingTokens.js
//
// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — PM Portal flavor of the "Create Listing" wizard's design tokens.
//
// Session 47 (Independent PM / Org PM Listing capability, first build slice).
//
// Same key shape as ../../Landlord/landlordTokens.js ON PURPOSE — the shared
// wizard style object (pmListingWizardShared.jsx's `LS`) references these
// keys by name only, never by literal hex, so this file is a drop-in swap
// for landlordTokens.js: it reskins the wizard for PM Portal without
// touching a single layout/spacing value in LS.
//
// Font + navy accent match the REAL PM Portal shell (NavB.jsx, PMTopBar.jsx —
// Noto Serif headline, Nunito Sans body, #002D5B primary), the same
// reasoning Session 41 used to reskin this wizard for Landlord (see
// pmListingWizardShared.jsx's header comment): it should look native next
// to the portal it lives in, not like a visually separate module.
//
// Per listingWizardShared.jsx's own comment, this is actually closer to the
// wizard's ORIGINAL frozen-wireframe skin (Noto Serif / navy #002D5B) than
// Landlord's Inter/landlordTokens reskin was — not a new invention.
//
// Semantic colors (green/red/amber success/error/warning) are left
// unchanged from landlordTokens.js — those are universal status colors
// reused the same way across every portal in this codebase (see
// PMPropertiesPage.jsx's own local C), not part of either portal's brand
// identity.
// ─────────────────────────────────────────────────────────────────────────────

export const F = {
  sans:     "'Nunito Sans', sans-serif",
  headline: "'Noto Serif', serif",
};

export const C = {
  // Navigation — NavB is a dark sidebar (unlike Landlord's NavF), kept here
  // only for any wizard style that still references nav colors directly.
  navBg:       '#111827',
  navText:     'rgba(255,255,255,0.65)',
  navActive:   '#ffffff',
  navBorder:   '#002D5B',

  // Hero / dark cards
  heroBg:      '#0F172A',
  heroBadgeBg: '#1a4a3a',
  heroBadgeTx: '#4ecba0',
  heroSubTx:   '#64748B',
  heroStatBg:  'rgba(255,255,255,0.07)',
  commBg:      '#0F172A',
  navyDark:    '#002D5B',

  // Page / layout — matches PMPropertiesPage.jsx / PMUnitDetailPage.jsx's
  // own local neutrals so this wizard sits flush with the rest of PM Portal.
  pageBg:      '#F1F5F9',
  topbarBg:    '#ffffff',
  topbarBdr:   '#E2E8F0',
  cardBg:      '#ffffff',
  cardBdr:     '#E2E8F0',

  // Text
  txtPrimary:  '#0F172A',
  txtSec:      '#64748B',
  txtMuted:    '#94A3B8',

  // Brand — PM Portal navy (NavB.primary / PMTopBar.primary) instead of
  // Landlord's lighter blue.
  blue:        '#002D5B',
  teal:        '#2a9d7f',
  btnTeal:     '#2a9d7f',

  // Semantic — green (unchanged from landlordTokens.js)
  green:       '#16A34A',
  greenLight:  '#F0FDF4',
  greenDark:   '#15803d',

  // Semantic — red (unchanged)
  red:         '#dc2626',
  redLight:    '#fee2e2',

  // Semantic — amber (unchanged)
  amber:       '#92400E',
  amberLight:  '#FEF3C7',

  // Semantic — blue accent pair (used for AI Assist chip, "NEW" badges,
  // landmark chips, plan highlights)
  blueLight:   '#dbeafe',
  blueDark:    '#003d7a',

  // Charts
  barLight:    '#c5d5ea',
  navyBar:     '#0F172A',

  // Intelligence cards (unchanged)
  intelBg:     '#e8f5f0',
  intelBdr:    '#b6dfcf',
  intelAmBg:   '#fef9ec',
  intelAmBdr:  '#f5d87a',

  // Misc
  stdBg:       '#f3f4f6',
  stdTx:       '#4b5563',
};
