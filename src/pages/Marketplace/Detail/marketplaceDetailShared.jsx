// src/pages/Marketplace/Detail/marketplaceDetailShared.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 7 — small presentational pieces shared by
// ListingDetailPage.jsx and PropertyListingDetailPage.jsx.
//
// MarketplaceHomePage.jsx already has lookalikes of several of these
// (PromoRibbon, FavoriteHeart, SpecRow) but doesn't export any of them —
// only its own default export exists. Rather than touching that already-
// large, already-verified file just to add three `export` keywords, this
// file holds small, independent re-implementations of the pieces the
// detail pages actually need, following the exact same visual language
// (marketplaceTokens.js's C/F tokens) rather than inventing a new look.
// Reasonable, deliberate duplication over risky shared-module surgery —
// same posture this codebase already takes toward PM/Landlord listing-
// wizard shells (see pmListingWizardShared.jsx's own header note).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { C, F } from '../Home/marketplaceTokens';

export function money(amount) {
  if (amount === null || amount === undefined) return null;
  return `$${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// Renders `single` when every unit agrees, or `rangeStr` ('lo-hi') as
// "$lo – $hi" when they don't — the exact two shapes _range_or_single()
// produces on the backend for every ranged fee/spec field.
export function moneyOrRange(single, rangeStr, suffix = '') {
  if (rangeStr) {
    const [lo, hi] = rangeStr.split('-');
    return `${money(Number(lo))} – ${money(Number(hi))}${suffix}`;
  }
  if (single !== null && single !== undefined) return `${money(single)}${suffix}`;
  return '—';
}

export function specOrRange(single, rangeStr, label) {
  if (rangeStr) {
    const [lo, hi] = rangeStr.split('-');
    return `${lo}–${hi} ${label}`;
  }
  if (single !== null && single !== undefined) return `${single} ${label}`;
  return `— ${label}`;
}

export function PromotionBadge({ text }) {
  if (!text) return null;
  const isExclusive = text === 'Exclusive';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 20,
      background: isExclusive ? C.accentGoldBg : C.premiumBg,
      color: isExclusive ? C.accentGold : C.premiumText,
      fontFamily: F.body, fontSize: 12, fontWeight: 700, letterSpacing: 0.2,
    }}>
      <i className="ti ti-star-filled" style={{ fontSize: 12 }} />
      {text}
    </span>
  );
}

// Decision #2 (design review §7.9, the user's own words: "Put up a sample
// image as placeholder") — the ad-card slot from the reviewed Figma
// ("Aadavan Residency") stays on the page, filled with a sample/placeholder
// image only. No ad-serving backend/model exists or is built this pass.
const _AD_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=300&fit=crop';

// Session 51, Phase 21 — user ask: "if no image, use sample image." A
// listing/group can have zero real gallery photos (ListingMedia rows are
// optional, never required at publish) — the hero and
// GalleryPreviewGrid used to render a plain `url(undefined)` background
// or a bare text message in that case, which looks broken rather than
// intentional. Same "real data first, labeled Sample image as a last
// resort, never invent a fact" posture already established for
// floorPlanTiles()/tourSampleTiles() above, just applied to plain
// photos too — and the same small reused set MarketplaceHomePage.jsx's
// own HERO_IMAGES already uses (deliberately independent copy here, per
// this file's own "duplicate rather than couple" header note, since that
// array isn't exported).
export const SAMPLE_PROPERTY_PHOTOS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=1200&h=800&fit=crop',
];

// `variant="vertical"` (Session 51, Phase 8 — Multi-Unit Property page
// rebuild to match the reviewed design) renders the same honest
// Sponsored/Sample placeholder as a tall rail card instead of the original
// horizontal banner, for pages that place the ad slot beside the gallery
// rather than above the content column. Same image, same "no real ad-
// serving backend" posture (design review §7.4/§7.9 item 8) — layout-only
// change, existing callers (ListingDetailPage.jsx) are unaffected since
// 'horizontal' stays the default.
export function AdPlaceholderCard({ variant = 'horizontal' }) {
  if (variant === 'vertical') {
    return (
      <div style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden', height: '100%', minHeight: 300,
        background: `url(${_AD_PLACEHOLDER_IMAGE}) center/cover`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,22,40,0.15) 0%, rgba(10,22,40,0.75) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 12, left: 14,
          fontFamily: F.body, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
        }}>
          Sponsored · Sample
        </div>
        <div style={{
          position: 'absolute', bottom: 18, left: 16, right: 16,
          fontFamily: F.serif, fontSize: 21, fontWeight: 700, color: C.white, lineHeight: 1.25,
        }}>
          Featured listing placement
        </div>
      </div>
    );
  }
  return (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden', height: 140,
      background: `url(${_AD_PLACEHOLDER_IMAGE}) center/cover`, marginBottom: 28,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(10,22,40,0.65) 0%, rgba(10,22,40,0.15) 70%)',
      }} />
      <div style={{
        position: 'absolute', top: 10, left: 14,
        fontFamily: F.body, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
      }}>
        Sponsored · Sample
      </div>
      <div style={{
        position: 'absolute', bottom: 14, left: 14,
        fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: C.white,
      }}>
        Aadavan Residency
      </div>
    </div>
  );
}

// Session 51, Phase 21 — wireframe ask: replace the vertical Ad rail
// beside the hero with a 3x2 grid (3 columns, 2 rows) of smaller photos,
// sized inside that same rail's footprint. `photos` is the full
// photosFull array (not thumbPhotos) — this grid shows positions 2–7
// (skips index 0, the cover photo already shown in the hero itself), so
// it never just repeats what's already visible there. The last tile
// overlays a "+N more" badge into the same Lightbox when more than 6
// photos exist beyond the cover. No "360" badge here (per the reference
// screenshot) — no 360/virtual-tour media type exists anywhere in this
// backend; that concept belongs to Visual Tour & Media's own tabs, not
// this grid. `onOpen(photoIndex)` receives the real index into
// photosFull/heroMediaItems so it opens the shared Lightbox at the right
// position.
export function GalleryPreviewGrid({ photos, onOpen }) {
  const rest = (photos || []).slice(1); // skip the cover photo (already in the hero)
  const realTiles = rest.slice(0, 6).map((url) => ({ url, sample: false }));
  // "If no image, use sample image" — pad up to 6 tiles with the shared
  // sample set (cycled) whenever there aren't enough real photos,
  // including the zero-real-photos case. Padded tiles are clearly tagged
  // "Sample" and aren't clickable into the real Lightbox (there's nothing
  // real behind them to show there).
  const padCount = Math.max(6 - realTiles.length, 0);
  const tiles = [
    ...realTiles,
    ...Array.from({ length: padCount }, (_, i) => ({
      url: SAMPLE_PROPERTY_PHOTOS[i % SAMPLE_PROPERTY_PHOTOS.length],
      sample: true,
    })),
  ];
  const extraCount = Math.max(rest.length - 6, 0);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)',
      gap: 8, height: '100%', minHeight: 300,
    }}>
      {tiles.map((tile, i) => {
        const isLastRealTile = !tile.sample && i === realTiles.length - 1 && realTiles.length === 6;
        const photoIndex = i + 1; // +1 to undo the skipped cover photo above
        return (
          <div
            key={i}
            onClick={!tile.sample ? () => onOpen(photoIndex) : undefined}
            title={tile.sample ? 'Sample photo — feature coming soon' : undefined}
            style={{
              position: 'relative', borderRadius: 8, overflow: 'hidden',
              cursor: tile.sample ? 'default' : 'pointer',
              background: `url(${tile.url}) center/cover`, backgroundColor: C.inputBg,
            }}
          >
            {tile.sample && (
              <div style={{
                position: 'absolute', top: 4, left: 4, padding: '2px 6px', borderRadius: 5,
                background: 'rgba(10,22,40,0.72)', color: 'rgba(255,255,255,0.9)',
                fontFamily: F.body, fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                Sample
              </div>
            )}
            {isLastRealTile && extraCount > 0 && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(10,22,40,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 700,
              }}>
                +{extraCount} more
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Decision #3 (design review §7.9, the user's own words: "Apply Now /
// Book A Tour / Connect Now --> Coming soon") — same "honest disabled
// state" convention AiAssistButton already established elsewhere in this
// product (see claude/UrbanNest_ActiveBacklog.md, LST-5) rather than a
// navigate-away placeholder: no application/booking/messaging backend
// exists yet for any of the three (see the design review's §7.5 CTA
// reality-check table), so each button stays right here, visibly disabled,
// with a "Coming soon" sublabel instead of silently doing nothing.
export function ComingSoonButton({ icon, label, primary }) {
  return (
    <button
      disabled
      title="Coming soon"
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '13px 10px', borderRadius: 10, cursor: 'not-allowed',
        border: primary ? 'none' : `1px solid ${C.cardBorder}`,
        background: primary ? C.textTertiary : C.inputBg,
        color: primary ? C.white : C.textTertiary,
        opacity: 0.85,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.body, fontSize: 14, fontWeight: 700 }}>
        {icon && <i className={icon} />}
        {label}
      </span>
      <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.03em' }}>
        Coming soon
      </span>
    </button>
  );
}

// `titleStyle` (Session 51, Phase 23 — user ask: squeeze Costs & Fees
// down to the titular row's height) merges onto the title block's own
// default style, so one card can trim its title's size/margin without
// a new component or touching every other SectionCard on either page.
export function SectionCard({ title, children, style, titleStyle }) {
  return (
    <div style={{
      background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 14,
      padding: 22, marginBottom: 20, ...style,
    }}>
      {title && (
        <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 14, ...titleStyle }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function AmenityPills({ amenities }) {
  if (!amenities || amenities.length === 0) {
    return <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>No amenities listed.</div>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {amenities.map((name, i) => (
        <span key={`${name}-${i}`} style={{
          padding: '6px 12px', borderRadius: 20, background: C.inputBg,
          fontFamily: F.body, fontSize: 12.5, color: C.textSecondary,
        }}>
          {name}
        </span>
      ))}
    </div>
  );
}

export function NeighborhoodList({ title, icon, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.body,
        fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 8,
      }}>
        {icon && <i className={icon} />}
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', fontFamily: F.body,
            fontSize: 13, color: C.textSecondary,
          }}>
            <span>{item.name || item.title || '—'}</span>
            {item.distance_mi != null && <span style={{ color: C.textTertiary }}>{item.distance_mi} mi</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// A lightweight card for the Similar Deals row and the Multi-Unit picker
// grid — a deliberately smaller re-implementation of MarketplaceHomePage's
// own card look, not an attempt to replicate every one of its states
// (promotion ribbons, favorite heart, sample padding) which that page's own
// NearbyRow already owns.
export function MiniCard({ coverImage, title, subtitle, priceLabel, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer', borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${C.cardBorder}`, background: C.cardBg, flexShrink: 0, width: 220,
      }}
    >
      <div style={{ height: 130, background: `url(${coverImage}) center/cover`, backgroundColor: C.inputBg }} />
      <div style={{ padding: 12 }}>
        <div style={{
          fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{subtitle}</div>
        )}
        {priceLabel && (
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.primary, marginTop: 6 }}>
            {priceLabel}
          </div>
        )}
      </div>
    </div>
  );
}

// Card ids from _serialize_card() are always 'real-<pk>' (a Listing) or
// 'realgroup-<pk>' (a PropertyListing) — parses either shape into the
// right detail route, same prefix convention MarketplaceHomePage.jsx's own
// handleCardClick uses.
export function cardHref(card) {
  const id = String(card.id || '');
  if (id.startsWith('realgroup-')) return `/marketplace/property-listing/${id.slice('realgroup-'.length)}`;
  if (id.startsWith('real-')) return `/marketplace/listing/${id.slice('real-'.length)}`;
  return null;
}

export function PageState({ children }) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F.body, fontSize: 15, color: C.textSecondary, padding: 40, textAlign: 'center',
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 8 — Multi-Unit Property page rebuild to match the
// reviewed design (user-supplied reference screens showing a compact top
// nav + footer the detail pages didn't carry before, even though
// MarketplaceHomePage.jsx already has both in its own inline markup).
// Per the user's own scope: colors stick to this file's C/F tokens (never
// the reference design's own palette) and images stay sample/placeholder
// (never the reference's specific photos) — everything else about the
// reference's layout is what's being matched. New, independent
// re-implementations here rather than importing from
// MarketplaceHomePage.jsx, same "duplicate rather than couple" posture this
// file's own header comment already established for the rest of its pieces
// (MarketplaceHomePage.jsx doesn't export its hero-nav/footer either, and
// that hero-nav is carousel/search-specific — not what an interior page
// needs). Only PropertyListingDetailPage.jsx uses these this round, per the
// user's explicit "Multi Property page" scope — left exported here so
// ListingDetailPage.jsx can pick them up later without duplicating a third
// time.
// ─────────────────────────────────────────────────────────────────────────────

// Session 51, Phase 15 — the user asked to strip the Search bar, EN
// (language) selector, Bell, Profile, and burger-menu icons off the detail
// pages' top banner, leaving just the logo, Home, and the Wishlist heart
// (not mentioned in that ask, so left in place). _NAV_ICONS now holds only
// 'heart' — kept as a one-item list rather than inlined, so a future icon
// can be added back the same way without restructuring this component.
const _NAV_ICONS = ['heart'];

export function TopNav({ navigate }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', background: C.primary,
    }}>
      <div
        onClick={() => navigate('/marketplace')}
        style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
      >
        <i className="ti ti-building-skyscraper" style={{ fontSize: 22, color: C.white }} />
        <span style={{ fontFamily: F.serif, fontSize: 17, color: C.white, fontWeight: 600 }}>Urban Nest</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <i
          className="ti ti-home"
          onClick={() => navigate('/marketplace')}
          style={{ fontSize: 17, color: C.white, cursor: 'pointer' }}
          title="Home"
        />
        {_NAV_ICONS.map(name => (
          <i key={name} className={`ti ti-${name}`} style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)' }} />
        ))}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <div style={{ background: C.footerBg, padding: '40px 32px 24px', color: C.footerText }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 1fr', gap: 28, maxWidth: 1040, margin: '0 auto' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <i className="ti ti-building-skyscraper" style={{ fontSize: 20, color: C.white }} />
            <span style={{ fontFamily: F.serif, fontSize: 16, color: C.white }}>Urban Nest</span>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 12, lineHeight: 1.8 }}>
            Urban Nest Pvt. Ltd.<br />
            Support: hello@urbannest.com
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {['brand-facebook', 'brand-x', 'brand-instagram', 'brand-linkedin'].map(icon => (
              <i key={icon} className={`ti ti-${icon}`} style={{ fontSize: 15, color: C.footerText }} />
            ))}
          </div>
        </div>
        <FooterCol head="" links={['About Us', 'Our Services', 'Contact Us']} />
        <FooterCol head="" links={['Careers', 'Privacy Policy']} />
        <div>
          <div style={{ fontFamily: F.serif, fontSize: 14, color: C.footerHead, marginBottom: 8 }}>Join Our Inner Circle</div>
          <div style={{ fontFamily: F.body, fontSize: 11.5 }}>
            Be the first to discover new listings.
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterCol({ head, links }) {
  return (
    <div>
      {head && <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.footerHead, marginBottom: 12 }}>{head}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: F.body, fontSize: 12 }}>
        {links.map(l => <span key={l} style={{ cursor: 'pointer' }}>{l}</span>)}
      </div>
    </div>
  );
}

// Session 51, Phase 11 — the user asked to carry the Search modal's real
// Leaflet/OpenStreetMap map (Phase 10, MarketplaceHomePage.jsx's own
// loadLeaflet()/MapPane) over to these detail pages' Location tab, and
// then to reuse it for the Schools and Shop & Dine tabs too. Small,
// independent duplicate of that same CDN loader — same "duplicate rather
// than couple" posture this file's own header comment already established
// (this module has no import path to MarketplaceHomePage.jsx's internals,
// and the loader itself is a few lines of plain DOM code, not worth a
// shared-module refactor for). OpenStreetMap tiles need no API key or
// billing account (the same reason Phase 10 picked this library over
// Google Maps, sidestepping the still-open LST-2 gap), so a CDN script tag
// is both the only option reachable from this session's device-bridge
// scope (no package.json here) and a perfectly normal way to ship it
// regardless. Cached as a module-level promise so it's fetched once per
// page load no matter how many LocationMapPanel instances mount across
// this file's two detail pages or how many times a renter switches tabs.
let _leafletLoadPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (_leafletLoadPromise) return _leafletLoadPromise;
  _leafletLoadPromise = new Promise((resolve, reject) => {
    const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }
    const existing = document.querySelector('script[data-un-leaflet]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.dataset.unLeaflet = '1';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _leafletLoadPromise;
}

// Replaces the old static "Interactive map coming soon" placeholder with a
// real Leaflet/OpenStreetMap view centered on the listing's own geocoded
// coordinate (addr.latitude/addr.longitude — already present in both
// detail endpoints' payloads since Phase 7, masked by show_exact_address
// exactly like every other address field, so a listing with a hidden
// address simply has no map here, same as it already has no street
// address shown). Renders exactly ONE pin — the property/unit's own
// location — never fabricated per-school or per-restaurant pins: checked
// _neighborhood_payload() directly before building this, and neither
// ListingNeighborhoodInfo.schools nor .restaurants carries its own
// lat/lng, only name/type/grades/distance_mi text — inventing coordinates
// for them would be exactly the kind of fake data this product has
// avoided everywhere else (the "Coming soon" CTAs, the sample-only ad
// card, the deliberately-omitted fee line items). That's also why this
// same component is reused as-is for the Schools and Shop & Dine tabs
// below (still just the one property pin, with the existing text list
// rendered underneath it) rather than building three different map
// variants.
// Session 51, Phase 35 — `height` (default 240, this component's own
// existing fixed map-box height) is a new opt-in prop so
// ListingDetailPage.jsx's own Neighbourhood card can render a shorter map
// without touching PropertyListingDetailPage.jsx's — which never passes
// it, so it keeps the original 240px exactly as before.
function LocationMapPanel({ latitude, longitude, mapsUrl, label, height = 240 }) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (latitude == null || longitude == null) return undefined;
    let cancelled = false;
    setReady(false);
    setFailed(false);
    loadLeaflet().then(L => {
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: true, attributionControl: true, scrollWheelZoom: false,
      }).setView([latitude, longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      L.circleMarker([latitude, longitude], {
        radius: 10, weight: 2, color: '#FFFFFF', fillColor: C.primary, fillOpacity: 1,
      }).addTo(map).bindPopup(label || 'This property');
      mapRef.current = map;
      setReady(true);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [latitude, longitude, label]);

  // Honest empty state — not "coming soon" (the feature now exists), just
  // "not available for this one listing": either the landlord hasn't
  // enabled "show exact address" on Neighborhood, or the property has no
  // stored latitude/longitude yet. No approximate/guessed pin is ever
  // shown in either case.
  if (latitude == null || longitude == null) {
    return (
      <div style={{
        height, borderRadius: 12, background: C.inputBg, border: `1px solid ${C.cardBorder}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <i className="ti ti-map-pin-off" style={{ fontSize: 32, color: C.textTertiary }} />
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, textAlign: 'center', padding: '0 24px' }}>
          Exact location isn't available for this listing.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.cardBorder}` }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: C.inputBg }} />
      {!ready && !failed && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F.body, fontSize: 13, color: C.textTertiary, background: C.inputBg,
        }}>
          Loading map…
        </div>
      )}
      {failed && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F.body, fontSize: 13, color: C.textTertiary, background: C.inputBg,
        }}>
          Map couldn't load.
        </div>
      )}
      {mapsUrl && ready && (
        <a
          href={mapsUrl} target="_blank" rel="noreferrer"
          style={{
            position: 'absolute', bottom: 10, right: 10, zIndex: 1000,
            padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.cardBorder}`,
            background: C.white, color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 11.5,
            textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}

// Keyword → tabler-icon mapping for the Special Features / Amenities list —
// falls back to a generic check icon for any amenity name that doesn't
// match a known keyword, so new/uncatalogued amenity names never render
// with a missing icon.
const _AMENITY_ICON_RULES = [
  [/smart/i, 'ti-home-bolt'],
  [/security|cctv|camera/i, 'ti-shield-check'],
  [/ev charg|electric vehicle/i, 'ti-charging-pile'],
  [/transport|metro|transit|bus/i, 'ti-bus'],
  [/lease|term/i, 'ti-file-text'],
  [/deposit/i, 'ti-cash'],
  [/parking/i, 'ti-parking'],
  [/pool/i, 'ti-pool'],
  [/gym|fitness/i, 'ti-barbell'],
  [/laundry|washer|dryer/i, 'ti-wash'],
  [/pet/i, 'ti-paw'],
  [/balcony|patio/i, 'ti-building-arch'],
  [/elevator|lift/i, 'ti-stairs-up'],
  [/wifi|internet/i, 'ti-wifi'],
  [/ac|air condition/i, 'ti-air-conditioning'],
];

export function amenityIcon(name) {
  const hit = _AMENITY_ICON_RULES.find(([re]) => re.test(name || ''));
  return hit ? hit[1] : 'ti-circle-check';
}

// Session 51, Phase 25 — user ask: cap Special Features at `maxVisible`
// items with a "See More" link (same popup pattern as
// FacilitiesParkingSection's own "See More") opening a popup with the
// full list, when there are more than that. `maxVisible` is opt-in
// (undefined = no cap, the original behavior), so ListingDetailPage.jsx's
// own unrelated usage of this component renders exactly as before; only
// PropertyListingDetailPage.jsx passes maxVisible={10}.
export function AmenityIconList({ amenities, maxVisible }) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  if (!amenities || amenities.length === 0) {
    return <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>No special features listed.</div>;
  }
  const hasMore = maxVisible != null && amenities.length > maxVisible;
  const visible = hasMore ? amenities.slice(0, maxVisible) : amenities;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14, columnGap: 18 }}>
        {visible.map((name, i) => (
          <div key={`${name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: F.body, fontSize: 13, color: C.textPrimary }}>
            <i className={`ti ${amenityIcon(name)}`} style={{ fontSize: 17, color: C.primary, flexShrink: 0 }} />
            {name}
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={() => setMoreOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 12.5, textDecoration: 'none',
            }}
          >
            See More
          </button>
        </div>
      )}

      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(8,12,20,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 340, maxHeight: 460, overflowY: 'auto', background: C.cardBg, borderRadius: 12,
              padding: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Special Features</div>
              <button
                onClick={() => setMoreOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.textTertiary }}
              >
                &times;
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 10, columnGap: 14 }}>
              {amenities.map((name, i) => (
                <div key={`${name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>
                  <i className={`ti ${amenityIcon(name)}`} style={{ fontSize: 15, color: C.primary, flexShrink: 0 }} />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Unit picker grid card — Decision #4 (design review §7.9/§7.10): still a
// real child Listing labeled by floor plan name/title, never a "Room N"/
// bed-level tile (that pattern is deliberately reserved for Student
// Housing, see §7.7/§7.10 item 4). Visual shape matches the reference
// design's room-card layout (image, name, price, availability link) —
// only the label semantics and underlying data are different, by the
// user's own prior decision, not a visual choice being revisited now.
// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 9 — Individual Unit detail page rebuild to match the
// same reference design already applied to the Multi-Unit page (Phase 8).
// FeeRow/FeeColumn and LocationPanel were originally written inline in
// PropertyListingDetailPage.jsx for that rebuild; moved here, unchanged,
// now that ListingDetailPage.jsx needs the identical componentry — both
// pages render the same Costs & Fees two-column shape and the same
// Location/Schools/Shop & Dine/Travel tab strip, just fed different data
// (a single Listing's own fee terms vs. a PropertyListing group's computed
// ranges). This is the "pick them up later without duplicating a third
// time" this file's own Phase 8 header comment already flagged.
// ─────────────────────────────────────────────────────────────────────────────

// `dense` (Session 51, Phase 23 — user ask: squeeze Costs & Fees' 3
// columns into a card the same height as the titular row, by tightening
// the space around each row) halves the row's vertical padding. Default
// (dense=false) is UNCHANGED — ListingDetailPage.jsx's own Costs & Fees
// and FacilitiesParkingSection's Parking tab both still get the original
// spacing; only PropertyListingDetailPage.jsx's GroupFeesBlock passes
// `dense` this round.
export function FeeRow({ label, value, align = 'between', gap = 10 }) {
  if (value === null || value === undefined || value === '') return null;
  // Session 51, Phase 25 — replaces Phase 24's `dense` boolean. The user's
  // ask was specific per-column: right-justify the label+value pair (so
  // both sit together at the row's right edge, not spread edge-to-edge
  // with the old justifyContent:'space-between') AND widen the gap
  // between them by a named amount — 8 "spaces" for Pet Policy/Lease, 6
  // "spaces" for Rent & Fees. There's no CSS unit called "spaces", so
  // this reads 1 space ≈ 6px at this row's font-size (13.5px) — giving
  // gap=48 and gap=36 respectively (see GroupFeesBlock's call sites,
  // which is the only caller that ever passes align/gap explicitly).
  // Default (align='between', gap=10) is UNCHANGED from the original
  // pre-Phase-23 behavior — ListingDetailPage.jsx's own Costs & Fees and
  // FacilitiesParkingSection's Parking tab both still get it untouched.
  const justify = align === 'end' ? 'flex-end' : 'space-between';
  return (
    <div style={{
      display: 'flex', justifyContent: justify, padding: '9px 0',
      borderBottom: `1px solid ${C.divider}`, fontFamily: F.body, fontSize: 13.5, gap,
    }}>
      {/* Session 51 fix — a Multi-Unit group's fee values are ranges
          ("$1,500 – $2,000 / month"), long enough that the value span used
          to wrap onto a second line inside a two-column FeeColumn even at
          normal desktop widths (no white-space/flex-shrink control on
          either span before this). Label gets minWidth:0 so a long label
          could in principle ellipsis rather than squeeze the value — none
          of this block's real labels are long enough to ever hit that in
          practice — and the value is pinned to one line and never shrunk,
          so it always renders exactly like the reference's single-value
          rows, range or not. */}
      <span style={{ color: C.textSecondary, minWidth: 0, flexShrink: align === 'end' ? 0 : 1 }}>{label}</span>
      <span style={{ color: C.textPrimary, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{value}</span>
    </div>
  );
}

export function FeeColumn({ heading, children, dense = false }) {
  // Session 51, Phase 24 — `dense` no longer touches the heading's
  // vertical margin (that was Phase 23's wrong height-based squeeze);
  // FeeColumn now only exists to narrow its own minWidth when `dense`,
  // so three columns can actually fit side by side in the narrower
  // Costs & Fees card (see GroupFeesBlock) instead of wrapping.
  return (
    // Session 51 fix, paired with FeeRow's own: minWidth was 0, which let
    // this column get squeezed arbitrarily narrow inside its flex-wrap
    // parent — fine for a short single value, but a Multi-Unit group's
    // range values ("$1,500 – $2,000 / month") need real room now that
    // FeeRow no longer wraps them onto a second line. 200px is enough for
    // the longest real range this block renders at its normal font size;
    // below that, the parent's flexWrap:'wrap' stacks the two columns full-
    // width instead of squeezing both, so nothing ever overflows the card.
    // `dense` (used only in the narrower Costs & Fees card) drops this to
    // 150px so three columns fit the reduced width without wrapping.
    <div style={{ flex: 1, minWidth: dense ? 150 : 200 }}>
      <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.textTertiary, marginBottom: 6 }}>
        {heading}
      </div>
      {children}
    </div>
  );
}

const _LOCATION_TABS = [
  { key: 'location', label: 'Location' },
  { key: 'schools', label: 'Schools' },
  { key: 'shop', label: 'Shop & Dine' },
  { key: 'travel', label: 'Travel' },
];

// `latitude`/`longitude` (Phase 11): the same addr.latitude/addr.longitude
// both detail pages already read for `mapsUrl` — now also handed down so
// the Location/Schools/Shop & Dine tabs can render the real map instead of
// the old static placeholder. `label` (optional) is the listing/property
// title, used as the pin's popup text; falls back to "This property"
// inside LocationMapPanel when omitted.
// Session 51, Phase 35 — `mapHeight` (default 240, matching
// LocationMapPanel's own default) is a new opt-in pass-through prop, for
// the same reason LocationMapPanel's own `height` prop exists — only
// ListingDetailPage.jsx's Neighbourhood card uses it.
export function LocationPanel({ latitude, longitude, mapsUrl, neighborhood, label, mapHeight = 240 }) {
  const [tab, setTab] = React.useState('location');
  // One map element, reused by the three tabs that show it — each tab's
  // conditional block below renders its own instance of this JSX (not a
  // shared live instance across tabs; switching tabs cleanly unmounts the
  // old map and mounts a fresh one, same as any other conditionally-
  // rendered child), so there's never more than one Leaflet map live at a
  // time no matter which of the three tabs is active.
  const mapNode = <LocationMapPanel latitude={latitude} longitude={longitude} mapsUrl={mapsUrl} label={label} height={mapHeight} />;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {_LOCATION_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t.key ? C.primary : C.inputBg,
              color: tab === t.key ? C.white : C.textSecondary,
              fontFamily: F.body, fontSize: 12.5, fontWeight: 700,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'location' && mapNode}
      {tab === 'schools' && (
        <>
          {mapNode}
          <div style={{ marginTop: 14 }}>
            {neighborhood?.schools?.length > 0
              ? <NeighborhoodList title="Schools" icon="ti ti-school" items={neighborhood.schools} />
              : <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>No schools listed.</div>}
          </div>
        </>
      )}
      {tab === 'shop' && (
        <>
          {mapNode}
          <div style={{ marginTop: 14 }}>
            {neighborhood?.restaurants?.length > 0
              ? <NeighborhoodList title="Shop & Dine" icon="ti ti-tools-kitchen-2" items={neighborhood.restaurants} />
              : <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>No shop & dine spots listed.</div>}
          </div>
        </>
      )}
      {tab === 'travel' && (
        <>
          <NeighborhoodList title="Transportation" icon="ti ti-bus" items={neighborhood?.transportation} />
          <NeighborhoodList title="Landmarks" icon="ti ti-map-pin" items={neighborhood?.landmarks} />
          {!(neighborhood?.transportation?.length || neighborhood?.landmarks?.length) && (
            <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>No travel info listed.</div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 27 — user ask: this page's popups ("Details"/"See
// More" on Facilities & Parking, Special Features, and the new
// Available Units popup) should "follow the standard size and design
// of the UN popup's" — components/common/UNPopup.jsx. That component
// is a fixed single-purpose alert/confirm dialog (an icon, a one-line
// `message` STRING, and 1-2 buttons) — it has no prop for arbitrary
// rich content, so it can't actually host a scrollable/filterable list
// or table. This mirrors its CHROME instead of importing the component:
// the same navy (#002D5B / C.primary) header bar with the UrbanNest
// wordmark and a close X, the same backdrop, 14px corner radius, drop
// shadow, and Noto Serif/Nunito Sans fonts (UNPopup's own F.headline/
// F.body tokens — verified identical to this file's own C/F from
// marketplaceTokens, so no new colors/fonts are introduced), with a
// free-form body for whatever content the caller needs. `width`
// defaults to UNPopup's own 420px; a caller needing more room (a data
// table) passes its own, like the Available Units "See More" popup's
// explicit half-screen width.
// Session 51, Phase 33 — exported (was module-private) so
// ListingDetailPage.jsx's own "Costs & Fees" See More popup can reuse it
// too, rather than duplicating this chrome in a second file.
export function UNModalShell({ title, onClose, width = 420, height, children }) {
  React.useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.45)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 901,
          width, maxWidth: 'calc(100vw - 32px)',
          ...(height ? { minHeight: height } : {}),
          maxHeight: 'calc(100vh - 64px)',
          background: C.white, borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.20)', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ background: C.primary, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 24, height: 24, background: 'rgba(255,255,255,0.15)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-home" style={{ fontSize: 13, color: C.white }} />
          </div>
          <span style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 700, color: C.white, lineHeight: 1, letterSpacing: '0.01em' }}>
            Urban<span style={{ color: '#60A5FA' }}>Nest</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: 'auto', width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 4, opacity: 0.85,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 15, color: C.white }} />
          </button>
        </div>
        <div style={{ padding: '20px 22px 22px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {title && (
            <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 700, color: C.textPrimary, marginBottom: 14 }}>
              {title}
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 21 — new "Facilities & Parking" card, per the user's
// own wireframe round on `V2_FullPage.dc.html` (two tabs: Facilities,
// Parking). Sits beside Neighbourhood, replacing the old Special
// Features slot in that position (Special Features itself moved beside
// Costs & Fees instead — see PropertyListingDetailPage.jsx).
//
// NO REAL DATA MODEL BACKS THIS YET — same "no fake data" posture this
// file's other placeholders (AdPlaceholderCard, ComingSoonButton) already
// established, just inverted: those render an honest disabled/sample
// state because a real backend concept exists but has no implementation;
// this one has no backend concept at ALL yet (no community-amenity
// category model, no parking-fee fields on Listing/PropertyListing).
// Content below is the user's own sample content from the wireframe
// round, hardcoded and clearly labeled "Sample" via the card's own
// badge — flagged for the backlog (a future rules_engine/listings model
// for facility categories + parking terms), not wired to `fees`/
// `amenities` props at all. Revisit once that model exists.
// Session 51, Phase 25 — user ask: cap each subsection (category) at 4
// visible items, down from 6.
const _FACILITY_MAX_VISIBLE = 4;
const _SAMPLE_FACILITY_CATEGORIES = [
  { heading: 'Shared Community', items: ['Business Center', 'Clubhouse', 'Corporate Suites', 'Conference Rooms', 'Elevator', 'Lounge', 'Multi Use Room', 'Walk-Up'] },
  { heading: 'Fitness & Recreation', items: ['Fitness Center', 'Pool', 'Sauna', 'Gameroom', 'Media Center/Movie Theatre', 'Walking/Biking Trails', 'Pickleball Court'] },
];
const _SAMPLE_PARKING_ROWS = [
  { label: 'Parking Type', value: 'Surface Lot + Covered Garage' },
  { label: 'Assigned Parking', value: '1 space per unit' },
  { label: 'Additional Parking Fee', value: '$50 / month' },
  { label: 'Guest Parking', value: 'Available, unassigned' },
];
const _FACILITY_TABS = [
  { key: 'facilities', label: 'Facilities' },
  { key: 'parking', label: 'Parking' },
];

export function FacilitiesParkingSection() {
  const [tab, setTab] = React.useState('facilities');
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const hasAnyMore = _SAMPLE_FACILITY_CATEGORIES.some((cat) => cat.items.length > _FACILITY_MAX_VISIBLE);

  return (
    <SectionCard title="Facilities & Parking" style={{ height: '100%', boxSizing: 'border-box' }}>
      {/* Session 51, Phase 27 — user ask: dropped the "New — Sample
          content, backlog" badge that used to sit here. That also fixes
          a second ask ("line up these tabs with Neighbourhood's Location/
          Schools/etc. tabs") for free: this card's tabs now start right
          after the title with nothing above them, exactly like
          LocationPanel's own tabs do in the Neighbourhood card beside
          it — both cards use the same SectionCard title treatment, so
          with no extra element in between, their tab rows land at the
          same height.
          Session 51, Phase 37 — user ask: more breathing room between
          the tabs row and the first subsection heading below it
          ("Shared Community") — "by two lines". Using this same card's
          own ~19px-line-height convention (see the 4-line/~76px gap
          already used elsewhere on this card), two lines ≈ 38px, added
          on top of the original 14px → 52px. This only affects THIS
          card's own tabs-to-content gap, not LocationPanel's matching
          tabs row above (that one keeps its original marginBottom), so
          the two tab rows no longer line up vertically below this
          point — only their top edges still do, which is what the
          original Phase 27 fix was actually about. */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 52 }}>
        {_FACILITY_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t.key ? C.primary : C.inputBg,
              color: tab === t.key ? C.white : C.textSecondary,
              fontFamily: F.body, fontSize: 12.5, fontWeight: 700,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'facilities' ? (
        <>
          {_SAMPLE_FACILITY_CATEGORIES.map((cat) => {
            const visibleItems = cat.items.slice(0, _FACILITY_MAX_VISIBLE);
            return (
              <div key={cat.heading} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 7 }}>
                  <i className="ti ti-building-community" style={{ fontSize: 15, color: C.primary }} />
                  {cat.heading}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', rowGap: 4, columnGap: 8 }}>
                  {visibleItems.map((item, i) => (
                    <div key={i} style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, paddingLeft: 22 }}>{item}</div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* One "See More" link for the whole section (not per category),
              bottom-right of the card — per the user's own follow-up
              comment on the wireframe. Opens a popup with every
              category's full item list together. Session 51, Phase 25 —
              user ask: renamed from "Details" to "See More", no
              underline, and only rendered at all when a category
              actually exceeds the (now 4-item) visible cap — same
              `hasAnyMore` check as before, just against the lower cap.
              Session 51, Phase 27 — user ask: moved further down,
              roughly 4 line-heights (~76px at this card's ~19px line
              height) below the facility categories, instead of sitting
              right under them. */}
          {hasAnyMore && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 76 }}>
              <button
                onClick={() => setDetailsOpen(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 12.5, textDecoration: 'none',
                }}
              >
                See More
              </button>
            </div>
          )}
        </>
      ) : (
        <div>
          {_SAMPLE_PARKING_ROWS.map((row) => (
            <FeeRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      )}

      {/* Session 51, Phase 27 — user ask: this popup should "follow the
          standard size and design of the UN popup's" — swapped the old
          one-off styled overlay for the shared UNModalShell (see its own
          comment above for why that's a lookalike of UNPopup.jsx rather
          than that component itself). */}
      {detailsOpen && (
        <UNModalShell title="Facilities" onClose={() => setDetailsOpen(false)}>
          {_SAMPLE_FACILITY_CATEGORIES.map((cat) => (
            <div key={cat.heading} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>{cat.heading}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', rowGap: 5, columnGap: 8 }}>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </UNModalShell>
      )}
    </SectionCard>
  );
}

export function UnitGridCard({ unit, listingType, onClick }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
      border: `1px solid ${C.cardBorder}`, borderRadius: 10, background: C.cardBg,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 8, flexShrink: 0,
        background: `url(${unit.coverImage}) center/cover`, backgroundColor: C.inputBg,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {unit.label}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.primary, fontWeight: 700, marginTop: 2 }}>
          {unit.price != null ? `${money(unit.price)}${listingType === 'RENT' ? '/mo' : ''}` : '—'}
        </div>
      </div>
      <button
        onClick={onClick}
        style={{
          flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 12,
        }}
      >
        Check Availability
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 14 — hero gallery/floor-plan rework for both detail
// pages, per the user's explicit asks this round:
//   a) Main hero image height up 20% (HERO_IMAGE_HEIGHT below — 300 → 360 —
//      and the thumbnail rail scaled to match so the rail still fills the
//      same visual column).
//   b) A media-count overlay on the hero (MediaCountBar) showing the total
//      Photos/Videos/3D Tour/Virtual Staging. Checked listings/models.py
//      directly first: ListingMedia.media_type is only PHOTO/VIDEO/
//      FLOOR_PLAN_IMAGE — no 3D Tour or Virtual Staging type exists
//      anywhere in the schema. Put this exact tradeoff to the user before
//      building (hide the two badges until real / show them now with
//      sample counts / build real backend media types) — the user chose
//      "show with sample counts." So Photos/Videos counts below are always
//      the real gallery counts (and the badge itself disappears if a count
//      is genuinely zero), while 3D Tour/Virtual Staging use fixed sample
//      numbers, always visibly tagged "Sample" (same convention as
//      AdPlaceholderCard's "Sponsored · Sample" label) and never
//      clickable into any lightbox content, since no such media exists to
//      show.
//   c) Lightbox — a single generic popup (shared by both pages) that takes
//      one mixed list of {type:'photo'|'video', url, label?} items and an
//      opening index, with Prev/Next arrows, Escape/←/→ keyboard support,
//      and a position counter, so a renter can scroll back and forth
//      across every photo AND video in one popup, opened by clicking the
//      hero image, any thumbnail, the play button, or a media-count pill.
//   d) Floor Plan: the user asked for sample floor plans to fill the
//      section whenever fewer than 3 real ones exist, and for a click-to-
//      expand popup. floorPlanTiles() below never drops or caps real
//      FLOOR_PLAN_IMAGE rows — it only pads up to a minimum of 3 with a
//      clearly-labeled "Sample" schematic (an inline SVG line drawing, not
//      a stock photo pretending to be a real floor plan) when real ones
//      are missing. Floor plans get their OWN Lightbox instance (just the
//      floor plan tiles), separate from the hero's photo/video Lightbox,
//      since the user's own ask treated the two as separate asks.
// ─────────────────────────────────────────────────────────────────────────────

// 300 (the original hero height) × 1.2, per the user's own "increase by
// 20%" instruction. HERO_THUMB_HEIGHT scales the 4-thumbnail rail to the
// same total height (4 thumbnails + 3× the rail's 10px gap), so the rail
// still lines up with the taller hero rather than leaving a visual gap
// underneath it.
export const HERO_IMAGE_HEIGHT = 360;
export const HERO_THUMB_HEIGHT = Math.round((HERO_IMAGE_HEIGHT - 30) / 4);

// Session 51, Phase 16 — the user reported the Advertisement rail (the
// vertical ad card beside the gallery) rendering visibly taller than the
// Hero image + Name & Description stack next to it, bottom edges not
// flush. First attempt here was a ResizeObserver-based hook that measured
// both rendered heights and derived a hero height to close the gap — but
// that approach is a mathematical no-op whenever the ad's real behavior is
// a plain CSS stretch to match its sibling column (height = heroHeight +
// gap + nameDescHeight): measuring the ad's height back out and solving
// for "needed hero height" just returns the CURRENT hero height again, by
// construction — it can never detect a gap that only exists because of
// something inside the sibling column itself. The user confirmed no
// visible change after that fix shipped, which is exactly what that
// algebra predicts, and pointed straight at the real cause: SectionCard's
// own default `marginBottom: 20` (meant for stacking multiple cards with
// spacing between them) was still being applied to the Name & Description
// card here, even though nothing else sits below it inside this same
// column. That 20px margin sits OUTSIDE the visible white card's border
// but INSIDE its wrapper's content-flow height — and since the ad
// genuinely does stretch (correctly, via ordinary flexbox align-items:
// stretch) to match that wrapper's full height, the ad's bottom ends up
// 20px below the visible card's own bottom edge. The real fix is just to
// zero out that default on this one card (see the `marginBottom: 0`
// override passed in ListingDetailPage.jsx/PropertyListingDetailPage.jsx's
// own SectionCard calls) rather than growing the hero at all — removed
// the hook and the HERO_TO_DESC_GAP export it depended on; HERO_IMAGE_HEIGHT/
// HERO_THUMB_HEIGHT (above) are back to being plain, static values again.

function _svgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Three distinct, honestly-schematic floor plan sketches (plain lines/
// labels, not a real architectural drawing of any actual unit) — used only
// to pad the Floor Plan section up to a minimum of 3 tiles when a listing
// has fewer than 3 real FLOOR_PLAN_IMAGE rows. Each tile built from one of
// these is overlaid with a visible "Sample" tag (see FloorPlanGrid below),
// so it's never mistaken for the real thing.
const _SAMPLE_FLOOR_PLAN_SVGS = [
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
    <rect width='400' height='400' fill='#F3F1EC'/>
    <rect x='30' y='30' width='340' height='340' fill='none' stroke='#9CA3AF' stroke-width='5'/>
    <line x1='30' y1='230' x2='230' y2='230' stroke='#9CA3AF' stroke-width='4'/>
    <line x1='230' y1='30' x2='230' y2='370' stroke='#9CA3AF' stroke-width='4'/>
    <text x='125' y='140' font-family='sans-serif' font-size='16' fill='#6B7280' text-anchor='middle'>Bedroom</text>
    <text x='300' y='140' font-family='sans-serif' font-size='16' fill='#6B7280' text-anchor='middle'>Living Room</text>
    <text x='125' y='310' font-family='sans-serif' font-size='16' fill='#6B7280' text-anchor='middle'>Bathroom</text>
    <text x='300' y='310' font-family='sans-serif' font-size='16' fill='#6B7280' text-anchor='middle'>Kitchen</text>
  </svg>`,
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
    <rect width='400' height='400' fill='#F3F1EC'/>
    <rect x='30' y='30' width='340' height='340' fill='none' stroke='#9CA3AF' stroke-width='5'/>
    <line x1='30' y1='150' x2='370' y2='150' stroke='#9CA3AF' stroke-width='4'/>
    <line x1='200' y1='150' x2='200' y2='370' stroke='#9CA3AF' stroke-width='4'/>
    <line x1='30' y1='260' x2='200' y2='260' stroke='#9CA3AF' stroke-width='4'/>
    <text x='200' y='100' font-family='sans-serif' font-size='16' fill='#6B7280' text-anchor='middle'>Living / Dining</text>
    <text x='110' y='212' font-family='sans-serif' font-size='14' fill='#6B7280' text-anchor='middle'>Bedroom 1</text>
    <text x='110' y='322' font-family='sans-serif' font-size='14' fill='#6B7280' text-anchor='middle'>Bedroom 2</text>
    <text x='285' y='265' font-family='sans-serif' font-size='14' fill='#6B7280' text-anchor='middle'>Kitchen / Bath</text>
  </svg>`,
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
    <rect width='400' height='400' fill='#F3F1EC'/>
    <rect x='30' y='30' width='340' height='340' fill='none' stroke='#9CA3AF' stroke-width='5'/>
    <rect x='270' y='30' width='100' height='110' fill='none' stroke='#9CA3AF' stroke-width='4'/>
    <line x1='30' y1='300' x2='370' y2='300' stroke='#9CA3AF' stroke-width='4'/>
    <text x='170' y='170' font-family='sans-serif' font-size='16' fill='#6B7280' text-anchor='middle'>Open Studio</text>
    <text x='320' y='90' font-family='sans-serif' font-size='13' fill='#6B7280' text-anchor='middle'>Bath</text>
    <text x='200' y='340' font-family='sans-serif' font-size='15' fill='#6B7280' text-anchor='middle'>Kitchenette</text>
  </svg>`,
].map(_svgDataUri);

// Always returns at least 3 tiles — real FLOOR_PLAN_IMAGE urls first
// (never dropped or capped; a listing with 4+ real ones shows all of
// them), padded with a labeled sample schematic only when fewer than 3
// real ones exist.
export function floorPlanTiles(realUrls) {
  const tiles = (realUrls || []).map(url => ({ url, sample: false }));
  let i = 0;
  while (tiles.length < 3) {
    tiles.push({ url: _SAMPLE_FLOOR_PLAN_SVGS[i % _SAMPLE_FLOOR_PLAN_SVGS.length], sample: true });
    i += 1;
  }
  return tiles;
}

export function FloorPlanGrid({ tiles, onOpen }) {
  if (!tiles || tiles.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {tiles.map((tile, i) => (
        <div
          key={i}
          onClick={() => onOpen(i)}
          role="button"
          title={tile.sample ? 'Sample floor plan — click to expand' : 'Click to expand'}
          style={{
            position: 'relative', width: 100, height: 100, borderRadius: 8, cursor: 'pointer',
            backgroundColor: C.inputBg, border: `1px solid ${C.cardBorder}`, overflow: 'hidden',
          }}
        >
          <img src={tile.url} alt="Floor plan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {tile.sample && (
            <div style={{
              position: 'absolute', top: 4, left: 4, padding: '2px 6px', borderRadius: 5,
              background: 'rgba(10,22,40,0.72)', color: 'rgba(255,255,255,0.9)',
              fontFamily: F.body, fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Sample
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
            background: 'rgba(10,22,40,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-zoom-in" style={{ fontSize: 12, color: C.white }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Fixed sample counts for the two media types this backend has no model
// for (see this section's header note) — never randomized, so the badge
// doesn't change between visits/renders.
const _SAMPLE_TOUR_3D_COUNT = 1;
const _SAMPLE_VIRTUAL_STAGING_COUNT = 4;

function MediaCountPill({ icon, count, label, sample, onClick }) {
  if (!count) return null;
  const clickable = !sample && typeof onClick === 'function';
  return (
    <button
      onClick={clickable ? onClick : undefined}
      title={sample ? `${label} — sample data, feature coming soon` : `View ${label.toLowerCase()}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
        border: 'none', cursor: clickable ? 'pointer' : 'default',
        background: 'rgba(10,22,40,0.68)', color: C.white,
        fontFamily: F.body, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
      {count} {label}
      {sample && (
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.65)',
        }}>
          Sample
        </span>
      )}
    </button>
  );
}

// Overlaid on the hero image's bottom-left corner. photoCount/videoCount
// are always the real gallery counts (and that pill disappears if the
// count is genuinely 0); the 3D Tour/Virtual Staging pills are fixed
// sample numbers, always tagged "Sample", never clickable — see this
// section's header note for why.
export function MediaCountBar({ photoCount, videoCount, onOpenPhotos, onOpenVideos }) {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12, zIndex: 2,
      display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 'calc(100% - 24px)',
    }}>
      <MediaCountPill icon="ti-photo" count={photoCount} label="Photos" onClick={onOpenPhotos} />
      <MediaCountPill icon="ti-player-play" count={videoCount} label="Videos" onClick={onOpenVideos} />
      <MediaCountPill icon="ti-rotate-3d" count={_SAMPLE_TOUR_3D_COUNT} label="3D Tour" sample />
      <MediaCountPill icon="ti-armchair" count={_SAMPLE_VIRTUAL_STAGING_COUNT} label="Virtual Staging" sample />
    </div>
  );
}

// Generic popup shared by the hero photo/video gallery and the Floor Plan
// section on both detail pages. `items` is a flat list of
// {type:'photo'|'video', url, label?}; `startIndex` is where it opens;
// `onClose` closes it. Prev/Next arrows plus ←/→/Escape keys let a renter
// scroll back and forth through the whole list without closing and
// reopening the popup.
export function Lightbox({ items, startIndex = 0, onClose }) {
  const [index, setIndex] = React.useState(startIndex);

  React.useEffect(() => { setIndex(startIndex); }, [startIndex]);

  const count = items ? items.length : 0;
  const goPrev = React.useCallback(() => setIndex(i => (i - 1 + count) % count), [count]);
  const goNext = React.useCallback(() => setIndex(i => (i + 1) % count), [count]);

  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) goPrev();
      else if (e.key === 'ArrowRight' && count > 1) goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext, count]);

  if (!items || count === 0) return null;
  const safeIndex = Math.min(Math.max(index, 0), count - 1);
  const current = items[safeIndex];
  const navBtnStyle = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 1,
    width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.14)', color: C.white, fontSize: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(8,12,20,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        style={{
          position: 'absolute', top: 18, right: 22, zIndex: 1,
          width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.14)', color: C.white, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <i className="ti ti-x" />
      </button>

      {count > 1 && (
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous" style={{ ...navBtnStyle, left: 16 }}>
          <i className="ti ti-chevron-left" />
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {current.type === 'video' ? (
          <video
            key={current.url}
            src={current.url} controls autoPlay
            style={{ maxWidth: '88vw', maxHeight: '78vh', borderRadius: 8, background: '#000' }}
          />
        ) : (
          <img
            src={current.url} alt={current.label || 'Listing media'}
            style={{ maxWidth: '88vw', maxHeight: '78vh', borderRadius: 8, objectFit: 'contain', background: '#111' }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.75)', fontFamily: F.body, fontSize: 12.5 }}>
          {current.label && <span>{current.label}</span>}
          {count > 1 && <span>{safeIndex + 1} / {count}</span>}
        </div>
      </div>

      {count > 1 && (
        <button onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next" style={{ ...navBtnStyle, right: 16 }}>
          <i className="ti ti-chevron-right" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 20 — "Visual Tour & Media" section (design review,
// Design artifact "Visual Tour & Media Section — Wireframe", confirmed with
// the user through several wireframe rounds). Replaces, on
// PropertyListingDetailPage.jsx ONLY, the old hero MediaCountBar overlay
// and the separate "Floor Plan" SectionCard with one full-width, 5-tab
// section (Photos / Videos / Floor Plan / 3D Tour / Virtual Staging) placed
// directly above Available Units. ListingDetailPage.jsx is untouched —
// MediaCountBar/MediaCountPill/_SAMPLE_TOUR_3D_COUNT/
// _SAMPLE_VIRTUAL_STAGING_COUNT above stay exactly as they are (still used
// there), and this section duplicates rather than reuses that sample-count
// posture (TOUR_3D_SAMPLE_COUNT/VIRTUAL_STAGING_SAMPLE_COUNT below, same
// numbers, same "duplicate rather than couple" posture this file's own
// header comment already established).
//
// Floor Plan keeps using floorPlanTiles()/FloorPlanGrid exactly as built —
// not reinvented here, just slotted in as one of the five tabs. Photos and
// Videos follow the SAME "pad with a labeled Sample tile rather than show
// nothing" convention floorPlanTiles() already established — tourMediaTiles()
// below is that same idea generalized to any single list of real urls, per
// the user's explicit instruction this round ("if the image is not
// available, then put a sample image"). 3D Tour and Virtual Staging have no
// real media type anywhere in the schema (checked listings/models.py
// directly, same finding Phase 14's MediaCountBar comment already
// documents) — tourSampleTiles() below always renders the same fixed number
// of tiles, every one of them tagged "Sample".
//
// Click-to-expand (the user's part (c) — "the feature already implemented
// on the hero section"): every real tile, in every tab, opens the existing
// Lightbox. A tile tagged "Sample" is never clickable — same rule
// MediaCountPill already enforces for its own Sample badges — since there's
// no real content behind it to show enlarged. The one deliberate exception
// is Floor Plan's own sample schematics, which were already clickable
// before this change (FloorPlanGrid's existing, unmodified behavior) and are
// left exactly as they were.
// ─────────────────────────────────────────────────────────────────────────────

export const TOUR_3D_SAMPLE_COUNT = 1;
export const VIRTUAL_STAGING_SAMPLE_COUNT = 4;

const _TOUR_MEDIA_TABS = [
  { key: 'photos', label: 'Photos', icon: 'ti-photo' },
  { key: 'videos', label: 'Videos', icon: 'ti-player-play' },
  { key: 'floorplan', label: 'Floor Plan', icon: 'ti-layout-2' },
  { key: 'tour3d', label: '3D Tour', icon: 'ti-rotate-3d' },
  { key: 'staging', label: 'Virtual Staging', icon: 'ti-armchair' },
];

// Real urls first, never dropped or capped (a listing with 10 real photos
// shows all 10) — padded with exactly one labeled sample tile only when the
// list would otherwise be completely empty. `type` is 'photo' or 'video',
// carried through onto each tile so the Lightbox renders it correctly.
export function tourMediaTiles(type, realUrls) {
  if (realUrls && realUrls.length > 0) {
    return realUrls.map((url, i) => ({
      type, url, sample: false,
      label: type === 'video' ? `Video ${i + 1}` : null,
    }));
  }
  return [{
    type, sample: true,
    label: type === 'video' ? 'Sample video' : 'Sample photo',
    icon: type === 'video' ? 'ti-player-play' : 'ti-photo',
  }];
}

// 3D Tour / Virtual Staging — always `count` sample tiles, never real ones
// (no backing media type exists for either, see this section's header
// note).
export function tourSampleTiles(type, count, label, icon) {
  return Array.from({ length: count }, () => ({ type, sample: true, label, icon }));
}

// Session 51, Phase 21 — wireframe ask: Photos always showed exactly 5
// tiles, sized to fill the full row width (`big` below flexes each tile
// instead of the old fixed 150x110px + horizontal scroll).
// Session 51, Phase 25 — Photos switched to TourMediaSingleBig (see
// VisualTourMediaSection's own comment), so this component is no longer
// called from anywhere; left in place, unused, rather than deleted, in
// case a future round brings back a multi-thumbnail row.
function TourMediaTile({ tile, onOpen, big }) {
  const clickable = !tile.sample && typeof onOpen === 'function';
  return (
    <div
      onClick={clickable ? onOpen : undefined}
      role={clickable ? 'button' : undefined}
      title={tile.sample ? `${tile.label} — sample, feature coming soon` : (tile.type === 'video' ? 'Click to play' : 'Click to expand')}
      style={big ? {
        position: 'relative', flex: '1 1 0', minWidth: 0, aspectRatio: '4 / 3', borderRadius: 10,
        overflow: 'hidden', border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg,
        cursor: clickable ? 'pointer' : 'default',
      } : {
        position: 'relative', width: 150, height: 110, borderRadius: 10, flexShrink: 0,
        overflow: 'hidden', border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {tile.sample ? (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6, color: C.textTertiary,
        }}>
          <i className={`ti ${tile.icon}`} style={{ fontSize: big ? 30 : 24 }} />
          <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, textAlign: 'center', padding: '0 8px' }}>{tile.label}</span>
        </div>
      ) : tile.type === 'video' ? (
        <div style={{
          position: 'absolute', inset: 0, background: C.primaryDark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-player-play-filled" style={{ fontSize: 15, color: C.primary }} />
          </div>
        </div>
      ) : (
        <img src={tile.url} alt="Listing media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {tile.sample && (
        <div style={{
          position: 'absolute', top: 4, left: 4, padding: '2px 6px', borderRadius: 5,
          background: 'rgba(10,22,40,0.72)', color: 'rgba(255,255,255,0.9)',
          fontFamily: F.body, fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          Sample
        </div>
      )}
    </div>
  );
}

// Session 51, Phase 21 — Videos / 3D Tour / Virtual Staging's new shared
// "one big display" treatment: a single tile at 80% of the card's width,
// 460px tall, centered. Takes just the tab's first tile (today every one
// of these three tabs only ever has one real/sample item to show at a
// time in this wireframe round — a future "more than one real video"
// case would need its own next/prev control, not built here yet, same
// as this section's own footer note already calls out).
// Session 51, Phase 35 — `height` (default 460, this component's own
// existing fixed image-box height) is a new opt-in prop, same pattern as
// LocationMapPanel's own `height` prop just above — only
// ListingDetailPage.jsx's Visual Tour & Media passes a smaller value;
// PropertyListingDetailPage.jsx's usage is unaffected.
function TourMediaSingleBig({ tile, onOpen, height = 460 }) {
  if (!tile) return null;
  const clickable = !tile.sample && typeof onOpen === 'function';
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '80%' }}>
        <div
          onClick={clickable ? onOpen : undefined}
          role={clickable ? 'button' : undefined}
          style={{
            position: 'relative', width: '100%', height, borderRadius: 14,
            overflow: 'hidden', border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg,
            cursor: clickable ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {tile.type === 'video' && !tile.sample ? (
            <>
              <div style={{ position: 'absolute', inset: 0, background: C.primaryDark }} />
              <div style={{
                position: 'relative', width: 70, height: 70, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-player-play-filled" style={{ fontSize: 26, color: C.primary }} />
              </div>
            </>
          ) : tile.sample ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: C.textTertiary }}>
              <i className={`ti ${tile.icon}`} style={{ fontSize: 56 }} />
            </div>
          ) : (
            <img src={tile.url} alt="Listing media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {tile.sample && (
            <div style={{
              position: 'absolute', top: 12, left: 12, padding: '4px 9px', borderRadius: 6,
              background: 'rgba(10,22,40,0.82)', color: 'rgba(255,255,255,0.92)',
              fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Sample
            </div>
          )}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textSecondary, textAlign: 'center', marginTop: 8 }}>
          {tile.label}
        </div>
      </div>
    </div>
  );
}

// `tabs` is a plain array of { key, label, icon, tiles } — the caller
// (PropertyListingDetailPage.jsx) builds each tab's `tiles` from
// tourMediaTiles()/tourSampleTiles()/floorPlanTiles() so index numbering
// stays identical between what's rendered here and what the page's own
// Lightbox item lists use. `onOpenTile(tabKey, index)` fires only for a
// clickable (non-sample) tile; the Floor Plan tab renders through the
// existing, unmodified FloorPlanGrid (which already has its own sample-tile
// click behavior) rather than TourMediaTile.
// Session 51, Phase 35 — `mediaHeight` (default 460, matching
// TourMediaSingleBig's own default) is a new opt-in pass-through prop,
// threaded to both of this component's TourMediaSingleBig call sites
// below (the 'photos' tab's single-image display, and the shared Videos/
// 3D Tour/Virtual Staging branch) — only ListingDetailPage.jsx uses it.
// Session 51, Phase 38 — new opt-in `style` prop, forwarded to this
// section's own top-level SectionCard. Needed so ListingDetailPage.jsx can
// pass `{ height: '100%', boxSizing: 'border-box' }` to make this card's
// visible height actually stretch to match its Grid row (its sibling,
// Neighbourhood, already does this on its own SectionCard) — a CSS Grid
// item's default `align-items:'stretch'` only stretches the outer <div>
// wrapper, not an inner block element without height:'100%' of its own.
// Defaults to `{}` (same net effect as no style at all), so
// PropertyListingDetailPage.jsx's existing call site — which never passes
// this prop — renders exactly as before.
export function VisualTourMediaSection({ tabs, onOpenTile, mediaHeight = 460, style = {} }) {
  const [activeKey, setActiveKey] = React.useState(_TOUR_MEDIA_TABS[0].key);
  // Session 51, Phase 25 — which single tile Photos is currently showing
  // (see the 'photos' branch below). Reset to 0 whenever the active tab
  // changes, so switching away from and back to Photos never shows a
  // stale index from a different tab's tile list.
  const [singleIndex, setSingleIndex] = React.useState(0);
  React.useEffect(() => { setSingleIndex(0); }, [activeKey]);
  const active = tabs.find(t => t.key === activeKey);
  const activeTiles = active ? active.tiles : [];

  return (
    <SectionCard title="Visual Tour & Media" style={style}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {_TOUR_MEDIA_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveKey(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeKey === t.key ? C.primary : C.inputBg,
              color: activeKey === t.key ? C.white : C.textSecondary,
              fontFamily: F.body, fontSize: 12.5, fontWeight: 700,
            }}
          >
            <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTiles.length === 0 ? (
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>Nothing to show here yet.</div>
      ) : activeKey === 'floorplan' ? (
        <FloorPlanGrid tiles={activeTiles} onOpen={(i) => onOpenTile('floorplan', i)} />
      ) : activeKey === 'photos' ? (
        // Session 51, Phase 21 — exactly 5 tiles, flexed to fill the row.
        // Session 51, Phase 25 — user ask: Photos images were "very
        // huge"; switched to the exact same one-at-a-time, fixed-size
        // display (TourMediaSingleBig) that Video/3D Tour/Virtual
        // Staging already use, so every tab is sized identically. Unlike
        // those three tabs (which this component only ever gives a
        // single real/sample tile), Photos can have several real photos,
        // so a prev/next control is added here — otherwise photos 2+
        // would become unreachable from this section (they remain
        // reachable via the hero gallery grid regardless).
        <div>
          <TourMediaSingleBig
            tile={activeTiles[singleIndex]}
            onOpen={!activeTiles[singleIndex].sample ? () => onOpenTile(activeKey, singleIndex) : undefined}
            height={mediaHeight}
          />
          {activeTiles.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 10 }}>
              <button
                onClick={() => setSingleIndex(i => (i - 1 + activeTiles.length) % activeTiles.length)}
                aria-label="Previous photo"
                style={{
                  width: 30, height: 30, borderRadius: '50%', border: `1px solid ${C.cardBorder}`,
                  background: C.inputBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className="ti ti-chevron-left" style={{ fontSize: 15, color: C.textSecondary }} />
              </button>
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>
                {singleIndex + 1} / {activeTiles.length}
              </span>
              <button
                onClick={() => setSingleIndex(i => (i + 1) % activeTiles.length)}
                aria-label="Next photo"
                style={{
                  width: 30, height: 30, borderRadius: '50%', border: `1px solid ${C.cardBorder}`,
                  background: C.inputBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className="ti ti-chevron-right" style={{ fontSize: 15, color: C.textSecondary }} />
              </button>
            </div>
          )}
        </div>
      ) : (
        // Videos / 3D Tour / Virtual Staging — one big 80%-width display.
        <TourMediaSingleBig tile={activeTiles[0]} onOpen={!activeTiles[0].sample ? () => onOpenTile(activeKey, 0) : undefined} height={mediaHeight} />
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 20 — Available Units redesign (design review, same
// wireframe round as Visual Tour & Media above): bed-count filter tabs
// (All / 1 Bed / 2 Bed / 3+ Bed) + a 7-column table (Unit #, Bed & Bath, Sq
// Ft, Available On, Rent, SD, View Detail), replacing UnitGridCard's old
// 2-column tile grid on PropertyListingDetailPage.jsx. UnitGridCard itself
// is left in place, unused on this page but still exported, rather than
// removed — least-risk option, and nothing else in this codebase currently
// imports it. `units` is the exact array _unit_picker() already returns,
// now carrying the real unitNumber/bedCategory/availableOn/securityDeposit
// fields this table needs (Phase 20 backend addition — see that function's
// own comment for why none of these needed new modeling).
// ─────────────────────────────────────────────────────────────────────────────

const _BED_TABS = [
  { key: 'all', label: 'All' },
  { key: '1bed', label: '1 Bed' },
  { key: '2bed', label: '2 Bed' },
  { key: '3plus', label: '3+ Bed' },
];

// Listing.available_date is a plain ISO 'YYYY-MM-DD' date string (or null)
// coming off the API — formatted here rather than on the backend so this
// table controls its own display format without a round trip.
function _formatAvailableOn(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const _UNITS_TABLE_COLUMNS = '76px 128px 76px 128px 104px 104px 1fr';

// Session 51, Phase 27 — if a property has too few real available
// units, pad the list with sample units (clearly tagged, View Detail
// disabled on them) so the table/popup always has enough rows to
// demonstrate the 5-unit cap + "See More" flow. Same "no fake data,
// clearly labeled sample as last resort" posture as this page's other
// placeholders (SAMPLE_PROPERTY_PHOTOS, Facilities & Parking, etc.) —
// never mixed into real counts/exports, always flagged with `sample:
// true` and a visible "Sample" tag.
// Session 51, Phase 28 — correction: padding only up to 5 (Phase 27)
// meant "See More" never actually appeared for a thinly-populated
// property — 5 total is never *more* than the 5-row inline cap, so
// `hasMore` stayed false and the popup was unreachable. The user asked
// explicitly to pad with up to 15 sample units instead, specifically so
// the popup has enough rows to demonstrate its filters + vertical
// scroll. Pool expanded from 5 to 15 (same shape, spread evenly across
// all three bed categories) and the padding threshold below raised to
// match.
const _SAMPLE_AVAILABLE_UNITS = [
  { id: 'sample-unit-1', unitNumber: '101', beds: 1, baths: 1, sqft: 650, availableOn: '2026-11-01', price: 1500, securityDeposit: 750, bedCategory: '1bed', sample: true },
  { id: 'sample-unit-2', unitNumber: '103', beds: 1, baths: 1, sqft: 680, availableOn: '2026-11-15', price: 1550, securityDeposit: 775, bedCategory: '1bed', sample: true },
  { id: 'sample-unit-3', unitNumber: '105', beds: 1, baths: 1, sqft: 620, availableOn: '2026-12-01', price: 1450, securityDeposit: 725, bedCategory: '1bed', sample: true },
  { id: 'sample-unit-4', unitNumber: '107', beds: 1, baths: 1, sqft: 700, availableOn: '2026-12-10', price: 1600, securityDeposit: 800, bedCategory: '1bed', sample: true },
  { id: 'sample-unit-5', unitNumber: '109', beds: 1, baths: 1, sqft: 660, availableOn: '2027-01-05', price: 1525, securityDeposit: 760, bedCategory: '1bed', sample: true },
  { id: 'sample-unit-6', unitNumber: '202', beds: 2, baths: 2, sqft: 950, availableOn: '2026-11-20', price: 1950, securityDeposit: 950, bedCategory: '2bed', sample: true },
  { id: 'sample-unit-7', unitNumber: '204', beds: 2, baths: 1, sqft: 900, availableOn: '2026-12-05', price: 1875, securityDeposit: 900, bedCategory: '2bed', sample: true },
  { id: 'sample-unit-8', unitNumber: '206', beds: 2, baths: 2, sqft: 1000, availableOn: '2027-01-15', price: 2050, securityDeposit: 1000, bedCategory: '2bed', sample: true },
  { id: 'sample-unit-9', unitNumber: '208', beds: 2, baths: 2, sqft: 980, availableOn: '2027-02-01', price: 2000, securityDeposit: 975, bedCategory: '2bed', sample: true },
  { id: 'sample-unit-10', unitNumber: '210', beds: 2, baths: 1, sqft: 920, availableOn: '2027-02-10', price: 1900, securityDeposit: 925, bedCategory: '2bed', sample: true },
  { id: 'sample-unit-11', unitNumber: '301', beds: 3, baths: 2, sqft: 1200, availableOn: '2026-12-20', price: 2400, securityDeposit: 1200, bedCategory: '3plus', sample: true },
  { id: 'sample-unit-12', unitNumber: '302', beds: 3, baths: 2, sqft: 1250, availableOn: '2027-01-10', price: 2475, securityDeposit: 1225, bedCategory: '3plus', sample: true },
  { id: 'sample-unit-13', unitNumber: '303', beds: 4, baths: 3, sqft: 1500, availableOn: '2027-02-15', price: 2900, securityDeposit: 1450, bedCategory: '3plus', sample: true },
  { id: 'sample-unit-14', unitNumber: '304', beds: 3, baths: 2, sqft: 1225, availableOn: '2027-03-01', price: 2450, securityDeposit: 1225, bedCategory: '3plus', sample: true },
  { id: 'sample-unit-15', unitNumber: '305', beds: 3, baths: 3, sqft: 1300, availableOn: '2027-03-10', price: 2550, securityDeposit: 1275, bedCategory: '3plus', sample: true },
];

const _EMPTY_RANGE_FILTERS = { availableAfter: '', minSqft: '', maxSqft: '', minRent: '', maxRent: '', minSD: '', maxSD: '' };

// Session 51, Phase 30 — user ask: filter by Available Date, Sq Ft, and
// Rent/SD, as min/max range inputs. `f` fields are either '' (not set,
// never excludes) or a typed value; a unit missing the field it's being
// filtered on is excluded (can't tell if it passes), same as any other
// "can't verify, don't claim it matches" posture elsewhere on this page.
function _passesRangeFilters(u, f) {
  if (f.availableAfter) {
    if (!u.availableOn || u.availableOn < f.availableAfter) return false;
  }
  if (f.minSqft !== '' && (u.sqft == null || u.sqft < Number(f.minSqft))) return false;
  if (f.maxSqft !== '' && (u.sqft == null || u.sqft > Number(f.maxSqft))) return false;
  if (f.minRent !== '' && (u.price == null || u.price < Number(f.minRent))) return false;
  if (f.maxRent !== '' && (u.price == null || u.price > Number(f.maxRent))) return false;
  if (f.minSD !== '' && (u.securityDeposit == null || u.securityDeposit < Number(f.minSD))) return false;
  if (f.maxSD !== '' && (u.securityDeposit == null || u.securityDeposit > Number(f.maxSD))) return false;
  return true;
}

const _RANGE_FILTER_INPUT_STYLE = {
  width: 72, padding: '6px 8px', borderRadius: 6, border: `1px solid ${C.cardBorder}`,
  fontFamily: F.body, fontSize: 12, color: C.textPrimary, background: C.cardBg,
};
const _RANGE_FILTER_LABEL_STYLE = {
  fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.03em',
  textTransform: 'uppercase', color: C.textTertiary,
};

// `maxVisible` (optional) caps how many rows render inline and shows a
// "See More" link (bottom-right) once the filtered list exceeds it —
// clicking it opens a popup (UNModalShell, matching the user's "standard
// UN popup" ask) with the SAME filter tabs and the FULL (uncapped) list,
// built by rendering this component again inside the popup without
// `maxVisible` — so the popup gets vertical scroll, its own independent
// tab state, and the same sample-padding logic for free, rather than
// duplicating any of this component's own logic.
// `showRangeFilters` (opt-in, default false — Session 51, Phase 30) adds
// the Available Date / Sq Ft / Rent / SD range filter bar above the bed
// tabs. Only the "See More" popup call below passes it: the inline
// (main-page) table stays the simple bed-tabs-only view it's always
// been — this card is already fairly compact, and the popup is the
// "browse everything" surface with the room for it.
export function AvailableUnitsTable({ units, listingType, onViewDetail, maxVisible, showRangeFilters = false }) {
  const [bedTab, setBedTab] = React.useState('all');
  const [seeMoreOpen, setSeeMoreOpen] = React.useState(false);
  const [rangeFilters, setRangeFilters] = React.useState(_EMPTY_RANGE_FILTERS);
  const real = units || [];
  // Session 51, Phase 28 — pad up to 15 (not just 5) so "See More" (and
  // the popup behind it) actually has something to show whenever real
  // data is thin — padding to exactly 5 made `hasMore` below always
  // false, since 5 is never *more* than the 5-row inline cap.
  const list = real.length >= 15 ? real : [...real, ..._SAMPLE_AVAILABLE_UNITS.slice(0, 15 - real.length)];
  const bedFiltered = bedTab === 'all' ? list : list.filter(u => u.bedCategory === bedTab);
  // Harmless no-op when showRangeFilters is false: rangeFilters state
  // never leaves _EMPTY_RANGE_FILTERS without the inputs that set it,
  // and _passesRangeFilters only excludes on a non-'' field.
  const filtered = bedFiltered.filter(u => _passesRangeFilters(u, rangeFilters));
  const visible = maxVisible != null ? filtered.slice(0, maxVisible) : filtered;
  const hasMore = maxVisible != null && filtered.length > maxVisible;
  const anyRangeFilterSet = Object.values(rangeFilters).some(v => v !== '');

  return (
    <div>
      {showRangeFilters && (
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end',
          marginBottom: 14, padding: '10px 12px', background: C.inputBg, borderRadius: 8,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={_RANGE_FILTER_LABEL_STYLE}>Available After</label>
            <input
              type="date"
              value={rangeFilters.availableAfter}
              onChange={(e) => setRangeFilters(f => ({ ...f, availableAfter: e.target.value }))}
              style={{ ..._RANGE_FILTER_INPUT_STYLE, width: 140 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={_RANGE_FILTER_LABEL_STYLE}>Sq Ft</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input type="number" placeholder="Min" min="0" value={rangeFilters.minSqft} onChange={(e) => setRangeFilters(f => ({ ...f, minSqft: e.target.value }))} style={_RANGE_FILTER_INPUT_STYLE} />
              <span style={{ color: C.textTertiary, fontSize: 12 }}>–</span>
              <input type="number" placeholder="Max" min="0" value={rangeFilters.maxSqft} onChange={(e) => setRangeFilters(f => ({ ...f, maxSqft: e.target.value }))} style={_RANGE_FILTER_INPUT_STYLE} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={_RANGE_FILTER_LABEL_STYLE}>{listingType === 'RENT' ? 'Rent' : 'Price'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input type="number" placeholder="Min" min="0" value={rangeFilters.minRent} onChange={(e) => setRangeFilters(f => ({ ...f, minRent: e.target.value }))} style={_RANGE_FILTER_INPUT_STYLE} />
              <span style={{ color: C.textTertiary, fontSize: 12 }}>–</span>
              <input type="number" placeholder="Max" min="0" value={rangeFilters.maxRent} onChange={(e) => setRangeFilters(f => ({ ...f, maxRent: e.target.value }))} style={_RANGE_FILTER_INPUT_STYLE} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={_RANGE_FILTER_LABEL_STYLE}>SD</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input type="number" placeholder="Min" min="0" value={rangeFilters.minSD} onChange={(e) => setRangeFilters(f => ({ ...f, minSD: e.target.value }))} style={_RANGE_FILTER_INPUT_STYLE} />
              <span style={{ color: C.textTertiary, fontSize: 12 }}>–</span>
              <input type="number" placeholder="Max" min="0" value={rangeFilters.maxSD} onChange={(e) => setRangeFilters(f => ({ ...f, maxSD: e.target.value }))} style={_RANGE_FILTER_INPUT_STYLE} />
            </div>
          </div>
          {anyRangeFilterSet && (
            <button
              onClick={() => setRangeFilters(_EMPTY_RANGE_FILTERS)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
                color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 12,
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {_BED_TABS.map(t => {
          // Session 51, Phase 30 — counts reflect the active range
          // filters too (not just bed category), so they stay honest
          // about what each tab would actually show if clicked.
          const rangeMatched = list.filter(u => _passesRangeFilters(u, rangeFilters));
          const count = t.key === 'all' ? rangeMatched.length : rangeMatched.filter(u => u.bedCategory === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setBedTab(t.key)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: bedTab === t.key ? C.primary : C.inputBg,
                color: bedTab === t.key ? C.white : C.textSecondary,
                fontFamily: F.body, fontSize: 12.5, fontWeight: 700,
              }}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary, padding: '10px 0' }}>
          No units in this range.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 760 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: _UNITS_TABLE_COLUMNS, gap: 8,
              padding: '0 10px 8px', borderBottom: `1px solid ${C.cardBorder}`,
              fontFamily: F.body, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.03em',
              textTransform: 'uppercase', color: C.textTertiary,
            }}>
              <span>Unit #</span>
              <span>Bed &amp; Bath</span>
              <span>Sq Ft</span>
              <span>Available On</span>
              <span>Rent</span>
              <span>SD</span>
              <span />
            </div>
            {visible.map(u => (
              <div
                key={u.id}
                style={{
                  display: 'grid', gridTemplateColumns: _UNITS_TABLE_COLUMNS, gap: 8, alignItems: 'center',
                  padding: '12px 10px', borderBottom: `1px solid ${C.divider}`,
                  fontFamily: F.body, fontSize: 13, color: C.textPrimary,
                }}
              >
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {u.unitNumber || '—'}
                  {u.sample && (
                    <span style={{
                      display: 'inline-block', fontFamily: F.body, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.04em',
                      textTransform: 'uppercase', color: C.textTertiary, background: C.inputBg, borderRadius: 5, padding: '1px 5px',
                    }}>
                      Sample
                    </span>
                  )}
                </span>
                <span>{u.beds != null ? u.beds : '—'} Bed{u.beds === 1 ? '' : 's'} / {u.baths != null ? u.baths : '—'} Bath{u.baths === 1 ? '' : 's'}</span>
                <span>{u.sqft != null ? u.sqft : '—'}</span>
                <span>{_formatAvailableOn(u.availableOn)}</span>
                <span style={{ fontWeight: 700, color: C.primary }}>
                  {u.price != null ? `${money(u.price)}${listingType === 'RENT' ? '/mo' : ''}` : '—'}
                </span>
                <span>{u.securityDeposit != null ? money(u.securityDeposit) : '—'}</span>
                {/* Session 51, Phase 27 — sample (padding) rows aren't a
                    real Listing, so there's nothing for View Detail to
                    navigate to — disabled instead of hidden, so the row
                    still reads as a complete table row. */}
                {u.sample ? (
                  <span
                    title="Sample unit — no real listing to view"
                    style={{
                      justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 4,
                      color: C.textTertiary, fontFamily: F.body, fontWeight: 700, fontSize: 12,
                      opacity: 0.6, cursor: 'not-allowed',
                    }}
                  >
                    View Detail
                    <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
                  </span>
                ) : (
                  <button
                    onClick={() => onViewDetail(u)}
                    style={{
                      justifySelf: 'end', background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 12,
                    }}
                  >
                    View Detail
                    <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={() => setSeeMoreOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 12.5, textDecoration: 'none',
            }}
          >
            See More
          </button>
        </div>
      )}

      {/* Session 51, Phase 29 — user ask: the table's "View Detail"
          column was getting cut off, needing a horizontal scroll inside
          the popup, to see it. Root cause: the table itself needs at
          least ~760px of content width (sum of its 6 fixed columns +
          gaps + room for "View Detail"; see _UNITS_TABLE_COLUMNS), and
          UNModalShell's body padding takes another 44px, so the popup
          needs to be ≥~804px wide to avoid that scrollbar — on a lot of
          screens, half the viewport width (the original "50vw" ask)
          falls short of that. `max(860px, 50vw)` keeps "half the
          screen" as the target on wide screens, while guaranteeing at
          least 860px (comfortably above the ~804px floor) everywhere
          else; the filter tabs the user also asked for were already
          here — AvailableUnitsTable always renders its own All/1 Bed/
          2 Bed/3+ Bed tabs at the top, including when nested in this
          popup without `maxVisible`, as it is below.

          Session 51, Phase 31 — user ask: "increase the length and
          height of the popup by 15%". Width: both numbers in the
          formula above scaled ×1.15 (860→989, 50vw→57.5vw). Height:
          briefly tried an explicit minHeight (UNModalShell's optional
          `height` prop, still supported below for future use), but the
          user asked to revert — height stays as it was, shrink-wrapped
          to content, capped at `calc(100vh - 64px)`. */}
      {seeMoreOpen && (
        <UNModalShell
          title="Available Units"
          onClose={() => setSeeMoreOpen(false)}
          width="max(989px, 57.5vw)"
        >
          <AvailableUnitsTable units={real} listingType={listingType} onViewDetail={onViewDetail} showRangeFilters />
        </UNModalShell>
      )}
    </div>
  );
}

// Session 51, Phase 18 — single unified Listing Contact card (supersedes
// Phase 17's separate Contact card + the old price/CTA card's third
// button). Per the user's reviewed wireframe: Photo -> Name -> Org/role
// line -> Phone -> Email -> dotted divider -> three icon actions (Apply,
// Book Tour, Contact). Replaces BOTH the old "Starting at + Apply/Book/
// Connect" SectionCard and the separate Phase-17 "Contact" SectionCard —
// the sidebar is now this one box. Price/specs aren't duplicated here;
// they're already shown in the Name & Description card above (Phase 16).
//
// Photo fallback: ListingLeadSettings has no photo field until Phase 18
// (contact_photo_url, optional) — when a landlord/PM hasn't set one, this
// card shows a bundled sample photo instead of a blank circle or a
// fabricated-looking "real" photo passed off as the actual contact. Per
// explicit user direction this round, the sample photo carries NO visible
// "Sample" tag (unlike the floor-plan/ad placeholders elsewhere in this
// build) — it's simply the default avatar until a real one is on file.
// The embedded image itself is an AI-generated face (not a real,
// identifiable person), so there's no risk of a fabricated photo being
// mistaken for an actual landlord/agent even without the tag.
//
// Org/role line: contact_org_name when set; otherwise "Independent
// Agent" (contact_role === 'AGENT') or "Landlord" (contact_role ===
// 'LANDLORD', the model default) — exactly the three states reviewed in
// the wireframe.
//
// Apply / Book Tour stay disabled icon buttons (same "nothing real to
// route them to yet" reasoning as every other "Coming soon" affordance
// in this build — no application model, no booking system) — per
// explicit user direction this round, with no visible "Coming soon"
// label, just a disabled state and a native hover tooltip. Contact is
// real: a native tooltip plus a real mailto:/tel: handoff (mailto
// preferred when an email is on file, tel as the fallback), same honest
// external-link posture as this file's "Open in Google Maps" link and
// Phase 17's own Send-a-Message button.
const _SAMPLE_CONTACT_PHOTO_DATA_URI = 'data:image/jpeg;base64,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';

function _initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function _contactRoleLabel(contact) {
  if (contact.orgName) return contact.orgName;
  return contact.role === 'AGENT' ? 'Independent Agent' : 'Landlord';
}

const _disabledIconBtnStyle = {
  background: 'none', border: 'none', cursor: 'not-allowed',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 4,
};
const _disabledIconCircleStyle = {
  width: 44, height: 44, borderRadius: '50%', background: C.inputBg, border: `1px solid ${C.cardBorder}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6,
};

// `compact` (Session 51, Phase 22 — user ask: halve the height of the
// titular row Listing Agent now shares with Name & Description) renders
// the same real contact + the same three Apply/Book Tour/Contact CTAs in
// a much shorter horizontal layout (small photo + name/role/phone/email
// on one side, a tight row of icon-only CTAs below) instead of the
// original tall centered-stack layout. Default (compact=false) is
// UNCHANGED — ListingDetailPage.jsx's own sticky sidebar still gets the
// original full-height card, since only PropertyListingDetailPage.jsx's
// titular row asked for this.
export function ListingContactCard({ contact, listingTitle, compact = false, extraInfo = [], layout }) {
  if (!contact) {
    return (
      <div style={{
        border: `1px dashed ${C.cardBorder}`, borderRadius: 12, padding: '16px 14px',
        fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, textAlign: 'center',
      }}>
        No listing contact has been provided for this listing yet.
      </div>
    );
  }

  const mailHref = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(`Inquiry: ${listingTitle || 'your UrbanNest listing'}`)}`
    : null;
  const telHref = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : null;
  const contactHref = mailHref || telHref;
  const contactTooltip = mailHref
    ? `Email ${contact.name}`
    : telHref
      ? `Call ${contact.name}`
      : 'No contact method on file';

  // Session 51, Phase 33 — new `layout="sideBySide"` variant, per the
  // user's own ask for ListingDetailPage.jsx's new titular-row Listing
  // Agent card: contact info on top, Apply/Book Tour/Contact below it.
  // Opt-in via the new `layout` prop (undefined by default), so every
  // existing call site (both pages' other ListingContactCard usages)
  // renders exactly as before.
  //
  // Session 51, Phase 36 — the original version of this branch put the
  // CTAs to the right of the contact block on one row (`justifyContent:
  // 'space-between'`), but at this card's real rendered width that row
  // never actually had room for both at once — `flexWrap:'wrap'` (needed
  // so nothing overflowed) silently dropped the CTAs onto their own line
  // underneath, left-aligned by default, with no divider — not a
  // deliberate design, just what was left over once the intended one-row
  // layout didn't fit. The user's screenshot of that accidental result
  // asked for it to be cleaned up properly: a dotted divider between the
  // contact block and the CTAs (matching the same divider the `compact`/
  // full layouts below already use), the CTAs centered, and more breathing
  // room between them. This replaces the old accidental wrap with that
  // exact two-row layout on purpose.
  if (layout === 'sideBySide') {
    const sbCircleStyle = {
      width: 38, height: 38, borderRadius: '50%', background: C.inputBg, border: `1px solid ${C.cardBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, flexShrink: 0,
    };
    const sbBtnStyle = {
      background: 'none', border: 'none', cursor: 'not-allowed',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    };
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <img
            src={contact.photoUrl || _SAMPLE_CONTACT_PHOTO_DATA_URI}
            alt=""
            aria-hidden="true"
            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.cardBorder}`, flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap' }}>{contact.name}</span>
              <span style={{
                fontFamily: F.body, fontSize: 9, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
                color: C.textSecondary, background: C.inputBg, padding: '2px 7px', borderRadius: 20,
              }}>
                {_contactRoleLabel(contact)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5, fontFamily: F.body, fontSize: 12, color: C.textSecondary }}>
              {mailHref && <a href={mailHref} style={{ color: 'inherit', textDecoration: 'none', wordBreak: 'break-all' }}><i className="ti ti-mail" style={{ fontSize: 12 }} /> {contact.email}</a>}
              {telHref && <a href={telHref} style={{ color: 'inherit', textDecoration: 'none' }}><i className="ti ti-phone" style={{ fontSize: 12 }} /> {contact.phone}</a>}
              {!telHref && !mailHref && <span>No phone or email on file.</span>}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', borderTop: `2px dotted ${C.cardBorder}`, margin: '16px 0 14px' }} />

        <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
          <button disabled title="Apply Now — Coming soon" aria-label="Apply Now — Coming soon" style={sbBtnStyle}>
            <span style={sbCircleStyle}><i className="ti ti-file-text" style={{ fontSize: 16, color: C.textTertiary }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary }}>Apply</span>
          </button>
          <button disabled title="Book A Tour — Coming soon" aria-label="Book A Tour — Coming soon" style={sbBtnStyle}>
            <span style={sbCircleStyle}><i className="ti ti-calendar" style={{ fontSize: 16, color: C.textTertiary }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary }}>Book Tour</span>
          </button>
          {contactHref ? (
            <a href={contactHref} title={contactTooltip} aria-label={contactTooltip} style={{ textDecoration: 'none', ...sbBtnStyle, cursor: 'pointer' }}>
              <span style={{ ...sbCircleStyle, background: C.primary, border: 'none', opacity: 1 }}>
                <i className="ti ti-message-circle" style={{ fontSize: 16, color: C.white }} />
              </span>
              <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textPrimary }}>Contact</span>
            </a>
          ) : (
            <button disabled title="No contact method on file" aria-label="No contact method on file" style={sbBtnStyle}>
              <span style={sbCircleStyle}><i className="ti ti-message-circle" style={{ fontSize: 16, color: C.textTertiary }} /></span>
              <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary }}>Contact</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    const compactCtaStyle = {
      background: 'none', border: 'none', cursor: 'not-allowed',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1,
    };
    const compactCircleStyle = {
      width: 28, height: 28, borderRadius: '50%', background: C.inputBg, border: `1px solid ${C.cardBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6,
    };
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={contact.photoUrl || _SAMPLE_CONTACT_PHOTO_DATA_URI}
            alt=""
            aria-hidden="true"
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.cardBorder}`, flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap' }}>{contact.name}</span>
              <span style={{
                fontFamily: F.body, fontSize: 9, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
                color: C.textSecondary, background: C.inputBg, padding: '2px 7px', borderRadius: 20,
              }}>
                {_contactRoleLabel(contact)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 3, fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, flexWrap: 'wrap' }}>
              {telHref && <a href={telHref} style={{ color: 'inherit', textDecoration: 'none' }}><i className="ti ti-phone" style={{ fontSize: 11 }} /> {contact.phone}</a>}
              {mailHref && <a href={mailHref} style={{ color: 'inherit', textDecoration: 'none', wordBreak: 'break-all' }}><i className="ti ti-mail" style={{ fontSize: 11 }} /> {contact.email}</a>}
              {!telHref && !mailHref && <span>No phone or email on file.</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 10 }}>
          <button disabled title="Apply Now — Coming soon" aria-label="Apply Now — Coming soon" style={compactCtaStyle}>
            <span style={compactCircleStyle}><i className="ti ti-file-text" style={{ fontSize: 13, color: C.textTertiary }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textTertiary }}>Apply</span>
          </button>
          <button disabled title="Book A Tour — Coming soon" aria-label="Book A Tour — Coming soon" style={compactCtaStyle}>
            <span style={compactCircleStyle}><i className="ti ti-calendar" style={{ fontSize: 13, color: C.textTertiary }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textTertiary }}>Book Tour</span>
          </button>
          {contactHref ? (
            <a href={contactHref} title={contactTooltip} aria-label={contactTooltip} style={{ textDecoration: 'none', ...compactCtaStyle, cursor: 'pointer' }}>
              <span style={{ ...compactCircleStyle, background: C.primary, border: 'none', opacity: 1 }}>
                <i className="ti ti-message-circle" style={{ fontSize: 13, color: C.white }} />
              </span>
              <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textPrimary }}>Contact</span>
            </a>
          ) : (
            <button disabled title="No contact method on file" aria-label="No contact method on file" style={compactCtaStyle}>
              <span style={compactCircleStyle}><i className="ti ti-message-circle" style={{ fontSize: 13, color: C.textTertiary }} /></span>
              <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textTertiary }}>Contact</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        src={contact.photoUrl || _SAMPLE_CONTACT_PHOTO_DATA_URI}
        alt=""
        aria-hidden="true"
        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.cardBorder}` }}
      />
      <div style={{ fontFamily: F.body, fontSize: 16, fontWeight: 700, color: C.textPrimary, marginTop: 12 }}>
        {contact.name}
      </div>
      <div style={{
        fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: C.textSecondary, background: C.inputBg,
        padding: '4px 11px', borderRadius: 20, marginTop: 5,
      }}>
        {_contactRoleLabel(contact)}
      </div>

      {/* Session 51, Phase 25 — user ask: when this card stands alone in
          a taller right-hand column, fill the added height with "a few
          lines related to the listing agent" — real, derived facts only
          (never an invented bio/rating/years-experience, since nothing
          like that exists on the contact record), passed in by the
          caller via `extraInfo`. Empty/omitted by default, so
          ListingDetailPage.jsx's own (unrelated, sidebar) usage renders
          exactly as before. */}
      {extraInfo.length > 0 && (
        <div style={{ marginTop: 12, width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {extraInfo.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: F.body, fontSize: 12, color: C.textSecondary, textAlign: 'center' }}>
              {line.icon && <i className={`ti ${line.icon}`} style={{ fontSize: 13, flexShrink: 0 }} />}
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {telHref && (
          <a href={telHref} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <i className="ti ti-phone" style={{ fontSize: 14, color: C.textSecondary }} />
            <span style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary }}>{contact.phone}</span>
          </a>
        )}
        {mailHref && (
          <a href={mailHref} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <i className="ti ti-mail" style={{ fontSize: 14, color: C.textSecondary }} />
            <span style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary, wordBreak: 'break-all' }}>{contact.email}</span>
          </a>
        )}
        {!telHref && !mailHref && (
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, textAlign: 'center' }}>No phone or email on file.</div>
        )}
      </div>

      <div style={{ width: '100%', borderTop: `2px dotted ${C.cardBorder}`, margin: '18px 0 14px' }} />

      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        <button disabled title="Apply Now — Coming soon" aria-label="Apply Now — Coming soon" style={_disabledIconBtnStyle}>
          <span style={_disabledIconCircleStyle}>
            <i className="ti ti-file-text" style={{ fontSize: 18, color: C.textTertiary }} />
          </span>
          <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.textTertiary }}>Apply</span>
        </button>

        <button disabled title="Book A Tour — Coming soon" aria-label="Book A Tour — Coming soon" style={_disabledIconBtnStyle}>
          <span style={_disabledIconCircleStyle}>
            <i className="ti ti-calendar" style={{ fontSize: 18, color: C.textTertiary }} />
          </span>
          <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.textTertiary }}>Book Tour</span>
        </button>

        {contactHref ? (
          <a href={contactHref} title={contactTooltip} aria-label={contactTooltip} style={{
            textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 4,
          }}>
            <span style={{
              width: 44, height: 44, borderRadius: '50%', background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-message-circle" style={{ fontSize: 18, color: C.white }} />
            </span>
            <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.textPrimary }}>Contact</span>
          </a>
        ) : (
          <button disabled title="No contact method on file" aria-label="No contact method on file" style={_disabledIconBtnStyle}>
            <span style={_disabledIconCircleStyle}>
              <i className="ti ti-message-circle" style={{ fontSize: 18, color: C.textTertiary }} />
            </span>
            <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.textTertiary }}>Contact</span>
          </button>
        )}
      </div>
    </div>
  );
}
