/**
 * mockPromotionData.js — Sample/mock data for the Promotion Engine screens.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48. Stub for now — this file is scaffolded empty at Step 0 (nav /
 * route / shell) and gets filled in as each tab is built, per the agreed
 * build order:
 *   1. Product Catalog  → MOCK_PROMOTION_PLANS, MOCK_PROMOTION_CHANNELS
 *   2. Campaigns        → MOCK_CAMPAIGNS
 *   3. Analytics & Audit→ MOCK_ANALYTICS_SUMMARY, MOCK_AUDIT_LOG
 *   4. Overview         → rollup, reuses the datasets above (no new mock
 *                          data of its own, per the agreed order — Overview
 *                          is a summary view over the other three tabs)
 *
 * Reasoning for sample data (per the user's Session 48 decision): the real
 * models this feature will eventually read from —
 * listings.ListingPromotionPlan / ListingPromotionPurchase / ListingChannel —
 * exist in the backend (see listings/UrbanNest_Listing_Architecture.md §3),
 * but there is no real Campaign concept, no payment/transaction ledger, and
 * no analytics/engagement pipeline (impressions/views/clicks) anywhere in
 * the codebase yet (LST-20). Rather than block the FE build on backend work
 * that hasn't been scoped, every screen here renders off this file's mock
 * data, watermarked with the same <SampleTag>/<SampleCard> convention used
 * in PMListingsOverview.jsx (see promotionTokens.js), and any action that
 * would need a real endpoint is a disabled <DeadEndButton> with a tooltip
 * explaining why — not a fake success state.
 *
 * Product Catalog is the one exception: `GET /api/listings/promotion-plans/`
 * and `GET /api/listings/channels/` are real, already-built endpoints (see
 * promotionApi.js), so that tab fetches real data on mount. The two arrays
 * below are used only as a fallback if that fetch fails (backend not
 * running, network error, etc.) — rendered watermarked Sample Data, same as
 * every other fallback in this app, rather than an empty/broken screen.
 * Shaped to match seed_listings.py's real seed set (3 plans, 3 channels) so
 * the fallback looks like what a freshly-seeded real catalog would show.
 */

// Fallback only — used when GET /api/listings/promotion-plans/ fails.
// Mirrors seed_listings.py's real seed shape (Basic/Featured/Premium).
export const MOCK_PROMOTION_PLANS = [
  {
    id: 'sample-1', name: 'Basic', short_description: 'Standard marketplace listing, no extra visibility.',
    tag: '', price: '0.00', duration_days: 30,
    features: ['Listed on UrbanNest Marketplace', 'Standard search placement'],
    fine_print: 'Renews manually — does not auto-renew.',
    is_default: true, is_active: true, sort_order: 1,
  },
  {
    id: 'sample-2', name: 'Featured', short_description: 'Boosted placement in search + category pages.',
    tag: 'Most Popular', price: '19.00', duration_days: 30,
    features: ['Everything in Basic', 'Featured badge', 'Higher search placement', 'Priority in category pages'],
    fine_print: 'Renews manually — does not auto-renew.',
    is_default: false, is_active: true, sort_order: 2,
  },
  {
    id: 'sample-3', name: 'Premium', short_description: 'Maximum visibility across the marketplace.',
    tag: 'Best Value', price: '39.00', duration_days: 60,
    features: ['Everything in Featured', 'Homepage rotation', 'Top-of-search placement', '60-day duration'],
    fine_print: 'Renews manually — does not auto-renew.',
    is_default: false, is_active: true, sort_order: 3,
  },
];

// Fallback only — used when GET /api/listings/channels/ fails.
// Mirrors seed_listings.py's real seed shape (3 channels).
export const MOCK_PROMOTION_CHANNELS = [
  { id: 'sample-1', name: 'UrbanNest Marketplace', is_available: true,  coming_soon_note: '', sort_order: 1 },
  { id: 'sample-2', name: 'Zillow',                 is_available: false, coming_soon_note: 'Integration coming soon.', sort_order: 2 },
  { id: 'sample-3', name: 'Apartments.com',         is_available: false, coming_soon_note: 'Integration coming soon.', sort_order: 3 },
];

// Placeholder — populated in the Campaigns build step.
export const MOCK_CAMPAIGNS = [];

// Placeholder — populated in the Analytics & Audit build step.
export const MOCK_ANALYTICS_SUMMARY = null;

// Placeholder — populated in the Analytics & Audit build step.
export const MOCK_AUDIT_LOG = [];
