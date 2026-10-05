// src/pages/Landlord/Listing/listingApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Real backend calls for the Create Listing wizard (Session 42 wiring).
//
// The `listings` Django app (built + curl-tested Session 42 — see
// UrbanNest_Listing_Architecture.md §9) is now wired to the FE for real.
// This module is the single place that knows the real endpoint shapes, so
// every wizard step imports from here instead of talking to `fetch`
// directly — same reasoning as landlordTokens.js centralizing style tokens.
//
// Follows the exact fetch/auth pattern already used everywhere else in this
// app (see AuthContext.jsx, LandlordUnitDetailPage.jsx): API_BASE from
// REACT_APP_API_BASE_URL, Bearer token from localStorage 'access_token'.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Every call funnels through here so error handling is consistent: on a
// non-2xx response, throw an Error whose message is the best human-readable
// string DRF gave us (a top-level `detail`, a per-field error, or a plain
// `errors` map from the publish endpoint) rather than a bare status code.
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  let body = null;
  try { body = await res.json(); } catch { /* empty body (e.g. 204) is fine */ }

  if (!res.ok) {
    const message = extractErrorMessage(body) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

function extractErrorMessage(body) {
  if (!body) return null;
  if (typeof body === 'string') return body;
  if (body.detail) return body.detail;
  if (body.error) return body.error;
  // The publish endpoint returns { errors: { photos: '...', terms: '...' } }
  if (body.errors && typeof body.errors === 'object') {
    return Object.values(body.errors).join(' ');
  }
  // A plain DRF field-error map: { field: ['msg', ...] }
  const firstKey = Object.keys(body)[0];
  if (firstKey) {
    const val = body[firstKey];
    return Array.isArray(val) ? val[0] : String(val);
  }
  return null;
}

const get    = (path)          => apiFetch(path);
const post   = (path, data)    => apiFetch(path, { method: 'POST',  body: JSON.stringify(data) });
const patch  = (path, data)    => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) });

// ─── Property / Unit (read-only source data — properties app) ────────────────

export const getProperty = (propId) => get(`/properties/${propId}/`);
export const patchProperty = (propId, data) => patch(`/properties/${propId}/`, data);
export const getUnit = (propId, unitId) => get(`/properties/${propId}/units/${unitId}/`);
export const patchUnit = (propId, unitId, data) => patch(`/properties/${propId}/units/${unitId}/`, data);

// Full unit list under a property (UnitListSerializer — id/unit_number/beds/
// baths/etc., no listing info). Added Session 44 for the Multi-Unit wizard's
// "Add Units" picker (which units on this property aren't in the group yet).
export const getPropertyUnits = (propId) => get(`/properties/${propId}/units/`);

// Per-unit Listing Readiness (A6 — Engine 1, rules_engine.listing_readiness).
// GET /properties/<pk>/units/<uid>/readiness/ → { overall_result:
// 'LIST_READY'|'READY_WITH_WARNINGS'|'NOT_READY'|'NOT_ELIGIBLE',
// computed_at, rules: [{ code, name, severity, passed, detail_reason }] }.
// Added for the Unit Selection screen (LandlordUnitSelection.jsx) — the
// real "List Ready" gate ahead of the Individual/Multi-Unit wizards
// (backlog LST-8).
export const getUnitReadiness = (propId, unitId) => get(`/properties/${propId}/units/${unitId}/readiness/`);

// Full amenity master catalog, optionally filtered by category (PROPERTY|UNIT|BOTH)
export const getAmenityCatalog = (category) =>
  get(`/properties/amenities/${category ? `?category=${category}` : ''}`);

// ─── Listing (create/update/detail) ───────────────────────────────────────────

export const createListing = (data) => post('/listings/', data);
export const getListing = (listingId) => get(`/listings/${listingId}/`);
export const patchListing = (listingId, data) => patch(`/listings/${listingId}/`, data);

// ─── Listing amenities (listing-scoped snapshot, §7) ──────────────────────────

export const getListingAmenities = (listingId, category) =>
  get(`/listings/${listingId}/amenities/${category ? `?category=${category}` : ''}`);

export const saveListingAmenities = (listingId, { category, amenityIds, syncToProperty, syncToUnit }) =>
  post(`/listings/${listingId}/amenities/`, {
    category,
    amenity_ids: amenityIds,
    sync_to_property: !!syncToProperty,
    sync_to_unit: !!syncToUnit,
  });

// ─── Neighborhood (Step 1) ─────────────────────────────────────────────────────

export const getListingNeighborhood = (listingId) => get(`/listings/${listingId}/neighborhood/`);
export const patchListingNeighborhood = (listingId, data) => patch(`/listings/${listingId}/neighborhood/`, data);

// ─── Dropdown options (Step 2) ─────────────────────────────────────────────────
// Backed by the admin-configurable UNDropdown table (screen=LISTING_STEP2_UNIT),
// not a hardcoded FE list — see core/migrations/0027_seed_listing_dropdowns.py.
// dropdownType is one of LEASE_TERM_MONTHS | PARKING_FEE_TYPE | OTHER_FEE_TYPE.
export const getListingDropdownOptions = (dropdownType) =>
  get(`/listings/dropdowns/?type=${encodeURIComponent(dropdownType)}`);

// ─── Rental / Sale terms (Step 2) ─────────────────────────────────────────────

export const getRentalTerms = (listingId) => get(`/listings/${listingId}/rental-terms/`);
export const patchRentalTerms = (listingId, data) => patch(`/listings/${listingId}/rental-terms/`, data);

export const getSaleTerms = (listingId) => get(`/listings/${listingId}/sale-terms/`);
export const patchSaleTerms = (listingId, data) => patch(`/listings/${listingId}/sale-terms/`, data);

// ─── Media (Step 2) ─────────────────────────────────────────────────────────────

export const getListingMedia = (listingId) => get(`/listings/${listingId}/media/`);
export const saveListingMedia = (listingId, { galleryItemIds, coverId }) =>
  post(`/listings/${listingId}/media/`, { gallery_item_ids: galleryItemIds, cover_id: coverId ?? null });

// ─── Distribution channels & promotion plans (Step 3) ─────────────────────────

export const getChannelCatalog = () => get('/listings/channels/');
export const getListingChannels = (listingId) => get(`/listings/${listingId}/channels/`);
export const saveListingChannels = (listingId, channelIds) =>
  post(`/listings/${listingId}/channels/`, { channel_ids: channelIds });

// Session 48: now eligibility-filtered server-side by persona (from the
// caller's active_persona) and, when `listingId` is passed, by that
// listing's market too — see listings/views.py's ListingPromotionPlanListView.
// `listingId` is optional so any other (non-wizard) caller keeps working.
export const getPromotionPlanCatalog = (listingId) =>
  get(`/listings/promotion-plans/${listingId ? `?listing=${listingId}` : ''}`);

// ─── Listing Promotion Subscription — standing entitlement (Phase 4, Session 49) ──
// My Services' "Already Paid" flow: a one-time account-level pre-purchase
// (purchasePromotionSubscription) that can later be reused on a real
// listing's publish step instead of a fresh plan_id — see listing_publish's
// own docstring on the backend for the subscription_id contract.
export const getPromotionSubscriptions = () => get('/listings/promotion-subscriptions/');

export const getPromotionSubscriptionCatalog = (country) =>
  get(`/listings/promotion-subscriptions/catalog/${country ? `?country=${encodeURIComponent(country)}` : ''}`);

export const purchasePromotionSubscription = (country, planId) =>
  post('/listings/promotion-subscriptions/purchase/', { country, plan_id: planId });

// ─── Lead settings (Step 3) ─────────────────────────────────────────────────────

export const getLeadSettings = (listingId) => get(`/listings/${listingId}/lead-settings/`);
export const patchLeadSettings = (listingId, data) => patch(`/listings/${listingId}/lead-settings/`, data);

// ─── Publish (Step 4) ───────────────────────────────────────────────────────────
// Phase 4 (Session 49): the backend now accepts EITHER plan_id (a fresh,
// full-price purchase) OR subscription_id (reuse an already-owned standing
// entitlement — "Already Paid"). `opts.subscriptionId`, when given, wins —
// the backend itself only ever expects one or the other, never both.
export const publishListing = (listingId, planId, opts = {}) =>
  post(`/listings/${listingId}/publish/`, opts.subscriptionId
    ? { subscription_id: opts.subscriptionId }
    : { plan_id: planId });

// ─── PM Portal — Listings Overview dashboard rollup (LST-19, Session 48) ──────
// GET /listings/pm-overview/ → { properties: [{id, name, totalUnits}],
// units: [{id, unit, propertyId, bedBath, sqft, rent, readiness, status,
// channel, publishedDate, availableDate, notReadyReason}], drafts: [{id,
// propertyId, type, unitLabel, step, stepLabel, lastEdited}] } — shaped to
// match PMListingsOverview.jsx's own MOCK_PROPERTIES/MOCK_UNITS/
// DRAFT_LISTINGS exactly, so that file's existing derivation logic (stat
// tiles, Portfolio Coverage, Ready to List, Opportunities, Active Listings,
// Not Ready, Draft Listings) runs unchanged against real data. See that
// endpoint's own docstring in the backend (listings/views.py) for the full
// design writeup and known gaps (LST-22's draft-step heuristic, etc.).
export const getPMListingsOverview = () => get('/listings/pm-overview/');
