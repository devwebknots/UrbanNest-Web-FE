// src/pages/UNAdminPortal/Configurations/Screening/screeningConfigApi.js
//
// 18th sitting — FE wiring for UN Admin's Tenant Screening Configuration
// API, mounted at /api/admin/screening-config/ (see
// rules_engine/tenant_screening/admin_urls.py + urbannest/urls.py). Used by
// UNAdminScreeningConfiguration.jsx in place of its old loadStored()/
// handleSaveDraft()/etc localStorage calls — see that file's own header for
// the record shape this carries over unchanged (one JSON `data` blob per
// Country/State/City location, `is_submitted`/`saved_at` as their own
// columns).
//
// Same apiFetch/extractErrorMessage/get/put/del shape as every other
// feature API module in this codebase (e.g. promotionEngineApi.js) — copied
// rather than imported, matching the existing convention of each feature
// owning its own API module.

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const BASE = '/admin/screening-config';

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

const get = (path) => apiFetch(path);
const put = (path, data) => apiFetch(path, { method: 'PUT', body: JSON.stringify(data) });
const del = (path) => apiFetch(path, { method: 'DELETE' });

// loc = {country, state, city} | null (null/omitted = the platform Default
// record — matches activeLocation === null's existing meaning on this
// screen).
function locationQuery(loc) {
  if (!loc) return '';
  const params = new URLSearchParams({ country: loc.country, state: loc.state, city: loc.city });
  return `?${params.toString()}`;
}

// 404 on a location that's never been saved is expected (parallels the old
// loadStored() returning null) — callers should catch err.status === 404
// and fall back to shipped mock defaults, exactly as before. Response:
// { id, country, state, city, data, is_submitted, saved_at, created_at, updated_at }.
export function apiGetScreeningConfig(loc) {
  return get(`${BASE}/${locationQuery(loc)}`);
}

// opts: { data?, isSubmitted? } — either may be omitted to leave that side
// untouched server-side (admin_views.py's PUT only updates what's actually
// sent); used by handleEdit to flip isSubmitted alone, without touching the
// saved `data` blob or bumping `saved_at`.
export function apiSaveScreeningConfig(loc, { data, isSubmitted } = {}) {
  const body = {};
  if (data !== undefined) body.data = data;
  if (isSubmitted !== undefined) body.is_submitted = isSubmitted;
  return put(`${BASE}/${locationQuery(loc)}`, body);
}

export function apiDeleteScreeningConfigLocation(loc) {
  return del(`${BASE}/${locationQuery(loc)}`);
}

// [{country, state, city}, ...] — every saved location excluding Default.
export function apiListScreeningConfigLocations() {
  return get(`${BASE}/locations/`);
}
