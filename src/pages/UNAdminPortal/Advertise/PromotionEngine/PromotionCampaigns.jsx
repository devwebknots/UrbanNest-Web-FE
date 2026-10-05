/**
 * PromotionCampaigns.jsx — Promotion Engine → Campaigns tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Phase 6 (FE wiring). Rewired from "Sample Data end to end"
 * onto the real PromotionCampaign backend (promotion_engine/views.py). Every
 * Create/Status-Transition/Target/Feature-Addon action is now a real write.
 *
 * Several fields the pre-wiring sample form had no longer exist here because
 * the real PromotionCampaign model never had them — removed rather than kept
 * as dead UI, per this feature's own established honesty convention:
 *   - Objective, Priority, Creative Headline/Description: no backend column
 *     at all (invented sample-only fields).
 *   - Market (multi-select) and Personas (multi-select): the real model has
 *     one `persona_at_purchase` (single value) and no market field at all —
 *     a Campaign's market is implied by its Product's own markets, shown
 *     read-only here.
 *   - Target Property / Target Location / Target Units (free text): replaced
 *     by real `PromotionCampaignTarget` rows (an actual Listing or
 *     PropertyListing id), managed from the Campaign Detail panel once the
 *     Campaign exists. No cross-tenant Listing/PropertyListing search
 *     endpoint exists yet, so this is a plain numeric-id entry, not a
 *     picker — documented inline where it renders.
 *   - Impressions/Views/Clicks/Leads/Applications/Leases, Performance Trend,
 *     Known Issues, and the Invoice/Billing panel: no analytics pipeline or
 *     billing ledger exists anywhere in this codebase yet (confirmed again
 *     this pass) — shown as an honest "not available yet" notice instead of
 *     fabricated numbers, now that this tab is mostly real rather than
 *     sample end-to-end.
 * Status can now ONLY change through the real transition endpoint
 * (decision 15's state machine) — never a plain field edit — matching the
 * backend's own read-only `status` on the general write serializer.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  C, F, SampleTag, ActionTooltip, StatusPill, CustomDropdown,
} from './promotionTokens';
import { PERSONAS, MARKET_BY_CODE, CAMPAIGN_FEATURE_KEYS, SAMPLE_PRODUCTS } from './PromotionProductCatalog'; // SAMPLE_PRODUCTS only for the productFor() compat export below
import {
  apiListProducts, apiGetProduct, apiListPlans, apiGetPlan,
  apiListCampaigns, apiGetCampaign, apiCreateCampaign, apiUpdateCampaign, apiDeleteCampaign,
  apiTransitionCampaignStatus,
  apiCreateCampaignTarget, apiDeleteCampaignTarget, apiListCampaignTargets,
  apiAddCampaignFeatureAddon, apiRemoveCampaignFeatureAddon,
} from './promotionEngineApi';
import {
  PERSONA_TO_API, PERSONA_FROM_API, MARKET_FROM_API,
  statusToApi, statusFromApi,
  CAMPAIGN_TARGET_TYPE_TO_API, CAMPAIGN_TARGET_TYPE_FROM_API,
  PACING_TO_API, PACING_FROM_API, BIDDING_TO_API, BIDDING_FROM_API,
  camelToSnake, CAMPAIGN_FEATURE_KEY_TO_API,
} from './promotionFieldMap';

// ═══════════════════════════════════════════════════════════════════════════
// Shared small pieces — file-local copies, same convention as
// PromotionProductCatalog.jsx uses.
// ═══════════════════════════════════════════════════════════════════════════
function SectionCard({ title, subtitle, action, children, style }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 18, overflow: 'hidden', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.border}`, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: F.headline, fontSize: 14.5, fontWeight: 700, color: C.textPrimary }}>{title}</div>
          {subtitle && <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function PrimaryButton({ label, icon, onClick, disabled, small, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: small ? '6px 12px' : '9px 16px', background: disabled ? C.borderMedium : C.primary, border: 'none', borderRadius: 7,
      fontFamily: F.body, fontSize: small ? 11.5 : 12.5, fontWeight: 700, color: C.white, cursor: disabled ? 'not-allowed' : 'pointer',
      ...style,
    }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 13 }} />}
      {label}
    </button>
  );
}

function SecondaryDeadEnd({ label, icon, tooltip }) {
  return (
    <ActionTooltip text={tooltip}>
      <button disabled style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 7,
        fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, cursor: 'not-allowed',
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 13 }} />}
        {label}
      </button>
    </ActionTooltip>
  );
}

function IconButton({ icon, onClick, tooltip, danger, active }) {
  const btn = (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 6, border: `1px solid ${active ? C.primary : C.border}`,
      background: active ? C.blueLight : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: danger ? C.danger : active ? C.primary : C.textSecondary,
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 13.5 }} />
    </button>
  );
  return tooltip ? <ActionTooltip text={tooltip}>{btn}</ActionTooltip> : btn;
}

function TruncatedCell({ text, maxChars, style }) {
  const safe = text || '';
  const isTruncated = safe.length > maxChars;
  const display = isTruncated ? `${safe.slice(0, maxChars).trimEnd()}…` : safe;
  const boxStyle = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, ...style };
  if (!isTruncated) return <div style={boxStyle}>{display}</div>;
  return (
    <ActionTooltip text={safe}>
      <div style={{ ...boxStyle, cursor: 'default' }}>{display}</div>
    </ActionTooltip>
  );
}

function ModalShell({ title, onClose, children, footer, width }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: width || 480, maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: C.white, borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{title}</div>
          <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSecondary }}>
            <i className="ti ti-x" style={{ fontSize: 15 }} />
          </div>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', height: 38, boxSizing: 'border-box',
  background: '#F8F9FA', border: `1px solid #E8ECF0`, borderRadius: 6,
  padding: '0 11px', fontFamily: F.body, fontSize: 13, color: C.textPrimary,
};
const CANCEL_BTN_STYLE = { padding: '8px 16px', background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 7, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, cursor: 'pointer' };

function ReadonlyBox({ value, icon }) {
  return (
    <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F1F5F9', color: value ? C.textPrimary : C.textTertiary, gap: 6 }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 11, color: C.textTertiary }} />}
      {value || 'Set once a Product is selected above'}
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontFamily: F.body, fontSize: 12, color: '#B91C1C' }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 14, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && <button onClick={onRetry} style={{ background: 'none', border: 'none', color: '#B91C1C', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>Retry</button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════
const CUSTOMER_TYPES = PERSONAS; // "Persona" filter option set — same vocabulary as the Campaign form's Persona field.
// Matches PromotionCampaign.Status exactly (see services.ALLOWED_STATUS_
// TRANSITIONS) — used both for the roster filter and the transition-button
// state machine mirrored client-side below (server is the real guard).
const CAMPAIGN_STATUSES = ['Draft', 'Scheduled', 'Active', 'Paused', 'Completed', 'Cancelled'];
const RUNNING_STATUSES = ['Active', 'Paused'];
const TARGET_TYPES = ['Single Property', 'Multi-Property Portfolio'];
const SORT_OPTIONS = ['Newest First', 'Highest Budget', 'Ending Soonest'];

// Mirrors services.ALLOWED_STATUS_TRANSITIONS (promotion_engine/services.py)
// — client-side copy purely to decide which action buttons to offer; the
// server re-validates every transition regardless.
const ALLOWED_TRANSITIONS = {
  Draft: ['Scheduled', 'Cancelled'],
  Scheduled: ['Active', 'Cancelled'],
  Active: ['Paused', 'Completed'],
  Paused: ['Active', 'Completed'],
  Completed: [],
  Cancelled: [],
};
const TRANSITION_BUTTON = {
  Scheduled: { label: 'Schedule', icon: 'ti-calendar-event' },
  Active: { label: 'Activate', icon: 'ti-player-play' },
  Paused: { label: 'Pause', icon: 'ti-player-pause' },
  Completed: { label: 'Complete', icon: 'ti-circle-check' },
  Cancelled: { label: 'Cancel', icon: 'ti-ban' },
};

// Sep 29, 2026 — Customer column replaced with Campaign # (the real
// campaign_number, already unique) at the user's request: a Campaign row is
// always exactly one customer's run already (see the chat discussion — UN
// Admin creates Campaigns directly, there's no self-service "adopt a
// template" flow yet, decision 22), so "Customer" here was never a count or
// identity worth its own column the way Campaign # is. Customer isn't
// dropped — it's shown in the Detail panel's Overview section below instead.
// Sep 29, 2026 — Product & Plan split into two separate columns (was one
// combined cell) and every roster cell that can hold free-typed data
// (Campaign #, Product, Plan) now truncates at a fixed character count with
// a tooltip for the full value, same pattern Campaign Name already used —
// fixed-width px columns for the truncated fields keep the grid from
// re-flowing/overlapping as row data varies, with Campaign Name and Actions
// left flexible.
// Campaign Name is a fixed width here too (was `minmax(0, 1fr)`, which grabbed
// all the roster's leftover width and read as a huge, uneven gap before the
// next column — the grid's own `gap` was already uniform, the column track
// itself wasn't). Fixed widths on every column keep the visual spacing even
// and the whole row narrow enough to fit without the horizontal scrollbar
// the old 1fr track used to force.
// Column widths below are sized from actual rendered text widths (measured
// headlessly against this file's real truncation caps — CAMPAIGN_NAME_MAX_CHARS=16,
// CAMPAIGN_NUMBER_MAX_CHARS/PRODUCT_PLAN_MAX_CHARS=12 — plus a consistent
// ~14px buffer per column), not guessed round numbers. The CSS `gap` below
// was always a uniform 12px between every column; what actually varied was
// the *leftover space inside* each fixed-width track once its (left-aligned,
// non-stretched) text rendered — Campaign Name was reserving ~176px for text
// that only ever renders ~85-115px wide, so ~60-90px of dead air preceded
// its 12px gap, while Product/Plan's 122px track was already nearly exactly
// as wide as their longest real value, leaving it almost no slack at all.
// Same buffer on every truncated column now, so the visible gap reads far
// more even row to row (never pixel-identical — that needs monospace or
// fixed-length content, which Campaign #'s column now effectively has).
const ROSTER_GRID_COLS = '130px 104px 134px 120px 108px 90px 110px 88px';
const CAMPAIGN_NAME_MAX_CHARS = 16;
const CAMPAIGN_NUMBER_MAX_CHARS = 12;
const PRODUCT_PLAN_MAX_CHARS = 12;

export function fmtNum(n) { return Number(n || 0).toLocaleString(); }
export function fmtMoney(n) { return n === null || n === undefined || n === '' ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`; }

// ═══════════════════════════════════════════════════════════════════════════
// COMPAT EXPORTS — restored Sep 29, 2026, post-wiring build break.
// pct()/productFor()/SAMPLE_CAMPAIGNS are NOT used anywhere in this file
// anymore (the real Campaigns screen above fetches real Campaigns via
// apiListCampaigns and computes conversion rates from real stored counts
// where that data exists at all). They're kept only because
// PromotionAnalyticsPanel.jsx / PromotionAuditLogPanel.jsx /
// PromotionOverview.jsx — out of scope for this wiring pass — still import
// all three and still run entirely on this same sample data (no analytics
// pipeline exists yet to wire them to for real — see the Phase 6 "known
// gaps" note in the project doc). Removing these exports broke the whole
// app's build. Do not extend this block — delete it, and the sibling
// SAMPLE_PRODUCTS block in PromotionProductCatalog.jsx, once those three
// tabs get wired for real instead.
export function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
export const SAMPLE_CAMPAIGNS = [
  {
    id: 'CMP001', campaignName: 'ABC Apartments — Fall Push', campaignType: 'Featured Campaign', productId: 1, planDuration: '30 Days', durationDays: 30,
    customerName: 'ABC Property Mgmt', customerType: 'Org PM',
    market: 'US', targetType: 'Single Property',
    targetProperty: 'ABC Apartments', targetLocation: 'Dallas, TX',
    targetUnits: 48, targetBreakdown: '48 Units selected across Tower A & Tower B',
    status: 'Active', startDate: '2026-09-20', endDate: '2026-10-20',
    timezone: 'America/Chicago (CDT)', jurisdiction: 'United States (US-FED)',
    impressions: 18420, views: 1240, clicks: 318, leads: 42, applications: 8, leases: 2,
    invoiceId: 'INV-00123', invoiceAmount: 3792, invoiceStatus: 'Paid Full',
    performanceTrend: '↑ 18% vs. last 7 days', timeRemaining: '25 Days Remaining', knownIssues: 'None (Optimal)',
  },
  {
    id: 'CMP002', campaignName: 'Bayview Residences Boost', campaignType: 'Featured Campaign', productId: 1, planDuration: '30 Days', durationDays: 30,
    customerName: 'XYZ Property Mgmt', customerType: 'Ind PM',
    market: 'US', targetType: 'Single Property',
    targetProperty: 'Bayview Residences', targetLocation: 'Austin, TX',
    targetUnits: 12, targetBreakdown: '12 Units selected across Building 2',
    status: 'Paused', startDate: '2026-09-05', endDate: '2026-10-05',
    timezone: 'America/Chicago (CDT)', jurisdiction: 'United States (US-FED)',
    impressions: 8920, views: 612, clicks: 142, leads: 19, applications: 3, leases: 1,
    invoiceId: 'INV-00119', invoiceAmount: 2150, invoiceStatus: 'Partially Paid',
    performanceTrend: '— Paused, no new data', timeRemaining: 'Paused — 10 Days Left', knownIssues: 'Budget Cap Reached',
  },
  {
    id: 'CMP003', campaignName: 'Sunset Villas Quick List', campaignType: 'Featured Campaign', productId: 1, planDuration: '7 Days', durationDays: 7,
    customerName: 'John Smith', customerType: 'Landlord',
    market: 'India', targetType: 'Single Property',
    targetProperty: 'Sunset Villas — Unit 4B', targetLocation: 'Mumbai, MH',
    targetUnits: 1, targetBreakdown: '1 Unit — single listing',
    status: 'Completed', startDate: '2026-09-01', endDate: '2026-09-08',
    timezone: 'Asia/Kolkata (IST)', jurisdiction: 'India (IN-FED)',
    impressions: 3150, views: 298, clicks: 54, leads: 6, applications: 1, leases: 0,
    invoiceId: 'INV-00108', invoiceAmount: 420, invoiceStatus: 'Paid Full',
    performanceTrend: 'Final: 3,150 impressions', timeRemaining: 'Completed', knownIssues: 'None',
  },
  {
    id: 'CMP004', campaignName: 'Highline Towers Sponsored Drive', campaignType: 'Sponsored Campaign', productId: 3, planDuration: '30 Days', durationDays: 30,
    customerName: 'Highline Metro Res.', customerType: 'Org PM',
    market: 'US', targetType: 'Single Property',
    targetProperty: 'Highline Towers', targetLocation: 'Chicago, IL',
    targetUnits: 24, targetBreakdown: '24 Units selected across Tower C',
    status: 'Scheduled', startDate: '2026-10-01', endDate: '2026-10-31',
    timezone: 'America/Chicago (CDT)', jurisdiction: 'United States (US-FED)',
    impressions: 0, views: 0, clicks: 0, leads: 0, applications: 0, leases: 0,
    invoiceId: 'INV-00131', invoiceAmount: 2860, invoiceStatus: 'Not Yet Billed',
    performanceTrend: 'Not yet started', timeRemaining: 'Starts in 6 Days', knownIssues: 'None (Optimal)',
  },
  {
    id: 'CMP005', campaignName: 'Q4 Meridian Push', campaignType: 'Homepage Spotlight Campaign', productId: 4, planDuration: '30 Days', durationDays: 30,
    customerName: 'Meridian Group Holdings', customerType: 'Org PM',
    market: 'US', targetType: 'Multi-Property Portfolio',
    targetProperty: 'Meridian Portfolio', targetLocation: '12 Properties — US & India',
    targetUnits: 210, targetBreakdown: '210 Units across 12 properties, 2 markets',
    status: 'Draft', startDate: '', endDate: '',
    timezone: '—', jurisdiction: 'United States + India',
    impressions: 0, views: 0, clicks: 0, leads: 0, applications: 0, leases: 0,
    invoiceId: '—', invoiceAmount: 0, invoiceStatus: 'Not Yet Billed',
    performanceTrend: 'Not yet started', timeRemaining: 'Not Scheduled', knownIssues: 'Missing creative assets',
  },
  {
    id: 'CMP006', campaignName: 'Lakeside Commons Renewal', campaignType: 'Featured Campaign', productId: 1, planDuration: '30 Days', durationDays: 30,
    customerName: 'Lakeside Property Partners', customerType: 'Ind PM',
    market: 'US', targetType: 'Single Property',
    targetProperty: 'Lakeside Commons', targetLocation: 'Austin, TX',
    targetUnits: 30, targetBreakdown: '30 Units selected across Lakeside Commons',
    status: 'Active', startDate: '2026-09-10', endDate: '2026-10-10',
    timezone: 'America/Chicago (CDT)', jurisdiction: 'United States (US-FED)',
    impressions: 11200, views: 845, clicks: 201, leads: 27, applications: 5, leases: 1,
    invoiceId: 'INV-00115', invoiceAmount: 1890, invoiceStatus: 'Paid Full',
    performanceTrend: '↑ 9% vs. last 7 days', timeRemaining: '15 Days Remaining', knownIssues: 'None (Optimal)',
  },
];
export function productFor(campaign) {
  return SAMPLE_PRODUCTS.find(p => p.id === campaign.productId) || SAMPLE_PRODUCTS[0];
}

function statusTone(status) {
  return { Active: 'green', Paused: 'amber', Completed: 'grey', Scheduled: 'blue', Draft: 'grey', Cancelled: 'grey' }[status] || 'grey';
}
function daysRemaining(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(`${endDate}T00:00:00`) - new Date(new Date().toDateString());
  return Math.round(diffMs / 86400000);
}

// ─── Campaign list item <-> API shape ──────────────────────────────────────
function campaignListItemFromApi(c) {
  return {
    id: c.id, campaignNumber: c.campaign_number, campaignName: c.campaign_name || c.campaign_number,
    campaignType: c.campaign_type, productId: c.product, productName: c.product_name,
    planId: c.plan, planName: c.plan_name, customerId: c.customer, customerName: c.customer_name,
    personaAtPurchase: PERSONA_FROM_API[c.persona_at_purchase] || '',
    status: statusFromApi(c.status), targetType: CAMPAIGN_TARGET_TYPE_FROM_API[c.target_type] || c.target_type,
    startDate: c.start_date, endDate: c.end_date,
    snapshotPrice: c.snapshot_price, budgetAmount: c.budget_amount, spendToDate: c.spend_to_date,
    createdAt: c.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Create/Edit Campaign modal — real Create/Update.
// ═══════════════════════════════════════════════════════════════════════════
function CampaignFormModal({ campaignId, onClose, onSaved }) {
  const isEdit = !!campaignId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductFull, setSelectedProductFull] = useState(null);
  const [plansForProduct, setPlansForProduct] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPlanFull, setSelectedPlanFull] = useState(null);
  const [addedFeatures, setAddedFeatures] = useState([]);

  const [form, setForm] = useState({
    campaignName: '', personaAtPurchase: PERSONAS[0], targetType: TARGET_TYPES[0],
    startDate: '', endDate: '', campaignTimezone: '', jurisdiction: '',
    budgetAmount: '', dailyCap: '', pacingMode: 'Standard', biddingStrategy: 'Automatic',
  });
  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Product catalog for the picker — fetched once.
  useEffect(() => {
    apiListProducts().then(setProducts).catch(() => {});
  }, []);

  // Editing an existing campaign: load it, lock Product/Plan (backend won't
  // accept changing them after creation).
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    apiGetCampaign(campaignId).then(c => {
      if (cancelled) return;
      setSelectedProductId(String(c.product || ''));
      setSelectedPlanId(String(c.plan || ''));
      setForm({
        campaignName: c.campaign_name || '',
        personaAtPurchase: PERSONA_FROM_API[c.persona_at_purchase] || PERSONAS[0],
        targetType: CAMPAIGN_TARGET_TYPE_FROM_API[c.target_type] || TARGET_TYPES[0],
        startDate: c.start_date || '', endDate: c.end_date || '',
        campaignTimezone: c.campaign_timezone || '', jurisdiction: c.jurisdiction || '',
        budgetAmount: c.budget_amount ?? '', dailyCap: c.daily_cap ?? '',
        pacingMode: PACING_FROM_API[c.pacing_mode] || 'Standard',
        biddingStrategy: BIDDING_FROM_API[c.bidding_strategy] || 'Automatic',
      });
    }).catch(err => !cancelled && setError(err.message || 'Failed to load campaign.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Selected Product changed -> fetch its full record + its Plans.
  useEffect(() => {
    if (!selectedProductId) { setSelectedProductFull(null); setPlansForProduct([]); return; }
    apiGetProduct(selectedProductId).then(setSelectedProductFull).catch(() => {});
    apiListPlans({ product: selectedProductId }).then(setPlansForProduct).catch(() => {});
  }, [selectedProductId]);

  // Selected Plan changed -> fetch its full record (for the granted-feature
  // preview — the real plan_snapshot itself is only computed server-side at
  // creation, from the Plan's live state at that moment).
  useEffect(() => {
    if (!selectedPlanId) { setSelectedPlanFull(null); return; }
    apiGetPlan(selectedPlanId).then(setSelectedPlanFull).catch(() => {});
  }, [selectedPlanId]);

  const grantedSet = useMemo(() => {
    if (!selectedPlanFull) return new Set();
    return new Set(CAMPAIGN_FEATURE_KEYS.filter(f => !!selectedPlanFull[CAMPAIGN_FEATURE_KEY_TO_API[f.key]]).map(f => f.key));
  }, [selectedPlanFull]);
  const availableFeatures = selectedProductFull
    ? CAMPAIGN_FEATURE_KEYS.filter(f => f.gateKey === null || selectedProductFull[camelToSnake(f.gateKey)])
    : [];
  const grantedFeatures = availableFeatures.filter(f => grantedSet.has(f.key));
  const addableFeatures = availableFeatures.filter(f => !grantedSet.has(f.key));
  const canAddFeatures = !isEdit; // add-ons are only offered at creation time in this form; once the campaign exists, manage them from the Detail panel (server also re-gates on Draft/Scheduled there).
  const toggleAddedFeature = key => {
    if (!canAddFeatures) return;
    setAddedFeatures(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const addOnTotal = addedFeatures.reduce((sum, k) => sum + Number(selectedProductFull?.feature_addon_prices?.[CAMPAIGN_FEATURE_KEY_TO_API[k]] || 0), 0);

  const handleSave = async () => {
    if (!isEdit && !selectedProductId) { setError('Select a Product.'); return; }
    if (!isEdit && !selectedPlanId) { setError('Select a Plan.'); return; }
    if (!form.campaignName.trim()) { setError('Campaign Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        campaign_name: form.campaignName,
        persona_at_purchase: PERSONA_TO_API[form.personaAtPurchase] || '',
        target_type: CAMPAIGN_TARGET_TYPE_TO_API[form.targetType] || '',
        start_date: form.startDate || null, end_date: form.endDate || null,
        campaign_timezone: form.campaignTimezone, jurisdiction: form.jurisdiction,
        budget_amount: form.budgetAmount === '' ? null : form.budgetAmount,
        daily_cap: form.dailyCap === '' ? null : form.dailyCap,
        pacing_mode: PACING_TO_API[form.pacingMode] || '',
        bidding_strategy: BIDDING_TO_API[form.biddingStrategy] || '',
      };
      let saved;
      if (isEdit) {
        saved = await apiUpdateCampaign(campaignId, payload);
      } else {
        payload.product = Number(selectedProductId);
        payload.plan = Number(selectedPlanId);
        saved = await apiCreateCampaign(payload);
        // Feature add-ons can only be attached once the Campaign (and its
        // real id) exist — fired sequentially right after creation, while
        // it's still Draft, exactly the window the backend allows this in.
        for (const key of addedFeatures) {
          try { await apiAddCampaignFeatureAddon(saved.id, CAMPAIGN_FEATURE_KEY_TO_API[key]); }
          catch { /* best-effort — surfaced already via the campaign existing; a failed add-on doesn't roll back the campaign */ }
        }
      }
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Failed to save campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? `Edit Campaign — ${form.campaignName}` : 'New Campaign'}
      onClose={onClose}
      width={680}
      footer={<>
        <button onClick={onClose} style={CANCEL_BTN_STYLE}>Cancel</button>
        <PrimaryButton
          label={saving ? 'Saving…' : (isEdit ? 'Save Changes' : `Create Campaign${addedFeatures.length ? ` (+${addedFeatures.length} add-ons, $${addOnTotal})` : ''}`)}
          icon="ti-device-floppy" onClick={handleSave} disabled={saving || loading}
        />
      </>}
    >
      <ErrorBanner message={error} />
      {loading ? (
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, padding: '20px 0', textAlign: 'center' }}>Loading campaign…</div>
      ) : (
        <>
          <Field label="Campaign Name">
            <input style={inputStyle} value={form.campaignName} onChange={e => setField('campaignName', e.target.value)} placeholder="e.g. Q4 Meridian Push" />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <i className="ti ti-package" style={{ fontSize: 14, color: C.textSecondary }} />
            <span style={{ fontFamily: F.headline, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Product &amp; Plan{isEdit ? ' (locked after creation)' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Product">
                {isEdit ? (
                  <ReadonlyBox value={selectedProductFull?.name} icon="ti-lock" />
                ) : (
                  <CustomDropdown
                    placeholder="Select a Product…"
                    options={products.map(p => ({ value: String(p.id), label: p.name }))}
                    value={selectedProductId}
                    onChange={v => { setSelectedProductId(v); setSelectedPlanId(''); setAddedFeatures([]); }}
                  />
                )}
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Plan">
                {isEdit ? (
                  <ReadonlyBox value={selectedPlanFull?.name} icon="ti-lock" />
                ) : (
                  <CustomDropdown
                    placeholder={selectedProductId ? 'Select a Plan…' : 'Select a Product first…'}
                    options={plansForProduct.map(p => ({ value: String(p.id), label: `${p.name} — $${p.price} / ${p.duration_days}d` }))}
                    value={selectedPlanId}
                    onChange={v => { setSelectedPlanId(v); setAddedFeatures([]); }}
                  />
                )}
              </Field>
            </div>
          </div>
          {selectedProductFull && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><Field label="Product Code"><ReadonlyBox icon="ti-barcode" value={selectedProductFull.code} /></Field></div>
              <div style={{ flex: 1 }}>
                <Field label="Product Markets">
                  <div style={{ ...inputStyle, height: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9' }}>
                    {(selectedProductFull.markets || []).map(code => {
                      const feCode = MARKET_FROM_API[code] || code;
                      return (
                        <ActionTooltip key={code} text={MARKET_BY_CODE[feCode]?.name || feCode}>
                          <span style={{ fontSize: 17, lineHeight: 1, cursor: 'default' }}>{MARKET_BY_CODE[feCode]?.flag || feCode}</span>
                        </ActionTooltip>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </div>
          )}

          {selectedProductFull && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '18px 0 12px' }}>
                <i className="ti ti-toggle-right" style={{ fontSize: 14, color: C.textSecondary }} />
                <span style={{ fontFamily: F.headline, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Campaign Features</span>
              </div>
              {!isEdit && !selectedPlanFull ? (
                <div style={{ ...inputStyle, height: 'auto', background: '#F1F5F9', color: C.textTertiary, padding: '9px 11px' }}>
                  Select a Plan above to see which features it grants.
                </div>
              ) : isEdit ? (
                <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>
                  Manage feature add-ons from the Campaign Detail panel (Draft/Scheduled campaigns only).
                </div>
              ) : (
                <>
                  <Field label="Included in Your Plan (protected)">
                    {grantedFeatures.length === 0 ? (
                      <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>This Plan doesn't grant any of this Product's features by default.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
                        {grantedFeatures.map(f => (
                          <ActionTooltip key={f.key} text="Included with the selected Plan — not editable per-campaign.">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, minWidth: 190, cursor: 'not-allowed' }}>
                              <input type="checkbox" checked disabled />{f.label}
                              <i className="ti ti-lock" style={{ fontSize: 11, color: C.textTertiary }} />
                            </label>
                          </ActionTooltip>
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label={`Add More Features to This Campaign${addedFeatures.length ? ` (${addedFeatures.length} added)` : ''}`}>
                    {(() => {
                      // addableFeatures = supported by the Product but not already
                      // granted by the Plan. Of those, only the ones the Product has
                      // a feature_addon_price set for can actually be added — price
                      // always comes from the Product (decision 23), never entered
                      // here, so an unpriced feature has nothing to charge and can't
                      // be offered. Split these into two groups instead of silently
                      // dropping the unpriced ones, so "supported but nothing to add"
                      // doesn't look identical to "nothing more is supported at all."
                      const priceable = [];
                      const unpriced = [];
                      for (const f of addableFeatures) {
                        const apiKey = CAMPAIGN_FEATURE_KEY_TO_API[f.key];
                        const hasPrice = selectedProductFull.feature_addon_prices && (apiKey in selectedProductFull.feature_addon_prices);
                        (hasPrice ? priceable : unpriced).push(f);
                      }
                      if (addableFeatures.length === 0) {
                        return <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>This Plan already includes everything the Product supports.</div>;
                      }
                      return (
                        <>
                          {priceable.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
                              {priceable.map(f => {
                                const checked = addedFeatures.includes(f.key);
                                const price = Number(selectedProductFull.feature_addon_prices?.[CAMPAIGN_FEATURE_KEY_TO_API[f.key]] || 0);
                                return (
                                  <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 190, fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleAddedFeature(f.key)} />
                                    {f.label}
                                    {price > 0 && <span style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>+${price}</span>}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {unpriced.length > 0 && (
                            <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginTop: priceable.length > 0 ? 8 : 0, fontStyle: 'italic' }}>
                              This Product also supports {unpriced.map(f => f.label).join(', ')}, but no add-on price is set for {unpriced.length === 1 ? 'it' : 'them'} yet — edit this Product in Product Catalog and set a price under "Feature Add-on Pricing" to offer {unpriced.length === 1 ? 'it' : 'them'} here.
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </Field>
                </>
              )}
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '18px 0 12px' }}>
            <i className="ti ti-speakerphone" style={{ fontSize: 14, color: C.textSecondary }} />
            <span style={{ fontFamily: F.headline, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Campaign Details</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Persona"><CustomDropdown options={PERSONAS.map(p => ({ value: p, label: p }))} value={form.personaAtPurchase} onChange={v => setField('personaAtPurchase', v)} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Target Type"><CustomDropdown options={TARGET_TYPES.map(o => ({ value: o, label: o }))} value={form.targetType} onChange={v => setField('targetType', v)} /></Field></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Start Date"><input type="date" style={inputStyle} value={form.startDate} onChange={e => setField('startDate', e.target.value)} /></Field></div>
            <div style={{ flex: 1 }}><Field label="End Date"><input type="date" style={inputStyle} value={form.endDate} onChange={e => setField('endDate', e.target.value)} /></Field></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Timezone"><input style={inputStyle} value={form.campaignTimezone} onChange={e => setField('campaignTimezone', e.target.value)} placeholder="e.g. America/Chicago (CDT)" /></Field></div>
            <div style={{ flex: 1 }}><Field label="Jurisdiction"><input style={inputStyle} value={form.jurisdiction} onChange={e => setField('jurisdiction', e.target.value)} placeholder="e.g. United States (US-FED)" /></Field></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Budget ($)"><input style={inputStyle} value={form.budgetAmount} onChange={e => setField('budgetAmount', e.target.value)} placeholder="0.00" /></Field></div>
            <div style={{ flex: 1 }}><Field label="Daily Cap ($, optional)"><input style={inputStyle} value={form.dailyCap} onChange={e => setField('dailyCap', e.target.value)} placeholder="Unlimited" /></Field></div>
            <div style={{ flex: 1 }}><Field label="Pacing"><CustomDropdown options={['Standard', 'Accelerated'].map(o => ({ value: o, label: o }))} value={form.pacingMode} onChange={v => setField('pacingMode', v)} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Bidding Strategy"><CustomDropdown options={['Automatic', 'Manual'].map(o => ({ value: o, label: o }))} value={form.biddingStrategy} onChange={v => setField('biddingStrategy', v)} /></Field></div>
          </div>

          <div style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5 }}>
            <i className="ti ti-info-circle" style={{ marginRight: 5, color: C.textTertiary }} />
            New campaigns always start as Draft. Use the status actions in the Campaign Detail panel to Schedule, Activate, Pause, Complete, or Cancel — Targets (real Listings/Property Listings) are also managed there once the campaign exists.
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Targets manager — real PromotionCampaignTarget rows.
// ═══════════════════════════════════════════════════════════════════════════
function TargetsManager({ campaignId, targets, onChanged }) {
  const [listingId, setListingId] = useState('');
  const [propertyListingId, setPropertyListingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!listingId && !propertyListingId) { setError('Enter a Listing id or a Property Listing id.'); return; }
    setBusy(true); setError('');
    try {
      await apiCreateCampaignTarget(campaignId, { listingId: listingId || null, propertyListingId: propertyListingId || null });
      setListingId(''); setPropertyListingId('');
      onChanged();
    } catch (err) { setError(err.message || 'Failed to add target.'); }
    finally { setBusy(false); }
  };
  const handleRemove = async (targetId) => {
    setBusy(true); setError('');
    try { await apiDeleteCampaignTarget(campaignId, targetId); onChanged(); }
    catch (err) { setError(err.message || 'Failed to remove target.'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <ErrorBanner message={error} />
      {targets.length === 0 ? (
        <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, marginBottom: 10 }}>No targets added yet.</div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          {targets.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.neutral}`, fontFamily: F.body, fontSize: 12.5 }}>
              <span>{t.listing ? `Listing #${t.listing}` : `Property Listing #${t.property_listing}`}</span>
              <IconButton icon="ti-trash" danger onClick={() => handleRemove(t.id)} tooltip="Remove target" />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginBottom: 3 }}>Listing ID</div>
          <input type="number" style={{ ...inputStyle, height: 32 }} value={listingId} onChange={e => { setListingId(e.target.value); setPropertyListingId(''); }} placeholder="e.g. 42" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginBottom: 3 }}>or Property Listing ID</div>
          <input type="number" style={{ ...inputStyle, height: 32 }} value={propertyListingId} onChange={e => { setPropertyListingId(e.target.value); setListingId(''); }} placeholder="e.g. 7" />
        </div>
        <PrimaryButton small label="Add" icon="ti-plus" onClick={handleAdd} disabled={busy} />
      </div>
      <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 6 }}>
        No cross-tenant Listing/Property Listing browser is wired up yet — enter the numeric id directly (findable in Django Admin).
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Feature add-ons manager — real PromotionCampaignFeatureAddon rows.
// ═══════════════════════════════════════════════════════════════════════════
function FeatureAddonsManager({ campaign, onChanged }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const addedKeys = new Set((campaign.feature_addons || []).map(a => a.feature_key));
  const grantedKeys = new Set(Object.entries(campaign.plan_snapshot || {}).filter(([, v]) => v === true).map(([k]) => k));
  const canEdit = !campaign.is_running && !['COMPLETED', 'CANCELLED'].includes(campaign.status);

  const offerable = CAMPAIGN_FEATURE_KEYS.filter(f => {
    const apiKey = CAMPAIGN_FEATURE_KEY_TO_API[f.key];
    return !grantedKeys.has(apiKey) && !addedKeys.has(apiKey)
      && campaign.product_feature_addon_prices && (apiKey in campaign.product_feature_addon_prices);
  });

  const handleToggle = async (feKey) => {
    const apiKey = CAMPAIGN_FEATURE_KEY_TO_API[feKey];
    setBusy(true); setError('');
    try {
      if (addedKeys.has(apiKey)) {
        const row = campaign.feature_addons.find(a => a.feature_key === apiKey);
        await apiRemoveCampaignFeatureAddon(campaign.id, row.id);
      } else {
        await apiAddCampaignFeatureAddon(campaign.id, apiKey);
      }
      onChanged();
    } catch (err) { setError(err.message || 'Failed to update feature add-on.'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <ErrorBanner message={error} />
      {!canEdit && (
        <div style={{ marginBottom: 8, fontFamily: F.body, fontSize: 11.5, color: C.amberText || '#B45309', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-lock" style={{ fontSize: 12 }} /> Locked — add-ons can only change while the campaign is Draft or Scheduled.
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px' }}>
        {[...grantedKeys].map(apiKey => {
          const fe = CAMPAIGN_FEATURE_KEYS.find(f => CAMPAIGN_FEATURE_KEY_TO_API[f.key] === apiKey);
          return (
            <span key={apiKey} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: F.body, fontSize: 11, color: C.textSecondary, background: '#F1F5F9', borderRadius: 999, padding: '4px 10px' }}>
              <i className="ti ti-lock" style={{ fontSize: 10 }} />{fe?.label || apiKey}
            </span>
          );
        })}
        {(campaign.feature_addons || []).map(a => (
          <span key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.body, fontSize: 11, color: C.primary, background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 999, padding: '4px 6px 4px 10px' }}>
            {CAMPAIGN_FEATURE_KEY_FROM_API_LABEL(a.feature_key)} (+${a.price})
            {canEdit && (
              <button
                onClick={() => handleToggle(Object.keys(CAMPAIGN_FEATURE_KEY_TO_API).find(k => CAMPAIGN_FEATURE_KEY_TO_API[k] === a.feature_key))}
                disabled={busy}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, display: 'flex' }}
              >
                <i className="ti ti-x" style={{ fontSize: 11 }} />
              </button>
            )}
          </span>
        ))}
      </div>
      {canEdit && offerable.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {offerable.map(f => (
            <button key={f.key} disabled={busy} onClick={() => handleToggle(f.key)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999,
              border: `1px dashed ${C.border}`, background: C.white, fontFamily: F.body, fontSize: 11, color: C.textSecondary, cursor: 'pointer',
            }}>
              <i className="ti ti-plus" style={{ fontSize: 10 }} />{f.label} (+${Number(campaign.product_feature_addon_prices[CAMPAIGN_FEATURE_KEY_TO_API[f.key]] || 0)})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function CAMPAIGN_FEATURE_KEY_FROM_API_LABEL(apiKey) {
  const fe = CAMPAIGN_FEATURE_KEYS.find(f => CAMPAIGN_FEATURE_KEY_TO_API[f.key] === apiKey);
  return fe?.label || apiKey;
}

// ═══════════════════════════════════════════════════════════════════════════
// Campaign Detail inspector — real data throughout except the explicitly
// marked "not available yet" analytics panel (no engagement/billing
// pipeline exists in the backend at all — see header note).
// ═══════════════════════════════════════════════════════════════════════════
function CampaignDetailPanel({ campaignId, onEdit, onDeleted, refreshToken }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const load = () => {
    setLoading(true); setError('');
    apiGetCampaign(campaignId)
      .then(async c => {
        // Feature-addon pricing lives on the Product, not the Campaign —
        // fetched alongside so FeatureAddonsManager can show real prices
        // for offerable (not-yet-added) features.
        let productPrices = {};
        if (c.product) { try { const p = await apiGetProduct(c.product); productPrices = p.feature_addon_prices || {}; } catch { /* non-fatal */ } }
        setCampaign({ ...c, product_feature_addon_prices: productPrices });
      })
      .catch(err => setError(err.message || 'Failed to load campaign.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [campaignId, refreshToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTransition = async (newStatus) => {
    setTransitioning(true); setError('');
    try { await apiTransitionCampaignStatus(campaignId, statusToApi(newStatus)); load(); }
    catch (err) { setError(err.message || 'Failed to change status.'); }
    finally { setTransitioning(false); }
  };
  const handleDelete = async () => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    try { await apiDeleteCampaign(campaignId); onDeleted(); }
    catch (err) { window.alert(err.message || 'Failed to delete campaign.'); }
  };

  if (loading) return <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, padding: '20px 0', textAlign: 'center' }}>Loading campaign…</div>;
  if (!campaign) return <ErrorBanner message={error} onRetry={load} />;

  const status = statusFromApi(campaign.status);
  const nextStatuses = ALLOWED_TRANSITIONS[status] || [];
  const remaining = daysRemaining(campaign.end_date);

  const SectionHeading = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 13, color: C.textSecondary }} />
      <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 500, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</span>
    </div>
  );
  const Panel = ({ children, style }) => (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 14, ...style }}>{children}</div>
  );
  const Row = ({ label, value, valueNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.neutral}`, fontFamily: F.body, fontSize: 12.5 }}>
      <span style={{ color: C.textSecondary, fontWeight: 500 }}>{label}</span>
      {valueNode || <span style={{ color: C.textPrimary, fontWeight: 500, textAlign: 'right' }}>{value}</span>}
    </div>
  );
  const StatBox = ({ label, value, highlight }) => (
    <div style={{ flex: '1 1 30%', minWidth: 100, background: highlight ? '#ECFDF5' : C.neutral, borderRadius: 8, padding: '9px 10px' }}>
      <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 500, color: highlight ? '#047857' : C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 500, color: highlight ? '#047857' : C.textPrimary }}>{value}</div>
    </div>
  );

  return (
    <div style={{ marginTop: 8 }}>
      <ErrorBanner message={error} />
      <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Campaign Detail</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <span style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 500, color: C.textPrimary }}>{campaign.campaign_name || campaign.campaign_number}</span>
        <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 500, color: C.textTertiary }}>{campaign.campaign_number}</span>
        <StatusPill status={status} tone={statusTone(status)} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {nextStatuses.map(next => (
            <PrimaryButton key={next} small label={TRANSITION_BUTTON[next]?.label || next} icon={TRANSITION_BUTTON[next]?.icon || 'ti-arrow-right'} onClick={() => handleTransition(next)} disabled={transitioning}
              style={next === 'Cancelled' ? { background: C.white, color: C.danger, border: `1px solid ${C.danger}` } : undefined} />
          ))}
          <IconButton icon="ti-pencil" onClick={() => onEdit(campaign.id)} tooltip="Edit campaign" />
          <IconButton icon="ti-trash" danger onClick={handleDelete} tooltip="Delete campaign" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 420px', minWidth: 320 }}>
          <Panel>
            <SectionHeading icon="ti-calendar-event">A. Overview &amp; Schedule</SectionHeading>
            <Row label="Persona" value={PERSONA_FROM_API[campaign.persona_at_purchase] || '—'} />
            <Row label="Customer" value={campaign.customer_name || '—'} />
            <Row label="Product & Plan" valueNode={
              <span style={{ textAlign: 'right' }}>
                <div style={{ color: C.textPrimary, fontWeight: 500 }}>{campaign.product_name || '—'}</div>
                <div style={{ color: C.textTertiary, fontSize: 11 }}>{campaign.plan_name || '—'}</div>
              </span>
            } />
            <Row label="Jurisdiction" value={campaign.jurisdiction || '—'} />
            <Row label="Timezone" value={campaign.campaign_timezone || '—'} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 11px' }}>
              <div>
                <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textSecondary, marginBottom: 2 }}>Campaign Period</div>
                <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.textPrimary }}>
                  {campaign.start_date ? `${campaign.start_date} → ${campaign.end_date || '—'}` : 'Not yet scheduled'}
                </div>
              </div>
              {campaign.snapshot_duration_days != null && <StatusPill status={`${campaign.snapshot_duration_days} Days Duration`} tone="blue" />}
            </div>
          </Panel>

          <Panel>
            <SectionHeading icon="ti-target">B. Targets</SectionHeading>
            <TargetsManager campaignId={campaign.id} targets={campaign.targets || []} onChanged={load} />
          </Panel>

          <Panel style={{ background: '#F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <i className="ti ti-lock" style={{ fontSize: 13, color: C.textSecondary }} />
              <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 500, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>C. Campaign Snapshot (Immutable)</span>
            </div>
            <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginBottom: 16, lineHeight: 1.5 }}>
              Captured once at creation from the Plan's live state — never updated afterward.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
              {[
                ['Snapshot Price', fmtMoney(campaign.snapshot_price)],
                ['Snapshot Duration', campaign.snapshot_duration_days != null ? `${campaign.snapshot_duration_days} days` : '—'],
                ['Snapshot Pricing Model', campaign.snapshot_pricing_model || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ flex: '1 1 40%', minWidth: 150 }}>
                  <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 500, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.textPrimary }}>{value}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <SectionHeading icon="ti-toggle-right">D. Feature Add-ons</SectionHeading>
            </div>
            <FeatureAddonsManager campaign={campaign} onChanged={load} />
          </Panel>

          <Panel>
            <SectionHeading icon="ti-currency-dollar">E. Budget &amp; Pacing</SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <StatBox label="Budget" value={fmtMoney(campaign.budget_amount)} />
              <StatBox label="Spend to Date" value={fmtMoney(campaign.spend_to_date)} highlight={Number(campaign.spend_to_date) > 0} />
              <StatBox label="Daily Cap" value={fmtMoney(campaign.daily_cap)} />
            </div>
            <Row label="Pacing" value={PACING_FROM_API[campaign.pacing_mode] || '—'} />
            <Row label="Bidding Strategy" value={BIDDING_FROM_API[campaign.bidding_strategy] || '—'} />
            <Row label="Time Remaining" value={remaining === null ? '—' : remaining < 0 ? 'Ended' : `${remaining} Days Remaining`} />
          </Panel>

          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <SectionHeading icon="ti-chart-funnel">F. Engagement Analytics</SectionHeading>
              <SampleTag />
            </div>
            <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, lineHeight: 1.5 }}>
              No impressions/clicks/leads tracking pipeline exists in the backend yet — this panel isn't fabricated data, it's just not built. See PromotionEngine_Backend_Design_Review.md for the deferred analytics scope.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Performance popup — approved wireframe (StatsPopup.dc.html, v3),
// implemented Sep 29, 2026. Opened from the roster's new "Performance" icon.
// Adoption / Reach / By-Status / Plan Mix are all computed here from real
// PromotionCampaign + PromotionCampaignTarget rows for this Product (scoped
// to either every Plan or just the row's own Plan). The Spend-vs-Budget
// TREND line is the one piece that isn't real — spend_to_date is a single
// running total on the Campaign model, not a periodic snapshot, so there's
// no real time series to plot. Only its two endpoints (total spend so far,
// total budget cap) are real; the climb between them is an illustrative
// pace, clearly tagged "SAMPLE SHAPE" via the same <SampleTag /> convention
// as the Detail panel's Engagement Analytics section. Engagement itself has
// no backend pipeline at all yet — same honest "not built" placeholder.
// ═══════════════════════════════════════════════════════════════════════════
const PERF_STATUS_COLORS = {
  // A small fixed 6-slot status scale (own convention, like statusTone()'s
  // pill colors) — validated with the dataviz skill's six-check palette
  // validator (fixed order, adjacent-pair CVD separation, contrast) for both
  // light and dark mode before use; not the app's default categorical theme.
  Draft: '#e87ba4', Scheduled: '#2a78d6', Active: '#008300',
  Paused: '#eda100', Completed: '#1baf7a', Cancelled: '#e34948',
};
function perfStatusRows(counts) {
  return CAMPAIGN_STATUSES.map(status => ({ status, color: PERF_STATUS_COLORS[status], count: counts[status] || 0 }));
}
// Fallback shown when a Product/Plan has no real Campaigns yet (or the live
// fetch failed, e.g. an expired session token) — the same wireframe layout,
// populated with clearly-labeled illustrative numbers instead of a bare
// "nothing here" state, per the user's Sep 29, 2026 request. Never mixed
// with real numbers — every figure in the popup is either all real or all
// sample, flagged either way via the banner + <SampleTag /> below.
const SAMPLE_PERF_DATA = {
  statusCounts: { Draft: 1, Scheduled: 2, Active: 4, Paused: 1, Completed: 2, Cancelled: 1 },
  distinctCustomers: 7,
  totalBudget: 18400,
  totalSpend: 9860,
  totalReach: 52,
  planMix: [['Featured 30-Day', 5], ['Featured 7-Day', 3], ['Search Boost 14-Day', 3]],
};
// Illustrative-only spend pace: the ONLY real numbers are totalSpend (the
// curve's endpoint) and totalBudget (the dashed cap line) — the climb in
// between is invented (an ease-out curve), since spend_to_date has no
// periodic snapshots behind it to plot for real. See header note above.
function trendGeometry(totalSpend, totalBudget) {
  // Sized for the side-by-side column (roughly half the popup width) rather
  // than a full-width row — see the two-panel layout below.
  const width = 460, height = 210, padL = 44, padR = 14, padT = 14, padB = 10;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const maxVal = Math.max(totalBudget, totalSpend, 1) * 1.12;
  const yFor = v => padT + plotH - (Math.min(v, maxVal) / maxVal) * plotH;
  const steps = 8;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = 1 - Math.pow(1 - t, 2); // ease-out — invented pace, real endpoint only
    points.push([padL + plotW * t, yFor(totalSpend * eased)]);
  }
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const floorY = padT + plotH;
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${floorY.toFixed(1)} L${points[0][0].toFixed(1)},${floorY.toFixed(1)} Z`;
  return { width, height, padL, padT, plotW, plotH, linePath, areaPath, capY: yFor(totalBudget), endPoint: points[points.length - 1] };
}
function SectionLabel({ icon, children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 13, color: C.textSecondary }} />
        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 500, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</span>
      </div>
      {right}
    </div>
  );
}
function StatTile({ label, value, sub }) {
  return (
    <div style={{ flex: '1 1 150px', minWidth: 130, background: C.neutral, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.textPrimary }}>{value}</div>
      {sub && <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ProductPerformancePopup({ productId, productName, planId, planName, onClose }) {
  const [campaigns, setCampaigns] = useState([]);
  const [targetCounts, setTargetCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState(planId ? 'plan' : 'product');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    apiListCampaigns({ product: productId })
      .then(async raw => {
        if (cancelled) return;
        const mapped = raw.map(campaignListItemFromApi);
        setCampaigns(mapped);
        // Reach = real PromotionCampaignTarget rows, summed across every
        // Campaign for this Product — one fetch per campaign (no batch
        // endpoint exists), run in parallel. Small campaign counts in this
        // app today make that fine; worth a real batch endpoint later if
        // Product roster sizes grow.
        const pairs = await Promise.all(mapped.map(c =>
          apiListCampaignTargets(c.id).then(ts => [c.id, (ts || []).length]).catch(() => [c.id, 0])
        ));
        if (!cancelled) setTargetCounts(Object.fromEntries(pairs));
      })
      .catch(err => !cancelled && setError(err.message || 'Failed to load performance data.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [productId]);

  const scoped = scope === 'plan' && planId ? campaigns.filter(c => c.planId === planId) : campaigns;
  const hasRealData = !loading && scoped.length > 0;
  const showSample = !loading && !hasRealData;

  const statusCounts = hasRealData
    ? Object.fromEntries(CAMPAIGN_STATUSES.map(s => [s, scoped.filter(c => c.status === s).length]))
    : SAMPLE_PERF_DATA.statusCounts;
  const statusRows = perfStatusRows(statusCounts);
  const maxStatusCount = Math.max(1, ...statusRows.map(r => r.count));

  const distinctCustomers = hasRealData
    ? new Set(scoped.map(c => c.customerId).filter(v => v !== null && v !== undefined)).size
    : SAMPLE_PERF_DATA.distinctCustomers;
  const totalBudget = hasRealData ? scoped.reduce((s, c) => s + Number(c.budgetAmount || 0), 0) : SAMPLE_PERF_DATA.totalBudget;
  const totalSpend = hasRealData ? scoped.reduce((s, c) => s + Number(c.spendToDate || 0), 0) : SAMPLE_PERF_DATA.totalSpend;
  const totalReach = hasRealData ? scoped.reduce((s, c) => s + Number(targetCounts[c.id] || 0), 0) : SAMPLE_PERF_DATA.totalReach;
  const totalCampaignsShown = hasRealData ? scoped.length : Object.values(SAMPLE_PERF_DATA.statusCounts).reduce((a, b) => a + b, 0);

  let planMix;
  if (hasRealData) {
    const planMixMap = {};
    campaigns.forEach(c => { const key = c.planName || '—'; planMixMap[key] = (planMixMap[key] || 0) + 1; });
    planMix = Object.entries(planMixMap).sort((a, b) => b[1] - a[1]);
  } else {
    planMix = SAMPLE_PERF_DATA.planMix;
  }
  // In Sample Data mode, show Plan Mix regardless of the scope toggle — it's
  // illustrative either way, and hiding it behind "All Plans" made it look
  // missing rather than just not-yet-toggled-to (the user's Sep 29 feedback
  // on the wireframe). With real data, keep it gated to the "All Plans" view
  // so it isn't shown redundantly when already narrowed to one Plan.
  const showPlanMix = showSample || (scope === 'product' && planMix.length > 1);
  const geo = trendGeometry(totalSpend, totalBudget);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: 880, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: C.white, borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Performance — {productName || 'Product'}{scope === 'plan' && planName ? ` · ${planName}` : ''}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>
              How this {scope === 'plan' ? 'Plan' : 'Product'} is doing across every Campaign UN Admin has created for it.
            </div>
          </div>
          <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSecondary }}>
            <i className="ti ti-x" style={{ fontSize: 15 }} />
          </div>
        </div>

        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          {planId && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {[['plan', planName || 'This Plan'], ['product', 'All Plans on This Product']].map(([key, label]) => (
                <button key={key} onClick={() => setScope(key)} style={{
                  padding: '6px 13px', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${scope === key ? C.primary : C.borderMedium}`,
                  background: scope === key ? C.blueLight : C.white,
                  fontFamily: F.body, fontSize: 11.5, fontWeight: 700,
                  color: scope === key ? C.primary : C.textSecondary,
                }}>{label}</button>
              ))}
            </div>
          )}

          <ErrorBanner message={error} />
          {loading ? (
            <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, padding: '30px 0', textAlign: 'center' }}>Loading performance data…</div>
          ) : (
            <>
              {showSample && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '9px 12px', marginBottom: 18 }}>
                  <i className="ti ti-flask" style={{ fontSize: 14, color: '#92400E', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: F.body, fontSize: 12, color: '#92400E', lineHeight: 1.4 }}>
                    {error
                      ? "Live results couldn't be loaded, so this is Sample Data — the Performance layout with illustrative numbers, not real Campaign data."
                      : `No Campaigns yet for this ${scope === 'plan' ? 'Plan' : 'Product'} — this is Sample Data, showing what Performance looks like once Campaigns exist.`}
                  </span>
                  <SampleTag />
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
                <StatTile label="Campaigns" value={fmtNum(totalCampaignsShown)} />
                <StatTile label="Customers Adopted" value={fmtNum(distinctCustomers)} sub="Distinct customers running it" />
                <StatTile label="Reach" value={fmtNum(totalReach)} sub="Listings / properties targeted" />
                <StatTile label="Spend vs Budget" value={`${fmtMoney(totalSpend)} / ${fmtMoney(totalBudget)}`} />
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: '1 1 320px', minWidth: 300, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                  <SectionLabel icon="ti-chart-bar">By Status</SectionLabel>
                  {statusRows.map(row => (
                    <div key={row.status} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 92, flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textPrimary }}>{row.status}</span>
                      </div>
                      <div style={{ flex: 1, background: C.neutral, borderRadius: 4, height: 14 }}>
                        <div style={{ width: `${Math.max(row.count ? 4 : 0, (row.count / maxStatusCount) * 100)}%`, height: 14, borderRadius: 4, background: row.color }} />
                      </div>
                      <span style={{ width: 20, textAlign: 'right', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textPrimary }}>{row.count}</span>
                    </div>
                  ))}
                </div>

                <div style={{ flex: '1 1 320px', minWidth: 300, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                  <SectionLabel icon="ti-chart-line" right={<SampleTag />}>Spend vs Budget</SectionLabel>
                  <svg viewBox={`0 0 ${geo.width} ${geo.height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                    <line x1={geo.padL} y1={geo.capY} x2={geo.width - 14} y2={geo.capY} stroke={C.borderMedium} strokeWidth={1} strokeDasharray="4 4" />
                    <text x={geo.width - 14} y={geo.capY - 6} textAnchor="end" fontSize="10" fill={C.textTertiary} fontFamily={F.body}>Budget cap · {fmtMoney(totalBudget)}</text>
                    <path d={geo.areaPath} fill={C.primary} opacity={0.1} />
                    <path d={geo.linePath} fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={geo.endPoint[0]} cy={geo.endPoint[1]} r={4} fill={C.primary} stroke={C.white} strokeWidth={2} />
                    <text x={geo.endPoint[0]} y={geo.endPoint[1] - 10} textAnchor="end" fontSize="11" fontWeight="700" fill={C.textPrimary} fontFamily={F.body}>{fmtMoney(totalSpend)}</text>
                  </svg>
                  <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
                    Only the two endpoints are real — spend so far ({fmtMoney(totalSpend)}) and the budget cap ({fmtMoney(totalBudget)}). spend_to_date is a running total, not a periodic snapshot, so the climb between them is an illustrative pace, not a measured trend.
                  </div>
                </div>
              </div>

              {showPlanMix && (() => {
                const maxMix = Math.max(1, ...planMix.map(([, c]) => c));
                return (
                  <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <SectionLabel icon="ti-stack-2">Plan Mix (this Product, all Plans)</SectionLabel>
                    {planMix.map(([name, count]) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ width: 140, flexShrink: 0, fontFamily: F.body, fontSize: 11.5, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                        <div style={{ flex: 1, background: C.neutral, borderRadius: 4, height: 14 }}>
                          <div style={{ width: `${Math.max(count ? 4 : 0, (count / maxMix) * 100)}%`, height: 14, borderRadius: 4, background: C.primary }} />
                        </div>
                        <span style={{ width: 22, textAlign: 'right', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textPrimary }}>{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <SectionLabel icon="ti-chart-funnel" right={<SampleTag />}>Engagement</SectionLabel>
                <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, lineHeight: 1.5 }}>
                  No impressions/clicks/leads tracking pipeline exists in the backend yet — same gap as the Campaign Detail panel's Engagement Analytics section. Left out rather than shown fabricated.
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={CANCEL_BTN_STYLE}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function PromotionCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [performanceFor, setPerformanceFor] = useState(null);

  const fetchAll = () => {
    setLoading(true); setError('');
    Promise.all([apiListCampaigns(), apiListProducts()])
      .then(([cList, pList]) => {
        const mapped = cList.map(campaignListItemFromApi);
        setCampaigns(mapped);
        setProducts(pList);
        if (mapped.length && !selectedId) setSelectedId(mapped[0].id);
      })
      .catch(err => setError(err.message || 'Failed to load campaigns.'))
      .finally(() => setLoading(false));
  };
  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshList = () => { fetchAll(); setRefreshToken(t => t + 1); };

  let filtered = campaigns.filter(c => {
    if (search && !`${c.campaignNumber} ${c.campaignName} ${c.customerName || ''} ${c.productName || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (productFilter && String(c.productId) !== productFilter) return false;
    if (customerTypeFilter && c.personaAtPurchase !== customerTypeFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (targetTypeFilter && c.targetType !== targetTypeFilter) return false;
    return true;
  });
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'Highest Budget') return (b.budgetAmount || 0) - (a.budgetAmount || 0);
    if (sortBy === 'Ending Soonest') return (a.endDate || '9999').localeCompare(b.endDate || '9999');
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const productsById = Object.fromEntries(products.map(p => [p.id, p]));
  const resetFilters = () => { setSearch(''); setProductFilter(''); setCustomerTypeFilter(''); setStatusFilter(''); setTargetTypeFilter(''); };
  const closeForm = () => { setEditingCampaignId(null); setCreating(false); };
  const savedForm = (saved) => { closeForm(); refreshList(); if (saved?.id) setSelectedId(saved.id); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: F.headline, fontSize: 19, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Campaigns Management</h2>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '4px 0 0' }}>
            Live from PromotionCampaign — create, schedule, and manage promotion campaigns.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryDeadEnd label="Export Report" icon="ti-download" tooltip="No export endpoint exists for Campaigns yet." />
          <PrimaryButton label="New Campaign" icon="ti-plus" onClick={() => setCreating(true)} />
        </div>
      </div>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 14, color: C.textSecondary }} />
            <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</span>
          </div>
          <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
            <i className="ti ti-refresh" style={{ fontSize: 12 }} /> Reset Filters
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '3 0 0%', minWidth: 220 }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.textTertiary }} />
            <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Search campaigns by number, name, customer, product…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 150px', minWidth: 150 }}><CustomDropdown placeholder="Product: All" options={[{ value: '', label: 'All Products' }, ...products.map(p => ({ value: String(p.id), label: p.name }))]} value={productFilter} onChange={setProductFilter} /></div>
          <div style={{ flex: '1 1 140px', minWidth: 140 }}><CustomDropdown placeholder="Persona: All" options={[{ value: '', label: 'All Personas' }, ...CUSTOMER_TYPES.map(p => ({ value: p, label: p }))]} value={customerTypeFilter} onChange={setCustomerTypeFilter} /></div>
          <div style={{ flex: '1 1 140px', minWidth: 140 }}><CustomDropdown placeholder="Target Type: All" options={[{ value: '', label: 'All Target Types' }, ...TARGET_TYPES.map(t => ({ value: t, label: t }))]} value={targetTypeFilter} onChange={setTargetTypeFilter} /></div>
          <div style={{ flex: '1 1 130px', minWidth: 130 }}><CustomDropdown placeholder="Status: All" options={[{ value: '', label: 'All Statuses' }, ...CAMPAIGN_STATUSES.map(s => ({ value: s, label: s }))]} value={statusFilter} onChange={setStatusFilter} /></div>
        </div>
      </div>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
        <ErrorBanner message={error} onRetry={fetchAll} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontFamily: F.headline, fontSize: 14.5, fontWeight: 700, color: C.textPrimary }}>Active Roster</span>
            <StatusPill status={`${filtered.length} of ${campaigns.length}`} tone="blue" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>Sort:</span>
            <div style={{ minWidth: 150 }}><CustomDropdown options={SORT_OPTIONS.map(o => ({ value: o, label: o }))} value={sortBy} onChange={setSortBy} /></div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 968 }}>
            <div style={{ display: 'grid', gridTemplateColumns: ROSTER_GRID_COLS, gap: 12, padding: '8px 16px 8px 30px', borderBottom: `1px solid ${C.border}` }}>
              {['Campaign Name', 'Campaign #', 'Product', 'Plan', 'Target Type', 'Status', 'Budget / Spend', 'Actions'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>Loading campaigns…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>No campaigns match these filters.</div>
            ) : filtered.map((c, idx) => {
              const product = productsById[c.productId];
              const isSelected = c.id === selectedId;
              return (
                <div key={c.id} style={{
                  display: 'grid', gridTemplateColumns: ROSTER_GRID_COLS, gap: 12,
                  padding: '11px 16px 11px 30px', alignItems: 'center',
                  borderBottom: `1px solid ${C.neutral}`,
                  background: isSelected ? C.blueLight : idx % 2 === 1 ? '#FAFBFC' : C.white,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <TruncatedCell text={c.campaignName} maxChars={CAMPAIGN_NAME_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.textPrimary }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <TruncatedCell text={c.campaignNumber} maxChars={CAMPAIGN_NUMBER_MAX_CHARS} style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 500, color: C.textPrimary }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: product?.icon_bg || '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${product?.icon || 'ti-package'}`} style={{ fontSize: 12, color: product?.icon_color || C.primary }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <TruncatedCell text={c.productName || '—'} maxChars={PRODUCT_PLAN_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.textPrimary }} />
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <TruncatedCell text={c.planName || '—'} maxChars={PRODUCT_PLAN_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary }} />
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{c.targetType || '—'}</div>
                  <div><StatusPill status={c.status} tone={statusTone(c.status)} /></div>
                  <div>
                    <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.textPrimary }}>{fmtMoney(c.budgetAmount)}</div>
                    <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary }}>Spent {fmtMoney(c.spendToDate)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isSelected ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: C.primary, color: C.white, fontFamily: F.body, fontSize: 11, fontWeight: 500 }}>
                        <i className="ti ti-eye-check" style={{ fontSize: 12 }} /> Inspecting
                      </span>
                    ) : (
                      <IconButton icon="ti-eye" onClick={() => setSelectedId(c.id)} tooltip="Inspect campaign" />
                    )}
                    {c.productId && (
                      <IconButton
                        icon="ti-chart-bar"
                        onClick={() => setPerformanceFor({ productId: c.productId, productName: c.productName, planId: c.planId, planName: c.planName })}
                        tooltip={`Performance — ${c.productName || 'this Product'}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '12px 16px 12px 30px', borderTop: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>
          Showing 1–{filtered.length} of {campaigns.length} campaigns
        </div>
      </div>

      {selectedId && (
        <CampaignDetailPanel
          campaignId={selectedId}
          onEdit={setEditingCampaignId}
          onDeleted={() => { setSelectedId(null); refreshList(); }}
          refreshToken={refreshToken}
        />
      )}

      {(creating || editingCampaignId) && (
        <CampaignFormModal campaignId={editingCampaignId} onClose={closeForm} onSaved={savedForm} />
      )}

      {performanceFor && (
        <ProductPerformancePopup
          productId={performanceFor.productId}
          productName={performanceFor.productName}
          planId={performanceFor.planId}
          planName={performanceFor.planName}
          onClose={() => setPerformanceFor(null)}
        />
      )}
    </div>
  );
}
