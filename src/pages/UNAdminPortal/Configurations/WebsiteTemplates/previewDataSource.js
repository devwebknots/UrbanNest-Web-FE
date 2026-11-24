// previewDataSource.js — sample PMS data for the UN Admin visual preview
// (Website Builder Phase 2, approved decision 2).
//
// Reads only the EXISTING public Marketplace endpoints, unchanged:
//   GET /api/marketplace/search/                 → cards (_serialize_card)
//   GET /api/marketplace/listing/<id>/           → unit detail
//   GET /api/marketplace/property-listing/<id>/  → multi-unit detail
// These return only publicly published listings with the Marketplace's own
// address masking; no owner, tenant or applicant data. Nothing is written.

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const SAMPLE_SIZE = 12;

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = new Error(`Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Real listing cards only (ids 'real-<n>' / 'realgroup-<n>').
export async function getSampleProperties() {
  const body = await getJson(`/marketplace/search/?pageSize=${SAMPLE_SIZE}`);
  return (body.results || []).filter(c => /^real(group)?-\d+$/.test(String(c.id)));
}

export async function getSamplePropertyDetail(cardId) {
  const m = /^real(group)?-(\d+)$/.exec(String(cardId));
  if (!m) throw new Error('Not a published listing.');
  return getJson(m[1] ? `/marketplace/property-listing/${m[2]}/` : `/marketplace/listing/${m[2]}/`);
}
