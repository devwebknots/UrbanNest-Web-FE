// src/pages/ApplicationIntake/applicationIntakeApi.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Rental Application Intake — real API layer.
//
// Session 55 — now backed by the real Django `application_intake` app
// (Core Backend/application_intake/, mounted at /api/marketplace/
// application/). Models follow "UrbanNest – Application Intake Django
// Models & Record Numbering Standard": RentalApplication /
// ApplicationApplicant / ApplicationDependent / ApplicantDetails. Callers
// (ApplicationIntakeContext) still fall back to local draft state when a
// call fails (network error / backend down) — explicit, console-logged,
// never silent. Payload changes vs. the original FE-first contract are
// listed in application_intake/README.md in the backend repo.
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
    // Session 55 — the backend lists every problem (e.g. all missing items
    // on submit) in `messages`; callers can show them all, not just the first.
    err.messages = Array.isArray(body?.messages) ? body.messages : [];
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
// Session 55 — a Multi-Unit PropertyListing application must name the
// specific unit (the marketplace unit picker's child Listing id) — the
// backend rejects 'property-listing' starts without `unit_listing_id`.
// Idempotent: returns the renter's existing open application for that unit.
export function apiStartApplication(kind, id, unitListingId) {
  const body = { listing_kind: kindPath(kind), listing_id: id };
  if (unitListingId) body.unit_listing_id = unitListingId;
  return post(`${BASE}/start/`, body);
}

// Session 55 — every form option (UN Dropdown table) and status label /
// description (UN Reference tables) the intake screens render, plus the
// business rules the form mirrors. Nothing is hardcoded on the frontend —
// see useIntakeReferences.js. `country` adds that country's own dropdown
// rows (e.g. 'US', 'IN') on top of the global ones.
// Response: { statuses: {STATUS|APPLICANT_STATUS|INVITATION_STATUS|…:
// [{code,label,description}]}, dropdowns: {RESIDENCE_TYPE|…: [{code,label}]},
// rules: {requiredDocumentTypes, labelRequiredDocumentTypes,
// noLandlordResidenceTypes, incomeRequiredEmploymentStatuses, draftStatus,
// closedApplicationStatuses} }
export function apiGetIntakeReferences(country) {
  return get(`${BASE}/references/${country ? `?country=${encodeURIComponent(country)}` : ''}`);
}

// Session 55 — real "list my applications" (Renter side): every application
// the caller holds an applicant record on, as
// [{ household_application, myApplicant: { id, role, status, submittedAt } }].
export function apiListMyApplications() {
  return get(`${BASE}/mine/`);
}

// Session 55 — Landlord/PM side, read-only. Submitted (non-DRAFT)
// applications on listings the caller can see. No UI consumes these yet.
export function apiListReceivedApplications(listingId) {
  return get(`${BASE}/received/${listingId ? `?listing_id=${encodeURIComponent(listingId)}` : ''}`);
}

export function apiGetReceivedApplication(applicationId) {
  return get(`${BASE}/received/${applicationId}/`);
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

// ─── Dependents (household-level, primary applicant only) ──────────────────
// relationship: SPOUSE_PARTNER | CHILD | PARENT | SIBLING | OTHER_RELATIVE |
// OTHER (the backend also accepts the display labels Stage 1 uses).

export function apiAddDependent(applicationId, { fullName, relationship, dateOfBirth }) {
  return post(`${BASE}/${applicationId}/dependents/`, { fullName, relationship, dateOfBirth: dateOfBirth || null });
}

export function apiRemoveDependent(applicationId, dependentId) {
  return del(`${BASE}/${applicationId}/dependents/${dependentId}/`);
}

// ─── Pets / vehicles (stored on the PRIMARY applicant) ─────────────────────

export function apiAddPet(applicationId, applicantId, { petType, breed, weight }) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/pets/`, { petType, breed, weight });
}

export function apiRemovePet(applicationId, applicantId, petId) {
  return del(`${BASE}/${applicationId}/applicants/${applicantId}/pets/${petId}/`);
}

export function apiAddVehicle(applicationId, applicantId, { vehicleType, brand }) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/vehicles/`, { vehicleType, brand });
}

export function apiRemoveVehicle(applicationId, applicantId, vehicleId) {
  return del(`${BASE}/${applicationId}/applicants/${applicantId}/vehicles/${vehicleId}/`);
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

// Session 55 — co-applicants only: the primary applicant's CURRENT
// residence (type, address, landlord name/contact, start date — never rent
// or reason for leaving), for the opt-in "Same as primary applicant's
// current residence" button. Read-only; copying = pre-filling the
// co-applicant's own add-residence form, saved via apiAddRentalHistory.
// Response: { residence: {...} | null }
export function apiGetPrimaryResidence(applicationId, applicantId) {
  return get(`${BASE}/${applicationId}/applicants/${applicantId}/primary-residence/`);
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

// Session 55 — documents live in private storage (never under /media/), so
// the only way to get the file is this authenticated download. Returns a
// Blob; callers can URL.createObjectURL() it.
export async function apiDownloadDocument(applicationId, applicantId, documentId) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(
    `${API_BASE}${BASE}/${applicationId}/applicants/${applicantId}/documents/${documentId}/download/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const err = new Error(`Download failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

// ─── Consent (per-applicant) ────────────────────────────────────────────────

export function apiRecordConsent(applicationId, applicantId, consentType, granted) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/consent/`, {
    consent_type: consentType,
    consent_status: granted ? 'GRANTED' : 'DECLINED',
  });
}

// ─── Submission ──────────────────────────────────────────────────────────────

// Submits this one applicant's own section. Session 55 — `typedLegalName`
// (Stage 4's typed-name attestation) is now required and must match the
// applicant's legal first + last name. A PRIMARY submission moves the
// household to SUBMITTED regardless of co-applicant progress; a
// co-applicant's submission only changes their own status.
// Response: { applicant_status, household_status, applicationNumber,
// submittedAt, household_application, applicant }.
export function apiSubmitApplicantSection(applicationId, applicantId, typedLegalName) {
  return post(`${BASE}/${applicationId}/applicants/${applicantId}/submit/`, { typedLegalName });
}
