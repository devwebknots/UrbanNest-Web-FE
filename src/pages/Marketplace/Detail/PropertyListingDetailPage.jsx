// src/pages/Marketplace/Detail/PropertyListingDetailPage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 51, Phase 7 — public detail page for a Multi-Unit / Property-
// Level Listing (PropertyListing). Build decisions this implements (see
// listings/Marketplace_Listing_Design_Review.md §7.9/§7.10, all confirmed
// with the user before this file was written):
//   #1 Costs & Fees: a COMPUTED min–max range, aggregated live across the
//      group's child Listings (never a stored property-level field — the
//      backend's _group_fee_ranges() is why this page renders ranges
//      instead of one fixed number).
//   #2 Ad banner: sample/placeholder image only (AdPlaceholderCard).
//      Removed Session 51, Phase 21 per the user's wireframe — see that
//      phase's header note below; kept here as a historical record of
//      the decision this page originally shipped with.
//   #3 CTAs: Apply Now / Book A Tour / Connect Now all render as "Coming
//      soon" (ComingSoonButton).
//   #4 Unit picker: each tile is a real child Listing (Listing.
//      property_listing grouping), labeled by its floor plan name / own
//      title / a positional fallback — never the generic "Room N" the
//      reviewed Figma used.
// Data source: GET /api/marketplace/property-listing/<id>/
// (MarketplacePropertyListingDetailView).
//
// Session 51, Phase 8 — rebuilt to match the user-supplied reference design
// (a "Stay Homes" style property page: hero gallery + vertical ad rail,
// two-column Costs & Fees / Floor Plan row, two-column Special Features /
// Location row, an Available Units grid, a full top nav + footer). Per the
// user's explicit instruction this round, the ONLY things that change from
// the reference design are color selection (stays on this file's C/F
// tokens, never the reference's own palette) and sample images (reused
// Marketplace placeholders, never the reference's specific photos) — the
// structure/layout itself now matches. Every number on the page is still
// real data from the API above; nothing here invents a field the backend
// doesn't actually return (see GroupFeesBlock's comment for why a few of
// the reference's fee line items — Water & Sewer, Storage, Renters
// Insurance, Administration Fee — are deliberately left off rather than
// faked, per this product's established "no fake data" posture).
//
// Session 51, Phase 21 — layout rebuilt again per the user's own
// wireframe round (`V2_FullPage.dc.html`, iterated live via Artifact
// comment threads): the vertical sample Ad rail beside the hero is gone,
// replaced by a 3x2 grid of real photos (GalleryPreviewGrid); Listing
// Agent (the old page-long sticky Listing Contact rail) now sits beside
// Property Name/Description in its own row instead; a new Facilities &
// Parking card (sample/backlog content — see FacilitiesParkingSection's
// own comment) sits beside Neighbourhood in a new row; Visual Tour &
// Media's Photos tab now shows exactly 5 tiles filling the row, and
// Videos/3D Tour/Virtual Staging collapse into one big 80%-width
// display. Available Units is unchanged.
//
// Session 51, Phase 22 — three more user asks on top of Phase 21: (a)
// the titular row (Name/Description + Listing Agent) is ~half its
// previous height — tighter padding/margins, a 2-line description
// clamp, and a new `compact` layout on ListingContactCard; (b) Costs &
// Fees is back to full width (matching the titular row), no longer
// paired with Special Features at ~70/30; (c) Costs & Fees' contents are
// back to 3 columns (Rent & Fees / Pet Policy / Lease — note the
// reordered middle/last column vs. Phase 20's original order). Special
// Features itself moved into the Neighbourhood/Facilities & Parking row
// as a third column — the user's own choice when asked where it should
// go once Costs & Fees no longer had room beside it.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C, F } from '../Home/marketplaceTokens';
import { apiGetPropertyListingDetail } from '../Home/marketplaceHomeApi';
import {
  AdPlaceholderCard, AmenityIconList, AvailableUnitsTable, cardHref, FacilitiesParkingSection, FeeColumn, FeeRow,
  FloorPlanGrid, floorPlanTiles, GalleryPreviewGrid, HERO_IMAGE_HEIGHT, HERO_THUMB_HEIGHT, Lightbox,
  ListingContactCard, LocationPanel, MiniCard, PageState, PromotionBadge, SAMPLE_PROPERTY_PHOTOS, SectionCard, SiteFooter, TopNav,
  tourMediaTiles, tourSampleTiles, TOUR_3D_SAMPLE_COUNT, VIRTUAL_STAGING_SAMPLE_COUNT, VisualTourMediaSection,
  money, moneyOrRange, specOrRange,
} from './marketplaceDetailShared';

function _bareId(raw) {
  return String(raw || '').replace(/^realgroup-/, '');
}

// Helper used only by the Pet Policy column below — same shape as
// moneyOrRange(), but returns null (so FeeRow hides the row entirely)
// rather than the string "—" when neither a single value nor a range
// exists, since a unit's pet deposit/rent is only meaningful when that unit
// actually allows pets — showing "Pet Deposit: —" on a group where no unit
// allows pets at all would be a row with nothing real behind it.
function _petMoneyOrNull(single, range) {
  return (single != null || range) ? moneyOrRange(single, range) : null;
}

// Session 51, Phase 20 — Costs & Fees redesigned into a literal 3-column ×
// 3-row grid (design review, confirmed with the user via AskUserQuestion:
// "3 subsections x 3 rows", new 3rd subsection = "Pet Policy"). Rent & Fees
// folds the old "Mandatory One-time Fees" column's Security Deposit and
// Application Fee in alongside Base Rent (still 3 real rows, still nothing
// invented); Lease is unchanged; Pet Policy is new, backed entirely by the
// real pets_allowed/pet_deposit/pet_rent fields _group_fee_ranges() now
// aggregates (Phase 20 backend addition) — same "no fake data" posture this
// file's header comment already established for the reference design's
// unsupported line items (Water & Sewer, Storage, Renters Insurance,
// Administration Fee), still deliberately left off. SALE groups are
// unchanged — Price & Tax / HOA, same as before this round, since Lease
// and Pet Policy are RENT-only concepts.
function GroupFeesBlock({ fees, listingType }) {
  if (!fees) {
    return <div style={{ fontFamily: F.body, fontSize: 13, color: C.textTertiary }}>Costs & fees not available.</div>;
  }
  if (listingType === 'RENT') {
    // Session 51 fix (user ask) — real lease lengths actually offered
    // across the group's units, straight from _group_fee_ranges()'s
    // `leaseTerms` field (the distinct ListingRentalTerms.lease_term_months
    // values present on any child unit). A plain list, not a min-max range
    // like the money fields — "6–18 months" would misleadingly imply every
    // length in between is available, when only the specific lengths a
    // landlord actually set ever are. Omitted entirely (not an empty
    // column) when no unit has a lease term on file yet.
    const leaseTerms = fees.leaseTerms || [];
    // Omitted entirely (not an empty column) when no RENT child unit has
    // rental_terms on file at all — same "hide, don't show blank" posture
    // as the Lease column just above.
    const showPetPolicy = fees.petsAllowed != null;
    // Session 51, Phase 22 — user ask: 3 columns across (Rent & Fees, Pet
    // Policy, Lease — note the reordered middle/last column vs. the
    // original Phase 20 order).
    // Session 51, Phase 24 — user ask: Costs & Fees's card is now the
    // same WIDTH as the titular Name & Description card (narrower than
    // full-row — see PropertyListingDetailPage's render), so the 3
    // columns need to "squeeze in" to that reduced width — every
    // FeeColumn here renders `dense` (narrower minWidth, see its own
    // comment).
    // Session 51, Phase 25 — user ask: explicit 40% / 30% / 30% column
    // split (Rent & Fees / Pet Policy / Lease) instead of equal thirds.
    // This grid assumes all 3 columns are present, which matches this
    // listing type's normal case (Pet Policy/Lease are only ever
    // omitted when a group genuinely has no pet or lease data at all —
    // an edge case the fixed 40/30/30 split doesn't specially handle,
    // same as it wasn't asked to).
    // Session 51, Phase 26 — correction of Phase 25's misread: the user
    // clarified the row title should be LEFT-justified and the value
    // RIGHT-justified (not the label+value pair together right-
    // justified, which is what Phase 25 built). That's exactly FeeRow's
    // own default (`align='between'`, i.e. justifyContent:'space-
    // between') — so `align="end"` is dropped here. The `gap` numbers
    // (36/48) stay as a minimum floor between title and value (only
    // ever binding if a column gets unusually narrow); harmless now
    // that space-between normally fills the rest of the row itself.
    // Session 51, Phase 27 — two user asks: (a) more breathing room
    // between the 3 columns — grid `gap` raised from 16 to 28 (roughly
    // +2 "spaces" at ~6px/space, same mapping used for FeeRow's own gap
    // values); (b) the Lease column's right-justified values ("12
    // months") were overflowing past the card's right edge, not sitting
    // flush with it like the other two columns. Root cause: percentage
    // column tracks ('40% 30% 30%') are each sized against the grid
    // container's full width, and `gap` is added ON TOP of that — so
    // 40%+30%+30% (=100%) plus 2 gaps overflows the container by
    // 2×gap. Switched to `fr` units (`4fr 3fr 3fr`), which — unlike
    // percentages — are defined to divide up the space that's LEFT
    // after the gaps are subtracted, so the same 40/30/30 proportions
    // now stay fully inside the card with no overflow, whatever `gap`
    // is set to.
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 3fr 3fr', gap: 28 }}>
        <FeeColumn heading="Rent & Fees" dense>
          <FeeRow gap={36} label="Base Rent" value={`${moneyOrRange(fees.rentAmount, fees.rentAmountRange)} / month`} />
          <FeeRow gap={36} label="Security Deposit" value={moneyOrRange(fees.securityDeposit, fees.securityDepositRange)} />
          <FeeRow gap={36} label="Application Fee" value={moneyOrRange(fees.applicationFee, fees.applicationFeeRange)} />
        </FeeColumn>
        {showPetPolicy && (
          <FeeColumn heading="Pet Policy" dense>
            <FeeRow gap={48} label="Pets Allowed" value={fees.petsAllowed} />
            <FeeRow gap={48} label="Pet Deposit" value={_petMoneyOrNull(fees.petDeposit, fees.petDepositRange)} />
            <FeeRow gap={48} label="Pet Rent" value={_petMoneyOrNull(fees.petRent, fees.petRentRange)} />
          </FeeColumn>
        )}
        {leaseTerms.length > 0 && (
          <FeeColumn heading="Lease" dense>
            {leaseTerms.map((months, i) => (
              <FeeRow gap={48} key={months} label={`Option ${i + 1}`} value={`${months} month${months === 1 ? '' : 's'}`} />
            ))}
          </FeeColumn>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <FeeColumn heading="Price & Tax" dense>
        <FeeRow label="Asking Price" value={moneyOrRange(fees.askingPrice, fees.askingPriceRange)} />
        <FeeRow label="Property Tax" value={moneyOrRange(fees.propertyTax, fees.propertyTaxRange)} />
      </FeeColumn>
      <FeeColumn heading="HOA" dense>
        <FeeRow label="HOA Fee" value={moneyOrRange(fees.hoaFee, fees.hoaFeeRange)} />
      </FeeColumn>
    </div>
  );
}

export default function PropertyListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  // Session 51, Phase 14 — see ListingDetailPage.jsx's identical comment:
  // replaces the old inline hero-video toggle (showVideo) with the shared
  // Lightbox, opened at a given index into heroMediaItems; null = closed.
  // Session 51, Phase 20 — tourLightbox ({tab, index} | null) replaces the
  // old standalone floorPlanLightboxIndex: it's the single popup state for
  // every clickable tile across the new Visual Tour & Media section's
  // Photos/Videos/Floor Plan tabs (3D Tour/Virtual Staging tiles are always
  // sample-only and never open a popup — see VisualTourMediaSection's own
  // comment).
  const [heroLightboxIndex, setHeroLightboxIndex] = useState(null);
  const [tourLightbox, setTourLightbox] = useState(null);

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
    apiGetPropertyListingDetail(_bareId(id))
      .then(d => { if (!cancelled) { setData(d); setStatus('ready'); setHeroLightboxIndex(null); setTourLightbox(null); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [id]);

  if (status === 'loading') return <PageState>Loading…</PageState>;
  if (status === 'error' || !data) {
    return (
      <PageState>
        This property listing is no longer available.
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
  const units = data.units || [];
  // Session 51, Phase 14 — see ListingDetailPage.jsx's identical comment
  // for why photosFull/videos/heroMediaItems exist alongside the capped
  // thumbPhotos rail, and why floorPlanTiles() pads floorPlanImages up to
  // a minimum of 3 (real ones first, never dropped) rather than showing
  // nothing when a group has no real floor plan renders yet.
  const photosFull = data.gallery?.photos || [];
  const thumbPhotos = photosFull.slice(0, 4);
  const videos = data.gallery?.videos || [];
  const heroMediaItems = [
    ...photosFull.map(url => ({ type: 'photo', url })),
    ...videos.map((url, i) => ({ type: 'video', url, label: `Video ${i + 1}` })),
  ];
  const coverIndex = Math.max(photosFull.indexOf(data.gallery?.coverImage), 0);
  const firstVideoIndex = photosFull.length;
  const floorPlanImages = data.gallery?.floorPlanImages || [];
  const floorPlanTileList = floorPlanTiles(floorPlanImages);
  const floorPlanLightboxItems = floorPlanTileList.map(t => ({ type: 'photo', url: t.url, label: t.sample ? 'Sample floor plan' : null }));

  // Session 51, Phase 20 — Visual Tour & Media section's five tabs. Photo/
  // video tiles and their Lightbox item lists are built from the exact same
  // tourMediaTiles() call so indices always line up 1:1 (see
  // VisualTourMediaSection's own comment) — tour3d/staging tiles are always
  // sample-only and never feed a Lightbox list at all.
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
          Session 51, Phase 21 — wireframe ask: drop the sample Ad rail
          that used to sit beside the hero, keep the hero itself
          unchanged, and fill that freed column with a 3x2 grid of
          smaller real photos instead (GalleryPreviewGrid). */}
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
              {/* Session 51, Phase 21 — "if no image, use sample image":
                  a group with no real gallery photos used to render a
                  blank `url(undefined)` background here. */}
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

      {/* ── Property Name/Description + Costs & Fees (left column) and
          Listing Agent (right column, now one tall card) ───────────────
          Session 51, Phase 21 — wireframe ask: Listing Agent (the old
          sticky Listing Contact rail) now sits beside Name & Description
          instead of as a page-long sticky sidebar.
          Session 51, Phase 22 — titular row's height cut by ~half;
          Costs & Fees made full width in its own row below.
          Session 51, Phase 24 — Costs & Fees narrowed back to match the
          Name & Description card's width.
          Session 51, Phase 25 — user ask: Listing Agent "has to stand
          out" — it's no longer confined to the titular row's own
          (halved) height. The left column now stacks Name & Description
          and Costs & Fees vertically; Listing Agent is ONE tall card
          occupying the whole right column beside both of them (the
          flex row below stretches it to that combined height — standard
          CSS: align-items defaults to 'stretch', so the 300px column
          grows to match the 636px column's natural height). Back to the
          original full ListingContactCard design (photo/name/role badge/
          phone+email/divider/CTA icons) instead of the `compact` layout,
          per the user's explicit "go back to the previous design" ask,
          plus a couple of real, derived extra lines (see ListingContactCard's
          own `extraInfo` prop) to fill the added height — no invented
          bio/rating/etc., same "no fake data" posture as the rest of
          this page.
          Session 51, Phase 26 — user ask: Costs & Fees's bottom edge
          must line up EXACTLY with Listing Agent's bottom edge, the gap
          between Name & Description and Costs & Fees must stay what it
          is now (14px, unchanged), and any extra height needed to make
          that alignment happen must come from Name & Description
          growing taller — not from Costs & Fees or the gap. Whichever
          column (this left one, or Listing Agent on the right) has more
          natural content ends up taller; the OTHER side is stretched to
          match it (that's the align-items:'stretch' above). Previously,
          when Listing Agent was the taller side, this left column got
          stretched too, but its two stacked children didn't grow to
          fill that stretch — leaving empty space below Costs & Fees
          instead of at its intended bottom edge. Giving Name &
          Description `flex: '1 1 auto'` (the only grower in this
          column; Costs & Fees stays flex:0, its natural size) makes IT
          absorb that slack instead, with the fixed 14px gap passed
          through unchanged and Costs & Fees's own bottom therefore
          landing exactly at the column's — and Listing Agent's —
          bottom edge.
          Session 51, Phase 27 — correction: Phase 26's `alignItems:
          'center'` (added so the title/description blocks wouldn't look
          pinned to the top when this card grows taller) ended up
          sitting them lower than the user wanted. Back to
          `alignItems:'flex-start'` (top-aligned, same as before Phase
          26) so both blocks sit right under the card's own top padding
          instead of vertically centered in the grown height. Also added
          a "Visit Property" sample link under Description (no real
          property-website field exists on this data model yet — same
          "no fake data, clearly labeled sample" posture as this page's
          other placeholders — see its own comment below). */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 24px 0', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 636px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', boxSizing: 'border-box', padding: 16, marginBottom: 0, flex: '1 1 auto' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{data.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, marginTop: 4 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 13 }} />
                {addressLine}{addressLine && cityStateZip ? ', ' : ''}{cityStateZip}
              </div>
              {/* Session 51, Phase 32 — user ask: two more "spaces" (≈6px
                  each, same mapping used elsewhere on this page) of
                  breathing room between the Title+Address block above
                  and this price line — marginTop 6 → 18. */}
              <div style={{ fontFamily: F.serif, fontSize: 15.5, fontWeight: 700, color: C.textPrimary, marginTop: 18 }}>
                {data.listingType === 'RENT'
                  ? (data.fees?.rentAmount != null ? `${money(data.fees.rentAmount)} / Month` : (data.fees?.rentAmountRange ? `${moneyOrRange(null, data.fees.rentAmountRange)} / Month` : '—'))
                  : moneyOrRange(data.fees?.askingPrice, data.fees?.askingPriceRange)}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>
                <span><i className="ti ti-bed" /> {specOrRange(data.beds, data.bedsRange, 'Bed')}</span>
                <span><i className="ti ti-bath" /> {specOrRange(data.baths, data.bathsRange, 'Bath')}</span>
                <span><i className="ti ti-ruler-2" /> {specOrRange(data.sqft, data.sqftRange, 'Sq Ft')}</span>
              </div>
            </div>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: C.textTertiary, marginBottom: 4 }}>
                Description
              </div>
              {/* Session 51, Phase 32 — user ask: fix this subtext to a
                  constant 5-line footprint "whether used or not" — i.e.
                  not just a max-clamp (which lets short descriptions
                  collapse to fewer lines), but a reserved minHeight of
                  exactly 5 lines at this text's own 13px/1.5 metrics
                  (13 × 1.5 × 5 = 97.5px), so the block's height never
                  varies with description length. WebkitLineClamp raised
                  2 → 5 to match, so a long description is still capped
                  at the same 5 lines rather than overflowing past the
                  reserved height. */}
              <div style={{
                fontSize: 13, color: C.textPrimary, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                minHeight: 13 * 1.5 * 5,
              }}>
                {data.description || 'No description provided.'}
              </div>

              {/* Session 51, Phase 27 — user ask: a "Visit Property" web
                  address field below Description. No real
                  website/property-URL field exists on PropertyListing
                  yet, so — same posture as SAMPLE_PROPERTY_PHOTOS, the
                  Facilities & Parking card, etc. — this renders the
                  user's own given sample value with an honest "Sample"
                  tag, as plain (non-clickable) text rather than a real
                  link, so nobody mistakes it for a working destination. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <span style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: C.textTertiary }}>
                  Visit Property
                </span>
                <span style={{
                  display: 'inline-block', fontFamily: F.body, fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
                  textTransform: 'uppercase', color: C.textTertiary, background: C.inputBg, borderRadius: 5, padding: '2px 6px',
                }}>
                  Sample
                </span>
              </div>
              {/* Session 51, Phase 32 — user ask: web address in blue
                  (was C.primary, the page's navy brand color — swapped
                  for an actual blue, '#2563EB', the same link/info blue
                  already established elsewhere in this design system —
                  see UNPopup.jsx's `info` type color). */}
              <div style={{ fontFamily: F.body, fontSize: 13, color: '#2563EB', marginTop: 3 }}>
                SampleIdex.com
              </div>
            </div>
          </SectionCard>

          {/* ── Costs & Fees ──────────────────────────────────────────
              Session 51, Phase 25 — now stacked directly under Name &
              Description in this same left column (sharing its width
              exactly, since both are children of the same flex:'1 1
              636px' column), rather than in its own separate row with a
              matching-width flex trick. See GroupFeesBlock for the
              40/30/30 column split and right-justified rows. */}
          <SectionCard title="Costs & Fees" style={{ marginBottom: 0 }}>
            <GroupFeesBlock fees={data.fees} listingType={data.listingType} />
            <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginTop: 10 }}>
              Range shown across all available units in this property.
            </div>
          </SectionCard>
        </div>

        {/* ── Listing Agent ───────────────────────────────────────────────
            Session 51, Phase 18 comment carried over from the old sticky
            rail: single unified card (photo → name → org/role line →
            phone/email → dotted divider → Apply/Book Tour/Contact icons).
            Session 51, Phase 21 — no longer sticky/page-long; scoped to
            this row.
            Session 51, Phase 25 — back to the full (non-`compact`)
            ListingContactCard design, and the card itself now spans the
            full height of the left column (Name & Description + Costs &
            Fees stacked) via flex stretch — see this block's own header
            comment above. */}
        <div style={{ flex: '0 0 300px', minWidth: 0 }}>
          <SectionCard title="Listing Agent" style={{ height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            {/* Session 51, Phase 25 — this wrapper (flex:1 + centered)
                is what actually distributes the extra height the merged
                column gives this card: the contact card's own content
                stays its natural size and centers in whatever room is
                left under the "Listing Agent" title, rather than
                pinning to the top and leaving a dead gap at the bottom. */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ListingContactCard
                contact={data.leadContact}
                listingTitle={data.title}
                extraInfo={[
                  { icon: 'ti-building-community', text: `Managing agent for ${data.title}` },
                  units.length > 0 ? { icon: 'ti-door', text: `Overseeing ${units.length} unit${units.length === 1 ? '' : 's'} in this property` } : null,
                ].filter(Boolean)}
              />
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* ── Neighbourhood / Facilities & Parking / Special Features ──────
            Session 51, Phase 22 — 3-across row: Special Features (freed
            up by Costs & Fees going full width) now sits here instead of
            beside Costs & Fees, per the user's own choice when asked.

            Session 51, Phase 32 — two user asks, both about LENGTH
            (width): (a) Special Features must be the same width as
            Listing Agent — that's Listing Agent's own fixed `flex:'0 0
            300px'` column, so Special Features now uses the identical
            fixed 300px (was `flex:'1 1 260px'`, a growing column — no
            longer grows). (b) Neighbourhood + this row's 20px gap +
            Facilities & Parking, combined, must equal Costs & Fees's
            width exactly. Costs & Fees gets its width from the proven
            `flex:'1 1 636px'` + 14px gap + fixed-300px-sibling pattern
            used 3x elsewhere on this page (see that section's own
            comment) — its rendered width is always
            `rowWidth − 14 − 300`. To make Neighbourhood+gap+Facilities
            equal that exactly, at any viewport width (not just one
            pixel value), Neighbourhood and Facilities are pulled into
            their own inner wrapper that itself gets that identical
            `flex:'1 1 636px'` treatment — so the wrapper's own
            rendered width is guaranteed to equal Costs & Fees's width
            by the same formula, as long as its outer gap/fixed-sibling
            numbers match (14px gap to Special Features, same as Costs
            & Fees's 14px gap to Listing Agent — this row's old 20px
            outer gap is now 14px for that reason; the 20px gap stays
            unchanged where it's actually visible, between Neighbourhood
            and Facilities inside the wrapper). Inside the wrapper,
            Facilities & Parking keeps its previous 300px size (now
            fixed, not growing — the user didn't ask to change it), and
            Neighbourhood (`flex:'1 1 auto'`) is the sole grower that
            absorbs 100% of whatever space is left — i.e. it's the one
            that "increases to accommodate the increased overall
            combined length", per the user's own words. */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 636px', minWidth: 0, display: 'flex', gap: 20, alignItems: 'stretch' }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
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
                />
              </SectionCard>
            </div>
            <div style={{ flex: '0 0 300px', minWidth: 0 }}>
              <FacilitiesParkingSection />
            </div>
          </div>
          <div style={{ flex: '0 0 300px', minWidth: 0 }}>
            <SectionCard title="Special Features" style={{ height: '100%', boxSizing: 'border-box' }}>
              {/* Session 51, Phase 25 — user ask: cap at 10 items with a
                  "See More" popup for the rest (see AmenityIconList's own
                  comment). */}
              <AmenityIconList amenities={data.amenities} maxVisible={10} />
            </SectionCard>
          </div>
        </div>

        {/* Session 51, Phase 25 — user ask: visible breathing room between
            the Neighbourhood/Facilities & Parking/Special Features row
            above and Visual Tour & Media below. */}
        <div style={{ height: 28 }} />

        {/* ── Visual Tour & Media ─────────────────────────────────────
            Session 51, Phase 20 — own full-width section, placed directly
            above Available Units, per the user's own confirmed wireframe.
            Replaces the old hero MediaCountBar overlay + separate Floor
            Plan card removed above. Phase 21 — Photos now shows exactly 5
            tiles filling the row; Videos/3D Tour/Virtual Staging collapse
            to one big 80%-width display (see VisualTourMediaSection).
            Session 51, Phase 25 — user ask: (a) this section's WIDTH now
            matches Costs & Fees's width (same flex:'1 1 636px' + 300px
            spacer + 14px gap trick used throughout this page), so its
            tiles are no longer full-row-width huge; (b) Photos switched
            from 5 flexed thumbnails to the same one-at-a-time fixed-size
            display Video/3D Tour/Virtual Staging already use (see
            VisualTourMediaSection's own comment for the added prev/next
            control this needed, since Photos — unlike those three tabs —
            can have more than one real item).
            Session 51, Phase 27 — user ask: a new Advertisement section
            fills the space to the right of Visual Tour & Media (this row's
            previously-empty 300px spacer) — same WIDTH as Listing Agent
            (that's what this 300px column already matched throughout the
            page) and the same HEIGHT as Visual Tour & Media, via the same
            `alignItems:'stretch'` trick used for Listing Agent beside the
            titular column. Reuses AdPlaceholderCard's existing `vertical`
            variant (decision #2 in this file's own header comment — built
            Session 50, removed from the page in Phase 21 only because
            there was no slot for it then; it was never deleted) rather
            than building a new placeholder component. */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 636px', minWidth: 0 }}>
            <VisualTourMediaSection
              tabs={tourTabs}
              onOpenTile={(tab, index) => setTourLightbox({ tab, index })}
            />
          </div>
          <div style={{ flex: '0 0 300px', minWidth: 0 }}>
            <AdPlaceholderCard variant="vertical" />
          </div>
        </div>

        {/* Decision #4 — unit picker, relabeled from the reviewed Figma's
            generic "Room 1-4" to each unit's own floor plan name / title.
            Session 51, Phase 20 — redesigned with bed-count filter tabs
            (All / 1 Bed / 2 Bed / 3+ Bed) and a 7-column table (Unit #,
            Bed & Bath, Sq Ft, Available On, Rent, SD, View Detail), per
            the user's own confirmed wireframe — see AvailableUnitsTable's
            own comment.
            Session 51, Phase 25 — user ask: this section's WIDTH now
            also matches Costs & Fees's width, same trick as above.
            Session 51, Phase 27 — user ask: initial display capped at 5
            units with a "See More" popup for the rest (see
            AvailableUnitsTable's own comment) — when there are fewer
            than 5 real units, that same component now pads the list
            with disabled-View-Detail sample units, so this section
            always has something to show; the old `units.length > 0`
            guard is dropped since a 0-real-unit property should still
            render the (now fully sample) table rather than disappear. */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 636px', minWidth: 0 }}>
            <SectionCard title="Available Units">
              <AvailableUnitsTable
                units={units}
                listingType={data.listingType}
                onViewDetail={(u) => navigate(`/marketplace/listing/${String(u.id).replace(/^real-/, '')}`)}
                maxVisible={5}
              />
            </SectionCard>
          </div>
          <div style={{ flex: '0 0 300px' }} />
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
