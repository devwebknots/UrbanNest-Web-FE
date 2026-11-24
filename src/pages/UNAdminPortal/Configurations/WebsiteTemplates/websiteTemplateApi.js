// src/pages/UNAdminPortal/Configurations/WebsiteTemplates/websiteTemplateApi.js
//
// Session 60 — Website Builder, Phase 1. FE wiring for UN Admin's Website
// Template Management API, mounted at /api/admin/website-templates/ (see
// websites/admin_urls.py + urbannest/urls.py). UN_ADMIN only on the server.
//
// Same apiFetch / extractErrorMessage shape as the other feature API modules
// (e.g. screeningConfigApi.js), owned by this feature per the existing
// convention.

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const BASE = '/admin/website-templates';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Flattens DRF error bodies, including nested ones such as
// { structure: ['structure.pages[0].title is required.'] } or
// { error: '…', problems: ['…', '…'] } from publish.
export function extractErrorMessage(body) {
  if (!body) return null;
  if (typeof body === 'string') return body;
  if (body.error && Array.isArray(body.problems) && body.problems.length) {
    return `${body.error} ${body.problems.join(' ')}`;
  }
  if (body.detail) return body.detail;
  if (body.error) return body.error;
  const parts = [];
  Object.entries(body).forEach(([key, val]) => {
    const text = Array.isArray(val) ? val.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ')
      : (typeof val === 'string' ? val : JSON.stringify(val));
    parts.push(key === 'non_field_errors' ? text : `${key}: ${text}`);
  });
  return parts.join(' ') || null;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* empty body is fine */ }
  if (!res.ok) {
    const err = new Error(extractErrorMessage(body) || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const getTemplates = () => apiFetch(`${BASE}/`);
export const getTemplate = (id) => apiFetch(`${BASE}/${id}/`);
export const getReferences = () => apiFetch(`${BASE}/references/`);
export const createTemplate = (payload) => apiFetch(`${BASE}/`, { method: 'POST', body: JSON.stringify(payload) });
export const updateTemplate = (id, payload) => apiFetch(`${BASE}/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
export const publishTemplate = (id) => apiFetch(`${BASE}/${id}/publish/`, { method: 'POST' });
export const unpublishTemplate = (id) => apiFetch(`${BASE}/${id}/unpublish/`, { method: 'POST' });
