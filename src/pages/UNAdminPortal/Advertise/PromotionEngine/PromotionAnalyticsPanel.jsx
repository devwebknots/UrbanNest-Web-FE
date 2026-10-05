/**
 * PromotionAnalyticsPanel.jsx — Promotion Engine → Analytics & Audit →
 * Analytics sub-tab content.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Step 3 (first half), built from the user's "Promotion
 * Analytics" Figma screenshot. Same rule as every prior step: the Figma is
 * a content/layout/field reference only — visual styling comes from the
 * real UN Admin tokens, never the Figma's own styling.
 *
 * Data model: this screen does NOT invent a third, disconnected dataset.
 * It rolls up two numbers that already exist from Steps 1–2 and layers the
 * Figma's own (internally self-consistent) portfolio-wide sample numbers
 * on top of them:
 *   - "Campaigns: 126" and each product's row in the Product Performance
 *     Breakdown table read `product.liveCampaigns`/`product.activePlans`
 *     directly from SAMPLE_PRODUCTS — 82 + 31 + 13 + 0 really does equal
 *     126, so this is the same number Product Catalog already shows, not
 *     a re-invented one.
 *   - The "Analytical Drill-Down Navigation" hierarchy and the persona/
 *     market splits (which also sum to 126 campaigns) drill into the real
 *     SAMPLE_CAMPAIGNS roster from Step 2 (e.g. CMP001 / Featured / ABC
 *     Apartments) — those 6 records are a representative illustrative
 *     subset of the full 126, the same relationship a real analytics
 *     rollup has to a smaller browsable campaign list.
 *   - Per-product/per-metric conversion percentages (CVR, Lead→App,
 *     App→Lease) are computed from stored counts via the shared `pct()`
 *     helper rather than hardcoded, so they can't drift from the numbers
 *     they describe.
 *
 * Honesty fix vs. the Figma: dropped the "Data refreshed 2 mins ago" live-
 * polling claim (no such pipeline exists) in favor of this feature's
 * standard <SampleTag /> watermark, same as every other Promotion Engine
 * screen. Every write-shaped action (Export Telemetry, Save View, Create
 * Custom Report, Adjust Product Pricing & Rules) is a dead end.
 */

import React, { useState } from 'react';
import {
  C, F, SampleTag, ActionTooltip, DeadEndButton, StatusPill, CustomDropdown,
} from './promotionTokens';
import { SAMPLE_PRODUCTS, PERSONAS, MARKETS, MARKET_BY_CODE } from './PromotionProductCatalog';
import { SAMPLE_CAMPAIGNS, productFor, fmtNum, pct } from './PromotionCampaigns';

// ═══════════════════════════════════════════════════════════════════════════
// Shared small pieces — file-local, same per-tab convention as every other
// Promotion Engine file.
// ═══════════════════════════════════════════════════════════════════════════
function PrimaryButton({ label, icon, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '9px 16px', background: C.primary, border: 'none', borderRadius: 7,
      fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.white, cursor: 'pointer',
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
function Panel({ children, style }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}
function Eyebrow({ children }) {
  return (
    <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
      {children}
    </div>
  );
}
function PanelTitle({ children, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 15, color: C.textSecondary }} />}
      <span style={{ fontFamily: F.headline, fontSize: 15.5, fontWeight: 700, color: C.textPrimary }}>{children}</span>
    </div>
  );
}
function Sparkline({ points, color }) {
  const w = 132, h = 34, pad = 3;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => `${(pad + i * step).toFixed(1)},${(h - pad - ((p - min) / range) * (h - pad * 2)).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants + sample rollups
// ═══════════════════════════════════════════════════════════════════════════
const GRANULARITIES = ['Daily', 'Weekly', 'Monthly'];
const PROPERTY_TYPES = ['Single Property', 'Multi-Property Portfolio'];
const DATE_WINDOWS = ['Aug 22 – Sep 21', 'Last 7 Days', 'Last 90 Days', 'This Quarter'];
const PLAN_DURATIONS = [...new Set(SAMPLE_CAMPAIGNS.map(c => c.planDuration))];

// Portfolio-wide stat tiles — the Figma's own numbers, which are already
// internally consistent with each other (126 campaigns splits the same
// way across the persona and market breakdowns below) and with Step 1's
// SAMPLE_PRODUCTS.liveCampaigns sum (82+31+13+0 = 126), so they're kept
// as-is rather than re-derived from just the 6 detailed campaign records.
export const PORTFOLIO = {
  campaigns: SAMPLE_PRODUCTS.reduce((s, p) => s + p.liveCampaigns, 0), // 126
  promoted: 1842, promotedPct: 18.4,
  impressions: 1842000, avgCtr: 1.69,
  propViews: 124000, viewThroughPct: 6.7,
  clicks: 31200, avgCpc: 0.59,
  leads: 4820, clickToLeadPct: 15.4,
  applications: 612, leadToAppPct: 12.7,
  leases: 94, appToLeasePct: 25.0, roi: 4.8,
};

// Per-product analytics — base counts only; every percentage (CVR,
// Lead→App, App→Lease) is computed from these via pct(), never stored
// separately, so it can't drift from the counts it describes.
export const PRODUCT_ANALYTICS = {
  1: { impressions: 1200000, views: 82000, clicks: 21400, leads: 3240, applications: 420, leases: 61, customers: 53, cpl: 3.82, cpa: 29.45, cac: 202.10, tier: 'Flagship Tier', searchNote: 'Top 12% in search' },
  2: { impressions: 420000, views: 29000, clicks: 7800, leads: 1120, applications: 165, leases: 24, customers: 28, cpl: 4.15, cpa: 31.20, cac: 215.00, tier: 'Growth Tier', searchNote: 'Top 24% in search' },
  3: { impressions: 180000, views: 12500, clicks: 2000, leads: 460, applications: 68, leases: 9, customers: 12, cpl: 5.60, cpa: 38.90, cac: 265.00, tier: 'Performance Tier', searchNote: 'Top 40% in search' },
  4: { impressions: 0, views: 0, clicks: 0, leads: 0, applications: 0, leases: 0, customers: 0, cpl: null, cpa: null, cac: null, tier: 'Launch Tier', searchNote: 'Not yet live' },
};

// Persona breakdown — same PERSONAS vocabulary as everywhere else in this
// feature (Landlord / Ind PM / Org PM), not the Figma's own longer labels.
export const PERSONA_ANALYTICS = [
  { persona: 'Landlord', customers: 42, campaigns: 58, leads: 1210, leases: 21, cpa: 32.10, icon: 'ti-home', bg: C.blueLight, color: C.primary },
  { persona: 'Ind PM', customers: 21, campaigns: 43, leads: 1680, leases: 34, cpa: 28.50, icon: 'ti-briefcase', bg: '#ECFDF5', color: C.green },
  { persona: 'Org PM', customers: 11, campaigns: 25, leads: 1930, leases: 39, cpa: 26.80, icon: 'ti-building-skyscraper', bg: '#F3E8FF', color: '#7E22CE' },
];

// Regional attribution — ties to the same MARKETS/MARKET_BY_CODE as every
// other Promotion Engine screen.
export const MARKET_ANALYTICS = [
  { code: 'US', share: 75.5, campaigns: 98, leads: 3820, applications: 480, leases: 71 },
  { code: 'India', share: 24.5, campaigns: 28, leads: 1000, applications: 132, leases: 23 },
];

// One granular "leaf" (property/unit) per sample campaign, for the
// drill-down hierarchy — small, purely illustrative addition consistent
// with each campaign's own targetBreakdown text.
const DRILLDOWN_LEAF = {
  CMP001: 'Tower A Unit 402', CMP002: 'Building 2 Unit 108', CMP003: 'Unit 4B',
  CMP004: 'Tower C Unit 1210', CMP005: 'Portfolio-Wide', CMP006: 'Building 1 Unit 305',
};

// Trajectory sparklines — sample weekly points, Aug 22 – Sep 21 (today is
// Sep 25, 2026), shown regardless of the Daily/Weekly/Monthly toggle since
// generating three consistent synthetic series per metric would be
// over-engineering for a sample screen already clearly watermarked.
const TRAJECTORY = [
  { key: 'impressions', label: 'Impressions', value: '1.84M', change: '+8.4%', peak: 'Peak 450k/wk', points: [1.2, 1.35, 1.5, 1.4, 1.65, 1.84], color: C.primary },
  { key: 'clicks', label: 'Clicks', value: '31.2K', change: '+11.2%', peak: 'Peak 8.2k/wk', points: [22, 24, 27, 26, 29, 31.2], color: C.primary },
  { key: 'leads', label: 'Leads', value: '4,820', change: '+14.6%', peak: 'Peak 1.25k/wk', points: [3.4, 3.8, 4.0, 3.9, 4.4, 4.82], color: C.green },
  { key: 'applications', label: 'Applications', value: '612', change: '+6.2%', peak: 'Peak 160/wk', points: [480, 510, 540, 520, 570, 612], color: C.green },
  { key: 'leases', label: 'Leases Closed', value: '94', change: '+18.5%', peak: 'Peak 26/wk', points: [58, 64, 70, 68, 82, 94], color: C.green },
];

// ═══════════════════════════════════════════════════════════════════════════
export default function PromotionAnalyticsPanel() {
  const [granularity, setGranularity] = useState('Weekly');
  const [marketFilter, setMarketFilter] = useState('');
  const [personaFilter, setPersonaFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [dateWindow, setDateWindow] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(1);

  const resetFilters = () => {
    setMarketFilter(''); setPersonaFilter(''); setProductFilter(''); setPlanFilter('');
    setCampaignFilter(''); setPropertyTypeFilter(''); setDateWindow('');
  };

  // Market/Persona/Product filters genuinely narrow the breakdown table;
  // Plan/Property Type/Date Window are present for parity with the Figma's
  // filter matrix but don't recompute anything (same precedent as
  // Campaigns' own Date Window filter) — recomputing the portfolio-wide
  // totals per filter combination would mean fabricating a much larger
  // synthetic dataset behind a screen that's already clearly Sample Data.
  const visibleProducts = SAMPLE_PRODUCTS.filter(p => {
    if (marketFilter && !p.markets.includes(marketFilter)) return false;
    if (personaFilter && !p.personas.includes(personaFilter)) return false;
    if (productFilter && String(p.id) !== productFilter) return false;
    return true;
  });

  // Campaign filter jumps the drill-down hierarchy + selected product to
  // that campaign — the one filter here with a real, visible effect.
  const filterCampaign = campaignFilter ? SAMPLE_CAMPAIGNS.find(c => c.id === campaignFilter) : null;
  const effectiveProductId = filterCampaign ? filterCampaign.productId : selectedProductId;
  const selectedProduct = SAMPLE_PRODUCTS.find(p => p.id === effectiveProductId) || SAMPLE_PRODUCTS[0];
  const selectedAnalytics = PRODUCT_ANALYTICS[selectedProduct.id];
  const drillCampaign = filterCampaign || SAMPLE_CAMPAIGNS.find(c => c.productId === selectedProduct.id) || SAMPLE_CAMPAIGNS[0];

  const clickToLead = pct(selectedAnalytics.leads, selectedAnalytics.clicks);
  const leadToApp = pct(selectedAnalytics.applications, selectedAnalytics.leads);
  const appToLease = pct(selectedAnalytics.leases, selectedAnalytics.applications);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Eyebrow>Executive Telemetry Hub</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontFamily: F.headline, fontSize: 19, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Promotion Analytics</h2>
            <SampleTag />
          </div>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '4px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
            Deep-dive performance telemetry, conversion funnels, and attribution across promotion products, customer personas, and regional markets — sample data, no analytics pipeline exists in the backend yet.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryDeadEnd label="Export Telemetry" icon="ti-download" tooltip="No export endpoint exists for Analytics yet." />
          <SecondaryDeadEnd label="Save View" icon="ti-device-floppy" tooltip="No saved-view storage exists yet for Analytics." />
          <PrimaryButton label="Create Custom Report" icon="ti-plus" onClick={() => {}} />
        </div>
      </div>

      {/* Granularity toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 2, background: C.neutral, borderRadius: 7, padding: 3 }}>
          {GRANULARITIES.map(g => (
            <button key={g} onClick={() => setGranularity(g)} style={{
              padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
              background: granularity === g ? C.white : 'transparent',
              boxShadow: granularity === g ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: granularity === g ? C.textPrimary : C.textSecondary,
            }}>{g}</button>
          ))}
        </div>
      </div>

      {/* Filter matrix */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
          <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
            <i className="ti ti-refresh" style={{ fontSize: 12 }} /> Reset Filters
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 130px', minWidth: 130 }}><CustomDropdown placeholder="Market: All" options={[{ value: '', label: 'All Markets' }, ...MARKETS.map(m => ({ value: m.code, label: m.name }))]} value={marketFilter} onChange={setMarketFilter} /></div>
          <div style={{ flex: '1 1 130px', minWidth: 130 }}><CustomDropdown placeholder="Persona: All" options={[{ value: '', label: 'All Personas' }, ...PERSONAS.map(p => ({ value: p, label: p }))]} value={personaFilter} onChange={setPersonaFilter} /></div>
          <div style={{ flex: '1 1 140px', minWidth: 140 }}><CustomDropdown placeholder="Product: All" options={[{ value: '', label: 'All Products' }, ...SAMPLE_PRODUCTS.map(p => ({ value: String(p.id), label: p.name }))]} value={productFilter} onChange={setProductFilter} /></div>
          <div style={{ flex: '1 1 120px', minWidth: 120 }}><CustomDropdown placeholder="Plan: All" options={[{ value: '', label: 'All Plans' }, ...PLAN_DURATIONS.map(p => ({ value: p, label: p }))]} value={planFilter} onChange={setPlanFilter} /></div>
          <div style={{ flex: '1 1 140px', minWidth: 140 }}><CustomDropdown placeholder="Campaign: All" options={[{ value: '', label: 'All Campaigns' }, ...SAMPLE_CAMPAIGNS.map(c => ({ value: c.id, label: `${c.id} — ${c.customerName}` }))]} value={campaignFilter} onChange={setCampaignFilter} /></div>
          <div style={{ flex: '1 1 160px', minWidth: 160 }}><CustomDropdown placeholder="Property Type: All" options={[{ value: '', label: 'All Property Types' }, ...PROPERTY_TYPES.map(t => ({ value: t, label: t }))]} value={propertyTypeFilter} onChange={setPropertyTypeFilter} /></div>
          <div style={{ flex: '1 1 150px', minWidth: 150 }}><CustomDropdown placeholder="Date Window" options={DATE_WINDOWS.map(d => ({ value: d, label: d }))} value={dateWindow || DATE_WINDOWS[0]} onChange={setDateWindow} /></div>
        </div>
      </div>

      {/* Portfolio stat tiles */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        {[
          { label: 'Campaigns', value: fmtNum(PORTFOLIO.campaigns), sub: 'MoM Active Roster', badge: '+12%', badgeTone: 'green' },
          { label: 'Promoted', value: fmtNum(PORTFOLIO.promoted), sub: `${PORTFOLIO.promotedPct}% of total`, icon: 'ti-building' },
          { label: 'Impressions', value: `${(PORTFOLIO.impressions / 1000).toFixed(0)}K`, sub: `Avg CTR ${PORTFOLIO.avgCtr}%`, icon: 'ti-eye' },
          { label: 'Prop Views', value: fmtNum(PORTFOLIO.propViews), sub: `${PORTFOLIO.viewThroughPct}% view-through`, icon: 'ti-home-search' },
          { label: 'Clicks', value: fmtNum(PORTFOLIO.clicks), sub: `$${PORTFOLIO.avgCpc.toFixed(2)} Avg CPC`, icon: 'ti-cursor-text' },
          { label: 'Leads', value: fmtNum(PORTFOLIO.leads), sub: `${PORTFOLIO.clickToLeadPct}% click-to-lead`, icon: 'ti-user-plus' },
          { label: 'Applications', value: fmtNum(PORTFOLIO.applications), sub: `${PORTFOLIO.leadToAppPct}% lead-to-app`, icon: 'ti-file-text' },
          { label: 'Leases Signed', value: fmtNum(PORTFOLIO.leases), sub: `${PORTFOLIO.appToLeasePct}% app-to-lease`, dark: true, badge: `ROI ${PORTFOLIO.roi}x`, badgeTone: 'green' },
        ].map(t => (
          <div key={t.label} style={{
            flex: '1 1 105px', minWidth: 100, borderRadius: 9, padding: '9px 12px',
            background: t.dark ? C.primary : C.cardBg, border: `1px solid ${t.dark ? C.primary : C.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: t.dark ? 'rgba(255,255,255,0.75)' : C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</span>
              {t.icon && !t.dark && <i className={`ti ${t.icon}`} style={{ fontSize: 12, color: C.textTertiary }} />}
              {t.badge && <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 800, color: t.dark ? '#065F46' : '#047857', background: t.dark ? '#A7F3D0' : '#ECFDF5', borderRadius: 999, padding: '1px 6px' }}>{t.badge}</span>}
            </div>
            <div style={{ fontFamily: F.headline, fontSize: 17, fontWeight: 700, color: t.dark ? C.white : C.textPrimary }}>{t.value}</div>
            <div style={{ fontFamily: F.body, fontSize: 9.5, color: t.dark ? 'rgba(255,255,255,0.7)' : C.textTertiary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ── Left column ───────────────────────────────────────────── */}
        <div style={{ flex: '1 1 480px', minWidth: 340 }}>
          <Panel>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div>
                <Eyebrow>Product Metrics</Eyebrow>
                <PanelTitle>Product Performance Breakdown</PanelTitle>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <SecondaryDeadEnd label="Compare All" icon="ti-columns-3" tooltip="Side-by-side product comparison isn't wired up yet." />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) 0.6fr 1fr 0.8fr 0.7fr 0.6fr 0.7fr', gap: 8, padding: '6px 4px', borderBottom: `1px solid ${C.border}` }}>
              {['Product', 'CMP', 'Impressions', 'Clicks', 'Leads', 'Leases', 'CVR'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
              ))}
            </div>
            {visibleProducts.length === 0 ? (
              <div style={{ padding: '20px 4px', textAlign: 'center', fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>No products match these filters.</div>
            ) : visibleProducts.map((p, idx) => {
              const a = PRODUCT_ANALYTICS[p.id];
              const cvr = pct(a.leads, a.clicks);
              const isSelected = p.id === selectedProduct.id && !filterCampaign;
              return (
                <div key={p.id} onClick={() => setSelectedProductId(p.id)} style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) 0.6fr 1fr 0.8fr 0.7fr 0.6fr 0.7fr', gap: 8,
                  padding: '10px 4px', alignItems: 'center', cursor: 'pointer',
                  borderBottom: `1px solid ${C.neutral}`, background: isSelected ? C.blueLight : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: p.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${p.icon}`} style={{ fontSize: 12, color: p.iconColor }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>{p.name}</div>
                      <div style={{ fontFamily: F.body, fontSize: 9.5, color: C.textTertiary }}>{p.code}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{p.liveCampaigns}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{a.impressions ? fmtNum(a.impressions) : '–'}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{a.clicks ? fmtNum(a.clicks) : '–'}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{a.leads ? fmtNum(a.leads) : '–'}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{a.leases ? fmtNum(a.leases) : '–'}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: a.clicks ? C.green : C.textTertiary }}>{a.clicks ? `${cvr}%` : '–'}</div>
                </div>
              );
            })}
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button onClick={() => setSelectedProductId(selectedProduct.id)} style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
                View Product Detail →
              </button>
            </div>
          </Panel>

          <Panel>
            <Eyebrow>Active SKU Telemetry</Eyebrow>
            <PanelTitle>Selected Product Detail: {selectedProduct.name}</PanelTitle>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <StatusPill status={`Active Plans: ${selectedProduct.activePlans}`} tone="blue" />
              <StatusPill status={`Campaigns: ${selectedProduct.liveCampaigns}`} tone="blue" />
              <StatusPill status={`Customers: ${selectedAnalytics.customers}`} tone="blue" />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 130px', minHeight: 90, borderRadius: 8, background: selectedProduct.iconBg, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10, position: 'relative' }}>
                <i className={`ti ${selectedProduct.icon}`} style={{ position: 'absolute', top: 10, right: 10, fontSize: 18, color: selectedProduct.iconColor }} />
                <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 800, color: selectedProduct.iconColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{selectedAnalytics.tier}</span>
              </div>
              {[
                ['Impressions', selectedAnalytics.impressions ? (selectedAnalytics.impressions >= 1000000 ? `${(selectedAnalytics.impressions / 1000000).toFixed(2)}M` : fmtNum(selectedAnalytics.impressions)) : '–', selectedAnalytics.searchNote],
                ['Views', selectedAnalytics.views ? fmtNum(selectedAnalytics.views) : '–', selectedAnalytics.impressions ? `${pct(selectedAnalytics.views, selectedAnalytics.impressions)}% Engagement` : '—'],
                ['Clicks', selectedAnalytics.clicks ? fmtNum(selectedAnalytics.clicks) : '–', selectedAnalytics.impressions ? `CTR ${(selectedAnalytics.clicks / selectedAnalytics.impressions * 100).toFixed(2)}%` : '—'],
              ].map(([label, value, sub]) => (
                <div key={label} style={{ flex: '1 1 100px', background: C.neutral, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{value}</div>
                  <div style={{ fontFamily: F.body, fontSize: 9.5, color: C.textTertiary, marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                ['Leads Generated', selectedAnalytics.leads ? fmtNum(selectedAnalytics.leads) : '–', 'Qualified Tenant Inquiries'],
                ['Applications Submitted', selectedAnalytics.applications ? fmtNum(selectedAnalytics.applications) : '–', 'Formal Credit Screenings'],
                ['Leases Executed', selectedAnalytics.leases ? fmtNum(selectedAnalytics.leases) : '–', selectedAnalytics.applications ? `${appToLease}% conversion` : '—'],
              ].map(([label, value, sub]) => (
                <div key={label} style={{ flex: '1 1 140px' }}>
                  <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: label === 'Leases Executed' ? C.green : C.textPrimary }}>{value}</div>
                  <div style={{ fontFamily: F.body, fontSize: 10, color: C.textTertiary, marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Conversion Velocity &amp; Benchmarks</div>
            {[
              { label: 'Click → Lead Conversion Rate', value: clickToLead, badge: clickToLead >= 15 ? 'High efficiency' : clickToLead >= 10 ? 'On target' : 'Needs attention' },
              { label: 'Lead → Application Rate', value: leadToApp, badge: 'Optimal' },
              { label: 'Application → Lease Rate', value: appToLease, badge: '(Benchmark: 12.0%)' },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>{row.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{selectedAnalytics.clicks ? `${row.value}%` : '–'}</span>
                    <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.green, background: '#ECFDF5', borderRadius: 999, padding: '1px 7px' }}>{row.badge}</span>
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: C.neutral, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(row.value, 100)}%`, borderRadius: 99, background: C.primary }} />
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0' }}>
              {[
                ['Cost per Lead (CPL)', selectedAnalytics.cpl != null ? `$${selectedAnalytics.cpl.toFixed(2)}` : '–', '-8.3% vs Target'],
                ['Cost per App (CPA)', selectedAnalytics.cpa != null ? `$${selectedAnalytics.cpa.toFixed(2)}` : '–', 'Aligned to plan'],
                ['Cost per Lease (CAC)', selectedAnalytics.cac != null ? `$${selectedAnalytics.cac.toFixed(2)}` : '–', 'LTV/CAC 14.2x'],
              ].map(([label, value, sub]) => (
                <div key={label} style={{ flex: '1 1 140px', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 11px' }}>
                  <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{value}</div>
                  <div style={{ fontFamily: F.body, fontSize: 9.5, color: C.textTertiary, marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <PrimaryButton label={`View ${selectedProduct.liveCampaigns} Active Campaigns →`} onClick={() => {}} style={{ background: C.primary }} />
              <SecondaryDeadEnd label="Adjust Product Pricing & Rules" icon="ti-adjustments" tooltip="No write endpoint exists yet for Product pricing rules." />
            </div>
          </Panel>
        </div>

        {/* ── Right column ──────────────────────────────────────────── */}
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <Panel>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Eyebrow>Audience Segmentation</Eyebrow>
                <PanelTitle>Performance by Customer Persona</PanelTitle>
              </div>
              <i className="ti ti-users-group" style={{ fontSize: 18, color: C.textTertiary }} />
            </div>
            {PERSONA_ANALYTICS.map(row => (
              <div key={row.persona} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.neutral}` }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${row.icon}`} style={{ fontSize: 15, color: row.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>{row.persona}</div>
                  <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>{row.customers} Customers • {row.campaigns} Campaigns</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{fmtNum(row.leads)} Leads / {row.leases} Leases</div>
                  <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>Avg CPA ${row.cpa.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </Panel>

          <Panel>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Eyebrow>Territories</Eyebrow>
                <PanelTitle>Regional Market Attribution</PanelTitle>
              </div>
              <i className="ti ti-world" style={{ fontSize: 18, color: C.textTertiary }} />
            </div>
            {MARKET_ANALYTICS.map(row => (
              <div key={row.code} style={{ padding: '10px 0', borderBottom: `1px solid ${C.neutral}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 17 }}>{MARKET_BY_CODE[row.code]?.flag}</span>
                    <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>{MARKET_BY_CODE[row.code]?.name}</span>
                  </div>
                  <StatusPill status={`${row.share}% Volume Share`} tone="blue" />
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {[['Campaigns', row.campaigns], ['Leads', fmtNum(row.leads)], ['Apps', fmtNum(row.applications)], ['Leases', row.leases]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                      <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, lineHeight: 1.5 }}>
              <i className="ti ti-info-circle" style={{ marginRight: 4 }} /> UK &amp; European markets launch scheduled for Q4 2026.
            </div>
          </Panel>

          <Panel>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <Eyebrow>Granular Inspection</Eyebrow>
                <PanelTitle>Analytical Drill-Down Navigation</PanelTitle>
              </div>
              <i className="ti ti-sitemap" style={{ fontSize: 18, color: C.textTertiary }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, margin: '10px 0' }}>
              {[
                `Product: ${selectedProduct.name}`,
                `Plan: ${drillCampaign.planDuration}`,
                `Campaign: ${drillCampaign.id}`,
                drillCampaign.targetProperty,
                DRILLDOWN_LEAF[drillCampaign.id] || 'Portfolio-Wide',
              ].map((chip, i, arr) => (
                <React.Fragment key={chip + i}>
                  <span style={{
                    fontFamily: F.body, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 10px',
                    background: i === arr.length - 1 ? C.primary : C.neutral,
                    color: i === arr.length - 1 ? C.white : C.textPrimary,
                  }}>{chip}</span>
                  {i < arr.length - 1 && <i className="ti ti-chevron-right" style={{ fontSize: 11, color: C.textTertiary }} />}
                </React.Fragment>
              ))}
              <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 10px', background: '#0F172A', color: C.white }}>Performance Telemetry</span>
            </div>
            <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, lineHeight: 1.5 }}>
              Select a Campaign above to walk this hierarchy down to a specific operational layer.
            </div>
          </Panel>
        </div>
      </div>

      {/* Trajectory */}
      <Panel style={{ marginTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <Eyebrow>Multi-Metric Trajectory</Eyebrow>
            <PanelTitle>Performance Telemetry Over Time</PanelTitle>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.green, background: '#ECFDF5', borderRadius: 999, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-trending-up" style={{ fontSize: 11 }} /> vs Previous 30 Days
            </span>
            <div style={{ display: 'flex', gap: 2, background: C.neutral, borderRadius: 7, padding: 3 }}>
              {GRANULARITIES.map(g => (
                <button key={g} onClick={() => setGranularity(g)} style={{
                  padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: granularity === g ? C.white : 'transparent',
                  fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: granularity === g ? C.textPrimary : C.textSecondary,
                }}>{g}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {TRAJECTORY.map(t => (
            <div key={t.key} style={{ flex: '1 1 160px', minWidth: 150, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</span>
                <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.green }}>{t.change}</span>
              </div>
              <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>{t.value}</div>
              <Sparkline points={t.points} color={t.color} />
              <div style={{ fontFamily: F.body, fontSize: 9.5, color: C.textTertiary, marginTop: 4 }}>{t.peak}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
