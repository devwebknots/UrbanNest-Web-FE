// src/pages/ApplicationIntake/applicationIntakeApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Rental Application Intake — real API layer.
//
// Phase 1 build (see Claude Project doc application-intake/
// UrbanNest_ApplicationIntake_Figma_ApproachDoc_Review.md). This module is
// written FE-first against the planned backend surface (approach doc §11/
// §12 — HouseholdApplication / ApplicationApplicant / ApplicantInvitation /
// ApplicantRentalHistory / ApplicantEmployment / ApplicantDocument /
// ApplicantConsent / ApplicantScreening — the PE-4 intake slice). No backend
// app exists for this yet, so every call below can fail with a network
// error or 404 until that's built. Callers (ApplicationIntakeContext) treat
// that failure as "fall back to local draft state", same FE-first posture
// as MarketplaceHomePage/PMListingsOverview/PromotionEngine before their
// backends existed — this is not silently swallowed, it's an explicit,
// console-logged fallback so wiring the real backend later is just a
// matter of these endpoints starting to respond.
//
// Auth convention copied from renterNotificationApi.js (apiFetch/
// extractErrorMessage/get/patch/post shape) — "each feature owns its own
// API module" rather than importing a shared one, per that file's own
// header comment.
//
// URL shape: `kind` is 'listing' or 'property-listing', matching
// marketplaceHomeApi.js's apiBookTour()/apiGetListingDetail() URL segments
// exactly, so the same real Listing/PropertyListing pk is reused to start
// an application.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const BASE = '/marketplace/application';

function authHeaders(extra) {
  const token = localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...extra };
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
const post = (path, data) => apiFetch(path, { method: 'POST', body: JSON.stringify(data) });
const patch = (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) });
const del = (path) => apiFetch(path, { method: 'DELETE' });

function kindPath(kind) {
  return kind === 'property-listing' ? 'property-listing' : 'listing';
}

// ─── Household Application lifecycle ───────────────────────────────────────

// Approach doc §2, Step 1 — creates HouseholdApplication + PRIMARY
// ApplicationApplicant, status DRAFT. `kind`/`id` identify the real
// Listing/PropertyListing being applied to.
export function apiStartApplication(kind, id) {
  return post(`${BASE}/start/`, { listing_kind: kindPath(kind), listing_id: id });
}

export function apiGetApplication(applicationId) {
  return get(`${BASE}/${applicationId}/`);
}

export function apiGetApplicationStatus(applicationId) {
  return get(`${BASE}/${applicationId}/status/`);
}

export function apiSaveDraft(applicationId, patchData) {
  return patch(`${BASE}/${applicationId}/`, patchData);
}

export function apiWithdrawApplication(applicationId) {
  return post(`${BASE}/${applicationId}/withdraw/`, {});
}

// ─── Primary / Co-Applicant records ────────────────────────────────────────

export function apiUpdateApplicant(applicationId, applicantId, data) {
  return patch(`${BASE}/${applicationId}/applicants/${applicantId}/`, data);
}

export function apiAddCoApplicant(applicationId, { fullName, email, phone, relationship }) {
  return post(`${BASE}/${applicationId}/co-applicants/`, {
    full_name: fullName, email, phone, relationship,
  });
}

export function apiRemoveCoApplicant(applicationId, applicantId) {
  return del(`${BASE}/${applicationId}/applicants/${applicantId}/`);
}

export function apiResendInvitation(applicationId, applicantId) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/resend-invite/`, {});
}

export function apiRevokeInvitation(applicationId, applicantId) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/revoke-invite/`, {});
}

// Approach doc §3/Step 4 — a co-applicant lands on their invitation link
// with a token; this validates it and associates the authenticated user.
export function apiAcceptInvitation(token) {
  return post(`${BASE}/invitations/${encodeURIComponent(token)}/accept/`, {});
}

export function apiGetInvitationPreview(token) {
  return get(`${BASE}/invitations/${encodeURIComponent(token)}/`);
}

// ─── Rental history / employment (per-applicant) ───────────────────────────

export function apiAddRentalHistory(applicationId, applicantId, data) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/rental-history/`, data);
}

export function apiUpdateRentalHistory(applicationId, applicantId, entryId, data) {
  return patch(`${BASE}/${applicationId}/applicants/${applicantId}/rental-history/${entryId}/`, data);
}

export function apiDeleteRentalHistory(applicationId, applicantId, entryId) {
  return del(`${BASE}/${applicationId}/applicants/${applicantId}/rental-history/${entryId}/`);
}

export function apiSetEmployment(applicationId, applicantId, data) {
  return patch(`${BASE}/${applicationId}/applicants/${applicantId}/employment/`, data);
}

// ─── Documents (per-applicant) ──────────────────────────────────────────────
// multipart/form-data upload — deliberately bypasses the JSON apiFetch
// wrapper above (same reasoning PMOnboardDocs-style uploaders elsewhere in
// this codebase already follow: Content-Type must be left for the browser
// to set its own multipart boundary).

export async function apiUploadDocument(applicationId, applicantId, documentType, file, label) {
  const token = localStorage.getItem('access_token');
  const form = new FormData();
  form.append('document_type', documentType);
  form.append('file', file);
  // Session 56 — only meaningful for documentType === 'OTHER' (so the
  // landlord/PM reviewing this upload knows what it actually is); sent
  // whenever present rather than gated here, so a future non-OTHER label
  // use isn't blocked by this layer.
  if (label) form.append('label', label);
  const res = await fetch(`${API_BASE}${BASE}/${applicationId}/applicants/${applicantId}/documents/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  let body = null;
  try { body = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    const err = new Error(extractErrorMessage(body) || `Upload failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export function apiDeleteDocument(applicationId, applicantId, documentId) {
  return del(`${BASE}/${applicationId}/applicants/${applicantId}/documents/${documentId}/`);
}

// ─── Consent (per-applicant) ────────────────────────────────────────────────

export function apiRecordConsent(applicationId, applicantId, consentType, granted) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/consent/`, {
    consent_type: consentType,
    consent_status: granted ? 'GRANTED' : 'DECLINED',
  });
}

// ─── Submission ──────────────────────────────────────────────────────────────

// Approach doc §2/§4 — submits this one applicant's own section. Does NOT
// submit the whole household; backend recalculates household status
// (DRAFT → AWAITING_CO_APPLICANT → READY_FOR_SCREENING) per approach doc §5.
export function apiSubmitApplicantSection(applicationId, applicantId) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/submit/`, {});
}
