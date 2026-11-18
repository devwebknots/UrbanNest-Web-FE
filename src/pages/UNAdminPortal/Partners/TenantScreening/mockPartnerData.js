/**
 * mockPartnerData.js — UN Admin → Partners → Tenant Screening.
 * ─────────────────────────────────────────────────────────────────────────────
 * No Partner/Provider model exists in the backend yet (confirmed via a
 * read-only audit of Core Backend, 2026-11-15). This file is the FE-first
 * stand-in (ARCH_001) — every record here is Sample Data, held in React
 * state only (PartnerList.jsx), never persisted to a real endpoint.
 *
 * CRITERIA_OPTIONS mirrors the 6 criteria already shown on
 * Configurations/Screening/mockTenantScreeningConfig.js's own catalogue —
 * same names/keys, not re-invented here, so a partner's "Supported
 * Screening Criteria" picker lines up with the real Tenant Screening
 * Configuration screen's own criterion list once the two are wired
 * together on the backend.
 */

export const CRITERIA_OPTIONS = [
  { value: 'credit_check',          label: 'Credit Check' },
  { value: 'income_verification',   label: 'Income Verification' },
  { value: 'employment_verification', label: 'Employment Verification' },
  { value: 'rental_history',        label: 'Rental History' },
  { value: 'criminal_background',   label: 'Criminal Background Check' },
  { value: 'identity_verification', label: 'Identity Verification' },
];

export function criterionLabel(value) {
  return CRITERIA_OPTIONS.find(c => c.value === value)?.label || value;
}

export const MARKET_OPTIONS = ['United States', 'India'];
export const INTEGRATION_TYPES = ['API', 'Webhook', 'Manual'];

export function blankPartner() {
  return {
    id: null,
    name: '',
    key: '',
    description: '',
    markets: [],
    criteria: [],
    integrationType: 'API',
    environment: 'Sandbox',
    status: 'Active',
    configHealth: 'Not yet configured',
    webhookSupport: false,
    retryConfig: '3 retries · exponential backoff',
    lastSync: null,
  };
}

export const INITIAL_PARTNERS = [
  {
    id: 'p1',
    name: 'CreditLink Verify',
    key: 'creditlink_verify',
    description: 'Credit bureau aggregator — pulls a consumer credit report and score for a named applicant.',
    markets: ['United States'],
    criteria: ['credit_check'],
    integrationType: 'API',
    environment: 'Production',
    status: 'Active',
    configHealth: 'Healthy',
    webhookSupport: true,
    retryConfig: '3 retries · exponential backoff',
    lastSync: '18 minutes ago',
  },
  {
    id: 'p2',
    name: 'IncomeCheck Pro',
    key: 'incomecheck_pro',
    description: 'Payroll-linked income and employment verification.',
    markets: ['United States', 'India'],
    criteria: ['income_verification', 'employment_verification'],
    integrationType: 'API',
    environment: 'Production',
    status: 'Active',
    configHealth: 'Healthy',
    webhookSupport: true,
    retryConfig: '3 retries · exponential backoff',
    lastSync: '41 minutes ago',
  },
  {
    id: 'p3',
    name: 'GuardianScreen',
    key: 'guardianscreen',
    description: 'Criminal background and registry checks.',
    markets: ['United States'],
    criteria: ['criminal_background', 'identity_verification'],
    integrationType: 'Webhook',
    environment: 'Sandbox',
    status: 'Active',
    configHealth: 'Needs attention',
    webhookSupport: true,
    retryConfig: '5 retries · fixed 30s interval',
    lastSync: '2 hours ago',
  },
  {
    id: 'p4',
    name: 'RentHistory Registry',
    key: 'renthistory_registry',
    description: 'Rental history and unresolved-debt lookup.',
    markets: ['United States'],
    criteria: ['rental_history'],
    integrationType: 'API',
    environment: 'Production',
    status: 'Inactive',
    configHealth: 'Not currently selectable',
    webhookSupport: false,
    retryConfig: '3 retries · exponential backoff',
    lastSync: null,
  },
];
