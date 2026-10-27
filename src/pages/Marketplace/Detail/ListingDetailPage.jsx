// src/pages/Marketplace/Detail/ListingDetailPage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 7 — public detail page for an Individual Unit Listing.
// Build decisions this implements (see listings/
// Marketplace_Listing_Design_Review.md §7.9/§7.10, all confirmed with the
// user before this file was written):
//   #2 Ad banner: sample/placeholder image only (AdPlaceholderCard).
//   #3 CTAs: Apply Now / Book A Tour / Connect Now all render as "Coming
//      soon" (ComingSoonButton) — no application/booking/messaging backend
//      exists yet.
// Data source: GET /api/marketplace/listing/<id>/
// (rules_engine.marketplace_display.public_views.MarketplaceListingDetailView
// — public, AllowAny, same eligibility bar as every other Marketplace read
// path).
//
// Session 51, Phase 9 — rebuilt to match the same user-supplied reference
// design already applied to the Multi-Unit page in Phase 8 (full top nav +
// footer, hero gallery + vertical sample-ad rail, two-column Costs & Fees /
// Floor Plan row, two-column Special Features / Location row, sticky price
// + CTA rail, a 4-up Similar Deals grid). Per the user's explicit
// instruction ("implement the individual unit page also similar to the
// attached design... the only change allowed is with respect to the color
// selection & sample images"), this page now shares the exact same shell
// (TopNav/SiteFooter/SectionCard/LocationPanel/AmenityIconList) as
// PropertyListingDetailPage.jsx — only the data shape feeding it differs,
// since a single Listing has no unit-group picker and its Costs & Fees are
// one real ListingRentalTerms/ListingSaleTerms row (never a computed
// range, unlike the Multi-Unit page). Colors stay on this file's C/F
// tokens; images stay sample/placeholder — same constraint already applied
// to the Multi-Unit rebuild.
//
// Session 51, Phase 33 — reworked again to match the user's own 3-screenshot
// reference of the (by-then-current) PropertyListingDetailPage.jsx, with a
// list of explicit changes (all confirmed in chat, this phase's own
// messages): (a) hero gallery now matches the Multi-Unit page exactly —
// cover photo + thumb rail + a 3x2 GalleryPreviewGrid beside it, replacing
// the old sample vertical Ad rail and MediaCountBar overlay; (b) that Ad
// rail is gone outright, not replaced by anything else on this page (the
// Multi-Unit page's own separate Advertisement slot, beside its Visual
// Tour & Media section, was a Multi-Unit-only addition the user explicitly
// did NOT ask for here); (c)+(d) the titular Name/Description card is now
// narrower — pinned to the exact width the old "Costs & Fees + 20px gap +
// Floor Plan" row used to occupy (see the titular row's own comment below
// for the math) — with a new "Listing Agent" card filling the freed space
// to its right, matched to the titular card's own height via ordinary flex
// stretch; (e) Favorite (heart) and Share icons sit at the titular card's
// top-right corner, above the Description column; (f) Costs & Fees keeps
// its existing 2-column design untouched, but Pet Deposit is now always
// shown (was hidden outright when pets aren't allowed — now reads "Not
// allowed", matching Pet Rent's own existing fallback) and a new "See
// More" link opens the same fee breakdown in a UNModalShell popup; (g) the
// old standalone Floor Plan card is gone — Visual Tour & Media (the exact
// same component, tabs, and tile-building helpers as the Multi-Unit page,
// including its own Floor Plan tab) now fills that entire slot beside
// Costs & Fees; (h) the old Special Features/Location 2-up row is replaced
// by the Multi-Unit page's own Neighbourhood / Facilities & Parking /
// Special Features 3-up row — same three components, reused as-is — with
// the Special Features card's title renamed "Unit Special Feature" per the
// user's own explicit wording (this page is about one unit, not the whole
// property). The old sticky Listing Contact rail is gone — its real
// content (contact + Apply/Book Tour/Contact CTAs) lives in the new titular-
// row Listing Agent card now instead (see ListingContactCard's new
// `layout="sideBySide"` variant in marketplaceDetailShared.jsx).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { C, F } from '../Home/marketplaceTokens';
import { apiGetListingDetail } from '../Home/marketplaceHomeApi';
import { apiAddFavorite, apiListFavorites, apiRemoveFavorite } from '../Account/marketplaceAccountApi';
import {
  AmenityIconList, cardHref, FacilitiesParkingSection, FeeColumn, FeeRow, floorPlanTiles,
  GalleryPreviewGrid, HERO_IMAGE_HEIGHT, HERO_THUMB_HEIGHT, Lightbox,
  ListingContactCard, LocationPanel, MiniCard, PageState, PromotionBadge,
  SAMPLE_PROPERTY_PHOTOS, SectionCard, SiteFooter, TopNav,
  tourMediaTiles, tourSampleTiles, TOUR_3D_SAMPLE_COUNT, VIRTUAL_STAGING_SAMPLE_COUNT, VisualTourMediaSection,
  UNModalShell, money, specOrRange,
} from './marketplaceDetailShared';

// The 'real-' prefix _serialize_listing_card()/MarketplaceHomePage's own
// handleCardClick route-build already use — strip it so we always call the
// API with the bare numeric pk, whether we arrived via navigate(`/marketplace
// /listing/real-42`) or a bare `/marketplace/listing/42` typed/linked directly.
function _bareId(raw) {
  return String(raw || '').replace(/^real-/, '');
}

// Session 51, Phase 34 — the Description column's "3 sample lines"
// fallback (see its own call site comment below). Plain generic copy, no
// invented specifics (no address, no price, no amenity claims) — it's
// filler for an empty field, not a fabricated listing description.
const _SAMPLE_UNIT_DESCRIPTION =
  'This bright, well-maintained unit offers a comfortable layout with generous natural light throughout.\n' +
  'Recently updated finishes and in-unit conveniences make everyday living easy and low-maintenance.\n' +
  'Ideally located close to local shops, dining, and transit, with easy access to major routes.';

// Real sub-groups only — same "no fake data" posture already applied to
// the Multi-Unit page's GroupFeesBlock. The reference design's Water &
// Sewer fee, Renters Insurance Fee, and Administration Fee line items are
// NOT shown here because none of those are fields `_fee_breakdown()` /
// `ListingRentalTerms` actually returns for a real Listing (design review
// §2.3, still-open decision #6) — inventing numbers for them would break
// the convention already established for the "Coming soon" CTAs and the
// sample-only ad card. Storage Fee and Parking Fee ARE real here (unlike
// the Multi-Unit page's computed ranges) — `other_fees`/`parking_fee` are
// genuine per-Listing JSON fields, so they're shown when present.
//
// Session 51, Phase 33 — two user asks: (a) Pet Deposit is now always
// rendered (was `{fees.petsAllowed && <FeeRow .../>}`, which dropped the
// row entirely when pets aren't allowed) — now mirrors Pet Rent's own
// existing "Not allowed" fallback, so both pet-related fields are always
// visible with whatever their real value is; (b) a "See More" link at the
// card's bottom-right reopens this exact same block's content in a larger
// UNModalShell popup — nothing new is shown there (there's no further real
// fee data behind this component to reveal), it's just a bigger view of
// the same real fields, same "no fake data" posture as everywhere else on
// this page.
function IndividualFeesBlock({ fees, listingType }) {
  const [seeMoreOpen, setSeeMoreOpen] = useState(false);
  if (!fees) {
    return <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>Costs & fees not available.</div>;
  }
  // Session 51, Phase 34 — user ask: "Sub sections and values under it in
  // a single column." Was two side-by-side flex columns (flex:'1 1
  // 220px' x2); each sub-section (FeeColumn) now just stacks directly on
  // top of the next, full width, separated by the same 18px spacer this
  // block already used between Rent & Fees and Optional Charges.
  const body = listingType === 'RENT' ? (() => {
    const storageFee = (fees.otherFees || []).find(f => /storage/i.test(f?.type || ''));
    const parkingAmount = fees.parkingFee?.amount;
    return (
      <div>
        <FeeColumn heading="Rent & Fees">
          <FeeRow label="Base rent" value={fees.rentAmount != null ? `${money(fees.rentAmount)} / month` : null} />
          <FeeRow label="Lease Term" value={fees.leaseTermMonths ? `${fees.leaseTermMonths} months` : null} />
        </FeeColumn>
        <div style={{ height: 18 }} />
        <FeeColumn heading="Optional Charges">
          <FeeRow label="Pet rent" value={fees.petsAllowed ? (fees.petRent != null ? `${money(fees.petRent)} / month` : null) : 'Not allowed'} />
          <FeeRow label="Storage Fee" value={storageFee?.amount != null ? `${money(storageFee.amount)} / month` : null} />
          <FeeRow label="Parking Fee" value={parkingAmount != null ? `${money(parkingAmount)} / month` : null} />
        </FeeColumn>
        <div style={{ height: 18 }} />
        <FeeColumn heading="Mandatory One-time Fees">
          <FeeRow label="Security Deposit" value={money(fees.securityDeposit)} />
          <FeeRow label="Application Fee" value={fees.applicationFee != null ? money(fees.applicationFee) : 'Contact for details'} />
          <FeeRow label="Pet Deposit" value={fees.petsAllowed ? (fees.petDeposit != null ? money(fees.petDeposit) : null) : 'Not allowed'} />
        </FeeColumn>
      </div>
    );
  })() : (
    <div>
      <FeeColumn heading="Price & Tax">
        <FeeRow label="Asking Price" value={money(fees.askingPrice)} />
        <FeeRow label="Property Tax" value={money(fees.propertyTax)} />
        <FeeRow label="Available" value={fees.availableDate} />
      </FeeColumn>
      <div style={{ height: 18 }} />
      <FeeColumn heading="HOA">
        <FeeRow label="HOA Fee" value={fees.hoa ? `${money(fees.hoaFee)} / ${fees.hoaFeeFrequency || 'month'}` : 'None'} />
        <FeeRow label="Seller Financing" value={fees.sellerFinancing ? 'Available' : null} />
      </FeeColumn>
    </div>
  );
  return (
    <div>
      {body}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button
          onClick={() => setSeeMoreOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: C.primary, fontFamily: F.body, fontWeight: 700, fontSize: 12.5,
          }}
        >
          See More
        </button>
      </div>
      {seeMoreOpen && (
        <UNModalShell title="Costs & Fees" onClose={() => setSeeMoreOpen(false)} width={520}>
          {body}
        </UNModalShell>
      )}
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  // Session 51, Phase 14 — replaces the old inline hero-video toggle
  // (showVideo) entirely: clicking the hero image, any thumbnail, or the
  // play button now opens the shared Lightbox instead, so photos and
  // videos scroll back and forth in one popup rather than swapping the
  // hero's own background. null = closed; a number = open at that index
  // into heroMediaItems.
  // Session 51, Phase 33 — floorPlanLightboxIndex (a separate, standalone
  // Floor Plan popup) is gone along with the old standalone Floor Plan
  // card; tourLightbox ({tab, index} | null) replaces it, the same single
  // popup state the Multi-Unit page's own Visual Tour & Media section uses
  // for all of its Photos/Videos/Floor Plan tabs.
  const [heroLightboxIndex, setHeroLightboxIndex] = useState(null);
  const [tourLightbox, setTourLightbox] = useState(null);
  // Session 51, Phase 33 — user ask: Favorite (heart) + Share icons at the
  // titular card's top-right corner. Share does a real, honest action —
  // copying this page's own URL to the clipboard — rather than faking a
  // native share sheet.
  // Session 51, Phase 39 — bugfix: Favorite was shipped as a local-only
  // toggle under the (incorrect) assumption that no favorites backend
  // existed for this data model. One does — marketplace_account's real
  // MarketplaceFavorite model/API, already wired up on MarketplaceHomePage.
  // jsx's own heart icons (FavoriteHeart/toggleFavorite there) — so a unit
  // favorited from this page was never actually persisted, and correctly
  // never showed up in the Home page's Favorites list. This now calls the
  // exact same apiListFavorites/apiAddFavorite/apiRemoveFavorite endpoints,
  // keyed off this unit's own `data.unitId` (the same field
  // MarketplaceHomePage.jsx's FavoriteHeart/toggleFavorite key off of for a
  // unit card — see public_views.py's own comment on `'unitId': unit.id`).
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const favoriteIdRef = useRef(null); // the MarketplaceFavorite row's own id, for DELETE
  const [shareCopied, setShareCopied] = useState(false);

  // Loads this unit's own favorited state once the unit itself is loaded
  // (need data.unitId) and there's a logged-in user to own a Favorite row.
  // Logged-out visitors simply see the outline (unfilled) heart — same
  // "gate on click, not on render" posture as the Home page.
  useEffect(() => {
    if (!user || data?.unitId == null) {
      setFavorited(false);
      favoriteIdRef.current = null;
      return;
    }
    let cancelled = false;
    apiListFavorites()
      .then(rows => {
        if (cancelled) return;
        const match = rows.find(r => r.unit === data.unitId);
        setFavorited(!!match);
        favoriteIdRef.current = match ? match.id : null;
      })
      .catch(e => { console.warn('[Marketplace] load favorite status failed:', e); });
    return () => { cancelled = true; };
  }, [user, data?.unitId]);

  // Same gate + optimistic-update-with-revert-on-failure shape as
  // MarketplaceHomePage.jsx's own toggleFavorite.
  function toggleFavorite() {
    if (!user) { navigate('/'); return; }
    if (data?.unitId == null) return;
    const wasFav = favorited;
    setFavorited(!wasFav);

    if (wasFav) {
      const favId = favoriteIdRef.current;
      if (favId == null) return;
      apiRemoveFavorite(favId).then(() => {
        favoriteIdRef.current = null;
      }).catch(e => {
        console.warn('[Marketplace] remove favorite failed:', e);
        setFavorited(true);
      });
    } else {
      apiAddFavorite({ unit: data.unitId }).then(row => {
        favoriteIdRef.current = row.id;
      }).catch(e => {
        console.warn('[Marketplace] add favorite failed:', e);
        setFavorited(false);
      });
    }
  }

  function handleShare() {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1600);
    }).catch(() => {});
  }

  // index.css sets a GLOBAL `body { overflow: hidden }` — same gap
  // MarketplaceHomePage.jsx's own mount effect already works around (see
  // that file's comment on this exact fix). This is an ordinary long page
  // that needs the document itself to scroll, so it's scoped here rather
  // than touched globally, and restored on unmount.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    apiGetListingDetail(_bareId(id))
      .then(d => { if (!cancelled) { setData(d); setStatus('ready'); setHeroLightboxIndex(null); setTourLightbox(null); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [id]);

  if (status === 'loading') return <PageState>Loading…</PageState>;
  if (status === 'error' || !data) {
    return (
      <PageState>
        This listing is no longer available.
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: C.primary, color: C.white, fontFamily: F.body, fontWeight: 700,
            }}
          >
            Back to Marketplace
          </button>
        </div>
      </PageState>
    );
  }

  const addr = data.address || {};
  const addressLine = [addr.street1, addr.street2].filter(Boolean).join(', ');
  const cityStateZip = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
  const mapsUrl = addr.latitude != null && addr.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`
    : null;
  // Session 51, Phase 14 — photosFull/videos now feed the shared Lightbox
  // (every photo and video, not just the first 4), while thumbPhotos stays
  // the capped rail the hero already showed. heroMediaItems is the single
  // mixed list the Lightbox scrolls through; coverIndex opens it lined up
  // with whichever photo is actually showing as the hero background.
  const photosFull = data.gallery?.photos || [];
  const thumbPhotos = photosFull.slice(0, 4);
  const videos = data.gallery?.videos || [];
  const heroMediaItems = [
    ...photosFull.map(url => ({ type: 'photo', url })),
    ...videos.map((url, i) => ({ type: 'video', url, label: `Video ${i + 1}` })),
  ];
  const coverIndex = Math.max(photosFull.indexOf(data.gallery?.coverImage), 0);
  const firstVideoIndex = photosFull.length;
  // Prefer the real gallery's FLOOR_PLAN_IMAGE rows (same shape the
  // Multi-Unit page's Floor Plan tab already reads) over the single
  // legacy `floorPlan.imageUrl` field, so a landlord who uploaded several
  // floor plan renders sees all of them, not just one. Falls back to the
  // singular field when no gallery rows exist, so nothing regresses for a
  // listing that only ever had the old single-image field filled in.
  // floorPlanTiles() then pads this up to a minimum of 3 tiles with a
  // labeled sample schematic when fewer than 3 real ones exist.
  const floorPlanImages = (data.gallery?.floorPlanImages?.length > 0)
    ? data.gallery.floorPlanImages
    : (data.floorPlan?.imageUrl ? [data.floorPlan.imageUrl] : []);
  const floorPlanTileList = floorPlanTiles(floorPlanImages);
  const floorPlanLightboxItems = floorPlanTileList.map(t => ({ type: 'photo', url: t.url, label: t.sample ? 'Sample floor plan' : null }));

  // Session 51, Phase 33 — Visual Tour & Media's tabs, built exactly the
  // same way PropertyListingDetailPage.jsx builds them (same helpers, same
  // tab list, same lightbox item lists kept 1:1 with each tab's tiles).
  const tourPhotoTiles = tourMediaTiles('photo', photosFull);
  const tourVideoTiles = tourMediaTiles('video', videos);
  const tourTabs = [
    { key: 'photos', label: 'Photos', icon: 'ti-photo', tiles: tourPhotoTiles },
    { key: 'videos', label: 'Videos', icon: 'ti-player-play', tiles: tourVideoTiles },
    { key: 'floorplan', label: 'Floor Plan', icon: 'ti-layout-2', tiles: floorPlanTileList },
    { key: 'tour3d', label: '3D Tour', icon: 'ti-rotate-3d', tiles: tourSampleTiles('tour3d', TOUR_3D_SAMPLE_COUNT, 'Sample 3D tour', 'ti-rotate-3d') },
    { key: 'staging', label: 'Virtual Staging', icon: 'ti-armchair', tiles: tourSampleTiles('staging', VIRTUAL_STAGING_SAMPLE_COUNT, 'Sample staging', 'ti-armchair') },
  ];
  const tourLightboxItemsByTab = {
    photos: tourPhotoTiles.filter(t => !t.sample).map(t => ({ type: 'photo', url: t.url })),
    videos: tourVideoTiles.filter(t => !t.sample).map(t => ({ type: 'video', url: t.url, label: t.label })),
    floorplan: floorPlanLightboxItems,
  };
  const tourLightboxItems = tourLightbox ? (tourLightboxItemsByTab[tourLightbox.tab] || []) : [];

  return (
    <div style={{ background: C.pageBg, minHeight: '100vh', fontFamily: F.body }}>
      <TopNav navigate={navigate} />

      {/* ── Hero gallery + 3x2 photo grid ─────────────────────────────────
          Session 51, Phase 33 — user ask: "make the hero image section
          same as at the Property level" — this is now a byte-for-byte
          copy of PropertyListingDetailPage.jsx's own hero block (cover
          photo with a "Sample" fallback badge, thumb rail, 3x2
          GalleryPreviewGrid). The old vertical sample Ad rail and
          MediaCountBar overlay this page used before are both gone —
          removing the Ad rail here (not replacing it with anything) was
          the user's own explicit, separate ask. */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 24px 0', display: 'flex', gap: 14 }}>
        <div style={{ flex: '1 1 640px', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div
              onClick={() => setHeroLightboxIndex(coverIndex)}
              style={{
                flex: '1 1 auto', position: 'relative', height: HERO_IMAGE_HEIGHT, borderRadius: 12,
                overflow: 'hidden', background: C.inputBg, cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: `url(${data.gallery?.coverImage || SAMPLE_PROPERTY_PHOTOS[0]}) center/cover` }} />
              {!data.gallery?.coverImage && (
                <div style={{
                  position: 'absolute', bottom: 14, right: 14, zIndex: 2, padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(10,22,40,0.72)', color: 'rgba(255,255,255,0.9)',
                  fontFamily: F.body, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  Sample
                </div>
              )}
              {videos.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setHeroLightboxIndex(firstVideoIndex); }}
                  aria-label="Play video"
                  style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className="ti ti-player-play-filled" style={{ fontSize: 22, color: C.primary }} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/marketplace'); }}
                style={{
                  position: 'absolute', top: 14, left: 14, zIndex: 2,
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.92)', fontFamily: F.body, fontWeight: 700, fontSize: 13,
                }}
              >
                <i className="ti ti-arrow-left" style={{ marginRight: 6 }} />
                Back
              </button>
              {data.promotionTag && (
                <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
                  <PromotionBadge text={data.promotionTag} />
                </div>
              )}
            </div>

            {thumbPhotos.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 130, flexShrink: 0 }}>
                {thumbPhotos.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setHeroLightboxIndex(i)}
                    style={{
                      position: 'relative', height: HERO_THUMB_HEIGHT, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
                      background: `url(${url}) center/cover`, border: `1px solid ${C.cardBorder}`,
                    }}
                  >
                    {i === 3 && photosFull.length > 4 && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(10,22,40,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: C.white, fontFamily: F.body, fontSize: 11.5, fontWeight: 700,
                      }}>
                        More
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: '0 0 300px' }}>
          <GalleryPreviewGrid photos={photosFull} onOpen={(i) => setHeroLightboxIndex(i)} />
        </div>
      </div>

      {/* ── Name & Description (titular) + Listing Agent ──────────────────
          Session 51, Phase 33 — user asks (c) + (d): titular card beside
          a new Listing Agent card.
          Session 51, Phase 35 — user ask (a): explicit 70%/30% split.
          First tried as a flexbox row with `flex:'1 1 70%'`/`'1 1 30%'`
          — that's WRONG: those two basis percentages already sum to
          100%, so adding this row's 24px gap on top makes the combined
          hypothetical width exceed the container by exactly 24px: with
          `flexWrap:'wrap'` set, the browser decides line-breaking using
          each item's un-shrunk hypothetical size, BEFORE flex-shrink
          ever gets a chance to make them fit — so the second item
          (Listing Agent) gets pushed onto its own line instead of
          staying "side by side" as asked, no matter what flex-shrink is
          set to. This is the exact same "percentages + gap can add up to
          over 100%" family of bug already hit (and fixed) once before in
          this file — GroupFeesBlock's own Phase 27 comment — just
          showing up in flexbox's line-wrapping test this time instead of
          CSS Grid's track sizing. Same fix: CSS Grid with `fr` tracks,
          which divide up the space LEFT OVER after gaps are subtracted,
          so 7fr/3fr always sums to exactly 100% of the available width
          and the two cards can never be forced onto separate lines.
          `minmax(0, Nfr)` (not bare `Nfr`) lets each track shrink below
          its content's natural min-width when needed, instead of forcing
          the grid itself wider than the row. Grid's own default
          `align-items:'stretch'` keeps both cards matched to the same
          height automatically, same as flexbox's default did. */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 24px 0', display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: 24 }}>
        <div>
          <SectionCard style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, boxSizing: 'border-box', height: '100%', marginBottom: 0 }}>
            {/* Session 51, Phase 33 — user ask (e): Favorite (heart) and
                Share icons at the top-right corner, above the Description
                column. Session 51, Phase 39 — Favorite now calls the real
                toggleFavorite() (see this component's own header comment) —
                this heart's filled/outline state is the real
                MarketplaceFavorite row's existence, same as the Home page's
                hearts, not local-only UI. */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={toggleFavorite}
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: `1px solid ${C.cardBorder}`,
                  background: C.cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i
                  className={favorited ? 'ti ti-heart-filled' : 'ti ti-heart'}
                  style={{ fontSize: 16, color: favorited ? '#DC2626' : C.textSecondary }}
                />
              </button>
              <button
                onClick={handleShare}
                aria-label={shareCopied ? 'Link copied' : 'Share this listing'}
                title={shareCopied ? 'Link copied' : 'Share this listing'}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: `1px solid ${C.cardBorder}`,
                  background: C.cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className={shareCopied ? 'ti ti-check' : 'ti ti-share-3'} style={{ fontSize: 15, color: shareCopied ? '#16A34A' : C.textSecondary }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ fontFamily: F.serif, fontSize: 21, fontWeight: 700, color: C.textPrimary }}>{data.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: F.body, fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 14 }} />
                  {addressLine}{addressLine && cityStateZip ? ', ' : ''}{cityStateZip}
                </div>
                <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: C.textPrimary, marginTop: 10 }}>
                  {data.listingType === 'RENT'
                    ? (data.fees?.rentAmount != null ? `${money(data.fees.rentAmount)} / Month` : '—')
                    : (data.fees?.askingPrice != null ? money(data.fees.askingPrice) : '—')}
                </div>
                <div style={{ display: 'flex', gap: 18, marginTop: 10, fontFamily: F.body, fontSize: 13, color: C.textSecondary }}>
                  <span><i className="ti ti-bed" /> {specOrRange(data.beds, null, 'Bed')}</span>
                  <span><i className="ti ti-bath" /> {specOrRange(data.baths, null, 'Bath')}</span>
                  <span><i className="ti ti-ruler-2" /> {specOrRange(data.sqft, null, 'Sq Ft')}</span>
                </div>
              </div>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: C.textTertiary }}>
                    Description
                  </div>
                  {/* Session 51, Phase 34 — user ask: "put three sample
                      lines" in Description. No real `description` field
                      exists on plenty of test listings yet, so — same "no
                      fake data, clearly labeled sample" posture as every
                      other placeholder on this page (hero's "Sample"
                      badge, the floor plan/gallery sample tiles) — this
                      renders 3 lines of honestly-tagged sample copy
                      instead of the old bare "No description provided."
                      fallback, only when the real field is empty; a real
                      description is shown exactly as before. */}
                  {!data.description && (
                    <span style={{
                      display: 'inline-block', fontFamily: F.body, fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
                      textTransform: 'uppercase', color: C.textTertiary, background: C.inputBg, borderRadius: 5, padding: '2px 6px',
                    }}>
                      Sample
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13.5, color: C.textPrimary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {data.description || _SAMPLE_UNIT_DESCRIPTION}
                </div>
                {data.highlights?.length > 0 && (
                  <ul style={{ marginTop: 10, paddingLeft: 18, color: C.textSecondary, fontSize: 13 }}>
                    {data.highlights.map((h, i) => <li key={i} style={{ marginBottom: 3 }}>{h}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Listing Agent" style={{ height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <ListingContactCard contact={data.leadContact} listingTitle={data.title} layout="sideBySide" />
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* ── Costs & Fees / Facilities & Parking / Unit Special Feature ───
            Session 51, Phase 34 — user ask: a full swap with the row
            below. Facilities & Parking and Unit Special Feature move up
            into this row (each 30% of its width), displacing Visual Tour
            & Media, which moves down into the row below instead — see
            that row's own comment. Costs & Fees keeps this row's
            remaining 40%.
            Session 51, Phase 35 — CORRECTION: Phase 34's own comment here
            claimed a flexbox row with percentage `flex-basis` values
            summing to 100% plus non-zero gaps was safe because of
            flex-shrink — that's wrong when `flexWrap:'wrap'` is set (as
            it was): flex-wrap decides line-breaking using each item's
            un-shrunk hypothetical size, before flex-shrink is ever
            applied, so the combined 100%-of-basis + 40px of gaps was
            exceeding the row and pushing items onto their own lines
            instead of staying "side by side" — the user's exact, correct
            complaint. Same CSS Grid + `fr` fix as the titular row above
            (see its own comment for the full explanation); `minmax(0,
            Nfr)` tracks divide up the space left over after the 20px
            gaps are subtracted, so 4fr/3fr/3fr always sums to exactly
            100% and the three cards can never wrap apart. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 4fr) minmax(0, 3fr) minmax(0, 3fr)', gap: 20 }}>
          <div>
            <SectionCard title="Costs & Fees" style={{ height: '100%', boxSizing: 'border-box' }}>
              <IndividualFeesBlock fees={data.fees} listingType={data.listingType} />
            </SectionCard>
          </div>
          <div>
            <FacilitiesParkingSection />
          </div>
          <div>
            <SectionCard title="Unit Special Feature" style={{ height: '100%', boxSizing: 'border-box' }}>
              <AmenityIconList amenities={data.amenities} maxVisible={10} />
            </SectionCard>
          </div>
        </div>

        <div style={{ height: 28 }} />

        {/* ── Neighbourhood / Visual Tour & Media ────────────────────────
            Session 51, Phase 34 — the other half of the swap above:
            Facilities & Parking and Unit Special Feature left this row,
            so Visual Tour & Media (same component/tabs/helpers as
            PropertyListingDetailPage.jsx, Floor Plan among its own tabs)
            fills the space they vacated, beside Neighbourhood.
            Session 51, Phase 35 — CORRECTION: the user actually asked for
            the HEIGHT of these two cards cut by 30%, not the width — and
            for the width ("LENGTH") to go back to what it was before
            Phase 34's (wrong) width cut. Width is back to the original
            even flex-grow split (`flex:'1 1 400px'` each, filling the
            full row, same as Phase 33 originally shipped). Height is
            handled the only way it actually can be here: both cards'
            heights are DRIVEN by a fixed-pixel element inside them
            (LocationMapPanel's 240px map box; TourMediaSingleBig's 460px
            media box) — there's no other "height" to shrink, since
            everything else in each card (tabs, padding, text) is already
            its own natural/minimal size. Both components gained a new
            opt-in height-override prop (`mapHeight` / `mediaHeight`, see
            their own comments in marketplaceDetailShared.jsx) so only
            THIS page's two cards get the reduction — 240×0.7=168,
            460×0.7=322 — while PropertyListingDetailPage.jsx's own
            Neighbourhood and Visual Tour & Media cards are completely
            unaffected (those call sites don't pass either prop, so they
            keep the original 240/460). "Fit the images within the
            reduced section area": TourMediaSingleBig's image itself is
            `width:'80%'` of its own container with `objectFit:'cover'`
            inside a box whose height now IS the 322px override, so the
            image always fills that box exactly, never overflowing it.
            Session 51, Phase 38 — user ask: Neighbourhood should occupy
            40% of this row and Visual Tour & Media 60%, with both
            cards' HEIGHTS equal. Switched from the even flex-grow split
            above to CSS Grid with `minmax(0, Nfr)` tracks — the SAME
            fix pattern already proven correct this session for the
            Titular/Listing Agent row and the Costs & Fees/Facilities &
            Parking/Unit Special Feature row: bare percentage (or bare
            `fr`) flex-basis tracks summing to 100% get pushed onto
            separate lines by `flexWrap:'wrap'` once `gap` is added,
            because the wrap decision uses each item's un-shrunk
            hypothetical size before flex-shrink ever applies. Grid's
            `fr` tracks divide space AFTER subtracting gaps and have no
            such wrap-before-shrink behavior, so 2fr/3fr reliably gives
            an exact 40/60 split with no risk of the cards separating
            onto their own lines. Equal heights fall out of Grid's
            default `align-items:'stretch'` (each grid row is as tall as
            its tallest cell) combined with both cards already using
            `SectionCard style={{height:'100%'}}` — the taller of the
            two (Visual Tour & Media, 322px media box vs. Neighbourhood's
            168px map box, plus its own Location/Schools/Transit tabs)
            sets the row height, and Neighbourhood's card stretches to
            match, leaving some empty space below its map — there's no
            content to grow into, since the map itself stays at its
            fixed 168px override. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)', gap: 20 }}>
          <div>
            {/* Session 51 fix — card title now reads "Neighbourhood: <zip>"
                per the user's request, using the same addr.zip already
                read above for the address line. Falls back to the bare
                "Neighbourhood" label on the rare listing with no zip on
                file, rather than showing a dangling colon. */}
            <SectionCard title={addr.zip ? `Neighbourhood: ${addr.zip}` : 'Neighbourhood'} style={{ height: '100%', boxSizing: 'border-box' }}>
              <LocationPanel
                mapsUrl={mapsUrl}
                latitude={addr.latitude}
                longitude={addr.longitude}
                neighborhood={data.neighborhood}
                label={data.title}
                mapHeight={168}
              />
            </SectionCard>
          </div>
          <div>
            <VisualTourMediaSection
              tabs={tourTabs}
              onOpenTile={(tab, index) => setTourLightbox({ tab, index })}
              mediaHeight={322}
              style={{ height: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {data.similarDeals?.length > 0 && (
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 60px' }}>
          <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 14, textAlign: 'center' }}>
            Similar Deals
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {data.similarDeals.map(card => (
              <MiniCard
                key={card.id}
                coverImage={card.coverImage}
                title={card.title}
                subtitle={[card.city, card.state].filter(Boolean).join(', ')}
                priceLabel={card.priceAmount != null ? `${card.priceIsFrom ? 'From ' : ''}${money(card.priceAmount)}${card.priceUnit === 'month' ? '/mo' : ''}` : null}
                onClick={() => { const href = cardHref(card); if (href) navigate(href); }}
              />
            ))}
          </div>
        </div>
      )}

      <SiteFooter />

      {heroLightboxIndex !== null && (
        <Lightbox items={heroMediaItems} startIndex={heroLightboxIndex} onClose={() => setHeroLightboxIndex(null)} />
      )}
      {tourLightbox !== null && (
        <Lightbox items={tourLightboxItems} startIndex={tourLightbox.index} onClose={() => setTourLightbox(null)} />
      )}
    </div>
  );
}
