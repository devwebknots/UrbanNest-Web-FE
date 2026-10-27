// src/pages/Marketplace/Account/MarketplaceSavedSearchesPage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 3 — the Renter-account screen for Saved Searches built
// this pass (marketplace_account app). Route: /marketplace/saved-searches
// (see App.js). Rows are created from MarketplaceHomePage.jsx's "Save this
// search" button (handleSaveSearch); this page is list + delete only — no
// rename/edit UI yet (apiUpdateSavedSearch exists in marketplaceAccountApi.js
// for whenever that's wanted, but wasn't asked for this pass, so it isn't
// built ahead of need here, same discipline as the rest of this codebase's
// "honest no-op until there's a real destination" convention).
//
// `criteria` is a free-form JSONField (see marketplace_account/models.py) —
// this page reads it back through the exact same option lists
// MarketplaceHomePage.jsx's filter dropdowns use (LOCATION_OPTIONS,
// RENT_RANGE_OPTIONS, CATEGORIES, BEDROOM_OPTIONS) so a saved search shows
// human labels ("California", "$2,000–$3,000") rather than raw codes, and
// so it can never drift out of sync with what those dropdowns actually
// offer.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { C, F } from '../Home/marketplaceTokens';
import { LOCATION_OPTIONS, RENT_RANGE_OPTIONS, CATEGORIES, BEDROOM_OPTIONS } from '../Home/mockMarketplaceData';
import { apiListSavedSearches, apiDeleteSavedSearch } from './marketplaceAccountApi';

function labelFor(options, value) {
  if (!value) return null;
  const found = (options || []).find(o => o.value === value);
  return found ? found.label : value;
}

function formatCriteria(criteria) {
  if (!criteria) return 'Any home';
  const parts = [
    criteria.listingMode === 'SALE' ? 'For Sale' : criteria.listingMode === 'RENT' ? 'For Rent' : null,
    labelFor(LOCATION_OPTIONS, criteria.location),
    labelFor(RENT_RANGE_OPTIONS, criteria.priceRange),
    labelFor(CATEGORIES, criteria.propertyType),
    labelFor(BEDROOM_OPTIONS, criteria.bedrooms),
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Any home';
}

export default function MarketplaceSavedSearchesPage() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [searches, setSearches] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiListSavedSearches()
      .then(rows => { if (!cancelled) setSearches(rows); })
      .catch(() => { if (!cancelled) setError('Could not load your saved searches.'); });
    return () => { cancelled = true; };
  }, [user]);

  function handleDelete(id) {
    setDeletingId(id);
    apiDeleteSavedSearch(id)
      .then(() => setSearches(prev => prev.filter(s => s.id !== id)))
      .catch(() => setError('Could not delete that saved search — please try again.'))
      .finally(() => setDeletingId(null));
  }

  return (
    <div style={{ background: C.pageBg, minHeight: '100vh' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: `1px solid ${C.cardBorder}`, background: C.white,
      }}>
        <div
          onClick={() => navigate('/marketplace')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <i className="ti ti-building-skyscraper" style={{ fontSize: 24, color: C.primary }} />
          <span style={{ fontFamily: F.serif, fontSize: 18, color: C.textPrimary, fontWeight: 600 }}>Urban Nest</span>
        </div>
        <span
          onClick={() => navigate('/marketplace')}
          style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
          Back to Marketplace
        </span>
      </div>

      <div style={{ padding: '32px 48px 64px' }}>
        <h1 style={{ fontFamily: F.serif, fontSize: 26, color: C.textPrimary, margin: 0 }}>Saved Searches</h1>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '6px 0 28px' }}>
          Searches you've saved from the Marketplace, so you can run them again later.
        </p>

        {error && (
          <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontFamily: F.body, fontSize: 13 }}>
            {error}
          </div>
        )}

        {searches === null ? (
          <div style={{ fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>Loading…</div>
        ) : searches.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>
            No saved searches yet — set your filters on the Marketplace homepage and tap "Save this search."
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {searches.map(search => (
              <div
                key={search.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '16px 20px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.white,
                }}
              >
                <div>
                  <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                    {search.name || 'Saved Search'}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, marginTop: 4 }}>
                    {formatCriteria(search.criteria)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(search.id)}
                  disabled={deletingId === search.id}
                  style={{
                    background: 'transparent', border: 'none', color: C.textTertiary, cursor: deletingId === search.id ? 'default' : 'pointer',
                    fontFamily: F.body, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
                    opacity: deletingId === search.id ? 0.5 : 1, whiteSpace: 'nowrap',
                  }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 14 }} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
