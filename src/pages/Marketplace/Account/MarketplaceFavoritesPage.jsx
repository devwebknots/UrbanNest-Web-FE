// src/pages/Marketplace/Account/MarketplaceFavoritesPage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 3 — the Renter-account screen for the Favorites built
// this pass (marketplace_account app). Route: /marketplace/favorites (see
// App.js). Deliberately a small, self-contained page rather than importing
// from MarketplaceHomePage.jsx — none of that file's internals (NearbyRow,
// formatPrice, etc.) are exported, matching this codebase's "each feature
// owns its own surface" convention; a little visual duplication here is
// cheaper than threading new exports through a 1400-line file that already
// has everything it needs scoped to its own module.
//
// Each favorite row carries `currentListing` (resolved server-side against
// the same Marketplace eligibility bar the homepage itself uses — see
// marketplace_account/serializers.py's _current_listing_card) or `null`
// when the favorited asset isn't actively listed right now (expired,
// unpublished, or never listed). Per §12.3's own requirement, that's shown
// as "Not currently listed" rather than hidden or treated as an error —
// the Favorite itself still exists and can still be un-favorited.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { C, F } from '../Home/marketplaceTokens';
import { apiListFavorites, apiRemoveFavorite } from './marketplaceAccountApi';

function formatPrice(amount) {
  if (amount == null) return null;
  return amount.toLocaleString('en-US');
}

export default function MarketplaceFavoritesPage() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [favorites, setFavorites] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  // Mirrors MarketplaceHomePage's own gate: a logged-out visitor is routed
  // to /login rather than shown an empty/broken screen. Waits for
  // authLoading to resolve first so a page refresh (token present, user
  // not yet fetched) doesn't bounce a genuinely logged-in Renter.
  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiListFavorites()
      .then(rows => { if (!cancelled) setFavorites(rows); })
      .catch(() => { if (!cancelled) setError('Could not load your favorites.'); });
    return () => { cancelled = true; };
  }, [user]);

  function handleRemove(id) {
    setRemovingId(id);
    apiRemoveFavorite(id)
      .then(() => setFavorites(prev => prev.filter(f => f.id !== id)))
      .catch(() => setError('Could not remove that favorite — please try again.'))
      .finally(() => setRemovingId(null));
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
        <h1 style={{ fontFamily: F.serif, fontSize: 26, color: C.textPrimary, margin: 0 }}>Favorites</h1>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '6px 0 28px' }}>
          Homes you've saved from the Marketplace.
        </p>

        {error && (
          <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontFamily: F.body, fontSize: 13 }}>
            {error}
          </div>
        )}

        {favorites === null ? (
          <div style={{ fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>Loading…</div>
        ) : favorites.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>
            You haven't favorited anything yet — browse the Marketplace and tap the heart on a home you like.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {favorites.map(fav => {
              const card = fav.currentListing;
              return (
                <div
                  key={fav.id}
                  style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.cardBorder}`, background: C.cardBg || C.white }}
                >
                  <div style={{ position: 'relative', height: 150, background: C.inputBg }}>
                    {card && (
                      <img src={card.coverImage} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <button
                      onClick={() => handleRemove(fav.id)}
                      disabled={removingId === fav.id}
                      aria-label="Remove from favorites"
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 28, height: 28, borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.92)', cursor: removingId === fav.id ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)', opacity: removingId === fav.id ? 0.5 : 1,
                      }}
                    >
                      <i className="ti ti-heart-filled" style={{ fontSize: 15, color: '#E11D48' }} />
                    </button>
                  </div>
                  <div style={{ padding: '12px 14px 16px' }}>
                    <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                      {card ? card.title : fav.assetLabel}
                    </div>
                    {card ? (
                      <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.primary, marginTop: 4 }}>
                        $ {formatPrice(card.priceAmount)}
                        {card.priceUnit !== 'sale' && (
                          <span style={{ fontWeight: 400, fontSize: 12, color: C.textSecondary }}> / mo</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, marginTop: 4, fontStyle: 'italic' }}>
                        Not currently listed
                      </div>
                    )}
                    <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginTop: 6 }}>
                      {fav.assetLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
