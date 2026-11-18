import React from 'react';
import { C2, R2, SH2, F2, FS2, FW2, T2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants/v2';

// ─── TopBar (Design System v2) ───────────────────────────────────────────────
// Page title on the left; search, notifications, help and avatar on the right.
//   <TopBar title="UrbanNest Landlord" avatarText="NW" avatarLabel="Profile: Nick" />
// Props:
//   title             string
//   searchPlaceholder string | null   (null hides the search box)
//   onSearch          (value) => void  (optional, fires on Enter)
//   notificationDot   boolean          (red dot on the bell)
//   avatarText        string           (initials)
//   avatarLabel       string           (screen-reader label)
//   actions           node             (extra buttons before the bell)

const S = {
  bar:      { ...UI2.rowBetween(SP2.xl), height: SZ2.topbar, flexShrink: 0, padding: pad(0, LAYOUT2.pageX), background: C2.backgroundGlass, borderBottom: `1px solid ${C2.border}` },
  title:    { ...T2.pageTitle, color: C2.navyDeep, whiteSpace: 'nowrap' },
  search:   { ...UI2.searchField, width: SZ2.search, maxWidth: '36vw' },
  input:    { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: F2.body, fontSize: FS2.base, color: C2.textPrimary },
  kbd:      { fontSize: FS2.xs, fontWeight: FW2.semibold, color: C2.textSecondary, background: C2.surfaceMuted, border: `1px solid ${C2.border}`, borderRadius: R2.sm, padding: pad(SP2.xxs, SP2.sm) },
  bellDot:  { ...UI2.dot(C2.error), position: 'absolute', top: SP2.sm, right: SP2.sm, border: `2px solid ${C2.pageBg}`, boxSizing: 'content-box' },
  avatar:   { ...UI2.avatar(SZ2.icon.md, { soft: C2.navyDeep, fg: C2.white }), cursor: 'pointer', boxShadow: SH2.avatarRing },
};

export default function TopBar({
  title,
  searchPlaceholder = 'Search properties, tenants, leases...',
  onSearch,
  notificationDot = true,
  avatarText = '',
  avatarLabel = 'Profile',
  actions = null,
}) {
  return (
    <header style={S.bar}>
      <div style={S.title}>{title}</div>
      <div style={UI2.row(SP2.md)}>
        {searchPlaceholder !== null && (
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
        )}
        {actions}
        <button style={UI2.btn.icon()} aria-label="Notifications">
          <i className="ti ti-bell" aria-hidden="true" />
          {notificationDot && <span style={S.bellDot} />}
        </button>
        <button style={UI2.btn.icon()} aria-label="Help">
          <i className="ti ti-help-circle" aria-hidden="true" />
        </button>
        <div style={S.avatar} role="img" aria-label={avatarLabel}>{avatarText}</div>
      </div>
    </header>
  );
}
