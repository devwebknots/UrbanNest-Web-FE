import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, MOTION2, pad, UI2 } from '../../constants';
import sidebarBuilding from '../../assets/landlord/sidebar-building.jpg';
import brandLogo from '../../assets/brand/urban-nest-logo.png';

// ─── NavPM — PM Portal Left Navigation (Design System v2) ───────────────────
// VERSION 2 — the v1 equivalent is NavB.jsx (older PM screens).
// Same look as the Landlord sidebar (NavF): navy gradient column · house logo · blue active pill ·
// caps section labels · building photo promo at the bottom with the frosted copy panel + pill CTA.
// Same CONTENT as NavB: every PM menu group / sub-page / route, RBAC module checks (hasAccess),
// "Create Listing" CTA, Help Center + Sign out.
//
//   <NavPM activeId="approvals-overview" />          (activeId = a sub-page id from NAV_STRUCTURE)
//
// Groups with sub-pages expand / collapse (one open at a time); the group holding the active page opens
// on load. Active sub-page = blue pill (G2.primaryButton); its group = white text on the hover tint.

// ── Maps item id → permission module code (unlisted ids are always visible) ──
const MODULE_MAP = {
  'dashboard':        'DASHBOARD',
  'properties':       'PROPERTIES',
  'approvals-nav':    'APPROVALS',
  'leasing':          'LEASING',
  'maintenance':      'MAINTENANCE',
  'tenants':          'TENANTS',
  'owners':           'OWNERS',
  'communications':   'COMMUNICATIONS',
  'roles-access':     'ROLES_ACCESS',
  'financials':       'FINANCIALS',
  'marketing':        'MARKETING',
  'analytics':        'ANALYTICS',
  'configuration':    'CONFIG',
  'account-settings': 'ACCOUNT_SETTINGS',
  'help-resources':   'SUPPORT',
};

const NAV_STRUCTURE = [
  {
    type: 'standalone', id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard',
    children: [
      { id: 'my-dashboard',      label: 'My Dashboard',      icon: 'ti-home',      route: '/pm-portal/dashboard/my-dashboard' },
      { id: 'portfolio-health',  label: 'Portfolio Health',  icon: 'ti-building',  route: '/pm-portal/dashboard/portfolio-health' },
      { id: 'financial-pulse',   label: 'Financial Pulse',   icon: 'ti-cash',      route: '/pm-portal/dashboard/financial-pulse' },
      { id: 'leasing-pipeline',  label: 'Leasing Pipeline',  icon: 'ti-file-text', route: '/pm-portal/dashboard/leasing-pipeline' },
      { id: 'maintenance-watch', label: 'Maintenance Watch', icon: 'ti-tool',      route: '/pm-portal/dashboard/maintenance-watch' },
      { id: 'my-team',           label: 'My Team',           icon: 'ti-users',     route: '/pm-portal/dashboard/my-team' },
    ],
  },
  {
    type: 'section', label: 'Operations',
    items: [
      { id: 'properties', label: 'Properties', icon: 'ti-building',
        children: [
          { id: 'all-props', label: 'All Properties',           route: '/pm-portal/properties' },
          { id: 'drafts',    label: 'Drafts',                   route: '/pm-portal/properties/drafts' },
          { id: 'occupancy', label: 'Occupancy & Availability', route: '/pm-portal/properties/occupancy' },
        ],
      },
      { id: 'approvals-nav', label: 'Approvals', icon: 'ti-circle-check',
        children: [
          { id: 'approvals-overview',  label: 'Overview',  route: '/pm-portal/approvals' },
          { id: 'approvals-ownership', label: 'Ownership', route: '/pm-portal/approvals/ownership' },
        ],
      },
      { id: 'leasing', label: 'Leasing', icon: 'ti-file-text',
        children: [
          { id: 'prospects',     label: 'Prospects & Leads', route: '/pm-portal/leasing/prospects' },
          { id: 'applicants',    label: 'Applicants',        route: '/pm-portal/leasing/applicants' },
          { id: 'screening',     label: 'Screening',         route: '/pm-portal/leasing/screening' },
          { id: 'active-leases', label: 'Active Leases',     route: '/pm-portal/leasing/active' },
          { id: 'gen-lease',     label: 'Generate Lease',    route: '/pm-portal/leasing/generate' },
          { id: 'renewals',      label: 'Renewals',          route: '/pm-portal/leasing/renewals' },
          { id: 'terminations',  label: 'Terminations',      route: '/pm-portal/leasing/terminations' },
        ],
      },
      { id: 'maintenance', label: 'Maintenance', icon: 'ti-tool', subHeader: 'Work Orders',
        children: [
          { id: 'tasks',     label: 'Tasks',             route: '/pm-portal/maintenance/tasks' },
          { id: 'move-in',   label: 'Move-in Checklist', route: '/pm-portal/maintenance/move-in' },
          { id: 'approvals', label: 'Owner Approvals',   route: '/pm-portal/maintenance/approvals' },
          { id: 'requests',  label: 'Requests',          route: '/pm-portal/maintenance/requests' },
          { id: 'vendors',   label: 'Vendors',           route: '/pm-portal/maintenance/vendors' },
          { id: 'invoices',  label: 'Vendor Invoices',   route: '/pm-portal/maintenance/invoices' },
        ],
      },
    ],
  },
  {
    type: 'section', label: 'People',
    items: [
      { id: 'tenants', label: 'Tenants', icon: 'ti-users',
        children: [
          { id: 'all-tenants', label: 'All Tenants',       route: '/pm-portal/tenants' },
          { id: 'passport',    label: 'Property Passport', route: '/pm-portal/tenants/passport' },
        ],
      },
      { id: 'owners', label: 'Owners', icon: 'ti-id-badge',
        children: [
          { id: 'all-owners',  label: 'All Owners',       route: '/pm-portal/owners' },
          { id: 'owner-stmts', label: 'Owner Statements', route: '/pm-portal/owners/statements' },
        ],
      },
      { id: 'communications', label: 'Communications', icon: 'ti-message',
        children: [
          { id: 'messages',  label: 'Messages',  route: '/pm-portal/comms/messages' },
          { id: 'notes',     label: 'Notes',     route: '/pm-portal/comms/notes' },
          { id: 'documents', label: 'Documents', route: '/pm-portal/comms/documents' },
        ],
      },
      { id: 'roles-access', label: 'Roles & Access', icon: 'ti-settings',
        children: [
          { id: 'rbac-roles',   label: 'Roles',        route: '/pm-portal/rbac/roles' },
          { id: 'rbac-assign',  label: 'Assign Role',  route: '/pm-portal/rbac/assign' },
          { id: 'rbac-members', label: 'Team Members', route: '/pm-portal/rbac/members' },
          { id: 'rbac-org',     label: 'Organisation', route: '/pm-portal/rbac/org' },
        ],
      },
    ],
  },
  {
    type: 'section', label: 'Money',
    items: [
      { id: 'financials', label: 'Financials', icon: 'ti-cash',
        children: [
          { id: 'accounts',    label: 'Accounts',         route: '/pm-portal/financials/accounts' },
          { id: 'rent',        label: 'Rent & Payments',  route: '/pm-portal/financials/rent' },
          { id: 'expenses',    label: 'Expenses',         route: '/pm-portal/financials/expenses' },
          { id: 'pl-summary',  label: 'P&L Summary',      route: '/pm-portal/financials/pl' },
          { id: 'own-stmts',   label: 'Owner Statements', route: '/pm-portal/financials/owner-statements' },
          { id: 'tax-exports', label: 'Tax Exports',      route: '/pm-portal/financials/tax' },
        ],
      },
    ],
  },
  {
    type: 'section', label: 'Growth',
    items: [
      { id: 'marketing', label: 'Marketing', icon: 'ti-trending-up',
        children: [
          { id: 'listings',    label: 'Listings',     route: '/pm-portal/marketing/listings' },
          { id: 'ad-plans',    label: 'Ad Plans',     route: '/pm-portal/marketing/ad-plans' },
          { id: 'ad-messages', label: 'Ad Messages',  route: '/pm-portal/marketing/ad-messages' },
          { id: 'blog',        label: 'Blog',         route: '/pm-portal/marketing/blog' },
          { id: 'social',      label: 'Social Media', route: '/pm-portal/marketing/social' },
        ],
      },
      { id: 'analytics', label: 'Analytics', icon: 'ti-chart-bar',
        children: [
          { id: 'perf-dash',     label: 'Performance Dashboard', route: '/pm-portal/analytics/performance' },
          { id: 'occ-trends',    label: 'Occupancy Trends',      route: '/pm-portal/analytics/occupancy' },
          { id: 'fin-analytics', label: 'Financial Analytics',   route: '/pm-portal/analytics/financial' },
          { id: 'custom-rpts',   label: 'Custom Reports',        route: '/pm-portal/analytics/reports' },
        ],
      },
    ],
  },
  {
    type: 'section', label: 'Admin',
    items: [
      { id: 'configuration', label: 'Configuration', icon: 'ti-adjustments',
        children: [
          { id: 'screening-rules',       label: 'Screening Rules',         route: '/pm-portal/config/screening' },
          { id: 'financial-settings',    label: 'Financial Settings',      route: '/pm-portal/config/financial' },
          { id: 'lease-rent',            label: 'Lease & Rent',            route: '/pm-portal/config/lease' },
          { id: 'verification-settings', label: 'Verification Settings',   route: '/pm-portal/config/verification-settings' },
          { id: 'listing-readiness',     label: 'Listing Readiness Rules', route: '/pm-portal/config/listing-readiness' },
          { id: 'partners',              label: 'Partners',                route: '/pm-portal/config/partners' },
          { id: 'communication',         label: 'Communication',           route: '/pm-portal/config/communication' },
          { id: 'data-ai',               label: 'Data & AI',               route: '/pm-portal/config/data-ai' },
        ],
      },
      { id: 'account-settings', label: 'Account Settings', icon: 'ti-settings',
        children: [
          { id: 'account-profile',      label: 'My Profile',             icon: 'ti-user',          route: '/pm-portal/account/profile' },
          { id: 'account-bank',         label: 'Bank Accounts',          icon: 'ti-building-bank', route: '/pm-portal/account/bank-accounts' },
          { id: 'account-subscription', label: 'Subscription & Billing', icon: 'ti-credit-card',   route: '/pm-portal/account/subscription' },
          { id: 'account-services',     label: 'Services',               icon: 'ti-stack-2',       route: '/pm-portal/account/services' },
          { id: 'account-transactions', label: 'Transactions',           icon: 'ti-receipt',       route: '/pm-portal/account/transactions' },
          { id: 'account-integrations', label: 'Integrations',           icon: 'ti-plug',          route: '/pm-portal/account/integrations' },
        ],
      },
    ],
  },
  {
    type: 'section', label: 'Support',
    items: [
      { id: 'help-resources', label: 'Help & Resources', icon: 'ti-help-circle',
        children: [
          { id: 'help-center', label: 'Help Center', route: '/pm-portal/support/help' },
          { id: 'tutorials',   label: 'Tutorials',   route: '/pm-portal/support/tutorials' },
          { id: 'whats-new',   label: "What's New",  route: '/pm-portal/support/whats-new' },
        ],
      },
    ],
  },
];

function findDefaultExpanded(activeId) {
  for (const group of NAV_STRUCTURE) {
    if (group.type === 'standalone' && group.children?.some(c => c.id === activeId)) return group.id;
    if (group.type === 'section') {
      for (const item of group.items || []) {
        if (item.children?.some(c => c.id === activeId)) return item.id;
      }
    }
  }
  return 'dashboard';
}

// Sidebar scroll position survives page changes. Every PM page renders its own PMPageShell, so NavPM remounts on each
// navigation and its list would jump back to the top — the user then had to scroll down again to reach the next
// Account Settings item (2026-11-27). Kept in module scope (lives for the whole SPA session) and restored before paint.
let savedNavScroll = 0;

// Styles — same values as NavF (Landlord sidebar), so both portals read as one app
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
  list:     { position: 'relative', zIndex: 1, padding: pad(0, SP2.md), display: 'flex', flexDirection: 'column', gap: SP2.xxs },
  item: (active, open, hovered) => ({
    ...UI2.row(SP2.md),
    width: '100%', minHeight: SZ2.control.md, padding: pad(SP2.xs, SP2.md),
    border: 'none', borderRadius: R2.lg, textAlign: 'left',
    fontFamily: F2.body, fontSize: FS2.base,
    fontWeight: active || open ? FW2.semibold : FW2.medium,
    color: active || open || hovered ? C2.white : C2.sidebarText,
    background: active ? G2.primaryButton : open || hovered ? C2.sidebarHover : 'transparent',
    boxShadow: active ? SH2.primary : 'none',
    cursor: 'pointer', userSelect: 'none',
    transition: `background ${MOTION2.fast}, color ${MOTION2.fast}`,
  }),
  icon:    { fontSize: FS2.lg, width: SP2.xl, flexShrink: 0, lineHeight: LH2.none },
  chevron: (open) => ({ marginLeft: 'auto', fontSize: FS2.sm, color: C2.sidebarTextMuted, transition: `transform ${MOTION2.fast}`, transform: open ? 'rotate(180deg)' : 'none' }),
  // sub-pages: indented under the group icon, a faint guide line on the left
  children: {
    display: 'flex', flexDirection: 'column', gap: SP2.xxs,
    margin: pad(SP2.xxs, 0, SP2.xs, SP2.xl), paddingLeft: SP2.sm,
    borderLeft: `${SZ2.hairline}px solid ${C2.sidebarDivider}`,
  },
  subHeader: { ...T2.eyebrow, color: C2.sidebarTextMuted, padding: pad(SP2.sm, SP2.md, SP2.xs) },
  child: (active, hovered) => ({
    ...UI2.row(SP2.sm),
    width: '100%', minHeight: SZ2.control.sm, padding: pad(SP2.xs, SP2.md),
    border: 'none', borderRadius: R2.md, textAlign: 'left',
    fontFamily: F2.body, fontSize: FS2.base,
    fontWeight: active ? FW2.semibold : FW2.regular,
    color: active || hovered ? C2.white : C2.sidebarText,
    background: active ? G2.primaryButton : hovered ? C2.sidebarHover : 'transparent',
    boxShadow: active ? SH2.primary : 'none',
    cursor: 'pointer', userSelect: 'none',
    transition: `background ${MOTION2.fast}, color ${MOTION2.fast}`,
  }),
  childIcon: { fontSize: FS2.md, flexShrink: 0, lineHeight: LH2.none },
  divider:   { height: SZ2.hairline, background: C2.sidebarDivider, margin: pad(SP2.md, SP2.xl) },
  sectionLabel: { ...T2.eyebrow, position: 'relative', zIndex: 1, color: C2.sidebarTextMuted, padding: pad(SP2.lg, SP2.xl + SP2.xxs, SP2.sm) },
  // Promo — identical to NavF: photo bleeds up behind the nav (masked), frosted copy panel, pill CTA
  promo: { position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column' },
  promoPhoto: {
    width: '100%', aspectRatio: SZ2.promoPhotoRatio, flexShrink: 0,
    marginTop: -SZ2.promoBleed, marginBottom: -SZ2.promoOverlap,
    backgroundImage: `${G2.sidebarPromoPhotoScrim}, url(${sidebarBuilding})`,
    backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
    WebkitMaskImage: G2.sidebarPromoPhotoMask, maskImage: G2.sidebarPromoPhotoMask,
    pointerEvents: 'none',
  },
  promoCopy: { position: 'relative', padding: pad(SP2.xl, SP2.lg, SP2.lg) },
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
  promoText: { position: 'relative', fontSize: FS2.sm, lineHeight: LH2.body, color: C2.onDark.textMuted, marginBottom: SP2.xl },
  ctaBtn:    { ...UI2.btn.primary, position: 'relative', width: '100%', minHeight: SZ2.control.lg, borderRadius: R2.pill },
  // Help Center · Sign out — quiet links under the CTA
  footLinks: { position: 'relative', ...UI2.row(SP2.sm), justifyContent: 'space-between', marginTop: SP2.md },
  footLink:  (hovered) => ({
    ...UI2.row(SP2.xs), padding: pad(SP2.xs, SP2.sm), border: 'none', borderRadius: R2.md, cursor: 'pointer',
    background: hovered ? C2.sidebarHover : 'transparent', fontFamily: F2.body, fontSize: FS2.sm,
    color: hovered ? C2.white : C2.sidebarTextMuted, transition: `background ${MOTION2.fast}, color ${MOTION2.fast}`,
  }),
};

function LogoMark() {
  return <img src={brandLogo} alt="" aria-hidden="true" style={S.logoMark} />;
}

export default function NavPM({ activeId = 'my-dashboard' }) {
  const navigate = useNavigate();
  // restore the sidebar's scroll before the browser paints (no visible jump), then make sure the active item is in view
  const navRef = useRef(null);
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    el.scrollTop = savedNavScroll;
    const current = el.querySelector('[aria-current="page"]');
    if (current) {
      const n = el.getBoundingClientRect(), c = current.getBoundingClientRect();
      if (c.top < n.top || c.bottom > n.bottom) current.scrollIntoView({ block: 'nearest' });
    }
  }, []);
  const { hasAccess } = useAuth();
  const [expandedId, setExpandedId] = useState(() => findDefaultExpanded(activeId));
  const [hovered, setHovered] = useState(null);
  const toggle = id => setExpandedId(prev => (prev === id ? null : id));

  const isVisible = (itemId) => {
    const moduleCode = MODULE_MAP[itemId];
    if (!moduleCode) return true;
    return hasAccess(moduleCode);
  };

  const hover = (id) => ({ onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) });

  const renderChildren = (item) => (
    <div style={S.children}>
      {item.subHeader && <div style={S.subHeader}>{item.subHeader}</div>}
      {item.children.map(child => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            type="button"
            style={S.child(active, hovered === child.id)}
            onClick={() => navigate(child.route)}
            aria-current={active ? 'page' : undefined}
            {...hover(child.id)}
          >
            {child.icon && <i className={`ti ${child.icon}`} style={S.childIcon} aria-hidden="true" />}
            {child.label}
          </button>
        );
      })}
    </div>
  );

  const renderGroup = (item) => {
    if (!isVisible(item.id)) return null;
    const open = expandedId === item.id;
    const holdsActive = item.children?.some(c => c.id === activeId);
    return (
      <div key={item.id}>
        <button
          type="button"
          style={S.item(false, open || holdsActive, hovered === item.id)}
          onClick={() => toggle(item.id)}
          aria-expanded={open}
          {...hover(item.id)}
        >
          <i className={`ti ${item.icon}`} style={S.icon} aria-hidden="true" />
          {item.label}
          {item.children && <i className="ti ti-chevron-down" style={S.chevron(open)} aria-hidden="true" />}
        </button>
        {open && item.children && renderChildren(item)}
      </div>
    );
  };

  return (
    <nav ref={navRef} className="un2-scroll-hidden" style={S.nav} aria-label="PM navigation" onScroll={e => { savedNavScroll = e.currentTarget.scrollTop; }}>
      {/* Logo */}
      <div style={S.logo} onClick={() => navigate('/pm-portal/dashboard/my-dashboard')}>
        <LogoMark />
        <div>
          <div style={S.logoName}>UrbanNest</div>
          <div style={S.logoSub}>Estate Management</div>
        </div>
      </div>

      {/* Menu — same groups, sub-pages, routes and permission checks as NavB */}
      {NAV_STRUCTURE.map((group, gIdx) => {
        if (group.type === 'standalone') {
          if (!isVisible(group.id)) return null;
          return <div key={group.id} style={S.list}>{renderGroup(group)}</div>;
        }
        const visibleItems = group.items.filter(item => isVisible(item.id));
        if (visibleItems.length === 0) return null;
        return (
          <React.Fragment key={gIdx}>
            <div style={S.sectionLabel}>{group.label}</div>
            <div style={S.list}>{visibleItems.map(renderGroup)}</div>
          </React.Fragment>
        );
      })}

      {/* Promo + Create Listing — same building photo + frosted panel as the Landlord sidebar */}
      <div style={{ flex: 1, minHeight: SP2.xxl }} />
      <div style={S.promo}>
        <div style={S.promoPhoto} aria-hidden="true" />
        <div style={S.promoCopy}>
          <div style={S.promoGlass} aria-hidden="true" />
          <div style={S.promoTitle}>Manage Your<br />Portfolio Effortlessly</div>
          <div style={S.promoText}>Leases, maintenance, finances and more — all in one place.</div>
          <button type="button" className="un2-btn" style={S.ctaBtn}>
            <i className="ti ti-plus" style={{ fontSize: FS2.md }} aria-hidden="true" />
            Create Listing
          </button>
          <div style={S.footLinks}>
            {[['ti-help-circle', 'Help Center'], ['ti-logout', 'Sign out']].map(([icon, label]) => (
              <button key={label} type="button" style={S.footLink(hovered === label)} {...hover(label)}>
                <i className={`ti ${icon}`} style={{ fontSize: FS2.md }} aria-hidden="true" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
