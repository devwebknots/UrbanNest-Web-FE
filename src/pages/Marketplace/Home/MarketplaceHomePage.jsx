// src/pages/Marketplace/Home/MarketplaceHomePage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Marketplace homepage (public, consumer-facing).
// Route: /marketplace (no auth, no portal nav — same "public page" pattern
// as VerifyOwnershipPage.jsx, see App.js).
//
// Session 50 — FE-first build against mock data, reviewed against the real
// backend first (see listings/Marketplace_Listing_Design_Review.md Rounds
// 1–2 for the prior review of this same screen, and this session's own
// evaluation). No public marketplace API exists yet — every section here
// reads from mockMarketplaceData.js, shaped to match the real `Listing`/
// `PropertyListing`/`Property` models as closely as possible so wiring a
// real endpoint later is a swap, not a rewrite. See that file's header for
// the field-by-field mapping.
//
// Scope of this pass (confirmed with the user before building): homepage
// screen only, logged-OUT nav state only — no Wishlist/Notifications/
// Profile swap, no real search/results page, no listing-detail page. Two
// corrections made vs. the originally-reviewed Figma, both already flagged
// in the design review and resolved here rather than carried forward as a
// known bug:
//   1. "Room Configuration: 03 Bhk" → "Bedrooms" control backed by the real
//      Unit.UNIT_TYPE_CHOICES values (studio/1br/2br/.../4br_plus) instead
//      of a BHK concept that doesn't exist anywhere in the backend.
//   2. Category `value`s are real Property.PROPERTY_TYPE_CHOICES strings;
//      only the display labels ("Single Family" etc.) are consumer copy —
//      same machine-value/human-label split the backend already uses
//      everywhere else, not a mismatch.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from '../../../components/ui/CustomDropdown';
import { C, F } from './marketplaceTokens';
import {
  CATEGORIES,
  BEDROOM_OPTIONS,
  RENT_RANGE_OPTIONS,
  LOCATION_OPTIONS,
  // Session 50, Phase 2: these two are now the SAMPLE fallback only — real
  // data comes from the new public /api/marketplace/display/<section>/
  // endpoint (see the fetch-and-pad effect below). Renamed on import so the
  // rest of this file's many EXCLUSIVE_LISTINGS/NEARBY_LISTINGS references
  // (carousel indexing, .length checks, etc.) keep working unchanged against
  // the new state variables of the same name declared below, rather than
  // renaming every call site in this 1000+ line file.
  EXCLUSIVE_LISTINGS as SAMPLE_EXCLUSIVE_LISTINGS,
  NEARBY_LISTINGS as SAMPLE_NEARBY_LISTINGS,
  PROPERTY_GUIDES,
  POPULAR_CITIES,
} from './mockMarketplaceData';
import { apiGetMarketplaceDisplay, apiSearchMarketplace } from './marketplaceHomeApi';
// Session 51, Phase 3 — the public Marketplace's first real auth wiring
// (see this session's own AskUserQuestion decision: reuse the existing
// /login flow + auto-assign RENTER persona, rather than a dedicated renter
// sign-in modal or anonymous/localStorage-only favorites). MarketplaceHomePage
// already sits inside <AuthProvider> (App.js), so no new context/provider
// plumbing is needed — just this import.
import { useAuth } from '../../../context/AuthContext';
import { apiListFavorites, apiAddFavorite, apiRemoveFavorite, apiCreateSavedSearch } from '../Account/marketplaceAccountApi';

// Account-menu dropdown (nav icon to the right of Sign In) — Session 50
// addition. No real account/auth-aware nav exists on this public page yet
// (scope is logged-OUT only, see the file-header note above), so every
// entry here is a dummy placeholder option per request, not a real route —
// same honest-no-op convention as handleAdvertiseClick etc. below. Kept as
// plain string lists (not objects) since none of them need a distinct
// handler yet; Sign In / Register are the two exceptions since real routes
// for those already exist elsewhere on this page.
const ACCOUNT_MENU_BROWSE = [
  'Buy', 'Rent', 'Sell', 'Agent Directory', 'Neighborhood Search',
  'School Search', 'Condo Building Search', 'New Homes/New Construction',
];
// Session 51 correction — Saved Search is no longer a user-facing feature
// at all: it's an invisible, internal-only capture used (eventually) for
// things like match notifications, never something a Renter opens or
// manages themselves. Deliberately left out of this list, unlike Favorites
// (still the one deliberate, user-visible save). See
// marketplace_account/models.py's own note on this distinction.
const ACCOUNT_MENU_PERSONAL = [
  'Favorites', 'Notes', 'Suggestions', 'Agent and Co-Shopper',
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=700&fit=crop',
];


// "Most Exclusive Homes" card sizing — kept in lockstep with "Rentals Near
// You"'s own cards per request, rather than the two sections picking
// unrelated sizes independently.
// WIDTH: "Rentals Near You"'s grid is 4 columns in the same 48px-padded
// container, gap 20 (3 gaps = 60px) — so one of its cards is exactly
// `(100% - 60px) / 4` wide. Expressed as a calc() string (not a fixed px
// guess) so it stays responsive and automatically keeps the same left/
// right padding as that section at any viewport width — this is also what
// fixes the earlier bug where the carousel bled past the page edges: it
// was sized independently of its container instead of relative to it.
// HEIGHT: unlike width, "Rentals Near You" cards have a fixed-height photo
// (160px) + a roughly-constant text block regardless of viewport, so a
// calc() isn't meaningful here — EXCLUSIVE_CENTER_H below is a plain
// number derived from that ~245px reference instead.
const NEARBY_CARD_WIDTH_CALC = '(100% - 60px) / 4';
const EXCLUSIVE_CENTER_W = `calc(${NEARBY_CARD_WIDTH_CALC} * 1.3)`; // 30% bigger than a Rentals card, per request
const EXCLUSIVE_SIDE_W = `calc(${NEARBY_CARD_WIDTH_CALC} * 1.17)`; // 1.3 × 0.9 — the existing "sides are 10% smaller than center" rule, carried over
const NEARBY_CARD_HEIGHT_APPROX = 245; // ~160px photo + ~85px text block (Exclusive-carousel sizing only — the Rentals Near You card itself is auto-height and has since grown taller with the address block; this constant is intentionally left as-is so that addition doesn't also inflate the unrelated Exclusive cards)
const EXCLUSIVE_CENTER_H = Math.round(NEARBY_CARD_HEIGHT_APPROX * 1.3);
const EXCLUSIVE_SIDE_H = Math.round(EXCLUSIVE_CENTER_H * 0.9);

// "Resources & Guides" featured-card height — the 3 stacked list cards on
// the right stretch to match this automatically (flex default
// align-items: stretch on their shared row), so this one number is the
// only sizing knob for that whole section.
const GUIDE_FEATURED_H = 420;

// Session 51 bug fix — formatPrice(null) threw (`Cannot read properties of
// null (reading 'toLocaleString')`), crashing the whole Marketplace page.
// Hit via FavoritesModal: marketplace_account/serializers.py's
// `_current_listing_card()` deliberately sends `priceAmount: null` for a
// favorited grouped PropertyListing ("a group's price is a range — not
// needed for a favorites-list card"), a real, expected case this function
// never guarded against. Every other call site in this file only ever
// passes a single Listing's real numeric price, so they're unaffected —
// this null-safety is specifically for that one grouped-favorite path.
function formatPrice(amount) {
  return amount == null ? null : amount.toLocaleString('en-US');
}

// Session 51 — user-reported layout bug: a long Property/Unit title (e.g.
// "Horizon Commons — 1 to 3 Bedroom Residences") wrapped the Rentals Near
// You card's title onto 2–3 lines, pushing the rest of the card's content
// down and breaking the grid's even card heights. Caps the *character*
// count rather than relying on CSS line-clamp alone, per the user's
// explicit ask ("limited to 15 characters") — the `textOverflow: ellipsis`
// + `whiteSpace: nowrap` + `overflow: hidden` combo on the title div below
// is a belt-and-suspenders backstop for the rare title that's short in
// character count but still wide in rendered pixels (e.g. all-caps/wide
// glyphs), so a 2nd line can never appear even in that edge case.
const CARD_TITLE_MAX_CHARS = 15;
function truncateTitle(title, max = CARD_TITLE_MAX_CHARS) {
  if (!title) return title;
  return title.length > max ? `${title.slice(0, max).trimEnd()}…` : title;
}

// ── Small presentational pieces ────────────────────────────────────────────

function PromoRibbon({ text }) {
  if (!text) return null;
  const isExclusive = text === 'Exclusive';
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12,
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 20,
      background: isExclusive ? C.accentGoldBg : C.premiumBg,
      color: isExclusive ? C.accentGold : C.premiumText,
      fontFamily: F.body, fontSize: 11, fontWeight: 700,
      letterSpacing: 0.2,
    }}>
      <i className="ti ti-star-filled" style={{ fontSize: 11 }} />
      {text}
    </div>
  );
}

// Same "Sample Data" watermark convention already used in
// PMListingsOverview.jsx's <SampleTag> (UN Admin/PMS) — marks a card that
// got padded in from mockMarketplaceData.js because the real ranking
// endpoint came back short (see the data-fetch effect above). Placed
// opposite PromoRibbon (top-left) so the two badges never collide on a
// real-but-promoted card — though in practice a padded card is always
// sample, never both.
function SampleBadge() {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 5,
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 9px', borderRadius: 20,
      background: C.sampleTagBg, border: `1px solid ${C.sampleTagBdr}`,
      fontFamily: F.body, fontSize: 10, fontWeight: 800, color: C.sampleTag,
      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      <i className="ti ti-flask" style={{ fontSize: 11 }} />
      Sample
    </div>
  );
}

// Heart-icon favorite toggle, shared by both card types (the Exclusive
// carousel and NearbyRow). Session 51, Phase 3 — see marketplace_account's
// own design note: a Favorite always FKs the underlying Unit/Property
// asset, never the ephemeral Listing/PropertyListing row, which is why this
// reads listing.unitId/listing.propertyId (added to public_views.py's card
// serializers this same pass) rather than listing.id. A mock/sample-padded
// card (listing.__sample) never carries those fields, so this renders
// nothing for one — nothing real exists yet to favorite — same slot
// SampleBadge uses (top-left) since the two conditions are mutually
// exclusive on any given card.
function FavoriteHeart({ listing, favoriteKeys, onToggle }) {
  const key = listing.unitId != null
    ? `unit:${listing.unitId}`
    : listing.propertyId != null
      ? `property:${listing.propertyId}`
      : null;
  if (listing.__sample || !key) return null;
  const isFav = favoriteKeys.has(key);
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(listing); }}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      style={{
        position: 'absolute', top: 12, left: 12, zIndex: 6,
        width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'rgba(255,255,255,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      }}
    >
      <i className={isFav ? 'ti ti-heart-filled' : 'ti ti-heart'} style={{ fontSize: 16, color: isFav ? '#E11D48' : C.textTertiary }} />
    </button>
  );
}

// Session 51, Phase 5 — kept to a single line always; the old version
// wrapped onto a second line whenever sqft rendered as a range
// ("650.0-1250.0 Sq Ft" on a PropertyListing group card), which pushed the
// rest of the card down unevenly from card to card. Bed/Bath stay fully
// visible (they're almost never long enough to need it) and Sq Ft — the
// one that actually runs long — truncates with an ellipsis instead of
// wrapping, with a native title tooltip on the whole row carrying the
// untruncated text, same "title attribute for the overflow case" pattern
// already used on the card's address line just below this.
function SpecRow({ beds, baths, sqft }) {
  return (
    <div
      title={`${beds} Bed · ${baths} Bath · ${sqft} Sq Ft`}
      style={{
        display: 'flex', gap: 14, marginTop: 6, fontFamily: F.body, fontSize: 12.5, color: C.textSecondary,
        flexWrap: 'nowrap', overflow: 'hidden',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
        <i className="ti ti-bed" />{beds} Bed
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
        <i className="ti ti-bath" />{baths} Bath
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <i className="ti ti-ruler-2" style={{ flexShrink: 0 }} />{sqft} Sq Ft
      </span>
    </div>
  );
}

// Favorites filter dropdown — module scope since it's a static list, same
// convention as the other *_OPTIONS constants imported from
// mockMarketplaceData.js, just local to this modal rather than shared.
// `card.listingType` only exists on a favorite whose asset is currently
// actively listed (see _current_listing_card() in serializers.py) — a
// "Not currently listed" favorite has no listingType at all, so it's
// excluded whenever a real RENT/SALE filter is active (nothing to match
// against) and only shown under "All".
const FAVORITES_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'RENT', label: 'For Rent' },
  { value: 'SALE', label: 'For Sale' },
];

// ── Search Results modal (Session 51, Phase 4) — see marketplace/
// Marketplace_Search_Results_Design_Review.md for the review this
// implements, and that doc's "Decided" log for exactly which filters are
// in v1 vs. parked. All real, hardcoded-options constants below follow the
// same convention CATEGORIES/BEDROOM_OPTIONS/RENT_RANGE_OPTIONS already
// use (plain arrays imported from mockMarketplaceData.js) — no public
// catalog endpoint exists for any of these, and none is needed for a fixed
// list like this.

// Full Unit.UNIT_TYPE_CHOICES (properties/models.py) — mockMarketplaceData.js's
// own BEDROOM_OPTIONS comment says explicitly that it only surfaces 5 of
// these for the homepage quick-filter and the rest "stay available on the
// full search/results page once it's built" — this is that page.
const SEARCH_BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 Bed' },
  { value: '2br', label: '2 Bed' },
  { value: '3br', label: '3 Bed' },
  { value: '4br_plus', label: '4+ Bed' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'student_room', label: 'Student Room' },
  { value: 'serviced', label: 'Serviced Unit' },
  { value: 'commercial', label: 'Commercial Unit' },
];

const SEARCH_BATHROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
];

// Real seeded AmenityMaster rows (core/amenities/models.py +
// seed_amenities.py) — a representative subset relevant to a renter/buyer
// search, not every row in that table. Matched by name on the backend
// (ranking.py's _search_matches_amenities). Deliberately the REAL seeded
// labels, not the design reference's own ("Pet Friendly"/"On-site
// Parking"/"In-Unit Laundry"/"Apartment Community") — the seeded catalog's
// closest equivalents are "Pet Friendly" (exact), "Parking", "Washer /
// Dryer", and "Laundry Room"; "Apartment Community" has no real
// equivalent and is left out rather than invented. See the design
// review's §2 flag on this exact gap.
const SEARCH_AMENITY_OPTIONS = [
  'Pet Friendly', 'Parking', 'Washer / Dryer', 'Laundry Room',
  'Swimming Pool', 'Gym', 'Elevator / Lift', 'Security', 'WiFi', 'Furnished',
];

// Decided Session 51 — no new backend field. "Virtual Tour" reuses the
// existing Listing.virtual_tour_url; "On-Site Tour" is true by default for
// every eligible listing (see ranking.py's own note on this).
const SEARCH_TOUR_METHOD_OPTIONS = [
  { value: 'VIRTUAL', label: 'Virtual Tour' },
  { value: 'ON_SITE', label: 'On-Site Tour' },
];

const SEARCH_TIME_ON_URBANNEST_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'LAST_24H', label: 'Last 24 hours' },
  { value: 'LAST_7D', label: 'This week' },
  { value: 'LAST_30D', label: 'This month' },
];

const SEARCH_PAGE_SIZE = 20;
const SEARCH_FILTER_DEBOUNCE_MS = 400;

// Session 51, Phase 5 — Price/Home-Size filters restyled as a histogram
// range slider per the user's reference design. The bar heights below are
// a DECORATIVE silhouette only (same "layout/visual reference, not real
// data" posture this doc's own design review already took toward the
// mockup in §1) — there's no endpoint returning a real price/sqft
// distribution to drive this from, so no backend change was made for it.
// What IS real and live: which bars render as selected (blue) vs.
// unselected (gray) — that's computed every render from the slider's
// actual current min/max, same as a real "selected range" histogram would.
const RANGE_HISTOGRAM_SHAPE = [
  0.06, 0.11, 0.19, 0.29, 0.22, 0.31, 0.44, 0.60, 0.80, 0.94,
  1.00, 0.89, 0.81, 0.73, 0.63, 0.51, 0.39, 0.27, 0.17, 0.08,
];

// priceRange is sent to the backend as the exact same 'lo-hi' / 'lo-'
// string format ranking.py's _search_matches_price already parses
// (previously only ever produced by picking one of RENT_RANGE_OPTIONS'
// fixed buckets) — so driving it from a free-form numeric slider instead
// needed zero backend changes, just a different way of building the same
// string on the frontend.
function parsePriceRangeValue(value, boundLo, boundHi) {
  if (!value) return [boundLo, boundHi];
  const [loStr, hiStr] = value.split('-');
  const lo = loStr === '' || loStr === undefined ? boundLo : Number(loStr);
  const hi = hiStr === '' || hiStr === undefined ? boundHi : Number(hiStr);
  return [Number.isFinite(lo) ? lo : boundLo, Number.isFinite(hi) ? hi : boundHi];
}
function buildPriceRangeString(lo, hi, boundLo, boundHi) {
  const loC = Math.max(boundLo, Math.min(lo, hi));
  const hiC = Math.min(boundHi, Math.max(lo, hi));
  if (loC <= boundLo && hiC >= boundHi) return ''; // full range = "Any price", same as before
  if (hiC >= boundHi) return `${loC}-`; // open-ended top bucket, same shape as RENT_RANGE_OPTIONS' '5000-'
  return `${loC}-${hiC}`;
}

// Slider bounds — chosen to span RENT_RANGE_OPTIONS' own $0–$5,000+ span
// (mockMarketplaceData.js) so "drag all the way to the top" means the same
// open-ended "$5,000+" the old dropdown's last bucket meant; reused as-is
// for Buy/Sale too, same as the dropdown it replaces already did (not a
// new gap introduced here). Home Size has no existing bucket list to
// anchor to, so 0–5,000 sqft / 50 sqft steps was picked as a reasonable
// real-estate range.
const PRICE_SLIDER_MIN = 0;
const PRICE_SLIDER_MAX = 5000;
const PRICE_SLIDER_STEP = 50;
const SQFT_SLIDER_MIN = 0;
const SQFT_SLIDER_MAX = 5000;
const SQFT_SLIDER_STEP = 50;

function emptySearchFilters(seed) {
  return {
    listingMode: seed?.listingMode || 'RENT',
    location: seed?.location || '',
    priceRange: seed?.priceRange || '',
    propertyType: seed?.propertyType || '',
    bedrooms: seed?.bedrooms || '',
    bathsMin: '',
    sqftMin: '',
    sqftMax: '',
    amenities: [],
    tourMethod: [],
    timeOnUrbanNest: '',
    // Session 51, Phase 10 — the new free-text search bar ('q': "search
    // using home name, address, anything", the user's own words) and the
    // map pane's rectangle-drag/circle-drop area select ('mapBounds'/
    // 'mapCircle' — see MapPane/ranking.py's own header comments). Plain
    // strings, same shape every other filter here already uses; empty
    // means "no filter", same convention as priceRange's own ''.
    q: seed?.q || '',
    mapBounds: '',
    mapCircle: '',
  };
}

// Session 51, Phase 10 — dynamically loads Leaflet (JS + CSS) from a CDN
// the first time the Search modal's map pane mounts, rather than adding it
// as an npm dependency: this session's device bridge only has this repo's
// src/ folder connected, not its package.json, so a real `npm install`
// isn't something this session can do on the user's behalf. Leaflet +
// OpenStreetMap tiles need no API key or billing account either way (the
// reason this library was picked over Google Maps — see ranking.py's own
// comment on that decision), so a CDN script tag is both the only option
// reachable from here and a perfectly normal way to ship it. Cached as a
// module-level promise so re-opening the Search modal, or any future
// second map elsewhere on the site, only ever fetches it once per page
// load.
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

// Session 51, Phase 10 — the Search modal's new map pane, per the user's
// own request ("a section/capability to display the location map and
// pinpoint/select the area of interest") modeled after the Zillow
// reference screenshot's split map/list layout. Real pins from each
// result card's own latitude/longitude (the new fields public_views.py's
// card serializers now return, masked by show_exact_address exactly like
// every other address field — a card with no coordinate just has no pin,
// never a guessed one). Area selection is a simple rectangle-drag or
// circle-drop (the user's own choice over a full freehand polygon tool,
// matching Zillow's "Remove Boundary" in spirit, not pixel-for-pixel) —
// drawn with plain Leaflet mouse-event + latlng math, no separate
// Leaflet.draw plugin, one fewer thing to load from a CDN for a fairly
// small interaction.
function MapPane({ results, onCardClick, areaMode, onAreaModeChange, onAreaSelect, onAreaClear, hasArea }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const drawLayerRef = useRef(null);
  const drawStateRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(L => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView([39.5, -98.35], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      drawLayerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!ready || !window.L || !markersLayerRef.current) return;
    const L = window.L;
    markersLayerRef.current.clearLayers();
    const pins = results.filter(r => r.latitude != null && r.longitude != null);
    pins.forEach(card => {
      const marker = L.circleMarker([card.latitude, card.longitude], {
        radius: 9, weight: 2, color: '#FFFFFF', fillColor: C.primary, fillOpacity: 1,
      }).addTo(markersLayerRef.current);
      marker.bindTooltip(
        `$${formatPrice(card.priceAmount)}${card.priceUnit === 'sale' ? '' : '/mo'}`,
        { direction: 'top', offset: [0, -8] },
      );
      marker.on('click', () => onCardClick(card));
    });
    // Fit to markers only when there's no active manual area filter —
    // once the renter has drawn their own area, their chosen view should
    // stick instead of snapping back to "fit all results" on every
    // refetch the debounced search effect triggers.
    if (!hasArea && pins.length > 0) {
      const bounds = L.latLngBounds(pins.map(c => [c.latitude, c.longitude]));
      mapRef.current.fitBounds(bounds.pad(0.25), { maxZoom: 13 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, results, hasArea]);

  useEffect(() => {
    if (!ready || !window.L || !mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;
    const container = map.getContainer();

    if (!areaMode) {
      container.style.cursor = '';
      map.dragging.enable();
      return;
    }
    container.style.cursor = 'crosshair';
    map.dragging.disable();

    function onDown(e) {
      drawStateRef.current = { start: e.latlng };
      drawLayerRef.current.clearLayers();
    }
    function onMove(e) {
      if (!drawStateRef.current) return;
      drawLayerRef.current.clearLayers();
      const { start } = drawStateRef.current;
      if (areaMode === 'rectangle') {
        L.rectangle(L.latLngBounds(start, e.latlng), { color: C.primary, weight: 2, fillOpacity: 0.12 }).addTo(drawLayerRef.current);
      } else {
        L.circle(start, { radius: start.distanceTo(e.latlng), color: C.primary, weight: 2, fillOpacity: 0.12 }).addTo(drawLayerRef.current);
      }
    }
    function onUp(e) {
      if (!drawStateRef.current) return;
      const { start } = drawStateRef.current;
      drawStateRef.current = null;
      if (areaMode === 'rectangle') {
        const b = L.latLngBounds(start, e.latlng);
        onAreaSelect({ mapBounds: `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`, mapCircle: '' });
      } else {
        const radiusKm = start.distanceTo(e.latlng) / 1000;
        onAreaSelect({ mapBounds: '', mapCircle: `${start.lat},${start.lng},${radiusKm}` });
      }
      onAreaModeChange(null);
    }

    map.on('mousedown', onDown);
    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
    return () => {
      map.off('mousedown', onDown);
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      container.style.cursor = '';
      map.dragging.enable();
    };
  }, [ready, areaMode, onAreaSelect, onAreaModeChange]);

  // Clear the drawn overlay whenever the area filter is cleared from
  // outside the map itself (e.g. the sidebar's "Clear all filters").
  useEffect(() => {
    if (ready && !hasArea && drawLayerRef.current) drawLayerRef.current.clearLayers();
  }, [ready, hasArea]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: C.inputBg, borderRadius: 10, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 1000,
        display: 'flex', gap: 6, background: C.white, padding: 5, borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}>
        {[{ key: 'rectangle', icon: 'ti-square', label: 'Draw area' }, { key: 'circle', icon: 'ti-circle', label: 'Draw radius' }].map(tool => (
          <button
            key={tool.key}
            onClick={() => onAreaModeChange(areaMode === tool.key ? null : tool.key)}
            title={tool.label}
            style={{
              width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: areaMode === tool.key ? C.primary : C.inputBg,
              color: areaMode === tool.key ? C.white : C.textSecondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className={`ti ${tool.icon}`} style={{ fontSize: 15 }} />
          </button>
        ))}
        {hasArea && (
          <button
            onClick={onAreaClear}
            title="Remove boundary"
            style={{
              height: 30, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 11.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 12 }} /> Remove boundary
          </button>
        )}
      </div>
      {areaMode && (
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
          background: 'rgba(15,23,42,0.75)', color: C.white, fontFamily: F.body, fontSize: 11.5,
          padding: '6px 10px', borderRadius: 6,
        }}>
          Click and drag on the map to draw {areaMode === 'rectangle' ? 'an area' : 'a radius'}
        </div>
      )}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F.body, fontSize: 13, color: C.textTertiary,
        }}>
          Loading map…
        </div>
      )}
    </div>
  );
}

function CheckboxGroup({ label, options, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {options.map(opt => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const text = typeof opt === 'string' ? opt : opt.label;
          const checked = selected.includes(value);
          return (
            <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: F.body, fontSize: 13, color: C.textSecondary }}>
              <input type="checkbox" checked={checked} onChange={() => onToggle(value)} style={{ width: 14, height: 14, cursor: 'pointer' }} />
              {text}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// Session 51, Phase 5 — dual-handle histogram range slider, per the user's
// reference design (replaces the old Price dropdown + plain Home Size
// Min/Max inputs). Two overlapping native <input type="range"> elements
// drive the actual dragging/keyboard behavior (the standard cross-browser
// dual-thumb-slider technique — their own thumbs are made invisible via
// the .un-range-thumb rule injected once in SearchResultsModal below,
// pointer-events left on so they're still what actually receives the
// drag); the visible blue circle+chevron handles are purely decorative
// overlays kept in sync with the real values on every render.
function HistogramRangeSlider({ label, sublabel, min, max, step, valueMin, valueMax, onChangeMin, onChangeMax }) {
  const safeMin = Math.min(valueMin, valueMax);
  const safeMax = Math.max(valueMin, valueMax);
  const pctMin = ((safeMin - min) / (max - min)) * 100;
  const pctMax = ((safeMax - min) / (max - min)) * 100;

  const trackInputStyle = {
    WebkitAppearance: 'none', appearance: 'none',
    position: 'absolute', left: 0, right: 0, top: 0, width: '100%', height: '100%',
    margin: 0, background: 'transparent', pointerEvents: 'none',
  };

  function onMinInput(e) {
    const v = Math.min(Number(e.target.value), safeMax - step);
    onChangeMin(Math.max(min, v));
  }
  function onMaxInput(e) {
    const v = Math.max(Number(e.target.value), safeMin + step);
    onChangeMax(Math.min(max, v));
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</div>
        {sublabel && (
          <div style={{ fontFamily: F.body, fontSize: 9.5, color: C.textTertiary, textAlign: 'right', lineHeight: 1.35, flex: '1 1 auto', minWidth: 0 }}>
            {sublabel}
          </div>
        )}
      </div>

      {/* Histogram — see RANGE_HISTOGRAM_SHAPE's own comment: decorative
          silhouette, real selected/unselected coloring */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 42, marginBottom: 8 }}>
        {RANGE_HISTOGRAM_SHAPE.map((h, i) => {
          const barValue = min + ((i + 0.5) / RANGE_HISTOGRAM_SHAPE.length) * (max - min);
          const selected = barValue >= safeMin && barValue <= safeMax;
          return (
            <div
              key={i}
              style={{
                flex: 1, height: `${Math.max(h * 100, 7)}%`,
                background: selected ? C.primary : '#E2E8F0',
                borderRadius: '2px 2px 0 0',
                transition: 'background 120ms ease',
              }}
            />
          );
        })}
      </div>

      {/* Track + dual thumbs */}
      <div style={{ position: 'relative', height: 24, marginBottom: 12 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: '#E2E8F0', borderRadius: 2, transform: 'translateY(-50%)' }} />
        <div style={{
          position: 'absolute', top: '50%', height: 3, background: C.primary, opacity: 0.8, borderRadius: 2, transform: 'translateY(-50%)',
          left: `${pctMin}%`, width: `${Math.max(pctMax - pctMin, 0)}%`,
        }} />

        <input
          className="un-range-thumb" type="range" min={min} max={max} step={step}
          value={safeMin} onChange={onMinInput} style={{ ...trackInputStyle, zIndex: 3 }}
          aria-label={`${label} minimum`}
        />
        <input
          className="un-range-thumb" type="range" min={min} max={max} step={step}
          value={safeMax} onChange={onMaxInput} style={{ ...trackInputStyle, zIndex: 4 }}
          aria-label={`${label} maximum`}
        />

        {[{ pct: pctMin, icon: 'ti-chevron-left' }, { pct: pctMax, icon: 'ti-chevron-right' }].map((h, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', left: `${h.pct}%`, top: '50%', transform: 'translate(-50%, -50%)',
              width: 22, height: 22, borderRadius: '50%', background: C.primary, opacity: 0.8, border: '3px solid #fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <i className={`ti ${h.icon}`} style={{ fontSize: 10, color: '#fff' }} />
          </div>
        ))}
      </div>

      {/* Min / Max numeric readout + direct entry */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginBottom: 4 }}>Min</div>
          <input
            type="number" min={min} max={safeMax} step={step} value={safeMin}
            onChange={e => onChangeMin(Math.max(min, Math.min(Number(e.target.value) || min, safeMax)))}
            style={{ width: '100%', height: 34, boxSizing: 'border-box', padding: '0 10px', borderRadius: 6, border: `1px solid ${C.inputBorder}`, background: C.inputBg, fontFamily: F.body, fontSize: 13, color: C.textPrimary, outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginBottom: 4 }}>Max</div>
          <input
            type="number" min={safeMin} max={max} step={step} value={safeMax}
            onChange={e => onChangeMax(Math.min(max, Math.max(Number(e.target.value) || max, safeMin)))}
            style={{ width: '100%', height: 34, boxSizing: 'border-box', padding: '0 10px', borderRadius: 6, border: `1px solid ${C.inputBorder}`, background: C.inputBg, fontFamily: F.body, fontSize: 13, color: C.textPrimary, outline: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

// Session 51, Phase 4 — the real search/results experience, decided in
// review to open as an in-page pop-up/modal (same pattern as
// FavoritesModal above), NOT a routed page — no /marketplace/search route.
// Sized to at least 90% of screen space in both dimensions (bigger than
// FavoritesModal's 60vw/50vh-min — this view needs room for a filter
// sidebar plus a results grid, not just a single-column list). Closing it
// returns to the homepage exactly as it was, same "no back button, just
// close the popup" convention FavoritesModal already established.
function SearchResultsModal({ open, seedFilters, onClose, onCardClick, favoriteKeys, onToggleFavorite }) {
  const [filters, setFilters] = useState(() => emptySearchFilters(seedFilters));
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(null); // null = not loaded yet
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Session 51, Phase 10 — which draw tool (if any) is active on the map
  // pane. Kept here rather than inside MapPane itself so "Clear all
  // filters" and the map's own "Remove boundary" button can both reset it.
  const [areaMode, setAreaMode] = useState(null);
  const debounceTimer = useRef(null);
  const hasMountedRef = useRef(false);

  // Re-seed from the homepage's own filter bar every time the modal is
  // (re-)opened, same "fresh state on open" posture FavoritesModal's own
  // fetch-on-open effect uses, rather than carrying stale filters across
  // separate opens.
  useEffect(() => {
    if (!open) { hasMountedRef.current = false; return; }
    setFilters(emptySearchFilters(seedFilters));
    setPage(1);
    setAreaMode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function runSearch(nextFilters, nextPage, append) {
    setLoading(true);
    setError('');
    apiSearchMarketplace({
      listingMode: nextFilters.listingMode || undefined,
      location: nextFilters.location || undefined,
      propertyType: nextFilters.propertyType || undefined,
      bedrooms: nextFilters.bedrooms || undefined,
      priceRange: nextFilters.priceRange || undefined,
      bathsMin: nextFilters.bathsMin || undefined,
      sqftMin: nextFilters.sqftMin || undefined,
      sqftMax: nextFilters.sqftMax || undefined,
      amenities: nextFilters.amenities.length ? nextFilters.amenities.join(',') : undefined,
      tourMethod: nextFilters.tourMethod.length ? nextFilters.tourMethod.join(',') : undefined,
      timeOnUrbanNest: nextFilters.timeOnUrbanNest || undefined,
      // Session 51, Phase 10 — free-text search bar + map area select.
      q: nextFilters.q || undefined,
      mapBounds: nextFilters.mapBounds || undefined,
      mapCircle: nextFilters.mapCircle || undefined,
      page: nextPage,
      pageSize: SEARCH_PAGE_SIZE,
    })
      .then(data => {
        setCount(data.count);
        setResults(prev => (append ? [...prev, ...data.results] : data.results));
      })
      .catch(() => setError('Could not load search results — please try again.'))
      .finally(() => setLoading(false));
  }

  // Debounced re-search whenever any filter changes (checkbox, dropdown, or
  // the sqft min/max text inputs alike) — same setTimeout/clearTimeout-in-
  // a-ref debounce shape the homepage's own auto-save-search effect uses,
  // just much shorter (this drives visible results, not a silent
  // background save) and always reset to page 1, since a changed filter
  // invalidates whatever page the user was on.
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceTimer.current);
    if (!hasMountedRef.current) {
      // First run after (re)opening — search immediately, no debounce.
      hasMountedRef.current = true;
      setPage(1);
      runSearch(filters, 1, false);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      runSearch(filters, 1, false);
    }, SEARCH_FILTER_DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filters]);

  // Escape-to-close — same convention FavoritesModal's own effect uses.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const [priceLo, priceHi] = parsePriceRangeValue(filters.priceRange, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX);

  function setField(key, value) { setFilters(prev => ({ ...prev, [key]: value })); }
  function toggleListValue(key, value) {
    setFilters(prev => {
      const list = prev[key];
      return { ...prev, [key]: list.includes(value) ? list.filter(v => v !== value) : [...list, value] };
    });
  }
  function handleClearAll() { setFilters(emptySearchFilters()); setAreaMode(null); }
  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    runSearch(filters, nextPage, true);
  }

  const hasMore = count != null && results.length < count;

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90vw', minWidth: '90vw', height: '90vh', minHeight: '90vh', maxHeight: '98vh',
          display: 'flex', flexDirection: 'column',
          background: C.pageBg, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 26px', borderBottom: `1px solid ${C.cardBorder}`, background: C.white, flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: F.serif, fontSize: 20, color: C.textPrimary, margin: 0 }}>Search Results</h2>
            <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, margin: '4px 0 0' }}>
              {count == null ? 'Searching…' : `${count} ${count === 1 ? 'home' : 'homes'} match your filters`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 16, color: C.textSecondary }} />
          </button>
        </div>

        {/* Session 51, Phase 10 — the new free-text search bar, per the
            user's own request ("a generic search bar to search using home
            name, address, anything"). A plain controlled input wired into
            the same `filters` state every other filter here uses, so it
            rides the existing debounced-refetch effect above with zero
            extra plumbing — typing re-searches ~400ms after the user
            stops, same as dragging a price slider or checking an amenity
            box does today. */}
        <div style={{ padding: '14px 26px', borderBottom: `1px solid ${C.cardBorder}`, background: C.white, flexShrink: 0 }}>
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textTertiary }} />
            <input
              value={filters.q}
              onChange={e => setField('q', e.target.value)}
              placeholder="Search by home name, address, city…"
              style={{
                width: '100%', height: 38, boxSizing: 'border-box', padding: '0 34px 0 36px',
                borderRadius: 10, border: `1px solid ${C.inputBorder}`, background: C.inputBg,
                fontFamily: F.body, fontSize: 13.5, color: C.textPrimary, outline: 'none',
              }}
            />
            {filters.q && (
              <button
                onClick={() => setField('q', '')}
                aria-label="Clear search"
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer', color: C.textTertiary,
                  display: 'flex', alignItems: 'center', padding: 4,
                }}
              >
                <i className="ti ti-x" style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        </div>

        {/* Session 51, Phase 5 — one-time CSS for the dual-thumb range-slider
            trick used by HistogramRangeSlider above: the two overlapping
            native <input type="range"> elements keep their real thumb as
            the actual drag/keyboard target (pointer-events left on), just
            made invisible — the visible blue circle+chevron handles are a
            separate, non-interactive overlay drawn in sync with them. */}
        <style>{`
          .un-range-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: transparent; cursor: pointer; pointer-events: auto; }
          .un-range-thumb::-webkit-slider-runnable-track { background: transparent; }
          .un-range-thumb::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: transparent; border: none; cursor: pointer; pointer-events: auto; }
          .un-range-thumb::-moz-range-track { background: transparent; }
        `}</style>

        <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex' }}>
          {/* ── Filter sidebar ──────────────────────────────────────────── */}
          <div style={{
            width: 260, flexShrink: 0, borderRight: `1px solid ${C.cardBorder}`, background: C.white,
            padding: '20px 20px 24px', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {['RENT', 'SALE'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setField('listingMode', mode)}
                  style={{
                    flex: 1, border: 'none', borderRadius: 8, padding: '7px 0', cursor: 'pointer',
                    fontFamily: F.body, fontSize: 12.5, fontWeight: 700,
                    background: filters.listingMode === mode ? C.primary : C.inputBg,
                    color: filters.listingMode === mode ? C.white : C.textSecondary,
                  }}
                >
                  {mode === 'RENT' ? 'Rent' : 'Buy'}
                </button>
              ))}
            </div>

            <Field label="Location">
              <CustomDropdown options={LOCATION_OPTIONS} value={filters.location} onChange={v => setField('location', v)} placeholder="Any location" />
            </Field>
            <div style={{ height: 12 }} />
            <HistogramRangeSlider
              label={filters.listingMode === 'RENT' ? 'Rent/Month' : 'Price'}
              sublabel={filters.listingMode === 'RENT' ? 'Rent to property range as per UrbanNest' : 'Price to property range as per UrbanNest'}
              min={PRICE_SLIDER_MIN} max={PRICE_SLIDER_MAX} step={PRICE_SLIDER_STEP}
              valueMin={priceLo} valueMax={priceHi}
              onChangeMin={lo => setField('priceRange', buildPriceRangeString(lo, priceHi, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX))}
              onChangeMax={hi => setField('priceRange', buildPriceRangeString(priceLo, hi, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX))}
            />
            <Field label="Category">
              <CustomDropdown options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))} value={filters.propertyType} onChange={v => setField('propertyType', v)} placeholder="Any type" />
            </Field>
            <div style={{ height: 12 }} />
            <Field label="Bedrooms">
              <CustomDropdown options={SEARCH_BEDROOM_OPTIONS} value={filters.bedrooms} onChange={v => setField('bedrooms', v)} placeholder="Any" />
            </Field>
            <div style={{ height: 12 }} />
            <Field label="Bathrooms">
              <CustomDropdown options={SEARCH_BATHROOM_OPTIONS} value={filters.bathsMin} onChange={v => setField('bathsMin', v)} placeholder="Any" />
            </Field>
            <div style={{ height: 12 }} />

            <HistogramRangeSlider
              label="Home Size (Sq Ft)"
              sublabel="Home size range as per UrbanNest"
              min={SQFT_SLIDER_MIN} max={SQFT_SLIDER_MAX} step={SQFT_SLIDER_STEP}
              valueMin={filters.sqftMin === '' ? SQFT_SLIDER_MIN : Number(filters.sqftMin)}
              valueMax={filters.sqftMax === '' ? SQFT_SLIDER_MAX : Number(filters.sqftMax)}
              onChangeMin={lo => setField('sqftMin', lo <= SQFT_SLIDER_MIN ? '' : String(lo))}
              onChangeMax={hi => setField('sqftMax', hi >= SQFT_SLIDER_MAX ? '' : String(hi))}
            />

            <CheckboxGroup
              label="Rental Amenities"
              options={SEARCH_AMENITY_OPTIONS}
              selected={filters.amenities}
              onToggle={v => toggleListValue('amenities', v)}
            />
            <CheckboxGroup
              label="Tour Method"
              options={SEARCH_TOUR_METHOD_OPTIONS}
              selected={filters.tourMethod}
              onToggle={v => toggleListValue('tourMethod', v)}
            />

            <Field label="Time On UrbanNest">
              <CustomDropdown options={SEARCH_TIME_ON_URBANNEST_OPTIONS} value={filters.timeOnUrbanNest} onChange={v => setField('timeOnUrbanNest', v)} placeholder="Any time" />
            </Field>

            <button
              onClick={handleClearAll}
              style={{
                marginTop: 18, width: '100%', height: 36, borderRadius: 8, border: `1px solid ${C.cardBorder}`,
                background: C.white, color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Clear all filters
            </button>
          </div>

          {/* ── Map + results, split view (Session 51, Phase 10) ───────────
              Per the user's own request, modeled after the Zillow reference
              screenshot's split map/list layout: the map pane sits to the
              left of the results grid, both visible and scrollable/
              pannable independently, rather than the map replacing the
              grid or living behind a toggle. */}
          <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', gap: 16, padding: '20px 26px 28px' }}>
            <div style={{ flex: '0 0 40%', minWidth: 320 }}>
              <MapPane
                results={results}
                onCardClick={onCardClick}
                areaMode={areaMode}
                onAreaModeChange={setAreaMode}
                onAreaSelect={area => setFilters(prev => ({ ...prev, ...area }))}
                onAreaClear={() => setFilters(prev => ({ ...prev, mapBounds: '', mapCircle: '' }))}
                hasArea={!!(filters.mapBounds || filters.mapCircle)}
              />
            </div>
          <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
            {error && (
              <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontFamily: F.body, fontSize: 13 }}>
                {error}
              </div>
            )}

            {count === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>
                No homes match these filters — try widening your search.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {results.map(listing => (
                    <div
                      key={listing.id}
                      onClick={() => onCardClick(listing)}
                      style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.cardBorder}`, background: C.white, cursor: 'pointer' }}
                    >
                      <div style={{ position: 'relative', height: 150, background: C.inputBg }}>
                        <img src={listing.coverImage} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <PromoRibbon text={listing.promotionTag} />
                        <FavoriteHeart listing={listing} favoriteKeys={favoriteKeys} onToggle={onToggleFavorite} />
                        {/* Session 51, Phase 4 — the design reference's video
                            play-overlay. tourVideo is already serialized by
                            every card (public_views.py's _serialize_card())
                            but wasn't rendered anywhere yet — see the design
                            review's §3 note. Shown bottom-right so it never
                            collides with FavoriteHeart (top-left) or
                            PromoRibbon (top-right). */}
                        {listing.tourVideo && (
                          <div style={{
                            position: 'absolute', bottom: 10, right: 10,
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'rgba(15,23,42,0.65)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <i className="ti ti-player-play-filled" style={{ fontSize: 13, color: C.white }} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px 14px 16px' }}>
                        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }} title={listing.title}>
                          {truncateTitle(listing.title)}
                        </div>
                        <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.primary, marginTop: 4 }}>
                          {listing.priceIsFrom ? 'Starting at ' : ''}$ {formatPrice(listing.priceAmount)}
                          {listing.priceUnit !== 'sale' && listing.priceAmount != null && (
                            <span style={{ fontWeight: 400, fontSize: 12, color: C.textSecondary }}> / mo</span>
                          )}
                        </div>
                        <SpecRow beds={listing.bedsRange || listing.beds} baths={listing.bathsRange || listing.baths} sqft={listing.sqftRange || listing.sqft} />
                        <div style={{ borderBottom: `1px dotted ${C.divider}`, opacity: 0.5, margin: '10px 0 8px' }} />
                        <div
                          title={`${listing.addressLine || ''} ${listing.city}, ${listing.state}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, minWidth: 0,
                            fontFamily: F.body, fontSize: 11.5, lineHeight: 1.5, color: C.textSecondary,
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M12 21s-7-7.1-7-12a7 7 0 0 1 14 0c0 4.9-7 12-7 12z" stroke={C.textTertiary} strokeWidth="1.8" strokeLinejoin="round" />
                            <circle cx="12" cy="9" r="2.3" stroke={C.textTertiary} strokeWidth="1.8" />
                          </svg>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                            {listing.addressLine ? `${listing.addressLine}, ${listing.city}, ${listing.state}` : `${listing.city}, ${listing.state}`}
                          </span>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); onCardClick(listing); }}
                          style={{
                            marginTop: 12, width: '100%', height: 32, borderRadius: 7, border: 'none',
                            background: C.primary, color: C.white, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Explore Now
                        </button>
                      </div>
                    </div>
                  ))}
                  {loading && results.length === 0 && (
                    <div style={{ fontFamily: F.body, fontSize: 14, color: C.textSecondary, padding: '20px 0' }}>Searching…</div>
                  )}
                </div>

                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      style={{
                        height: 38, padding: '0 26px', borderRadius: 8, border: `1px solid ${C.cardBorder}`,
                        background: C.white, color: C.primary, fontFamily: F.body, fontSize: 13, fontWeight: 700,
                        cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Session 51 correction — the user explicitly didn't want Favorites as a
// full-page navigation ("Rather than opening up as a total screen... I
// don't need a separate 'Back to Marketplace' button"): closing it should
// just dismiss an overlay sitting on top of the still-mounted Marketplace
// page, not route anywhere. Replaces the old routed
// MarketplaceFavoritesPage.jsx (now orphaned — see App.js's comment)
// with an in-page modal, portaled to document.body same as the
// account-menu dropdown above (same reason: needs to out-stack the hero's
// own stacking context). Closes via the X button, a backdrop click, or
// Escape (see the favoritesModalOpen effect in MarketplaceHomePage below).
//
// Session 51, 2nd correction — sized to at least 50% of the viewport in
// BOTH dimensions (minWidth/minHeight, not just width) per the user's own
// follow-up ask; the first pass was 60vw wide but let its height collapse
// to fit content, so a short favorites list rendered a visually tiny
// popup despite the wide panel. Also added a search box + a For Rent/For
// Sale filter (client-side — this list is always small, capped by nothing
// larger than what a Renter has actually favorited, so no need for a
// server round-trip) and made the card grid its own scrollable region
// (flex: 1, minHeight: 0 — the standard flexbox fix so a child can
// actually shrink/scroll inside a flex column instead of pushing the
// panel past maxHeight) so the header and search bar stay pinned while
// the list scrolls underneath, same pattern NearbyRow's own card grid
// doesn't need but a potentially-long single-column list does.
function FavoritesModal({ open, favorites, error, removingId, onRemove, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  if (!open) return null;

  const visibleFavorites = (favorites || []).filter(fav => {
    const card = fav.currentListing;
    if (typeFilter && (!card || card.listingType !== typeFilter)) return false;
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      const haystack = `${card ? card.title : ''} ${fav.assetLabel || ''}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '60vw', minWidth: '50vw', height: '70vh', minHeight: '50vh', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          background: C.pageBg, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: `1px solid ${C.cardBorder}`, background: C.white, flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: F.serif, fontSize: 22, color: C.textPrimary, margin: 0 }}>Favorites</h2>
            <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, margin: '4px 0 0' }}>
              Homes you've saved from the Marketplace.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 16, color: C.textSecondary }} />
          </button>
        </div>

        {favorites !== null && favorites.length > 0 && (
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center',
            padding: '14px 28px', borderBottom: `1px solid ${C.cardBorder}`, background: C.white, flexShrink: 0,
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textTertiary }} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search your favorites by name or address"
                style={{
                  width: '100%', height: 38, boxSizing: 'border-box', padding: '0 14px 0 36px',
                  borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.inputBg,
                  fontFamily: F.body, fontSize: 13, color: C.textPrimary, outline: 'none',
                }}
              />
            </div>
            <div style={{ width: 150, flexShrink: 0 }}>
              <CustomDropdown options={FAVORITES_TYPE_FILTER_OPTIONS} value={typeFilter} onChange={setTypeFilter} placeholder="All" />
            </div>
          </div>
        )}

        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
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
          ) : visibleFavorites.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>
              No favorites match your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {visibleFavorites.map(fav => {
                const card = fav.currentListing;
                return (
                  <div
                    key={fav.id}
                    style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.cardBorder}`, background: C.cardBg || C.white }}
                  >
                    <div style={{ position: 'relative', height: 140, background: C.inputBg }}>
                      {card && (
                        <img src={card.coverImage} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <button
                        onClick={() => onRemove(fav)}
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
                        {card ? truncateTitle(card.title) : truncateTitle(fav.assetLabel)}
                      </div>
                      {card && card.priceAmount != null ? (
                        <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.primary, marginTop: 4 }}>
                          $ {formatPrice(card.priceAmount)}
                          {card.priceUnit !== 'sale' && (
                            <span style={{ fontWeight: 400, fontSize: 12, color: C.textSecondary }}> / mo</span>
                          )}
                        </div>
                      ) : card && card.isGroup ? (
                        // Grouped PropertyListing favorite — serializers.py's
                        // _current_listing_card() deliberately omits a single
                        // priceAmount here (it's a range across the group's
                        // units), so this is the expected shape, not an error.
                        <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, marginTop: 4 }}>
                          View listing for pricing
                        </div>
                      ) : (
                        <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, marginTop: 4, fontStyle: 'italic' }}>
                          Not currently listed
                        </div>
                      )}
                      {/* Session 51 — beds/baths/sqft, same SpecRow every
                          other Marketplace card already shows; backend now
                          computes these for a favorite's current listing
                          (marketplace_account/serializers.py's
                          _current_listing_card()). No card at all means no
                          specs to show — "Not currently listed" above
                          already covers that case. */}
                      {card && (
                        <SpecRow beds={card.bedsRange || card.beds} baths={card.bathsRange || card.baths} sqft={card.sqftRange || card.sqft} />
                      )}
                      {/* Session 51 — address restyled to match NearbyRow's
                          own dotted-divider convention: single line,
                          ellipsis-truncated rather than wrapping, with the
                          full text in a native title tooltip for whatever
                          got cut off. minWidth: 0 on the flex row (missing
                          in NearbyRow's own copy of this pattern) is what
                          actually makes the inner span's ellipsis take
                          effect instead of silently overflowing. */}
                      <div style={{ borderBottom: `1px dotted ${C.divider}`, opacity: 0.5, margin: '10px 0 8px' }} />
                      <div
                        title={fav.assetLabel}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, minWidth: 0,
                          fontFamily: F.body, fontSize: 11.5, lineHeight: 1.5, color: C.textSecondary,
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M12 21s-7-7.1-7-12a7 7 0 0 1 14 0c0 4.9-7 12-7 12z" stroke={C.textTertiary} strokeWidth="1.8" strokeLinejoin="round" />
                          <circle cx="12" cy="9" r="2.3" stroke={C.textTertiary} strokeWidth="1.8" />
                        </svg>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                          {fav.assetLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function MarketplaceHomePage() {
  const navigate = useNavigate();

  const [listingMode, setListingMode] = useState('RENT'); // RENT | SALE — Listing.listing_type
  // Drives which of Rent/Buy/Agents reads as "selected" in the search-widget
  // toggle below. Kept separate from listingMode (which only ever means
  // RENT/SALE and feeds the filter fields/search payload) since Agents
  // isn't a listing mode — selecting it highlights that tab without
  // touching listingMode or the fields below it.
  const [activeTab, setActiveTab] = useState('RENT'); // RENT | SALE | AGENTS
  const [location, setLocation] = useState('CA');
  const [priceRange, setPriceRange] = useState('2000-3000');
  const [propertyType, setPropertyType] = useState('INDIVIDUAL_HOUSE');
  const [bedrooms, setBedrooms] = useState('3br');
  const [heroIndex, setHeroIndex] = useState(0);
  // Rentals Near You now shows horizontally-scrollable ROWS instead of a
  // wrapping grid (per request) — this tracks how many rows are visible
  // (1 or 2; "See More" reveals the 2nd, a 3rd click navigates away
  // instead of ever rendering a 3rd row — see the section below).
  const [nearbyRowsShown, setNearbyRowsShown] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [hoveredNavItem, setHoveredNavItem] = useState(null); // 'advertise' | 'manage' | 'signin' | null — drives the white-pill hover highlight
  const [accountMenuOpen, setAccountMenuOpen] = useState(false); // the new icon-button dropdown to the right of Sign In
  const [accountMenuPos, setAccountMenuPos] = useState({ top: 0, right: 0 }); // viewport coords for the portaled panel below
  // Session 50, Phase 2 — real listings from the new public marketplace
  // endpoint, padded with the original mock cards (tagged `__sample: true`)
  // whenever real results fall short of the requested count. Named exactly
  // like the old imported constants on purpose — see the import comment
  // above for why every existing reference below didn't need to change.
  // Seeded with the sample arrays, each tagged __sample so the SampleBadge
  // shows correctly during the brief window before the real-data fetch
  // effect below resolves and replaces them — not just once real data is
  // short and sample cards get mixed in, but from the very first render too.
  const [EXCLUSIVE_LISTINGS, setExclusiveListings] = useState(
    () => SAMPLE_EXCLUSIVE_LISTINGS.map(s => ({ ...s, __sample: true }))
  );
  const [NEARBY_LISTINGS, setNearbyListings] = useState(
    () => SAMPLE_NEARBY_LISTINGS.map(s => ({ ...s, __sample: true }))
  );
  // Session 51, Phase 6 — "Homes You May Like" (see marketplace/
  // Marketplace_Search_Results_Design_Review.md's "Homes You May Like"
  // addendum). Deliberately starts empty, never seeded with sample cards
  // like EXCLUSIVE_LISTINGS/NEARBY_LISTINGS above — per the decided scope,
  // this section NEVER shows Sample Data, so there's nothing honest to
  // show before the real fetch resolves; the whole section just doesn't
  // render yet (same "absent, not an empty state" rule that governs it
  // once the real fetch comes back short too — see the render below).
  // Own Sort By / rows-shown state, deliberately separate from Rentals
  // Near You's `sortBy`/`nearbyRowsShown` above — a different section with
  // its own independent controls, not a shared one.
  const [HOMES_YOU_MAY_LIKE_LISTINGS, setHomesYouMayLikeListings] = useState([]);
  const [homesYouMayLikeRowsShown, setHomesYouMayLikeRowsShown] = useState(1);
  const [homesYouMayLikeSortBy, setHomesYouMayLikeSortBy] = useState('newest');
  const [exclusiveIndex, setExclusiveIndex] = useState(0); // which EXCLUSIVE_LISTINGS entry is centered
  const [exclusivePaused, setExclusivePaused] = useState(false); // stops auto-advance once the user clicks the centered card
  const heroTimer = useRef(null);
  const exclusiveTimer = useRef(null);
  const exclusiveVideoRefs = useRef({}); // listing.id -> <video> element, for the play/pause-by-centered-item effect below
  const exclusiveWheelLock = useRef(0); // last-handled wheel-nav timestamp, so one trackpad swipe doesn't fire several steps
  const accountMenuRef = useRef(null); // wraps the trigger button only — outside-click target #1
  const accountMenuPanelRef = useRef(null); // the portaled panel itself — outside-click target #2 (see effect below)
  // "Orbit" AI search-assistant orb — see handleOrbitClick below for what
  // is and isn't actually wired up yet.
  const [orbHovered, setOrbHovered] = useState(false);
  const [orbListening, setOrbListening] = useState(false);
  const orbListeningTimer = useRef(null);

  // Session 51, Phase 3 — Favorites + Saved Search (see marketplace_account
  // app). `user` gates every write below: a logged-out click routes to
  // /login rather than silently no-op'ing or falling back to a
  // localStorage-only favorite.
  const { user, clearAuth } = useAuth();
  const [favoriteKeys, setFavoriteKeys] = useState(() => new Set()); // 'unit:<id>' | 'property:<id>'
  const favoriteIdByKey = useRef({}); // same key -> MarketplaceFavorite row id, for DELETE

  // Session 51 correction — Favorites opens as an in-page modal now, not a
  // routed page (see FavoritesModal above). modalFavorites/Error/Removing
  // are deliberately separate from favoriteKeys/favoriteIdByKey above —
  // those drive every heart icon's filled/outline state across the whole
  // page, while these three only back the modal's own list UI.
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [modalFavorites, setModalFavorites] = useState(null); // null = loading
  const [modalFavoritesError, setModalFavoritesError] = useState('');
  const [modalRemovingId, setModalRemovingId] = useState(null);

  // Session 51, Phase 4 — the real Search Results modal (see
  // SearchResultsModal above). Opens from the "Search" button in the
  // floating search widget below, pre-seeded with whatever that widget's
  // own listingMode/location/priceRange/propertyType/bedrooms are set to
  // at the moment of the click — see handleSearch below.
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    heroTimer.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(heroTimer.current);
  }, []);

  // Phase 2 (Session 50) — real data wiring. Fetches both sections from the
  // new public ranking endpoint (rules_engine.marketplace_display) on mount
  // and pads any shortfall with the existing curated sample cards, tagged
  // __sample so the render can show a "Sample" badge on them — matching
  // this project's existing Sample Data watermark convention elsewhere in
  // UN Admin/PMS. The backend deliberately never fabricates sample listings
  // itself (see public_views.py's own header), so that padding decision
  // lives here. On fetch failure (endpoint down, network error) we just
  // keep showing the all-sample initial state rather than an empty section.
  useEffect(() => {
    let cancelled = false;

    function padWithSamples(real, samples, requestedCount, backfillEnabled) {
      // SAMPLE_DATA_BACKFILL (MarketplaceDisplayRuleDefinition) toggled off
      // server-side: show only the real listings — fewer than requested,
      // or none at all — never Sample Data padding (architecture doc §11
      // item 11's confirmed disabled-fallback). The section itself still
      // always renders; an empty real[] falls through to that section's
      // own "No active listings" message below (the carousel/row render),
      // it's never omitted. Previously this flag wasn't read from the API
      // response at all and padding always happened regardless of the
      // Admin config's toggle state — fixed this pass.
      if (!backfillEnabled) return real;
      const shortfall = requestedCount - real.length;
      if (shortfall <= 0) return real;
      return [...real, ...samples.slice(0, shortfall).map(s => ({ ...s, __sample: true }))];
    }

    apiGetMarketplaceDisplay('exclusive', {})
      .then(data => {
        if (cancelled) return;
        const real = (data.results || []).map(r => ({ ...r, __sample: false }));
        const backfillEnabled = data.sample_data_backfill_enabled !== false;
        setExclusiveListings(padWithSamples(real, SAMPLE_EXCLUSIVE_LISTINGS, data.requested_count, backfillEnabled));
      })
      .catch(err => {
        console.error('Marketplace exclusive fetch failed, keeping sample data', err);
      });

    apiGetMarketplaceDisplay('rentals_near_you', {})
      .then(data => {
        if (cancelled) return;
        const real = (data.results || []).map(r => ({ ...r, __sample: false }));
        const backfillEnabled = data.sample_data_backfill_enabled !== false;
        setNearbyListings(padWithSamples(real, SAMPLE_NEARBY_LISTINGS, data.requested_count, backfillEnabled));
      })
      .catch(err => {
        console.error('Marketplace rentals_near_you fetch failed, keeping sample data', err);
      });

    return () => { cancelled = true; };
  }, []);

  // "Most Exclusive Homes" carousel — auto-advances every 4s unless the
  // user has clicked the centered card. Re-runs whenever exclusivePaused
  // flips so the interval actually stops the moment it's set, rather than
  // firing one extra tick first — also re-runs when EXCLUSIVE_LISTINGS.length
  // changes (sample data → real fetch result), so the modulo wrap always
  // matches the array that's actually mounted, not a stale closed-over length.
  useEffect(() => {
    // SAMPLE_DATA_BACKFILL disabled + zero real eligible listings can leave
    // this array empty (the "No active listings" fallback rendered below) —
    // guard against a modulo-by-zero/NaN index.
    if (exclusivePaused || EXCLUSIVE_LISTINGS.length === 0) return undefined;
    exclusiveTimer.current = setInterval(() => {
      setExclusiveIndex(i => (i + 1) % EXCLUSIVE_LISTINGS.length);
    }, 4000);
    return () => clearInterval(exclusiveTimer.current);
  }, [exclusivePaused, EXCLUSIVE_LISTINGS.length]);

  // Keeps the centered-card index in bounds whenever EXCLUSIVE_LISTINGS is
  // swapped wholesale (sample → real data on mount, or a later refetch) —
  // without this, a shorter real result set than the initial 3-item sample
  // array could leave exclusiveIndex pointing past the end and crash the
  // video-ref effect below on `EXCLUSIVE_LISTINGS[exclusiveIndex].id`.
  useEffect(() => {
    setExclusiveIndex(i => (i >= EXCLUSIVE_LISTINGS.length ? 0 : i));
  }, [EXCLUSIVE_LISTINGS]);

  // Only the centered card's video actually plays — every other mounted
  // video (always at most 2: the immediate left/right neighbors, however
  // many total EXCLUSIVE_LISTINGS there are — see the carousel render
  // below) is paused and reset to its first frame, so it reads as a still
  // image until it becomes centered. Re-runs on every exclusiveIndex
  // change, including the ones driven by the auto-timer, arrow clicks,
  // wheel/swipe nav, and clicking a side card — all of them funnel through
  // setExclusiveIndex, so this is the one place that enforces the rule.
  useEffect(() => {
    if (EXCLUSIVE_LISTINGS.length === 0) return; // empty-state — nothing to center/play
    const centerId = EXCLUSIVE_LISTINGS[exclusiveIndex].id;
    Object.entries(exclusiveVideoRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id === centerId) {
        el.play().catch(() => {});
      } else {
        el.pause();
        el.currentTime = 0;
      }
    });
  }, [exclusiveIndex, EXCLUSIVE_LISTINGS.length]);

  // Account-menu dropdown — closes on any click outside it, same pattern
  // CustomDropdown.jsx already uses elsewhere in this codebase (a ref +
  // a document-level mousedown listener), just checking two refs instead
  // of one since the panel itself is portaled out of this subtree (see
  // toggleAccountMenu/the render below for why).
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const handler = e => {
      const insideButton = accountMenuRef.current && accountMenuRef.current.contains(e.target);
      const insidePanel = accountMenuPanelRef.current && accountMenuPanelRef.current.contains(e.target);
      if (!insideButton && !insidePanel) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accountMenuOpen]);

  // The account-menu button lives inside the hero section, which (by
  // design) sits in a lower stacking context than the floating search
  // widget below it — that widget is deliberately given a higher z-index
  // so it can overlap the hero's bottom edge. Because the hero's own
  // outer container never sets a z-index itself, NOTHING inside it (no
  // matter how high that descendant's own z-index is set) can out-stack
  // a sibling like the search widget — a child's z-index only wins
  // against other elements within its own nearest stacking context, not
  // against a sibling of an ancestor. That's exactly what was reported:
  // the dropdown rendered behind/underneath the search widget. Rendering
  // the panel through a portal straight onto document.body sidesteps this
  // entirely — it's no longer a descendant of the hero at all, so it just
  // needs a high z-index (9999) relative to the whole page, not the hero.
  function toggleAccountMenu() {
    if (!accountMenuOpen && accountMenuRef.current) {
      const rect = accountMenuRef.current.getBoundingClientRect();
      setAccountMenuPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
    }
    setAccountMenuOpen(o => !o);
  }

  // Shared by the arrow buttons, wheel/trackpad scroll, and side-card
  // clicks — any manual navigation pauses the auto-timer (exclusivePaused),
  // same as clicking the centered card already did; it felt inconsistent
  // for only one of the navigation methods to stop the auto-advance once
  // there was more than one way to navigate.
  function exclusiveGoTo(delta) {
    const len = EXCLUSIVE_LISTINGS.length;
    setExclusiveIndex(i => ((i + delta) % len + len) % len);
    setExclusivePaused(true);
  }

  // index.css sets a GLOBAL `body { overflow: hidden }` (every other portal
  // page manages its own internal overflow:auto panel at a fixed 100vh — see
  // the admin-shell pattern). The Marketplace homepage is an ordinary long
  // page that needs the document itself to scroll, so it's scoped here
  // rather than touched globally — restored on unmount so navigating to any
  // other screen is completely unaffected.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  // Clears the Orbit auto-revert-to-idle timer (set in handleOrbitClick
  // above) if the component unmounts mid-"listening", same cleanup
  // discipline as heroTimer/exclusiveTimer above.
  useEffect(() => () => clearTimeout(orbListeningTimer.current), []);

  // Loads the logged-in Renter's existing Favorites once on mount/login so
  // every heart icon renders its correct filled/outline state immediately
  // rather than only after the first toggle. Clears back to empty on
  // logout so a previous user's hearts never bleed into the next session
  // on the same browser.
  useEffect(() => {
    if (!user) {
      setFavoriteKeys(new Set());
      favoriteIdByKey.current = {};
      return;
    }
    let cancelled = false;
    apiListFavorites()
      .then(rows => {
        if (cancelled) return;
        const keys = new Set();
        const map = {};
        rows.forEach(row => {
          const key = row.unit != null ? `unit:${row.unit}` : row.property != null ? `property:${row.property}` : null;
          if (key) { keys.add(key); map[key] = row.id; }
        });
        setFavoriteKeys(keys);
        favoriteIdByKey.current = map;
      })
      .catch(e => console.warn('[Marketplace] failed to load favorites:', e));
    return () => { cancelled = true; };
  }, [user]);

  // Session 51, Phase 6 — "Homes You May Like" (see marketplace/
  // Marketplace_Search_Results_Design_Review.md's "Homes You May Like"
  // addendum for the full decision log). Re-fetches on login/logout, same
  // convention as the Favorites effect right above — GET
  // /api/marketplace/display/homes_you_may_like/ already requires an
  // authenticated viewer server-side (public_views.py's
  // _get_homes_you_may_like()) to have anything to return, so there's no
  // point calling it at all while logged out; this section simply has
  // nothing to show for an anonymous visitor.
  //
  // Deliberately does NOT call padWithSamples() (defined in the effect
  // below) — per the decided scope, this section never shows Sample Data,
  // so `real_count < 2` just means an empty array, which the render below
  // reads as "don't show this section at all," not an empty-state message.
  useEffect(() => {
    if (!user) {
      setHomesYouMayLikeListings([]);
      return;
    }
    let cancelled = false;
    apiGetMarketplaceDisplay('homes_you_may_like', {})
      .then(data => {
        if (cancelled) return;
        setHomesYouMayLikeListings(data.real_count >= 2 ? (data.results || []) : []);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[Marketplace] failed to load Homes You May Like:', err);
        setHomesYouMayLikeListings([]);
      });
    return () => { cancelled = true; };
  }, [user]);

  // Session 51 correction — Saved Search is automatic, not a user-facing
  // button (the user's own distinction: Favorites is the only *deliberate*
  // save; Saved Search should happen "without the user even knowing it").
  // Debounces the filter fields and silently POSTs the combination once
  // the user pauses, for a logged-in Renter only — a logged-out visitor's
  // filters are never persisted and never see a login prompt because of
  // this. `hasMountedRef` skips the very first run so the page's own
  // default filter values (RENT/CA/3br/etc., set in useState above) never
  // get saved as if the user had chosen them. `user` is deliberately in
  // the dependency list too, so filters already set before a mid-session
  // login get captured right after login completes, not only on the next
  // filter change. Server-side dedup/cap lives in
  // marketplace_account/views.py's SavedSearchListCreateView.post().
  //
  // AUTO_SAVE_SEARCH_DEBOUNCE_MS — Session 51 scalability pass. Saved
  // Search currently has zero readers (no UI screen — see the
  // ACCOUNT_MENU_PERSONAL comment above — and no notification job yet
  // either), so every write this effect fires is pure DB load for a value
  // nothing consumes yet. Widened from an original 2000ms to cut request
  // volume several-fold during active filter-tweaking at scale (many
  // concurrent logged-in Renters, each doing a synchronous SELECT+INSERT/
  // UPDATE against the primary DB per debounced pause). Revisit downward
  // only once a real consumer (e.g. the match-notification job
  // `last_notified_at` is reserved for) actually needs fresher data than
  // this.
  const AUTO_SAVE_SEARCH_DEBOUNCE_MS = 8000;
  const hasMountedRef = useRef(false);
  const autoSaveSearchTimer = useRef(null);
  useEffect(() => {
    if (!hasMountedRef.current) { hasMountedRef.current = true; return; }
    if (!user) return;
    clearTimeout(autoSaveSearchTimer.current);
    autoSaveSearchTimer.current = setTimeout(() => {
      apiCreateSavedSearch({ criteria: { listingMode, location, priceRange, propertyType, bedrooms } })
        .catch(e => console.warn('[Marketplace] auto-save search failed:', e));
    }, AUTO_SAVE_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(autoSaveSearchTimer.current);
  }, [user, listingMode, location, priceRange, propertyType, bedrooms]);

  // Heart-icon toggle for both card types (NearbyRow + the Exclusive
  // carousel) — a logged-out click routes to /login instead of favoriting
  // anonymously (Session 51 decision). Mock/sample-padded cards never reach
  // here: FavoriteHeart doesn't render a button for a listing with no real
  // unitId/propertyId. Optimistic update with revert-on-failure, matching
  // PaymentCartContext's own posture elsewhere in this codebase.
  function toggleFavorite(listing) {
    if (!user) { navigate('/'); return; }
    const key = listing.unitId != null
      ? `unit:${listing.unitId}`
      : listing.propertyId != null
        ? `property:${listing.propertyId}`
        : null;
    if (!key) return;
    const wasFav = favoriteKeys.has(key);

    setFavoriteKeys(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(key); else next.add(key);
      return next;
    });

    if (wasFav) {
      const id = favoriteIdByKey.current[key];
      if (id == null) return;
      apiRemoveFavorite(id).catch(e => {
        console.warn('[Marketplace] remove favorite failed:', e);
        setFavoriteKeys(prev => new Set(prev).add(key));
      });
    } else {
      apiAddFavorite(listing.unitId != null ? { unit: listing.unitId } : { property: listing.propertyId })
        .then(row => { favoriteIdByKey.current[key] = row.id; })
        .catch(e => {
          console.warn('[Marketplace] add favorite failed:', e);
          setFavoriteKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
        });
    }
  }

  // Fetches the modal's own list fresh each time it's opened — the shared
  // favoriteKeys/favoriteIdByKey above already loaded once on mount/login
  // (for the heart icons), but that payload doesn't carry currentListing/
  // assetLabel, which only MarketplaceFavoriteSerializer's full response
  // (apiListFavorites()) includes and the modal's cards need to render.
  useEffect(() => {
    if (!favoritesModalOpen) return;
    let cancelled = false;
    setModalFavorites(null);
    setModalFavoritesError('');
    apiListFavorites()
      .then(rows => { if (!cancelled) setModalFavorites(rows); })
      .catch(() => { if (!cancelled) setModalFavoritesError('Could not load your favorites.'); });
    return () => { cancelled = true; };
  }, [favoritesModalOpen]);

  // Escape-to-close, same convention any modal needs — backdrop click and
  // the X button (both in FavoritesModal) cover the other two ways out.
  useEffect(() => {
    if (!favoritesModalOpen) return;
    function onKeyDown(e) { if (e.key === 'Escape') setFavoritesModalOpen(false); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [favoritesModalOpen]);

  // Removing from the modal must also update favoriteKeys/favoriteIdByKey
  // (the state every heart icon elsewhere on the page reads) — not just
  // the modal's own local list — otherwise a heart behind the modal would
  // stay filled-in until the next full page load, a real staleness bug
  // now that this is a persistent modal rather than a page the user
  // navigates back from (which used to force a refetch on remount).
  function handleRemoveModalFavorite(fav) {
    setModalRemovingId(fav.id);
    apiRemoveFavorite(fav.id)
      .then(() => {
        setModalFavorites(prev => (prev || []).filter(f => f.id !== fav.id));
        const key = fav.unit != null ? `unit:${fav.unit}` : fav.property != null ? `property:${fav.property}` : null;
        if (key) {
          setFavoriteKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
          delete favoriteIdByKey.current[key];
        }
      })
      .catch(() => setModalFavoritesError('Could not remove that favorite — please try again.'))
      .finally(() => setModalRemovingId(null));
  }

  function handleClearFilters() {
    setLocation('');
    setPriceRange('');
    setPropertyType('');
    setBedrooms('');
  }

  function handleSearch() {
    // Session 51, Phase 4 — real search/results modal (see
    // SearchResultsModal above + marketplace/
    // Marketplace_Search_Results_Design_Review.md). Decided in review: a
    // pop-up modal occupying at least 90% of screen space, not a routed
    // page — opens here instead of navigating anywhere, pre-seeded with
    // this search widget's own current filter values.
    setSearchModalOpen(true);
  }

  function handleManageProperty() {
    // No dedicated landlord/PM entry route from the public marketplace nav
    // exists yet — left as an honest no-op, same as the other not-yet-wired
    // handlers below, until that destination is decided.
    console.log('[Marketplace] manage property (not yet wired)');
  }

  function handleAgentsClick() {
    // No agents directory/page exists yet — honest no-op, same convention.
    console.log('[Marketplace] agents (not yet wired)');
  }

  function handleAdvertiseClick() {
    // No advertise-with-us page exists yet — honest no-op, same convention.
    console.log('[Marketplace] advertise (not yet wired)');
  }

  // "Orbit" AI search assistant — first pass per request: the orb's
  // placement (search widget, top-right, above Search) and its idle/
  // listening VISUALS and tooltip are real; nothing behind them is. There
  // is no microphone capture, no speech-to-text, and no AI backend wired
  // up — this click just toggles a cosmetic "listening" pulse for a few
  // seconds so the intended behavior is visible, then reverts to idle on
  // its own. The ChatGPT-recommended "processing"/"speaking" states
  // aren't built either, since those only make sense once there's a real
  // request/response round-trip to animate around.
  function handleOrbitClick() {
    console.log('[Marketplace] Orbit AI assistant clicked (voice capture + AI backend not yet wired)');
    clearTimeout(orbListeningTimer.current);
    setOrbListening(true);
    orbListeningTimer.current = setTimeout(() => setOrbListening(false), 4000);
  }

  // Session 51, Phase 7 — the two detail pages this stub anticipated are
  // now built (see listings/Marketplace_Listing_Design_Review.md §7 and
  // ListingDetailPage.jsx / PropertyListingDetailPage.jsx). `listing.id` is
  // always 'real-<pk>' (a Listing) or 'realgroup-<pk>' (a PropertyListing)
  // — the exact same prefix convention _serialize_card() uses on the
  // backend — except for a sample/mock-padded card (listing.__sample),
  // which carries neither prefix and has nothing real to open; this stays
  // a no-op for those, same as it was before this pass.
  function handleCardClick(listing) {
    if (listing.__sample) return;
    const id = String(listing.id || '');
    if (id.startsWith('realgroup-')) {
      navigate(`/marketplace/property-listing/${id.slice('realgroup-'.length)}`);
    } else if (id.startsWith('real-')) {
      navigate(`/marketplace/listing/${id.slice('real-'.length)}`);
    }
  }

  function handleSubscribe(e) {
    e.preventDefault();
    // No newsletter/subscription backend exists — left as an honest no-op
    // rather than faking persistence.
    console.log('[Marketplace] subscribe (not yet wired)', subscribeEmail);
    setSubscribeEmail('');
  }

  // "Resources & Guides" — found by `video` field rather than a hardcoded
  // index/id so the featured-card pick still makes sense if the mock data
  // changes later. Falls back to the first guide if none has a video, so
  // the section never breaks even if that assumption stops holding.
  const featuredGuide = PROPERTY_GUIDES.find(g => g.video) || PROPERTY_GUIDES[0];
  const otherGuides = PROPERTY_GUIDES.filter(g => g.id !== featuredGuide.id);

  return (
    <div style={{ background: C.pageBg, minHeight: '100vh' }}>
      {/* Hides the WebKit scrollbar on the "Rentals Near You" horizontal-
          scroll rows (NearbyRow below) — the only way to target
          ::-webkit-scrollbar at all, since it's a pseudo-element inline
          styles can't reach. Firefox/old-Edge are handled inline instead
          via scrollbarWidth/msOverflowStyle on the row itself. Rendered
          once here rather than once per row. */}
      <style>{`
        .un-scroll-hidden::-webkit-scrollbar { display: none; }
        @keyframes un-orb-idle {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px 2px rgba(59,130,246,0.35); }
          50% { transform: scale(1.06); box-shadow: 0 0 16px 5px rgba(59,130,246,0.55); }
        }
        @keyframes un-orb-listening {
          0%, 100% { transform: scale(1); box-shadow: 0 0 16px 4px rgba(59,130,246,0.55); }
          50% { transform: scale(1.16); box-shadow: 0 0 28px 9px rgba(139,92,246,0.75); }
        }
      `}</style>

      {/* ── Hero + top nav (shares the hero background) ──────────────────── */}
      {/* Height is viewport-relative (half the visible page, per request) —
          minHeight keeps the nav/headline/dots from clipping on short
          windows; previously a fixed 540px. */}
      <div style={{ position: 'relative', height: '50vh', minHeight: 420, overflow: 'hidden' }}>
        {HERO_IMAGES.map((src, i) => (
          <div key={src} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(1px)',
            opacity: i === heroIndex ? 1 : 0,
            transition: 'opacity 1s ease',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: C.heroOverlay }} />

        {/* Top nav */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 48px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ti ti-building-skyscraper" style={{ fontSize: 26, color: C.white }} />
            <span style={{ fontFamily: F.serif, fontSize: 20, color: C.white, fontWeight: 600 }}>Urban Nest</span>
          </div>

          <div style={{
            flex: 1, maxWidth: 480, margin: '0 40px',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.92)', borderRadius: 24,
            padding: '9px 16px',
          }}>
            <i className="ti ti-search" style={{ color: C.textTertiary, fontSize: 15 }} />
            <input
              placeholder="Search"
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: F.body, fontSize: 13, color: C.textPrimary }}
            />
          </div>

          {/* Nav right side — Advertise / Manage Property / Sign In, each a
              plain hypertext link that gets a white-pill highlight on
              hover (via hoveredNavItem, since inline styles have no :hover)
              rather than a permanent underline/border. No real destination
              for Advertise/Manage Property yet — honest no-ops, same
              convention as handleSearch/handleCardClick above. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { key: 'advertise', label: 'Advertise', onClick: handleAdvertiseClick },
              { key: 'manage', label: 'Manage Property', onClick: handleManageProperty },
              // Session 51, Phase 3 — account-aware: a logged-in user (any
              // persona — see _ensure_renter_persona's own docstring, not
              // just Renter) sees "My Account" and opens the same account
              // menu as the icon button beside it, instead of Sign In.
              user
                ? { key: 'signin', label: 'My Account', onClick: toggleAccountMenu }
                : { key: 'signin', label: 'Sign In', onClick: () => navigate('/') },
            ].map(item => (
              <span
                key={item.key}
                onClick={item.onClick}
                onMouseEnter={() => setHoveredNavItem(item.key)}
                onMouseLeave={() => setHoveredNavItem(prev => (prev === item.key ? null : prev))}
                style={{
                  fontFamily: F.body, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 20,
                  background: hoveredNavItem === item.key ? C.white : 'transparent',
                  color: hoveredNavItem === item.key ? C.primary : C.white,
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {item.label}
              </span>
            ))}

            {/* Account-menu icon — new, to the right of Sign In per request.
                Opens a small vertical popup of dummy account/nav options
                (ACCOUNT_MENU_BROWSE/ACCOUNT_MENU_PERSONAL above); no real
                account-aware state exists on this logged-out public page
                yet, so every entry except Sign In/Register is an honest
                no-op, same convention as the rest of this file. */}
            <div ref={accountMenuRef} style={{ position: 'relative', marginLeft: 6 }}>
              <button
                onClick={toggleAccountMenu}
                aria-label="Account menu"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent', cursor: 'pointer',
                  border: `1px solid ${accountMenuOpen ? C.accentGold : 'rgba(255,255,255,0.5)'}`,
                  borderRadius: 20, padding: '7px 12px', color: C.white,
                }}
              >
                <i className="ti ti-menu-2" style={{ fontSize: 16 }} />
                <i className="ti ti-user-circle" style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Portaled straight onto document.body — see toggleAccountMenu
            above for why this can't just live where it's used (the hero's
            own stacking context sits below the floating search widget's,
            so no z-index inside the hero could out-stack it; this
            sidesteps that by not being a hero descendant at all). Position
            is computed in viewport coordinates from the button's own
            bounding rect at the moment it's opened. */}
        {accountMenuOpen && ReactDOM.createPortal(
          <div
            ref={accountMenuPanelRef}
            style={{
              position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9999,
              width: 260, maxHeight: 420, overflowY: 'auto',
              background: C.white, borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
              padding: '10px 0',
            }}
          >
            {(user
              ? [{ label: 'Sign Out', onClick: () => { clearAuth(); navigate('/marketplace'); } }]
              : [
                  { label: 'Sign In', onClick: () => navigate('/') },
                  { label: 'Register', onClick: () => navigate('/signup') },
                ]
            ).map(item => (
              <div
                key={item.label}
                onClick={() => { item.onClick(); setAccountMenuOpen(false); }}
                style={{ padding: '9px 20px', fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.accentGold, cursor: 'pointer' }}
              >
                {item.label}
              </div>
            ))}

            {ACCOUNT_MENU_BROWSE.map(label => (
              <div
                key={label}
                onClick={() => { console.log('[Marketplace] account menu (not yet wired):', label); setAccountMenuOpen(false); }}
                style={{ padding: '9px 20px', fontFamily: F.body, fontSize: 13.5, color: C.textPrimary, cursor: 'pointer' }}
              >
                {label}
              </div>
            ))}

            <div style={{ height: 1, background: C.cardBorder, margin: '8px 0' }} />

            {ACCOUNT_MENU_PERSONAL.map(label => (
              <div
                key={label}
                onClick={() => {
                  setAccountMenuOpen(false);
                  // Session 51, Phase 3 — Favorites is the one entry with a
                  // real destination; Session 51 correction — now opens as
                  // an in-page modal (FavoritesModal above) instead of
                  // navigating to a route, per the user's own ask (no
                  // "Back to Marketplace" button, just close the popup).
                  // Still gated: logged-out routes to /login instead of
                  // opening the modal, same convention as the heart icon.
                  // Saved Search has no screen at all — it's an invisible
                  // internal capture, not a user-facing feature (see
                  // ACCOUNT_MENU_PERSONAL above). The rest (Notes,
                  // Suggestions, Agent and Co-Shopper) have no backing
                  // feature yet — still an honest no-op.
                  if (label === 'Favorites') {
                    if (!user) { navigate('/'); return; }
                    setFavoritesModalOpen(true);
                    return;
                  }
                  console.log('[Marketplace] account menu (not yet wired):', label);
                }}
                style={{ padding: '9px 20px', fontFamily: F.body, fontSize: 13.5, color: C.textPrimary, cursor: 'pointer' }}
              >
                {label}
              </div>
            ))}
          </div>,
          document.body
        )}

        <FavoritesModal
          open={favoritesModalOpen}
          favorites={modalFavorites}
          error={modalFavoritesError}
          removingId={modalRemovingId}
          onRemove={handleRemoveModalFavorite}
          onClose={() => setFavoritesModalOpen(false)}
        />

        <SearchResultsModal
          open={searchModalOpen}
          seedFilters={{ listingMode, location, priceRange, propertyType, bedrooms }}
          onClose={() => setSearchModalOpen(false)}
          onCardClick={handleCardClick}
          favoriteKeys={favoriteKeys}
          onToggleFavorite={toggleFavorite}
        />

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 48px 0' }}>
          {/* maxWidth removed + whiteSpace: nowrap so this stays on one
              line regardless of exact text-measurement/viewport width,
              rather than relying on a maxWidth guess. */}
          <h1 style={{ fontFamily: F.serif, fontSize: 40, color: C.heroText, margin: 0, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            Finding New Home is Simple
          </h1>
          <p style={{ fontFamily: F.body, fontSize: 14.5, color: C.heroSubtext, maxWidth: 480, marginTop: 14, lineHeight: 1.6 }}>
            Urban Nest is your go-to destination for finding the perfect home to suit your needs, with thousands of
            property listings across the country.
          </p>
          <button
            onClick={() => navigate('/signup')}
            style={{
              marginTop: 20, background: 'transparent', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 24,
              padding: '11px 28px', color: C.white, fontFamily: F.body, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Explore
          </button>
        </div>

        {/* Carousel dots */}
        <div style={{ position: 'absolute', bottom: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 2 }}>
          {HERO_IMAGES.map((_, i) => (
            <div
              key={i}
              onClick={() => setHeroIndex(i)}
              style={{
                width: 7, height: 7, borderRadius: '50%', cursor: 'pointer',
                background: i === heroIndex ? C.white : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Floating search widget ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 3, margin: '-70px 48px 0', maxWidth: 1040, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ position: 'relative', background: C.white, borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,0.12)', padding: '18px 24px 22px' }}>

          {/* "Orbit" AI search-assistant orb — top-right of the search
              card, above the Search button, per request. See
              handleOrbitClick above for exactly what's real here (the
              placement, the idle/listening visuals, the tooltip) vs. not
              (no actual voice capture or AI backend yet). */}
          <div
            style={{ position: 'absolute', top: 16, right: 20, zIndex: 2 }}
            onMouseEnter={() => setOrbHovered(true)}
            onMouseLeave={() => setOrbHovered(false)}
          >
            {orbHovered && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 10px)', right: -6,
                background: C.textPrimary, color: C.white, borderRadius: 8,
                padding: '7px 11px', whiteSpace: 'nowrap',
                fontFamily: F.body, fontSize: 11.5, fontWeight: 600, lineHeight: 1.3,
                boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              }}>
                Orbit — AI Search Assistant
                <div style={{ fontWeight: 400, opacity: 0.75, marginTop: 2 }}>
                  {orbListening ? 'Listening…' : 'Click to search by voice'}
                </div>
              </div>
            )}
            {/* Close-up reference showed this isn't a flat gradient dot —
                it's a thick teal→purple gradient RING around a separate,
                darker navy "globe" core, and the core has horizontal
                ribbed grooves whose width tapers toward the top/bottom
                (true sphere-latitude foreshortening, computed below via
                rx = sqrt(R² − dy²) rather than guessed flat ellipses),
                plus a glossy highlight. Rebuilt as an inline SVG with
                those as distinct layers — ring, core, tapered ribs,
                highlight — instead of one gradient circle. Bumped again,
                34→44px, since the ribbing needs real room to read. */}
            <button
              onClick={handleOrbitClick}
              aria-label="Orbit AI search assistant"
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: `${orbListening ? 'un-orb-listening' : 'un-orb-idle'} ${orbListening ? '1.1s' : '2.8s'} ease-in-out infinite`,
              }}
            >
              <svg width="44" height="44" viewBox="0 0 44 44" style={{ display: 'block', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="un-orb-ring" x1="0%" y1="30%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#6EE7C8" />
                    <stop offset="45%" stopColor="#4FA8E8" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                  <radialGradient id="un-orb-core" cx="38%" cy="30%" r="80%">
                    <stop offset="0%" stopColor="#35497e" />
                    <stop offset="55%" stopColor="#202f5c" />
                    <stop offset="100%" stopColor="#141b3a" />
                  </radialGradient>
                  <linearGradient id="un-orb-band" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(200,225,255,0.85)" />
                    <stop offset="50%" stopColor="rgba(200,225,255,0.12)" />
                    <stop offset="100%" stopColor="rgba(3,6,20,0.75)" />
                  </linearGradient>
                  <clipPath id="un-orb-clip"><circle cx="22" cy="22" r="14" /></clipPath>
                </defs>

                {/* soft outer glow halo, teal-leaning like the reference */}
                <circle cx="22" cy="22" r="21" fill="url(#un-orb-ring)" opacity="0.35" style={{ filter: 'blur(5px)' }} />

                {/* the gradient ring itself — a stroked circle, not a fill */}
                <circle cx="22" cy="22" r="17.5" fill="none" stroke="url(#un-orb-ring)" strokeWidth="4.5" />

                <g clipPath="url(#un-orb-clip)">
                  <circle cx="22" cy="22" r="14" fill="url(#un-orb-core)" />
                  {/* ribbed grooves — rx tapers per row using the sphere's
                      own geometry (sqrt(R²−dy²)) so bands near the top/
                      bottom are visibly narrower than the equator band,
                      instead of uniform-width stripes. Fewer (6), thicker,
                      higher-contrast bands than the first pass — at ~44px
                      rendered size, 8 thin low-contrast bands anti-
                      aliased into near-invisibility. */}
                  {[-10, -6, -2, 2, 6, 10].map(dy => {
                    const r = 14;
                    const rx = Math.sqrt(Math.max(r * r - dy * dy, 0));
                    return (
                      <ellipse
                        key={dy} cx={22} cy={22 + dy} rx={rx} ry={2.6}
                        fill="url(#un-orb-band)" stroke="rgba(210,230,255,0.4)" strokeWidth={0.4}
                      />
                    );
                  })}
                  {/* glossy highlight, upper-left light source */}
                  <ellipse cx={17} cy={15} rx={5.5} ry={3.2} fill="rgba(255,255,255,0.3)" />
                </g>
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {['RENT', 'SALE'].map(mode => (
              <button
                key={mode}
                onClick={() => { setActiveTab(mode); setListingMode(mode); }}
                style={{
                  border: 'none', borderRadius: 8, padding: '8px 22px', cursor: 'pointer',
                  fontFamily: F.body, fontSize: 13, fontWeight: 700,
                  background: activeTab === mode ? C.white : 'transparent',
                  color: activeTab === mode ? C.primary : C.textTertiary,
                  boxShadow: activeTab === mode ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
                }}
              >
                {mode === 'RENT' ? 'Rent' : 'Buy'}
              </button>
            ))}
            {/* Not a listing-mode option like Rent/Buy (doesn't touch
                listingMode) — a separate entry point to an agents
                directory that doesn't exist yet, so the click itself is
                still a no-op, but it now shares the same selected/
                highlighted look via activeTab, per request. */}
            <button
              onClick={() => { setActiveTab('AGENTS'); handleAgentsClick(); }}
              style={{
                border: 'none', borderRadius: 8, padding: '8px 22px', cursor: 'pointer',
                fontFamily: F.body, fontSize: 13, fontWeight: 700,
                background: activeTab === 'AGENTS' ? C.white : 'transparent',
                color: activeTab === 'AGENTS' ? C.primary : C.textTertiary,
                boxShadow: activeTab === 'AGENTS' ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              Agents
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto auto auto', gap: 14, alignItems: 'end' }}>
            <Field label="Location">
              <CustomDropdown options={LOCATION_OPTIONS} value={location} onChange={setLocation} placeholder="Any location" />
            </Field>
            <Field label={listingMode === 'RENT' ? 'Rent/Month' : 'Price'}>
              <CustomDropdown options={RENT_RANGE_OPTIONS} value={priceRange} onChange={setPriceRange} placeholder="Any price" />
            </Field>
            <Field label="Rental Type">
              <CustomDropdown
                options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                value={propertyType}
                onChange={setPropertyType}
                placeholder="Any type"
              />
            </Field>
            <Field label="Bedrooms">
              <CustomDropdown options={BEDROOM_OPTIONS} value={bedrooms} onChange={setBedrooms} placeholder="Any" />
            </Field>

            <button
              onClick={handleClearFilters}
              style={{
                height: 38, padding: '0 16px', borderRadius: 8, border: 'none',
                background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={handleSearch}
              style={{
                height: 38, padding: '0 22px', borderRadius: 8, border: 'none',
                background: C.primary, color: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
              }}
            >
              <i className="ti ti-search" style={{ fontSize: 14 }} />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ── Category shortcuts ─────────────────────────────────────────────── */}
      {/* Padding tightened (was '56px 48px 48px') so the shorter hero above
          actually buys back visible space, instead of being eaten by this
          row — goal is "Most Exclusive Homes" heading visible with no scroll. */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 44, padding: '32px 48px 24px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <div
            key={cat.value}
            onClick={() => setPropertyType(cat.value)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <img src={cat.photo} alt={cat.label} style={{ width: 84, height: 84, borderRadius: 14, objectFit: 'cover' }} />
            <span style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary, fontWeight: 600 }}>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Most Exclusive Homes ───────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '0 48px 32px' }}>
        <h2 style={{ fontFamily: F.serif, fontSize: 28, color: C.textPrimary, margin: 0 }}>Most Exclusive Homes Just For You</h2>
        <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.textSecondary, maxWidth: 560, margin: '10px auto 0', lineHeight: 1.6 }}>
          Discover a hand-picked collection of luxurious residences tailored to your lifestyle — where elegance,
          comfort, and exclusivity come together to create your perfect home.
        </p>
      </div>

      {/* Auto-rotating video carousel, not a static row — per request, this
          section is exclusively for listing videos (3D-tour style), always
          auto-advancing every 4s right-to-left unless the user navigates
          manually (which pauses it for good, see exclusiveGoTo/
          exclusivePaused above). The centered item is
          EXCLUSIVE_LISTINGS[exclusiveIndex]; left/right are its neighbors
          (wrapping) — only 2 extra video elements are ever mounted no
          matter how many total listings there are (6, 20, whatever),
          since offsets are relative to the current index, not fixed
          positions in the array. Only the centered video actually plays;
          the side ones are paused/reset to frame 0 (see the exclusiveIndex
          effect above) so they read as static until they become centered.
          Sizing derives from "Rentals Near You"'s own card size
          (EXCLUSIVE_CENTER_W/H etc., defined above) instead of fixed
          pixels picked independently — that's what keeps this section's
          padding visually matching Rentals' and stops it from overflowing
          past the page edges. Manual navigation: arrow buttons, or
          horizontal wheel/trackpad scroll on the row itself, or clicking
          a side card directly — all three call exclusiveGoTo. */}
      {EXCLUSIVE_LISTINGS.length === 0 ? (
        // SAMPLE_DATA_BACKFILL disabled + zero real eligible Exclusive
        // listings (architecture doc §11 item 11's confirmed disabled-
        // fallback) — the section itself is still rendered, never omitted,
        // just with this message instead of Sample Data padding or a
        // carousel with nothing to show.
        <div style={{ padding: '0 48px 56px', textAlign: 'center', color: C.textSecondary, fontFamily: F.body, fontSize: 14 }}>
          No active listings in this section right now.
        </div>
      ) : (
      <div style={{ position: 'relative', padding: '0 48px 56px' }}>
        <button
          onClick={() => exclusiveGoTo(-1)}
          aria-label="Previous"
          style={{
            position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: C.white, boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textPrimary,
          }}
        >
          <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />
        </button>
        <button
          onClick={() => exclusiveGoTo(1)}
          aria-label="Next"
          style={{
            position: 'absolute', right: 56, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: C.white, boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textPrimary,
          }}
        >
          <i className="ti ti-chevron-right" style={{ fontSize: 16 }} />
        </button>

        <div
          onWheel={e => {
            // Trackpads report horizontal swipes as deltaX; a plain mouse
            // wheel (or shift+wheel) only ever has deltaY, so that's
            // treated as horizontal intent here too, rather than ignored.
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (Math.abs(delta) < 10) return;
            const now = Date.now();
            if (now - exclusiveWheelLock.current < 500) return; // one step per gesture, not one per tick
            exclusiveWheelLock.current = now;
            exclusiveGoTo(delta > 0 ? 1 : -1);
          }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, overflow: 'hidden' }}
        >
        {[-1, 0, 1].map(offset => {
          const len = EXCLUSIVE_LISTINGS.length;
          const i = ((exclusiveIndex + offset) % len + len) % len;
          const listing = EXCLUSIVE_LISTINGS[i];
          const isCenter = offset === 0;
          const w = isCenter ? EXCLUSIVE_CENTER_W : EXCLUSIVE_SIDE_W;
          const h = isCenter ? EXCLUSIVE_CENTER_H : EXCLUSIVE_SIDE_H;
          return (
            <div
              key={listing.id}
              onClick={() => {
                if (isCenter) {
                  setExclusivePaused(true);
                  handleCardClick(listing);
                } else {
                  exclusiveGoTo(offset);
                }
              }}
              style={{
                position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                width: w, height: h,
                flexShrink: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: `1px solid ${C.cardBorder}`,
                opacity: isCenter ? 1 : 0.85,
                transition: 'width 0.4s ease, height 0.4s ease, opacity 0.4s ease',
              }}
            >
              <video
                src={listing.tourVideo}
                poster={listing.coverImage}
                muted loop playsInline
                // Only the centered one is ever told to autoplay — the
                // play/pause-by-centered-item effect above (keyed on
                // exclusiveIndex) is what actually starts/stops each
                // element as it enters/leaves the center slot; this
                // autoPlay only covers the very first mount, matching
                // whichever item starts out centered.
                autoPlay={isCenter}
                // React doesn't reliably set the DOM `muted` PROPERTY from
                // the JSX attribute alone on every browser (a known React/
                // video quirk) — and browsers require `muted` to be true
                // as a property, not just present as markup, before they'll
                // allow autoplay without a user gesture. The ref callback
                // sets it directly on the actual DOM node, and registers it
                // in exclusiveVideoRefs so the play/pause effect can find it
                // by listing id; the cleanup branch (el === null, on
                // unmount) removes that entry again.
                ref={el => {
                  if (el) { el.muted = true; exclusiveVideoRefs.current[listing.id] = el; }
                  else { delete exclusiveVideoRefs.current[listing.id]; }
                }}
                // The original "video just won't play" report turned out to
                // be a different, silent failure: the original tourVideo
                // host (Google's sample-video bucket) was unreachable on
                // this network — confirmed via video.error in the browser
                // console, not visible anywhere in the UI itself. Logging
                // onError from now on so a future bad/blocked URL is
                // diagnosable without needing to open devtools by hand.
                onError={e => console.warn('[Marketplace] tour video failed to load, showing poster instead:', listing.tourVideo, e.target.error)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)' }} />
              <PromoRibbon text={listing.promotionTag} />
              {listing.__sample && <SampleBadge />}
              <FavoriteHeart listing={listing} favoriteKeys={favoriteKeys} onToggle={toggleFavorite} />
              <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, color: C.white }}>
                <div style={{ fontFamily: F.body, fontSize: 13, opacity: 0.9 }}>{listing.title}</div>
                <div style={{ fontFamily: F.body, fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                  {listing.priceIsFrom ? 'From ' : ''}$ {formatPrice(listing.priceAmount)} <span style={{ fontWeight: 400, fontSize: 13 }}>/ {listing.priceUnit === 'month' ? 'mo' : 'Total'}</span>
                </div>
                <div style={{ fontFamily: F.body, fontSize: 12, opacity: 0.85, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 12 }} />
                  {listing.addressLine}, {listing.city} ({listing.state}), {listing.zip}
                </div>
                <div style={{ marginTop: 6 }}>
                  {/* A grouped PropertyListing card (isGroup: true) landing in this
                      carousel carries bedsRange/bathsRange/sqftRange instead of
                      flat beds/baths/sqft whenever its child units actually differ
                      (see marketplace_display/public_views.py's _serialize_group_card)
                      — same `rangeField || flatField` fallback NearbyRow's SpecRow
                      already uses below. */}
                  <SpecRowLight
                    beds={listing.bedsRange || listing.beds}
                    baths={listing.bathsRange || listing.baths}
                    sqft={listing.sqftRange || listing.sqft}
                  />
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
      )}

      {/* ── Homes You May Like ──────────────────────────────────────────────── */}
      {/* Session 51, Phase 6 — see marketplace/
          Marketplace_Search_Results_Design_Review.md's "Homes You May
          Like" addendum for the full decision log. Deliberately absent
          from the page entirely (not an empty-state message, unlike
          Rentals Near You below) whenever fewer than 2 real homes match
          the viewer's own most-recent saved search — includes the common
          case of a logged-out visitor or a logged-in Renter who hasn't
          searched for anything yet, both of which simply leave
          HOMES_YOU_MAY_LIKE_LISTINGS empty (see the fetch effect above).
          Everything else — heading/subheading style, Sort By dropdown,
          NearbyRow's horizontally-scrollable card row, the 2-row-then-
          navigate "See More" behavior — is full parity with Rentals Near
          You directly below, per the user's explicit request, reusing the
          exact same NearbyRow component so the cards themselves are
          pixel-identical, not a re-implementation. */}
      {HOMES_YOU_MAY_LIKE_LISTINGS.length >= 2 && (
        <div style={{ padding: '0 48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.textPrimary, margin: 0 }}>Homes You May Like</h2>
              <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '6px 0 0' }}>
                Based on your most recent search on UrbanNest.
              </p>
            </div>
            <div style={{ width: 160 }}>
              <CustomDropdown
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'price_low', label: 'Price: Low to High' },
                  { value: 'price_high', label: 'Price: High to Low' },
                ]}
                value={homesYouMayLikeSortBy}
                onChange={setHomesYouMayLikeSortBy}
                placeholder="Sort By"
              />
            </div>
          </div>

          <NearbyRow listings={HOMES_YOU_MAY_LIKE_LISTINGS} rowKey="homes-you-may-like-row1" onCardClick={handleCardClick} favoriteKeys={favoriteKeys} onToggleFavorite={toggleFavorite} />

          {/* Row 2 — same "reuse row 1's data, reversed" honest-placeholder
              convention as Rentals Near You's own row 2 below — this
              section has no real pagination endpoint either (search_section
              is called with a single fixed page_size, same as Rentals Near
              You's build_section() call). */}
          {homesYouMayLikeRowsShown >= 2 && (
            <div style={{ marginTop: 20 }}>
              <NearbyRow listings={[...HOMES_YOU_MAY_LIKE_LISTINGS].reverse()} rowKey="homes-you-may-like-row2" onCardClick={handleCardClick} favoriteKeys={favoriteKeys} onToggleFavorite={toggleFavorite} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              onClick={() => (homesYouMayLikeRowsShown < 2 ? setHomesYouMayLikeRowsShown(2) : navigate('/coming-soon'))}
              style={{
                background: 'transparent', border: 'none', color: C.primary, fontFamily: F.body, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              See More <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Rentals Near You ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 48px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.textPrimary, margin: 0 }}>Rentals Near You</h2>
            <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '6px 0 0' }}>
              Browse nearby options tailored to your location.
            </p>
          </div>
          <div style={{ width: 160 }}>
            <CustomDropdown
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'price_low', label: 'Price: Low to High' },
                { value: 'price_high', label: 'Price: High to Low' },
              ]}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort By"
            />
          </div>
        </div>

        {/* Row 1 — always shown. Each row is a horizontally-scrollable flex
            strip (overflow-x: auto) instead of the previous CSS Grid that
            wrapped cards onto new lines — per request: horizontal
            scrolling via trackpad swipe or mouse wheel, deliberately with
            NO left/right arrow buttons (unlike the Exclusive Homes
            carousel above, which does have arrows — this section is
            arrow-free by request). Card width matches the original grid's
            4-across sizing so the first 4 cards still line up the same as
            before; scrolling only engages once there are more cards than
            fit, which — once this reads from a real listings endpoint with
            more than a handful of nearby results — will be the normal
            case. */}
        {NEARBY_LISTINGS.length === 0 ? (
          // Same SAMPLE_DATA_BACKFILL-disabled empty state as the Exclusive
          // carousel above — section still renders, never omitted.
          <div style={{ padding: '24px 0', textAlign: 'center', color: C.textSecondary, fontFamily: F.body, fontSize: 14 }}>
            No active listings nearby right now.
          </div>
        ) : (
          <NearbyRow listings={NEARBY_LISTINGS} rowKey="row1" onCardClick={handleCardClick} favoriteKeys={favoriteKeys} onToggleFavorite={toggleFavorite} />
        )}

        {/* Row 2 — revealed by "See More". No real pagination endpoint
            exists yet (same gap as the rest of this mock-data file), so
            this demo row reuses NEARBY_LISTINGS again (reversed, so it
            reads as distinct content rather than a literal duplicate) —
            an honest placeholder for "the next batch of nearby listings",
            not real additional data. */}
        {nearbyRowsShown >= 2 && (
          <div style={{ marginTop: 20 }}>
            <NearbyRow listings={[...NEARBY_LISTINGS].reverse()} rowKey="row2" onCardClick={handleCardClick} favoriteKeys={favoriteKeys} onToggleFavorite={toggleFavorite} />
          </div>
        )}

        {/* "Limit the rows to 2" per request: once 2 rows are showing, a
            further "See More" click doesn't render a 3rd row inline — it
            navigates to a dedicated listings page instead. That page
            doesn't exist yet, so this points at the same /coming-soon
            placeholder already used elsewhere in App.js (ComingSoonPage)
            rather than inventing a one-off new page for this. */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={() => (nearbyRowsShown < 2 ? setNearbyRowsShown(2) : navigate('/coming-soon'))}
            style={{
              background: 'transparent', border: 'none', color: C.primary, fontFamily: F.body, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            See More <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* ── Resources & Guides ──────────────────────────────────────────────── */}
      {/* Sits between Rentals Near You and Popular Cities. Corrections made
          after the first two passes:
          1. Heading/subheading and the "Explore" link sit at the SAME
             48px padding as Rentals Near You's heading/"See More" (the
             outer container below) — these line up with that section
             rather than use a wider inset.
          2. The card row's own extra 32px inset (from the first revision)
             has been removed per a later request — the whole section now
             shares Rentals Near You's single 48px padding, card row
             included, instead of the row sitting narrower/"closer
             together" than the heading above it.
          3. Layout is no longer an even 2x2 — the video guide is one large
             featured card (65% width, GUIDE_FEATURED_H below) and the
             other 3 guides stack as compact list cards in the remaining
             35% (right column keeps `flex: 1` rather than a literal `0 0
             35%` so it naturally absorbs the flex `gap` instead of
             overflowing it — same pattern as the featured card's own
             fixed-percent-plus-flex:1-sibling approach). `featuredGuide`
             is found by its `video` field rather than a hardcoded index,
             so this still works if the mock data's order or video-bearing
             entry ever changes.
          "Explore" link below — like the Rentals "See More" overflow
          above — goes to the same /coming-soon placeholder rather than a
          real guides/blog page, which doesn't exist yet. */}
      <div style={{ padding: '0 48px 64px' }}>
        <h2 style={{ fontFamily: F.serif, fontSize: 24, color: C.textPrimary, margin: 0 }}>Resources &amp; Guides</h2>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '6px 0 24px' }}>
          Helpful ideas for renters, buyers and property owners.
        </p>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{
            flex: '0 0 65%', position: 'relative', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.cardBorder}`, height: GUIDE_FEATURED_H,
          }}>
            <video
              src={featuredGuide.video}
              poster={featuredGuide.coverImage}
              muted loop playsInline autoPlay
              ref={el => { if (el) el.muted = true; }}
              onError={e => console.warn('[Marketplace] guide video failed to load, showing poster instead:', featuredGuide.video, e.target.error)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)' }} />
            <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, color: C.white }}>
              <div style={{ fontFamily: F.body, fontSize: 16, fontWeight: 700 }}>{featuredGuide.title}</div>
              <div style={{ fontFamily: F.body, fontSize: 12.5, opacity: 0.9, marginTop: 4 }}>
                {featuredGuide.category} · {featuredGuide.readTime}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {otherGuides.map(guide => (
              <div
                key={guide.id}
                style={{ display: 'flex', flex: 1, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.cardBorder}`, background: C.cardBg }}
              >
                <div style={{ width: 120, flexShrink: 0 }}>
                  <img src={guide.coverImage} alt={guide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.35 }}>{guide.title}</div>
                  <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginTop: 6 }}>
                    {guide.category} · {guide.readTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={() => navigate('/coming-soon')}
            style={{
              background: 'transparent', border: 'none', color: C.primary, fontFamily: F.body, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            Explore <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* ── Popular cities ──────────────────────────────────────────────────── */}
      {/* Top padding dropped to 0 (was 64px, matching the bottom padding)
          per request: this section's own top padding was stacking with
          Resources & Guides' bottom padding (64+64=128px) and reading as a
          noticeably bigger gap than any other section transition on the
          page, which otherwise all rely on just the PRECEDING section's
          bottom padding for spacing, with the next section starting at 0.
          This now matches that same single-sided convention. */}
      <div style={{ padding: '0 48px 64px' }}>
        <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.textTertiary, textTransform: 'uppercase' }}>
          Top Cities
        </div>
        <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.textPrimary, margin: '8px 0 28px' }}>
          Explore Real Estate In Popular Cities
        </h2>
        {/* Card size +25% per request: photo 56→70, its radius scaled to
            match (10→13), row/column gaps and text sizes all scaled by
            the same 1.25 factor so the enlarged cards don't end up
            cramped against each other or against their own text. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 35, columnGap: 25 }}>
          {POPULAR_CITIES.map(city => (
            <div key={city.value} style={{ display: 'flex', alignItems: 'center', gap: 17.5, cursor: 'pointer' }}>
              <img src={city.photo} alt={city.label} style={{ width: 70, height: 70, borderRadius: 13, objectFit: 'cover' }} />
              <div>
                <div style={{ fontFamily: F.body, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{city.label}</div>
                <div style={{ fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>{city.count} Properties</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ background: C.footerBg, padding: '48px 48px 28px', color: C.footerText }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 1fr', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <i className="ti ti-building-skyscraper" style={{ fontSize: 22, color: C.white }} />
              <span style={{ fontFamily: F.serif, fontSize: 17, color: C.white }}>Urban Nest</span>
            </div>
            <div style={{ fontFamily: F.body, fontSize: 12.5, lineHeight: 1.8 }}>
              Urban Nest Pvt. Ltd.<br />
              GSTIN: 32ABCDE1234F1Z5<br />
              Registered Address: Kochi, Kerala<br />
              Support: hello@urbannest.com | +91 98765 43210
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              {['brand-facebook', 'brand-x', 'brand-instagram', 'brand-linkedin'].map(icon => (
                <i key={icon} className={`ti ti-${icon}`} style={{ fontSize: 16, color: C.footerText }} />
              ))}
            </div>
          </div>

          <FooterCol head="" links={['About Us', 'Products', 'Our Services', 'Contact Us']} />
          <FooterCol head="" links={['Careers', 'Terms & Conditions', 'Privacy Policy']} />

          <div>
            <div style={{ fontFamily: F.serif, fontSize: 15, color: C.footerHead, marginBottom: 6 }}>Join Our Inner Circle</div>
            <div style={{ fontFamily: F.body, fontSize: 12, marginBottom: 14 }}>
              Be the first to discover our new property listings and cool features.
            </div>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={subscribeEmail}
                onChange={e => setSubscribeEmail(e.target.value)}
                placeholder="enter your email"
                type="email"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6,
                  padding: '9px 12px', color: C.white, fontFamily: F.body, fontSize: 12.5, outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: C.white, color: C.primary, border: 'none', borderRadius: 6,
                  padding: '9px 0', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Subscribe
              </button>
            </form>
            <div style={{ fontFamily: F.body, fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
              Your trust is valued. Unsubscribe whenever you like.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// "Rentals Near You" row — a horizontally-scrollable strip of cards (see
// the section above for why this replaced the old wrapping CSS Grid).
// Deliberately has no arrow buttons: the onWheel handler lets a plain
// mouse's vertical wheel (or a trackpad's native horizontal swipe, which
// the browser already delivers as deltaX without any handler at all) pan
// the strip sideways, same "treat vertical wheel as horizontal intent"
// convention already used by the Exclusive Homes carousel above, just
// without that carousel's center-item/pause bookkeeping since this row
// has no concept of a "selected" card.
function NearbyRow({ listings, rowKey, onCardClick, favoriteKeys, onToggleFavorite }) {
  return (
    <div
      onWheel={e => {
        if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return; // native horizontal swipe — let the browser handle it
        e.currentTarget.scrollLeft += e.deltaY;
      }}
      // Scrollbar hidden per request — Firefox/old-Edge respect the two
      // properties below directly; Chrome/Safari (WebKit/Blink) only
      // listen to the ::-webkit-scrollbar pseudo-element, which inline
      // styles can't target, so that part is done via the one scoped
      // <style> tag rendered once near the top of this file's main export.
      className="un-scroll-hidden"
      style={{
        display: 'flex', gap: 20, overflowX: 'auto', overflowY: 'hidden', scrollBehavior: 'smooth', paddingBottom: 4,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}
    >
      {listings.map(listing => (
        <div
          key={`${rowKey}-${listing.id}`}
          onClick={() => onCardClick(listing)}
          style={{
            flex: `0 0 calc(${NEARBY_CARD_WIDTH_CALC})`, borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.cardBorder}`, cursor: 'pointer', background: C.cardBg,
          }}
        >
          <div style={{ position: 'relative', height: 160 }}>
            <img src={listing.coverImage} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <PromoRibbon text={listing.promotionTag} />
            {listing.__sample && <SampleBadge />}
            <FavoriteHeart listing={listing} favoriteKeys={favoriteKeys} onToggle={onToggleFavorite} />
          </div>
          <div style={{ padding: '12px 14px 16px' }}>
            {!listing.hideHeader && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div
                  title={listing.title}
                  style={{
                    fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
                  }}
                >
                  {truncateTitle(listing.title)}
                </div>
                {listing.typeTag && (
                  <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600, color: C.textSecondary, whiteSpace: 'nowrap' }}>{listing.typeTag}</span>
                )}
              </div>
            )}
            <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.primary, marginTop: listing.hideHeader ? 0 : 4 }}>
              {listing.priceIsFrom ? 'Starting at ' : ''}$ {formatPrice(listing.priceAmount)}
              {listing.priceUnit !== 'sale' && (
                <span style={{ fontWeight: 400, fontSize: 12, color: C.textSecondary }}> / {listing.priceUnit === 'month' ? 'mo' : 'Total'}</span>
              )}
            </div>
            <SpecRow beds={listing.bedsRange || listing.beds} baths={listing.bathsRange || listing.baths} sqft={listing.sqftRange || listing.sqft} />
            {listing.description && (
              <div style={{
                fontFamily: F.body, fontSize: 11.5, lineHeight: 1.5, color: C.textSecondary, marginTop: 6,
                display: '-webkit-box', WebkitLineClamp: listing.descriptionLines || 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {listing.description}
              </div>
            )}
            {listing.addressLine && (
              <>
                <div style={{ borderBottom: `1px dotted ${C.divider}`, opacity: 0.5, margin: '10px 0 8px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: F.body, fontSize: 11, lineHeight: 1.5, color: C.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M12 21s-7-7.1-7-12a7 7 0 0 1 14 0c0 4.9-7 12-7 12z" stroke={C.textTertiary} strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="12" cy="9" r="2.3" stroke={C.textTertiary} strokeWidth="1.8" />
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.addressLine}, {listing.city}, {listing.state} {listing.zip}</span>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: C.textTertiary, textTransform: 'uppercase', marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SpecRowLight({ beds, baths, sqft }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontFamily: F.body, fontSize: 11.5, opacity: 0.9 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-bed" />{beds} Bed</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-bath" />{baths} Bath</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-ruler-2" />{sqft} Sq Ft</span>
    </div>
  );
}

function FooterCol({ head, links }) {
  return (
    <div>
      {head && <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.footerHead, marginBottom: 12 }}>{head}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F.body, fontSize: 12.5 }}>
        {links.map(l => <span key={l} style={{ cursor: 'pointer' }}>{l}</span>)}
      </div>
    </div>
  );
}
