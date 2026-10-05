/**
 * PromotionAnalyticsAudit.jsx — Promotion Engine → Analytics & Audit tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 48 — Step 3 complete. Analytics sub-tab (PromotionAnalyticsPanel)
 * built first, then Audit & Logs sub-tab (PromotionAuditLogPanel), per the
 * agreed order. This file stays a thin shell — the sub-tab switcher only —
 * so each sub-tab's own file can carry its own header comment explaining
 * its data sourcing and (for Audit & Logs) its honesty fixes vs. the
 * Figma, without cluttering this one.
 */

import React, { useState } from 'react';
import { C, F } from './promotionTokens';
import PromotionAnalyticsPanel from './PromotionAnalyticsPanel';
import PromotionAuditLogPanel from './PromotionAuditLogPanel';

const SUB_TABS = [
  { id: 'analytics', label: 'Analytics', icon: 'ti-chart-bar', Component: PromotionAnalyticsPanel },
  { id: 'audit',     label: 'Audit & Logs', icon: 'ti-history', Component: PromotionAuditLogPanel },
];

export default function PromotionAnalyticsAudit() {
  const [subTab, setSubTab] = useState('analytics');
  const Active = SUB_TABS.find(t => t.id === subTab)?.Component || PromotionAnalyticsPanel;

  return (
    <div>
      {/* Sub-tab strip */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {SUB_TABS.map(t => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 14px', margin: '0 4px 0 0',
                background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
                fontFamily: F.body, fontSize: 12.5, fontWeight: active ? 700 : 600,
                color: active ? C.primary : C.textSecondary,
                cursor: 'pointer',
              }}
            >
              <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Active />
    </div>
  );
}
