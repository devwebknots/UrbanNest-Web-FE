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
import { useLocation } from 'react-router-dom';
import { usePaymentCart } from '../../Payment/PaymentCartContext';
import PaymentCartModal from '../../Payment/PaymentCartModal';
// Subscription & Billing tab = Design System v2 (image 181): v2 frame + PMSubscriptionBilling body.
// The Services tab (same component, /services route) keeps its v1 layout below until it is redesigned.
import { PMPageShell, Breadcrumb, PageFooter, ImageBackdrop } from '../../../components/layout';
import { UI2 as V2UI, SP2 as V2SP, SZ2 as V2SZ, T2 as V2T } from '../../../constants';
import AccountSettingsTabs from './AccountSettingsTabs';
import AccountCartButton from './AccountCartButton';
import PMSubscriptionBilling from './PMSubscriptionBilling';
import PMServices from './PMServices';
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';
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

// v1 styles still used by the two older pop-ups below (ServiceDetailModal · PromotionCatalogModal)
const S = {
  btnPrimary: { background: C.primary, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
  btnSecondary: { background: C.white, color: C.textPrimary, border: `1px solid ${C.borderMedium}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
  pill: { background: C.greenBg, color: C.green, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 8 },

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
  let periodStart = null, progressPct = null;
  if (sub?.next_billing_date) {
    const nextDate = new Date(sub.next_billing_date);
    periodStart = new Date(nextDate.getTime() - cycleDays * 86400000);
    const elapsedMs = Date.now() - periodStart.getTime();
    progressPct = Math.min(100, Math.max(0, (elapsedMs / (cycleDays * 86400000)) * 100));
  }

  // ─── Allocated Capacity — real counts from GET /api/properties/, not
  // fabricated. "Active Tenants" (Landlord's third metric) has no PM data
  // source yet (no Tenant model built — see backlog PE-4), swapped for
  // "Properties Managed" instead of faking a number.
  const totalProperties = properties.length;
  const unitsUsed = properties.reduce((sum, p) => sum + (Number(p.unit_count) || 0), 0);
  const capMax = currentPlanObj?.unit_limit_max ?? null;
  const capPct = (capMax && totalProperties > 0) ? Math.min(100, (unitsUsed / capMax) * 100) : null;

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

  // ─── VERSION 2 frame for both tabs (Subscription & Billing — image 181 · Services — image 185) ─────────
  const isServices = activeTab === 'services';
  const pageTitle = isServices ? 'Services' : 'Subscription & Billing';
  const V2 = {
    head:   { ...V2UI.rowBetween(V2SP.lg), alignItems: 'flex-start', flexWrap: 'wrap' },
    title:  { ...V2T.heroHeading, margin: 0 },
    sub:    { ...V2T.lead, margin: `${V2SP.xs}px 0 0` },
  };
  const skeleton = <div style={V2UI.stack(V2SP.md)}>{[0, 1, 2].map(i => <div key={i} className="un2-skel" style={V2UI.skeleton('100%', V2SZ.field * 3)} />)}</div>;
  const errorBar = (msg, retry) => (
    <div style={V2UI.errorBanner} role="alert">
      <i className="ti ti-alert-circle" aria-hidden="true" /> {msg} —{' '}
      <button type="button" style={V2UI.btn.link} onClick={retry}>Retry</button>
    </div>
  );

  let body;
  if (isServices) {
    body = servicesLoading ? skeleton : servicesError ? errorBar(servicesError, fetchCatalog) : (
      <PMServices
        buyGateClosed={buyGateClosed} subscription={subscription} sub={sub}
        ownedCount={ownedServices.length} subIncludedCount={subIncludedCount} subAddonCount={subAddonCount}
        availableAddons={planAddonServices.filter(s => !s.owned).length} activeCampaignsCount={activeCampaignsCount}
        includedReal={includedPlanServices.length} displayIncluded={displayIncludedServices} displayAddons={displayAddonServices}
        addonsAvailable={planAddonServices.filter(s => !s.owned).length} addonsAdded={planAddonServices.filter(s => s.owned).length}
        externalPrograms={EXTERNAL_PROGRAMS}
        visualIncluded={i => visualFor(INCLUDED_VISUALS, i)} visualAddon={i => visualFor(ADDON_VISUALS, i)}
        flavorFor={flavorFor} priceUnitLabels={PRICE_UNIT_LABELS}
        isInCart={isInCart} onOpenService={setOpenService} onAddToCart={addServiceToCart}
        onOpenPromo={openPromoCatalog} activePromoSub={activePromoSub} minPromoPrice={minPromoPrice} promoTierCount={promoCatalog.length}
      />
    );
  } else {
    body = loading ? skeleton : error ? errorBar(error, fetchSubscriptionData) : (
      <PMSubscriptionBilling
        plans={plans} sub={sub}
        monthlyPrice={monthlyPrice} addonsList={addonsList} addonsTotal={addonsTotal} totalMonthlySpend={totalMonthlySpend}
        progressPct={progressPct} daysRemaining={daysRemaining} periodStart={periodStart}
        unitsUsed={unitsUsed} totalProperties={totalProperties} capMax={capMax} capPct={capPct}
        subIncludedCount={subIncludedCount} subAddonCount={subAddonCount}
        activePromoSub={activePromoSub} onOpenPromo={openPromoCatalog}
        cartItems={cartItems} onSubscribe={handlePlanAddToCart}
        userLabel={userLabel} email={currentUser?.email}
      />
    );
  }

  return (
    <PMPageShell activeId={isServices ? 'account-services' : 'account-subscription'} animate backdrop={<ImageBackdrop image={backdropArt} />} searchPlaceholder="Search portfolios, settings, or help…">
      <Breadcrumb items={[{ label: 'Account Settings', href: '/pm-portal/account/profile' }, { label: pageTitle }]} />
      <section style={V2UI.pageHead.block}>
        <div style={V2.head}>
          <div style={V2UI.minWidth0}>
            <h1 style={V2.title}>{pageTitle}</h1>
            <p style={V2.sub}>Manage your Independent PM plan, buy add-on services, and promote your listings.</p>
          </div>
          <AccountCartButton onClick={() => setCartOpen(true)} />
        </div>
        <div style={V2UI.pageHead.next}><AccountSettingsTabs active={isServices ? 'services' : 'subscription'} /></div>
      </section>

      {body}

      <PageFooter />

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
          plans={promoCatalog} loading={promoCatalogLoading} error={promoCatalogError} purchasingId={promoPurchasingId}
          onClose={() => setPromoCatalogOpen(false)} onPurchase={handlePurchasePromoPlan}
        />
      )}
    </PMPageShell>
  );
}
