// src/pages/UNAdminPortal/Configurations/Screening/mockTenantScreeningConfig.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Default/seed data for the Screening Configuration screen (UN Admin →
// Configurations → Screening Config). See
// screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
// (Claude Project) for the full review this build follows — summarized here:
//
// NO BACKEND EXISTS FOR THIS YET. There is no `rules_engine.tenant_screening`
// app (or equivalent) anywhere in the real codebase — this entire screen is
// built FE-first (per ARCH_001) against this mock/default data, persisted to
// this browser's own localStorage once a UN Admin edits it (same "real,
// device-local save" honesty already established for Application Intake's
// local-draft mode, NOT the amber Sample Data watermark — editing and saving
// a policy value here is a real action, just not yet synced to any server).
//
// The data below intentionally keeps the exact policy values shown in the
// reviewed Figma as sensible defaults, structured to map cleanly onto the
// architecture the review doc recommends this eventually becomes a real
// backend of: a sibling `rules_engine` app following the already-proven
// Listing Readiness Rules Engine shape (ReadinessRuleCategory →
// ReadinessRuleDefinition → ReadinessRuleConfig, 3-tier node inheritance —
// here, UN Admin Default → PM Config → Property-Specific). That's why each
// category below carries an `id` and each field/row carries its own `id` —
// the same shape a future `ScreeningRuleDefinition`/`ScreeningRuleConfig`
// pair would key off.
//
// REAL vs SAMPLE, applied uniformly across every section (not just some):
// every numeric, toggle, or plain policy VALUE a UN Admin sets (a ratio, a
// credit-score cutoff, a lookback year count, a required-document flag) is
// real, editable config — even where nothing downstream reads it yet (no
// screening engine exists to enforce it, same as `ApplicantScreening` being
// a manual status field only per the Application Intake backend plan).
// Every named VENDOR or ENGINE claim (Socure, Persona, Plaid, Argyle,
// TransUnion, LexisNexis, "ALL SCREENING GATEWAYS OPERATIONAL", audit
// signatures, the LTS version/release tag) is marked `sample: true` and
// rendered with the amber Sample Data tag — none of those integrations
// exist, and this screen must never look, to a UN Admin using it, like a
// live vendor connection is active.
// ─────────────────────────────────────────────────────────────────────────────

// 2026-11-17 — Credit Check's own Supported Providers dropdown must only
// list partners that actually support it, per the real Partner → Tenant
// Screening → Capability Matrix record (UNAdminPortal/Partners/
// TenantScreening/mockPartnerData.js's INITIAL_PARTNERS — the same data
// PartnerCapabilityMatrix.jsx's grid renders), not the universal
// SUPPORTED_PROVIDER_OPTIONS list below (which every other criterion's
// drawer still uses unfiltered). Imported directly rather than
// re-typing the mapping here, so a future edit to a partner's supported
// criteria on the Capability Matrix tab is picked up automatically.
import { INITIAL_PARTNERS } from '../../Partners/TenantScreening/mockPartnerData';

export const POLICY_META_DEFAULTS = {
  configName: 'Enterprise Master Screening Policy 2026.4',
  internalUuid: 'un-pol-e89a-0019', // cosmetic, locally generated — no real ID registry behind this yet
  // Session 67 — superseded by the real `targetMarketJurisdiction` React
  // state + JURISDICTION_OPTIONS dropdown in UNAdminScreeningConfiguration.jsx
  // (seeded 'US'). Left here only as the original static value's record;
  // nothing reads this key any more.
  targetMarketJurisdiction: 'USA (Federal / NY-CA Standard)',
  activePolicyManifest: 'UN-Enterprise-Default-2026.4',
  // Sample — no real versioning/release-pipeline exists for this config.
  versionTag: 'v4.2.0-LTS',
  releaseStage: 'LIVE / PRODUCTION',
  complianceScope: ['FCRA', 'HUD 2016 Fair Housing'],
  emergencyRollbackTarget: 'v4.1.9-LTS',
};

// ─────────────────────────────────────────────────────────────────────────────
// Session 73 — shared Evaluation Outcome reference list + per-domain
// classification lists, added for the new "Evaluation Outcome & Weightage"
// section (08) and the 4 scenario-grid sections (04/05/06/09 below).
//
// EVALUATION_OUTCOME_OPTIONS is the single source of truth for every
// "Evaluation Outcome" value shown anywhere on this screen — section 08's
// weightage grid AND every scenario row's own Evaluation Outcome column
// resolve their label/pill color from this ONE list by `code`, never a
// literal string repeated per row. Per the 2026-11-17 request ("no
// hardcoding... values should come from a UN Reference table"): this is the
// FE-only equivalent of that — same convention already used by this file's
// own JURISDICTION_OPTIONS/ENFORCEMENT_OPTIONS, flagged the same way those
// are — move to a real UNReference-backed list (module='TENANT_SCREENING',
// ref_type='EVALUATION_OUTCOME') once this screen's scenario-grid sections
// get a backend. `pillBg`/`pillColor` are keys into screeningConfigTokens.js's
// `C` palette, resolved by the renderer (never inlined per row).
// 'INFORMATION_REQUIRED' is new this session — it showed up in 3 of the 4
// scenario grids (Income, Rental History, Employment Verification Rules)
// but was never explicitly given a weightage/Excluded decision by name, so
// DEFAULT_OUTCOME_WEIGHTAGE below defaults it to Excluded (same treatment as
// Pending/Unable to Verify/Failed, since it's also an "evaluation not yet
// produced a scoreable result" state) — flagged there for confirmation.
export const EVALUATION_OUTCOME_OPTIONS = [
  { code: 'MEETS_CRITERIA', label: 'Meets Criteria', pillBg: 'greenBg', pillColor: 'green' },
  { code: 'REQUIRES_REVIEW', label: 'Requires Review', pillBg: 'amberBg', pillColor: 'amberText' },
  { code: 'DOES_NOT_MEET_CRITERIA', label: 'Does Not Meet Criteria', pillBg: 'dangerBg', pillColor: 'danger' },
  { code: 'INFORMATION_REQUIRED', label: 'Information Required', pillBg: 'blueBg', pillColor: 'blue' },
  { code: 'PENDING', label: 'Pending', pillBg: 'neutral', pillColor: 'textSecondary' },
  { code: 'UNABLE_TO_VERIFY', label: 'Unable to Verify', pillBg: 'neutral', pillColor: 'textSecondary' },
  { code: 'FAILED', label: 'Failed', pillBg: 'neutral', pillColor: 'textSecondary' },
];

// Section 08 — "Evaluation Outcome & Weightage". One row per
// EVALUATION_OUTCOME_OPTIONS entry, in the same order; `contributionPercent`
// is null and `excluded: true` for any outcome that takes no part in a
// criterion's score. INFORMATION_REQUIRED's row is a judgment call (see note
// above) — easy to change to a real % once confirmed.
// 2026-11-17 — corrected to match the approved wireframe
// (screening-configuration canvas, ScreeningRules_EvaluationOutcome.dc.html)
// EXACTLY: 6 rows only. INFORMATION_REQUIRED does not get a row in this
// grid at all — a scenario that produces that outcome simply has no
// explicit weightage-contribution entry here, same as before this outcome
// existed. The prior 7-row version (with INFORMATION_REQUIRED defaulted to
// Excluded) was this screen's own invention, not what the wireframe shows.
export const DEFAULT_OUTCOME_WEIGHTAGE = [
  { outcomeCode: 'MEETS_CRITERIA', contributionPercent: 100, excluded: false },
  { outcomeCode: 'REQUIRES_REVIEW', contributionPercent: 50, excluded: false },
  { outcomeCode: 'DOES_NOT_MEET_CRITERIA', contributionPercent: 0, excluded: false },
  { outcomeCode: 'PENDING', contributionPercent: null, excluded: true },
  { outcomeCode: 'UNABLE_TO_VERIFY', contributionPercent: null, excluded: true },
  { outcomeCode: 'FAILED', contributionPercent: null, excluded: true },
];

// Per-domain Classification option lists (the scenario grids' middle
// column). Unlike Evaluation Outcome these aren't shared across sections —
// each domain has its own small fixed set — but are still centralized here
// (named lists, not literals scattered through `scenarioRows`) for the same
// reason JURISDICTION_OPTIONS/EMPLOYMENT_DOC_OPTIONS already are.
// 2026-11-17 — added when Identity & Fraud Prevention (section 03) moved
// from its old `kind: 'cards'` editor (Government ID Verification /
// Biometric Selfie Liveness / Synthetic ID & SSN Trace cards) to the same
// scenarioOutcomes grid design as Credit Risk, Income & Financial, and
// Rental History & Eviction, per explicit request.
export const IDENTITY_CLASSIFICATION_OPTIONS = [
  { code: 'VERIFIED', label: 'Verified', pillBg: 'greenBg', pillColor: 'green' },
  { code: 'MISMATCH_INVALID', label: 'Mismatch / Invalid', pillBg: 'dangerBg', pillColor: 'danger' },
  { code: 'NOT_AVAILABLE', label: 'Not Available', pillBg: 'neutral', pillColor: 'textSecondary' },
];
export const CREDIT_CLASSIFICATION_OPTIONS = [
  { code: 'GOOD_TIER_A', label: 'Good (Tier A)', pillBg: 'greenBg', pillColor: 'green' },
  { code: 'MODERATE_TIER_B', label: 'Moderate (Tier B)', pillBg: 'amberBg', pillColor: 'amberText' },
  { code: 'LOW_TIER_C', label: 'Low (Tier C)', pillBg: 'dangerBg', pillColor: 'danger' },
  { code: 'NOT_AVAILABLE', label: 'Not Available', pillBg: 'neutral', pillColor: 'textSecondary' },
];
export const INCOME_CLASSIFICATION_OPTIONS = [
  { code: 'MEETS_INCOME_REQUIREMENT', label: 'Meets Income Requirement', pillBg: 'greenBg', pillColor: 'green' },
  { code: 'BELOW_INCOME_REQUIREMENT', label: 'Below Income Requirement', pillBg: 'dangerBg', pillColor: 'danger' },
  { code: 'NOT_AVAILABLE', label: 'Not Available', pillBg: 'neutral', pillColor: 'textSecondary' },
];
export const RENTAL_CLASSIFICATION_OPTIONS = [
  { code: 'GOOD', label: 'Good', pillBg: 'greenBg', pillColor: 'green' },
  { code: 'MODERATE', label: 'Moderate', pillBg: 'amberBg', pillColor: 'amberText' },
  { code: 'POOR', label: 'Poor', pillBg: 'dangerBg', pillColor: 'danger' },
  { code: 'NO_HISTORY', label: 'No History', pillBg: 'neutral', pillColor: 'textSecondary' },
  { code: 'MIXED', label: 'Mixed', pillBg: 'amberBg', pillColor: 'amberText' },
  { code: 'NOT_AVAILABLE', label: 'Not Available', pillBg: 'neutral', pillColor: 'textSecondary' },
];
export const EMPLOYMENT_CLASSIFICATION_OPTIONS = [
  { code: 'VERIFIED', label: 'Verified', pillBg: 'greenBg', pillColor: 'green' },
  { code: 'REQUIRES_REVIEW', label: 'Requires Review', pillBg: 'amberBg', pillColor: 'amberText' },
  { code: 'NOT_EMPLOYED', label: 'Not Employed', pillBg: 'neutral', pillColor: 'textSecondary' },
  { code: 'NOT_APPLICABLE', label: 'Not Applicable', pillBg: 'neutral', pillColor: 'textSecondary' },
  { code: 'NOT_AVAILABLE', label: 'Not Available', pillBg: 'neutral', pillColor: 'textSecondary' },
  { code: 'MIXED', label: 'Mixed', pillBg: 'amberBg', pillColor: 'amberText' },
];
// 2026-11-18 — added for Criminal Background & Fair Housing Guidance
// (section 07)'s own conversion to the scenarioOutcomes grid. RECORD_FOUND
// is amberBg/amber (not danger/red) deliberately — a record alone is
// "Requires Review", never an automatic adverse signal, per the explicit
// "an arrest alone must not automatically result in rejection" rule given
// with this data. NOT_VERIFIED (identity match uncertain against the
// record) follows IDENTITY_CLASSIFICATION_OPTIONS' own MISMATCH_INVALID
// treatment (dangerBg/danger) — a data-integrity flag, not a policy
// decision. NOT_AVAILABLE matches every other domain's own treatment.
export const CRIMINAL_CLASSIFICATION_OPTIONS = [
  { code: 'CLEAR', label: 'Clear', pillBg: 'greenBg', pillColor: 'green' },
  { code: 'RECORD_FOUND', label: 'Record Found', pillBg: 'amberBg', pillColor: 'amberText' },
  { code: 'NOT_VERIFIED', label: 'Not Verified', pillBg: 'dangerBg', pillColor: 'danger' },
  { code: 'NOT_AVAILABLE', label: 'Not Available', pillBg: 'neutral', pillColor: 'textSecondary' },
];

// Each category mirrors one of the Figma's 7 numbered sections — now 9: two
// new sections (08/09) added Session 73, see the module-level note further
// down (above SECTION01_CRITERIA) for the full rationale.
export const DEFAULT_SCREENING_CATEGORIES = [
  {
    id: 'general_applicability',
    sectionNumber: 1,
    title: 'General & Applicability Framework',
    subtitle: 'Global metadata, tenant personas, jurisdictional baseline definitions',
    kind: 'fields',
    fields: [
      { id: 'config_name', label: 'Configuration Name', value: 'Enterprise Master Screening Policy 2026.4', type: 'text' },
      // Session 64: converted to a real multi-select dropdown (a new
      // MultiSelectDropdown component, since none existed — see the
      // Session 62 note this replaces). Value is now an array; the two
      // original comma-separated values are kept as the default selection.
      { id: 'applicable_personas', label: 'Applicable Personas', value: ['Primary Tenant', 'Co-Signer / Guarantor'], type: 'multiselect', options: [
        { value: 'Primary Tenant', label: 'Primary Tenant' },
        { value: 'Co-Applicant', label: 'Co-Applicant' },
        { value: 'Co-Signer / Guarantor', label: 'Co-Signer / Guarantor' },
        { value: 'Occupant (Non-Leaseholder)', label: 'Occupant (Non-Leaseholder)' },
      ], hint: 'Multi-select — this policy applies to every persona checked. Hardcoded option list pending a real backend list.' },
      { id: 'adult_occupant_age', label: 'Adult Occupant Age Threshold', value: 18, type: 'number', suffix: '+' },
      // Session 63: moved next to Adult Occupant Age per request, pushing the
      // Effective Window Start/End pair down one slot (their own relative
      // order kept intact, so they still land on the same grid row together).
      { id: 'auto_renewal', label: 'Auto-Renewal (30-Day Notice)', value: true, type: 'toggle' },
      { id: 'effective_window_start', label: 'Effective Window Start', value: '2026-01-01', type: 'date' },
      { id: 'effective_window_end', label: 'Effective Window End', value: '2026-12-31', type: 'date' },
      { id: 'statutory_framework', label: 'Statutory Framework', value: 'FCRA · HUD · CFPB Circular 2024-03', type: 'readonly', hint: 'Names a real statutory framework this policy is meant to follow — not a compliance certification.' },
      { id: 'global_hard_override', label: 'Global Hard Override', value: 'Active Freeze on Felony Pre-Exclusion', type: 'text', locked: true, hint: 'Locked — mirrors a HUD 2016 guidance constraint (Section 7), not editable per-PM.' },
      { id: 'emergency_rollback_target', label: 'Emergency Policy Rollback Target', value: 'v4.1.9-LTS', type: 'select', locked: true, labelNoWrap: true, sample: true, options: [
        { value: 'v4.1.9-LTS', label: 'v4.1.9-LTS' },
        { value: 'v4.0.5-LTS', label: 'v4.0.5-LTS' },
        { value: 'v3.8.2-LTS', label: 'v3.8.2-LTS' },
      ], hint: 'No real policy-version history exists yet to roll back to. Converted to a dropdown and protected (locked), per the 2026-11-12 request, pending a real decision on rollback policy.' },
    ],
  },
  {
    id: 'completeness_rules',
    sectionNumber: 2,
    title: 'Application Completeness Rules',
    subtitle: 'Prerequisite data fields, electronic signatures, and regional collection limits',
    kind: 'table',
    // Session 63: "Enforcement Status" is now a real editable dropdown
    // (Mandatory / Customise) instead of a read-only Pill, and a new
    // "PM Override Value" (Yes/No) column was inserted before "PM Override
    // Bounds" — it gates whether Bounds shows anything for that row.
    tableColumns: ['Data Module', 'Enforcement Status', 'Admin Baseline Value', 'PM Override Value', 'PM Override Bounds'],
    rows: [
      { id: 'applicant_personal_info', module: 'Applicant Personal Information', enforcement: 'MANDATORY', locked: true, pmOverrideAllowed: false, baseline: 'Full Legal Name, DOB, SSN/ITIN, Phone' },
      { id: 'residential_history', module: 'Residential History', enforcement: 'MANDATORY', locked: false, pmOverrideAllowed: true, baseline: 24, baselineSuffix: 'months consecutive address trail', pmMin: 12, pmMax: 36, pmUnit: 'months', hint: 'Also the real value behind Tab 2’s "Rental History" criterion drawer ("24 Months Consecutive History") — same field.' },
      { id: 'rental_history_refs', module: 'Rental History References', enforcement: 'MANDATORY', locked: false, pmOverrideAllowed: true, baseline: 2, baselineSuffix: 'prior landlords with verified email/phone', pmMin: 1, pmMax: 3, pmUnit: 'references', hint: 'Also the real value behind Tab 2’s "Rental History" criterion drawer ("2 Verifications Required") — same field.' },
      // Session 63: PM Override Bounds restructured from a free-text note
      // into a real W-2/Tax Returns/Pay Stubs dropdown; Admin Baseline Value
      // is now the number 2, with its unit switching years ↔ months based
      // on that dropdown (years for W-2/Tax Returns, months for Pay Stubs).
      { id: 'employment_income', module: 'Employment & Income Records', enforcement: 'MANDATORY', locked: false, pmOverrideAllowed: true, baseline: 2, baselineSuffix: 'years', pmOverrideDocType: 'W2', sample: true, hint: 'Baseline unit switches to months if Pay Stubs is selected as the PM override document type. Minimum tenure and the method/vendor name are configured in Tab 2’s "Employment Verification" criterion drawer — same underlying record.' },
      { id: 'fcra_consent', module: 'FCRA Digital Consent Authorization', enforcement: 'MANDATORY', locked: true, pmOverrideAllowed: false, baseline: 'E-Signature + IP & timestamp cryptographic stamp', sample: true, hint: 'The cryptographic stamp itself is sample — see the Application Intake review’s own e-signature note.' },
      { id: 'co_applicant_minor', module: 'Co-Applicant & Minor Declarations', enforcement: 'CUSTOMISE', locked: false, pmOverrideAllowed: true, baseline: 18, baselineSuffix: 'years (required if occupant age ≥ this)', pmMin: 0, pmMax: 25, pmUnit: 'years' },
    ],
  },
  // Session 73 — "Evaluation Outcome & Weightage": a single, platform-fixed
  // two-column grid (Evaluation Outcome / Outcome Weightage %) defining how
  // much each possible per-criterion evaluation outcome contributes to that
  // criterion's assigned weightage when the combined applicant score is
  // calculated. Read-only display for this FE pass — no Add/Remove, no
  // per-row editing — same "documents the rule, isn't executed as the rule"
  // posture the scoring-engine discussion settled on; a real
  // ScreeningRuleDefinition/evaluator_key engine is a separate, larger
  // backend build, not part of this pass.
  // 2026-11-18 — repositioned from section 8 (originally right after
  // Criminal Background & Fair Housing) to section 3, directly before
  // Identity & Fraud Prevention Rules, per explicit request — so an admin
  // sees the shared Evaluation Outcome vocabulary/weightage BEFORE the 6
  // scenario-grid sections that each reference it, rather than after. Every
  // section below (and employment_verification_rules, further down) had its
  // own `sectionNumber` shifted to match this new order; `id` is unchanged,
  // so nothing that reads this category by id (nothing does today) breaks.
  {
    id: 'evaluation_outcome_weightage',
    sectionNumber: 3,
    title: 'Evaluation Outcome & Weightage',
    // 2026-11-17 — exact wireframe copy (two sentences), replacing the
    // shortened version this screen had.
    subtitle: "Defines how much each possible per-criterion evaluation outcome contributes to that criterion's assigned weightage when the combined applicant score is calculated. An outcome marked Excluded takes no part in the score — it's handled as a gate/review state instead.",
    kind: 'outcomeWeightage',
    outcomeWeightage: DEFAULT_OUTCOME_WEIGHTAGE,
  },
  {
    id: 'identity_fraud',
    sectionNumber: 4,
    // 2026-11-17 — renamed from "Identity & Fraud Prevention Engine" to
    // "Identity & Fraud Prevention Rules" and switched from `kind: 'cards'`
    // (Government ID Verification / Biometric Selfie Liveness / Synthetic
    // ID & SSN Trace cards) to the same `scenarioOutcomes` grid design as
    // Credit Risk & Bureau Parameters (section 05), Income & Financial
    // (section 04), and Rental History & Eviction (section 06), per
    // explicit request — contents fully replaced with the 6 given
    // scenario/classification/outcome rows below.
    title: 'Identity & Fraud Prevention Rules',
    subtitle: 'Biometric liveness, synthetic identity scoring, and document authenticity checking',
    kind: 'scenarioOutcomes',
    classificationColumnLabel: 'Identity Classification',
    classificationOptions: IDENTITY_CLASSIFICATION_OPTIONS,
    scenarioRows: [
      { id: 'identity_sc_01', scenario: 'Valid government-issued ID submitted and details match application', classificationCode: 'VERIFIED', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'identity_sc_02', scenario: 'No identity document submitted', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'INFORMATION_REQUIRED', pmOverride: false, active: true },
      { id: 'identity_sc_03', scenario: 'Document submitted but unclear / incomplete', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'INFORMATION_REQUIRED', pmOverride: false, active: true },
      { id: 'identity_sc_04', scenario: "Document expired or details don't match application", classificationCode: 'MISMATCH_INVALID', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'identity_sc_05', scenario: 'Identity cannot be verified', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'UNABLE_TO_VERIFY', pmOverride: false, active: true },
      { id: 'identity_sc_06', scenario: 'Verification provider encounters technical error', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'FAILED', pmOverride: false, active: true },
    ],
    // Carried over from the old `primaryEngineLabel`/`engineSample` fields
    // this section used under its previous `kind: 'cards'` design — same
    // vendor, now shown as the standard vendorBadgeLabel/vendorBadgeSample
    // pair every scenarioOutcomes section uses.
    vendorBadgeLabel: 'Socure DocV + Persona',
    vendorBadgeSample: true,
    // 2026-11-18 — "(section 8)" corrected to "(section 3)": Evaluation
    // Outcome & Weightage was repositioned to section 3 this session.
    footnote: 'Rows are platform-fixed (no Add/Remove), replacing the previous Government ID Verification / Biometric Selfie Liveness / Synthetic ID & SSN Trace cards with a single scenario-outcome grid. The Evaluation Outcome column uses the same outcome labels as the "Evaluation Outcome & Weightage" section (section 3).',
  },
  {
    id: 'income_financial',
    sectionNumber: 5,
    title: 'Income & Financial Verification Rules',
    subtitle: 'Rent-to-income benchmarks, Open Banking connectors, and Source of Income compliance',
    // Session 73 — `kind` switched from 'fields' to 'scenarioOutcomes' so
    // this section now renders as the 3-column Scenario/Income
    // Classification/Evaluation Outcome grid requested, replacing the 4
    // field editors that used to render here. The `fields` array below is
    // DELIBERATELY KEPT (not deleted) — Tab 2's "Income Qualification"
    // criterion drawer still reads/writes `default_rti_ratio` directly by
    // field id (`source: {kind:'field', categoryId:'income_financial',
    // fieldId:'default_rti_ratio'}`), same for Alternative Documentation's
    // old `liquid_asset_alt` reference. Removing this array would silently
    // break those drawers. `computePolicyStats` below was changed to scan
    // by array presence rather than by `kind`, so these fields still count
    // toward the Inheritance Banner's locked/PM-override stats even though
    // Tab 1 no longer renders a FieldsSection for this category.
    kind: 'scenarioOutcomes',
    classificationColumnLabel: 'Income Classification',
    classificationOptions: INCOME_CLASSIFICATION_OPTIONS,
    scenarioRows: [
      { id: 'income_sc_01', scenario: "Individual applicant's verified income meets required threshold", classificationCode: 'MEETS_INCOME_REQUIREMENT', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'income_sc_02', scenario: "Individual applicant's verified income is below required threshold", classificationCode: 'BELOW_INCOME_REQUIREMENT', outcomeCode: 'DOES_NOT_MEET_CRITERIA', pmOverride: false, active: true },
      { id: 'income_sc_03', scenario: 'Combined verified income of applicant and co-applicant meets required threshold', classificationCode: 'MEETS_INCOME_REQUIREMENT', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'income_sc_04', scenario: 'Combined verified income of applicant and co-applicant is below required threshold', classificationCode: 'BELOW_INCOME_REQUIREMENT', outcomeCode: 'DOES_NOT_MEET_CRITERIA', pmOverride: false, active: true },
      { id: 'income_sc_05', scenario: 'Applicant income documents missing', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'INFORMATION_REQUIRED', pmOverride: false, active: true },
      { id: 'income_sc_06', scenario: 'Co-applicant income documents missing', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'INFORMATION_REQUIRED', pmOverride: false, active: true },
      { id: 'income_sc_07', scenario: 'Income verification pending for applicant or co-applicant', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'PENDING', pmOverride: false, active: true },
      { id: 'income_sc_08', scenario: 'Income cannot be verified for applicant or co-applicant', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'UNABLE_TO_VERIFY', pmOverride: false, active: true },
      { id: 'income_sc_09', scenario: 'Verification provider returns technical error', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'FAILED', pmOverride: false, active: true },
      { id: 'income_sc_10', scenario: 'Income evidence requires manual review', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
    ],
    vendorBadgeLabel: 'Direct Payroll & Plaid Enforced',
    vendorBadgeSample: true,
    // 2026-11-17 — exact wireframe footnote copy (ScreeningRules_IncomeFinancialVerificationRules.dc.html).
    // 2026-11-18 — "section 8" corrected to "section 3": Evaluation Outcome
    // & Weightage was repositioned to section 3 this session.
    footnote: 'Rows are platform-fixed (no Add/Remove), same approach as the Credit Risk & Bureau Parameters grid. "Meets Criteria" / "Does Not Meet Criteria" / "Pending" / "Unable to Verify" / "Failed" / "Requires Review" are colored to match section 3\'s palette.',
    fields: [
      // 2026-11-12: added a real PM Override Yes/No toggle (+ bounds), per
      // request. Defaulted to Yes — this field's hint already documented
      // "PM Customization Permission: Allowed" before this toggle existed,
      // so `true` makes that pre-existing stated intent real/functional.
      // Bounds (2.5x–3.5x) are a judgment call, not specified in the
      // request — centered ±0.5 around the 3.0x baseline; easy to adjust.
      { id: 'default_rti_ratio', label: 'Default Rent-to-Income Ratio', value: 3.0, type: 'number', step: 0.1, suffix: 'x gross monthly rent', pmPermission: 'ALLOWED', pmOverrideAllowed: true, pmMin: 2.5, pmMax: 3.5, pmUnit: 'x rent', hint: 'Updated 2026-11-12 from 2.8x to 3.0x to match the Tab 2 "Income Qualification" criterion drawer — see the Figma review §8.4/§9, decision 4(a) ("drawer wins"). PM Customization Permission: Allowed, with pre-approved numerical bounds.' },
      { id: 'section8_treatment', label: 'Section 8 / Voucher Treatment', value: 'Strict Law', type: 'select', locked: true, options: [
        { value: 'Strict Law', label: 'Strict Law (Tenant Portion Only)' },
        { value: 'Percentage-Based', label: 'Percentage-Based' },
        { value: 'Full Contract Rent', label: 'Full Contract Rent' },
      ], hint: 'Ratio calculated strictly against the tenant’s individual out-of-pocket portion, never total contract rent. Hardcoded option list (CustomDropdown, Session 62) — move to a real UNDropdown-backed list (ARCH_002) once this screen has a backend. Protected per the 2026-11-12 request.' },
      // 2026-11-12: added a real PM Override Yes/No toggle (+ bounds), per
      // request. Defaulted to No — unlike Default Rent-to-Income Ratio
      // above, this field had no prior "Allowed" designation, so it starts
      // protected and an admin opts it in explicitly. Bounds (24x–48x) are
      // a judgment call centered around the 36x baseline.
      { id: 'liquid_asset_alt', label: 'Liquid Asset Alternative', value: 36, type: 'number', suffix: 'x monthly rent', pmOverrideAllowed: false, pmMin: 24, pmMax: 48, pmUnit: 'x rent', hint: 'Applies to retirees or high-net-worth applicants lacking active W-2 payroll income. Also the real value behind Tab 2’s "Alternative Documentation" criterion drawer — same field, one source of truth.' },
      { id: 'bank_verification_tier', label: 'Direct Bank Verification', value: 'Plaid / Argyle — Tier 1', type: 'select', locked: true, sample: true, options: [
        { value: 'Plaid / Argyle — Tier 1', label: 'Plaid / Argyle — Tier 1' },
        { value: 'Plaid / Argyle — Tier 2', label: 'Plaid / Argyle — Tier 2' },
        { value: 'Manual Document Upload Only', label: 'Manual Document Upload Only' },
      ], hint: 'Manual document uploads trigger algorithmic metadata & PDF forgery inspection. Hardcoded option list (CustomDropdown, Session 62) — move to a real UNDropdown-backed list (ARCH_002) once this screen has a backend. Protected per the 2026-11-12 request.' },
    ],
  },
  {
    id: 'credit_risk',
    sectionNumber: 6,
    title: 'Credit Risk & Bureau Parameters',
    subtitle: 'TransUnion ResidentScore 4.0 scoring tiers, bankruptcy lookbacks, and collections exclusions',
    // Session 73 — `kind` switched from 'bands' to 'scenarioOutcomes', same
    // reasoning as income_financial above: Tab 1 now shows the 3-column
    // Scenario/Credit Classification/Evaluation Outcome grid instead of the
    // Tier A/B/C boxes + Medical Debt Exclusion toggle. `bands`/`extraToggle`
    // below are legacy — superseded by Tab 2's Credit Check criterion
    // `scoreTiers` (CRITERIA_EXTENDED_DEFAULTS.credit_criteria.scoreTiers),
    // kept only for computePolicyStats' locked-field count (see the long
    // comment above SECTION01_CRITERIA).
    // 2026-11-18 — the first 3 scenarioRows below used to carry a
    // hand-typed `scenario` string (650 / 600–649 / below 600) that had
    // drifted from both this section's own dead `bands` (660/620–659/<620)
    // AND the live `scoreTiers` (720/650–719/≤649) a PM/Admin actually edits
    // in Tab 2 — three different numbers for the same three tiers. Per
    // request, these 3 rows now carry `tierId` instead: UNAdminScreeningConfiguration's
    // ScenarioOutcomesSection resolves it against the live
    // criteriaExtendedConfig.credit_criteria.scoreTiers and generates the
    // Scenario text from that tier's own operator/valueMin/valueMax (see
    // formatScenarioFromTier there), so editing a tier's boundary in Tab 2
    // updates this cell automatically instead of needing a second, separate
    // edit here. The plain `scenario` string is kept as a static fallback
    // only (e.g. if scoreTiers were ever empty) and is not what normally
    // renders for these 3 rows.
    kind: 'scenarioOutcomes',
    classificationColumnLabel: 'Credit Classification',
    classificationOptions: CREDIT_CLASSIFICATION_OPTIONS,
    scenarioRows: [
      { id: 'credit_sc_01', tierId: 'tier_a', scenario: 'Credit score ≥ 720', classificationCode: 'GOOD_TIER_A', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'credit_sc_02', tierId: 'tier_b', scenario: 'Credit score 650–719', classificationCode: 'MODERATE_TIER_B', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'credit_sc_03', tierId: 'tier_c', scenario: 'Credit score ≤ 649', classificationCode: 'LOW_TIER_C', outcomeCode: 'DOES_NOT_MEET_CRITERIA', pmOverride: false, active: true },
      { id: 'credit_sc_04', scenario: 'Credit check pending / provider unavailable', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'PENDING', pmOverride: false, active: true },
      { id: 'credit_sc_05', scenario: 'Credit information missing / no credit history', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'UNABLE_TO_VERIFY', pmOverride: false, active: true },
      { id: 'credit_sc_06', scenario: 'Credit check failed due to technical error', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'FAILED', pmOverride: false, active: true },
    ],
    vendorBadgeLabel: 'TransUnion ResidentScore 4.0',
    vendorBadgeSample: true,
    // 2026-11-17 — exact wireframe footnote copy (ScreeningRules_CreditRiskBureauParameters.dc.html).
    // 2026-11-18 — "(section 8)" corrected to "(section 3)": Evaluation
    // Outcome & Weightage was repositioned to section 3 this session.
    footnote: 'Rows are platform-fixed (no Add/Remove), consistent with how the previous Tier A/B/C boxes were fixed labels with only the score boundaries editable. The Evaluation Outcome column uses the same 6 outcome labels as the new "Evaluation Outcome & Weightage" section (section 3) — Pending / Unable to Verify / Failed read Excluded there, consistent with this grid.',
    // Updated 2026-11-12: restructured from a flat 650/580-649/<580 cutoff to
    // named tiers (A/B/C) to match Tab 2's "Credit Criteria" drawer, whose
    // UN Admin Default Value is "Tier B Baseline (620–659)" — see the Figma
    // review §8.4/§9, decision 4(a) ("drawer wins"). The drawer edits
    // `conditional` (Tier B) directly; this is the same band, one source
    // of truth.
    // 2026-11-12: added a real, independent PM Override Yes/No toggle to
    // every tier, per request — a plain toggle (no bounds editor; bands
    // don't have an established bounds pattern the way "fields"-kind
    // entries do). Defaulted to No on all three — this is a brand new
    // control, not tied to Tier B's existing `pmPermission: 'RESTRICTED'`
    // note (a separate, Tab-2-criterion-level concept) — a judgment call,
    // easy to flip per-tier in the UI.
    bands: [
      { id: 'auto_approve', label: 'Tier A — Auto-Approve Threshold', comparator: '>=', value: 660, note: 'Clean payment history with zero active housing defaults.', pmOverride: false },
      { id: 'conditional', label: 'Tier B — Conditional / Elevated Deposit', valueMin: 620, valueMax: 659, note: 'Triggers extra security deposit (where state law permits) or guarantor request. This is the Tab 2 drawer’s selected baseline tier.', pmPermission: 'RESTRICTED', pmOverride: false },
      { id: 'adverse_action', label: 'Tier C — Adverse Action Review', comparator: '<', value: 620, note: 'Mandates preliminary notice and standard FCRA 14-day dispute hold.', pmOverride: false },
    ],
    extraToggle: { id: 'medical_debt_exclusion', label: 'Medical Debt Exclusion', value: true, note: 'All medical collection debt is permanently suppressed from scoring calculations under CFPB 2024 directives.' },
  },
  {
    id: 'rental_history_eviction',
    sectionNumber: 7,
    title: 'Rental History & Eviction Public Records',
    subtitle: 'Court record aggregation, judgment verification, and prior landlord automated verification',
    // Session 73 — `kind` switched from 'fields' to 'scenarioOutcomes', same
    // reasoning as income_financial/credit_risk above. No Tab 2 criterion
    // reads this category's `fields` directly (Rental History's own drawer
    // source is `completeness_rules.residential_history`, a different
    // category) — `fields` is kept anyway, purely so computePolicyStats'
    // locked/PM-override counts (eviction_lookback_years) don't silently
    // change just because this section's display changed.
    kind: 'scenarioOutcomes',
    classificationColumnLabel: 'Rental Classification',
    classificationOptions: RENTAL_CLASSIFICATION_OPTIONS,
    scenarioRows: [
      { id: 'rental_sc_01', scenario: 'Individual applicant has positive rental history with timely payments', classificationCode: 'GOOD', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'rental_sc_02', scenario: 'Individual applicant has repeated documented late rental payments', classificationCode: 'MODERATE', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'rental_sc_03', scenario: 'Individual applicant has documented serious lease violations or eviction judgment', classificationCode: 'POOR', outcomeCode: 'DOES_NOT_MEET_CRITERIA', pmOverride: false, active: true },
      { id: 'rental_sc_04', scenario: 'Applicant has no previous rental history', classificationCode: 'NO_HISTORY', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'rental_sc_05', scenario: "Applicant's rental references or documents are missing", classificationCode: 'NOT_AVAILABLE', outcomeCode: 'INFORMATION_REQUIRED', pmOverride: false, active: true },
      { id: 'rental_sc_06', scenario: 'Rental history verification pending', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'PENDING', pmOverride: false, active: true },
      { id: 'rental_sc_07', scenario: 'Rental history cannot be verified', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'UNABLE_TO_VERIFY', pmOverride: false, active: true },
      { id: 'rental_sc_08', scenario: 'Rental verification provider returns technical error', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'FAILED', pmOverride: false, active: true },
      { id: 'rental_sc_09', scenario: 'Rental evidence requires manual review', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'rental_sc_10', scenario: 'Applicant and co-applicant both have positive rental histories', classificationCode: 'GOOD', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'rental_sc_11', scenario: 'One applicant has positive history and the other requires review', classificationCode: 'MIXED', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'rental_sc_12', scenario: 'One applicant has a poor rental history', classificationCode: 'MIXED', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
    ],
    vendorBadgeLabel: 'LexisNexis Risk Engine',
    vendorBadgeSample: true,
    // 2026-11-17 — exact wireframe footnote copy (ScreeningRules_RentalHistoryEvictionRecords.dc.html).
    footnote: 'Rows are platform-fixed (no Add/Remove), same approach as the other two revised sections.',
    fields: [
      { id: 'eviction_lookback_years', label: 'Eviction Filing Lookback Ceiling', value: 7, type: 'number', suffix: 'years maximum', pmOverrideAllowed: true, pmMin: 3, pmMax: 8, hint: 'Dismissed or non-suit filings are automatically suppressed. Only adjudicated formal judgments of possession are evaluated.' },
      { id: 'automated_vor', label: 'Automated Landlord Verification', value: true, type: 'toggle', sample: true, hint: 'Dispatches multi-channel SMS/Email surveys to previous housing providers. Inconclusive responses fail open after 48 business hours.' },
    ],
  },
  {
    id: 'criminal_background',
    sectionNumber: 8,
    title: 'Criminal Background & Fair Housing Guidance',
    subtitle: 'HUD 2016 structure, bifurcated stage review, automated exclusion guards',
    // 2026-11-18 — `kind` switched from 'fields' to 'scenarioOutcomes', same
    // conversion already applied to Identity & Fraud Prevention (03),
    // Income & Financial (04), Credit Risk & Bureau (05), and Rental
    // History & Eviction (06): this section now renders as the 3-column
    // Scenario/Criminal Classification/Evaluation Outcome grid, fully
    // replacing the old field-editor display, per explicit request. The
    // `fields` array below is DELIBERATELY KEPT (not deleted) — Tab 2's
    // "Criminal Background Check" criterion drawer still reads
    // `criminal_lookback_years` directly by field id (`source: {kind:'field',
    // categoryId:'criminal_background', fieldId:'criminal_lookback_years'}`,
    // see this file's SECTION01_CRITERIA below) — same "drawer wins, keep
    // the array for source references" rule already applied to the other
    // 3 converted sections. `computePolicyStats` already scans by array
    // presence, not by `kind`, so these fields still count toward the
    // Inheritance Banner's locked/PM-override stats unchanged.
    //
    // Fair Housing is deliberately NOT a second scoring criterion or a
    // second scenario grid here, per the explicit 2026-11-18 request — it
    // is rendered as a set of mandatory, always-on screening safeguards
    // (`mandatorySafeguards` below) alongside the grid's own evaluation
    // rules (`evaluationRules`), both read by ScenarioOutcomesSection.
    kind: 'scenarioOutcomes',
    // Carries over the HUD 2016 badge the old `complianceBadgeLabel` field
    // showed under `kind: 'fields'` (FieldsSection) — ScenarioOutcomesSection
    // reads the badge from `vendorBadgeLabel` instead (the same slot every
    // other scenario-grid section uses), so `complianceBadgeLabel` is
    // retired here rather than kept as a second, unread prop.
    // `vendorBadgeSample` is deliberately omitted — this is a real
    // compliance-scope label, not a fabricated vendor/engine claim.
    vendorBadgeLabel: 'HUD 2016 Enforced',
    classificationColumnLabel: 'Criminal Classification',
    classificationOptions: CRIMINAL_CLASSIFICATION_OPTIONS,
    scenarioRows: [
      { id: 'criminal_sc_01', scenario: 'No reportable criminal record found within applicable screening scope', classificationCode: 'CLEAR', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'criminal_sc_02', scenario: 'Criminal conviction found that requires assessment', classificationCode: 'RECORD_FOUND', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'criminal_sc_03', scenario: 'Arrest record found without a conviction', classificationCode: 'RECORD_FOUND', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'criminal_sc_04', scenario: 'Criminal record found but identity match is uncertain', classificationCode: 'NOT_VERIFIED', outcomeCode: 'UNABLE_TO_VERIFY', pmOverride: false, active: true },
      { id: 'criminal_sc_05', scenario: 'Background check pending', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'PENDING', pmOverride: false, active: true },
      { id: 'criminal_sc_06', scenario: 'Background check provider encounters technical error', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'FAILED', pmOverride: false, active: true },
    ],
    // "Important evaluation rules" — the 4 given rules, rendered by
    // ScenarioOutcomesSection directly beneath the footnote.
    evaluationRules: [
      'An arrest alone must not automatically result in rejection.',
      'A criminal record must be matched against the applicant using reliable identifying information.',
      'Sealed or expunged records, and records that cannot legally be considered, must not be used.',
      'A conviction requiring review must undergo an individualized assessment before an adverse decision — considering the nature and seriousness of the conduct, its relevance to resident safety, time elapsed, and evidence of rehabilitation or mitigating circumstances.',
    ],
    // "Fair Housing Guidance – Phase 1 rules" — per the explicit request,
    // NOT a separate numerical scoring criterion; a set of mandatory
    // screening safeguards shown alongside this section's own grid.
    mandatorySafeguards: [
      'No automatic rejection based solely on an arrest or the existence of a criminal record.',
      'No blanket rejection of all applicants with criminal convictions.',
      'Apply the same published screening policy consistently to all applicants.',
      'Allow the applicant an opportunity to provide relevant mitigating information.',
      'Require the PM to record the reason and supporting rationale for an adverse decision.',
      'Follow applicable Fair Housing, state and local requirements.',
    ],
    footnote: 'Rows are platform-fixed (no Add/Remove), same approach as the other scenario-outcome grids. Fair Housing guidance is enforced here as a set of mandatory screening safeguards rather than a separate weighted criterion — see Section 8 for how each Evaluation Outcome above contributes to the combined score.',
    // Session 64: every field here now carries `lockToggle: true`, which
    // gives it a real interactive Locked/Unlocked switch (EditableField)
    // instead of the plain static `locked` flag the rest of the screen
    // uses — this section's fields are the ones most directly tied to a
    // fixed HUD 2016 guidance requirement, so letting an admin see AND
    // flip the lock state (rather than just display it) was the specific
    // gap flagged. `locked` still starts at each field's existing value —
    // flipping the switch is additive, not a default-state change. No
    // longer rendered directly (kind is now 'scenarioOutcomes' — see
    // above) but kept for the Tab 2 drawer source reference and the
    // Inheritance Banner's stats.
    fields: [
      { id: 'bifurcated_screening', label: 'Bifurcated Two-Step Screening', value: true, type: 'toggle', locked: true, lockToggle: true, hint: 'Criminal background check cannot be requested or executed until the applicant passes financial, credit, and tenancy qualifications.' },
      { id: 'arrests_without_conviction', label: 'Arrests Without Conviction', value: 'Absolute Zero Evaluation', type: 'readonly', locked: true, lockToggle: true, hint: 'Masked at data-ingest stage — never surfaced to a decision-maker. Matches Tab 2’s "Criminal Background" drawer language, "Zero Arrest Weight".' },
      { id: 'criminal_record_scope', label: 'Record Scope', value: 'Violent Felonies Only', type: 'text', locked: true, lockToggle: true, hint: 'Narrowed 2026-11-12 from "all categories" to match Tab 2’s criterion drawer — see the Figma review §8.4/§9, decision 4(a).' },
      { id: 'criminal_lookback_years', label: 'Lookback Ceiling (Post-Sentence)', value: 7, type: 'number', suffix: 'years post-sentence (except lifetime sex-offender registry)', locked: false, lockToggle: true, hint: 'Updated 2026-11-17 from 5 to 7 years post-sentence to match the approved wireframe\'s "Criminal Background Check" criterion drawer ("Default Value — Lookback Ceiling: 7 years maximum lookback") — same field, one source of truth.' },
      { id: 'individualized_assessment_days', label: 'Individualized Assessment Window', value: 14, type: 'number', suffix: 'days applicant evidence submission stays active', locked: false, lockToggle: true },
    ],
  },
  // Session 73 — new section 09, "Employment Verification Rules". No
  // equivalent section existed in Tab 1 before this (Employment
  // Verification's own criterion drawer lives under Tab 2, Section 01 —
  // this is a separate, new rules table, not a duplicate of that). Rows
  // 11–13 (co-applicant/combined scenarios) read like they could belong
  // under Tab 2's Co-Applicant/Household Screening sections instead, but
  // per the 2026-11-16 decision they stay here exactly as given.
  {
    id: 'employment_verification_rules',
    sectionNumber: 9,
    title: 'Employment Verification Rules',
    subtitle: 'Payroll/employer verification outcomes and how each maps to an evaluation decision.',
    kind: 'scenarioOutcomes',
    // No named vendor badge for this section in the wireframe — only the
    // sample-data pill, unlike the other 3 scenario-grid sections.
    vendorBadgeSample: true,
    // 2026-11-17 — exact wireframe footnote copy (ScreeningRules_EmploymentVerificationRules.dc.html).
    footnote: 'This is a brand-new section — there\'s no existing "Employment Verification Rules" section in the real Screening Rules tab (which currently has 7: General & Applicability, Application Completeness, Identity & Fraud Prevention, Income & Financial, Credit Risk & Bureau, Rental History & Eviction, Criminal Background & Fair Housing). This would be section 9 alongside the new section 8. Note this is separate from the existing "Employment Verification" criterion card and its Add/Edit screen under tab 2 — that stays as-is; this is a new rules table under tab 1.',
    classificationColumnLabel: 'Employment Classification',
    classificationOptions: EMPLOYMENT_CLASSIFICATION_OPTIONS,
    scenarioRows: [
      { id: 'emp_sc_01', scenario: 'Individual applicant has verified current employment', classificationCode: 'VERIFIED', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'emp_sc_02', scenario: 'Applicant has verified employment but short employment tenure', classificationCode: 'REQUIRES_REVIEW', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'emp_sc_03', scenario: 'Applicant is self-employed with verifiable business activity', classificationCode: 'VERIFIED', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'emp_sc_04', scenario: 'Applicant is currently unemployed', classificationCode: 'NOT_EMPLOYED', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'emp_sc_05', scenario: 'Applicant is retired or has no current employment', classificationCode: 'NOT_APPLICABLE', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'emp_sc_06', scenario: "Applicant's employment documents are missing", classificationCode: 'NOT_AVAILABLE', outcomeCode: 'INFORMATION_REQUIRED', pmOverride: false, active: true },
      { id: 'emp_sc_07', scenario: 'Employment verification pending', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'PENDING', pmOverride: false, active: true },
      { id: 'emp_sc_08', scenario: 'Employer cannot be contacted or employment cannot be verified', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'UNABLE_TO_VERIFY', pmOverride: false, active: true },
      { id: 'emp_sc_09', scenario: 'Employment verification provider returns technical error', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'FAILED', pmOverride: false, active: true },
      { id: 'emp_sc_10', scenario: 'Employment evidence requires manual review', classificationCode: 'NOT_AVAILABLE', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'emp_sc_11', scenario: 'Applicant and co-applicant both have verified employment', classificationCode: 'VERIFIED', outcomeCode: 'MEETS_CRITERIA', pmOverride: false, active: true },
      { id: 'emp_sc_12', scenario: 'One applicant has verified employment and the other requires review', classificationCode: 'MIXED', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
      { id: 'emp_sc_13', scenario: "One applicant's employment cannot be verified", classificationCode: 'MIXED', outcomeCode: 'REQUIRES_REVIEW', pmOverride: false, active: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — "Evaluation & Decisions" (reviewed + built 2026-11-12, "Session 61")
// See screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
// §8–9 for the full review and the AskUserQuestion-confirmed decisions below.
// ─────────────────────────────────────────────────────────────────────────────

// Section 01 ("Screening Criteria Framework") needs a few small real fields
// Tab 1 never had: Guarantor Option (wholly new — no Tab 1 equivalent at
// all), plus the employment minimum tenure number. Stored separately from
// `categories` so Tab 1's "7 sections" shape is untouched — these are
// Section-01-only, not an 8th Tab 1 section.
//
// Session 73 additions — the 3 genuinely-new fields surfaced while scoping
// the drawer rewrite (see the session's "3 of 5 Default Value asks turned
// out to be duplicates" finding — Rental History, Criminal Background, and
// Credit Criteria's asks all duplicate real existing fields/bands already
// editable elsewhere, so only these 3 needed brand-new storage):
// - income_rent_baseline_type: new Income Qualification dropdown.
// - employment_default_documents: new Employment Verification repeatable
//   default-documents list (doc type + count pairs).
// - identity_approved_documents: new Identity Verification multi-select —
//   the approved ID catalogue for OCR + liveness.
// 2026-11-17 — guarantor_* fields removed. Per the approved wireframe
// (Main.dc.html), Guarantor Option is NOT one of the 6 Screening Criteria
// Framework cards at all — this screen's prior build added it as a 7th
// criterion that has no wireframe behind it. Removed entirely, not just
// hidden, per the explicit "match the wireframes exactly" instruction.
export const CRITERIA_EXTRA_DEFAULTS = {
  employment_min_tenure_months: 6,
  income_rent_baseline_type: 'Monthly Rent Baseline',
  income_rent_baseline_multiplier: 3,
  employment_default_documents: [
    { docType: 'Pay Slips', count: 2 },
    { docType: 'W-2', count: 1 },
  ],
  identity_approved_documents: ['Passport', "Driver's License", 'Aadhaar Card'],
};

// Dropdown catalogues for the 3 new fields above, plus the drawer's new
// Supported Providers / Applicant Scope selectors. Session 73 — same
// "no hardcoding" posture as EVALUATION_OUTCOME_OPTIONS etc. further up
// this file: a single named, centralized list every consumer resolves by
// value, flagged for eventual migration to a real UNReference-backed list.
export const RENT_BASELINE_TYPE_OPTIONS = ['Monthly Rent Baseline', 'Annual Rent Baseline'];

// 2026-11-17 — Mode / Category are now real dropdowns for Credit Check's
// drawer specifically (per explicit request to unprotect them there).
// Options are the full set of values actually used across the 6 criteria
// today, so picking a different one doesn't invent a value nothing else
// on this screen recognizes; DropdownOrCustom's own "Custom…" escape
// hatch still covers a genuinely new one.
export const MODE_OPTIONS = ['Score Threshold', 'Tier-Threshold', 'Direct API', 'Registry Scan', 'OCR + Liveness', 'Registry Lookup'];
export const CATEGORY_OPTIONS = ['Financial Risk', 'Housing History', 'Background & Compliance', 'Identity & Compliance'];

// 2026-11-17 — Credit Check's Score Tiers table: the per-tier "Evaluation
// Outcome" column (was free text) is now a dropdown over this catalogue —
// distinct from EVALUATION_OUTCOME_OPTIONS above, which is the Tab 2
// scenario-grid's own {code,label,pillBg,pillColor} shape for a different
// feature (section 08/09's Evaluation Outcome), not score-tier result
// labels. Covers the 3 current tier labels (Excellent/Good/Needs Review)
// plus 2 more for if a UN Admin adds a 4th/5th tier later.
export const SCORE_TIER_OUTCOME_OPTIONS = ['Excellent', 'Good', 'Fair', 'Needs Review', 'Poor'];

export const IDENTITY_DOCUMENT_OPTIONS = [
  'Passport',
  "Driver's License",
  'National ID Card',
  'Aadhaar Card',
  'Voter ID',
  'State ID Card',
];

export const SUPPORTED_PROVIDER_OPTIONS = [
  'CreditLink Verify',
  'IncomeCheck Pro',
  'GuardianScreen',
  'RentHistory Registry',
];

// 2026-11-17 — Credit Check's real, capability-matrix-filtered provider
// list: every INITIAL_PARTNERS record whose own `criteria` includes the
// matching Capability Matrix key, plus 'Manual Verification' (always
// available — it isn't a partner record at all, same convention
// PartnerCapabilityMatrix.jsx's own grid uses for its "Manual
// Verification" row). First built for Credit Check alone (as
// CREDIT_CHECK_SUPPORTED_PROVIDERS); generalized 2026-11-17 to all 6
// drawers per explicit request, keyed by each drawer's own SECTION01_CRITERIA
// id (which doesn't always match its Capability Matrix key one-to-one —
// e.g. this screen's 'credit_criteria' vs. the matrix's 'credit_check').
// Today this resolves to:
//   credit_criteria      → CreditLink Verify, Manual Verification
//   income_qualification → IncomeCheck Pro, Manual Verification
//   employment_verification → IncomeCheck Pro, Manual Verification
//   rental_history        → RentHistory Registry, Manual Verification
//   criminal_background    → GuardianScreen, Manual Verification
//   identity_verification  → GuardianScreen, Manual Verification
const providersFor = (matrixCriterionKey) => [
  ...INITIAL_PARTNERS.filter((p) => p.criteria.includes(matrixCriterionKey)).map((p) => p.name),
  'Manual Verification',
];
export const SUPPORTED_PROVIDERS_BY_CRITERION = {
  credit_criteria: providersFor('credit_check'),
  income_qualification: providersFor('income_verification'),
  employment_verification: providersFor('employment_verification'),
  rental_history: providersFor('rental_history'),
  criminal_background: providersFor('criminal_background'),
  identity_verification: providersFor('identity_verification'),
};

// 2026-11-17 — corrected to the exact wireframe label ("Each Applicant
// Individually", not "Each Individually").
export const APPLICANT_SCOPE_OPTIONS = ['Primary Applicant', 'Co-Applicant', 'Each Applicant Individually', 'Household'];

// Catalogue of every alternative-document string referenced by any
// criterion's embedded Alternative Documentation section below (see
// CRITERIA_EXTENDED_DEFAULTS.altDoc.documents) — the full union across all
// 6 criteria, so the drawer's multi-select always has every real value as
// an option regardless of which criterion is open.
// 2026-11-17 — replaced wholesale with the exact document strings shown in
// the approved wireframe's 6 Add/Edit Criterion drawers (the prior list was
// this screen's own invention and didn't match any of them).
export const ALTERNATIVE_DOCUMENT_OPTIONS = [
  'Bank Statement (3 mo.)',
  'Notarized Landlord Reference',
  'Signed Offer Letter + First Pay Stub',
  'Physical In-Branch Verification',
  'Notarized Landlord Reference Letter',
];

// Session 73 — one entry per Section 01 criterion, holding the 3 new
// drawer fields that apply to EVERY criterion (not just the ones with a
// genuinely-new primary field above): Supported Markets, Supported
// Providers, Applicant Scope, and the embedded Alternative Documentation
// section that replaces the old standalone Alternative Documentation
// criterion. Defaults below are carried over from the final wireframes;
// flagged in the session summary as judgment calls where the wireframe
// didn't specify a value (e.g. Guarantor Option's altDoc.active).
// 2026-11-17 — rewritten field-for-field against the approved wireframe's 6
// Add/Edit Criterion drawers (one per criterion: Credit Check, Income
// Verification, Employment Verification, Criminal Background Check,
// Identity Verification, Rental History). Every value below — markets,
// the single selected provider, which Applicant Scope checkboxes are
// offered (and why), the Alternative Documentation state/documents/PM
// Override/notes, and the Supported Screening Methods chips — is copied
// from that criterion's own drawer exactly, replacing this screen's prior,
// partly-invented defaults. `supportedProvider` is now a SINGLE string
// (every drawer shows one dropdown, not a multi-select) — renamed from the
// old `supportedProviders` array. `scopeOptions` is the subset of
// APPLICANT_SCOPE_OPTIONS actually offered to this criterion (a checkbox
// grid, not every option every time); `scopeNote` is the exact wireframe
// explainer for why some options are withheld. `applicantScope` is the
// subset of `scopeOptions` currently checked — every wireframe example
// shows all offered options checked, so that's the default here too.
export const CRITERIA_EXTENDED_DEFAULTS = {
  income_qualification: {
    supportedMarkets: ['United States', 'India'],
    supportedProvider: 'IncomeCheck Pro',
    screeningMethods: ['Monthly Gross', 'Annual Gross'],
    scopeOptions: ['Primary Applicant', 'Co-Applicant', 'Each Applicant Individually', 'Household'],
    applicantScope: ['Primary Applicant', 'Co-Applicant', 'Each Applicant Individually', 'Household'],
    scopeNote: "These 4 options are the full set available for Income Verification's category. A criterion defined narrower — e.g. a single-signer Guarantor check — would show only \"Primary Applicant\" here; the option list filters automatically from the criterion's own definition, not a fixed list.",
    altDoc: {
      active: true,
      documents: ['Bank Statement (3 mo.)', 'Notarized Landlord Reference'],
      pmOverrideAllowed: false,
      notes: 'Bank statements must be averaged over the trailing 3 months; does not apply to co-signers.',
      // 2026-11-17 — exact wireframe copy shown under the PM Override
      // toggle for this criterion specifically; Employment/Rental show no
      // such note (their wireframes omit it), so this stays a per-criterion
      // optional field rather than a shared string.
      pmOverrideNote: 'Independent of the main PM Customization Permission above — a PM could be Allowed to adjust the main threshold but still blocked from touching the alternative-document list, or vice versa.',
      // Only Income's wireframe shows this second sentence next to "+ Add a
      // new document type" — Employment/Identity/Rental don't.
      addHint: 'Select from the list above, or add one not yet in the catalogue.',
      // Only Income's Active-state intro paragraph carries this extra
      // trailing sentence — every other criterion's Alternative
      // Documentation intro is a single sentence.
      activeExtraSentence: 'Everything below is disabled when this is Inactive.',
    },
    supportedProvidersHint: "Options sourced from Partners → Tenant Screening's own catalogue — only partners whose Supported Screening Criteria includes this one are offered here.",
  },
  credit_criteria: {
    supportedMarkets: ['United States'],
    supportedProvider: 'CreditLink Verify',
    screeningMethods: ['Score Threshold', 'Tier-Based Rating'],
    scopeOptions: ['Primary Applicant', 'Co-Applicant', 'Each Applicant Individually'],
    applicantScope: ['Primary Applicant', 'Co-Applicant', 'Each Applicant Individually'],
    scopeNote: 'Showing 3 of 4 applicant-scope options — "Household" is not offered for an individual-level bureau check.',
    // Credit Check's own "Default Value — Score Tiers" box — independent
    // of Tab 1's legacy credit_risk.bands (which are kept only for
    // computePolicyStats' locked-field count and no longer rendered
    // anywhere; see that category's own comment). Operator/value/label are
    // all editable per the wireframe; tier id/color are fixed.
    // 2026-11-17 — every tier now carries valueMin/valueMax (From/To),
    // not just Tier B. Tier A ("720 and above") has only a From value;
    // Tier C ("649 and below") has only a To value — the open end stays
    // null rather than being given a fabricated bound.
    scoreTiers: [
      { id: 'tier_a', tier: 'Tier A', operator: '>=', valueMin: 720, valueMax: null, label: 'Excellent' },
      { id: 'tier_b', tier: 'Tier B', operator: 'between', valueMin: 650, valueMax: 719, label: 'Good' },
      { id: 'tier_c', tier: 'Tier C', operator: '<=', valueMin: null, valueMax: 649, label: 'Needs Review' },
    ],
    altDoc: {
      active: false,
      documents: [],
      pmOverrideAllowed: false,
      notes: '',
      notApplicableNote: 'Not applicable — a bureau pull is mandatory and cannot be substituted with manual documentation.',
    },
  },
  employment_verification: {
    supportedMarkets: ['United States', 'India'],
    supportedProvider: 'IncomeCheck Pro',
    screeningMethods: ['Direct API', 'Manual Document Upload'],
    scopeOptions: ['Primary Applicant', 'Co-Applicant', 'Each Applicant Individually'],
    applicantScope: ['Primary Applicant', 'Co-Applicant', 'Each Applicant Individually'],
    scopeNote: 'Showing 3 of 4 applicant-scope options — "Household" doesn\'t apply to an individual employment check.',
    altDoc: {
      active: true,
      documents: ['Signed Offer Letter + First Pay Stub'],
      pmOverrideAllowed: true,
      notes: 'Only for employees within their first 60 days, in lieu of 2 consecutive pay stubs.',
    },
  },
  criminal_background: {
    supportedMarkets: ['United States'],
    supportedProvider: 'GuardianScreen',
    screeningMethods: ['National Registry Scan', 'County Court Records'],
    scopeOptions: ['Primary Applicant', 'Each Applicant Individually'],
    applicantScope: ['Primary Applicant', 'Each Applicant Individually'],
    scopeNote: 'Showing 2 of 4 applicant-scope options — a background check is always run per person; "Co-applicant" and "Household" don\'t apply as separate scopes here.',
    altDoc: {
      active: false,
      documents: [],
      pmOverrideAllowed: false,
      notes: '',
      notApplicableNote: 'Not applicable — incomplete registry results route to manual Compliance Officer review, not substitute documentation.',
    },
    // Criminal Background Check is Locked-only (see permissionOptions on
    // the criterion) — Allowed/Restricted are shown dimmed in the
    // wireframe rather than omitted, with this explanatory note.
    lockedOnlyNote: 'Allowed / Restricted are not offered for this criterion — a compliance-gated check is always Locked.',
  },
  identity_verification: {
    supportedMarkets: ['United States', 'India'],
    supportedProvider: 'GuardianScreen',
    screeningMethods: ['Document OCR + Liveness', 'SSN / Aadhaar Match'],
    scopeOptions: ['Primary Applicant', 'Each Applicant Individually'],
    applicantScope: ['Primary Applicant', 'Each Applicant Individually'],
    scopeNote: 'Showing 2 of 4 applicant-scope options — identity is always verified per person; "Co-applicant" and "Household" don\'t apply as separate scopes here.',
    altDoc: {
      active: true,
      documents: ['Physical In-Branch Verification'],
      pmOverrideAllowed: false,
      notes: "Only permitted when the applicant's device can't support camera capture for the liveness check.",
      pmOverrideNote: "Independent of the main PM Customization Permission above — this stays blocked even though it's a separate control.",
    },
    lockedOnlyNote: 'Allowed / Restricted are not offered for this criterion — identity verification is always Locked.',
    // Exact wireframe copy for the Default Value box's own "+ Add a
    // document type" row (distinct from the Alternative Documentation
    // section's own, separately-worded add-hint).
    approvedDocumentsCatalogueHint: "Preset catalogue: Passport, Driver's License, National ID Card, Aadhaar Card, Voter ID, State ID Card.",
  },
  rental_history: {
    supportedMarkets: ['United States'],
    supportedProvider: 'RentHistory Registry',
    screeningMethods: ['Registry Lookup', 'Manual Reference Check'],
    scopeOptions: ['Primary Applicant', 'Each Applicant Individually', 'Household'],
    applicantScope: ['Primary Applicant', 'Each Applicant Individually', 'Household'],
    scopeNote: 'Showing 3 of 4 applicant-scope options — "Co-applicant" is covered under "Each Applicant Individually" for this criterion.',
    altDoc: {
      active: true,
      documents: ['Notarized Landlord Reference Letter'],
      pmOverrideAllowed: true,
      notes: 'Common for first-time renters with no registry record; letter must be dated within 90 days.',
    },
  },
};

// 2026-11-17 — rewritten against the approved wireframe (Main.dc.html)
// EXACTLY: 6 clickable criteria, not 7. Guarantor Option is removed
// entirely (no wireframe card for it); Identity Verification's code is
// corrected to EVAL-CNT-IDV-01 (was invented as -07); Credit Check,
// Rental History and Employment Verification's codes all drop their
// invented "-02/-03/-04" suffixes for the wireframe's own "-01" on every
// criterion. Titles are renamed to the wireframe's exact card titles
// ("Credit Check" not "Credit Criteria", "Income Verification" not
// "Income Qualification", "Criminal Background Check" not "Criminal
// Background"). `mode` and `requirement` are new fields read directly off
// each criterion's own drawer. `permissionOptions`/`defaultPermission`
// (PM Configurability) and `weightEligible` are corrected per-criterion
// against each drawer's own PM Customization Permission / Weight Eligible
// state — Criminal Background Check is now `weightEligible: false` (the
// wireframe's drawer explicitly says "No — not weight-eligible"; the
// previous build kept it weighted, which is now corrected to match).
// `source` says where its real baseline value actually lives:
// - {kind:'field', categoryId, fieldId} / {kind:'row', categoryId, rowId}
//   point into Tab 1's real `categories` state — per the "drawer wins"
//   decision, the drawer edits that SAME field, so Tab 1's own section
//   reflects any change made here and vice versa. One real number, not two.
// - {kind:'extra'} points into CRITERIA_EXTRA_DEFAULTS /
//   CRITERIA_EXTENDED_DEFAULTS, for parameters (Credit Check's Score
//   Tiers, Employment's tenure/documents, Identity's approved-document
//   list) that Tab 1 has no field for at all. Credit Check moved from
//   {kind:'band'} to {kind:'extra'} this pass — its wireframe "Default
//   Value — Score Tiers" box (720 / 650–719 / 649, with per-tier operator
//   and result label) is a richer shape than Tab 1's legacy
//   credit_risk.bands (660 / 620–659 / <620) can represent, and that
//   legacy array is no longer rendered anywhere in Tab 1 (which now shows
//   the Credit Risk scenario grid instead) — kept only for
//   computePolicyStats' locked-field count.
export const SECTION01_CRITERIA = [
  // 2026-11-17 — Guarantor Option removed entirely (see the module note
  // above SECTION01_CRITERIA): the approved wireframe's 6-card grid has no
  // Guarantor Option card at all. Its old fields (guarantor_income_multiple
  // _min/_max, guarantor_credit_alt, guarantor_signed_required) were
  // likewise removed from CRITERIA_EXTRA_DEFAULTS.
  {
    id: 'credit_criteria',
    code: 'EVAL-CNT-CRD-01',
    title: 'Credit Check',
    tier: 'Primary',
    category: 'Financial Risk',
    mode: 'Score Threshold',
    requirement: 'Mandatory',
    weightEligible: true,
    source: { kind: 'extra' },
    overview: 'Pulls a consumer credit report and bureau score for the named applicant — evaluated against the Score Tiers below (TransUnion ResidentScore 4.0), with statutory medical-debt and disputed-collections exclusions.',
    // 2026-11-17 — drawerSubtitle/drawerDescription are the exact copy shown
    // in the approved wireframe's own Add/Edit Criterion drawer (distinct
    // from `overview`, which is this screen's own longer internal summary,
    // and from `cardBody`, which is the separate, shorter text the Tab 2
    // card shows — the two differ for some criteria in the wireframe
    // itself, so both are kept as their own literal fields rather than
    // reusing one for the other).
    drawerSubtitle: 'Defines the evaluation method, weighting, markets and PM rights for this criterion module.',
    drawerDescription: () => 'Pulls a consumer credit report and bureau score for the named applicant.',
    defaultValueBoxTitle: 'Default Value — Score Tiers',
    defaultValueIntro: 'The UN Admin default rating bands this criterion evaluates against. A PM may only adjust within the Restricted bounds set here (see PM Configurability below).',
    defaultValueFooterNote: 'Operator choices: >=, <=, =, between. Tier labels/colors are fixed (A=pass, B=conditional, C=fail) — only the score range and operator per tier are editable.',
    baselineTag: 'Standardized Tier',
    permissionOptions: ['ALLOWED', 'RESTRICTED'],
    permissionNotes: {
      ALLOWED: 'PMs may adjust applicant thresholds within pre-approved numerical bounds.',
      RESTRICTED: 'Requires Lead Admin or Compliance Officer dual sign-off.',
    },
    defaultPermission: 'RESTRICTED',
    cardMode: 'Score Threshold',
    cardBody: () => 'Pulls a consumer credit report and bureau score for the named applicant.',
  },
  {
    id: 'income_qualification',
    code: 'EVAL-CNT-INC-01',
    title: 'Income Verification',
    tier: 'Primary',
    category: 'Financial Risk',
    mode: 'Tier-Threshold',
    requirement: 'Mandatory',
    weightEligible: true,
    source: { kind: 'field', categoryId: 'income_financial', fieldId: 'default_rti_ratio' },
    overview: 'Defines Rent-to-Income (RTI) ratio thresholds, acceptable income streams, statutory non-discrimination guardrails, and permitted PM customization bounds across residential assets.',
    drawerSubtitle: 'Defines the evaluation method, weighting, markets and PM rights for this criterion module.',
    // 2026-11-17 — the wireframe's own Description box reads differently
    // from the Tab 2 card's cardBody text for this one criterion ("W-2 /
    // payslip or deposit; vouchers..." vs the card's "W-2/direct deposit.
    // Vouchers...") — kept as its own literal, still live off the real
    // multiplier value so it never goes stale if a UN Admin changes it.
    drawerDescription: (extraVal) => `${extraVal.income_rent_baseline_multiplier}× monthly rent via verified W-2 / payslip or deposit; vouchers count dollar-for-dollar toward total requirement.`,
    defaultValueBoxTitle: 'Default Value — Rent Baseline',
    baselineTag: 'Target Baseline',
    formatBaseline: (v) => `${v}× Monthly Rent Baseline (≈ ${(100 / v).toFixed(1)}% RTI) — switching Baseline Type to Annual recalculates this against yearly rent instead.`,
    permissionOptions: ['ALLOWED', 'RESTRICTED', 'LOCKED'],
    permissionNotes: {
      ALLOWED: 'PMs may adjust applicant thresholds with pre-approved numerical bounds.',
      RESTRICTED: 'Requires Lead Admin or Compliance Officer dual sign-off.',
      LOCKED: 'No PM override permitted under any circumstance.',
    },
    defaultPermission: 'ALLOWED',
    cardMode: 'Tier-Threshold',
    cardBody: (v) => `${v}× monthly rent via verified W-2/direct deposit. Vouchers count dollar-for-dollar toward total requirement.`,
  },
  {
    id: 'employment_verification',
    code: 'EVAL-CNT-EMP-01',
    title: 'Employment Verification',
    tier: 'Standard',
    category: 'Financial Risk',
    mode: 'Direct API',
    requirement: 'Optional',
    weightEligible: true,
    // kind: 'extra', not 'row' — the completeness_rules.employment_income
    // row's own baseline is descriptive text ("2 paystubs OR Plaid"), not a
    // number; the real editable value this drawer needs (the Required
    // Documents table) has no Tab 1 equivalent, so it lives in
    // CRITERIA_EXTRA_DEFAULTS.
    source: { kind: 'extra' },
    overview: 'Defines automated employment verification pathways (direct payroll APIs via Plaid/Argyle, employer HR outreach, or W-2/paystub document parsing), minimum tenure requirements, and verification thresholds.',
    drawerSubtitle: 'Defines the evaluation method, weighting, markets and PM rights for this criterion module.',
    drawerDescription: () => 'Automated payroll API connection (Plaid/Argyle) or direct HR employer verification with 2 recent pay stubs.',
    defaultValueBoxTitle: 'Default Value — Required Documents',
    defaultValueIntro: "Each accepted document type has its own default document count — e.g. 2 pay slips satisfy this criterion, but only 1 W-2 is needed.",
    defaultValueFooterNote: 'Document Type options come from the same catalogue as Accepted Alternative Documents below.',
    baselineTag: 'Target Baseline',
    permissionOptions: ['ALLOWED', 'RESTRICTED', 'LOCKED'],
    permissionNotes: {
      ALLOWED: 'PMs may adjust applicant thresholds within pre-approved numerical bounds.',
      RESTRICTED: 'Requires Lead Admin or Compliance Officer dual sign-off.',
      LOCKED: 'PM cannot view or alter this criterion\'s configuration at all.',
    },
    defaultPermission: 'ALLOWED',
    cardMode: 'Direct API',
    cardBody: () => 'Automated payroll API connection (Plaid/Argyle) or direct HR employer verification with 2 recent pay stubs.',
  },
  {
    id: 'rental_history',
    code: 'EVAL-CNT-RNT-01',
    title: 'Rental History',
    tier: 'Standard',
    category: 'Housing History',
    mode: 'Registry Lookup',
    requirement: 'Optional',
    weightEligible: true,
    source: { kind: 'row', categoryId: 'completeness_rules', rowId: 'residential_history' },
    overview: 'Defines prior landlord tenancy verification standards, consecutive residential address lookback window, adjudicative eviction filing standards, and non-null dismissed exclusions across residential portfolios.',
    drawerSubtitle: 'Defines the evaluation method, weighting, markets and PM rights for this criterion module.',
    drawerDescription: () => 'Rental history and unresolved-debt lookup against prior tenancies.',
    defaultValueBoxTitle: 'Default Value — Lookback Period',
    defaultValueFooterNote: 'A PM may narrow this within the Allowed bounds above, but cannot request fewer months than this UN Admin default.',
    baselineTag: 'Target Baseline',
    permissionOptions: ['ALLOWED', 'RESTRICTED', 'LOCKED'],
    permissionNotes: {
      ALLOWED: 'PMs may adjust applicant thresholds within pre-approved numerical bounds.',
      RESTRICTED: 'Requires Lead Admin or Compliance Officer dual sign-off.',
      LOCKED: 'PM cannot view or alter this criterion\'s configuration at all.',
    },
    defaultPermission: 'ALLOWED',
    cardMode: 'Registry Lookup',
    cardBody: () => 'Rental history and unresolved-debt lookup against prior tenancies.',
  },
  {
    id: 'criminal_background',
    code: 'EVAL-CNT-BGC-01',
    title: 'Criminal Background Check',
    tier: 'Conditional',
    category: 'Background & Compliance',
    mode: 'Registry Scan',
    requirement: 'Mandatory',
    // 2026-11-17 correction: the approved wireframe's own drawer explicitly
    // shows "Weight Eligible: No — not weight-eligible" for this criterion
    // ("A gate/pass-fail check; no weightage % to assign, and it's excluded
    // from the Active Criteria Weightage total."). The prior build kept
    // this weighted at 15% — that was this screen's own deviation, now
    // corrected to match the wireframe exactly.
    weightEligible: false,
    weightIneligibleHint: "A gate/pass-fail check; no weightage % to assign, and it's excluded from the Active Criteria Weightage total.",
    source: { kind: 'field', categoryId: 'criminal_background', fieldId: 'criminal_lookback_years' },
    overview: 'Defines criminal background screening protocols adhering strictly to HUD 2016 Guidance. Enforces bifurcated two-stage evaluation: criminal screening is executed ONLY after preliminary financial qualification. Arrests not involving convictions are masked, juvenile records are sealed, and individualized holistic assessment is legally required. A gate check, not scored — excluded from the Active Criteria Weightage total.',
    // 2026-11-17 — this criterion's drawer carries its own distinct
    // subtitle in the wireframe (calling out the gate-check/Locked nature
    // up top), not the generic one every other criterion uses.
    drawerSubtitle: 'A gate check: not weight-eligible and compliance-locked, so several fields below behave differently than a scored criterion.',
    drawerDescription: () => 'National registry and county court record scan; a gate check, not scored.',
    defaultValueBoxTitle: 'Default Value — Lookback Ceiling',
    defaultValueFooterNote: "A hard ceiling — this criterion defaults to Locked (see PM Configurability below), so no PM can request a longer lookback window than this unless a UN Admin deliberately switches that permission.",
    baselineTag: 'Statutory Baseline',
    // 2026-11-17 — was ['LOCKED'] only (no other option offered, radio
    // rows dimmed to opacity .4). Per explicit request, a UN Admin must be
    // able to select Allowed or Restricted too, not just view them dimmed
    // — defaultPermission stays 'LOCKED' (this is still a compliance gate
    // by default), but all 3 are now real, selectable options. Selecting
    // away from Locked is also what unprotects every other fieldsDisabled
    // control in this drawer (Lookback Ceiling input, Alternative
    // Documentation toggle, Supported Providers, Applicable Applicant
    // Scope) — they were already wired to fieldsDisabled, so no separate
    // per-field change was needed for those once this one option list
    // stopped forcing fieldsDisabled permanently true.
    permissionOptions: ['ALLOWED', 'RESTRICTED', 'LOCKED'],
    permissionNotes: {
      ALLOWED: 'PMs may adjust applicant thresholds within pre-approved numerical bounds.',
      RESTRICTED: 'Requires Lead Admin or Compliance Officer dual sign-off.',
      LOCKED: 'PM cannot view or alter this criterion\'s configuration at all.',
    },
    defaultPermission: 'LOCKED',
    cardMode: 'Registry Scan',
    cardBody: () => 'National registry and county court record scan; a gate check, not scored.',
  },
  {
    id: 'identity_verification',
    code: 'EVAL-CNT-IDV-01',
    title: 'Identity Verification',
    tier: 'Conditional',
    category: 'Identity & Compliance',
    mode: 'OCR + Liveness',
    requirement: 'Mandatory',
    weightEligible: false,
    weightIneligibleHint: 'A gate/pass-fail check; excluded from the Active Criteria Weightage total.',
    source: { kind: 'extra' },
    overview: "Defines the catalogue of accepted government-issued identity documents for OCR + liveness verification. The accepted list narrows automatically by the applicant's Supported Markets (e.g. Aadhaar Card only once India is selected). A gate/pass-fail check, not scored — excluded from the Active Criteria Weightage total.",
    drawerSubtitle: 'Also a gate check — not weight-eligible and compliance-locked — but unlike Criminal Background, it does have a real Alternative Documentation path.',
    drawerDescription: () => 'Document OCR with liveness check, cross-matched against national ID registry.',
    defaultValueBoxTitle: 'Default Value — Approved ID Documents',
    defaultValueIntro: "Which government-issued document types the OCR + Liveness check will accept. Multi-select — the applicant's document just needs to match one of the selected types.",
    defaultValueFooterNote: 'Options narrow automatically by Supported Markets — e.g. Aadhaar Card only appears once India is selected above.',
    baselineTag: 'Target Baseline',
    // 2026-11-17 — was ['LOCKED'] only; now all 3 are real, selectable
    // options (defaultPermission stays 'LOCKED'), same reasoning as
    // Criminal Background above — this is also what unprotects the
    // Alternative Documentation toggle, Supported Providers and
    // Applicable Applicant Scope below once switched away from Locked.
    permissionOptions: ['ALLOWED', 'RESTRICTED', 'LOCKED'],
    permissionNotes: {
      ALLOWED: 'PMs may adjust applicant thresholds within pre-approved numerical bounds.',
      RESTRICTED: 'Requires Lead Admin or Compliance Officer dual sign-off.',
      LOCKED: 'PM cannot view or alter this criterion\'s configuration at all.',
    },
    defaultPermission: 'LOCKED',
    cardMode: 'OCR + Liveness',
    cardBody: () => 'Document OCR with liveness check, cross-matched against national ID registry.',
  },
];

// 2026-11-17 — replaced with the exact wireframe copy for this banner
// (Main.dc.html). The prior text ("No universal 0-100 applicant
// suitability score...") was this screen's own invention.
export const PLATFORM_RULE_CALLOUT = "No universal criterion set is enforced across markets — each criterion's Supported Markets, Category and PM Configurability are set here per criterion, independently.";

// Session 65 — per-criterion "Weightage" default values (%). Historical
// note: originally summed to 100 across the 7 Section 01 criteria
// including the (since-retired) standalone Alternative Documentation
// entry — see the Session 73 note directly below for the current,
// superseding shape. These are starting values only; an admin
// can rebalance them as long as the ACTIVE criteria's sum stays at 100 —
// Save Draft is blocked otherwise (see UNAdminScreeningConfiguration.jsx's
// activeWeightageSum / handleSaveDraft).
// 2026-11-17 — replaced with the exact per-criterion Weightage values shown
// in each criterion's own Add/Edit drawer in the approved wireframe: Credit
// Check 20%, Income Verification 20%, Employment Verification 15%, Rental
// History 10%. Criminal Background Check and Identity Verification both
// show "Weight Eligible: No" in their drawers (gate/pass-fail checks, not
// scored) — kept at 0 and excluded from the sum-to-100 pool by
// `weightEligible === false` (see activeWeightageSum in
// UNAdminScreeningConfiguration.jsx), same convention as before.
// NOTE: the 4 weighted criteria's wireframe defaults sum to 65%, not 100 —
// that's what every drawer actually shows, not a rounding gap introduced
// here. The "Active Criteria Weightage Total" banner will show amber until
// a UN Admin rebalances them, which is the correct, honest default state
// for sample data rather than this screen inventing numbers to force 100.
export const CRITERIA_WEIGHTAGE_DEFAULTS = {
  income_qualification: 20,
  credit_criteria: 20,
  employment_verification: 15,
  rental_history: 10,
  criminal_background: 0,
  identity_verification: 0,
};

// Section 02 — Co-Applicant & Household Screening. Session 65 split this
// into two separate sections per request (Co-Applicant / Household); see
// the Figma review doc for exactly which original 10 rows landed in which
// group and why.
export const HOUSEHOLD_PIPELINE_STAGES = [
  { id: 1, title: 'Intake Stage', desc: 'Primary tenant invites co-applicants' },
  { id: 2, title: 'Info Collection', desc: 'Individual forms & FCRA consent' },
  { id: 3, title: 'Verification', desc: 'ID, credit, and income validation' },
  { id: 4, title: 'Combined Eval', desc: 'Household ratio aggregate calculation' },
  { id: 5, title: 'Determination', desc: 'Unified proposal to Property Manager' },
];

// Section 02a — Co-Applicant Screening. `enforcement` (MANDATORY/CUSTOMISE,
// reusing the same ENFORCEMENT_OPTIONS dropdown Session 63 already built
// for the Completeness Rules table — "Custom" per the request, spelled
// consistently with that existing control) and `pmOverride` (Yes/No) are
// both new, real, editable fields per request. `coapp_screening`'s
// `locked: true` was REMOVED — it is now the gate every other row in this
// section (and every row in the new Household section) depends on, so it
// has to be independently toggleable for that gating to mean anything;
// flagged in the Figma review doc as a necessary consequence of the
// gating request, not an independent change.
export const DEFAULT_COAPPLICANT_ROWS = [
  { id: 'coapp_screening', parameter: 'Co-Applicant Screening', rule: 'All occupants age 18+ must undergo identity verification and complete application disclosures', enforcementLabel: 'Mandatory System Rule', enforcement: 'MANDATORY', pmOverride: false },
  { id: 'individual_identity', parameter: 'Individual Identity Verification', rule: 'Each co-applicant verified independently via government ID and liveness check', enforcementLabel: 'Individual Pass Required', enforcement: 'MANDATORY', pmOverride: false },
  { id: 'individual_credit', parameter: 'Individual Credit Verification', rule: 'Individual credit report pulled per consent; scoring evaluated against household policy thresholds', enforcementLabel: 'Consent-Gated', enforcement: 'MANDATORY', pmOverride: false },
  { id: 'individual_income', parameter: 'Individual Income Verification', rule: 'Optional per co-applicant unless claiming contributing income toward household ratio', enforcementLabel: 'Conditional on Contribution', enforcement: 'CUSTOMISE', pmOverride: false },
  { id: 'missing_coapp_info', parameter: 'Missing Co-Applicant Information', rule: 'Application held in incomplete state; automated reminder cadence before expiration', enforcementLabel: 'Auto-Hold Protocol', enforcement: 'MANDATORY', pmOverride: false, numericField: { id: 'missing_coapp_days', label: 'Reminder cadence', value: 5, suffix: 'business days' } },
  { id: 'coapp_withdrawal', parameter: 'Co-Applicant Withdrawal', rule: 'Triggers re-evaluation of income ratio and qualification metrics for remaining household members', enforcementLabel: 'Dynamic Recalculation', enforcement: 'MANDATORY', pmOverride: false, locked: true },
  { id: 'coapp_replacement', parameter: 'Co-Applicant Replacement', rule: 'Permitted prior to final PM decision without forfeiting application submission queue order', enforcementLabel: 'Queue Preservation', enforcement: 'CUSTOMISE', pmOverride: false },
];

// Section 02b — Household Screening. Kept the original Enforcement/Status
// column shape (not asked to change) — only the gating against Co-Applicant
// Screening's own Active state is new (see HouseholdTable). 2026-11-12:
// added `pmOverride` (Yes/No) to every row per request, same field name
// and default (false) as the Co-Applicant table's own PM Override column —
// locked rows still show a LockBadge there instead, same convention.
export const DEFAULT_HOUSEHOLD_ROWS = [
  { id: 'combined_income', parameter: 'Combined Household Income', rule: 'All verified contributing adult incomes aggregated toward meeting the rent-to-income benchmark', enforcementLabel: 'Aggregate Model', status: 'ENFORCED', locked: true, pmOverride: false },
  { id: 'rental_history_household', parameter: 'Rental History Evaluation', rule: 'Evaluated collectively; positive tenancy history from any primary adult satisfies reference baseline', enforcementLabel: 'Household Credit', status: 'ENFORCED', pmOverride: false },
  { id: 'household_occupancy', parameter: 'Household Evaluation', rule: 'Unit occupancy cap enforced per local code (HUD Keating Memo standard — a real federal guidance document; the specific per-bedroom number is editable config, not a hardcoded citation)', enforcementLabel: 'Occupancy Code Standard', status: 'ENFORCED', locked: true, pmOverride: false, numericField: { id: 'occupancy_per_bedroom', label: 'Persons per bedroom (max)', value: 2, suffix: 'persons' } },
];

// Section 03 — AI & Automated Decision Guardrails
export const DEFAULT_AI_GUARDRAIL_ROWS = [
  { id: 'doc_extraction', capability: 'Document Extraction', classification: 'Extraction', directive: 'OCR and structured parsing of paystubs, IDs, and tax returns', status: 'PERMITTED', enabled: true },
  { id: 'info_validation', capability: 'Information Validation', classification: 'Validation', directive: 'Cross-reference payroll dates, employer EINs, and MRZ checksums', status: 'PERMITTED', enabled: true },
  { id: 'app_summary', capability: 'Application Summary', classification: 'Synthesis', directive: 'Objective factual briefing of verified items generated for reviewer', status: 'PERMITTED', enabled: true },
  { id: 'missing_info_detect', capability: 'Missing Information Detection', classification: 'Completeness', directive: 'Automatic flagging of unattached schedules or unreadable images', status: 'PERMITTED', enabled: true },
  { id: 'evidence_recs', capability: 'Evidence Based Recommendations', classification: 'Assistance', directive: 'Decision recommendation strictly linked to objective criteria benchmarks', status: 'PERMITTED', enabled: true },
  { id: 'auto_approval', capability: 'Automated Approval', classification: 'Decisioning', directive: 'AI issuing binding approval without designated PM role review', status: 'PROHIBITED', locked: true },
  { id: 'auto_rejection', capability: 'Automated Rejection', classification: 'Decisioning', directive: 'Autonomous adverse action without human assessment and review', status: 'PROHIBITED', locked: true },
  { id: 'protected_char', capability: 'Protected Characteristic Usage', classification: 'Feature Vector', directive: 'Using race, national origin, religion, gender, disability, familial status', status: 'PROHIBITED', locked: true },
  { id: 'proxy_inference', capability: 'Proxy-Based Inference', classification: 'Feature Vector', directive: 'Inferring demographic determinations from surnames, zip codes, or schools', status: 'PROHIBITED', locked: true },
  { id: 'human_authority', capability: 'Human Decision Authority', classification: 'Oversight', directive: 'All final binding determinations require designated PM credentials', status: 'MANDATORY', locked: true },
  { id: 'ai_logging', capability: 'AI Activity Logging', classification: 'Auditing', directive: 'Immutable append-only ledger of every inference, model version & prompt', status: 'MANDATORY', locked: true },
];

// This entire object is fabricated demo data — a named applicant, a named
// internal AI model, and a confidence score, none of which exist. Rendered
// with the heaviest sample treatment on this screen (SampleOverlayBanner),
// per the Figma review §8.2/§9 — this is the single highest-risk visual
// element reviewed on this screen, riskier than any Tab 1 vendor badge.
export const AI_LIVE_EVAL_SAMPLE = {
  applicantName: 'Alex Mercer',
  applicationRef: '#OV-14B-8834',
  propertyLabel: 'Grandview Apts #402',
  incomeLine: '3.1x Rent (Passed)',
  creditLine: '682 (Auto-Tier-1)',
  historyLine: '36 mos (Verified)',
  recommendation: 'Approve with Standard Deposit',
  explainability: 'Candidate meets income multiple (3.1x > 2.8x threshold) via automated Plaid payroll connection and exceeds minimum credit baseline with clean 3-year prior landlord VOR.',
  modelName: 'UN-SynthEval v3.8',
  confidence: '99.4%',
};

// Section 04 — Application Decision Workflow
export const APPLICATION_LIFECYCLE_STAGES = [
  { id: 1, title: 'Submitted', desc: 'Payload validated' },
  { id: 2, title: 'Completeness', desc: 'Signatures & IDs checked' },
  { id: 3, title: 'Verification', desc: 'Payroll & Bureau pulled' },
  { id: 4, title: 'Policy Eval', desc: 'Rules matrix calculated' },
  { id: 5, title: 'PM Review', desc: 'Human review required' },
  { id: 6, title: 'Decision', desc: 'Final action determined' },
  { id: 7, title: 'Offer Issued', desc: 'Lease drafted / Adverse sent' },
];

// Session 66 — (1) new PM Override Yes/No column added to every row
// (`pmOverride`, locked rows still show the lock badge instead, same
// convention as the Co-Applicant table's own PM Override column);
// (2) `status` free-text strings removed from every non-locked row — the
// table now always shows a computed Active/Not Active pill driven by the
// row's own `active` toggle for any unlocked row (matching the
// Co-Applicant/Household tables' own convention), rather than a fixed
// label that didn't track the toggle; (3) `definition` text shortened on
// every row to reduce wrapped line count / row height, read as the
// intended meaning of "reduce the row length" (not a narrower column or a
// smaller font — flagged in the project doc as a judgment call);
// (4) Second-Level Approval and Decision Change Authorization unlocked
// (`locked: true` removed) so they render as real Active/Not Active
// toggles instead of a fixed "ENFORCED" lock badge, per request — the
// other 3 locked rows (PM Review, Decision Comments, Authorized Roles)
// were not named and stay locked/ENFORCED.
export const DEFAULT_DECISION_WORKFLOW_ROWS = [
  { id: 'pm_review_required', control: 'PM Review Before Final Decision', definition: 'A PM or Admin must review the final package before the outcome is issued.', outcomes: 'All Screening Outcomes', status: 'ENFORCED', locked: true, pmOverride: false },
  { id: 'approval', control: 'Approval', definition: 'Applicant meets all criteria with no caveats or an elevated deposit.', outcomes: 'Standard Lease Offer', pmOverride: false },
  { id: 'conditional_approval', control: 'Conditional Approval', definition: 'Approved subject to an elevated deposit, guarantor, or pre-paid rent within statutory limits.', outcomes: 'Guarantor / Extra Deposit', pmOverride: false },
  { id: 'decline', control: 'Decline', definition: 'Adverse action triggers an FCRA notice with denial reasons and a dispute window.', outcomes: 'FCRA Adverse Notice', sample: true, pmOverride: false, numericField: { id: 'dispute_window_days', label: 'Dispute window', value: 14, suffix: 'days (statutory)' } },
  { id: 'waitlist', control: 'Waitlist', definition: "Qualified applicant queued while the unit's prior lease execution is pending.", outcomes: 'Priority Queue Retention', pmOverride: false },
  { id: 'additional_info_request', control: 'Additional Information Request', definition: 'Pauses the evaluation clock and asks the applicant for clarifying documentation.', outcomes: '72-Hour Response Timer', pmOverride: false, numericField: { id: 'info_request_hours', label: 'Response window', value: 72, suffix: 'hours' } },
  { id: 'decision_comments', control: 'Decision Comments', definition: 'Documented justification required for any conditional approval or PM override.', outcomes: 'Immutable Audit Trail', status: 'ENFORCED', locked: true, pmOverride: false },
  { id: 'authorized_roles', control: 'Authorized Decision Roles', definition: 'Restricted to verified PM, Regional Compliance Director, or UN Platform SuperAdmin.', outcomes: 'Role-Based Access Control', status: 'ENFORCED', locked: true, pmOverride: false },
  { id: 'second_level_approval', control: 'Second-Level Approval', definition: 'Escalates to the Regional Compliance Director whenever a manual override occurs.', outcomes: 'Dual-Signoff Protocol', pmOverride: false },
  { id: 'decision_change_auth', control: 'Decision Change Authorization', definition: 'Permitted only after FCRA dispute resolution or a Fair Housing accommodation review.', outcomes: 'Audit Log Lock', pmOverride: false },
];

export const LIFECYCLE_STATUS_GLOSSARY = [
  { term: 'Draft / In-Progress', def: 'Applicant initiated; pending completed forms, document uploads, or electronic signatures.' },
  { term: 'Verification Pending', def: 'Data dispatches sent to bureaus, open banking APIs, and prior landlord VOR verification queues.', sample: true },
  { term: 'Adverse Dispute Hold', def: '14-day statutory stay during which applicant may dispute reported inaccuracies before final decision.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 — "Compliance & Audit" (reviewed + built 2026-11-12, "Session 61",
// same day as Tab 2). See the Figma review §11 for the evaluation this
// implements. Much lower-risk than Tabs 1–2: no named vendors anywhere,
// no fabricated applicant or AI output — the one real/sample line to draw
// is the Audit Trail table's "Enabled" status and "View Audit History"
// link, which claim a working audit-log pipeline that doesn't exist. The
// Compliance Safeguards and Data Retention sections are governance policy
// STANCES ("we obtain authorization," "protected characteristics are
// prevented") — real and lockable independent of any engine, same
// treatment as Tab 2 Section 03's regulatory-floor rows.
// ─────────────────────────────────────────────────────────────────────────────

// Session 66 — Actions column converted from a fixed `locked: true` flag
// to a real Active/Not Active toggle, where "Active" now implies
// "Locked" (the component derives the lock badge from `active` directly
// — see ComplianceSafeguardsTable). `active: true` is the starting value
// for all 3 rows so the table's default appearance is unchanged (still
// shows as locked/enforced) until an admin actually switches one off.
export const DEFAULT_COMPLIANCE_SAFEGUARD_ROWS = [
  { id: 'applicant_authorization', rule: 'Applicant Authorization', description: 'Obtain and record applicant authorization before initiating consumer-report screening where required.', statusLabel: 'Mandatory / Enabled', source: 'Platform Default', active: true },
  { id: 'adverse_action_process', rule: 'Adverse Action Process', description: 'Support the required adverse-action notification process when a consumer report contributes to an adverse decision.', statusLabel: 'Mandatory / Enabled', source: 'Platform Default', active: true },
  { id: 'fair_housing_safeguards', rule: 'Fair Housing Safeguards', description: 'Prevent the use of protected characteristics and prohibited discriminatory criteria in application screening and decision-making.', statusLabel: 'Mandatory / Enabled', source: 'Platform Default', active: true },
];

// `recordsTags` describe the real, specified shape of a future audit log —
// genuinely useful documentation of what SHOULD be captured. The table's
// "Enabled" status and the "View Audit History" link are what's sample: no
// audit-log pipeline exists anywhere in this codebase yet for tenant
// screening (there is no model, no endpoint, nothing written on save
// beyond this screen's own localStorage blob).
export const AUDIT_TRAIL_ROWS = [
  { id: 'screening_activity', activity: 'Screening Activity', recordsTags: ['Screening date and time', 'Screening provider', 'Screening policy version', 'Screening outcome'] },
  { id: 'application_decision', activity: 'Application Decision', recordsTags: ['System recommendation', "Manager's final decision", 'Decision date and time', 'Override reason (if applicable)'] },
  { id: 'configuration_changes', activity: 'Configuration Changes', recordsTags: ['Previous and updated configuration values', 'User who made the change', 'Date and time of change'] },
];

export const DATA_RETENTION_INFO = {
  retentionPolicy: 'UrbanNest Platform Default',
  applicableMarket: 'United States',
  policyStatus: 'Active',
  management: 'Managed by UrbanNest',
};

// Counts the real policy-inheritance stats shown in the Multi-Tier Policy
// Inheritance banner — computed from the actual config data, not hardcoded,
// so editing a field's locked/pmMin/pmMax state keeps these numbers honest.
export function computePolicyStats(categories) {
  let locked = 0;
  let pmOverrideBounds = 0;

  const scanField = (f) => {
    if (f.locked) locked += 1;
    else if (f.pmMin != null && f.pmMax != null) pmOverrideBounds += 1;
  };

  // Session 73 — scans by ARRAY PRESENCE rather than strict `cat.kind ===`
  // matching. income_financial/credit_risk/rental_history_eviction all
  // switched `kind` to 'scenarioOutcomes' this session but deliberately
  // kept their original `fields`/`bands` arrays (see those categories' own
  // comments) — this keeps the Inheritance Banner's locked/PM-override
  // counts accurate for those arrays regardless of which kind currently
  // controls what Tab 1 renders for that category.
  categories.forEach((cat) => {
    if (cat.fields) (cat.fields || []).forEach(scanField);
    if (cat.rows) (cat.rows || []).forEach(scanField);
    if (cat.cards) (cat.cards || []).forEach((card) => (card.fields || []).forEach(scanField));
    if (cat.bands) {
      // Credit bands don't carry PM bounds in this pass (every PM shares one
      // bureau-driven scoring policy) — only count the extra toggle field.
      if (cat.extraToggle?.locked) locked += 1;
    }
  });

  return { mandatorySafeguardsLocked: locked, permittedPMOverrideBounds: pmOverrideBounds };
}

// 18th sitting — state lists for the "+ Add Location"/"+ Add City" modals'
// State dropdown (UNAdminScreeningConfiguration.jsx and, next,
// PMScreeningConfiguration.jsx's own "My Cities" modal — both screens
// import from here rather than each keeping a separate copy, since this is
// exactly the kind of shared reference data neither screen owns a more
// authoritative source for). Same {code, name} shape and same data already
// used by PMVerificationSettings.jsx's own local US_STATES/IN_STATES —
// copied rather than imported cross-feature, matching this codebase's own
// convention of each screen/feature owning what it needs rather than
// reaching into another feature's file.
export const US_STATES = [
  {code:'AL',name:'Alabama'},{code:'AK',name:'Alaska'},{code:'AZ',name:'Arizona'},
  {code:'AR',name:'Arkansas'},{code:'CA',name:'California'},{code:'CO',name:'Colorado'},
  {code:'CT',name:'Connecticut'},{code:'DE',name:'Delaware'},{code:'FL',name:'Florida'},
  {code:'GA',name:'Georgia'},{code:'HI',name:'Hawaii'},{code:'ID',name:'Idaho'},
  {code:'IL',name:'Illinois'},{code:'IN',name:'Indiana'},{code:'IA',name:'Iowa'},
  {code:'KS',name:'Kansas'},{code:'KY',name:'Kentucky'},{code:'LA',name:'Louisiana'},
  {code:'ME',name:'Maine'},{code:'MD',name:'Maryland'},{code:'MA',name:'Massachusetts'},
  {code:'MI',name:'Michigan'},{code:'MN',name:'Minnesota'},{code:'MS',name:'Mississippi'},
  {code:'MO',name:'Missouri'},{code:'MT',name:'Montana'},{code:'NE',name:'Nebraska'},
  {code:'NV',name:'Nevada'},{code:'NH',name:'New Hampshire'},{code:'NJ',name:'New Jersey'},
  {code:'NM',name:'New Mexico'},{code:'NY',name:'New York'},{code:'NC',name:'North Carolina'},
  {code:'ND',name:'North Dakota'},{code:'OH',name:'Ohio'},{code:'OK',name:'Oklahoma'},
  {code:'OR',name:'Oregon'},{code:'PA',name:'Pennsylvania'},{code:'RI',name:'Rhode Island'},
  {code:'SC',name:'South Carolina'},{code:'SD',name:'South Dakota'},{code:'TN',name:'Tennessee'},
  {code:'TX',name:'Texas'},{code:'UT',name:'Utah'},{code:'VT',name:'Vermont'},
  {code:'VA',name:'Virginia'},{code:'WA',name:'Washington'},{code:'WV',name:'West Virginia'},
  {code:'WI',name:'Wisconsin'},{code:'WY',name:'Wyoming'},
];

export const IN_STATES = [
  {code:'AP',name:'Andhra Pradesh'},{code:'AR',name:'Arunachal Pradesh'},{code:'AS',name:'Assam'},
  {code:'BR',name:'Bihar'},{code:'CG',name:'Chhattisgarh'},{code:'GA',name:'Goa'},
  {code:'GJ',name:'Gujarat'},{code:'HR',name:'Haryana'},{code:'HP',name:'Himachal Pradesh'},
  {code:'JH',name:'Jharkhand'},{code:'KA',name:'Karnataka'},{code:'KL',name:'Kerala'},
  {code:'MP',name:'Madhya Pradesh'},{code:'MH',name:'Maharashtra'},{code:'MN',name:'Manipur'},
  {code:'ML',name:'Meghalaya'},{code:'MZ',name:'Mizoram'},{code:'NL',name:'Nagaland'},
  {code:'OD',name:'Odisha'},{code:'PB',name:'Punjab'},{code:'RJ',name:'Rajasthan'},
  {code:'SK',name:'Sikkim'},{code:'TN',name:'Tamil Nadu'},{code:'TG',name:'Telangana'},
  {code:'TR',name:'Tripura'},{code:'UP',name:'Uttar Pradesh'},{code:'UK',name:'Uttarakhand'},
  {code:'WB',name:'West Bengal'},{code:'DL',name:'Delhi'},{code:'PY',name:'Puducherry'},
];

// Accepts either 'IN' or 'India' — this screen's own JURISDICTION_OPTIONS
// uses the full name 'India' as its value (not the 2-letter code), while
// 'IN' is kept accepted too in case a future caller uses the ISO code.
export function statesForCountry(countryValue) {
  return (countryValue === 'IN' || countryValue === 'India') ? IN_STATES : US_STATES;
}
