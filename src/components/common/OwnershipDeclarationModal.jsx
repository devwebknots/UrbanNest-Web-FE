/**
 * OwnershipDeclarationModal.jsx — Session 39
 * Shared confirmation modal shown before every Property/Unit Submit action
 * by a self-registering landlord. Fetches the current disclaimer text from
 * UNMessage (message_code=LANDLORD_OWNERSHIP_DISCLAIMER) so UN Admin can
 * edit the wording without a frontend change, requires an explicit checkbox
 * accept, then hands the EXACT text shown back to the caller — per the
 * Session 39 decision, the backend stores this text verbatim rather than
 * re-fetching it, so the caller must pass this exact string through to
 * /submit/ as ownership_declaration_text.
 *
 * Reset every time it opens — never carries stale accept state across two
 * different submissions (shown every single time, not once-per-landlord).
 *
 * Usage:
 *   <OwnershipDeclarationModal
 *     open={showDeclaration}
 *     submitting={saving}
 *     onAccept={(text) => handleLandlordSaveProperty(text)}
 *     onCancel={() => setShowDeclaration(false)}
 *   />
 *
 * Place at: src/components/common/OwnershipDeclarationModal.jsx
 */

import React, { useState, useEffect } from 'react';

// ─── Local tokens — mirror AddNewProperty.jsx's platform tokens ──────────────
// Intentionally does NOT import landlordTokens.js — this modal renders
// inside the Add Property/Unit wizard, which keeps the platform's Noto
// Serif + Nunito Sans look even in landlord mode (same reasoning as the
// Self-Registration wizard, per UrbanNest_Landlord_Architecture.md §4/§6).
const C = {
  primary:     '#002D5B',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  textPrimary: '#0F172A',
  textSec:     '#64748B',
  danger:      '#E53E3E',
  amber:       '#D97706',
  amberBg:     '#FFFBEB',
  amberBorder: '#FDE68A',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const MESSAGE_CODE = 'LANDLORD_OWNERSHIP_DISCLAIMER';

export default function OwnershipDeclarationModal({ open, onAccept, onCancel, submitting = false }) {
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChecked(false);
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/references/messages/?message_code=${MESSAGE_CODE}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${r.statusText}`)))
      .then(data => {
        // Defensive against either a bare array (DRF default, no
        // pagination) or a paginated {results: [...]} shape — this
        // project's global pagination setting wasn't confirmed, so
        // handling both rather than assuming.
        const row = Array.isArray(data) ? data[0] : (data?.results?.[0] ?? null);
        if (!row || !row.message_text) {
          throw new Error('Declaration text not found.');
        }
        setText(row.message_text);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Could not load the ownership declaration.');
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  const canAccept = checked && !loading && !error && !submitting;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 480, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', fontFamily: F.body }}>

        <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.amberBg, border: `2px solid ${C.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <i className="ti ti-shield-exclamation" style={{ fontSize: 22, color: C.amber }} />
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 10, fontFamily: F.headline }}>
          Ownership Declaration
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: C.textSec, padding: '20px 0', textAlign: 'center' }}>
            Loading declaration…
          </div>
        )}

        {!loading && error && (
          <div style={{ fontSize: 13, color: C.danger, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{
              fontSize: 13, color: C.textSec, lineHeight: 1.7, marginBottom: 16,
              background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '14px 16px', maxHeight: 220, overflowY: 'auto',
            }}>
              {text}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 24, userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
                I have read and accept this declaration.
              </span>
            </label>
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{ flex: 1, height: 40, background: 'transparent', border: `1.5px solid ${C.borderMed}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={() => canAccept && onAccept(text)}
            disabled={!canAccept}
            style={{ flex: 1, height: 40, background: canAccept ? C.primary : C.borderMed, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: canAccept ? 'pointer' : 'not-allowed' }}>
            {submitting ? 'Submitting…' : 'Accept & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
