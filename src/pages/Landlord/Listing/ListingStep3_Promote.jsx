// src/pages/Landlord/Listing/ListingStep3_Promote.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Create Listing wizard — Step 3: Promote
//
// Wired to the real `listings` backend (Session 42 build, Session 43 FE
// wiring). Distribution Channels and Promotion Plans now come from the real
// admin-configured catalogs (GET /listings/channels/, GET
// /listings/promotion-plans/ — seeded Session 42 to match this page's old
// mock data, minus the demo-only "Elite" plan). Lead Contact, Showing
// Settings and Lead Preferences are three separate cards in this UI but a
// single `ListingLeadSettings` row on the backend — they're combined into
// one PATCH on save.
//
// One real-backend adaptation: `ListingLeadSettings.preferred_contact_method`
// only has EMAIL/PHONE choices server-side (no "Text"), so that option is
// dropped from the select here rather than sending a value the backend
// would reject.
//
// 2026-11-23 — REDESIGNED on Design System v2 (design: Downloads/image 104.png). Same frame as Steps 1–2
// (listingWizardV2.jsx). ALL data loading, saving and navigation is unchanged:
//   <Grid wideLeft>
//     left : Distribution Channels (channel rows: Checkbox · icon · name · description · Coming soon)
//            Promotion Plan ("Already Paid" entitlements · plan cards in a sideways row with arrows — building
//            art on the right, Details → v2 Modal, Selected / Select Plan · promotion cost bar)
//     right: Lead Contact (name · phone · email · preferred method) · Showing Settings (method RadioPills ·
//            instructions + AI Assist · available-day Checkboxes) · Lead Preferences (two Switch rows)
//   WizardFooter (sticky: Step 3 of 4 · error note · Back · Save & Exit · Continue)
// The plan row now scrolls natively (arrows scroll it a card at a time) instead of the old fixed
// 3-cards-per-view index — the plans, selection and what gets saved are the same.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Grid } from '../../../components/layout';
import {
  SectionCard, CornerArt, FormField, SelectField, FIELD2,
  Checkbox, Switch, RadioPill, WizardFooter, TextLink, Modal,
} from '../../../components/ui';
import { C2, G2, TONES2, ACCENT2, F2, FS2, FW2, SP2, SZ2, R2, SH2, T2, UI2 } from '../../../constants';
import { STEPS } from './listingWizardShared';
import { WizardPage, AiAssist, WZ } from './listingWizardV2';
import planArt from '../../../assets/landlord/listings-hero.jpg';   // building art on the plan cards (Listings banner art)
import {
  getListing,
  getChannelCatalog, getListingChannels, saveListingChannels,
  getPromotionPlanCatalog, getPromotionSubscriptions,
  getLeadSettings, patchLeadSettings,
} from './listingApi';

const CONTACT_METHODS = [{ value: 'Email', label: 'Email', icon: 'ti-mail' }, { value: 'Phone', label: 'Phone', icon: 'ti-phone' }];

// ── Page-specific layout (tokens only) ──────────────────────────────────────
const S = {
  // Distribution channel row — soft tinted tile (no border), muted when not available yet
  channel:    (on) => ({ ...UI2.tintRow, alignItems: 'flex-start', ...(on ? {} : { background: C2.background, opacity: 0.7 }) }),
  chIcon:     UI2.iconBox(SZ2.icon.lg, TONES2.primary),
  chName:     { ...T2.sectionTitle, ...UI2.row(SP2.sm), flexWrap: 'wrap' },   // Playfair 16 semibold — same style as the card titles (T2.sectionTitle)
  chDesc:     { ...UI2.text.label, margin: `${SP2.xxs}px 0 0` },
  soon:       { ...UI2.pill(TONES2.neutral) },
  checkPad:   { paddingTop: SP2.xxs },

  // "Already Paid" entitlement rows
  paidList:   { ...UI2.stack(SP2.sm), marginBottom: SP2.lg },
  paid:       (on) => ({ ...UI2.tintRow, justifyContent: 'space-between', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', background: on ? TONES2.primary.soft : C2.background }),
  paidName:   { ...UI2.text.title, ...UI2.row(SP2.xs) },
  paidState:  (on) => ({ fontSize: FS2.sm, fontWeight: FW2.medium, color: on ? C2.primary : C2.textSecondary, flexShrink: 0 }),

  // Plan cards — sideways row
  planRow:    { ...UI2.row(SP2.sm), alignItems: 'stretch' },
  // padding gives the cards' shadows room (a scrolling row clips anything outside it); the negative margin keeps
  // the cards lined up with the rest of the card body
  planScroll: { display: 'flex', gap: SP2.md, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', flex: 1, minWidth: 0, padding: SP2.md, margin: -SP2.md },
  arrow:      (on) => ({ ...UI2.btn.icon(SZ2.control.md), alignSelf: 'center', background: C2.white, boxShadow: SH2.control, opacity: on ? 1 : 0.4, cursor: on ? 'pointer' : 'default' }),
  plan:       {
    position: 'relative', overflow: 'hidden', flex: `0 0 ${SZ2.planCard.basis}`, minWidth: SZ2.planCard.w, maxWidth: '100%', scrollSnapAlign: 'start',   // ≈ ⅔ of the container, never under planCard.w
    padding: SP2.xl, borderRadius: R2.xl, background: C2.white, cursor: 'pointer',
    boxShadow: SH2.tile,    // elevation ladder: panel INSIDE a card (container shadows are made for the page bg) — no ring
  },
  planArt:    { position: 'absolute', top: 0, right: 0, bottom: 0, width: SZ2.planCard.art, pointerEvents: 'none',
                backgroundImage: `url(${planArt})`, backgroundSize: 'cover', backgroundPosition: 'right center',
                WebkitMaskImage: G2.planArtMask, maskImage: G2.planArtMask },
  planBody:   { position: 'relative', maxWidth: '55%' },
  planHead:   { ...UI2.row(SP2.md), justifyContent: 'space-between' },
  planLine:   { display: 'inline-flex', alignItems: 'center', gap: SP2.sm, minWidth: 0, whiteSpace: 'nowrap' },   // name · price badge, centred on one line
  planName:   { ...UI2.text.titleLg, fontFamily: F2.heading, fontSize: FS2.lg },  // Playfair 16 (standard)
  planTag:    { ...UI2.pill(TONES2.purple), marginBottom: SP2.xs },
  // price as a HIGHLIGHT badge: light primary-blue gradient (same as the selected ticks) · white text · ⚡ bolt icon
  planPrice:  { ...UI2.pill(TONES2.primary, { solid: true }), background: G2.accentBar(ACCENT2.teal), gap: SP2.xxs },   // TEAL accent (not blue)
  planSuffix: { ...UI2.text.label, marginLeft: SP2.xs },
  planDesc:   { ...UI2.cardSubtitle, margin: `${SP2.sm}px 0 0` },   // same style as the card subtitle ("Boost visibility…")
  feats:      { ...UI2.stack(SP2.xs), marginTop: SP2.md },
  feat:       { ...UI2.row(SP2.xs), alignItems: 'flex-start', fontSize: FS2.sm, color: C2.textBody },
  featIcon:   { color: C2.primary, fontSize: FS2.md, flexShrink: 0 },
  planBtn:    (on) => ({ ...(on ? UI2.btn.brand : UI2.btn.soft), width: SZ2.planCard.btn, marginTop: SP2.lg }),   // selected = dark navy brand CTA
  // Promotion cost bar
  cost:       { ...UI2.tintRow, justifyContent: 'space-between', marginTop: SP2.lg },
  costLabel:  { ...T2.sectionTitle },   // Playfair 16 semibold — same style as the card titles
  costValue:  { ...T2.kpiValue, fontFamily: F2.heading, fontWeight: FW2.semibold },   // 20 · Playfair · 600
  costSuffix: { ...UI2.text.label, marginLeft: SP2.xs },

  // Lead Preferences rows
  prefRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP2.lg },
  // Plan details modal
  modalPrice: { ...T2.kpiValue },                       // 20 — standard figure
  fineLabel:  { ...UI2.capsLabel, display: 'block', marginTop: SP2.lg, marginBottom: SP2.xs },
  fine:       { ...UI2.text.label, ...UI2.inset },
};

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

export default function ListingStep3_Promote() {
  const { id: propId, uid: unitId } = useParams();
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

  // Phase 4 (Session 49) — "Already Paid" standing entitlement. A
  // ListingPromotionSubscription only shows here as a usable option when
  // it's still active AND its plan already appears in `plans` above — that
  // catalog is fetched with ?listing=<id>, so it's already eligibility-
  // filtered (persona + market + portfolio_units=1) for THIS listing. If a
  // subscription's plan doesn't appear there, it wouldn't clear the
  // backend's own re-check at publish time either (listing_publish()),
  // so it's left out here rather than shown and then rejected later.
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);


  const [leadContact, setLeadContact] = useState({ contactName: '', contactPhone: '', contactEmail: '', preferredContactMethod: 'Email' });
  const setLeadContactField = (key, value) => setLeadContact(prev => ({ ...prev, [key]: value }));

  const [showing, setShowing] = useState({ showingMethod: 'SELF_GUIDED', showingInstructions: '', availableDays: daysListToObj([]) });
  const setShowingField = (key, value) => setShowing(prev => ({ ...prev, [key]: value }));
  const toggleDay = (key) => setShowing(prev => ({ ...prev, availableDays: { ...prev.availableDays, [key]: !prev.availableDays[key] } }));

  const [leadPrefs, setLeadPrefs] = useState({ sendAutoResponse: true, requirePreScreening: false });
  const toggleLeadPref = (key) => setLeadPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!listingId) {
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-2`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [listing, channelCatalog, channelSelections, planCatalog, lead, mySubscriptions] = await Promise.all([
          getListing(listingId),
          getChannelCatalog(),
          getListingChannels(listingId),
          getPromotionPlanCatalog(listingId),
          getLeadSettings(listingId),
          getPromotionSubscriptions().catch(() => []), // non-fatal — "Already Paid" just won't show
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
  }, [propId, unitId, listingId]);

  const toggleChannel = (id) => setChannels(prev => prev.map(c => (c.isAvailable && c.id === id) ? { ...c, checked: !c.checked } : c));

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0] || { priceValue: 0, priceLabel: 'Free', priceSuffix: '', durationDays: 30 };
  const detailsPlan = plans.find(p => p.id === detailsPlanId);
  const selectedSubscription = subscriptions.find(s => s.id === selectedSubscriptionId) || null;

  const choosePlan = (planId) => { setSelectedPlanId(planId); setSelectedSubscriptionId(null); };
  const chooseSubscription = (subId) => { setSelectedSubscriptionId(subId); setSelectedPlanId(null); };

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
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-2`, { state: { listingId } });
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
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-4`, {
        state: { listingId, selectedPlanId, selectedSubscriptionId, propertyName },
      });
    } catch (e) {
      setSaveError(e.message || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  // Plan row — arrows scroll it one card at a time; they grey out at either end
  const planRowRef = useRef(null);
  const [planEdges, setPlanEdges] = useState({ left: false, right: false });
  const updatePlanEdges = () => {
    const el = planRowRef.current;
    if (!el) return;
    setPlanEdges({ left: el.scrollLeft > 0, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
  };
  useEffect(() => {
    updatePlanEdges();
    window.addEventListener('resize', updatePlanEdges);
    return () => window.removeEventListener('resize', updatePlanEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length, loading]);
  // one card per click — the card's real (container-relative) width + the gap
  const scrollPlans = (dir) => {
    const el = planRowRef.current;
    const cardW = el?.firstElementChild?.offsetWidth || SZ2.planCard.w;
    el?.scrollBy({ left: dir * (cardW + SP2.md), behavior: 'smooth' });
  };

  const shell = (children) => (
    <WizardPage
      propertyName={propertyName}
      unitLabel={unitLabel}
      current={3}
      subtitle="Choose where this listing appears and how it stands out to prospects."
    >
      {children}
    </WizardPage>
  );

  if (loading) {
    return shell(<div style={WZ.stateBox}>Loading promotion options…</div>);
  }

  if (loadError) {
    return shell(
      <div style={WZ.stateBox}>
        <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {loadError}</div>
      </div>
    );
  }

  const showArrows = plans.length > 1;

  return shell(
    <>
      <Grid layout="wideLeft">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={WZ.col}>

          {/* Distribution Channels */}
          <SectionCard
            icon="ti-stack-2"
            title="Distribution Channels"
            subtitle="Select where this listing will be published"
            pattern={false}
            decoration={<CornerArt />}
          >
            <div style={{ ...UI2.stack(SP2.sm), ...WZ.body }}>
              {channels.map(ch => (
                <div key={ch.id} style={S.channel(ch.isAvailable)}>
                  <span style={S.checkPad}>
                    <Checkbox checked={ch.checked} onChange={() => toggleChannel(ch.id)} disabled={!ch.isAvailable} />
                  </span>
                  <span style={S.chIcon}><i className={`ti ${ch.icon}`} aria-hidden="true" /></span>
                  <div style={UI2.minWidth0}>
                    <div style={S.chName}>
                      {ch.name}
                      {!ch.isAvailable && <span style={S.soon}>Coming Soon</span>}
                    </div>
                    {ch.desc && <p style={S.chDesc}>{ch.desc}</p>}
                  </div>
                </div>
              ))}
              {channels.length === 0 && <div style={UI2.emptyInline}>No distribution channels configured yet.</div>}
            </div>
          </SectionCard>

          {/* Promotion Plan */}
          <SectionCard
            icon="ti-speakerphone"
            title="Promotion Plan"
            subtitle="Boost visibility for this listing on the marketplace"
            pattern={false}
            decoration={<CornerArt />}
          >
            <div style={WZ.body}>
              {/* "Already Paid" standing entitlements (Phase 4, Session 49) — above the plans, since they're
                  the cheaper (already paid) option whenever they apply */}
              {subscriptions.length > 0 && (
                <div style={S.paidList}>
                  {subscriptions.map(sub => {
                    const planName = sub.plan_detail ? sub.plan_detail.name : `Plan #${sub.plan}`;
                    const selected = sub.id === selectedSubscriptionId;
                    const expiresLabel = new Date(sub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <button key={sub.id} type="button" style={S.paid(selected)} onClick={() => chooseSubscription(sub.id)} aria-pressed={selected}>
                        <span style={UI2.minWidth0}>
                          <span style={S.paidName}>
                            <i className="ti ti-rosette-discount-check" style={{ color: C2.primary }} aria-hidden="true" />
                            Already Paid — {planName}
                          </span>
                          <span style={{ ...WZ.hint, display: 'block' }}>Standing entitlement, purchased from My Services · Valid through {expiresLabel}</span>
                        </span>
                        <span style={S.paidState(selected)}>{selected ? '✓ Selected' : 'Use this'}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={S.planRow}>
                {showArrows && (
                  <button type="button" style={S.arrow(planEdges.left)} onClick={() => scrollPlans(-1)} disabled={!planEdges.left} aria-label="Previous plans">
                    <i className="ti ti-chevron-left" aria-hidden="true" />
                  </button>
                )}

                <div ref={planRowRef} style={S.planScroll} onScroll={updatePlanEdges}>
                  {plans.map(plan => {
                    const selected = plan.id === selectedPlanId && !selectedSubscriptionId;
                    return (
                      <div key={plan.id} style={S.plan} onClick={() => choosePlan(plan.id)} role="radio" aria-checked={selected}>
                        <div style={S.planArt} aria-hidden="true" />
                        <div style={S.planBody}>
                          {plan.tag && <span style={S.planTag}>{plan.tag}</span>}
                          <div style={S.planHead}>
                            {/* name + price on ONE line (Playfair), Details on the right */}
                            <span style={S.planLine}>
                              <span style={S.planName}>{plan.name}</span>
                              <span style={S.planPrice}><i className="ti ti-bolt" aria-hidden="true" />{plan.priceLabel}</span>
                              {plan.priceSuffix && <span style={S.planSuffix}>{plan.priceSuffix}</span>}
                            </span>
                            <span onClick={e => e.stopPropagation()}>
                              <TextLink onClick={() => setDetailsPlanId(plan.id)}>Details</TextLink>
                            </span>
                          </div>
                          {plan.desc && <p style={S.planDesc}>{plan.desc}</p>}
                          {plan.features.length > 0 && (
                            <div style={S.feats}>
                              {plan.features.map((f, i) => (
                                <div key={i} style={S.feat}><i className="ti ti-check" style={S.featIcon} aria-hidden="true" />{f}</div>
                              ))}
                            </div>
                          )}
                          <button
                            type="button" className="un2-btn" style={S.planBtn(selected)}
                            onClick={e => { e.stopPropagation(); choosePlan(plan.id); }}
                          >
                            {selected && <i className="ti ti-check" style={UI2.btnIcon} aria-hidden="true" />}
                            {selected ? 'Selected' : 'Select Plan'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {plans.length === 0 && <div style={UI2.emptyInline}>No promotion plans available for this listing.</div>}
                </div>

                {showArrows && (
                  <button type="button" style={S.arrow(planEdges.right)} onClick={() => scrollPlans(1)} disabled={!planEdges.right} aria-label="Next plans">
                    <i className="ti ti-chevron-right" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div style={S.cost}>
                <span style={S.costLabel}>Promotion Cost</span>
                <span>
                  <span style={S.costValue}>
                    {selectedSubscription
                      ? 'Already Paid'
                      : (selectedPlan.priceValue === 0 ? 'Free' : `$${selectedPlan.priceValue.toFixed(2)}`)}
                  </span>
                  {!selectedSubscription && selectedPlan.priceSuffix && <span style={S.costSuffix}>{selectedPlan.priceSuffix}</span>}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={WZ.col}>

          {/* Lead Contact */}
          <SectionCard icon="ti-user" title="Lead Contact" subtitle="Who receives inquiries from this listing" pattern={false}>
            <Grid layout="two" as="div" style={{ ...WZ.fields, ...WZ.body }}>
              <FormField label="Contact Name">
                <input className="un2-focus-ring" style={FIELD2.input} value={leadContact.contactName} onChange={e => setLeadContactField('contactName', e.target.value)} aria-label="Contact name" />
              </FormField>
              <FormField label="Contact Phone">
                <input className="un2-focus-ring" style={FIELD2.input} value={leadContact.contactPhone} onChange={e => setLeadContactField('contactPhone', e.target.value)} aria-label="Contact phone" />
              </FormField>
              <FormField label="Contact Email">
                <input className="un2-focus-ring" style={FIELD2.input} value={leadContact.contactEmail} onChange={e => setLeadContactField('contactEmail', e.target.value)} aria-label="Contact email" />
              </FormField>
              <FormField label="Preferred Contact Method">
                <SelectField label="Preferred contact method" options={CONTACT_METHODS} value={leadContact.preferredContactMethod} onChange={v => setLeadContactField('preferredContactMethod', v || 'Email')} />
              </FormField>
            </Grid>
          </SectionCard>

          {/* Showing Settings */}
          <SectionCard icon="ti-calendar" title="Showing Settings" pattern={false}>
            <div style={{ ...UI2.stack(SP2.lg), ...WZ.body }}>
              <div>
                <span style={WZ.group}>Showing Method</span>
                <div style={WZ.radios} role="radiogroup" aria-label="Showing method">
                  <RadioPill label="Self-Guided" on={showing.showingMethod === 'SELF_GUIDED'} onClick={() => setShowingField('showingMethod', 'SELF_GUIDED')} />
                  <RadioPill label="Scheduled" on={showing.showingMethod === 'SCHEDULED'} onClick={() => setShowingField('showingMethod', 'SCHEDULED')} />
                </div>
              </div>
              <FormField label="Showing Instructions" action={<AiAssist />}>
                <textarea
                  className="un2-focus-ring"
                  style={FIELD2.textarea}
                  placeholder="Add instructions for how prospects can view this property…"
                  value={showing.showingInstructions}
                  onChange={e => setShowingField('showingInstructions', e.target.value)}
                  aria-label="Showing instructions"
                />
              </FormField>
              <div>
                <span style={WZ.group}>Available Days</span>
                <div style={WZ.checks}>
                  {DAYS.map(([key, label]) => (
                    <Checkbox key={key} checked={showing.availableDays[key]} onChange={() => toggleDay(key)} label={label} />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Lead Preferences */}
          <SectionCard icon="ti-adjustments-horizontal" title="Lead Preferences" pattern={false} style={WZ.fill}>
            <div style={WZ.body}>
              <div style={S.prefRow}>
                <div>
                  <div style={WZ.strong}>Send automatic response</div>
                  <p style={WZ.hint}>Instant acknowledgement email to new inquiries</p>
                </div>
                <Switch on={leadPrefs.sendAutoResponse} onChange={() => toggleLeadPref('sendAutoResponse')} label="Send automatic response" />
              </div>
              <div style={WZ.rule} />
              <div style={S.prefRow}>
                <div>
                  <div style={WZ.strong}>Require pre-screening</div>
                  <p style={WZ.hint}>Income/move-in questions before contact is shared</p>
                </div>
                <Switch on={leadPrefs.requirePreScreening} onChange={() => toggleLeadPref('requirePreScreening')} label="Require pre-screening" />
              </div>
            </div>
          </SectionCard>
        </div>
      </Grid>

      <WizardFooter
        step={3}
        total={STEPS.length}
        note={saveError || undefined}
        onBack={handleBack}
        onSaveExit={handleSaveExit}
        onContinue={handleContinue}
        busy={saving}
      />

      {/* Plan details */}
      {detailsPlan && (
        <Modal
          title={`${detailsPlan.name} Plan`}
          eyebrow={detailsPlan.tag || undefined}
          onClose={() => setDetailsPlanId(null)}
          footer={(
            <>
              <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={() => setDetailsPlanId(null)}>Close</button>
              <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => { choosePlan(detailsPlan.id); setDetailsPlanId(null); }}>
                Select This Plan
              </button>
            </>
          )}
        >
          <div style={S.modalPrice}>
            {detailsPlan.priceLabel}
            {detailsPlan.priceSuffix && <span style={S.planSuffix}>{detailsPlan.priceSuffix}</span>}
          </div>
          {detailsPlan.features.length > 0 && (
            <div style={S.feats}>
              {detailsPlan.features.map((f, i) => (
                <div key={i} style={S.feat}><i className="ti ti-check" style={S.featIcon} aria-hidden="true" />{f}</div>
              ))}
            </div>
          )}
          {detailsPlan.finePrint && (
            <>
              <span style={S.fineLabel}>Fine Print</span>
              <div style={S.fine}>{detailsPlan.finePrint}</div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
