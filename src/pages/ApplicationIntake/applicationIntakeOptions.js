// src/pages/ApplicationIntake/applicationIntakeOptions.js
//
// Display helpers used across the Application Intake stages.
//
// Session 55 — the option lists that used to live here (tenantship /
// residence type, additional income sources and frequencies) are gone: every
// dropdown now comes from the UN Dropdown table and every status label from
// the UN Reference tables, via useIntakeReferences.js. Only formatting
// helpers remain.

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

// ─── Employment duration (derived, not typed) ──────────────────────────────
// Per request: Employment Duration is no longer its own free-text field —
// it's always calculated from the real Employment Start/End Date fields, so
// it can never disagree with them. Returns null when there's no start date
// to calculate from yet.
export function employmentDurationLabel(startDate, endDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const end = endDate ? new Date(endDate) : new Date();
  if (Number.isNaN(end.getTime())) return null;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (remMonths > 0 || years === 0) parts.push(`${remMonths} month${remMonths === 1 ? '' : 's'}`);
  return parts.join(' ');
}
