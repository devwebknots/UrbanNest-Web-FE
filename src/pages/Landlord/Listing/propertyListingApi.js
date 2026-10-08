// src/pages/Landlord/Listing/propertyListingApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Real backend calls for the Multi-Unit ("List Multi Units") wizard (Session 44
// wiring — LST-10). Mirrors listingApi.js's shape exactly (same apiFetch/auth
// pattern, copied rather than imported since listingApi.js doesn't export its
// internals) — see UrbanNest_Listing_Architecture.md §8.6/§8.10 for the real
// endpoint shapes this was built and smoke-tested against.
//
// These all live under a NEW top-level prefix, /api/property-listings/ — a
// second urlconf for the same `listings` Django app, separate from
// /api/listings/ (see §8.6's routing note). The one exception is
// createUnitListing() below, which posts to the existing /api/listings/
// endpoint with an added `property_listing` field to attach a unit under a
// group — that's the "touched" endpoint from §8.6, not a new prefix route.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

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
  if (body.errors && typeof body.errors === 'object') {
    return Object.values(body.errors).join(' ');
  }
  const firstKey = Object.keys(body)[0];
  if (firstKey) {
    const val = body[firstKey];
    return Array.isArray(val) ? val[0] : String(val);
  }
  return null;
}

const get   = (path)       => apiFetch(path);
const post  = (path, data) => apiFetch(path, { method: 'POST',  body: JSON.stringify(data) });
const patch = (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) });
const del   = (path)       => apiFetch(path, { method: 'DELETE' });

// ─── PropertyListing (create/update/detail rollup) ────────────────────────────
// Smoke-tested Session 44: create → DRAFT defaults correct; GET → full nested
// rollup (amenities/neighborhood/media/channel_selections/lead_settings/
// promotion_purchases/unit_listings) renders exactly as PropertyListingDetailSerializer.

export const createPropertyListing = (data) => post('/property-listings/', data);
export const getPropertyListing = (propertyListingId) => get(`/property-listings/${propertyListingId}/`);
export const patchPropertyListing = (propertyListingId, data) => patch(`/property-listings/${propertyListingId}/`, data);

// GET /api/property-listings/ — every group this landlord owns, across all
// their properties (the backend queryset isn't property-scoped — see
// listings/views.py's _user_property_listing_qs). Callers filter client-side
// by `property` (Session 44 continuation — used by ListMultiStep1_Property.jsx
// to find an existing DRAFT group for the current property before creating a
// new one, see that file's own comment for why this was needed).
export const listPropertyListings = () => get('/property-listings/');

// ─── Group-shared amenities (bulk-replace, same convention as saveListingAmenities) ──
// POST body: { amenity_ids, category?, sync_to_property? } — NOT a single
// {amenity: id} object. No sync_to_unit here — a group has no single unit
// (confirmed against the real view; see §8.6).

export const getPropertyListingAmenities = (propertyListingId, category) =>
  get(`/property-listings/${propertyListingId}/amenities/${category ? `?category=${category}` : ''}`);

export const savePropertyListingAmenities = (propertyListingId, { category, amenityIds, syncToProperty }) =>
  post(`/property-listings/${propertyListingId}/amenities/`, {
    category,
    amenity_ids: amenityIds,
    sync_to_property: !!syncToProperty,
  });

// ─── Neighborhood ──────────────────────────────────────────────────────────────

export const getPropertyListingNeighborhood = (propertyListingId) => get(`/property-listings/${propertyListingId}/neighborhood/`);
export const patchPropertyListingNeighborhood = (propertyListingId, data) => patch(`/property-listings/${propertyListingId}/neighborhood/`, data);

// ─── Group-shared media (bulk-replace) ──────────────────────────────────────────
// POST body: { gallery_item_ids, cover_id } — replaces the full PHOTO set.
// The FE is responsible for only offering photos from units actually in the
// group (server does not cross-check gallery ownership against membership).

export const getPropertyListingMedia = (propertyListingId) => get(`/property-listings/${propertyListingId}/media/`);
export const savePropertyListingMedia = (propertyListingId, { galleryItemIds, coverId }) =>
  post(`/property-listings/${propertyListingId}/media/`, { gallery_item_ids: galleryItemIds, cover_id: coverId ?? null });

// ─── Distribution channels (bulk-replace) + promotion plan catalog ─────────────

export const getPropertyListingChannels = (propertyListingId) => get(`/property-listings/${propertyListingId}/channels/`);
export const savePropertyListingChannels = (propertyListingId, channelIds) =>
  post(`/property-listings/${propertyListingId}/channels/`, { channel_ids: channelIds });

export const getPropertyListingPromotionPlans = (propertyListingId) => get(`/property-listings/${propertyListingId}/promotion-plans/`);

// ─── Lead settings ──────────────────────────────────────────────────────────────

export const getPropertyListingLeadSettings = (propertyListingId) => get(`/property-listings/${propertyListingId}/lead-settings/`);
export const patchPropertyListingLeadSettings = (propertyListingId, data) => patch(`/property-listings/${propertyListingId}/lead-settings/`, data);

// ─── Publish (group) ─────────────────────────────────────────────────────────────
// Aggregates compliance across every unit Listing in the group; on success
// flips PropertyListing.status AND every member Listing.status to ACTIVE.
//
// AU-2 (Session 49): the backend's property_listing_publish already accepts
// EITHER plan_id (a fresh purchase) OR subscription_id (reuse an owned
// ListingPromotionSubscription — "Already Paid") — same contract as
// listingApi.js's publishListing. `opts.subscriptionId`, when given, wins.

export const publishPropertyListing = (propertyListingId, planId, opts = {}) =>
  post(`/property-listings/${propertyListingId}/publish/`, opts.subscriptionId
    ? { subscription_id: opts.subscriptionId }
    : { plan_id: planId });

// ─── Touched: attach a unit's Listing under a group ─────────────────────────────
// POST /api/listings/ with an added `property_listing` field (§8.2/§8.6
// retrofit). Server validates the unit's property matches
// property_listing.property and both belong to the requesting landlord.
// Treated as set-once-at-creation, same as `unit`/`listing_type` — never
// PATCHed to move a Listing between groups.

export const createUnitListing = (data) => post('/listings/', data);

// ─── Remove a unit from a still-DRAFT group (Session 45 continuation) ──────────
// DELETE /api/listings/<listingId>/ — listings/views.py's
// ListingRetrieveUpdateView.perform_destroy guards this to DRAFT + grouped
// listings only; it flips the unit's has_active_listing back to false and
// recomputes its readiness snapshot server-side. Used by both the Unit
// Matrix trash icon and, at Publish time, for any unit that's still
// unchecked when the landlord hits Publish (see ListMultiUnits.jsx /
// ListMultiStep4_Publish.jsx for the two call sites).
export const deleteUnitListing = (listingId) => del(`/listings/${listingId}/`);
