// src/pages/Marketplace/Home/marketplaceHomeApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 (Session 50, continued) — real calls to the new public, unauth'd
// Marketplace homepage read endpoint (rules_engine.marketplace_display's
// ranking engine, mounted at /api/marketplace/ — see
// rules_engine/marketplace_display/public_urls.py + urbannest/urls.py).
//
// No apiFetch/auth-header boilerplate here, unlike every other *Api.js file
// in this codebase — this endpoint is deliberately public (AllowAny), so
// the usual auth-header convention doesn't fully apply. Same `get`-only
// shape otherwise.
//
// Session 51, Phase 3 — one exception to "no auth header": a token is now
// attached WHEN ONE EXISTS, so a logged-in Renter's Favorites/Saved Search
// signal can feed compute_R's preference-match blend on the backend (see
// ranking.py + public_views.py's own Phase 3 notes). This doesn't make the
// endpoint require auth — an anonymous caller still sends no header at all
// and gets exactly the same pure-geo_proximity response as before.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

function qs(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

// section: 'exclusive' | 'rentals_near_you'. params: { visible_count, lat, lng }.
// Returns { section, requested_count, real_count, results: [...] } or throws.
export async function apiGetMarketplaceDisplay(section, params) {
  const token = localStorage.getItem('access_token');
  const fetchOptions = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  const res = await fetch(`${API_BASE}/marketplace/display/${section}/${qs(params)}`, fetchOptions);
  if (!res.ok) {
    throw new Error(`Marketplace display fetch failed (${res.status})`);
  }
  return res.json();
}

// Session 51, Phase 4 — the Search modal's results endpoint (rules_engine.
// marketplace_display.public_views.MarketplaceSearchView). Same AllowAny +
// "send a token when one exists" posture as apiGetMarketplaceDisplay above
// — a visitor never has to be logged in to search, but a logged-in
// Renter's Favorites/Saved Search signal still feeds the ranking engine's
// R blend. params: { listingMode, location, propertyType, bedrooms,
// priceRange, bathsMin, sqftMin, sqftMax, amenities (comma-joined string),
// tourMethod (comma-joined string), timeOnUrbanNest, page, pageSize, lat,
// lng }. Returns { count, page, pageSize, results: [...] } or throws.
export async function apiSearchMarketplace(params) {
  const token = localStorage.getItem('access_token');
  const fetchOptions = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  const res = await fetch(`${API_BASE}/marketplace/search/${qs(params)}`, fetchOptions);
  if (!res.ok) {
    throw new Error(`Marketplace search fetch failed (${res.status})`);
  }
  return res.json();
}

// Session 51, Phase 7 — the Individual Unit Listing detail page's data
// source (rules_engine.marketplace_display.public_views.
// MarketplaceListingDetailView). Same AllowAny + "send a token when one
// exists" posture as the two calls above. `id` is the bare numeric Listing
// pk — callers strip the 'real-' card-id prefix before calling this (see
// MarketplaceHomePage.jsx's handleCardClick and ListingDetailPage.jsx's own
// route param parsing). Throws on a 404 (not ACTIVE / not on the
// Marketplace channel / expired) exactly like the other two calls throw on
// any non-ok response — the page's own fetch effect is what turns that into
// a "not found" UI state.
export async function apiGetListingDetail(id) {
  const token = localStorage.getItem('access_token');
  const fetchOptions = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  const res = await fetch(`${API_BASE}/marketplace/listing/${id}/`, fetchOptions);
  if (!res.ok) {
    throw new Error(`Marketplace listing detail fetch failed (${res.status})`);
  }
  return res.json();
}

// Session 51, Phase 7 — the Multi-Unit / Property-Level Listing detail
// page's data source (MarketplacePropertyListingDetailView). Same shape/
// posture as apiGetListingDetail above; `id` is the bare numeric
// PropertyListing pk (strip the 'realgroup-' card-id prefix first).
export async function apiGetPropertyListingDetail(id) {
  const token = localStorage.getItem('access_token');
  const fetchOptions = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  const res = await fetch(`${API_BASE}/marketplace/property-listing/${id}/`, fetchOptions);
  if (!res.ok) {
    throw new Error(`Marketplace property-listing detail fetch failed (${res.status})`);
  }
  return res.json();
}
