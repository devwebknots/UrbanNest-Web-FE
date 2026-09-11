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

// Mirrors the backend's own MIN_REQUIRED_PHOTOS (listings/views.py) — a
// TEMP stand-in there too, for a real UN Admin-configured
// ListingValidationConfig.min_photos that doesn't exist yet. Kept as a
// separate FE constant purely so Step 4's checklist can render without a
// network round trip just to know the threshold; the actual gate is
// enforced server-side at publish time regardless of what this says.
export const MIN_REQUIRED_PHOTOS = 4;
