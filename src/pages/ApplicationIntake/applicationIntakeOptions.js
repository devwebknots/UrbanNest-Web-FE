// src/pages/ApplicationIntake/applicationIntakeOptions.js
//
// Small, real (non-sample) reference lists + helpers used across the
// Application Intake stages. These are FE-only convenience lists (same
// category as Marketplace's RENT_RANGE_OPTIONS/LOCATION_OPTIONS — sort/
// display-order data, not UN Admin-managed reference data), not sample
// institutional content, so they live outside sampleInstitutionalContent.js.

// ─── Currency ───────────────────────────────────────────────────────────────
// UrbanNest's listing/rent figures are USD-only everywhere today except the
// Promotion Engine's own Market-based pricing (US / India — see
// PromotionEngine_Backend_Design_Review.md §3, Tab 2 "Currency (multi-
// select: USD, INR)"), and `Property.country`/city is the real field this
// product already derives GEO codes from elsewhere (PromotionEngine_
// SampleData_Walkthrough.md's listing_number/campaign_number scheme). So the
// currency a renter sees on an application should follow the PROPERTY's
// country (what the rent is actually denominated in), not the renter's own
// profile — there is no country field on the renter's own account today.
// Defaults to USD ($) whenever the listing's address doesn't carry a
// country code yet (true for every listing today — no detail payload seen
// so far actually returns one).
export function currencySymbol(countryCode) {
  const code = String(countryCode || '').trim().toUpperCase();
  if (code === 'IN' || code === 'IND' || code === 'INDIA') return '₹';
  return '$';
}

// ─── Tenantship (rental-history "how did you hold this residence") ────────
// Not a field either `ApplicantRentalHistory` (approach doc) or any real
// backend model carries today — this is a new, small, real (not sample)
// classification the user asked for so the form can skip Landlord Name/
// Landlord Contact when it doesn't apply (an owner-occupant has no
// landlord). Stored as a plain string on the rental-history entry; once a
// real backend model exists for rental history this maps onto a new
// `tenantship_type` field there, not a schema change to anything else.
export const TENANTSHIP_OPTIONS = [
  { value: '', label: 'Select…' },
  { value: 'RENT', label: 'Rented (had a landlord)' },
  { value: 'OWN_HOUSE', label: 'Owned the home' },
  { value: 'CO_TENANT', label: 'Co-Tenant / Roommate (on someone else’s lease)' },
  { value: 'LIVING_WITH_FAMILY', label: 'Living with Family (no lease)' },
  { value: 'OTHER', label: 'Other' },
];

export function tenantshipNeedsLandlordFields(tenantshipType) {
  // Owning the home means the applicant IS effectively the "landlord" —
  // Landlord Name/Contact don't apply and are hidden rather than asked.
  return tenantshipType !== 'OWN_HOUSE';
}

// ─── Additional income sources ──────────────────────────────────────────────
// Was a single free-text field; the user asked for a source dropdown +
// amount instead so this is actually analyzable, not a loose string.
export const ADDITIONAL_INCOME_SOURCES = [
  { value: '', label: 'Select source…' },
  { value: 'RENTAL_INCOME', label: 'Rental Income' },
  { value: 'INVESTMENT_DIVIDENDS', label: 'Investment / Dividend Income' },
  { value: 'ALIMONY_CHILD_SUPPORT', label: 'Alimony / Child Support' },
  { value: 'SOCIAL_SECURITY_PENSION', label: 'Social Security / Pension' },
  { value: 'ESTATE_TRUST_PROCEEDS', label: 'Estate or Trust Proceeds' },
  { value: 'FREELANCE_SIDE_INCOME', label: 'Freelance / Side Income' },
  { value: 'OTHER', label: 'Other' },
];

export function additionalIncomeSourceLabel(value) {
  return ADDITIONAL_INCOME_SOURCES.find((o) => o.value === value)?.label || value || 'Other';
}
