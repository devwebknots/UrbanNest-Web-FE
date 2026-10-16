// src/pages/UNAdminPortal/Configurations/RuleEngine/marketplaceDisplayApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 (Session 50, continued) — real backend calls for the Marketplace
// Display Rules Engine's config catalog, mounted at
// /api/admin/marketplace-display-rules/ (see
// rules_engine/marketplace_display/admin_urls.py + urbannest/urls.py).
//
// Same apiFetch/extractErrorMessage/get/patch shape as promotionEngineApi.js
// (Session 48) — copied rather than imported, matching this codebase's own
// convention of each feature owning its API module rather than sharing
// internals across features.
//
// Replaces MarketDisplayRules.jsx's old mockMarketDisplayRules.js reads
// (MOCK_MARKET_DISPLAY_RULES/MOCK_CHANGE_LOG) now that
// MarketplaceDisplayRuleDefinition + its Admin API actually exist.
// mockMarketDisplayRules.js itself is kept, but trimmed down to RULE_GROUPS +
// UI_BY_CODE — FE-only layout metadata with no backend equivalent (see that
// file's own header).
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const BASE = '/admin/marketplace-display-rules';

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
  // DRF field-validation dicts (e.g. { parameters: "must sum to ..." }) land
  // here — same fallback promotionEngineApi.js uses.
  const firstKey = Object.keys(body)[0];
  if (firstKey) {
    const val = body[firstKey];
    if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return val;
  }
  return null;
}

const get   = (path)       => apiFetch(path);
const patch = (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) });

function qs(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

// ─── Rules ──────────────────────────────────────────────────────────────────
export const apiListMarketplaceDisplayRules = (params) => get(`${BASE}/${qs(params)}`); // { group }
export const apiUpdateMarketplaceDisplayRule = (id, data) => patch(`${BASE}/${id}/`, data); // { enabled?, parameters?, rationale? }

// ─── Change Log ─────────────────────────────────────────────────────────────
export const apiListMarketplaceDisplayChangeLog = () => get(`${BASE}/change-log/`);
