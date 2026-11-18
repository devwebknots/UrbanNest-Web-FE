// src/pages/ApplicationIntake/applicationIntakeTokens.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Rental Application Intake — design tokens.
//
// Per the user's own decision (see the Claude Project doc
// application-intake/UrbanNest_ApplicationIntake_Figma_ApproachDoc_Review.md,
// §6): this surface deliberately keeps the Figma's institutional visual
// language (navy header, serif display type, compliance-badge styling)
// rather than reconciling it with Marketplace's own consumer tokens
// (marketplaceTokens.js) — the user wants the Figma's presentation
// preserved, even though the underwriting/credit/payroll/e-signature
// content it dresses is sample-only (see sampleInstitutionalContent.js).
//
// Where this still reuses the rest of the platform rather than inventing
// an unrelated fourth palette: the navy primary and serif/Nunito Sans
// pairing are the same base values marketplaceTokens.js already uses
// (°002D5B family, 'Noto Serif' + 'Nunito Sans') — this file just leans
// into the institutional end of that same system harder (darker surfaces,
// more deliberate "vault/ledger" framing) instead of picking new colors.
//
// Sample-content marking reuses the exact "Sample Data" convention
// established in PMListingsOverview.jsx (SampleTag/SampleCard, amber
// flask pill) — same hex values, not a new convention — see
// sampleInstitutionalContent.js's own header for how that's applied here.
// ─────────────────────────────────────────────────────────────────────────────

export const F = {
  serif: "'Noto Serif', serif",
  body: "'Nunito Sans', sans-serif",
  mono: "'Roboto Mono', 'Courier New', monospace",
};

export const C = {
  // Brand / institutional surface
  navy:        '#0B2545',
  navyDark:    '#071A33',
  navyLight:   '#13294B',
  gold:        '#C8A24A',

  // Page / layout
  pageBg:      '#F4F6F9',
  cardBg:      '#FFFFFF',
  cardBorder:  '#E3E8EF',
  inputBg:     '#F8F9FA',
  inputBorder: '#D7DEE7',
  divider:     '#EDF1F5',

  // Text
  textPrimary:   '#101828',
  textSecondary: '#5B6B82',
  textTertiary:  '#8C9AAE',
  white:         '#FFFFFF',

  // Status
  success:     '#16A34A',
  successBg:   '#EAF7EE',
  warning:     '#B45309',
  warningBg:   '#FFF7E6',
  danger:      '#DC2626',
  dangerBg:    '#FDECEC',
  info:        '#2563A8',
  infoBg:      '#EAF2FA',

  // "Verified / vault" accents (real, functional — document & consent
  // state genuinely tracked by the backend, just styled to match the
  // institutional language elsewhere on this surface)
  verifiedBg:     '#EAF7EE',
  verifiedText:   '#16803C',
  verifiedBorder: '#BFE8CC',

  // Sample Data watermark — identical values to marketplaceTokens.js /
  // PMListingsOverview.jsx's SampleTag, reused verbatim. Anything carrying
  // this treatment on this surface is non-functional display content
  // (see sampleInstitutionalContent.js) and must never be the thing that
  // drives real application/applicant state.
  sampleTag:    '#B45309',
  sampleTagBg:  '#FFFBEB',
  sampleTagBdr: '#FDE68A',
};

export const RADIUS = { sm: 8, md: 12, lg: 16 };
export const SHADOW = {
  card: '0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)',
  raised: '0 4px 12px rgba(16,24,40,0.10)',
};
