/**
 * Header.jsx — PM Portal Shared Header
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracted from PMDashboard.jsx — shared across all PM Portal pages.
 *
 * Usage:
 *   import Header from '../../../components/layout/Header';
 *   <Header userName={userName} userRole={userRole} />
 *
 * Props:
 *   userName  — string — e.g. "Marcus Vane"
 *   userRole  — string — e.g. "Independent PM"
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

const C = {
  primary:       '#002D5B',
  white:         '#FFFFFF',
  border:        '#E2E8F0',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  neutral:       '#F8FAFC',
  danger:        '#E53E3E',
};
const F = {
  body: "'Nunito Sans', sans-serif",
};

export default function Header({ userName = '', userRole = '' }) {
  return (
    <div style={{
      height: '60px',
      flexShrink: 0,
      background: C.white,
      borderBottom: '1px solid ' + C.border,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(20px, 3vw, 36px)',
    }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: C.neutral, borderRadius: '8px',
        padding: '0 14px', height: '36px', width: '280px',
      }}>
        <i className="ti ti-search" style={{ fontSize: '14px', color: C.textTertiary }} />
        <input
          type="text"
          placeholder="Search properties, tenants, or help…"
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontFamily: F.body, fontSize: '12px',
            color: C.textSecondary, width: '100%',
          }}
        />
      </div>

      {/* Right side — bell + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <i className="ti ti-bell" style={{ fontSize: '18px', color: C.textSecondary }} />
          <div style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: C.danger, border: '1.5px solid ' + C.white,
          }} />
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          paddingLeft: '12px', borderLeft: '1px solid ' + C.border,
        }}>
          {/* Name + role */}
          <div style={{ textAlign: 'right' }}>
            <p style={{
              margin: 0, fontFamily: F.body, fontSize: '13px',
              fontWeight: 600, color: C.textPrimary,
            }}>
              {userName}
            </p>
            <p style={{
              margin: 0, fontFamily: F.body, fontSize: '9px',
              color: C.textTertiary, textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {userRole}
            </p>
          </div>
          {/* Avatar */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: C.primary, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-user" style={{ fontSize: '16px', color: C.white }} />
          </div>
        </div>
      </div>
    </div>
  );
}
