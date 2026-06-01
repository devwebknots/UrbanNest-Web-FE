/**
 * UNAdminDashboard.jsx — UN Admin Portal Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Route: /admin-portal/dashboard
 * Placeholder dashboard with Operations summary cards.
 * Full dashboard content → Session 9+
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import UNAdminShell from '../UNAdminShell';

const C = {
  primary:       '#002D5B',
  pageBg:        '#F8FAFC',
  border:        '#E2E8F0',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  white:         '#FFFFFF',
  green:         '#16A34A',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value, sub }) {
  return (
    <div style={{
      background: C.white, borderRadius: '12px',
      border: `1px solid ${C.border}`,
      padding: '20px 24px',
      display: 'flex', alignItems: 'flex-start', gap: '16px',
    }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '10px',
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: '18px', color: C.white }} />
      </div>
      <div>
        <div style={{ fontFamily: F.body, fontSize: '11px', fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontFamily: F.headline, fontSize: '26px', fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontFamily: F.body, fontSize: '11px', color: C.textSecondary, marginTop: '4px' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UNAdminDashboard() {
  return (
    <UNAdminShell activeId="dashboard" title="Dashboard">

      {/* Page title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: F.headline, fontSize: 'clamp(22px, 2.2vw, 28px)', fontWeight: 700, color: C.textPrimary, margin: '0 0 4px' }}>
          Dashboard
        </h1>
        <p style={{ fontFamily: F.body, fontSize: 'clamp(13px, 1.2vw, 15px)', color: C.textSecondary, margin: 0 }}>
          Welcome back. Here's what needs your attention today.
        </p>
      </div>

      {/* Operations summary */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: F.headline, fontSize: '16px', fontWeight: 600, color: C.textPrimary, margin: '0 0 14px' }}>
          Operations
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          <StatCard icon="ti-clock"        iconBg="#F59E0B" label="Pending Verifications" value="—"  sub="Awaiting review" />
          <StatCard icon="ti-file-check"   iconBg={C.primary} label="Applications"       value="—"  sub="Pending approval" />
          <StatCard icon="ti-certificate"  iconBg="#064E3B" label="License Reviews"       value="—"  sub="In queue" />
          <StatCard icon="ti-ticket"       iconBg="#7C3AED" label="Support Tickets"       value="—"  sub="Open tickets" />
        </div>
      </div>

      {/* Coming soon notice */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: '12px', padding: '32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', gap: '12px',
        minHeight: '200px',
      }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-layout-dashboard" style={{ fontSize: '22px', color: C.textSecondary }} />
        </div>
        <h3 style={{ fontFamily: F.headline, fontSize: '16px', fontWeight: 600, color: C.textPrimary, margin: 0 }}>
          Full dashboard coming in Session 9
        </h3>
        <p style={{ fontFamily: F.body, fontSize: '13px', color: C.textSecondary, margin: 0, maxWidth: '360px', lineHeight: 1.6 }}>
          Charts, activity feeds, and live metrics will be wired up once the Service Catalog and Applications queue are built.
        </p>
      </div>

    </UNAdminShell>
  );
}
