/**
 * UNAdminPartnerManagement.jsx — UN Admin Portal → Partners → Tenant
 * Screening. Top-level tab shell, mirroring Configurations/RuleEngine/
 * UNAdminRuleEngine.jsx's own breadcrumb + tab-strip pattern.
 * ─────────────────────────────────────────────────────────────────────────────
 * Approved wireframe: https://claude.ai/artifact/M7ZMt4KgSZBXBCxKCTApeJ
 * (approved 2026-11-16). Mounted via NavE.jsx's new top-level "Partners"
 * section (id `partners`, single child `partners-tenant-screening`) and
 * App.js's /admin-portal/partners/tenant-screening route — see both files'
 * own Session 70 comments.
 *
 * "Partners" is deliberately its own top-level nav section rather than
 * nested under Configurations, per the user's explicit instruction — the
 * Application Screening Module spec's later Criteria Rules Management /
 * Screening Defaults screens (not yet built) are expected to live
 * alongside Configurations' existing Screening Config entry instead, so
 * Partners staying separate leaves room for other non-screening partner
 * types later without re-nesting anything.
 *
 * Two tabs today, both against mockPartnerData.js (no backend model exists
 * yet — see that file's header):
 *   - Partners           → PartnerList.jsx (card grid + Add/Edit modal)
 *   - Capability Matrix   → PartnerCapabilityMatrix.jsx (read-only grid)
 */
import React, { useState } from 'react';
import { C, F } from './partnerManagementTokens';
import PartnerList from './PartnerList';
import PartnerCapabilityMatrix from './PartnerCapabilityMatrix';

const TABS = [
  { id: 'partners', label: 'Partners' },
  { id: 'capability-matrix', label: 'Capability Matrix' },
];

export default function UNAdminPartnerManagement() {
  const [activeTab, setActiveTab] = useState('partners');
  const activeLabel = TABS.find(t => t.id === activeTab)?.label || '';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        Partners
        <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
        Tenant Screening
        <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
        <span style={{ color: C.textSecondary }}>{activeLabel}</span>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: F.body, fontSize: 13, fontWeight: 700,
              padding: '10px 20px', border: 'none', background: 'none',
              color: activeTab === tab.id ? C.primary : C.textTertiary,
              borderBottom: `2px solid ${activeTab === tab.id ? C.primary : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {activeTab === 'partners' && <PartnerList />}
      {activeTab === 'capability-matrix' && <PartnerCapabilityMatrix />}
    </div>
  );
}
