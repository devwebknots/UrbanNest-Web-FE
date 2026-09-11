// src/pages/Landlord/Listing/ListMultiUnits.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Multi-Unit Listing wizard — Step 2: "List Multiple Units".
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
//    and lets the landlord attach any unit not already in the group via
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
import { C } from '../landlordTokens';
import { CustomDropdown } from '../../../components/ui';
import {
  LS, ListingPageShell, ListingFooter, Checkbox, RadioPillButton, MULTI_STEPS,
} from './listingWizardShared';
import {
  getProperty, getAmenityCatalog, getPropertyUnits, getUnit, patchUnit,
  getListing, patchListing,
  getRentalTerms, patchRentalTerms,
  getListingMedia,
  getListingDropdownOptions,
} from './listingApi';
import {
  getPropertyListing, patchPropertyListing,
  getPropertyListingAmenities, savePropertyListingAmenities,
  createUnitListing,
} from './propertyListingApi';

const UTILITY_KEYS = [
  { key: 'water', label: 'Water' },
  { key: 'trash', label: 'Trash' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'gas', label: 'Gas' },
  { key: 'internet', label: 'Internet' },
];

const READINESS_LABEL = { ready: 'Ready', editing: 'Editing', needs_info: 'Needs Info', draft: 'Draft' };

// Same photo-count gate as the single-unit flow (mockListingData.js) — kept
// as one shared constant rather than the old mock's own separate (and
// inconsistent, 3 vs 4) copy. The real gate is enforced server-side at
// publish time regardless (property_listing_publish's compliance check).
const MIN_REQUIRED_PHOTOS = 4;

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
  return {
    id: summary.id,                 // Listing id — the key for every per-unit API call below
    unitId: summary.unit,           // Unit id — for patchUnit (floor_plan_name)
    unitName: `Unit ${unit.unit_number ?? summary.unit}`,
    bedsBaths: `${unit.total_rooms ?? '—'} bd / ${unit.total_baths ?? '—'} ba`,
    status: summary.status,
    availableDate: listing.available_date || '',
    description: listing.description || '',
    floorPlanName: unit.floor_plan_name || '',
    internalNotes: '',              // no backend field anywhere — local-only, see header note
    photoCount: Array.isArray(media) ? media.length : 0,
    rentalTerms: termsFromBackend(rentalTerms),
  };
}

export default function ListMultiUnits() {
  const { id: propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const propertyListingId = location.state?.propertyListingId ?? null;

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
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [leaseTermOptions, setLeaseTermOptions] = useState([]);
  const [parkingFeeTypeOptions, setParkingFeeTypeOptions] = useState([]);
  const [otherFeeTypeOptions, setOtherFeeTypeOptions] = useState([]);

  const [addingUnits, setAddingUnits] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]); // property units not yet in the group
  const [pickedUnitIds, setPickedUnitIds] = useState([]);
  const [addUnitsError, setAddUnitsError] = useState('');
  const [addUnitsBusy, setAddUnitsBusy] = useState(false);

  const commonRef = useRef(null);
  const matrixRef = useRef(null);
  const specRef = useRef(null);
  const previewRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    if (!propertyListingId) {
      navigate(`/landlord-portal/property/${propertyId}/list-multi/step-1`, { replace: true });
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

        const rows = await Promise.all((groupData.unit_listings || []).map(s => loadUnitRow(propertyId, s)));
        if (cancelled) return;
        setUnits(rows);
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
  const toggleRowSelected = (unitListingId) => {
    setSelectedRowIds(prev => prev.includes(unitListingId) ? prev.filter(id => id !== unitListingId) : [...prev, unitListingId]);
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
    });
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
      setAvailableUnits((all || []).filter(u => !existingUnitIds.has(u.id)));
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
      await persistCommon();
      navigate(`/landlord-portal/property/${propertyId}/list-multi/step-1`, { state: { propertyListingId } });
    } catch (e) {
      setSaveError(e.message || 'Could not save common listing details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExit = async () => {
    if (saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await persistCommon();
      navigate(`/landlord-portal/property/${propertyId}`);
    } catch (e) {
      setSaveError(e.message || 'Could not save common listing details.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await persistCommon();
      navigate(`/landlord-portal/property/${propertyId}/list-multi/step-3`, { state: { propertyListingId } });
    } catch (e) {
      setSaveError(e.message || 'Could not save common listing details.');
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
          continueDisabled={saving}
          noteContent={saveError || undefined}
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
                              <i className="ti ti-trash" style={{ color: C.red, cursor: 'not-allowed', opacity: 0.5 }} aria-hidden="true" title="Removing a unit from a group isn't wired yet" />
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
                <button style={LS.specTab(activeTab === 'photos')} onClick={() => setActiveTab('photos')}>Photos ({activeUnit.photoCount})</button>
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
                    <div style={{ ...LS.photoGrid, marginTop: 10 }}>
                      {Array.from({ length: activeUnit.photoCount }).map((_, i) => (
                        <div key={i} style={LS.photoTile(false)} />
                      ))}
                      <div style={{ ...LS.uploadTile, opacity: 0.55, cursor: 'not-allowed' }} title="Uploading a new photo isn't available yet — coming soon">
                        <i className="ti ti-plus" aria-hidden="true" />
                        Add More
                      </div>
                    </div>
                    <p style={{ ...LS.hint, marginTop: 8 }}>Photo count is read from this unit's existing listing media — selecting/uploading new photos here isn't wired yet, same gap as the single-unit flow (Step 2).</p>
                    {activeUnit.photoCount < MIN_REQUIRED_PHOTOS && (
                      <p style={{ ...LS.hint, color: C.amber, fontWeight: 600, marginTop: 8 }}>
                        Add {MIN_REQUIRED_PHOTOS - activeUnit.photoCount} more photo(s) to mark this unit Ready.
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
              {units.map(u => (
                <div key={u.id} style={LS.previewCard2(activeUnitId === u.id)}>
                  <div style={LS.previewMetaRow2}>
                    <span style={LS.previewName2}>{u.unitName}</span>
                    <span style={LS.previewSpecs2}>{u.bedsBaths} · ${Number(u.rentalTerms.monthlyRent || 0).toLocaleString()}</span>
                  </div>
                  <div style={LS.previewImgWrap2}>
                    <button style={LS.previewArrow2('left')} title="Not wired yet"><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                    <button style={LS.previewArrow2('right')} title="Not wired yet"><i className="ti ti-chevron-right" aria-hidden="true" /></button>
                  </div>
                  <p style={LS.previewDesc2}>
                    {u.description || common.description}
                  </p>
                </div>
              ))}
              {units.length === 0 && (
                <p style={{ fontSize: 12, color: C.txtMuted }}>Add units above to preview their listings here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ListingPageShell>
  );
}
