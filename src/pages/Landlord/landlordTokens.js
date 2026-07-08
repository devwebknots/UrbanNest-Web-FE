// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Landlord Portal Design Tokens
// Single source of truth for ALL Landlord portal pages.
//
// Import in:
//   LandlordDashboard.jsx         → import { C, F } from './landlordTokens';
//   LandlordPortfolioPage.jsx     → import { C, F } from './landlordTokens';
//   LandlordPropertyDetailPage.jsx→ import { C, F } from './landlordTokens';
//   NavF.jsx                      → import { C, F } from '../../pages/Landlord/landlordTokens';
//
// Font: Inter throughout Landlord portal.
// To switch platform-wide later → change F.sans here only.
// ─────────────────────────────────────────────────────────────────────────────

export const F = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

export const C = {
  // Navigation
  navBg:       '#0a1628',
  navText:     '#7a9bb8',
  navActive:   '#ffffff',
  navBorder:   '#3d8ef0',

  // Hero / dark cards
  heroBg:      '#0d1b2e',
  heroBadgeBg: '#1a4a3a',
  heroBadgeTx: '#4ecba0',
  heroSubTx:   '#4a6d8c',
  heroStatBg:  'rgba(255,255,255,0.07)',
  commBg:      '#0d1b2e',
  navyDark:    '#0a1628',

  // Page / layout
  pageBg:      '#f2f4f8',
  topbarBg:    '#ffffff',
  topbarBdr:   '#e5e8ed',
  cardBg:      '#ffffff',
  cardBdr:     '#e5e8ed',

  // Text
  txtPrimary:  '#0d1b2e',
  txtSec:      '#6b7280',
  txtMuted:    '#9ca3af',

  // Brand
  blue:        '#3d8ef0',
  teal:        '#2a9d7f',
  btnTeal:     '#2a9d7f',

  // Semantic — green
  green:       '#16a34a',
  greenLight:  '#dcfce7',
  greenDark:   '#15803d',

  // Semantic — red
  red:         '#dc2626',
  redLight:    '#fee2e2',

  // Semantic — amber
  amber:       '#d97706',
  amberLight:  '#fef3c7',

  // Semantic — blue
  blueLight:   '#dbeafe',
  blueDark:    '#1d4ed8',

  // Charts
  barLight:    '#c5d5ea',
  navyBar:     '#0d1b2e',

  // Intelligence cards
  intelBg:     '#e8f5f0',
  intelBdr:    '#b6dfcf',
  intelAmBg:   '#fef9ec',
  intelAmBdr:  '#f5d87a',

  // Misc
  stdBg:       '#f3f4f6',
  stdTx:       '#4b5563',
};