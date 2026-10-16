// src/pages/UNAdminPortal/Advertise/PromotionEngine/promotionEngineApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 48 — Phase 6 (FE wiring). Real backend calls for the Promotion
// Engine's Phase 4 API surface, mounted at /api/admin/promotion-engine/ (see
// promotion_engine/urls.py + urbannest/urls.py). Every endpoint here is
// UN-Admin-gated server-side (promotion_engine/views.py's is_un_admin) —
// calling any of these as a non-UN_ADMIN user gets a clean 403
// { error: 'UN_ADMIN access required.' }, surfaced via extractErrorMessage
// below same as everywhere else.
//
// Same apiFetch/extractErrorMessage/get/post/patch/del shape as
// propertyListingApi.js (Session 44) — copied rather than imported, matching
// this codebase's own convention of each feature owning its API module
// rather than sharing internals across features.
//
// Replaces promotionApi.js's old apiGetPromotionPlans()/apiGetChannels()
// (the pre-Phase-1 /api/listings/promotion-plans/ + /api/listings/channels/
// endpoints) — those stay in promotionApi.js untouched for now (nothing
// still imports them after this wiring pass), this file is the new,
// separate module for the Phase 4 surface.
//
// Out of scope for this pass (Overview / Audit & Logs / Eligibility tabs
// weren't part of the "Both screens, full CRUD" request — Product Catalog +
// Campaigns only): apiGetOverview / apiListAuditLogs / apiCheckEligibility
// are still included below since the backend endpoints already exist and
// are trivial to expose, but nothing calls them yet.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const BASE = '/admin/promotion-engine';

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
  // DRF field-validation dicts (e.g. { name: ['This field is required.'] })
  // land here — same fallback propertyListingApi.js uses.
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

function qs(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

// ─── Products ──────────────────────────────────────────────────────────────
// GET list uses ListingPromotionProductListSerializer (trimmed card fields +
// server-computed active_plans_count/live_campaigns_count); GET one/POST/
// PATCH use the full ListingPromotionProductSerializer (35 fields incl. the
// 19 supports* capability gates).
export const apiListProducts = (params) => get(`${BASE}/products/${qs(params)}`); // { status, search, persona }
export const apiGetProduct = (id) => get(`${BASE}/products/${id}/`);
export const apiCreateProduct = (data) => post(`${BASE}/products/`, data);
export const apiUpdateProduct = (id, data) => patch(`${BASE}/products/${id}/`, data);
export const apiDeleteProduct = (id) => del(`${BASE}/products/${id}/`);

// ─── Plans (ListingPromotionPlan — lives in the `listings` app, exposed
// here) ───────────────────────────────────────────────────────────────────
// GET list uses the trimmed ListingPromotionPlanListSerializer; GET one/
// POST/PATCH use the full ~80-field ListingPromotionPlanSerializer,
// including nested pricing_tiers/benefits (replace-on-write — omit the key
// entirely to leave existing child rows untouched on a PATCH).
export const apiListPlans = (params) => get(`${BASE}/plans/${qs(params)}`); // { product, plan_status, is_active }
export const apiGetPlan = (id) => get(`${BASE}/plans/${id}/`);
export const apiCreatePlan = (data) => post(`${BASE}/plans/`, data);
export const apiUpdatePlan = (id, data) => patch(`${BASE}/plans/${id}/`, data);
export const apiDeletePlan = (id) => del(`${BASE}/plans/${id}/`);

// ─── Campaigns ──────────────────────────────────────────────────────────────
// GET list uses PromotionCampaignListSerializer; GET one uses
// PromotionCampaignDetailSerializer (nests targets[]/feature_addons[],
// exposes is_running/effective_features). POST/PATCH use
// PromotionCampaignWriteSerializer — status/campaign_number/plan_snapshot/
// snapshot_* are all server-controlled and read-only on this serializer;
// product/plan are locked once set at creation (never PATCH-able).
export const apiListCampaigns = (params) =>
  get(`${BASE}/campaigns/${qs(params)}`); // { status, product, persona, start_date_after, start_date_before, search }
export const apiGetCampaign = (id) => get(`${BASE}/campaigns/${id}/`);
export const apiCreateCampaign = (data) => post(`${BASE}/campaigns/`, data);
export const apiUpdateCampaign = (id, data) => patch(`${BASE}/campaigns/${id}/`, data);
export const apiDeleteCampaign = (id) => del(`${BASE}/campaigns/${id}/`);

// The ONLY endpoint that can change status (decision 15's state machine —
// see services.ALLOWED_STATUS_TRANSITIONS). rationale is optional, logged
// to the Audit & Logs ActivityLog entry same as every other write here.
export const apiTransitionCampaignStatus = (id, newStatus, rationale = '') =>
  patch(`${BASE}/campaigns/${id}/status/`, { status: newStatus, rationale });

// ─── Campaign Targets (decision 1) ──────────────────────────────────────────
// Exactly one of listingId/propertyListingId must be set per row — enforced
// server-side. No inventory browser is wired up in this pass (would need a
// UN-Admin-wide, cross-tenant Listing/PropertyListing search endpoint that
// doesn't exist yet) — the FE form collects a numeric id directly.
export const apiListCampaignTargets = (campaignId) => get(`${BASE}/campaigns/${campaignId}/targets/`);
export const apiCreateCampaignTarget = (campaignId, { listingId, propertyListingId }) =>
  post(`${BASE}/campaigns/${campaignId}/targets/`, {
    listing: listingId || null,
    property_listing: propertyListingId || null,
  });
export const apiDeleteCampaignTarget = (campaignId, targetId) =>
  del(`${BASE}/campaigns/${campaignId}/targets/${targetId}/`);

// ─── Campaign Feature Add-ons (decision 23) ─────────────────────────────────
// Price always comes from the Campaign's Product.feature_addon_prices —
// never client-supplied. Server rejects add/remove once the campaign isn't
// Draft/Scheduled anymore.
export const apiListCampaignFeatureAddons = (campaignId) => get(`${BASE}/campaigns/${campaignId}/feature-addons/`);
export const apiAddCampaignFeatureAddon = (campaignId, featureKey) =>
  post(`${BASE}/campaigns/${campaignId}/feature-addons/`, { feature_key: featureKey });
export const apiRemoveCampaignFeatureAddon = (campaignId, addonId) =>
  del(`${BASE}/campaigns/${campaignId}/feature-addons/${addonId}/`);

// ─── Plan editor dropdown options (Session 50, Phase 0) ────────────────────
// Backed by the admin-configurable UNDropdown table (screen=
// UNADMIN_PROMOTION_PLAN), not a hardcoded FE list — same pattern
// listingApi.js's getListingDropdownOptions already uses. See
// core/migrations/0031_seed_promotion_plan_placement_priority_dropdown.py
// for the seeded rows. dropdownType today is just 'PLACEMENT_PRIORITY'.
export const apiGetPlanDropdownOptions = (dropdownType) =>
  get(`${BASE}/dropdowns/?type=${encodeURIComponent(dropdownType)}`);

// ─── Overview / Audit & Logs / Eligibility ─────────────────────────────────
// Backend endpoints exist and are ready; not wired into any screen this pass
// (out of scope per the "Both screens" = Product Catalog + Campaigns answer).
export const apiGetOverview = () => get(`${BASE}/overview/`);
export const apiListAuditLogs = (params) => get(`${BASE}/audit-logs/${qs(params)}`); // { target_type, target_id, date_from, date_to }
export const apiCheckEligibility = (data) => post(`${BASE}/eligibility/`, data); // { persona, market, target_type, product }
