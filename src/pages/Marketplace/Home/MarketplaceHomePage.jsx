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
import { apiGetMarketplaceDisplay } from './marketplaceHomeApi';

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
const ACCOUNT_MENU_PERSONAL = [
  'Favorites', 'Notes', 'Saved Searches', 'Suggestions', 'Agent and Co-Shopper',
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

function formatPrice(amount) {
  return amount.toLocaleString('en-US');
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

function SpecRow({ beds, baths, sqft }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 6, fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-bed" />{beds} Bed</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-bath" />{baths} Bath</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-ruler-2" />{sqft} Sq Ft</span>
    </div>
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

  function handleClearFilters() {
    setLocation('');
    setPriceRange('');
    setPropertyType('');
    setBedrooms('');
  }

  function handleSearch() {
    // No public search/results page exists yet — this is the FE-first
    // homepage pass only (confirmed scope with the user). Once a real
    // GET /api/marketplace/listings/ endpoint + results page exist, this
    // should navigate there with { listingMode, location, priceRange,
    // propertyType, bedrooms } as query params.
    console.log('[Marketplace] search (not yet wired)', { listingMode, location, priceRange, propertyType, bedrooms });
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

  function handleCardClick(listing) {
    // No listing-detail page exists yet (see Marketplace_Listing_Design_
    // Review.md screens #3/#4 for the reviewed design). Wire this to
    // navigate(`/marketplace/listing/${listing.id}`) once it's built.
    console.log('[Marketplace] open listing (not yet wired)', listing.id);
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
              { key: 'signin', label: 'Sign In', onClick: () => navigate('/login') },
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
            {[
              { label: 'Sign In', onClick: () => navigate('/login') },
              { label: 'Register', onClick: () => navigate('/signup') },
            ].map(item => (
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
                onClick={() => { console.log('[Marketplace] account menu (not yet wired):', label); setAccountMenuOpen(false); }}
                style={{ padding: '9px 20px', fontFamily: F.body, fontSize: 13.5, color: C.textPrimary, cursor: 'pointer' }}
              >
                {label}
              </div>
            ))}
          </div>,
          document.body
        )}

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto auto', gap: 14, alignItems: 'end' }}>
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
          <NearbyRow listings={NEARBY_LISTINGS} rowKey="row1" onCardClick={handleCardClick} />
        )}

        {/* Row 2 — revealed by "See More". No real pagination endpoint
            exists yet (same gap as the rest of this mock-data file), so
            this demo row reuses NEARBY_LISTINGS again (reversed, so it
            reads as distinct content rather than a literal duplicate) —
            an honest placeholder for "the next batch of nearby listings",
            not real additional data. */}
        {nearbyRowsShown >= 2 && (
          <div style={{ marginTop: 20 }}>
            <NearbyRow listings={[...NEARBY_LISTINGS].reverse()} rowKey="row2" onCardClick={handleCardClick} />
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
function NearbyRow({ listings, rowKey, onCardClick }) {
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
          </div>
          <div style={{ padding: '12px 14px 16px' }}>
            {!listing.hideHeader && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{listing.title}</div>
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
