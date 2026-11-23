// src/pages/Landlord/Listing/ListingStep1_Property.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Create Listing wizard — Step 1: Property
//
// Entry point: LandlordUnitDetailPage → "List on Marketplace" button
// (UrbanNest_Listing_Architecture.md §2).
//
// Wired to the real `listings` backend (Session 42 build + curl testing,
// Session 43 FE wiring — see listingApi.js). A Listing row doesn't exist
// yet the first time a landlord reaches this page, so nothing is created
// until "Continue" — at that point this step POSTs the real Listing (unit +
// listing_type), then saves amenities + neighborhood info against it.
// Coming back here later (Back from Step 2, or re-opening a Draft) carries
// `listingId` forward via router state and this step re-fetches and PATCHes
// the same row instead of creating a second one.
//
// Two real backend gaps surfaced while wiring this: the Property model has
// no `neighborhood` text field (the closest real field is `landmark`, used
// here for that display slot) and no AI-populated schools/restaurants/
// transportation data exists yet — those POI lists come from
// ListingNeighborhoodInfo, which starts empty for a new listing rather than
// the old mock's canned examples.
//
// 2026-11-23 — REDESIGNED on Design System v2 (design: Downloads/image 78.png). Layout from the design,
// every style from v2 tokens / shared v2 components; ALL data loading, saving and navigation is unchanged:
//   PageShell (+ ImageBackdrop — Downloads/image 86.png waves) · Breadcrumb · DetailHeader (Create Listing · subtitle │ Listing Status pill)
//   Stepper (Property · Unit · Promote · Publish)
//   <Grid wideLeft>
//     left : (both cards carry the wave art in their top-right corner — CornerArt, like the design)
//            Property Information (ReadFields from the Property record · description + AI Assist + "also update")
//            Amenity(s) (ChoiceTile grid · "also update the property record")
//     right: Listing Type (RadioPill Rent / Sell) · Location & Marketing (Switch · neighbourhood · MapPreview ·
//            area chips) · Schools, Restaurants & Transportation (POI groups · landmarks · website URL)
//   WizardFooter (sticky: Step 1 of 4 · error note · Save & Exit · Continue)
// Steps 2–4 still use the old listingWizardShared styles (not touched).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Grid } from '../../../components/layout';
import {
  SectionCard, CornerArt, FormField, ReadField, FIELD2,
  Switch, Checkbox, RadioPill, ChoiceTile, MapPreview, WizardFooter, TextLink,
} from '../../../components/ui';
import { C2, TONES2, FS2, SP2, SZ2, LAYOUT2, T2, UI2 } from '../../../constants';
import { STEPS } from './listingWizardShared';
import { WizardPage, AiAssist } from './listingWizardV2';   // shared v2 frame (backdrop · breadcrumb · header · stepper)
import { MAP_PILLS } from './mockListingData';
import {
  getProperty, patchProperty, getUnit, getAmenityCatalog,
  getListing, patchListing, createListing,
  getListingAmenities, saveListingAmenities,
  getListingNeighborhood, patchListingNeighborhood,
} from './listingApi';

// ── Page-specific layout (tokens only) ──────────────────────────────────────
const S = {
  col:       UI2.stack(LAYOUT2.gridGap),                                   // stacked cards in one column
  body:      { paddingTop: SP2.md },                                       // card body under the header line
  fields:    { columnGap: SP2.lg, rowGap: SP2.lg },                        // <Grid two> of form fields
  tiles:     { gap: SP2.sm },                                              // <Grid three> of amenity tiles
  full:      { gridColumn: '1 / -1' },
  changed:   { ...UI2.pill(TONES2.primary), marginLeft: SP2.sm, textTransform: 'none', letterSpacing: 0 },
  labelWrap: { display: 'inline-flex', alignItems: 'center' },
  checkGap:  { marginTop: SP2.md },
  rule:      { ...UI2.divider, margin: pad2(SP2.lg) },
  hint:      { ...UI2.text.meta, marginTop: SP2.xxs },
  rowBetween:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP2.lg },
  strong:    { ...UI2.text.title },
  // Playfair title + the zip code beside it in plain Inter with a pin icon (Playfair's digits are old-style / uneven)
  hoodRow:   { ...UI2.row(SP2.sm), alignItems: 'baseline', flexWrap: 'wrap' },   // baseline: the small zip sits on the title's text line
  hood:      { ...T2.sectionTitle, margin: 0 },
  zipTag:    { ...UI2.pill(TONES2.primary), gap: SP2.xs, padding: 0, background: 'none', fontVariantNumeric: 'tabular-nums' },   // pill text style, without the box
  areas:     { ...UI2.text.title, marginTop: SP2.sm },
  mapGap:    { marginTop: SP2.md },
  chips:     { display: 'flex', flexWrap: 'wrap', gap: SP2.sm, marginTop: SP2.md },
  radios:    { ...UI2.row(SP2.md), flexWrap: 'wrap', paddingTop: SP2.md },
  // POI groups (Schools / Restaurants / Transportation)
  poi:       { marginTop: SP2.lg },
  poiHead:   { ...UI2.row(SP2.sm), ...UI2.capsLabel },
  poiIcon:   { fontSize: FS2.lg, color: C2.textSecondary },
  poiItem:   { ...UI2.row(SP2.sm), justifyContent: 'space-between', padding: `${SP2.xs}px 0` },
  poiName:   { ...UI2.text.rowTitle, minWidth: 0, ...UI2.truncate },
  poiDist:   { ...UI2.text.label, flexShrink: 0 },
  poiX:      { ...UI2.btn.icon(SZ2.control.sm), fontSize: FS2.md, color: C2.textSecondary },
  poiAdd:    { ...UI2.row(SP2.sm), marginTop: SP2.sm },
  poiIn:     (grow) => ({ ...FIELD2.inputSm, flex: grow, minWidth: 0 }),
  // Nearby landmarks — chips + input inside one field box
  chipBox:   { ...FIELD2.input, height: 'auto', minHeight: FIELD2.input.height, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SP2.xs, padding: `${SP2.xs}px ${SP2.md}px` },
  chip:      { ...UI2.featureChip() },
  chipX:     { padding: 0, border: 'none', background: 'none', cursor: 'pointer', color: C2.textSecondary, fontSize: FS2.sm, display: 'inline-flex' },
  chipIn:    { flex: 1, minWidth: SZ2.searchSm / 3, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: FS2.base, color: C2.textPrimary, height: SZ2.control.md },
  stateBox:  { ...UI2.empty },
};

function pad2(v) { return `${v}px 0`; }


export default function ListingStep1_Property() {
  const { id: propId, uid: unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [listingId, setListingId] = useState(location.state?.listingId ?? null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [property, setProperty] = useState(null);
  const [unitLabel, setUnitLabel] = useState(`Unit ${unitId}`);

  const [description, setDescription] = useState('');
  const [updatePropertyDescription, setUpdatePropertyDescription] = useState(false);

  const [amenities, setAmenities] = useState([]); // [{id, name, icon, selected}]
  const [syncAmenitiesToProperty, setSyncAmenitiesToProperty] = useState(true);

  const [listingType, setListingType] = useState('RENT'); // RENT | SALE

  const [showExactAddress, setShowExactAddress] = useState(true);
  const [activePill, setActivePill] = useState('Highlights');
  const [neighborhoodInfo, setNeighborhoodInfo] = useState({ schools: [], restaurants: [], transportation: [] });
  const [landmarks, setLandmarks] = useState([]);
  const [landmarkDraft, setLandmarkDraft] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // ── Load everything this step needs ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [propData, unitData, catalog] = await Promise.all([
          getProperty(propId),
          getUnit(propId, unitId),
          getAmenityCatalog('PROPERTY'),
        ]);
        if (cancelled) return;

        setProperty(propData);
        setUnitLabel(`Unit ${unitData.unit_number ?? unitId}`);

        let selectedAmenityIds = new Set((propData.amenities || []).map(a => a.amenity));
        let seedDescription = propData.description || '';
        let seedListingType = 'RENT';
        let seedShowExact = true;
        let seedLandmarks = [];
        let seedWebsiteUrl = '';
        let seedNeighborhood = { schools: [], restaurants: [], transportation: [] };

        if (listingId) {
          const [listing, listingAmenities, neighborhood] = await Promise.all([
            getListing(listingId),
            getListingAmenities(listingId, 'PROPERTY'),
            getListingNeighborhood(listingId),
          ]);
          if (cancelled) return;
          seedDescription = listing.description || seedDescription;
          seedListingType = listing.listing_type || seedListingType;
          selectedAmenityIds = new Set(listingAmenities.map(la => la.amenity));
          seedShowExact = neighborhood.show_exact_address ?? seedShowExact;
          seedLandmarks = neighborhood.landmarks || [];
          seedWebsiteUrl = neighborhood.website_url || '';
          seedNeighborhood = {
            schools: neighborhood.schools || [],
            restaurants: neighborhood.restaurants || [],
            transportation: neighborhood.transportation || [],
          };
        }

        setDescription(seedDescription);
        setListingType(seedListingType);
        setShowExactAddress(seedShowExact);
        setLandmarks(seedLandmarks);
        setWebsiteUrl(seedWebsiteUrl);
        setNeighborhoodInfo(seedNeighborhood);
        setAmenities(catalog.map(a => ({
          id: a.id,
          name: a.name,
          icon: a.icon || 'ti-check',
          selected: selectedAmenityIds.has(a.id),
        })));
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Could not load this property.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propId, unitId]);

  const toggleAmenity = (id) => {
    setAmenities(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  const addLandmark = () => {
    const v = landmarkDraft.trim();
    if (!v) return;
    setLandmarks(prev => [...prev, v]);
    setLandmarkDraft('');
  };

  const removeLandmark = (idx) => {
    setLandmarks(prev => prev.filter((_, i) => i !== idx));
  };

  // AI Assist isn't wired to anything yet (see AiAssistButton), so these
  // start empty for every new listing rather than being auto-populated —
  // added and edited here manually in the meantime.
  const addPoi = (category, item) => {
    setNeighborhoodInfo(prev => ({ ...prev, [category]: [...(prev[category] || []), item] }));
  };
  const removePoi = (category, idx) => {
    setNeighborhoodInfo(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== idx) }));
  };

  // ── Persist this step against the real backend ───────────────────────────
  // Creates the Listing on first Continue/Save & Exit, PATCHes it on every
  // later one. Returns the listing id on success, throws on failure.
  const persist = async () => {
    let id = listingId;
    if (!id) {
      const listing = await createListing({
        unit: Number(unitId),
        listing_type: listingType,
        description,
      });
      id = listing.id;
      setListingId(id);
    } else {
      await patchListing(id, { description });
    }

    if (updatePropertyDescription) {
      await patchProperty(propId, { description });
    }

    const selectedAmenityIds = amenities.filter(a => a.selected).map(a => a.id);
    await saveListingAmenities(id, {
      category: 'PROPERTY',
      amenityIds: selectedAmenityIds,
      syncToProperty: syncAmenitiesToProperty,
    });

    await patchListingNeighborhood(id, {
      show_exact_address: showExactAddress,
      landmarks,
      website_url: websiteUrl,
      schools: neighborhoodInfo.schools,
      restaurants: neighborhoodInfo.restaurants,
      transportation: neighborhoodInfo.transportation,
    });

    return id;
  };

  const handleSaveExit = async () => {
    if (saving) return;
    setSaveError('');
    if (!listingId && !description && amenities.every(a => !a.selected)) {
      // Nothing entered yet and nothing created yet — just leave.
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}`);
      return;
    }
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
      const id = await persist();
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-2`, {
        state: { listingId: id },
      });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  const shell = (children) => (
    <WizardPage propertyName={property?.property_name} unitLabel={unitLabel} current={1}>{children}</WizardPage>
  );

  if (loading) {
    return shell(<div style={S.stateBox}>Loading property…</div>);
  }

  if (loadError || !property) {
    return shell(
      <div style={S.stateBox}>
        <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {loadError || 'This property could not be loaded.'}</div>
        <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, marginTop: SP2.md }} onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const descChanged = description !== (property.description || '');

  return shell(
    <>
      <Grid layout="wideLeft">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={S.col}>

          {/* Property Information */}
          <SectionCard
            icon="ti-building"
            title="Property Information"
            subtitle="Pulled from the Property record — edits here apply to this listing only."
            pattern={false}
            decoration={<CornerArt />}
          >
            <Grid layout="two" as="div" style={{ ...S.fields, ...S.body }}>
              <FormField label="Property Name"><ReadField value={property.property_name} /></FormField>
              <FormField label="Property Type"><ReadField value={property.property_type} icon="ti-chevron-down" /></FormField>
              <FormField label="Address Line 1" full><ReadField value={property.street_address} /></FormField>
              <FormField label="Address Line 2" full><ReadField value={property.street2} placeholder="Optional" /></FormField>
              <FormField label="City"><ReadField value={property.city} icon="ti-chevron-down" /></FormField>
              <FormField label="State"><ReadField value={property.state} icon="ti-chevron-down" /></FormField>
              <FormField label="Zip / Postal Code"><ReadField value={property.zip_code} /></FormField>
              <FormField label="Country"><ReadField value={property.country} icon="ti-chevron-down" /></FormField>
              <FormField label="Neighborhood"><ReadField value={property.landmark} /></FormField>
              <FormField label="Year Built"><ReadField value={property.build_year} icon="ti-calendar" /></FormField>

              <FormField
                full
                label={(
                  <span style={S.labelWrap}>
                    Property Description
                    {descChanged && (
                      <span style={S.changed}><i className="ti ti-check" aria-hidden="true" />Changed for this listing</span>
                    )}
                  </span>
                )}
                action={<AiAssist />}
              >
                <textarea
                  className="un2-focus-ring"
                  style={FIELD2.textarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  aria-label="Property description"
                />
                <Checkbox
                  checked={updatePropertyDescription}
                  onChange={() => setUpdatePropertyDescription(v => !v)}
                  label="Also update the Property record"
                />
              </FormField>
            </Grid>
          </SectionCard>

          {/* Amenity(s) */}
          <SectionCard
            icon="ti-home"
            tone={TONES2.primary}
            title="Amenity(s)"
            subtitle="Sourced from the UN Reference amenity list — not free text."
            pattern={false}
            decoration={<CornerArt />}
          >
            <div style={S.body}>
              {amenities.length === 0 ? (
                <div style={UI2.emptyInline}>No property amenities configured yet.</div>
              ) : (
                <Grid layout="three" as="div" style={S.tiles}>
                  {amenities.map(a => (
                    <ChoiceTile key={a.id} icon={a.icon} label={a.name} selected={a.selected} onClick={() => toggleAmenity(a.id)} />
                  ))}
                </Grid>
              )}
              <div style={S.rule} />
              <Checkbox
                strong
                checked={syncAmenitiesToProperty}
                onChange={() => setSyncAmenitiesToProperty(v => !v)}
                label="Also update the property record"
                hint="Syncs these amenity selections back to the property's saved amenity list — otherwise this only affects the listing."
              />
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={S.col}>

          {/* Listing Type */}
          <SectionCard icon="ti-tag" title="Listing Type" subtitle="What do you want to do with this unit?" pattern={false}>
            <div style={S.radios} role="radiogroup" aria-label="Listing type">
              <RadioPill label="Rent" on={listingType === 'RENT'} onClick={() => setListingType('RENT')} />
              <RadioPill label="Sell" on={listingType === 'SALE'} onClick={() => setListingType('SALE')} />
            </div>
            {listingId && (
              <p style={{ ...S.hint, marginTop: SP2.md }}>Listing type is locked once this listing is created — start a new listing to change it.</p>
            )}
          </SectionCard>

          {/* Location & Marketing */}
          <SectionCard icon="ti-map-pin" title="Location & Marketing" pattern={false}>
            <div style={S.body}>
              <div style={S.rowBetween}>
                <div>
                  <div style={S.strong}>Show exact address publicly</div>
                  <p style={S.hint}>Otherwise only the neighborhood is shown to prospects</p>
                </div>
                <Switch on={showExactAddress} onChange={() => setShowExactAddress(v => !v)} label="Show exact address publicly" />
              </div>

              <div style={S.rule} />

              <div style={S.hoodRow}>
                <h3 style={S.hood}>Neighborhood</h3>
                {property.zip_code && (
                  <span style={S.zipTag}><i className="ti ti-map-pin" aria-hidden="true" />{property.zip_code}</span>
                )}
              </div>
              <div style={S.areas}>Areas of Interest</div>
              <p style={S.hint}>Illustrative preview only — a live, interactive map isn't wired up yet.</p>
              <div style={S.mapGap}><MapPreview /></div>
              <div style={S.chips}>
                {MAP_PILLS.map(p => (
                  <button key={p} type="button" style={UI2.filterChip(activePill === p)} onClick={() => setActivePill(p)} aria-pressed={activePill === p}>{p}</button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Schools, Restaurants & Transportation · landmarks · website */}
          <SectionCard
            title="Schools, Restaurants & Transportation"
            subtitle="AI Assist will auto-populate this from the property address once available — add entries manually for now."
            action={<AiAssist />}
            pattern={false}
          >
            <PoiGroup icon="ti-school" label="Schools" items={neighborhoodInfo.schools} onAdd={item => addPoi('schools', item)} onRemove={idx => removePoi('schools', idx)} />
            <PoiGroup icon="ti-tools-kitchen-2" label="Restaurants" items={neighborhoodInfo.restaurants} onAdd={item => addPoi('restaurants', item)} onRemove={idx => removePoi('restaurants', idx)} />
            <PoiGroup icon="ti-bus" label="Transportation" items={neighborhoodInfo.transportation} onAdd={item => addPoi('transportation', item)} onRemove={idx => removePoi('transportation', idx)} />

            <div style={S.rule} />

            <div style={UI2.stack(SP2.lg)}>
              <FormField label="Nearby Landmarks">
                <div className="un2-focus-ring" style={S.chipBox}>
                  {landmarks.map((l, i) => (
                    <span key={i} style={S.chip}>
                      {l}
                      <button type="button" style={S.chipX} onClick={() => removeLandmark(i)} aria-label={`Remove ${l}`}><i className="ti ti-x" aria-hidden="true" /></button>
                    </span>
                  ))}
                  <input
                    style={S.chipIn}
                    placeholder="Add landmark…"
                    value={landmarkDraft}
                    onChange={e => setLandmarkDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLandmark(); } }}
                    aria-label="Add landmark"
                  />
                </div>
              </FormField>
              <FormField label="Property Website URL">
                <input
                  className="un2-focus-ring"
                  style={FIELD2.input}
                  placeholder="https://"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  aria-label="Property website URL"
                />
              </FormField>
            </div>
          </SectionCard>
        </div>
      </Grid>

      <WizardFooter
        step={1}
        total={STEPS.length}
        note={saveError || undefined}
        onSaveExit={handleSaveExit}
        onContinue={handleContinue}
        busy={saving}
      />
    </>
  );
}

function PoiGroup({ icon, label, items, onAdd, onRemove }) {
  const [nameDraft, setNameDraft] = useState('');
  const [subDraft, setSubDraft] = useState('');
  const [distDraft, setDistDraft] = useState('');

  const submit = () => {
    const name = nameDraft.trim();
    if (!name) return;
    onAdd({ name, sub: subDraft.trim(), distance: distDraft.trim() });
    setNameDraft('');
    setSubDraft('');
    setDistDraft('');
  };
  const onDraftKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };

  return (
    <div style={S.poi}>
      <div style={S.poiHead}><i className={`ti ${icon}`} style={S.poiIcon} aria-hidden="true" />{label}</div>
      {(!items || items.length === 0) && <p style={S.hint}>None added yet</p>}
      {(items || []).map((it, i) => (
        <div key={i} style={S.poiItem}>
          <span style={S.poiName}>{it.name}{it.sub && <span style={UI2.text.meta}> · {it.sub}</span>}</span>
          <span style={UI2.row(SP2.xs)}>
            {it.distance && <span style={S.poiDist}>{it.distance}</span>}
            <button type="button" style={S.poiX} onClick={() => onRemove(i)} aria-label={`Remove ${it.name}`}><i className="ti ti-x" aria-hidden="true" /></button>
          </span>
        </div>
      ))}
      <div style={S.poiAdd}>
        <input className="un2-focus-ring" style={S.poiIn(2)} placeholder="Name" value={nameDraft} onChange={e => setNameDraft(e.target.value)} onKeyDown={onDraftKeyDown} aria-label={`${label} name`} />
        <input className="un2-focus-ring" style={S.poiIn(2)} placeholder="Type (optional)" value={subDraft} onChange={e => setSubDraft(e.target.value)} onKeyDown={onDraftKeyDown} aria-label={`${label} type`} />
        <input className="un2-focus-ring" style={S.poiIn(1.4)} placeholder="Distance" value={distDraft} onChange={e => setDistDraft(e.target.value)} onKeyDown={onDraftKeyDown} aria-label={`${label} distance`} />
        <TextLink arrow={false} onClick={submit}>+ Add</TextLink>
      </div>
    </div>
  );
}
