// src/pages/Landlord/Listing/ListMultiStep3_Promote.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Multi-Unit Listing wizard — Step 3: Promote.
//
// Wired to the real PropertyListing backend (Session 44 — LST-10, see
// propertyListingApi.js). Same layout as ListingStep3_Promote.jsx
// (Individual wizard) — Distribution Channels + Promotion Plan on the left,
// Lead Contact + Showing Settings + Lead Preferences on the right, same plan
// details modal — but PATCHes the group's own channel-selection/lead-settings
// endpoints (`/api/property-listings/<pk>/channels/` and `.../lead-settings/`)
// instead of a per-Listing one. Same guard pattern as every downstream step
// in both wizards: no `propertyListingId` in router state → bounce back to
// Step 2.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from '../landlordTokens';
import {
  LS, ListingPageShell, ListingFooter, SectionHead,
  AiAssistButton, Checkbox, Toggle, RadioPillButton, MULTI_STEPS,
} from './listingWizardShared';
import { getProperty, getChannelCatalog, getPromotionSubscriptions } from './listingApi';
import {
  getPropertyListing,
  getPropertyListingChannels, savePropertyListingChannels,
  getPropertyListingPromotionPlans,
  getPropertyListingLeadSettings, patchPropertyListingLeadSettings,
} from './propertyListingApi';

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

export default function ListMultiStep3_Promote() {
  const { id: propId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const propertyListingId = location.state?.propertyListingId ?? null;
  // Session 45 continuation — Step 2's Unit Matrix checkbox state, relayed
  // through untouched (this step doesn't read or change unit membership).
  // null means "no selection was passed" (e.g. a direct URL nav) — Step 4
  // treats that as "include every unit currently in the group."
  const includedUnitListingIds = location.state?.includedUnitListingIds ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [propertyName, setPropertyName] = useState('Property');

  const [channels, setChannels] = useState([]); // [{id,name,isAvailable,desc,checked}]
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [detailsPlanId, setDetailsPlanId] = useState(null);

  // AU-2 (Session 49) — "Already Paid" standing entitlement, same pattern as
  // ListingStep3_Promote.jsx (Individual wizard). A ListingPromotionSubscription
  // only shows here when it's still active AND its plan already appears in
  // `plans` above — that catalog is fetched scoped to THIS group (persona +
  // market + this group's own live unit count), so it's already eligibility-
  // filtered for this exact publish. If a subscription's plan doesn't appear
  // there, it wouldn't clear the backend's own re-check at publish time
  // either (property_listing_publish's plan_clears_portfolio_units check),
  // so it's left out here rather than shown and then rejected later.
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);

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
    if (!propertyListingId) {
      navigate(`/landlord-portal/property/${propId}/list-multi/step-2`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [propData, group, channelCatalog, channelSelections, planCatalog, lead, mySubscriptions] = await Promise.all([
          getProperty(propId),
          getPropertyListing(propertyListingId),
          getChannelCatalog(),
          getPropertyListingChannels(propertyListingId),
          // Session 48: eligibility-filtered server-side for this group —
          // persona, market (this group's own Property.country), AND
          // portfolio_units (this group's own live unit count) against each
          // plan's Tab 3 min/max portfolio-units bounds. See
          // listings/views.py's PropertyListingPromotionPlanListView.
          getPropertyListingPromotionPlans(propertyListingId),
          getPropertyListingLeadSettings(propertyListingId),
          getPromotionSubscriptions().catch(() => []), // non-fatal — "Already Paid" just won't show
        ]);
        if (cancelled) return;

        setPropertyName(propData.property_name || 'Property');
        void group; // rollup fetched for parity with the single-unit flow; nothing else here reads it yet

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

        const eligiblePlanIds = new Set((planCatalog || []).map(p => p.id));
        const usable = (mySubscriptions || []).filter(
          s => s.is_active && eligiblePlanIds.has(s.plan_detail ? s.plan_detail.id : s.plan)
        );
        setSubscriptions(usable);

        if (usable.length > 0) {
          // Default to reusing the standing entitlement rather than a fresh
          // paid plan, since it's already paid for.
          setSelectedSubscriptionId(usable[0].id);
          setSelectedPlanId(null);
        } else {
          const defaultPlan = planCatalog.find(p => p.is_default) || planCatalog[0];
          setSelectedPlanId(defaultPlan ? defaultPlan.id : null);
        }

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
  }, [propId, propertyListingId]);

  const toggleChannel = (id) => setChannels(prev => prev.map(c => (c.isAvailable && c.id === id) ? { ...c, checked: !c.checked } : c));

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0] || { priceValue: 0, priceLabel: 'Free', priceSuffix: '', durationDays: 30 };
  const detailsPlan = plans.find(p => p.id === detailsPlanId);
  const selectedSubscription = subscriptions.find(s => s.id === selectedSubscriptionId) || null;

  const choosePlan = (planId) => { setSelectedPlanId(planId); setSelectedSubscriptionId(null); };
  const chooseSubscription = (subId) => { setSelectedSubscriptionId(subId); setSelectedPlanId(null); };

  const persist = async () => {
    const selectedChannelIds = channels.filter(c => c.checked).map(c => c.id);
    await savePropertyListingChannels(propertyListingId, selectedChannelIds);

    await patchPropertyListingLeadSettings(propertyListingId, {
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
      navigate(`/landlord-portal/property/${propId}/list-multi/step-2`, {
        state: { propertyListingId, includedUnitListingIds },
      });
    } catch (e) {
      setSaveError(e.message || 'Could not save promotion settings.');
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
      navigate(`/landlord-portal/property/${propId}`);
    } catch (e) {
      setSaveError(e.message || 'Could not save promotion settings.');
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
      navigate(`/landlord-portal/property/${propId}/list-multi/step-4`, {
        state: { propertyListingId, selectedPlanId, selectedSubscriptionId, includedUnitListingIds },
      });
    } catch (e) {
      setSaveError(e.message || 'Could not save promotion settings.');
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
      unitLabel="List Multiple Units"
      title="List Multiple Units"
      pageSub="Choose where this listing appears and how it stands out to prospects."
      current={3}
      steps={MULTI_STEPS}
      footer={
        <ListingFooter
          current={3}
          onBack={handleBack}
          onSaveExit={handleSaveExit}
          onContinue={handleContinue}
          continueLabel={saving ? 'Saving…' : 'Continue to Publish →'}
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

            {/* AU-2 (Session 49) — "Already Paid" standing entitlement,
                bought ahead of time from My Services. Shown above the fresh-
                purchase carousel since it's the cheaper (free, already
                paid) option whenever it applies. Same block as
                ListingStep3_Promote.jsx's Individual wizard. */}
            {subscriptions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {subscriptions.map(sub => {
                  const planName = sub.plan_detail ? sub.plan_detail.name : `Plan #${sub.plan}`;
                  const selected = sub.id === selectedSubscriptionId;
                  const expiresLabel = new Date(sub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div
                      key={sub.id}
                      onClick={() => chooseSubscription(sub.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                        // Session 49 fix (reported live) — was a bold
                        // 1.5px solid C.green border + C.greenLight fill;
                        // both toned way down to a very light tint/border,
                        // same "subtle, not shouty" treatment as the rest
                        // of this card's own default (unselected) rows.
                        border: `1px solid ${selected ? '#cfe9da' : C.cardBdr}`,
                        background: selected ? '#f3fbf7' : '#fff',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.txtPrimary }}>
                          <i className="ti ti-rosette-discount-check" style={{ color: C.green, marginRight: 6 }} aria-hidden="true" />
                          Already Paid — {planName}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.txtSec, marginTop: 2 }}>
                          Standing entitlement, purchased from My Services · Valid through {expiresLabel}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: selected ? C.greenDark : C.txtSec, flexShrink: 0 }}>
                        {selected ? '✓ Selected' : 'Use this'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
                    const selected = plan.id === selectedPlanId && !selectedSubscriptionId;
                    return (
                      <div key={plan.id} style={LS.plan(selected)} onClick={() => choosePlan(plan.id)}>
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
                        <div style={LS.planSelect(selected)} onClick={(e) => { e.stopPropagation(); choosePlan(plan.id); }}>
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
              <span style={LS.costbarL}>Promotion cost for this listing group</span>
              <span style={LS.costbarR}>
                {selectedSubscription
                  ? 'Already Paid'
                  : (selectedPlan.priceValue === 0 ? 'Free' : `$${selectedPlan.priceValue.toFixed(2)}`)}
                {!selectedSubscription && selectedPlan.priceSuffix && <span style={LS.costbarRSub}> {selectedPlan.priceSuffix}</span>}
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
              note="Who receives inquiries from this listing group"
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
                onClick={() => { choosePlan(detailsPlan.id); setDetailsPlanId(null); }}
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
