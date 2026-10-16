/**
 * PromotionProductCatalog.jsx — Promotion Engine → Product Catalog tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Phase 6 (FE wiring). Rewired from "Sample Data end to end"
 * (Step 1/Step 4 builds) onto the real Phase 4 backend
 * (promotion_engine/views.py, mounted at /api/admin/promotion-engine/) —
 * see PromotionEngine_Backend_Design_Review.md and
 * promotionFieldMap.js's own header for the full FE<->backend vocabulary
 * reconciliation this pass required (Product has no `planType` array field
 * on the real model — replaced by the real `plan_type_label` curated text;
 * Plan's `planStatus` now uses the real DRAFT/ACTIVE/PAUSED/ARCHIVED
 * vocabulary instead of incorrectly reusing Product's own STATUSES; Plans
 * are now always scoped to a real Product via the "Manage Plans" panel
 * rather than a flat, product-less list).
 *
 * Every Create/Edit/Delete action below is now a REAL write against
 * ListingPromotionProduct / ListingPromotionPlan (incl. nested
 * PlanBenefit rows) — no more <DeadEndButton>s on this tab. Two known,
 * deliberate gaps, both documented inline where they occur:
 *   1. Plan & Pricing's "Tier Table" (Tiered pricing model) stays FE-local
 *      only — it doesn't map onto the real PlanPricingTier child rows
 *      (structured min/max/price fields, not freeform text) without a
 *      dedicated tier-row editor this pass didn't build. Omitted from every
 *      write so it never clobbers real tier data with garbage.
 *   2. "Geographic Targeting Scope" has no backing field at all on the real
 *      model (geographic_targeting_enabled is a bare on/off gate, "no city/
 *      region-picker fields" per the model's own comment) — kept as a
 *      FE-local hint, never sent.
 */

import React, { useEffect, useState } from 'react';
import {
  C, F, ActionTooltip, StatusPill, CustomDropdown,
} from './promotionTokens';
import {
  apiListProducts, apiGetProduct, apiCreateProduct, apiUpdateProduct, apiDeleteProduct,
  apiListPlans, apiGetPlan, apiCreatePlan, apiUpdatePlan, apiDeletePlan,
  apiGetPlanDropdownOptions,
} from './promotionEngineApi';
import {
  PERSONA_TO_API, PERSONA_FROM_API, MARKET_TO_API, MARKET_FROM_API,
  PRODUCT_TARGET_TYPE_TO_API, PRODUCT_TARGET_TYPE_FROM_API,
  statusToApi, statusFromApi, PLAN_STATUSES, planStatusToApi, planStatusFromApi,
  DISPLAY_TIERS, displayTierToApi, displayTierFromApi,
  camelToSnake, planFieldToApiName, yesNoToApi, yesNoFromApi, numOrNull, numOrBlank,
  enumToApi, enumFromApi, CAMPAIGN_FEATURE_KEY_TO_API,
} from './promotionFieldMap';

// ═══════════════════════════════════════════════════════════════════════════
// Vocabulary constants — still exported for PromotionCampaigns.jsx, which
// reuses these exact same lists rather than inventing a second copy.
// SAMPLE_PRODUCTS / SAMPLE_PLANS_BY_PRODUCT / the flat FEATURE_ADDON_PRICES
// placeholder are all gone as of this pass — Campaigns.jsx now fetches real
// Products/Plans itself, and reads each real Product's own
// feature_addon_prices instead of one flat map (the real, per-Product
// pricing decision 23 always intended).
// ═══════════════════════════════════════════════════════════════════════════
export const PERSONAS = ['Landlord', 'Ind PM', 'Org PM'];
export const MARKETS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'India', name: 'India', flag: '🇮🇳' },
];
export const MARKET_BY_CODE = Object.fromEntries(MARKETS.map(m => [m.code, m]));
export const STATUSES = ['Active', 'Draft', 'Inactive', 'Archived'];

export const PRODUCT_CAPABILITY_FIELDS = [
  { key: 'supportsFeaturedPlacement', label: 'Featured Placement' },
  { key: 'supportsFeaturedSection', label: 'Featured Section' },
  { key: 'supportsSearchVisibilityBoost', label: 'Search Visibility Boost' },
  { key: 'supportsSearchRankingBoost', label: 'Search Ranking Boost' },
  { key: 'supportsCategorySearchBoost', label: 'Category Search Boost' },
  { key: 'supportsLocationSearchBoost', label: 'Location Search Boost' },
  { key: 'supportsSponsoredPlacement', label: 'Sponsored Placement' },
  { key: 'supportsSponsoredLabel', label: 'Sponsored Label' },
  { key: 'supportsHomepagePlacement', label: 'Homepage Placement' },
  { key: 'supportsHomepageCarousel', label: 'Homepage Carousel' },
  { key: 'supportsGeographicPromotion', label: 'Geographic Promotion' },
  { key: 'supportsEnhancedListingCard', label: 'Enhanced Listing Card' },
  { key: 'supportsFeaturedBadge', label: 'Featured Badge' },
  { key: 'supportsSpotlightBadge', label: 'Spotlight Badge' },
  { key: 'supportsMapHighlight', label: 'Map Highlight' },
  { key: 'supportsRotation', label: 'Rotation' },
  { key: 'supportsPlacementPriority', label: 'Placement Priority' },
  { key: 'supportsLeadCta', label: 'Lead CTA' },
  { key: 'supportsOpenHouseEventSupport', label: 'Open House / Event Support' },
];
export const TARGET_TYPES = ['Listing', 'Property', 'Portfolio', 'Multiple Listings'];

// CAMPAIGN_FEATURE_KEYS is the toggle-style subset of Plan Tab 4's 26 fields
// PromotionCampaigns.jsx's "Campaign Features" section offers as per-Campaign
// add-ons (decision 23) — the FE label set, paired via CAMPAIGN_FEATURE_KEY_
// TO_API (promotionFieldMap.js) with the real backend feature_key vocabulary
// used by both plan_snapshot and ListingPromotionProduct.feature_addon_prices.
export const CAMPAIGN_FEATURE_KEYS = [
  { key: 'searchVisibilityBoost', label: 'Search Visibility Boost', gateKey: 'supportsSearchVisibilityBoost' },
  { key: 'searchRankingBoost', label: 'Search Ranking Boost', gateKey: 'supportsSearchRankingBoost' },
  { key: 'categorySearchBoost', label: 'Category Search Boost', gateKey: 'supportsCategorySearchBoost' },
  { key: 'locationSearchBoost', label: 'Location Search Boost', gateKey: 'supportsLocationSearchBoost' },
  { key: 'featuredSectionEligible', label: 'Featured Section', gateKey: 'supportsFeaturedSection' },
  { key: 'featuredBadgeEnabled', label: 'Featured Badge', gateKey: 'supportsFeaturedBadge' },
  { key: 'enhancedCardDisplay', label: 'Enhanced Listing Card', gateKey: 'supportsEnhancedListingCard' },
  { key: 'rotationEnabled', label: 'Rotation', gateKey: 'supportsRotation' },
  { key: 'placementPriority', label: 'Placement Priority', gateKey: 'supportsPlacementPriority' },
  { key: 'sponsoredLabelEnabled', label: 'Sponsored Label', gateKey: 'supportsSponsoredLabel' },
  { key: 'mapHighlightEnabled', label: 'Map Highlight', gateKey: 'supportsMapHighlight' },
  { key: 'spotlightBadgeEnabled', label: 'Spotlight Badge', gateKey: 'supportsSpotlightBadge' },
  { key: 'homepagePlacementEnabled', label: 'Homepage Placement', gateKey: 'supportsHomepagePlacement' },
  { key: 'geographicTargetingEnabled', label: 'Geographic Targeting', gateKey: 'supportsGeographicPromotion' },
  { key: 'leadCtaEnabled', label: 'Lead CTA', gateKey: 'supportsLeadCta' },
  { key: 'openHouseEventSupport', label: 'Open House / Event Support', gateKey: 'supportsOpenHouseEventSupport' },
  { key: 'planAnalyticsEnabled', label: 'Analytics', gateKey: null },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPAT EXPORT — restored Sep 29, 2026, post-wiring build break.
// SAMPLE_PRODUCTS itself is NOT used anywhere in this file anymore (the real
// Product Catalog screen above fetches real Products via apiListProducts).
// It's kept only because three sibling tabs that were out of scope for this
// wiring pass — PromotionAnalyticsPanel.jsx, PromotionAuditLogPanel.jsx,
// PromotionOverview.jsx — still import it and still run entirely on this
// same sample data (they haven't been wired to the real /overview/,
// /audit-logs/, or Product/Campaign endpoints yet — see the Phase 6 "known
// gaps" note in the project doc). Removing this export broke the whole
// app's build, since those three files never stopped depending on it.
// Do not add new real logic here — if/when those tabs get wired for real,
// this block (and the matching SAMPLE_CAMPAIGNS/productFor/pct block in
// PromotionCampaigns.jsx) should be deleted along with their sample-data
// imports, not extended.
export const SAMPLE_PRODUCTS = [
  {
    id: 1, name: 'Featured', code: 'PRM-FEAT-30D', planType: ['Tiered', 'Fixed'], icon: 'ti-star', iconBg: '#EFF6FF', iconColor: C.primary,
    personas: ['Landlord', 'Ind PM', 'Org PM'], markets: ['US', 'India'],
    activePlans: 4, plansLabel: 'Tiered & Fixed', liveCampaigns: 82, campaignsSub: '94% capacity',
    status: 'Active',
    promotionObjective: 'Increase listing visibility',
    allowedTargetTypes: ['Listing', 'Multiple Listings'],
    supportsFeaturedPlacement: true, supportsFeaturedSection: true, supportsSearchVisibilityBoost: true,
    supportsSearchRankingBoost: true, supportsCategorySearchBoost: true, supportsLocationSearchBoost: true,
    supportsSponsoredPlacement: false, supportsSponsoredLabel: false,
    supportsHomepagePlacement: true, supportsHomepageCarousel: true, supportsGeographicPromotion: false,
    supportsEnhancedListingCard: true, supportsFeaturedBadge: true, supportsSpotlightBadge: false,
    supportsMapHighlight: true, supportsRotation: true, supportsPlacementPriority: true,
    supportsLeadCta: true, supportsOpenHouseEventSupport: false,
  },
  {
    id: 3, name: 'Sponsored', code: 'PRM-SPON-PPC', planType: ['Per Listing'], icon: 'ti-target-arrow', iconBg: '#ECFDF5', iconColor: '#047857',
    personas: ['Org PM'], markets: ['US'],
    activePlans: 2, plansLabel: 'PPC Budget Pools', liveCampaigns: 13, campaignsSub: 'Budget $14.2k active',
    status: 'Active',
    promotionObjective: 'Sponsored marketplace exposure',
    allowedTargetTypes: ['Listing', 'Multiple Listings'],
    supportsFeaturedPlacement: false, supportsFeaturedSection: false, supportsSearchVisibilityBoost: false,
    supportsSearchRankingBoost: false, supportsCategorySearchBoost: false, supportsLocationSearchBoost: false,
    supportsSponsoredPlacement: true, supportsSponsoredLabel: true,
    supportsHomepagePlacement: true, supportsHomepageCarousel: false, supportsGeographicPromotion: false,
    supportsEnhancedListingCard: true, supportsFeaturedBadge: false, supportsSpotlightBadge: false,
    supportsMapHighlight: false, supportsRotation: true, supportsPlacementPriority: true,
    supportsLeadCta: true, supportsOpenHouseEventSupport: false,
  },
  {
    id: 4, name: 'Homepage Spotlight', code: 'PRM-HOME-HERO', planType: ['Fixed'], icon: 'ti-photo', iconBg: '#FFF7ED', iconColor: '#C2410C',
    personas: ['Ind PM', 'Org PM'], markets: ['US', 'India'],
    activePlans: 3, plansLabel: 'Daily Takeovers', liveCampaigns: 0, campaignsSub: 'Scheduled Oct 1',
    status: 'Draft',
    promotionObjective: 'Homepage exposure',
    allowedTargetTypes: ['Listing', 'Multiple Listings'],
    supportsFeaturedPlacement: false, supportsFeaturedSection: false, supportsSearchVisibilityBoost: false,
    supportsSearchRankingBoost: false, supportsCategorySearchBoost: false, supportsLocationSearchBoost: false,
    supportsSponsoredPlacement: false, supportsSponsoredLabel: false,
    supportsHomepagePlacement: true, supportsHomepageCarousel: true, supportsGeographicPromotion: false,
    supportsEnhancedListingCard: true, supportsFeaturedBadge: false, supportsSpotlightBadge: true,
    supportsMapHighlight: false, supportsRotation: true, supportsPlacementPriority: true,
    supportsLeadCta: true, supportsOpenHouseEventSupport: false,
  },
];

// Column widths for the Product table's CSS grid.
const GRID_COLS = 'minmax(0, 1.6fr) 150px 0.8fr 0.8fr 130px 1.1fr 0.8fr 0.8fr 1.1fr';
const PERSONAS_MAX_CHARS = 24;
const PLAN_TYPE_MAX_CHARS = 16;
const PRODUCT_NAME_MAX_CHARS = 12;

// Column widths for the per-Product Plan table's CSS grid — same matrix-row
// pattern as the Product table above (GRID_COLS), swapped in Sep 29, 2026
// for the Plan section's original individual-card layout, at the user's
// request, so both tables in this screen read consistently.
const PLAN_GRID_COLS = 'minmax(0, 1.7fr) 0.85fr 1fr 0.65fr 0.75fr 0.5fr 0.8fr 0.85fr';
const PLAN_NAME_MAX_CHARS = 22;
const PLAN_STATUS_TONE = { Active: 'green', Draft: 'grey', Paused: 'amber', Archived: 'grey' };

// ═══════════════════════════════════════════════════════════════════════════
// Shared small pieces
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

function PrimaryButton({ label, icon, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '9px 16px', background: disabled ? C.borderMedium : C.primary, border: 'none', borderRadius: 7,
      fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.white, cursor: disabled ? 'not-allowed' : 'pointer',
      ...style,
    }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 13 }} />}
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

function IconButton({ icon, onClick, tooltip, danger }) {
  const btn = (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`,
      background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: danger ? C.danger : C.textSecondary,
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
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, labelGap = 5 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textSecondary, marginBottom: labelGap, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
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
const textareaStyle = { ...inputStyle, height: 70, padding: '8px 11px', resize: 'vertical', fontFamily: F.body };
const CANCEL_BTN_STYLE = { padding: '8px 16px', background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 7, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, cursor: 'pointer' };

function CheckboxRow({ options, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, cursor: 'pointer' }}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} />
          {opt}
        </label>
      ))}
    </div>
  );
}

// Small error banner shown inside a modal when a save/load call fails —
// used everywhere extractErrorMessage's real DRF validation text (e.g.
// "name: This field is required.") needs to reach the admin, not just a
// generic failure.
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
// Product-level stat tiles
// ═══════════════════════════════════════════════════════════════════════════
function CatalogStatTile({ label, value, subtitle, icon, iconBg, iconColor, pill }) {
  return (
    <div style={{ flex: '1 1 180px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <div style={{ width: 19, height: 19, borderRadius: 6, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 10, color: iconColor }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: F.headline, fontSize: 17, fontWeight: 700, color: C.textPrimary }}>{value}</span>
        {pill && <StatusPill status={pill} tone="green" />}
      </div>
      {subtitle && <div style={{ fontFamily: F.body, fontSize: 10, color: C.textTertiary, marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Product <-> API shape converters
// ═══════════════════════════════════════════════════════════════════════════
// Trimmed list row (ListingPromotionProductListSerializer) -> FE table shape.
function productListItemFromApi(p) {
  return {
    id: p.id, name: p.name, code: p.code,
    status: statusFromApi(p.status),
    personas: (p.personas || []).map(x => PERSONA_FROM_API[x] || x),
    markets: (p.markets || []).map(x => MARKET_FROM_API[x] || x),
    icon: p.icon || 'ti-package', iconBg: p.icon_bg || '#EFF6FF', iconColor: p.icon_color || C.primary,
    plansLabel: p.plan_type_label || '—', campaignsSub: p.campaigns_subtitle || '',
    activePlans: p.active_plans_count ?? 0, liveCampaigns: p.live_campaigns_count ?? 0,
    tier: displayTierFromApi(p.display_tier),
  };
}

// Full record (ListingPromotionProductSerializer, 35 fields) -> FE form shape.
function productFullFromApi(p) {
  return {
    id: p.id, name: p.name || '', code: p.code || '',
    status: statusFromApi(p.status),
    personas: (p.personas || []).map(x => PERSONA_FROM_API[x] || x),
    markets: (p.markets || []).map(x => MARKET_FROM_API[x] || x),
    icon: p.icon || '', iconBg: p.icon_bg || '', iconColor: p.icon_color || '',
    plansLabel: p.plan_type_label || '', campaignsSub: p.campaigns_subtitle || '',
    tier: displayTierFromApi(p.display_tier),
    promotionObjective: p.promotion_objective || '',
    allowedTargetTypes: (p.allowed_target_types || []).map(x => PRODUCT_TARGET_TYPE_FROM_API[x] || x),
    featureAddonPrices: Object.fromEntries(
      CAMPAIGN_FEATURE_KEYS.map(f => [f.key, numOrBlank(p.feature_addon_prices?.[CAMPAIGN_FEATURE_KEY_TO_API[f.key]])]),
    ),
    ...Object.fromEntries(PRODUCT_CAPABILITY_FIELDS.map(f => [f.key, !!p[camelToSnake(f.key)]])),
  };
}

function buildProductApiPayload(form) {
  return {
    name: form.name,
    status: statusToApi(form.status),
    personas: (form.personas || []).map(p => PERSONA_TO_API[p]).filter(Boolean),
    markets: (form.markets || []).map(m => MARKET_TO_API[m] || m).filter(Boolean),
    icon: form.icon || '', icon_bg: form.iconBg || '', icon_color: form.iconColor || '',
    plan_type_label: form.plansLabel || '', campaigns_subtitle: form.campaignsSub || '',
    display_tier: displayTierToApi(form.tier),
    promotion_objective: form.promotionObjective || '',
    allowed_target_types: (form.allowedTargetTypes || []).map(t => PRODUCT_TARGET_TYPE_TO_API[t]).filter(Boolean),
    feature_addon_prices: Object.fromEntries(
      Object.entries(form.featureAddonPrices || {})
        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
        .map(([feKey, v]) => [CAMPAIGN_FEATURE_KEY_TO_API[feKey], Number(v)]),
    ),
    ...Object.fromEntries(PRODUCT_CAPABILITY_FIELDS.map(f => [camelToSnake(f.key), !!form[f.key]])),
  };
}

function emptyProductForm() {
  return {
    name: '', status: 'Draft', tier: 'Basic', personas: [], markets: [],
    icon: '', iconBg: '', iconColor: '', plansLabel: '', campaignsSub: '',
    promotionObjective: '', allowedTargetTypes: [],
    featureAddonPrices: Object.fromEntries(CAMPAIGN_FEATURE_KEYS.map(f => [f.key, ''])),
    ...Object.fromEntries(PRODUCT_CAPABILITY_FIELDS.map(f => [f.key, false])),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Add/Edit Product modal — real Create/Update against ListingPromotionProduct.
// ═══════════════════════════════════════════════════════════════════════════
function ProductFormModal({ productId, onClose, onSaved }) {
  const isEdit = !!productId;
  const [form, setForm] = useState(emptyProductForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    apiGetProduct(productId)
      .then(p => { if (!cancelled) setForm(productFullFromApi(p)); })
      .catch(err => { if (!cancelled) setError(err.message || 'Failed to load product.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const toggle = (key, opt) => setForm(f => ({
    ...f,
    [key]: f[key].includes(opt) ? f[key].filter(x => x !== opt) : [...f[key], opt],
  }));
  const toggleBool = (key) => setForm(f => ({ ...f, [key]: !f[key] }));
  const setPrice = (key, val) => setForm(f => ({ ...f, featureAddonPrices: { ...f.featureAddonPrices, [key]: val } }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Product Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = buildProductApiPayload(form);
      const saved = isEdit ? await apiUpdateProduct(productId, payload) : await apiCreateProduct(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? `Edit Product — ${form.name || ''}` : 'Create Product'}
      onClose={onClose}
      width={560}
      footer={<>
        <button onClick={onClose} style={CANCEL_BTN_STYLE}>Cancel</button>
        <PrimaryButton label={saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Product')} icon="ti-device-floppy" onClick={handleSave} disabled={saving || loading} />
      </>}
    >
      <ErrorBanner message={error} />
      {loading ? (
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, padding: '20px 0', textAlign: 'center' }}>Loading product…</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <Field label="Product Name" labelGap={20}>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Featured" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Status" labelGap={20}>
                <CustomDropdown options={STATUSES.map(s => ({ value: s, label: s }))} value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} />
              </Field>
            </div>
          </div>
          <Field label="Marketplace Display Tier" labelGap={20}>
            <CustomDropdown options={DISPLAY_TIERS.map(t => ({ value: t, label: t }))} value={form.tier} onChange={v => setForm(f => ({ ...f, tier: v }))} />
          </Field>
          {isEdit && (
            <Field label="Code" labelGap={20}>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F1F5F9', color: C.textSecondary }}>
                <i className="ti ti-lock" style={{ fontSize: 11, color: C.textTertiary, marginRight: 6 }} />{form.code}
              </div>
            </Field>
          )}
          <Field label="Personas" labelGap={20}><CheckboxRow options={PERSONAS} selected={form.personas} onToggle={opt => toggle('personas', opt)} /></Field>
          <Field label="Markets" labelGap={20}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {MARKETS.map(m => (
                <label key={m.code} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.markets.includes(m.code)} onChange={() => toggle('markets', m.code)} />
                  <ActionTooltip text={m.name}><span style={{ fontSize: 18, lineHeight: 1, cursor: 'default' }}>{m.flag}</span></ActionTooltip>
                </label>
              ))}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Icon (Tabler class)" labelGap={20}>
                <input style={inputStyle} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="ti-star" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Icon Background" labelGap={20}>
                <input style={inputStyle} value={form.iconBg} onChange={e => setForm(f => ({ ...f, iconBg: e.target.value }))} placeholder="#EFF6FF" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Icon Color" labelGap={20}>
                <input style={inputStyle} value={form.iconColor} onChange={e => setForm(f => ({ ...f, iconColor: e.target.value }))} placeholder="#2563EB" />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Plan Type Label" labelGap={20}>
                <input style={inputStyle} value={form.plansLabel} onChange={e => setForm(f => ({ ...f, plansLabel: e.target.value }))} placeholder="e.g. Tiered & Fixed" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Campaigns Subtitle" labelGap={20}>
                <input style={inputStyle} value={form.campaignsSub} onChange={e => setForm(f => ({ ...f, campaignsSub: e.target.value }))} placeholder="e.g. 94% capacity" />
              </Field>
            </div>
          </div>
          <Field label="Promotion Objective" labelGap={20}>
            <input style={inputStyle} value={form.promotionObjective} onChange={e => setForm(f => ({ ...f, promotionObjective: e.target.value }))} placeholder="e.g. Increase listing visibility" />
          </Field>
          <Field label="Allowed Target Types" labelGap={20}>
            <CheckboxRow options={TARGET_TYPES} selected={form.allowedTargetTypes} onToggle={opt => toggle('allowedTargetTypes', opt)} />
          </Field>
          <Field label="Capabilities" labelGap={20}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', padding: '4px 2px' }}>
              {PRODUCT_CAPABILITY_FIELDS.map(cap => (
                <label key={cap.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, minWidth: 190 }}>
                  <input type="checkbox" checked={!!form[cap.key]} onChange={() => toggleBool(cap.key)} />
                  {cap.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Feature Add-on Pricing" labelGap={20}>
            <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginBottom: 8 }}>
              Per-feature price when a Campaign adds this feature beyond what its Plan already grants (decision 23). Leave blank to keep a feature unofferable as an add-on for this Product.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
              {CAMPAIGN_FEATURE_KEYS.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary }}>{f.label}</span>
                  <input
                    type="number" style={{ ...inputStyle, height: 30, width: 80 }}
                    value={form.featureAddonPrices[f.key]}
                    onChange={e => setPrice(f.key, e.target.value)}
                    placeholder="$"
                  />
                </div>
              ))}
            </div>
          </Field>
        </>
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Product detail (view) modal — read-only, fetches the full real record.
// ═══════════════════════════════════════════════════════════════════════════
function ProductDetailModal({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGetProduct(productId)
      .then(p => { if (!cancelled) setProduct(productFullFromApi(p)); })
      .catch(err => { if (!cancelled) setError(err.message || 'Failed to load product.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <ModalShell title={product?.name || 'Product'} onClose={onClose} width={480} footer={
      <button onClick={onClose} style={{ ...CANCEL_BTN_STYLE, background: C.primary, color: C.white, border: 'none' }}>Close</button>
    }>
      <ErrorBanner message={error} />
      {loading ? (
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
      ) : !product ? null : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: product.iconBg || '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${product.icon || 'ti-package'}`} style={{ fontSize: 18, color: product.iconColor || C.primary }} />
            </div>
            <div>
              <div style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{product.name}</div>
              <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary }}>{product.code}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}><StatusPill status={product.status} tone={product.status === 'Active' ? 'green' : 'grey'} /></div>
          </div>
          {[
            ['Plan Type Label', product.plansLabel || '—'],
            ['Personas', product.personas.join(', ') || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 12.5 }}>
              <span style={{ color: C.textSecondary, fontWeight: 600 }}>{label}</span>
              <span style={{ color: C.textPrimary, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 12.5 }}>
            <span style={{ color: C.textSecondary, fontWeight: 600 }}>Markets</span>
            <span style={{ display: 'flex', gap: 8 }}>
              {product.markets.map(code => (
                <ActionTooltip key={code} text={MARKET_BY_CODE[code]?.name || code}>
                  <span style={{ fontSize: 16, lineHeight: 1, cursor: 'default' }}>{MARKET_BY_CODE[code]?.flag || code}</span>
                </ActionTooltip>
              ))}
            </span>
          </div>
          {product.promotionObjective && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 12.5 }}>
              <span style={{ color: C.textSecondary, fontWeight: 600 }}>Promotion Objective</span>
              <span style={{ color: C.textPrimary, textAlign: 'right' }}>{product.promotionObjective}</span>
            </div>
          )}
          {product.allowedTargetTypes?.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 12.5 }}>
              <span style={{ color: C.textSecondary, fontWeight: 600 }}>Allowed Target Types</span>
              <span style={{ color: C.textPrimary, textAlign: 'right' }}>{product.allowedTargetTypes.join(', ')}</span>
            </div>
          )}
          <div style={{ padding: '9px 0' }}>
            <div style={{ color: C.textSecondary, fontWeight: 600, fontFamily: F.body, fontSize: 12.5, marginBottom: 6 }}>Capabilities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
              {PRODUCT_CAPABILITY_FIELDS.filter(cap => product[cap.key]).map(cap => (
                <span key={cap.key} style={{
                  fontFamily: F.body, fontSize: 11, fontWeight: 600, color: C.primary,
                  background: '#EFF6FF', border: `1px solid #DBEAFE`, borderRadius: 999, padding: '3px 10px',
                }}>{cap.label}</span>
              ))}
              {PRODUCT_CAPABILITY_FIELDS.every(cap => !product[cap.key]) && (
                <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, fontStyle: 'italic' }}>None enabled</span>
              )}
            </div>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Catalog table + filters + stat tiles
// ═══════════════════════════════════════════════════════════════════════════
function ProductCatalogSection({ products, loading, error, onRefresh, onManagePlans }) {
  const [search, setSearch] = useState('');
  const [personaFilter, setPersonaFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingProductId, setViewingProductId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [creating, setCreating] = useState(false);

  const filtered = products.filter(p => {
    if (search && !`${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (personaFilter && !p.personas.includes(personaFilter)) return false;
    if (marketFilter && !p.markets.includes(marketFilter)) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    total: products.length,
    active: products.filter(p => p.status === 'Active').length,
    draft: products.filter(p => p.status === 'Draft').length,
    inactive: products.filter(p => p.status === 'Inactive').length,
    archived: products.filter(p => p.status === 'Archived').length,
  };
  const totalPlans = products.reduce((s, p) => s + p.activePlans, 0);
  const totalCampaigns = products.reduce((s, p) => s + p.liveCampaigns, 0);

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete Product "${p.name}"? This also detaches any Plans/Campaigns that reference it. This cannot be undone.`)) return;
    try {
      await apiDeleteProduct(p.id);
      onRefresh();
    } catch (err) {
      window.alert(err.message || 'Failed to delete product.');
    }
  };

  const closeAndRefresh = () => { setEditingProductId(null); setCreating(false); onRefresh(); };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: F.headline, fontSize: 19, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Product Catalog</h2>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '4px 0 0' }}>
            All promotion products configured for UrbanNest — live from ListingPromotionProduct.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryDeadEnd label="Export Report" icon="ti-download" tooltip="No export endpoint exists for the promotion catalog yet." />
          <PrimaryButton label="Create Product" icon="ti-plus" onClick={() => setCreating(true)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: '2 1 220px', minWidth: 200 }}>
          <div style={{ position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.textTertiary }} />
            <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: 160 }}>
          <CustomDropdown placeholder="Persona: All" options={[{ value: '', label: 'All Personas' }, ...PERSONAS.map(p => ({ value: p, label: p }))]} value={personaFilter} onChange={setPersonaFilter} />
        </div>
        <div style={{ flex: '1 1 130px', minWidth: 140 }}>
          <CustomDropdown placeholder="Market: All" options={[{ value: '', label: 'All Markets' }, ...MARKETS.map(m => ({ value: m.code, label: m.name }))]} value={marketFilter} onChange={setMarketFilter} />
        </div>
        <div style={{ flex: '1 1 140px', minWidth: 150 }}>
          <CustomDropdown placeholder="Status: All" options={[{ value: '', label: 'All Statuses' }, ...STATUSES.map(s => ({ value: s, label: s }))]} value={statusFilter} onChange={setStatusFilter} />
        </div>
        <button onClick={() => { setSearch(''); setPersonaFilter(''); setMarketFilter(''); setStatusFilter(''); }}
          style={{ width: 38, height: 38, borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSecondary }}>
          <i className="ti ti-refresh" style={{ fontSize: 15 }} />
        </button>
        <button onClick={onRefresh} title="Reload from server"
          style={{ width: 38, height: 38, borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSecondary }}>
          <i className="ti ti-reload" style={{ fontSize: 15 }} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <CatalogStatTile label="Total Products" value={counts.total} subtitle="All configured products" icon="ti-archive" iconBg="#EFF6FF" iconColor={C.primary} />
        <CatalogStatTile label="Active Products" value={counts.active} subtitle="Currently serving ads" icon="ti-circle-check" iconBg="#ECFDF5" iconColor={C.green} />
        <CatalogStatTile label="Draft Products" value={counts.draft} subtitle="In definition or review" icon="ti-edit" iconBg="#F3E8FF" iconColor="#7E22CE" />
        <CatalogStatTile label="Inactive Products" value={counts.inactive} subtitle="Paused or inactive" icon="ti-player-pause" iconBg={C.amberBg} iconColor={C.amberText} />
        <CatalogStatTile label="Archived Products" value={counts.archived} subtitle="Retired historical SKUs" icon="ti-archive-off" iconBg="#F1F5F9" iconColor={C.textSecondary} />
      </div>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
        <ErrorBanner message={error} onRetry={onRefresh} />
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 960 }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
              {['Product', 'Personas', 'Markets', 'Active Plans', 'Plan Type', 'Live Campaigns', 'Status', 'Tier', 'Actions'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>Loading products…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>No products match these filters.</div>
            ) : filtered.map((p, idx) => (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: GRID_COLS, gap: 12,
                padding: '11px 16px', alignItems: 'center',
                borderBottom: `1px solid ${C.neutral}`,
                background: idx % 2 === 1 ? '#FAFBFC' : C.white,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: p.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${p.icon}`} style={{ fontSize: 14, color: p.iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TruncatedCell text={p.name} maxChars={PRODUCT_NAME_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.textPrimary, display: 'block', width: '100%' }} />
                    <div style={{ fontFamily: F.body, fontSize: 10, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.code}</div>
                  </div>
                </div>
                <TruncatedCell text={p.personas.join(' • ')} maxChars={PERSONAS_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.markets.map(m => (
                    <ActionTooltip key={m} text={MARKET_BY_CODE[m]?.name || m}>
                      <span style={{ fontSize: 16, lineHeight: 1, cursor: 'default' }}>{MARKET_BY_CODE[m]?.flag || m}</span>
                    </ActionTooltip>
                  ))}
                </div>
                <div><div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{p.activePlans}</div></div>
                <TruncatedCell text={p.plansLabel} maxChars={PLAN_TYPE_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.blue }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
                    {p.liveCampaigns > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />}
                    {p.liveCampaigns} Live
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary }}>{p.campaignsSub}</div>
                </div>
                <div><StatusPill status={p.status} tone={p.status === 'Active' ? 'green' : p.status === 'Draft' ? 'amber' : 'grey'} /></div>
                <div><StatusPill status={p.tier} tone={p.tier === 'Exclusive' ? 'amber' : p.tier === 'Premium' ? 'blue' : 'grey'} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconButton icon="ti-eye" onClick={() => setViewingProductId(p.id)} tooltip="View product" />
                  <IconButton icon="ti-pencil" onClick={() => setEditingProductId(p.id)} tooltip="Edit product" />
                  <IconButton icon="ti-list-details" onClick={() => onManagePlans(p)} tooltip="Manage Plans" />
                  <IconButton icon="ti-trash" danger onClick={() => handleDelete(p)} tooltip="Delete product" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>
            Showing 1–{filtered.length} of {products.length} products &nbsp;|&nbsp; Total Active Plans: {totalPlans} &nbsp;•&nbsp; Live Campaigns: {totalCampaigns}
          </div>
        </div>
      </div>

      {viewingProductId && <ProductDetailModal productId={viewingProductId} onClose={() => setViewingProductId(null)} />}
      {(editingProductId || creating) && (
        <ProductFormModal
          productId={editingProductId}
          onClose={() => { setEditingProductId(null); setCreating(false); }}
          onSaved={closeAndRefresh}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Catalog Allocation & Persona Rules + Engine Management — kept as sample/
// illustrative content (no backend model backs a "rules engine" here at
// all — see LST-15). Its "Launch Product Wizard" button reuses the now-real
// ProductFormModal.
// ═══════════════════════════════════════════════════════════════════════════
function CatalogAllocationPanels({ onProductChanged }) {
  const [showWizard, setShowWizard] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 28 }}>
      <div style={{ flex: '2 1 480px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.headline, fontSize: 14.5, fontWeight: 700, color: C.textPrimary }}>
            <i className="ti ti-shield-check" style={{ color: C.primary }} />
            Catalog Allocation &amp; Persona Rules
          </div>
          <StatusPill status="Sample Policy" tone="grey" />
        </div>
        <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, lineHeight: 1.6, margin: '0 0 14px' }}>
          Illustrative only — no real allocation/persona-rules engine exists yet. In a real build, this is where policies like subscription-scoped plan visibility (see backlog item LST-15) would live.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            ['Auto-Renewal Rates', '87.4% across 30-day Featured listing rotations.'],
            ['Slot Concurrency Limit', 'Max 4 featured carousels per regional market zip.'],
            ['Instant Placement', 'Zero waitlist on United States Tier-1 metro listings.'],
          ].map(([title, body]) => (
            <div key={title} style={{ flex: '1 1 180px', background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 3 }}>
                <i className="ti ti-circle-check" style={{ color: C.green, fontSize: 13 }} /> {title}
              </div>
              <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSecondary, lineHeight: 1.4 }}>{body}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <ActionTooltip text="Subscription Tiers isn't part of this build — see UNAdminPlanCatalog.jsx for the real UNPlan/UNService admin catalog instead.">
            <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textTertiary, cursor: 'not-allowed' }}>Open Subscription Tiers →</span>
          </ActionTooltip>
        </div>
      </div>

      <div style={{ flex: '1 1 300px', background: C.navBg, borderRadius: 10, padding: 20, color: C.white }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 99, padding: '3px 10px', fontFamily: F.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          <i className="ti ti-adjustments" style={{ fontSize: 11 }} /> Engine Management
        </div>
        <div style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>New Product Blueprint</div>
        <div style={{ fontFamily: F.body, fontSize: 11.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: 14 }}>
          Draft and deploy new promotion products with custom personas, markets, and plan structures.
        </div>
        {[
          ['Market Expansion (EU/UK)', 'Target: Q4 2026'],
          ['Video Billboard Add-on', 'In Review'],
        ].map(([label, meta]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontFamily: F.body, fontSize: 11.5 }}>
            <span>{label}</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>{meta}</span>
          </div>
        ))}
        <button onClick={() => setShowWizard(true)} style={{ width: '100%', marginTop: 14, padding: '10px', background: C.white, border: 'none', borderRadius: 7, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
          Launch Product Wizard
        </button>
      </div>

      {showWizard && (
        <ProductFormModal
          productId={null}
          onClose={() => setShowWizard(false)}
          onSaved={() => { setShowWizard(false); onProductChanged(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Plan tab field specs — unchanged structurally from the pre-wiring build;
// only planStatus's options changed (STATUSES -> PLAN_STATUSES, fixing the
// pre-existing vocabulary bug — see promotionFieldMap.js's PLAN_STATUSES
// comment) and planCode switched to readonly (server-generated, matches
// Product's own code field — see promotion_engine backend design).
// ═══════════════════════════════════════════════════════════════════════════
const YES_NO = ['Yes', 'No'];
const YES_NO_CONFIG = ['Yes', 'No', 'Configurable'];
const YES_NO_OPTIONAL = ['Yes', 'No', 'Optional'];
const CURRENCIES = ['USD', 'INR'];
const PLAN_TYPE_CHOICES = ['One-Time', 'Subscription'];
const PRICING_MODELS = ['Fixed', 'Per Listing', 'Per Unit', 'Per Property', 'Per Campaign', 'Tiered'];
const TAX_CONFIGS = ['Market-based', 'Flat', 'Exempt'];
const BILLING_FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Annual'];
const REFUND_POLICIES = ['None', 'Configurable', 'Full', 'Partial'];
const DURATION_TYPES = ['Fixed Duration', 'Rolling', 'Unlimited'];
const START_TRIGGERS = ['After Activation', 'On Approval', 'Scheduled'];
const END_TRIGGERS = ['Duration Expiry', 'Manual', 'Renewal'];
const CUSTOMER_STATUSES = ['Active', 'Inactive', 'Any'];
const PROMOTION_SCOPES = ['Listing', 'Portfolio', 'Account'];
const LISTING_TYPES = ['Individual', 'Multi-Unit'];
const FEATURED_PLACEMENTS = ['Limited', 'Enhanced', 'Standard'];
const MEDIA_QUALITY_LEVELS = ['Standard', 'Configurable', 'High'];
// Placement Priority has no hardcoded option list here (corrected same
// session — Session 50, Phase 0 originally shipped this as a static array,
// flagged as hardcoding). Its options are fetched at runtime from the
// admin-configurable UNDropdown table and injected into the Placement tab's
// field spec by PlanFormModal (see placementTabFields there) — a live
// list is plugged in where this array is read, not authored in this file.

const PLAN_TAB_IDENTITY = [
  { key: 'planName', label: 'Plan Name', type: 'text', placeholder: 'e.g. Featured 30-Day' },
  { key: 'planCode', label: 'Plan Code', type: 'readonly' },
  { key: 'displayOrder', label: 'Display Order', type: 'number', placeholder: '1' },
  { key: 'shortDescription', label: 'Short Description', type: 'text', full: true, placeholder: 'e.g. 30-day Featured promotion' },
  { key: 'internalDescription', label: 'Internal Description (optional)', type: 'textarea', full: true, placeholder: 'Internal notes — not shown to customers' },
  { key: 'planStatus', label: 'Plan Status', type: 'select', options: PLAN_STATUSES },
];

const PLAN_TAB_PRICING = [
  { key: 'planType', label: 'Plan Type', type: 'select', options: PLAN_TYPE_CHOICES },
  { key: 'pricingModel', label: 'Pricing Model', type: 'select', options: PRICING_MODELS },
  { key: 'currency', label: 'Currency', type: 'checkboxRow', options: CURRENCIES, full: true },
  { key: 'taxInclusive', label: 'Tax Inclusive', type: 'select', options: YES_NO_CONFIG },
  { key: 'taxConfiguration', label: 'Tax Configuration', type: 'select', options: TAX_CONFIGS },
  { key: 'prorationAllowed', label: 'Proration Allowed', type: 'select', options: YES_NO },
  { key: 'cancellationAllowed', label: 'Cancellation Allowed', type: 'select', options: YES_NO_CONFIG },
  { key: 'refundEligible', label: 'Refund Eligible', type: 'select', options: YES_NO_CONFIG },
  { key: 'refundPolicy', label: 'Refund Policy', type: 'select', options: REFUND_POLICIES },
  { key: 'effectiveFrom', label: 'Effective From', type: 'date' },
  { key: 'effectiveUntil', label: 'Effective Until (optional)', type: 'date' },
];

const PRICING_MODEL_EXTRA_FIELDS = {
  'Fixed': [{ key: 'basePrice', label: 'Base Price', type: 'text', placeholder: '0.00' }],
  'Per Listing': [
    { key: 'pricePerListing', label: 'Price per Listing', type: 'text', placeholder: '0.00' },
    { key: 'minListings', label: 'Minimum Listings', type: 'number', placeholder: '1' },
    { key: 'maxListings', label: 'Maximum Listings', type: 'number', placeholder: 'Unlimited' },
  ],
  'Per Unit': [
    { key: 'pricePerUnit', label: 'Price per Unit', type: 'text', placeholder: '0.00' },
    { key: 'minUnits', label: 'Minimum Units', type: 'number', placeholder: '1' },
    { key: 'maxUnits', label: 'Maximum Units', type: 'number', placeholder: 'Unlimited' },
  ],
  'Per Property': [
    { key: 'pricePerProperty', label: 'Price per Property', type: 'text', placeholder: '0.00' },
    { key: 'minProperties', label: 'Minimum Properties', type: 'number', placeholder: '1' },
    { key: 'maxProperties', label: 'Maximum Properties', type: 'number', placeholder: 'Unlimited' },
  ],
  'Per Campaign': [
    { key: 'pricePerCampaign', label: 'Price per Campaign', type: 'text', placeholder: '0.00' },
    { key: 'minCampaigns', label: 'Minimum Campaigns', type: 'number', placeholder: '1' },
    { key: 'maxCampaigns', label: 'Maximum Campaigns', type: 'number', placeholder: 'Unlimited' },
  ],
  'Tiered': [
    { key: 'quantityType', label: 'Quantity Type', type: 'select', options: ['Listings', 'Units', 'Properties', 'Campaigns'] },
    { key: 'tierCalculationMethod', label: 'Tier Calculation Method', type: 'select', options: ['Graduated', 'Volume', 'Flat per Tier'] },
    { key: 'tierTable', label: 'Tier Table (not saved — see header note)', type: 'list', listPlaceholder: 'e.g. 1–10 units: $5.00 each', full: true },
    { key: 'minQuantity', label: 'Minimum Quantity', type: 'number', placeholder: '1' },
    { key: 'maxQuantity', label: 'Maximum Quantity', type: 'number', placeholder: 'Unlimited' },
  ],
};

const SUBSCRIPTION_EXTRA_FIELDS = [
  { key: 'billingFrequency', label: 'Billing Frequency', type: 'select', options: BILLING_FREQUENCIES },
  { key: 'autoRenewal', label: 'Auto Renewal', type: 'select', options: YES_NO },
];

const PLAN_TAB_ELIGIBILITY = [
  { key: 'duration', label: 'Duration (days)', type: 'number', placeholder: '30' },
  { key: 'durationType', label: 'Duration Type', type: 'select', options: DURATION_TYPES },
  { key: 'startTrigger', label: 'Start Trigger', type: 'select', options: START_TRIGGERS },
  { key: 'endTrigger', label: 'End Trigger', type: 'select', options: END_TRIGGERS },
  { key: 'customerStatus', label: 'Customer Status', type: 'select', options: CUSTOMER_STATUSES },
  { key: 'promotionScope', label: 'Promotion Scope', type: 'select', options: PROMOTION_SCOPES },
  { key: 'eligiblePersonas', label: 'Eligible Personas', type: 'checkboxRow', options: PERSONAS, full: true },
  { key: 'listingType', label: 'Listing Type', type: 'checkboxRow', options: LISTING_TYPES, full: true },
  { key: 'usMarket', label: 'US Market', type: 'select', options: YES_NO },
  { key: 'indiaMarket', label: 'India Market', type: 'select', options: YES_NO },
  { key: 'pmsSubRequired', label: 'PMS Subscription Required', type: 'select', options: YES_NO },
  { key: 'marketplaceEnrollmentRequired', label: 'Marketplace Enrollment Required', type: 'select', options: YES_NO },
  { key: 'listingMustBeActive', label: 'Listing Must Be Active', type: 'select', options: YES_NO },
  { key: 'listingReadinessRequired', label: 'Listing Readiness Required', type: 'select', options: YES_NO },
  { key: 'maxActivePromotions', label: 'Maximum Active Promotions', type: 'number', placeholder: 'Unlimited' },
  { key: 'maxRedemptions', label: 'Maximum Redemptions', type: 'number', placeholder: 'Unlimited' },
  { key: 'redemptionPeriod', label: 'Redemption Period (days)', type: 'number', placeholder: 'Unlimited' },
  { key: 'oneCampaignPerListing', label: 'One Campaign per Listing', type: 'select', options: YES_NO },
  { key: 'stackingAllowed', label: 'Stacking Allowed', type: 'select', options: YES_NO },
];

const PLAN_TAB_PLACEMENT = [
  { key: 'featuredPlacement', label: 'Featured Placement', type: 'select', options: FEATURED_PLACEMENTS },
  { key: 'featuredSectionEligible', label: 'Featured Section Eligible', type: 'select', options: YES_NO_CONFIG },
  { key: 'featuredSlotEligible', label: 'Featured Slot Eligible', type: 'select', options: YES_NO_CONFIG },
  { key: 'searchVisibilityBoost', label: 'Search Visibility Boost', type: 'text', placeholder: 'Configurable' },
  { key: 'placementPriority', label: 'Placement Priority', type: 'select', options: [] /* live-filled by PlanFormModal */ },
  { key: 'rotationEnabled', label: 'Rotation Enabled', type: 'select', options: YES_NO_CONFIG },
  { key: 'rotationWeight', label: 'Rotation Weight', type: 'number', placeholder: 'Unlimited' },
  { key: 'maxFeaturedSlots', label: 'Maximum Featured Slots', type: 'number', placeholder: 'Unlimited' },
  { key: 'featuredBadgeEnabled', label: 'Featured Badge Enabled', type: 'select', options: YES_NO },
  { key: 'badgeLabel', label: 'Badge Label', type: 'text', placeholder: 'Featured' },
  { key: 'enhancedCardDisplay', label: 'Enhanced Card Display', type: 'select', options: YES_NO_CONFIG },
  { key: 'enhancedPropertyPage', label: 'Enhanced Property Page', type: 'select', options: YES_NO_OPTIONAL },
  { key: 'highlightedBackground', label: 'Highlighted Background', type: 'select', options: YES_NO_OPTIONAL },
  { key: 'divider-placement-boosts', type: 'divider', label: 'Search & Discovery Boosts', full: true },
  { key: 'searchRankingBoost', label: 'Search Ranking Boost', type: 'select', options: YES_NO_CONFIG },
  { key: 'categorySearchBoost', label: 'Category Search Boost', type: 'select', options: YES_NO_CONFIG },
  { key: 'locationSearchBoost', label: 'Location Search Boost', type: 'select', options: YES_NO_CONFIG },
  { key: 'geographicTargetingEnabled', label: 'Geographic Targeting', type: 'select', options: YES_NO_CONFIG },
  { key: 'geographicTargetingScope', label: 'Geographic Targeting Scope (not saved — no backend field)', type: 'text', placeholder: 'e.g. City, State, or Radius (miles)' },
  { key: 'divider-placement-badges', type: 'divider', label: 'Sponsored & Spotlight Treatment', full: true },
  { key: 'sponsoredLabelEnabled', label: 'Sponsored Label', type: 'select', options: YES_NO },
  { key: 'mapHighlightEnabled', label: 'Map Highlight', type: 'select', options: YES_NO_CONFIG },
  { key: 'spotlightBadgeEnabled', label: 'Spotlight Badge', type: 'select', options: YES_NO },
  { key: 'homepagePlacementEnabled', label: 'Homepage Placement', type: 'select', options: YES_NO },
  { key: 'divider-placement-engagement', type: 'divider', label: 'Engagement & Reporting', full: true },
  { key: 'leadCtaEnabled', label: 'Lead CTA', type: 'select', options: YES_NO },
  { key: 'leadCtaLabel', label: 'Lead CTA Label', type: 'text', placeholder: 'e.g. Schedule a Tour' },
  { key: 'openHouseEventSupport', label: 'Open House / Event Support', type: 'select', options: YES_NO_CONFIG },
  { key: 'planAnalyticsEnabled', label: 'Analytics', type: 'select', options: YES_NO },
];

const PLAN_TAB_MEDIA = [
  { key: 'maxPhotos', label: 'Maximum Photos', type: 'number', placeholder: 'Unlimited' },
  { key: 'maxVideos', label: 'Maximum Videos', type: 'number', placeholder: 'Unlimited' },
  { key: 'maxVirtualTours', label: 'Maximum Virtual Tours', type: 'number', placeholder: 'Unlimited' },
  { key: 'maxFloorPlans', label: 'Maximum Floor Plans', type: 'number', placeholder: 'Unlimited' },
  { key: 'max360Media', label: 'Maximum 360° Media', type: 'number', placeholder: 'Unlimited' },
  { key: 'featuredMediaRequired', label: 'Featured Media Required', type: 'select', options: YES_NO_OPTIONAL },
  { key: 'mediaQualityRequirement', label: 'Media Quality Requirement', type: 'select', options: MEDIA_QUALITY_LEVELS },
  { key: 'campaignExtensionAllowed', label: 'Campaign Extension Allowed', type: 'select', options: YES_NO_OPTIONAL },
  { key: 'campaignRenewalAllowed', label: 'Campaign Renewal Allowed', type: 'select', options: YES_NO },
  { key: 'transferToAnotherListing', label: 'Transfer to Another Listing', type: 'select', options: YES_NO_OPTIONAL },
  { key: 'discountAllowed', label: 'Discount Allowed', type: 'select', options: YES_NO },
  { key: 'couponCompatible', label: 'Coupon Compatible', type: 'select', options: YES_NO_OPTIONAL },
  { key: 'customerFacingDescription', label: 'Customer-Facing Description', type: 'textarea', full: true, placeholder: 'Shown to customers on the plan card' },
  { key: 'benefits', label: 'Benefits', type: 'list', full: true },
  { key: 'termsAndConditions', label: 'Terms & Conditions', type: 'textarea', full: true, placeholder: 'Legal terms shown at checkout' },
];

const PLAN_DETAIL_TABS = [
  { key: 'identity', label: 'Plan Identity', icon: 'ti-id-badge-2', fields: PLAN_TAB_IDENTITY },
  { key: 'pricing', label: 'Plan & Pricing', icon: 'ti-currency-dollar', fields: PLAN_TAB_PRICING },
  { key: 'eligibility', label: 'Duration & Eligibility', icon: 'ti-calendar-time', fields: PLAN_TAB_ELIGIBILITY },
  { key: 'placement', label: 'Placement & Visibility', icon: 'ti-layout-grid', fields: PLAN_TAB_PLACEMENT },
  { key: 'media', label: 'Media & Terms', icon: 'ti-photo-video', fields: PLAN_TAB_MEDIA },
];

const PLAN_DETAIL_DEFAULTS = {
  planName: '', planCode: '', displayOrder: '', shortDescription: '', internalDescription: '', planStatus: 'Draft',
  planType: PLAN_TYPE_CHOICES[0], pricingModel: PRICING_MODELS[0], currency: ['USD'],
  taxInclusive: 'No', taxConfiguration: 'Market-based', billingFrequency: 'Monthly',
  autoRenewal: 'No', prorationAllowed: 'No', cancellationAllowed: 'No', refundEligible: 'No',
  refundPolicy: '', effectiveFrom: '', effectiveUntil: '',
  basePrice: '', pricePerListing: '', minListings: '', maxListings: '',
  pricePerUnit: '', minUnits: '', maxUnits: '',
  pricePerProperty: '', minProperties: '', maxProperties: '',
  pricePerCampaign: '', minCampaigns: '', maxCampaigns: '',
  quantityType: 'Listings', tierCalculationMethod: 'Graduated', tierTable: [''], minQuantity: '', maxQuantity: '',
  duration: '', durationType: '', startTrigger: '', endTrigger: '',
  eligiblePersonas: [], usMarket: 'Yes', indiaMarket: 'Yes', pmsSubRequired: 'No', marketplaceEnrollmentRequired: 'No',
  customerStatus: 'Any', promotionScope: '', listingType: [], listingMustBeActive: 'No',
  listingReadinessRequired: 'No', maxActivePromotions: '', maxRedemptions: '', redemptionPeriod: '',
  oneCampaignPerListing: 'No', stackingAllowed: 'No',
  featuredPlacement: '', featuredSectionEligible: 'No', searchVisibilityBoost: '', placementPriority: '',
  featuredSlotEligible: 'No', rotationEnabled: 'No', rotationWeight: '', maxFeaturedSlots: '',
  featuredBadgeEnabled: 'No', badgeLabel: '', enhancedCardDisplay: 'No', enhancedPropertyPage: 'No',
  highlightedBackground: 'No',
  searchRankingBoost: 'No', categorySearchBoost: 'No', locationSearchBoost: 'No',
  geographicTargetingEnabled: 'No', geographicTargetingScope: '',
  sponsoredLabelEnabled: 'No', mapHighlightEnabled: 'No', spotlightBadgeEnabled: 'No', homepagePlacementEnabled: 'No',
  leadCtaEnabled: 'No', leadCtaLabel: '', openHouseEventSupport: 'No',
  planAnalyticsEnabled: 'Yes',
  maxPhotos: '', maxVideos: '', maxVirtualTours: '', maxFloorPlans: '', max360Media: '',
  featuredMediaRequired: 'No', mediaQualityRequirement: '', campaignExtensionAllowed: 'No',
  campaignRenewalAllowed: 'No', transferToAnotherListing: 'No', discountAllowed: 'No', couponCompatible: 'No',
  customerFacingDescription: '', benefits: [''], termsAndConditions: '',
};

// Real record (ListingPromotionPlanSerializer) -> full FE form shape.
function buildPlanDetailForm(plan) {
  if (!plan) return { ...PLAN_DETAIL_DEFAULTS };
  const f = { ...PLAN_DETAIL_DEFAULTS };
  f.planName = plan.name || '';
  f.planCode = plan.plan_code || '';
  f.displayOrder = numOrBlank(plan.sort_order);
  f.shortDescription = plan.short_description || '';
  f.internalDescription = plan.internal_description || '';
  f.planStatus = planStatusFromApi(plan.plan_status);
  f.planType = enumFromApi('planType', plan.plan_type) || PLAN_TYPE_CHOICES[0];
  f.pricingModel = enumFromApi('pricingModel', plan.pricing_model) || PRICING_MODELS[0];
  f.currency = plan.currencies && plan.currencies.length ? plan.currencies : ['USD'];
  f.taxInclusive = yesNoFromApi(plan.tax_inclusive);
  f.taxConfiguration = enumFromApi('taxConfiguration', plan.tax_configuration);
  f.prorationAllowed = yesNoFromApi(plan.proration_allowed);
  f.cancellationAllowed = yesNoFromApi(plan.cancellation_allowed);
  f.refundEligible = yesNoFromApi(plan.refund_eligible);
  f.refundPolicy = plan.refund_policy || '';
  f.effectiveFrom = plan.effective_from || '';
  f.effectiveUntil = plan.effective_until || '';
  f.billingFrequency = enumFromApi('billingFrequency', plan.billing_frequency) || 'Monthly';
  f.autoRenewal = yesNoFromApi(plan.auto_renewal);
  f.basePrice = numOrBlank(plan.base_price);
  f.pricePerListing = numOrBlank(plan.price_per_listing);
  f.minListings = numOrBlank(plan.minimum_listings);
  f.maxListings = numOrBlank(plan.maximum_listings);
  f.pricePerUnit = numOrBlank(plan.price_per_unit);
  f.minUnits = numOrBlank(plan.minimum_units);
  f.maxUnits = numOrBlank(plan.maximum_units);
  f.pricePerProperty = numOrBlank(plan.price_per_property);
  f.minProperties = numOrBlank(plan.minimum_properties);
  f.maxProperties = numOrBlank(plan.maximum_properties);
  f.pricePerCampaign = numOrBlank(plan.price_per_campaign);
  f.minCampaigns = numOrBlank(plan.minimum_campaigns);
  f.maxCampaigns = numOrBlank(plan.maximum_campaigns);
  f.quantityType = plan.quantity_type || 'Listings';
  f.tierCalculationMethod = plan.tier_calculation_method || 'Graduated';
  f.minQuantity = numOrBlank(plan.minimum_quantity);
  f.maxQuantity = numOrBlank(plan.maximum_quantity);
  f.tierTable = (plan.pricing_tiers && plan.pricing_tiers.length)
    ? plan.pricing_tiers.map(t => `${t.minimum_quantity}–${t.maximum_quantity ?? '+'} @ $${t.price_per_unit}`)
    : [''];
  f.duration = numOrBlank(plan.duration_days);
  f.durationType = enumFromApi('durationType', plan.duration_type);
  f.startTrigger = enumFromApi('startTrigger', plan.start_trigger);
  f.endTrigger = enumFromApi('endTrigger', plan.end_trigger);
  f.customerStatus = enumFromApi('customerStatus', plan.customer_status) || 'Any';
  f.promotionScope = enumFromApi('promotionScope', plan.promotion_scope);
  f.eligiblePersonas = (plan.eligible_personas || []).map(p => PERSONA_FROM_API[p] || p);
  f.listingType = plan.eligible_listing_types && plan.eligible_listing_types.length ? plan.eligible_listing_types : [];
  f.usMarket = yesNoFromApi(plan.us_market);
  f.indiaMarket = yesNoFromApi(plan.india_market);
  f.pmsSubRequired = yesNoFromApi(plan.pms_subscription_required);
  f.marketplaceEnrollmentRequired = yesNoFromApi(plan.marketplace_enrollment_required);
  f.listingMustBeActive = yesNoFromApi(plan.listing_must_be_active);
  f.listingReadinessRequired = yesNoFromApi(plan.listing_readiness_required);
  f.maxActivePromotions = numOrBlank(plan.maximum_active_promotions);
  f.maxRedemptions = numOrBlank(plan.maximum_redemptions);
  f.redemptionPeriod = numOrBlank(plan.redemption_period_days);
  f.oneCampaignPerListing = yesNoFromApi(plan.one_campaign_per_listing);
  f.stackingAllowed = yesNoFromApi(plan.stacking_allowed);
  f.featuredPlacement = enumFromApi('featuredPlacement', plan.featured_placement);
  f.featuredSectionEligible = yesNoFromApi(plan.featured_section_eligible);
  f.featuredSlotEligible = yesNoFromApi(plan.featured_slot_eligible);
  f.searchVisibilityBoost = plan.search_visibility_boost || '';
  // Not enumFromApi — placementPriority has no static ENUM_MAPS entry
  // (Session 50, Phase 0: its code<->label conversion comes from the live
  // UNDropdown fetch instead, see PlanFormModal). enumFromApi happens to
  // pass the raw code straight through when a field has no map entry, so
  // this worked by accident either way, but reading the raw API field
  // directly here is what's actually true, not a coincidence of a
  // fallback branch.
  f.placementPriority = plan.placement_priority || '';
  f.rotationEnabled = yesNoFromApi(plan.rotation_enabled);
  f.rotationWeight = numOrBlank(plan.rotation_weight);
  f.maxFeaturedSlots = numOrBlank(plan.maximum_featured_slots);
  f.featuredBadgeEnabled = yesNoFromApi(plan.featured_badge_enabled);
  f.badgeLabel = plan.badge_label || '';
  f.enhancedCardDisplay = yesNoFromApi(plan.enhanced_card_display);
  f.enhancedPropertyPage = yesNoFromApi(plan.enhanced_property_page);
  f.highlightedBackground = yesNoFromApi(plan.highlighted_background);
  f.searchRankingBoost = yesNoFromApi(plan.search_ranking_boost);
  f.categorySearchBoost = yesNoFromApi(plan.category_search_boost);
  f.locationSearchBoost = yesNoFromApi(plan.location_search_boost);
  f.geographicTargetingEnabled = yesNoFromApi(plan.geographic_targeting_enabled);
  f.sponsoredLabelEnabled = yesNoFromApi(plan.sponsored_label_enabled);
  f.mapHighlightEnabled = yesNoFromApi(plan.map_highlight_enabled);
  f.spotlightBadgeEnabled = yesNoFromApi(plan.spotlight_badge_enabled);
  f.homepagePlacementEnabled = yesNoFromApi(plan.homepage_placement_eligible);
  f.leadCtaEnabled = yesNoFromApi(plan.lead_cta_enabled);
  f.leadCtaLabel = plan.lead_cta_label || '';
  f.openHouseEventSupport = yesNoFromApi(plan.open_house_event_support_enabled);
  f.planAnalyticsEnabled = yesNoFromApi(plan.analytics_enabled);
  f.maxPhotos = numOrBlank(plan.max_photos);
  f.maxVideos = numOrBlank(plan.max_videos);
  f.maxVirtualTours = numOrBlank(plan.max_virtual_tours);
  f.maxFloorPlans = numOrBlank(plan.max_floor_plans);
  f.max360Media = numOrBlank(plan.max_360_media);
  f.featuredMediaRequired = yesNoFromApi(plan.featured_media_required);
  f.mediaQualityRequirement = enumFromApi('mediaQualityRequirement', plan.media_quality_requirement);
  f.campaignExtensionAllowed = yesNoFromApi(plan.campaign_extension_allowed);
  f.campaignRenewalAllowed = yesNoFromApi(plan.campaign_renewal_allowed);
  f.transferToAnotherListing = yesNoFromApi(plan.transfer_to_another_listing);
  f.discountAllowed = yesNoFromApi(plan.discount_allowed);
  f.couponCompatible = yesNoFromApi(plan.coupon_compatible);
  f.customerFacingDescription = plan.customer_facing_description || '';
  f.benefits = (plan.benefits && plan.benefits.length) ? plan.benefits.map(b => b.text) : [''];
  f.termsAndConditions = plan.terms_and_conditions || '';
  return f;
}

// FE form -> write payload (ListingPromotionPlanSerializer). Tier Table and
// Geographic Targeting Scope are deliberately never sent — see header note.
const PLAN_DIRECT_TEXT_FIELDS = [
  'shortDescription', 'internalDescription', 'refundPolicy', 'effectiveFrom', 'effectiveUntil',
  'quantityType', 'tierCalculationMethod', 'searchVisibilityBoost',
  'badgeLabel', 'leadCtaLabel', 'customerFacingDescription', 'termsAndConditions',
];
const PLAN_BOOLEAN_FIELDS = [
  'taxInclusive', 'prorationAllowed', 'cancellationAllowed', 'refundEligible', 'autoRenewal',
  'usMarket', 'indiaMarket', 'pmsSubRequired', 'marketplaceEnrollmentRequired',
  'listingMustBeActive', 'listingReadinessRequired', 'oneCampaignPerListing', 'stackingAllowed',
  'featuredSectionEligible', 'featuredSlotEligible', 'rotationEnabled', 'featuredBadgeEnabled',
  'enhancedCardDisplay', 'enhancedPropertyPage', 'highlightedBackground', 'searchRankingBoost',
  'categorySearchBoost', 'locationSearchBoost', 'geographicTargetingEnabled', 'sponsoredLabelEnabled',
  'mapHighlightEnabled', 'spotlightBadgeEnabled', 'homepagePlacementEnabled', 'leadCtaEnabled',
  'openHouseEventSupport', 'planAnalyticsEnabled', 'featuredMediaRequired', 'campaignExtensionAllowed',
  'campaignRenewalAllowed', 'transferToAnotherListing', 'discountAllowed', 'couponCompatible',
];
const PLAN_ENUM_FIELDS = [
  'planType', 'pricingModel', 'taxConfiguration', 'durationType', 'startTrigger',
  'endTrigger', 'customerStatus', 'promotionScope', 'featuredPlacement', 'mediaQualityRequirement',
  // placementPriority is NOT a static ENUM_MAPS field — its code<->label
  // conversion depends on the live UNDropdown fetch (placementPriorityOptions
  // state in PlanFormModal), so it's converted explicitly in handleSave
  // instead of through this generic loop.
];
const PLAN_NUMERIC_FIELDS = [
  'minListings', 'maxListings', 'minUnits', 'maxUnits', 'minProperties', 'maxProperties',
  'minCampaigns', 'maxCampaigns', 'minQuantity', 'maxQuantity', 'rotationWeight', 'maxFeaturedSlots',
  'maxActivePromotions', 'maxRedemptions', 'redemptionPeriod',
  'maxPhotos', 'maxVideos', 'maxVirtualTours', 'maxFloorPlans', 'max360Media',
];
const PLAN_MONEY_FIELDS = ['basePrice', 'pricePerListing', 'pricePerUnit', 'pricePerProperty', 'pricePerCampaign'];

function buildPlanApiPayload(form, productId) {
  const payload = { product: productId };
  PLAN_DIRECT_TEXT_FIELDS.forEach(k => { payload[planFieldToApiName(k)] = form[k] || ''; });
  PLAN_BOOLEAN_FIELDS.forEach(k => { payload[planFieldToApiName(k)] = yesNoToApi(form[k]); });
  PLAN_ENUM_FIELDS.forEach(k => { payload[planFieldToApiName(k)] = enumToApi(k, form[k]); });
  // billing_frequency only has real backend choices for a Subscription plan
  // (no 'ONE_TIME' choice exists) — left blank otherwise.
  payload.billing_frequency = form.planType === 'Subscription' ? enumToApi('billingFrequency', form.billingFrequency) : '';
  PLAN_NUMERIC_FIELDS.forEach(k => { payload[planFieldToApiName(k)] = numOrNull(form[k]); });
  PLAN_MONEY_FIELDS.forEach(k => { payload[planFieldToApiName(k)] = form[k] === '' ? null : form[k]; });

  payload.name = form.planName || '';
  payload.plan_status = planStatusToApi(form.planStatus);
  payload.sort_order = numOrNull(form.displayOrder) ?? 0;
  payload.duration_days = numOrNull(form.duration);
  payload.price = form.pricingModel === 'Fixed' && form.basePrice !== ''
    ? form.basePrice
    : (payload.price_per_listing ?? payload.price_per_unit ?? payload.price_per_property ?? payload.price_per_campaign ?? '0');

  payload.currencies = form.currency || [];
  payload.eligible_personas = (form.eligiblePersonas || []).map(p => PERSONA_TO_API[p]).filter(Boolean);
  payload.eligible_listing_types = form.listingType || [];

  const benefitTexts = (form.benefits || []).map(b => (b || '').trim()).filter(Boolean);
  payload.benefits = benefitTexts.map((text, i) => ({ text, sort_order: i }));

  return payload;
}

function PlanDetailField({ spec, value, onChange }) {
  switch (spec.type) {
    case 'readonly':
      return (
        <Field label={spec.label}>
          <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F1F5F9', color: value ? C.textPrimary : C.textTertiary, gap: 6 }}>
            <i className="ti ti-lock" style={{ fontSize: 11, color: C.textTertiary }} />
            {value || 'Auto-generated on save'}
          </div>
        </Field>
      );
    case 'select':
      return (
        <Field label={spec.label}>
          <CustomDropdown options={spec.options.map(o => ({ value: o, label: o }))} value={value} onChange={onChange} />
        </Field>
      );
    case 'checkboxRow':
      return (
        <Field label={spec.label}>
          <CheckboxRow options={spec.options} selected={value || []} onToggle={opt => {
            const arr = value || [];
            onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt]);
          }} />
        </Field>
      );
    case 'textarea':
      return <Field label={spec.label}><textarea style={textareaStyle} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={spec.placeholder} /></Field>;
    case 'date':
      return <Field label={spec.label}><input type="date" style={inputStyle} value={value || ''} onChange={e => onChange(e.target.value)} /></Field>;
    case 'number':
      return <Field label={spec.label}><input type="number" style={inputStyle} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={spec.placeholder} /></Field>;
    default:
      return <Field label={spec.label}><input style={inputStyle} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={spec.placeholder} /></Field>;
  }
}

function PlanFormModal({ product, plan, onClose, onSaved }) {
  const isEdit = !!plan;
  // `plan` here is the row object from the Plans table, which only ever
  // carries ListingPromotionPlanListSerializer's ~12 trimmed fields (name,
  // plan_code, price, duration_days, etc.) — it never had
  // placement_priority, effective_from/until, or most of the ~80-field
  // schema. Fixed same session (flagged when Placement Priority/Effective
  // Dates appeared blank on every reopen, even right after a successful
  // save): on edit, fetch the FULL plan via apiGetPlan before building the
  // form, same pattern ProductFormModal already uses for Products. `form`
  // starts from the trimmed row as an instant placeholder so the modal
  // isn't empty before the fetch resolves.
  const [form, setForm] = useState(() => buildPlanDetailForm(plan));
  const [activeDetailTab, setActiveDetailTab] = useState('identity');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Placement Priority's options — admin-configurable (UNDropdown table),
  // fetched here rather than hardcoded.
  const [placementPriorityOptions, setPlacementPriorityOptions] = useState([]);
  // PE-10: whether the last Placement Priority dropdown fetch failed —
  // drives the inline retry banner below. A failed fetch never blocks the
  // Plan's own data (see the Promise.allSettled note below); it only means
  // the field is showing a raw stored code (e.g. "TOP") instead of its
  // friendly label (e.g. "Top Priority"), with no way to fix that short of
  // closing and reopening the modal — this flag + loadPlacementPriorityOptions
  // below are what let the admin retry in place instead.
  const [placementPriorityError, setPlacementPriorityError] = useState(false);
  // The plan's raw stored option_code, kept separately from
  // form.placementPriority (which displays the resolved label once options
  // are in hand) so a retry can still resolve the correct label later, even
  // though the initial failed attempt already left the raw code showing.
  const [placementPriorityRawCode, setPlacementPriorityRawCode] = useState(isEdit ? (plan.placement_priority || '') : '');

  // Shared by the initial "Add Plan" load and the retry banner's button —
  // re-fetches the dropdown options and, if a raw stored code is on file
  // (the Edit case), re-resolves it to its label the moment options arrive.
  const loadPlacementPriorityOptions = () => {
    setPlacementPriorityError(false);
    return apiGetPlanDropdownOptions('PLACEMENT_PRIORITY')
      .then(dd => {
        const opts = dd?.options || [];
        setPlacementPriorityOptions(opts);
        if (placementPriorityRawCode) {
          const match = opts.find(o => o.option_code === placementPriorityRawCode);
          if (match) setForm(f => ({ ...f, placementPriority: match.option_label }));
        }
        return opts;
      })
      .catch(err => {
        setPlacementPriorityError(true);
        // eslint-disable-next-line no-console
        console.error('Failed to load Placement Priority options:', err);
      });
  };

  useEffect(() => {
    let cancelled = false;
    if (isEdit) {
      setLoading(true);
      // Promise.allSettled, not Promise.all — these two calls are
      // independent and must not be able to take each other down. Session
      // 50 bug: Promise.all fails the WHOLE batch if either call rejects,
      // which left the modal stuck on the trimmed list-row placeholder
      // (buildPlanDetailForm(plan) from the lazy useState init above) —
      // blanking Effective Dates/Placement Priority on screen even though
      // the Plan record itself had loaded fine, whenever the dropdown-
      // options call alone hiccupped. allSettled lets a dropdown failure
      // stay a dropdown failure instead of masquerading as "the save didn't
      // persist."
      Promise.allSettled([apiGetPlan(plan.id), apiGetPlanDropdownOptions('PLACEMENT_PRIORITY')])
        .then(([planResult, ddResult]) => {
          if (cancelled) return;
          const opts = (ddResult.status === 'fulfilled' && ddResult.value?.options) || [];
          setPlacementPriorityOptions(opts);
          setPlacementPriorityError(ddResult.status === 'rejected');
          if (planResult.status === 'fulfilled') {
            const f = buildPlanDetailForm(planResult.value);
            // Keep the raw code around (PE-10) so a later retry of the
            // dropdown fetch can still resolve the label, independent of
            // whether this first attempt succeeded.
            setPlacementPriorityRawCode(f.placementPriority || '');
            // Convert the stored code to its display label when the option
            // list is in hand; if the dropdown call failed, opts is empty
            // and this just leaves the raw code until a retry succeeds —
            // still strictly better than losing the Plan data too.
            const match = opts.find(o => o.option_code === f.placementPriority);
            if (match) f.placementPriority = match.option_label;
            setForm(f);
          } else {
            // The Plan record itself failed to load — this is the failure
            // that actually matters, surface it instead of silently leaving
            // the trimmed-row placeholder on screen looking like real data.
            setError(planResult.reason?.message || 'Failed to load plan details. Please reopen this plan.');
          }
          if (ddResult.status === 'rejected') {
            // eslint-disable-next-line no-console
            console.error('Failed to load Placement Priority options:', ddResult.reason);
          }
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      // Add Plan — no existing record to fetch, just the dropdown options.
      loadPlacementPriorityOptions();
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setListItem = (key, i, val) => setForm(f => ({ ...f, [key]: (f[key] || []).map((x, idx) => (idx === i ? val : x)) }));
  const addListItem = (key) => setForm(f => ({ ...f, [key]: [...(f[key] || []), ''] }));
  const removeListItem = (key, i) => setForm(f => ({ ...f, [key]: (f[key] || []).filter((_, idx) => idx !== i) }));

  const pricingTabFields = [
    ...PLAN_TAB_PRICING,
    { key: 'divider-pricing-model', type: 'divider', label: `${form.pricingModel} Pricing Fields`, full: true },
    ...(PRICING_MODEL_EXTRA_FIELDS[form.pricingModel] || []),
    ...(form.planType === 'Subscription' ? [
      { key: 'divider-subscription', type: 'divider', label: 'Subscription Billing', full: true },
      ...SUBSCRIPTION_EXTRA_FIELDS,
    ] : []),
  ];

  // Placement tab's Placement Priority field gets its live, UNDropdown-
  // fetched options spliced in here — PLAN_TAB_PLACEMENT itself carries an
  // empty options list (see its definition) since the real list only
  // exists once this modal has fetched it.
  const placementTabFields = PLAN_TAB_PLACEMENT.map(f =>
    f.key === 'placementPriority'
      ? { ...f, options: placementPriorityOptions.map(o => o.option_label) }
      : f
  );

  const activeTab = activeDetailTab === 'pricing'
    ? { ...PLAN_DETAIL_TABS.find(t => t.key === 'pricing'), fields: pricingTabFields }
    : activeDetailTab === 'placement'
    ? { ...PLAN_DETAIL_TABS.find(t => t.key === 'placement'), fields: placementTabFields }
    : (PLAN_DETAIL_TABS.find(t => t.key === activeDetailTab) || PLAN_DETAIL_TABS[0]);

  const handleSave = async () => {
    if (!form.planName.trim()) { setError('Plan Name is required.'); setActiveDetailTab('identity'); return; }
    if (form.duration === '' || Number(form.duration) <= 0) {
      setError('Duration (days) is required and must be a positive number.');
      setActiveDetailTab('eligibility');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = buildPlanApiPayload(form, product.id);
      // Not part of buildPlanApiPayload's generic PLAN_ENUM_FIELDS loop —
      // placementPriority's code<->label map comes from the live UNDropdown
      // fetch (placementPriorityOptions), not a static ENUM_MAPS table.
      // Falls back to sending the form value as-is if it somehow still
      // holds a raw code (e.g. save attempted before the fetch resolved).
      const ppMatch = placementPriorityOptions.find(o => o.option_label === form.placementPriority);
      payload.placement_priority = ppMatch ? ppMatch.option_code : (form.placementPriority || '');
      const saved = isEdit ? await apiUpdatePlan(plan.id, payload) : await apiCreatePlan(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Failed to save plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? `Edit Plan — ${plan.name}` : `Add Plan — ${product.name}`}
      onClose={onClose}
      width={960}
      footer={<>
        <button onClick={onClose} style={CANCEL_BTN_STYLE}>Cancel</button>
        <PrimaryButton label={saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Plan')} icon="ti-device-floppy" onClick={handleSave} disabled={saving || loading} />
      </>}
    >
      <ErrorBanner message={error} />
      {loading ? (
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, padding: '20px 0', textAlign: 'center' }}>Loading plan…</div>
      ) : (
      <>
      <div style={{ marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontFamily: F.headline, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>
          <i className="ti ti-package" style={{ color: C.primary }} /> Product
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Product">
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F1F5F9', color: C.textPrimary, gap: 6 }}>
                <i className="ti ti-lock" style={{ fontSize: 11, color: C.textTertiary }} />{product.name}
              </div>
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Product Code">
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F1F5F9', color: C.textPrimary, gap: 6 }}>
                <i className="ti ti-lock" style={{ fontSize: 11, color: C.textTertiary }} />{product.code}
              </div>
            </Field>
          </div>
        </div>
        {product.personas && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {product.personas.map(p => <StatusPill key={p} status={p} tone="grey" />)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontFamily: F.headline, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>
        <i className="ti ti-list-details" style={{ color: C.primary }} /> Plan Details
      </div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {PLAN_DETAIL_TABS.map(tab => {
          const active = tab.key === activeDetailTab;
          return (
            <button key={tab.key} onClick={() => setActiveDetailTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', whiteSpace: 'nowrap',
              background: 'transparent', border: 'none',
              borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
              marginBottom: -1,
              fontFamily: F.body, fontSize: 12, fontWeight: active ? 700 : 600,
              color: active ? C.primary : C.textSecondary, cursor: 'pointer',
            }}>
              <i className={`ti ${tab.icon}`} style={{ fontSize: 13 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeDetailTab === 'placement' && placementPriorityError && (
        // PE-10: surfaced instead of only logging to console — the field
        // below is showing Placement Priority's raw stored code (no label)
        // because this fetch failed; ErrorBanner's existing onRetry wiring
        // re-runs the same loader used on open, no modal close/reopen needed.
        <ErrorBanner
          message="Couldn't load Placement Priority's option labels — the field below is showing its raw stored value instead."
          onRetry={loadPlacementPriorityOptions}
        />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {(activeTab.fields || []).map(spec => (
          <div key={spec.key} style={spec.full ? { gridColumn: '1 / -1' } : undefined}>
            {spec.type === 'divider' ? (
              <div style={{ marginTop: 6, marginBottom: 10, paddingTop: 12, borderTop: `1px dashed ${C.border}`, fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {spec.label}
              </div>
            ) : spec.type === 'list' ? (
              <Field label={spec.label}>
                {(form[spec.key] || []).map((val, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <input style={inputStyle} value={val} onChange={e => setListItem(spec.key, i, e.target.value)} placeholder={spec.listPlaceholder || 'e.g. Top-of-search placement'} />
                    <button onClick={() => removeListItem(spec.key, i)} style={{ width: 34, height: 38, flexShrink: 0, background: '#F8F9FA', border: `1px solid #E8ECF0`, borderRadius: 6, cursor: 'pointer', color: C.textSecondary }}>
                      <i className="ti ti-trash" style={{ fontSize: 13 }} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addListItem(spec.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: '4px 0', fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
                  <i className="ti ti-plus" style={{ fontSize: 12 }} /> {spec.key === 'tierTable' ? 'Add Tier' : 'Add Benefit'}
                </button>
              </Field>
            ) : (
              <PlanDetailField spec={spec} value={form[spec.key]} onChange={v => setField(spec.key, v)} />
            )}
          </div>
        ))}
      </div>
      </>
      )}
    </ModalShell>
  );
}

// Matrix row for the Plan table — mirrors ProductCatalogSection's row markup
// (icon-less here since Plans don't carry their own icon/color the way
// Products do) so the two tables in this screen read as one system.
// Replaced the old per-Plan card layout Sep 29, 2026 at the user's request.
function PlanRow({ plan, idx, onEdit, onDelete }) {
  const status = planStatusFromApi(plan.plan_status);
  const planType = enumFromApi('planType', plan.plan_type) || plan.plan_type;
  const pricingModel = enumFromApi('pricingModel', plan.pricing_model) || plan.pricing_model;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: PLAN_GRID_COLS, gap: 12,
      padding: '11px 16px', alignItems: 'center',
      borderBottom: `1px solid ${C.neutral}`,
      background: idx % 2 === 1 ? '#FAFBFC' : C.white,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <TruncatedCell text={plan.name} maxChars={PLAN_NAME_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.textPrimary }} />
          {plan.is_default && <ActionTooltip text="Default plan for this Product"><i className="ti ti-star-filled" style={{ fontSize: 11, color: C.primary, flexShrink: 0 }} /></ActionTooltip>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily: F.body, fontSize: 10, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.plan_code}</span>
          {plan.tag && <StatusPill status={plan.tag} tone="amber" />}
        </div>
      </div>
      <TruncatedCell text={planType} maxChars={PLAN_TYPE_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }} />
      <TruncatedCell text={pricingModel} maxChars={PLAN_TYPE_MAX_CHARS} style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.blue }} />
      <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
        {Number(plan.price) > 0 ? `$${Number(plan.price).toFixed(0)}` : 'Free'}
      </div>
      <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>{plan.duration_days}d</div>
      <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>{plan.sort_order}</div>
      <div><StatusPill status={status} tone={PLAN_STATUS_TONE[status] || 'grey'} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconButton icon="ti-pencil" onClick={() => onEdit(plan)} tooltip="Edit plan" />
        <IconButton icon="ti-trash" danger onClick={() => onDelete(plan)} tooltip="Delete plan" />
      </div>
    </div>
  );
}

function ProductPlansPanel({ product, onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [adding, setAdding] = useState(false);

  const fetchPlans = () => {
    setLoading(true); setError('');
    apiListPlans({ product: product.id })
      .then(data => setPlans(data))
      .catch(err => setError(err.message || 'Failed to load plans.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchPlans(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [product.id]);

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    try { await apiDeletePlan(plan.id); fetchPlans(); }
    catch (err) { window.alert(err.message || 'Failed to delete plan.'); }
  };

  const closeForm = () => { setEditingPlan(null); setAdding(false); };
  const savedForm = () => { closeForm(); fetchPlans(); };

  return (
    <SectionCard
      title={`Plans — ${product.name}`}
      subtitle={`Real ListingPromotionPlan rows for ${product.code}`}
      action={<div style={{ display: 'flex', gap: 8 }}>
        <PrimaryButton label="Add Plan" icon="ti-plus" onClick={() => setAdding(true)} style={{ padding: '7px 14px' }} />
        <button onClick={onClose} style={CANCEL_BTN_STYLE}>Close</button>
      </div>}
    >
      <ErrorBanner message={error} onRetry={fetchPlans} />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 820 }}>
            <div style={{ display: 'grid', gridTemplateColumns: PLAN_GRID_COLS, gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
              {['Plan', 'Type', 'Pricing Model', 'Price', 'Duration', 'Sort', 'Status', 'Actions'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>Loading plans…</div>
            ) : plans.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>No plans yet for this Product.</div>
            ) : plans.map((plan, idx) => (
              <PlanRow key={plan.id} plan={plan} idx={idx} onEdit={setEditingPlan} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      </div>
      {plans.length > 0 && (
        <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, padding: '10px 2px 0' }}>
          Showing {plans.length} of {plans.length} plans
        </div>
      )}
      {(editingPlan || adding) && (
        <PlanFormModal product={product} plan={editingPlan} onClose={closeForm} onSaved={savedForm} />
      )}
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function PromotionProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plansForProduct, setPlansForProduct] = useState(null);

  const fetchProducts = () => {
    setLoading(true); setError('');
    apiListProducts()
      .then(data => setProducts(data.map(productListItemFromApi)))
      .catch(err => setError(err.message || 'Failed to load products.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div>
      <ProductCatalogSection
        products={products}
        loading={loading}
        error={error}
        onRefresh={fetchProducts}
        onManagePlans={p => setPlansForProduct(p)}
      />
      {plansForProduct && (
        <ProductPlansPanel product={plansForProduct} onClose={() => setPlansForProduct(null)} />
      )}
      <CatalogAllocationPanels onProductChanged={fetchProducts} />
    </div>
  );
}
