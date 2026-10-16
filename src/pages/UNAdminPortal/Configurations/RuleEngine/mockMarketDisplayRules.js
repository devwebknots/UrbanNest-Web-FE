/**
 * mockMarketDisplayRules.js — FE-only layout metadata for the Market
 * Display tab (UN Admin → Configurations → Rule Engine → Market Display).
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 50, continued — `MarketplaceDisplayRuleDefinition` (model +
 * migration + seed script + Admin API) is now built
 * (rules_engine/marketplace_display/, mounted at
 * /api/admin/marketplace-display-rules/). MarketDisplayRules.jsx fetches the
 * real rule rows from there via marketplaceDisplayApi.js — this file no
 * longer holds sample data for them.
 *
 * What's left here, and kept deliberately: `RULE_GROUPS` (display-section
 * labels — "ranking"/"section" are also the real `group` value stored on
 * each backend row) and `UI_BY_CODE`, keyed by the same `code` the backend
 * returns, telling MarketDisplayRules.jsx how to lay out that rule's
 * `parameters` — plain editable fields / a weight group that needs a
 * sum-to-target check / the priority-bucket table. This has no backend
 * equivalent by design (see architecture doc §12 — the backend only ever
 * stores values, never how to render them) and is not expected to go away;
 * it's the FE's own presentation layer, not a stand-in for real data.
 */

export const RULE_GROUPS = [
  { id: 'ranking', label: 'Ranking Formula Components' },
  { id: 'section', label: 'Section Display Behavior' },
];

// kind: 'fields' (plain editable values) | 'weights' (must sum to `target`,
// enforced server-side too — see admin_serializers.py's WEIGHT_SUM_RULES,
// which uses the identical key lists/targets as below) | 'bucket' (ordered
// priority table).
export const UI_BY_CODE = {
  RECENCY_DECAY: {
    kind: 'fields',
    fields: [
      { key: 'half_life', label: 'Half-life (days)', help: 'Days for the recency score to decay halfway to the floor.' },
      { key: 'floor', label: 'Floor', help: 'Minimum recency score a listing can decay to, regardless of age.' },
    ],
  },
  QUALITY_SCORING: {
    kind: 'weights', target: 1, decimals: 2,
    fields: [
      { key: 'readiness_weight', label: 'Readiness weight' },
      { key: 'media_weight', label: 'Media weight' },
      { key: 'completeness_weight', label: 'Completeness weight' },
    ],
  },
  EXPOSURE_FAIRNESS: {
    kind: 'fields',
    fields: [
      { key: 'flat_fallback', label: 'Flat fallback score', help: 'Used for every listing until the real fairness window/decay logic ships.' },
    ],
  },
  RELEVANCE_PERSONALIZATION: {
    kind: 'weights', target: 1, decimals: 2,
    fields: [
      { key: 'preference_match_weight', label: 'Preference match weight' },
      { key: 'geo_proximity_weight', label: 'Geo proximity weight' },
    ],
  },
  PLACEMENT_PRIORITY_BUCKET: {
    kind: 'bucket',
    fields: [
      { key: 'top', label: 'Top Priority' },
      { key: 'high', label: 'High Priority' },
      { key: 'standard', label: 'Standard Priority' },
      { key: 'low', label: 'Low Priority' },
      { key: 'none', label: 'No Priority Boost' },
    ],
  },
  PREMIUM_BASIC_QUOTA_MIX: {
    kind: 'weights', target: 100, decimals: 0, unit: '%',
    fields: [
      { key: 'premium_pct', label: 'Premium %' },
      { key: 'basic_pct', label: 'Basic %' },
    ],
  },
  SAMPLE_DATA_BACKFILL: {
    kind: 'fields',
    fields: [
      { key: 'min_listings_threshold', label: 'Minimum listings before fallback' },
    ],
  },
};
