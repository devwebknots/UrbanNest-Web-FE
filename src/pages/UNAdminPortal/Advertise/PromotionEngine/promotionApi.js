/**
 * promotionApi.js — API calls for the Promotion Engine's Product Catalog tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Step 1 (Product Catalog).
 *
 * These are REAL, already-built endpoints — same `listings` app the Landlord/
 * PM listing wizards' Step 3 (Promote) already calls to show plans/channels
 * during publish. Confirmed by reading Core Backend/listings/urls.py +
 * views.py + serializers.py directly this session:
 *
 *   GET /api/listings/promotion-plans/  → ListingPromotionPlanListView
 *     Returns ListingPromotionPlan rows — but the view's own queryset is
 *     `.filter(is_active=True)`, so an inactive plan will never appear here.
 *     That's a real limitation of the existing endpoint, not something this
 *     file works around — flagged in PromotionProductCatalog.jsx's header.
 *   GET /api/listings/channels/  → ListingChannelListView
 *     Returns ALL ListingChannel rows (no is_active filter — channels use
 *     `is_available` instead, which this endpoint does not filter on).
 *
 * There is NO create/update/delete endpoint for either model yet — only
 * `seed_listings.py` writes these tables today. Per the user's explicit
 * Session 48 choice ("Real read, mock write"), this file therefore only
 * exports GET calls. Add/Edit/Delete UI exists in PromotionProductCatalog.jsx
 * for layout/Figma parity, but their Save/Delete actions are DeadEndButtons —
 * there is nothing here for them to call.
 */

const API_BASE = 'http://localhost:8001';
const CHANNELS_URL = `${API_BASE}/api/listings/channels/`;
const PROMOTION_PLANS_URL = `${API_BASE}/api/listings/promotion-plans/`;

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
}

// Both endpoints are plain ListAPIView with no pagination configured
// elsewhere in this app (see UNAdminPlanCatalog.jsx's own apiGetPlans —
// same defensive array-or-.results unwrap, in case that ever changes).
async function _getList(url) {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

export async function apiGetPromotionPlans() {
  return _getList(PROMOTION_PLANS_URL);
}

export async function apiGetChannels() {
  return _getList(CHANNELS_URL);
}
