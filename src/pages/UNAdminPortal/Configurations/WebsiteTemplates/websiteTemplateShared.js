// Shared helpers for the Website Templates admin screens (Session 60).
// Every label comes from the reference lists the backend returns
// (UNReference module=WEBSITE); nothing here holds option values.

import { TONES2 } from '../../../../constants';

// Label for a code from one reference list; falls back to the code itself
// so an inactive or unknown value is still readable.
export function labelFor(options, code) {
  const hit = (options || []).find(o => o.code === code);
  return hit ? hit.label : code;
}

// Pill colour per lifecycle state. Presentation only — the status codes and
// their labels come from TEMPLATE_STATUS references; any other code is neutral.
const STATUS_TONE = { PUBLISHED: TONES2.success, UNPUBLISHED: TONES2.warning };
export const statusTone = (code) => STATUS_TONE[code] || TONES2.neutral;

// A field key the backend will accept: starts with a letter, a–z 0–9 _ only.
export function toFieldKey(label) {
  const key = (label || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const safe = /^[a-z]/.test(key) ? key : `field_${key}`;
  return safe.slice(0, 50);
}

export const emptyStructure = () => ({ site_fields: [], pages: [], capabilities: [] });

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
