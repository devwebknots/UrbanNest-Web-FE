/**
 * UNAdminShell.jsx — UN Admin Portal Shell
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrapper for ALL UN Admin Portal screens.
 * Provides: NavE + fixed Header + scrollable content area
 * Route guard: redirects to / if no access_token or persona !== UN_ADMIN
 *
 * Usage:
 *   <UNAdminShell activeId="services-catalog" title="Service Catalog">
 *     <YourScreenContent />
 *   </UNAdminShell>
 *
 * Layout (3-column per design system spec):
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  HEADER (60px fixed)                                    │
 *   ├──────────┬──────────────────────────────────────────────┤
 *   │  NavE    │  CONTENT (scrollable)                        │
 *   │  220px   │  flex:1                                      │
 *   └──────────┴──────────────────────────────────────────────┘
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavE from '../../components/layout/NavE';

// ─── Tabler Icons CDN ──────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const API_BASE = 'http://localhost:8001';

const C = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  navBg:         '#111827',
  pageBg:        '#F8FAFC',
  border:        '#E2E8F0',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  white:         '#FFFFFF',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

export default function UNAdminShell({ activeId = 'dashboard', title, children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/'); return; }

    // Route guard — verify UN_ADMIN persona
    fetch(`${API_BASE}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        const personas = Array.isArray(data.personas)
          ? data.personas.map(p => (typeof p === 'string' ? p : p.persona))
          : [];
        if (!personas.includes('UN_ADMIN') && data.active_persona !== 'UN_ADMIN') {
          // Not a UN Admin — redirect to persona select
          navigate('/persona-select');
          return;
        }
        setUser(data);
      })
      .catch(() => navigate('/'));
  }, [navigate]);

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin'
    : 'Admin';

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg }}>

      {/* ── NavE — fixed left ─────────────────────────────────────────────── */}
      <NavE activeId={activeId} />

      {/* ── Right side: header + content ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header (60px fixed) ───────────────────────────────────────── */}
        <div style={{
          height: '60px', flexShrink: 0,
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: '16px',
        }}>
          {/* Search bar */}
          <div style={{
            width: '280px', height: '34px',
            background: '#F8FAFC',
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0 12px',
          }}>
            <i className="ti ti-search" style={{ fontSize: '13px', color: '#94A3B8' }} />
            <span style={{ fontFamily: F.body, fontSize: '12px', color: '#94A3B8' }}>Search...</span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bell */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: C.white,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = C.white}
          >
            <i className="ti ti-bell" style={{ fontSize: '15px', color: C.textSecondary }} />
          </div>

          {/* User info + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: F.body, fontSize: '12px', fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>
                {displayName}
              </div>
              <div style={{ fontFamily: F.body, fontSize: '10px', color: C.textSecondary, lineHeight: 1.3 }}>
                Lead Administrator
              </div>
            </div>
            {/* Avatar */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}>
              <i className="ti ti-user" style={{ fontSize: '15px', color: C.white }} />
            </div>
          </div>
        </div>

        {/* ── Scrollable content area ───────────────────────────────────── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(16px, 2vw, 24px) clamp(20px, 3vw, 48px)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
