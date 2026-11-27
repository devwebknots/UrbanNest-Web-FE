import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NavPM from './NavPM';
import { C2, TONES2, R2, SH2, F2, FS2, FW2, T2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants';

// ─── PMPageShell + PMTopBar2 (Design System v2) ──────────────────────────────
// The page frame for redesigned PM Portal screens — the PM twin of PageShell (Landlord):
//   NavPM sidebar │ PM top bar (search · bell │ name + persona · avatar)
//                 │ scrolling content — same page padding, section gaps, backdrop + animate behaviour as PageShell
//
//   <PMPageShell activeId="approvals-overview" animate backdrop={<ImageBackdrop image={art} />}>
//     <Breadcrumb … />  …sections…  <PageFooter />
//   </PMPageShell>
//
// VERSION 2 — the v1 equivalents are NavB.jsx + PMTopBar.jsx (older PM screens). The top bar reads the
// signed-in user from AuthContext (same name / persona labels as PMTopBar) — no props needed.
// Props: activeId (→ NavPM) · animate · backdrop · searchPlaceholder · onSearch · notificationDot · children
//        contained (opt-in) — the page itself does NOT scroll: content fills the viewport and the screen scrolls its own
//        panel (give that panel flex: 1 + minHeight: 0 + overflowY: auto). PM My Profile = the v1 layout: header +
//        step list stay put, only the form column scrolls.

const PERSONA_LABELS = {
  ORGANIZATIONAL_PM: 'Org PMS Admin',
  INDEPENDENT_PM:    'Independent PM',
  PM_STAFF:          'PM Staff',
  UN_ADMIN:          'UN Admin',
  RENTER:            'Renter',
  LANDLORD:          'Landlord',
  TENANT:            'Tenant',
};

const S = {
  shell:   { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: F2.body, background: C2.pageBg, color: C2.textPrimary },
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative' },
  content: { flex: 1, overflowY: 'auto', padding: pad(LAYOUT2.pageTop, LAYOUT2.pageX, LAYOUT2.pageBottom) },
  contained: { overflowY: 'hidden', paddingBottom: 0 },
  withBackdrop: { position: 'relative', zIndex: 0, paddingTop: SZ2.topbar + LAYOUT2.pageTop },
  // top bar — same glass bar as TopBar (Landlord)
  bar:     { ...UI2.rowBetween(SP2.xl), height: SZ2.topbar, flexShrink: 0, padding: pad(0, LAYOUT2.pageX), background: C2.backgroundGlass,
             borderBottomWidth: SZ2.hairline, borderBottomStyle: 'solid', borderBottomColor: C2.border },
  overlay: (solid) => ({ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, transition: 'background 0.2s ease, border-color 0.2s ease',
             background: solid ? C2.backgroundGlass : 'transparent', borderBottomColor: solid ? C2.border : 'transparent' }),
  search:  { ...UI2.searchField, width: SZ2.search, maxWidth: '40vw' },
  input:   UI2.searchInput,
  kbd:     { fontSize: FS2.xs, fontWeight: FW2.semibold, color: C2.textSecondary, background: C2.surfaceMuted, border: `1px solid ${C2.border}`, borderRadius: R2.sm, padding: pad(SP2.xxs, SP2.sm) },
  bellDot: { ...UI2.statusDot(TONES2.error), position: 'absolute', top: SP2.sm, right: SP2.sm, border: `2px solid ${C2.pageBg}`, boxSizing: 'content-box' },
  sep:     { width: SZ2.hairline, height: SZ2.icon.sm, background: C2.border },
  user:    { ...UI2.row(SP2.md), cursor: 'pointer' },
  who:     { textAlign: 'right', minWidth: 0 },
  name:    { ...UI2.text.titleLg, ...UI2.truncate },
  persona: { ...T2.eyebrow, color: C2.textSecondary, marginTop: SP2.xxs },
  avatar:  { ...UI2.avatar(SZ2.icon.md, { soft: C2.navyDeep, fg: C2.white }), boxShadow: SH2.avatarRing },
  chevron: { fontSize: FS2.md, color: C2.textSecondary },
};

export function PMTopBar2({ searchPlaceholder = 'Search properties, applications, tenants...', onSearch, notificationDot = true, overlay = false, solid = false }) {
  const { user } = useAuth();
  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '—';
  const persona = user ? PERSONA_LABELS[user.active_persona] || user.active_persona || 'PM Portal' : 'PM Portal';
  const initials = (fullName || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header style={overlay ? { ...S.bar, ...S.overlay(solid) } : S.bar}>
      {searchPlaceholder !== null ? (
        <label className="un2-focus-ring un2-hide-md" style={S.search}>
          <i className="ti ti-search" style={{ fontSize: FS2.xl, color: C2.textSecondary }} aria-hidden="true" />
          <input
            style={S.input}
            type="search"
            placeholder={searchPlaceholder}
            aria-label="Search"
            onKeyDown={e => { if (e.key === 'Enter' && onSearch) onSearch(e.currentTarget.value); }}
          />
          <span style={S.kbd}>⌘K</span>
        </label>
      ) : <span />}
      <div style={UI2.row(SP2.lg)}>
        <button type="button" style={UI2.btn.icon()} aria-label="Notifications">
          <i className="ti ti-bell" aria-hidden="true" />
          {notificationDot && <span style={S.bellDot} />}
        </button>
        <span style={S.sep} aria-hidden="true" />
        <div style={S.user} aria-label={`Profile: ${fullName}`}>
          <div style={S.who}>
            <div style={S.name}>{fullName}</div>
            <div style={S.persona}>{persona}</div>
          </div>
          <div style={S.avatar} aria-hidden="true">{initials}</div>
          <i className="ti ti-chevron-down" style={S.chevron} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

export default function PMPageShell({ activeId, animate = false, backdrop, contained = false, children, ...topBarProps }) {
  const [scrolled, setScrolled] = useState(false);
  const floating = !!backdrop;
  const onScroll = floating
    ? e => { const s = e.currentTarget.scrollTop > 0; if (s !== scrolled) setScrolled(s); }
    : undefined;
  return (
    <div style={S.shell}>
      <NavPM activeId={activeId} />
      <div style={S.main}>
        <PMTopBar2 {...topBarProps} overlay={floating} solid={scrolled} />
        <main className={animate ? 'un2-stack-sections un2-enter-stagger' : 'un2-stack-sections'} style={{ ...S.content, ...(backdrop ? S.withBackdrop : {}), ...(contained ? S.contained : {}) }} onScroll={onScroll}>
          {backdrop}
          {children}
        </main>
      </div>
    </div>
  );
}
