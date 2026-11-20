import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageShell, Grid, OpenHero, StatGroup, SectionCard, TabBar, PropertyRow, ListRow,
  ActionTile, EmptyState, LineChart, CountUp, TextLink, PageFooter,
} from '../../components/v2';
import {
  C2, TONES2, ACCENT2, GSTOPS2, accentTone,
  T2, F2, FS2, SP2, SZ2, LAYOUT2, UI2,
} from '../../constants/v2';
import heroImage from '../../assets/v2/landlord/portfolio-hero-building.jpg';   // building + trees cropped from Downloads/image 39 (1).png (left edge feathered by OpenHero)
import propertyPlaceholder from '../../assets/v2/landlord/property-placeholder.jpg';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Design System v2 — Landlord Portfolio (Property List) ───────────────────
// Visual layer only. Data comes from GET /landlord/portfolio/ exactly as before:
//   summary · properties · recent_units
// Layout (design: Downloads/image 51):
//   OpenHero (PORTFOLIO · Property List, no box, bleeds to the edges)
//     + stats band: StatGroup size="lg"     — Total properties · Total units · Avg occupancy · Rent this month
//   <Grid layout="mainSide">
//     My Properties (TabBar underline filters · search · Add Property, PropertyRow list)
//     │ Portfolio Insights (figure + delta + LineChart) · Recent Unit Activities · Quick Actions
//   PageFooter
// No page-level spacing, sizes, fonts or colours — everything comes from constants/v2.

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

const PROP_STATUS = {
  ACTIVE:   { tone: TONES2.success, label: 'Active' },
  INACTIVE: { tone: TONES2.neutral, label: 'Inactive' },
  DRAFT:    { tone: TONES2.neutral, label: 'Draft' },
};

const FILTERS = [
  { id: 'ALL',      label: 'All Properties' },
  { id: 'ACTIVE',   label: 'Active' },
  { id: 'OCCUPIED', label: 'High Occupancy' },
  { id: 'ALERT',    label: 'Needs Attention' },
];

// Recent unit activity icons (no yellow: maintenance = rose, pending = violet)
const ACT = {
  paid:    { tone: TONES2.success,               icon: 'ti-circle-check' },
  pending: { tone: accentTone(ACCENT2.violet),   icon: 'ti-clock' },
  overdue: { tone: TONES2.error,                 icon: 'ti-alert-circle' },
  maint:   { tone: accentTone(ACCENT2.rose),     icon: 'ti-tool' },
};

const fmtCurrency = n =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const initials = name =>
  (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─── Portfolio Insights chart ─────────────────────────────────────────────────
// The portfolio API has no monthly rent series yet, so the chart shows sample figures for the
// five months before this one (this month = the real rent_this_month) until that endpoint exists.
const SAMPLE_RENT = [2400, 3400, 4100, 4250, 4000, 6200];
const lastSixMonths = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
};
const monthShort = d => d.toLocaleString('en-US', { month: 'short' });
const monthYear  = d => d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
const fmtK = v => (v === 0 ? '$0' : `$${Math.round(v / 1000)}k`);

// ─── Page-specific layout (tokens only) ──────────────────────────────────────
const S = {
  side:      UI2.stack(LAYOUT2.gridGap),
  tools:     { ...UI2.row(LAYOUT2.inlineGap) },
  toolBtn:   (on) => ({ ...UI2.btn.iconOutline(SZ2.control.md), ...(on ? { color: C2.primary, borderColor: C2.primary } : {}) }),
  search:    { ...UI2.searchField, width: SZ2.searchSm, maxWidth: '100%', marginTop: LAYOUT2.cardHeaderGap },
  input:     { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: F2.body, fontSize: FS2.base, color: C2.textPrimary },
  list:      { marginTop: SP2.xl },
  // empty / no-match: fills the rest of the card and centres the EmptyState both ways
  listEmpty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: SP2.xl },

  insightTop:{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP2.md, flexWrap: 'wrap' },
  insightSub:{ ...T2.label, marginTop: SP2.xs },
  deltaCol:  { ...UI2.stack(SP2.xs), alignItems: 'flex-end' },
  chartWrap: { position: 'relative', height: SZ2.chart, marginTop: SP2.lg },
  sampleNote:{ ...UI2.row(SP2.xs), ...T2.caption, marginTop: SP2.sm },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordPortfolioPage() {
  const navigate = useNavigate();
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const listRef = useRef(null);            // My Properties list / empty state
  const filterChanged = useRef(false);     // set by a tab click → scroll the empty state into view

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

  const landlordName = summary.landlord_name || '';
  const avatarText   = landlordName ? initials(landlordName) : 'L';
  const num = v => (loading ? '—' : <CountUp value={Number(v) || 0} />);

  // ── Filter + search ─────────────────────────────────────────────────────────
  const filteredProps = allProps.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = search === '' ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q);

    const matchFilter =
      activeFilter === 'ALL'      ? true :
      activeFilter === 'ACTIVE'   ? p.status === 'ACTIVE' :
      activeFilter === 'OCCUPIED' ? p.occupancy_pct >= 80 :
      activeFilter === 'ALERT'    ? p.maint_open > 0 : true;

    return matchSearch && matchFilter;
  });

  // Tab switched to a filter with no properties → bring the empty state into view (centred).
  // Only on a tab change (not while typing a search), and never on the first load.
  const isEmpty = !loading && filteredProps.length === 0;
  useEffect(() => {
    if (!filterChanged.current) return;
    filterChanged.current = false;
    if (isEmpty && listRef.current) listRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeFilter, isEmpty]);
  const onFilterChange = id => { filterChanged.current = id !== activeFilter; setActiveFilter(id); };

  // ── Summary stats ───────────────────────────────────────────────────────────
  const rentThisMonth = Number(summary.rent_this_month ?? 0);
  const STATS = [
    { icon: 'ti-building',   label: 'Total Properties', value: num(summary.total_properties ?? 0), accent: ACCENT2.blue },
    { icon: 'ti-stack-2',    label: 'Total Units',      value: num(summary.total_units ?? 0),
      accent: { soft: TONES2.success.soft, fg: TONES2.success.strong, bar: GSTOPS2.success } },
    { icon: 'ti-percentage', label: 'Avg Occupancy',    value: loading ? '—' : <CountUp value={Number(summary.avg_occupancy) || 0} format={v => `${Math.round(v)}%`} />, accent: ACCENT2.blue },
    { icon: 'ti-wallet',     label: 'Rent This Month',  value: loading ? '—' : <CountUp value={rentThisMonth} format={fmtCurrency} />,
      accent: ACCENT2.violet, valueColor: C2.successStrong },
  ];

  // ── Portfolio insights ─────────────────────────────────────────────────────
  const months = lastSixMonths();
  const series = [...SAMPLE_RENT.slice(0, 5), rentThisMonth || SAMPLE_RENT[5]];
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  const delta = previous > 0 ? ((current - previous) / previous) * 100 : null;

  // ── Recent unit activities (rent status + open maintenance per unit) ──────
  // "Property — Unit": one separator (— , same as the API's unit names); unit_name often already
  // starts with the property name ("Two Towers — Unit 05B"), so never repeat it.
  const unitTitle = u => {
    const unit = u.unit_name || `Unit #${u.id}`;
    if (!u.property_name || unit.toLowerCase().startsWith(u.property_name.toLowerCase())) return unit;
    return `${u.property_name} — ${unit}`;
  };
  const activities = recentUnits.flatMap(u => {
    const rent = u.rent_status === 'OVERDUE' ? { ...ACT.overdue, meta: 'Rent overdue' }
      : u.rent_status === 'PENDING' ? { ...ACT.pending, meta: 'Rent pending' }
      : { ...ACT.paid, meta: 'Rent marked as Paid' };
    const items = [{ key: `${u.id}-rent`, unit: u, title: unitTitle(u), ...rent }];
    if (u.maint_status && u.maint_status !== 'Clear') {
      items.push({ key: `${u.id}-maint`, unit: u, title: 'Maintenance request', meta: `${unitTitle(u)} — ${u.maint_status}`, ...ACT.maint });
    }
    return items;
  }).slice(0, 4);

  const toUnit = u => navigate(`/landlord-portal/property/${u.property_id}/unit/${u.id}`);
  const firstUnit = recentUnits[0];

  return (
    <PageShell
      animate
      activePage="properties"
      title="UrbanNest Landlord"
      searchPlaceholder="Search properties, units, tenants…"
      avatarText={avatarText}
      avatarLabel={`Profile: ${landlordName || 'Landlord'}`}
    >

      {/* ── HERO (open, no box) + SUMMARY band — must stay the first child (bleeds to the page edges) ── */}
      <OpenHero
        eyebrow="Portfolio"
        title="Property List"
        subtitle="Explore and manage all your properties in one place."
        image={heroImage}
        stats={<StatGroup size="lg" items={STATS} />}
      />

      {error && (
        <div style={UI2.errorBanner}>
          <i className="ti ti-alert-circle" aria-hidden="true" /> Could not load portfolio — {error}
        </div>
      )}

      {/* ── MY PROPERTIES │ INSIGHTS · ACTIVITY · QUICK ACTIONS ── */}
      <Grid layout="mainSide">
        <SectionCard
          style={UI2.cardFill}
          icon="ti-home-2" title="My Properties"
          action={
            <div style={S.tools}>
              <button type="button" className="un2-raise" style={S.toolBtn(searchOpen || !!search)} aria-label="Search properties" aria-pressed={searchOpen}
                onClick={() => setSearchOpen(o => !o)}>
                <i className="ti ti-search" aria-hidden="true" />
              </button>
              <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnSm }} onClick={() => navigate('/landlord-portal/add-property')}>
                <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" />
                <span className="un2-hide-narrow">Add Property</span>
              </button>
            </div>
          }
        >
          <TabBar variant="underline" ariaLabel="Property filters" value={activeFilter} onChange={onFilterChange} tabs={FILTERS} />

          {(searchOpen || search) && (
            <label className="un2-focus-ring" style={S.search}>
              <i className="ti ti-search" style={{ fontSize: FS2.lg, color: C2.textSecondary }} aria-hidden="true" />
              <input
                autoFocus
                style={S.input}
                type="search"
                placeholder="Search name, city, address…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search properties"
              />
            </label>
          )}

          <div ref={listRef} style={isEmpty ? S.listEmpty : S.list}>
            {loading ? (
              [0, 1].map(i => <PropertyRow key={i} loading first={i === 0} />)
            ) : filteredProps.length === 0 ? (
              <EmptyState
                icon="ti-building"
                title="No properties found"
                text={search || activeFilter !== 'ALL'
                  ? 'Try adjusting your search or filter.'
                  : 'Add your first property to get started.'}
              >
                <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => navigate('/landlord-portal/add-property')}>
                  <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Add property
                </button>
              </EmptyState>
            ) : (
              filteredProps.map((prop, i) => {
                const toProperty = () => navigate(`/landlord-portal/property/${prop.id}`);
                const toUnits    = () => navigate(`/landlord-portal/property/${prop.id}/units`);
                const share = prop.ownerships?.[0]?.share_pct ?? 100;
                return (
                  <PropertyRow
                    key={prop.id}
                    first={i === 0}
                    image={prop.main_image_url}
                    fallbackImage={propertyPlaceholder}
                    name={prop.name}
                    status={PROP_STATUS[prop.status] || (prop.status ? { tone: TONES2.neutral, label: prop.status } : null)}
                    address={prop.address || prop.city}
                    typeLabel={PROP_TYPE_LABEL[prop.property_type] || prop.property_type}
                    share={share}
                    stats={[
                      { icon: 'ti-buildings',      value: prop.total_units ?? 0,       label: prop.total_units === 1 ? 'Total Unit' : 'Total Units' },
                      { icon: 'ti-percentage',     value: `${prop.occupancy_pct ?? 0}%`, label: 'Occupancy' },
                      { icon: 'ti-calendar-check', value: prop.renewals_30d ?? 0,       label: 'Upcoming' },
                    ]}
                    primaryAction={{ label: 'View Property', onClick: toProperty }}
                    secondaryAction={{ label: 'View Units', onClick: toUnits }}
                    menu={[
                      { icon: 'ti-eye',     label: 'View property', onClick: toProperty },
                      { icon: 'ti-stack-2', label: 'View units',    onClick: toUnits },
                      { icon: 'ti-plus',    label: 'Add unit',      onClick: () => navigate(`/landlord-portal/property/${prop.id}/add-unit`) },
                    ]}
                  />
                );
              })
            )}
          </div>
        </SectionCard>

        <div style={S.side}>
          {/* Portfolio Insights */}
          <SectionCard
            icon="ti-chart-line" title="Portfolio Insights"
            action={<span style={UI2.pill()}><i className="ti ti-calendar" aria-hidden="true" /> Last 6 Months</span>}
          >
            <div style={S.insightTop}>
              <div>
                <div style={T2.figure}>{loading ? '—' : <CountUp value={current} format={fmtCurrency} />}</div>
                <div style={S.insightSub}>{monthYear(months[months.length - 1])}</div>
              </div>
              {delta != null && (
                <div style={S.deltaCol}>
                  <span style={UI2.pill(delta >= 0 ? TONES2.success : TONES2.error)}>
                    <i className={`ti ${delta >= 0 ? 'ti-arrow-up' : 'ti-arrow-down'}`} aria-hidden="true" />
                    {delta >= 0 ? '+' : ''}{delta.toFixed(0)}%
                  </span>
                  <span style={T2.caption}>vs. previous period</span>
                </div>
              )}
            </div>
            <div style={S.chartWrap}>
              <LineChart
                labels={months.map(monthShort)}
                values={series}
                formatValue={fmtCurrency}
                formatTick={fmtK}
                tooltipLabel={lbl => {
                  const d = months.find(m => monthShort(m) === lbl);
                  return d ? monthYear(d) : lbl;
                }}
                ariaLabel="Monthly rent collected, last six months"
              />
            </div>
            <div style={S.sampleNote}>
              <i className="ti ti-info-circle" aria-hidden="true" /> Earlier months are sample data until the monthly rent API is connected
            </div>
          </SectionCard>

          {/* Recent Unit Activities */}
          <SectionCard
            icon="ti-activity-heartbeat" title="Recent Unit Activities"
            action={firstUnit && <TextLink onClick={() => navigate('/landlord-portal/portfolio')}><span className="un2-hide-narrow">View all</span></TextLink>}
            centerBody={activities.length === 0}
          >
            {activities.length === 0 ? (
              <EmptyState icon="ti-home-search" text={loading ? 'Loading unit activity…' : 'No unit activity yet.'} />
            ) : (
              <div>
                {activities.map(a => (
                  <ListRow
                    key={a.key}
                    variant="hover"
                    onClick={() => toUnit(a.unit)}
                    leading={<div style={UI2.iconBox(SZ2.icon.md, a.tone, { round: true })}><i className={`ti ${a.icon}`} aria-hidden="true" /></div>}
                    title={a.title}
                    meta={a.meta}
                    trailing={a.unit.lease_end && <span style={T2.caption}>Ends {a.unit.lease_end}</span>}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Quick Actions */}
          <SectionCard icon="ti-bolt" title="Quick Actions">
            <Grid layout="two" as="div">
              <ActionTile centered tone={TONES2.primary}             icon="ti-file-text"  title="Lease Details" onClick={() => (firstUnit ? toUnit(firstUnit) : navigate('/landlord-portal/leases'))} />
              <ActionTile centered tone={accentTone(ACCENT2.rose)}   icon="ti-tool"       title="Maintenance"   onClick={() => navigate('/landlord-portal/maintenance')} />
              <ActionTile centered tone={accentTone(ACCENT2.violet)} icon="ti-chart-bar"  title="Financials"    onClick={() => navigate('/landlord-portal/finances')} />
              <ActionTile centered tone={TONES2.success}             icon="ti-chart-pie"  title="Analytics" />
            </Grid>
          </SectionCard>
        </div>
      </Grid>

      <PageFooter />

    </PageShell>
  );
}
