/**
 * PromotionEngine.jsx — UN Admin Portal → Advertise & Monetise → Promotion
 * Engine. Top-level tab switcher for the new feature.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Step 0 of the agreed FE-first build order.
 *
 * Route: /admin-portal/advertise/promotion-engine  (wrapped in <UNAdminShell
 * activeId="advertise-promotion-engine">, see App.js)
 *
 * Background: built from 5 Figma screens the user provided for a new UN
 * Admin "Promotion Engine" feature (Product Catalog, Campaigns, Analytics,
 * Audit/Logs, Overview). Per the user's explicit decisions this session:
 *   1. Shell/nav must match the REAL live UNAdminShell/NavE, not either of
 *      the two inconsistent shells shown across the Figma screens.
 *   2. Missing Promotion Analytics data uses a Sample Data approach (see
 *      mockPromotionData.js / promotionTokens.js's SampleTag/SampleCard,
 *      reusing the exact convention already locked in for
 *      PMListingsOverview.jsx — see Listings_Overview_Design_Review.md §7).
 *   3. Visual design (font, primary/secondary color, background, dropdown
 *      sizing/styling, etc.) follows the REAL existing UN Admin design
 *      tokens, not the Figma's own styling — see promotionTokens.js's header
 *      comment for the full reasoning. The Figma is a content/layout/field
 *      reference only.
 *   4. Nav wiring: ONE new NavE child added under the existing (previously
 *      empty) "ADVERTISE & MONETISE" section — the section's 3 pre-existing
 *      placeholder children (Ad Inventory / Advertisers / Ad Performance)
 *      are untouched, per the user's confirmed AskUserQuestion choice.
 *
 * Build order (confirmed by the user):
 *   Step 0 (this file + nav/route scaffold) → 1. Product Catalog →
 *   2. Campaigns → 3. Analytics & Audit (Analytics sub-tab, then Audit &
 *   Logs sub-tab) → 4. Overview (last — rolls up the other three tabs'
 *   sample datasets).
 *
 * All four tab components below are currently placeholders except for
 * their own internal structure (Analytics & Audit already has its
 * Analytics/Audit & Logs sub-tab switcher scaffolded, since that's part of
 * the shell). Each one gets filled in during its own build step.
 */

import React, { useState } from 'react';
import { C, F } from './promotionTokens';
import PromotionOverview from './PromotionOverview';
import PromotionProductCatalog from './PromotionProductCatalog';
import PromotionCampaigns from './PromotionCampaigns';
import PromotionAnalyticsAudit from './PromotionAnalyticsAudit';

const TABS = [
  { id: 'overview',        label: 'Overview',          icon: 'ti-layout-dashboard', Component: PromotionOverview },
  { id: 'product-catalog', label: 'Product Catalog',   icon: 'ti-package',          Component: PromotionProductCatalog },
  { id: 'campaigns',       label: 'Campaigns',         icon: 'ti-speakerphone',     Component: PromotionCampaigns },
  { id: 'analytics-audit', label: 'Analytics & Audit', icon: 'ti-chart-bar',        Component: PromotionAnalyticsAudit },
];

export default function PromotionEngine() {
  // Product Catalog is the next tab to be built (Step 1), so it's a
  // reasonable landing default once populated; for now Overview (first in
  // the list) opens by default like every other UN Admin screen.
  const [activeTab, setActiveTab] = useState('overview');
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.Component || PromotionOverview;

  return (
    <div>
      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      {/* Deliberately just a breadcrumb, not a fixed "Promotion Engine" H1 —
          each tab renders its own page heading (title/subtitle/actions),
          matching the Figma's per-tab header pattern (e.g.
          PromotionProductCatalog.jsx's own "Product Catalog" heading +
          Export Report/Create Product buttons). Section name mirrors the
          real NavE label this feature lives under ("ADVERTISE & MONETISE"),
          not the Figma's own "Plans & Monetization" (a nav section that
          doesn't exist in the real app). */}
      <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginBottom: 6 }}>
        Advertise &amp; Monetise / Promotion Engine
      </div>

      {/* ── Tab strip ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 18,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {TABS.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 16px',
                background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
                marginBottom: '-1px',
                fontFamily: F.body, fontSize: 13, fontWeight: active ? 700 : 600,
                color: active ? C.primary : C.textSecondary,
                cursor: 'pointer',
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.textPrimary; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textSecondary; }}
            >
              <i className={`ti ${tab.icon}`} style={{ fontSize: 14.5 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Active tab content ───────────────────────────────────────── */}
      {/* onNavigate: a genuine local tab-switch, not a fake backend action —
          Overview's "View Campaigns →" / "Create Product" style links use
          this to jump to another real tab (Session 48, Step 4). Other tabs
          simply don't use the prop. */}
      <ActiveComponent onNavigate={setActiveTab} />
    </div>
  );
}
