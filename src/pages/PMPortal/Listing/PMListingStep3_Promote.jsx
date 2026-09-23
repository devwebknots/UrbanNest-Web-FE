// src/pages/PMPortal/Listing/PMListingStep3_Promote.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Create Listing wizard — Step 3: Promote — PM Portal (Independent PM / Org
// PM staff, Individual Unit Listing)
//
// Session 47 third build slice. Deliberate duplicate of
// ../../Landlord/Listing/ListingStep3_Promote.jsx — see
// pmListingWizardShared.jsx's header comment for why (different shell, same
// portal-agnostic step content/logic). Field logic, backend shape
// conversions and the promotion-plan carousel below are copied unchanged
// from the Landlord file.
//
// listingApi.js is reused as-is from its existing location (already
// portal-agnostic) rather than duplicated — same reasoning as
// PMListingStep1_Property.jsx / PMListingStep2_Unit.jsx.
//
// PM Portal route param names: :id/:unitId (not Landlord's :id/:uid) —
// confirmed against App.js / PMUnitDetailPage.jsx before wiring this up.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from './pmListingTokens';
import {
  LS, ListingPageShell, ListingFooter, SectionHead,
  AiAssistButton, Checkbox, Toggle, RadioPillButton,
} from './pmListingWizardShared';
import {
  getListing,
  getChannelCatalog, getListingChannels, saveListingChannels,
  getPromotionPlanCatalog,
  getLeadSettings, patchLeadSettings,
} from '../../Landlord/Listing/listingApi';

const PLAN_VISIBLE = 3;

const DAYS = [
  ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'],
  ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun'],
];

const CHANNEL_ICON_BY_NAME = {
  'UrbanNest Marketplace': 'ti-home',
};
const CHANNEL_ICON_FALLBACK = 'ti-building-skyscraper';

function daysListToObj(list) {
  const set = new Set((list || []).map(v => String(v).toLowerCase()));
  return { mon: set.has('mon'), tue: set.has('tue'), wed: set.has('wed'), thu: set.has('thu'), fri: set.has('fri'), sat: set.has('sat'), sun: set.has('sun') };
}
function daysObjToList(obj) {
  return Object.entries(obj || {}).filter(([, v]) => v).map(([k]) => k.toUpperCase());
}

function planForDisplay(plan) {
  const priceValue = Number(plan.price) || 0;
  return {
    id: plan.id,
    name: plan.name,
    tag: plan.tag || null,
    priceLabel: priceValue === 0 ? 'Free' : `$${priceValue.toFixed(0)}`,
    priceSuffix: priceValue === 0 ? '' : `/ ${plan.duration_days} days`,
    priceValue,
    durationDays: plan.duration_days,
    desc: plan.short_description || '',
    features: plan.features || [],
    finePrint: plan.fine_print || '',
  };
}

export default function PMListingStep3_Promote() {
  const { id: propId, unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const listingId = location.state?.listingId ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [propertyName] = useState(location.state?.propertyName || 'Property');
  const [unitLabel, setUnitLabel] = useState(`Unit ${unitId}`);

  const [channels, setChannels] = useState([]); // [{id,name,isAvailable,desc,comingSoon,checked}]
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [detailsPlanId, setDetailsPlanId] = useState(null);

  const [planScrollIndex, setPlanScrollIndex] = useState(0);
  const maxPlanScrollIndex = Math.max(0, plans.length - PLAN_VISIBLE);
  const canScrollPlansLeft = planScrollIndex > 0;
  const canScrollPlansRight = planScrollIndex < maxPlanScrollIndex;
  const scrollPlansLeft = () => setPlanScrollIndex(i => Math.max(0, i - 1));
  const scrollPlansRight = () => setPlanScrollIndex(i => Math.min(maxPlanScrollIndex, i + 1));

  const [leadContact, setLeadContact] = useState({ contactName: '', contactPhone: '', contactEmail: '', preferredContactMethod: 'Email' });
  const setLeadContactField = (key, value) => setLeadContact(prev => ({ ...prev, [key]: value }));

  const [showing, setShowing] = useState({ showingMethod: 'SELF_GUIDED', showingInstructions: '', availableDays: daysListToObj([]) });
  const setShowingField = (key, value) => setShowing(prev => ({ ...prev, [key]: value }));
  const toggleDay = (key) => setShowing(prev => ({ ...prev, availableDays: { ...prev.availableDays, [key]: !prev.availableDays[key] } }));

  const [leadPrefs, setLeadPrefs] = useState({ sendAutoResponse: true, requirePreScreening: false });
  const toggleLeadPref = (key) => setLeadPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!listingId) {
      navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-2`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [listing, channelCatalog, channelSelections, planCatalog, lead] = await Promise.all([
          getListing(listingId),
          getChannelCatalog(),
          getListingChannels(listingId),
          getPromotionPlanCatalog(),
          getLeadSettings(listingId),
        ]);
        if (cancelled) return;

        setUnitLabel(`Unit ${listing.unit ?? unitId}`);

        const selectedChannelIds = channelSelections.length
          ? new Set(channelSelections.map(cs => cs.channel))
          : new Set(channelCatalog.filter(c => c.is_available).map(c => c.id));
        setChannels(channelCatalog.map(c => ({
          id: c.id,
          name: c.name,
          isAvailable: c.is_available,
          icon: CHANNEL_ICON_BY_NAME[c.name] || CHANNEL_ICON_FALLBACK,
          desc: c.is_available
            ? (c.coming_soon_note || 'Included with every listing — visible to all UrbanNest prospects immediately on publish.')
            : c.coming_soon_note,
          checked: c.is_available && selectedChannelIds.has(c.id),
        })));

        const displayPlans = (planCatalog || []).map(planForDisplay);
        setPlans(displayPlans);
        const defaultPlan = planCatalog.find(p => p.is_default) || planCatalog[0];
        setSelectedPlanId(defaultPlan ? defaultPlan.id : null);

        setLeadContact({
          contactName: lead.contact_name || '',
          contactPhone: lead.contact_phone || '',
          contactEmail: lead.contact_email || '',
          preferredContactMethod: lead.preferred_contact_method === 'PHONE' ? 'Phone' : 'Email',
        });
        setShowing({
          showingMethod: lead.showing_method || 'SELF_GUIDED',
          showingInstructions: lead.showing_instructions || '',
          availableDays: daysListToObj(lead.available_days),
        });
        setLeadPrefs({
          sendAutoResponse: lead.auto_response !== false,
          requirePreScreening: !!lead.pre_screening_required,
        });
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Could not load promotion options.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propId, unitId, listingId]);

  const toggleChannel = (id) => setChannels(prev => prev.map(c => (c.isAvailable && c.id === id) ? { ...c, checked: !c.checked } : c));

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0] || { priceValue: 0, priceLabel: 'Free', priceSuffix: '', durationDays: 30 };
  const detailsPlan = plans.find(p => p.id === detailsPlanId);

  const persist = async () => {
    const selectedChannelIds = channels.filter(c => c.checked).map(c => c.id);
    await saveListingChannels(listingId, selectedChannelIds);

    await patchLeadSettings(listingId, {
      contact_name: leadContact.contactName,
      contact_phone: leadContact.contactPhone,
      contact_email: leadContact.contactEmail,
      preferred_contact_method: leadContact.preferredContactMethod === 'Phone' ? 'PHONE' : 'EMAIL',
      showing_method: showing.showingMethod,
      showing_instructions: showing.showingInstructions,
      available_days: daysObjToList(showing.availableDays),
      auto_response: leadPrefs.sendAutoResponse,
      pre_screening_required: leadPrefs.requirePreScreening,
    });
  };

  const handleBack = async () => {
    if (saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await persist();
      navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-2`, { state: { listingId } });
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
      navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-4`, {
        state: { listingId, selectedPlanId, propertyName },
      });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: C.txtSec }}>
        Loading promotion options…
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 10, color: C.txtSec }}>
        <div>{loadError}</div>
      </div>
    );
  }

  return (
    <ListingPageShell
      propertyName={propertyName}
      unitLabel={unitLabel}
      current={3}
      pageSub="Choose where this listing appears and how it stands out to prospects."
      footer={
        <ListingFooter
          current={3}
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

          {/* Distribution Channels */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-share"
              bg={C.blueLight}
              color={C.blue}
              title="Distribution Channels"
              note="Select where this listing will be published"
            />
            <div style={LS.channelList}>
              {channels.map(ch => (
                <div key={ch.id} style={LS.channelRow(ch.isAvailable)}>
                  <Checkbox checked={ch.checked} onChange={() => toggleChannel(ch.id)} />
                  <div style={LS.channelRowIcon(ch.isAvailable)}><i className={`ti ${ch.icon}`} aria-hidden="true" /></div>
                  <div>
                    <div style={LS.channelRowName}>
                      {ch.name}
                      {!ch.isAvailable && <span style={LS.badgeSoon}>Coming Soon</span>}
                    </div>
                    <p style={LS.channelRowDesc}>{ch.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promotion Plan */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-star"
              bg={C.amberLight}
              color={C.amber}
              title="Promotion Plan"
              note="Boost visibility for this listing on the marketplace"
            />
            <div style={LS.planCarouselRow}>
              {plans.length > PLAN_VISIBLE && (
                <button
                  type="button"
                  style={LS.planArrow(canScrollPlansLeft)}
                  onClick={scrollPlansLeft}
                  disabled={!canScrollPlansLeft}
                  aria-label="Previous plans"
                >
                  <i className="ti ti-chevron-left" aria-hidden="true" />
                </button>
              )}

              <div style={LS.planViewport}>
                <div style={LS.planTrack(planScrollIndex)}>
                  {plans.map(plan => {
                    const selected = plan.id === selectedPlanId;
                    return (
                      <div key={plan.id} style={LS.plan(selected)} onClick={() => setSelectedPlanId(plan.id)}>
                        {plan.tag && <span style={LS.planTag}>{plan.tag}</span>}
                        <div style={LS.planHeadRow}>
                          <p style={LS.planName}>{plan.name}</p>
                          <span style={LS.planDetails} onClick={(e) => { e.stopPropagation(); setDetailsPlanId(plan.id); }}>Details</span>
                        </div>
                        <div style={LS.planPrice}>{plan.priceLabel}{plan.priceSuffix && <span style={LS.planPriceSub}> {plan.priceSuffix}</span>}</div>
                        <p style={LS.planDesc}>{plan.desc}</p>
                        <div style={LS.planFeat}>
                          {plan.features.map((f, i) => (
                            <div key={i} style={LS.planFeatItem}>
                              <i className="ti ti-check" style={{ fontSize: 13, color: C.green, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />{f}
                            </div>
                          ))}
                        </div>
                        <div style={LS.planSelect(selected)} onClick={(e) => { e.stopPropagation(); setSelectedPlanId(plan.id); }}>
                          {selected && <i className="ti ti-check" style={{ fontSize: 13 }} aria-hidden="true" />}
                          {selected ? 'Selected' : 'Select Plan'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {plans.length > PLAN_VISIBLE && (
                <button
                  type="button"
                  style={LS.planArrow(canScrollPlansRight)}
                  onClick={scrollPlansRight}
                  disabled={!canScrollPlansRight}
                  aria-label="Next plans"
                >
                  <i className="ti ti-chevron-right" aria-hidden="true" />
                </button>
              )}
            </div>
            <div style={LS.costbar}>
              <span style={LS.costbarL}>Promotion cost for this listing</span>
              <span style={LS.costbarR}>
                {selectedPlan.priceValue === 0 ? 'Free' : `$${selectedPlan.priceValue.toFixed(2)}`}
                {selectedPlan.priceSuffix && <span style={LS.costbarRSub}> {selectedPlan.priceSuffix}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={LS.splitCol}>

          {/* Lead Contact */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-user-circle"
              bg={C.blueLight}
              color={C.blue}
              title="Lead Contact"
              note="Who receives inquiries from this listing"
            />
            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Contact Name</span>
              <input style={LS.inp} value={leadContact.contactName} onChange={e => setLeadContactField('contactName', e.target.value)} />
            </div>
            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Contact Phone</span>
              <input style={LS.inp} value={leadContact.contactPhone} onChange={e => setLeadContactField('contactPhone', e.target.value)} />
            </div>
            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <span style={LS.lbl}>Contact Email</span>
              <input style={LS.inp} value={leadContact.contactEmail} onChange={e => setLeadContactField('contactEmail', e.target.value)} />
            </div>
            <div style={{ ...LS.field, ...LS.fieldFull }}>
              <span style={LS.lbl}>Preferred Contact Method</span>
              <select style={LS.inp} value={leadContact.preferredContactMethod} onChange={e => setLeadContactField('preferredContactMethod', e.target.value)}>
                <option>Email</option>
                <option>Phone</option>
              </select>
            </div>
          </div>

          {/* Showing Settings */}
          <div style={LS.card}>
            <SectionHead icon="ti-calendar-event" bg={C.greenLight} color={C.green} title="Showing Settings" />

            <span style={LS.ckGroupLbl}>Showing Method</span>
            <div style={{ ...LS.radiopill, marginBottom: 16 }}>
              <RadioPillButton label="Self-Guided" on={showing.showingMethod === 'SELF_GUIDED'} onClick={() => setShowingField('showingMethod', 'SELF_GUIDED')} />
              <RadioPillButton label="Scheduled" on={showing.showingMethod === 'SCHEDULED'} onClick={() => setShowingField('showingMethod', 'SCHEDULED')} />
            </div>

            <div style={{ ...LS.field, ...LS.fieldFull, marginBottom: 16 }}>
              <div style={LS.lblRow}>
                <span style={{ ...LS.lbl, marginBottom: 0 }}>Showing Instructions</span>
                <AiAssistButton />
              </div>
              <textarea
                style={LS.txtarea}
                value={showing.showingInstructions}
                onChange={e => setShowingField('showingInstructions', e.target.value)}
              />
            </div>

            <div style={LS.hr} />

            <span style={LS.ckGroupLbl}>Available Days</span>
            <div style={LS.ckRow}>
              {DAYS.map(([key, label]) => (
                <div key={key} style={LS.ckItem}>
                  <Checkbox checked={showing.availableDays[key]} onChange={() => toggleDay(key)} />
                  <span style={LS.cktext}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Preferences */}
          <div style={LS.card}>
            <SectionHead icon="ti-mail-cog" bg={C.blueLight} color={C.blue} title="Lead Preferences" />
            <div style={{ ...LS.rowBetween, marginBottom: 14 }}>
              <div>
                <div style={{ ...LS.cktext, fontWeight: 550, color: C.txtPrimary }}>Send automatic response</div>
                <p style={{ ...LS.hint, marginTop: 2 }}>Instant acknowledgement email to new inquiries</p>
              </div>
              <Toggle on={leadPrefs.sendAutoResponse} onChange={() => toggleLeadPref('sendAutoResponse')} />
            </div>
            <div style={LS.rowBetween}>
              <div>
                <div style={{ ...LS.cktext, fontWeight: 550, color: C.txtPrimary }}>Require pre-screening</div>
                <p style={{ ...LS.hint, marginTop: 2 }}>Income/move-in questions before contact is shared</p>
              </div>
              <Toggle on={leadPrefs.requirePreScreening} onChange={() => toggleLeadPref('requirePreScreening')} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan details modal */}
      {detailsPlan && (
        <div style={LS.modalBackdrop} onClick={() => setDetailsPlanId(null)}>
          <div style={LS.modalCard} onClick={e => e.stopPropagation()}>
            <button style={LS.modalClose} onClick={() => setDetailsPlanId(null)} aria-label="Close">
              <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
            </button>
            {detailsPlan.tag && <span style={LS.modalTag}>{detailsPlan.tag}</span>}
            <p style={LS.modalTitle}>{detailsPlan.name} Plan</p>
            <p style={LS.modalPrice}>{detailsPlan.priceLabel}{detailsPlan.priceSuffix && <span style={LS.planPriceSub}> {detailsPlan.priceSuffix}</span>}</p>
            <div style={{ ...LS.planFeat, marginBottom: 0 }}>
              {detailsPlan.features.map((f, i) => (
                <div key={i} style={LS.planFeatItem}>
                  <i className="ti ti-check" style={{ fontSize: 13, color: C.green, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />{f}
                </div>
              ))}
            </div>
            {detailsPlan.finePrint && (
              <>
                <span style={LS.modalSecLbl}>Fine Print</span>
                <div style={LS.modalFine}>{detailsPlan.finePrint}</div>
              </>
            )}
            <div style={LS.modalFooter}>
              <button style={{ ...LS.btn, ...LS.btnSecondary }} onClick={() => setDetailsPlanId(null)}>Close</button>
              <button
                style={{ ...LS.btn, ...LS.btnPrimary }}
                onClick={() => { setSelectedPlanId(detailsPlan.id); setDetailsPlanId(null); }}
              >
                Select This Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </ListingPageShell>
  );
}
