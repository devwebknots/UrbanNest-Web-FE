// src/pages/Marketplace/Account/marketplaceAccountApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 3 — FE wiring for the public Marketplace's authenticated
// Renter account endpoints (Favorites + Saved Search), mounted at
// /api/marketplace/account/ (see marketplace_account/urls.py +
// urbannest/urls.py). Deliberately a separate prefix from the AllowAny
// /api/marketplace/display/ path used by marketplaceHomeApi.js — these
// endpoints require a logged-in user (DRF's project-wide default
// IsAuthenticated; marketplace_account/views.py sets no explicit
// permission_classes, same convention).
//
// Same apiFetch/extractErrorMessage/get/post/patch/del shape as
// promotionEngineApi.js — copied rather than imported, matching this
// codebase's own convention of each feature owning its API module rather
// than sharing internals across features.
//
// Every call here assumes the caller already checked `user` from
// useAuth() and routed a logged-out visitor to /login first (see
// MarketplaceHomePage.jsx's toggleFavorite/handleSaveSearch) — a 401 in
// practice means a token expired mid-session, not that the gate was
// skipped.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const BASE = '/marketplace/account';

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
  // DRF field-validation dicts (e.g. { non_field_errors: [...] }) land
  // here — same fallback promotionEngineApi.js uses.
  const firstKey = Object.keys(body)[0];
  if (firstKey) {
    const val = body[firstKey];
    if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }
  return null;
}

const get   = (path)       => apiFetch(path);
const post  = (path, data) => apiFetch(path, { method: 'POST',  body: JSON.stringify(data) });
const patch = (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) });
const del   = (path)       => apiFetch(path, { method: 'DELETE' });

// ─── Favorites ──────────────────────────────────────────────────────────────
// Each row: { id, unit, property, assetLabel, currentListing, created_at }
// (see marketplace_account/serializers.py). Exactly one of unit/property is
// non-null per row.

export function apiListFavorites() {
  return get(`${BASE}/favorites/`);
}

// Idempotent server-side (get_or_create) — safe to call on every heart
// click without pre-checking local state first; the response status
// (200 vs 201) tells created vs already-existed, but callers don't need to
// care which. Pass exactly one of { unit } or { property }.
export function apiAddFavorite({ unit, property } = {}) {
  return post(`${BASE}/favorites/`, { unit, property });
}

export function apiRemoveFavorite(id) {
  return del(`${BASE}/favorites/${id}/`);
}

// ─── Saved Searches ─────────────────────────────────────────────────────────
// Each row: { id, name, criteria, created_at, last_notified_at }.

export function apiListSavedSearches() {
  return get(`${BASE}/saved-searches/`);
}

export function apiCreateSavedSearch({ name = '', criteria = {} } = {}) {
  return post(`${BASE}/saved-searches/`, { name, criteria });
}

export function apiUpdateSavedSearch(id, data) {
  return patch(`${BASE}/saved-searches/${id}/`, data);
}

export function apiDeleteSavedSearch(id) {
  return del(`${BASE}/saved-searches/${id}/`);
}
