// src/pages/Landlord/Listing/mockListingData.js
//
// The Create Listing wizard was wired to the real `listings` backend in
// Session 43 (see listingApi.js) — property, unit, amenities, terms,
// channels, promotion plans, and lead settings all come from real API
// calls now. What's left here are the handful of values that are still
// genuinely fixed UI configuration rather than backend data.

// Fixed UI chrome for the neighborhood map widget (Step 1) — not UN
// Admin-managed reference data, so this is fine to keep hardcoded.
export const MAP_PILLS = ['Highlights', 'Restaurants', 'Groceries', 'Nightlife', 'Cafes', 'Shopping', 'Arts & Entertainment'];

// Mirrors the backend's own MIN_REQUIRED_PHOTOS
// (rules_engine/listing_readiness/evaluators.py) — a TEMP stand-in there
// too, for a real UN Admin-configured ListingValidationConfig.min_photos
// that doesn't exist yet. Kept as a separate FE constant purely so Step 4's
// checklist can render without a network round trip just to know the
// threshold; the actual gate is enforced server-side at publish time
// regardless of what this says.
// Session 47: temporarily set to 0 (was 4) so Publish can be tested
// end-to-end before real photo upload (LST-3) is built. Revert to 4 once
// LST-3 ships — see claude/UrbanNest_ActiveBacklog.md.
// Session 48 (continued): all four Multi-Unit wizard files (ListMultiUnits
// .jsx/ListMultiStep4_Publish.jsx and their PM Portal mirrors
// PMListMultiStep2_Unit.jsx/PMListMultiStep4_Publish.jsx) used to have
// their own separate, still-hardcoded `MIN_REQUIRED_PHOTOS = 4` local
// constant — this change did NOT originally touch them, which is exactly
// what left Multi-Unit Step 4's Compliance & Validation blocking every
// listing on "needs at least 4 photos" after this export had already gone
// to 0 everywhere else. All four now import this same export instead of
// redeclaring their own — revert THIS one constant to 4 once LST-3 ships
// and every wizard picks it up together.
export const MIN_REQUIRED_PHOTOS = 0;
