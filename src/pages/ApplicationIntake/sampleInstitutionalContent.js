// src/pages/ApplicationIntake/sampleInstitutionalContent.js
//
// ─────────────────────────────────────────────────────────────────────────────
// EVERYTHING IN THIS FILE IS SAMPLE / DISPLAY-ONLY CONTENT. NONE OF IT IS
// WIRED TO A REAL BACKEND, VENDOR, SCORE, SIGNATURE, OR CHARGE.
//
// Per the user's explicit decision (Claude Project doc application-intake/
// UrbanNest_ApplicationIntake_Figma_ApproachDoc_Review.md, §6): the Figma's
// institutional branding, credit/background-screening panels, payroll
// verification badges, underwriting ledger, e-signature capture box, fee/
// waiver ledger, and concierge card are kept in the frontend purely as
// visual presentation — not because UrbanNest has (or is about to build)
// Experian/TransUnion/LexisNexis integration, Argyle/Plaid payroll
// verification, an ESIGN/UETA-compliant signature subsystem, or a renter
// payment gateway. None of that exists. See that doc's §3.3–3.5 for the
// full reasoning.
//
// HARD RULE (same doc, §4): nothing here may be presented, in the shipped
// product, as a real legal or financial action — no real signature, no
// real credit decision, no real charge. Every component built from this
// file must carry the same "Sample Data" watermark this codebase already
// uses elsewhere (PMListingsOverview.jsx's SampleTag/SampleCard — same
// amber flask-pill convention, same hex values, imported from
// applicationIntakeTokens.js rather than re-invented).
//
// The real, functional data (names, addresses, rental history, employment,
// documents actually uploaded, consent checkboxes actually ticked,
// household/applicant/invitation status) lives in applicationIntakeApi.js
// and ApplicationIntakeContext.jsx — never in this file.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { C, F } from './applicationIntakeTokens';

// ─── Sample Data badge (reused convention, see header above) ───────────────

export function SampleTag({ style, label = 'Sample Display Only' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: C.sampleTagBg, border: `1px solid ${C.sampleTagBdr}`,
      fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.sampleTag,
      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
      ...style,
    }}>
      <i className="ti ti-flask" style={{ fontSize: 10 }} />
      {label}
    </span>
  );
}

export function SampleCard({ children, style, tagLabel }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>
        <SampleTag label={tagLabel} />
      </div>
      {children}
    </div>
  );
}

// ─── Institutional brand framing (sample — the real brand is UrbanNest) ────
// The Figma branded this surface "UrbanNest Institutional Management Inc."
// This is kept as sample display copy only, clearly marked, never as the
// actual footer/legal entity (that stays "UrbanNest" throughout, matching
// every other page in this app).

export const SAMPLE_BRAND_LINE = 'Institutional Underwriting Mode';
export const SAMPLE_SECURITY_BADGES = ['256-Bit SSL Encrypted', 'SOC2 Type II (Sample)'];

// ─── Payroll / income verification (sample) ────────────────────────────────

export const SAMPLE_PAYROLL = {
  provider: 'Argyle / Plaid',
  statusLabel: 'Payroll API Fast-Track (Sample)',
  description: 'In a live integration, employment records and recent paystubs would be verified automatically via a payroll data provider. No such integration exists today — this applicant\'s income is reviewed manually from the documents they upload in Stage 3.',
};

// ─── Credit / background screening ─────────────────────────────────────────
// [occupant-count/employment-dates/pets-vehicles request] — the sample
// "Background & Credit Screening" panel this used to feed
// (Stage4_ReviewConsentSubmit.jsx) was removed entirely per explicit
// request, so the SAMPLE_SCREENING export that only fed that panel was
// removed too. Real screening (where applicable) is still performed
// manually by the landlord/PM via the real BACKGROUND_SCREENING_AUTH
// consent record — unaffected by this removal.

// ─── Underwriting ledger (sample — rent-to-income, guarantor coverage) ─────

export function sampleUnderwritingLedger({ monthlyRent, primaryMonthlyIncome }) {
  const rent = Number(monthlyRent) || 0;
  const income = Number(primaryMonthlyIncome) || 0;
  const ratio = income > 0 ? Math.round((rent / income) * 1000) / 10 : null;
  return {
    rentToIncomeLabel: ratio !== null ? `${ratio}% Coverage (Sample calculation)` : 'Not enough data entered yet',
    maxCapLabel: '33% Max Cap (Sample policy threshold — illustrative only)',
    description: 'This ratio is computed locally from the figures entered on this device for display purposes only. It is not a real underwriting decision, is not stored against the application, and does not affect application status.',
  };
}

// ─── E-signature capture (sample — not legally binding) ────────────────────

export const SAMPLE_ESIGN = {
  complianceLabel: 'ESIGN Act & UETA Compliant (Sample presentation)',
  description: 'This capture box visually matches a real e-signature product. It does not create a cryptographically bound, legally valid signature, is not an ESIGN/UETA-compliant signing event, and records nothing beyond the plain consent checkboxes above it. A typed name here is sample-only.',
};

// ─── Application fee / waiver ledger (sample — no real charge) ────────────

export const SAMPLE_FEE_LEDGER = {
  lineItems: [
    { label: 'Institutional Underwriting & Screening (Sample)', amount: 150 },
    { label: 'Corporate Partner Subsidy (Sample)', amount: -150 },
  ],
  netDueLabel: '$0.00 — No real charge is made',
  description: 'UrbanNest has no renter-facing payment gateway today. Nothing here is billed; this ledger is sample display content only.',
};

// NOTE: the old "Intake Concierge" sample card (Claire Sinclair) that used
// to live here was removed (Session 56) — the sidebar/submitted-page slot
// it occupied now shows the listing's real Listing Agent/contact instead
// (ApplicationIntakeShell.jsx's `ListingAgentCard`, fed from
// `listingSummary.listingAgent` — the same `leadContact` data Marketplace's
// own ListingContactCard already renders). No sample replacement needed.

// ─── Property-operations inventory ─────────────────────────────────────────
// [occupant-count/employment-dates/pets-vehicles request] — Pets and
// Vehicles on Stage 3 (Stage3_PropertyDocuments.jsx) are no longer
// illustrative placeholders; they're real, functional repeatable lists
// (no backend model yet, same documented gap as Dependents — see
// ApplicationIntakeContext.jsx's addPet()/addVehicle()), so the
// SAMPLE_PROPERTY_LOGISTICS export that used to badge them as sample
// content was removed. Storage Allocation (which this also used to
// describe) was removed from the application entirely per that same
// request.
