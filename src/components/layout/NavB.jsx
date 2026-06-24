/**
 * NavB.jsx — PM Portal Left Navigation (Nav B)
 * Updated: Session 19 — wider nav, larger fonts, py-[22px] item spacing
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const C = {
  primary:      '#002D5B',
  primaryHover: '#003d7a',
  navBg:        '#111827',
  white:        '#FFFFFF',
  activeNavBg:  'rgba(255,255,255,0.10)',
  activeNavBdr: 'rgba(255,255,255,0.15)',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const NAV_STRUCTURE = [
  {
    type: 'standalone', id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard',
    children: [
      { id: 'my-dashboard',      label: 'My Dashboard',     icon: 'ti-home',      route: '/pm-portal/dashboard/my-dashboard' },
      { id: 'portfolio-health',  label: 'Portfolio Health', icon: 'ti-building',  route: '/pm-portal/dashboard/portfolio-health' },
      { id: 'financial-pulse',   label: 'Financial Pulse',  icon: 'ti-cash',      route: '/pm-portal/dashboard/financial-pulse' },
      { id: 'leasing-pipeline',  label: 'Leasing Pipeline', icon: 'ti-file-text', route: '/pm-portal/dashboard/leasing-pipeline' },
      { id: 'maintenance-watch', label: 'Maintenance Watch',icon: 'ti-tool',      route: '/pm-portal/dashboard/maintenance-watch' },
      { id: 'my-team',           label: 'My Team',          icon: 'ti-users',     route: '/pm-portal/dashboard/my-team' },
    ],
  },
  {
    type: 'standalone', id: 'my-profile', label: 'My Profile', icon: 'ti-user-circle',
    children: [
      { id: 'persona',      label: 'Persona',              icon: 'ti-user',        route: '/pm-portal/profile/persona' },
      { id: 'subscription', label: 'Subscription & Trial', icon: 'ti-credit-card', route: '/pm-portal/profile/subscription' },
    ],
  },
  {
    type: 'section', label: 'OPERATIONS',
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
      { id: 'maintenance', label: 'Maintenance', icon: 'ti-tool', subHeader: 'WORK ORDERS',
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
    type: 'section', label: 'PEOPLE',
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
          { id: 'rbac-roles',   label: 'Roles',         route: '/pm-portal/rbac/roles' },
          { id: 'rbac-assign',  label: 'Assign Role',   route: '/pm-portal/rbac/assign' },
          { id: 'rbac-members', label: 'Team Members',  route: '/pm-portal/rbac/members' },
          { id: 'rbac-org',     label: 'Organisation',  route: '/pm-portal/rbac/org' },
        ],
      },
    ],
  },
  {
    type: 'section', label: 'MONEY',
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
    type: 'section', label: 'GROWTH',
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
    type: 'section', label: 'ADMIN',
    items: [
      { id: 'configuration', label: 'Configuration', icon: 'ti-adjustments',
        children: [
          { id: 'screening-rules',    label: 'Screening Rules',    route: '/pm-portal/config/screening' },
          { id: 'financial-settings', label: 'Financial Settings', route: '/pm-portal/config/financial' },
          { id: 'lease-rent',         label: 'Lease & Rent',       route: '/pm-portal/config/lease' },
          { id: 'verification-settings', label: 'Verification Settings', route: '/pm-portal/config/verification-settings' },
          { id: 'partners',           label: 'Partners',           route: '/pm-portal/config/partners' },
          { id: 'communication',      label: 'Communication',      route: '/pm-portal/config/communication' },
          { id: 'data-ai',            label: 'Data & AI',          route: '/pm-portal/config/data-ai' },
        ],
      },
      { id: 'account-settings', label: 'Account Settings', icon: 'ti-settings',
        children: [
          { id: 'profile-billing', label: 'Profile & Billing',  route: '/pm-portal/account/billing' },
          { id: 'modules',         label: 'Modules & Features', route: '/pm-portal/account/modules' },
          { id: 'integrations',    label: 'Integrations',       route: '/pm-portal/account/integrations' },
        ],
      },
    ],
  },
  {
    type: 'section', label: 'SUPPORT',
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
    if (group.type === 'standalone') {
      if (group.children?.some(c => c.id === activeId)) return group.id;
    }
    if (group.type === 'section') {
      for (const item of group.items || []) {
        if (item.children?.some(c => c.id === activeId)) return item.id;
      }
    }
  }
  return 'dashboard';
}

export default function NavB({ activeId = 'my-dashboard' }) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(() => findDefaultExpanded(activeId));
  const toggle = id => setExpandedId(prev => prev === id ? null : id);

  const renderChildren = (children, subHeader) => (
    <div style={{
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      marginLeft: '20px',        // ← slightly more indent
      marginTop: '2px',
      paddingBottom: '4px',
    }}>
      {subHeader && (
        <div style={{
          padding: '8px 10px 4px',
          fontFamily: F.body, fontSize: '10px', fontWeight: 700,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {subHeader}
        </div>
      )}
      {children.map(child => {
        const isActive = child.id === activeId;
        return (
          <div key={child.id} onClick={() => navigate(child.route)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              // ── FIX 1: py-[22px] = 11px top+bottom ──
              padding: '9px 10px',
              margin: '1px 6px 1px 0',
              borderRadius: '5px', cursor: 'pointer',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            {child.icon && (
              <i className={`ti ${child.icon}`} style={{
                // ── FIX 1: larger icon ──
                fontSize: '14px',
                color: isActive ? C.white : 'rgba(255,255,255,0.5)',
                flexShrink: 0,
              }} />
            )}
            <span style={{
              fontFamily: F.body,
              // ── FIX 1: larger font ──
              fontSize: '13.5px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? C.white : 'rgba(255,255,255,0.65)',
              lineHeight: 1.3,
            }}>
              {child.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderL1 = (item, isStandalone = false) => {
    const isExpanded = expandedId === item.id;
    const hasActive  = item.children?.some(c => c.id === activeId);
    return (
      <div key={item.id}>
        <div onClick={() => toggle(item.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            // ── FIX 1: py-[22px] = 11px each side ──
            padding: '11px 14px',
            margin: isStandalone ? '2px 8px' : '1px 8px',
            borderRadius: '6px', cursor: 'pointer',
            background: isExpanded || hasActive ? C.activeNavBg : 'transparent',
            border: `1px solid ${isExpanded || hasActive ? C.activeNavBdr : 'transparent'}`,
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { if (!isExpanded && !hasActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { if (!isExpanded && !hasActive) e.currentTarget.style.background = 'transparent'; }}
        >
          <i className={`ti ${item.icon}`} style={{
            // ── FIX 1: larger icon ──
            fontSize: '17px',
            color: isExpanded || hasActive ? C.white : 'rgba(255,255,255,0.6)',
            flexShrink: 0,
          }} />
          <span style={{
            flex: 1,
            fontFamily: F.body,
            // ── FIX 1: larger font ──
            fontSize: '14px',
            fontWeight: isExpanded || hasActive ? 600 : 500,
            color: isExpanded || hasActive ? C.white : 'rgba(255,255,255,0.75)',
          }}>
            {item.label}
          </span>
          {item.children && (
            <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-chevron-down'}`}
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }} />
          )}
        </div>
        {isExpanded && item.children && renderChildren(item.children, item.subHeader)}
      </div>
    );
  };

  return (
    // ── FIX 1: wider nav — 220px ──
    <div style={{
      width: '220px', minWidth: '220px', flexShrink: 0,
      background: C.navBg,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto', scrollbarWidth: 'none',
    }}>
      {/* Logo */}
      <div style={{
        // ── FIX 1: taller logo area ──
        height: '68px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '0 18px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, background: C.navBg, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-layout-grid" style={{ fontSize: '15px', color: C.white }} />
          </div>
          <span style={{
            fontFamily: F.headline, fontSize: '16px',
            fontWeight: 700, color: C.white,
          }}>UrbanNest</span>
        </div>
        <span style={{
          fontFamily: F.body, fontSize: '9px', fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          marginTop: '3px', paddingLeft: '37px',
        }}>
          Editorial Admin
        </span>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, paddingTop: '10px', paddingBottom: '10px' }}>
        {NAV_STRUCTURE.map((group, gIdx) => {
          if (group.type === 'standalone') {
            return <div key={group.id} style={{ marginBottom: '2px' }}>{renderL1(group, true)}</div>;
          }
          if (group.type === 'section') {
            return (
              <div key={gIdx} style={{ marginTop: '14px' }}>
                <div style={{
                  // ── FIX 1: section label slightly larger + more padding ──
                  padding: '0 20px 5px',
                  fontFamily: F.body, fontSize: '10px', fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {group.label}
                </div>
                {group.items.map(item => renderL1(item))}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Create Listing CTA */}
      <div style={{ flexShrink: 0, padding: '12px 14px 0' }}>
        <div style={{
          background: C.primary, borderRadius: '8px',
          padding: '11px 14px',
          display: 'flex', alignItems: 'center', gap: '9px',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-plus" style={{ fontSize: '12px', color: C.white }} />
          </div>
          <span style={{
            fontFamily: F.body, fontSize: '13px',
            fontWeight: 600, color: C.white,
          }}>Create Listing</span>
        </div>
      </div>

      {/* Bottom links */}
      <div style={{
        flexShrink: 0, padding: '14px 18px 22px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        marginTop: '12px',
        position: 'sticky', bottom: 0, background: C.navBg,
      }}>
        {[['ti-help-circle', 'Help Center'], ['ti-logout', 'Sign out']].map(([icon, label]) => (
          <div key={label}
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              marginBottom: '12px', cursor: 'pointer',
              padding: '5px 4px', borderRadius: '4px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className={`ti ${icon}`} style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)' }} />
            <span style={{
              fontFamily: F.body, fontSize: '13px',
              color: 'rgba(255,255,255,0.35)',
            }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
