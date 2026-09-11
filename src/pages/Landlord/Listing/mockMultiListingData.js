// src/pages/Landlord/Listing/mockMultiListingData.js
//
// ─────────────────────────────────────────────────────────────────────────────
// SUPERSEDED — Session 44 (LST-10).
//
// This file used to hold the Multi-Unit Listing wizard's mock data
// (COMMON_LISTING_DETAILS, MOCK_UNITS, COMMON_RENTAL_TERMS, the
// LEASE_TERM_OPTIONS / PARKING_FEE_TYPE_OPTIONS / OTHER_FEE_TYPE_OPTIONS /
// FLOOR_PLAN_OPTIONS dropdown lists, and a unitReadiness() helper) while the
// 4-step wizard (ListMultiStep1_Property.jsx, ListMultiUnits.jsx,
// ListMultiStep3_Promote.jsx, ListMultiStep4_Publish.jsx) was FE-first /
// mock-wired (Session 42/43).
//
// All four of those files are now wired to the real `/api/property-listings/`
// backend (propertyListingApi.js) and no longer import anything from here:
//   - COMMON_LISTING_DETAILS / MOCK_UNITS / COMMON_RENTAL_TERMS →
//     replaced by real PropertyListing / Listing / RentalTerms / SaleTerms
//     rows fetched per-unit.
//   - LEASE_TERM_OPTIONS / PARKING_FEE_TYPE_OPTIONS / OTHER_FEE_TYPE_OPTIONS →
//     replaced by getListingDropdownOptions() (real, admin-configurable
//     UNDropdown catalog — already used by the Individual wizard's Step 2).
//   - FLOOR_PLAN_OPTIONS → replaced by a free-text field bound to the real
//     Unit.floor_plan_name, matching the Individual wizard.
//   - unitReadiness() → reimplemented locally in ListMultiUnits.jsx and
//     ListMultiStep4_Publish.jsx against real per-unit photo/deposit data
//     (MIN_REQUIRED_PHOTOS = 4 in both places).
//
// Left in place (rather than deleted) in case anything outside the wizard
// still imports it — nothing did as of this pass (see UrbanNest_ActiveBacklog.md,
// LST-10). Safe to delete once confirmed unused for a full session.
// ─────────────────────────────────────────────────────────────────────────────

export {};
