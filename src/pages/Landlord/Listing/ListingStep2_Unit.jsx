// src/pages/Landlord/Listing/ListingStep2_Unit.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Create Listing wizard — Step 2: Unit (Rent + Sale)
//
// Wired to the real `listings` + `properties` backend (Session 42 build,
// Session 43 FE wiring). Rental Terms / Sales Terms, Listing Basics, unit
// amenities and photo selection all round-trip through listingApi.js now.
//
// Two real-backend adaptations worth knowing about, both surfaced while
// wiring this file:
//  - The real Unit model has no `furnished`/`parking`/`parking_spaces`/
//    `balcony` fields (the old mock invented them), so the Unit Information
//    card only shows fields the backend actually has, plus Lease Type in
//    their place.
//  - `terms.utilitiesIncluded` / `utilitiesTenantPaid` render as the same
//    per-utility checkboxes as before, but the backend stores each as a
//    plain list of upper-case keys (`ListingRentalTerms.utilities_included`
//    JSONField), not an object of booleans — converted at the load/save
//    boundary only, so the JSX below is unchanged.
//
// 2026-11-23 — REDESIGNED on Design System v2 (design: Downloads/image 93.png). Same frame as Step 1
// (listingWizardV2.jsx: wave backdrop · breadcrumb · Create Listing header · stepper). ALL data loading, saving
// and navigation is unchanged:
//   <Grid wideLeft>
//     left : Unit Information (ReadFields from the Unit record · Floor Plan Name input + NEW tag)
//            Amenity(s) (ChoiceTile grid · "also update the unit record")
//            Rental Terms (Rent) | Sales Terms (Sell) — fields · RadioPills · utility Checkboxes · fees · concession
//     right: Listing Basics (title · description · highlights · available date)
//            Photos & Media (existing photos to include · uploads (not wired yet) · video / tour URLs · floor plan)
//   WizardFooter (sticky: Step 2 of 4 · error note · Back · Save & Exit · Continue)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Grid } from '../../../components/layout';
import {
  SectionCard, CornerArt, FormField, ReadField, SelectField, FIELD2,
  Checkbox, RadioPill, ChoiceTile, WizardFooter, TextLink,
} from '../../../components/ui';
import { C2, TONES2, FS2, SP2, SZ2, R2, SH2, UI2 } from '../../../constants';
import { STEPS } from './listingWizardShared';
import { WizardPage, AiAssist, ChipInput, WZ } from './listingWizardV2';
import {
  getUnit, patchUnit, getAmenityCatalog,
  getListing, patchListing,
  getListingAmenities, saveListingAmenities,
  getRentalTerms, patchRentalTerms,
  getSaleTerms, patchSaleTerms,
  getListingMedia, saveListingMedia,
  getListingDropdownOptions,
} from './listingApi';

const UTILITY_KEYS = [
  { key: 'water', label: 'Water' },
  { key: 'trash', label: 'Trash' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'gas', label: 'Gas' },
  { key: 'internet', label: 'Internet' },
];

const HOA_FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'].map(v => ({ value: v, label: v }));

// ── Page-specific layout (tokens only) ──────────────────────────────────────
const S = {
  newTag:    { ...UI2.pill(TONES2.primary) },
  pair:      { columnGap: SP2.lg, rowGap: SP2.lg },                        // <Grid two> of side-by-side groups
  // Photos & Media
  labelRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP2.sm, marginBottom: SP2.sm },
  subtle:    { ...UI2.text.label },
  tiles:     { gap: SP2.sm },
  photo:     (on, url) => ({
    ...UI2.photoTile, aspectRatio: `${SZ2.thumb.w} / ${SZ2.thumb.h}`, width: '100%', padding: 0, border: 'none', cursor: 'pointer',
    ...UI2.center, borderRadius: R2.lg,
    ...(url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
    boxShadow: on ? SH2.controlHover : UI2.photoTile.boxShadow,   // selected = raised (our hover-lift shadow, visible on the white card) + blue ✓ badge, no ring
  }),
  photoIcon: { fontSize: FS2.xxl, color: C2.textSecondary },
  photoCheck:{ ...UI2.checkBadge, position: 'absolute', top: SP2.sm, right: SP2.sm },   // standard selected-tick badge (UI2.checkBadge)
  upload:    { ...UI2.addTile(false), aspectRatio: `${SZ2.thumb.w} / ${SZ2.thumb.h}`, height: 'auto', opacity: 0.6, cursor: 'not-allowed', borderRadius: R2.lg },
  video:     { ...UI2.photoTile, ...UI2.center, aspectRatio: `${SZ2.thumb.w} / ${SZ2.thumb.h}`, borderRadius: R2.lg, background: C2.navyDeep, color: C2.white, fontSize: FS2.xxl },
  plan:      { ...UI2.photoTile, ...UI2.center, aspectRatio: `${SZ2.thumb.w} / ${SZ2.thumb.h}`, borderRadius: R2.lg, color: C2.textSecondary, fontSize: FS2.xxl },
  mediaGap:  { marginTop: SP2.lg },
};

// Dropdown with a "Custom…" escape hatch — the backend fields are freeform strings, so a stored value that
// isn't one of the fetched option codes is never silently dropped (same behaviour as before, v2 SelectField).
function DropdownOrCustom({ value, onChange, options, placeholder = 'Select…', customPlaceholder = 'Enter custom value', type = 'text', label }) {
  const optionValues = options.map(o => o.value);
  const isCustom = !!value && !optionValues.includes(value);
  const [customMode, setCustomMode] = useState(isCustom);
  useEffect(() => { if (!isCustom) setCustomMode(false); }, [isCustom]);

  const ddOptions = [...options, { value: '__custom__', label: 'Custom…' }];

  return (
    <>
      <SelectField
        label={label}
        options={ddOptions}
        value={customMode ? '__custom__' : value}
        placeholder={placeholder}
        onChange={v => {
          if (v === '__custom__') { setCustomMode(true); onChange(''); }
          else { setCustomMode(false); onChange(v ?? ''); }
        }}
      />
      {customMode && (
        <input
          className="un2-focus-ring"
          style={FIELD2.input}
          type={type}
          placeholder={customPlaceholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label={customPlaceholder}
        />
      )}
    </>
  );
}

// money / text input in the standard field box
function Field({ value, onChange, placeholder, type = 'text', label }) {
  return (
    <input className="un2-focus-ring" style={FIELD2.input} type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)} aria-label={label || placeholder} />
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

export default function ListingStep2_Unit() {
  const { id: propId, uid: unitId } = useParams();
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
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-1`, { replace: true });
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
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-1`, { state: { listingId } });
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
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}`);
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
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-3`, { state: { listingId, propertyName } });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  const unitLabel = unit ? `Unit ${unit.unit_number}` : `Unit ${unitId}`;
  const shell = (children) => (
    <WizardPage propertyName={propertyName || 'Property'} unitLabel={unitLabel} current={2}>{children}</WizardPage>
  );

  if (loading) {
    return shell(<div style={WZ.stateBox}>Loading unit…</div>);
  }

  if (loadError || !unit) {
    return shell(
      <div style={WZ.stateBox}>
        <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {loadError || 'This unit could not be loaded.'}</div>
      </div>
    );
  }

  // [label, value, trailing icon]
  const unitInfoFields = [
    ['Unit Number', unit.unit_number],
    ['Unit Type', unit.unit_type, 'ti-chevron-down'],
    ['Square Footage', unit.total_area ? `${unit.total_area} sq ft` : null],
    ['Carpet Area', unit.carpet_area ? `${unit.carpet_area} sq ft` : null],
    ['Bedrooms', unit.total_rooms, 'ti-chevron-down'],
    ['Bathrooms', unit.total_baths, 'ti-chevron-down'],
    ['Floor', unit.floor, 'ti-chevron-down'],
    ['Lease Type', unit.lease_type, 'ti-chevron-down'],
  ];

  const utilityGroup = (group, title) => (
    <div>
      <span style={WZ.group}>{title}</span>
      <div style={WZ.checks}>
        {UTILITY_KEYS.map(u => (
          <Checkbox key={u.key} checked={terms[group][u.key]} onChange={() => toggleUtility(group, u.key)} label={u.label} />
        ))}
      </div>
    </div>
  );

  return shell(
    <>
      <Grid layout="wideLeft">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={WZ.col}>

          {/* Unit Information */}
          <SectionCard
            icon="ti-bed"
            title="Unit Information"
            subtitle="Pulled from the Unit record — edits here apply to this listing only."
            pattern={false}
            decoration={<CornerArt />}
          >
            <Grid layout="two" as="div" style={{ ...WZ.fields, ...WZ.body }}>
              {unitInfoFields.map(([label, value, icon]) => (
                <FormField key={label} label={label}><ReadField value={value} icon={icon} /></FormField>
              ))}
              <FormField full label="Floor Plan Name" action={<span style={S.newTag}>NEW</span>}>
                <Field value={floorPlanName} onChange={setFloorPlanName} label="Floor plan name" />
                <p style={WZ.hint}>Groups this unit under "{floorPlanName || 'this floor plan'}" when part of a Multi-Unit listing.</p>
              </FormField>
            </Grid>
          </SectionCard>

          {/* Amenity(s) */}
          <SectionCard
            icon="ti-sofa"
            tone={TONES2.primary}
            title="Amenity(s)"
            subtitle="Sourced from the UN Reference amenity list — not free text."
            pattern={false}
            decoration={<CornerArt />}
          >
            <div style={WZ.body}>
              {amenities.length === 0 ? (
                <div style={UI2.emptyInline}>No unit amenities configured yet.</div>
              ) : (
                <Grid layout="three" as="div" style={WZ.tiles}>
                  {amenities.map(a => (
                    <ChoiceTile key={a.id} icon={a.icon} label={a.name} selected={a.selected} onClick={() => toggleAmenity(a.id)} />
                  ))}
                </Grid>
              )}
              <div style={WZ.rule} />
              <Checkbox
                strong
                checked={syncAmenitiesToUnit}
                onChange={() => setSyncAmenitiesToUnit(v => !v)}
                label="Also update the unit record"
                hint="Syncs these amenity selections back to the unit's saved amenity list — otherwise this only affects the listing."
              />
            </div>
          </SectionCard>

          {/* Rental Terms (listingType === 'RENT') */}
          {listingType === 'RENT' && (
            <SectionCard
              icon="ti-cash"
              title="Rental Terms"
              subtitle="Shown because Listing Type = Rent."
              pattern={false}
              decoration={<CornerArt />}
            >
              <div style={WZ.body}>
                <Grid layout="two" as="div" style={WZ.fields}>
                  <FormField label="Monthly Rent"><Field placeholder="0.00" value={terms.monthlyRent} onChange={v => setTerm('monthlyRent', v)} label="Monthly rent" /></FormField>
                  <FormField label="Security Deposit"><Field placeholder="0.00" value={terms.securityDeposit} onChange={v => setTerm('securityDeposit', v)} label="Security deposit" /></FormField>
                  <FormField label="Lease Term (months)">
                    <DropdownOrCustom
                      label="Lease term (months)"
                      value={terms.leaseTermMonths}
                      onChange={v => setTerm('leaseTermMonths', v)}
                      options={leaseTermOptions}
                      customPlaceholder="Enter number of months"
                      type="number"
                    />
                  </FormField>
                  <FormField label="Application Fee"><Field placeholder="$ 0.00" value={terms.applicationFee} onChange={v => setTerm('applicationFee', v)} label="Application fee" /></FormField>
                </Grid>

                <div style={WZ.rule} />

                <span style={WZ.group}>Pet Policy</span>
                <div style={WZ.radios} role="radiogroup" aria-label="Pet policy">
                  <RadioPill label="Allowed" on={terms.petPolicy === 'ALLOWED'} onClick={() => setTerm('petPolicy', 'ALLOWED')} />
                  <RadioPill label="Not Allowed" on={terms.petPolicy === 'NOT_ALLOWED'} onClick={() => setTerm('petPolicy', 'NOT_ALLOWED')} />
                </div>
                {terms.petPolicy === 'ALLOWED' && (
                  <Grid layout="two" as="div" style={{ ...WZ.fields, ...WZ.body }}>
                    <FormField label="Pet Deposit"><Field placeholder="$ 0.00" value={terms.petDeposit} onChange={v => setTerm('petDeposit', v)} label="Pet deposit" /></FormField>
                    <FormField label="Pet Rent (monthly)"><Field placeholder="$ 0.00" value={terms.petRent} onChange={v => setTerm('petRent', v)} label="Pet rent (monthly)" /></FormField>
                  </Grid>
                )}

                <div style={WZ.rule} />

                <div style={UI2.stack(SP2.lg)}>
                  {utilityGroup('utilitiesIncluded', 'Utilities Included in Rent')}
                  {utilityGroup('utilitiesTenantPaid', 'Utilities Paid by Tenant')}
                  <Checkbox strong checked={terms.smokingAllowed} onChange={() => setTerm('smokingAllowed', !terms.smokingAllowed)} label="Smoking Allowed" />
                </div>

                <div style={WZ.rule} />

                <Grid layout="two" as="div" style={S.pair}>
                  {/* Parking Fee */}
                  <div>
                    <span style={WZ.group}>Parking Fee</span>
                    <div style={WZ.radios} role="radiogroup" aria-label="Parking fee">
                      <RadioPill label="Yes" on={terms.parkingFeeEnabled} onClick={() => setTerm('parkingFeeEnabled', true)} />
                      <RadioPill label="No" on={!terms.parkingFeeEnabled} onClick={() => setTerm('parkingFeeEnabled', false)} />
                    </div>
                    {terms.parkingFeeEnabled && (
                      <div style={{ ...UI2.stack(SP2.lg), ...WZ.body }}>
                        <FormField label="Fee Type">
                          <DropdownOrCustom label="Parking fee type" value={terms.parkingFeeType} onChange={v => setTerm('parkingFeeType', v)} options={parkingFeeTypeOptions} customPlaceholder="Enter fee type" />
                        </FormField>
                        <FormField label="Amount"><Field placeholder="$ 0.00" value={terms.parkingFeeAmount} onChange={v => setTerm('parkingFeeAmount', v)} label="Parking fee amount" /></FormField>
                      </div>
                    )}
                  </div>

                  {/* Other Fees */}
                  <div>
                    <span style={WZ.group}>Other Fees</span>
                    <div style={WZ.radios} role="radiogroup" aria-label="Other fees">
                      <RadioPill label="Yes" on={terms.otherFeesEnabled} onClick={() => setTerm('otherFeesEnabled', true)} />
                      <RadioPill label="No" on={!terms.otherFeesEnabled} onClick={() => setTerm('otherFeesEnabled', false)} />
                    </div>
                    {terms.otherFeesEnabled && (
                      <div style={{ ...UI2.stack(SP2.lg), ...WZ.body }}>
                        {terms.otherFees.map((fee, idx) => (
                          <div key={idx} style={UI2.stack(SP2.sm)}>
                            <FormField label="Fee Type">
                              <DropdownOrCustom label="Other fee type" value={fee.type} onChange={v => updateOtherFee(idx, 'type', v)} options={otherFeeTypeOptions} customPlaceholder="Enter fee type" />
                            </FormField>
                            <FormField label="Amount"><Field placeholder="$ 0.00" value={fee.amount} onChange={v => updateOtherFee(idx, 'amount', v)} label="Other fee amount" /></FormField>
                          </div>
                        ))}
                        <TextLink arrow={false} onClick={addOtherFee}>+ Add Fees</TextLink>
                      </div>
                    )}
                  </div>
                </Grid>

                <div style={WZ.rule} />

                <Grid layout="two" as="div" style={WZ.fields}>
                  <FormField label="Rent Concession"><Field value={terms.rentConcession} onChange={v => setTerm('rentConcession', v)} label="Rent concession" /></FormField>
                  <FormField label="Concession Amount"><Field placeholder="$ 0.00" value={terms.concessionAmount} onChange={v => setTerm('concessionAmount', v)} label="Concession amount" /></FormField>
                </Grid>
              </div>
            </SectionCard>
          )}

          {/* Sales Terms (listingType === 'SALE') */}
          {listingType === 'SALE' && (
            <SectionCard
              icon="ti-cash"
              title="Sales Terms"
              subtitle="Shown because Listing Type = Sell."
              pattern={false}
              decoration={<CornerArt />}
            >
              <div style={WZ.body}>
                <Grid layout="two" as="div" style={WZ.fields}>
                  <FormField label="Asking Price *"><Field placeholder="$ 0.00" value={saleTerms.askingPrice} onChange={v => setSaleTerm('askingPrice', v)} label="Asking price" /></FormField>
                  <FormField label="Available Date *"><Field type="date" value={saleTerms.availableDate} onChange={v => setSaleTerm('availableDate', v)} label="Available date" /></FormField>
                  <FormField label="Property Tax"><Field placeholder="$ 0.00" value={saleTerms.propertyTax} onChange={v => setSaleTerm('propertyTax', v)} label="Property tax" /></FormField>
                  <FormField label="HOA">
                    <div style={WZ.radios} role="radiogroup" aria-label="HOA">
                      <RadioPill label="Yes" on={saleTerms.hoaEnabled} onClick={() => setSaleTerm('hoaEnabled', true)} />
                      <RadioPill label="No" on={!saleTerms.hoaEnabled} onClick={() => setSaleTerm('hoaEnabled', false)} />
                    </div>
                  </FormField>
                  {saleTerms.hoaEnabled && (
                    <>
                      <FormField label="HOA Fee"><Field placeholder="$ 0.00" value={saleTerms.hoaFee} onChange={v => setSaleTerm('hoaFee', v)} label="HOA fee" /></FormField>
                      <FormField label="HOA Fee Frequency">
                        <SelectField label="HOA fee frequency" options={HOA_FREQUENCIES} value={saleTerms.hoaFeeFrequency} onChange={v => setSaleTerm('hoaFeeFrequency', v || 'Monthly')} />
                      </FormField>
                    </>
                  )}
                </Grid>

                <div style={WZ.rule} />

                <div style={UI2.stack(SP2.lg)}>
                  <FormField label="Showing Instructions"><Field placeholder="e.g. Call agent before showing" value={saleTerms.showingInstructions} onChange={v => setSaleTerm('showingInstructions', v)} label="Showing instructions" /></FormField>
                  <FormField label="Possession Terms"><Field placeholder="e.g. Negotiable / Close of escrow" value={saleTerms.possessionTerms} onChange={v => setSaleTerm('possessionTerms', v)} label="Possession terms" /></FormField>
                  <div>
                    <span style={WZ.group}>Seller Financing</span>
                    <div style={WZ.radios} role="radiogroup" aria-label="Seller financing">
                      <RadioPill label="Yes" on={saleTerms.sellerFinancingEnabled} onClick={() => setSaleTerm('sellerFinancingEnabled', true)} />
                      <RadioPill label="No" on={!saleTerms.sellerFinancingEnabled} onClick={() => setSaleTerm('sellerFinancingEnabled', false)} />
                    </div>
                  </div>
                </div>

                <div style={WZ.rule} />

                <FormField label="Other Sale Terms">
                  <textarea
                    className="un2-focus-ring"
                    style={FIELD2.textarea}
                    placeholder="Add any other sale terms…"
                    value={saleTerms.otherSaleTerms}
                    onChange={e => setSaleTerm('otherSaleTerms', e.target.value)}
                    aria-label="Other sale terms"
                  />
                </FormField>
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={WZ.col}>

          {/* Listing Basics */}
          <SectionCard icon="ti-file-text" title="Listing Basics" pattern={false}>
            <div style={{ ...UI2.stack(SP2.lg), ...WZ.body }}>
              <FormField label="Listing Title" action={<AiAssist />}>
                <Field placeholder="e.g. Stunning 2BR with City Views" value={basics.title} onChange={v => setBasic('title', v)} label="Listing title" />
              </FormField>
              <FormField label="Listing Description" action={<AiAssist />}>
                <textarea
                  className="un2-focus-ring"
                  style={FIELD2.textarea}
                  placeholder="Craft a compelling description for prospective tenants…"
                  value={basics.description}
                  onChange={e => setBasic('description', e.target.value)}
                  aria-label="Listing description"
                />
              </FormField>
              <FormField label="Listing Highlights">
                <ChipInput
                  items={basics.highlights}
                  draft={highlightDraft}
                  onDraft={setHighlightDraft}
                  onAdd={addHighlight}
                  onRemove={removeHighlight}
                  placeholder="Add highlight…"
                />
              </FormField>
              <FormField label="Available Date">
                <Field type="date" value={basics.availableDate} onChange={v => setBasic('availableDate', v)} label="Available date" />
              </FormField>
            </div>
          </SectionCard>

          {/* Photos & Media */}
          <SectionCard icon="ti-photo" title="Photos & Media" pattern={false}>
            <div style={WZ.body}>
              <div style={S.labelRow}>
                <span style={UI2.capsLabel}>Existing Photos</span>
                <span style={S.subtle}>Select to include</span>
              </div>
              <Grid layout="three" as="div" style={S.tiles}>
                {photos.map(p => (
                  <button key={p.id} type="button" style={S.photo(p.selected, p.url)} onClick={() => togglePhoto(p.id)}
                    role="checkbox" aria-checked={p.selected} aria-label="Include this photo">
                    {!p.url && <i className="ti ti-photo" style={S.photoIcon} aria-hidden="true" />}
                    {p.selected && <span style={S.photoCheck}><i className="ti ti-check" aria-hidden="true" /></span>}
                  </button>
                ))}
                <div style={S.upload} title="Uploading a new photo isn't available yet — coming soon" aria-disabled="true">
                  <i className="ti ti-plus" style={UI2.addTileIcon} aria-hidden="true" />Upload New
                </div>
              </Grid>
              {photos.length === 0 && <div style={UI2.emptyInline}>No unit photos uploaded yet.</div>}
              <p style={WZ.hint}>Uploading new photo files isn't wired to the backend yet — the tiles above select from photos already on the Unit record.</p>

              <div style={S.mediaGap}>
                <span style={WZ.group}>Videos</span>
                <Grid layout="three" as="div" style={S.tiles}>
                  <div style={S.video} aria-hidden="true"><i className="ti ti-player-play" /></div>
                  <div style={S.upload} title="Uploading a new video isn't available yet — coming soon" aria-disabled="true">
                    <i className="ti ti-plus" style={UI2.addTileIcon} aria-hidden="true" />Upload New
                  </div>
                </Grid>
              </div>

              <div style={{ ...UI2.stack(SP2.lg), ...S.mediaGap }}>
                <FormField label="Video URL"><Field placeholder="YouTube or Vimeo link" value={videoUrl} onChange={setVideoUrl} label="Video URL" /></FormField>
                <FormField label="Virtual Tour URL"><Field placeholder="Matterport or similar link" value={virtualTourUrl} onChange={setVirtualTourUrl} label="Virtual tour URL" /></FormField>
              </div>

              <div style={S.mediaGap}>
                <span style={WZ.group}>Floor Plan Image</span>
                <Grid layout="three" as="div" style={S.tiles}>
                  <div style={S.plan} aria-hidden="true"><i className="ti ti-layout-2" /></div>
                  <div style={S.upload} title="Uploading a floor plan image isn't available yet — coming soon" aria-disabled="true">
                    <i className="ti ti-plus" style={UI2.addTileIcon} aria-hidden="true" />Upload
                  </div>
                </Grid>
                <p style={WZ.hint}>Separate from the Floor Plan Name field — image upload isn't wired to the backend yet.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </Grid>

      <WizardFooter
        step={2}
        total={STEPS.length}
        note={saveError || undefined}
        onBack={handleBack}
        onSaveExit={handleSaveExit}
        onContinue={handleContinue}
        busy={saving}
      />
    </>
  );
}
