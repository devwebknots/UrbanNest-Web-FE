import React, { useState, useEffect } from 'react';
import {
  PageShell, Grid, HeroBanner, StatTile, SectionHeader, PropertyCard, SectionCard,
  MediaListItem, ActionTile, EmptyState, LineChart, PageFooter,
} from '../../components/v2';
import {
  C2, TONES2, F2, FS2, SP2, SZ2, LAYOUT2, R2, OP2, UI2,
} from '../../constants/v2';
import heroImage from '../../assets/v2/landlord/portfolio-hero.jpg';
import propertyPlaceholder from '../../assets/v2/landlord/property-placeholder.jpg';
import unitPlaceholder from '../../assets/v2/landlord/unit-placeholder.jpg';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Design System v2 — Landlord Portfolio (Property List) ───────────────────
// Visual layer only. Data comes from GET /landlord/portfolio/ exactly as before:
//   summary · properties · recent_units
// Layout (design: Downloads/image 36):
//   HeroBanner → 4 raised StatTiles → Managed Assets (SectionHeader + filters/search, PropertyCards
//   in <Grid layout="three">) → <Grid layout="mainSide">: Recent Unit Activities | Portfolio Insights
//   → PageFooter. No page-level spacing, sizes or grid columns.

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

// ─── Rent status tag on the unit photo ────────────────────────────────────────
const RENT_TAG = {
  PAID:    { tone: TONES2.success, label: 'PAID' },
  PENDING: { tone: TONES2.warning, label: 'PENDING' },
  OVERDUE: { tone: TONES2.error,   label: 'OVERDUE' },
};

const FILTERS = [
  { id: 'ALL',      label: 'All' },
  { id: 'ACTIVE',   label: 'Active' },
  { id: 'OCCUPIED', label: 'High Occupancy' },
  { id: 'ALERT',    label: 'Needs Attention' },
];

const fmtCurrency = n =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const initials = name =>
  (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const go = path => { window.location.href = path; };

// ─── Portfolio Insights chart ─────────────────────────────────────────────────
// The portfolio API has no monthly rent series yet, so the chart shows sample figures
// (flagged with a "Sample data" pill) for the last six months until that endpoint exists.
const SAMPLE_RENT = [2400, 3400, 4100, 4250, 4000, 6200];
const lastSixMonths = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
};
const fmtK = v => (v === 0 ? '$0' : `$${Math.round(v / 1000)}k`);

// ─── Card-internal styles specific to this page (tokens only) ────────────────
const S = {
  search:   { ...UI2.searchField, width: SZ2.searchSm, maxWidth: '100%' },
  input:    { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: F2.body, fontSize: FS2.base, color: C2.textPrimary },
  pager:    { ...UI2.row(SP2.xs), ...UI2.text.caption },
  pageBtn:  (disabled) => ({ ...UI2.btn.iconOutline(SZ2.control.sm), borderRadius: R2.round, ...(disabled ? { opacity: OP2.muted, cursor: 'default' } : {}) }),
  chartWrap:{ position: 'relative', height: SZ2.chart, flex: 1 },
  status:   { ...UI2.row(SP2.xs) },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordPortfolioPage() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [activeFilter,setActiveFilter]= useState('ALL');
  const [unitIdx,     setUnitIdx]     = useState(0);

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
  const dash = v => (loading ? '—' : v);

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

  // ── Recent unit activity: one featured unit, ‹ › to step through the rest ──
  const unitCount = Math.min(recentUnits.length, 4);
  const unit = recentUnits[Math.min(unitIdx, Math.max(unitCount - 1, 0))];
  const months = lastSixMonths();

  const KPIS = [
    { tone: TONES2.primary, icon: 'ti-building',   label: 'Total Properties', value: dash(summary.total_properties ?? 0) },
    { tone: TONES2.success, icon: 'ti-stack-2',    label: 'Total Units',      value: dash(summary.total_units ?? 0) },
    { tone: TONES2.warning, icon: 'ti-percentage', label: 'Avg Occupancy',    value: dash(`${summary.avg_occupancy ?? 0}%`) },
    { tone: TONES2.purple,  icon: 'ti-wallet',     label: 'Rent This Month',  value: dash(fmtCurrency(summary.rent_this_month ?? 0)), valueColor: C2.successStrong },
  ];

  return (
    <PageShell
      activePage="properties"
      title="UrbanNest Landlord"
      searchPlaceholder={null}
      avatarText={avatarText}
      avatarLabel={`Profile: ${landlordName || 'Landlord'}`}
    >

      {error && (
        <div style={UI2.errorBanner}>
          <i className="ti ti-alert-circle" aria-hidden="true" /> Could not load portfolio — {error}
        </div>
      )}

      {/* ── HERO ── */}
      <HeroBanner
        variant="compact"
        eyebrow="Portfolio Overview"
        image={heroImage}
        imageFull
        imagePosition="center top"
        title="Property List"
        subtitle="Explore and manage all your properties in one place."
      />

      {/* ── SUMMARY ── */}
      <Grid layout="four">
        {KPIS.map(k => <StatTile key={k.label} {...k} labelAbove raised />)}
      </Grid>

      {/* ── MANAGED ASSETS ── */}
      <section style={UI2.stack(LAYOUT2.cardHeaderGap)}>
        <SectionHeader
          icon="ti-home-2"
          title="Managed Assets"
          filters={FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              className={activeFilter === f.id ? undefined : 'un2-raise'}
              style={UI2.filterChip(activeFilter === f.id)}
              aria-pressed={activeFilter === f.id}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          action={
            <label className="un2-focus-ring" style={S.search}>
              <i className="ti ti-search" style={{ fontSize: FS2.lg, color: C2.textSecondary }} aria-hidden="true" />
              <input
                style={S.input}
                type="search"
                placeholder="Search name, city, address…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search properties"
              />
            </label>
          }
        />

        {loading ? (
          <Grid layout="three" as="div">
            {[0, 1, 2].map(i => <PropertyCard key={i} loading />)}
          </Grid>
        ) : filteredProps.length === 0 ? (
          <div style={UI2.card}>
            <EmptyState
              icon="ti-building"
              title="No properties found"
              text={search || activeFilter !== 'ALL'
                ? 'Try adjusting your search or filter.'
                : 'Add your first property to get started.'}
            >
              <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => go('/landlord-portal/add-property')}>
                <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Add property
              </button>
            </EmptyState>
          </div>
        ) : (
          <Grid layout="three" as="div">
            {filteredProps.map(prop => {
              const primaryOwner = prop.ownerships?.[0];
              const toProperty = () => go(`/landlord-portal/property/${prop.id}`);
              const toUnits    = () => go(`/landlord-portal/property/${prop.id}/units`);
              return (
                <PropertyCard
                  key={prop.id}
                  image={prop.main_image_url}
                  fallbackImage={propertyPlaceholder}
                  typeLabel={PROP_TYPE_LABEL[prop.property_type] || prop.property_type}
                  name={prop.name}
                  address={prop.address || prop.city}
                  share={primaryOwner?.share_pct ? `${primaryOwner.share_pct}%` : '100%'}
                  stats={[
                    { icon: 'ti-buildings', value: prop.total_units ?? 0, label: prop.total_units === 1 ? 'Total Unit' : 'Total Units' },
                    { icon: 'ti-users-group', value: `${prop.occupancy_pct ?? 0}%`, label: 'Occupancy' },
                    { icon: 'ti-calendar-check', value: prop.renewals_30d ?? 0, label: 'Upcoming' },
                  ]}
                  primaryAction={{ label: 'View Property', onClick: toProperty }}
                  secondaryAction={{ label: 'View Units', onClick: toUnits }}
                  menu={[
                    { icon: 'ti-eye', label: 'View property', onClick: toProperty },
                    { icon: 'ti-stack-2', label: 'View units', onClick: toUnits },
                    { icon: 'ti-plus', label: 'Add unit', onClick: () => go(`/landlord-portal/property/${prop.id}/add-unit`) },
                  ]}
                />
              );
            })}
          </Grid>
        )}
      </section>

      {/* ── RECENT UNIT ACTIVITIES + PORTFOLIO INSIGHTS ── */}
      <Grid layout="mainSide">
        <SectionCard
          icon="ti-activity-heartbeat" plainIcon title="Recent Unit Activities"
          action={
            <div style={UI2.row(SP2.md)}>
              {unitCount > 1 && (
                <div style={S.pager}>
                  <button type="button" className="un2-raise" style={S.pageBtn(unitIdx === 0)} disabled={unitIdx === 0}
                    onClick={() => setUnitIdx(i => Math.max(0, i - 1))} aria-label="Previous unit">
                    <i className="ti ti-chevron-left" aria-hidden="true" />
                  </button>
                  <span>{unitIdx + 1} / {unitCount}</span>
                  <button type="button" className="un2-raise" style={S.pageBtn(unitIdx >= unitCount - 1)} disabled={unitIdx >= unitCount - 1}
                    onClick={() => setUnitIdx(i => Math.min(unitCount - 1, i + 1))} aria-label="Next unit">
                    <i className="ti ti-chevron-right" aria-hidden="true" />
                  </button>
                </div>
              )}
              <button type="button" className="un2-link un2-hide-narrow" style={UI2.btn.link}>
                View all units <i className="ti ti-arrow-right" aria-hidden="true" />
              </button>
            </div>
          }
          centerBody={!unit}
        >
          {!unit ? (
            <EmptyState icon="ti-home-search" text={loading ? 'Loading unit activity…' : 'No unit activity yet.'} />
          ) : (() => {
            const maintOk = unit.maint_status === 'Clear';
            const toUnit = () => go(`/landlord-portal/property/${unit.property_id}/unit/${unit.id}`);
            return (
              <Grid layout="wideLeft" as="div">
                <MediaListItem
                  size="lg"
                  image={unit.main_image_url || unitPlaceholder}
                  fallbackIcon="ti-home"
                  tag={RENT_TAG[unit.rent_status] || RENT_TAG.PAID}
                  title={unit.property_name ? `${unit.property_name} – ${unit.unit_name || `Unit #${unit.id}`}` : (unit.unit_name || `Unit #${unit.id}`)}
                  subtitle={`${unit.tenant_name ? `Tenant: ${unit.tenant_name}` : 'Vacant'} · Lease ends ${unit.lease_end || '–'}`}
                  details={[{
                    label: 'Status',
                    value: <span style={S.status}><span style={UI2.dot(maintOk ? C2.successStrong : C2.errorDark)} />{unit.maint_status || '—'}</span>,
                    color: maintOk ? C2.successStrong : C2.errorDark,
                  }]}
                  actionsPosition="below"
                  actions={
                    <button type="button" className="un2-raise" style={{ ...UI2.btn.outline, width: '100%' }} onClick={toUnit}>
                      View Unit <i className="ti ti-arrow-right" aria-hidden="true" />
                    </button>
                  }
                />
                <Grid layout="two" as="div">
                  <ActionTile centered tone={TONES2.primary} icon="ti-file-text"   title="Lease Details" onClick={toUnit} />
                  <ActionTile centered tone={TONES2.warning} icon="ti-tool"        title="Maintenance"   onClick={() => go('/landlord-portal/maintenance')} />
                  <ActionTile centered tone={TONES2.warning} icon="ti-credit-card" title="Financials"    onClick={() => go('/landlord-portal/finances')} />
                  <ActionTile centered tone={TONES2.purple}  icon="ti-chart-bar"   title="Analytics" />
                </Grid>
              </Grid>
            );
          })()}
        </SectionCard>

        <SectionCard
          variant="dark" icon="ti-chart-histogram" title="Portfolio Insights"
          action={<span style={UI2.chipOnDark}><i className="ti ti-calendar" aria-hidden="true" /> Last 6 Months</span>}
        >
          <div style={S.chartWrap}>
            <LineChart
              dark
              labels={months.map(d => d.toLocaleString('en-US', { month: 'short' }))}
              values={SAMPLE_RENT}
              formatValue={fmtCurrency}
              formatTick={fmtK}
              tooltipLabel={lbl => {
                const d = months.find(m => m.toLocaleString('en-US', { month: 'short' }) === lbl);
                return d ? d.toLocaleString('en-US', { month: 'short', year: 'numeric' }) : lbl;
              }}
              ariaLabel="Monthly rent collected, last six months (sample data)"
            />
          </div>
          <div style={{ ...UI2.row(SP2.xs), ...UI2.text.caption, color: C2.onDark.textFaint, marginTop: SP2.sm }}>
            <i className="ti ti-info-circle" aria-hidden="true" /> Sample data until the monthly rent API is connected
          </div>
        </SectionCard>
      </Grid>

      <PageFooter />

    </PageShell>
  );
}
