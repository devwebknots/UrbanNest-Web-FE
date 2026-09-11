// src/pages/Landlord/Listing/ListMultiStep1_Property.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Multi-Unit Listing wizard — Step 1: Property.
//
// Entry point: LandlordPropertyDetailPage.jsx → "List Multi Units" button.
// Route: /landlord-portal/property/:id/list-multi/step-1 (see App.js).
//
// Wired to the real `PropertyListing` backend (Session 44 build + migration +
// smoke test, Session 44 FE wiring — LST-10, see propertyListingApi.js).
// Mirrors ListingStep1_Property.jsx's own create-on-first-continue pattern
// exactly: nothing is created until Continue/Save & Exit, at which point this
// step POSTs the real PropertyListing (property + listing_type), then saves
// amenities + neighborhood info against it. Coming back here later (Back from
// Step 2, or re-opening a Draft group) carries `propertyListingId` forward via
// router state and this step re-fetches and PATCHes the same row instead of
// creating a second one — same `location.state?.x ?? null` seeding + "create
// vs patch" branch inside persist() as the single-unit flow's Step 1.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from '../landlordTokens';
import {
  LS, ListingPageShell, ListingFooter, SectionHead,
  AiAssistButton, Checkbox, Toggle, RadioPillButton, MULTI_STEPS,
} from './listingWizardShared';
import { MAP_PILLS } from './mockListingData';
import { getProperty, getAmenityCatalog } from './listingApi';
import {
  createPropertyListing, getPropertyListing, patchPropertyListing,
  getPropertyListingAmenities, savePropertyListingAmenities,
  getPropertyListingNeighborhood, patchPropertyListingNeighborhood,
} from './propertyListingApi';

export default function ListMultiStep1_Property() {
  const { id: propId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [propertyListingId, setPropertyListingId] = useState(location.state?.propertyListingId ?? null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [property, setProperty] = useState(null);

  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState([]); // [{id, name, icon, selected}]
  const [syncAmenitiesToProperty, setSyncAmenitiesToProperty] = useState(false);
  const [listingType, setListingType] = useState('RENT');

  const [showExactAddress, setShowExactAddress] = useState(true);
  const [activePill, setActivePill] = useState('Highlights');
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
        const [propData, catalog] = await Promise.all([
          getProperty(propId),
          getAmenityCatalog('PROPERTY'),
        ]);
        if (cancelled) return;
        setProperty(propData);

        let selectedAmenityIds = new Set();
        let seedDescription = '';
        let seedListingType = 'RENT';
        let seedShowExact = true;
        let seedLandmarks = [];
        let seedWebsiteUrl = '';

        if (propertyListingId) {
          const [group, groupAmenities, neighborhood] = await Promise.all([
            getPropertyListing(propertyListingId),
            getPropertyListingAmenities(propertyListingId, 'PROPERTY'),
            getPropertyListingNeighborhood(propertyListingId),
          ]);
          if (cancelled) return;
          seedDescription = group.description || seedDescription;
          seedListingType = group.listing_type || seedListingType;
          selectedAmenityIds = new Set(groupAmenities.map(ga => ga.amenity));
          seedShowExact = neighborhood.show_exact_address ?? seedShowExact;
          seedLandmarks = neighborhood.landmarks || [];
          seedWebsiteUrl = neighborhood.website_url || '';
        }

        setDescription(seedDescription);
        setListingType(seedListingType);
        setShowExactAddress(seedShowExact);
        setLandmarks(seedLandmarks);
        setWebsiteUrl(seedWebsiteUrl);
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
  }, [propId]);

  const toggleAmenity = (id) => {
    setAmenities(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };
  const addLandmark = () => {
    const v = landmarkDraft.trim();
    if (!v) return;
    setLandmarks(prev => [...prev, v]);
    setLandmarkDraft('');
  };
  const removeLandmark = (idx) => setLandmarks(prev => prev.filter((_, i) => i !== idx));

  // ── Persist this step against the real backend ───────────────────────────
  // Creates the PropertyListing on first Continue/Save & Exit, PATCHes it on
  // every later one — same create-vs-patch branch as ListingStep1_Property's
  // persist(). Returns the group id on success, throws on failure.
  const persist = async () => {
    let id = propertyListingId;
    if (!id) {
      const group = await createPropertyListing({
        property: Number(propId),
        listing_type: listingType,
        description,
      });
      id = group.id;
      setPropertyListingId(id);
    } else {
      await patchPropertyListing(id, { description });
    }

    const selectedAmenityIds = amenities.filter(a => a.selected).map(a => a.id);
    await savePropertyListingAmenities(id, {
      category: 'PROPERTY',
      amenityIds: selectedAmenityIds,
      syncToProperty: syncAmenitiesToProperty,
    });

    await patchPropertyListingNeighborhood(id, {
      show_exact_address: showExactAddress,
      landmarks,
      website_url: websiteUrl,
    });

    return id;
  };

  const handleSaveExit = async () => {
    if (saving) return;
    setSaveError('');
    if (!propertyListingId && !description && amenities.every(a => !a.selected)) {
      navigate(`/landlord-portal/property/${propId}`);
      return;
    }
    setSaving(true);
    try {
      await persist();
      navigate(`/landlord-portal/property/${propId}`);
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing group.');
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
      navigate(`/landlord-portal/property/${propId}/list-multi/step-2`, {
        state: { propertyListingId: id },
      });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing group.');
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
      unitLabel="List Multiple Units"
      title="List Multiple Units"
      pageSub="Set up the shared property details for this listing — you'll add units and unit-specific pricing next."
      current={1}
      steps={MULTI_STEPS}
      footer={
        <ListingFooter
          current={1}
          leftContent="Step 1 of 4"
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

              <div style={{ ...LS.field, ...LS.fieldFull }}>
                <div style={LS.lblRow}>
                  <span style={LS.lbl}>Shared Listing Description</span>
                  <AiAssistButton />
                </div>
                <textarea style={LS.txtarea} value={description} onChange={e => setDescription(e.target.value)} />
                <p style={LS.hint}>Shown on every unit's listing unless a unit overrides it in Step 2.</p>
              </div>
            </div>
          </div>

          <div style={LS.card}>
            <SectionHead
              icon="ti-home-heart"
              bg="#e8f5f0"
              color={C.teal}
              title="Amenity(s)"
              note="Building-level — sourced from the UN Reference amenity list"
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
                <p style={{ ...LS.hint, marginTop: 2 }}>Syncs these amenity selections back to the property's saved amenity list — otherwise this only affects the listing group</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={LS.splitCol}>
          <div style={LS.card}>
            <SectionHead
              icon="ti-tag"
              bg={C.blueLight}
              color={C.blue}
              title="Listing Type"
              note="What do you want to do with these units?"
            />
            <div style={LS.radiopill}>
              <RadioPillButton label="Rent" on={listingType === 'RENT'} onClick={() => setListingType('RENT')} />
              <RadioPillButton label="Sell" on={listingType === 'SALE'} onClick={() => setListingType('SALE')} />
            </div>
            {propertyListingId && (
              <p style={{ ...LS.hint, marginTop: 10 }}>Listing type is locked once this listing group is created — start a new group to change it.</p>
            )}
          </div>

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
              <input style={LS.inp} placeholder="https://" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
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
