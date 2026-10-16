/**
 * UNAdminRuleEngine.jsx — UN Admin Portal → Configurations → Rule Engine.
 * Top-level tab shell, replacing the old single-purpose "Listing Readiness
 * Rules" nav entry (see NavE.jsx's config-rule-engine item and App.js's
 * /admin-portal/config/rule-engine route; the old
 * /admin-portal/config/listing-readiness URL redirects here for
 * back-compat).
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 50 (continued). Approved wireframe:
 * https://claude.ai/artifact/8Vj9RwYL1LfowuY1stUaKi
 *
 * Two tabs today:
 *   - Listings       → renders the existing UNAdminListingReadiness screen
 *                       completely unchanged (same component, no edits made
 *                       to that file) — per the user's explicit instruction,
 *                       nothing about that screen's content or behavior
 *                       changes, only its position in the sidebar does. Its
 *                       own breadcrumb/heading/sub-tabs render exactly as
 *                       they do today, nested under this shell's own
 *                       breadcrumb — deliberate, per the approved wireframe.
 *   - Market Display  → the new rule catalog from marketplace-display/
 *                       UrbanNest_MarketplaceDisplayRulesEngine_Architecture.md
 *                       §12/§13 Phase 1, built ahead of its backend against
 *                       watermarked Sample Data (see MarketDisplayRules.jsx).
 *
 * A third, disabled "+ future rule set" tab is a placeholder for whatever
 * rule set comes after Market Display, so adding one later doesn't need
 * another NavE entry.
 */
import React, { useState } from 'react';
import UNAdminListingReadiness from '../ListingReadiness/UNAdminListingReadiness';
import MarketDisplayRules from './MarketDisplayRules';
import { C, F } from './ruleEngineTokens';

const TABS = [
  { id: 'listings', label: 'Listings' },
  { id: 'market-display', label: 'Market Display' },
  { id: 'future', label: '+ future rule set', disabled: true },
];

export default function UNAdminRuleEngine() {
  const [activeTab, setActiveTab] = useState('listings');
  const activeLabel = TABS.find(t => t.id === activeTab)?.label || '';

  return (
    <div>
      {/* Breadcrumb — Rule Engine level only. Each tab supplies its own page
          heading below (Listings keeps its existing one, unchanged; Market
          Display gets its own — see MarketDisplayRules.jsx). */}
      <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        Configurations
        <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
        Rule Engine
        <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
        <span style={{ color: C.textSecondary }}>{activeLabel}</span>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            style={{
              fontFamily: F.body, fontSize: 13, fontWeight: 500,
              padding: '10px 20px', border: 'none', background: 'none',
              color: tab.disabled ? C.textTertiary : (activeTab === tab.id ? C.primary : C.textTertiary),
              borderBottom: `2px solid ${activeTab === tab.id ? C.primary : 'transparent'}`,
              marginBottom: -1, cursor: tab.disabled ? 'default' : 'pointer',
              fontStyle: tab.disabled ? 'italic' : 'normal',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {activeTab === 'listings' && <UNAdminListingReadiness />}
      {activeTab === 'market-display' && <MarketDisplayRules />}
    </div>
  );
}
