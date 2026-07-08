import React, { useState } from 'react';
import { C, F } from '../../pages/Landlord/landlordTokens';

// ─── NavF — Landlord Portal Left Navigation ───────────────────────────────────
// Reusable across all Landlord portal pages.
// Usage:
//   import NavF from '../../components/layout/NavF';
//   <NavF activePage="dashboard" />
//
// activePage values:
//   'dashboard' | 'properties' | 'leases' | 'finances' |
//   'maintenance' | 'tenants' | 'documents' |
//   'reports' | 'analytics' | 'insights' | 'settings'


const NAV_MAIN = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'ti-layout-dashboard', route: '/landlord-portal/dashboard' },
  { id: 'properties',  label: 'Properties',  icon: 'ti-building',         route: '/landlord-portal/portfolio' },
  { id: 'leases',      label: 'Leases',      icon: 'ti-file-text',        route: '/landlord-portal/leases' },
  { id: 'finances',    label: 'Finances',    icon: 'ti-wallet',           route: '/landlord-portal/finances' },
  { id: 'maintenance', label: 'Maintenance', icon: 'ti-tool',             route: '/landlord-portal/maintenance' },
  { id: 'tenants',     label: 'Tenants',     icon: 'ti-users',            route: '/landlord-portal/tenants' },
  { id: 'documents',   label: 'Documents',   icon: 'ti-folder',           route: '/landlord-portal/documents' },
];

const NAV_BOTTOM = [
  { id: 'reports',   label: 'Reports',   icon: 'ti-chart-bar',  route: '/landlord-portal/reports' },
  { id: 'analytics', label: 'Analytics', icon: 'ti-chart-line', route: '/landlord-portal/analytics' },
  { id: 'insights',  label: 'Insights',  icon: 'ti-bulb',       route: '/landlord-portal/insights' },
  { id: 'settings',  label: 'Settings',  icon: 'ti-settings',   route: '/landlord-portal/settings' },
];

const S = {
  nav: {
    width: 164,
    minWidth: 164,
    background: C.navBg,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    height: '100vh',
    fontFamily: F.sans,
  },
  logo: {
    padding: '20px 16px 14px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  logoSub: {
    display: 'block',
    fontSize: 9,
    color: '#3d6a9a',
    fontWeight: 400,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  section: {
    flex: 1,
    paddingTop: 4,
    overflowY: 'auto',
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 16px',
    color: active ? C.navActive : C.navText,
    fontSize: 12.5,
    fontWeight: active ? 500 : 400,
    cursor: 'pointer',
    userSelect: 'none',
    borderLeft: active ? `3px solid ${C.navBorder}` : '3px solid transparent',
    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
    transition: 'all 0.15s',
  }),
  navIcon: {
    fontSize: 15,
    width: 16,
    flexShrink: 0,
  },
  bottom: {
    padding: '12px 0',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  addBtn: {
    margin: '10px 12px 4px',
    background: C.blue,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 11.5,
    fontWeight: 500,
    cursor: 'pointer',
    width: 'calc(100% - 24px)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    fontFamily: F.sans,
  },
};

export default function NavF({ activePage = 'dashboard' }) {
  const [hovered, setHovered] = useState(null);

  const handleClick = (item) => {
    if (item.route) window.location.href = item.route;
  };

  const renderItem = (item) => {
    const active = activePage === item.id;
    const isHovered = hovered === item.id;
    return (
      <div
        key={item.id}
        style={{
          ...S.navItem(active),
          ...(isHovered && !active ? { color: '#c8dff5', background: 'rgba(255,255,255,0.04)' } : {}),
        }}
        onClick={() => handleClick(item)}
        onMouseEnter={() => setHovered(item.id)}
        onMouseLeave={() => setHovered(null)}
      >
        <i className={`ti ${item.icon}`} style={S.navIcon} aria-hidden="true" />
        {item.label}
      </div>
    );
  };

  return (
    <nav style={S.nav}>
      {/* Logo */}
      <div style={S.logo}>
        UrbanNest
        <span style={S.logoSub}>Estate Management</span>
      </div>

      {/* Main nav items */}
      <div style={S.section}>
        {NAV_MAIN.map(renderItem)}
      </div>

      {/* Bottom nav items + Add property button */}
      <div style={S.bottom}>
        {NAV_BOTTOM.map(renderItem)}
        <button
          style={S.addBtn}
          onClick={() => window.location.href = '/landlord-portal/add-property'}
        >
          <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
          Add new property
        </button>
      </div>
    </nav>
  );
}
