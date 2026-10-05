// Intended path: src/pages/Landlord/Account Settings/LandlordSettingsPage.jsx
// Route: /landlord-portal/settings
// Moved into its own "Account Settings" subfolder, Oct 3 2026, per the
// reviewer's request — this file is the Bank Accounts / Subscription &
// Billing / Services tabs page, i.e. literally the Landlord account
// settings screen, so the subfolder name matches what it actually is.
// Every relative import below was updated for the one extra directory
// level; nothing about the page's behavior changed.
//
// Built FE-first against mock data per SVC_011 / ARCH_001 — wireframes for
// both tabs were reviewed and frozen in Session 40 before this file was
// written (settings_bank_accounts_wireframe.html, settings_services_wireframe.html).
//
// landlordTokens.js was shared after this file was first built — every C.* key used
// below (pageBg, topbarBg, topbarBdr, txtPrimary, txtSec, txtMuted, navBg, blue,
// blueLight, blueDark, cardBg, cardBdr, greenLight, greenDark, red, amber, amberLight,
// stdBg) has been checked against the real export and exists with no changes needed.
//
// `activePage="settings"` below is confirmed against the real NavF.jsx
// (Session 49) — its NAV_BOTTOM list has { id: 'settings', route:
// '/landlord-portal/settings' }, matching this page's own route exactly.
//
// Buy Service now goes through the shared Payment Cart module (src/pages/Payment/)
// instead of completing instantly — see the "PAYMENT CART INTEGRATION" note further
// down for how this page wires into it. That module's buttons come from the existing
// shared <Button> (src/components/ui/Button.jsx), themed with these same landlordTokens
// values via its `style`/`theme` props rather than reimplementing button styling —
// this page's own buttons (+ Add Bank Account, Save, etc.) are unchanged, still the
// raw <button style={S.xxx}> pattern already used throughout the other Landlord pages.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavF from '../../../components/layout/NavF';
import { C, F } from '../landlordTokens';
import { CustomDropdown } from '../../../components/ui';
import { usePaymentCart } from '../../Payment/PaymentCartContext';
import PaymentCartTrigger from '../../Payment/PaymentCartTrigger';

// Session 51 — Services tab redesign, cropped directly from the reviewer's
// own Figma screenshot per their instruction ("Use the images in the figma
// itself"), not stock photography from anywhere else. Pixel regions were
// located programmatically (color-variance edge detection against the
// screenshot) and the promo banner's photo was heavily blurred — it had the
// Figma's own headline/buttons/stats baked into its pixels as a flat
// screenshot, so blurring is what turns that into a clean, text-free
// backdrop for this page's own live text to sit on top of.
import imgLeaseManagement from '../../../assets/landlord/services/lease-management.jpg';
import imgTenantOnboarding from '../../../assets/landlord/services/tenant-onboarding.jpg';
import imgTenantScreening from '../../../assets/landlord/services/tenant-screening.jpg';
import imgRentCollection from '../../../assets/landlord/services/rent-collection.jpg';
import imgAiMaintenance from '../../../assets/landlord/services/ai-maintenance.jpg';
import imgRentersInsurance from '../../../assets/landlord/services/renters-insurance.jpg';
import imgGroceryDelivery from '../../../assets/landlord/services/grocery-delivery.jpg';
import imgTransportMoving from '../../../assets/landlord/services/transportation-moving.jpg';
import imgPromoBannerBg from '../../../assets/landlord/services/promo-banner-bg.jpg';
import PaymentCartModal from '../../Payment/PaymentCartModal';
// Phase 3/4 (Session 49) — Subscription & Billing + Listing Promotion
// standing entitlement, both wired to the backend built this round. Reuses
// listingApi.js's fetch wrapper for the Listing Promotion calls rather than
// hand-rolling a second one here — listingApi.js already knows the right
// API_BASE/auth-header/error-shape conventions.
import {
  getPromotionSubscriptions,
  getPromotionSubscriptionCatalog,
  purchasePromotionSubscription,
} from '../Listing/listingApi';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// Bank Accounts tab — Payout Telemetry's photo isn't in this repo's own
// asset set yet, so it's a hotlinked stock placeholder (Unsplash) rather
// than a bundled import. Swap for a licensed/bundled asset before this
// ships — flagging that explicitly rather than quietly shipping a hotlink
// long-term. (The old "Institutional Security" banner's background image
// was removed in round 9 along with that banner.)
const imgBankTelemetryPhoto = 'https://images.unsplash.com/photo-1758519288735-93631d504920?w=900&q=75&auto=format&fit=crop';

// Real bank logos for the Bank Accounts cards. bank_name is free text the
// landlord typed in (OwnerBankAccount has no institution-id/enum to key
// off), so this only resolves for institutions we recognize by name — a
// curated list of common US banks/card issuers mapped to their domain. An
// unrecognized bank name (a small regional bank, a credit union, a typo)
// falls back to the generic icon below rather than guessing a domain and
// risking the wrong logo — same "don't fabricate" rule as
// account_type_display/is_verified elsewhere on this tab.
//
// This originally used Clearbit's free Logo API (logo.clearbit.com) —
// HubSpot sunset that endpoint on Dec 8, 2025, so every request now just
// fails to connect, which is why logos stopped rendering. Switched to
// Google's public favicon CDN instead: also free and keyless (no signup,
// no token to paste in and keep track of), and it returns each bank's
// actual favicon pulled live from their own site — real artwork, not
// fabricated — though a favicon is smaller/lower-fidelity than a proper
// wordmark logo. If a crisper logo matters more than avoiding a signup,
// logo.dev is the maintained Clearbit replacement, but it requires a free
// account and a publishable API token in every request URL — worth doing
// if/when that's wanted, but not something to wire in speculatively here.
const BANK_LOGO_FAVICON_SIZE = 128;
const BANK_LOGO_DOMAINS = {
  'chase': 'chase.com', 'chase bank': 'chase.com', 'jpmorgan chase': 'chase.com', 'jpmorgan': 'chase.com',
  'bank of america': 'bankofamerica.com', 'bofa': 'bankofamerica.com',
  'wells fargo': 'wellsfargo.com',
  'citibank': 'citibank.com', 'citi': 'citibank.com',
  'american express': 'americanexpress.com', 'amex': 'americanexpress.com',
  'capital one': 'capitalone.com',
  'us bank': 'usbank.com', 'u.s. bank': 'usbank.com',
  'pnc': 'pnc.com', 'pnc bank': 'pnc.com',
  'td bank': 'td.com',
  'truist': 'truist.com', 'truist bank': 'truist.com',
  'regions': 'regions.com', 'regions bank': 'regions.com',
  'fifth third': '53.com', 'fifth third bank': '53.com',
  'ally': 'ally.com', 'ally bank': 'ally.com',
  'discover': 'discover.com', 'discover bank': 'discover.com',
  'hsbc': 'hsbc.com',
  'citizens bank': 'citizensbank.com', 'citizens': 'citizensbank.com',
  'keybank': 'key.com', 'key bank': 'key.com',
  'synchrony': 'synchronybank.com', 'synchrony bank': 'synchronybank.com',
  'navy federal': 'navyfederal.org', 'navy federal credit union': 'navyfederal.org',
  'usaa': 'usaa.com',
  'charles schwab': 'schwab.com', 'schwab': 'schwab.com',
  'goldman sachs': 'goldmansachs.com', 'marcus': 'marcus.com', 'marcus by goldman sachs': 'marcus.com',
  'santander': 'santanderbank.com', 'santander bank': 'santanderbank.com',
  'first republic': 'firstrepublic.com', 'first republic bank': 'firstrepublic.com',
  'huntington': 'huntington.com', 'huntington bank': 'huntington.com',
  'bmo': 'bmo.com', 'bmo harris': 'bmo.com',
  'comerica': 'comerica.com', 'comerica bank': 'comerica.com',
  'm&t bank': 'mtb.com', 'mt bank': 'mtb.com',
};
function getBankLogoUrl(bankName) {
  if (!bankName) return null;
  const domain = BANK_LOGO_DOMAINS[bankName.trim().toLowerCase()];
  return domain ? `https://www.google.com/s2/favicons?sz=${BANK_LOGO_FAVICON_SIZE}&domain=${domain}` : null;
}

// Round 9 (Figma match, explicit call) — the Account Details "Corporate
// Card" visual needs a card network and an expiry date, but
// OwnerBankAccount is a bank account, not a card: it has neither field.
// These are deliberately fabricated, illustrative-only values (per the
// decision to match the reference mockup as-is) — deterministic from the
// account's id so they're stable across re-renders instead of changing
// every time, but not real data in any sense. Not sent to or read from
// the backend.
function getFakeCardDetails(account) {
  if (!account) return { network: 'Mastercard', type: 'Debit', expiry: '—' };
  const month = (account.id % 12) + 1;
  const year = 27 + (account.id % 4);
  return { network: 'Mastercard', type: 'Debit', expiry: `${String(month).padStart(2, '0')}/${year}` };
}

const initials = n => (n || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// Bank Accounts tab is now real — fetched from/written to
// GET/POST /landlord/bank-accounts/ and PATCH/DELETE
// /landlord/bank-accounts/<id>/ (OwnerBankAccount, SVC-6). The old
// MOCK_BANK_ACCOUNTS seed is gone; bankAccounts below starts empty and is
// populated by the fetch effect near the other tab data fetches.

// Services are now real — fetched from GET /landlord/services/catalog/
// (Session 40, second pass) and normalized below via normalizeService().
// MOCK_SERVICES is gone; requiresBankAccount now reflects the real
// UNService.requires_payment_collection field instead of a "pending" chip.

// ref: UNService.price_unit choices (core/models.py)
const PRICE_UNIT_LABELS = {
  PER_UNIT: '/ Unit',
  PER_MONTH: '/ Month',
  PER_PROPERTY: '/ Property',
  FLAT_FEE: '/ Flat Fee',
};

// UNService has no dedicated "icon" or short marketing "tag" field yet —
// every card uses the same glyph, and the tag line reuses short_description
// (so it echoes the description below it). Cosmetic gap only, until the
// catalog model grows those fields; flagging rather than inventing fake data.
const SERVICE_FALLBACK_ICON = 'ti-adjustments';

// Session 51 — "redesign the Services tab exactly as in the Figma" headings
// use a serif display face in the Figma (visible on close inspection of the
// section titles, card titles, and big stat/price numerals) while body copy
// stays on the real design system's Inter sans. Scoped to this one tab only
// — landlordTokens.js's F.sans is untouched, so every other Landlord page is
// unaffected — since this is a one-screen visual match, not a system change.
const F_SERIF = "Georgia, 'Times New Roman', Times, serif";

// Figma-cropped photo pools for the "Included with Your Plan" / "Add-Ons for
// Your Plan" card grids, cycled by card position (modulo) so this holds up
// for however many real services a plan actually has — the Figma itself
// named five fixed services; the real catalog (GET /landlord/plans/'s
// included_services/addon_services) is whatever UN Admin actually built.
const INCLUDED_VISUALS = [imgLeaseManagement, imgTenantOnboarding];
const ADDON_VISUALS = [imgTenantScreening, imgRentCollection, imgAiMaintenance];
const visualFor = (pool, index) => pool[Math.max(0, index) % pool.length];

// Add-on cards' top-right ribbon has no backing UNService field (confirmed —
// see the comment on SERVICE_FALLBACK_ICON above) — purely decorative,
// cycling by card position. The first three reuse the Figma's own exact
// labels; a fourth generic one covers a plan with more than three real
// add-ons. `caption` (the small line next to the real price) is the Figma's
// own exact sample text too, per the reviewer's Oct 3 request to use the
// Figma's sample data as-is for representation. The category row (icon +
// label under the photo — "Verification Module"/"Financial Engine"/
// "Operations Support"/"Platform Service") was removed from the cards this
// round per the reviewer's explicit ask, so `category`/`categoryIcon` were
// dropped from this array too rather than left as dead fields.
const ADDON_FLAVORS = [
  { ribbon: 'Instant Decision', caption: 'Bill to applicant or firm' },
  { ribbon: 'Next-Day Payout', caption: 'Zero Monthly Base' },
  { ribbon: 'AI Automated', caption: 'Unlimited Tickets' },
  { ribbon: 'Fast Setup', caption: 'Flexible Billing' },
];
const flavorFor = (index) => ADDON_FLAVORS[Math.max(0, index) % ADDON_FLAVORS.length];

// Included cards' 3-chip spec box (Portfolio Cap/Signatures/SLA, Onboarding
// Cap/Intake Portal/Verification, Coverage/Access/Support — INCLUDED_FLAVORS,
// removed) was dropped entirely this round per the reviewer's explicit ask
// to remove those inner containers from the cards, not just restyle them.

// Sample fallback cards — reviewer's Oct 3 instruction: "The logic should be
// if data is there show it, else show sample data." A real account's current
// plan can genuinely have zero included/add-on services configured (seen
// live in the reviewer's own "Starter - Test" plan screenshot — the stat
// tiles and section pills correctly read 0, but the card grid underneath
// was just an empty dashed box). These two arrays are what renders instead,
// ONLY when the real list for that section is empty — never alongside real
// cards, never counted in the real stat tiles/pills (those stay honest).
// Every card is explicitly "Sample" watermarked (S.pmSamplePill, the same
// ARCH_028 convention already used for the Listing Promotion catalog —
// Linked Bank Accounts used to be an example of this too, until Bank
// Accounts was wired to the real OwnerBankAccount model) and every action
// button is disabled with a
// tooltip — these are not real UNService rows, so nothing here should look
// purchasable or configurable. Content/images are the Figma's own.
const SAMPLE_INCLUDED_SERVICES = [
  {
    id: 'sample-inc-1', isSample: true, name: 'Lease Management',
    shortDesc: 'Automated digital lease creation, document templates, e-signatures, and verified tenant repository.',
    image: imgLeaseManagement,
  },
  {
    id: 'sample-inc-2', isSample: true, name: 'Tenant Onboarding',
    shortDesc: 'Digital tenant intake workflow, document collection, identity checks, and automated welcome orientation.',
    image: imgTenantOnboarding,
  },
];
const SAMPLE_ADDON_SERVICES = [
  {
    id: 'sample-addon-1', isSample: true, name: 'Tenant Screening & Underwriting',
    shortDesc: 'Full TransUnion ResidentScore, comprehensive criminal records, and nationwide eviction database cross-referencing.',
    image: imgTenantScreening, price: '$35.00', priceUnit: '/ applicant', owned: false,
  },
  {
    id: 'sample-addon-2', isSample: true, name: 'Digital Rent Collection & ACH Direct',
    shortDesc: 'Automated rent reconciliation, multi-entity split payouts, recurring auto-debit, and late-fee automation protocols.',
    image: imgRentCollection, price: '0.8%', priceUnit: 'ACH / 2.9% Card', owned: false,
  },
  {
    id: 'sample-addon-3', isSample: true, name: 'AI Maintenance Triage & Dispatch',
    shortDesc: '24/7 intelligent ticket assessment, photo analysis of plumbing/HVAC emergencies, and direct vendor dispatching rules.',
    image: imgAiMaintenance, price: '$19.00', priceUnit: '/ month', owned: false,
  },
];

// Generated sample visuals for Listing Promotion catalog/detail cards
// (Session 50, point 4) — ListingPromotionPlan has no image field in the
// real backend (confirmed), so each card gets one of these gradient+icon
// treatments instead of a photo, rotated by the plan's position in the
// catalog list. Explicitly tagged "Sample visual" wherever shown — every
// other field on these cards (name/price/description/features/fine print)
// is real ListingPromotionPlan data, nothing else here is invented.
const PROMO_CARD_VISUALS = [
  { bg: `linear-gradient(135deg, ${C.navBg} 0%, #1d3a5f 100%)`, icon: 'ti-rocket' },
  { bg: `linear-gradient(135deg, ${C.blueDark} 0%, ${C.blue} 100%)`, icon: 'ti-bolt' },
  { bg: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.green} 100%)`, icon: 'ti-trophy' },
  { bg: `linear-gradient(135deg, #a15c07 0%, ${C.amber} 100%)`, icon: 'ti-star' },
];
const promoVisualFor = (index) => PROMO_CARD_VISUALS[Math.max(0, index) % PROMO_CARD_VISUALS.length];

// External marketing teaser (Session 50, point 5) — confirmed via grep
// across the whole backend (insurance|grocery|transportation) that none of
// these exist as real UN products anywhere in this codebase; every card is
// explicitly "Coming Soon" and not purchasable. Illustrative set the
// reviewer confirmed ("Yes, sample teaser cards").
const EXTERNAL_PROGRAMS = [
  { key: 'insurance', icon: 'ti-shield-check', image: imgRentersInsurance, title: 'Renters Insurance', tag: 'Revenue Sharing Program', desc: 'Offer tenants a bundled renters insurance option at move-in — a potential new revenue line for your portfolio.' },
  { key: 'grocery', icon: 'ti-shopping-cart', image: imgGroceryDelivery, title: 'Grocery Delivery Partnerships', tag: 'Resident Welcome Perk', desc: 'A move-in welcome perk for new tenants — discounted first-order grocery delivery, co-branded with UrbanNest.' },
  { key: 'transportation', icon: 'ti-car', image: imgTransportMoving, title: 'Transportation & Moving', tag: 'Logistics Concierge', desc: 'Discounted moving-day transportation for tenants relocating into one of your units.' },
];

// ─── TRANSACTIONS TAB (Session 52) ──────────────────────────────────────────
// No payment-ledger model exists anywhere in this codebase (re-confirmed this
// round — grepped the whole backend for a Screening/Applicant fee model:
// none exists either), and the one model that COULD back real rows here
// (UNInvoice, core/models.py) has no Landlord-facing endpoint — its generic
// routes in core/billing/urls.py are never wrapped by landlord/urls.py, the
// same gap already on record for the Billing History & Invoices card above.
// Per this doc's standing "sample data only where there's truly no real
// data" rule, the Billing Activity list below is sample. The two
// backend-dependent actions (PDF receipt generation, invoice printing) stay
// disabled with a tooltip, the same ARCH_017 convention used everywhere else
// on this page; search, the service/date filters, row selection, and CSV
// export are all genuinely wired against this array, since none of those
// need a backend to be real.
//
// Reviewer-redesigned column/value set (Oct 4, 2026 round): `label` is the
// short "Transaction" column text; `desc` is kept as the fuller title used
// only inside the Transaction Detail panel (`desc.split(' - ')[0]`). The
// reference-ID scheme now varies by transaction type, per the reviewer's own
// sample table — `INV-` for a subscription invoice, `TXN-` for a one-time
// service charge, `RF-` for a refund — replacing the earlier uniform
// `TXN-UN-XXXXXX` format. A `Refunded` status/row is new this round too
// (negative `amount`), alongside `Paid`.
const TRANSACTIONS = [
  { id: 'INV-1024', date: '2026-10-04', dateLabel: 'Oct 04', label: 'Subscription Payment', desc: 'Monthly Subscription - Professional Tier', service: 'PMS', amount: 49.00, status: 'Paid',
    paymentMethod: 'Mastercard ending 4242', timestamp: 'Oct 04, 2026, 09:05 AM EST', billingType: 'Direct UrbanNest Debit',
    lineItems: [{ label: 'Base Monthly PMS Tier', value: 49.00 }, { label: 'Tax', value: 0 }], total: 49.00 },
  { id: 'TXN-8821', date: '2026-10-02', dateLabel: 'Oct 02', label: 'Featured Listing', desc: 'Featured Listing - Sunrise Apts Unit 302', service: 'Marketplace', amount: 15.00, status: 'Paid',
    paymentMethod: 'Mastercard ending 4242', timestamp: 'Oct 02, 2026, 11:20 AM EST', billingType: 'Card Charge — One-Time',
    lineItems: [{ label: '7-Day Featured Placement', value: 15.00 }, { label: 'Tax', value: 0 }], total: 15.00 },
  { id: 'TXN-8810', date: '2026-09-28', dateLabel: 'Sep 28', label: 'Tenant Screening', desc: 'Tenant Screening - Applicant #7921 (John Doe)', service: 'Screening', amount: 35.00, status: 'Paid',
    paymentMethod: 'Mastercard ending 4242', timestamp: 'Sep 28, 2026, 02:45 PM EST', billingType: 'Card Charge — One-Time',
    lineItems: [{ label: 'Background & Credit Check', value: 35.00 }, { label: 'Tax', value: 0 }], total: 35.00 },
  { id: 'RF-102', date: '2026-09-25', dateLabel: 'Sep 25', label: 'Refund', desc: 'Refund - Promotion Cancellation (Maple Court Unit 118)', service: 'Marketplace', amount: -15.00, status: 'Refunded',
    paymentMethod: 'Mastercard ending 4242', timestamp: 'Sep 25, 2026, 04:10 PM EST', billingType: 'Refund to Original Payment Method',
    lineItems: [{ label: '7-Day Featured Placement (Refunded)', value: -15.00 }, { label: 'Tax', value: 0 }], total: -15.00 },
];

// "Last N Days" is anchored to the most recent sample row (Oct 4, 2026 —
// this session's real "today"), not the live system clock — a fixed static
// sample set representing one point in time, the same way every other
// sample array on this page is. All 4 rows fall within 10 days of the
// anchor, so the default "Last 30 Days" view shows all 4 ("Displaying 4 of
// 4"); the filter is still genuinely live (pick "Last 7 Days" and it
// correctly narrows to 2 rows).
const TX_ANCHOR_DATE = new Date(TRANSACTIONS[0].date);
const TX_RANGE_DAYS = { '7': 7, '30': 30, '90': 90, all: Infinity };

// Option lists for the toolbar's two CustomDropdowns (Session 54 — converted
// from native <select>s to this page's standard shared dropdown component,
// UrbanNest Design System §9, same one already used by the Bank Accounts
// form above and by the Add Property wizard).
const TX_SERVICE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Services' },
  { value: 'PMS', label: 'PMS' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'Screening', label: 'Screening' },
];
const TX_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

// My Profile tab's Preferences card — none of these four have a real
// per-user preference model in this codebase (LandlordProfile has no
// timezone/language/date-format/currency fields), so every dropdown here
// is disabled, single-option, and pre-filled with the reviewer's own given
// values rather than left blank or guessed at.
const PROF_LANGUAGE_OPTIONS  = [{ value: 'en-US', label: 'English' }];
const PROF_TIMEZONE_OPTIONS  = [{ value: 'America/Chicago', label: 'America/Chicago' }];
const PROF_DATEFMT_OPTIONS   = [{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }];
const PROF_CURRENCY_OPTIONS  = [{ value: 'USD', label: 'USD' }];

// image.url from the backend is host-relative (e.g. "/media/services/x.png")
// — resolve it against the API's origin, not API_BASE (which includes /api).
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const formatPrice = price => {
  const n = Number(price) || 0;
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
};

const formatOwnedSince = isoString => {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// e.g. 30 -> "30th", 1 -> "1st" — used for "billed on the Nth" against a real
// next_billing_date, not a fabricated day.
const ordinalDay = n => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

function normalizeService(s) {
  return {
    id: s.id,
    name: s.name,
    tag: s.short_description,
    shortDesc: s.short_description,
    longDesc: s.long_description,
    image: s.image ? (String(s.image).startsWith('http') ? s.image : `${API_ORIGIN}${s.image}`) : null,
    icon: SERVICE_FALLBACK_ICON,
    price: formatPrice(s.price),
    priceUnit: PRICE_UNIT_LABELS[s.price_unit] || s.price_unit,
    requiresPayment: !!s.requires_payment_collection,
    requiresBankAccount: !!s.requires_payment_collection,
    owned: !!s.owned,
    ownedSince: formatOwnedSince(s.owned_since),
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  shell:    { display: 'flex', height: '100vh', fontFamily: F.sans, background: C.pageBg, overflow: 'hidden' },
  main:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:   { background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  topTitle: { fontSize: 14, fontWeight: 600, color: C.txtPrimary },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn:  { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtSec, cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 16 },
  avatar:   { width: 32, height: 32, borderRadius: '50%', background: C.navBg, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1, overflowY: 'auto', padding: '20px 28px 40px' },

  pageHdrRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 },
  pageTitle:{ fontSize: 20, fontWeight: 700, color: C.txtPrimary, margin: '0 0 4px' },
  pageSub:  { fontSize: 13, color: C.txtMuted, margin: '0 0 20px' },

  tabstrip: { display: 'flex', gap: 4, borderBottom: `1px solid ${C.cardBdr}`, marginBottom: 22 },
  tab:      (active) => ({ padding: '10px 18px', fontSize: 13.5, fontWeight: 600, color: active ? C.txtPrimary : C.txtMuted, borderBottom: active ? `2px solid ${C.blue}` : '2px solid transparent', cursor: 'pointer' }),

  sectionHdr:  { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 14px' },
  sectionHdr2: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 0 14px' },
  sectionH2: { fontSize: 15, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  sectionCount: { fontSize: 12.5, color: C.txtMuted },

  // Session 51 — Services tab section headers, redesigned to match the
  // Figma exactly (serif title + inline pill + subtitle line + right-aligned
  // link/caption). Scoped to this tab with its own "svc" prefix rather than
  // changing the shared sectionHdr/sectionH2 above, which every other tab on
  // this page still uses unchanged.
  svcSectionHdr: { marginBottom: 16 },
  svcSectionTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  svcSectionTitleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  svcSectionH2: { fontFamily: F_SERIF, fontSize: 20, fontWeight: 600, color: C.txtPrimary, margin: 0 },
  svcSectionPill: { background: C.greenLight, color: C.greenDark, fontSize: 11.5, fontWeight: 600, padding: '4px 13px', borderRadius: 20, whiteSpace: 'nowrap' },
  svcSectionLink: { fontSize: 12.5, fontWeight: 700, color: C.navBg, cursor: 'pointer', whiteSpace: 'nowrap', background: 'none', border: 'none', fontFamily: F.sans, display: 'flex', alignItems: 'center', gap: 5 },
  svcSectionCaption: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.txtMuted, whiteSpace: 'nowrap' },
  svcSectionSub: { fontSize: 13, color: C.txtSec, margin: '5px 0 0' },

  btnPrimary: { background: C.navBg, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.sans },
  btnSecondary: { background: '#fff', color: C.txtPrimary, border: `1px solid ${C.cardBdr}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.sans },
  // "+ Add Bank Account" as a text link next to the section title, rather
  // than a dark primary button — same blue as the selected row's border.
  btnLinkAdd: { background: 'transparent', color: C.blue, border: 'none', padding: 0, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F.sans },

  // BANK ACCOUNTS — round 9 redesign (Figma match + your own follow-up
  // notes). Still the persistent two-column layout from round 8
  // (bankPageRow/bankPageLeft/bankPageRight), but:
  //  - the account list is now compact single-line rows (bankRow*) instead
  //    of the taller stacked cards — ~40% shorter, grey by default
  //    (C.stdBg), white + blue border when selected;
  //  - clicking a row sets selectedBankId (state, above) and drives a new
  //    right-hand "Account Details" panel — a dark "Corporate Card" visual
  //    (bankCardViz*) plus a dotted-divider detail list (bankAcctDetail*)
  //    — replacing the old "Institutional Security" promo banner entirely;
  //  - Payout Telemetry (bankTelemetryCard, below) is unchanged.
  bankPageRow: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' },
  bankPageLeft: { minWidth: 0 },
  // White card wrapping the whole left-hand account list (header + rows +
  // "Link another institution"), matching the Figma reference's white
  // left container and giving the grey bankRow items something to sit on
  // top of, the same way bankDetailsPanel does on the right.
  // minHeight gives the card room to feel like it has space for one more
  // row beyond what's currently listed, instead of hugging exactly to the
  // last account — it's a floor, not a cap, so it still grows naturally
  // past this once there are enough accounts to need it.
  bankLeftCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 16, padding: 26, minHeight: 520 },
  bankPageRight: { display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 },
  bankGrid: { display: 'flex', flexDirection: 'column', gap: 9 },

  // Compact account row — click selects it for the Account Details panel;
  // the pencil/trash icons stop that click from bubbling so they don't
  // also change the selection.
  // Very light grey fill + a hairline border (explicit, not "transparent" —
  // that was rendering as a heavier default border in some browsers) so
  // unselected rows read as subtly recessed rather than outlined boxes.
  bankRow: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 10, padding: '11px 14px', cursor: 'pointer', background: '#fafbfc', border: `1px solid ${C.cardBdr}` },
  // Very light blue tint (not white) so the selected row still reads as
  // "on" at a glance, same blue family as the border.
  // Hairline border, not a bold one — the light blue fill is what signals
  // "selected" now, the border is just a subtle finishing touch.
  bankRowSelected: { background: '#eff6ff', border: '1px solid #bfdbfe' },
  bankIcon: { width: 30, height: 30, borderRadius: 7, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.blueDark, flexShrink: 0 },
  // Real-logo variant of bankIcon, used when getBankLogoUrl() resolves the
  // row's bank_name — white tile + padding so a colorful/transparent logo
  // sits on a neutral background instead of the generic blue icon tint.
  bankLogoBox: { width: 30, height: 30, borderRadius: 7, background: '#fff', border: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 4 },
  bankLogoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  bankRowMid: { flex: 1, minWidth: 0 },
  bankRowTop: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  bankName: { fontSize: 13, fontWeight: 600, color: C.txtPrimary },
  // Condensed to one line to fit the shorter row — the full holder
  // name/currency/country still show in the Account Details panel on the
  // right once a row is selected, so nothing's lost, just relocated.
  bankSub: { fontSize: 10.5, color: C.txtSec, marginTop: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  // Figma shows this uppercase ("DEFAULT") — same green pill tokens as
  // elsewhere in the file, just the casing/tracking bumped to match.
  pillDefault: { background: C.greenLight, color: C.greenDark, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' },

  bankRowRight: { display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 },
  // Filled-in when this row is the selected one (Account Details target) —
  // purely a selection indicator, not a default/verified/payout signal.
  bankSelBadge: { width: 19, height: 19, borderRadius: '50%', background: '#fff', border: `1.5px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'transparent', flexShrink: 0 },
  bankSelBadgeOn: { background: C.blue, borderColor: C.blue, color: '#fff' },
  bankRowIconBtn: { width: 23, height: 23, borderRadius: 6, border: `1px solid ${C.cardBdr}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.txtSec, cursor: 'pointer', flexShrink: 0 },
  iconBtnSm: { width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.cardBdr}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, color: C.txtSec, cursor: 'pointer', flexShrink: 0 },
  iconBtnDanger: { color: C.red },
  // Moved into the Account Details panel's detail-row list (round 9) —
  // there's no room for a "Set as default" action in the compact row
  // anymore, so it now lives next to the selected account's other fields.
  linkBtn: { fontSize: 12.5, fontWeight: 700, color: C.blue, cursor: 'pointer' },
  bankStatusActive: { fontSize: 12.5, fontWeight: 700, color: C.greenDark, display: 'flex', alignItems: 'center', gap: 5 },

  // "Link another institution" — completes the list (Figma). Opens the
  // same Add Bank Account modal as the header button; no separate Plaid/
  // micro-deposit flow exists, so that's described as what the real flow
  // could look like, not promised as live.
  bankAddCard: { border: `1.5px dashed ${C.cardBdr}`, borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: C.txtSec },
  bankAddIcon: { width: 30, height: 30, borderRadius: 7, background: C.stdBg, color: C.txtSec, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 },
  bankAddTitle: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary },
  bankAddSub: { fontSize: 10.5, color: C.txtMuted },

  // Account Details panel (round 9 — replaces the old "Institutional
  // Security" promo banner). Shows the selected account's "Corporate
  // Card" visual plus a dotted-divider detail list.
  bankDetailsPanel: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 16, padding: 22 },
  bankDetailsLabel: { fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: C.txtMuted, marginBottom: 14 },

  // The card visual itself. Card Type/Expires are fabricated — see the
  // getFakeCardDetails() comment above for why; everything else (last4,
  // holder name) is real.
  bankCardViz: { position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '22px 22px 18px', color: '#fff', background: 'linear-gradient(160deg, #10203a 0%, #0a1628 100%)' },
  bankCardVizGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% -10%, rgba(61,142,240,0.25), transparent 55%)', pointerEvents: 'none' },
  bankCardVizLabel: { position: 'relative', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' },
  bankCardVizNumRow: { position: 'relative', display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 26px' },
  bankCardVizDotsGroup: { display: 'flex', gap: 7 },
  bankCardVizDot: { width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' },
  bankCardVizLast4: { fontSize: 21, fontWeight: 800, letterSpacing: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', marginLeft: 4 },
  bankCardVizNetwork: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 },
  bankCardVizMcRed: { width: 22, height: 22, borderRadius: '50%', background: '#eb001b' },
  bankCardVizMcYellow: { width: 22, height: 22, borderRadius: '50%', background: '#f79e1b', marginLeft: -9, opacity: 0.92 },
  bankCardVizNetworkName: { fontSize: 12, fontWeight: 700, fontStyle: 'italic' },
  bankCardVizBottomRow: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  bankCardVizFieldLabel: { fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  bankCardVizFieldValue: { fontSize: 13.5, fontWeight: 800, letterSpacing: 0.3 },

  bankDottedRule: { border: 'none', borderTop: `1.5px dotted ${C.cardBdr}`, margin: '20px 0 16px' },
  bankAcctDetailRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '9px 0', borderBottom: '1px solid #f1f2f4' },
  bankAcctDetailRowLast: { borderBottom: 'none' },
  bankAcctDetailLabel: { color: C.txtSec },
  bankAcctDetailValue: { fontWeight: 700, color: C.txtPrimary, textAlign: 'right' },
  bankAcctDetailValueMono: { fontWeight: 700, color: C.txtPrimary, textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },

  bankTelemetryCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bankTelemetryPhoto: { position: 'relative', height: 132, backgroundImage: `url(${imgBankTelemetryPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' },
  bankTelemetryPhotoOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,22,40,0) 45%, rgba(10,22,40,0.82) 100%)', display: 'flex', alignItems: 'flex-end', padding: '10px 14px' },
  bankTelemetryPhotoLabel: { color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 },
  bankTelemetryBody: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 },
  bankTelemetryRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12 },
  bankTelemetryLabel: { color: C.txtSec },
  bankTelemetryValue: { color: C.txtPrimary, fontWeight: 700, textAlign: 'right' },
  bankTelemetryValueGreen: { color: C.greenDark, fontWeight: 700, textAlign: 'right' },
  bankTelemetryPill: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: C.greenLight, color: C.greenDark },
  bankTelemetryNote: { fontSize: 10.5, color: C.txtMuted, fontStyle: 'italic', marginTop: 2, lineHeight: 1.5 },

  emptyState: { background: C.cardBg, border: `1px dashed ${C.cardBdr}`, borderRadius: 10, padding: '48px 24px', textAlign: 'center' },
  emptyIcon:  { width: 48, height: 48, borderRadius: '50%', background: C.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20, color: C.txtMuted },
  emptyH3:    { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary, margin: '0 0 6px' },
  emptyP:     { fontSize: 12.5, color: C.txtMuted, maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.6 },

  // Session 51 — shown above the Included/Add-On card grid only when the
  // real list is empty and the grid below has fallen back to sample cards
  // (reviewer's Oct 3 "if data is there show it, else show sample data").
  svcSampleNote: { fontSize: 11.5, color: C.txtMuted, margin: '-4px 0 12px', fontStyle: 'italic' },

  // SERVICES — 3 per row. Reactivated this round (Session 50): these were
  // built early, then superseded by a master-list+inspector-panel redesign
  // that never referenced them, left as dead style code. Session 50's
  // "Included with Your Plan" / "Add-Ons for Your Plan" sections (replacing
  // that master list) now use them for real.
  svcCard:  { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  svcMedia: { position: 'relative', height: 130, backgroundSize: 'cover', backgroundPosition: 'center' },
  svcBody:  { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  svcDesc:  { fontSize: 12.5, color: C.txtSec, lineHeight: 1.5, flex: 1 },

  // Session 51 — horizontal scroll row + arrow nav, replacing the plain
  // wrapping grid for "Included with Your Plan" / "Add-Ons for Your Plan" /
  // "More From UrbanNest" (reviewer's Oct 3 ask). svcScrollRow is a flex row
  // instead of a CSS grid so cards can overflow sideways; each card's own
  // width (how many are visible "per page") is set per section via
  // svcCardW3 below, spread onto svcCard at the map call site. ("Included
  // with Your Plan" briefly moved to a plain 3-column wrapping grid — a
  // since-removed svcGrid3 — then back to this same scroll-row approach,
  // now sized with svcCardW3 like Add-On cards instead of its own
  // since-removed svcCardW2, per the reviewer's explicit size-parity ask.)
  // Session 51 — reviewer's Oct 3 fix: the arrows were overlapping the
  // card edges (they floated at -14px, only barely outside the row, and
  // the row itself ran the section's full width with nothing held back
  // for them). svcScrollOuter now carves out a dedicated 42px gutter on
  // each side — which is what actually "reduces the card lengths" per the
  // request, since svcCardW3's percentage below is a share of svcScrollRow's
  // own (now narrower) width — and the arrows sit fully inside that gutter
  // (left:0/right:0) instead of overlapping the cards.
  svcScrollOuter: { position: 'relative', padding: '0 42px' },
  svcScrollRow: { display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', scrollSnapType: 'x proximity', paddingBottom: 2 },
  svcCardW3: { flex: '0 0 calc((100% - 32px) / 3)', scrollSnapAlign: 'start' },
  svcArrowBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: '#fff', border: `1px solid ${C.cardBdr}`, boxShadow: '0 2px 10px rgba(13,27,46,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, color: C.txtPrimary, fontSize: 15 },
  svcArrowLeft:  { left: 0 },
  svcArrowRight: { right: 0 },
  svcArrowDisabled: { opacity: 0.3, cursor: 'default', boxShadow: 'none' },

  // "Included with Your Plan" card compaction (svcMediaCompact/
  // svcBodyCompact/svcSpecBoxCompact/svcDescClamp) — removed this round:
  // the reviewer asked Included cards to match Add-On cards' size exactly
  // and drop the spec box entirely, so Included now reuses the plain
  // svcMedia/svcBody/svcDesc styles below unmodified, same as Add-On cards.
  // Session 51 — reviewer's Oct 3 ask, point 2a: Add-On cards' title
  // restricted to a single line (a plain one-line truncation, not the
  // flex-box line-clamp pattern above, since a single line needs no
  // vertical box trick — whiteSpace:'nowrap' alone does it).
  svcTitleClamp: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  // Session 51 — reviewer's Oct 3 question: "is the button size/design the
  // same as Property's?" Checked `LandlordPortfolioPage.jsx`'s real
  // `propBtnDark`/`propBtnOut` (the "View Property"/"View Units" buttons)
  // directly — they weren't the same (borderRadius 6 not 8, padding '8px 0'
  // not 9px-all-sides, fontSize 11.5 not 12, fontWeight 500 not 700, no
  // letterSpacing, explicit fontFamily: F.sans), so these now match
  // Property's values exactly rather than just visually resembling them.
  // The dark-fill/white-outline color pairing was already the same pattern
  // Property uses — only the shape/weight numbers were off.
  svcBtn:   { marginTop: 10, textAlign: 'center', padding: '8px 0', borderRadius: 6, fontSize: 11.5, fontWeight: 500, fontFamily: F.sans },
  svcBtnBuy:  { background: C.navBg, color: '#fff', border: 'none' },
  svcBtnView: { background: '#fff', border: `1px solid ${C.cardBdr}`, color: C.txtPrimary },
  svcBtnInCart: { background: C.greenLight, color: C.greenDark },
  // Session 51 — reviewer's Oct 3 button-redesign ask, with a real
  // Property-card screenshot as the reference. Two separate blue variants,
  // not one, because the reviewer's own two points asked for different
  // border treatment per section: Included's "View Details" (point 1b)
  // only asked for the fill color, matching the screenshot's borderless
  // primary button, so it keeps svcBtnBuy's `border: 'none'`; Add-On's buy
  // button (point 2b) explicitly asked for "the button border line same as
  // other buttons" on top of the color change, so it borrows the exact
  // `1px solid cardBdr` every other (non-buy) button on this page already
  // uses, rather than a new border color being invented for it.
  svcBtnBlue: { background: C.blue, color: '#fff', border: 'none' },
  svcBtnBlueBordered: { background: C.blue, color: '#fff', border: `1px solid ${C.cardBdr}` },
  // Reviewer's Oct 3 follow-up: your real "Starter - Test" plan has 0
  // included/add-on services, so every card you were looking at was a
  // Sample fallback card — and those were forced to flat grey (svcBtnDisabled)
  // on top of the blue above, which is why no blue showed. You chose "tint
  // sample buttons blue too" over leaving them grey. First pass dimmed them
  // via opacity — corrected per your "why dim, keep the buttons protected
  // for sample" note: full-strength blue, same as the real button, no
  // opacity fade. "Protected" (disabled attribute, not-allowed cursor, the
  // "Sample service" tooltip, no click handler firing) is the only thing
  // that still marks these as non-interactive.
  svcBtnBlueDisabled: { background: C.blue, color: '#fff', border: 'none', cursor: 'not-allowed' },
  svcBtnBlueBorderedDisabled: { background: C.blue, color: '#fff', border: `1px solid ${C.cardBdr}`, cursor: 'not-allowed' },
  // Reviewer's Oct 3 follow-up, same principle extended to "Configure"/
  // "Configure Service": those were also losing their real white background
  // to the flat-grey svcBtnDisabled override. Same fix — stays visually
  // identical to svcBtnView, only `cursor: not-allowed` added; `disabled`
  // and the tooltip still make it fully non-interactive.
  svcBtnViewDisabled: { background: '#fff', border: `1px solid ${C.cardBdr}`, color: C.txtPrimary, cursor: 'not-allowed' },

  // Session 51 — richer card body to match the Figma exactly: a status
  // pill overlaid bottom-left on the photo, a ribbon tag top-right, a
  // serif title with an inline pill, a 3-chip spec/meta box, a divider,
  // and (for add-ons) a price row before the footer button(s).
  svcMediaStatusPill: { position: 'absolute', bottom: 10, left: 10, fontSize: 10.5, fontWeight: 700, padding: '5px 11px', borderRadius: 20, background: 'rgba(13,27,46,0.72)', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 },
  svcMediaRibbon: { position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.92)', color: C.txtPrimary, letterSpacing: 0.2 },
  svcMediaRibbonAccent: { background: C.greenLight, color: C.greenDark },
  // svcTitleRow/svcInclPill (the "Included in Subscription" badge sitting
  // beside the title) removed this round, per the reviewer's explicit ask —
  // the title now renders alone, single-line (svcTitleClamp), same pattern
  // Add-On cards already use.
  svcTitleSerif: { fontFamily: F_SERIF, fontSize: 15, fontWeight: 600, color: C.txtPrimary, lineHeight: 1.25 },
  // svcSpecBox/svcSpecLabel/svcSpecValue (Included cards' 3-chip meta box —
  // Portfolio Cap/Signatures/SLA etc.) removed this round, per the
  // reviewer's explicit ask to drop those inner containers entirely.
  svcDivider: { borderTop: `1px solid ${C.cardBdr}`, margin: '2px 0' },
  svcPriceRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  svcPriceBig: { fontFamily: F_SERIF, fontSize: 21, fontWeight: 600, color: C.txtPrimary },
  svcPriceUnit: { fontSize: 11.5, fontWeight: 600, color: C.txtMuted, marginLeft: 4 },
  svcPriceCaption: { fontSize: 10.5, fontWeight: 600, color: C.greenDark, whiteSpace: 'nowrap' },
  svcBtnRow: { display: 'flex', gap: 8, marginTop: 2 },
  svcBtnDisabled: { background: C.stdBg, color: C.txtMuted, cursor: 'not-allowed' },

  // ── LISTING PROMOTION — vertical "advertisement" section (Session 50,
  // point 4; redesigned Session 51 to match the Figma's own horizontal
  // layout exactly: a left text block — badge/serif headline/subtext/
  // divider/stats — beside a right column of two stacked buttons, over the
  // Figma's own (blurred) marketplace photo. "Browse Active Inventory" is a
  // real navigation to this app's actual Listings Overview route
  // (/landlord-portal/listings, confirmed live in App.js), not a dead button.
  promoAdSection: {
    position: 'relative', borderRadius: 18, padding: '34px 40px', color: '#fff', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 36, flexWrap: 'wrap',
    backgroundImage: `linear-gradient(120deg, rgba(10,22,40,0.90) 0%, rgba(16,30,50,0.88) 55%, rgba(22,40,64,0.86) 100%), url(${imgPromoBannerBg})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  },
  promoAdLeft: { flex: '1 1 420px', minWidth: 0 },
  promoAdBadge: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: C.heroBadgeTx, background: C.heroBadgeBg, padding: '5px 14px', borderRadius: 20, display: 'inline-block' },
  promoAdHeadline: { fontFamily: F_SERIF, fontSize: 30, fontWeight: 700, lineHeight: 1.25, maxWidth: 560, margin: '14px 0 10px' },
  promoAdSub: { fontSize: 13, color: 'rgba(255,255,255,0.74)', lineHeight: 1.6, maxWidth: 540, marginBottom: 16 },
  promoAdDivider: { borderTop: '1px solid rgba(255,255,255,0.18)', marginBottom: 16, maxWidth: 560 },
  promoAdStatsRow: { display: 'flex', gap: 34 },
  promoAdStat: { textAlign: 'left' },
  promoAdStatValue: { fontFamily: F_SERIF, fontSize: 25, fontWeight: 700 },
  promoAdStatLabel: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)', marginTop: 3 },
  promoAdRight: { display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, width: 250 },
  promoAdCta: { background: '#fff', color: C.navBg, border: 'none', padding: '13px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  promoAdCtaSecondary: { background: 'rgba(255,255,255,0.10)', color: '#fff', border: '1px solid rgba(255,255,255,0.24)', padding: '13px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  promoAdActiveNote: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Explore Plans catalog modal, redesigned — half-page-size, grid of
  // attractive "campaign" cards instead of the old plain row list.
  // ListingPromotionPlan has no image field (confirmed in the backend), so
  // each card gets a generated gradient+icon visual, explicitly tagged
  // "Sample visual" — plan name/price/description/features/fine print are
  // all real, nothing in the text is invented.
  promoModalV2: { background: '#fff', borderRadius: 14, width: 920, maxWidth: '96vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' },
  promoModalV2Head: { padding: '22px 28px 16px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  promoModalV2Close: { background: 'none', border: 'none', fontSize: 16, color: C.txtMuted, cursor: 'pointer', flexShrink: 0 },
  promoModalV2Body: { padding: '22px 28px 28px', overflowY: 'auto', flex: 1 },
  promoCatGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18 },
  promoCatCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  promoCatImgWrap: (bg) => ({ position: 'relative', height: 118, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  promoCatImgIcon: { fontSize: 32, color: 'rgba(255,255,255,0.85)' },
  promoCatSampleTag: { position: 'absolute', bottom: 8, right: 9, fontSize: 8.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, background: 'rgba(0,0,0,0.38)', color: '#fff' },
  promoCatDefaultTag: { position: 'absolute', top: 9, left: 9, fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.85)', color: C.txtPrimary },
  promoCatBody: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  promoCatName: { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary },
  promoCatDesc: { fontSize: 12, color: C.txtSec, lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  promoCatPriceRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 },
  promoCatPrice: { fontSize: 17, fontWeight: 700, color: C.txtPrimary },
  promoCatDuration: { fontSize: 10.5, color: C.txtMuted },
  promoCatDetailsBtn: { marginTop: 6, width: '100%', textAlign: 'center', padding: '8px 0', borderRadius: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.sans, border: `1px solid ${C.cardBdr}`, background: '#fff', color: C.txtPrimary },

  // Plan Detail — second pop-up, opened from a campaign card's "Details"
  // button. Every field real (ListingPromotionPlanSerializer's actual
  // fields: name/short_description/tag/price/duration_days/features/
  // fine_print) — only the hero visual is the same generated sample as the
  // catalog card.
  planDetailModal: { background: '#fff', borderRadius: 14, width: 480, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  planDetailHero: (bg) => ({ background: bg, padding: '30px 24px 24px', color: '#fff', position: 'relative' }),
  planDetailClose: { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 },
  planDetailIcon: { fontSize: 28, marginBottom: 10, opacity: 0.9 },
  planDetailName: { fontSize: 20, fontWeight: 700 },
  planDetailTag: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginTop: 8 },
  planDetailBody: { padding: '22px 24px' },
  planDetailDesc: { fontSize: 13, color: C.txtSec, lineHeight: 1.6, marginBottom: 16 },
  planDetailFeatureRow: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', fontSize: 12.5, color: C.txtPrimary },
  planDetailFinePrint: { fontSize: 11, color: C.txtMuted, lineHeight: 1.6, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.cardBdr}` },
  planDetailFooter: { padding: '16px 24px', borderTop: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  planDetailPrice: { fontSize: 22, fontWeight: 700, color: C.txtPrimary },
  planDetailPriceSub: { fontSize: 10.5, color: C.txtMuted },

  // ── External marketing teaser (Session 50, point 5) — Renters Insurance /
  // Grocery / Transportation-style upcoming programs. Nothing backing these
  // exists anywhere in this codebase (checked before building — no model,
  // no endpoint) so every card here is explicitly sample/"Coming Soon",
  // never a real purchasable item.
  // Session 51 — redesigned with a photo banner (Figma's own cropped
  // photos, same as the service cards above) and a top-right "Coming Soon"
  // pill on the photo instead of inline next to the title, matching the
  // Figma's card anatomy for this section exactly.
  // Session 51 — same horizontal scroll-row treatment as the Included/Add-On
  // sections (reviewer's Oct 3 arrow-nav ask), reusing svcScrollRow/
  // svcArrowBtn so all three sections' arrows look and behave identically.
  // extCardW3 mirrors svcCardW3's 3-per-view math.
  extCardW3: { flex: '0 0 calc((100% - 32px) / 3)', scrollSnapAlign: 'start' },
  extCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  extMedia: { position: 'relative', height: 122, backgroundSize: 'cover', backgroundPosition: 'center' },
  extComingSoonPill: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '5px 11px', borderRadius: 20, background: 'rgba(255,255,255,0.92)', color: C.txtPrimary, whiteSpace: 'nowrap' },
  extBody: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  extIconWrap: { width: 38, height: 38, borderRadius: 9, background: C.blueLight, color: C.blueDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  extTitleRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 },
  extTitle: { fontFamily: F_SERIF, fontSize: 15.5, fontWeight: 700, color: C.txtPrimary, lineHeight: 1.25 },
  extTag: { fontSize: 10.5, fontWeight: 600, color: C.txtMuted, margin: '1px 0 0 48px' },
  extDesc: { fontSize: 12, color: C.txtSec, lineHeight: 1.5, flex: 1, marginTop: 2 },
  extBtn: { marginTop: 8, background: 'none', border: `1px solid ${C.cardBdr}`, color: C.txtMuted, padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'not-allowed', fontFamily: F.sans, width: '100%' },

  // MODALS
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,27,46,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px', overflowY: 'auto', zIndex: 1000 },

  modal:    { background: '#fff', borderRadius: 12, width: 440, maxWidth: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  modalH3:  { margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.txtPrimary },
  modalSub: { fontSize: 12.5, color: C.txtMuted, margin: '0 0 18px' },
  field:    { marginBottom: 14 },
  fieldLbl: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: C.txtPrimary },
  fieldInput: { width: '100%', padding: '9px 10px', border: `1px solid ${C.cardBdr}`, borderRadius: 7, fontSize: 13, fontFamily: F.sans, color: C.txtPrimary, background: '#fff', boxSizing: 'border-box' },
  fieldRow: { display: 'flex', gap: 10 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.txtPrimary, margin: '4px 0 20px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },

  svcModal:      { background: '#fff', borderRadius: 12, width: 760, maxWidth: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  svcModalHero:  { position: 'relative', height: 200, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end' },
  svcModalHeroPlaceholder: { background: C.navBg },
  svcModalHeroTitle: { color: '#fff', fontSize: 24, fontWeight: 700, padding: '18px 24px', textShadow: '0 2px 8px rgba(0,0,0,0.4)' },
  svcModalClose: { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', border: 'none' },
  svcModalBody:  { display: 'flex' },
  svcModalLeft:  { flex: 1.5, padding: '22px 24px', borderRight: `1px solid ${C.cardBdr}` },
  svcModalRight: { flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  metaLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, marginBottom: 4 },
  bodyLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, margin: '0 0 6px' },
  bodyText:  { fontSize: 13, lineHeight: 1.6, color: C.txtPrimary, margin: '0 0 18px' },
  statusPillOwned: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: C.greenLight, color: C.greenDark },
  statusPillNotOwned: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: C.stdBg, color: C.txtMuted },
  flagChip: { fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6, display: 'inline-block' },
  flagChipYes: { background: C.amberLight, color: C.amber },
  flagChipNo:  { background: C.stdBg, color: C.txtMuted },
  flagChipPending: { background: C.blueLight, color: C.blueDark, border: `1px dashed ${C.cardBdr}` },
  priceBig: { fontSize: 22, fontWeight: 700, color: C.txtPrimary },
  priceUnit:{ fontSize: 12, fontWeight: 600, color: C.txtMuted },
  svcModalFooter: { padding: '16px 24px', borderTop: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  svcModalFooterNote: { fontSize: 11.5, color: C.txtMuted, maxWidth: 380, lineHeight: 1.5 },

  footer: { textAlign: 'center', fontSize: 11, color: C.txtMuted, padding: '16px 0', borderTop: `1px solid ${C.cardBdr}`, margin: '20px 0 0' },

  // SUBSCRIPTION & BILLING (Phase 3, Session 49)
  subBanner: { background: C.blueLight, border: `1px solid ${C.blueDark}22`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 },
  subBannerText: { fontSize: 12.5, color: C.txtPrimary, lineHeight: 1.5 },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 },
  planCard: (current) => ({ background: C.cardBg, border: `1.5px solid ${current ? C.green : C.cardBdr}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }),
  planCardName: { fontSize: 15, fontWeight: 700, color: C.txtPrimary },
  planCardPrice: { fontSize: 20, fontWeight: 700, color: C.txtPrimary },
  planCardPriceUnit: { fontSize: 11.5, fontWeight: 600, color: C.txtMuted },
  planCardDesc: { fontSize: 12, color: C.txtSec, lineHeight: 1.5, flex: 1 },
  planCardIncluded: { fontSize: 11, color: C.txtSec, lineHeight: 1.6 },

  // ── Available Plans — image-card layout matching the UN Plan admin catalog
  // card (image banner, status/currency pills, unit-range chip, price,
  // included/add-on counts, pill button). Real data only: image_url,
  // unit_limit_min/max, annual_price, included_services/addon_services all
  // come straight from UNPlanListSerializer (core/plans/serializers.py) via
  // GET /api/landlord/plans/ — nothing here is invented.
  planCardV2: (current) => ({ background: C.cardBg, border: `1.5px solid ${current ? C.green : C.cardBdr}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }),
  // Card height reduced ~40% in an earlier round, then a further ~10% this
  // round (round 6 ask #2) — image banner, body padding and the type scale
  // inside the body all trimmed another notch.
  planCardImgWrap: { position: 'relative', height: 97, background: C.navBg },
  planCardImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  planCardImgPlaceholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.35)' },
  planCardGradient: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.85), rgba(10,22,40,0.05) 60%)' },
  planCardStatusPill: { position: 'absolute', top: 8, left: 8, background: C.greenLight, color: C.greenDark, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  planCardCurrencyPill: { position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)', color: C.txtPrimary, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  planCardImgName: { position: 'absolute', left: 10, bottom: 7, right: 10, color: '#fff', fontSize: 13, fontWeight: 700, textShadow: '0 1px 6px rgba(0,0,0,0.4)' },
  planCardBodyV2: { padding: '10px 13px 11px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  planCardUnitChip: { alignSelf: 'flex-start', background: C.stdBg, color: C.txtSec, fontSize: 9.5, fontWeight: 600, padding: '3px 8px', borderRadius: 20 },
  planCardPriceV2: { fontSize: 16, fontWeight: 700, color: C.txtPrimary },
  planCardAnnual: { fontSize: 10.5, color: C.txtMuted, fontWeight: 600, marginTop: -3 },
  planCardDescV2: { fontSize: 11, color: C.txtSec, lineHeight: 1.45, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  planCardMetaLine: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 },
  planCardMetaIncluded: { color: C.greenDark, fontWeight: 600 },
  planCardMetaAddon: { color: C.txtMuted, fontWeight: 600 },
  planCardBtnPill: { marginTop: 3, width: '100%', textAlign: 'center', padding: '7px 0', borderRadius: 30, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.sans, border: 'none' },
  planCardBtnPillOutline: { background: '#fff', color: C.txtPrimary, border: `1.5px solid ${C.cardBdr}` },
  planCardBtnPillSolid: { background: C.navBg, color: '#fff' },

  currentSubCard: { background: C.greenLight, border: `1px solid ${C.greenDark}33`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 },

  // LISTING PROMOTION row (Phase 4, Session 49) — inside the Services tab
  promoCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 },
  promoLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  promoIcon: { width: 44, height: 44, borderRadius: 10, background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: C.amber, flexShrink: 0 },
  promoTitle: { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary },
  promoSub: { fontSize: 12, color: C.txtMuted, marginTop: 2 },

  // Explore Plans modal
  promoModal: { background: '#fff', borderRadius: 12, width: 640, maxWidth: '100%', padding: 24, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  promoPlanRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 4px', borderBottom: `1px solid ${C.cardBdr}` },

  // ── Full visual rebuild (Session 49) — stat tiles, richer plan hero, ─────
  // master-list + inspector panel for Services, and clearly-marked sample
  // cards for the two sections with no real backend yet (Payment Methods,
  // Billing History — this codebase has no payment gateway/invoice-read
  // endpoint wired for Landlord). Reconciles the Figma's "Provisioned Suite /
  // Service Inspection" structure and stat-tile row against the REAL
  // landlordTokens.js palette + Inter font — not the Figma's own navy/serif
  // tokens, per §3c of the Figma review doc ("use the real UrbanNest design
  // system as much as possible").
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 },
  // Session 51 — reviewer's Oct 3 "reduce the stats cards height by 20%".
  // Kept the icon size and the big number's font size untouched (that
  // number is the whole point of the tile) and took the ~20% out of
  // whitespace instead: padding 16/18 → 12/16, the internal gap 6 → 5, and
  // the caption line clamped to 1 line (it was wrapping to 2 lines on
  // several tiles — "1 included, 0 add-ons purchased" — which was the
  // single biggest remaining height variable once the padding/gap settled).
  // Reviewer's Oct 3 ask: match the colored-left-border accent pattern
  // from `LandlordListingsOverview.jsx`'s real `statCard(accent)` —
  // confirmed, scoped to just that one visual detail (icon badge, uppercase
  // label, serif value, and the subtext caption all stay exactly as they
  // were; Listings' own tiles have none of those). `statTile` becomes a
  // function the same way Listings' `statCard` is, taking the accent color;
  // each of the 5 tiles passes its own existing icon-tint foreground color
  // (confirmed) so the border and the icon badge stay visually paired.
  // Reviewer's Oct 3 ask: a second ~20% height cut on top of the one done a
  // few rounds back — same approach, more whitespace out rather than
  // touching statValue's font size (still the one thing this page has kept
  // untouched across every height-reduction round so far). Tile padding
  // 12px/16px → 8px/14px, inter-element gap 5→3, and the icon badge shrunk
  // 30px → 24px (also the single biggest remaining contributor to the top
  // row's height) — no live render in this session to measure the exact
  // pixel result, so this is a close estimate from the CSS box model, same
  // as every prior height-reduction round.
  // Gradient Option A (reviewer pick, Session 51 follow-up): a subtle
  // background wash from white into a light tint of the tile's own accent,
  // using the same light color each tile's statIconTint already carries —
  // no new color introduced. Border-left accent and icon stay as before.
  statTile: (accent, light) => ({ background: light ? `linear-gradient(135deg, ${C.cardBg} 55%, ${light} 160%)` : C.cardBg, border: `1px solid ${C.cardBdr}`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 3 }),
  statTileTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted },
  statIcon: { width: 24, height: 24, borderRadius: 7, background: C.blueLight, color: C.blueDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 },
  // Session 51 — soft colored icon badge per tile, matching the Figma's own
  // (subtle) per-tile tint instead of one repeated blue. Same shape/size as
  // the original statIcon, just a swappable background/color pair.
  statIconTint: (bg, fg) => ({ width: 24, height: 24, borderRadius: 7, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }),
  statValue: { fontFamily: F_SERIF, fontSize: 25, fontWeight: 700, color: C.txtPrimary },
  statSub: { fontSize: 11.5, color: C.txtMuted, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' },

  chipIncluded: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: C.blueLight, color: C.blueDark },
  chipAddon: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: C.amberLight, color: C.amber },
  pillActive: { background: C.greenLight, color: C.greenDark, fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },

  btnDisabled: { background: C.stdBg, color: C.txtMuted, border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', fontFamily: F.sans },

  // SUBSCRIPTION & BILLING — unified Current Plan + Allocated Capacity layout
  // (Session 49, round 5). A 40/30/30 three-column grid, but now a true
  // two-TIER grid (gridAutoRows handles this via plain DOM order + grid
  // auto-flow, no explicit gridColumn/gridRow needed): tier 1 is Current
  // Plan | [middle stack] | [right stack], all three stretched to equal
  // height by the grid's own `alignItems: 'stretch'` (was 'start' — that's
  // what let the stacks sit shorter than Current Plan before this round);
  // tier 2 is Available Plans, alone, auto-placed back into column 1 by
  // grid-auto-flow, so it still matches Current Plan's 40% width without
  // being forced to the same height as it (°which is what "Current Plan ...
  // should have the same vertical height as Allocated+Growth" actually
  // means — Available Plans was never part of that comparison).
  //
  // Round 4's "Portfolio Health"/"Portfolio Growth" middle/right cards were
  // flagged as dashboard content with no real tie to Subscription & Billing
  // (occupancy, leases, maintenance tickets belong on the separate Landlord
  // Dashboard, not here) — both replaced this round with billing-native
  // content instead:
  //   - Middle stack: "Billing Breakdown" (real base-plan + add-on spend,
  //     from this page's own already-fetched subscription/addons data) +
  //     Enterprise Expansion (unchanged, relabeled eyebrow from last round).
  //   - Right stack: Allocated Capacity (unchanged — it's a real plan-
  //     entitlement-vs-usage metric, genuinely billing-relevant) + "Listing
  //     Promotion" (the account's OTHER real purchase — the standing
  //     ListingPromotionSubscription entitlement, Phase 4 — surfaced here
  //     for the first time instead of only in My Services' Services tab;
  //     reuses the same promoSubs/activePromoSub state already fetched for
  //     that tab, nothing new fetched).
  // Every field below is real — nothing fabricated, per the same "use
  // sample data only where there's truly no real data" rule applied to
  // Payment Methods/Billing History above.
  // marginBottom added (round 6 ask #3) — previously nothing separated the
  // end of Available Plans (this grid's tier-2 row) from the Payment Methods
  // & Details card right below it; every other major section already has
  // its own breathing room via figmaCard's marginBottom:22.
  subGrid: { display: 'grid', gridTemplateColumns: '4fr 3fr 3fr', gridAutoRows: 'auto', gap: 18, alignItems: 'stretch', marginBottom: 28 },
  subLeftCol: { minWidth: 0, display: 'flex', flexDirection: 'column' },
  subMidCol: { minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  subRightCol: { minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  subAvailablePlansBlock: { gridColumn: '1' },

  // Card is now an outer (image banner) + inner (padded, gradient-washed body)
  // pair — the plan's own image (UNPlan.image_url, same field the Available
  // Plans cards already use) sits in the banner, gradient-faded into the
  // body, per the reviewer's "gradient touch" + "image inside the section"
  // instructions.
  // Round 6 (height -25% ask): banner/padding/type-scale/spacing all tightened
  // together so Current Plan's OWN natural height comes down — it was the
  // tallest tile-1 member, so it alone was driving the whole stretched row to
  // occupy the full viewport without scrolling.
  curPlanCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 14, overflow: 'hidden', height: '100%' },
  curPlanCardBody: { background: `linear-gradient(160deg, #ffffff 0%, ${C.blueLight}45 55%, ${C.greenLight}45 100%)`, padding: '15px 20px 17px' },
  curPlanImgBanner: { position: 'relative', height: 105, background: C.navBg },
  curPlanImgBannerImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  curPlanImgBannerPlaceholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'rgba(255,255,255,0.35)' },
  curPlanImgBannerFade: { position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(10,22,40,0) 35%, ${C.cardBg} 100%)` },
  curPlanTopRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  curPlanTierRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 },
  curPlanTierLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.txtMuted },
  curPlanPersonaPill: { fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', padding: '2px 9px', borderRadius: 20, background: C.stdBg, color: C.stdTx },
  curPlanTitle: { fontSize: 19, fontWeight: 700, color: C.txtPrimary },
  curPlanDateRange: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.txtMuted, marginTop: 4 },
  curPlanPriceBig: { fontSize: 26, fontWeight: 700, color: C.txtPrimary, textAlign: 'right', lineHeight: 1 },
  curPlanPriceSub: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, marginTop: 4, textAlign: 'right' },
  curPlanDesc: { fontSize: 12, color: C.txtSec, lineHeight: 1.5, marginTop: 9, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  curPlanDivider: { borderTop: `1px solid ${C.cardBdr}`, margin: '12px 0' },

  // Entitlement + Next Charge Scheduled — forced side-by-side even in the
  // narrower 40% column (reviewer instruction): flexWrap:'nowrap' so they
  // never stack, minWidth:0 so each tile can shrink below its content's
  // natural width instead of forcing a wrap, and each tile's own padding/
  // icon/font sizes reduced (the "reduce the length of the cards" ask) so
  // two of them comfortably fit side by side at 40% column width.
  curPlanTilesRow: { display: 'flex', gap: 10, flexWrap: 'nowrap' },
  curPlanTile: { flex: '1 1 0', minWidth: 0, background: C.pageBg, borderRadius: 10, padding: '9px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' },
  curPlanTileIcon: { width: 22, height: 22, borderRadius: 6, background: '#fff', border: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.greenDark, flexShrink: 0 },
  curPlanTileLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: C.txtMuted },
  curPlanTileValue: { fontSize: 11, fontWeight: 700, color: C.txtPrimary, marginTop: 2, lineHeight: 1.3 },
  curPlanTileSub: { fontSize: 9.5, color: C.txtMuted, marginTop: 1, lineHeight: 1.3 },

  curPlanProgressWrap: { marginTop: 11 },
  curPlanProgressLabelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  curPlanProgressLabel: { fontSize: 12, fontWeight: 700, color: C.txtPrimary },
  curPlanProgressRemaining: { fontSize: 11, fontWeight: 700, color: C.greenDark },
  curPlanProgressOuter: { height: 6, borderRadius: 20, background: C.stdBg, overflow: 'hidden' },
  curPlanProgressInner: (pct) => ({ height: '100%', width: `${pct}%`, borderRadius: 20, background: C.navBg }),
  curPlanProgressDates: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.txtMuted, marginTop: 4 },

  curPlanActionsRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, flexWrap: 'wrap' },
  curPlanBtnCancel: { marginLeft: 'auto', background: 'none', border: 'none', padding: 0, color: C.red, fontSize: 12, fontWeight: 700, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: F.sans },

  curPlanEmpty: { background: C.pageBg, border: `1px dashed ${C.cardBdr}`, borderRadius: 10, padding: '28px 24px', textAlign: 'center' },

  acCard: { background: `linear-gradient(160deg, #ffffff 0%, ${C.blueLight}45 55%, ${C.greenLight}45 100%)`, border: `1px solid ${C.cardBdr}`, borderRadius: 14, padding: '16px 18px', flex: 1 },
  acHeaderRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  // Single-line title (round 6 ask): dropped the <br/> two-line break, font
  // size trimmed and minWidth:0 + ellipsis added as a safety net so it never
  // forces the 30%-wide column wider or wraps onto a second line.
  acTitle: { fontSize: 15, fontWeight: 700, color: C.txtPrimary, lineHeight: 1.25, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  acIcon: { fontSize: 20, color: C.txtMuted, flexShrink: 0 },

  acRingRow: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 13 },
  acRingWrap: { position: 'relative', width: 84, height: 84, flexShrink: 0 },
  acRingCenter: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  acRingValue: { fontSize: 19, fontWeight: 700, color: C.txtPrimary, lineHeight: 1 },
  acRingOf: { fontSize: 8.5, fontWeight: 700, color: C.txtMuted, letterSpacing: 0.3 },
  acRingLabel: { fontSize: 13, fontWeight: 700, color: C.txtPrimary },
  acRingSub: { fontSize: 11.5, color: C.txtMuted, marginTop: 2 },
  acRingPct: { fontSize: 11, fontWeight: 700, color: C.greenDark, marginTop: 4 },

  acDivider: { borderTop: `1px solid ${C.cardBdr}`, margin: '13px 0 10px' },
  acMetricRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' },
  acMetricLabel: { fontSize: 12.5, color: C.txtSec },
  acMetricValue: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary },

  eeCard: { background: `linear-gradient(135deg, ${C.navBg} 0%, #142238 100%)`, borderRadius: 14, padding: '16px 18px', color: '#fff', flex: 1 },
  eeLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 },
  eeTitle: { fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 8 },
  eeBody: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 12 },
  eeCta: { background: 'none', border: 'none', padding: 0, color: '#fff', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: F.sans },

  // BILLING BREAKDOWN — replaces round 4's "Portfolio Health" in the middle
  // column. Portfolio Health (occupancy/leases/maintenance) was correctly
  // flagged as dashboard content with no real tie to Subscription & Billing
  // — that data belongs on the separate Landlord Dashboard page, not here.
  // This is a genuinely billing-native replacement: a real cost breakdown
  // of the account's own monthly recurring spend — base plan price (already
  // fetched/computed for Current Plan's own price display) plus the sum of
  // each real UNSubscriptionAddon's `price_paid` (subscription.addons,
  // already fetched by this page's fetchSubscriptionData — nothing new
  // added) — something this page computes nowhere else today.
  bbCard: { background: `linear-gradient(160deg, #ffffff 0%, ${C.blueLight}45 55%, ${C.greenLight}45 100%)`, border: `1px solid ${C.cardBdr}`, borderRadius: 14, padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' },
  bbHeaderRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  // Single-line title (round 6 ask) — same treatment as acTitle/lpTitle.
  bbTitle: { fontSize: 15, fontWeight: 700, color: C.txtPrimary, lineHeight: 1.25, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  bbIcon: { fontSize: 20, color: C.txtMuted, flexShrink: 0 },
  bbRows: { marginTop: 13, flex: 1 },
  bbRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' },
  bbRowLabel: { fontSize: 12.5, color: C.txtSec },
  bbRowSub: { fontSize: 10, color: C.txtMuted },
  bbRowValue: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary },
  bbDivider: { borderTop: `1px solid ${C.cardBdr}`, margin: '8px 0' },
  bbTotalRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  bbTotalLabel: { fontSize: 13, fontWeight: 700, color: C.txtPrimary },
  bbTotalValue: { fontSize: 22, fontWeight: 700, color: C.txtPrimary },
  bbTotalSub: { fontSize: 10.5, color: C.txtMuted, marginTop: 2 },

  // LISTING PROMOTION — replaces round 4's "Portfolio Growth" (rent-
  // collection trend) in the right column, stacked under Allocated
  // Capacity. Rent collected is dashboard content, same objection as
  // Portfolio Health. This instead surfaces the account's OTHER real
  // purchase — the standing Listing Promotion entitlement
  // (ListingPromotionSubscription, Phase 4) — which until now only showed
  // up in My Services' Services tab. Reuses the same `promoSubs`/
  // `activePromoSub` state already fetched for that tab; nothing new
  // fetched here. Genuinely billing-relevant: it's a second, independent
  // purchase against this same UNAccount (§4 item 10's "two fully
  // independent purchases" decision), so showing both purchase types
  // together on the Subscription & Billing tab is a more honest "billing"
  // page than showing only one of the two.
  lpCard: { background: `linear-gradient(160deg, #ffffff 0%, ${C.blueLight}45 55%, ${C.greenLight}45 100%)`, border: `1px solid ${C.cardBdr}`, borderRadius: 14, padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' },
  lpHeaderRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  // Single-line title (round 6 ask) — same treatment as acTitle/bbTitle.
  lpTitle: { fontSize: 15, fontWeight: 700, color: C.txtPrimary, lineHeight: 1.25, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  lpIcon: { fontSize: 20, color: C.txtMuted, flexShrink: 0 },
  lpBody: { marginTop: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  lpPlanName: { fontSize: 14, fontWeight: 700, color: C.txtPrimary },
  lpStatusRow: { marginTop: 5 },
  lpMetricRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' },
  lpMetricLabel: { fontSize: 12, color: C.txtSec },
  lpMetricValue: { fontSize: 12, fontWeight: 700, color: C.txtPrimary },
  lpEmpty: { fontSize: 12, color: C.txtMuted, lineHeight: 1.6 },
  lpCta: { background: 'none', border: 'none', padding: 0, marginTop: 12, color: C.blueDark, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: F.sans },

  // PAYMENT METHODS & BILLING HISTORY — rebuilt to match the Figma's exact
  // layout/structure/fields (per reviewer instruction: replicate the Figma,
  // don't substitute a simplified design). Colors/font still come from the
  // real landlordTokens.js palette + Inter, per the already-settled §3c
  // decision — only the STRUCTURE below is taken from the Figma. Real data
  // (cardholder name, invoicing email) is used where this app already has
  // it; everything the app has no backend for (card number, EIN, entity
  // address, invoices) is sample data, exactly as instructed.
  figmaCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '22px 24px', marginBottom: 22 },
  figmaCardHdr: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  figmaCardTitle: { fontSize: 16, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  figmaCardSub: { fontSize: 12, color: C.txtMuted, marginTop: 4 },
  figmaDivider: { borderTop: `1px dashed ${C.cardBdr}`, margin: '18px 0 20px' },
  figmaOutlineBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: C.navBg, border: `1px solid ${C.cardBdr}`, padding: '8px 14px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.sans, whiteSpace: 'nowrap' },
  figmaLinkBtn: { background: 'none', border: 'none', padding: 0, color: C.blue, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.2, textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.sans, display: 'inline-flex', alignItems: 'center', gap: 5 },

  // Round 6 (ask #5): Payment Methods & Details becomes a 40/30/30 three-
  // column layout — Active Payment Instrument (40%) | Commercial Entity
  // Information (30%) | a new third subsection, Linked Bank Accounts (30%).
  // Grid instead of the old flex-wrap pmTwoCol so the 40/30/30 ratio is
  // explicit and matches the same 4fr/3fr/3fr convention used by subGrid
  // above, rather than three flex:1 columns that would land at 33/33/33.
  pmThreeCol: { display: 'grid', gridTemplateColumns: '4fr 3fr 3fr', gap: 24, alignItems: 'flex-start' },
  pmCol: { minWidth: 0 },
  pmColLabelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  pmColLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.txtMuted, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  // "Sample" watermark (ARCH_028 convention) — still used by the Listing
  // Promotion catalog's sample cards; no longer used by Linked Bank
  // Accounts, since Bank Accounts is now wired to the real OwnerBankAccount
  // model (bankAccounts is shared, real, fetched state, not mock data).
  pmSamplePill: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, background: C.stdBg, color: C.txtMuted, whiteSpace: 'nowrap', flexShrink: 0 },

  pmCreditCard: { position: 'relative', background: `linear-gradient(135deg, ${C.navBg} 0%, #142238 100%)`, borderRadius: 14, padding: '20px 22px', color: '#fff', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(10,22,40,0.25)' },
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
  pmAutoDebit: { fontSize: 12, color: C.txtSec, display: 'flex', alignItems: 'center', gap: 7 },

  // Reviewer's Oct 3 "standardize text box backgrounds" ask, extended Oct 4
  // — #f8f9fb is now the one standard background for every genuine
  // text/info box container on this page: pmEntityBox below, the
  // Transactions tab's txDetailInfoBox/txTotalRow/txSecurityNote, and the
  // Integrations tab's intgInfoBox all use it. Pills, disabled buttons,
  // icon badges (incl. intgIconBox), avatar circles, and chart containers
  // are a different category — those stay on C.stdBg, deliberately
  // unchanged per the original scoping decision.
  pmEntityBox: { background: '#f8f9fb', borderRadius: 10, padding: '16px 18px' },
  pmEntityHead: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  pmEntityIcon: { width: 28, height: 28, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.txtSec, flexShrink: 0 },
  pmEntityName: { fontSize: 13.5, fontWeight: 700, color: C.txtPrimary },
  pmEntityAddr: { fontSize: 12, color: C.txtSec, marginTop: 4, lineHeight: 1.6 },
  pmEntityDivider: { borderTop: `1px solid ${C.cardBdr}`, margin: '14px 0' },
  pmEntityRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  pmEntityRowLabel: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted },
  pmEntityRowValue: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary, marginTop: 2 },

  pmTaxBanner: { display: 'flex', alignItems: 'center', gap: 10, background: C.greenLight, color: C.greenDark, borderRadius: 10, padding: '12px 16px', fontSize: 12, lineHeight: 1.5, marginTop: 20 },

  bhToolbarRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  bhSearchWrap: { position: 'relative' },
  bhSearchInput: { padding: '8px 12px 8px 32px', border: `1px solid ${C.cardBdr}`, borderRadius: 8, fontSize: 12.5, fontFamily: F.sans, color: C.txtPrimary, width: 210 },
  bhSearchIcon: { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.txtMuted },
  bhYearDropdownWrap: { width: 100, flexShrink: 0 },

  bhTable: { width: '100%', borderCollapse: 'collapse', marginTop: 4 },
  bhTh: { textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, padding: '10px 10px', borderBottom: `1px solid ${C.cardBdr}` },
  bhTd: { fontSize: 12.5, color: C.txtPrimary, padding: '13px 10px', borderBottom: `1px solid ${C.cardBdr}`, verticalAlign: 'middle' },
  bhPaidPill: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: C.greenLight, color: C.greenDark, whiteSpace: 'nowrap' },
  bhDownloadBtn: { background: 'none', border: 'none', padding: 0, color: C.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: F.sans },

  bhFooterRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.cardBdr}`, fontSize: 12, color: C.txtMuted, flexWrap: 'wrap' },
  bhPagination: { display: 'flex', alignItems: 'center', gap: 6 },
  bhPageBtn: { width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.cardBdr}`, background: '#fff', fontSize: 12, color: C.txtSec, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', fontFamily: F.sans },
  bhPageBtnActive: { background: C.navBg, color: '#fff', borderColor: C.navBg, cursor: 'default' },

  // ─── TRANSACTIONS TAB (Session 52) ───────────────────────────────────────
  // New 4th tab, matching the reviewer's attached Figma structurally (scope
  // badge, 3 stat cards, filter toolbar, Billing Activity table + Transaction
  // Detail side panel) but in the real landlordTokens.js palette/Inter font
  // — not the Figma's own navy/serif tokens — per the same "colors per our
  // existing design system, structure per Figma" split already settled for
  // every other tab on this page (§3c of the review doc), and per this
  // round's own instruction ("only change with respect to colour
  // combination... as per existing landlord design philosophy"). Deliberately
  // does NOT repeat the Figma's own page-level breadcrumb/H1 ("Account
  // Settings > Transactions" / a big serif "Transactions" heading) — that's
  // page chrome from the Figma's standalone mockup frame, already decided
  // out of scope for every tab on this page (the shared "Settings" H1 + tab
  // strip above already serves that role) — flagged in the review doc as the
  // one deliberate structural deviation, same as every prior round's.
  txIntroRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 },
  txIntroSub: { fontSize: 12.5, color: C.txtMuted, maxWidth: 520, margin: 0, lineHeight: 1.5 },
  txScopeBadge: { display: 'flex', alignItems: 'center', gap: 8, background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '8px 14px', whiteSpace: 'nowrap' },
  txScopeIcon: { width: 26, height: 26, borderRadius: 7, background: C.blueLight, color: C.blueDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 },
  txScopeLabel: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.txtMuted },
  txScopeValue: { fontSize: 12, fontWeight: 700, color: C.txtPrimary, marginTop: 1 },

  txStatRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 },
  // Oct 4 ask: these 3 stat cards now reuse the Services tab's own
  // statTile/statTileTop/statLabel/statIconTint/statValue/statSub pattern
  // (defined further up near the stat-row styles) instead of a tx-specific
  // copy, so the old txStatCard/txStatCardHdr/txStatLabel/txStatIconWrap/
  // txStatValueRow/txStatValue/txStatDelta/txStatSub/txStatSubOk styles
  // they used are removed here as dead code.

  txCardMini: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 1 },
  txCardMiniIcon: { width: 30, height: 30, borderRadius: 7, background: C.navBg, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txCardMiniBrand: { fontSize: 13, fontWeight: 700, color: C.txtPrimary },
  txCardMiniMeta: { fontSize: 11, color: C.txtMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 },

  txToolbarRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  txSearchWrap: { position: 'relative', flex: 1, minWidth: 220 },
  txSearchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.txtMuted },
  txSearchInput: { width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: `1px solid ${C.cardBdr}`, borderRadius: 8, fontSize: 12.5, fontFamily: F.sans, color: C.txtPrimary, background: C.cardBg },
  txServiceDropdownWrap: { width: 160, flexShrink: 0 },
  txRangeDropdownWrap: { width: 150, flexShrink: 0 },

  txLayout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'flex-start' },

  txTableCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '22px 24px', minWidth: 0 },

  txTable: { width: '100%', borderCollapse: 'collapse', marginTop: 4 },
  txTh: { textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, padding: '10px 10px', borderBottom: `1px solid ${C.cardBdr}` },
  // Selected-row tint reduced to a low-alpha wash of the same blueLight
  // (20% opacity) rather than the solid pill color, per the reviewer's own
  // "very very light and subtle" — same hex+alpha convention already used
  // for this tab's gradient washes (e.g. txDetailCard), just a lower value.
  // Hover reuses the same blue family at half that alpha (10%), so an
  // unselected row previews lighter than a selected one on mouseover.
  txRow: (active, hovered) => ({ cursor: 'default', background: active ? `${C.blueLight}33` : hovered ? `${C.blueLight}1A` : 'transparent' }),
  txTd: { fontSize: 12.5, color: C.txtPrimary, padding: '13px 10px', borderBottom: `1px solid ${C.cardBdr}`, verticalAlign: 'top' },
  txRef: { fontSize: 11, color: C.txtMuted, fontFamily: 'monospace', letterSpacing: 0.2 },
  txAmountTd: (negative) => ({ fontSize: 12.5, color: negative ? C.red : C.txtPrimary, padding: '13px 10px', borderBottom: `1px solid ${C.cardBdr}`, verticalAlign: 'top', textAlign: 'right' }),
  txViewIconBtn: (active) => ({ width: 28, height: 28, borderRadius: 6, border: `1px solid ${active ? C.navBg : C.cardBdr}`, background: active ? C.blueLight : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: active ? C.navBg : C.blue, cursor: 'pointer', flexShrink: 0 }),
  txEmptyRow: { padding: '28px 10px', textAlign: 'center', color: C.txtMuted, fontSize: 12.5 },

  txFooterRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.cardBdr}`, fontSize: 12, color: C.txtMuted, flexWrap: 'wrap' },
  txPagination: { display: 'flex', alignItems: 'center', gap: 6 },
  txPageBtn: { width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.cardBdr}`, background: '#fff', fontSize: 12, color: C.txtSec, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', fontFamily: F.sans },
  txPageBtnActive: { background: C.navBg, color: '#fff', borderColor: C.navBg, cursor: 'default' },

  // Same gradient wash recipe already used by Subscription & Billing's
  // Allocated Capacity/Current Plan/Billing Breakdown/Listing Promotion
  // cards (`acCard` etc.) — reused here verbatim for the first color stop
  // so this panel matches that established look; the second stop swaps to
  // red for a Refunded transaction instead of green, consistent with this
  // panel's own existing status-aware badge/icon treatment (not part of
  // the Allocated Capacity reference, a deliberate extension flagged here).
  txDetailCard: (refunded) => ({ background: `linear-gradient(160deg, #ffffff 0%, ${C.blueLight}45 55%, ${refunded ? C.redLight : C.greenLight}45 100%)`, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '20px 22px', position: 'sticky', top: 16 }),
  txDetailTopRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  // gap bumped 8 -> 24 this round: reviewer asked to bring "View Details"
  // down by one line from the icon above it, so the extra ~16px (one
  // text-line's worth at this panel's scale) is added as flex gap rather
  // than a margin on the button itself, keeping the icon's own position fixed.
  txDetailHdrRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 24, flexShrink: 0 },
  txDetailBadge: (refunded) => ({ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: refunded ? C.red : C.greenDark, display: 'flex', alignItems: 'center', gap: 5 }),
  txDetailIconWrap: (refunded) => ({ width: 34, height: 34, borderRadius: 8, background: refunded ? C.redLight : C.greenLight, color: refunded ? C.red : C.greenDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }),
  txDetailTitle: { fontFamily: F_SERIF, fontSize: 16, fontWeight: 600, color: C.txtPrimary, margin: '2px 0 3px', lineHeight: 1.25 },
  txDetailRef: { fontSize: 11, color: C.txtMuted, fontFamily: 'monospace' },

  txDetailInfoBox: { background: '#f8f9fb', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '12px 14px', margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 9 },
  txDetailInfoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  txDetailInfoLabel: { fontSize: 11.5, color: C.txtMuted, display: 'flex', alignItems: 'center', gap: 6 },
  txDetailInfoValue: { fontSize: 12, fontWeight: 600, color: C.txtPrimary, textAlign: 'right' },

  txBreakdownLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.txtMuted, marginBottom: 8, marginTop: 4 },
  txBreakdownRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: C.txtSec, padding: '6px 0' },
  txTotalRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fb', borderRadius: 8, padding: '10px 12px', marginTop: 8 },
  txTotalLabel: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary },
  txTotalValue: (negative) => ({ fontFamily: F_SERIF, fontSize: 17, fontWeight: 700, color: negative ? C.red : C.txtPrimary }),

  txBtnPrimary: { width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.navBg, color: '#fff', border: 'none', padding: '11px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, cursor: 'not-allowed', fontFamily: F.sans, marginTop: 16 },
  txBtnOutline: { width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: C.navBg, border: `1px solid ${C.cardBdr}`, padding: '10px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, cursor: 'not-allowed', fontFamily: F.sans, marginTop: 8 },

  txSecurityNote: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 10.5, color: C.txtMuted, lineHeight: 1.5, background: '#f8f9fb', borderRadius: 8, padding: '10px 12px', marginTop: 16 },

  // (The old "master list + inspector panel" Services-tab styles —
  // svcTwoCol/svcListCol/svcListCard/svcListRow/svcListIcon/svcListName/
  // svcListSub/pillRowActive/pillRowAvailable/svcListActionBtn/inspectorCol/
  // inspectorCard/inspectorIcon/inspectorTitle/inspectorSub/
  // inspectorMetaLabel/inspectorMetaValue/inspectorEmpty — were removed this
  // round, Session 50: fully superseded by the explicit "Included with Your
  // Plan" / "Add-Ons for Your Plan" / Listing Promotion / external-marketing
  // sections below, per the reviewer's 5-point restructure. ServiceDetailModal
  // (unchanged) is still how "View Details" opens from the new card grids.)

  // ─── "My Profile" tab (new this round) ──────────────────────────────────
  // Figma's own sidebar/topbar chrome (dark nav, search bar, breadcrumb,
  // per-page H1) is treated as mockup context, same precedent as every
  // earlier tab on this page — NavF/the shared topbar/pageHdrRow are reused
  // as-is; only the two-column content below is new. Card headers reuse
  // this page's own figmaCard/figmaCardHdr/figmaCardTitle/figmaCardSub/
  // figmaDivider convention rather than the Figma's literal "SECTION 01"
  // eyebrow, for consistency with every other card on this page.
  profLayout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'flex-start' },

  profAvatarRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 },
  profAvatarCircle: { width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: C.navBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  profAvatarBtnCol: { display: 'flex', flexDirection: 'column', gap: 8 },
  profAvatarBtnRow: { display: 'flex', alignItems: 'center', gap: 14 },
  profRemoveLink: { background: 'none', border: 'none', padding: 0, color: C.red, fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', fontFamily: F.sans },
  profAvatarHint: { fontSize: 11, color: C.txtMuted },

  profFormActions: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 6 },
  profSaveMsg: (ok) => ({ fontSize: 12, fontWeight: 600, color: ok ? C.greenDark : C.red, marginRight: 'auto' }),
  profDiscardBtn: { background: 'none', border: 'none', padding: 0, color: C.txtSec, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.sans },

  profPersonaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 },
  profPersonaTile: (variant) => ({
    border: `1px solid ${variant === 'active' ? C.navBg : C.cardBdr}`,
    borderRadius: 10, padding: '12px 14px',
    background: variant === 'active' ? C.navBg : '#fff',
    color: variant === 'active' ? '#fff' : C.txtMuted,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: variant === 'locked' ? 0.6 : 1,
  }),
  profPersonaActivePill: { background: C.heroBadgeBg, color: C.heroBadgeTx, fontSize: 8, fontWeight: 700, letterSpacing: 0.3, padding: '2px 6px', borderRadius: 20, textTransform: 'uppercase' },

  profIdentifierRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  profVerifyPill: (tone) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700,
    padding: '3px 9px', borderRadius: 20,
    background: tone === 'green' ? C.greenLight : tone === 'amber' ? C.amberLight : tone === 'red' ? C.redLight : C.stdBg,
    color:      tone === 'green' ? C.greenDark : tone === 'amber' ? C.amber     : tone === 'red' ? C.red      : C.stdTx,
  }),

  profSecRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  profSecRowLabel: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary, display: 'flex', alignItems: 'center', gap: 6 },
  profSecRowSub: { fontSize: 11, color: C.txtMuted, marginTop: 2 },
  profSecStatusPill: (ok) => ({ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: ok ? C.greenLight : C.amberLight, color: ok ? C.greenDark : C.amber, flexShrink: 0 }),
  profSecBtnGhost: { background: C.stdBg, border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 600, color: C.txtSec, cursor: 'not-allowed', fontFamily: F.sans, flexShrink: 0 },

  profSessionCard: { background: C.navBg, color: '#fff', borderRadius: 10, padding: '14px 16px', marginTop: 4 },
  profSessionTag: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: C.heroSubTx, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  profSessionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  profSessionMeta: { fontSize: 11, color: C.heroSubTx, marginBottom: 12, lineHeight: 1.5 },
  profSessionBtn: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: 7, padding: '8px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'not-allowed', fontFamily: F.sans },

  profSampleTag: { fontSize: 8.5, fontWeight: 700, letterSpacing: 0.3, color: C.txtMuted, background: C.stdBg, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' },

  // ── Integrations tab (Figma, Oct 2026) ──────────────────────────────────
  // None of these connections (Stripe, QuickBooks/Xero, SendGrid, Twilio) or
  // the webhooks/API-key banner are wired to any real backend integration —
  // settings.py only holds placeholder Stripe env keys, nothing is
  // implemented for the others. So every account id, sync time, and
  // delivery figure below is static sample content straight from the Figma
  // mock, and every action button is disabled with an ARCH_017 tooltip,
  // same convention as the Security & Credentials card on My Profile.
  intgIntroRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  intgIntroSub: { fontSize: 12.5, color: C.txtMuted, maxWidth: 560, margin: 0, lineHeight: 1.5 },
  intgStatBadgeRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  intgStatBadge: { display: 'flex', alignItems: 'center', gap: 10, background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '10px 16px', whiteSpace: 'nowrap' },
  intgStatIcon: (bg, fg) => ({ width: 36, height: 36, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }),
  intgStatValue: { fontFamily: F_SERIF, fontSize: 17, fontWeight: 700, color: C.txtPrimary, lineHeight: 1.2 },
  intgStatCaption: { fontSize: 10.5, color: C.txtMuted, lineHeight: 1.3, marginTop: 1, maxWidth: 72 },

  intgGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  intgCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  intgCardHeadRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  intgCardIconTitleRow: { display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 },
  intgIconBox: { width: 44, height: 44, borderRadius: 10, background: C.stdBg, color: C.txtPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 },
  intgEyebrow: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, marginBottom: 3 },
  intgTitle: { fontFamily: F_SERIF, fontSize: 19, fontWeight: 700, color: C.txtPrimary, lineHeight: 1.25, margin: 0 },
  intgStatusPill: (connected) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: connected ? C.greenLight : C.stdBg, color: connected ? C.greenDark : C.txtSec, whiteSpace: 'nowrap', flexShrink: 0 }),

  intgInfoBox: { background: '#f8f9fb', borderRadius: 8, padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 9 },
  intgInfoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12 },
  intgInfoLabel: { color: C.txtSec },
  intgInfoValueMono: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 11.5, color: C.txtPrimary, fontWeight: 600 },
  intgInfoValueText: { fontSize: 12, fontWeight: 700, color: C.txtPrimary },
  intgInfoValueOk: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: C.greenDark },
  intgInfoNotice: { display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, color: C.txtSec, lineHeight: 1.5 },
  intgInfoNoticeIcon: { color: C.txtMuted, fontSize: 14, marginTop: 1, flexShrink: 0 },
  intgBarTrack: { width: 70, height: 6, background: '#fff', borderRadius: 20, overflow: 'hidden', flexShrink: 0 },
  intgBarFill: (pct) => ({ width: `${pct}%`, height: '100%', background: C.greenDark, borderRadius: 20 }),

  intgBtnRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 2, flexWrap: 'wrap' },
  intgDangerLink: { background: 'none', border: 'none', padding: 0, color: C.red, fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', fontFamily: F.sans, display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto' },

  intgDevBanner: { background: C.navBg, borderRadius: 14, padding: '26px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' },
  intgDevEyebrowRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  intgDevTag: { background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase' },
  intgDevVersion: { color: C.heroSubTx, fontSize: 11, fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  intgDevTitle: { fontFamily: F_SERIF, fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  intgDevDesc: { fontSize: 12.5, color: C.heroSubTx, lineHeight: 1.55, maxWidth: 580, margin: 0 },
  intgDevBtnRow: { display: 'flex', gap: 10, flexShrink: 0 },
  intgDevBtnGhost: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'not-allowed', fontFamily: F.sans, display: 'inline-flex', alignItems: 'center', gap: 7 },
  intgDevBtnSolid: { background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'not-allowed', fontFamily: F.sans, display: 'inline-flex', alignItems: 'center', gap: 7 },
};

// ─── Bank Account modal (Add / Edit) ──────────────────────────────────────────
function BankAccountModal({ account, hasOtherAccounts, holderName, saving, error, onClose, onSave }) {
  const isEdit = !!account;
  const [form, setForm] = useState({
    bank_name: account?.bank_name || '',
    account_number: '',
    routing_number: '',
    account_type: account?.account_type || 'checking',
    currency: account?.currency || 'USD',
    country: account?.country || 'United States',
    is_default: account ? account.is_default : !hasOtherAccounts,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h3 style={S.modalH3}>{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}</h3>
        <p style={S.modalSub}>This is where rent and service payouts will be sent.</p>

        <div style={S.field}>
          <label style={S.fieldLbl}>Account Holder Name</label>
          {/* OwnerBankAccount doesn't store a per-account holder name — the
              model is 1:1 with its owner, so the holder is always this
              account's own owner. Shown (not editable) from the real,
              signed-in landlord's profile name rather than left as a
              free-text field that would silently do nothing on save. */}
          <input style={{ ...S.fieldInput, background: C.stdBg, color: C.txtMuted }} type="text" value={holderName} disabled title="The account holder is always your own UrbanNest profile name" />
        </div>
        <div style={S.field}>
          <label style={S.fieldLbl}>Bank Name</label>
          <input style={S.fieldInput} type="text" placeholder="e.g. Chase Bank" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} />
        </div>
        <div style={S.field}>
          <label style={S.fieldLbl}>Account Number</label>
          <input style={S.fieldInput} type="text" placeholder={isEdit ? 'Leave blank to keep the current number' : '•••• •••• •••• ••••'} value={form.account_number} onChange={e => set('account_number', e.target.value)} />
        </div>
        <div style={S.fieldRow}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Routing Number</label>
            <input style={S.fieldInput} type="text" placeholder="e.g. 021000021" value={form.routing_number} onChange={e => set('routing_number', e.target.value)} />
          </div>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Account Type</label>
            {/* The real, model-backed choices (OwnerBankAccount.ACCOUNT_TYPE_CHOICES)
                — "Checking" / "Savings" — not free text, so the Bank Accounts
                card can show a real account_type_display instead of guessing. */}
            <CustomDropdown
              options={[{ value: 'checking', label: 'Checking' }, { value: 'savings', label: 'Savings' }]}
              value={form.account_type}
              onChange={v => set('account_type', v)}
              placeholder="Select account type…"
            />
          </div>
        </div>
        <div style={S.fieldRow}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Currency</label>
            <CustomDropdown
              options={[{ value: 'USD', label: 'USD' }]}
              value={form.currency}
              onChange={v => set('currency', v)}
              placeholder="Select currency…"
            />
          </div>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Country</label>
            <CustomDropdown
              options={[{ value: 'United States', label: 'United States' }]}
              value={form.country}
              onChange={v => set('country', v)}
              placeholder="Select country…"
            />
          </div>
        </div>
        <div style={S.checkboxRow}>
          <input
            type="checkbox"
            checked={form.is_default}
            disabled={!hasOtherAccounts}
            onChange={e => set('is_default', e.target.checked)}
          />
          <span>Set as default bank account{!hasOtherAccounts ? ' (only account — always default)' : ''}</span>
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 4, marginBottom: 4 }}>{error}</div>}
        <div style={S.modalActions}>
          <button style={S.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={() => onSave(form)} disabled={saving || !form.bank_name || (!isEdit && !form.account_number)}>
            {saving ? 'Saving…' : 'Save Bank Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service detail modal ─────────────────────────────────────────────────────
function ServiceDetailModal({ service, inCart, onClose, onAddToCart }) {
  const heroStyle = service.image
    ? { ...S.svcModalHero, backgroundImage: `url(${service.image})` }
    : { ...S.svcModalHero, ...S.svcModalHeroPlaceholder };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.svcModal} onClick={e => e.stopPropagation()}>
        <div style={heroStyle}>
          <button style={S.svcModalClose} onClick={onClose} aria-label="Close">✕</button>
          <div style={S.svcModalHeroTitle}>{service.name}</div>
        </div>
        <div style={S.svcModalBody}>
          <div style={S.svcModalLeft}>
            <div style={S.bodyLabel}>Short Description</div>
            <p style={S.bodyText}>{service.shortDesc}</p>
            <div style={S.bodyLabel}>Detailed Description</div>
            <p style={S.bodyText}>{service.longDesc}</p>
          </div>
          <div style={S.svcModalRight}>
            <div>
              <div style={S.metaLabel}>Your Status</div>
              {service.owned
                ? <span style={S.statusPillOwned}>✓ Owned{service.ownedSince ? ` since ${service.ownedSince}` : ''}</span>
                : <span style={S.statusPillNotOwned}>○ Not Purchased</span>}
            </div>
            <div>
              <div style={S.metaLabel}>Requires Payment to Activate</div>
              <span style={{ ...S.flagChip, ...(service.requiresPayment ? S.flagChipYes : S.flagChipNo) }}>
                {service.requiresPayment ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <div style={S.metaLabel}>Requires Bank Account</div>
              <span style={{ ...S.flagChip, ...(service.requiresBankAccount ? S.flagChipYes : S.flagChipNo) }}>
                {service.requiresBankAccount ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <div style={S.metaLabel}>Pricing Model</div>
              <div style={S.priceBig}>{service.price} <span style={S.priceUnit}>{service.priceUnit}</span></div>
            </div>
          </div>
        </div>
        <div style={S.svcModalFooter}>
          <div style={S.svcModalFooterNote}>
            {service.owned
              ? 'Already on your account. To use it on a specific unit, add it from that unit’s page.'
              : inCart
              ? 'This is in your cart — open the Cart to review and confirm the purchase.'
              : 'Adds this to your cart. Nothing is purchased until you confirm from the Cart — you’ll choose which units it applies to separately, from each unit’s page.'}
          </div>
          {!service.owned && (
            <button
              style={inCart ? { ...S.btnPrimary, ...S.svcBtnInCart } : S.btnPrimary}
              disabled={inCart}
              onClick={() => onAddToCart(service)}
            >
              {inCart ? '✓ In Cart' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Listing Promotion "Explore Plans" catalog modal (Phase 4, Session 49) ────
// My Services → Listing Promotion → "Explore Plans" — the pre-purchase
// browsing step described in AccountSettings_MyServices_FigmaReview.md §3a/§5:
// an "advertisement" pop-up of every eligible ListingPromotionPlan, "Starting
// at $xx" already shown on the card before this even opens. Soft persona+
// market filter only (GET .../catalog/?country=) — no specific listing yet,
// so no portfolio_units check here; that re-runs later, for real, the moment
// this purchased entitlement is actually applied to a listing at publish time
// (see ListingStep3_Promote.jsx/ListingStep4_Publish.jsx).
function PromotionCatalogModal({ plans, loading, error, purchasingId, onClose, onPurchase, onViewDetails }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.promoModalV2} onClick={e => e.stopPropagation()}>
        <div style={S.promoModalV2Head}>
          <div>
            <h3 style={S.modalH3}>Explore Listing Promotion Plans</h3>
            <p style={{ ...S.modalSub, marginTop: 4 }}>Buy a plan now — reuse it on any eligible listing later at no extra cost ("Already Paid").</p>
          </div>
          <button style={S.promoModalV2Close} onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div style={S.promoModalV2Body}>
          {loading && <div style={{ fontSize: 12.5, color: C.txtMuted, padding: '16px 0' }}>Loading plans…</div>}
          {!loading && error && <div style={S.emptyState}><p style={S.emptyP}>{error}</p></div>}
          {!loading && !error && plans.length === 0 && (
            <div style={S.emptyState}><p style={S.emptyP}>No Listing Promotion plans are currently eligible for your account/market.</p></div>
          )}

          {!loading && !error && plans.length > 0 && (
            <div style={S.promoCatGrid}>
              {plans.map((plan, i) => {
                const priceValue = Number(plan.price) || 0;
                const visual = promoVisualFor(i);
                return (
                  <div key={plan.id} style={S.promoCatCard}>
                    <div style={S.promoCatImgWrap(visual.bg)}>
                      <i className={`ti ${visual.icon}`} style={S.promoCatImgIcon} aria-hidden="true" />
                      {plan.is_default && <span style={S.promoCatDefaultTag}>Most Popular</span>}
                      <span style={S.promoCatSampleTag}>Sample visual</span>
                    </div>
                    <div style={S.promoCatBody}>
                      <div style={S.promoCatName}>
                        {plan.name}{plan.tag && <span style={{ ...S.pillDefault, marginLeft: 8 }}>{plan.tag}</span>}
                      </div>
                      <p style={S.promoCatDesc}>{plan.short_description}</p>
                      <div style={S.promoCatPriceRow}>
                        <span style={S.promoCatPrice}>{priceValue === 0 ? 'Free' : `$${priceValue.toFixed(2)}`}</span>
                        <span style={S.promoCatDuration}>{plan.duration_days}-day validity</span>
                      </div>
                      <button style={S.promoCatDetailsBtn} onClick={() => onViewDetails(plan)}>Details</button>
                      <button
                        style={{ ...S.svcBtn, ...S.svcBtnBuy }}
                        disabled={!!purchasingId}
                        onClick={() => onPurchase(plan.id)}
                      >
                        {purchasingId === plan.id ? 'Purchasing…' : 'Select Plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Second pop-up (Session 50, point 4) — opened from a catalog card's
// "Details" button. Every field here is real ListingPromotionPlanSerializer
// data (name/short_description/tag/price/duration_days/features/fine_print);
// only the hero visual reuses the same generated sample as the catalog card.
function PlanDetailModal({ plan, visual, purchasing, onClose, onPurchase }) {
  if (!plan) return null;
  const priceValue = Number(plan.price) || 0;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.planDetailModal} onClick={e => e.stopPropagation()}>
        <div style={S.planDetailHero(visual.bg)}>
          <button style={S.planDetailClose} onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
          <i className={`ti ${visual.icon}`} style={S.planDetailIcon} aria-hidden="true" />
          <div style={S.planDetailName}>{plan.name}</div>
          {plan.tag && <span style={S.planDetailTag}>{plan.tag}</span>}
        </div>
        <div style={S.planDetailBody}>
          <p style={S.planDetailDesc}>{plan.short_description}</p>
          {(plan.features || []).map((f, i) => (
            <div key={i} style={S.planDetailFeatureRow}>
              <i className="ti ti-check" style={{ color: C.green, marginTop: 2 }} aria-hidden="true" />
              <span>{f}</span>
            </div>
          ))}
          {plan.fine_print && <div style={S.planDetailFinePrint}>{plan.fine_print}</div>}
        </div>
        <div style={S.planDetailFooter}>
          <div>
            <div style={S.planDetailPrice}>{priceValue === 0 ? 'Free' : `$${priceValue.toFixed(2)}`}</div>
            <div style={S.planDetailPriceSub}>Valid {plan.duration_days} days from purchase</div>
          </div>
          <button
            style={S.btnPrimary}
            disabled={!!purchasing}
            onClick={() => onPurchase(plan.id)}
          >
            {purchasing ? 'Purchasing…' : 'Select Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Session 51 — horizontal card-row navigation (reviewer's Oct 3 ask: "left
// and right arrows for horizontal navigation across the sections Included
// with Your Plan, Add-On's and More From UrbanNest"). One small hook,
// reused for all three sections, tracks whether a card row is scrolled to
// its start/end so the matching arrow can dim out — reading the real DOM
// scroll position rather than a separate page-counter that could drift
// out of sync with what's actually on screen.
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' | 'subscription' | 'services' | 'transactions'
  const [currentUser, setCurrentUser] = useState(null);

  // Bank Accounts tab — wired to the real OwnerBankAccount model this round
  // (GET/POST /landlord/bank-accounts/, PATCH/DELETE
  // /landlord/bank-accounts/<id>/). Same loading/error convention as
  // Services' fetchCatalog below.
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(true);
  const [bankAccountsError, setBankAccountsError] = useState(null);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaveError, setBankSaveError] = useState(null);
  const [bankModal, setBankModal] = useState(null); // null | 'add' | account object (edit)

  // Round 9 (Figma match): which account's details show in the right-hand
  // Account Details panel. Distinct from is_default (which controls where
  // payouts actually route) — this is pure UI state, not persisted, and
  // resets to the default account whenever it points at an account that no
  // longer exists (initial load, or the selected account gets deleted).
  const [selectedBankId, setSelectedBankId] = useState(null);
  React.useEffect(() => {
    if (bankAccounts.length === 0) { setSelectedBankId(null); return; }
    if (!bankAccounts.some(a => a.id === selectedBankId)) {
      const fallback = bankAccounts.find(a => a.is_default) || bankAccounts[0];
      setSelectedBankId(fallback.id);
    }
  }, [bankAccounts, selectedBankId]);

  // Round 9 — the Bank Accounts content block's left edge is measured to
  // line up with the "Bank Accounts" tab label itself (not the page's
  // standard left padding, which is where the tab strip and "Settings"
  // title sit). Measured live off the DOM rather than a hardcoded pixel
  // value, so it won't drift if the tab label, font, or earlier tabs ever
  // change.
  const bankTabRef = React.useRef(null);
  const tabstripRef = React.useRef(null);
  const [bankRowOffset, setBankRowOffset] = useState(0);
  React.useLayoutEffect(() => {
    if (activeTab !== 'bank') return;
    function measure() {
      if (!bankTabRef.current || !tabstripRef.current) return;
      const tabRect = bankTabRef.current.getBoundingClientRect();
      const stripRect = tabstripRef.current.getBoundingClientRect();
      setBankRowOffset(Math.max(0, tabRect.left - stripRect.left));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeTab, bankAccountsLoading, bankAccountsError, bankAccounts.length]);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [openService, setOpenService] = useState(null);
  // Second pop-up from the Listing Promotion catalog modal's "Details"
  // button (Session 50, point 4) — a ListingPromotionPlan object, or null.
  const [openPlanDetail, setOpenPlanDetail] = useState(null);

  // ─── TRANSACTIONS (Session 52) ──────────────────────────────────────────
  const [txQuery, setTxQuery] = useState('');
  const [txService, setTxService] = useState('ALL');
  const [txRange, setTxRange] = useState('30');
  const [txSelected, setTxSelected] = useState(TRANSACTIONS[0].id);
  const [txHoverId, setTxHoverId] = useState(null);
  // Computed every render rather than memoized — 4 rows, the cost is
  // negligible, and useMemo isn't already imported anywhere on this page.
  const txFilteredRows = TRANSACTIONS.filter(t => {
    const q = txQuery.trim().toLowerCase();
    if (q && !(t.desc.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))) return false;
    if (txService !== 'ALL' && t.service !== txService) return false;
    const days = (TX_ANCHOR_DATE - new Date(t.date)) / 86400000;
    if (days > TX_RANGE_DAYS[txRange]) return false;
    return true;
  });
  const txDetail = TRANSACTIONS.find(t => t.id === txSelected) || null;
  // Real, client-side CSV export of whatever's currently filtered/visible —
  // no backend needed for this one, unlike the PDF receipt below.
  const handleTxExportCsv = () => {
    const header = ['Date', 'Transaction', 'Service', 'Reference', 'Amount', 'Status'];
    const rows = txFilteredRows.map(t => [t.dateLabel, t.label, t.service, t.id, t.amount.toFixed(2), t.status]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbannest-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── SUBSCRIPTION & BILLING (Phase 3, Session 49) ──────────────────────────
  // `country` isn't collected anywhere on this page today (Landlord has one
  // UNAccount per country, §1 of the review doc) — defaulting to the
  // currentUser's own auto-detected country (CustomUser.country, the same
  // field DetectLocationView sets) is a known simplification for a landlord
  // genuinely registered in more than one country, same posture already
  // flagged in LandlordAccountServicesView's own docstring for "which
  // profile a purchase attaches to." Revisit with a real country selector
  // (§4 item 8 of the review doc) once that's built.
  const country = currentUser?.country || 'US';

  const [subPlans, setSubPlans] = useState([]);
  const [subscription, setSubscription] = useState(null); // { subscription, included_services, addons } | null
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);

  const fetchSubscriptionData = React.useCallback(() => {
    const token = localStorage.getItem('access_token');
    setSubError(null);
    return Promise.all([
      fetch(`${API_BASE}/landlord/plans/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch(`${API_BASE}/landlord/subscription/?country=${encodeURIComponent(country)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
    ])
      .then(([plans, sub]) => {
        setSubPlans(plans || []);
        setSubscription(sub.subscription ? sub : null);
      })
      .catch(() => setSubError('Could not load your subscription. Please refresh the page.'))
      .finally(() => setSubLoading(false));
  }, [country]);

  const handleSubscribe = (planId) => {
    const token = localStorage.getItem('access_token');
    setSubscribingPlanId(planId);
    fetch(`${API_BASE}/landlord/subscription/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, plan_id: planId }),
    })
      .then(r => { if (!r.ok) return r.json().then(b => { throw new Error(b.detail || `Request failed (${r.status})`); }); })
      .then(() => Promise.all([fetchSubscriptionData(), fetchCatalogRef.current && fetchCatalogRef.current()]))
      .catch(e => setSubError(e.message || 'Could not subscribe to this plan.'))
      .finally(() => setSubscribingPlanId(null));
  };

  // Services tab's fetchCatalog is declared below (needs to stay a stable
  // callback for its own effect), but handleSubscribe above needs to refresh
  // it too once a new subscription changes what's INCLUDED/ADDON — a ref
  // avoids a declaration-order/circular-dependency problem between the two
  // callbacks without restructuring either one.
  const fetchCatalogRef = React.useRef(null);

  React.useEffect(() => { fetchSubscriptionData(); }, [fetchSubscriptionData]);

  // ─── LISTING PROMOTION — standing entitlement (Phase 4, Session 49) ───────
  const [promoSubs, setPromoSubs] = useState([]);
  const [promoCatalogOpen, setPromoCatalogOpen] = useState(false);
  const [promoCatalog, setPromoCatalog] = useState([]);
  const [promoCatalogLoading, setPromoCatalogLoading] = useState(false);
  const [promoCatalogError, setPromoCatalogError] = useState(null);
  const [promoPurchasingId, setPromoPurchasingId] = useState(null);

  const fetchPromoSubs = React.useCallback(() => {
    getPromotionSubscriptions().then(setPromoSubs).catch(() => {});
  }, []);
  React.useEffect(() => { fetchPromoSubs(); }, [fetchPromoSubs]);

  // Quiet prefetch so "Starting at $xx" (the advertisement framing, §3b of
  // the review doc) is already populated the first time My Services renders
  // — not only after the user clicks Explore. Silently ignored on failure;
  // openPromoCatalog() below re-fetches with real loading/error UI anyway.
  React.useEffect(() => {
    getPromotionSubscriptionCatalog(country).then(setPromoCatalog).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePromoSub = promoSubs.find(s => s.is_active) || null;
  const minPromoPrice = promoCatalog.length
    ? Math.min(...promoCatalog.map(p => Number(p.price) || 0))
    : null;

  const openPromoCatalog = () => {
    setPromoCatalogOpen(true);
    setPromoCatalogLoading(true);
    setPromoCatalogError(null);
    getPromotionSubscriptionCatalog(country)
      .then(setPromoCatalog)
      .catch(e => setPromoCatalogError(e.message || 'Could not load Listing Promotion plans.'))
      .finally(() => setPromoCatalogLoading(false));
  };

  const handlePurchasePromoPlan = (planId) => {
    setPromoPurchasingId(planId);
    purchasePromotionSubscription(country, planId)
      .then(() => { fetchPromoSubs(); setPromoCatalogOpen(false); })
      .catch(e => setPromoCatalogError(e.message || 'Could not complete this purchase.'))
      .finally(() => setPromoPurchasingId(null));
  };

  // Fetches the real catalog (GET /landlord/services/catalog/) — each entry
  // already carries `owned`/`owned_since` from the backend, so no second
  // round-trip against LandlordAccountService is needed here. Reused after a
  // purchase confirms, so "owned" reflects the database rather than a local
  // guess.
  const fetchCatalog = React.useCallback(() => {
    const token = localStorage.getItem('access_token');
    setServicesError(null);
    return fetch(`${API_BASE}/landlord/services/catalog/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setServices((j.services || []).map(normalizeService)))
      .catch(() => setServicesError('Could not load services. Please refresh the page.'))
      .finally(() => setServicesLoading(false));
  }, []);

  React.useEffect(() => { fetchCatalog(); }, [fetchCatalog]);
  React.useEffect(() => { fetchCatalogRef.current = fetchCatalog; }, [fetchCatalog]);

  const fetchBankAccounts = React.useCallback(() => {
    const token = localStorage.getItem('access_token');
    setBankAccountsError(null);
    return fetch(`${API_BASE}/landlord/bank-accounts/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setBankAccounts(Array.isArray(j) ? j : []))
      .catch(() => setBankAccountsError('Could not load your bank accounts. Please refresh the page.'))
      .finally(() => setBankAccountsLoading(false));
  }, []);

  React.useEffect(() => { fetchBankAccounts(); }, [fetchBankAccounts]);

  // ─── PAYMENT CART INTEGRATION ─────────────────────────────────────────────
  // Cart state/UI live in src/pages/Payment/ (PaymentCartContext, -Trigger,
  // -Modal) so any future module can reuse the same checkout flow. This page
  // only supplies: (1) how a service becomes a cart line item, and (2) what
  // "Confirm & Pay" actually does once the cart confirms a purchase — the
  // cart module itself has no idea what a "service" is.
  const { addItem, isInCart } = usePaymentCart();
  const [cartOpen, setCartOpen] = useState(false);

  // Only a flat-fee service actually costs anything the moment it's bought —
  // a per-unit/per-property service (SVC_001/§4.2: buying only creates the
  // account-level entitlement) charges $0 today and only bills once it's
  // assigned to a unit. The cart itself doesn't know this rule — it just sums
  // whatever amountDueToday each item is given (see PaymentCartContext.jsx).
  const serviceToCartItem = service => {
    const numericPrice = Number((service.price || '').replace(/[^0-9.]/g, '')) || 0;
    const isFlatFee = /flat fee/i.test(service.priceUnit || '');
    return {
      id: service.id,
      name: service.name,
      subtitle: service.tag,
      icon: service.icon,
      priceLabel: `${service.price} ${service.priceUnit}`,
      amountDueToday: isFlatFee ? numericPrice : 0,
      moduleKey: 'landlord-service',
      meta: service,
    };
  };

  const addToCart = service => {
    addItem(serviceToCartItem(service));
    setOpenService(null);
  };

  // Called by PaymentCartModal's "Confirm & Pay", once, with only the items
  // the landlord left checked. No real payment gateway exists yet — the mock
  // checkout screen (see PaymentCartModal's footer note) still stands in for
  // that, but the entitlement it grants is now real: this POSTs to
  // LandlordAccountService (SVC-1) and, on success, re-fetches the catalog so
  // "owned" reflects the database. Throws on failure so PaymentCartModal can
  // show the error and leave the item in the cart to retry, instead of
  // silently completing as if it purchased.
  const handleConfirmPurchase = async checkedItems => {
    const serviceIds = checkedItems
      .filter(i => i.moduleKey === 'landlord-service')
      .map(i => i.id);
    if (serviceIds.length === 0) return;

    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE}/landlord/account/services/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_ids: serviceIds }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Could not complete this purchase. Please try again.');
    }
    await Promise.all([fetchCatalog(), fetchSubscriptionData()]);
  };

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setCurrentUser(j.user || j))
      .catch(() => {});
  }, []);

  const userLabel = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email
    : '';

  // Real portfolio size (properties/units/tenants) for "Allocated Capacity"
  // — the one dashboard-sourced metric kept on this tab, since plan-unit-
  // usage is genuinely a billing/entitlement question, not an operational
  // one. (A round-4 version of this fetch also pulled `kpis` and
  // `monthly_rent_chart` for "Portfolio Health"/"Portfolio Growth" — both
  // were occupancy/leasing/maintenance/rent-collection metrics that belong
  // on the separate Landlord Dashboard page, not here, so that fetch was
  // trimmed back to just `portfolio` this round.)
  const [portfolio, setPortfolio] = useState(null);
  // Real LandlordProfile address (street_address_1/2, landmark, city, state,
  // zip_code, country) — added to this same dashboard response this round
  // (landlord.address) specifically so "Commercial Entity Information" below
  // can show the account user's actual permanent address instead of a
  // fabricated one. No new endpoint/fetch needed — this page already calls
  // /landlord/dashboard/ for `portfolio`; `landlord.address` was previously
  // computed there (for landlord_name) but never returned to the FE.
  const [landlordAddress, setLandlordAddress] = useState(null);
  // My Profile tab (this round) — same dashboard response now also carries
  // first_name/last_name/phone/profile_photo_url/account_number/
  // registration_status (see landlord/views.py, LandlordDashboardView).
  // `profileLoaded` gates the Personal Information form's initial fill —
  // without it, a later re-fetch (there isn't one today, but the effect
  // below is written defensively) would stomp an in-progress edit.
  const [profileSource, setProfileSource] = useState({ firstName: '', lastName: '', phone: '', email: '', photoUrl: null, accountNumber: null, registrationStatus: null });
  const [profileLoaded, setProfileLoaded] = useState(false);
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/dashboard/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => {
        setPortfolio(j.portfolio || null);
        setLandlordAddress(j.landlord?.address || null);
        setProfileSource({
          firstName: j.landlord?.first_name || '',
          lastName:  j.landlord?.last_name || '',
          phone:     j.landlord?.phone || '',
          email:     j.landlord?.email || '',
          photoUrl:  j.landlord?.profile_photo_url || null,
          accountNumber: j.landlord?.account_number || null,
          registrationStatus: j.landlord?.registration_status || null,
        });
        setProfileLoaded(true);
      })
      .catch(() => {});
  }, []);

  // Personal Information form — a separate editable draft, only ever
  // initialized FROM profileSource once (the ref guard below), so typing
  // in a field is never overwritten by a background re-fetch.
  const [profileDraft, setProfileDraft] = useState({ firstName: '', lastName: '', phone: '' });
  const profileDraftInit = React.useRef(false);
  React.useEffect(() => {
    if (profileLoaded && !profileDraftInit.current) {
      setProfileDraft({ firstName: profileSource.firstName, lastName: profileSource.lastName, phone: profileSource.phone });
      profileDraftInit.current = true;
    }
  }, [profileLoaded, profileSource]);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState(null); // { ok: bool, text }
  const profileDirty = profileLoaded && (
    profileDraft.firstName !== profileSource.firstName ||
    profileDraft.lastName  !== profileSource.lastName  ||
    profileDraft.phone     !== profileSource.phone
  );
  const discardProfileChanges = () => {
    setProfileDraft({ firstName: profileSource.firstName, lastName: profileSource.lastName, phone: profileSource.phone });
    setProfileSaveMsg(null);
  };
  const saveProfileChanges = () => {
    const token = localStorage.getItem('access_token');
    setProfileSaving(true);
    setProfileSaveMsg(null);
    fetch(`${API_BASE}/landlord/profile/`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: profileDraft.firstName, last_name: profileDraft.lastName, phone: profileDraft.phone }),
    })
      .then(r => { if (!r.ok) return r.json().then(b => { throw new Error(b.detail || `Request failed (${r.status})`); }); return r.json(); })
      .then(j => {
        setProfileSource(prev => ({ ...prev, firstName: j.first_name ?? profileDraft.firstName, lastName: j.last_name ?? profileDraft.lastName, phone: j.phone ?? profileDraft.phone }));
        setProfileSaveMsg({ ok: true, text: 'Saved.' });
      })
      .catch(e => setProfileSaveMsg({ ok: false, text: e.message || 'Could not save changes.' }))
      .finally(() => setProfileSaving(false));
  };

  // Registry Verification pill — a real, derived label from the same
  // LandlordProfile.registration_status this account's Phase 1 work already
  // tracks (DRAFT/SUBMITTED/APPROVED/REJECTED), not a fabricated status.
  const profileVerifyMeta = (status) => {
    if (status === 'APPROVED')  return { tone: 'green', label: 'Active — Verified Portfolio' };
    if (status === 'SUBMITTED') return { tone: 'amber', label: 'Pending Verification' };
    if (status === 'REJECTED') return { tone: 'red',   label: 'Verification Rejected' };
    return { tone: 'muted', label: 'Not Yet Submitted' };
  };

  // Scroll target for "Upgrade Plan"/"Change Plan"/"Explore Higher-Tier Plans" —
  // all three are real actions (they jump to the real Available Plans catalog
  // below, where subscribing actually happens), not dead buttons.
  const availablePlansRef = React.useRef(null);

  const ownedServices = services.filter(s => s.owned);
  const availableServices = services.filter(s => !s.owned);

  // Real counts only — no fabricated usage/quota numbers. includedCount/
  // addonCount come straight from the subscription endpoint's own response
  // (subscription.included_services / .addons), not derived or guessed.
  const includedCount = subscription?.included_services?.length || 0;
  const addonCount = subscription?.addons?.length || 0;
  const buyGateClosed = !subLoading && !subscription;

  // Session 50, points 2/3 — the Services tab's old unified "Provisioned
  // Suite" master list (owned services + Listing Promotion row + available
  // services, one flat list) is replaced by two explicit, plan-scoped
  // sections, per the reviewer's restructure. Both filter the same real
  // `services` catalog (already fetched/normalized, already carrying real
  // `owned` flags) against the CURRENT plan's own real UNPlanService
  // assignments — not a guess: `currentPlanObj` comes from `subPlans`
  // (GET /api/landlord/plans/, UNPlanListSerializer), which already returns
  // `included_services`/`addon_services` per plan, the same fields the
  // Subscription & Billing tab's Current Plan card reads.
  const currentPlanObj = subPlans.find(p => p.id === subscription?.subscription?.plan);
  const includedPlanServiceIds = new Set((currentPlanObj?.included_services || []).map(ps => ps.service_id));
  const addonPlanServiceIds = new Set((currentPlanObj?.addon_services || []).map(ps => ps.service_id));
  // "Included with Your Plan" (point 2, no Buy Service button) — always
  // owned, since inclusion in the plan IS the entitlement.
  const includedPlanServices = services.filter(s => includedPlanServiceIds.has(s.id));
  // "Add-Ons for Your Plan" (point 3) — every ADDON-type service on the
  // current plan, owned or not: a not-yet-purchased one gets "Buy Service"
  // (the literal ask), an already-purchased one gets an "✓ Added" badge
  // instead of just disappearing — kept visible rather than silently
  // dropped, since the old master list used to show purchased add-ons too.
  const planAddonServices = services.filter(s => addonPlanServiceIds.has(s.id));
  // Sample fallback, reviewer's Oct 3 instruction: "if data is there show it,
  // else show sample data." Real stat tiles/section pills above keep using
  // the real (possibly zero) counts — only the card grid itself swaps to the
  // watermarked sample set when the real list is empty, so the page never
  // renders a blank dashed box for a plan with no included/add-on services.
  const displayIncludedServices = includedPlanServices.length > 0 ? includedPlanServices : SAMPLE_INCLUDED_SERVICES;
  const displayAddonServices = planAddonServices.length > 0 ? planAddonServices : SAMPLE_ADDON_SERVICES;
  // Horizontal scroll + arrow nav (Oct 3 ask) — one ref + edge-state pair
  // per section, re-checked whenever that section's card count changes
  // (real data loading in, or falling back to/out of the sample set).
  // "Included with Your Plan" briefly moved to a plain wrapping 3-column
  // grid (reviewer's "3 X 3 approach" ask), then back to this same
  // scroll-row + arrow-nav pattern this round, per the reviewer's explicit
  // "implement it as you have implemented the Add-On section" ask — so its
  // ref/edge-state pair is back too.
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
  // "Active Campaigns" stat tile (point 1, confirmed with the reviewer) —
  // count of this account's active ListingPromotionSubscription rows.
  const activeCampaignsCount = promoSubs.filter(s => s.is_active).length;

  // Bank Accounts CRUD — wired to OwnerBankAccount (SVC-6) this round.
  // "Set as default" updates optimistically (feels instant for a toggle
  // that's unlikely to fail) and reverts + surfaces an error if the PATCH
  // doesn't succeed; Add/Edit/Delete wait for the real response, same
  // pattern as handleConfirmPurchase elsewhere on this page.
  const setDefaultAccount = async id => {
    const token = localStorage.getItem('access_token');
    const prevAccounts = bankAccounts;
    setBankAccounts(cur => cur.map(a => ({ ...a, is_default: a.id === id })));
    try {
      const res = await fetch(`${API_BASE}/landlord/bank-accounts/${id}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      if (!res.ok) throw new Error();
      fetchBankAccounts();
    } catch {
      setBankAccounts(prevAccounts);
      setBankAccountsError('Could not update your default bank account. Please try again.');
    }
  };

  const saveBankAccount = async form => {
    setBankSaving(true);
    setBankSaveError(null);
    const token = localStorage.getItem('access_token');
    const isEdit = bankModal && bankModal !== 'add' && bankModal.id;
    const payload = {
      bank_name: form.bank_name,
      account_number: form.account_number,
      routing_number: form.routing_number,
      account_type: form.account_type,
      is_default: form.is_default,
    };
    try {
      const res = await fetch(
        isEdit ? `${API_BASE}/landlord/bank-accounts/${bankModal.id}/` : `${API_BASE}/landlord/bank-accounts/`,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const firstFieldError = Object.values(body).find(v => Array.isArray(v) && v.length)?.[0];
        throw new Error(body.detail || firstFieldError || 'Could not save this bank account. Please check the details and try again.');
      }
      await fetchBankAccounts();
      setBankModal(null);
    } catch (err) {
      setBankSaveError(err.message);
    } finally {
      setBankSaving(false);
    }
  };

  const deleteBankAccount = async id => {
    if (!window.confirm("Remove this bank account? This can't be undone.")) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/landlord/bank-accounts/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error();
      fetchBankAccounts();
    } catch {
      setBankAccountsError('Could not remove this bank account. Please try again.');
    }
  };

  return (
    <div style={S.shell}>
      <NavF activePage="settings" />

      <div style={S.main}>
        <header style={S.topbar}>
          <div style={S.topTitle}>UrbanNest Landlord</div>
          <div style={S.topRight}>
            <button style={S.iconBtn} aria-label="Notifications"><i className="ti ti-bell" aria-hidden="true" /></button>
            <button style={S.iconBtn} aria-label="Help"><i className="ti ti-help-circle" aria-hidden="true" /></button>
            <div style={S.avatar}>{initials(userLabel || 'L')}</div>
          </div>
        </header>

        <main style={S.content}>
          <div style={S.pageHdrRow}>
            <div>
              <h1 style={S.pageTitle}>Settings</h1>
              <p style={S.pageSub}>Manage your bank accounts, subscription, and platform services</p>
            </div>
            <PaymentCartTrigger
              onClick={() => setCartOpen(true)}
              theme={{ txtPrimary: C.txtPrimary, cardBdr: C.cardBdr, font: F.sans }}
            />
          </div>

          <div style={S.tabstrip} ref={tabstripRef}>
            <div style={S.tab(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>My Profile</div>
            <div style={S.tab(activeTab === 'bank')} onClick={() => setActiveTab('bank')} ref={bankTabRef}>Bank Accounts</div>
            <div style={S.tab(activeTab === 'subscription')} onClick={() => setActiveTab('subscription')}>Subscription & Billing</div>
            <div style={S.tab(activeTab === 'services')} onClick={() => setActiveTab('services')}>Services</div>
            <div style={S.tab(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}>Transactions</div>
            <div style={S.tab(activeTab === 'integrations')} onClick={() => setActiveTab('integrations')}>Integrations</div>
          </div>

          {/* ─── MY PROFILE TAB (new this round) ───────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={S.profLayout}>
              <div>
                {/* Personal Information */}
                <div style={S.figmaCard}>
                  <div style={S.figmaCardHdr}>
                    <div>
                      <div style={S.figmaCardTitle}>Personal Information</div>
                      <div style={S.figmaCardSub}>Update your primary identity and contact details.</div>
                    </div>
                  </div>
                  <div style={S.figmaDivider} />

                  <div style={S.profAvatarRow}>
                    {profileSource.photoUrl
                      ? <img src={profileSource.photoUrl} alt="" style={S.profAvatarCircle} />
                      : <div style={S.profAvatarCircle}>{initials(`${profileDraft.firstName} ${profileDraft.lastName}`.trim() || userLabel || 'L')}</div>}
                    <div style={S.profAvatarBtnCol}>
                      <div style={S.profAvatarBtnRow}>
                        <button style={{ ...S.btnPrimary, cursor: 'not-allowed', opacity: 0.7 }} disabled title="Avatar upload isn't wired up yet">
                          <i className="ti ti-upload" aria-hidden="true" style={{ marginRight: 6 }} />Change Avatar
                        </button>
                        <button style={S.profRemoveLink} disabled title="Avatar upload isn't wired up yet">Remove photo</button>
                      </div>
                      <div style={S.profAvatarHint}>Accepted files: PNG, JPG, or WEBP up to 5MB. 400x400px recommended.</div>
                    </div>
                  </div>

                  <div style={S.fieldRow}>
                    <div style={{ ...S.field, flex: 1 }}>
                      <label style={S.fieldLbl}>First Name</label>
                      <input style={S.fieldInput} type="text" value={profileDraft.firstName} onChange={e => setProfileDraft(d => ({ ...d, firstName: e.target.value }))} />
                    </div>
                    <div style={{ ...S.field, flex: 1 }}>
                      <label style={S.fieldLbl}>Last Name</label>
                      <input style={S.fieldInput} type="text" value={profileDraft.lastName} onChange={e => setProfileDraft(d => ({ ...d, lastName: e.target.value }))} />
                    </div>
                  </div>
                  <div style={S.fieldRow}>
                    <div style={{ ...S.field, flex: 1 }}>
                      <label style={S.fieldLbl}>Email Address <span style={{ color: C.greenDark, fontWeight: 700, fontSize: 10.5 }}>✓ Verified Internal</span></label>
                      <input style={{ ...S.fieldInput, background: C.stdBg, color: C.txtMuted }} type="text" value={profileSource.email} disabled title="Sign-in email changes aren't available from this form yet" />
                    </div>
                    <div style={{ ...S.field, flex: 1 }}>
                      <label style={S.fieldLbl}>Phone Number</label>
                      <input style={S.fieldInput} type="text" value={profileDraft.phone} onChange={e => setProfileDraft(d => ({ ...d, phone: e.target.value }))} />
                    </div>
                  </div>

                  <div style={S.profFormActions}>
                    {profileSaveMsg && <span style={S.profSaveMsg(profileSaveMsg.ok)}>{profileSaveMsg.text}</span>}
                    <button style={S.profDiscardBtn} onClick={discardProfileChanges} disabled={!profileDirty || profileSaving}>Discard</button>
                    <button
                      style={{ ...S.btnPrimary, opacity: (!profileDirty || profileSaving) ? 0.6 : 1, cursor: (!profileDirty || profileSaving) ? 'default' : 'pointer' }}
                      onClick={saveProfileChanges}
                      disabled={!profileDirty || profileSaving}
                    >
                      {profileSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {/* Account Persona & Organization — gradient added per
                    reviewer's Oct 4 "try it" ask, originally scoped to this
                    card plus Permanent Address and Security & Credentials;
                    Permanent Address's gradient was removed again on
                    follow-up, so now just this card and Security &
                    Credentials carry it. Uses the same soft two-tone
                    diagonal already established elsewhere on this page for
                    full-card bodies (curPlanCardBody, acCard, bbCard,
                    lpCard, txDetailCard) rather than a new formula, just
                    with its own light-token pairing. Inline override on
                    figmaCard (shared across 7 call sites on this page) so
                    only these 2 pick up the tint; the base style is
                    untouched. */}
                <div style={{ ...S.figmaCard, background: `linear-gradient(160deg, #ffffff 0%, ${C.blueLight}45 55%, ${C.greenLight}45 100%)` }}>
                  <div style={S.figmaCardHdr}>
                    <div>
                      <div style={S.figmaCardTitle}>Account Persona</div>
                      <div style={S.figmaCardSub}>This portal's persona is fixed — Landlord accounts don't switch between tiers here.</div>
                    </div>
                  </div>
                  <div style={S.figmaDivider} />

                  <div style={S.profPersonaGrid}>
                    <div style={S.profPersonaTile('active')}>
                      <span><i className="ti ti-home" aria-hidden="true" style={{ marginRight: 6 }} />Landlord</span>
                      <span style={S.profPersonaActivePill}>Active</span>
                    </div>
                    <div style={S.profPersonaTile('locked')} title="Not available from the Landlord portal">
                      <span><i className="ti ti-user" aria-hidden="true" style={{ marginRight: 6 }} />Independent PM</span>
                      <i className="ti ti-lock" aria-hidden="true" />
                    </div>
                    <div style={S.profPersonaTile('locked')} title="Switching portals isn't available from here yet">
                      <span><i className="ti ti-building" aria-hidden="true" style={{ marginRight: 6 }} />Organizational PM</span>
                      <i className="ti ti-external-link" aria-hidden="true" />
                    </div>
                  </div>

                  <div style={S.fieldRow}>
                    <div style={{ ...S.field, flex: 1 }}>
                      <label style={S.fieldLbl}>Account Identifier</label>
                      <div style={S.profIdentifierRow}>
                        <span style={S.pmEntityRowValue}>{profileSource.accountNumber || '—'}</span>
                        {profileSource.accountNumber && (
                          <button
                            style={S.iconBtnSm}
                            onClick={() => navigator.clipboard && navigator.clipboard.writeText(profileSource.accountNumber)}
                            title="Copy account identifier"
                            aria-label="Copy account identifier"
                          >
                            <i className="ti ti-copy" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ ...S.field, flex: 1 }}>
                      <label style={S.fieldLbl}>Registry Verification</label>
                      <div style={{ marginTop: 4 }}>
                        <span style={S.profVerifyPill(profileVerifyMeta(profileSource.registrationStatus).tone)}>
                          <i className="ti ti-circle-check" aria-hidden="true" />{profileVerifyMeta(profileSource.registrationStatus).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permanent Address — replaces the Figma's "Organization
                    Specifications" per this round's explicit ask: a Landlord
                    has no organization/license concept in this codebase (no
                    such fields on LandlordProfile) — a permanent address is
                    the real equivalent that does exist, and is already
                    fetched on this page (landlordAddress, reused as-is from
                    the Commercial Entity Information section on the
                    Subscription & Billing tab). Display-only — editing the
                    address isn't wired to a save flow this round. Had the
                    same gradient as Account Persona/Security & Credentials
                    for a round, removed again per reviewer's follow-up —
                    this card stays plain. */}
                <div style={S.figmaCard}>
                  <div style={S.figmaCardHdr}>
                    <div>
                      <div style={S.figmaCardTitle}>Permanent Address</div>
                      <div style={S.figmaCardSub}>Your real, on-file address — the same one used for Commercial Entity Information under Subscription & Billing.</div>
                    </div>
                  </div>
                  <div style={S.figmaDivider} />
                  {landlordAddress ? (
                    <div style={S.bankGrid}>
                      <div style={S.field}>
                        <label style={S.fieldLbl}>Street Address</label>
                        <input style={{ ...S.fieldInput, background: C.stdBg, color: C.txtMuted }} type="text" value={[landlordAddress.street_address_1, landlordAddress.street_address_2].filter(Boolean).join(', ') || '—'} disabled />
                      </div>
                      <div style={S.field}>
                        <label style={S.fieldLbl}>Landmark</label>
                        <input style={{ ...S.fieldInput, background: C.stdBg, color: C.txtMuted }} type="text" value={landlordAddress.landmark || '—'} disabled />
                      </div>
                      <div style={S.field}>
                        <label style={S.fieldLbl}>City / State</label>
                        <input style={{ ...S.fieldInput, background: C.stdBg, color: C.txtMuted }} type="text" value={[landlordAddress.city, landlordAddress.state].filter(Boolean).join(', ') || '—'} disabled />
                      </div>
                      <div style={S.field}>
                        <label style={S.fieldLbl}>ZIP / Country</label>
                        <input style={{ ...S.fieldInput, background: C.stdBg, color: C.txtMuted }} type="text" value={[landlordAddress.zip_code, landlordAddress.country].filter(Boolean).join(', ') || '—'} disabled />
                      </div>
                    </div>
                  ) : (
                    <div style={S.emptyState}>No address on file yet.</div>
                  )}
                </div>
              </div>

              <div>
                {/* Security & Credentials — entirely sample: no 2FA, session-
                    tracking, or password-change-timestamp model exists
                    anywhere in this codebase, so nothing here is live. Tagged
                    "Sample" rather than presented as real, and every action
                    stays disabled with a tooltip (ARCH_017), consistent with
                    this document's standing posture on unreal data/actions.
                    Gradient added per reviewer's Oct 4 "try it" ask — same
                    established two-tone formula, paired with amberLight
                    instead of green so this card reads distinctly from the
                    other two. */}
                <div style={{ ...S.figmaCard, background: `linear-gradient(160deg, #ffffff 0%, ${C.blueLight}45 55%, ${C.amberLight}45 100%)` }}>
                  <div style={S.figmaCardHdr}>
                    <div>
                      <div style={S.figmaCardTitle}>Security & Credentials</div>
                      <div style={S.figmaCardSub}>Authentication standards compliant with Institutional SOC-2 property protocols.</div>
                    </div>
                    <span style={S.profSampleTag}>Sample</span>
                  </div>
                  <div style={S.figmaDivider} />

                  <div style={S.profSecRow}>
                    <div>
                      <div style={S.profSecRowLabel}><i className="ti ti-key" aria-hidden="true" />Password</div>
                      <div style={S.profSecRowSub}>Change history isn't tracked yet</div>
                    </div>
                    <button style={S.profSecBtnGhost} disabled title="Password management isn't wired up yet">Update Password</button>
                  </div>
                  <div style={S.profSecRow}>
                    <div>
                      <div style={S.profSecRowLabel}><i className="ti ti-shield-lock" aria-hidden="true" />Two-Factor (2FA)</div>
                      <div style={S.profSecRowSub}>Not available on this account yet</div>
                    </div>
                    <button style={S.profSecBtnGhost} disabled title="2FA isn't wired up yet">Manage</button>
                  </div>

                  <div style={S.profSessionCard}>
                    <div style={S.profSessionTag}><i className="ti ti-device-laptop" aria-hidden="true" />Sample Session</div>
                    <div style={S.profSessionTitle}>Chrome on this device</div>
                    <div style={S.profSessionMeta}>Session/device tracking isn't built yet — this card is illustrative only.</div>
                    <button style={S.profSessionBtn} disabled title="Session management isn't wired up yet">Terminate All Other Sessions</button>
                  </div>
                </div>

                {/* Preferences — replaces the Portfolio Scope card from the
                    Figma per this round's explicit ask. None of these four
                    have a real per-user preference model in this codebase
                    (no timezone/language/date-format/currency fields on
                    LandlordProfile), so every dropdown is disabled and
                    pre-filled with the exact values given, rather than left
                    blank or guessed at. */}
                <div style={S.figmaCard}>
                  <div style={S.figmaCardHdr}>
                    <div>
                      <div style={S.figmaCardTitle}>Preferences</div>
                      <div style={S.figmaCardSub}>Display and formatting preferences for this account.</div>
                    </div>
                    <span style={S.profSampleTag}>Sample</span>
                  </div>
                  <div style={S.figmaDivider} />

                  <div style={S.field}>
                    <label style={S.fieldLbl}>Language</label>
                    <CustomDropdown options={PROF_LANGUAGE_OPTIONS} value="en-US" onChange={() => {}} placeholder="English" disabled />
                  </div>
                  <div style={S.field}>
                    <label style={S.fieldLbl}>Time Zone</label>
                    <CustomDropdown options={PROF_TIMEZONE_OPTIONS} value="America/Chicago" onChange={() => {}} placeholder="America/Chicago" disabled />
                  </div>
                  <div style={S.field}>
                    <label style={S.fieldLbl}>Date Format</label>
                    <CustomDropdown options={PROF_DATEFMT_OPTIONS} value="MM/DD/YYYY" onChange={() => {}} placeholder="MM/DD/YYYY" disabled />
                  </div>
                  <div style={{ ...S.field, marginBottom: 0 }}>
                    <label style={S.fieldLbl}>Currency</label>
                    <CustomDropdown options={PROF_CURRENCY_OPTIONS} value="USD" onChange={() => {}} placeholder="USD" disabled />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SUBSCRIPTION & BILLING TAB (Phase 3, Session 49) ─── */}
          {activeTab === 'subscription' && subLoading && (
            <div style={{ fontSize: 12.5, color: C.txtMuted, padding: '24px 0' }}>Loading your subscription…</div>
          )}
          {activeTab === 'subscription' && !subLoading && subError && (
            <div style={{ ...S.emptyState, marginBottom: 20 }}>
              <p style={S.emptyP}>{subError}</p>
              <button style={S.btnPrimary} onClick={fetchSubscriptionData}>Retry</button>
            </div>
          )}
          {activeTab === 'subscription' && !subLoading && !subError && (() => {
            const sub = subscription?.subscription;
            const monthlyPrice = sub ? (Number(sub.monthly_price) || 0) : 0;
            let daysRemaining = null;
            if (sub?.next_billing_date) {
              const diffMs = new Date(sub.next_billing_date).getTime() - Date.now();
              daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
            }
            // Real "portfolio capacity" against the subscribed plan's own unit range —
            // not a fabricated seat/automation metric. currentPlanObj comes from the
            // same subPlans list already rendered below; portfolio comes from the
            // real GET /api/landlord/dashboard/ fetch above.
            const currentPlanObj = subPlans.find(p => p.id === sub?.plan);
            const capMax = currentPlanObj?.unit_limit_max ?? null;
            const unitsUsed = portfolio?.total_units ?? null;
            const capPct = (capMax && unitsUsed != null) ? Math.min(100, (unitsUsed / capMax) * 100) : null;
            const ringR = 38;
            const ringC = 2 * Math.PI * ringR;
            const ringOffset = capPct != null ? ringC * (1 - capPct / 100) : ringC;

            // Billing Breakdown — real add-on spend, summed from each
            // UNSubscriptionAddon's own price_paid (subscription.addons,
            // already fetched above for the included/addon chips further
            // down) — not estimated or re-derived from the plan catalog.
            const addonsList = subscription?.addons || [];
            const addonsTotal = addonsList.reduce((sum, a) => sum + (Number(a.price_paid) || 0), 0);
            const totalMonthlySpend = monthlyPrice + addonsTotal;

            // Commercial Entity Information's permanent address (round 6 ask
            // #5) — real LandlordProfile fields (street_address_1/2, landmark,
            // city, state, zip_code, country), now returned by this page's
            // existing GET /landlord/dashboard/ fetch as landlord.address
            // (added this round — the view already loaded the profile row
            // for landlord_name, it just wasn't sent to the FE before).
            const addrLine1 = landlordAddress
              ? [landlordAddress.street_address_1, landlordAddress.street_address_2].filter(Boolean).join(', ')
              : null;
            const addrLine2 = landlordAddress
              ? [landlordAddress.landmark, landlordAddress.city, landlordAddress.state, landlordAddress.zip_code].filter(Boolean).join(', ')
              : null;
            const addrCountry = landlordAddress?.country || null;

            // Billing-period progress bar — derived from the real next_billing_date
            // and billing_cycle (no stored "period start" field exists, so the start
            // is back-computed as next_billing_date minus one cycle length).
            const cycleDays = (sub?.billing_cycle || '').toUpperCase().startsWith('ANN') ? 365 : 30;
            let periodStart = null, progressPct = null, billingDayLabel = null;
            if (sub?.next_billing_date) {
              const nextDate = new Date(sub.next_billing_date);
              periodStart = new Date(nextDate.getTime() - cycleDays * 86400000);
              const elapsedMs = Date.now() - periodStart.getTime();
              progressPct = Math.min(100, Math.max(0, (elapsedMs / (cycleDays * 86400000)) * 100));
              billingDayLabel = ordinalDay(nextDate.getDate());
            }

            return (
              <>
                {/* Tier 1 (equal-height, grid alignItems:'stretch'): Current
                    Plan (40%) | Billing Breakdown + Enterprise Expansion (30%)
                    | Allocated Capacity + Listing Promotion (30%). Tier 2,
                    auto-placed back into column 1 by plain grid-auto-flow:
                    Available Plans, at the same 40% width as Current Plan but
                    NOT height-matched to it (that comparison was always just
                    Current Plan vs. the two side stacks — see the subGrid
                    comment above). */}
                <div style={S.subGrid}>
                  <div style={S.subLeftCol}>
                    {sub ? (
                      <div style={S.curPlanCard}>
                        {/* Plan image — same UNPlan.image_url field the Available Plans
                            cards use below, gradient-faded into the card body. */}
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
                              <span style={S.curPlanPersonaPill}>Landlord</span>
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
                              <div style={S.curPlanTileValue}>{includedCount} included · {addonCount} add-on{addonCount === 1 ? '' : 's'}</div>
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
                              <div style={S.curPlanTileSub}>Automatic charge of ${monthlyPrice.toFixed(2)} {sub.monthly_price_currency || 'USD'}</div>
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
                              <span key={`inc-${s.id || s.service_name}`} style={S.chipIncluded}>✓ {s.service_name}</span>
                            ))}
                            {subscription.addons?.map(a => (
                              <span key={`add-${a.id || a.service_name}`} style={S.chipAddon}>+ {a.service_name} (add-on)</span>
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
                          <p style={{ fontSize: 13, color: C.txtSec, marginBottom: 14 }}>
                            You don't have an active plan yet for <strong>{country}</strong>. Subscribe to a plan below to unlock Buy Service for add-on services.
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
                    {/* Billing Breakdown — replaces round 4's "Portfolio Health"
                        (flagged as dashboard content with no tie to billing).
                        Real base-plan + add-on spend, summed above. */}
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
                          <div style={S.bbTotalSub}>{sub.currency || sub.monthly_price_currency || 'USD'} · billed {sub.billing_cycle || 'monthly'}</div>
                        </div>
                      ) : (
                        <div style={S.lpEmpty}>Subscribe to a plan to see your monthly billing breakdown here.</div>
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
                    {/* Allocated Capacity — real portfolio data (GET /api/landlord/dashboard/)
                        measured against the subscribed plan's own unit_limit_max. Replaces
                        the Figma's Org-PM-shaped "Admin Seats/Automation Rules/API
                        Integrations" metrics, which aren't real for Landlord, with real
                        portfolio metrics, per reviewer instruction. */}
                    <div style={S.acCard}>
                      <div style={S.acHeaderRow}>
                        <div style={S.acTitle}>Allocated Capacity</div>
                        <span style={S.acIcon}><i className="ti ti-chart-donut" aria-hidden="true" /></span>
                      </div>
                      <div style={S.acRingRow}>
                        <div style={S.acRingWrap}>
                          <svg viewBox="0 0 84 84" width="84" height="84">
                            <circle cx="42" cy="42" r={ringR} fill="none" stroke={C.stdBg} strokeWidth="8" />
                            {capPct !== null && (
                              <circle
                                cx="42" cy="42" r={ringR} fill="none" stroke={C.green} strokeWidth="8"
                                strokeDasharray={ringC} strokeDashoffset={ringOffset} strokeLinecap="round"
                                transform="rotate(-90 42 42)"
                              />
                            )}
                          </svg>
                          <div style={S.acRingCenter}>
                            <span style={S.acRingValue}>{unitsUsed ?? '—'}</span>
                            {capMax != null && <span style={S.acRingOf}>OF {capMax}</span>}
                          </div>
                        </div>
                        <div>
                          <div style={S.acRingLabel}>Active Units Managed</div>
                          <div style={S.acRingSub}>
                            {capPct !== null
                              ? `${Math.round(capPct)}% of plan's unit range utilized`
                              : (unitsUsed != null ? 'No unit cap on current plan' : 'Loading your portfolio…')}
                          </div>
                          {capMax != null && unitsUsed != null && (
                            <div style={S.acRingPct}>{Math.max(0, capMax - unitsUsed)} units remaining in range</div>
                          )}
                        </div>
                      </div>
                      <div style={S.acDivider} />
                      <div style={S.acMetricRow}>
                        <span style={S.acMetricLabel}>Total Properties</span>
                        <span style={S.acMetricValue}>{portfolio?.total_properties ?? '—'}</span>
                      </div>
                      <div style={S.acMetricRow}>
                        <span style={S.acMetricLabel}>Active Tenants</span>
                        <span style={S.acMetricValue}>{portfolio?.active_tenants ?? '—'}</span>
                      </div>
                      <div style={S.acMetricRow}>
                        <span style={S.acMetricLabel}>Services Active</span>
                        <span style={S.acMetricValue}>{includedCount + addonCount}</span>
                      </div>
                    </div>

                    {/* Listing Promotion — replaces round 4's "Portfolio Growth"
                        (rent-collection trend, same dashboard-content objection).
                        Surfaces the account's OTHER real purchase — the standing
                        ListingPromotionSubscription entitlement (Phase 4) — here
                        on Subscription & Billing for the first time, reusing the
                        same promoSubs/activePromoSub state already fetched for
                        My Services' Services tab. Nothing new fetched. */}
                    <div style={S.lpCard}>
                      <div style={S.lpHeaderRow}>
                        <div style={S.lpTitle}>Listing Promotion</div>
                        <span style={S.lpIcon}><i className="ti ti-ad-2" aria-hidden="true" /></span>
                      </div>
                      <div style={S.lpBody}>
                        {activePromoSub ? (
                          <>
                            <div style={S.lpPlanName}>{activePromoSub.plan_detail?.name || 'Plan'}</div>
                            <div style={S.lpStatusRow}><span style={S.pillActive}>● Active</span></div>
                            <div style={S.lpMetricRow}>
                              <span style={S.lpMetricLabel}>Price Paid</span>
                              <span style={S.lpMetricValue}>${Number(activePromoSub.price_paid || 0).toFixed(2)} {activePromoSub.price_paid_currency || ''}</span>
                            </div>
                            <div style={S.lpMetricRow}>
                              <span style={S.lpMetricLabel}>Valid Through</span>
                              <span style={S.lpMetricValue}>{new Date(activePromoSub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={S.lpEmpty}>No standing Listing Promotion plan purchased yet — pre-buy one to skip paying again at your next listing's Step 3.</div>
                            <button style={S.lpCta} onClick={openPromoCatalog}>
                              Explore Plans <i className="ti ti-arrow-right" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Available Plans — tier 2 of the grid above, auto-placed back
                      into column 1 by plain grid-auto-flow (it's the 4th direct
                      child of a 3-column grid, so it starts a new row in the
                      first column) — same 40% width as Current Plan, card height
                      still reduced ~40% per the earlier round's instruction. Kept
                      OUT of tier 1's equal-height stretch deliberately: the
                      "same vertical height" instruction was about Current Plan
                      vs. the two side stacks, not about Available Plans. */}
                  <div style={S.subAvailablePlansBlock}>
                  <div ref={availablePlansRef} style={S.sectionHdr}>
                    <div style={S.sectionH2}>Available Plans</div>
                    <span style={S.sectionCount}>{subPlans.length} plan(s) available for Landlord · {country}</span>
                  </div>
                  <div style={S.planGrid}>
                    {subPlans.map(p => {
                      const isCurrent = sub && sub.plan === p.id;
                      const monthly = Number(p.monthly_price) || 0;
                      const annual = p.annual_price != null ? Number(p.annual_price) : null;
                      const unitLabel = p.unit_limit_max != null
                        ? `${p.unit_limit_min} – ${p.unit_limit_max} units`
                        : `${p.unit_limit_min}+ units`;
                      const includedCount2 = p.included_services?.length || 0;
                      const addonCount2 = p.addon_services?.length || 0;
                      return (
                        <div key={p.id} style={S.planCardV2(isCurrent)}>
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
                            {annual !== null && (
                              <div style={S.planCardAnnual}>(${annual.toLocaleString()} / yr)</div>
                            )}
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
                              style={{ ...S.planCardBtnPill, ...(isCurrent ? S.planCardBtnPillOutline : S.planCardBtnPillSolid) }}
                              disabled={isCurrent || subscribingPlanId === p.id}
                              onClick={() => handleSubscribe(p.id)}
                            >
                              {isCurrent ? 'Current Plan' : (subscribingPlanId === p.id ? 'Subscribing…' : 'Subscribe')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </div>

                {/* Payment Methods & Details — rebuilt to replicate the Figma's exact
                    visual language (card visual, entity-info panel, tax banner), per
                    reviewer instruction, and restructured this round (ask #5) into a
                    40/30/30 three-column layout: Active Payment Instrument | Commercial
                    Entity Information | Linked Bank Accounts. No payment gateway exists
                    for Landlord in this codebase, so the card/EIN fields below are
                    still sample data. Linked Bank Accounts is the one exception — it
                    now reads the same real bankAccounts state as the Bank Accounts tab
                    (OwnerBankAccount, wired this round), so it's no longer "Sample"
                    watermarked. Cardholder name, invoicing email, and the entity's
                    address are the real signed-in user's data wherever this app has
                    it. Every action that isn't wired to a real backend stays disabled
                    with a tooltip explaining why; "Manage in Bank Accounts" is a real,
                    working action (it switches this page's own tab state, same pattern
                    already used by the Services tab's "Go to Subscription & Billing"
                    button). */}
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
                            <div style={S.pmCardMetaValue}>{(userLabel || 'Landlord Account').toUpperCase()}</div>
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
                            <div style={S.pmEntityName}>Apex Horizon Realty Partners</div>
                            {/* Permanent address (round 6 ask #5) — real LandlordProfile
                                fields via landlord.address on the dashboard fetch above;
                                falls back to the old sample line only if no profile row
                                exists yet for this account/country. */}
                            {addrLine1 ? (
                              <div style={S.pmEntityAddr}>
                                {addrLine1}
                                {addrLine2 ? <><br />{addrLine2}</> : null}
                                {addrCountry ? <><br />{addrCountry}</> : null}
                              </div>
                            ) : (
                              <div style={S.pmEntityAddr}>450 Lexington Ave<br />New York, NY 10017, United States</div>
                            )}
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
                            <div style={S.pmEntityRowValue}>{currentUser?.email || 'billing@apexhorizonrealty.com'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Linked Bank Accounts — new third subsection (round 6 ask #5,
                        Claude's suggestion for the "relevant to Bank accounts/card etc."
                        column). Reuses the same bankAccounts state already powering the
                        Bank Accounts tab — no new data invented. Was "Sample" watermarked
                        (OwnerBankAccount had no real backend yet); now real, since Bank
                        Accounts was wired to GET/POST/PATCH/DELETE
                        /landlord/bank-accounts/ this round — tag removed. */}
                    <div style={S.pmCol}>
                      <div style={S.pmColLabelRow}>
                        <span style={S.pmColLabel}>Linked Bank Accounts</span>
                      </div>
                      {bankAccounts.length > 0 ? (
                        <div style={S.pmEntityBox}>
                          {(() => {
                            const defaultAcct = bankAccounts.find(b => b.is_default) || bankAccounts[0];
                            return (
                              <div style={S.pmEntityHead}>
                                <span style={S.pmEntityIcon}><i className="ti ti-building-bank" aria-hidden="true" /></span>
                                <div>
                                  <div style={S.pmEntityName}>{defaultAcct.bank_name}</div>
                                  <div style={S.pmEntityAddr}>•••• {defaultAcct.account_last4} · {defaultAcct.currency}{defaultAcct.is_default ? ' · Default' : ''}</div>
                                </div>
                              </div>
                            );
                          })()}
                          <div style={S.pmEntityDivider} />
                          <div style={S.pmEntityRow}>
                            <span style={S.pmEntityIcon}><i className="ti ti-list" aria-hidden="true" /></span>
                            <div>
                              <div style={S.pmEntityRowLabel}>Total Linked Accounts</div>
                              <div style={S.pmEntityRowValue}>{bankAccounts.length}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={S.pmEntityBox}>
                          <div style={{ fontSize: 12, color: C.txtMuted, lineHeight: 1.6 }}>No bank accounts linked yet.</div>
                        </div>
                      )}
                      <div style={S.pmBelowCard}>
                        <span style={{ fontSize: 11, color: C.txtMuted }}>Used for rent &amp; service payouts</span>
                        <button style={S.figmaLinkBtn} onClick={() => setActiveTab('bank')}>
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

                {/* Billing History & Invoices — same rebuild rationale as above. No
                    invoice-read endpoint exists for Landlord yet, so the rows are
                    sample data; search/export/pagination are disabled with tooltips. */}
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
                          <td style={S.bhTd}>Professional PMS Suite — Monthly Subscription</td>
                          <td style={S.bhTd}>$149.00 USD</td>
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
            );
          })()}

          {/* ─── BANK ACCOUNTS TAB ─── */}
          {activeTab === 'bank' && bankAccountsLoading && (
            <div style={{ fontSize: 12.5, color: C.txtMuted, padding: '24px 0' }}>Loading your bank accounts…</div>
          )}
          {activeTab === 'bank' && !bankAccountsLoading && bankAccountsError && (
            <div style={{ ...S.emptyState, marginBottom: 20 }}>
              <p style={S.emptyP}>{bankAccountsError}</p>
              <button style={S.btnPrimary} onClick={fetchBankAccounts}>Retry</button>
            </div>
          )}
          {activeTab === 'bank' && !bankAccountsLoading && !bankAccountsError && (() => {
            const defaultAcct = bankAccounts.find(b => b.is_default) || bankAccounts[0] || null;
            const selectedAccount = bankAccounts.find(a => a.id === selectedBankId) || defaultAcct;
            const cardDetails = getFakeCardDetails(selectedAccount);
            return (
            <div style={{ ...S.bankPageRow, marginLeft: bankRowOffset }}>
              <div style={S.bankPageLeft}>
              <div style={S.bankLeftCard}>
                <div style={S.svcSectionTop}>
                  <div style={S.svcSectionTitleRow}>
                    <div style={{ ...S.svcSectionH2, fontSize: 18, fontWeight: 600 }}>Your Bank Accounts</div>
                  </div>
                  <button style={S.btnLinkAdd} onClick={() => setBankModal('add')}>+ Add Bank Account</button>
                </div>
                <p style={{ ...S.svcSectionSub, fontSize: 11, color: C.txtMuted, fontWeight: 400, marginBottom: 20 }}>Connected institutional accounts for automatic tenant rent payouts, security escrow, and disbursements.</p>

                {bankAccounts.length === 0 ? (
                  <div style={S.emptyState}>
                    <div style={S.emptyIcon}><i className="ti ti-building-bank" aria-hidden="true" /></div>
                    <h3 style={S.emptyH3}>No bank accounts added yet</h3>
                    <p style={S.emptyP}>Some services collect rent or deposits on your behalf and need a bank account to remit to. Add one now, or you'll be prompted the first time you add a service that needs it.</p>
                    <button style={S.btnPrimary} onClick={() => setBankModal('add')}>+ Add Bank Account</button>
                  </div>
                ) : (
                  <div style={S.bankGrid}>
                    {bankAccounts.map(a => {
                      const logoUrl = getBankLogoUrl(a.bank_name);
                      const isSelected = a.id === selectedAccount?.id;
                      return (
                      <div
                        key={a.id}
                        style={{ ...S.bankRow, ...(isSelected ? S.bankRowSelected : {}) }}
                        onClick={() => setSelectedBankId(a.id)}
                      >
                        {logoUrl ? (
                          <div style={S.bankLogoBox}>
                            <img
                              src={logoUrl}
                              alt={`${a.bank_name} logo`}
                              style={S.bankLogoImg}
                              // Google's favicon CDN occasionally has
                              // nothing for a domain — fall back to the
                              // generic icon tile rather than showing a
                              // broken-image glyph.
                              onError={e => {
                                e.currentTarget.parentElement.style.display = 'none';
                                e.currentTarget.parentElement.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          </div>
                        ) : null}
                        <div style={{ ...S.bankIcon, display: logoUrl ? 'none' : 'flex' }}><i className="ti ti-building-bank" aria-hidden="true" /></div>
                        <div style={S.bankRowMid}>
                          <div style={S.bankRowTop}>
                            <span style={S.bankName}>{a.bank_name}</span>
                            {a.is_default && <span style={S.pillDefault}>Default</span>}
                          </div>
                          {/* Condensed to one line to fit the reduced row
                              height — account_type_display and is_verified
                              are both real OwnerBankAccount fields, so the
                              status word stays honest rather than chasing
                              the Figma's unbacked "Verified ACH & Wire" /
                              "Instant Payout Enabled" flavor text. Holder
                              name, currency, and country moved into the
                              Account Details panel on the right, where
                              there's room for them. */}
                          <div style={S.bankSub}>•••• {a.account_last4 || '····'} · {a.account_type_display || '—'} · {a.is_verified ? 'Verified' : 'Pending verification'}</div>
                        </div>
                        <div style={S.bankRowRight}>
                          <span style={{ ...S.bankSelBadge, ...(isSelected ? S.bankSelBadgeOn : {}) }}><i className="ti ti-check" aria-hidden="true" /></span>
                          <span style={S.bankRowIconBtn} onClick={(e) => { e.stopPropagation(); setBankModal(a); }} aria-label="Edit"><i className="ti ti-pencil" aria-hidden="true" /></span>
                          <span style={{ ...S.bankRowIconBtn, ...S.iconBtnDanger }} onClick={(e) => { e.stopPropagation(); deleteBankAccount(a.id); }} aria-label="Delete" title="Remove this bank account"><i className="ti ti-trash" aria-hidden="true" /></span>
                        </div>
                      </div>
                      );})}

                    {/* "Link another institution" — completes the list.
                        Opens the same real Add Bank Account modal; there's
                        no separate Plaid/micro-deposit integration, so that
                        line describes a plausible future flow rather than
                        claiming one exists today. */}
                    <div style={S.bankAddCard} onClick={() => setBankModal('add')}>
                      <div style={S.bankAddIcon}><i className="ti ti-plus" aria-hidden="true" /></div>
                      <div>
                        <div style={S.bankAddTitle}>Link another institution</div>
                        <div style={S.bankAddSub}>Connect via Plaid or manual micro-deposits in 1-2 business days.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Right rail — Account Details panel for the selected
                  account (the "Corporate Card" visual + detail rows),
                  stacked above the retained Payout Telemetry preview.
                  Card Type / Network / Expires on the card visual are
                  explicitly fabricated, illustrative-only values (see
                  getFakeCardDetails above) — the user asked for the full
                  card mockup even though OwnerBankAccount has no
                  card-network, card-type, or expiry field. Everything
                  else here (bank name, account type, masked account/
                  routing numbers, verification/default status) is real. */}
              <div style={S.bankPageRight}>
                {selectedAccount && (
                  <div style={S.bankDetailsPanel}>
                    <div style={S.bankDetailsLabel}>Account Details</div>

                    <div style={S.bankCardViz}>
                      <div style={S.bankCardVizGlow} />
                      <div style={S.bankCardVizLabel}>UrbanNest Payouts</div>
                      <div style={S.bankCardVizNumRow}>
                        <div style={S.bankCardVizDotsGroup}>
                          <span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} />
                        </div>
                        <div style={S.bankCardVizDotsGroup}>
                          <span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} />
                        </div>
                        <div style={S.bankCardVizDotsGroup}>
                          <span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} /><span style={S.bankCardVizDot} />
                        </div>
                        <span style={S.bankCardVizLast4}>{selectedAccount.account_last4 || '····'}</span>
                        <div style={S.bankCardVizNetwork}>
                          <span style={S.bankCardVizMcRed} />
                          <span style={S.bankCardVizMcYellow} />
                          <span style={S.bankCardVizNetworkName}>{cardDetails.network}</span>
                        </div>
                      </div>
                      <div style={S.bankCardVizBottomRow}>
                        <div>
                          <div style={S.bankCardVizFieldLabel}>Card Holder</div>
                          <div style={S.bankCardVizFieldValue}>{(selectedAccount.holder_name || '—').toUpperCase()}</div>
                        </div>
                        <div>
                          <div style={S.bankCardVizFieldLabel}>Expires</div>
                          <div style={S.bankCardVizFieldValue}>{cardDetails.expiry}</div>
                        </div>
                      </div>
                    </div>

                    <hr style={S.bankDottedRule} />

                    <div style={S.bankAcctDetailRow}>
                      <span style={S.bankAcctDetailLabel}>Bank Name</span>
                      <span style={S.bankAcctDetailValue}>{selectedAccount.bank_name}</span>
                    </div>
                    <div style={S.bankAcctDetailRow}>
                      <span style={S.bankAcctDetailLabel}>Account Type</span>
                      <span style={S.bankAcctDetailValue}>{selectedAccount.account_type_display || '—'}</span>
                    </div>
                    {/* Card Type is fabricated/illustrative — see the
                        getFakeCardDetails comment above its definition. */}
                    <div style={S.bankAcctDetailRow}>
                      <span style={S.bankAcctDetailLabel}>Card Type</span>
                      <span style={S.bankAcctDetailValue}>{cardDetails.type} · {cardDetails.network}</span>
                    </div>
                    <div style={S.bankAcctDetailRow}>
                      <span style={S.bankAcctDetailLabel}>Account #</span>
                      <span style={S.bankAcctDetailValueMono}>•••• {selectedAccount.account_last4 || '····'}</span>
                    </div>
                    <div style={S.bankAcctDetailRow}>
                      <span style={S.bankAcctDetailLabel}>Routing #</span>
                      <span style={S.bankAcctDetailValueMono}>{selectedAccount.routing_masked || '—'}</span>
                    </div>
                    <div style={{ ...S.bankAcctDetailRow, ...S.bankAcctDetailRowLast }}>
                      <span style={S.bankAcctDetailLabel}>Status</span>
                      {selectedAccount.is_default
                        ? <span style={S.bankStatusActive}>● Payout Active</span>
                        : <span style={S.linkBtn} onClick={() => setDefaultAccount(selectedAccount.id)}>✓ Set as default</span>}
                    </div>
                  </div>
                )}

                <div style={S.bankTelemetryCard} title="Illustrative preview — live payout telemetry isn't wired up yet">
                  <div style={S.bankTelemetryPhoto}>
                    <div style={S.bankTelemetryPhotoOverlay}>
                      <span style={S.bankTelemetryPhotoLabel}><i className="ti ti-clock-hour-4" aria-hidden="true" /> Payout Telemetry</span>
                    </div>
                  </div>
                  <div style={S.bankTelemetryBody}>
                    <div style={S.bankTelemetryRow}>
                      <span style={S.bankTelemetryLabel}>Next Scheduled Payout</span>
                      <span style={S.bankTelemetryValue}>Tomorrow, 9:00 AM</span>
                    </div>
                    <div style={S.bankTelemetryRow}>
                      <span style={S.bankTelemetryLabel}>Pending Volume</span>
                      <span style={S.bankTelemetryValueGreen}>$12,450.00 USD</span>
                    </div>
                    <div style={S.bankTelemetryRow}>
                      <span style={S.bankTelemetryLabel}>Target Destination</span>
                      <span style={S.bankTelemetryValue}>{defaultAcct ? `${defaultAcct.bank_name} (••${defaultAcct.account_last4})` : '—'}</span>
                    </div>
                    <div style={S.bankTelemetryRow}>
                      <span style={S.bankTelemetryLabel}>ACH Guard Status</span>
                      <span style={S.bankTelemetryPill}>● Verified</span>
                    </div>
                    <div style={S.bankTelemetryNote}>Sample preview — live telemetry isn't wired up yet.</div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ─── SERVICES TAB ─── */}
          {activeTab === 'services' && servicesLoading && (
            <div style={{ fontSize: 12.5, color: C.txtMuted, padding: '24px 0' }}>Loading services…</div>
          )}
          {activeTab === 'services' && !servicesLoading && servicesError && (
            <div style={{ ...S.emptyState, marginBottom: 20 }}>
              <p style={S.emptyP}>{servicesError}</p>
              <button style={S.btnPrimary} onClick={fetchCatalog}>Retry</button>
            </div>
          )}
          {activeTab === 'services' && !servicesLoading && !servicesError && (
            <>
              {buyGateClosed && (
                <div style={S.subBanner}>
                  <div style={S.subBannerText}>
                    <strong>Subscribe to a Plan first</strong> — Buy Service for an add-on is disabled until you have an active subscription (<code>UNSubscriptionAddon</code> requires one, Phase 3).
                  </div>
                  <button style={S.btnPrimary} onClick={() => setActiveTab('subscription')}>Go to Subscription & Billing</button>
                </div>
              )}

              {/* Stat tiles (Session 50, point 1; restyled Session 51 with
                  soft per-tile icon tints to match the Figma) — 5 tiles,
                  real counts only. Total/Included/Active Add-On's come from
                  the already-fetched subscription response; Available
                  Add-On's and Active Campaigns are plan-/promo-scoped — see
                  the derived vars above (planAddonServices,
                  activeCampaignsCount). */}
              <div style={S.statRow}>
                <div style={S.statTile(C.navBg, C.blueLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Total Active Services</span>
                    <span style={S.statIconTint(C.blueLight, C.navBg)}><i className="ti ti-apps" aria-hidden="true" /></span>
                  </div>
                  <div style={S.statValue}>{ownedServices.length}</div>
                  <div style={S.statSub}>
                    {subscription ? `${includedCount} included, ${addonCount} add-on${addonCount === 1 ? '' : 's'} purchased` : 'No active services yet'}
                  </div>
                </div>
                <div style={S.statTile(C.navBg, C.blueLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Included With Plan</span>
                    <span style={S.statIconTint(C.blueLight, C.navBg)}><i className="ti ti-package" aria-hidden="true" /></span>
                  </div>
                  <div style={S.statValue}>{includedCount}</div>
                  <div style={S.statSub}>{subscription ? `Covered by ${subscription.subscription.plan_name}` : 'Subscribe to a plan to unlock included services'}</div>
                </div>
                <div style={S.statTile(C.blue, C.blueLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Active Add-On's</span>
                    <span style={S.statIconTint(C.blueLight, C.blue)}><i className="ti ti-circle-check" aria-hidden="true" /></span>
                  </div>
                  <div style={S.statValue}>{addonCount}</div>
                  <div style={S.statSub}>Purchased beyond your plan</div>
                </div>
                <div style={S.statTile(C.greenDark, C.greenLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Available Add-On's</span>
                    <span style={S.statIconTint(C.greenLight, C.greenDark)}><i className="ti ti-plus" aria-hidden="true" /></span>
                  </div>
                  <div style={S.statValue}>{planAddonServices.filter(s => !s.owned).length}</div>
                  <div style={S.statSub}>{buyGateClosed ? 'Subscribe to a plan first' : 'Ready to purchase for your plan'}</div>
                </div>
                <div style={S.statTile(C.amber, C.amberLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Active Campaigns</span>
                    <span style={S.statIconTint(C.amberLight, C.amber)}><i className="ti ti-rocket" aria-hidden="true" /></span>
                  </div>
                  <div style={S.statValue}>{activeCampaignsCount}</div>
                  <div style={S.statSub}>Listing Promotion subscriptions</div>
                </div>
              </div>

              {/* "Included with Your Plan" (point 2) — real UNPlanService
                  (INCLUDED) rows for the current plan, already entitled, no
                  Buy Service button since there's nothing to buy. Card
                  anatomy, as of this round: a photo (the Figma's own, cycled
                  from INCLUDED_VISUALS — or the service's own real
                  UNService.image when one exists), an "Active" status pill,
                  and a single-line serif title — the earlier inline
                  "Included in Subscription" pill and 3-chip meta box were
                  both removed per the reviewer's explicit asks (separate
                  rounds). "Configure" has no real screen
                  behind it anywhere in this app, so it's disabled with a
                  tooltip rather than faked; "View Details" opens the real,
                  existing ServiceDetailModal. */}
              <div style={S.svcSectionHdr}>
                <div style={S.svcSectionTop}>
                  <div style={S.svcSectionTitleRow}>
                    <div style={S.svcSectionH2}>Included with Your Plan</div>
                    <span style={S.svcSectionPill}>{includedPlanServices.length} Active Service{includedPlanServices.length === 1 ? '' : 's'}{subscription ? ` • ${subscription.subscription.plan_name}` : ''}</span>
                  </div>
                  <button style={S.svcSectionLink} onClick={() => setActiveTab('subscription')}>Manage Plan Limits <i className="ti ti-arrow-right" aria-hidden="true" /></button>
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
                            <span style={S.pmSamplePill}>Sample</span>
                          ) : (
                            <span style={S.svcMediaStatusPill}><i className="ti ti-circle-check" aria-hidden="true" /> Active</span>
                          )}
                        </div>
                        <div style={S.svcBody}>
                          <div style={{ ...S.svcTitleSerif, ...S.svcTitleClamp }}>{s.name}</div>
                          <p style={S.svcDesc}>{s.shortDesc}</p>
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

              {/* "Add-Ons for Your Plan" (point 3) — every ADDON-type service
                  on the current plan; not-yet-purchased ones get a real Buy
                  flow, already-purchased ones get an "✓ Added" ribbon and a
                  disabled "Configure Service" action instead of disappearing
                  from view. Category row + ribbon tag are decorative/cosmetic
                  (cycling via ADDON_FLAVORS, no backing field — same
                  reasoning as the Included cards above); price + the
                  bank-account caption are both real fields. */}
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
                    return (
                      <div key={`addon-${s.id}`} style={{ ...S.svcCard, ...S.svcCardW3 }} onClick={() => { if (!isSample) setOpenService(s); }}>
                        <div style={{ ...S.svcMedia, backgroundImage: `url(${s.image || visualFor(ADDON_VISUALS, i)})` }}>
                          {isSample ? (
                            <span style={S.pmSamplePill}>Sample</span>
                          ) : (
                            <span style={{ ...S.svcMediaRibbon, ...(s.owned ? S.svcMediaRibbonAccent : {}) }}>
                              {s.owned ? '✓ Added' : flavor.ribbon}
                            </span>
                          )}
                        </div>
                        <div style={S.svcBody}>
                          <div style={{ ...S.svcTitleSerif, ...S.svcTitleClamp }}>{s.name}</div>
                          <p style={S.svcDesc}>{s.shortDesc}</p>
                          <div style={S.svcDivider} />
                          <div style={S.svcPriceRow}>
                            <div>
                              <span style={S.svcPriceBig}>{s.price}</span>
                              <span style={S.svcPriceUnit}>{s.priceUnit}</span>
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
                              onClick={e => { e.stopPropagation(); if (!inCart && !buyGateClosed) addToCart(s); }}
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

              {/* Listing Promotion — "advertisement" section (point 4),
                  redesigned Session 51 into the Figma's own horizontal
                  layout: text block + stats on the left, two stacked buttons
                  on the right, over the Figma's own (blurred) marketplace
                  photo. "Browse Active Inventory" is real navigation to this
                  app's actual Listings Overview route, not a dead button. */}
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
                    <button style={S.promoAdCtaSecondary} onClick={() => navigate('/landlord-portal/listings')}>
                      <i className="ti ti-eye" aria-hidden="true" /> Browse Active Inventory
                    </button>
                    {activePromoSub && (
                      <div style={S.promoAdActiveNote}>
                        ✓ Already Paid — {activePromoSub.plan_detail?.name || 'Plan'} · valid through {new Date(activePromoSub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* External marketing teaser (point 5) — no backend anywhere
                  in this codebase for any of these; every card below is
                  explicitly sample/"Coming Soon", not purchasable. Restyled
                  Session 51 with a photo banner (the Figma's own crops) and
                  a subtitle tag line, matching the Figma's card anatomy. */}
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

          {/* ─── TRANSACTIONS TAB (Session 52) ─── */}
          {activeTab === 'transactions' && (
            <>
              <div style={S.txIntroRow}>
                <p style={S.txIntroSub}>Historical record of payments made to UrbanNest and direct service charges.</p>
                <div style={S.txScopeBadge}>
                  <span style={S.txScopeIcon}><i className="ti ti-receipt-2" aria-hidden="true" /></span>
                  <div>
                    <div style={S.txScopeLabel}>Scope</div>
                    <div style={S.txScopeValue}>UrbanNest Platform Billing Only</div>
                  </div>
                </div>
              </div>

              {/* Stat cards restyled this round to match the reviewer's
                  screenshot — which is this same page's own Services-tab
                  stat tiles (statTile/statTileTop/statLabel/statIconTint/
                  statValue/statSub, already built there): a colored left
                  accent border, an uppercase eyebrow label with a small
                  tinted icon badge, a big serif number, and one muted
                  caption line below. Reused directly rather than building a
                  tx-specific copy. The "Total Paid"/"Last Payment" cards'
                  extra context (the month-over-month delta, the payment
                  date) is folded into that one caption line instead of a
                  separate badge, to fit this tile's simpler anatomy — no
                  real information was dropped. "Active Auto-Debit Account"
                  isn't a number, so it keeps its own mini payment-card
                  content and "Manage" link below the same header row, just
                  wrapped in the same tile chrome for visual consistency. */}
              <div style={S.txStatRow}>
                <div style={S.statTile(C.navBg, C.blueLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Total Paid This Month</span>
                    <span style={S.statIconTint(C.blueLight, C.navBg)}><i className="ti ti-calendar" aria-hidden="true" /></span>
                  </div>
                  <div style={S.statValue}>$248.00</div>
                  <div style={S.statSub}>8.4% vs Sep · Includes PMS, screenings &amp; promotions</div>
                </div>

                <div style={S.statTile(C.greenDark, C.greenLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Last Payment</span>
                    <span style={S.statIconTint(C.greenLight, C.greenDark)}><i className="ti ti-rosette-discount-check" aria-hidden="true" /></span>
                  </div>
                  <div style={S.statValue}>$49.00</div>
                  <div style={S.statSub}>Oct 04, 2026 · Processed automatically</div>
                </div>

                <div style={S.statTile(C.blue, C.blueLight)}>
                  <div style={S.statTileTop}>
                    <span style={S.statLabel}>Active Auto-Debit Account</span>
                    <button style={S.figmaLinkBtn} onClick={() => setActiveTab('subscription')}>Manage</button>
                  </div>
                  <div style={S.txCardMini}>
                    <span style={S.txCardMiniIcon}>MC</span>
                    <div>
                      <div style={S.txCardMiniBrand}>Mastercard •••• 4242</div>
                      <div style={S.txCardMiniMeta}>Expires 08/28 <span style={S.pillDefault}>DEFAULT</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={S.txToolbarRow}>
                <div style={S.txSearchWrap}>
                  <i className="ti ti-search" style={S.txSearchIcon} aria-hidden="true" />
                  <input
                    style={S.txSearchInput}
                    placeholder="Search description or reference ID (e.g., TXN-UN...)"
                    value={txQuery}
                    onChange={e => setTxQuery(e.target.value)}
                  />
                </div>
                <div style={S.txServiceDropdownWrap}>
                  <CustomDropdown options={TX_SERVICE_FILTER_OPTIONS} value={txService} onChange={setTxService} placeholder="All Services" />
                </div>
                <div style={S.txRangeDropdownWrap}>
                  <CustomDropdown options={TX_RANGE_OPTIONS} value={txRange} onChange={setTxRange} placeholder="Last 30 Days" />
                </div>
                <button style={S.figmaOutlineBtn} onClick={handleTxExportCsv}>
                  <i className="ti ti-download" aria-hidden="true" /> Export CSV
                </button>
              </div>

              <div style={S.txLayout}>
                <div style={S.txTableCard}>
                  <div style={S.figmaCardHdr}>
                    <div>
                      <div style={{ ...S.figmaCardTitle, fontWeight: 600 }}>Billing Activity</div>
                      <div style={S.figmaCardSub}>All billing events across subscriptions, marketplace promotions, and screening fees.</div>
                    </div>
                  </div>
                  <div style={S.figmaDivider} />
                  <table style={S.txTable}>
                    <thead>
                      <tr>
                        <th style={S.txTh}>Date</th>
                        <th style={S.txTh}>Transaction</th>
                        <th style={S.txTh}>Service</th>
                        <th style={S.txTh}>Reference</th>
                        <th style={{ ...S.txTh, textAlign: 'right' }}>Amount</th>
                        <th style={S.txTh}>Status</th>
                        <th style={S.txTh}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txFilteredRows.length === 0 ? (
                        <tr><td style={S.txEmptyRow} colSpan={7}>No transactions match these filters.</td></tr>
                      ) : txFilteredRows.map(t => {
                        const active = t.id === txSelected;
                        const negative = t.amount < 0;
                        return (
                          <tr key={t.id} style={S.txRow(active, t.id === txHoverId)} onMouseEnter={() => setTxHoverId(t.id)} onMouseLeave={() => setTxHoverId(null)}>
                            <td style={S.txTd}>{t.dateLabel}</td>
                            <td style={S.txTd}>{t.label}</td>
                            <td style={S.txTd}>{t.service}</td>
                            <td style={S.txTd}><span style={S.txRef}>{t.id}</span></td>
                            <td style={S.txAmountTd(negative)}>{negative ? '-' : ''}${Math.abs(t.amount).toFixed(2)}</td>
                            <td style={S.txTd}>{t.status}</td>
                            <td style={S.txTd}>
                              <button style={S.txViewIconBtn(active)} onClick={() => setTxSelected(t.id)} title="View Details" aria-label="View Details">
                                <i className="ti ti-eye" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={S.txFooterRow}>
                    <span>Showing {txFilteredRows.length} of {TRANSACTIONS.length} billing entries for current billing cycle</span>
                    <div style={S.txPagination}>
                      <button style={S.txPageBtn} disabled title="Only one page of results today">Previous</button>
                      <button style={{ ...S.txPageBtn, ...S.txPageBtnActive }} disabled>1</button>
                      <button style={S.txPageBtn} disabled title="Only one page of results today">Next</button>
                    </div>
                  </div>
                </div>

                <div style={S.txDetailCard(txDetail && txDetail.status === 'Refunded')}>
                  {!txDetail ? (
                    <div style={{ fontSize: 12.5, color: C.txtMuted, textAlign: 'center', padding: '24px 0' }}>Select a transaction to view its details.</div>
                  ) : (
                    <>
                      <div style={S.txDetailTopRow}>
                        <div>
                          <div style={S.txDetailBadge(txDetail.status === 'Refunded')}>
                            <i className={txDetail.status === 'Refunded' ? 'ti ti-receipt-refund' : 'ti ti-circle-check'} aria-hidden="true" /> {txDetail.status === 'Refunded' ? 'Refund Issued' : 'Settled Charge'}
                          </div>
                          <h4 style={S.txDetailTitle}>{txDetail.desc.split(' - ')[0]}</h4>
                          <div style={S.txDetailRef}>{txDetail.id}</div>
                        </div>
                        <div style={S.txDetailHdrRight}>
                          <span style={S.txDetailIconWrap(txDetail.status === 'Refunded')}><i className={txDetail.status === 'Refunded' ? 'ti ti-receipt-refund' : 'ti ti-file-invoice'} aria-hidden="true" /></span>
                          {/* fontSize overridden 11.5 -> 8.5 here only (not on the
                              shared figmaLinkBtn style, which "Manage" links elsewhere
                              on this page still rely on at 11.5) per reviewer's
                              "reduce the font size by 3 points" ask, this round. */}
                          <button style={{ ...S.figmaLinkBtn, cursor: 'not-allowed', fontSize: 8.5 }} disabled title="A dedicated transaction detail page isn't wired up yet">View Details</button>
                        </div>
                      </div>

                      <div style={S.txDetailInfoBox}>
                        <div style={S.txDetailInfoRow}>
                          <span style={S.txDetailInfoLabel}><i className="ti ti-credit-card" aria-hidden="true" /> Payment Method</span>
                          <span style={S.txDetailInfoValue}>{txDetail.paymentMethod}</span>
                        </div>
                        <div style={S.txDetailInfoRow}>
                          <span style={S.txDetailInfoLabel}>Timestamp</span>
                          <span style={S.txDetailInfoValue}>{txDetail.timestamp}</span>
                        </div>
                        <div style={S.txDetailInfoRow}>
                          <span style={S.txDetailInfoLabel}>Billing Type</span>
                          <span style={S.txDetailInfoValue}>{txDetail.billingType}</span>
                        </div>
                      </div>

                      <div style={S.txBreakdownLabel}>Line Item Breakdown</div>
                      {txDetail.lineItems.map((li, i) => (
                        <div key={i} style={S.txBreakdownRow}>
                          <span>{li.label}</span>
                          <span>{li.value < 0 ? '-' : ''}${Math.abs(li.value).toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={S.txTotalRow}>
                        <span style={S.txTotalLabel}>{txDetail.total < 0 ? 'Total Refunded' : 'Total Charged'}</span>
                        <span style={S.txTotalValue(txDetail.total < 0)}>{txDetail.total < 0 ? '-' : ''}${Math.abs(txDetail.total).toFixed(2)}</span>
                      </div>

                      <button style={S.txBtnPrimary} disabled title="PDF receipt generation isn't wired up yet">
                        <i className="ti ti-download" aria-hidden="true" /> Download Receipt (PDF)
                      </button>
                      <button style={S.txBtnOutline} disabled title="Invoice printing isn't wired up yet">
                        <i className="ti ti-printer" aria-hidden="true" /> Print Invoice
                      </button>

                      <div style={S.txSecurityNote}>
                        <i className="ti ti-lock" aria-hidden="true" />
                        <span>Billing data shown is sample content — no live payment gateway is connected in this environment yet. Once connected, charges will be processed and recorded through UrbanNest's secure billing system.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Integrations tab (Figma, Oct 2026) — none of these connections
              are backed by a real integration: settings.py only has
              placeholder Stripe env keys, and there's no QuickBooks/Xero,
              Twilio, SendGrid, or webhook/API-key logic anywhere in this
              codebase. So every value below is static sample content taken
              straight from the Figma mock, and every action is disabled
              with an ARCH_017 tooltip, same convention used for the
              non-wired cards on My Profile. */}
          {activeTab === 'integrations' && (
            <>
              <div style={S.intgIntroRow}>
                <p style={S.intgIntroSub}>Manage third-party connections, payment providers, and automated messaging integrations.</p>
                <div style={S.intgStatBadgeRow}>
                  <div style={S.intgStatBadge}>
                    <span style={S.intgStatIcon(C.greenLight, C.greenDark)}><i className="ti ti-square-check" aria-hidden="true" /></span>
                    <div>
                      <div style={S.intgStatValue}>3 of 4</div>
                      <div style={S.intgStatCaption}>Live Pipelines</div>
                    </div>
                  </div>
                  <div style={S.intgStatBadge}>
                    <span style={S.intgStatIcon(C.navBg, '#fff')}><i className="ti ti-shield-check" aria-hidden="true" /></span>
                    <div>
                      <div style={S.intgStatValue}>99.9%</div>
                      <div style={S.intgStatCaption}>Relay Health</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={S.intgGrid}>
                <div style={S.intgCard}>
                  <div style={S.intgCardHeadRow}>
                    <div style={S.intgCardIconTitleRow}>
                      <span style={S.intgIconBox}><i className="ti ti-credit-card" aria-hidden="true" /></span>
                      <div>
                        <div style={S.intgEyebrow}>Payment Provider</div>
                        <div style={S.intgTitle}>Stripe Connect &amp; Payouts</div>
                      </div>
                    </div>
                    <span style={S.intgStatusPill(true)}><i className="ti ti-circle-check" aria-hidden="true" /> Connected</span>
                  </div>
                  <p style={S.svcDesc}>Automated ACH rent processing, credit card disbursements, and instant tenant deposit collection.</p>
                  <div style={S.intgInfoBox}>
                    <div style={S.intgInfoRow}><span style={S.intgInfoLabel}>Merchant Account</span><span style={S.intgInfoValueMono}>acct_1N9vX783kd9</span></div>
                    <div style={S.intgInfoRow}><span style={S.intgInfoLabel}>Last Reconciliation</span><span style={S.intgInfoValueOk}>● 12 minutes ago</span></div>
                  </div>
                  <div style={S.intgBtnRow}>
                    <button style={S.btnPrimary} disabled title="Stripe configuration isn't wired up yet">Configure</button>
                    <button style={S.btnSecondary} disabled title="Reconnect isn't wired up yet">Reconnect</button>
                    <button style={S.intgDangerLink} disabled title="Disconnect isn't wired up yet"><i className="ti ti-plug-x" aria-hidden="true" /> Disconnect</button>
                  </div>
                </div>

                <div style={S.intgCard}>
                  <div style={S.intgCardHeadRow}>
                    <div style={S.intgCardIconTitleRow}>
                      <span style={S.intgIconBox}><i className="ti ti-building-bank" aria-hidden="true" /></span>
                      <div>
                        <div style={S.intgEyebrow}>Accounting</div>
                        <div style={S.intgTitle}>QuickBooks Online / Xero Sync</div>
                      </div>
                    </div>
                    <span style={S.intgStatusPill(true)}><i className="ti ti-circle-check" aria-hidden="true" /> Connected</span>
                  </div>
                  <p style={S.svcDesc}>Real-time ledger synchronization for rent roll, vendor expense categorization, and tax audits.</p>
                  <div style={S.intgInfoBox}>
                    <div style={S.intgInfoRow}><span style={S.intgInfoLabel}>Mapped Legal Entity</span><span style={S.intgInfoValueText}>Apex Horizon NY LLC</span></div>
                    <div style={S.intgInfoRow}><span style={S.intgInfoLabel}>Automated Cron</span><span style={S.intgInfoValueMono}>Daily @ 02:00 UTC</span></div>
                  </div>
                  <div style={S.intgBtnRow}>
                    <button style={S.btnPrimary} disabled title="QuickBooks configuration isn't wired up yet">Configure</button>
                    <button style={S.btnSecondary} disabled title="Reconnect isn't wired up yet">Reconnect</button>
                    <button style={S.intgDangerLink} disabled title="Disconnect isn't wired up yet"><i className="ti ti-plug-x" aria-hidden="true" /> Disconnect</button>
                  </div>
                </div>

                <div style={S.intgCard}>
                  <div style={S.intgCardHeadRow}>
                    <div style={S.intgCardIconTitleRow}>
                      <span style={S.intgIconBox}><i className="ti ti-mail" aria-hidden="true" /></span>
                      <div>
                        <div style={S.intgEyebrow}>Email Dispatch</div>
                        <div style={S.intgTitle}>SendGrid / SMTP Gateway</div>
                      </div>
                    </div>
                    <span style={S.intgStatusPill(false)}>● Not Connected</span>
                  </div>
                  <p style={S.svcDesc}>Transactional tenant notices, lease generation dispatch, and automated maintenance alert notifications.</p>
                  <div style={S.intgInfoBox}>
                    <div style={S.intgInfoNotice}>
                      <span style={S.intgInfoNoticeIcon}><i className="ti ti-info-circle" aria-hidden="true" /></span>
                      <span>Currently relying on shared UrbanNest mail relay. Connect your dedicated domain to enable custom DKIM/SPF verification.</span>
                    </div>
                  </div>
                  <div style={{ ...S.intgBtnRow, justifyContent: 'flex-end' }}>
                    <button style={{ ...S.btnPrimary, display: 'inline-flex', alignItems: 'center', gap: 7 }} disabled title="Email gateway connection isn't wired up yet"><i className="ti ti-plug-connected" aria-hidden="true" /> Connect Gateway</button>
                  </div>
                </div>

                <div style={S.intgCard}>
                  <div style={S.intgCardHeadRow}>
                    <div style={S.intgCardIconTitleRow}>
                      <span style={S.intgIconBox}><i className="ti ti-message-circle-2" aria-hidden="true" /></span>
                      <div>
                        <div style={S.intgEyebrow}>SMS Gateway</div>
                        <div style={S.intgTitle}>Twilio SMS &amp; Messaging</div>
                      </div>
                    </div>
                    <span style={S.intgStatusPill(true)}><i className="ti ti-circle-check" aria-hidden="true" /> Connected</span>
                  </div>
                  <p style={S.svcDesc}>Two-factor verification codes, emergency maintenance SMS broadcasts, and instant showing reminders.</p>
                  <div style={S.intgInfoBox}>
                    <div style={S.intgInfoRow}><span style={S.intgInfoLabel}>Active Sender ID</span><span style={S.intgInfoValueMono}>+1 (800) 492-NEST</span></div>
                    <div style={S.intgInfoRow}>
                      <span style={S.intgInfoLabel}>Delivery Performance</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={S.intgBarTrack}><div style={S.intgBarFill(99.8)} /></div>
                        <span style={S.intgInfoValueMono}>99.8%</span>
                      </div>
                    </div>
                  </div>
                  <div style={S.intgBtnRow}>
                    <button style={S.btnPrimary} disabled title="Twilio configuration isn't wired up yet">Configure</button>
                    <button style={S.btnSecondary} disabled title="Reconnect isn't wired up yet">Reconnect</button>
                    <button style={S.intgDangerLink} disabled title="Disconnect isn't wired up yet"><i className="ti ti-plug-x" aria-hidden="true" /> Disconnect</button>
                  </div>
                </div>
              </div>

              <div style={S.intgDevBanner}>
                <div>
                  <div style={S.intgDevEyebrowRow}>
                    <span style={S.intgDevTag}>Developer Protocol</span>
                    <span style={S.intgDevVersion}>v2.4 LTS</span>
                  </div>
                  <div style={S.intgDevTitle}>Custom Webhooks &amp; Direct API Credentials</div>
                  <p style={S.intgDevDesc}>Connect custom ERP endpoints, configure HMAC payload signing, or retrieve scoped production API keys for bespoke tenant portals.</p>
                </div>
                <div style={S.intgDevBtnRow}>
                  <button style={S.intgDevBtnGhost} disabled title="API key management isn't wired up yet"><i className="ti ti-key" aria-hidden="true" /> Manage API Keys</button>
                  <button style={S.intgDevBtnSolid} disabled title="Webhook endpoints aren't wired up yet"><i className="ti ti-plug-connected" aria-hidden="true" /> Configure Endpoints</button>
                </div>
              </div>
            </>
          )}

          <div style={S.footer}>© 2023 UrbanNest Property Management. All Rights Reserved.</div>
        </main>
      </div>

      {bankModal && (
        <BankAccountModal
          account={bankModal === 'add' ? null : bankModal}
          hasOtherAccounts={bankAccounts.length > 0}
          holderName={`${profileSource.firstName} ${profileSource.lastName}`.trim() || userLabel || 'Landlord Account'}
          saving={bankSaving}
          error={bankSaveError}
          onClose={() => { setBankModal(null); setBankSaveError(null); }}
          onSave={saveBankAccount}
        />
      )}

      {openService && (
        <ServiceDetailModal
          service={openService}
          inCart={isInCart(openService.id)}
          onClose={() => setOpenService(null)}
          onAddToCart={addToCart}
        />
      )}

      {cartOpen && (
        <PaymentCartModal
          onClose={() => setCartOpen(false)}
          onConfirm={handleConfirmPurchase}
          theme={{
            navBg: C.navBg, cardBg: C.cardBg, cardBdr: C.cardBdr,
            txtPrimary: C.txtPrimary, txtSec: C.txtSec, txtMuted: C.txtMuted,
            blue: C.blue, blueLight: C.blueLight, blueDark: C.blueDark,
            greenLight: C.greenLight, greenDark: C.greenDark, red: C.red,
            font: F.sans,
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
          onViewDetails={plan => setOpenPlanDetail(plan)}
        />
      )}

      {openPlanDetail && (
        <PlanDetailModal
          plan={openPlanDetail}
          visual={promoVisualFor(promoCatalog.findIndex(p => p.id === openPlanDetail.id))}
          purchasing={promoPurchasingId === openPlanDetail.id}
          onClose={() => setOpenPlanDetail(null)}
          onPurchase={(planId) => { handlePurchasePromoPlan(planId); setOpenPlanDetail(null); }}
        />
      )}
    </div>
  );
}
