import React, { useState } from 'react';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, MOTION2, pad, UI2 } from '../../constants/v2';
import sidebarBuilding from '../../assets/v2/landlord/sidebar-building.jpg';
import brandLogo from '../../assets/v2/brand/urban-nest-logo.png';

// ─── NavF — Landlord Portal Left Navigation (Design System v2) ───────────────
// Reusable across all Landlord portal pages. All values come from constants/v2.
// Usage:
//   import NavF from '../../components/layout/NavF';
//   <NavF activePage="dashboard" />
//   <NavF activePage="dashboard" badges={{ maintenance: 2 }} />
//
// activePage values:
//   'dashboard' | 'properties' | 'listings' | 'leases' | 'finances' |
//   'maintenance' | 'tenants' | 'documents' | 'calendar' |
//   'reports' | 'analytics' | 'insights' | 'settings'
//
// badges (optional): { [navId]: number } — renders a white count pill when > 0.

const NAV_MAIN = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'ti-layout-grid',      route: '/landlord-portal/dashboard' },
  { id: 'properties',  label: 'Properties',  icon: 'ti-building',         route: '/landlord-portal/portfolio' },
  // Landlord Portal's lean version of the PM Portal's Listings Overview.
  { id: 'listings',    label: 'Listings',    icon: 'ti-list-details',     route: '/landlord-portal/listings' },
  { id: 'leases',      label: 'Leases',      icon: 'ti-file-text',        route: '/landlord-portal/leases' },
  { id: 'finances',    label: 'Finances',    icon: 'ti-file-dollar',      route: '/landlord-portal/finances' },
  { id: 'maintenance', label: 'Maintenance', icon: 'ti-tool',             route: '/landlord-portal/maintenance' },
  { id: 'tenants',     label: 'Tenants',     icon: 'ti-users',            route: '/landlord-portal/tenants' },
  { id: 'documents',   label: 'Documents',   icon: 'ti-files',            route: '/landlord-portal/documents' },
  // Phase 5 (Neyora) Step 3 — opens LandlordCalendarPage.jsx (Neyora Calendar widget).
  { id: 'calendar',    label: 'Calendar',    icon: 'ti-calendar',         route: '/landlord-portal/calendar' },
];

const NAV_BOTTOM = [
  { id: 'reports',   label: 'Reports',   icon: 'ti-chart-bar',  route: '/landlord-portal/reports' },
  { id: 'analytics', label: 'Analytics', icon: 'ti-chart-line', route: '/landlord-portal/analytics' },
  { id: 'insights',  label: 'Insights',  icon: 'ti-bulb',       route: '/landlord-portal/insights', dot: true },
  { id: 'settings',  label: 'Settings',  icon: 'ti-settings',   route: '/landlord-portal/settings' },
];

const S = {
  nav: {
    width: SZ2.sidebar, minWidth: SZ2.sidebar, height: '100vh', flexShrink: 0,
    display: 'flex', flexDirection: 'column', background: G2.sidebar, fontFamily: F2.body,
    overflowY: 'auto', overflowX: 'hidden',
  },
  logo:     { ...UI2.row(SP2.sm), padding: pad(SP2.xl, SP2.lg), cursor: 'pointer', flexShrink: 0 },
  logoMark: { height: SZ2.icon.md, width: 'auto', aspectRatio: SZ2.brandLogoRatio, flexShrink: 0, display: 'block' },
  logoName: { ...T2.brandTitle, lineHeight: LH2.tight, letterSpacing: LS2.snug },
  logoSub:  { ...T2.eyebrow, color: C2.sidebarTextMuted, marginTop: SP2.xs },
  // position + zIndex keep nav items above the promo photo, which bleeds up behind them
  list:     { position: 'relative', zIndex: 1, padding: pad(0, SP2.md), display: 'flex', flexDirection: 'column', gap: SP2.xxs },
  item: (active, hovered) => ({
    ...UI2.row(SP2.md),
    width: '100%',
    minHeight: SZ2.control.md,
    padding: pad(SP2.xs, SP2.md),
    border: 'none',
    borderRadius: R2.lg,
    textAlign: 'left',
    fontFamily: F2.body,
    fontSize: FS2.base,
    fontWeight: active ? FW2.semibold : FW2.medium,
    color: active || hovered ? C2.white : C2.sidebarText,
    background: active ? G2.primaryButton : hovered ? C2.sidebarHover : 'transparent',
    boxShadow: active ? SH2.primary : 'none',
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background ${MOTION2.fast}, color ${MOTION2.fast}`,
  }),
  icon:    { fontSize: FS2.lg, width: SP2.xl, flexShrink: 0, lineHeight: LH2.none },
  badge:   { ...UI2.countBadge, marginLeft: 'auto' },
  dot:     { ...UI2.dot(C2.success), marginLeft: 'auto', boxShadow: SH2.dotSuccess },
  divider: { height: SZ2.hairline, background: C2.sidebarDivider, margin: pad(SP2.md, SP2.xl) },
  sectionLabel: { ...T2.eyebrow, position: 'relative', zIndex: 1, color: C2.sidebarTextMuted, padding: pad(0, SP2.xl + SP2.xxs, SP2.sm) },
  // Promo: the photo is shown whole at its natural aspect (full sidebar width, no zoom).
  // It bleeds up behind the nav (masked to transparent → no seam) and its base slides under
  // the copy, which sits on a frosted glass panel whose blur fades in.
  promo: { position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column' },
  promoPhoto: {
    width: '100%', aspectRatio: SZ2.promoPhotoRatio, flexShrink: 0,
    marginTop: -SZ2.promoBleed, marginBottom: -SZ2.promoOverlap,
    backgroundImage: `${G2.sidebarPromoPhotoScrim}, url(${sidebarBuilding})`,
    backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
    WebkitMaskImage: G2.sidebarPromoPhotoMask, maskImage: G2.sidebarPromoPhotoMask,
    pointerEvents: 'none',
  },
  promoCopy: { position: 'relative', padding: pad(SP2.xl, SP2.lg, SP2.xl) },
  promoGlass: {
    ...UI2.darkGlass,
    position: 'absolute', left: 0, right: 0, top: -SZ2.promoGlassBleed, bottom: 0,
    WebkitMaskImage: G2.sidebarPromoGlassMask, maskImage: G2.sidebarPromoGlassMask,
    pointerEvents: 'none',
  },
  promoTitle: {
    position: 'relative',
    fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: FW2.semibold, color: C2.white,
    lineHeight: LH2.tight, letterSpacing: LS2.snug, marginBottom: SP2.sm,
  },
  promoText:  { position: 'relative', fontSize: FS2.sm, lineHeight: LH2.body, color: C2.onDark.textMuted, marginBottom: SP2.xl },
  addBtn:     { ...UI2.btn.primary, position: 'relative', width: '100%', minHeight: SZ2.control.lg, borderRadius: R2.pill },   // type comes from the shared button style
};

// Same house mark as the mobile app (UrbanNestMobile/src/assets/images/brand/urban_nest_logo.png)
function LogoMark() {
  return <img src={brandLogo} alt="" aria-hidden="true" style={S.logoMark} />;
}

export default function NavF({ activePage = 'dashboard', badges = {} }) {
  const [hovered, setHovered] = useState(null);

  const go = (route) => { if (route) window.location.href = route; };

  const renderItem = (item) => {
    const active = activePage === item.id;
    const count = Number(badges[item.id]) || 0;
    return (
      <button
        key={item.id}
        type="button"
        style={S.item(active, hovered === item.id)}
        onClick={() => go(item.route)}
        onMouseEnter={() => setHovered(item.id)}
        onMouseLeave={() => setHovered(null)}
        aria-current={active ? 'page' : undefined}
      >
        <i className={`ti ${item.icon}`} style={S.icon} aria-hidden="true" />
        {item.label}
        {count > 0 && <span style={S.badge}>{count > 99 ? '99+' : count}</span>}
        {item.dot && !count && <span style={S.dot} aria-hidden="true" />}
      </button>
    );
  };

  return (
    <nav className="un2-scroll-hidden" style={S.nav} aria-label="Landlord navigation">
      {/* Logo */}
      <div style={S.logo} onClick={() => go('/landlord-portal/dashboard')}>
        <LogoMark />
        <div>
          <div style={S.logoName}>UrbanNest</div>
          <div style={S.logoSub}>Estate Management</div>
        </div>
      </div>

      {/* Main nav */}
      <div style={S.list}>{NAV_MAIN.map(renderItem)}</div>

      <div style={S.divider} />

      {/* Insights & tools */}
      <div style={S.sectionLabel}>Insights &amp; Tools</div>
      <div style={S.list}>{NAV_BOTTOM.map(renderItem)}</div>

      {/* Promo + Add property */}
      <div style={{ flex: 1, minHeight: SP2.xxl }} />
      <div style={S.promo}>
        <div style={S.promoPhoto} aria-hidden="true" />
        <div style={S.promoCopy}>
          <div style={S.promoGlass} aria-hidden="true" />
          <div style={S.promoTitle}>Manage Your<br />Portfolio Effortlessly</div>
          <div style={S.promoText}>Leases, maintenance, finances and more — all in one place.</div>
          <button
            type="button"
            className="un2-btn"
            style={S.addBtn}
            onClick={() => go('/landlord-portal/add-property')}
          >
            <i className="ti ti-plus" style={{ fontSize: FS2.md }} aria-hidden="true" />
            Add new property
          </button>
        </div>
      </div>
    </nav>
  );
}
