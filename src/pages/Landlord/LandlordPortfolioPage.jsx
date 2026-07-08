import React, { useState, useEffect } from 'react';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Design tokens (matches LandlordDashboard exactly) ───────────────────────

// ─── Nav config (identical to Dashboard) ─────────────────────────────────────
const NAV_MAIN = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'ti-layout-dashboard', route: '/landlord-portal/dashboard' },
  { id: 'properties',  label: 'Properties',  icon: 'ti-building',         route: '/landlord-portal/portfolio' },
  { id: 'leases',      label: 'Leases',      icon: 'ti-file-text',        route: '/landlord-portal/leases' },
  { id: 'finances',    label: 'Finances',    icon: 'ti-wallet',           route: '/landlord-portal/finances' },
  { id: 'maintenance', label: 'Maintenance', icon: 'ti-tool',             route: '/landlord-portal/maintenance' },
  { id: 'tenants',     label: 'Tenants',     icon: 'ti-users',            route: '/landlord-portal/tenants' },
  { id: 'documents',   label: 'Documents',   icon: 'ti-folder',           route: '/landlord-portal/documents' },
];
const NAV_BOTTOM = [
  { id: 'reports',   label: 'Reports',   icon: 'ti-chart-bar' },
  { id: 'analytics', label: 'Analytics', icon: 'ti-chart-line' },
  { id: 'insights',  label: 'Insights',  icon: 'ti-bulb' },
  { id: 'settings',  label: 'Settings',  icon: 'ti-settings' },
];

// ─── Property type label map ──────────────────────────────────────────────────
const PROP_TYPE_LABEL = {
  APARTMENT_COMPLEX:  'Apartment',
  INDIVIDUAL_HOUSE:   'House',
  MULTI_FAMILY:       'Multi-Family',
  CONDOMINIUM:        'Condominium',
  TOWNHOME:           'Townhome',
  STUDENT_HOUSING:    'Student Housing',
  VILLA:              'Villa',
  SERVICED_APARTMENT: 'Serviced Apt',
  COMMERCIAL:         'Commercial',
  MIXED_USE:          'Mixed Use',
};

// ─── Rent status badge config ─────────────────────────────────────────────────
const RENT_BADGE = {
  PAID:    { bg: C.greenLight, col: C.greenDark, label: 'PAID' },
  PENDING: { bg: C.amberLight, col: C.amber,     label: 'PENDING' },
  OVERDUE: { bg: C.redLight,   col: C.red,        label: 'OVERDUE' },
};

const fmtCurrency = n =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const initials = name =>
  (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  shell:    { display: 'flex', height: '100vh', fontFamily: F.sans, background: C.pageBg, overflow: 'hidden' },
  nav:      { width: 164, minWidth: 164, background: C.navBg, display: 'flex', flexDirection: 'column', flexShrink: 0 },
  navLogo:  { padding: '20px 16px 14px', color: '#fff', fontSize: 15, fontWeight: 700 },
  navSub:   { display: 'block', fontSize: 9, color: '#3d6a9a', fontWeight: 400, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  navItem: a => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
    color: a ? C.navActive : C.navText, fontSize: 12.5, fontWeight: a ? 500 : 400,
    cursor: 'pointer', userSelect: 'none',
    borderLeft: a ? `3px solid ${C.navBorder}` : '3px solid transparent',
    background: a ? 'rgba(255,255,255,0.07)' : 'transparent',
  }),
  navIcon:  { fontSize: 15, width: 16, flexShrink: 0 },
  navBottom:{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.07)' },
  navAdd:   { margin: '10px 12px 4px', background: C.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', width: 'calc(100% - 24px)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontFamily: F.sans },
  main:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:   { background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  topTitle: { fontSize: 14, fontWeight: 600, color: C.txtPrimary },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn:  { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtSec, cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 16 },
  avatar:   { width: 32, height: 32, borderRadius: '50%', background: C.navBg, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  content:  { flex: 1, overflowY: 'auto', padding: '20px 24px 32px' },

  // PAGE HEADING ROW
  pageHdrRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle:  { fontSize: 22, fontWeight: 700, color: C.txtPrimary, letterSpacing: -0.3 },
  pageSub:    { fontSize: 12, color: C.txtMuted, marginTop: 2 },
  ownerBadge: { display: 'flex', alignItems: 'center', gap: 6, background: '#0d3320', color: '#4ecba0', fontSize: 11.5, fontWeight: 600, padding: '5px 12px', borderRadius: 20, letterSpacing: 0.3 },
  ownerDot:   { width: 7, height: 7, borderRadius: '50%', background: '#4ecba0' },

  // SUMMARY BAR
  summaryBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 },
  summaryCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '14px 18px' },
  summaryLabel: { fontSize: 10, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 5 },
  summaryVal:   { fontSize: 22, fontWeight: 700, color: C.txtPrimary, lineHeight: 1, letterSpacing: -0.3 },
  summarySub:   { fontSize: 11, color: C.txtSec, marginTop: 3 },

  // FILTER BAR
  filterBar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 7, padding: '7px 12px', fontSize: 12.5, color: C.txtPrimary },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: C.txtPrimary, flex: 1, fontFamily: F.sans },
  filterChip: active => ({
    padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: F.sans,
    background: active ? C.navBg : C.cardBg,
    color:      active ? '#fff'   : C.txtSec,
    border:     active ? 'none'   : `1px solid ${C.cardBdr}`,
  }),

  // PROPERTY GRID
  propGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 0.9fr))', gap: 16, marginBottom: 28 },
  propCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  propImgWrap: { position: 'relative', height: 160, background: '#d1d9e8', overflow: 'hidden' },
  propImg: { width: '100%', height: '100%', objectFit: 'cover' },
  propImgFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a2d4a 0%, #0d1b2e 100%)' },
  propTypeBadge: { position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  propBody: { padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' },
  propName: { fontSize: 15, fontWeight: 700, color: C.txtPrimary, marginBottom: 3, letterSpacing: -0.2 },
  propAddr: { fontSize: 11, color: C.txtMuted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 },
  propOwnerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fb', borderRadius: 6, padding: '7px 10px', marginBottom: 10 },
  propOwnerLbl: { fontSize: 9.5, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 1 },
  propOwnerVal: { fontSize: 12, fontWeight: 600, color: C.txtPrimary },
  propShareLbl: { fontSize: 9.5, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 1, textAlign: 'right' },
  propShareVal: { fontSize: 13, fontWeight: 700, color: C.blue, textAlign: 'right' },
  propStatsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  propStatItem: { display: 'flex', flexDirection: 'column' },
  propStatLbl:  { fontSize: 9.5, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  propStatVal:  { fontSize: 13, fontWeight: 600, color: C.txtPrimary },
  propCardFooter: { display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.cardBdr}`, marginTop: 'auto' },
  propBtnDark:  { flex: 1, background: C.navBg, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: F.sans },
  propBtnOut:   { flex: 1, background: '#fff', color: C.txtPrimary, border: `1px solid ${C.cardBdr}`, borderRadius: 6, padding: '8px 0', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: F.sans },

  // SECTION HEADING
  sectionHdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: C.txtPrimary },
  sectionLink:  { fontSize: 12, color: C.blue, cursor: 'pointer', fontWeight: 500 },

  // UNIT ACTIVITY ROW
  unitRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 },
  unitCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 10, overflow: 'hidden' },
  unitImgWrap: { height: 110, background: 'linear-gradient(135deg, #1a2d4a 0%, #263d5a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unitImg: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 },
  unitRentBadge: (bg, col) => ({ position: 'absolute', top: 8, right: 8, background: bg, color: col, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: 0.4 }),
  unitBody: { padding: '11px 13px 13px' },
  unitName: { fontSize: 13.5, fontWeight: 700, color: C.txtPrimary, marginBottom: 2 },
  unitPropName: { fontSize: 10.5, color: C.txtMuted, marginBottom: 8 },
  unitTenant: { fontSize: 11.5, color: C.txtSec, marginBottom: 6 },
  unitMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.txtMuted, marginBottom: 10 },
  unitMaintStatus: ok => ({ fontSize: 10.5, fontWeight: 500, color: ok ? C.greenDark : C.red }),
  unitViewBtn: { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 5, padding: '7px 0', fontSize: 11.5, fontWeight: 500, color: C.txtPrimary, cursor: 'pointer', fontFamily: F.sans },

  // EMPTY STATE
  emptyState: { textAlign: 'center', padding: '48px 24px', color: C.txtMuted },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: 600, color: C.txtSec, marginBottom: 6 },
  emptyBody:  { fontSize: 12.5, color: C.txtMuted, marginBottom: 16 },

  errBanner: { background: '#fee2e2', color: '#b91c1c', padding: '12px 18px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordPortfolioPage() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [activeFilter,setActiveFilter]= useState('ALL');
  const [activeNav,   setActiveNav]   = useState('properties');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/portfolio/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); })
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const summary     = data?.summary      || {};
  const allProps    = data?.properties   || [];
  const recentUnits = data?.recent_units || [];

  // landlord name from token cache (fallback)
  const landlordName = summary.landlord_name || '';
  const avatarText   = landlordName ? initials(landlordName) : 'L';

  // ── Filter + search ─────────────────────────────────────────────────────────
  const FILTERS = [
    { id: 'ALL',      label: 'All properties' },
    { id: 'ACTIVE',   label: 'Active' },
    { id: 'OCCUPIED', label: 'High occupancy' },
    { id: 'ALERT',    label: 'Needs attention' },
  ];

  const filteredProps = allProps.filter(p => {
    const matchSearch = search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === 'ALL'      ? true :
      activeFilter === 'ACTIVE'   ? p.status === 'ACTIVE' :
      activeFilter === 'OCCUPIED' ? p.occupancy_pct >= 80 :
      activeFilter === 'ALERT'    ? p.maint_open > 0 : true;

    return matchSearch && matchFilter;
  });

  const handleNavClick = (item) => {
    setActiveNav(item.id);
    if (item.route) window.location.href = item.route;
  };

  return (
    <div style={S.shell}>

      {/* ── LEFT NAV ── */}
      <NavF activePage="properties" />  

      {/* ── MAIN ── */}
      <div style={S.main}>

        {/* TOPBAR */}
        <header style={S.topbar}>
          <div style={S.topTitle}>UrbanNest Landlord</div>
          <div style={S.topRight}>
            <button style={S.iconBtn} aria-label="Notifications">
              <i className="ti ti-bell" aria-hidden="true" />
            </button>
            <button style={S.iconBtn} aria-label="Help">
              <i className="ti ti-help-circle" aria-hidden="true" />
            </button>
            <div style={S.avatar}>{avatarText}</div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={S.content}>

          {error && (
            <div style={S.errBanner}>
              <i className="ti ti-alert-circle" aria-hidden="true" /> Could not load portfolio — {error}
            </div>
          )}

          {/* ── PAGE HEADING + OWNER MODE BADGE ── */}
          <div style={S.pageHdrRow}>
            <div>
              <div style={S.pageTitle}>Portfolio Overview</div>
              <div style={S.pageSub}>Excellence in every square foot.</div>
            </div>
            <div style={S.ownerBadge}>
              <div style={S.ownerDot} />
              OWNER MODE: ACTIVE
            </div>
          </div>

          {/* ── SUMMARY BAR (replaces redundant hero card) ── */}
          <div style={S.summaryBar}>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Total properties</div>
              <div style={S.summaryVal}>{loading ? '—' : summary.total_properties ?? 0}</div>
              <div style={S.summarySub}>In your portfolio</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Total units</div>
              <div style={S.summaryVal}>{loading ? '—' : summary.total_units ?? 0}</div>
              <div style={S.summarySub}>Across all properties</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Avg occupancy</div>
              <div style={{ ...S.summaryVal, color: (summary.avg_occupancy ?? 0) >= 80 ? C.greenDark : C.amber }}>
                {loading ? '—' : `${summary.avg_occupancy ?? 0}%`}
              </div>
              <div style={S.summarySub}>Portfolio average</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Rent this month</div>
              <div style={{ ...S.summaryVal, color: C.greenDark }}>
                {loading ? '—' : fmtCurrency(summary.rent_this_month ?? 0)}
              </div>
              <div style={S.summarySub}>Collected so far</div>
            </div>
          </div>

          {/* ── MANAGED ASSETS HEADING + FILTER BAR ── */}
          <div style={S.sectionHdr}>
            <div style={S.sectionTitle}>Managed Assets</div>
          </div>

          <div style={S.filterBar}>
            {/* Search */}
            <div style={S.searchBox}>
              <i className="ti ti-search" style={{ fontSize: 14, color: C.txtMuted, flexShrink: 0 }} aria-hidden="true" />
              <input
                style={S.searchInput}
                placeholder="Search by name, city, address…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search properties"
              />
            </div>
            {/* Filter chips */}
            {FILTERS.map(f => (
              <button
                key={f.id}
                style={S.filterChip(activeFilter === f.id)}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── PROPERTY GRID ── */}
          {!loading && filteredProps.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>🏢</div>
              <div style={S.emptyTitle}>No properties found</div>
              <div style={S.emptyBody}>
                {search || activeFilter !== 'ALL'
                  ? 'Try adjusting your search or filter.'
                  : 'Add your first property to get started.'}
              </div>
              <button
                style={{ ...S.propBtnDark, width: 'auto', padding: '9px 20px' }}
                onClick={() => window.location.href='/landlord-portal/add-property'}
              >
                + Add property
              </button>
            </div>
          ) : (
            <div style={S.propGrid}>
              {filteredProps.map(prop => {
                const primaryOwner = prop.ownerships?.[0];
                const maintColor   = prop.maint_open > 0 ? C.red : C.greenDark;
                const maintLabel   = prop.maint_open > 0 ? `${prop.maint_open} Open` : '0 Open';
                const occColor     = prop.occupancy_pct >= 80 ? C.greenDark : prop.occupancy_pct >= 50 ? C.amber : C.red;

                return (
                  <div key={prop.id} style={S.propCard}>
                    {/* Property image */}
                    <div style={S.propImgWrap}>
                      <img
                        src={prop.main_image_url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80'}
                        alt={prop.name}
                        style={S.propImg}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80'; }}
                      />  
                      {!prop.main_image_url && (
                        <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:1.2, padding:'3px 10px', borderRadius:4, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                            Sample Image
                        </div>
                      )}

                      <div style={S.propTypeBadge}>
                        {PROP_TYPE_LABEL[prop.property_type] || prop.property_type}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={S.propBody}>
                      <div style={S.propName}>{prop.name}</div>
                      <div style={S.propAddr}>
                        <i className="ti ti-map-pin" style={{ fontSize: 11, color: C.txtMuted }} aria-hidden="true" />
                        {prop.address || prop.city}
                      </div>

                      {/* Owner + share row */}
                      <div style={S.propOwnerRow}>
                        <div>
                          <div style={S.propOwnerLbl}>Owner</div>
                          <div style={S.propOwnerVal}>
                            {primaryOwner?.owner_name || 'You'}
                          </div>
                        </div>
                        <div>
                          <div style={S.propShareLbl}>Share</div>
                          <div style={S.propShareVal}>
                            {primaryOwner?.share_pct ? `${primaryOwner.share_pct}%` : '100%'}
                          </div>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div style={S.propStatsGrid}>
                        <div style={S.propStatItem}>
                          <div style={S.propStatLbl}>Units</div>
                          <div style={S.propStatVal}>{prop.total_units} Total</div>
                        </div>
                        <div style={S.propStatItem}>
                          <div style={S.propStatLbl}>Occupancy</div>
                          <div style={{ ...S.propStatVal, color: occColor }}>{prop.occupancy_pct}%</div>
                        </div>
                        <div style={S.propStatItem}>
                          <div style={S.propStatLbl}>Maintenance</div>
                          <div style={{ ...S.propStatVal, color: maintColor }}>{maintLabel}</div>
                        </div>
                        <div style={S.propStatItem}>
                          <div style={S.propStatLbl}>Renewals</div>
                          <div style={S.propStatVal}>
                            {prop.renewals_30d > 0
                              ? <span style={{ color: C.amber }}>{prop.renewals_30d} Upcoming</span>
                              : '0 Upcoming'}
                          </div>
                        </div>
                      </div>

                      {/* CTA buttons */}
                      <div style={S.propCardFooter}>
                        <button
                          style={S.propBtnDark}
                          onClick={() => window.location.href=`/landlord-portal/property/${prop.id}`}
                        >
                          View Property
                        </button>
                        <button
                          style={S.propBtnOut}
                          onClick={() => window.location.href=`/landlord-portal/property/${prop.id}/units`}
                        >
                          View Units
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── RECENT UNIT ACTIVITIES ── */}
          <div style={S.sectionHdr}>
            <div style={S.sectionTitle}>Recent Unit Activities</div>
            <span style={S.sectionLink}>View all units →</span>
          </div>

          {recentUnits.length === 0 && !loading ? (
            <div style={{ ...S.emptyState, padding: '24px' }}>
              <div style={{ fontSize: 12.5, color: C.txtMuted }}>No unit activity yet.</div>
            </div>
          ) : (
            <div style={S.unitRow}>
              {recentUnits.slice(0, 4).map((u, idx) => {
                const badge = RENT_BADGE[u.rent_status] || RENT_BADGE.PAID;
                const maintOk = u.maint_status === 'Clear';
                return (
                  <div key={u.id || idx} style={S.unitCard}>
                    <div style={S.unitImgWrap}>
                      <img
                        src={u.main_image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80'}
                        alt={u.unit_name}
                        style={S.unitImg}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80'; }}
                      />
                      {!u.main_image_url && (
                        <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:9, fontWeight:700, letterSpacing:1, padding:'2px 8px', borderRadius:3, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                            Sample Image
                        </div>
                      )}
                      <div style={S.unitRentBadge(badge.bg, badge.col)}>{badge.label}</div>
                    </div>
                    <div style={S.unitBody}>
                      <div style={S.unitName}>{u.unit_name || `Unit #${u.id}`}</div>
                      <div style={S.unitPropName}>{u.property_name}</div>
                      <div style={S.unitTenant}>
                        {u.tenant_name
                          ? `Tenant: ${u.tenant_name}`
                          : <span style={{ color: C.txtMuted, fontStyle: 'italic' }}>Vacant</span>}
                      </div>
                      <div style={S.unitMeta}>
                        <span>Lease ends</span>
                        <span>{u.lease_end || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 10.5, color: C.txtMuted }}>Status</span>
                        <span style={S.unitMaintStatus(maintOk)}>{u.maint_status}</span>
                      </div>
                      <button
                        style={S.unitViewBtn}
                        onClick={() => window.location.href=`/landlord-portal/property/${u.property_id}/unit/${u.id}`}
                      >
                        View Unit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER */}
          <div style={{ textAlign: 'center', fontSize: 11, color: C.txtMuted, padding: '16px 0', borderTop: `1px solid ${C.cardBdr}` }}>
            © 2023 UrbanNest Property Management. All Rights Reserved.
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center', gap: 16 }}>
              {['Privacy Policy', 'Terms of Service', 'Global Compliance'].map(l => (
                <span key={l} style={{ fontSize: 11, color: C.txtMuted, cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
