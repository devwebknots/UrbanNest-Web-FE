/**
 * NavE.jsx — UN Admin Portal Left Navigation (Nav E)
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared component used by ALL UN Admin Portal screens.
 * Source of truth: UrbanNest_LeftNav.md — Nav E section
 *
 * Usage:
 *   import NavE from '../../components/layout/NavE';
 *   <NavE activeId="services-catalog" />
 *
 * activeId reference:
 *   dashboard                    → /admin-portal/dashboard
 *   operations-verifications     → /admin-portal/operations/verifications
 *   operations-applications      → /admin-portal/operations/applications
 *   operations-license-review    → /admin-portal/operations/license-review
 *   indpm-insight                → /admin-portal/independent-pm/insight
 *   indpm-registry               → /admin-portal/independent-pm/registry
 *   indpm-health                 → /admin-portal/independent-pm/health
 *   orgpms-insight               → /admin-portal/org-pms/insight
 *   orgpms-registry              → /admin-portal/org-pms/registry
 *   orgpms-status-tiers          → /admin-portal/org-pms/status-tiers
 *   landlord-insight             → /admin-portal/landlord/insight
 *   landlord-registry            → /admin-portal/landlord/registry
 *   landlord-health              → /admin-portal/landlord/health
 *   services-catalog             → /admin-portal/services/catalog
 *   services-availability        → /admin-portal/services/availability
 *   services-performance         → /admin-portal/services/performance
 *   services-maintenance         → /admin-portal/services/maintenance
 *   advertise-inventory          → /admin-portal/advertise/inventory
 *   advertise-advertisers        → /admin-portal/advertise/advertisers
 *   advertise-performance        → /admin-portal/advertise/performance
 *   config-screening             → /admin-portal/config/screening
 *   config-plans                 → /admin-portal/config/plans
 *   config-emails                → /admin-portal/config/emails
 *   config-reference             → /admin-portal/config/reference
 *   config-rules                 → /admin-portal/config/rules
 *
 * Design specs:
 *   Width: 220px fixed
 *   Background: #111827
 *   Default expanded: Operations only
 *   Auto-expand: parent section of active item
 *   Collapse animation: max-height 0.2s ease
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Tabler Icons CDN ──────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:      '#002D5B',
  primaryHover: '#003d7a',
  navBg:        '#111827',
  white:        '#FFFFFF',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── Nav E Structure — single source of truth ─────────────────────────────────
// To add/remove/rename items: edit NAV_SECTIONS below only.
// type 'standalone' = top-level single item (Dashboard)
// type 'section'    = collapsible group with L2 children
const NAV_SECTIONS = [
  {
    type: 'standalone',
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'ti-layout-dashboard',
    route: '/admin-portal/dashboard',
  },
  {
    type: 'section',
    id: 'operations',
    label: 'OPERATIONS',
    icon: 'ti-activity',
    children: [
      { id: 'operations-verifications',  label: 'Verifications',  route: '/admin-portal/operations/verifications' },
      { id: 'operations-applications',   label: 'Applications',   route: '/admin-portal/operations/applications' },
      { id: 'operations-license-review', label: 'License Review', route: '/admin-portal/operations/license-review' },
      { id: 'operations-support',        label: 'Support Tickets',route: '/admin-portal/operations/support' },
    ],
  },
  {
    type: 'section',
    id: 'independent-pm',
    label: 'INDEPENDENT PM',
    icon: 'ti-briefcase',
    children: [
      { id: 'indpm-insight',  label: '360 Insight',      route: '/admin-portal/independent-pm/insight' },
      { id: 'indpm-registry', label: 'PM Registry',      route: '/admin-portal/independent-pm/registry' },
      { id: 'indpm-health',   label: 'Health & Activity', route: '/admin-portal/independent-pm/health' },
    ],
  },
  {
    type: 'section',
    id: 'org-pms',
    label: 'ORGANIZATIONAL PMS',
    icon: 'ti-building-skyscraper',
    children: [
      { id: 'orgpms-insight',       label: '360 Insight',  route: '/admin-portal/org-pms/insight' },
      { id: 'orgpms-registry',      label: 'PMS Registry', route: '/admin-portal/org-pms/registry' },
      { id: 'orgpms-status-tiers',  label: 'Status & Tiers', route: '/admin-portal/org-pms/status-tiers' },
    ],
  },
  {
    type: 'section',
    id: 'landlord',
    label: 'LANDLORD',
    icon: 'ti-building',
    children: [
      { id: 'landlord-insight',  label: '360 Insight',       route: '/admin-portal/landlord/insight' },
      { id: 'landlord-registry', label: 'Landlord Registry', route: '/admin-portal/landlord/registry' },
      { id: 'landlord-health',   label: 'Health & Activity', route: '/admin-portal/landlord/health' },
    ],
  },
  {
    type: 'section',
    id: 'services',
    label: 'SERVICES',
    icon: 'ti-apps',
    children: [
      { id: 'services-catalog',      label: 'Catalog',      route: '/admin-portal/services/catalog' },
      { id: 'services-availability', label: 'Availability', route: '/admin-portal/services/availability' },
      { id: 'services-performance',  label: 'Performance',  route: '/admin-portal/services/performance' },
      { id: 'services-maintenance',  label: 'Maintenance',  route: '/admin-portal/services/maintenance' },
    ],
  },
  {
    type: 'section',
    id: 'advertise',
    label: 'ADVERTISE & MONETISE',
    icon: 'ti-speakerphone',
    children: [
      { id: 'advertise-inventory',   label: 'Ad Inventory',    route: '/admin-portal/advertise/inventory' },
      { id: 'advertise-advertisers', label: 'Advertisers',     route: '/admin-portal/advertise/advertisers' },
      { id: 'advertise-performance', label: 'Ad Performance',  route: '/admin-portal/advertise/performance' },
    ],
  },
  {
    type: 'section',
    id: 'configurations',
    label: 'CONFIGURATIONS',
    icon: 'ti-settings',
    children: [
      { id: 'config-screening',  label: 'Screening Config', route: '/admin-portal/config/screening' },
      { id: 'config-plans',      label: 'Plan & Billing',   route: '/admin-portal/config/plans' },
      { id: 'config-onboard-docs', label: 'Onboard Docs', route: '/admin-portal/config/onboard-docs' },
      { id: 'config-emails',     label: 'Email Templates',  route: '/admin-portal/config/emails' },
      { id: 'config-reference',  label: 'Reference Data',   route: '/admin-portal/config/reference' },
      { id: 'config-rules',      label: 'Business Rules',   route: '/admin-portal/config/rules' },
    ],
  },
];

// ─── Helper: find which section contains the active item ──────────────────────
function findActiveSection(activeId) {
  for (const section of NAV_SECTIONS) {
    if (section.type === 'standalone' && section.id === activeId) return null;
    if (section.type === 'section') {
      if (section.children?.some(c => c.id === activeId)) return section.id;
    }
  }
  return 'operations'; // default expanded section
}

// ─── NavE Component ────────────────────────────────────────────────────────────
export default function NavE({ activeId = 'dashboard' }) {
  const navigate = useNavigate();

  // Default: Operations expanded. Auto-expand if active item is in another section.
  const defaultExpanded = () => {
    const activeSection = findActiveSection(activeId);
    // Always include 'operations' as default + auto-expand active section
    const expanded = new Set(['operations']);
    if (activeSection) expanded.add(activeSection);
    return expanded;
  };

  const [expandedSections, setExpandedSections] = useState(defaultExpanded);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // ─── Render standalone item (Dashboard) ────────────────────────────────────
  const renderStandalone = (item) => {
    const isActive = activeId === item.id;
    return (
      <div
        key={item.id}
        onClick={() => navigate(item.route)}
        style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '9px 14px', margin: '2px 8px', borderRadius: '6px',
          cursor: 'pointer',
          background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
          borderLeft: isActive ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
          transition: 'all 0.12s',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        <i className={`ti ${item.icon}`} style={{ fontSize: '15px', color: isActive ? C.white : 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
        <span style={{ fontFamily: F.body, fontSize: '12px', fontWeight: isActive ? 600 : 500, color: isActive ? C.white : 'rgba(255,255,255,0.6)' }}>
          {item.label}
        </span>
      </div>
    );
  };

  // ─── Render collapsible section ─────────────────────────────────────────────
  const renderSection = (section) => {
    const isExpanded = expandedSections.has(section.id);
    const hasActive  = section.children?.some(c => c.id === activeId);

    return (
      <div key={section.id} style={{ marginTop: '4px' }}>

        {/* Section header — clickable, toggles expand/collapse */}
        <div
          onClick={() => toggleSection(section.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 14px 7px 16px', cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Section label */}
          <span style={{
            flex: 1,
            fontFamily: F.body, fontSize: '9px', fontWeight: 700,
            color: hasActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {section.label}
          </span>
          {/* Chevron — rotates on expand/collapse */}
          <i
            className="ti ti-chevron-down"
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>

        {/* Children — animated expand/collapse via max-height */}
        <div style={{
          overflow: 'hidden',
          maxHeight: isExpanded ? `${section.children.length * 40}px` : '0px',
          transition: 'max-height 0.2s ease',
        }}>
          {section.children.map(child => {
            const isActive = child.id === activeId;
            return (
              <div
                key={child.id}
                onClick={() => navigate(child.route)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '7px 14px 7px 28px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                  borderLeft: isActive ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{
                  fontFamily: F.body, fontSize: '11px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? C.white : 'rgba(255,255,255,0.5)',
                  lineHeight: 1.3,
                }}>
                  {child.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '220px', minWidth: '220px', flexShrink: 0,
      background: C.navBg,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto',
      scrollbarWidth: 'none',
    }}>
      <style>{`
        .nave-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Logo — sticky ──────────────────────────────────────────────────── */}
      <div style={{
        height: '60px', flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, background: C.navBg, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-shield-lock" style={{ fontSize: '14px', color: C.white }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: '14px', fontWeight: 700, color: C.white }}>UrbanNest</span>
        </div>
        <span style={{
          fontFamily: F.body, fontSize: '8.5px', fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          marginTop: '2px', paddingLeft: '34px',
        }}>
          UN ADMIN
        </span>
      </div>

      {/* ── Nav items ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, paddingTop: '8px', paddingBottom: '8px' }}>
        {NAV_SECTIONS.map(section =>
          section.type === 'standalone'
            ? renderStandalone(section)
            : renderSection(section)
        )}
      </div>

      {/* ── Bottom links — sticky ───────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, padding: '12px 16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', bottom: 0, background: C.navBg,
      }}>
        {[
          { icon: 'ti-settings',  label: 'Settings',   route: '/admin-portal/settings' },
          { icon: 'ti-help-circle', label: 'Support',  route: '/admin-portal/support' },
          { icon: 'ti-logout',    label: 'Sign out',   route: '/' },
        ].map(({ icon, label, route }) => (
          <div
            key={label}
            onClick={() => {
              if (label === 'Sign out') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
              }
              navigate(route);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '8px', cursor: 'pointer',
              padding: '5px 6px', borderRadius: '4px',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className={`ti ${icon}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }} />
            <span style={{ fontFamily: F.body, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
