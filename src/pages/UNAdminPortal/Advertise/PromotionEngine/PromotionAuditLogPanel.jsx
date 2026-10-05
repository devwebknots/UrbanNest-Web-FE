/**
 * PromotionAuditLogPanel.jsx — Promotion Engine → Analytics & Audit →
 * Audit & Logs sub-tab content.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Step 3 (second half), built from the user's "Promotion Audit
 * & Compliance Trail" Figma screenshot. Same content/layout-only rule as
 * every prior step — but this screen needed one extra pass the others
 * didn't: several of its Figma badges assert real security/compliance
 * OUTCOMES ("SOC2 VALIDATED", "SHA-256 VERIFIED", "Immutable Ledger",
 * "Verify Ledger Signature", "Signed Cert") rather than just naming a
 * feature. Nothing in this Django+DRF backend has been through a SOC2
 * audit or writes to a cryptographically-signed ledger, so keeping those
 * badges as literal claims would misrepresent the platform's actual
 * compliance posture — a different kind of problem than this feature's
 * usual "no backend yet" gap. Dropped/renamed for that reason:
 *   - "SOC2 VALIDATED" pill → removed (this page gets the standard
 *     <SampleTag /> like every other Promotion Engine screen instead)
 *   - "Immutable Ledger: Block #892-V • Sync: Real-time" → removed
 *   - "SHA-256 VERIFIED" badge on the detail panel → removed
 *   - "Verify Ledger Signature" header button → removed (no equivalent
 *     dead-end action makes sense for a claim this specific)
 *   - "Signed Cert" button → renamed "Download Record" (DeadEndButton)
 *   - Footer claim ("...cryptographic verification compliant with SOC2
 *     Type II, ISO/IEC 27001...") → replaced with an honest note that
 *     this is a sample layout for a not-yet-built audit pipeline
 * Everything else — the digest string, Auth Token, Dual-Sign status, IP
 * address — is kept as ordinary illustrative sample field content (the
 * same category as an Invoice ID or IP address elsewhere in this feature),
 * not a verification claim, so it didn't need the same treatment.
 *
 * The "548 Total Events" / page 1-2-3…92 pagination was also fake chrome
 * with nothing behind it — replaced with a real "Showing 1–N of N" count
 * against this file's own AUDIT_LOG array, same fix as Campaigns' roster.
 */

import React, { useState } from 'react';
import { C, F, SampleTag, ActionTooltip, DeadEndButton, StatusPill, CustomDropdown } from './promotionTokens';
import { SAMPLE_PRODUCTS } from './PromotionProductCatalog';
import { SAMPLE_CAMPAIGNS } from './PromotionCampaigns';

// ═══════════════════════════════════════════════════════════════════════════
// Shared small pieces
// ═══════════════════════════════════════════════════════════════════════════
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
  return <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, ...style }}>{children}</div>;
}
function Eyebrow({ children }) {
  return <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{children}</div>;
}

const ACTOR_TYPES = ['Admin', 'System'];
const ACTION_TYPES = [
  'Price Changed', 'Placement Added', 'Campaign Activated', 'Campaign Paused', 'Status Changed',
  'Plan Updated', 'Campaign Scheduled', 'Campaign Completed', 'Product Created', 'Rule Changed',
  'Tier Rebalancing', 'Campaign Extended',
];
const ACTION_TONE = {
  'Price Changed': 'amber', 'Placement Added': 'green', 'Campaign Activated': 'green',
  'Campaign Paused': 'grey', 'Status Changed': 'blue', 'Plan Updated': 'grey',
  'Campaign Scheduled': 'blue', 'Campaign Completed': 'grey', 'Product Created': 'green',
  'Rule Changed': 'amber', 'Tier Rebalancing': 'amber', 'Campaign Extended': 'blue',
};
const TIME_WINDOWS = ['Sep 01 – Sep 25, 2026', 'Last 7 Days', 'Last 30 Days', 'This Quarter'];
const ORIGIN_TYPES = ['Admin & System', 'Web Admin Console', 'Automated Lifecycle Worker'];
const PLAN_MATRIX_OPTIONS = ['All Plans', '30D Standard', '30D Featured', '7D Featured'];

// Sample audit trail — actors/products/campaigns are the same real names
// used across Product Catalog and Campaigns (Featured Listing, CMP001/
// ABC Apartments, etc.), not a disconnected invented cast.
const AUDIT_LOG = [
  {
    id: 'EV-94021', date: 'Sep 20, 10:30 AM', time: '10:30:44 CDT', actor: 'Admin John', actorType: 'Admin', uid: '88194', role: 'Administrator (Lead Monetization)',
    email: 'john.doe@urbannest.int', ip: '192.168.4.12', channel: 'Web Admin Console (v3.2)',
    target: 'Featured Listing', targetSub: 'Catalog: Tier 1', action: 'Price Changed', impact: 'Revenue Guardrail',
    diff: { path: 'pricing.tiers[0].rate', previous: '$69.00 USD', next: '$79.00 USD', note: 'per 30-Day active placement', delta: '+$10.00 (+14.5% adjustment)' },
    rationale: 'Annual Q3 pricing update aligned with metropolitan market indexing and increased top-of-funnel lead velocity.',
    authToken: 'AUTH-TOKEN-9941', impactScope: '82 campaigns', protocol: 'Cycle renewal', dualSign: 'Ready (2 Admins)', revertTo: '$69.00',
    productId: 1,
  },
  {
    id: 'EV-94022', date: 'Sep 20, 11:42 AM', time: '11:42:19 CDT', actor: 'Admin Mary', actorType: 'Admin', uid: '84012', role: 'Administrator (Catalog Ops)',
    email: 'mary.k@urbannest.int', ip: '192.168.4.18', channel: 'Web Admin Console (v3.2)',
    target: 'Featured Listing', targetSub: 'Surface: Search Top', action: 'Placement Added', impact: 'Surface Routing',
    diff: { path: 'placement.surfaces[]', previous: '(none)', next: 'Search Top', note: 'featured placement surface' },
    rationale: null, authToken: 'AUTH-TOKEN-9944', impactScope: '82 campaigns', protocol: 'Placement rollout', dualSign: 'Not required', revertTo: null,
    productId: 1,
  },
  {
    id: 'EV-94023', date: 'Sep 21, 08:15 AM', time: '08:15:02 CDT', actor: 'System Daemon', actorType: 'System', uid: 'SYS-01', role: 'System (Lifecycle Worker)',
    email: null, ip: null, channel: 'Internal Service Mesh',
    target: 'Campaign: CMP001', targetSub: 'ABC Apartments', action: 'Campaign Activated', impact: 'Runtime State',
    diff: { path: 'campaign.status', previous: 'Scheduled', next: 'Active', note: 'auto-activated at scheduled start' },
    rationale: null, authToken: null, impactScope: '1 campaign', protocol: 'Lifecycle automation', dualSign: 'N/A — automated', revertTo: null,
    campaignId: 'CMP001',
  },
  {
    id: 'EV-94024', date: 'Sep 21, 09:20 AM', time: '09:20:11 CDT', actor: 'Admin John', actorType: 'Admin', uid: '88194', role: 'Administrator (Lead Monetization)',
    email: 'john.doe@urbannest.int', ip: '192.168.4.12', channel: 'Web Admin Console (v3.2)',
    target: 'Campaign: CMP002', targetSub: 'Bayview Residences', action: 'Campaign Paused', impact: 'Delivery Pacing',
    diff: { path: 'campaign.status', previous: 'Active', next: 'Paused', note: 'budget cap reached' },
    rationale: 'Paused pending budget top-up from the customer — resumes automatically once payment clears.',
    authToken: 'AUTH-TOKEN-9951', impactScope: '1 campaign', protocol: 'Manual pause', dualSign: 'Not required', revertTo: null,
    campaignId: 'CMP002',
  },
  {
    id: 'EV-94025', date: 'Sep 21, 11:10 AM', time: '11:10:55 CDT', actor: 'Admin Mary', actorType: 'Admin', uid: '84012', role: 'Administrator (Catalog Ops)',
    email: 'mary.k@urbannest.int', ip: '192.168.4.18', channel: 'Web Admin Console (v3.2)',
    target: 'Standard Listing', targetSub: 'Core Inventory', action: 'Status Changed', impact: 'Catalog Exposure',
    diff: { path: 'product.status', previous: 'Draft', next: 'Active', note: 'catalog visibility' },
    rationale: null, authToken: 'AUTH-TOKEN-9955', impactScope: '31 campaigns', protocol: 'Catalog publish', dualSign: 'Not required', revertTo: 'Draft',
    productId: 2,
  },
  {
    id: 'EV-94026', date: 'Sep 21, 12:45 PM', time: '12:45:30 CDT', actor: 'Admin Sarah', actorType: 'Admin', uid: '91204', role: 'Administrator (Campaign Ops)',
    email: 'sarah.d@urbannest.int', ip: '192.168.4.27', channel: 'Web Admin Console (v3.2)',
    target: 'Plan: 30D Standard', targetSub: 'Tier Package', action: 'Plan Updated', impact: 'Inventory Rule',
    diff: { path: 'plan.tierPackage', previous: '20D Standard', next: '30D Standard', note: 'duration tier realignment' },
    rationale: null, authToken: 'AUTH-TOKEN-9958', impactScope: '31 campaigns', protocol: 'Plan revision', dualSign: 'Not required', revertTo: null,
    productId: 2,
  },
  {
    id: 'EV-94027', date: 'Sep 22, 09:05 AM', time: '09:05:47 CDT', actor: 'Admin Sarah', actorType: 'Admin', uid: '91204', role: 'Administrator (Campaign Ops)',
    email: 'sarah.d@urbannest.int', ip: '192.168.4.27', channel: 'Web Admin Console (v3.2)',
    target: 'Campaign: CMP004', targetSub: 'Highline Towers', action: 'Campaign Scheduled', impact: 'Launch Queue',
    diff: { path: 'campaign.status', previous: 'Draft', next: 'Scheduled', note: 'queued for Oct 1 launch' },
    rationale: null, authToken: 'AUTH-TOKEN-9963', impactScope: '1 campaign', protocol: 'Manual scheduling', dualSign: 'Not required', revertTo: null,
    campaignId: 'CMP004',
  },
  {
    id: 'EV-94028', date: 'Sep 22, 02:30 PM', time: '02:30:09 CDT', actor: 'System Daemon', actorType: 'System', uid: 'SYS-01', role: 'System (Lifecycle Worker)',
    email: null, ip: null, channel: 'Internal Service Mesh',
    target: 'Campaign: CMP003', targetSub: 'Sunset Villas — Unit 4B', action: 'Campaign Completed', impact: 'Runtime State',
    diff: { path: 'campaign.status', previous: 'Active', next: 'Completed', note: 'auto-completed at end date' },
    rationale: null, authToken: null, impactScope: '1 campaign', protocol: 'Lifecycle automation', dualSign: 'N/A — automated', revertTo: null,
    campaignId: 'CMP003',
  },
  {
    id: 'EV-94029', date: 'Sep 23, 10:00 AM', time: '10:00:21 CDT', actor: 'Admin John', actorType: 'Admin', uid: '88194', role: 'Administrator (Lead Monetization)',
    email: 'john.doe@urbannest.int', ip: '192.168.4.12', channel: 'Web Admin Console (v3.2)',
    target: 'Homepage Promotion', targetSub: 'New Product Record', action: 'Product Created', impact: 'Catalog Expansion',
    diff: { path: 'product.record', previous: '(none)', next: 'Homepage Promotion — PRM-HOME-HERO', note: 'initial draft catalog entry' },
    rationale: 'Added ahead of the Oct 1 daily-takeover launch so Plans can be scoped against it in advance.',
    authToken: 'AUTH-TOKEN-9970', impactScope: 'Platform catalog', protocol: 'Catalog onboarding', dualSign: 'Not required', revertTo: null,
    productId: 4,
  },
  {
    id: 'EV-94030', date: 'Sep 23, 03:15 PM', time: '03:15:52 CDT', actor: 'Admin Mary', actorType: 'Admin', uid: '84012', role: 'Administrator (Catalog Ops)',
    email: 'mary.k@urbannest.int', ip: '192.168.4.18', channel: 'Web Admin Console (v3.2)',
    target: 'Eligibility Rule', targetSub: 'PMS Subscription Required', action: 'Rule Changed', impact: 'Rules Engine',
    diff: { path: 'eligibility.pmsSubscriptionRequired', previous: 'No', next: 'Yes', note: 'tightened plan eligibility' },
    rationale: null, authToken: 'AUTH-TOKEN-9974', impactScope: 'Platform-wide', protocol: 'Rules Engine update', dualSign: 'Ready (2 Admins)', revertTo: 'No',
    productId: null,
  },
  {
    id: 'EV-94031', date: 'Sep 24, 08:40 AM', time: '08:40:36 CDT', actor: 'Admin Sarah', actorType: 'Admin', uid: '91204', role: 'Administrator (Campaign Ops)',
    email: 'sarah.d@urbannest.int', ip: '192.168.4.27', channel: 'Web Admin Console (v3.2)',
    target: 'Sponsored Listing', targetSub: 'PPC Budget Pools', action: 'Tier Rebalancing', impact: 'Budget Allocation',
    diff: { path: 'pricing.tiers[]', previous: '3 tiers', next: '4 tiers', note: 'added a mid-spend tier' },
    rationale: null, authToken: 'AUTH-TOKEN-9979', impactScope: '13 campaigns', protocol: 'Tier rebalance', dualSign: 'Not required', revertTo: null,
    productId: 3,
  },
  {
    id: 'EV-94032', date: 'Sep 24, 04:20 PM', time: '04:20:14 CDT', actor: 'Admin John', actorType: 'Admin', uid: '88194', role: 'Administrator (Lead Monetization)',
    email: 'john.doe@urbannest.int', ip: '192.168.4.12', channel: 'Web Admin Console (v3.2)',
    target: 'Campaign: CMP006', targetSub: 'Lakeside Commons', action: 'Campaign Extended', impact: 'Delivery Pacing',
    diff: { path: 'campaign.endDate', previous: '2026-10-10', next: '2026-10-24', note: 'extended 14 days at customer request' },
    rationale: 'Customer requested a 2-week extension to align with their leasing season peak.',
    authToken: 'AUTH-TOKEN-9985', impactScope: '1 campaign', protocol: 'Manual extension', dualSign: 'Not required', revertTo: null,
    campaignId: 'CMP006',
  },
];

const GOVERNANCE_CATALOG = [
  { key: 'product', label: 'Product Lifecycle', dot: C.primary, actions: ['Product Created', 'Product Updated', 'Product Activated', 'Product Deactivated', 'Price Changed', 'Placement Added', 'Placement Removed'] },
  { key: 'plan', label: 'Plan Governance', dot: C.green, actions: ['Plan Created', 'Plan Updated', 'Plan Activated', 'Plan Deactivated'] },
  { key: 'campaign', label: 'Campaign Operations', dot: C.blue, actions: ['Campaign Created', 'Campaign Activated', 'Campaign Paused', 'Campaign Resumed', 'Campaign Extended', 'Campaign Cancelled', 'Campaign Completed'] },
  { key: 'rules', label: 'Rules & Eligibility', dot: C.danger, actions: ['Rule Changed', 'Listing Eligibility Changed', 'Tier Rebalancing'] },
];

function fmtNum(n) { return Number(n || 0).toLocaleString(); }

// ═══════════════════════════════════════════════════════════════════════════
export default function PromotionAuditLogPanel() {
  const [search, setSearch] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [productScopeFilter, setProductScopeFilter] = useState('');
  const [planMatrixFilter, setPlanMatrixFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [selectedId, setSelectedId] = useState(AUDIT_LOG[0].id);

  const uniqueActors = [...new Set(AUDIT_LOG.map(e => e.actor))];

  const resetFilters = () => {
    setSearch(''); setTimeWindow(''); setActorFilter(''); setOriginFilter('');
    setProductScopeFilter(''); setPlanMatrixFilter(''); setCampaignFilter(''); setActionTypeFilter('');
  };

  // Actor / Action Type / Product Scope / Campaign ID + the search box
  // genuinely filter the table below; Time Window / Origin Type / Plan
  // Matrix are present for parity with the Figma's filter set but don't
  // narrow anything, same precedent as Campaigns' Date Window filter.
  const filtered = AUDIT_LOG.filter(e => {
    if (search && !`${e.actor} ${e.target} ${e.targetSub} ${e.action}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (actorFilter && e.actor !== actorFilter) return false;
    if (actionTypeFilter && e.action !== actionTypeFilter) return false;
    if (productScopeFilter && String(e.productId) !== productScopeFilter) return false;
    if (campaignFilter && e.campaignId !== campaignFilter) return false;
    return true;
  });

  const selected = AUDIT_LOG.find(e => e.id === selectedId) || AUDIT_LOG[0];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontFamily: F.headline, fontSize: 19, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Promotion Audit &amp; Compliance Trail</h2>
            <SampleTag />
          </div>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '4px 0 0', maxWidth: 580, lineHeight: 1.5 }}>
            Historical log of configuration changes, price adjustments, lifecycle activations, and governance actions across the promotion engine — sample data, no logging pipeline exists in the backend yet.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryDeadEnd label="Export Audit Log" icon="ti-download" tooltip="No export endpoint exists for the audit trail yet." />
          <SecondaryDeadEnd label="Compliance Report" icon="ti-file-report" tooltip="No compliance reporting pipeline exists yet." />
        </div>
      </div>

      {/* Governance filters */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 14, color: C.textSecondary }} />
            <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audit Governance Filters</span>
          </div>
          <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
            <i className="ti ti-refresh" style={{ fontSize: 12 }} /> Reset Filters
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ flex: '1 1 170px', minWidth: 170 }}><CustomDropdown placeholder="Time Window" options={TIME_WINDOWS.map(d => ({ value: d, label: d }))} value={timeWindow || TIME_WINDOWS[0]} onChange={setTimeWindow} /></div>
          <div style={{ flex: '1 1 130px', minWidth: 130 }}><CustomDropdown placeholder="Actor: All" options={[{ value: '', label: 'All Actors' }, ...uniqueActors.map(a => ({ value: a, label: a }))]} value={actorFilter} onChange={setActorFilter} /></div>
          <div style={{ flex: '1 1 160px', minWidth: 160 }}><CustomDropdown placeholder="Origin Type" options={ORIGIN_TYPES.map(o => ({ value: o, label: o }))} value={originFilter || ORIGIN_TYPES[0]} onChange={setOriginFilter} /></div>
          <div style={{ flex: '1 1 150px', minWidth: 150 }}><CustomDropdown placeholder="Product Scope: All" options={[{ value: '', label: 'All Products' }, ...SAMPLE_PRODUCTS.map(p => ({ value: String(p.id), label: p.name }))]} value={productScopeFilter} onChange={setProductScopeFilter} /></div>
          <div style={{ flex: '1 1 130px', minWidth: 130 }}><CustomDropdown placeholder="Plan Matrix" options={PLAN_MATRIX_OPTIONS.map(p => ({ value: p, label: p }))} value={planMatrixFilter || PLAN_MATRIX_OPTIONS[0]} onChange={setPlanMatrixFilter} /></div>
          <div style={{ flex: '1 1 140px', minWidth: 140 }}><CustomDropdown placeholder="Campaign ID: All" options={[{ value: '', label: 'All Campaigns' }, ...SAMPLE_CAMPAIGNS.map(c => ({ value: c.id, label: c.id }))]} value={campaignFilter} onChange={setCampaignFilter} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 0 0%', minWidth: 150 }}><CustomDropdown placeholder="Action Type: All" options={[{ value: '', label: 'All Actions' }, ...ACTION_TYPES.map(a => ({ value: a, label: a }))]} value={actionTypeFilter} onChange={setActionTypeFilter} /></div>
          <div style={{ position: 'relative', flex: '3 0 0%', minWidth: 220 }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.textTertiary }} />
            <input
              style={{ width: '100%', height: 38, boxSizing: 'border-box', background: '#F8F9FA', border: `1px solid #E8ECF0`, borderRadius: 6, padding: '0 11px 0 32px', fontFamily: F.body, fontSize: 13, color: C.textPrimary }}
              placeholder="Search log remarks, actors, or target objects…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Audit trail table */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontFamily: F.headline, fontSize: 14.5, fontWeight: 700, color: C.textPrimary }}>Audit Trail Entries</span>
            <StatusPill status={`${filtered.length} of ${AUDIT_LOG.length}`} tone="blue" />
          </div>
          <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>Sort: Most Recent</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1.4fr) minmax(0, 1.1fr) minmax(0, 1.1fr) 0.6fr', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
              {['Timestamp', 'Actor & Type', 'Target Object', 'Action Taken', 'Impact Scope', 'Inspect'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>No events match these filters.</div>
            ) : filtered.map((e, idx) => {
              const isSelected = e.id === selectedId;
              const initials = e.actor.split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <div key={e.id} onClick={() => setSelectedId(e.id)} style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1.4fr) minmax(0, 1.1fr) minmax(0, 1.1fr) 0.6fr', gap: 12,
                  padding: '11px 16px', alignItems: 'center', cursor: 'pointer',
                  borderBottom: `1px solid ${C.neutral}`, background: isSelected ? C.blueLight : idx % 2 === 1 ? '#FAFBFC' : C.white,
                }}>
                  <div>
                    <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{e.date}</div>
                    <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>{e.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: e.actorType === 'System' ? C.neutral : C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {e.actorType === 'System'
                        ? <i className="ti ti-robot" style={{ fontSize: 12, color: C.textSecondary }} />
                        : <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 500, color: C.primary }}>{initials}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.actor}</div>
                      <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>UID #{e.uid}</div>
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.target}</div>
                    <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.targetSub}</div>
                  </div>
                  <div><StatusPill status={e.action} tone={ACTION_TONE[e.action] || 'grey'} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.textTertiary, flexShrink: 0 }} />
                    {e.impact}
                  </div>
                  <div>
                    {isSelected ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: C.primary, color: C.white, fontFamily: F.body, fontSize: 10.5, fontWeight: 500, width: 'fit-content' }}>
                        <i className="ti ti-eye" style={{ fontSize: 11 }} /> Diff
                      </span>
                    ) : (
                      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: C.textTertiary }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>
          Showing 1–{filtered.length} of {AUDIT_LOG.length} events
        </div>
      </div>

      {/* Audit detail */}
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-file-search" style={{ fontSize: 16, color: C.textSecondary }} />
            <span style={{ fontFamily: F.headline, fontSize: 15.5, fontWeight: 500, color: C.textPrimary }}>Audit Detail: #{selected.id}</span>
          </div>
          <ActionTooltip text="No full object-history view is wired up yet.">
            <span style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 500, color: C.primary, cursor: 'not-allowed' }}>View Full Object History →</span>
          </ActionTooltip>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10.5, color: C.textTertiary, marginBottom: 18 }}>
          digest: {selected.id.toLowerCase().replace('ev-', '')}a1b2c3d4e5f6…{selected.uid}fc9904e2
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', display: 'flex', flexWrap: 'wrap', gap: '12px 24px' }}>
            {[
              ['Action Type', selected.action],
              ['Target Object', `${selected.target}${selected.productId ? ` (${SAMPLE_PRODUCTS.find(p => p.id === selected.productId)?.code || ''})` : ''}`],
              ['Changed By', selected.actor],
              ['Actor Authorization', selected.role],
              ['Execution Timestamp', `${selected.date} (${selected.time})`],
              ['IP & Origin Channel', selected.ip ? `${selected.ip} (${selected.channel})` : selected.channel],
            ].map(([label, value]) => (
              <div key={label} style={{ minWidth: 150 }}>
                <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 500, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.textPrimary }}>{value}</div>
                {label === 'Changed By' && selected.email && <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>{selected.email}</div>}
              </div>
            ))}
          </div>

          <div style={{ flex: '1 1 260px', minWidth: 240 }}>
            <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 500, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Diff Payload — path: {selected.diff.path}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 500, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Previous</div>
                <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: '#B91C1C', textDecoration: 'line-through' }}>{selected.diff.previous}</div>
                {selected.diff.note && <div style={{ fontFamily: F.body, fontSize: 10, color: '#B91C1C', marginTop: 2 }}>{selected.diff.note}</div>}
              </div>
              <div style={{ flex: 1, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 500, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>New</div>
                <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: '#047857' }}>{selected.diff.next}</div>
                {selected.diff.note && <div style={{ fontFamily: F.body, fontSize: 10, color: '#047857', marginTop: 2 }}>{selected.diff.note}</div>}
              </div>
            </div>
            {selected.diff.delta && (
              <div style={{ marginTop: 8, fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>
                Net Adjustment: <span style={{ fontWeight: 500, color: C.green }}>{selected.diff.delta}</span>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
            <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 500, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Governance &amp; Controls</div>
            {[
              ['Auth Token', selected.authToken || '—'],
              ['Impact Scope', selected.impactScope],
              ['Protocol', selected.protocol],
              ['Dual-Sign', selected.dualSign],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontFamily: F.body, fontSize: 11.5 }}>
                <span style={{ color: C.textSecondary }}>{label}</span>
                <span style={{ color: C.textPrimary, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {selected.revertTo && <DeadEndButton small label={`Revert to ${selected.revertTo}`} icon="ti-arrow-back-up" tooltip="No write endpoint exists yet — reverting a historical change isn't wired up." />}
              <DeadEndButton small label="Download Record" icon="ti-file-download" tooltip="No export endpoint exists yet for individual audit records." />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontFamily: F.body, fontSize: 9.5, fontWeight: 500, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Stated Business Rationale</div>
        <div style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, fontStyle: selected.rationale ? 'italic' : 'normal', lineHeight: 1.5 }}>
          {selected.rationale ? `“${selected.rationale}”` : 'No rationale recorded for this event.'}
        </div>
      </Panel>

      {/* Governance catalog */}
      <Panel>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-sitemap" style={{ fontSize: 16, color: C.textSecondary }} />
            <span style={{ fontFamily: F.headline, fontSize: 15.5, fontWeight: 700, color: C.textPrimary }}>Auditable Action Governance Catalog</span>
          </div>
          <span style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>Draft taxonomy — Session 48</span>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {GOVERNANCE_CATALOG.map(col => (
            <div key={col.key} style={{ flex: '1 1 200px', minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.dot }} />
                <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 500, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</span>
              </div>
              {col.actions.map(a => (
                <div key={a} style={{
                  fontFamily: F.body, fontSize: 12, color: a === 'Price Changed' ? '#B45309' : C.textPrimary,
                  fontWeight: 500,
                  background: a === 'Price Changed' ? '#FFFBEB' : 'transparent',
                  borderRadius: 6, padding: '5px 7px', marginBottom: 2,
                }}>{a}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5 }}>
          <i className="ti ti-info-circle" style={{ marginRight: 5, color: C.textTertiary }} />
          This is a sample layout for the audit trail this feature will eventually need — no logging pipeline exists in the backend yet, so nothing above is written from a real event stream.
        </div>
      </Panel>
    </div>
  );
}
