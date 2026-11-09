// src/pages/Marketplace/RenterNotification/renterNotificationApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 53+ — FE wiring for the Renter "Alerts / Notifications" feed
// (the user's own feature request; wireframe approved:
// https://claude.ai/artifact/69T6PwWULK1RB9F99fda4u). Backed by the same
// marketplace_account app as Favorites/Saved Search (see
// marketplace_account/urls.py's notifications/ paths), so this copies
// marketplaceAccountApi.js's exact apiFetch/extractErrorMessage/get/patch
// shape rather than importing it — same "each feature owns its own API
// module" convention that file's own header comment already documents.
//
// There is deliberately no apiCreateNotification() here — rows are only
// ever created server-side, from rules_engine.marketplace_display.
// public_views._send_tour_confirmation() on a successful tour booking.
// This module is read + mark-as-read only.
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
  const firstKey = Object.keys(body)[0];
  if (firstKey) {
    const val = body[firstKey];
    if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }
  return null;
}

const get = (path) => apiFetch(path);
const patch = (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) });

// ─── Renter Notifications ───────────────────────────────────────────────────
// Each row: { id, notificationType, title, listingTitle, listingSubtitle,
// listingUrl, hostName, hostEmail, startAt, endAt, isRead, createdAt } (see
// marketplace_account/serializers.py's RenterNotificationSerializer).

export function apiListNotifications() {
  return get(`${BASE}/notifications/`);
}

// Lightweight poll for the account-menu nav item's unread badge — doesn't
// require fetching the full list just to know whether to show one.
export function apiGetUnreadNotificationCount() {
  return get(`${BASE}/notifications/unread-count/`);
}

export function apiMarkNotificationRead(id) {
  return patch(`${BASE}/notifications/${id}/`, { isRead: true });
}
