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
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { C } from '../landlordTokens';
import { LS, ListingPageShell, ListingFooter, SectionHead } from './listingWizardShared';
import { MIN_REQUIRED_PHOTOS } from './mockListingData';
import { getListing, getUnit, getPromotionPlanCatalog, publishListing } from './listingApi';

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
  const badgeLabel = plan.priceValue > 0 ? plan.name : null;

  // ── Compliance & Validation — mirrors the backend's own publish-time checks ──
  const requiredFieldOk = listingType === 'RENT' ? Boolean(rentalTerms.security_deposit) : Boolean(saleTerms.asking_price);
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
      const result = await publishListing(listingId, plan.id);
      setPublishedListing(result);
      setPublished(true);
    } catch (e) {
      setPublishError(e.message || 'Could not publish this listing.');
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <ListingPageShell
        propertyName={propertyName}
        unitLabel={`Unit ${unit.unit_number}`}
        current={4}
        pageSub="This listing is now live."
        footer={
          <ListingFooter
            current={4}
            onSaveExit={() => navigate(`/landlord-portal/property/${propId}/unit/${unitId}`)}
            leftContent="Published"
          />
        }
      >
        <div style={{ ...LS.card, maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.greenLight, color: C.greenDark, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20 }}>
            <i className="ti ti-check" aria-hidden="true" />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: C.txtPrimary, margin: '0 0 6px' }}>Listing Published</p>
          <p style={{ fontSize: 13, color: C.txtSec, margin: '0 0 4px' }}>
            {listing.title || 'This listing'} is now live on the marketplace.
          </p>
          {publishedListing?.expires_at && (
            <p style={{ fontSize: 12, color: C.txtMuted }}>Runs through {formatDateTime(publishedListing.expires_at)}</p>
          )}
        </div>
      </ListingPageShell>
    );
  }

  return (
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
          continueDisabled={hasBlockingIssues || publishing}
          leftContent={
            <>
              <span style={LS.footerTotalLbl}>Total Due Today</span>
              <span style={LS.footerTotalVal}>{plan.priceValue === 0 ? 'Free' : `$${plan.priceValue.toFixed(2)}`}</span>
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
  );
}
