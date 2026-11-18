// src/pages/PMPortal/Config/pmScreeningConfigApi.js
//
// 18th sitting — FE wiring for the PM-facing Tenant Screening Configuration
// API, mounted at /api/pm/screening-config/ (see
// rules_engine/tenant_screening/pm_urls.py + pm_views.py + urbannest/urls.py).
// Used by PMScreeningConfiguration.jsx in place of its old loadUNAdminConfig()/
// loadPMOverrides()/handleSaveDraft()/handleAddCity()/handleRemoveCity()
// localStorage calls — see that file's own header for the override-bucket
// shape this carries over unchanged ({fields, rows, bands, criteria, coapp,
// household, decisionWorkflow}).
//
// Same apiFetch/extractErrorMessage/get/put/post/del shape as every other
// feature API module in this codebase (e.g. screeningConfigApi.js,
// promotionEngineApi.js) — copied rather than imported, matching the
// existing convention of each feature owning its own API module.

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const BASE = '/pm/screening-config';

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
  // here — same fallback screeningConfigApi.js/promotionEngineApi.js use.
  const firstKey = Object.keys(body)[0];
  if (firstKey) {
    const val = body[firstKey];
    if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }
  return null;
}

const get = (path) => apiFetch(path);
const post = (path, data) => apiFetch(path, { method: 'POST', body: JSON.stringify(data) });
const put = (path, data) => apiFetch(path, { method: 'PUT', body: JSON.stringify(data) });
const del = (path) => apiFetch(path, { method: 'DELETE' });

// loc = {country, state, city} | null (null/omitted = Default — matches
// activePMLocation === null's existing meaning on this screen).
function locationQuery(loc) {
  if (!loc) return '';
  const params = new URLSearchParams({ country: loc.country, state: loc.state, city: loc.city });
  return `?${params.toString()}`;
}

// Read-only snapshot of UN Admin's effective policy for `loc` — resolves
// server-side against UN Admin's own record for that exact city first,
// falling back to UN Admin's Default (pm_views.py's _resolve_un_admin_record)
// — mirrors loadUNAdminConfig(pmLocation)'s old two-level fallback exactly,
// just computed by the backend instead of read out of a parsed localStorage
// blob. Response carries `resolved_from_location` (bool) alongside the
// normal {id, country, state, city, data, is_submitted, saved_at, ...}
// shape. 404 only when UN Admin has saved NOTHING at all yet (not even
// Default) — callers should catch err.status === 404 and fall back to
// shipped mock defaults, same as before.
export function apiGetUNAdminConfig(loc) {
  return get(`${BASE}/un-admin/${locationQuery(loc)}`);
}

// [{country, state, city}, ...] — every location UN Admin has specifically
// configured (excluding Default). Used to populate the "+ Add City"
// modal's City dropdown so a PM picks from cities UN Admin has actually
// set up, instead of typing an arbitrary name.
export function apiListUNAdminLocations() {
  return get(`${BASE}/un-admin/locations/`);
}

// This PM account's own override diff for `loc`. 404 on a location this
// account has never saved an override for is expected — treat as an empty
// bucket, same as loadPMOverrides()'s old "nothing in localStorage" path.
export function apiGetPMOverride(loc) {
  return get(`${BASE}/override/${locationQuery(loc)}`);
}

// data = the override bucket ({fields, rows, bands, criteria, coapp,
// household, decisionWorkflow}). `un_admin_snapshot_at` is derived
// server-side — never sent from here.
export function apiSavePMOverride(loc, data) {
  return put(`${BASE}/override/${locationQuery(loc)}`, { data });
}

// "Discard" for one location — removes this account's override row for
// `loc` outright (reverts that location to reading straight through to UN
// Admin's values, same as it would for a never-customized location).
export function apiDeletePMOverride(loc) {
  return del(`${BASE}/override/${locationQuery(loc)}`);
}

// [{id, country, state, city, added_at}, ...] — this PM account's "My
// Cities" list.
export function apiListMyCities() {
  return get(`${BASE}/cities/`);
}

export function apiAddMyCity({ country, state, city }) {
  return post(`${BASE}/cities/`, { country, state, city });
}

// Also deletes this account's override row for the same location,
// server-side (PMCitiesView.delete) — mirrors handleRemoveCity's own
// confirm-dialog copy ("Any customizations you made for this city will be
// deleted") in one call instead of two.
export function apiRemoveMyCity({ country, state, city }) {
  return del(`${BASE}/cities/${locationQuery({ country, state, city })}`);
}
