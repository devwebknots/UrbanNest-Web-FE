// src/pages/PMPortal/Listing/PMListMultiStep1_Property.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Multi-Unit Listing wizard — Step 1: Property (PM Portal — Independent PM /
// Org PM staff).
//
// Entry point: PMPropertyDetailPage.jsx → "List Multi Units" button →
// PMUnitSelection.jsx (the real "List Ready" gate, LST-8's readiness engine,
// mirrored from LandlordUnitSelection.jsx — see that file's own header note).
// Route: /pm-portal/properties/:id/list-multi/step-1 (see App.js).
//
// Deliberate duplicate of ../../Landlord/Listing/ListMultiStep1_Property.jsx,
// not a persona-prop extension of it — same reasoning pmListingWizardShared.jsx
// gives for the Individual wizard (Session 47): the two portals' shells
// (NavB+PMTopBar here vs NavF there) are different enough that parametrizing
// one component would branch almost every line, while the step's own
// fields/logic/API calls are already portal-agnostic and reused as-is.
//
// listingApi.js and propertyListingApi.js are reused unduplicated from the
// Landlord Listing folder — both are already portal-agnostic (plain REST
// calls, no Landlord-specific paths) per PMListingStep1_Property.jsx's own
// precedent for listingApi.js.
//
// PM Portal route param: :id (matches PMPropertyDetailPage.jsx's own route,
// /pm-portal/properties/:id — no unit param needed, this step is
// property-level, same as the Landlord version's :id).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from './pmListingTokens';
import {
  LS, ListingPageShell, ListingFooter, SectionHead,
  AiAssistButton, Checkbox, Toggle, RadioPillButton, MULTI_STEPS,
} from './pmListingWizardShared';
import { MAP_PILLS } from '../../Landlord/Listing/mockListingData';
import { getProperty, getAmenityCatalog } from '../../Landlord/Listing/listingApi';
import {
  createPropertyListing, getPropertyListing, patchPropertyListing,
  getPropertyListingAmenities, savePropertyListingAmenities,
  getPropertyListingNeighborhood, patchPropertyListingNeighborhood,
  listPropertyListings,
} from '../../Landlord/Listing/propertyListingApi';

// Groups in these statuses are still "in progress" — worth resuming instead
// of starting a second one. EXPIRED/UNPUBLISHED groups are done; a fresh
// "List Multi Units" click should start clean for those.
const RESUMABLE_STATUSES = ['DRAFT', 'PENDING_PAYMENT'];

export default function PMListMultiStep1_Property() {
  const { id: propId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [propertyListingId, setPropertyListingId] = useState(location.state?.propertyListingId ?? null);
  // Session continuation (Unit Selection screen, LST-8's real gate) — when
  // this step was entered from PMUnitSelection.jsx with 2+ units already
  // checked, relay that selection through to Step 2 untouched (never
  // consumed here — this step has no concept of units at all, see its own
  // header note). null on every other entry point (the plain "List Multi
  // Units" href, or Back from Step 2), which Step 2 already treats as
  // "nothing to auto-attach".
  const preselectedUnitIds = location.state?.preselectedUnitIds ?? null;

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
  const [resumedDraft, setResumedDraft] = useState(false);

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

        // Resolve an existing in-progress group for this property when we
        // weren't handed one via router state — see this file's header
        // comment. PMPropertyDetailPage.jsx's "List Multi Units" button
        // navigates with a plain href (no state), so without this,
        // propertyListingId is always null on that entry point even when a
        // DRAFT group already exists, and every visit silently created a
        // new, empty group — same bug class the Landlord version fixed
        // during Session 44 continuation testing.
        let resolvedId = propertyListingId;
        if (!resolvedId) {
          try {
            const allGroups = await listPropertyListings();
            const candidates = (allGroups || [])
              .filter(g => String(g.property) === String(propId) && RESUMABLE_STATUSES.includes(g.status))
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            if (candidates.length > 0) {
              resolvedId = candidates[0].id;
              if (cancelled) return;
              setPropertyListingId(resolvedId);
              setResumedDraft(true);
            }
          } catch {
            // Non-fatal — worst case, Continue creates a new group, same as
            // today's behavior before this fix.
          }
        }

        let selectedAmenityIds = new Set();
        let seedDescription = '';
        let seedListingType = 'RENT';
        let seedShowExact = true;
        let seedLandmarks = [];
        let seedWebsiteUrl = '';

        if (resolvedId) {
          const [group, groupAmenities, neighborhood] = await Promise.all([
            getPropertyListing(resolvedId),
            getPropertyListingAmenities(resolvedId, 'PROPERTY'),
            getPropertyListingNeighborhood(resolvedId),
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
  // every later one — same create-vs-patch branch as
  // PMListingStep1_Property's persist().
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
      navigate(`/pm-portal/properties/${propId}`);
      return;
    }
    setSaving(true);
    try {
      await persist();
      navigate(`/pm-portal/properties/${propId}`);
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
      navigate(`/pm-portal/properties/${propId}/list-multi/step-2`, {
        state: { propertyListingId: id, preselectedUnitIds },
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
      pageSub={
        resumedDraft
          ? "Resumed your existing draft listing for this property — you'll add units and unit-specific pricing next."
          : "Set up the shared property details for this listing — you'll add units and unit-specific pricing next."
      }
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
