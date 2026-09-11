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
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from '../landlordTokens';
import {
  LS, ListingPageShell, ListingFooter, SectionHead,
  AiAssistButton, Checkbox, Toggle, RadioPillButton,
} from './listingWizardShared';
import { MAP_PILLS } from './mockListingData';
import {
  getProperty, patchProperty, getUnit, getAmenityCatalog,
  getListing, patchListing, createListing,
  getListingAmenities, saveListingAmenities,
  getListingNeighborhood, patchListingNeighborhood,
} from './listingApi';

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'inherit', color: C.txtSec }}>
        Loading property…
      </div>
    );
  }

  if (loadError || !property) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 10, color: C.txtSec }}>
        <div>{loadError || 'This property could not be loaded.'}</div>
        <span style={{ color: C.blue, cursor: 'pointer', fontWeight: 600 }} onClick={() => window.location.reload()}>Retry</span>
      </div>
    );
  }

  return (
    <ListingPageShell
      propertyName={property.property_name}
      unitLabel={unitLabel}
      current={1}
      footer={
        <ListingFooter
          current={1}
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

            {/* Property Information */}
            <div style={LS.card}>
              <SectionHead
                icon="ti-building"
                bg={C.blueLight}
                color={C.blue}
                title="Property Information"
                note="Pulled from the Property record — edits here apply to this listing only"
              />
              <div style={LS.grid2}>
                <div style={LS.field}>
                  <span style={LS.lbl}>Property Name</span>
                  <div style={LS.inpStatic}>{property.property_name}</div>
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>Property Type</span>
                  <div style={LS.inpStatic}>{property.property_type || '—'}</div>
                </div>
                <div style={{ ...LS.field, ...LS.fieldFull }}>
                  <span style={LS.lbl}>Address Line 1</span>
                  <div style={LS.inpStatic}>{property.street_address || '—'}</div>
                </div>
                <div style={{ ...LS.field, ...LS.fieldFull }}>
                  <span style={LS.lbl}>Address Line 2</span>
                  <div style={{ ...LS.inpStatic, ...(property.street2 ? {} : LS.inpStaticPh) }}>{property.street2 || 'Optional'}</div>
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>City</span>
                  <div style={LS.inpStatic}>{property.city || '—'}</div>
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>State</span>
                  <div style={LS.inpStatic}>{property.state || '—'}</div>
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>Zip / Postal Code</span>
                  <div style={LS.inpStatic}>{property.zip_code || '—'}</div>
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>Country</span>
                  <div style={LS.inpStatic}>{property.country || '—'}</div>
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>Neighborhood</span>
                  <div style={LS.inpStatic}>{property.landmark || '—'}</div>
                </div>
                <div style={LS.field}>
                  <span style={LS.lbl}>Year Built</span>
                  <div style={LS.inpStatic}>{property.build_year || '—'}</div>
                </div>

                <div style={{ ...LS.field, ...LS.fieldFull }}>
                  <div style={LS.lblRow}>
                    <span style={LS.lbl}>
                      Property Description
                      {description !== (property.description || '') && (
                        <span style={LS.badgeOverride}>
                          <i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />Changed for this listing
                        </span>
                      )}
                    </span>
                    <AiAssistButton />
                  </div>
                  <textarea
                    style={LS.txtarea}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <Checkbox checked={updatePropertyDescription} onChange={() => setUpdatePropertyDescription(v => !v)} />
                    <span style={LS.cktext}>Also update the Property record</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenity(s) */}
            <div style={LS.card}>
              <SectionHead
                icon="ti-home-heart"
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
                  <div style={{ fontSize: 12, color: C.txtMuted, gridColumn: '1 / -1' }}>No property amenities configured yet.</div>
                )}
              </div>
              <div style={LS.syncRow}>
                <Checkbox checked={syncAmenitiesToProperty} onChange={() => setSyncAmenitiesToProperty(v => !v)} />
                <div>
                  <span style={{ ...LS.cktext, fontWeight: 550, color: C.txtPrimary }}>Also update the property record</span>
                  <p style={{ ...LS.hint, marginTop: 2 }}>Syncs these amenity selections back to the property's saved amenity list — otherwise this only affects the listing</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
          <div style={LS.splitCol}>

            {/* Listing Type */}
            <div style={LS.card}>
              <SectionHead
                icon="ti-tag"
                bg={C.blueLight}
                color={C.blue}
                title="Listing Type"
                note="What do you want to do with this unit?"
              />
              <div style={LS.radiopill}>
                <RadioPillButton label="Rent" on={listingType === 'RENT'} onClick={() => setListingType('RENT')} />
                <RadioPillButton label="Sell" on={listingType === 'SALE'} onClick={() => setListingType('SALE')} />
              </div>
              {listingId && (
                <p style={{ ...LS.hint, marginTop: 10 }}>Listing type is locked once this listing is created — start a new listing to change it.</p>
              )}
            </div>

            {/* Location & Marketing */}
            <div style={LS.card}>
              <SectionHead icon="ti-map-pin" bg={C.blueLight} color={C.blue} title="Location & Marketing" />

              <div style={{ ...LS.rowBetween, marginBottom: 16 }}>
                <div>
                  <div style={{ ...LS.cktext, fontWeight: 550, color: C.txtPrimary }}>Show exact address publicly</div>
                  <p style={{ ...LS.hint, marginTop: 2 }}>Otherwise only the neighborhood is shown to prospects</p>
                </div>
                <Toggle on={showExactAddress} onChange={() => setShowExactAddress(v => !v)} />
              </div>

              <div style={LS.hr} />

              <div style={LS.mapHeading}>Neighborhood: {property.zip_code || '—'}</div>
              <p style={LS.mapSubhead}>Areas of interest</p>
              <p style={LS.mapDesc}>Illustrative preview only — a live, interactive map isn't wired up yet.</p>
              <div style={LS.mapBox}>
                <div style={LS.mapPin('16%', '16%', false)}><PinIcon /></div>
                <div style={LS.mapPin('66%', '30%', false)}><PinIcon /></div>
                <div style={LS.mapPin('30%', '58%', false)}><PinIcon /></div>
                <div style={LS.mapPin('47%', '44%', true)}><PinIcon /></div>
                <div style={LS.mapGoogle}>Google</div>
                <div style={LS.mapStreetview}>Street View</div>
              </div>
              <div style={LS.mappills}>
                {MAP_PILLS.map(p => (
                  <div key={p} style={LS.mappill(activePill === p)} onClick={() => setActivePill(p)}>{p}</div>
                ))}
              </div>

              <div style={LS.hr} />

              <div style={LS.lblRow}>
                <span style={{ ...LS.mapSubhead, marginBottom: 0 }}>Schools, Restaurants &amp; Transportation</span>
                <AiAssistButton />
              </div>
              <p style={{ ...LS.hint, marginBottom: 12 }}>AI Assist will auto-populate this from the property address once available — add entries manually for now</p>

              <PoiGroup icon="ti-school" label="Schools" items={neighborhoodInfo.schools} onAdd={item => addPoi('schools', item)} onRemove={idx => removePoi('schools', idx)} />
              <PoiGroup icon="ti-tools-kitchen-2" label="Restaurants" items={neighborhoodInfo.restaurants} onAdd={item => addPoi('restaurants', item)} onRemove={idx => removePoi('restaurants', idx)} />
              <PoiGroup icon="ti-bus" label="Transportation" items={neighborhoodInfo.transportation} onAdd={item => addPoi('transportation', item)} onRemove={idx => removePoi('transportation', idx)} />

              <div style={LS.hr} />

              <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
                <span style={LS.lbl}>Nearby Landmarks</span>
                <div style={LS.chiprow}>
                  {landmarks.map((l, i) => (
                    <div key={i} style={LS.chip}>
                      {l}
                      <i className="ti ti-x" style={{ fontSize: 10, cursor: 'pointer' }} onClick={() => removeLandmark(i)} aria-hidden="true" />
                    </div>
                  ))}
                  <input
                    style={{ ...LS.chipPh, border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 90, fontSize: 12.5, fontFamily: 'inherit' }}
                    placeholder="Add landmark…"
                    value={landmarkDraft}
                    onChange={e => setLandmarkDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLandmark(); } }}
                  />
                </div>
              </div>
              <div style={{ ...LS.field, ...LS.fieldFull }}>
                <span style={LS.lbl}>Property Website URL</span>
                <input
                  style={LS.inp}
                  placeholder="https://"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
    </ListingPageShell>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 30" fill="currentColor" style={{ width: '100%', height: '100%' }}>
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18C24 5.4 18.6 0 12 0zm0 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
    </svg>
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
    <div style={LS.poiGroup}>
      <span style={LS.poiGroupLbl}><i className={`ti ${icon}`} aria-hidden="true" />{label}</span>
      {(!items || items.length === 0) && (
        <p style={{ fontSize: 11.5, color: '#9aa1ab', margin: '0 0 8px' }}>None added yet</p>
      )}
      {(items || []).map((it, i) => (
        <div key={i} style={LS.poiItem}>
          <span style={LS.poiName}>{it.name}<span style={LS.poiNameSub}>{it.sub}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={LS.poiDist}>{it.distance}</span>
            <i
              className="ti ti-x"
              style={{ fontSize: 11, cursor: 'pointer', color: '#9aa1ab' }}
              onClick={() => onRemove(i)}
              aria-hidden="true"
            />
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 10 }}>
        <input
          style={{ ...LS.inp, flex: 2, fontSize: 11.5, padding: '6px 8px' }}
          placeholder="Name"
          value={nameDraft}
          onChange={e => setNameDraft(e.target.value)}
          onKeyDown={onDraftKeyDown}
        />
        <input
          style={{ ...LS.inp, flex: 2, fontSize: 11.5, padding: '6px 8px' }}
          placeholder="Type (optional)"
          value={subDraft}
          onChange={e => setSubDraft(e.target.value)}
          onKeyDown={onDraftKeyDown}
        />
        <input
          style={{ ...LS.inp, flex: 1, fontSize: 11.5, padding: '6px 8px' }}
          placeholder="Distance"
          value={distDraft}
          onChange={e => setDistDraft(e.target.value)}
          onKeyDown={onDraftKeyDown}
        />
        <span style={{ ...LS.addLink, whiteSpace: 'nowrap' }} onClick={submit}>+ Add</span>
      </div>
    </div>
  );
}
