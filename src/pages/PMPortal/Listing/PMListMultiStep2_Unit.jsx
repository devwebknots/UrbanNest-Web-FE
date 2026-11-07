// src/pages/PMPortal/Listing/PMListMultiStep2_Unit.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Multi-Unit Listing wizard — Step 2: "List Multiple Units" (PM Portal —
// Independent PM / Org PM staff).
//
// Deliberate duplicate of ../../Landlord/Listing/ListMultiUnits.jsx (LST-12
// — PM Portal entry point into the Multi-Unit flow), same reasoning as
// PMListMultiStep1_Property.jsx's own header note: shell differs
// (NavB+PMTopBar vs NavF), business logic/API calls are portal-agnostic and
// reused as-is. Renamed PMListMultiStep2_Unit.jsx (vs. the Landlord file's
// ListMultiUnits.jsx name) to match this PM Portal wizard's own
// Step-numbered file-naming convention (PMListMultiStep1/3/4) — purely a
// naming choice, no behavior difference.
//
// Wired to the real PropertyListing/Listing backend (Session 44 — LST-10, see
// propertyListingApi.js + listingApi.js). Structurally unchanged from the
// Session 43 mock-data build (Common Listing Details / Unit Matrix / inline
// Edit Unit Specifics panel / Preview All Listings) — only the data layer
// changed.
//
// Real data model this screen works against (see
// UrbanNest_Listing_Architecture.md §8):
//  - `common` (Common Listing Details) = the real PropertyListing group row
//    (`GET /property-listings/<pk>/`) — description/amenities are real
//    group-level fields, saved via propertyListingApi.js.
//  - `units` (Unit Matrix rows) are NOT PropertyListing fields — each row is
//    a per-unit `Listing` (from the group rollup's `unit_listings` summary),
//    enriched on load with that Listing's real rental terms / description /
//    available_date (getListing/getRentalTerms) and photo count
//    (getListingMedia), plus the underlying Unit's floor_plan_name
//    (getUnit) — one Promise.all per unit alongside the group rollup fetch.
//    Editing a unit's rent/terms/description/floor-plan PATCHes that unit's
//    own Listing/Unit sub-resources directly, exactly like
//    ListingStep2_Unit.jsx does for a single listing.
//  - "Add Units" fetches the property's real unit list (getPropertyUnits)
//    and lets the PM/Org PM user attach any unit not already in the group via
//    `POST /api/listings/` with `property_listing` set (createUnitListing) —
//    the §8.2/§8.6 retrofit, smoke-tested this session.
//
// Two real scope gaps, deliberately left as such rather than faked:
//  - "Standard Lease Terms" / "Application Fee" in Common Listing Details
//    have no group-level backend field — ListingRentalTerms/ListingSaleTerms
//    were NOT part of the §8.3 dual-owner retrofit (genuinely per-unit,
//    price never shared). These stay a local-only "template" used to seed a
//    newly-added unit's rental terms, not persisted anywhere themselves.
//  - Per-unit "Internal Notes" has no backend field anywhere (neither
//    Listing nor Unit) — stays local-only, same honesty convention as the
//    AI Assist buttons (visibly not persisted, not silently discarded).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from './pmListingTokens';
import { CustomDropdown } from '../../../components/ui';
import {
  LS, ListingPageShell, ListingFooter, Checkbox, RadioPillButton, MULTI_STEPS,
} from './pmListingWizardShared';
import {
  getProperty, getAmenityCatalog, getPropertyUnits, getUnit, patchUnit,
  getListing, patchListing,
  getRentalTerms, patchRentalTerms,
  getListingMedia, saveListingMedia,
  getListingDropdownOptions,
} from '../../Landlord/Listing/listingApi';
import {
  getPropertyListing, patchPropertyListing,
  getPropertyListingAmenities, savePropertyListingAmenities,
  createUnitListing, deleteUnitListing,
} from '../../Landlord/Listing/propertyListingApi';
import { MIN_REQUIRED_PHOTOS } from '../../Landlord/Listing/mockListingData';

const UTILITY_KEYS = [
  { key: 'water', label: 'Water' },
  { key: 'trash', label: 'Trash' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'gas', label: 'Gas' },
  { key: 'internet', label: 'Internet' },
];

const READINESS_LABEL = { ready: 'Ready', editing: 'Editing', needs_info: 'Needs Info', draft: 'Draft' };

// Session 48 (continued) fix — was a local, still-hardcoded
// `const MIN_REQUIRED_PHOTOS = 4`, same bug as ListMultiUnits.jsx (this
// file's Landlord counterpart) whose own comment made the identical false
// "already shared" claim. Now actually imports the shared constant, so
// this Unit Matrix's "Needs Info" gate agrees with Step 4's Compliance &
// Validation and with every other wizard's 0-minimum. The real gate is
// enforced server-side at publish time regardless
// (property_listing_publish's compliance check).

function unitReadiness(u) {
  if ((u.photoCount || 0) < MIN_REQUIRED_PHOTOS) return 'needs_info';
  return u.status === 'ACTIVE' ? 'ready' : 'draft';
}

const numOrZero = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

function listToUtilObj(list) {
  const set = new Set((list || []).map(v => String(v).toLowerCase()));
  return {
    water: set.has('water'), trash: set.has('trash'), electricity: set.has('electricity'),
    gas: set.has('gas'), internet: set.has('internet'),
  };
}
function utilObjToList(obj) {
  return Object.entries(obj || {}).filter(([, v]) => v).map(([k]) => k.toUpperCase());
}

function termsFromBackend(rt) {
  return {
    monthlyRent: rt.rent_amount != null ? String(rt.rent_amount) : '',
    securityDeposit: rt.security_deposit != null ? String(rt.security_deposit) : '',
    leaseTermMonths: rt.lease_term_months != null ? String(rt.lease_term_months) : '',
    applicationFee: rt.application_fee != null ? String(rt.application_fee) : '',
    petPolicy: rt.pets_allowed ? 'ALLOWED' : 'NOT_ALLOWED',
    petDeposit: rt.pet_deposit != null ? String(rt.pet_deposit) : '',
    petRent: rt.pet_rent != null ? String(rt.pet_rent) : '',
    utilitiesIncluded: listToUtilObj(rt.utilities_included),
    utilitiesTenantPaid: listToUtilObj(rt.utilities_tenant_paid),
    smokingAllowed: !!rt.smoking_allowed,
    parkingFeeEnabled: !!rt.parking_fee,
    parkingFeeType: rt.parking_fee?.type || '',
    parkingFeeAmount: rt.parking_fee?.amount != null ? String(rt.parking_fee.amount) : '',
    otherFeesEnabled: !!(rt.other_fees && rt.other_fees.length),
    otherFees: rt.other_fees && rt.other_fees.length ? rt.other_fees : [{ type: '', amount: '' }],
    rentConcession: rt.rent_concession || '',
    concessionAmount: rt.concession_amount != null ? String(rt.concession_amount) : '',
  };
}
function termsToBackend(terms) {
  return {
    rent_amount: numOrZero(terms.monthlyRent),
    security_deposit: numOrZero(terms.securityDeposit),
    lease_term_months: numOrNull(terms.leaseTermMonths),
    application_fee: numOrNull(terms.applicationFee),
    pets_allowed: terms.petPolicy === 'ALLOWED',
    pet_deposit: numOrNull(terms.petDeposit),
    pet_rent: numOrNull(terms.petRent),
    utilities_included: utilObjToList(terms.utilitiesIncluded),
    utilities_tenant_paid: utilObjToList(terms.utilitiesTenantPaid),
    smoking_allowed: terms.smokingAllowed,
    parking_fee: terms.parkingFeeEnabled ? { type: terms.parkingFeeType, amount: terms.parkingFeeAmount } : null,
    other_fees: terms.otherFeesEnabled ? terms.otherFees.filter(f => f.type || f.amount) : [],
    rent_concession: terms.rentConcession,
    concession_amount: numOrNull(terms.concessionAmount),
  };
}

const AMENITY_ICONS = {
  'swimming pool': 'ti-pool', 'fitness center': 'ti-barbell', 'on-site laundry': 'ti-wash',
  'secure parking': 'ti-parking', elevator: 'ti-building-arch',
};
const amenityIcon = (name) => AMENITY_ICONS[(name || '').toLowerCase()] || 'ti-check';

function AiPill() {
  return (
    <span style={{ ...LS.btnAi, opacity: 0.5, cursor: 'not-allowed', marginLeft: 8 }} title="AI Assist isn't available yet — coming soon">
      <i className="ti ti-sparkles" style={{ fontSize: 10 }} aria-hidden="true" />AI Assist
    </span>
  );
}
function lblWithAi(text) {
  return <span style={LS.lbl}>{text}<AiPill /></span>;
}

// Loads one unit-listing row's full detail (rental terms, description,
// available date, photo count, floor plan name) alongside the group rollup.
// One Promise.all per row — acceptable N+1 for a Multi-Unit group's realistic
// size (a handful to a few dozen units), same tradeoff the group's own
// per-endpoint smoke test accepted for the amenities/channels bulk shape.
async function loadUnitRow(propId, summary) {
  const [listing, rentalTerms, media, unit] = await Promise.all([
    getListing(summary.id),
    getRentalTerms(summary.id).catch(() => ({})),
    getListingMedia(summary.id).catch(() => []),
    getUnit(propId, summary.unit).catch(() => ({})),
  ]);

  // Session 54 fix: the Photos tab and the "Preview All Listings" cards
  // both need the unit's REAL gallery (UnitGallery, via unit.gallery_images
  // — already returned by GET /properties/<pk>/units/<uid>/, just never
  // read here) rather than an empty placeholder grid sized only by a photo
  // count. `media` is this listing's already-saved ListingMedia selection
  // (PHOTO rows only — see ListingMediaListCreateView's own docstring on
  // the backend; video isn't selected this way, it's Listing.video_url).
  // When nothing has been saved yet (the common case for a brand-new
  // group), default to including every one of the unit's current photos
  // rather than showing a blank listing by default.
  const unitGalleryImages = (unit.gallery_images || []).filter(g => g.file_type === 'IMAGE');
  const unitGalleryVideos = (unit.gallery_images || []).filter(g => g.file_type === 'VIDEO');
  const savedGalleryIds = (media || []).map(m => m.source_gallery_item).filter(Boolean);
  const savedCover = (media || []).find(m => m.is_cover);
  const selectedPhotoIds = savedGalleryIds.length ? savedGalleryIds : unitGalleryImages.map(g => g.id);
  const coverPhotoId = savedCover ? savedCover.source_gallery_item : (selectedPhotoIds[0] ?? null);

  return {
    id: summary.id,                 // Listing id — the key for every per-unit API call below
    unitId: summary.unit,           // Unit id — for patchUnit (floor_plan_name)
    unitName: `Unit ${unit.unit_number ?? summary.unit}`,
    bedsBaths: `${unit.total_rooms ?? '—'} bd / ${unit.total_baths ?? '—'} ba`,
    status: summary.status,
    availableDate: listing.available_date || '',
    description: listing.description || '',
    floorPlanName: unit.floor_plan_name || '',
    floorPlanUrl: unit.floor_plan_url || '',
    internalNotes: '',              // no backend field anywhere — local-only, see header note
    galleryImages: unitGalleryImages,   // this unit's full photo set to choose from
    galleryVideos: unitGalleryVideos,   // this unit's uploaded video(s)
    selectedPhotoIds,                   // which gallery image ids go on this listing
    coverPhotoId,
    videoUrl: listing.video_url || '',
    photoCount: selectedPhotoIds.length,
    rentalTerms: termsFromBackend(rentalTerms),
  };
}

export default function PMListMultiStep2_Unit() {
  const { id: propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const propertyListingId = location.state?.propertyListingId ?? null;
  // Session 45 continuation — if we're arriving back here from Step 3/4
  // (the PM/Org PM user hit Back), honor whatever checked/unchecked set they left
  // with instead of silently resetting everyone to checked on reload.
  const incomingIncludedIds = location.state?.includedUnitListingIds ?? null;
  // Unit Selection screen continuation (LST-8's real gate,
  // PMUnitSelection.jsx — mirrors LandlordUnitSelection.jsx) — Unit ids
  // (not Listing ids) the PM/Org PM user already checked before Step 1,
  // relayed here unchanged by that step. Auto-attached below, once, right
  // after the group rollup loads, so the PM/Org PM user isn't asked to
  // re-pick the same units through "Add Units".
  // Read once via a ref rather than the raw location.state value so a
  // later re-render (e.g. after Add/Remove Unit) can't re-trigger the
  // attach effect a second time.
  const preselectedUnitIdsRef = useRef(location.state?.preselectedUnitIds ?? null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [property, setProperty] = useState(null);
  const [group, setGroup] = useState(null); // real PropertyListing rollup
  const [common, setCommon] = useState({
    description: '', amenities: [], amenityDraft: '',
    // Local-only template (no backend field — see header note): seeds a
    // newly-added unit's rental terms, never itself persisted.
    leaseTermMonths: '', applicationFee: '',
  });
  const [units, setUnits] = useState([]);
  const [activeUnitId, setActiveUnitId] = useState(null); // Listing id
  const [activeTab, setActiveTab] = useState('details');
  // selectedRowIds (Session 45 continuation): repurposed from dead UI state
  // into "will this unit be included when the group is finally published" —
  // defaults to every unit in the group (see the load effect below, and
  // confirmAddUnits, which both keep this in sync with `units`). Unchecking
  // does NOT delete anything by itself — it's just remembered and carried
  // forward through the wizard (see handleContinue below) so Step 4 can
  // drop any still-unchecked unit right before it actually publishes.
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [removingId, setRemovingId] = useState(null); // Listing id currently being deleted
  const [removeError, setRemoveError] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null); // the unit row awaiting confirm, or null

  const [leaseTermOptions, setLeaseTermOptions] = useState([]);
  const [parkingFeeTypeOptions, setParkingFeeTypeOptions] = useState([]);
  const [otherFeeTypeOptions, setOtherFeeTypeOptions] = useState([]);

  const [addingUnits, setAddingUnits] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]); // property units not yet in the group
  const [pickedUnitIds, setPickedUnitIds] = useState([]);
  const [addUnitsError, setAddUnitsError] = useState('');
  const [addUnitsBusy, setAddUnitsBusy] = useState(false);

  // Session 55 fix — "Preview All Listings" left/right arrows were purely
  // decorative (title="Not wired yet"). Now cycle through each unit's
  // actually-selected photos (falling back to its full gallery if nothing's
  // been explicitly selected yet), independently per card. Index is kept
  // per unit id rather than inside `units` itself since it's pure view
  // state, not anything that gets saved.
  const [previewIdxByUnit, setPreviewIdxByUnit] = useState({});
  const previewPhotosFor = (u) => {
    const chosen = (u.selectedPhotoIds || [])
      .map(id => u.galleryImages.find(g => g.id === id))
      .filter(Boolean);
    return chosen.length ? chosen : u.galleryImages;
  };
  const cyclePreview = (unitId, dir, count) => {
    if (!count || count < 2) return;
    setPreviewIdxByUnit(prev => {
      const cur = prev[unitId] || 0;
      return { ...prev, [unitId]: (cur + dir + count) % count };
    });
  };

  const commonRef = useRef(null);
  const matrixRef = useRef(null);
  const specRef = useRef(null);
  const previewRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    if (!propertyListingId) {
      navigate(`/pm-portal/properties/${propertyId}/list-multi/step-1`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [propData, groupData, catalog, groupAmenities, leaseTermDd, parkingFeeTypeDd, otherFeeTypeDd] = await Promise.all([
          getProperty(propertyId),
          getPropertyListing(propertyListingId),
          getAmenityCatalog('PROPERTY'),
          getPropertyListingAmenities(propertyListingId, 'PROPERTY'),
          getListingDropdownOptions('LEASE_TERM_MONTHS'),
          getListingDropdownOptions('PARKING_FEE_TYPE'),
          getListingDropdownOptions('OTHER_FEE_TYPE'),
        ]);
        if (cancelled) return;

        const toOptions = (dd) => (dd?.options || []).map(o => ({ value: o.option_code, label: o.option_label }));
        setLeaseTermOptions(toOptions(leaseTermDd));
        setParkingFeeTypeOptions(toOptions(parkingFeeTypeDd));
        setOtherFeeTypeOptions(toOptions(otherFeeTypeDd));

        setProperty(propData);
        setGroup(groupData);
        const selectedAmenityNames = new Set(groupAmenities.map(ga => (ga.amenity_detail?.name || '').toLowerCase()));
        setCommon(prev => ({
          ...prev,
          description: groupData.description || '',
          amenities: catalog
            .filter(a => selectedAmenityNames.has((a.name || '').toLowerCase()))
            .map(a => a.name),
        }));

        let rows = await Promise.all((groupData.unit_listings || []).map(s => loadUnitRow(propertyId, s)));
        if (cancelled) return;

        // Auto-attach any Unit Selection-screen preselected units not
        // already in this group (see this file's header + the
        // preselectedUnitIdsRef declaration above) — same
        // createUnitListing() call confirmAddUnits uses below, just run
        // once on load instead of through the "Add Units" picker, so the
        // PM/Org PM user isn't asked to re-pick the units they already checked.
        const preselectedUnitIds = preselectedUnitIdsRef.current;
        if (preselectedUnitIds && preselectedUnitIds.length) {
          const existingUnitIds = new Set(rows.map(r => r.unitId));
          const toAttach = preselectedUnitIds.filter(unitId => !existingUnitIds.has(unitId));
          if (toAttach.length) {
            try {
              const created = await Promise.all(toAttach.map(unitId => createUnitListing({
                unit: unitId,
                listing_type: groupData.listing_type || 'RENT',
                property_listing: Number(propertyListingId),
              })));
              if (cancelled) return;
              const newRows = await Promise.all(created.map(c => loadUnitRow(propertyId, { id: c.id, unit: c.unit, status: c.status })));
              if (cancelled) return;
              rows = [...rows, ...newRows];
            } catch (e) {
              // Non-fatal — the PM/Org PM user can still add them manually via
              // "Add Units" below.
              if (!cancelled) {
                setLoadError(prev => prev || `Some preselected units couldn't be added automatically: ${e.message || 'unknown error'}`);
              }
            }
          }
          // One-shot — never re-attach on a later reload within this
          // mount's lifetime (e.g. Back-then-Continue).
          preselectedUnitIdsRef.current = null;
        }

        setUnits(rows);
        // Default every unit to "included" — unless we're arriving back
        // from a later step with a checked/unchecked set already in hand,
        // in which case honor it (filtered to units still actually in the
        // group, in case one was deleted meanwhile).
        const rowIds = new Set(rows.map(r => r.id));
        setSelectedRowIds(
          incomingIncludedIds ? incomingIncludedIds.filter(id => rowIds.has(id)) : rows.map(r => r.id)
        );
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Could not load this listing group.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, propertyListingId]);

  const activeUnit = units.find(u => u.id === activeUnitId) || null;

  const openUnit = (unitListingId, tab = 'details') => {
    setActiveUnitId(unitListingId);
    setActiveTab(tab);
    setTimeout(() => scrollTo(specRef), 0);
  };

  const updateUnit = (unitListingId, patch) => {
    setUnits(prev => prev.map(u => (u.id === unitListingId ? { ...u, ...patch } : u)));
  };
  const updateUnitTerms = (unitListingId, patch) => {
    setUnits(prev => prev.map(u => (
      u.id === unitListingId ? { ...u, rentalTerms: { ...u.rentalTerms, ...patch } } : u
    )));
  };
  // Session 54 fix — Photos tab selection handlers. Toggling a photo keeps
  // `photoCount` (used by the tab label, the Ready threshold, and the Unit
  // Matrix row) in sync in the same update rather than needing a second
  // effect to recompute it. If the removed photo was the cover, falls back
  // to the next still-selected one (or null if none remain).
  const toggleUnitPhoto = (unitListingId, galleryId) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitListingId) return u;
      const nowSelected = u.selectedPhotoIds.includes(galleryId)
        ? u.selectedPhotoIds.filter(id => id !== galleryId)
        : [...u.selectedPhotoIds, galleryId];
      const coverPhotoId = nowSelected.includes(u.coverPhotoId) ? u.coverPhotoId : (nowSelected[0] ?? null);
      return { ...u, selectedPhotoIds: nowSelected, coverPhotoId, photoCount: nowSelected.length };
    }));
  };
  const setUnitCoverPhoto = (unitListingId, galleryId) => {
    setUnits(prev => prev.map(u => (u.id === unitListingId ? { ...u, coverPhotoId: galleryId } : u)));
  };
  const toggleRowSelected = (unitListingId) => {
    setSelectedRowIds(prev => prev.includes(unitListingId) ? prev.filter(id => id !== unitListingId) : [...prev, unitListingId]);
  };

  // Session 45 continuation — immediate, permanent removal from this DRAFT
  // group (as opposed to unchecking, which is reversible until Publish).
  // Backend guards this to DRAFT + grouped listings only (listings/views.py's
  // ListingRetrieveUpdateView.perform_destroy) and recomputes the unit's
  // readiness on delete, so it's genuinely List Ready again and reappears in
  // Add Units — has_active_listing flips back to false once the row's gone.
  //
  // The confirmation itself is an in-app modal (pendingRemoval below), not
  // window.confirm() — a browser-native "localhost:3000 says" dialog looks
  // like a bug report, not part of the product.
  const requestRemoveUnit = (row) => {
    if (removingId) return;
    setPendingRemoval(row);
  };
  const cancelRemoveUnit = () => setPendingRemoval(null);
  const confirmRemoveUnit = async () => {
    const row = pendingRemoval;
    if (!row) return;
    setPendingRemoval(null);
    setRemoveError('');
    setRemovingId(row.id);
    try {
      await deleteUnitListing(row.id);
      setUnits(prev => prev.filter(u => u.id !== row.id));
      setSelectedRowIds(prev => prev.filter(id => id !== row.id));
      if (activeUnitId === row.id) setActiveUnitId(null);
    } catch (e) {
      setRemoveError(e.message || `Could not remove ${row.unitName} from this group.`);
    } finally {
      setRemovingId(null);
    }
  };

  // ── Common Listing Details — real group-level save (description + amenities) ──
  const persistCommon = async () => {
    await patchPropertyListing(propertyListingId, { description: common.description });
    const catalog = await getAmenityCatalog('PROPERTY');
    const selectedAmenityIds = catalog
      .filter(a => common.amenities.some(name => name.toLowerCase() === (a.name || '').toLowerCase()))
      .map(a => a.id);
    await savePropertyListingAmenities(propertyListingId, { category: 'PROPERTY', amenityIds: selectedAmenityIds });
  };

  const addAmenity = (v) => {
    const name = v.trim();
    if (!name || common.amenities.some(a => a.toLowerCase() === name.toLowerCase())) {
      setCommon(c => ({ ...c, amenityDraft: '' }));
      return;
    }
    setCommon(c => ({ ...c, amenities: [...c.amenities, name], amenityDraft: '' }));
  };
  const removeAmenity = (name) => setCommon(c => ({ ...c, amenities: c.amenities.filter(a => a !== name) }));

  // ── Per-unit persistence — mirrors ListingStep2_Unit.jsx's persist() ─────
  const persistUnitRow = async (row) => {
    await patchUnit(propertyId, row.unitId, { floor_plan_name: row.floorPlanName });
    await patchRentalTerms(row.id, termsToBackend(row.rentalTerms));
    await patchListing(row.id, {
      description: row.description,
      available_date: row.availableDate || null,
      video_url: row.videoUrl || '',
    });
    // Session 54 fix: the Photos tab's include/exclude + cover selection
    // previously had nowhere to save to — this listing's real ListingMedia
    // set (GET/POST /listings/<id>/media/) was never called from this file
    // at all. video_url above covers the video slot (ListingMedia's PHOTO
    // bulk-replace endpoint rejects/ignores non-photo items per its own
    // docstring), this covers photos + cover.
    await saveListingMedia(row.id, {
      galleryItemIds: row.selectedPhotoIds,
      coverId: row.coverPhotoId,
    });
  };

  // Session 55 fix — Continue/Save & Exit/Back previously only persisted
  // the Common Listing Details (persistCommon), never each unit's row. A
  // unit's photo selection, floor plan name, description, available date
  // and video default to sensible values the moment it's loaded
  // (loadUnitRow — e.g. every gallery photo auto-selected) but those
  // defaults only ever reached the backend if the PM/Org PM user happened
  // to open "Edit Unit Specifics" and click Save Changes for that specific
  // unit. Anyone who just reviewed the Unit Matrix and moved on left every
  // unit's real ListingMedia/floor-plan/description empty — which is
  // exactly why Step 4's Photos/Floor Plans rows read 0/Not Set even though
  // the Unit Matrix itself showed real photo counts (those counts are the
  // *local* selection, not what's actually been saved). Now every
  // navigation action below saves every unit's current row alongside the
  // common details, so what Step 4 reads back always matches what Step 2
  // displayed.
  const persistAllUnits = async () => {
    await Promise.all(units.map(persistUnitRow));
  };

  const handleSaveUnit = async () => {
    if (!activeUnit || saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await persistUnitRow(activeUnit);
      setActiveUnitId(null);
    } catch (e) {
      setSaveError(e.message || 'Could not save this unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelUnit = async () => {
    if (!activeUnit) return;
    // Revert local edits by re-loading this row's saved state from the backend.
    try {
      const summary = (group?.unit_listings || []).find(s => s.id === activeUnit.id);
      const fresh = await loadUnitRow(propertyId, summary || { id: activeUnit.id, unit: activeUnit.unitId, status: activeUnit.status });
      setUnits(prev => prev.map(u => (u.id === activeUnit.id ? { ...fresh, internalNotes: u.internalNotes } : u)));
    } catch {
      // If the re-fetch fails, just close the panel — the next full reload will resync.
    }
    setActiveUnitId(null);
  };

  // ── Add Units ─────────────────────────────────────────────────────────────
  const openAddUnits = async () => {
    setAddUnitsError('');
    setPickedUnitIds([]);
    setAddingUnits(true);
    try {
      const all = await getPropertyUnits(propertyId);
      const existingUnitIds = new Set(units.map(u => u.unitId));
      // Session 44 continuation — exclude units already in THIS group
      // (existingUnitIds, as before) AND units that already have their own
      // active listing elsewhere (has_active_listing, from the backend —
      // properties/serializers.py's UnitListSerializer). Without the second
      // check, a unit already listed individually (or in another group)
      // still showed up here as addable, which doesn't make sense — a unit
      // can't be part of two listings at once. Reported during testing.
      setAvailableUnits((all || []).filter(u => !existingUnitIds.has(u.id) && !u.has_active_listing));
    } catch (e) {
      setAddUnitsError(e.message || 'Could not load this property\'s units.');
    }
  };
  const togglePickedUnit = (unitId) => {
    setPickedUnitIds(prev => prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]);
  };
  const confirmAddUnits = async () => {
    if (!pickedUnitIds.length || addUnitsBusy) return;
    setAddUnitsBusy(true);
    setAddUnitsError('');
    try {
      const created = await Promise.all(pickedUnitIds.map(unitId => createUnitListing({
        unit: unitId,
        listing_type: group?.listing_type || 'RENT',
        property_listing: Number(propertyListingId),
      })));
      const newRows = await Promise.all(created.map(c => loadUnitRow(propertyId, { id: c.id, unit: c.unit, status: c.status })));
      setUnits(prev => [...prev, ...newRows]);
      setSelectedRowIds(prev => [...prev, ...newRows.map(r => r.id)]);
      setAddingUnits(false);
    } catch (e) {
      setAddUnitsError(e.message || 'Could not add the selected unit(s).');
    } finally {
      setAddUnitsBusy(false);
    }
  };

  const readyCount = units.filter(u => unitReadiness(u) === 'ready').length;

  const handleBack = async () => {
    if (saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await Promise.all([persistCommon(), persistAllUnits()]);
      navigate(`/pm-portal/properties/${propertyId}/list-multi/step-1`, { state: { propertyListingId } });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExit = async () => {
    if (saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await Promise.all([persistCommon(), persistAllUnits()]);
      navigate(`/pm-portal/properties/${propertyId}`);
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (saving || selectedRowIds.length === 0) return;
    setSaveError('');
    setSaving(true);
    try {
      await Promise.all([persistCommon(), persistAllUnits()]);
      // Carry the checked/unchecked set forward — Step 3 relays it
      // untouched, and Step 4 uses it right before Publish to drop any
      // unit that's still unchecked at that point (Session 45
      // continuation). Unchecking here does NOT delete anything yet.
      navigate(`/pm-portal/properties/${propertyId}/list-multi/step-3`, {
        state: { propertyListingId, includedUnitListingIds: selectedRowIds },
      });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'inherit', color: C.txtSec }}>
        Loading listing group…
      </div>
    );
  }
  if (loadError || !group) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 10, color: C.txtSec }}>
        <div>{loadError || 'This listing group could not be loaded.'}</div>
        <span style={{ color: C.blue, cursor: 'pointer', fontWeight: 600 }} onClick={() => window.location.reload()}>Retry</span>
      </div>
    );
  }

  return (
    <>
    <ListingPageShell
      propertyName={property?.property_name || 'Property'}
      unitLabel="List Multiple Units"
      title="List Multiple Units"
      pageSub="Configure shared listing details and manage unit-specific pricing and availability."
      current={2}
      steps={MULTI_STEPS}
      footer={
        <ListingFooter
          current={2}
          leftContent={`${readyCount} of ${units.length} units ready`}
          onBack={handleBack}
          onSaveExit={handleSaveExit}
          onContinue={handleContinue}
          continueLabel={saving ? 'Saving…' : 'Continue to Promote →'}
          continueDisabled={saving || selectedRowIds.length === 0}
          noteContent={
            saveError || removeError
              || (selectedRowIds.length === 0 ? 'Check at least one unit to continue.' : undefined)
          }
        />
      }
    >
      <div style={LS.railLayout}>

        {/* ── LEFT NAVIGATION RAIL ─────────────────────────────────────── */}
        <div style={LS.railCol}>
          <div style={LS.railLabel}>Navigation</div>
          <div style={LS.railItem(!activeUnitId)} onClick={() => scrollTo(commonRef)}>
            <i className="ti ti-file-text" aria-hidden="true" />Common Listing Info
          </div>

          <div style={LS.railSectionLbl}>Unit Specific</div>
          {units.map(u => {
            const readiness = activeUnitId === u.id ? 'editing' : unitReadiness(u);
            return (
              <div key={u.id} style={LS.railUnitItem(activeUnitId === u.id)} onClick={() => openUnit(u.id)}>
                <i className="ti ti-building" aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{u.unitName}</span>
                <span style={LS.matrixStatus(readiness)}>{READINESS_LABEL[readiness]}</span>
              </div>
            );
          })}

          <div style={LS.railDivider} />
          <div style={LS.railItem(false)} onClick={() => scrollTo(previewRef)}>
            <i className="ti ti-eye" aria-hidden="true" />Preview All Listings
          </div>
        </div>

        {/* ── MAIN COLUMN ──────────────────────────────────────────────── */}
        <div style={LS.mainCol}>

          {/* Common Listing Details */}
          <div style={LS.card} ref={commonRef}>
            <div style={LS.cardHdrRow}>
              <div style={LS.cardHdrTitle}>Common Listing Details</div>
              <div style={LS.cardHdrActions}>
                <button style={{ ...LS.btnSm, ...LS.btnSmOutline }} title="Not wired yet — coming soon">
                  <i className="ti ti-copy" aria-hidden="true" />Add Bulk Items
                </button>
                <button style={{ ...LS.btnSm, ...LS.btnSmNavySolid }} onClick={persistCommon} title="Save the shared description + amenities now">
                  <i className="ti ti-check" aria-hidden="true" />Apply Change
                </button>
              </div>
            </div>

            <div style={{ ...LS.field, ...LS.fieldFull, marginTop: 16 }}>
              {lblWithAi('Listing Description (Shared)')}
              <textarea
                style={LS.txtarea}
                value={common.description}
                onChange={e => setCommon(c => ({ ...c, description: e.target.value }))}
              />
            </div>

            <div style={{ ...LS.grid2, marginTop: 16 }}>
              <div style={LS.field}>
                {lblWithAi('Highlights & Amenities')}
                <div style={LS.amenityGrid2}>
                  {common.amenities.map(a => (
                    <div key={a} style={LS.amenityTile(true)} onClick={() => removeAmenity(a)} title="Click to remove">
                      <div style={LS.amenityIcon}><i className={`ti ${amenityIcon(a)}`} aria-hidden="true" /></div>
                      <span style={LS.amenityLabel}>{a}</span>
                      <i className="ti ti-x" style={{ fontSize: 11, color: C.txtMuted, marginLeft: 'auto' }} aria-hidden="true" />
                    </div>
                  ))}
                  <div style={{ ...LS.amenityTile(true), ...LS.amenityTileAdd, cursor: 'text' }}>
                    <i className="ti ti-plus" aria-hidden="true" />
                    <input
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: 'inherit', flex: 1, minWidth: 0, color: C.txtSec }}
                      placeholder="Add amenity…"
                      value={common.amenityDraft}
                      onChange={e => setCommon(c => ({ ...c, amenityDraft: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(common.amenityDraft); } }}
                    />
                  </div>
                </div>
                <p style={LS.hint}>Amenity names are matched against the UN Reference catalog when saved — a name that doesn't match anything in the catalog won't be saved.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={LS.field}>
                  {lblWithAi('Standard Lease Terms')}
                  <CustomDropdown
                    options={leaseTermOptions}
                    value={common.leaseTermMonths}
                    onChange={v => setCommon(c => ({ ...c, leaseTermMonths: v }))}
                  />
                  <p style={LS.hint}>Used to pre-fill newly added units below — no shared backend field exists for lease terms (each unit's terms are its own).</p>
                </div>
                <div style={LS.field}>
                  {lblWithAi('Application Fee')}
                  <input
                    style={LS.inp}
                    value={common.applicationFee}
                    onChange={e => setCommon(c => ({ ...c, applicationFee: e.target.value }))}
                    placeholder="$50 per applicant"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Unit Matrix */}
          <div style={LS.card} ref={matrixRef}>
            <div style={LS.cardHdrRow}>
              <div>
                <div style={LS.cardHdrTitle}>Unit Matrix ({units.length} units)</div>
                <p style={LS.cardHdrNote}>Configure individual unit specifics below</p>
              </div>
              <div style={LS.cardHdrActions}>
                <button style={{ ...LS.btnSm, ...LS.btnSmOutline }} title="Not wired yet — coming soon">
                  <i className="ti ti-filter" aria-hidden="true" />Filter
                </button>
                <button style={{ ...LS.btnSm, ...LS.btnSmNavySolid }} onClick={openAddUnits}>
                  <i className="ti ti-plus" aria-hidden="true" />Add Units
                </button>
              </div>
            </div>

            {addingUnits && (
              <div style={{ ...LS.card, background: '#f7f9fc', marginTop: 12, marginBottom: 0 }}>
                <div style={LS.cardHdrRow}>
                  <div style={LS.cardHdrTitle}>Add Units to This Group</div>
                  <i className="ti ti-x" style={{ cursor: 'pointer', color: C.txtMuted }} onClick={() => setAddingUnits(false)} aria-hidden="true" />
                </div>
                {availableUnits.length === 0 ? (
                  <p style={{ ...LS.hint, marginTop: 8 }}>Every unit on this property is already part of this listing group.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {availableUnits.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox checked={pickedUnitIds.includes(u.id)} onChange={() => togglePickedUnit(u.id)} />
                        <span style={LS.cktext}>Unit {u.unit_number} — {u.total_rooms ?? '—'} bd / {u.total_baths ?? '—'} ba, {u.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                {addUnitsError && <p style={{ ...LS.hint, color: C.red, marginTop: 8 }}>{addUnitsError}</p>}
                <button
                  style={{ ...LS.btn, ...LS.btnPrimary, marginTop: 12 }}
                  onClick={confirmAddUnits}
                  disabled={!pickedUnitIds.length || addUnitsBusy}
                >
                  {addUnitsBusy ? 'Adding…' : `Add ${pickedUnitIds.length || ''} Unit(s)`}
                </button>
              </div>
            )}

            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={LS.matrixTable}>
                <thead>
                  <tr>
                    <th style={LS.matrixTh} />
                    <th style={LS.matrixTh}>Unit</th>
                    <th style={LS.matrixTh}>Beds / Baths</th>
                    <th style={LS.matrixTh}>Rent (Override)</th>
                    <th style={LS.matrixTh}>Available Date</th>
                    <th style={LS.matrixTh}>Photos</th>
                    <th style={LS.matrixTh}>Common Desc</th>
                    <th style={LS.matrixTh}>Status</th>
                    <th style={LS.matrixTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map(u => {
                    const isEditing = activeUnitId === u.id;
                    const readiness = isEditing ? 'editing' : unitReadiness(u);
                    return (
                      <tr key={u.id} style={LS.matrixTr(isEditing)}>
                        <td style={LS.matrixTd}>
                          <Checkbox checked={selectedRowIds.includes(u.id)} onChange={() => toggleRowSelected(u.id)} />
                        </td>
                        <td style={LS.matrixTd}>
                          <div style={LS.matrixUnitName}>{u.unitName.replace(/^Unit\s+/i, '')}</div>
                        </td>
                        <td style={LS.matrixTd}>{u.bedsBaths}</td>
                        <td style={LS.matrixTd}>
                          {isEditing ? (
                            <input
                              style={LS.matrixInlineInp}
                              value={u.rentalTerms.monthlyRent}
                              onChange={e => updateUnitTerms(u.id, { monthlyRent: e.target.value })}
                            />
                          ) : (
                            <>${Number(u.rentalTerms.monthlyRent || 0).toLocaleString()}</>
                          )}
                        </td>
                        <td style={LS.matrixTd}>
                          {isEditing ? (
                            <input
                              type="date"
                              style={LS.matrixInlineInp}
                              value={u.availableDate}
                              onChange={e => updateUnit(u.id, { availableDate: e.target.value })}
                            />
                          ) : (u.availableDate || '—')}
                        </td>
                        <td style={LS.matrixTd}>
                          {u.photoCount} photos
                          {u.photoCount < MIN_REQUIRED_PHOTOS && (
                            <span style={{ color: C.amber, fontWeight: 700 }}> (min {MIN_REQUIRED_PHOTOS})</span>
                          )}
                        </td>
                        <td style={LS.matrixTd}>
                          <Checkbox
                            checked={!u.description}
                            onChange={() => updateUnit(u.id, { description: u.description ? '' : common.description })}
                          />
                        </td>
                        <td style={LS.matrixTd}>
                          <span style={LS.matrixStatus(readiness)}>{READINESS_LABEL[readiness]}</span>
                        </td>
                        <td style={LS.matrixTd}>
                          {isEditing ? (
                            <span style={{ display: 'flex', gap: 10 }}>
                              <i className="ti ti-check" style={{ color: C.greenDark, cursor: 'pointer' }} onClick={handleSaveUnit} aria-hidden="true" title="Save changes" />
                              <i className="ti ti-x" style={{ color: C.txtMuted, cursor: 'pointer' }} onClick={handleCancelUnit} aria-hidden="true" title="Discard changes" />
                            </span>
                          ) : (
                            <span style={{ display: 'flex', gap: 10 }}>
                              <i className="ti ti-pencil" style={{ color: C.blue, cursor: 'pointer' }} onClick={() => openUnit(u.id)} aria-hidden="true" title="Edit specifics" />
                              <i
                                className="ti ti-trash"
                                style={{
                                  color: C.red,
                                  cursor: removingId ? 'not-allowed' : 'pointer',
                                  opacity: removingId === u.id ? 0.4 : (removingId ? 0.5 : 1),
                                }}
                                onClick={() => requestRemoveUnit(u)}
                                aria-hidden="true"
                                title={removingId === u.id ? 'Removing…' : 'Remove this unit from the group'}
                              />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {units.length === 0 && (
                    <tr><td style={LS.matrixTd} colSpan={9}>No units in this group yet — use Add Units above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inline Edit Unit Specifics */}
          {activeUnit && (
            <div style={LS.specCard} ref={specRef}>
              <div style={LS.specHdr}>
                <div>
                  <h3 style={LS.specTitle}>Edit {activeUnit.unitName} Specifics</h3>
                  <p style={LS.specSub}>Overrides common property values for {activeUnit.unitName} only.</p>
                </div>
                <div style={LS.cardHdrActions}>
                  <button style={{ ...LS.btn, ...LS.btnSecondary }} onClick={handleCancelUnit}>Cancel</button>
                  <button style={{ ...LS.btn, ...LS.btnPrimary }} onClick={handleSaveUnit} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
              {saveError && <p style={{ ...LS.hint, color: C.red, marginTop: -8, marginBottom: 12 }}>{saveError}</p>}

              <div style={LS.specTabBar}>
                <button style={LS.specTab(activeTab === 'details')} onClick={() => setActiveTab('details')}>Unit Details</button>
                <button style={LS.specTab(activeTab === 'photos')} onClick={() => setActiveTab('photos')}>Photos ({activeUnit.selectedPhotoIds.length})</button>
                <button style={LS.specTab(activeTab === 'fees')} onClick={() => setActiveTab('fees')}>Fees &amp; Policies</button>
              </div>

              <div style={LS.specBody}>
                {activeTab === 'details' && (
                  <>
                    <div style={LS.grid2}>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Monthly Rent ($)</span>
                        <input
                          style={LS.inp}
                          value={activeUnit.rentalTerms.monthlyRent}
                          onChange={e => updateUnitTerms(activeUnit.id, { monthlyRent: e.target.value })}
                        />
                      </div>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Available Date</span>
                        <input
                          type="date"
                          style={LS.inp}
                          value={activeUnit.availableDate}
                          onChange={e => updateUnit(activeUnit.id, { availableDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ ...LS.field, ...LS.fieldFull, marginTop: 16 }}>
                      <span style={LS.lbl}>Description Override (Optional)</span>
                      <textarea
                        style={LS.txtarea}
                        value={activeUnit.description}
                        onChange={e => updateUnit(activeUnit.id, { description: e.target.value })}
                        placeholder="Leave blank to use the shared listing description above"
                      />
                    </div>

                    <div style={{ ...LS.grid2, marginTop: 16 }}>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Floor Plan Name</span>
                        <input
                          style={LS.inp}
                          value={activeUnit.floorPlanName}
                          onChange={e => updateUnit(activeUnit.id, { floorPlanName: e.target.value })}
                        />
                        <p style={LS.hint}>Saved on the Unit record, not the listing — same field the single-unit flow's Step 2 uses.</p>
                      </div>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Internal Notes</span>
                        <input
                          style={LS.inp}
                          value={activeUnit.internalNotes}
                          onChange={e => updateUnit(activeUnit.id, { internalNotes: e.target.value })}
                        />
                        <p style={LS.hint}>Not saved yet — no backend field exists for internal notes.</p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'photos' && (
                  <>
                    <div style={LS.lblRow}>
                      <span style={LS.lbl}>Unit Images &amp; Videos</span>
                      <AiPill />
                    </div>

                    {/* Session 54 fix: this tab now shows the unit's actual
                        gallery (photos + videos, from its own Gallery tab)
                        instead of empty placeholder tiles sized only by a
                        count. Clicking a photo includes/excludes it from
                        THIS listing (doesn't touch the unit's gallery
                        itself); the star sets the cover photo used on
                        marketplace cards and the Preview below. Only one
                        video can go on a listing (Listing.video_url), so
                        videos are single-select. */}
                    {activeUnit.galleryImages.length === 0 && activeUnit.galleryVideos.length === 0 && !activeUnit.floorPlanUrl ? (
                      <p style={LS.hint}>
                        This unit has no photos, videos, or floor plan yet. Add them from the unit's own
                        Gallery tab (Properties → this unit → Edit → Gallery), then come back here to choose
                        which ones appear on this listing.
                      </p>
                    ) : (
                      <>
                        {activeUnit.galleryImages.length > 0 && (
                          <>
                            <p style={{ ...LS.hint, marginTop: 2, marginBottom: 6 }}>Click a photo to include/exclude it on this listing. The star sets the cover photo.</p>
                            <div style={LS.photoGrid}>
                              {activeUnit.galleryImages.map(img => {
                                const isSelected = activeUnit.selectedPhotoIds.includes(img.id);
                                const isCover = activeUnit.coverPhotoId === img.id;
                                return (
                                  <div
                                    key={img.id}
                                    onClick={() => toggleUnitPhoto(activeUnit.id, img.id)}
                                    title={isSelected ? 'Click to remove from this listing' : 'Click to include on this listing'}
                                    style={{ ...LS.photoTile(isSelected), backgroundImage: `url(${img.file_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                  >
                                    {isSelected && (
                                      <button
                                        onClick={e => { e.stopPropagation(); setUnitCoverPhoto(activeUnit.id, img.id); }}
                                        title={isCover ? 'Cover photo' : 'Set as cover photo'}
                                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCover ? C.amber : 'rgba(0,0,0,0.45)' }}
                                      >
                                        <i className="ti ti-star" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />
                                      </button>
                                    )}
                                    {isSelected && (
                                      <div style={{ position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              <div style={{ ...LS.uploadTile, opacity: 0.55, cursor: 'not-allowed' }} title="Uploading a new photo here isn't available yet — add it from the unit's own Gallery tab">
                                <i className="ti ti-plus" aria-hidden="true" />
                                Add More
                              </div>
                            </div>
                          </>
                        )}

                        {activeUnit.galleryVideos.length > 0 && (
                          <>
                            <p style={{ ...LS.hint, marginTop: 16, marginBottom: 6 }}>Video — only one can be used on this listing.</p>
                            <div style={LS.photoGrid}>
                              {activeUnit.galleryVideos.map(v => {
                                const isSelected = activeUnit.videoUrl === v.file_url;
                                return (
                                  <div
                                    key={v.id}
                                    onClick={() => updateUnit(activeUnit.id, { videoUrl: isSelected ? '' : v.file_url })}
                                    title={isSelected ? 'Click to remove from this listing' : 'Click to use on this listing'}
                                    style={{ ...LS.photoTile(isSelected), background: '#000' }}
                                  >
                                    <video src={v.file_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, position: 'absolute', inset: 0 }} />
                                    <i className="ti ti-player-play-filled" style={{ fontSize: 20, color: '#fff', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))', position: 'relative' }} aria-hidden="true" />
                                    {isSelected && (
                                      <div style={{ position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {activeUnit.floorPlanUrl && (
                          <>
                            <p style={{ ...LS.hint, marginTop: 16, marginBottom: 6 }}>Floor plan</p>
                            <div style={{ width: 160 }}>
                              <div style={{ ...LS.photoTile(false), cursor: 'default', backgroundImage: `url(${activeUnit.floorPlanUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            </div>
                            <p style={LS.hint}>Managed from the unit's own Gallery tab — shown here for reference.</p>
                          </>
                        )}
                      </>
                    )}
                    {activeUnit.selectedPhotoIds.length < MIN_REQUIRED_PHOTOS && (
                      <p style={{ ...LS.hint, color: C.amber, fontWeight: 600, marginTop: 8 }}>
                        Include {MIN_REQUIRED_PHOTOS - activeUnit.selectedPhotoIds.length} more photo(s) to mark this unit Ready.
                      </p>
                    )}
                  </>
                )}

                {activeTab === 'fees' && (
                  <>
                    <div style={LS.grid2}>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Monthly Rent ($)</span>
                        <input
                          style={LS.inp}
                          value={activeUnit.rentalTerms.monthlyRent}
                          onChange={e => updateUnitTerms(activeUnit.id, { monthlyRent: e.target.value })}
                        />
                      </div>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Security Deposit ($)</span>
                        <input
                          style={LS.inp}
                          value={activeUnit.rentalTerms.securityDeposit}
                          onChange={e => updateUnitTerms(activeUnit.id, { securityDeposit: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ ...LS.grid2, marginTop: 16 }}>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Lease Term (Months)</span>
                        <CustomDropdown
                          options={leaseTermOptions}
                          value={activeUnit.rentalTerms.leaseTermMonths}
                          onChange={v => updateUnitTerms(activeUnit.id, { leaseTermMonths: v })}
                        />
                      </div>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Application Fee ($)</span>
                        <input
                          style={LS.inp}
                          value={activeUnit.rentalTerms.applicationFee}
                          onChange={e => updateUnitTerms(activeUnit.id, { applicationFee: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <span style={LS.lbl}>Pet Policy</span>
                      <div style={{ ...LS.radiopill, marginTop: 6 }}>
                        <RadioPillButton label="Allowed" on={activeUnit.rentalTerms.petPolicy === 'ALLOWED'} onClick={() => updateUnitTerms(activeUnit.id, { petPolicy: 'ALLOWED' })} />
                        <RadioPillButton label="Not Allowed" on={activeUnit.rentalTerms.petPolicy === 'NOT_ALLOWED'} onClick={() => updateUnitTerms(activeUnit.id, { petPolicy: 'NOT_ALLOWED' })} />
                      </div>
                    </div>

                    <div style={{ ...LS.grid2, marginTop: 16 }}>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Pet Deposit ($)</span>
                        <input style={LS.inp} value={activeUnit.rentalTerms.petDeposit} onChange={e => updateUnitTerms(activeUnit.id, { petDeposit: e.target.value })} />
                      </div>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Pet Rent ($ / Month)</span>
                        <input style={LS.inp} value={activeUnit.rentalTerms.petRent} onChange={e => updateUnitTerms(activeUnit.id, { petRent: e.target.value })} />
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <span style={LS.ckGroupLbl}>Utilities Included in Rent</span>
                      <div style={LS.ckRow}>
                        {UTILITY_KEYS.map(u => (
                          <div key={u.key} style={LS.ckItem}>
                            <Checkbox
                              checked={!!activeUnit.rentalTerms.utilitiesIncluded[u.key]}
                              onChange={() => updateUnitTerms(activeUnit.id, {
                                utilitiesIncluded: { ...activeUnit.rentalTerms.utilitiesIncluded, [u.key]: !activeUnit.rentalTerms.utilitiesIncluded[u.key] },
                              })}
                            />
                            <span style={LS.cktext}>{u.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <span style={LS.ckGroupLbl}>Smoking Policy</span>
                      <div style={LS.ckItem}>
                        <Checkbox
                          checked={activeUnit.rentalTerms.smokingAllowed}
                          onChange={() => updateUnitTerms(activeUnit.id, { smokingAllowed: !activeUnit.rentalTerms.smokingAllowed })}
                        />
                        <span style={LS.cktext}>Smoking Allowed</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <span style={LS.lbl}>Parking Fees</span>
                      <div style={{ ...LS.radiopill, marginTop: 6 }}>
                        <RadioPillButton label="Yes" on={activeUnit.rentalTerms.parkingFeeEnabled} onClick={() => updateUnitTerms(activeUnit.id, { parkingFeeEnabled: true })} />
                        <RadioPillButton label="No" on={!activeUnit.rentalTerms.parkingFeeEnabled} onClick={() => updateUnitTerms(activeUnit.id, { parkingFeeEnabled: false })} />
                      </div>
                    </div>
                    {activeUnit.rentalTerms.parkingFeeEnabled && (
                      <div style={{ ...LS.grid2, marginTop: 12 }}>
                        <div style={LS.field}>
                          <span style={LS.lbl}>Parking Items</span>
                          <CustomDropdown
                            options={parkingFeeTypeOptions}
                            value={activeUnit.rentalTerms.parkingFeeType}
                            onChange={v => updateUnitTerms(activeUnit.id, { parkingFeeType: v })}
                          />
                        </div>
                        <div style={LS.field}>
                          <span style={LS.lbl}>Amount ($)</span>
                          <input style={LS.inp} value={activeUnit.rentalTerms.parkingFeeAmount} onChange={e => updateUnitTerms(activeUnit.id, { parkingFeeAmount: e.target.value })} />
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 16 }}>
                      <span style={LS.lbl}>Other Fees</span>
                      <div style={{ ...LS.radiopill, marginTop: 6 }}>
                        <RadioPillButton label="Yes" on={activeUnit.rentalTerms.otherFeesEnabled} onClick={() => updateUnitTerms(activeUnit.id, { otherFeesEnabled: true })} />
                        <RadioPillButton label="No" on={!activeUnit.rentalTerms.otherFeesEnabled} onClick={() => updateUnitTerms(activeUnit.id, { otherFeesEnabled: false })} />
                      </div>
                    </div>
                    {activeUnit.rentalTerms.otherFeesEnabled && (
                      <>
                        {activeUnit.rentalTerms.otherFees.map((fee, idx) => (
                          <div key={idx} style={{ ...LS.grid2, marginTop: 12 }}>
                            <div style={LS.field}>
                              <span style={LS.lbl}>Other Items</span>
                              <CustomDropdown
                                options={otherFeeTypeOptions}
                                value={fee.type}
                                onChange={v => {
                                  const next = [...activeUnit.rentalTerms.otherFees];
                                  next[idx] = { ...next[idx], type: v };
                                  updateUnitTerms(activeUnit.id, { otherFees: next });
                                }}
                              />
                            </div>
                            <div style={LS.field}>
                              <span style={LS.lbl}>Amount ($)</span>
                              <input
                                style={LS.inp}
                                value={fee.amount}
                                onChange={e => {
                                  const next = [...activeUnit.rentalTerms.otherFees];
                                  next[idx] = { ...next[idx], amount: e.target.value };
                                  updateUnitTerms(activeUnit.id, { otherFees: next });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <span
                          style={{ ...LS.addLink, display: 'block', textAlign: 'right', marginTop: 8 }}
                          onClick={() => updateUnitTerms(activeUnit.id, { otherFees: [...activeUnit.rentalTerms.otherFees, { type: '', amount: '' }] })}
                        >
                          + Add Fees
                        </span>
                      </>
                    )}

                    <div style={{ ...LS.grid2, marginTop: 16 }}>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Rent Concession</span>
                        <input style={LS.inp} value={activeUnit.rentalTerms.rentConcession} onChange={e => updateUnitTerms(activeUnit.id, { rentConcession: e.target.value })} placeholder="e.g. 1 Month Free on 13 Month Lease" />
                      </div>
                      <div style={LS.field}>
                        <span style={LS.lbl}>Concession Amount ($)</span>
                        <input style={LS.inp} value={activeUnit.rentalTerms.concessionAmount} onChange={e => updateUnitTerms(activeUnit.id, { concessionAmount: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preview All Listings */}
          <div ref={previewRef}>
            <div style={{ ...LS.cardHdrTitle, marginBottom: 12 }}>Preview All Listings</div>
            <div style={LS.previewGrid2}>
              {units.map(u => {
                // Session 55 fix: arrows now actually cycle through this
                // unit's selected photos (cover photo shown first on load,
                // same as before) instead of being decorative.
                const previewPhotos = previewPhotosFor(u);
                const idx = previewPhotos.length ? (previewIdxByUnit[u.id] || 0) % previewPhotos.length : 0;
                const coverImg = previewPhotos.length
                  ? previewPhotos[idx]
                  : (u.galleryImages.find(g => g.id === u.coverPhotoId) || u.galleryImages[0]);
                return (
                <div key={u.id} style={LS.previewCard2(activeUnitId === u.id)}>
                  <div style={LS.previewMetaRow2}>
                    <span style={LS.previewName2}>{u.unitName}</span>
                    <span style={LS.previewSpecs2}>{u.bedsBaths} · ${Number(u.rentalTerms.monthlyRent || 0).toLocaleString()}</span>
                  </div>
                  <div style={LS.previewImgWrap2}>
                    {coverImg ? (
                      <img src={coverImg.file_url} alt={u.unitName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : null}
                    {previewPhotos.length > 1 && (
                      <>
                        <button
                          style={LS.previewArrow2('left')}
                          title="Previous photo"
                          onClick={() => cyclePreview(u.id, -1, previewPhotos.length)}
                        ><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                        <button
                          style={LS.previewArrow2('right')}
                          title="Next photo"
                          onClick={() => cyclePreview(u.id, 1, previewPhotos.length)}
                        ><i className="ti ti-chevron-right" aria-hidden="true" /></button>
                      </>
                    )}
                  </div>
                  <p style={LS.previewDesc2}>
                    {u.description || common.description}
                  </p>
                </div>
                );
              })}
              {units.length === 0 && (
                <p style={{ fontSize: 12, color: C.txtMuted }}>Add units above to preview their listings here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ListingPageShell>

    {/* Remove-unit confirmation — in-app modal (Session 45 continuation),
        replacing window.confirm()'s browser-native "localhost:3000 says"
        dialog, which looked like an error rather than part of the product. */}
    {pendingRemoval && (
      <div
        role="presentation"
        onClick={cancelRemoveUnit}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-unit-modal-title"
          onClick={e => e.stopPropagation()}
          style={{
            background: C.cardBg, borderRadius: 12, maxWidth: 420, width: '100%',
            padding: 24, boxShadow: '0 20px 40px rgba(13,27,46,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: C.redLight, color: C.red,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16,
            }}>
              <i className="ti ti-trash" aria-hidden="true" />
            </div>
            <div>
              <div id="remove-unit-modal-title" style={{ fontSize: 15, fontWeight: 700, color: C.txtPrimary, marginBottom: 4 }}>
                Remove {pendingRemoval.unitName} from this listing group?
              </div>
              <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.5 }}>
                It will not be published with this group, and returns to List Ready — you can add it back later via "Add Units".
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={cancelRemoveUnit}
              style={{
                padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
                background: C.cardBg, color: C.txtPrimary, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveUnit}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: C.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Remove Unit
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
