// src/pages/Marketplace/Home/marketplaceHomeApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 (Session 50, continued) — real calls to the new public, unauth'd
// Marketplace homepage read endpoint (rules_engine.marketplace_display's
// ranking engine, mounted at /api/marketplace/ — see
// rules_engine/marketplace_display/public_urls.py + urbannest/urls.py).
//
// No apiFetch/auth-header boilerplate here, unlike every other *Api.js file
// in this codebase — this endpoint is deliberately public (AllowAny, no
// Authorization header sent or expected), so the usual auth-header
// convention doesn't apply. Same `get`-only shape otherwise.
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
  const res = await fetch(`${API_BASE}/marketplace/display/${section}/${qs(params)}`);
  if (!res.ok) {
    throw new Error(`Marketplace display fetch failed (${res.status})`);
  }
  return res.json();
}
