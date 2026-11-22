// src/pages/ApplicationIntake/useIntakeReferences.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 55 — the single source for every Application Intake dropdown and
// status label on the frontend. Nothing is hardcoded here or in the stages:
//   • dropdown options  → UN Dropdown table (module TENANT_APPLICATION,
//                         screen APPLICATION_INTAKE), editable by UN Admin
//   • status labels and → UN Reference tables (module TENANT_APPLICATION),
//     descriptions        ref_value = label, description = explanatory text
//   • form rules        → served by the backend (required document types,
//                         residence types with no landlord, …)
// Fetched once per country per page load (GET /marketplace/application/
// references/) and shared by every component through a module-level cache.
//
// If the backend can't be reached the lists are simply empty and `error`
// is set — the stages show "Options unavailable" rather than falling back
// to a hidden copy of the lists.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { apiGetIntakeReferences } from './applicationIntakeApi';

const EMPTY = { statuses: {}, dropdowns: {}, rules: {} };
const cache = new Map(); // country → Promise<payload>

function load(country) {
  const key = (country || '').toUpperCase();
  if (!cache.has(key)) {
    const promise = apiGetIntakeReferences(key || undefined).catch((e) => {
      cache.delete(key); // allow a retry on the next mount
      throw e;
    });
    cache.set(key, promise);
  }
  return cache.get(key);
}

export function useIntakeReferences(country) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load(country)
      .then((payload) => { if (active) { setData(payload || EMPTY); setError(null); } })
      .catch((e) => {
        console.warn('[ApplicationIntake] could not load reference data', e);
        if (active) setError(e);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [country]);

  const dropdown = (type) => data.dropdowns?.[type] || [];
  const optionLabel = (type, code) => {
    if (!code) return '';
    return dropdown(type).find((o) => o.code === code)?.label || code;
  };
  const statusEntry = (type, code) => (data.statuses?.[type] || []).find((s) => s.code === code);
  const statusLabel = (type, code) => statusEntry(type, code)?.label || (code ? code.replace(/_/g, ' ') : '');
  const statusDescription = (type, code) => statusEntry(type, code)?.description || '';
  const rules = data.rules || {};

  return { loading, error, dropdown, optionLabel, statusLabel, statusDescription, rules };
}
