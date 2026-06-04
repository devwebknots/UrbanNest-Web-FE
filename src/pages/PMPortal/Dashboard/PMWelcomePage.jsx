/**
 * PMWelcomePage.jsx — PM Portal: Welcome / Getting Started
 * ─────────────────────────────────────────────────────────────────────────────
 * Route:   /pm-portal/dashboard/welcome
 * Nav:     Nav B  activeId="my-dashboard"
 * Session: 7 — May 30, 2026
 *
 * Shown when a user has no properties yet.
 * Logic:   Redirect here from App.js (or from PersonaSelect after PM activation)
 *          when GET /api/properties/ returns an empty list.
 *          When properties exist, redirect to /pm-portal/dashboard/my-dashboard.
 *
 * "Preview sample dashboard" → navigates to
 *   /pm-portal/dashboard/my-dashboard?mode=sample
 *   PMDashboard reads ?mode=sample and shows the green SampleBanner.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';

// ─── Tabler Icons CDN ──────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  pageBg:        '#F1F5F9',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  white:         '#FFFFFF',
  neutral:       '#F8FAFC',
  green:         '#16A34A',
  danger:        '#E53E3E',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FCD34D',
  amberText:     '#92400E',
  contextBg:     '#EEF2FF',
  contextBorder: '#C7D2FE',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── JWT decode helper ─────────────────────────────────────────────────────────
function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

// ─── Header — Standard per UrbanNest_DesignSystem.md §8 ───────────────────────
function Header({ userName, userRole }) {
  return (
    <div style={{ height: '60px', flexShrink: 0, background: C.white, borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,3vw,36px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.neutral, borderRadius: '8px', padding: '0 14px', height: '36px', width: '280px' }}>
        <i className="ti ti-search" style={{ fontSize: '14px', color: C.textTertiary }} />
        <input
          type="text"
          placeholder="Search properties, tenants, or help…"
          style={{ background: 'none', border: 'none', outline: 'none', fontFamily: F.body, fontSize: '12px', color: C.textSecondary, width: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <i className="ti ti-bell" style={{ fontSize: '18px', color: C.textSecondary }} />
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '7px', height: '7px', borderRadius: '50%', background: C.danger, border: '1.5px solid ' + C.white }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', borderLeft: '1px solid ' + C.border }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textPrimary }}>{userName}</p>
            <p style={{ margin: 0, fontFamily: F.body, fontSize: '9px', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{userRole}</p>
          </div>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-user" style={{ fontSize: '16px', color: C.white }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PMWelcomePage ─────────────────────────────────────────────────────────────
export default function PMWelcomePage() {
  const navigate  = useNavigate();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Property Director');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetch('http://localhost:8001/api/auth/me/', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUserName(((data.first_name || '') + ' ' + (data.last_name || '')).trim() || data.email || '');
          const roleMap = {
            INDEPENDENT_PM:    'Property Director',
            ORGANIZATIONAL_PM: 'Property Director',
            LANDLORD:          'Landlord',
            RENTER:            'Renter',
          };
          setUserRole(roleMap[data.active_persona] || 'Property Director');
        } else {
          const d = decodeJWT(token);
          if (d) setUserName(((d.first_name || '') + ' ' + (d.last_name || '')).trim() || d.email || '');
        }
      })
      .catch(() => {
        const d = decodeJWT(localStorage.getItem('access_token'));
        if (d) setUserName(d.email || '');
      });
  }, [navigate]);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        @keyframes fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        .welcome-scroll::-webkit-scrollbar { width: 5px; }
        .welcome-scroll::-webkit-scrollbar-track { background: transparent; }
        .welcome-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>

        {/* Nav B */}
        <NavB activeId="my-dashboard" />

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header userName={userName} userRole={userRole} />

          {/* Scrollable content */}
          <div className="welcome-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,4vw,48px) clamp(20px,3vw,48px)' }}>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 480, width: '100%', animation: 'fadein 0.35s ease both' }}>

              {/* Icon ring */}
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#F1F5F9', border: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <i className="ti ti-building-estate" style={{ fontSize: 32, color: C.primary }} />
              </div>

              {/* Heading */}
              <h1 style={{ margin: '0 0 10px', fontFamily: F.headline, fontSize: 'clamp(18px,2vw,22px)', fontWeight: 700, color: C.textPrimary }}>
                Your portfolio is ready — add your first property
              </h1>

              {/* Body */}
              <p style={{ margin: '0 0 28px', fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
                Once you add properties, your dashboard will show occupancy rates, revenue,
                maintenance tasks, and more. It takes about 2 minutes to add your first one.
              </p>

              {/* Primary CTA — "Coming soon" badge floats above-right */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <span style={{
                  position: 'absolute', top: -10, right: -10, zIndex: 1,
                  background: C.amberBg, border: '1px solid ' + C.amberBorder,
                  borderRadius: 20, padding: '2px 10px',
                  fontFamily: F.body, fontSize: 10, fontWeight: 700,
                  color: C.amberText, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                }}>
                  Coming soon
                </span>
                <button
                  onClick={() => navigate('/coming-soon')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.primary, color: C.white, border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
                  onMouseLeave={e => e.currentTarget.style.background = C.primary}
                >
                  <i className="ti ti-plus" style={{ fontSize: 15 }} />
                  Add your first property
                </button>
              </div>

              {/* Secondary actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/coming-soon')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid ' + C.borderMedium, background: C.white, color: C.textSecondary, borderRadius: 8, padding: '8px 18px', fontFamily: F.body, fontSize: 12, cursor: 'pointer', transition: 'border-color 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.borderMedium}
                >
                  <i className="ti ti-user-plus" style={{ fontSize: 14 }} />
                  Invite team members
                </button>
                <button
                  onClick={() => navigate('/coming-soon')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid ' + C.borderMedium, background: C.white, color: C.textSecondary, borderRadius: 8, padding: '8px 18px', fontFamily: F.body, fontSize: 12, cursor: 'pointer', transition: 'border-color 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.borderMedium}
                >
                  <i className="ti ti-route" style={{ fontSize: 14 }} />
                  Take a tour
                </button>
              </div>

              {/* Divider + Sample Dashboard link */}
              <div style={{ width: '100%', borderTop: '1px solid ' + C.border, marginTop: 28, paddingTop: 20 }}>
                <p style={{ margin: '0 0 12px', fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>
                  Curious what your dashboard will look like?
                </p>
                <button
                  onClick={() => navigate({ pathname: '/pm-portal/dashboard/my-dashboard', search: '?mode=sample' })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: C.contextBg,
                    border: '1px solid ' + C.contextBorder,
                    borderRadius: 20,
                    padding: '7px 18px',
                    fontFamily: F.body, fontSize: 12, fontWeight: 600,
                    color: C.primary,
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                  onMouseLeave={e => e.currentTarget.style.background = C.contextBg}
                >
                  <i className="ti ti-layout-dashboard" style={{ fontSize: 14 }} />
                  Preview sample dashboard
                  <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
                </button>
              </div>

            </div>

            {/* Footer */}
            <p style={{ marginTop: 40, fontFamily: F.body, fontSize: 10, color: C.textTertiary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              © 2024 URBANNEST EDITORIAL SYSTEMS. ALL RIGHTS RESERVED.
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
