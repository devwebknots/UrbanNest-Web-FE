// src/pages/PMPortal/AccountSettings/PMSubscriptionPage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// PM Portal (Independent PM) — Subscription & Billing / Services
// Routes:  /pm-portal/account/subscription, /pm-portal/account/services
//
// Session 49, full functional parity round. Built on top of the Phase 3
// version of this page (plans/subscription data layer, already real) —
// this round closes the two real gaps flagged in the earlier comparison
// against src/pages/Landlord/Account Settings/LandlordSettingsPage.jsx:
//
//   1. Subscribe now goes through the shared Payment Cart
//      (PaymentCartContext/PaymentCartModal, src/pages/Payment/ — the same
//      "portal-agnostic... reused as-is" module Landlord's page uses) —
//      adds the plan to the cart and opens it, instead of POSTing on
//      click. subscribeToPlan() below is now only ever called from
//      handleConfirmPurchase, once the cart confirms, mirroring
//      LandlordSettingsPage.jsx's own subscribeToPlan/handleConfirmPurchase
//      pair almost line-for-line.
//
//   2. Services is now a real catalog tab (GET /pm/services/catalog/,
//      independent_pm/views.py's new PMServiceCatalogView — filters
//      UNService by 'INDEPENDENT_PM' in receivers, mirrors
//      LandlordServiceCatalogView exactly) with a working Buy Service flow
//      (POST /pm/services/entitlement/, added to PMServiceEntitlementView
//      this round) through the same cart, plus a Listing Promotion summary
//      block — that part reuses the `listings` app's own generic
//      promotion-subscription endpoints (/listings/promotion-subscriptions/
//      …), which were already portal-agnostic (not under /landlord/ or
//      /pm/ at all), so no new backend was needed there.
//
// Deliberately NOT ported from Landlord's Services tab, flagging rather
// than hiding: the horizontal-scrolling carousel treatment, 5-tile stat
// row, and the secondary PlanDetailModal "Details" popup on the promotion
// catalog — all real UI investment on Landlord's side (Figma-matched,
// multiple review rounds) that would take meaningfully more time to port
// pixel-for-pixel than this round had. What's here is the full *functional*
// shape (real catalog, real Buy Service, real cart, real Listing
// Promotion purchase) in a simpler grid/card layout consistent with the
// rest of this session's PM Account Settings pages — same trade-off
// already flagged on the Bank Accounts tab.
//
// Also per the reviewer's instruction on sample content: "use the actual
// data wherever available; if not there, sample data with a Sample badge."
// (Superseded by the Fourth pass below for the Services tab specifically —
// its sample fallback now reuses Landlord's own SAMPLE_INCLUDED_SERVICES/
// SAMPLE_ADDON_SERVICES content+images as-is, per the reviewer's later
// "designed EXACTLY as in the Landlord" instruction for this tab.)
//
// Second pass (same session) — the reviewer flagged that the Subscription
// & Billing tab was still too plain next to Landlord's own hero-card /
// stat-tile treatment, and asked for Landlord's LAYOUT/POLISH specifically
// (not its Inter/navy design tokens — those stay PM's own, confirmed with
// the reviewer). This rebuild ports Landlord's structure 1:1: a hero
// Current Plan card (status/persona pills, price, description, two info
// tiles, a billing-period progress bar, included/add-on chips, actions),
// a Billing Breakdown card + an "Expand Your Plan" CTA in a middle
// column, and an Allocated Capacity ring + the Listing Promotion summary
// in a right column — followed by an upgraded Available Plans card grid.
//
// One real difference from Landlord's version, not a cut: Landlord's
// Allocated Capacity ring reads real portfolio counts from its own
// GET /landlord/dashboard/ (total_units/total_properties/active_tenants).
// No equivalent PM dashboard endpoint exists yet, so this ring instead
// reads GET /api/properties/ directly (already real, already scoped to
// this PM via created_by — the same endpoint PM Portal's own Properties
// page uses) and sums each property's `unit_count` (newly exposed on
// PropertyListSerializer this round — it was already annotated on the
// queryset, just never serialized). "Active Tenants" has no PM data
// source at all yet (no Tenant model exists — PE-4 in the backlog), so
// that one metric is swapped for "Properties Managed" instead of faked.
//
// Third pass (same session) — reviewer asked for the two sections this
// file previously cut (Payment Methods & Details, Billing History &
// Invoices) to be ported after all, "even with sample data", plus fixes
// to three visual gaps found live: the Available Plans card's status/
// currency pills didn't match Landlord's green/white pill treatment, and
// Billing Breakdown / Allocated Capacity / Listing Promotion (and Current
// Plan's own body, same family) were missing the soft blue→green gradient
// wash every one of Landlord's hero cards carries. All four fixed to use
// the identical gradient formula, just with PM's own C.blueBg/C.greenBg.
//
// Payment Methods & Details and Billing History & Invoices are now ported
// 1:1 from Landlord's structure — card visual, entity-info panel, tax
// banner, invoice table. No payment gateway or invoice-read endpoint
// exists on either portal, so the card number/EIN/entity-address/invoice
// rows are sample data, same category Landlord's own page already
// discloses; every action with no real backend stays disabled with a
// tooltip. Card Holder and Invoicing Email use this PM's real name/email
// (new lightweight GET /api/auth/me/ call below, mirrors PMDashboard.jsx's
// own). Linked Bank Accounts stays sample here (PM's real Bank Accounts
// tab lives on its own route/page, not shared state with this file) —
// "Manage" navigates there for the real thing. Still deliberately NOT
// ported: the secondary PlanDetailModal "Details" popup.
//
// Fourth pass (same session) — the Services tab itself ("next tab", the
// reviewer's own words) is now rebuilt against Landlord's Services tab
// structure 1:1: the 5-tile stat row, the "Included with Your Plan" /
// "Add-Ons for Your Plan" horizontal-scroll carousels (Landlord's own
// svcScrollOuter/svcScrollRow/svcCardW3 pattern — percentage-width cards in
// a padded scroll track with absolutely-positioned arrow buttons sitting in
// that padding gutter, not fixed-width cards with flex-sibling arrows; the
// Available Plans carousel earlier this session used the latter and it
// forced a page-wide layout blowout needing a minWidth:0 rescue — this
// pattern sidesteps that failure mode entirely rather than needing the same
// rescue), the Listing Promotion "advertisement" banner, and the "More From
// UrbanNest" Coming Soon teaser section (the "static sections like coming
// up" the reviewer explicitly asked to port too) — all using PM's own
// F.headline/F.body and C.* tokens in place of Landlord's Georgia serif and
// navy/Inter tokens, per the reviewer's standing instruction for this
// rebuild. The flat "Available Services" grid this tab had before is
// retired in favor of the Add-Ons carousel it's replaced by; SAMPLE_PM_SERVICES
// is retired with it. Landlord's plan-scoped included/addon split
// (currentPlanObj.included_services / .addon_services, from
// GET /landlord/plans/) has no PM equivalent yet (PMPlan carries no such
// field — PE-4 backlog), so "included" stays subscription.included_services
// (the real entitlement) and planAddonServices is every other catalog row,
// owned or not — see the comment at its definition below.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';
import AccountSettingsSubnav from './AccountSettingsSubnav';
import { usePaymentCart } from '../../Payment/PaymentCartContext';
import PaymentCartTrigger from '../../Payment/PaymentCartTrigger';
import PaymentCartModal from '../../Payment/PaymentCartModal';
import { CustomDropdown } from '../../../components/ui';
// Services tab (Fourth pass) reuses Landlord's own bundled Figma photo set
// directly rather than duplicating the binary files — this file sits at the
// identical relative depth from src/pages/ as LandlordSettingsPage.jsx
// (src/pages/PMPortal/AccountSettings/ vs src/pages/Landlord/Account Settings/),
// so the exact same '../../../assets/landlord/services/*' path resolves here.
import imgLeaseManagement from '../../../assets/landlord/services/lease-management.jpg';
import imgTenantOnboarding from '../../../assets/landlord/services/tenant-onboarding.jpg';
import imgTenantScreening from '../../../assets/landlord/services/tenant-screening.jpg';
import imgRentCollection from '../../../assets/landlord/services/rent-collection.jpg';
import imgAiMaintenance from '../../../assets/landlord/services/ai-maintenance.jpg';
import imgRentersInsurance from '../../../assets/landlord/services/renters-insurance.jpg';
import imgGroceryDelivery from '../../../assets/landlord/services/grocery-delivery.jpg';
import imgTransportMoving from '../../../assets/landlord/services/transportation-moving.jpg';
import imgPromoBannerBg from '../../../assets/landlord/services/promo-banner-bg.jpg';

const C = {
  primary:      '#002D5B',
  pageBg:       '#F8FAFC',
  white:        '#FFFFFF',
  border:       'rgba(0,0,0,0.06)',
  borderMedium: 'rgba(0,0,0,0.10)',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  neutral:      '#F1F5F9',
  green:        '#16A34A',
  greenBg:      '#F0FDF4',
  greenBorder:  '#BBF7D0',
  blue:         '#3d8ef0',
  blueBg:       '#EFF6FF',
  blueBorder:   '#BFDBFE',
  amber:        '#92400E',
  amberBg:      '#FEF3C7',
  amberBorder:  '#FCD34D',
  purple:       '#7C3AED',
  purpleBg:     '#F5F3FF',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });

// Listing Promotion — generic `listings` app endpoints, not PM- or
// Landlord-specific (confirmed in src/pages/Landlord/Listing/listingApi.js:
// these already hit /listings/promotion-subscriptions/…, scoped server-side
// to request.user, nothing LANDLORD-specific about the URL or the view).
// Thin PM-local copy rather than a cross-portal import, consistent with
// this codebase's established PM/Landlord file-duplication convention
// (MK_015) rather than reaching into src/pages/Landlord/ from PM Portal.
const getPromotionSubscriptions = () =>
  fetch(`${API_BASE}/listings/promotion-subscriptions/`, { headers: authHeaders() }).then(r => r.json());
const getPromotionSubscriptionCatalog = () =>
  fetch(`${API_BASE}/listings/promotion-subscriptions/catalog/`, { headers: authHeaders() }).then(r => r.json());
const purchasePromotionSubscription = (planId) =>
  fetch(`${API_BASE}/listings/promotion-subscriptions/purchase/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ plan_id: planId }) })
    .then(r => { if (!r.ok) return r.json().then(b => { throw new Error(b.detail || 'Could not complete this purchase.'); }); return r.json(); });

const PRICE_UNIT_LABELS = { PER_UNIT: '/ Unit', PER_MONTH: '/ Month', PER_PROPERTY: '/ Property', FLAT_FEE: '/ Flat Fee' };

// Figma-cropped photo pools for the "Included with Your Plan" / "Add-Ons for
// Your Plan" carousels — ported from Landlord's own pool/cycling scheme
// (visualFor cycles by card position, modulo, so it holds up for however
// many real services this PM's plan actually has), reusing Landlord's own
// bundled images directly rather than duplicating the binary files.
const INCLUDED_VISUALS = [imgLeaseManagement, imgTenantOnboarding];
const ADDON_VISUALS = [imgTenantScreening, imgRentCollection, imgAiMaintenance];
const visualFor = (pool, index) => pool[Math.max(0, index) % pool.length];

// Add-on cards' top-right ribbon — decorative only, no backing UNService
// field (same gap Landlord's own version flags), cycling by card position.
const ADDON_FLAVORS = [
  { ribbon: 'Instant Decision', caption: 'Bill to applicant or firm' },
  { ribbon: 'Next-Day Payout', caption: 'Zero Monthly Base' },
  { ribbon: 'AI Automated', caption: 'Unlimited Tickets' },
  { ribbon: 'Fast Setup', caption: 'Flexible Billing' },
];
const flavorFor = (index) => ADDON_FLAVORS[Math.max(0, index) % ADDON_FLAVORS.length];

// Sample fallback cards for the two carousels — shown only when the real
// catalog has nothing for that section (same "real data if there, sample
// data with a Sample badge otherwise" rule the rest of this file follows),
// never counted in the real stat tiles/pills. Content + images are
// Landlord's own exact Figma sample set — a PM would buy/use all five of
// these (screening, rent collection, maintenance triage included) just as
// much as a Landlord would, so reusing them as-is matches the reviewer's
// "designed EXACTLY as in the Landlord" instruction for this tab.
const SAMPLE_INCLUDED_SERVICES = [
  { id: 'sample-inc-1', isSample: true, name: 'Lease Management', short_description: 'Automated digital lease creation, document templates, e-signatures, and verified tenant repository.', image: imgLeaseManagement },
  { id: 'sample-inc-2', isSample: true, name: 'Tenant Onboarding', short_description: 'Digital tenant intake workflow, document collection, identity checks, and automated welcome orientation.', image: imgTenantOnboarding },
];
const SAMPLE_ADDON_SERVICES = [
  { id: 'sample-addon-1', isSample: true, name: 'Tenant Screening & Underwriting', short_description: 'Full TransUnion ResidentScore, comprehensive criminal records, and nationwide eviction database cross-referencing.', image: imgTenantScreening, price: 35, price_unit: 'PER_UNIT', priceDisplay: '$35.00', priceUnitDisplay: '/ applicant', owned: false },
  { id: 'sample-addon-2', isSample: true, name: 'Digital Rent Collection & ACH Direct', short_description: 'Automated rent reconciliation, multi-entity split payouts, recurring auto-debit, and late-fee automation protocols.', image: imgRentCollection, price: 0.8, price_unit: 'PER_UNIT', priceDisplay: '0.8%', priceUnitDisplay: 'ACH / 2.9% Card', owned: false },
  { id: 'sample-addon-3', isSample: true, name: 'AI Maintenance Triage & Dispatch', short_description: '24/7 intelligent ticket assessment, photo analysis of plumbing/HVAC emergencies, and direct vendor dispatching rules.', image: imgAiMaintenance, price: 19, price_unit: 'PER_MONTH', priceDisplay: '$19.00', priceUnitDisplay: '/ month', owned: false },
];

// External marketing teaser ("More From UrbanNest") — confirmed nowhere in
// the backend as a real product (same check Landlord's own version notes);
// every card is explicitly "Coming Soon" and not purchasable. Ported as-is
// per the reviewer's explicit ask for "all the static sections like coming
// up ... that is available in Landlord to be available in PM portal as well."
const EXTERNAL_PROGRAMS = [
  { key: 'insurance', icon: 'ti-shield-check', image: imgRentersInsurance, title: 'Renters Insurance', tag: 'Revenue Sharing Program', desc: 'Offer tenants a bundled renters insurance option at move-in — a potential new revenue line for your portfolio.' },
  { key: 'grocery', icon: 'ti-shopping-cart', image: imgGroceryDelivery, title: 'Grocery Delivery Partnerships', tag: 'Resident Welcome Perk', desc: 'A move-in welcome perk for new tenants — discounted first-order grocery delivery, co-branded with UrbanNest.' },
  { key: 'transportation', icon: 'ti-car', image: imgTransportMoving, title: 'Transportation & Moving', tag: 'Logistics Concierge', desc: 'Discounted moving-day transportation for tenants relocating into one of your units.' },
];

function ordinalDay(d) {
  const v = d % 100;
  if (v >= 11 && v <= 13) return `${d}th`;
  switch (d % 10) {
    case 1: return `${d}st`;
    case 2: return `${d}nd`;
    case 3: return `${d}rd`;
    default: return `${d}th`;
  }
}

// Horizontal scroll + arrow-nav edge tracking for the Services tab's three
// carousels — ported from Landlord's own useHScrollEdges hook verbatim.
function useHScrollEdges(ref, deps) {
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(update, deps);
  return [edges, update];
}

const S = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body },
  main:  { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 },
  content: { flex: 1, minHeight: 0, padding: '28px 32px', overflowY: 'auto' },
  crumb: { fontSize: 12, color: C.textTertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 },
  hdrRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  h1: { fontFamily: F.headline, fontSize: 26, fontWeight: 500, color: C.primary, margin: '0 0 3px' },
  sub: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 22px', maxWidth: 820 },

  sectionHdr: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '22px 0 14px' },
  sectionH2: { fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: 0 },
  sectionCount: { fontSize: 12.5, color: C.textTertiary },

  banner: { background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 12.5, color: C.textPrimary, lineHeight: 1.5 },
  gateBanner: { background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  gateBannerText: { fontSize: 12.5, color: C.textPrimary, lineHeight: 1.5 },
  currentSubCard: { background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 },

  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  planCard: (current) => ({ background: C.white, border: `1.5px solid ${current ? C.green : C.borderMedium}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }),
  planCardName: { fontSize: 15, fontWeight: 700, color: C.textPrimary },
  planCardPrice: { fontSize: 20, fontWeight: 700, color: C.textPrimary },
  planCardPriceUnit: { fontSize: 11.5, fontWeight: 600, color: C.textTertiary },
  planCardDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 1.5, flex: 1 },
  planCardIncluded: { fontSize: 11, color: C.textSecondary, lineHeight: 1.6 },

  btnPrimary: { background: C.primary, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
  btnSecondary: { background: C.white, color: C.textPrimary, border: `1px solid ${C.borderMedium}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
  pill: { background: C.greenBg, color: C.green, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 8 },
  samplePill: { background: C.neutral, color: C.textTertiary, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, marginLeft: 8 },

  svcBadge: { alignSelf: 'flex-start', fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: C.greenBg, color: C.green },

  // ─── Services tab (Fourth pass) — ported from Landlord's Services tab
  // 1:1 (structure/polish), PM's own F.headline/F.body + C.* tokens in
  // place of Landlord's Georgia serif and navy/Inter design tokens.

  // 5-tile stat row.
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 },
  statTile: (accent, light) => ({ background: light ? `linear-gradient(135deg, ${C.white} 55%, ${light} 160%)` : C.white, border: `1px solid ${C.border}`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 3 }),
  statTileTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.textTertiary },
  statIconTint: (bg, fg) => ({ width: 24, height: 24, borderRadius: 7, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }),
  statValue: { fontFamily: F.headline, fontSize: 25, fontWeight: 700, color: C.textPrimary },
  statSub: { fontSize: 11.5, color: C.textTertiary, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' },

  // Section headers shared by the Included/Add-Ons/More-From-UrbanNest carousels.
  svcSectionHdr: { marginBottom: 16 },
  svcSectionTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  svcSectionTitleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  svcSectionH2: { fontFamily: F.headline, fontSize: 18, fontWeight: 600, color: C.textPrimary, margin: 0 },
  svcSectionPill: { background: C.greenBg, color: C.green, fontSize: 11.5, fontWeight: 600, padding: '4px 13px', borderRadius: 20, whiteSpace: 'nowrap' },
  svcSectionLink: { fontSize: 12.5, fontWeight: 700, color: C.primary, cursor: 'pointer', whiteSpace: 'nowrap', background: 'none', border: 'none', fontFamily: F.body, display: 'flex', alignItems: 'center', gap: 5 },
  svcSectionCaption: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.textTertiary, whiteSpace: 'nowrap' },
  svcSectionSub: { fontSize: 13, color: C.textSecondary, margin: '5px 0 0' },
  svcSampleNote: { fontSize: 11.5, color: C.textTertiary, margin: '-4px 0 12px', fontStyle: 'italic' },

  // Horizontal-scroll carousel shell — percentage-width cards in a padded
  // scroll track, arrows absolutely positioned in that padding gutter (not
  // flex siblings), so the track's own width never has to fight a fixed
  // card width the way the Available Plans carousel's fixed-220px cards did.
  svcScrollOuter: { position: 'relative', padding: '0 42px' },
  svcScrollRow: { display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', scrollSnapType: 'x proximity', paddingBottom: 2 },
  svcCardW3: { flex: '0 0 calc((100% - 32px) / 3)', scrollSnapAlign: 'start' },
  svcArrowBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(15,23,42,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, color: C.textPrimary, fontSize: 15 },
  svcArrowLeft:  { left: 0 },
  svcArrowRight: { right: 0 },
  svcArrowDisabled: { opacity: 0.3, cursor: 'default', boxShadow: 'none' },

  // Included / Add-On card anatomy.
  svcCard:  { background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  svcMedia: { position: 'relative', height: 130, backgroundSize: 'cover', backgroundPosition: 'center' },
  svcMediaStatusPill: { position: 'absolute', bottom: 10, left: 10, fontSize: 10.5, fontWeight: 700, padding: '5px 11px', borderRadius: 20, background: 'rgba(0,45,91,0.72)', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 },
  svcMediaRibbon: { position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.92)', color: C.textPrimary, letterSpacing: 0.2 },
  svcMediaRibbonAccent: { background: C.greenBg, color: C.green },
  svcSamplePill: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, background: C.neutral, color: C.textTertiary, whiteSpace: 'nowrap', flexShrink: 0 },
  svcBody:  { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  svcTitleSerif: { fontFamily: F.headline, fontSize: 15, fontWeight: 600, color: C.textPrimary, lineHeight: 1.25 },
  svcTitleClamp: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  svcDesc:  { fontSize: 12.5, color: C.textSecondary, lineHeight: 1.5, flex: 1 },
  svcDivider: { borderTop: `1px solid ${C.border}`, margin: '2px 0' },
  svcPriceRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  svcPriceBig: { fontFamily: F.headline, fontSize: 21, fontWeight: 600, color: C.textPrimary },
  svcPriceUnit: { fontSize: 11.5, fontWeight: 600, color: C.textTertiary, marginLeft: 4 },
  svcPriceCaption: { fontSize: 10.5, fontWeight: 600, color: C.green, whiteSpace: 'nowrap' },
  svcBtnRow: { display: 'flex', gap: 8, marginTop: 2 },
  svcBtn:   { marginTop: 10, textAlign: 'center', padding: '8px 0', borderRadius: 6, fontSize: 11.5, fontWeight: 500, fontFamily: F.body, cursor: 'pointer' },
  svcBtnBlue: { background: C.blue, color: '#fff', border: 'none' },
  svcBtnBlueBordered: { background: C.blue, color: '#fff', border: `1px solid ${C.border}` },
  svcBtnBlueDisabled: { background: C.blue, color: '#fff', border: 'none', cursor: 'not-allowed' },
  svcBtnBlueBorderedDisabled: { background: C.blue, color: '#fff', border: `1px solid ${C.border}`, cursor: 'not-allowed' },
  svcBtnViewDisabled: { background: '#fff', border: `1px solid ${C.border}`, color: C.textPrimary, cursor: 'not-allowed' },
  // svcBtnInCart is already defined below (Available Plans carousel styles) — same { background: C.greenBg, color: C.green } shape, reused as-is.
  svcBtnDisabled: { background: C.neutral, color: C.textTertiary, cursor: 'not-allowed' },

  // Listing Promotion "advertisement" banner — same dark hero treatment as
  // Landlord's own version (a marketing banner, not a PM-vs-Landlord brand
  // surface), over Landlord's own bundled (blurred) marketplace photo.
  promoAdSection: {
    position: 'relative', borderRadius: 18, padding: '34px 40px', color: '#fff', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 36, flexWrap: 'wrap',
    backgroundImage: `linear-gradient(120deg, rgba(10,22,40,0.90) 0%, rgba(16,30,50,0.88) 55%, rgba(22,40,64,0.86) 100%), url(${imgPromoBannerBg})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  },
  promoAdLeft: { flex: '1 1 420px', minWidth: 0 },
  promoAdBadge: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#4ecba0', background: '#1a4a3a', padding: '5px 14px', borderRadius: 20, display: 'inline-block' },
  promoAdHeadline: { fontFamily: F.headline, fontSize: 28, fontWeight: 700, lineHeight: 1.25, maxWidth: 560, margin: '14px 0 10px' },
  promoAdSub: { fontSize: 13, color: 'rgba(255,255,255,0.74)', lineHeight: 1.6, maxWidth: 540, marginBottom: 16 },
  promoAdDivider: { borderTop: '1px solid rgba(255,255,255,0.18)', marginBottom: 16, maxWidth: 560 },
  promoAdStatsRow: { display: 'flex', gap: 34 },
  promoAdStat: { textAlign: 'left' },
  promoAdStatValue: { fontFamily: F.headline, fontSize: 25, fontWeight: 700 },
  promoAdStatLabel: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)', marginTop: 3 },
  promoAdRight: { display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, width: 250 },
  promoAdCta: { background: '#fff', color: C.primary, border: 'none', padding: '13px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  promoAdCtaSecondary: { background: 'rgba(255,255,255,0.10)', color: '#fff', border: '1px solid rgba(255,255,255,0.24)', padding: '13px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  promoAdActiveNote: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // "More From UrbanNest" Coming Soon teaser cards.
  extCardW3: { flex: '0 0 calc((100% - 32px) / 3)', scrollSnapAlign: 'start' },
  extCard: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  extMedia: { position: 'relative', height: 122, backgroundSize: 'cover', backgroundPosition: 'center' },
  extComingSoonPill: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '5px 11px', borderRadius: 20, background: 'rgba(255,255,255,0.92)', color: C.textPrimary, whiteSpace: 'nowrap' },
  extBody: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  extIconWrap: { width: 38, height: 38, borderRadius: 9, background: C.blueBg, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  extTitleRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 },
  extTitle: { fontFamily: F.headline, fontSize: 15.5, fontWeight: 700, color: C.textPrimary, lineHeight: 1.25 },
  extTag: { fontSize: 10.5, fontWeight: 600, color: C.textTertiary, margin: '1px 0 0 48px' },
  extDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 1.5, flex: 1, marginTop: 2 },
  extBtn: { marginTop: 8, background: 'none', border: `1px solid ${C.border}`, color: C.textTertiary, padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'not-allowed', fontFamily: F.body, width: '100%' },

  emptyState: { background: C.white, border: `1px dashed ${C.borderMedium}`, borderRadius: 10, padding: '32px 24px', textAlign: 'center' },
  emptyP: { fontSize: 12.5, color: C.textSecondary, maxWidth: 360, margin: '0 auto 14px', lineHeight: 1.6 },

  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,27,46,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px', overflowY: 'auto', zIndex: 1000 },
  modal: { background: C.white, borderRadius: 12, width: 480, maxWidth: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  modalH3: { margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline },
  modalSub: { fontSize: 12.5, color: C.textTertiary, margin: '0 0 18px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  bodyLabel: { fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, marginTop: 14 },
  bodyText: { fontSize: 12.5, color: C.textPrimary, lineHeight: 1.6, margin: 0 },

  promoCatGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 },
  promoCatCard: { border: `1px solid ${C.borderMedium}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  promoCatName: { fontSize: 13.5, fontWeight: 700, color: C.textPrimary },
  promoCatDesc: { fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5, flex: 1 },
  promoCatPrice: { fontSize: 16, fontWeight: 700, color: C.textPrimary },

  // ─── Subscription & Billing hero layout (ported from Landlord's S.subGrid
  // et al., same structure, PM's own tokens) ───────────────────────────────
  subGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, alignItems: 'stretch', marginBottom: 8 },
  subLeftCol: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  subMidCol: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  subRightCol: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  // Spans the FULL grid width (all 3 columns), not just column 1 like
  // Landlord's own static-grid version (which could afford to stay at 40%
  // width since its cards just wrapped to more rows in that space). As a
  // horizontal carousel, this section needs the full page width so more
  // cards are visible before the arrows are needed — confining it to 40%
  // left most of the page empty and cut the second card off mid-way.
  subAvailablePlansBlock: { gridColumn: '1 / -1', marginTop: 8, minWidth: 0 },

  curPlanCard: { background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' },
  curPlanImgBanner: { position: 'relative', height: 90, background: `linear-gradient(135deg, ${C.primary} 0%, #0a4a8a 100%)`, flexShrink: 0 },
  curPlanImgBannerImg: { width: '100%', height: '100%', objectFit: 'cover' },
  curPlanImgBannerPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 30 },
  curPlanImgBannerFade: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)' },
  curPlanCardBody: { background: `linear-gradient(160deg, ${C.white} 0%, ${C.blueBg}45 55%, ${C.greenBg}45 100%)`, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 },
  curPlanTopRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  curPlanTierRow: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' },
  curPlanTierLabel: { fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4 },
  pillActive: { fontSize: 10, fontWeight: 700, color: C.green, background: C.greenBg, padding: '2px 8px', borderRadius: 20 },
  curPlanPersonaPill: { fontSize: 10, fontWeight: 700, color: C.primary, background: C.blueBg, padding: '2px 8px', borderRadius: 20 },
  curPlanTitle: { fontFamily: F.headline, fontSize: 19, fontWeight: 600, color: C.textPrimary },
  curPlanDateRange: { fontSize: 11, color: C.textTertiary, display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 },
  curPlanPriceBig: { fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.textPrimary, textAlign: 'right' },
  curPlanPriceSub: { fontSize: 11, color: C.textTertiary, textAlign: 'right', marginTop: 2 },
  curPlanDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginTop: 10 },
  curPlanDivider: { borderBottom: `1px solid ${C.border}`, margin: '14px 0' },
  curPlanTilesRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  curPlanTile: { display: 'flex', gap: 9, background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' },
  curPlanTileIcon: { width: 28, height: 28, borderRadius: 8, background: C.blueBg, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 },
  curPlanTileLabel: { fontSize: 9.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  curPlanTileValue: { fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginTop: 1 },
  curPlanTileSub: { fontSize: 10, color: C.textTertiary, marginTop: 1 },
  curPlanProgressWrap: { marginTop: 14 },
  curPlanProgressLabelRow: { display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 5 },
  curPlanProgressLabel: { color: C.textTertiary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, fontSize: 9.5 },
  curPlanProgressRemaining: { color: C.textSecondary },
  curPlanProgressOuter: { height: 6, borderRadius: 20, background: C.neutral, overflow: 'hidden' },
  curPlanProgressInner: (pct) => ({ width: `${pct}%`, height: '100%', background: C.primary, borderRadius: 20 }),
  curPlanProgressDates: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textTertiary, marginTop: 4 },
  curPlanActionsRow: { display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  curPlanBtnCancel: { background: 'none', border: 'none', color: C.textTertiary, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto', padding: '9px 4px' },
  curPlanEmpty: { textAlign: 'center', padding: '28px 10px' },

  bbCard: { background: `linear-gradient(160deg, ${C.white} 0%, ${C.blueBg}45 55%, ${C.greenBg}45 100%)`, border: `1px solid ${C.borderMedium}`, borderRadius: 14, padding: '16px 18px' },
  bbHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  bbTitle: { fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline },
  bbIcon: { width: 26, height: 26, borderRadius: 8, background: C.blueBg, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  bbRows: { display: 'flex', flexDirection: 'column', gap: 10 },
  bbRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  bbRowLabel: { fontSize: 12, fontWeight: 600, color: C.textPrimary },
  bbRowSub: { fontSize: 10.5, color: C.textTertiary, marginTop: 1 },
  bbRowValue: { fontSize: 13, fontWeight: 700, color: C.textPrimary },
  bbDivider: { borderBottom: `1px dashed ${C.border}`, margin: '4px 0' },
  bbTotalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  bbTotalLabel: { fontSize: 12.5, fontWeight: 700, color: C.textPrimary },
  bbTotalValue: { fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.primary },
  bbTotalSub: { fontSize: 10, color: C.textTertiary, marginTop: 2 },

  eeCard: { background: `linear-gradient(135deg, ${C.blueBg} 0%, ${C.white} 100%)`, border: `1px solid ${C.borderMedium}`, borderRadius: 14, padding: '16px 18px' },
  eeLabel: { fontSize: 9.5, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  eeTitle: { fontSize: 13.5, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 6 },
  eeBody: { fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5, marginBottom: 12 },
  eeCta: { background: 'none', border: 'none', color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 },

  acCard: { background: `linear-gradient(160deg, ${C.white} 0%, ${C.blueBg}45 55%, ${C.greenBg}45 100%)`, border: `1px solid ${C.borderMedium}`, borderRadius: 14, padding: '16px 18px' },
  acHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  acTitle: { fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline },
  acIcon: { width: 26, height: 26, borderRadius: 8, background: C.blueBg, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  acRingRow: { display: 'flex', alignItems: 'center', gap: 14 },
  acRingWrap: { position: 'relative', width: 84, height: 84, flexShrink: 0 },
  acRingCenter: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  acRingValue: { fontFamily: F.headline, fontSize: 19, fontWeight: 700, color: C.textPrimary },
  acRingOf: { fontSize: 8.5, fontWeight: 700, color: C.textTertiary },
  acRingLabel: { fontSize: 12, fontWeight: 700, color: C.textPrimary },
  acRingSub: { fontSize: 10.5, color: C.textTertiary, marginTop: 3, lineHeight: 1.4 },
  acRingPct: { fontSize: 10, color: C.green, fontWeight: 600, marginTop: 3 },
  acDivider: { borderBottom: `1px solid ${C.border}`, margin: '14px 0 10px' },
  acMetricRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '4px 0' },
  acMetricLabel: { color: C.textTertiary },
  acMetricValue: { color: C.textPrimary, fontWeight: 700 },

  lpSummaryCard: { background: `linear-gradient(160deg, ${C.white} 0%, ${C.blueBg}45 55%, ${C.greenBg}45 100%)`, border: `1px solid ${C.borderMedium}`, borderRadius: 14, padding: '16px 18px' },
  lpSummaryHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  lpSummaryTitle: { fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline },
  lpSummaryIcon: { width: 26, height: 26, borderRadius: 8, background: C.blueBg, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  lpSummaryPlanName: { fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 6 },
  lpSummaryMetricRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' },
  lpSummaryMetricLabel: { color: C.textTertiary },
  lpSummaryMetricValue: { color: C.textPrimary, fontWeight: 700 },
  lpSummaryEmpty: { fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5, marginBottom: 10 },

  // Card proportions below now match Landlord's planCardV2 family exactly
  // (image banner height, body padding, type scale, pill padding, line-
  // clamped description, full-width pill button) — only the colors are
  // PM's own tokens, per the reviewer's "card size should be the same as
  // Landlord's" instruction. width/flexShrink added so the card works as a
  // fixed-size carousel item (see planCarousel* below) instead of a grid
  // cell.
  planCardV2: (current) => ({ background: C.white, border: `1.5px solid ${current ? C.green : C.borderMedium}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: 220, flexShrink: 0 }),
  planCardImgWrap: { position: 'relative', height: 97, background: `linear-gradient(135deg, ${C.primary} 0%, #0a4a8a 100%)`, flexShrink: 0 },
  planCardImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  planCardImgPlaceholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 20 },
  planCardGradient: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,45,91,0.85), rgba(0,45,91,0.05) 60%)' },
  planCardStatusPill: { position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, color: C.green, background: C.greenBg, padding: '3px 8px', borderRadius: 20 },
  planCardCurrencyPill: { position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: C.textPrimary, background: 'rgba(255,255,255,0.85)', padding: '3px 8px', borderRadius: 20 },
  planCardImgName: { position: 'absolute', left: 10, bottom: 7, right: 10, fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: F.headline, textShadow: '0 1px 6px rgba(0,0,0,0.4)' },
  planCardBodyV2: { padding: '10px 13px 11px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  planCardUnitChip: { alignSelf: 'flex-start', fontSize: 9.5, fontWeight: 600, color: C.textSecondary, background: C.neutral, padding: '3px 8px', borderRadius: 20 },
  planCardPriceV2: { fontSize: 16, fontWeight: 700, color: C.textPrimary },
  planCardAnnual: { fontSize: 10.5, fontWeight: 600, color: C.textTertiary, marginTop: -3 },
  planCardDescV2: { fontSize: 11, color: C.textSecondary, lineHeight: 1.45, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  planCardMetaLine: { fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 6 },
  planCardMetaIncluded: { color: C.green, fontWeight: 600 },
  planCardMetaAddon: { color: C.textTertiary, fontWeight: 600 },
  planCardBtnPill: { marginTop: 3, width: '100%', textAlign: 'center', padding: '7px 0', borderRadius: 30, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.body, border: 'none' },
  planCardBtnPillSolid: { background: C.primary, color: '#fff' },
  planCardBtnPillOutline: { background: C.white, color: C.textPrimary, border: `1.5px solid ${C.borderMedium}` },
  svcBtnInCart: { background: C.greenBg, color: C.green },

  // Available Plans carousel (reviewer ask): cards stack horizontally and
  // scroll via left/right arrow buttons instead of wrapping in a grid.
  // Arrows sit in their own flex cells outside the scrolling track — never
  // absolutely positioned over the cards — so they can never overlap a
  // card. The track itself clips its native scrollbar (see the inline
  // <style> next to its one usage below) since the arrows are the only
  // intended way to navigate.
  planCarouselWrap: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' },
  planCarouselArrow: { flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.borderMedium}`, background: C.white, color: C.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  planCarouselArrowDisabled: { opacity: 0.35, cursor: 'not-allowed', boxShadow: 'none' },
  planCarouselTrack: { display: 'flex', gap: 14, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 2, flex: 1, minWidth: 0, scrollbarWidth: 'none' },

  // ── PAYMENT METHODS & DETAILS / BILLING HISTORY & INVOICES — ported 1:1
  // from Landlord's own Figma-matched structure (card visual, entity-info
  // panel, tax banner, invoice table), per the reviewer's "implement exactly
  // as Landlord, even with sample data" instruction. No payment gateway or
  // invoice-read endpoint exists for either portal, so the card/EIN/invoice
  // fields below are sample data, same category already disclosed on
  // Landlord's own page — every action that isn't wired to a real backend
  // stays disabled with a tooltip explaining why. Card Holder and Invoicing
  // Email use the signed-in PM's real name/email wherever this page has it
  // (via the new currentUser fetch below), same as Landlord's userLabel/
  // currentUser?.email.
  figmaCard: { background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 12, padding: '22px 24px', marginBottom: 22 },
  figmaCardHdr: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  figmaCardTitle: { fontFamily: F.headline, fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0 },
  figmaCardSub: { fontSize: 12, color: C.textTertiary, marginTop: 4 },
  figmaDivider: { borderTop: `1px dashed ${C.borderMedium}`, margin: '18px 0 20px' },
  figmaOutlineBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: C.white, color: C.primary, border: `1px solid ${C.borderMedium}`, padding: '8px 14px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.body, whiteSpace: 'nowrap' },
  figmaLinkBtn: { background: 'none', border: 'none', padding: 0, color: C.blue, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.2, textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.body, display: 'inline-flex', alignItems: 'center', gap: 5 },
  pillDefault: { fontSize: 10, fontWeight: 700, color: C.green, background: C.greenBg, padding: '2px 8px', borderRadius: 20 },

  pmThreeCol: { display: 'grid', gridTemplateColumns: '4fr 3fr 3fr', gap: 24, alignItems: 'flex-start' },
  pmCol: { minWidth: 0 },
  pmColLabelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  pmColLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.textTertiary, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  pmCreditCard: { position: 'relative', background: `linear-gradient(135deg, ${C.primary} 0%, #0a4a8a 100%)`, borderRadius: 14, padding: '20px 22px', color: '#fff', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(0,45,91,0.25)' },
  pmCardType: { fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' },
  pmCardLogoWrap: { position: 'absolute', top: 18, right: 20, textAlign: 'right' },
  pmCardLogoCircles: { display: 'flex', justifyContent: 'flex-end', marginBottom: 4 },
  pmCardCircleRed: { width: 22, height: 22, borderRadius: '50%', background: '#eb001b', marginRight: -9 },
  pmCardCircleOrange: { width: 22, height: 22, borderRadius: '50%', background: '#f79e1b', opacity: 0.9 },
  pmCardBrand: { fontSize: 13, fontWeight: 700, color: '#fff', fontStyle: 'italic' },
  pmCardNumber: { fontSize: 19, fontWeight: 600, letterSpacing: 2.5, color: '#fff', fontFamily: 'monospace' },
  pmCardMetaRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
  pmCardMetaLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' },
  pmCardMetaValue: { fontSize: 12.5, fontWeight: 600, color: '#fff', marginTop: 3 },

  pmBelowCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' },
  pmAutoDebit: { fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 7 },

  pmEntityBox: { background: '#f8f9fb', borderRadius: 10, padding: '16px 18px' },
  pmEntityHead: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  pmEntityIcon: { width: 28, height: 28, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.textSecondary, flexShrink: 0 },
  pmEntityName: { fontSize: 13.5, fontWeight: 700, color: C.textPrimary },
  pmEntityAddr: { fontSize: 12, color: C.textSecondary, marginTop: 4, lineHeight: 1.6 },
  pmEntityDivider: { borderTop: `1px solid ${C.borderMedium}`, margin: '14px 0' },
  pmEntityRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  pmEntityRowLabel: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.textTertiary },
  pmEntityRowValue: { fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginTop: 2 },

  pmTaxBanner: { display: 'flex', alignItems: 'center', gap: 10, background: C.greenBg, color: C.green, borderRadius: 10, padding: '12px 16px', fontSize: 12, lineHeight: 1.5, marginTop: 20 },

  bhToolbarRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  bhSearchWrap: { position: 'relative' },
  bhSearchInput: { padding: '8px 12px 8px 32px', border: `1px solid ${C.borderMedium}`, borderRadius: 8, fontSize: 12.5, fontFamily: F.body, color: C.textPrimary, width: 210 },
  bhSearchIcon: { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.textTertiary },
  bhYearDropdownWrap: { width: 100, flexShrink: 0 },

  bhTable: { width: '100%', borderCollapse: 'collapse', marginTop: 4 },
  bhTh: { textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.textTertiary, padding: '10px 10px', borderBottom: `1px solid ${C.borderMedium}` },
  bhTd: { fontSize: 12.5, color: C.textPrimary, padding: '13px 10px', borderBottom: `1px solid ${C.borderMedium}`, verticalAlign: 'middle' },
  bhPaidPill: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: C.greenBg, color: C.green, whiteSpace: 'nowrap' },
  bhDownloadBtn: { background: 'none', border: 'none', padding: 0, color: C.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: F.body },

  bhFooterRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.borderMedium}`, fontSize: 12, color: C.textTertiary, flexWrap: 'wrap' },
  bhPagination: { display: 'flex', alignItems: 'center', gap: 6 },
  bhPageBtn: { width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.borderMedium}`, background: '#fff', fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', fontFamily: F.body },
  bhPageBtnActive: { background: C.primary, color: '#fff', borderColor: C.primary, cursor: 'default' },
};

function ServiceDetailModal({ service, inCart, onClose, onAddToCart }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h3 style={S.modalH3}>{service.name}</h3>
        <p style={S.modalSub}>{service.isSample ? 'Sample service — illustrative only.' : (service.price_unit ? `${service.price} ${PRICE_UNIT_LABELS[service.price_unit] || service.price_unit}` : '')}</p>
        <div style={S.bodyLabel}>Description</div>
        <p style={S.bodyText}>{service.long_description || service.short_description}</p>
        <div style={S.bodyLabel}>Your Status</div>
        <p style={S.bodyText}>{service.owned ? `✓ Owned${service.owned_since ? ` since ${new Date(service.owned_since).toLocaleDateString()}` : ''}` : '○ Not purchased'}</p>
        <div style={S.modalActions}>
          <button style={S.btnSecondary} onClick={onClose}>Close</button>
          {!service.owned && !service.isSample && (
            <button style={inCart ? { ...S.btnPrimary, opacity: 0.6 } : S.btnPrimary} disabled={inCart} onClick={() => onAddToCart(service)}>
              {inCart ? '✓ In Cart' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PromotionCatalogModal({ plans, loading, error, purchasingId, onClose, onPurchase }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, width: 640 }} onClick={e => e.stopPropagation()}>
        <h3 style={S.modalH3}>Explore Listing Promotion Plans</h3>
        <p style={S.modalSub}>Buy a plan now — reuse it on any eligible listing later at no extra cost.</p>
        {loading && <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '16px 0' }}>Loading plans…</div>}
        {!loading && error && <div style={S.emptyState}><p style={S.emptyP}>{error}</p></div>}
        {!loading && !error && plans.length === 0 && (
          <div style={S.emptyState}><p style={S.emptyP}>No Listing Promotion plans are currently eligible for your account.</p></div>
        )}
        {!loading && !error && plans.length > 0 && (
          <div style={S.promoCatGrid}>
            {plans.map(plan => {
              const priceValue = Number(plan.price) || 0;
              return (
                <div key={plan.id} style={S.promoCatCard}>
                  <div style={S.promoCatName}>{plan.name}{plan.is_default && <span style={S.pill}>Popular</span>}</div>
                  <p style={S.promoCatDesc}>{plan.short_description}</p>
                  <div style={S.promoCatPrice}>{priceValue === 0 ? 'Free' : `$${priceValue.toFixed(2)}`}</div>
                  <div style={{ fontSize: 11, color: C.textTertiary }}>{plan.duration_days}-day validity</div>
                  <button style={{ ...S.btnPrimary, opacity: purchasingId ? 0.6 : 1 }} disabled={!!purchasingId} onClick={() => onPurchase(plan.id)}>
                    {purchasingId === plan.id ? 'Purchasing…' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div style={S.modalActions}>
          <button style={S.btnSecondary} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function PMSubscriptionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.endsWith('/services') ? 'services' : 'subscription';

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [openService, setOpenService] = useState(null);

  const [promoSubs, setPromoSubs] = useState([]);
  const [promoCatalogOpen, setPromoCatalogOpen] = useState(false);
  const [promoCatalog, setPromoCatalog] = useState([]);
  const [promoCatalogLoading, setPromoCatalogLoading] = useState(false);
  const [promoCatalogError, setPromoCatalogError] = useState(null);
  const [promoPurchasingId, setPromoPurchasingId] = useState(null);

  // Real portfolio data for the Allocated Capacity ring — GET /api/properties/
  // is already scoped to this PM (created_by) and already annotates
  // unit_count; this round just exposes that field in the serializer. No
  // new backend endpoint needed.
  const [properties, setProperties] = useState([]);
  React.useEffect(() => {
    fetch(`${API_BASE}/properties/`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(list => setProperties(Array.isArray(list) ? list : (list.results || [])))
      .catch(() => {});
  }, []);
  const availablePlansRef = React.useRef(null);

  // Available Plans carousel scroll control — arrows scroll the track by
  // ~2 card-widths and the arrows disable themselves at each end (reviewer
  // ask: horizontal stack with left/right nav arrows, not a wrapping grid).
  const planTrackRef = React.useRef(null);
  const [planScrollState, setPlanScrollState] = useState({ atStart: true, atEnd: true });
  const updatePlanScrollState = React.useCallback(() => {
    const el = planTrackRef.current;
    if (!el) return;
    setPlanScrollState({
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);
  React.useEffect(() => { updatePlanScrollState(); }, [plans, updatePlanScrollState]);
  const scrollPlans = (dir) => {
    const el = planTrackRef.current;
    if (!el) return;
    const cardEl = el.querySelector('[data-plan-card]');
    const step = (cardEl ? cardEl.offsetWidth : 220) + 14;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
    setTimeout(updatePlanScrollState, 350);
  };

  // Card Holder / Invoicing Email on the new Payment Methods & Details card
  // below use this PM's real name/email wherever we have it (same as
  // Landlord's userLabel/currentUser?.email) — mirrors PMDashboard.jsx's own
  // GET /api/auth/me/ call, just through the shared API_BASE/authHeaders()
  // this file already uses instead of a hardcoded host.
  const [currentUser, setCurrentUser] = useState(null);
  React.useEffect(() => {
    fetch(`${API_BASE}/auth/me/`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(u => setCurrentUser(u))
      .catch(() => {});
  }, []);
  const userLabel = currentUser?.full_name || currentUser?.name || currentUser?.email || 'Independent PM Account';

  const fetchSubscriptionData = React.useCallback(() => {
    setError(null);
    return Promise.all([
      fetch(`${API_BASE}/pm/plans/`, { headers: authHeaders() }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch(`${API_BASE}/pm/subscription/`, { headers: authHeaders() }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
    ])
      .then(([planList, sub]) => { setPlans(planList || []); setSubscription(sub.subscription ? sub : null); })
      .catch(() => setError('Could not load your subscription. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const fetchCatalog = React.useCallback(() => {
    setServicesError(null);
    return fetch(`${API_BASE}/pm/services/catalog/`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setServices(j.services || []))
      .catch(() => setServicesError('Could not load services. Please refresh the page.'))
      .finally(() => setServicesLoading(false));
  }, []);

  const fetchPromoSubs = React.useCallback(() => { getPromotionSubscriptions().then(d => setPromoSubs(d.subscriptions || d || [])).catch(() => {}); }, []);

  React.useEffect(() => { fetchSubscriptionData(); }, [fetchSubscriptionData]);
  React.useEffect(() => { fetchCatalog(); }, [fetchCatalog]);
  React.useEffect(() => { fetchPromoSubs(); }, [fetchPromoSubs]);
  React.useEffect(() => { getPromotionSubscriptionCatalog().then(d => setPromoCatalog(d.plans || d || [])).catch(() => {}); }, []);

  const buyGateClosed = !loading && !subscription;
  const activePromoSub = (promoSubs || []).find(s => s.is_active) || null;
  const minPromoPrice = promoCatalog.length ? Math.min(...promoCatalog.map(p => Number(p.price) || 0)) : null;

  // ─── Current Plan hero derivations — mirrors Landlord's own, with
  // monthlyPrice read from the PLAN (currentPlanObj.monthly_price), not
  // from the subscription row itself: UNSubscriptionSerializer (shared
  // across portals, core/billing/serializers.py) has no monthly_price
  // field, so deriving it from the plan is the correct source, not a cut.
  const sub = subscription?.subscription || null;
  const currentPlanObj = plans.find(p => p.id === sub?.plan) || null;
  const monthlyPrice = currentPlanObj ? (Number(currentPlanObj.monthly_price) || 0) : 0;
  const subIncludedCount = subscription?.included_services?.length || 0;
  const subAddonCount = subscription?.addons?.length || 0;
  const addonsList = subscription?.addons || [];
  const addonsTotal = addonsList.reduce((sum, a) => sum + (Number(a.price_paid) || 0), 0);
  const totalMonthlySpend = monthlyPrice + addonsTotal;
  let daysRemaining = null;
  if (sub?.next_billing_date) {
    const diffMs = new Date(sub.next_billing_date).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
  }
  const cycleDays = (sub?.billing_cycle || '').toUpperCase().startsWith('ANN') ? 365 : 30;
  let periodStart = null, progressPct = null, billingDayLabel = null;
  if (sub?.next_billing_date) {
    const nextDate = new Date(sub.next_billing_date);
    periodStart = new Date(nextDate.getTime() - cycleDays * 86400000);
    const elapsedMs = Date.now() - periodStart.getTime();
    progressPct = Math.min(100, Math.max(0, (elapsedMs / (cycleDays * 86400000)) * 100));
    billingDayLabel = ordinalDay(nextDate.getDate());
  }

  // ─── Allocated Capacity — real counts from GET /api/properties/, not
  // fabricated. "Active Tenants" (Landlord's third metric) has no PM data
  // source yet (no Tenant model built — see backlog PE-4), swapped for
  // "Properties Managed" instead of faking a number.
  const totalProperties = properties.length;
  const unitsUsed = properties.reduce((sum, p) => sum + (Number(p.unit_count) || 0), 0);
  const capMax = currentPlanObj?.unit_limit_max ?? null;
  const capPct = (capMax && totalProperties > 0) ? Math.min(100, (unitsUsed / capMax) * 100) : null;
  const ringR = 38;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = capPct != null ? ringC * (1 - capPct / 100) : ringC;

  const includedIds = new Set((subscription?.included_services || []).map(s => s.service_id));
  const ownedServices = services.filter(s => s.owned);
  const includedPlanServices = services.filter(s => includedIds.has(s.id));

  // ─── Services tab (Fourth pass) — Landlord's own plan-scoped
  // includedPlanServiceIds/addonPlanServiceIds come from currentPlanObj's
  // included_services/addon_services (GET /landlord/plans/); PMPlan has no
  // such split yet (PE-4 backlog), so planAddonServices here is simply
  // every catalog row NOT in the real included set — owned or not, so an
  // already-purchased add-on still renders with its "✓ Added" ribbon
  // instead of disappearing, same as Landlord's version.
  const planAddonServices = services.filter(s => !includedIds.has(s.id));
  // Sample fallback, same rule as the rest of this file: real section
  // pills/stat tiles above always show the real (possibly zero) counts —
  // only the carousel itself swaps to the watermarked sample set when the
  // real list for that section is empty.
  const displayIncludedServices = includedPlanServices.length > 0 ? includedPlanServices : SAMPLE_INCLUDED_SERVICES;
  const displayAddonServices = planAddonServices.length > 0 ? planAddonServices : SAMPLE_ADDON_SERVICES;
  // Horizontal scroll + arrow nav — one ref + edge-state pair per carousel,
  // re-checked whenever that carousel's card count changes.
  const inclScrollRef = React.useRef(null);
  const addonScrollRef = React.useRef(null);
  const extScrollRef = React.useRef(null);
  const [inclScrollEdges, updateInclScroll] = useHScrollEdges(inclScrollRef, [displayIncludedServices.length]);
  const [addonScrollEdges, updateAddonScroll] = useHScrollEdges(addonScrollRef, [displayAddonServices.length]);
  const [extScrollEdges, updateExtScroll] = useHScrollEdges(extScrollRef, [EXTERNAL_PROGRAMS.length]);
  const scrollCardsBy = (ref, direction) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9 * direction, behavior: 'smooth' });
  };
  // "Active Campaigns" stat tile — count of this PM's active
  // ListingPromotionSubscription rows (same real field as the Listing
  // Promotion summary card on the Subscription & Billing tab).
  const activeCampaignsCount = promoSubs.filter(s => s.is_active).length;

  // ─── PAYMENT CART INTEGRATION — mirrors LandlordSettingsPage.jsx's own
  // subscribeToPlan/handlePlanAddToCart/handleConfirmPurchase trio.
  const { items: cartItems, addItem, removeItem, isInCart } = usePaymentCart();
  const [cartOpen, setCartOpen] = useState(false);

  const serviceToCartItem = service => {
    const numericPrice = Number(service.price) || 0;
    const isFlatFee = service.price_unit === 'FLAT_FEE';
    return {
      id: service.id,
      name: service.name,
      subtitle: service.short_description,
      icon: 'ti-apps',
      priceLabel: `$${numericPrice.toFixed(2)} ${PRICE_UNIT_LABELS[service.price_unit] || ''}`,
      amountDueToday: isFlatFee ? numericPrice : 0,
      moduleKey: 'pm-service',
      meta: service,
    };
  };
  const addServiceToCart = service => { addItem(serviceToCartItem(service)); setOpenService(null); setCartOpen(true); };

  const planToCartItem = plan => ({
    id: `plan-${plan.id}`,
    name: plan.name,
    subtitle: plan.unit_limit_max != null ? `${plan.unit_limit_min}–${plan.unit_limit_max} units` : `${plan.unit_limit_min}+ units`,
    icon: 'ti-stack-2',
    priceLabel: `$${(Number(plan.monthly_price) || 0).toFixed(0)} / mo`,
    amountDueToday: Number(plan.monthly_price) || 0,
    moduleKey: 'pm-plan-subscription',
    meta: plan,
  });
  const handlePlanAddToCart = plan => {
    const existing = cartItems.find(i => i.moduleKey === 'pm-plan-subscription');
    if (existing && existing.id !== `plan-${plan.id}`) removeItem(existing.id);
    addItem(planToCartItem(plan));
    setCartOpen(true);
  };

  const subscribeToPlan = async (planId) => {
    const res = await fetch(`${API_BASE}/pm/subscription/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ plan_id: planId }) });
    if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.detail || `Could not subscribe to this plan (${res.status}).`); }
  };
  const buyServices = async (serviceIds) => {
    const res = await fetch(`${API_BASE}/pm/services/entitlement/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ service_ids: serviceIds }) });
    if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.detail || 'Could not complete this purchase.'); }
  };
  const handleConfirmPurchase = async checkedItems => {
    const serviceIds = checkedItems.filter(i => i.moduleKey === 'pm-service').map(i => i.id);
    const planItem = checkedItems.find(i => i.moduleKey === 'pm-plan-subscription');
    if (serviceIds.length === 0 && !planItem) return;
    if (serviceIds.length > 0) await buyServices(serviceIds);
    if (planItem) await subscribeToPlan(planItem.meta.id);
    await Promise.all([fetchSubscriptionData(), fetchCatalog()]);
  };

  const openPromoCatalog = () => {
    setPromoCatalogOpen(true);
    setPromoCatalogLoading(true);
    setPromoCatalogError(null);
    getPromotionSubscriptionCatalog()
      .then(d => setPromoCatalog(d.plans || d || []))
      .catch(e => setPromoCatalogError(e.message || 'Could not load Listing Promotion plans.'))
      .finally(() => setPromoCatalogLoading(false));
  };
  const handlePurchasePromoPlan = (planId) => {
    setPromoPurchasingId(planId);
    purchasePromotionSubscription(planId)
      .then(() => { fetchPromoSubs(); setPromoCatalogOpen(false); })
      .catch(e => setPromoCatalogError(e.message || 'Could not complete this purchase.'))
      .finally(() => setPromoPurchasingId(null));
  };

  return (
    <div style={S.shell}>
      <NavB activeId={activeTab === 'services' ? 'account-services' : 'account-subscription'} />
      <div style={S.main}>
        <PMTopBar />
        <div style={S.content}>
          <div style={S.crumb}>
            Account Settings <i className="ti ti-chevron-right" style={{ fontSize: 12 }} aria-hidden="true" />
            <span style={{ color: C.textSecondary }}>{activeTab === 'services' ? 'Services' : 'Subscription & Billing'}</span>
          </div>
          <div style={S.hdrRow}>
            <div>
              <h1 style={S.h1}>{activeTab === 'services' ? 'Services' : 'Subscription & Billing'}</h1>
              <p style={S.sub}>Manage your Independent PM plan, buy add-on services, and promote your listings.</p>
            </div>
            <PaymentCartTrigger onClick={() => setCartOpen(true)} theme={{ txtPrimary: C.textPrimary, cardBdr: C.borderMedium, font: F.body }} />
          </div>

          <AccountSettingsSubnav activeTab={activeTab} />

          {activeTab === 'subscription' && (
            <>
              {loading && <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '24px 0' }}>Loading your subscription…</div>}
              {!loading && error && (
                <div style={{ ...S.emptyState, marginBottom: 20 }}>
                  <p style={S.emptyP}>{error}</p>
                  <button style={S.btnPrimary} onClick={fetchSubscriptionData}>Retry</button>
                </div>
              )}
              {!loading && !error && (
                <>
                  <div style={S.subGrid}>
                    <div style={S.subLeftCol}>
                      {sub ? (
                        <div style={S.curPlanCard}>
                          <div style={S.curPlanImgBanner}>
                            {currentPlanObj?.image_url ? (
                              <img src={currentPlanObj.image_url} alt={sub.plan_name} style={S.curPlanImgBannerImg} />
                            ) : (
                              <div style={S.curPlanImgBannerPlaceholder}><i className="ti ti-stack-2" aria-hidden="true" /></div>
                            )}
                            <div style={S.curPlanImgBannerFade} />
                          </div>
                          <div style={S.curPlanCardBody}>
                            <div style={S.curPlanTopRow}>
                              <div>
                                <div style={S.curPlanTierRow}>
                                  <span style={S.curPlanTierLabel}>Active Tier</span>
                                  <span style={S.pillActive}>● {sub.status || 'Active'}</span>
                                  <span style={S.curPlanPersonaPill}>Independent PM</span>
                                </div>
                                <div style={S.curPlanTitle}>{sub.plan_name}</div>
                                {sub.created_at && (
                                  <div style={S.curPlanDateRange}>
                                    <i className="ti ti-calendar-event" aria-hidden="true" />
                                    Active {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {sub.next_billing_date ? ` – ${new Date(sub.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ' – ongoing'}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div style={S.curPlanPriceBig}>${monthlyPrice.toFixed(2)}</div>
                                <div style={S.curPlanPriceSub}>
                                  {sub.billing_cycle || 'Monthly'}{billingDayLabel ? ` (billed on the ${billingDayLabel})` : ''}
                                </div>
                              </div>
                            </div>

                            {currentPlanObj?.long_description && (
                              <p style={S.curPlanDesc}>{currentPlanObj.long_description}</p>
                            )}

                            <div style={S.curPlanDivider} />

                            <div style={S.curPlanTilesRow}>
                              <div style={S.curPlanTile}>
                                <span style={S.curPlanTileIcon}><i className="ti ti-shield-check" aria-hidden="true" /></span>
                                <div>
                                  <div style={S.curPlanTileLabel}>Entitlement</div>
                                  <div style={S.curPlanTileValue}>{subIncludedCount} included · {subAddonCount} add-on{subAddonCount === 1 ? '' : 's'}</div>
                                  <div style={S.curPlanTileSub}>Billed {sub.billing_cycle || 'monthly'} · {sub.country}</div>
                                </div>
                              </div>
                              <div style={S.curPlanTile}>
                                <span style={S.curPlanTileIcon}><i className="ti ti-calendar-event" aria-hidden="true" /></span>
                                <div>
                                  <div style={S.curPlanTileLabel}>Next Charge Scheduled</div>
                                  <div style={S.curPlanTileValue}>
                                    {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not scheduled'}
                                  </div>
                                  <div style={S.curPlanTileSub}>Automatic charge of ${monthlyPrice.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>

                            {progressPct !== null && (
                              <div style={S.curPlanProgressWrap}>
                                <div style={S.curPlanProgressLabelRow}>
                                  <span style={S.curPlanProgressLabel}>Billing Period Progress</span>
                                  <span style={S.curPlanProgressRemaining}>{daysRemaining !== null ? `${daysRemaining} days remaining` : ''}</span>
                                </div>
                                <div style={S.curPlanProgressOuter}><div style={S.curPlanProgressInner(progressPct)} /></div>
                                <div style={S.curPlanProgressDates}>
                                  <span>{periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  <span>{new Date(sub.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              </div>
                            )}

                            {(subscription.included_services?.length > 0 || subscription.addons?.length > 0) && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                                {subscription.included_services?.map(s => (
                                  <span key={`inc-${s.id || s.service_name}`} style={{ ...S.svcBadge, background: C.greenBg, color: C.green }}>✓ {s.service_name}</span>
                                ))}
                                {subscription.addons?.map(a => (
                                  <span key={`add-${a.id || a.service_name}`} style={{ ...S.svcBadge, background: C.blueBg, color: C.primary }}>+ {a.service_name} (add-on)</span>
                                ))}
                              </div>
                            )}

                            <div style={S.curPlanActionsRow}>
                              <button style={S.btnPrimary} onClick={() => availablePlansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                                Upgrade Plan
                              </button>
                              <button style={S.btnSecondary} onClick={() => availablePlansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                                Change Plan
                              </button>
                              <button style={S.curPlanBtnCancel} disabled title="Cancellation isn't wired up yet">
                                <i className="ti ti-x" aria-hidden="true" /> Cancel Subscription
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={S.curPlanCard}>
                          <div style={S.curPlanCardBody}>
                            <div style={S.curPlanEmpty}>
                              <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14 }}>
                                You don't have an active plan yet. Subscribe to a plan below to unlock Buy Service for add-on services.
                              </p>
                              <button style={S.btnPrimary} onClick={() => availablePlansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                                Browse Available Plans
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={S.subMidCol}>
                      <div style={S.bbCard}>
                        <div style={S.bbHeaderRow}>
                          <div style={S.bbTitle}>Billing Breakdown</div>
                          <span style={S.bbIcon}><i className="ti ti-receipt" aria-hidden="true" /></span>
                        </div>
                        {sub ? (
                          <div style={S.bbRows}>
                            <div style={S.bbRow}>
                              <div>
                                <div style={S.bbRowLabel}>Base Plan</div>
                                <div style={S.bbRowSub}>{sub.plan_name}</div>
                              </div>
                              <span style={S.bbRowValue}>${monthlyPrice.toFixed(2)}</span>
                            </div>
                            <div style={S.bbRow}>
                              <div>
                                <div style={S.bbRowLabel}>Add-ons</div>
                                <div style={S.bbRowSub}>{addonsList.length} active</div>
                              </div>
                              <span style={S.bbRowValue}>${addonsTotal.toFixed(2)}</span>
                            </div>
                            <div style={S.bbDivider} />
                            <div style={S.bbTotalRow}>
                              <span style={S.bbTotalLabel}>Total Monthly</span>
                              <span style={S.bbTotalValue}>${totalMonthlySpend.toFixed(2)}</span>
                            </div>
                            <div style={S.bbTotalSub}>{sub.currency || 'USD'} · billed {sub.billing_cycle || 'monthly'}</div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11.5, color: C.textTertiary }}>Subscribe to a plan to see your monthly billing breakdown here.</div>
                        )}
                      </div>

                      <div style={S.eeCard}>
                        <div style={S.eeLabel}>Expand Your Plan</div>
                        <div style={S.eeTitle}>
                          {capMax != null ? `Managing more than ${capMax} units?` : 'Growing your portfolio?'}
                        </div>
                        <div style={S.eeBody}>
                          Higher-tier plans widen your unit range and bundle more included services — browse the full catalog below.
                        </div>
                        <button style={S.eeCta} onClick={() => availablePlansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                          Explore Higher-Tier Plans <i className="ti ti-arrow-right" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div style={S.subRightCol}>
                      <div style={S.acCard}>
                        <div style={S.acHeaderRow}>
                          <div style={S.acTitle}>Allocated Capacity</div>
                          <span style={S.acIcon}><i className="ti ti-chart-donut" aria-hidden="true" /></span>
                        </div>
                        <div style={S.acRingRow}>
                          <div style={S.acRingWrap}>
                            <svg viewBox="0 0 84 84" width="84" height="84">
                              <circle cx="42" cy="42" r={ringR} fill="none" stroke={C.neutral} strokeWidth="8" />
                              {capPct !== null && (
                                <circle
                                  cx="42" cy="42" r={ringR} fill="none" stroke={C.green} strokeWidth="8"
                                  strokeDasharray={ringC} strokeDashoffset={ringOffset} strokeLinecap="round"
                                  transform="rotate(-90 42 42)"
                                />
                              )}
                            </svg>
                            <div style={S.acRingCenter}>
                              <span style={S.acRingValue}>{unitsUsed || '—'}</span>
                              {capMax != null && <span style={S.acRingOf}>OF {capMax}</span>}
                            </div>
                          </div>
                          <div>
                            <div style={S.acRingLabel}>Active Units Managed</div>
                            <div style={S.acRingSub}>
                              {capPct !== null
                                ? `${Math.round(capPct)}% of plan's unit range utilized`
                                : (totalProperties > 0 ? 'No unit cap on current plan' : 'No properties yet')}
                            </div>
                            {capMax != null && totalProperties > 0 && (
                              <div style={S.acRingPct}>{Math.max(0, capMax - unitsUsed)} units remaining in range</div>
                            )}
                          </div>
                        </div>
                        <div style={S.acDivider} />
                        <div style={S.acMetricRow}>
                          <span style={S.acMetricLabel}>Properties Managed</span>
                          <span style={S.acMetricValue}>{totalProperties}</span>
                        </div>
                        <div style={S.acMetricRow}>
                          <span style={S.acMetricLabel}>Total Units</span>
                          <span style={S.acMetricValue}>{unitsUsed}</span>
                        </div>
                        <div style={S.acMetricRow}>
                          <span style={S.acMetricLabel}>Services Active</span>
                          <span style={S.acMetricValue}>{subIncludedCount + subAddonCount}</span>
                        </div>
                      </div>

                      <div style={S.lpSummaryCard}>
                        <div style={S.lpSummaryHeaderRow}>
                          <div style={S.lpSummaryTitle}>Listing Promotion</div>
                          <span style={S.lpSummaryIcon}><i className="ti ti-ad-2" aria-hidden="true" /></span>
                        </div>
                        {activePromoSub ? (
                          <>
                            <div style={S.lpSummaryPlanName}>{activePromoSub.plan_detail?.name || activePromoSub.plan_name || 'Plan'}</div>
                            <div style={{ marginBottom: 8 }}><span style={S.pillActive}>● Active</span></div>
                            <div style={S.lpSummaryMetricRow}>
                              <span style={S.lpSummaryMetricLabel}>Price Paid</span>
                              <span style={S.lpSummaryMetricValue}>${Number(activePromoSub.price_paid || 0).toFixed(2)}</span>
                            </div>
                            {activePromoSub.expires_at && (
                              <div style={S.lpSummaryMetricRow}>
                                <span style={S.lpSummaryMetricLabel}>Valid Through</span>
                                <span style={S.lpSummaryMetricValue}>{new Date(activePromoSub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={S.lpSummaryEmpty}>No standing Listing Promotion plan purchased yet — pre-buy one to skip paying again at your next listing's Step 3.</div>
                            <button style={S.eeCta} onClick={openPromoCatalog}>
                              Explore Plans <i className="ti ti-arrow-right" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={S.subAvailablePlansBlock}>
                      <div ref={availablePlansRef} style={S.sectionHdr}>
                        <div style={S.sectionH2}>Available Plans</div>
                        <span style={S.sectionCount}>{plans.length} plan(s) available for Independent PM</span>
                      </div>
                      <div style={S.planCarouselWrap}>
                        <button
                          style={{ ...S.planCarouselArrow, ...(planScrollState.atStart ? S.planCarouselArrowDisabled : {}) }}
                          onClick={() => scrollPlans(-1)}
                          disabled={planScrollState.atStart}
                          aria-label="Scroll plans left"
                        >
                          <i className="ti ti-chevron-left" aria-hidden="true" />
                        </button>

                        <style>{`.pm-plan-carousel-track::-webkit-scrollbar { display: none; }`}</style>
                        <div
                          ref={planTrackRef}
                          className="pm-plan-carousel-track"
                          style={S.planCarouselTrack}
                          onScroll={updatePlanScrollState}
                        >
                          {plans.map(p => {
                            const isCurrent = sub && sub.plan === p.id;
                            const inCart = cartItems.some(i => i.id === `plan-${p.id}`);
                            const monthly = Number(p.monthly_price) || 0;
                            const annual = p.annual_price != null ? Number(p.annual_price) : null;
                            const unitLabel = p.unit_limit_max != null ? `${p.unit_limit_min}–${p.unit_limit_max} units` : `${p.unit_limit_min}+ units`;
                            const includedCount2 = p.included_services?.length || 0;
                            const addonCount2 = p.addon_services?.length || 0;
                            return (
                              <div key={p.id} data-plan-card style={S.planCardV2(isCurrent)}>
                                <div style={S.planCardImgWrap}>
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} style={S.planCardImg} />
                                  ) : (
                                    <div style={S.planCardImgPlaceholder}><i className="ti ti-stack-2" aria-hidden="true" /></div>
                                  )}
                                  <div style={S.planCardGradient} />
                                  <span style={S.planCardStatusPill}>{isCurrent ? '● Active' : 'Active'}</span>
                                  <span style={S.planCardCurrencyPill}>{p.monthly_price_currency}</span>
                                  <div style={S.planCardImgName}>{p.name}</div>
                                </div>
                                <div style={S.planCardBodyV2}>
                                  <span style={S.planCardUnitChip}>{unitLabel}</span>
                                  <div>
                                    <span style={S.planCardPriceV2}>${monthly.toFixed(0)}</span>
                                    <span style={S.planCardPriceUnit}> / mo</span>
                                  </div>
                                  {annual !== null && <div style={S.planCardAnnual}>(${annual.toLocaleString()} / yr)</div>}
                                  <p style={S.planCardDescV2}>{p.short_description}</p>
                                  {includedCount2 > 0 && (
                                    <div style={{ ...S.planCardMetaLine, ...S.planCardMetaIncluded }}>
                                      <i className="ti ti-check" aria-hidden="true" /> {includedCount2} service{includedCount2 === 1 ? '' : 's'} included
                                    </div>
                                  )}
                                  {addonCount2 > 0 && (
                                    <div style={{ ...S.planCardMetaLine, ...S.planCardMetaAddon }}>
                                      <i className="ti ti-plus" aria-hidden="true" /> {addonCount2} add-on{addonCount2 === 1 ? '' : 's'} available
                                    </div>
                                  )}
                                  <button
                                    style={{
                                      ...S.planCardBtnPill,
                                      ...(isCurrent ? S.planCardBtnPillOutline : inCart ? S.svcBtnInCart : S.planCardBtnPillSolid),
                                    }}
                                    disabled={isCurrent}
                                    onClick={() => handlePlanAddToCart(p)}
                                    title={inCart ? 'In your cart — click the cart to review and confirm' : undefined}
                                  >
                                    {isCurrent ? 'Current Plan' : inCart ? '✓ In Cart — Review' : 'Subscribe'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          style={{ ...S.planCarouselArrow, ...(planScrollState.atEnd ? S.planCarouselArrowDisabled : {}) }}
                          onClick={() => scrollPlans(1)}
                          disabled={planScrollState.atEnd}
                          aria-label="Scroll plans right"
                        >
                          <i className="ti ti-chevron-right" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods & Details — ported 1:1 from Landlord's own
                      structure/layout (per the reviewer's "implement exactly as
                      Landlord, even with sample data" instruction). No payment
                      gateway exists on either portal, so the card number/EIN/
                      entity fields below are sample data, same as Landlord's own
                      page — every disabled action says why. Card Holder and
                      Invoicing Email use this PM's real name/email wherever
                      currentUser has it. Linked Bank Accounts stays sample here
                      too (PM's real Bank Accounts tab is its own separate page/
                      fetch, not shared state with this one). */}
                  <div style={S.figmaCard}>
                    <div style={S.figmaCardHdr}>
                      <div>
                        <div style={S.figmaCardTitle}>Payment Methods &amp; Details</div>
                        <div style={S.figmaCardSub}>Primary settlement instruments, commercial billing entity identification, and linked settlement accounts.</div>
                      </div>
                      <button style={S.figmaOutlineBtn} disabled title="Payment gateway not yet integrated">
                        <i className="ti ti-plus" aria-hidden="true" /> Add New Card
                      </button>
                    </div>
                    <div style={S.figmaDivider} />

                    <div style={S.pmThreeCol}>
                      <div style={S.pmCol}>
                        <div style={S.pmColLabelRow}>
                          <span style={S.pmColLabel}>Active Payment Instrument</span>
                          <span style={S.pillDefault}>Default</span>
                        </div>
                        <div style={S.pmCreditCard}>
                          <div style={S.pmCardLogoWrap}>
                            <div style={S.pmCardLogoCircles}>
                              <span style={S.pmCardCircleRed} />
                              <span style={S.pmCardCircleOrange} />
                            </div>
                            <div style={S.pmCardBrand}>Mastercard</div>
                          </div>
                          <div style={S.pmCardType}>Corporate Card</div>
                          <div style={S.pmCardNumber}>•••• •••• •••• 4242</div>
                          <div style={S.pmCardMetaRow}>
                            <div>
                              <div style={S.pmCardMetaLabel}>Card Holder</div>
                              <div style={S.pmCardMetaValue}>{userLabel.toUpperCase()}</div>
                            </div>
                            <div>
                              <div style={S.pmCardMetaLabel}>Expires</div>
                              <div style={S.pmCardMetaValue}>08/28</div>
                            </div>
                          </div>
                        </div>
                        <div style={S.pmBelowCard}>
                          <span style={S.pmAutoDebit}><i className="ti ti-refresh" aria-hidden="true" /> Auto-debit enabled for scheduled billings</span>
                          <button style={S.figmaLinkBtn} disabled title="Payment gateway not yet integrated">Change Default</button>
                        </div>
                      </div>

                      <div style={S.pmCol}>
                        <div style={S.pmColLabelRow}>
                          <span style={S.pmColLabel}>Commercial Entity Information</span>
                          <button style={S.figmaLinkBtn} disabled title="Billing entity management isn't wired up yet">
                            <i className="ti ti-pencil" aria-hidden="true" /> Edit Billing Info
                          </button>
                        </div>
                        <div style={S.pmEntityBox}>
                          <div style={S.pmEntityHead}>
                            <span style={S.pmEntityIcon}><i className="ti ti-building" aria-hidden="true" /></span>
                            <div>
                              <div style={S.pmEntityName}>{userLabel !== 'Independent PM Account' ? `${userLabel} — Independent PM` : 'Independent PM Account'}</div>
                              <div style={S.pmEntityAddr}>45 Spring Borough Ct<br />O'Fallon, Missouri, 63368<br />US</div>
                            </div>
                          </div>
                          <div style={S.pmEntityDivider} />
                          <div style={S.pmEntityRow}>
                            <span style={S.pmEntityIcon}><i className="ti ti-briefcase" aria-hidden="true" /></span>
                            <div>
                              <div style={S.pmEntityRowLabel}>Federal Tax ID / EIN</div>
                              <div style={S.pmEntityRowValue}>US-EIN-98-7654321</div>
                            </div>
                          </div>
                          <div style={S.pmEntityRow}>
                            <span style={S.pmEntityIcon}><i className="ti ti-mail" aria-hidden="true" /></span>
                            <div>
                              <div style={S.pmEntityRowLabel}>Invoicing Email</div>
                              <div style={S.pmEntityRowValue}>{currentUser?.email || 'billing@independentpm.com'}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={S.pmCol}>
                        <div style={S.pmColLabelRow}>
                          <span style={S.pmColLabel}>Linked Bank Accounts</span>
                        </div>
                        <div style={S.pmEntityBox}>
                          <div style={S.pmEntityHead}>
                            <span style={S.pmEntityIcon}><i className="ti ti-building-bank" aria-hidden="true" /></span>
                            <div>
                              <div style={S.pmEntityName}>Chase Bank</div>
                              <div style={S.pmEntityAddr}>•••• 1212 · USD · Default</div>
                            </div>
                          </div>
                          <div style={S.pmEntityDivider} />
                          <div style={S.pmEntityRow}>
                            <span style={S.pmEntityIcon}><i className="ti ti-list" aria-hidden="true" /></span>
                            <div>
                              <div style={S.pmEntityRowLabel}>Total Linked Accounts</div>
                              <div style={S.pmEntityRowValue}>3</div>
                            </div>
                          </div>
                        </div>
                        <div style={S.pmBelowCard}>
                          <span style={{ fontSize: 11, color: C.textTertiary }}>Used for rent &amp; service payouts</span>
                          <button style={S.figmaLinkBtn} onClick={() => navigate('/pm-portal/account/bank-accounts')}>
                            Manage <i className="ti ti-arrow-right" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={S.pmTaxBanner}>
                      <i className="ti ti-shield-check" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                      Entity registered for tax exemption under NY State Commercial Realty Statute.
                    </div>
                  </div>

                  {/* Billing History & Invoices — same rebuild rationale as above.
                      No invoice-read endpoint exists for PM yet, so the rows are
                      sample data; search/export/pagination are disabled with
                      tooltips, same as Landlord's own version of this card. */}
                  <div style={S.figmaCard}>
                    <div style={S.figmaCardHdr}>
                      <div>
                        <div style={S.figmaCardTitle}>Billing History &amp; Invoices</div>
                        <div style={S.figmaCardSub}>Historical statements, reconciliation vouchers, and official tax receipts.</div>
                      </div>
                      <div style={S.bhToolbarRow}>
                        <div style={S.bhSearchWrap}>
                          <i className="ti ti-search" style={S.bhSearchIcon} aria-hidden="true" />
                          <input style={S.bhSearchInput} placeholder="Search by invoice ID..." disabled title="Invoice search isn't wired up yet" />
                        </div>
                        <div style={S.bhYearDropdownWrap} title="Invoice filtering isn't wired up yet">
                          <CustomDropdown options={[{ value: '2026', label: '2026' }]} value="2026" onChange={() => {}} placeholder="2026" disabled />
                        </div>
                      </div>
                    </div>
                    <div style={S.figmaDivider} />

                    <button style={{ ...S.figmaOutlineBtn, marginBottom: 14 }} disabled title="Invoice export isn't wired up yet">
                      <i className="ti ti-download" aria-hidden="true" /> Export CSV
                    </button>

                    <table style={S.bhTable}>
                      <thead>
                        <tr>
                          <th style={S.bhTh}>Invoice Number</th>
                          <th style={S.bhTh}>Billing Date</th>
                          <th style={S.bhTh}>Description</th>
                          <th style={S.bhTh}>Amount</th>
                          <th style={S.bhTh}>Status</th>
                          <th style={S.bhTh}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { inv: 'INV-2026-009', date: 'Sep 30, 2026' },
                          { inv: 'INV-2026-008', date: 'Aug 31, 2026' },
                          { inv: 'INV-2026-007', date: 'Jul 31, 2026' },
                          { inv: 'INV-2026-006', date: 'Jun 30, 2026' },
                        ].map(row => (
                          <tr key={row.inv}>
                            <td style={S.bhTd}>{row.inv}</td>
                            <td style={S.bhTd}>{row.date}</td>
                            <td style={S.bhTd}>{sub?.plan_name || 'Independent PM Plan'} — Monthly Subscription</td>
                            <td style={S.bhTd}>${monthlyPrice.toFixed(2)} {sub?.currency || 'USD'}</td>
                            <td style={S.bhTd}><span style={S.bhPaidPill}>● Paid</span></td>
                            <td style={S.bhTd}>
                              <button style={S.bhDownloadBtn} disabled title="Invoice downloads aren't wired up yet">
                                <i className="ti ti-download" aria-hidden="true" /> Download PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={S.bhFooterRow}>
                      <span>Showing 4 of 4 generated receipts for current fiscal period</span>
                      <div style={S.bhPagination}>
                        <button style={S.bhPageBtn} disabled title="Pagination isn't wired up yet"><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                        <button style={{ ...S.bhPageBtn, ...S.bhPageBtnActive }} disabled>1</button>
                        <button style={S.bhPageBtn} disabled title="Pagination isn't wired up yet"><i className="ti ti-chevron-right" aria-hidden="true" /></button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'services' && (
            <>
              {servicesLoading && <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '24px 0' }}>Loading services…</div>}
              {!servicesLoading && servicesError && (
                <div style={{ ...S.emptyState, marginBottom: 20 }}>
                  <p style={S.emptyP}>{servicesError}</p>
                  <button style={S.btnPrimary} onClick={fetchCatalog}>Retry</button>
                </div>
              )}
              {!servicesLoading && !servicesError && (
                <>
                  {buyGateClosed && (
                    <div style={S.gateBanner}>
                      <div style={S.gateBannerText}><strong>Subscribe to a Plan first</strong> — buying an add-on service requires an active subscription.</div>
                      <button style={S.btnPrimary} onClick={() => navigate('/pm-portal/account/subscription')}>Go to Subscription & Billing</button>
                    </div>
                  )}

                  {/* Stat tiles — 5 tiles, real counts only. */}
                  <div style={S.statRow}>
                    <div style={S.statTile(C.primary, C.blueBg)}>
                      <div style={S.statTileTop}>
                        <span style={S.statLabel}>Total Active Services</span>
                        <span style={S.statIconTint(C.blueBg, C.primary)}><i className="ti ti-apps" aria-hidden="true" /></span>
                      </div>
                      <div style={S.statValue}>{ownedServices.length}</div>
                      <div style={S.statSub}>
                        {subscription ? `${subIncludedCount} included, ${subAddonCount} add-on${subAddonCount === 1 ? '' : 's'} purchased` : 'No active services yet'}
                      </div>
                    </div>
                    <div style={S.statTile(C.primary, C.blueBg)}>
                      <div style={S.statTileTop}>
                        <span style={S.statLabel}>Included With Plan</span>
                        <span style={S.statIconTint(C.blueBg, C.primary)}><i className="ti ti-package" aria-hidden="true" /></span>
                      </div>
                      <div style={S.statValue}>{subIncludedCount}</div>
                      <div style={S.statSub}>{subscription ? `Covered by ${sub?.plan_name || 'your plan'}` : 'Subscribe to a plan to unlock included services'}</div>
                    </div>
                    <div style={S.statTile(C.blue, C.blueBg)}>
                      <div style={S.statTileTop}>
                        <span style={S.statLabel}>Active Add-On's</span>
                        <span style={S.statIconTint(C.blueBg, C.blue)}><i className="ti ti-circle-check" aria-hidden="true" /></span>
                      </div>
                      <div style={S.statValue}>{subAddonCount}</div>
                      <div style={S.statSub}>Purchased beyond your plan</div>
                    </div>
                    <div style={S.statTile(C.green, C.greenBg)}>
                      <div style={S.statTileTop}>
                        <span style={S.statLabel}>Available Add-On's</span>
                        <span style={S.statIconTint(C.greenBg, C.green)}><i className="ti ti-plus" aria-hidden="true" /></span>
                      </div>
                      <div style={S.statValue}>{planAddonServices.filter(s => !s.owned).length}</div>
                      <div style={S.statSub}>{buyGateClosed ? 'Subscribe to a plan first' : 'Ready to purchase for your plan'}</div>
                    </div>
                    <div style={S.statTile(C.amber, C.amberBg)}>
                      <div style={S.statTileTop}>
                        <span style={S.statLabel}>Active Campaigns</span>
                        <span style={S.statIconTint(C.amberBg, C.amber)}><i className="ti ti-rocket" aria-hidden="true" /></span>
                      </div>
                      <div style={S.statValue}>{activeCampaignsCount}</div>
                      <div style={S.statSub}>Listing Promotion subscriptions</div>
                    </div>
                  </div>

                  {/* "Included with Your Plan" — real entitled services,
                      no Buy Service button since there's nothing to buy. */}
                  <div style={S.svcSectionHdr}>
                    <div style={S.svcSectionTop}>
                      <div style={S.svcSectionTitleRow}>
                        <div style={S.svcSectionH2}>Included with Your Plan</div>
                        <span style={S.svcSectionPill}>{includedPlanServices.length} Active Service{includedPlanServices.length === 1 ? '' : 's'}{subscription ? ` • ${sub?.plan_name || ''}` : ''}</span>
                      </div>
                      <button style={S.svcSectionLink} onClick={() => navigate('/pm-portal/account/subscription')}>Manage Plan Limits <i className="ti ti-arrow-right" aria-hidden="true" /></button>
                    </div>
                  </div>
                  {includedPlanServices.length === 0 && (
                    <p style={S.svcSampleNote}>
                      {subscription ? 'Your current plan has no services included by default.' : 'Subscribe to a plan to see what’s included.'} Showing sample cards below for preview.
                    </p>
                  )}
                  <div style={{ ...S.svcScrollOuter, marginBottom: 28 }}>
                    <div style={S.svcScrollRow} ref={inclScrollRef} onScroll={updateInclScroll}>
                      {displayIncludedServices.map((s, i) => {
                        const isSample = !!s.isSample;
                        return (
                          <div key={`inc-${s.id}`} style={{ ...S.svcCard, ...S.svcCardW3 }} onClick={() => { if (!isSample) setOpenService(s); }}>
                            <div style={{ ...S.svcMedia, backgroundImage: `url(${s.image || visualFor(INCLUDED_VISUALS, i)})` }}>
                              {isSample ? (
                                <span style={S.svcSamplePill}>Sample</span>
                              ) : (
                                <span style={S.svcMediaStatusPill}><i className="ti ti-circle-check" aria-hidden="true" /> Active</span>
                              )}
                            </div>
                            <div style={S.svcBody}>
                              <div style={{ ...S.svcTitleSerif, ...S.svcTitleClamp }}>{s.name}</div>
                              <p style={S.svcDesc}>{s.short_description}</p>
                              <div style={S.svcDivider} />
                              <div style={S.svcBtnRow}>
                                <button
                                  style={{ ...S.svcBtn, ...S.svcBtnViewDisabled, flex: 1, marginTop: 0 }}
                                  disabled
                                  title={isSample ? 'Sample service — not part of your real plan' : "Service configuration isn't built yet"}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Configure
                                </button>
                                <button
                                  style={{ ...S.svcBtn, ...(isSample ? S.svcBtnBlueDisabled : S.svcBtnBlue), flex: 1, marginTop: 0 }}
                                  disabled={isSample}
                                  title={isSample ? 'Sample service — not part of your real plan' : undefined}
                                  onClick={e => { e.stopPropagation(); if (!isSample) setOpenService(s); }}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      style={{ ...S.svcArrowBtn, ...S.svcArrowLeft, ...(inclScrollEdges.atStart ? S.svcArrowDisabled : {}) }}
                      onClick={() => scrollCardsBy(inclScrollRef, -1)}
                      disabled={inclScrollEdges.atStart}
                      aria-label="Scroll included services left"
                    ><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                    <button
                      style={{ ...S.svcArrowBtn, ...S.svcArrowRight, ...(inclScrollEdges.atEnd ? S.svcArrowDisabled : {}) }}
                      onClick={() => scrollCardsBy(inclScrollRef, 1)}
                      disabled={inclScrollEdges.atEnd}
                      aria-label="Scroll included services right"
                    ><i className="ti ti-chevron-right" aria-hidden="true" /></button>
                  </div>

                  {/* "Add-Ons for Your Plan" — every catalog service not
                      already included; not-yet-purchased ones get a real
                      Buy flow, already-purchased ones get an "✓ Added"
                      ribbon and a disabled "Configure Service" action. */}
                  <div style={S.svcSectionHdr}>
                    <div style={S.svcSectionTop}>
                      <div style={S.svcSectionTitleRow}>
                        <div style={S.svcSectionH2}>Add-Ons for Your Plan</div>
                        <span style={S.svcSectionPill}>{planAddonServices.filter(s => !s.owned).length} Available • {planAddonServices.filter(s => s.owned).length} Added</span>
                      </div>
                    </div>
                    <p style={S.svcSectionSub}>Extend your plan with optional add-on services — activate instantly, cancel anytime.</p>
                  </div>
                  {planAddonServices.length === 0 && (
                    <p style={S.svcSampleNote}>
                      {subscription ? 'Your current plan has no add-on services configured.' : 'Subscribe to a plan to see its available add-ons.'} Showing sample cards below for preview.
                    </p>
                  )}
                  <div style={{ ...S.svcScrollOuter, marginBottom: 28 }}>
                    <div style={S.svcScrollRow} ref={addonScrollRef} onScroll={updateAddonScroll}>
                      {displayAddonServices.map((s, i) => {
                        const isSample = !!s.isSample;
                        const inCart = !isSample && isInCart(s.id);
                        const flavor = flavorFor(i);
                        const priceBig = isSample ? s.priceDisplay : `$${(Number(s.price) || 0).toFixed(2)}`;
                        const priceUnit = isSample ? s.priceUnitDisplay : (PRICE_UNIT_LABELS[s.price_unit] || '');
                        return (
                          <div key={`addon-${s.id}`} style={{ ...S.svcCard, ...S.svcCardW3 }} onClick={() => { if (!isSample) setOpenService(s); }}>
                            <div style={{ ...S.svcMedia, backgroundImage: `url(${s.image || visualFor(ADDON_VISUALS, i)})` }}>
                              {isSample ? (
                                <span style={S.svcSamplePill}>Sample</span>
                              ) : (
                                <span style={{ ...S.svcMediaRibbon, ...(s.owned ? S.svcMediaRibbonAccent : {}) }}>
                                  {s.owned ? '✓ Added' : flavor.ribbon}
                                </span>
                              )}
                            </div>
                            <div style={S.svcBody}>
                              <div style={{ ...S.svcTitleSerif, ...S.svcTitleClamp }}>{s.name}</div>
                              <p style={S.svcDesc}>{s.short_description}</p>
                              <div style={S.svcDivider} />
                              <div style={S.svcPriceRow}>
                                <div>
                                  <span style={S.svcPriceBig}>{priceBig}</span>
                                  <span style={S.svcPriceUnit}>{priceUnit}</span>
                                </div>
                                <span style={S.svcPriceCaption}>{flavor.caption}</span>
                              </div>
                              {isSample ? (
                                <button
                                  style={{ ...S.svcBtn, ...S.svcBtnBlueBorderedDisabled }}
                                  disabled
                                  title="Sample service — not part of your real plan"
                                  onClick={e => e.stopPropagation()}
                                >
                                  + Add to Plan
                                </button>
                              ) : s.owned ? (
                                <button
                                  style={{ ...S.svcBtn, ...S.svcBtnViewDisabled }}
                                  disabled
                                  title="Service configuration isn't built yet"
                                  onClick={e => e.stopPropagation()}
                                >
                                  Configure Service
                                </button>
                              ) : (
                                <button
                                  style={{ ...S.svcBtn, ...(inCart ? S.svcBtnInCart : buyGateClosed ? S.svcBtnDisabled : S.svcBtnBlueBordered) }}
                                  disabled={buyGateClosed && !inCart}
                                  title={buyGateClosed ? 'Subscribe to a plan first to buy add-on services' : undefined}
                                  onClick={e => { e.stopPropagation(); if (!inCart && !buyGateClosed) addServiceToCart(s); }}
                                >
                                  {inCart ? '✓ In Cart' : buyGateClosed ? 'Subscribe First' : '+ Add to Plan'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      style={{ ...S.svcArrowBtn, ...S.svcArrowLeft, ...(addonScrollEdges.atStart ? S.svcArrowDisabled : {}) }}
                      onClick={() => scrollCardsBy(addonScrollRef, -1)}
                      disabled={addonScrollEdges.atStart}
                      aria-label="Scroll add-on services left"
                    ><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                    <button
                      style={{ ...S.svcArrowBtn, ...S.svcArrowRight, ...(addonScrollEdges.atEnd ? S.svcArrowDisabled : {}) }}
                      onClick={() => scrollCardsBy(addonScrollRef, 1)}
                      disabled={addonScrollEdges.atEnd}
                      aria-label="Scroll add-on services right"
                    ><i className="ti ti-chevron-right" aria-hidden="true" /></button>
                  </div>

                  {/* Listing Promotion — "advertisement" section. "Browse
                      Active Inventory" is real navigation to this portal's
                      actual Listings Overview route. */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={S.promoAdSection}>
                      <div style={S.promoAdLeft}>
                        <span style={S.promoAdBadge}><i className="ti ti-building-skyscraper" aria-hidden="true" /> UrbanNest Marketplace</span>
                        <div style={S.promoAdHeadline}>Get your listings seen first.</div>
                        <div style={S.promoAdSub}>
                          Buy a Listing Promotion plan once, then apply it free on any eligible listing later — no extra charge at publish time ("Already Paid").
                        </div>
                        <div style={S.promoAdDivider} />
                        <div style={S.promoAdStatsRow}>
                          <div style={S.promoAdStat}>
                            <div style={S.promoAdStatValue}>{activeCampaignsCount}</div>
                            <div style={S.promoAdStatLabel}>Active Slots</div>
                          </div>
                          <div style={S.promoAdStat}>
                            <div style={S.promoAdStatValue}>{minPromoPrice !== null ? `$${minPromoPrice.toFixed(0)}` : '—'}</div>
                            <div style={S.promoAdStatLabel}>Starting At</div>
                          </div>
                          <div style={S.promoAdStat}>
                            <div style={S.promoAdStatValue}>{promoCatalog.length}</div>
                            <div style={S.promoAdStatLabel}>Plan Tiers</div>
                          </div>
                        </div>
                      </div>
                      <div style={S.promoAdRight}>
                        <button style={S.promoAdCta} onClick={openPromoCatalog}>
                          {activePromoSub ? 'Explore More Plans' : 'Explore Promotion Plans'} <i className="ti ti-arrow-right" aria-hidden="true" />
                        </button>
                        <button style={S.promoAdCtaSecondary} onClick={() => navigate('/pm-portal/marketing/listings')}>
                          <i className="ti ti-eye" aria-hidden="true" /> Browse Active Inventory
                        </button>
                        {activePromoSub && (
                          <div style={S.promoAdActiveNote}>
                            ✓ Already Paid — {activePromoSub.plan_detail?.name || activePromoSub.plan_name || 'Plan'} · valid through {new Date(activePromoSub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* External marketing teaser — nothing here has a real
                      backend anywhere in this codebase; every card is
                      explicitly sample/"Coming Soon", not purchasable. */}
                  <div style={S.svcSectionHdr}>
                    <div style={S.svcSectionTop}>
                      <div style={S.svcSectionTitleRow}>
                        <div style={S.svcSectionH2}>More From UrbanNest</div>
                      </div>
                      <span style={S.svcSectionCaption}>Early Access Pipeline</span>
                    </div>
                    <p style={S.svcSectionSub}>Exclusive resident perks and auxiliary revenue opportunities designed for your portfolio.</p>
                  </div>
                  <div style={S.svcScrollOuter}>
                    <div style={S.svcScrollRow} ref={extScrollRef} onScroll={updateExtScroll}>
                      {EXTERNAL_PROGRAMS.map(p => (
                        <div key={p.key} style={{ ...S.extCard, ...S.extCardW3 }}>
                          <div style={{ ...S.extMedia, backgroundImage: `url(${p.image})` }}>
                            <span style={S.extComingSoonPill}>Coming Soon</span>
                          </div>
                          <div style={S.extBody}>
                            <div style={S.extTitleRow}>
                              <span style={S.extIconWrap}><i className={`ti ${p.icon}`} aria-hidden="true" /></span>
                              <span style={S.extTitle}>{p.title}</span>
                            </div>
                            <div style={S.extTag}>{p.tag}</div>
                            <p style={S.extDesc}>{p.desc}</p>
                            <button style={S.extBtn} disabled title="Not available yet"><i className="ti ti-bell" aria-hidden="true" /> Notify Me</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      style={{ ...S.svcArrowBtn, ...S.svcArrowLeft, ...(extScrollEdges.atStart ? S.svcArrowDisabled : {}) }}
                      onClick={() => scrollCardsBy(extScrollRef, -1)}
                      disabled={extScrollEdges.atStart}
                      aria-label="Scroll more from UrbanNest left"
                    ><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                    <button
                      style={{ ...S.svcArrowBtn, ...S.svcArrowRight, ...(extScrollEdges.atEnd ? S.svcArrowDisabled : {}) }}
                      onClick={() => scrollCardsBy(extScrollRef, 1)}
                      disabled={extScrollEdges.atEnd}
                      aria-label="Scroll more from UrbanNest right"
                    ><i className="ti ti-chevron-right" aria-hidden="true" /></button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {openService && (
        <ServiceDetailModal service={openService} inCart={!openService.isSample && isInCart(openService.id)} onClose={() => setOpenService(null)} onAddToCart={addServiceToCart} />
      )}

      {cartOpen && (
        <PaymentCartModal
          onClose={() => setCartOpen(false)}
          onConfirm={handleConfirmPurchase}
          theme={{
            navBg: C.primary, cardBg: C.white, cardBdr: C.borderMedium,
            txtPrimary: C.textPrimary, txtSec: C.textSecondary, txtMuted: C.textTertiary,
            blue: C.primary, blueLight: C.blueBg, blueDark: C.primary,
            greenLight: C.greenBg, greenDark: C.green, red: '#DC2626',
            font: F.body,
          }}
        />
      )}

      {promoCatalogOpen && (
        <PromotionCatalogModal
          plans={promoCatalog}
          loading={promoCatalogLoading}
          error={promoCatalogError}
          purchasingId={promoPurchasingId}
          onClose={() => setPromoCatalogOpen(false)}
          onPurchase={handlePurchasePromoPlan}
        />
      )}
    </div>
  );
}
