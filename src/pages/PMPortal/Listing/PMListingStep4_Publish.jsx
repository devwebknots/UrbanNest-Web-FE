// src/pages/PMPortal/Listing/PMListingStep4_Publish.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// PM Portal — Create Listing wizard — Step 4: Publish (final step)
//
// Session 47 — Independent PM / Org PM Listing capability. A deliberate
// duplicate of the Landlord wizard's Step 4 (`ListingStep4_Publish.jsx`),
// not a persona-prop extension — see pmListingWizardShared.jsx's header
// comment for why. Route params use PM Portal's naming (`unitId`, not
// `uid`) and the shell/tokens come from ./pmListingWizardShared and
// ./pmListingTokens. `listingApi.js` and `mockListingData.js` are
// portal-agnostic and reused as-is via cross-folder imports — no logic is
// duplicated, only the shell/route wiring.
//
// Same real-backend wiring as Landlord's Step 4: reads the Listing rollup
// (GET /listings/<pk>/), renders the read-only summary + Compliance &
// Validation checklist mirroring the backend's own publish-time checks,
// then calls POST /listings/<pk>/publish/ on "Pay & Publish" — no payment
// gateway exists yet, so a successful call here really does flip the
// listing ACTIVE. The Promotion Plan chosen on Step 3 is carried forward
// via router state (`selectedPlanId`) since publish is what actually
// persists it (ListingPromotionPurchase row).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from './pmListingTokens';
import { LS, ListingPageShell, ListingFooter, SectionHead } from './pmListingWizardShared';
import { MIN_REQUIRED_PHOTOS } from '../../Landlord/Listing/mockListingData';
import { getListing, getUnit, getPromotionPlanCatalog, publishListing } from '../../Landlord/Listing/listingApi';

const WEEKDAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' };

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function expiryDateFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAvailableDays(list) {
  const selected = WEEKDAY_ORDER.filter(k => (list || []).map(v => String(v).toUpperCase()).includes(k));
  if (selected.length === 0) return 'None selected';
  const isMonFri = ['MON', 'TUE', 'WED', 'THU', 'FRI'].every(k => selected.includes(k)) && !selected.includes('SAT') && !selected.includes('SUN');
  if (isMonFri) return 'Mon – Fri';
  if (selected.length === 7) return 'Every day';
  return selected.map(k => DAY_LABELS[k]).join(', ');
}

function planForDisplay(plan) {
  const priceValue = Number(plan.price) || 0;
  return {
    id: plan.id,
    name: plan.name,
    priceValue,
    durationDays: plan.duration_days,
  };
}

export default function PMListingStep4_Publish() {
  const { id: propId, unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const listingId = location.state?.listingId ?? null;
  const propertyNameFromState = location.state?.propertyName;
  // AU-2 (Session 49, PM Portal extension) — set when Step 3 picked
  // "Already Paid" (an owned ListingPromotionSubscription) instead of a
  // fresh plan. Mutually exclusive with selectedPlanId — see
  // PMListingStep3_Promote.jsx's choosePlan/chooseSubscription.
  const selectedSubscriptionId = location.state?.selectedSubscriptionId ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [published, setPublished] = useState(false);
  const [publishedListing, setPublishedListing] = useState(null);

  const [listing, setListing] = useState(null);
  const [unit, setUnit] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!listingId) {
      navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-3`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [listingData, unitData, planCatalog] = await Promise.all([
          getListing(listingId),
          getUnit(propId, unitId),
          getPromotionPlanCatalog(),
        ]);
        if (cancelled) return;

        setListing(listingData);
        setUnit(unitData);

        const displayPlans = (planCatalog || []).map(planForDisplay);
        const requestedId = location.state?.selectedPlanId;
        const plan = displayPlans.find(p => p.id === requestedId)
          || displayPlans.find(p => planCatalog.find(pc => pc.id === p.id)?.is_default)
          || displayPlans[0]
          || null;
        setSelectedPlan(plan);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Could not load this listing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propId, unitId, listingId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: C.txtSec }}>
        Loading listing summary…
      </div>
    );
  }

  if (loadError || !listing || !unit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 10, color: C.txtSec }}>
        <div>{loadError || 'This listing could not be loaded.'}</div>
      </div>
    );
  }

  const property = unit.property || {};
  const listingType = listing.listing_type || 'RENT';
  const rentalTerms = listing.rental_terms || {};
  const saleTerms = listing.sale_terms || {};
  const leadSettings = listing.lead_settings || {};
  const media = listing.media || [];
  const channelSelections = listing.channel_selections || [];

  const selectedPhotoCount = media.filter(m => m.media_type === 'PHOTO').length;
  const priceValue = listingType === 'RENT' ? rentalTerms.rent_amount : saleTerms.asking_price;
  const priceSuffix = listingType === 'RENT' ? '/ month' : '';
  // Rendered as two lines in the preview card: street address, then city/state/zip.
  const addressLine1 = property.street1 || '';
  const addressLine2 = [property.city, [property.state, property.zip_code].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  const availableDateDisplay = listingType === 'SALE'
    ? formatDate(saleTerms.available_date)
    : formatDate(listing.available_date);

  const highlightsText = listing.highlights?.length ? listing.highlights.join(', ') : 'None added';
  const hasVideoOrTour = Boolean(listing.video_url || listing.virtual_tour_url);
  const propertyName = propertyNameFromState || property.name || 'Property';

  const plan = selectedPlan || { name: 'Basic', priceValue: 0, durationDays: 30 };
  // AU-2 (Session 49, PM Portal extension) — "Already Paid" means $0 due
  // regardless of the underlying plan's own price, and the publish call
  // sends subscription_id instead of plan_id (see handlePublish below).
  const amountDueToday = selectedSubscriptionId ? 0 : plan.priceValue;
  const badgeLabel = selectedSubscriptionId ? `${plan.name} (Already Paid)` : (plan.priceValue > 0 ? plan.name : null);

  // ── Compliance & Validation — mirrors the backend's own publish-time checks ──
  // Session 47 fix: was Boolean(rentalTerms.security_deposit) /
  // Boolean(saleTerms.asking_price). ListingRentalTermsView/ListingSaleTermsView
  // get_or_create these rows with a numeric default of 0 the first time the
  // wizard touches Step 2 — DRF serializes that Decimal(0) as the STRING
  // "0.00", and Boolean("0.00") is true in JS (any non-empty string is
  // truthy), so this check silently showed "Security deposit set"/"Asking
  // price set" as passed even when the value was still genuinely 0/unset.
  // The backend's own gate (rules_engine/listing_readiness/evaluators.py
  // _eval_listing_terms_complete) never had this bug — it checks a real
  // Python Decimal, where bool(Decimal('0.00')) is correctly False — so
  // publishing was never actually let through on a zero deposit/price; only
  // this checklist's display was wrong. Numeric comparison matches the
  // backend's real semantics.
  const requiredFieldOk = listingType === 'RENT' ? Number(rentalTerms.security_deposit) > 0 : Number(saleTerms.asking_price) > 0;
  const requiredFieldCheck = {
    status: requiredFieldOk ? 'ok' : 'warn',
    title: requiredFieldOk
      ? (listingType === 'RENT' ? 'Security deposit set' : 'Asking price set')
      : 'Attention Required',
    sub: requiredFieldOk
      ? null
      : (listingType === 'RENT'
        ? 'Security deposit not set — required for Rent listings before publishing.'
        : 'Asking price not set — required for Sale listings before publishing.'),
    fixStep: 2,
  };

  const photosOk = selectedPhotoCount >= MIN_REQUIRED_PHOTOS;
  const photosCheck = {
    status: photosOk ? 'ok' : 'warn',
    title: photosOk ? 'Minimum photo count met' : 'Attention Required',
    sub: photosOk
      ? `${selectedPhotoCount} of ${MIN_REQUIRED_PHOTOS} required photos selected`
      : `Only ${selectedPhotoCount} of ${MIN_REQUIRED_PHOTOS} required photos selected — add more before publishing.`,
    fixStep: 2,
  };

  const contactOk = Boolean(leadSettings.contact_name && leadSettings.contact_phone && leadSettings.contact_email);
  const contactCheck = {
    status: contactOk ? 'ok' : 'warn',
    title: contactOk ? 'Lead contact information complete' : 'Attention Required',
    sub: contactOk ? null : 'Contact name, phone, and email are all required before publishing.',
    fixStep: 3,
  };

  const checks = [
    {
      status: 'ok',
      title: 'Ownership verified for this unit',
      sub: 'Confirmed when this unit was originally submitted — re-checked by the server at publish time.',
      fixStep: null,
    },
    photosCheck,
    requiredFieldCheck,
    contactCheck,
  ];
  const hasBlockingIssues = checks.some(c => c.status === 'warn');

  const goToStep = (step) => {
    navigate(`/pm-portal/properties/${propId}/units/${unitId}/list/step-${step}`, {
      state: { listingId, propertyName },
    });
  };

  const handleBack = () => goToStep(3);
  const handleSaveExit = () => navigate(`/pm-portal/properties/${propId}/units/${unitId}`);

  const handlePublish = async () => {
    if (hasBlockingIssues || !plan) return;
    setPublishError('');
    setPublishing(true);
    try {
      const result = await publishListing(listingId, plan.id, { subscriptionId: selectedSubscriptionId });
      setPublishedListing(result);
      setPublished(true);
    } catch (e) {
      setPublishError(e.message || 'Could not publish this listing.');
    } finally {
      setPublishing(false);
    }
  };

  // Session 47 fix: this used to be a second, full-page render (an early
  // return swapping the ENTIRE Step 4 page for a near-empty success screen)
  // — reported directly by the user during live testing as disorienting
  // ("shows the full page"). Now a small popup over the still-visible Step 4
  // page instead, naming the property/unit, with a single "Done" button
  // that goes back to the unit page (same destination Save & Exit already
  // used) — see the PublishedModal render, inserted as a sibling of
  // ListingPageShell further down, right before the component's closing
  // brace.
  const handleDone = () => navigate(`/pm-portal/properties/${propId}/units/${unitId}`);

  return (
    <>
    <ListingPageShell
      propertyName={propertyName}
      unitLabel={`Unit ${unit.unit_number}`}
      current={4}
      pageSub="Confirm everything looks right before this listing goes live."
      footer={
        <ListingFooter
          current={4}
          onBack={handleBack}
          onSaveExit={handleSaveExit}
          onContinue={handlePublish}
          continueLabel={publishing ? 'Publishing…' : 'Pay & Publish'}
          continueDisabled={hasBlockingIssues || publishing || published}
          leftContent={
            <>
              <span style={LS.footerTotalLbl}>Total Due Today</span>
              <span style={LS.footerTotalVal}>{amountDueToday === 0 ? (selectedSubscriptionId ? 'Already Paid' : 'Free') : `$${amountDueToday.toFixed(2)}`}</span>
            </>
          }
          noteContent={publishError || 'Payment failure keeps this listing in Draft — nothing publishes until payment succeeds.'}
        />
      }
    >
      <div style={LS.split}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={LS.splitCol}>

          {/* Listing Preview */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-eye"
              bg={C.blueLight}
              color={C.blue}
              title="Listing Preview"
              note="How this will appear to prospects on the marketplace"
              action={
                <span style={LS.editLink} onClick={() => goToStep(2)}>
                  <i className="ti ti-pencil" aria-hidden="true" />Edit
                </span>
              }
            />
            <div style={LS.previewWrap}>
              <div style={LS.previewCard}>
                <div style={LS.previewImg}>
                  {badgeLabel && <span style={LS.previewBadge}>{badgeLabel}</span>}
                  <i className="ti ti-photo" style={{ fontSize: 28, color: 'rgba(255,255,255,0.75)' }} aria-hidden="true" />
                </div>
                <div style={LS.previewBody}>
                  <div style={LS.previewPrice}>
                    {priceValue ? `$${priceValue}` : '—'}
                    {priceSuffix && <span style={LS.previewPriceSub}> {priceSuffix}</span>}
                  </div>
                  <div style={LS.previewTitle}>{listing.title || 'Untitled Listing'}</div>
                  <div style={LS.previewAddr}>
                    {addressLine1 && <div>{addressLine1}</div>}
                    {addressLine2 && <div>{addressLine2}</div>}
                    {!addressLine1 && !addressLine2 && '—'}
                  </div>
                  <div style={LS.previewMeta}>
                    <span style={LS.previewMetaItem}><i className="ti ti-bed" style={{ fontSize: 12, color: C.txtMuted }} aria-hidden="true" />{unit.total_rooms ?? '—'} bed</span>
                    <span style={LS.previewMetaItem}><i className="ti ti-bath" style={{ fontSize: 12, color: C.txtMuted }} aria-hidden="true" />{unit.total_baths ?? '—'} bath</span>
                    <span style={LS.previewMetaItem}><i className="ti ti-ruler-2" style={{ fontSize: 12, color: C.txtMuted }} aria-hidden="true" />{unit.total_area ? `${unit.total_area} sq ft` : '—'}</span>
                  </div>
                </div>
              </div>
              <div style={LS.summaryCols(false)}>
                <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Listing Type</span><span style={LS.summaryVal(false)}>{listingType === 'RENT' ? 'For Rent' : 'For Sale'}</span></div>
                <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Available Date</span><span style={LS.summaryVal(!availableDateDisplay)}>{availableDateDisplay || 'Not set'}</span></div>
                <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Photos</span><span style={LS.summaryVal(false)}>{selectedPhotoCount} selected</span></div>
                <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Floor Plan</span><span style={LS.summaryVal(!unit.floor_plan_name)}>{unit.floor_plan_name || 'Not set'}</span></div>
                <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Video / Virtual Tour</span><span style={LS.summaryVal(!hasVideoOrTour)}>{hasVideoOrTour ? 'Added' : 'Not added'}</span></div>
                <div style={LS.summaryRow(true)}><span style={LS.summaryLbl}>Highlights</span><span style={LS.summaryVal(!listing.highlights?.length)}>{highlightsText}</span></div>
              </div>
            </div>
          </div>

          {/* Lead & Showing Summary */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-headset"
              bg={C.greenLight}
              color={C.green}
              title="Lead & Showing Summary"
              action={
                <span style={LS.editLink} onClick={() => goToStep(3)}>
                  <i className="ti ti-pencil" aria-hidden="true" />Edit
                </span>
              }
            />
            <div style={LS.summaryCols(false)}>
              <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Contact</span><span style={LS.summaryVal(false)}>{leadSettings.contact_name || '—'} · {leadSettings.preferred_contact_method === 'PHONE' ? 'Phone' : 'Email'}</span></div>
              <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Showing Method</span><span style={LS.summaryVal(false)}>{leadSettings.showing_method === 'SCHEDULED' ? 'Scheduled' : 'Self-Guided'}</span></div>
              <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Available Days</span><span style={LS.summaryVal(false)}>{formatAvailableDays(leadSettings.available_days)}</span></div>
              <div style={LS.summaryRow(true)}><span style={LS.summaryLbl}>Auto-Response</span><span style={LS.summaryVal(!leadSettings.auto_response)}>{leadSettings.auto_response ? 'Enabled' : 'Disabled'}</span></div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={LS.splitCol}>

          {/* Distribution & Promotion Summary */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-share"
              bg={C.blueLight}
              color={C.blue}
              title="Distribution & Promotion Summary"
              action={
                <span style={LS.editLink} onClick={() => goToStep(3)}>
                  <i className="ti ti-pencil" aria-hidden="true" />Edit
                </span>
              }
            />
            <div style={LS.summaryCols(true)}>
              <div style={LS.summaryRow(false)}>
                <span style={LS.summaryLbl}>Published To</span>
                {channelSelections.length > 0 ? (
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {channelSelections.map(cs => (
                      <span key={cs.id} style={LS.channelTag(true)}><i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />{cs.channel_detail?.name}</span>
                    ))}
                  </span>
                ) : (
                  <span style={LS.channelTag(false)}>None selected</span>
                )}
              </div>
              <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Promotion Plan</span><span style={LS.summaryVal(false)}>{plan.name} ({plan.durationDays} days)</span></div>
              <div style={LS.summaryRow(false)}><span style={LS.summaryLbl}>Promotion Cost</span><span style={LS.summaryVal(false)}>{plan.priceValue === 0 ? 'Free' : `$${plan.priceValue.toFixed(2)}`}</span></div>
              <div style={LS.summaryRow(true)}><span style={LS.summaryLbl}>Listing Expires</span><span style={LS.summaryVal(false)}>{expiryDateFromToday(plan.durationDays)}</span></div>
            </div>
          </div>

          {/* Compliance & Validation */}
          <div style={LS.card}>
            <SectionHead
              icon="ti-alert-triangle"
              bg={C.amberLight}
              color={C.amber}
              title="Compliance & Validation"
              note="All items must be resolved before this listing can go live"
            />
            <div style={LS.checkList}>
              {checks.map((c, i) => (
                <div key={i} style={LS.checkItem(i === checks.length - 1)}>
                  <div style={LS.checkIcon(c.status)}>
                    <i className={`ti ${c.status === 'ok' ? 'ti-check' : 'ti-exclamation-mark'}`} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={LS.checkTitle(c.status)}>{c.title}</div>
                    {c.sub && <div style={LS.checkSub}>{c.sub}</div>}
                  </div>
                  {c.status === 'warn' && c.fixStep && (
                    <span style={LS.checkFix} onClick={() => goToStep(c.fixStep)}>
                      Fix now<i className="ti ti-arrow-right" style={{ fontSize: 10 }} aria-hidden="true" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </ListingPageShell>

    {published && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
        <div style={{ ...LS.card, width: 400, maxWidth: '90vw', margin: 0, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.greenLight, color: C.greenDark, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20 }}>
            <i className="ti ti-check" aria-hidden="true" />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: C.txtPrimary, margin: '0 0 6px' }}>Listing Published</p>
          <p style={{ fontSize: 13, color: C.txtSec, margin: '0 0 4px' }}>
            {propertyName} · Unit {unit.unit_number} is now live on the marketplace.
          </p>
          {publishedListing?.expires_at && (
            <p style={{ fontSize: 12, color: C.txtMuted, margin: '0 0 16px' }}>Runs through {formatDateTime(publishedListing.expires_at)}</p>
          )}
          <button
            onClick={handleDone}
            style={{ ...LS.btn, ...LS.btnPrimary, width: '100%', marginTop: 6, justifyContent: 'center' }}
          >
            Done
          </button>
        </div>
      </div>
    )}
    </>
  );
}
