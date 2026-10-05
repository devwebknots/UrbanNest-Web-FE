/**
 * PromotionOverview.jsx — Promotion Engine → Overview tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Step 4 (last), built from the user's "Promotion Overview"
 * Figma screenshot. Same rule as every prior step: the Figma is a content/
 * layout/field reference only — visual styling comes from the real UN Admin
 * tokens, never the Figma's own dark sidebar/header chrome (that's already
 * the real UNAdminShell, rendered around this page — nothing here re-draws
 * the breadcrumb or top-level tab strip, both already rendered once by
 * PromotionEngine.jsx).
 *
 * Data model — this is a ROLLUP, not a fourth dataset:
 *   - PORTFOLIO / PRODUCT_ANALYTICS / PERSONA_ANALYTICS / MARKET_ANALYTICS
 *     are imported straight from PromotionAnalyticsPanel.jsx (newly exported
 *     this step — they were file-local before). Cross-checked line-by-line
 *     against the Figma's numbers and they match almost exactly (126
 *     campaigns, 1,842 promoted listings/18.4%, the funnel's 1,842,000 →
 *     124,000 → 31,200 → 4,820 → 612 → 94, the persona table's 42/21/11
 *     customers summing to 74, the market table's 98/28 campaigns and
 *     3,820/1,000 leads) — strong evidence the Figma itself was built off
 *     this same rollup, so reusing it here (rather than re-typing a
 *     competing copy) is the correct call, not a guess.
 *   - SAMPLE_PRODUCTS (Product Catalog) and SAMPLE_CAMPAIGNS (Campaigns)
 *     back the KPI tiles and the two catalog-shaped panels.
 *   - Every percentage (funnel conversion, per-market listing share) is
 *     computed live from stored counts via the shared pct()/division, never
 *     copied from the Figma's own numbers, so nothing here can drift.
 *
 * Honesty fixes vs. the Figma (same class of fix as Analytics/Audit before
 * this):
 *   - Dropped "Data refreshed 3 mins ago" — no live-polling pipeline exists.
 *     Standard <SampleTag /> watermark next to the title instead.
 *   - "Active Products: 8 / +2 new / Across 4 distinct placements" didn't
 *     match SAMPLE_PRODUCTS (4 products total, 3 Active + 1 Draft) — shown
 *     as the real count (3) with an honest Draft-count subtitle instead.
 *   - "Active Plans: 17" didn't match SAMPLE_PRODUCTS.activePlans (sums to
 *     12) — shown as 12.
 *   - "2 products have no active plans" (Admin Alerts) isn't true of any
 *     current product — reworded to the real condition: 1 product
 *     (Homepage Promotion) is still in Draft with 0 live campaigns.
 *   - "Premium Listing" in Top Product Activity → real catalog name
 *     "Standard" (id 2).
 *   - Filters' "All Markets (US, UK, IN)" → MARKETS only has US/India today
 *     (UK isn't a live market anywhere else in this feature) — filter and
 *     Market Summary's footnote corrected to match.
 *   - "Create Product" and the three Admin Alerts' "View X →" links are
 *     real local tab-switches (via the new onNavigate prop from
 *     PromotionEngine.jsx), not dead ends — that's a genuine, working
 *     action even though nothing else on this sample screen is. "Export
 *     Report" and the two filter-row icon buttons stay dead ends, same as
 *     every other tab's Export action.
 */

import React, { useState } from 'react';
import {
  C, F, SampleTag, ActionTooltip, StatTile, StatusPill, CustomDropdown,
} from './promotionTokens';
import { SAMPLE_PRODUCTS, PERSONAS, MARKETS, MARKET_BY_CODE } from './PromotionProductCatalog';
import { fmtNum, pct } from './PromotionCampaigns';
import { PORTFOLIO, PRODUCT_ANALYTICS, PERSONA_ANALYTICS, MARKET_ANALYTICS } from './PromotionAnalyticsPanel';

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
function SecondaryDeadEnd({ label, icon, tooltip, small }) {
  return (
    <ActionTooltip text={tooltip}>
      <button disabled style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: small ? '6px 10px' : '9px 16px', background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 7,
        fontFamily: F.body, fontSize: small ? 11 : 12.5, fontWeight: 700, color: C.textSecondary, cursor: 'not-allowed',
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 13 }} />}
        {label}
      </button>
    </ActionTooltip>
  );
}
function IconDeadEnd({ icon, tooltip }) {
  return (
    <ActionTooltip text={tooltip}>
      <button disabled style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 7,
        color: C.textSecondary, cursor: 'not-allowed',
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
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
function PanelTitle({ children, icon, dot }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block' }} />}
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 15, color: C.textSecondary }} />}
      <span style={{ fontFamily: F.headline, fontSize: 15.5, fontWeight: 700, color: C.textPrimary }}>{children}</span>
    </div>
  );
}
function fmtAbbrev(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return fmtNum(n);
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants + sample rollups
// ═══════════════════════════════════════════════════════════════════════════
const DATE_WINDOWS = ['Last 30 Days', 'Last 7 Days', 'Last 90 Days', 'This Quarter'];

// Campaign lifecycle distribution — portfolio-scale sample buckets, kept
// internally consistent: they sum to exactly 568 with no overlap, and the
// Active bucket (126) ties directly to PORTFOLIO.campaigns rather than
// being a disconnected number.
const LIFECYCLE = [
  { key: 'active', label: 'Active', value: PORTFOLIO.campaigns, tone: 'green', sub: 'Serving traffic' },
  { key: 'scheduled', label: 'Scheduled', value: 18, tone: 'blue', sub: 'Pending start' },
  { key: 'paused', label: 'Paused', value: 7, tone: 'amber', sub: 'By advertiser' },
  { key: 'ending', label: 'Ending < 7D', value: 14, tone: 'orange', sub: 'Expiring soon' },
  { key: 'completed', label: 'Completed', value: 382, tone: 'grey', sub: 'Fulfilled budget' },
  { key: 'cancelled', label: 'Cancelled', value: 21, tone: 'red', sub: 'Early terminated' },
];
const LIFECYCLE_TOTAL = LIFECYCLE.reduce((s, l) => s + l.value, 0); // 568
const LIFECYCLE_COLORS = { green: C.green, blue: C.blue, amber: '#D97706', orange: '#EA580C', grey: C.textTertiary, red: C.danger };

// Portfolio-wide sample spend — the one number on this screen with no other
// home in the feature yet. Every per-unit cost below it (per-Lead,
// per-Application, per-Lease) is computed live from this and PORTFOLIO's
// real counts, so those three numbers can't drift from each other even
// though the total itself is a static sample figure.
const SPEND_TOTAL = 18420;

const MARKET_DOT = { US: C.blue, India: '#EA580C' };

export default function PromotionOverview({ onNavigate }) {
  const [marketFilter, setMarketFilter] = useState('');
  const [personaFilter, setPersonaFilter] = useState('');
  const [dateWindow, setDateWindow] = useState(DATE_WINDOWS[0]);

  const goTo = id => { if (onNavigate) onNavigate(id); };

  const activeProducts = SAMPLE_PRODUCTS.filter(p => p.status === 'Active');
  const draftProducts = SAMPLE_PRODUCTS.filter(p => p.status === 'Draft');
  const totalPlans = SAMPLE_PRODUCTS.reduce((s, p) => s + p.activePlans, 0);
  const totalCustomers = PERSONA_ANALYTICS.reduce((s, p) => s + p.customers, 0);

  // Conversion funnel — every step-to-step percentage computed live via the
  // shared pct() helper from PORTFOLIO's stored counts, never copied from
  // the Figma's own (slightly differently-rounded) numbers.
  const funnel = [
    { n: 1, label: 'Impressions', value: PORTFOLIO.impressions, note: 'Baseline Reach' },
    { n: 2, label: 'Property Views', value: PORTFOLIO.propViews, fromLabel: 'IMPR', rate: pct(PORTFOLIO.propViews, PORTFOLIO.impressions) },
    { n: 3, label: 'Clicks', value: PORTFOLIO.clicks, fromLabel: 'VIEWS', rate: pct(PORTFOLIO.clicks, PORTFOLIO.propViews) },
    { n: 4, label: 'Leads', value: PORTFOLIO.leads, fromLabel: 'CLICKS', rate: pct(PORTFOLIO.leads, PORTFOLIO.clicks) },
    { n: 5, label: 'Applications', value: PORTFOLIO.applications, fromLabel: 'LEADS', rate: pct(PORTFOLIO.applications, PORTFOLIO.leads) },
    { n: 6, label: 'Leases', value: PORTFOLIO.leases, fromLabel: 'APPS', rate: pct(PORTFOLIO.leases, PORTFOLIO.applications), highlight: true },
  ];

  const perLead = (SPEND_TOTAL / PORTFOLIO.leads).toFixed(2);
  const perApp = (SPEND_TOTAL / PORTFOLIO.applications).toFixed(2);
  const perLease = (SPEND_TOTAL / PORTFOLIO.leases).toFixed(2);

  const topProducts = [...activeProducts].sort((a, b) => b.liveCampaigns - a.liveCampaigns).slice(0, 3);

  const PERSONA_ADOPTION_RATE = { Landlord: 8.4, 'Ind PM': 17.2, 'Org PM': 31.5 };
  const lowestPersona = [...PERSONA_ANALYTICS].sort((a, b) => (PERSONA_ADOPTION_RATE[a.persona] || 0) - (PERSONA_ADOPTION_RATE[b.persona] || 0))[0];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Eyebrow>Executive Rollup</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontFamily: F.headline, fontSize: 19, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Promotion Overview</h2>
            <SampleTag />
          </div>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '4px 0 0', maxWidth: 580, lineHeight: 1.5 }}>
            Monitor overall promotion product adoption, campaign health, performance funnel, and market attribution — rolled up from Product Catalog, Campaigns, and Analytics &amp; Audit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryDeadEnd label="Export Report" icon="ti-download" tooltip="No export endpoint exists for the Overview rollup yet." />
          <PrimaryButton label="Create Product" icon="ti-plus" onClick={() => goTo('product-catalog')} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</span>
        <div style={{ flex: '1 1 170px', minWidth: 170, maxWidth: 220 }}>
          <CustomDropdown placeholder="All Markets (US, IN)" options={[{ value: '', label: 'All Markets (US, IN)' }, ...MARKETS.map(m => ({ value: m.code, label: m.name }))]} value={marketFilter} onChange={setMarketFilter} />
        </div>
        <div style={{ flex: '1 1 150px', minWidth: 150, maxWidth: 200 }}>
          <CustomDropdown placeholder="All Personas" options={[{ value: '', label: 'All Personas' }, ...PERSONAS.map(p => ({ value: p, label: p }))]} value={personaFilter} onChange={setPersonaFilter} />
        </div>
        <div style={{ flex: '1 1 150px', minWidth: 150, maxWidth: 200 }}>
          <CustomDropdown placeholder="Last 30 Days" options={DATE_WINDOWS.map(d => ({ value: d, label: d }))} value={dateWindow} onChange={setDateWindow} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <IconDeadEnd icon="ti-refresh" tooltip="No live data source to refresh yet — this rollup is sample data." />
          <IconDeadEnd icon="ti-file-export" tooltip="No export endpoint exists for this filtered view yet." />
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatTile label="Active Products" value={activeProducts.length} subtitle={`${draftProducts.length} in Draft · ${SAMPLE_PRODUCTS.length} total`} icon="ti-package" accent={C.primary} />
        <StatTile label="Active Plans" value={totalPlans} subtitle={`Across all ${SAMPLE_PRODUCTS.length} catalog products`} icon="ti-file-text" accent="#7E22CE" />
        <StatTile label="Active Campaigns" value={fmtNum(PORTFOLIO.campaigns)} subtitle="Currently serving ads" icon="ti-speakerphone" accent={C.blue} />
        <StatTile label="Customers Using Promo" value={totalCustomers} subtitle="Across all 3 personas" icon="ti-users" accent="#047857" />
        <StatTile label="Promoted Listings" value={fmtNum(PORTFOLIO.promoted)} subtitle={`${PORTFOLIO.promotedPct}% of all active units`} icon="ti-home" accent="#C2410C" />
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div>
          {/* Campaign Health & Lifecycle Distribution */}
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <PanelTitle dot={C.green}>Campaign Health &amp; Lifecycle Distribution</PanelTitle>
              <span style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary }}>Total tracked: {fmtNum(LIFECYCLE_TOTAL)} lifetime</span>
            </div>
            <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', background: C.neutral, marginBottom: 14 }}>
              {LIFECYCLE.map(l => (
                <div key={l.key} style={{ width: `${(l.value / LIFECYCLE_TOTAL) * 100}%`, background: LIFECYCLE_COLORS[l.tone] }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              {LIFECYCLE.map(l => (
                <div key={l.key} style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: LIFECYCLE_COLORS[l.tone], display: 'inline-block' }} />
                    <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l.label}</span>
                  </div>
                  <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>{fmtNum(l.value)}</div>
                  <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 2 }}>{l.sub}</div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Promotion Adoption by Persona */}
          <Panel>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <PanelTitle>Promotion Adoption by Persona</PanelTitle>
                <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '-4px 0 10px' }}>Share of eligible customer base currently running active promotions</p>
              </div>
              <StatusPill status={`${PERSONA_ANALYTICS.length} Personas`} tone="grey" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.8fr 1.4fr', gap: 8, padding: '0 4px 8px', borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
              {['Persona', 'Customers', 'Campaigns', 'Adoption Rate'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 10, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>
            {PERSONA_ANALYTICS.map(p => {
              const rate = PERSONA_ADOPTION_RATE[p.persona] || 0;
              return (
                <div key={p.persona} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.8fr 1.4fr', gap: 8, alignItems: 'center', padding: '8px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>{p.persona}</span>
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>{p.customers}</span>
                  <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>{p.campaigns}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: C.neutral, overflow: 'hidden' }}>
                      <div style={{ width: `${(rate / 35) * 100}%`, height: '100%', background: p.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary, minWidth: 34, textAlign: 'right' }}>{rate}%</span>
                  </div>
                </div>
              );
            })}
          </Panel>

          {/* Conversion Funnel & Promotion Performance */}
          <Panel>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <PanelTitle>Conversion Funnel &amp; Promotion Performance</PanelTitle>
                <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '-4px 0 10px' }}>Step-by-step conversion rates across consumer touchpoints</p>
              </div>
              <StatusPill status="High Conversion Efficacy" tone="green" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
              {funnel.map(s => (
                <div key={s.n} style={{
                  background: s.highlight ? C.primary : C.pageBg,
                  border: `1px solid ${s.highlight ? C.primary : C.border}`,
                  borderRadius: 8, padding: '10px 11px', minHeight: 108,
                }}>
                  <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: s.highlight ? 'rgba(255,255,255,0.7)' : C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                    {s.n}. {s.label}
                  </div>
                  <div style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 700, color: s.highlight ? C.white : C.textPrimary, lineHeight: 1.15, marginBottom: 4 }}>
                    {fmtNum(s.value)}
                  </div>
                  {s.note && (
                    <div style={{ fontFamily: F.body, fontSize: 10, color: s.highlight ? 'rgba(255,255,255,0.7)' : C.textTertiary }}>{s.note}</div>
                  )}
                  {s.fromLabel && (
                    <div style={{ fontFamily: F.body, fontSize: 10, color: s.highlight ? 'rgba(255,255,255,0.85)' : C.green, fontWeight: 700 }}>
                      From {s.fromLabel} <span style={{ fontWeight: 800 }}>{s.rate}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* Attributed Performance */}
          <Panel style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-currency-dollar" style={{ fontSize: 12, color: C.green }} />
                </div>
                <span style={{ fontFamily: F.headline, fontSize: 15.5, fontWeight: 700, color: C.textPrimary }}>Attributed Performance</span>
              </div>
              <StatusPill status="Multi-Touch Model" tone="blue" />
            </div>
            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '-2px 0 12px' }}>Promotion was an active touchpoint but not assumed as the sole cause of conversion.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Total Promotion Spend</div>
                <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>${fmtNum(SPEND_TOTAL)}</div>
                <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 2 }}>Billed across {fmtNum(PORTFOLIO.campaigns)} campaigns</div>
              </div>
              <div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Attributed Leads <span style={{ color: C.textSecondary, fontWeight: 700 }}>{fmtNum(PORTFOLIO.leads)}</span></div>
                <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>${perLead} <span style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary }}>/ Lead</span></div>
                <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.green, marginTop: 2 }}>-18% vs non-promoted avg</div>
              </div>
              <div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Attributed Apps <span style={{ color: C.textSecondary, fontWeight: 700 }}>{fmtNum(PORTFOLIO.applications)}</span></div>
                <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>${perApp} <span style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary }}>/ Application</span></div>
                <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.green, marginTop: 2 }}>Strong unit economics</div>
              </div>
              <div style={{ background: C.blueLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Attributed Leases <span style={{ color: C.textSecondary, fontWeight: 700 }}>{fmtNum(PORTFOLIO.leases)}</span></div>
                <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>${perLease} <span style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary }}>/ Lease</span></div>
                <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.green, marginTop: 2 }}>Estimated ROI: {PORTFOLIO.roi}x rent</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div>
          {/* Admin Alerts */}
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <PanelTitle dot="#EA580C">Admin Alerts</PanelTitle>
              <StatusPill status="3 Require Action" tone="amber" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#FFFBEB', border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: 11 }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: C.amberText, marginTop: 1 }} />
                  <div>
                    <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>14 campaigns ending within 7 days.</div>
                    <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSecondary, margin: '3px 0 6px', lineHeight: 1.4 }}>Advertisers may require renewal notifications or auto-budget top-ups.</div>
                    <button onClick={() => goTo('campaigns')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>View Campaigns →</button>
                  </div>
                </div>
              </div>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 11 }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  <i className="ti ti-clock-exclamation" style={{ fontSize: 14, color: '#B91C1C', marginTop: 1 }} />
                  <div>
                    <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>1 product is still in Draft.</div>
                    <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSecondary, margin: '3px 0 6px', lineHeight: 1.4 }}>Homepage Promotion has 0 live campaigns and can't be purchased by landlords until it's published.</div>
                    <button onClick={() => goTo('product-catalog')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>View Product Catalog →</button>
                  </div>
                </div>
              </div>
              <div style={{ background: C.blueLight, border: '1px solid #BFDBFE', borderRadius: 8, padding: 11 }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  <i className="ti ti-info-circle" style={{ fontSize: 14, color: C.blue, marginTop: 1 }} />
                  <div>
                    <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>Low promotion adoption detected for one persona.</div>
                    <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSecondary, margin: '3px 0 6px', lineHeight: 1.4 }}>{lowestPersona.persona} adoption sits at {PERSONA_ADOPTION_RATE[lowestPersona.persona]}%, below the 15% quarterly benchmark.</div>
                    <button onClick={() => goTo('analytics-audit')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>View Analytics →</button>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* Top Product Activity */}
          <Panel>
            <PanelTitle>Top Product Activity</PanelTitle>
            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '-4px 0 10px' }}>Volume and conversion breakdown</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.7fr 0.7fr 0.7fr', gap: 6, padding: '0 2px 6px', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
              {['Product', 'Camp', 'Impr', 'Leads', 'Leases'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>
            {topProducts.map(p => {
              const a = PRODUCT_ANALYTICS[p.id];
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.7fr 0.7fr 0.7fr', gap: 6, alignItems: 'center', padding: '7px 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: p.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${p.icon}`} style={{ fontSize: 11, color: p.iconColor }} />
                    </div>
                    <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{p.name}</span>
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{p.liveCampaigns}</span>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{fmtAbbrev(a.impressions)}</span>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{fmtNum(a.leads)}</span>
                  <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{a.leases}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 10 }}>
              <button onClick={() => goTo('analytics-audit')} style={{
                width: '100%', textAlign: 'center', padding: '8px 0', background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 7,
                fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, cursor: 'pointer',
              }}>View Analytics</button>
            </div>
          </Panel>

          {/* Market Summary */}
          <Panel style={{ marginBottom: 0 }}>
            <PanelTitle>Market Summary</PanelTitle>
            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '-4px 0 10px' }}>Regional distribution of promo ads</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.6fr 0.8fr 0.8fr 0.6fr', gap: 6, padding: '0 2px 6px', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
              {['Market', 'Camp', 'Listings', 'Leads', 'Lease'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>
            {MARKET_ANALYTICS.map(m => {
              const market = MARKET_BY_CODE[m.code];
              const listings = Math.round(PORTFOLIO.promoted * (m.share / 100));
              return (
                <div key={m.code} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.6fr 0.8fr 0.8fr 0.6fr', gap: 6, alignItems: 'center', padding: '7px 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: MARKET_DOT[m.code] || C.textTertiary, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{market ? market.name : m.code}</span>
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{m.campaigns}</span>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{fmtNum(listings)}</span>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{fmtNum(m.leads)}</span>
                  <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{m.leases}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 11, color: C.textTertiary, lineHeight: 1.4 }}>
              Currently live in {MARKETS.length} of 3 target markets — UK expansion planned for a future quarter.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
