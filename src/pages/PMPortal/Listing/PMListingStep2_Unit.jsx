// src/pages/PMPortal/Listing/PMListingStep2_Unit.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Create Listing wizard — Step 2: Unit (Rent + Sale) — PM Portal (Independent
// PM / Org PM staff, Individual Unit Listing)
//
// Session 47 second build slice. Deliberate duplicate of
// ../../Landlord/Listing/ListingStep2_Unit.jsx — see
// pmListingWizardShared.jsx's header comment for why (different shell, same
// portal-agnostic step content/logic, matching this codebase's existing
// Multi-Unit-vs-Individual-Unit duplication precedent). Field logic, backend
// shape conversions (termsFromBackend/termsToBackend etc.) and dropdown
// wiring below are copied unchanged from the Landlord file.
//
// listingApi.js and the CustomDropdown UI component are reused as-is from
// their existing locations (both already portal-agnostic) rather than
// duplicated — same reasoning as PMListingStep1_Property.jsx.
//
// PM Portal route param names: :id/:unitId (not Landlord's :id/:uid) —
// confirmed against App.js / PMUnitDetailPage.jsx before wiring this up.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from './pmListingTokens';
import { CustomDropdown } from '../../../components/ui';
import {
  LS, ListingPageShell, ListingFooter, SectionHead,
  AiAssistButton, Checkbox, RadioPillButton,
} from './pmListingWizardShared';
import {
  getUnit, patchUnit, getAmenityCatalog,
  getListing, patchListing,
  getListingAmenities, saveListingAmenities,
  getRentalTerms, patchRentalTerms,
  getSaleTerms, patchSaleTerms,
  getListingMedia, saveListingMedia,
  getListingDropdownOptions,
} from '../../Landlord/Listing/listingApi';

const UTILITY_KEYS = [
  { key: 'water', label: 'Water' },
  { key: 'trash', label: 'Trash' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'gas', label: 'Gas' },
  { key: 'internet', label: 'Internet' },
];

// Lease Term / Parking Fee Type / Other Fee Type option lists come from the
// admin-configurable UNDropdown table (screen=LISTING_STEP2_UNIT), fetched
// via getListingDropdownOptions — NOT hardcoded here. See
// core/migrations/0027_seed_listing_dropdowns.py for the seeded rows.
function DropdownOrCustom({ value, onChange, options, placeholder = 'Select…', customPlaceholder = 'Enter custom value', type = 'text' }) {
  const optionValues = options.map(o => o.value);
  const isCustom = !!value && !optionValues.includes(value);
  const [customMode, setCustomMode] = useState(isCustom);
  useEffect(() => { if (!isCustom) setCustomMode(false); }, [isCustom]);

  const ddOptions = [...options, { value: '__custom__', label: 'Custom…' }];

  return (
    <>
      <CustomDropdown
        options={ddOptions}
        value={customMode ? '__custom__' : value}
        placeholder={placeholder}
        onChange={v => {
          if (v === '__custom__') { setCustomMode(true); onChange(''); }
          else { setCustomMode(false); onChange(v); }
        }}
      />
      {customMode && (
        <input
          style={{ ...LS.inp, marginTop: 6 }}
          type={type}
          placeholder={customPlaceholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </>
  );
}

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
const numOrZero = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

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

function saleTermsFromBackend(st) {
  return {
    askingPrice: st.asking_price != null ? String(st.asking_price) : '',
    availableDate: st.available_date || '',
    propertyTax: st.property_tax != null ? String(st.property_tax) : '',
    hoaEnabled: !!st.hoa,
    hoaFee: st.hoa_fee != null ? String(st.hoa_fee) : '',
    hoaFeeFrequency: st.hoa_fee_frequency || 'Monthly',
    showingInstructions: st.showing_instructions || '',
    possessionTerms: st.possession_terms || '',
    sellerFinancingEnabled: !!st.seller_financing,
    otherSaleTerms: st.other_sale_terms || '',
  };
}
function saleTermsToBackend(s) {
  return {
    asking_price: numOrZero(s.askingPrice),
    available_date: s.availableDate || null,
    property_tax: numOrNull(s.propertyTax),
    hoa: s.hoaEnabled,
    hoa_fee: s.hoaEnabled ? numOrNull(s.hoaFee) : null,
    hoa_fee_frequency: s.hoaFeeFrequency,
    showing_instructions: s.showingInstructions,
    possession_terms: s.possessionTerms,
    seller_financing: s.sellerFinancingEnabled,
    other_sale_terms: s.otherSaleTerms,
  };
}

export default function PMListingStep2_Unit() {
  const { id: propId, unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const listingId = location.state?.listingId ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [propertyName, setPropertyName] = useState('');
  const [unit, setUnit] = useState(null);
  const [listingType, setListingType] = useState('RENT');

  const [floorPlanName, setFloorPlanName] = useState('');

  const [amenities, setAmenities] = useState([]);
  const [syncAmenitiesToUnit, setSyncAmenitiesToUnit] = useState(true);

  const [terms, setTerms] = useState(termsFromBackend({}));
  const setTerm = (key, value) => setTerms(prev => ({ ...prev, [key]: value }));
  const toggleUtility = (group, key) =>
    setTerms(prev => ({ ...prev, [group]: { ...prev[group], [key]: !prev[group][key] } }));

  const [saleTerms, setSaleTerms] = useState(saleTermsFromBackend({}));
  const setSaleTerm = (key, value) => setSaleTerms(prev => ({ ...prev, [key]: value }));

  const [basics, setBasics] = useState({ title: '', description: '', highlights: [], availableDate: '' });
  const setBasic = (key, value) => setBasics(prev => ({ ...prev, [key]: value }));
  const [highlightDraft, setHighlightDraft] = useState('');

  const [photos, setPhotos] = useState([]); // [{id, url, selected}]
  const [coverId, setCoverId] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [virtualTourUrl, setVirtualTourUrl] = useState('');

  // Dropdown option lists for Rental Terms — fetched from UNDropdown
  // (screen=LISTING_STEP2_UNIT), not hardcoded. Each entry is {value, label}
  // matching CustomDropdown's expected option shape.
  const [leaseTermOptions, setLeaseTermOptions] = useState([]);
  const [parkingFeeTypeOptions, setParkingFeeTypeOptions] = useState([]);
  const [otherFeeTypeOptions, setOtherFeeTypeOptions] = useState([]);

  useEffect(() => {
    if (!listingId) {
      navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-1`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [unitData, catalog, listing, listingAmenities, media, leaseTermDd, parkingFeeTypeDd, otherFeeTypeDd] = await Promise.all([
          getUnit(propId, unitId),
          getAmenityCatalog('UNIT'),
          getListing(listingId),
          getListingAmenities(listingId, 'UNIT'),
          getListingMedia(listingId),
          getListingDropdownOptions('LEASE_TERM_MONTHS'),
          getListingDropdownOptions('PARKING_FEE_TYPE'),
          getListingDropdownOptions('OTHER_FEE_TYPE'),
        ]);
        if (cancelled) return;

        const toOptions = (dd) => (dd?.options || []).map(o => ({ value: o.option_code, label: o.option_label }));
        setLeaseTermOptions(toOptions(leaseTermDd));
        setParkingFeeTypeOptions(toOptions(parkingFeeTypeDd));
        setOtherFeeTypeOptions(toOptions(otherFeeTypeDd));

        setPropertyName(unitData.property?.name || '');
        setUnit(unitData);
        setListingType(listing.listing_type || 'RENT');
        setFloorPlanName(unitData.floor_plan_name || '');
        setBasics({
          title: listing.title || '',
          description: listing.description || '',
          highlights: listing.highlights || [],
          availableDate: listing.available_date || '',
        });
        setVideoUrl(listing.video_url || '');
        setVirtualTourUrl(listing.virtual_tour_url || '');

        const selectedAmenityIds = listingAmenities.length
          ? new Set(listingAmenities.map(la => la.amenity))
          : new Set((unitData.amenities || []).map(ua => ua.amenity));
        setAmenities(catalog.map(a => ({
          id: a.id,
          name: a.name,
          icon: a.icon || 'ti-check',
          selected: selectedAmenityIds.has(a.id),
        })));

        const gallery = unitData.gallery_images || [];
        const mediaByGalleryId = new Map(media.map(m => [m.source_gallery_item, m]));
        const hasExistingSelection = media.length > 0;
        setPhotos(gallery.map(g => {
          const existing = mediaByGalleryId.get(g.id);
          return {
            id: g.id,
            url: g.file_url,
            selected: hasExistingSelection ? !!existing : true,
          };
        }));
        const existingCover = media.find(m => m.is_cover);
        setCoverId(existingCover ? existingCover.source_gallery_item : (gallery[0]?.id ?? null));

        if (listing.listing_type === 'SALE') {
          const st = await getSaleTerms(listingId);
          if (cancelled) return;
          setSaleTerms(saleTermsFromBackend(st));
        } else {
          const rt = await getRentalTerms(listingId);
          if (cancelled) return;
          setTerms(termsFromBackend(rt));
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Could not load this unit.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propId, unitId, listingId]);

  const toggleAmenity = (id) => setAmenities(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  const togglePhoto = (id) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));

  const addHighlight = () => {
    const v = highlightDraft.trim();
    if (!v) return;
    setBasic('highlights', [...basics.highlights, v]);
    setHighlightDraft('');
  };
  const removeHighlight = (idx) => setBasic('highlights', basics.highlights.filter((_, i) => i !== idx));

  const addOtherFee = () => setTerm('otherFees', [...terms.otherFees, { type: '', amount: '' }]);
  const updateOtherFee = (idx, field, value) =>
    setTerm('otherFees', terms.otherFees.map((f, i) => i === idx ? { ...f, [field]: value } : f));

  // ── Persist this step against the real backend ───────────────────────────
  const persist = async () => {
    await patchUnit(propId, unitId, { floor_plan_name: floorPlanName });

    const selectedAmenityIds = amenities.filter(a => a.selected).map(a => a.id);
    await saveListingAmenities(listingId, {
      category: 'UNIT',
      amenityIds: selectedAmenityIds,
      syncToUnit: syncAmenitiesToUnit,
    });

    if (listingType === 'SALE') {
      await patchSaleTerms(listingId, saleTermsToBackend(saleTerms));
    } else {
      await patchRentalTerms(listingId, termsToBackend(terms));
    }

    await patchListing(listingId, {
      title: basics.title,
      description: basics.description,
      highlights: basics.highlights,
      available_date: basics.availableDate || null,
      video_url: videoUrl,
      virtual_tour_url: virtualTourUrl,
    });

    const selectedPhotoIds = photos.filter(p => p.selected).map(p => p.id);
    await saveListingMedia(listingId, {
      galleryItemIds: selectedPhotoIds,
      coverId: selectedPhotoIds.includes(coverId) ? coverId : (selectedPhotoIds[0] ?? null),
    });
  };

  const handleBack = async () => {
    if (saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await persist();
      navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-1`, { state: { listingId } });
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
      await persist();
      navigate(`/pm-portal/properties/${propId}/units/${unitId}`);
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await persist();
      navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-3`, { state: { listingId, propertyName } });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: C.txtSec }}>
        Loading unit…
      </div>
    );
  }

  if (loadError || !unit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 10, color: C.txtSec }}>
        <div>{loadError || 'This unit could not be loaded.'}</div>
      </div>
    );
  }

  const unitInfoFields = [
    ['Unit Number', unit.unit_number],
    ['Unit Type', unit.unit_type || '—'],
    ['Square Footage', unit.total_area ? `${unit.total_area} sq ft` : '—'],
    ['Carpet Area', unit.carpet_area ? `${unit.carpet_area} sq ft` : '—'],
    ['Bedrooms', unit.total_rooms ?? '—'],
    ['Bathrooms', unit.total_baths ?? '—'],
    ['Floor', unit.floor ?? '—'],
    ['Lease Type', unit.lease_type || '—'],
  ];

  return (
    <ListingPageShell
      propertyName={propertyName || 'Property'}
      unitLabel={`Unit ${unit.unit_number}`}
      current={2}
      footer={
        <ListingFooter
          current={2}
          onBack={handleBack}
          onSaveExit={handleSaveExit}
          onContinue={handleContinue}
          continueLabel={saving ? 'Saving…' : 'Continue →'}
          continueDisabled={saving}
          noteContent={saveError || undefined}
        />
      }
    >
      <div style={LS.split}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={LS.splitCol}>

          {/* Unit Information */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-bed"
              bg={C.blueLight}
              color={C.blue}
              title="Unit Information"
              note="Pulled from the Unit record — edits here apply to this listing only"
            />
            <div style={LS.grid2}>
              {unitInfoFields.map(([label, value]) => (
                <div key={label} style={LS.field}>
                  <span style={LS.lbl}>{label}</span>
                  <div style={LS.inpStatic}>{value}</div>
                </div>
              ))}
              <div style={LS.field}>
                <span style={LS.lbl}>Floor Plan Name<span style={LS.lblNew}>NEW</span></span>
                <input style={LS.inp} value={floorPlanName} onChange={e => setFloorPlanName(e.target.value)} />
                <p style={LS.hint}>Groups this unit under "{floorPlanName || 'this floor plan'}" when part of a Multi-Unit listing</p>
              </div>
            </div>
          </div>

          {/* Amenity(s) */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-sofa"
              bg="#e8f5f0"
              color={C.teal}
              title="Amenity(s)"
              note="Sourced from the UN Reference amenity list — not free text"
            />
            <div style={LS.amenityGrid}>
              {amenities.map(a => (
                <div key={a.id} style={LS.amenityTile(a.selected)} onClick={() => toggleAmenity(a.id)}>
                  <div style={LS.amenityIcon}><i className={`ti ${a.icon}`} aria-hidden="true" /></div>
                  <span style={LS.amenityLabel}>{a.name}</span>
                </div>
              ))}
              {amenities.length === 0 && (
                <div style={{ fontSize: 12, color: C.txtMuted, gridColumn: '1 / -1' }}>No unit amenities configured yet.</div>
              )}
            </div>
            <div style={LS.syncRow}>
              <Checkbox checked={syncAmenitiesToUnit} onChange={() => setSyncAmenitiesToUnit(v => !v)} />
              <div>
                <span style={{ ...LS.cktext, fontWeight: 550, color: C.txtPrimary }}>Also update the unit record</span>
                <p style={{ ...LS.hint, marginTop: 2 }}>Syncs these amenity selections back to the unit's saved amenity list — otherwise this only affects the listing</p>
              </div>
            </div>
          </div>

          {/* Rental Terms (listingType === 'RENT') */}
          {listingType === 'RENT' && (
          <div style={LS.card}>
            <SectionHead
              icon="ti-cash"
              bg={C.blueLight}
              color={C.blue}
              title="Rental Terms"
              note="Shown because Listing Type = Rent"
            />

            <div style={{ ...LS.grid2, marginBottom: 16 }}>
              <div style={LS.field}>
                <span style={LS.lbl}>Monthly Rent</span>
                <input style={LS.inp} placeholder="$ 0.00" value={terms.monthlyRent} onChange={e => setTerm('monthlyRent', e.target.value)} />
              </div>
              <div style={LS.field}>
                <span style={LS.lbl}>Security Deposit</span>
                <input style={LS.inp} placeholder="$ 0.00" value={terms.securityDeposit} onChange={e => setTerm('securityDeposit', e.target.value)} />
              </div>
              <div style={LS.field}>
                <span style={LS.lbl}>Lease Term (months)</span>
                <DropdownOrCustom
                  value={terms.leaseTermMonths}
                  onChange={v => setTerm('leaseTermMonths', v)}
                  options={leaseTermOptions}
                  customPlaceholder="Enter number of months"
                  type="number"
                />
              </div>
              <div style={LS.field}>
                <span style={LS.lbl}>Application Fee</span>
                <input style={LS.inp} placeholder="$ 0.00" value={terms.applicationFee} onChange={e => setTerm('applicationFee', e.target.value)} />
              </div>
            </div>

            <span style={LS.ckGroupLbl}>Pet Policy</span>
            <div style={{ ...LS.radiopill, marginBottom: 16 }}>
              <RadioPillButton label="Allowed" on={terms.petPolicy === 'ALLOWED'} onClick={() => setTerm('petPolicy', 'ALLOWED')} />
              <RadioPillButton label="Not Allowed" on={terms.petPolicy === 'NOT_ALLOWED'} onClick={() => setTerm('petPolicy', 'NOT_ALLOWED')} />
            </div>
            {terms.petPolicy === 'ALLOWED' && (
              <div style={{ ...LS.grid2, marginBottom: 16 }}>
                <div style={LS.field}>
                  <span style={LS.lbl}>Pet Deposit</span>
                  <input style={LS.inp} placeholder="$ 0.00" value={terms.petDeposit} onChange={e => setTerm('petDeposit', e.target.value)} />
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>Pet Rent (monthly)</span>
                  <input style={LS.inp} placeholder="$ 0.00" value={terms.petRent} onChange={e => setTerm('petRent', e.target.value)} />
                </div>
              </div>
            )}

            <div style={LS.hr} />

            <span style={LS.ckGroupLbl}>Utilities Included in Rent</span>
            <div style={{ ...LS.ckRow, marginBottom: 16 }}>
              {UTILITY_KEYS.map(u => (
                <div key={u.key} style={LS.ckItem}>
                  <Checkbox checked={terms.utilitiesIncluded[u.key]} onChange={() => toggleUtility('utilitiesIncluded', u.key)} />
                  <span style={LS.cktext}>{u.label}</span>
                </div>
              ))}
            </div>

            <span style={LS.ckGroupLbl}>Utilities Paid by Tenant</span>
            <div style={{ ...LS.ckRow, marginBottom: 16 }}>
              {UTILITY_KEYS.map(u => (
                <div key={u.key} style={LS.ckItem}>
                  <Checkbox checked={terms.utilitiesTenantPaid[u.key]} onChange={() => toggleUtility('utilitiesTenantPaid', u.key)} />
                  <span style={LS.cktext}>{u.label}</span>
                </div>
              ))}
            </div>

            <div style={{ ...LS.ckItem, marginBottom: 16 }}>
              <Checkbox checked={terms.smokingAllowed} onChange={() => setTerm('smokingAllowed', !terms.smokingAllowed)} />
              <span style={{ ...LS.cktext, fontWeight: 550, color: C.txtPrimary }}>Smoking Allowed</span>
            </div>

            <div style={LS.hr} />

            <span style={LS.ckGroupLbl}>Parking Fee</span>
            <div style={{ ...LS.radiopill, marginBottom: 14 }}>
              <RadioPillButton label="Yes" on={terms.parkingFeeEnabled} onClick={() => setTerm('parkingFeeEnabled', true)} />
              <RadioPillButton label="No" on={!terms.parkingFeeEnabled} onClick={() => setTerm('parkingFeeEnabled', false)} />
            </div>
            {terms.parkingFeeEnabled && (
              <div style={{ ...LS.grid2, marginBottom: 16 }}>
                <div style={LS.field}>
                  <span style={LS.lbl}>Fee Type</span>
                  <DropdownOrCustom
                    value={terms.parkingFeeType}
                    onChange={v => setTerm('parkingFeeType', v)}
                    options={parkingFeeTypeOptions}
                    customPlaceholder="Enter fee type"
                  />
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>Amount</span>
                  <input style={LS.inp} placeholder="$ 0.00" value={terms.parkingFeeAmount} onChange={e => setTerm('parkingFeeAmount', e.target.value)} />
                </div>
              </div>
            )}

            <span style={LS.ckGroupLbl}>Other Fees</span>
            <div style={{ ...LS.radiopill, marginBottom: 14 }}>
              <RadioPillButton label="Yes" on={terms.otherFeesEnabled} onClick={() => setTerm('otherFeesEnabled', true)} />
              <RadioPillButton label="No" on={!terms.otherFeesEnabled} onClick={() => setTerm('otherFeesEnabled', false)} />
            </div>
            {terms.otherFeesEnabled && (
              <>
                {terms.otherFees.map((fee, idx) => (
                  <div key={idx} style={{ ...LS.grid2, marginBottom: 8 }}>
                    <div style={LS.field}>
                      <span style={LS.lbl}>Fee Type</span>
                      <DropdownOrCustom
                        value={fee.type}
                        onChange={v => updateOtherFee(idx, 'type', v)}
                        options={otherFeeTypeOptions}
                        customPlaceholder="Enter fee type"
                      />
                    </div>
                    <div style={LS.field}>
                      <span style={LS.lbl}>Amount</span>
                      <input style={LS.inp} placeholder="$ 0.00" value={fee.amount} onChange={e => updateOtherFee(idx, 'amount', e.target.value)} />
                    </div>
                  </div>
                ))}
                <span style={{ ...LS.addLink, marginBottom: 16, marginTop: 4 }} onClick={addOtherFee}>+ Add Fees</span>
              </>
            )}

            <div style={LS.hr} />

            <div style={LS.grid2}>
              <div style={LS.field}>
                <span style={LS.lbl}>Rent Concession</span>
                <input style={LS.inp} value={terms.rentConcession} onChange={e => setTerm('rentConcession', e.target.value)} />
              </div>
              <div style={LS.field}>
                <span style={LS.lbl}>Concession Amount</span>
                <input style={LS.inp} placeholder="$ 0.00" value={terms.concessionAmount} onChange={e => setTerm('concessionAmount', e.target.value)} />
              </div>
            </div>
          </div>
          )}

          {/* Sales Terms (listingType === 'SALE') */}
          {listingType === 'SALE' && (
          <div style={LS.card}>
            <SectionHead
              icon="ti-cash"
              bg={C.blueLight}
              color={C.blue}
              title="Sales Terms"
              note="Shown because Listing Type = Sell"
            />

            <div style={{ ...LS.grid2, marginBottom: 16 }}>
              <div style={LS.field}>
                <span style={LS.lbl}>Asking Price *</span>
                <input style={LS.inp} placeholder="$ 0.00" value={saleTerms.askingPrice} onChange={e => setSaleTerm('askingPrice', e.target.value)} />
              </div>
              <div style={LS.field}>
                <span style={LS.lbl}>Available Date *</span>
                <input type="date" style={LS.inp} value={saleTerms.availableDate} onChange={e => setSaleTerm('availableDate', e.target.value)} />
              </div>
              <div style={LS.field}>
                <span style={LS.lbl}>Property Tax</span>
                <input style={LS.inp} placeholder="$ 0.00" value={saleTerms.propertyTax} onChange={e => setSaleTerm('propertyTax', e.target.value)} />
              </div>
              <div style={LS.field}>
                <span style={LS.lbl}>HOA</span>
                <div style={LS.radiopill}>
                  <RadioPillButton label="Yes" on={saleTerms.hoaEnabled} onClick={() => setSaleTerm('hoaEnabled', true)} />
                  <RadioPillButton label="No" on={!saleTerms.hoaEnabled} onClick={() => setSaleTerm('hoaEnabled', false)} />
                </div>
              </div>
              {saleTerms.hoaEnabled && (
                <>
                  <div style={LS.field}>
                    <span style={LS.lbl}>HOA Fee</span>
                    <input style={LS.inp} placeholder="$ 0.00" value={saleTerms.hoaFee} onChange={e => setSaleTerm('hoaFee', e.target.value)} />
                  </div>
                  <div style={LS.field}>
                    <span style={LS.lbl}>HOA Fee Frequency</span>
                    <select style={LS.inp} value={saleTerms.hoaFeeFrequency} onChange={e => setSaleTerm('hoaFeeFrequency', e.target.value)}>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Semi-Annually</option>
                      <option>Annually</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div style={LS.hr} />

            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Showing Instructions</span>
              <input style={LS.inp} placeholder="e.g. Call agent before showing" value={saleTerms.showingInstructions} onChange={e => setSaleTerm('showingInstructions', e.target.value)} />
            </div>
            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Possession Terms</span>
              <input style={LS.inp} placeholder="e.g. Negotiable / Close of escrow" value={saleTerms.possessionTerms} onChange={e => setSaleTerm('possessionTerms', e.target.value)} />
            </div>

            <span style={LS.ckGroupLbl}>Seller Financing</span>
            <div style={{ ...LS.radiopill, marginBottom: 16 }}>
              <RadioPillButton label="Yes" on={saleTerms.sellerFinancingEnabled} onClick={() => setSaleTerm('sellerFinancingEnabled', true)} />
              <RadioPillButton label="No" on={!saleTerms.sellerFinancingEnabled} onClick={() => setSaleTerm('sellerFinancingEnabled', false)} />
            </div>

            <div style={LS.hr} />

            <div style={{ ...LS.field, ...LS.fieldFull }}>
              <span style={LS.lbl}>Other Sale Terms</span>
              <textarea
                style={LS.txtarea}
                placeholder="Add any other sale terms…"
                value={saleTerms.otherSaleTerms}
                onChange={e => setSaleTerm('otherSaleTerms', e.target.value)}
              />
            </div>
          </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={LS.splitCol}>

          {/* Listing Basics */}
          <div style={LS.card}>
            <SectionHead icon="ti-file-text" bg={C.greenLight} color={C.green} title="Listing Basics" />

            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <div style={LS.lblRow}>
                <span style={{ ...LS.lbl, marginBottom: 0 }}>Listing Title</span>
                <AiAssistButton />
              </div>
              <input style={LS.inp} placeholder="e.g. Stunning 2BR with City Views" value={basics.title} onChange={e => setBasic('title', e.target.value)} />
            </div>

            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <div style={LS.lblRow}>
                <span style={{ ...LS.lbl, marginBottom: 0 }}>Listing Description</span>
                <AiAssistButton />
              </div>
              <textarea
                style={LS.txtarea}
                placeholder="Craft a compelling description for prospective tenants…"
                value={basics.description}
                onChange={e => setBasic('description', e.target.value)}
              />
            </div>

            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Listing Highlights</span>
              <div style={LS.chiprow}>
                {basics.highlights.map((h, i) => (
                  <div key={i} style={LS.chip}>
                    {h}
                    <i className="ti ti-x" style={{ fontSize: 10, cursor: 'pointer' }} onClick={() => removeHighlight(i)} aria-hidden="true" />
                  </div>
                ))}
                <input
                  style={{ ...LS.chipPh, border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 90, fontSize: 12.5, fontFamily: 'inherit' }}
                  placeholder="Add highlight…"
                  value={highlightDraft}
                  onChange={e => setHighlightDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }}
                />
              </div>
            </div>

            <div style={{ ...LS.field, ...LS.fieldFull }}>
              <span style={LS.lbl}>Available Date</span>
              <input type="date" style={LS.inp} value={basics.availableDate} onChange={e => setBasic('availableDate', e.target.value)} />
            </div>
          </div>

          {/* Photos & Media */}
          <div style={LS.card}>
            <SectionHead icon="ti-photo" bg={C.amberLight} color={C.amber} title="Photos & Media" />

            <div style={LS.lblRow}>
              <span style={{ ...LS.lbl, marginBottom: 0 }}>Existing Photos</span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: C.txtMuted, textTransform: 'none', letterSpacing: 0 }}>Select to include</span>
            </div>
            <div style={{ ...LS.photoGrid, marginTop: 10, marginBottom: 16 }}>
              {photos.map(p => (
                <div
                  key={p.id}
                  style={{
                    ...LS.photoTile(p.selected),
                    ...(p.url ? { background: `url(${p.url}) center/cover` } : {}),
                  }}
                  onClick={() => togglePhoto(p.id)}
                >
                  {!p.url && <i className="ti ti-photo" style={{ fontSize: 22, color: 'rgba(255,255,255,0.75)' }} aria-hidden="true" />}
                  {p.selected && (
                    <div style={LS.photoCheck}><i className="ti ti-check" style={{ fontSize: 9, color: '#fff' }} aria-hidden="true" /></div>
                  )}
                </div>
              ))}
              {photos.length === 0 && (
                <div style={{ fontSize: 12, color: C.txtMuted, gridColumn: '1 / -1' }}>No unit photos uploaded yet.</div>
              )}
              <div style={{ ...LS.uploadTile, opacity: 0.55, cursor: 'not-allowed' }} title="Uploading a new photo isn't available yet — coming soon">
                <i className="ti ti-plus" style={{ fontSize: 18 }} aria-hidden="true" />Upload New
              </div>
            </div>
            <p style={{ ...LS.hint, marginTop: -10, marginBottom: 16 }}>Uploading new photo files isn't wired to the backend yet — the tiles above select from photos already on the Unit record</p>

            <span style={{ ...LS.lbl, marginBottom: 10 }}>Videos</span>
            <div style={{ ...LS.videoGrid, marginTop: 10, marginBottom: 16 }}>
              <div style={LS.videoThumb}><i className="ti ti-player-play" style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)' }} aria-hidden="true" /></div>
              <div style={{ ...LS.uploadTile, opacity: 0.55, cursor: 'not-allowed' }} title="Uploading a new video isn't available yet — coming soon">
                <i className="ti ti-plus" style={{ fontSize: 18 }} aria-hidden="true" />Upload New
              </div>
            </div>

            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Video URL</span>
              <input style={LS.inp} placeholder="YouTube or Vimeo link" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
            </div>
            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Virtual Tour URL</span>
              <input style={LS.inp} placeholder="Matterport or similar link" value={virtualTourUrl} onChange={e => setVirtualTourUrl(e.target.value)} />
            </div>

            <span style={{ ...LS.lbl, marginBottom: 10 }}>Floor Plan Image</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ ...LS.photoTile(false), width: 90, flexShrink: 0 }}>
                <i className="ti ti-layout-2" style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)' }} aria-hidden="true" />
              </div>
              <div style={{ ...LS.uploadTile, width: 90, flexShrink: 0, opacity: 0.55, cursor: 'not-allowed' }} title="Uploading a floor plan image isn't available yet — coming soon">
                <i className="ti ti-plus" style={{ fontSize: 18 }} aria-hidden="true" />Upload
              </div>
            </div>
            <p style={LS.hint}>Separate from the Floor Plan Name field — image upload isn't wired to the backend yet</p>
          </div>
        </div>
      </div>
    </ListingPageShell>
  );
}
