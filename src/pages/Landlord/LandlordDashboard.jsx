import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageShell, Grid, ProfileHero, KpiStrip, SectionCard, AssetRow, InsightCard, MetricBar,
  ListRow, EmptyState, MessageItem, PageFooter, BarChart, Sparkline, CountUp, TextLink,
  CardWave, DonutChart,
} from '../../components/v2';
import {
  C2, TONES2, ACCENT2, AVATAR2, CHART2,
  T2, FS2, LH2,
  SP2, SZ2, LAYOUT2, UI2,
} from '../../constants/v2';
import heroImage from '../../assets/v2/landlord/dashboard-hero-light.jpg';   // bright building + soft waves (cut from the dashboard design, Downloads/image 40.png)
import propertyPlaceholder from '../../assets/v2/landlord/property-placeholder.jpg';
import { DASHBOARD_DEMO, withDemo, orDemo } from './dashboardDemoData';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Design System v2 — Landlord Dashboard ───────────────────────────────────
// Visual layer only. Data comes from GET /landlord/dashboard/ exactly as before:
//   landlord · portfolio · kpis · monthly_rent_chart · kpis.rent_collection_trend
//   prime_assets · open_operations · tenant_pulse · recent_payments
//
// Composition (top → bottom), hierarchy through type + spacing rather than boxes:
//   ProfileHero (light, photo feathered in)        — who / portfolio size / main actions
//   Rent collection │ Occupancy                    — the two headline numbers (mini bars │ donut + wave card)
//   KpiStrip                                       — 4 KPIs in ONE container, hairline split
//   Prime Assets │ Monthly Rent Collection         — property rows │ chart + recent payments
//   Open Operations │ Recent Documents │ Comms Hub
//   Tenant Pulse │ UrbanNest Intelligence
// <PageShell animate> staggers the sections in; numbers count up, bars / rings draw in.

// ─── Card-internal styles specific to this page (tokens only) ────────────────

// Shared card patterns (UI2.cardFill · capsLabel · labelRow · context · subhead · cardFoot · strong ·
// delta · amount · legend* · accentItem · tintRow) come from constants/v2/components.js.
// Only layout that is specific to this page stays here.
const S = {
  rentSide:  { ...UI2.stack(SP2.md), justifyContent: 'center', paddingLeft: SP2.lg, borderLeft: `${SZ2.hairline}px solid ${C2.border}` },
  rentLbl:   { ...T2.label, ...UI2.truncate, maxWidth: SZ2.labelMax },

  occBody:       { display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: SP2.lg, flexWrap: 'wrap' },
  occTarget:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: LAYOUT2.inlineGap },
  occTargetLbl:  { ...UI2.row(LAYOUT2.inlineGap), ...T2.label },
  occTargetIcon: { fontSize: FS2.xl, color: C2.primary },

  chartWrap: { position: 'relative', height: SZ2.chart },

  // Open operations (items use UI2.accentItem)
  opHead:    { ...UI2.rowBetween(SP2.sm), alignItems: 'flex-start' },
  opTitle:   { ...UI2.text.rowTitle, ...UI2.clamp(2) },
  opMeta:    { ...UI2.text.meta, ...UI2.truncate, marginTop: SP2.xxs },
  opFoot:    { ...UI2.rowBetween(SP2.sm), marginTop: SP2.sm },
  analytics: { ...UI2.tintRow, marginTop: 'auto' },
  opsBody:   { marginBottom: SP2.xl },

  messenger: { ...UI2.btn.light, width: '100%', minHeight: SZ2.control.lg, marginTop: 'auto' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
const fmtCurrency = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtWhole = n => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const fmtPct1 = n => `${Number(n).toFixed(Number.isInteger(n) ? 0 : 1)}%`;
const pctOf = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

// Management-mode badge (Session 39): gray = self, blue = PM-active, violet = PM-passive
function mgmtBadgeFor(tag) {
  if (tag === 'SELF')       return { tone: TONES2.neutral, label: 'SELF' };
  if (tag === 'PM_ACTIVE')  return { tone: TONES2.primary, label: 'PM · ACTIVE' };
  if (tag === 'PM_PASSIVE') return { tone: TONES2.purple, label: 'PM · PASSIVE' };
  return null;
}

const PRIORITY_TAG = {
  URGENT:   { tone: TONES2.error,   label: 'URGENT' },
  HIGH:     { tone: TONES2.error,   label: 'HIGH' },
  STANDARD: { tone: TONES2.neutral, label: 'STANDARD' },
  MEDIUM:   { tone: TONES2.neutral, label: 'STANDARD' },
  LOW:      { tone: TONES2.neutral, label: 'STANDARD' },
};


// Chart formatting for this page
const fmtK = v => (v === 0 ? '$0' : '$' + (v / 1000).toFixed(0) + 'K');
const fmtMoney = v => '$' + Number(v).toLocaleString();
const fmtPct = v => v + '%';
const DEFAULT_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const OCCUPANCY_TARGET = 96;
const MAX_PRIME_ASSETS = 3;   // Prime Assets card lists at most 3 properties (full list: Manage all properties)
const COLLECTION_TARGET = 95;

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/dashboard/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }, []);

  // ── Derived values from API ───────────────────────────────────────────────
  // Real backend values always win. Any section / field the API leaves empty (not
  // integrated yet, request failed, null field, empty list) falls back to sample data
  // (dashboardDemoData.js). While loading nothing is filled, so skeletons / dashes show.
  const ready = !loading;
  const landlord      = ready ? withDemo(data?.landlord,  DASHBOARD_DEMO.landlord)  : {};
  const portfolio     = ready ? withDemo(data?.portfolio, DASHBOARD_DEMO.portfolio) : {};
  const kpis          = ready ? withDemo(data?.kpis,      DASHBOARD_DEMO.kpis)      : {};
  const rentTrend     = ready ? orDemo(data?.monthly_rent_chart,          DASHBOARD_DEMO.monthly_rent_chart,    ['amount']) : [];
  const rentSparkline = ready ? orDemo(data?.kpis?.rent_collection_trend, DASHBOARD_DEMO.rent_collection_trend, ['pct'])    : [];
  const primeAssets   = ready ? orDemo(data?.prime_assets,    DASHBOARD_DEMO.prime_assets)    : [];
  const ops           = ready ? orDemo(data?.open_operations, DASHBOARD_DEMO.open_operations) : [];
  const tenants       = ready ? orDemo(data?.tenant_pulse,    DASHBOARD_DEMO.tenant_pulse)    : [];
  const payments      = ready ? orDemo(data?.recent_payments, DASHBOARD_DEMO.recent_payments) : [];
  const shownAssets   = primeAssets.slice(0, MAX_PRIME_ASSETS);

  const landlordName   = landlord.name || 'Landlord';
  const avatarInitials = initials(landlordName);
  const latestPayment  = payments[0];
  const dash = v => (loading ? '—' : v);
  const num  = v => (loading ? '—' : <CountUp value={Number(v) || 0} />);

  // Rent
  const collected     = Number(kpis.rent_collected_this_month ?? 0);
  const collectionPct = Number(kpis.rent_collection_pct ?? 0);
  const trend = rentTrend.length
    ? rentTrend.map(d => ({ label: d.month, value: Number(d.amount) || 0 }))
    : DEFAULT_MONTHS.map(m => ({ label: m, value: 0 }));
  const lastMonth = trend.length > 1 ? trend[trend.length - 2] : null;
  const thisMonth = trend[trend.length - 1];
  const chartMonths = trend.slice(-12);   // big monthly chart: last 12 months at most
  const rentCardMonths = trend.slice(-DEFAULT_MONTHS.length);   // Rent Collection card: last 6 months, as in the old design
  const mom = lastMonth && lastMonth.value > 0 ? ((thisMonth.value - lastMonth.value) / lastMonth.value) * 100 : null;

  // Rent Collection card — summary list beside the bar chart (no yellow: collection rate uses violet)
  const RENT_SUMMARY = [
    { key: 'collected', tone: TONES2.primary, icon: 'ti-wallet',
      val: loading ? '—' : <CountUp value={collected} format={fmtWhole} />, lbl: 'Collected' },
    { key: 'rate', tone: { soft: ACCENT2.violet.soft, strong: ACCENT2.violet.fg }, icon: 'ti-percentage',
      val: loading ? '—' : <CountUp value={collectionPct} format={fmtPct1} />, lbl: 'Collection rate' },
    { key: 'latest', tone: TONES2.success, icon: 'ti-receipt',
      val: latestPayment ? `+${fmtCurrency(latestPayment.amount)}` : dash('$0.00'),
      lbl: latestPayment ? latestPayment.tenant_name : 'Latest payment',
      title: latestPayment ? `${latestPayment.tenant_name} · ${latestPayment.property_name}${latestPayment.unit_ref ? `, ${latestPayment.unit_ref}` : ''}` : undefined },
  ];

  // Occupancy
  const occupancy = Number(kpis.occupancy_rate ?? 0);
  const totalUnits = portfolio.total_units;
  const occupiedUnits = totalUnits != null ? Math.round((totalUnits * occupancy) / 100) : null;
  const vacantUnits = totalUnits != null ? Math.max(0, totalUnits - occupiedUnits) : null;

  // KPI strip
  const openTickets = Number(kpis.open_tickets ?? 0);
  const priorityTickets = Number(kpis.priority_tickets ?? 0);
  const newLeases = Number(kpis.new_leases_this_month ?? 0);
  const renewals = Number(kpis.renewals_next_30_days ?? 0);
  const onTrack = collectionPct >= COLLECTION_TARGET;

  const KPIS = [
    { accent: ACCENT2.teal, icon: 'ti-file-text', label: 'New leases', pill: 'This month',
      value: num(newLeases), sub: totalUnits != null ? `signed · ${totalUnits} units` : 'signed',
      pct: pctOf(newLeases, totalUnits) },
    { accent: ACCENT2.blue, icon: 'ti-wallet', label: 'Rent collected',
      pill: onTrack ? 'On-track' : 'Behind', statusTone: onTrack ? TONES2.success : TONES2.error,
      value: loading ? '—' : <CountUp value={collectionPct} format={fmtPct1} />, sub: `vs ${COLLECTION_TARGET}% target`,
      pct: collectionPct },
    { accent: ACCENT2.rose, icon: 'ti-tool', label: 'Open tickets',
      pill: `Priority: ${priorityTickets}`, statusTone: priorityTickets > 0 ? TONES2.error : TONES2.success,
      value: num(openTickets), sub: 'active work orders',
      pct: pctOf(priorityTickets, openTickets) },
    { accent: ACCENT2.violet, icon: 'ti-calendar', label: 'Renewals', pill: 'Next 30 days',
      value: num(renewals), sub: portfolio.active_tenants != null ? `of ${portfolio.active_tenants} leases` : 'upcoming',
      pct: pctOf(renewals, portfolio.active_tenants) },
  ];

  // Recent Documents — static for now, wire to docs API when built
  const DOCS = [
    { tone: TONES2.primary, icon: 'ti-file-text',    name: 'Lease Agreement - #402', meta: 'Updated 2 days ago · 1.2MB' },
    { tone: TONES2.success, icon: 'ti-report-money', name: 'Q3 Financial Report',    meta: 'Aug 15, 2023 · 4.0MB' },
    { tone: TONES2.purple,  icon: 'ti-shield-check', name: 'Insurance Certificate',  meta: 'Expires in 4 months', metaCol: C2.purple },
  ];

  const MESSAGES = [
    { from: 'Estate Manager',   col: C2.skyOnDark, time: '14:20', text: '"The inspection for Emerald Gardens is finalized. Sending over the report now."' },
    { from: 'Maintenance Team', col: C2.periwinkle,      time: '13:05', text: '"Vendor dispatched for Regent Plaza pressure leak. ETA 35 mins."' },
  ];

  return (
    <PageShell
      animate
      activePage="dashboard"
      badges={{ maintenance: kpis.open_tickets }}
      title="UrbanNest Landlord"
      avatarText={loading ? 'MV' : avatarInitials}
      avatarLabel={`Profile: ${landlordName}`}
    >

      {error && (
        <div style={UI2.errorBanner}>
          <i className="ti ti-alert-circle" aria-hidden="true" /> Could not load dashboard data — {error}
        </div>
      )}

      {/* ── HERO ── */}
      <ProfileHero
        eyebrow="Executive Profile"
        status="Active Portfolio"
        image={heroImage}
        title={loading
          ? <span className="un2-skel" style={UI2.skeleton(SZ2.skeletonTitle, SZ2.control.sm)} />
          : landlordName}
        subtitle={`Welcome back · ${landlord.status || 'Property Owner'}`}
        stats={[
          { icon: 'ti-building', tone: TONES2.primary, label: 'Properties',
            value: portfolio.total_properties != null ? num(portfolio.total_properties) : '—',
            note: primeAssets.length ? `${primeAssets.length} prime assets` : 'In your portfolio' },
          { icon: 'ti-stack-2', tone: TONES2.primary, label: 'Total Units',
            value: totalUnits != null ? num(totalUnits) : '—',
            note: vacantUnits == null ? 'Across all properties' : vacantUnits === 0 ? 'Fully let' : `${vacantUnits} vacant` },
          { icon: 'ti-users', tone: TONES2.success, label: 'Active Tenants',
            value: portfolio.active_tenants != null ? num(portfolio.active_tenants) : '—',
            note: loading ? null : `${fmtPct1(occupancy)} leased`, noteTone: TONES2.success },
        ]}
        actions={<>
          <button type="button" className="un2-btn" style={UI2.btn.brand}>
            <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" />
            Add maintenance request
          </button>
          <button type="button" className="un2-btn" style={UI2.btn.soft}>
            <i className="ti ti-message-dots" style={UI2.btnIcon} aria-hidden="true" />
            Message PM
          </button>
        </>}
      />

      {/* ── HEADLINE: RENT COLLECTION + OCCUPANCY ── */}
      <Grid layout="wideLeft">
        {/* Rent collection — previous design restored (icon header + trend pill, bar chart │ summary list), current fonts */}
        <SectionCard
          style={UI2.cardFill}
          icon="ti-building-bank" title="Rent Collection"
          action={mom != null && (
            <span style={UI2.pill(mom >= 0 ? TONES2.success : TONES2.error)}>
              <i className={`ti ${mom >= 0 ? 'ti-trending-up' : 'ti-trending-down'}`} aria-hidden="true" />
              {mom >= 0 ? '+' : ''}{mom.toFixed(1)}% from last month
            </span>
          )}
        >
          <Grid layout="aside" as="div">
            <div style={S.chartWrap}>
              <BarChart
                labels={rentCardMonths.map(d => d.label)}
                values={rentCardMonths.map(d => d.value)}
                formatValue={fmtMoney} formatTick={fmtK}
                ariaLabel="Monthly rent collection"
              />
            </div>
            <div style={S.rentSide}>
              {RENT_SUMMARY.map(r => (
                <div key={r.key} style={UI2.row(LAYOUT2.rowGap)}>
                  <div style={UI2.iconBox(SZ2.icon.md, r.tone, { round: true })}>
                    <i className={`ti ${r.icon}`} aria-hidden="true" />
                  </div>
                  <div style={UI2.minWidth0}>
                    <div style={T2.statInline}>{r.val}</div>
                    <div style={S.rentLbl} title={r.title}>{r.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </Grid>
        </SectionCard>

        {/* Occupancy — previous design restored (icon header, donut + target, wave art), current fonts */}
        <SectionCard style={UI2.cardFill} icon="ti-clipboard-check" title="Occupancy Rate" decoration={<CardWave />}>
          <div style={S.occBody}>
            <DonutChart value={loading ? 0 : occupancy} label="Leased" />
            <div style={S.occTarget}>
              <div style={S.occTargetLbl}>
                <i className="ti ti-target-arrow" style={S.occTargetIcon} aria-hidden="true" /> Target
              </div>
              <div style={T2.figureMd}>{OCCUPANCY_TARGET}%</div>
              <span style={{ ...UI2.pill(TONES2.success), marginTop: SP2.sm }}>
                <i className="ti ti-calendar-check" aria-hidden="true" /> By year end
              </span>
            </div>
          </div>
        </SectionCard>
      </Grid>

      {/* ── KPI STRIP ── */}
      <KpiStrip items={KPIS} />

      {/* ── PRIME ASSETS + MONTHLY RENT COLLECTION ── */}
      <Grid layout="wideLeft">
        <SectionCard
          style={UI2.cardFill}
          icon="ti-building-community" title="Prime Assets" subtitle="High-performance properties in your active portfolio"
          action={<TextLink onClick={() => navigate('/landlord-portal/portfolio')}><span className="un2-hide-narrow">View Portfolio</span></TextLink>}
        >
          <div>
            {loading && [0, 1, 2].map(i => <AssetRow key={i} loading first={i === 0} />)}
            {!loading && primeAssets.length === 0 && (
              <EmptyState icon="ti-building" text="No active properties yet." />
            )}
            {shownAssets.map((prop, idx) => (
              <AssetRow
                key={prop.id || idx}
                first={idx === 0}
                image={propertyPlaceholder}
                name={prop.name}
                address={prop.address}
                units={prop.total_units}
                status={prop.badge === 'ELITE LISTING'
                  ? { tone: TONES2.purple, label: 'ELITE LISTING' }
                  : { tone: TONES2.success, label: prop.badge || 'STABILIZED' }}
                tag={mgmtBadgeFor(prop.management_tag)}
                paid
                metrics={[
                  { label: 'Occupancy', value: `${prop.occupancy_pct ?? 0}%`, color: C2.successStrong },
                  { label: 'Maintenance',
                    value: prop.maint_open > 0 ? `${prop.maint_open} Open` : 'Clear',
                    color: prop.maint_open > 0 ? C2.errorDark : C2.successStrong },
                ]}
                actions={<>
                  <button
                    type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...UI2.btnSm }}
                    onClick={prop.id ? () => navigate(`/landlord-portal/property/${prop.id}`) : undefined}
                  >
                    Details
                  </button>
                  <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnSm }} title="Message Tenants">
                    <i className="ti ti-message-2" aria-hidden="true" />
                    <span className="un2-label-full">Message Tenants</span>
                    <span className="un2-label-short">Message</span>
                  </button>
                </>}
              />
            ))}
          </div>

          {!loading && primeAssets.length > 0 && (
            <div style={UI2.cardFoot}>
              <span style={UI2.text.caption}>
                Showing top {shownAssets.length}{portfolio.total_properties ? ` of ${portfolio.total_properties}` : ''} properties
              </span>
              <TextLink onClick={() => navigate('/landlord-portal/portfolio')}>Manage all properties</TextLink>
            </div>
          )}
        </SectionCard>

        <SectionCard
          style={UI2.cardFill}
          icon="ti-chart-bar" title="Monthly Rent Collection" subtitle="Ledger tracking & recurring payments"
          action={<span className="un2-hide-narrow" style={UI2.pill(TONES2.neutral)}>{chartMonths.length} months</span>}
        >
          <div style={S.chartWrap}>
            <BarChart
              labels={chartMonths.map(d => d.label)}
              values={chartMonths.map(d => d.value)}
              formatValue={fmtMoney} formatTick={fmtK}
              ariaLabel="Monthly rent collection"
            />
          </div>

          <div style={UI2.subhead}>Recent payments</div>
          {!loading && payments.length === 0 && <div style={UI2.emptyInline}>No payments recorded yet.</div>}
          {payments.slice(0, 3).map((p, i) => (
            <ListRow
              key={p.id || i}
              style={i === 0 ? { borderTop: 'none' } : undefined}
              leading={<span className="un2-live-dot" style={UI2.dot(C2.success)} aria-hidden="true" />}
              title={p.tenant_name}
              meta={`${p.property_name || ''}${p.unit_ref ? ` · ${p.unit_ref}` : ''}`}
              trailing={<span style={UI2.amount()}>+{fmtCurrency(p.amount)}</span>}
            />
          ))}
        </SectionCard>
      </Grid>

      {/* ── OPERATIONS + DOCUMENTS + COMMUNICATION HUB ── */}
      <Grid layout="three">
        <SectionCard
          style={UI2.cardFill}
          icon="ti-tool" title="Open Operations" subtitle="Active maintenance & contractor reliability"
          badge={<span className="un2-live-dot" style={UI2.dot(C2.success)} aria-label="Live" />}
        >
          <div style={S.opsBody}>
            <MetricBar label="Vendor reliability" value="96%" pct={96} tone={TONES2.success} valueTone gradient />

            {!loading && ops.length === 0 && <div style={{ ...UI2.emptyInline, marginTop: SP2.lg }}>No open tickets.</div>}
            {ops.slice(0, 2).map((op, i) => {
              const tag = PRIORITY_TAG[op.priority] || PRIORITY_TAG.STANDARD;
              return (
                <div key={op.id || i} style={UI2.accentItem(tag.tone)}>
                  <div style={S.opHead}>
                    <span style={S.opTitle}>{op.title}</span>
                    <span style={UI2.tag(tag.tone)}>{tag.label}</span>
                  </div>
                  <div style={S.opMeta}>{op.property_name}{op.location_note ? ` · ${op.location_note}` : ''}</div>
                  <div style={S.opFoot}>
                    <span style={UI2.text.caption}>
                      {op.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}{op.time_ago ? ` · ${op.time_ago}` : ''}
                    </span>
                    <TextLink size="xs">{op.status === 'OPEN' ? 'Assign Vendor' : 'View Details'}</TextLink>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.analytics}>
            <div style={UI2.iconBox(SZ2.icon.sm, TONES2.primary)}><i className="ti ti-chart-bar" aria-hidden="true" /></div>
            <div style={{ ...UI2.minWidth0, flex: 1 }}>
              <div style={UI2.text.rowTitle}>Portfolio Analytics</div>
              <div style={UI2.text.caption}>Coming soon</div>
            </div>
            <i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />
          </div>
        </SectionCard>

        <SectionCard
          icon="ti-file-text" title="Recent Documents" subtitle="Leases, reports & filings"
          action={<TextLink>View All</TextLink>}
        >
          {DOCS.map((d, i) => (
            <ListRow
              key={d.name}
              style={i === 0 ? { borderTop: 'none' } : undefined}
              leading={<div style={UI2.iconBox(SZ2.icon.md, { soft: d.tone.tint, strong: d.tone.strong })}><i className={`ti ${d.icon}`} aria-hidden="true" /></div>}
              title={d.name}
              meta={d.meta}
              metaColor={d.metaCol}
              trailing={
                <button type="button" className="un2-raise" style={{ ...UI2.btn.icon(SZ2.control.sm), color: C2.textSecondary }} aria-label={`Download ${d.name}`}>
                  <i className="ti ti-download" aria-hidden="true" />
                </button>
              }
            />
          ))}
        </SectionCard>

        <SectionCard
          variant="dark" icon="ti-message-dots" title="Communication Hub"
          action={<span style={UI2.pill({ strong: C2.success }, { solid: true })}><span className="un2-live-dot" style={UI2.dot(C2.white)} aria-hidden="true" />Active</span>}
        >
          {MESSAGES.map(m => (
            <MessageItem key={m.from} from={m.from} fromColor={m.col} time={m.time}>{m.text}</MessageItem>
          ))}
          <button type="button" className="un2-btn" style={S.messenger}>
            <i className="ti ti-message-2" style={{ fontSize: FS2.lg }} aria-hidden="true" />
            Open Messenger
          </button>
        </SectionCard>
      </Grid>

      {/* ── TENANT PULSE + URBANNEST INTELLIGENCE ── */}
      <Grid layout="wideRight">
        <SectionCard
          icon="ti-users" title="Tenant Pulse" subtitle="Residents across your portfolio"
          action={<TextLink><span className="un2-hide-narrow">View all</span></TextLink>}
        >
          {!loading && tenants.length === 0 && <EmptyState illustration="people" text="No active tenants." />}
          {tenants.slice(0, 3).map((t, i) => (
            <ListRow
              key={i}
              variant="hover"
              leading={<div style={UI2.avatar(SZ2.icon.md, AVATAR2[i % AVATAR2.length])}>{initials(t.name)}</div>}
              title={t.name}
              meta={`${t.property_name} ${t.unit_ref ? `· ${t.unit_ref}` : ''}`}
              trailing={<span style={UI2.pill(TONES2.success)}>Active</span>}
            />
          ))}
        </SectionCard>

        <SectionCard
          as="section" icon="ti-sparkles" accentIcon title="UrbanNest Intelligence" subtitle="Signals from your portfolio and the local market"
          badge={<span style={UI2.pill(TONES2.primary)}>AI INSIGHTS</span>}
        >
          <div style={UI2.stack(LAYOUT2.gridGap)}>
            <InsightCard
              tone={TONES2.success} icon="ti-trending-up" title="Rent Trend Analysis"
              actionLabel="Review Market Comp"
              visual={rentSparkline.length > 0 ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Sparkline
                    labels={rentSparkline.map(d => d.month)}
                    values={rentSparkline.map(d => d.pct)}
                    min={Math.max(0, Math.min(...rentSparkline.map(d => d.pct)) - 5)} max={101}
                    formatValue={fmtPct} ariaLabel="Rent collection trend"
                  />
                </div>
              ) : (
                <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="lld-spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={CHART2.line} stopOpacity="0.28" /><stop offset="1" stopColor={CHART2.line} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 72 C30 70 45 62 70 64 C95 66 105 44 130 46 C150 48 160 30 178 22 L190 10 L200 10 L200 80 L0 80 Z" fill="url(#lld-spark)" />
                  <path d="M0 72 C30 70 45 62 70 64 C95 66 105 44 130 46 C150 48 160 30 178 22 L190 10" fill="none" stroke={CHART2.line} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
              )}
            >
              Chelsea 2-bed rents may rise 4.2% — review Emerald Gardens at renewal.
            </InsightCard>
            <InsightCard
              tone={TONES2.purple} icon="ti-alert-triangle" title="Maintenance Forecast"
              actionLabel="Schedule Preventive Audit"
              visual={<i className="ti ti-calendar-event" style={{ fontSize: SZ2.icon.lg, color: C2.purple, lineHeight: LH2.none }} aria-hidden="true" />}
            >
              Regent Plaza HVAC nears its 5-year limit — 15% failure risk this winter.
            </InsightCard>
          </div>
        </SectionCard>
      </Grid>

      <PageFooter />

    </PageShell>
  );
}
