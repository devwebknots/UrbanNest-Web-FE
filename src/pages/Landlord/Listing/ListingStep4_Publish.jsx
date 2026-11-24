// src/pages/Landlord/Listing/ListingStep4_Publish.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Create Listing wizard — Step 4: Publish (final step)
//
// Wired to the real `listings` backend (Session 42 build + curl testing,
// Session 43 FE wiring). Reads the real Listing rollup (GET
// /listings/<pk>/ — nested amenities/neighborhood/media/terms/channels/
// lead-settings) to render the read-only summary and a Compliance &
// Validation checklist that mirrors the backend's own publish-time checks,
// then calls the real POST /listings/<pk>/publish/ on "Pay & Publish" —
// no payment gateway exists yet (see architecture doc §5), so a successful
// call here really does flip the listing ACTIVE.
//
// The Promotion Plan chosen on Step 3 isn't persisted anywhere until
// publish actually creates the ListingPromotionPurchase row, so it's
// carried forward via router state (`selectedPlanId`) rather than re-read
// from the listing itself.
//
// 2026-11-23 — REDESIGNED on Design System v2 (design: Downloads/image 105.png). Same frame as Steps 1–3
// (listingWizardV2.jsx). ALL data loading, checks, publishing and navigation is unchanged:
//   <Grid wideLeft>
//     left : Listing Preview (preview card: photo · price · title · address · bed / bath / sq ft │ 6 summary
//            items with icons) · Lead & Showing Summary (4 items) — each card has Edit → its step
//     right: Distribution & Promotion Summary (Published To chips · plan · cost · expiry) · Compliance &
//            Validation (light-blue ✓ = passed · red ! = needs attention + "Fix now" → its step) — no green anywhere
//   WizardFooter (sticky: TOTAL DUE TODAY │ ⓘ payment note / publish error · Back · Save & Exit · Pay & Publish)
//   Modal "Listing Published" after a successful publish (Done → unit page)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Grid } from '../../../components/layout';
import { SectionCard, CornerArt, WizardFooter, TextLink, SuccessModal } from '../../../components/ui';
import { C2, TONES2, F2, FS2, FW2, SP2, SZ2, R2, SH2, T2, UI2 } from '../../../constants';
import { WizardPage, WZ } from './listingWizardV2';
import { MIN_REQUIRED_PHOTOS } from './mockListingData';
import { getListing, getUnit, getPromotionPlanCatalog, publishListing } from './listingApi';
import { TEST_CASES } from '../../../testCases';
import photoPlaceholder from '../../../assets/landlord/unit-placeholder.jpg';

// ── Page-specific layout (tokens only) ──────────────────────────────────────
const S = {
  edit:      { ...UI2.btn.link },
  // Listing Preview — preview card │ summary items
  preview:   { alignItems: 'start' },                  // <Grid wideRight>: preview card │ summary items
  pCard:     { overflow: 'hidden', borderRadius: R2.xl, background: C2.white, boxShadow: SH2.card },
  pPhoto:    { position: 'relative', aspectRatio: `${SZ2.thumb.w} / ${SZ2.thumb.h}`, background: C2.surfaceMuted, backgroundSize: 'cover', backgroundPosition: 'center' },
  pBadge:    { ...UI2.pill(TONES2.primary, { solid: true }), position: 'absolute', top: SP2.sm, left: SP2.sm },
  pBody:     { padding: SP2.lg },
  pPrice:    { ...UI2.text.stat },
  pSuffix:   { ...UI2.text.label, marginLeft: SP2.xs },
  pTitle:    { ...UI2.text.titleLg, marginTop: SP2.xs },
  pAddr:     { ...UI2.row(SP2.xs), alignItems: 'flex-start', ...UI2.text.label, marginTop: SP2.sm },
  // bed · bath · sq ft ALWAYS on one row (also on phones), nothing clipped: text + gaps scale with the CARD's width
  // (container query units — the card is a un2-cq container): 13px when there's room, down to 10px on a narrow card
  pMeta:     { ...UI2.row(`clamp(${SP2.xs}px, 3cqi, ${SP2.md}px)`), flexWrap: 'nowrap', minWidth: 0, marginTop: SP2.md, paddingTop: SP2.md, borderTop: `${SZ2.hairline}px solid ${C2.divider}`, fontSize: `clamp(${FS2.xxs}px, 4.6cqi, ${FS2.base}px)`, color: C2.textPrimary },
  pMetaItem: { ...UI2.row(SP2.xs), flexShrink: 0, whiteSpace: 'nowrap' },
  pMetaIcon: { color: C2.textSecondary, fontSize: '1.1em', flexShrink: 0 },   // scales with the row text
  // summary item: icon · label … value
  items:     { columnGap: SP2.xl, rowGap: 0 },
  item:      { ...UI2.row(SP2.sm), justifyContent: 'space-between', padding: `${SP2.md}px 0`, borderBottom: `${SZ2.hairline}px solid ${C2.divider}`, minWidth: 0 },
  itemL:     { ...UI2.row(SP2.sm), ...UI2.text.label, fontSize: FS2.base, minWidth: 0 },
  itemIcon:  { fontSize: FS2.lg, color: C2.textSecondary, flexShrink: 0 },
  itemV:     (muted) => ({ fontSize: FS2.base, fontWeight: muted ? FW2.regular : FW2.medium, color: muted ? C2.textMuted : C2.textPrimary, textAlign: 'right', flexShrink: 0 }),
  // Distribution & Promotion rows
  kv:        (first) => ({ ...UI2.kvRow(first), fontSize: FS2.base }),
  kvVal:     { ...UI2.kvVal, fontSize: FS2.base },
  chips:     { display: 'flex', gap: SP2.xs, flexWrap: 'wrap', justifyContent: 'flex-end' },
  chip:      { ...UI2.pill(TONES2.primary) },
  chipNone:  { ...UI2.pill(TONES2.neutral) },
  // Compliance checks
  check:     (last) => ({ display: 'flex', alignItems: 'flex-start', gap: SP2.md, padding: `${SP2.md}px 0`, ...(last ? {} : { borderBottom: `${SZ2.hairline}px solid ${C2.divider}` }) }),
  // SOFT badge (pale tint + coloured glyph) — deliberately different from the stepper's solid ✓ circles:
  // passed = pale blue + blue ✓ · needs attention = pale red + red !
  checkIcon: (ok) => ({ ...UI2.iconBox(SZ2.icon.sm, ok ? TONES2.primary : TONES2.error, { round: true }), fontSize: FS2.md }),
  checkT:    (ok) => ({ ...UI2.text.title, color: ok ? C2.textPrimary : C2.errorDark }),
  // Footer — total due today
  total:     { ...UI2.row(SP2.lg) },
  totalLbl:  { ...UI2.capsLabel, display: 'block' },
  totalVal:  { ...T2.kpiValue, fontFamily: F2.heading, fontWeight: FW2.semibold },   // 20 · Playfair · 600 — same as the Step 3 promotion cost
};

// Summary item — icon · label on the left, value on the right (muted when it's a "not set" placeholder)
function Item({ icon, label, value, muted = false }) {
  return (
    <div style={S.item}>
      <span style={S.itemL}><i className={`ti ${icon}`} style={S.itemIcon} aria-hidden="true" /><span style={UI2.truncate}>{label}</span></span>
      <span style={S.itemV(muted)}>{value}</span>
    </div>
  );
}

const fmtMoney = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

export default function ListingStep4_Publish() {
  const { id: propId, uid: unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const listingId = location.state?.listingId ?? null;
  const propertyNameFromState = location.state?.propertyName;
  // Phase 4 (Session 49) — set when Step 3 picked "Already Paid" (an owned
  // ListingPromotionSubscription) instead of a fresh plan. Mutually
  // exclusive with selectedPlanId — see ListingStep3_Promote.jsx's
  // choosePlan/chooseSubscription.
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
      navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-3`, { replace: true });
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

  const shell = (children) => (
    <WizardPage
      propertyName={propertyNameFromState || unit?.property?.name || 'Property'}
      unitLabel={unit ? `Unit ${unit.unit_number}` : `Unit ${unitId}`}
      current={4}
      subtitle="Confirm everything looks right before this listing goes live."
    >
      {children}
    </WizardPage>
  );

  if (loading) {
    return shell(<div style={WZ.stateBox}>Loading listing summary…</div>);
  }

  if (loadError || !listing || !unit) {
    return shell(
      <div style={WZ.stateBox}>
        <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {loadError || 'This listing could not be loaded.'}</div>
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
  // Phase 4 (Session 49) — "Already Paid" means $0 due regardless of the
  // underlying plan's own price, and the publish call sends subscription_id
  // instead of plan_id (see handlePublish below).
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
  // backend's real semantics. (Same fix applied to PMListingStep4_Publish.jsx.)
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
    navigate(`/landlord-portal/property/${propId}/unit/${unitId}/list/step-${step}`, {
      state: { listingId, propertyName },
    });
  };

  const handleBack = () => goToStep(3);
  const handleSaveExit = () => navigate(`/landlord-portal/property/${propId}/unit/${unitId}`);

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
  // — reported directly by the user during live testing (of the PM Portal
  // twin of this file) as disorienting ("shows the full page"). Now a small
  // popup over the still-visible Step 4 page instead, naming the property/
  // unit, with a single "Done" button that goes back to the unit page (same
  // destination Save & Exit already used) — see the popup render, inserted
  // as a sibling of ListingPageShell further down, right before the
  // component's closing brace. Mirrors the identical fix in
  // PMListingStep4_Publish.jsx.
  const handleDone = () => navigate(`/landlord-portal/property/${propId}/unit/${unitId}`);

  // ── v2 render ────────────────────────────────────────────────────────────
  // Preview photo: the listing's cover photo (media rows point at the unit's gallery items — same source Step 2
  // selects from), else the first selected photo, else the placeholder.
  const gallery = unit.gallery_images || [];
  const photoMedia = media.filter(m => m.media_type === 'PHOTO');
  const coverMedia = photoMedia.find(m => m.is_cover) || photoMedia[0];
  const coverUrl = coverMedia ? (gallery.find(g => g.id === coverMedia.source_gallery_item)?.file_url || null) : null;

  const totalLabel = amountDueToday === 0 ? (selectedSubscriptionId ? 'Already Paid' : 'Free') : `$${amountDueToday.toFixed(2)}`;

  const editLink = (step) => (
    <button type="button" style={S.edit} onClick={() => goToStep(step)}>
      <i className="ti ti-pencil" style={UI2.btnIcon} aria-hidden="true" /> Edit
    </button>
  );

  return shell(
    <>
      <Grid layout="wideLeft">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={WZ.col}>

          {/* Listing Preview */}
          <SectionCard
            icon="ti-eye"
            title="Listing Preview"
            subtitle="How this will appear to prospects on the marketplace"
            action={editLink(2)}
            pattern={false}
            decoration={<CornerArt />}
          >
            <Grid layout="wideRight" as="div" style={{ ...S.preview, ...WZ.body }}>
              {/* marketplace card */}
              <div className="un2-cq" style={S.pCard}>
                <div style={{ ...S.pPhoto, backgroundImage: `url(${coverUrl || photoPlaceholder})` }}>
                  {badgeLabel && <span style={S.pBadge}>{badgeLabel}</span>}
                </div>
                <div style={S.pBody}>
                  <div>
                    <span style={S.pPrice}>{priceValue ? fmtMoney(priceValue) : '—'}</span>
                    {priceSuffix && <span style={S.pSuffix}>{priceSuffix}</span>}
                  </div>
                  <div style={S.pTitle}>{listing.title || 'Untitled Listing'}</div>
                  <div style={S.pAddr}>
                    <i className="ti ti-map-pin" style={S.pMetaIcon} aria-hidden="true" />
                    <span>
                      {addressLine1 && <span style={{ display: 'block' }}>{addressLine1}</span>}
                      {addressLine2 && <span style={{ display: 'block' }}>{addressLine2}</span>}
                      {!addressLine1 && !addressLine2 && '—'}
                    </span>
                  </div>
                  <div style={S.pMeta}>
                    <span style={S.pMetaItem}><i className="ti ti-bed" style={S.pMetaIcon} aria-hidden="true" />{unit.total_rooms ?? '—'} bed</span>
                    <span style={S.pMetaItem}><i className="ti ti-bath" style={S.pMetaIcon} aria-hidden="true" />{unit.total_baths ?? '—'} bath</span>
                    <span style={S.pMetaItem}><i className="ti ti-ruler-2" style={S.pMetaIcon} aria-hidden="true" />{unit.total_area ? `${Number(unit.total_area)} sq ft` : '—'}</span>
                  </div>
                </div>
              </div>

              {/* summary items */}
              <Grid layout="two" as="div" style={S.items}>
                <Item icon="ti-building" label="Listing Type" value={listingType === 'RENT' ? 'For Rent' : 'For Sale'} />
                <Item icon="ti-calendar" label="Available Date" value={availableDateDisplay || 'Not set'} muted={!availableDateDisplay} />
                <Item icon="ti-photo" label="Photos" value={`${selectedPhotoCount} selected`} />
                <Item icon="ti-stack-2" label="Floor Plan" value={unit.floor_plan_name || 'Not set'} muted={!unit.floor_plan_name} />
                <Item icon="ti-player-play" label="Video / Virtual Tour" value={hasVideoOrTour ? 'Added' : 'Not added'} muted={!hasVideoOrTour} />
                <Item icon="ti-star" label="Highlights" value={highlightsText} muted={!listing.highlights?.length} />
              </Grid>
            </Grid>
          </SectionCard>

          {/* Lead & Showing Summary */}
          <SectionCard
            icon="ti-headset"
            title="Lead & Showing Summary"
            action={editLink(3)}
            pattern={false}
            style={WZ.fill}
            decoration={<CornerArt />}
          >
            <Grid layout="two" as="div" style={{ ...S.items, ...WZ.body }}>
              <Item icon="ti-user" label="Contact" value={`${leadSettings.contact_name || '—'} · ${leadSettings.preferred_contact_method === 'PHONE' ? 'Phone' : 'Email'}`} />
              <Item icon="ti-calendar-event" label="Showing Method" value={leadSettings.showing_method === 'SCHEDULED' ? 'Scheduled' : 'Self-Guided'} />
              <Item icon="ti-calendar" label="Available Days" value={formatAvailableDays(leadSettings.available_days)} />
              <Item icon="ti-bolt" label="Auto-Response" value={leadSettings.auto_response ? 'Enabled' : 'Disabled'} muted={!leadSettings.auto_response} />
            </Grid>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={WZ.col}>

          {/* Distribution & Promotion Summary */}
          <SectionCard icon="ti-speakerphone" title="Distribution & Promotion Summary" action={editLink(3)} pattern={false}>
            <div style={WZ.body}>
              <div style={S.kv(true)}>
                <span>Published To</span>
                {channelSelections.length > 0 ? (
                  <span style={S.chips}>
                    {channelSelections.map(cs => (
                      <span key={cs.id} style={S.chip}><i className="ti ti-check" aria-hidden="true" />{cs.channel_detail?.name}</span>
                    ))}
                  </span>
                ) : (
                  <span style={S.chipNone}>None selected</span>
                )}
              </div>
              <div style={S.kv(false)}><span>Promotion Plan</span><span style={S.kvVal}>{plan.name} ({plan.durationDays} days)</span></div>
              <div style={S.kv(false)}><span>Promotion Cost</span><span style={S.kvVal}>{plan.priceValue === 0 ? 'Free' : `$${plan.priceValue.toFixed(2)}`}</span></div>
              <div style={S.kv(false)}><span>Listing Expires</span><span style={S.kvVal}>{expiryDateFromToday(plan.durationDays)}</span></div>
            </div>
          </SectionCard>

          {/* Compliance & Validation */}
          <SectionCard
            icon="ti-shield-check"
            tone={hasBlockingIssues ? TONES2.error : TONES2.primary}
            title="Compliance & Validation"
            subtitle="All items must be resolved before this listing can go live"
            pattern={false}
            style={WZ.fill}
          >
            <div style={WZ.body}>
              {checks.map((c, i) => {
                const ok = c.status === 'ok';
                return (
                  <div key={i} style={S.check(i === checks.length - 1)}>
                    <span style={S.checkIcon(ok)}><i className={`ti ${ok ? 'ti-check' : 'ti-exclamation-mark'}`} aria-hidden="true" /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.checkT(ok)}>{c.title}</div>
                      {c.sub && <div style={WZ.hint}>{c.sub}</div>}
                    </div>
                    {!ok && c.fixStep && <TextLink onClick={() => goToStep(c.fixStep)}>Fix now</TextLink>}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </Grid>

      <WizardFooter
        left={(
          <span style={S.total}>
            <span>
              <span style={S.totalLbl}>Total Due Today</span>
              <span style={S.totalVal}>{totalLabel}</span>
            </span>
          </span>
        )}
        note={publishError || undefined}
        info="Payment failure keeps this listing in Draft — nothing publishes until payment succeeds."
        onBack={handleBack}
        onSaveExit={handleSaveExit}
        onContinue={handlePublish}
        continueLabel="Pay & Publish"
        continueIcon={null}
        busy={publishing}
        busyLabel="Publishing…"
        continueDisabled={hasBlockingIssues || published}
      />

      {/* Published — a small popup over the still-visible Step 4 page (Session 47 fix), Done → unit page */}
      {(published || TEST_CASES.showListingPublishedModal) && (
        <SuccessModal
          title={amountDueToday > 0 ? "Payment successful — you're live!" : 'Listing published!'}
          message={`${propertyName} · Unit ${unit.unit_number} is now live on the marketplace.`}
          item={{
            image: coverUrl, fallback: photoPlaceholder, status: 'Live',
            name: `${propertyName} · Unit ${unit.unit_number}`,
            sub: priceValue ? `${Number(priceValue).toLocaleString()}${priceSuffix ? ` ${priceSuffix}` : ''}` : (addressLine1 || addressLine2),
          }}
          details={[
            { label: 'Promotion plan', value: `${plan.name} (${plan.durationDays} days)` },
            { label: amountDueToday > 0 ? 'Amount paid' : 'Cost', value: totalLabel, strong: true },
            publishedListing?.expires_at && { label: 'Live until', value: formatDateTime(publishedListing.expires_at) },
          ].filter(Boolean)}
          secondary={{ label: 'All listings', icon: 'ti-list-details', onClick: () => navigate('/landlord-portal/listings') }}
          primary={{ label: 'View unit', icon: 'ti-arrow-right', onClick: handleDone }}
          onClose={handleDone}
        />
      )}
    </>
  );
}
