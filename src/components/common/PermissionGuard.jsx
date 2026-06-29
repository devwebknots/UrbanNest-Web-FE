// ─────────────────────────────────────────────────────────────
// UrbanNest — PermissionGuard
// Wraps routes that require a specific permission module.
// If user has no_access → shows Access Denied screen.
// If permissions still loading → shows nothing (prevents flash).
// ORGANIZATIONAL_PM / INDEPENDENT_PM → always allowed through.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const C = {
  primary:   '#002D5B',
  textGray:  '#64748B',
  bgLight:   '#F8FAFC',
  border:    '#E2E8F0',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

export default function PermissionGuard({ module, children }) {
  const { hasAccess, permissionsLoaded, authLoading } = useAuth();

  // Still bootstrapping — render nothing to prevent flash
  if (authLoading || !permissionsLoaded) {
    return null;
  }

  // Has access — render the page normally
  if (hasAccess(module)) {
    return children;
  }

  // No access — show Access Denied screen
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.bgLight,
      minHeight: '100vh',
      fontFamily: F.body,
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 420,
        padding: '48px 40px',
        background: '#FFFFFF',
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#FEF2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <i className="ti ti-lock" style={{ fontSize: 28, color: '#DC2626' }} />
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: F.headline,
          fontSize: 24, fontWeight: 700,
          color: C.primary,
          margin: '0 0 12px',
        }}>
          Access Restricted
        </h2>

        {/* Message */}
        <p style={{
          fontSize: 14, color: C.textGray,
          lineHeight: 1.7, margin: '0 0 8px',
        }}>
          You don't have permission to access this section.
        </p>
        <p style={{
          fontSize: 13, color: C.textGray,
          lineHeight: 1.6, margin: '0 0 32px',
        }}>
          If you believe this is a mistake, please contact your administrator to update your role permissions.
        </p>

        {/* Module badge */}
        <div style={{
          display: 'inline-block',
          background: '#F1F5F9',
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 11, fontWeight: 700,
          color: C.textGray,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 32,
        }}>
          Module: {module}
        </div>

        {/* Back to dashboard */}
        <div>
          <a href="/pm-portal/dashboard/my-dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: C.primary, color: '#FFFFFF',
            fontFamily: F.body, fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
            padding: '10px 24px', borderRadius: 8,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#003d7a'}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}