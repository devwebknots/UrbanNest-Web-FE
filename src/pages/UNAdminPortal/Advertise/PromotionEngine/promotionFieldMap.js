// src/pages/UNAdminPortal/Advertise/PromotionEngine/promotionFieldMap.js
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 48 — Phase 6 (FE wiring). Every FE<->backend vocabulary and field-
// name mismatch the Promotion Engine screens have to bridge, centralized
// here in one auditable place instead of scattered inline across
// PromotionProductCatalog.jsx / PromotionCampaigns.jsx. Verified line-by-line
// against the real models (promotion_engine/models.py,
// listings/models.py's ListingPromotionPlan) and serializers, not guessed —
// see each section's comment for what it was checked against.
//
// General rule used throughout: `toApi(field, feValue)` converts a value the
// FE form holds into what the backend expects; `fromApi(field, apiValue)`
// does the reverse when loading a real record into the form. Enum fields
// that are simple "Title Case" <-> "UPPER_SNAKE" pairs use the small
// ENUM_MAPS table + toApiEnum/fromApiEnum helpers; fields with real
// structural differences (booleans standing in for 3-way FE selects,
// camelCase keys that don't mechanically match their snake_case field, etc.)
// get their own explicit entry.
// ─────────────────────────────────────────────────────────────────────────────

// ─── camelCase <-> snake_case ───────────────────────────────────────────────
export function camelToSnake(key) {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}
export function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// ─── Persona ─────────────────────────────────────────────────────────────
// FE PERSONAS (PromotionProductCatalog.jsx) <-> ListingPromotionProduct.
// Persona / PromotionCampaign.Persona / ListingPromotionPlan.
// eligible_personas — all three backend enums use the same 3-value
// vocabulary (LANDLORD / IND_PM / ORG_PM), confirmed by reading both models.
export const PERSONA_TO_API = { 'Landlord': 'LANDLORD', 'Ind PM': 'IND_PM', 'Org PM': 'ORG_PM' };
export const PERSONA_FROM_API = { LANDLORD: 'Landlord', IND_PM: 'Ind PM', ORG_PM: 'Org PM' };

// ─── Market ──────────────────────────────────────────────────────────────
// FE MARKETS codes ('US'/'India') <-> ListingPromotionProduct.Market
// ('US'/'INDIA'). US needs no translation; only India's code differs.
export const MARKET_TO_API = { US: 'US', India: 'INDIA' };
export const MARKET_FROM_API = { US: 'US', INDIA: 'India' };

// ─── Product Target Types (ListingPromotionProduct.allowed_target_types) ──
// FE TARGET_TYPES <-> ListingPromotionProduct.TargetType.
export const PRODUCT_TARGET_TYPE_TO_API = {
  Listing: 'LISTING', Property: 'PROPERTY', Portfolio: 'PORTFOLIO', 'Multiple Listings': 'MULTIPLE_LISTINGS',
};
export const PRODUCT_TARGET_TYPE_FROM_API = {
  LISTING: 'Listing', PROPERTY: 'Property', PORTFOLIO: 'Portfolio', MULTIPLE_LISTINGS: 'Multiple Listings',
};

// ─── Product Status (ListingPromotionProduct.status) ───────────────────────
// FE STATUSES = ['Active','Draft','Inactive','Archived'] — matches
// ListingPromotionProduct.Status exactly (ACTIVE/DRAFT/INACTIVE/ARCHIVED),
// just case. Plain uppercase/titlecase round-trip, no lookup table needed:
export const statusToApi = (v) => (v || '').toUpperCase();
export const statusFromApi = (v) => {
  const s = (v || '').toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
};

// ─── Plan Status (ListingPromotionPlan.plan_status) ─────────────────────────
// IMPORTANT: this is NOT the same vocabulary as Product's STATUSES — the
// real ListingPromotionPlan.PLAN_STATUS_CHOICES is DRAFT/ACTIVE/PAUSED/
// ARCHIVED (no INACTIVE; PAUSED instead). The pre-wiring FE reused Product's
// STATUSES ('Active'/'Draft'/'Inactive'/'Archived') for the Plan Identity
// tab's "Plan Status" field, which never actually matched the real Plan
// model — that endpoint was never wired to plan_status before this pass, so
// the mismatch was latent. Fixed here: a dedicated PLAN_STATUSES list, used
// only for the Plan form's planStatus field.
export const PLAN_STATUSES = ['Draft', 'Active', 'Paused', 'Archived'];
export const planStatusToApi = (v) => (v || '').toUpperCase();
export const planStatusFromApi = (v) => {
  const s = (v || '').toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : 'Draft';
};

// ─── Campaign Status (PromotionCampaign.status) ────────────────────────────
// FE CAMPAIGN_STATUSES (PromotionCampaigns.jsx) = ['Draft','Scheduled',
// 'Active','Paused','Completed','Cancelled'] — exact match to
// PromotionCampaign.Status, just case. Same plain uppercase/titlecase round
// trip as Product status above (statusToApi/statusFromApi reused).

// ─── Campaign Target Type (PromotionCampaign.target_type) ─────────────────
// FE Campaigns.jsx TARGET_TYPES = ['Single Property','Multi-Property
// Portfolio'] <-> PromotionCampaign.TargetType (SINGLE_PROPERTY /
// MULTI_PROPERTY_PORTFOLIO).
export const CAMPAIGN_TARGET_TYPE_TO_API = {
  'Single Property': 'SINGLE_PROPERTY', 'Multi-Property Portfolio': 'MULTI_PROPERTY_PORTFOLIO',
};
export const CAMPAIGN_TARGET_TYPE_FROM_API = {
  SINGLE_PROPERTY: 'Single Property', MULTI_PROPERTY_PORTFOLIO: 'Multi-Property Portfolio',
};

// ─── Pacing / Bidding (PromotionCampaign.pacing_mode / bidding_strategy) ──
export const PACING_TO_API = { Standard: 'STANDARD', Accelerated: 'ACCELERATED' };
export const PACING_FROM_API = { STANDARD: 'Standard', ACCELERATED: 'Accelerated' };
export const BIDDING_TO_API = { Automatic: 'AUTOMATIC', Manual: 'MANUAL' };
export const BIDDING_FROM_API = { AUTOMATIC: 'Automatic', MANUAL: 'Manual' };

// ─── Product capability fields (19 `supports*` gates) ──────────────────────
// Every PRODUCT_CAPABILITY_FIELDS key (PromotionProductCatalog.jsx) matches
// its ListingPromotionProduct field mechanically via camelToSnake — verified
// against all 19 real model fields, e.g. supportsFeaturedPlacement ->
// supports_featured_placement. No exceptions in this group.

// ─── Campaign Feature Keys -> Tab 4 backend field / feature_key vocabulary ─
// CAMPAIGN_FEATURE_KEYS (PromotionProductCatalog.jsx, 17 entries) map to
// services.TAB4_FIELDS' snake_case names — the same vocabulary used for
// plan_snapshot keys and ListingPromotionProduct.feature_addon_prices dict
// keys and PromotionCampaignFeatureAddon.feature_key. Verified against
// services.py's TAB4_FIELDS list directly. Most convert mechanically via
// camelToSnake; 3 don't (name drift between FE and backend) and are listed
// explicitly below instead of relying on the auto-convert.
export const CAMPAIGN_FEATURE_KEY_TO_API = {
  searchVisibilityBoost: 'search_visibility_boost',
  searchRankingBoost: 'search_ranking_boost',
  categorySearchBoost: 'category_search_boost',
  locationSearchBoost: 'location_search_boost',
  featuredSectionEligible: 'featured_section_eligible',
  featuredBadgeEnabled: 'featured_badge_enabled',
  enhancedCardDisplay: 'enhanced_card_display',
  rotationEnabled: 'rotation_enabled',
  placementPriority: 'placement_priority',
  sponsoredLabelEnabled: 'sponsored_label_enabled',
  mapHighlightEnabled: 'map_highlight_enabled',
  spotlightBadgeEnabled: 'spotlight_badge_enabled',
  // Name drift: FE says "Enabled", backend field is "..._eligible".
  homepagePlacementEnabled: 'homepage_placement_eligible',
  geographicTargetingEnabled: 'geographic_targeting_enabled',
  leadCtaEnabled: 'lead_cta_enabled',
  // Name drift: FE has no "Enabled" suffix, backend does.
  openHouseEventSupport: 'open_house_event_support_enabled',
  // Name drift: FE prefixes "plan", backend is just analytics_enabled.
  planAnalyticsEnabled: 'analytics_enabled',
};
export const CAMPAIGN_FEATURE_KEY_FROM_API = Object.fromEntries(
  Object.entries(CAMPAIGN_FEATURE_KEY_TO_API).map(([fe, api]) => [api, fe]),
);

// ─── Generic Yes/No boolean helper ─────────────────────────────────────────
// Every Plan tab field backed by a real Django BooleanField, whatever FE
// option set it uses (YES_NO / YES_NO_CONFIG / YES_NO_OPTIONAL — the
// backend only ever has 2 real states) — 'Yes' -> true, anything else
// ('No'/'Configurable'/'Optional') -> false. Reverse always collapses to
// plain Yes/No; the 3-way distinction some FE dropdowns show is cosmetic
// and doesn't have real backend state behind it (documented, deliberate
// simplification — matches how the same tradeoff was already made for
// ListingPromotionProduct's own fields during the Phase 1 backend build).
export const yesNoToApi = (v) => v === 'Yes';
export const yesNoFromApi = (v) => (v ? 'Yes' : 'No');

// Numeric text field -> nullable integer (Plan's several `text` fields that
// are placeholder-only free text in the FE but real PositiveIntegerFields
// server-side: rotationWeight, maxFeaturedSlots, maxActivePromotions,
// maxRedemptions, redemptionPeriod, maxPhotos/Videos/VirtualTours/
// FloorPlans/360Media). Blank or non-numeric -> null (field stays unset).
export const numOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const numOrBlank = (v) => (v === null || v === undefined ? '' : String(v));

// ─── Plan enum fields with a direct Title-Case <-> UPPER_SNAKE backend
// enum (verified one-by-one against ListingPromotionPlan's *_CHOICES) ──────
const ENUM_MAPS = {
  planType: { 'One-Time': 'ONE_TIME', Subscription: 'SUBSCRIPTION' },
  pricingModel: {
    Fixed: 'FIXED', 'Per Listing': 'PER_LISTING', 'Per Unit': 'PER_UNIT',
    'Per Property': 'PER_PROPERTY', 'Per Campaign': 'PER_CAMPAIGN', Tiered: 'TIERED',
  },
  taxConfiguration: { 'Market-based': 'MARKET_BASED', Flat: 'FLAT', Exempt: 'EXEMPT' },
  durationType: { 'Fixed Duration': 'FIXED_DURATION', Rolling: 'ROLLING', Unlimited: 'UNLIMITED' },
  startTrigger: { 'After Activation': 'AFTER_ACTIVATION', 'On Approval': 'ON_APPROVAL', Scheduled: 'SCHEDULED' },
  endTrigger: { 'Duration Expiry': 'DURATION_EXPIRY', Manual: 'MANUAL', Renewal: 'RENEWAL' },
  customerStatus: { Active: 'ACTIVE', Inactive: 'INACTIVE', Any: 'ANY' },
  promotionScope: { Listing: 'LISTING', Portfolio: 'PORTFOLIO', Account: 'ACCOUNT' },
  featuredPlacement: { Limited: 'LIMITED', Enhanced: 'ENHANCED', Standard: 'STANDARD' },
  mediaQualityRequirement: { Standard: 'STANDARD', Configurable: 'CONFIGURABLE', High: 'HIGH' },
  // Backend has no 'ONE_TIME' billing_frequency choice (WEEKLY/MONTHLY/
  // QUARTERLY/ANNUAL only) — the FE's "One-Time" option only ever shows
  // when Plan Type isn't Subscription anyway, where billing_frequency isn't
  // sent at all (see buildPlanApiPayload), so it maps to blank as a safety net.
  billingFrequency: { 'One-Time': '', Weekly: 'WEEKLY', Monthly: 'MONTHLY', Quarterly: 'QUARTERLY', Annual: 'ANNUAL' },
};
const ENUM_MAPS_REVERSE = Object.fromEntries(
  Object.entries(ENUM_MAPS).map(([field, map]) => [field, Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]))]),
);
export function enumToApi(field, feValue) {
  const map = ENUM_MAPS[field];
  return map ? (map[feValue] ?? '') : feValue;
}
export function enumFromApi(field, apiValue) {
  const map = ENUM_MAPS_REVERSE[field];
  if (!map) return apiValue;
  return map[apiValue] ?? '';
}

// ─── Plan field -> backend field name (mechanical camelToSnake covers most;
// the handful that don't are listed here and checked first) ───────────────
const PLAN_FIELD_NAME_OVERRIDES = {
  planName: 'name',
  planCode: 'plan_code',
  displayOrder: 'sort_order',
  planStatus: 'plan_status',
  currency: 'currencies',
  duration: 'duration_days',
  minListings: 'minimum_listings',
  maxListings: 'maximum_listings',
  minUnits: 'minimum_units',
  maxUnits: 'maximum_units',
  minProperties: 'minimum_properties',
  maxProperties: 'maximum_properties',
  minCampaigns: 'minimum_campaigns',
  maxCampaigns: 'maximum_campaigns',
  minQuantity: 'minimum_quantity',
  maxQuantity: 'maximum_quantity',
  listingType: 'eligible_listing_types',
  usMarket: 'us_market',
  indiaMarket: 'india_market',
  pmsSubRequired: 'pms_subscription_required',
  maxActivePromotions: 'maximum_active_promotions',
  maxRedemptions: 'maximum_redemptions',
  redemptionPeriod: 'redemption_period_days',
  maxFeaturedSlots: 'maximum_featured_slots',
  homepagePlacementEnabled: 'homepage_placement_eligible', // same drift as the Campaign feature key
  openHouseEventSupport: 'open_house_event_support_enabled',
  planAnalyticsEnabled: 'analytics_enabled',
  maxPhotos: 'max_photos',
  maxVideos: 'max_videos',
  maxVirtualTours: 'max_virtual_tours',
  maxFloorPlans: 'max_floor_plans',
  max360Media: 'max_360_media',
};
export function planFieldToApiName(feKey) {
  return PLAN_FIELD_NAME_OVERRIDES[feKey] || camelToSnake(feKey);
}
