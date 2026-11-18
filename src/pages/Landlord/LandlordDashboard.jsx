import React, { useState, useEffect } from 'react';
import {
  PageShell, Grid, HeroBanner, SectionCard, StatCard, PropertyListItem, InsightCard, CardWave,
  ListRow, EmptyState, MessageItem, PageFooter, BarChart, DonutChart, Sparkline,
} from '../../components/v2';
import {
  C2, TONES2, AVATAR2, CHART2,
  FS2, FW2, LH2,
  SP2, SZ2, LAYOUT2, pad, UI2,
} from '../../constants/v2';
import heroImage from '../../assets/v2/landlord/dashboard-hero.jpg';
import propertyPlaceholder from '../../assets/v2/landlord/property-placeholder.jpg';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Design System v2 — Landlord Dashboard ───────────────────────────────────
// Visual layer only. Data comes from GET /landlord/dashboard/ exactly as before:
//   landlord · portfolio · kpis · monthly_rent_chart · kpis.rent_collection_trend
//   prime_assets · open_operations · tenant_pulse · recent_payments
//
// Built from shared v2 pieces — no page-level spacing, sizes or grid columns:
//   PageShell (sidebar + topbar + section rhythm) · Grid (GRID2 layouts) · HeroBanner ·
//   StatCard · SectionCard · ListRow · EmptyState · MessageItem · Charts · PageFooter ·
//   UI2 / LAYOUT2 inside cards.

// ─── Card-internal styles specific to this page (tokens only) ────────────────
const S = {
  chartWrap: { position: 'relative', height: SZ2.chart },
  rentSide:  { ...UI2.stack(SP2.md), justifyContent: 'center', paddingLeft: SP2.lg, borderLeft: `${SZ2.hairline}px solid ${C2.border}` },
  rentLbl:   { ...UI2.text.label, ...UI2.truncate, maxWidth: SZ2.labelMax },

  occBody:   { display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: SP2.lg, flexWrap: 'wrap' },
  occTarget: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: LAYOUT2.inlineGap },

  opItem:    { ...UI2.tile, padding: pad(SP2.sm, SP2.md), marginBottom: LAYOUT2.rowGap },
  analytics: { ...UI2.tonePanel(TONES2.primary), ...UI2.row(SP2.md), marginTop: SP2.md, padding: pad(SP2.md, SP2.lg) },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
const fmtCurrency = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Management-mode badge (Session 39): gray = self, blue = PM-active, amber = PM-passive
function mgmtBadgeFor(tag) {
  if (tag === 'SELF')       return { tone: TONES2.neutral, label: 'SELF' };
  if (tag === 'PM_ACTIVE')  return { tone: TONES2.primary, label: 'PM · ACTIVE' };
  if (tag === 'PM_PASSIVE') return { tone: TONES2.warning, label: 'PM · PASSIVE' };
  return null;
}

const PRIORITY_TAG = {
  URGENT:   { tone: TONES2.error,   label: 'URGENT' },
  HIGH:     { tone: TONES2.error,   label: 'HIGH' },
  STANDARD: { tone: TONES2.neutral, label: 'STANDARD' },
  MEDIUM:   { tone: TONES2.warning, label: 'STANDARD' },
  LOW:      { tone: TONES2.neutral, label: 'STANDARD' },
};

const Arrow = () => <i className="ti ti-arrow-right" aria-hidden="true" />;

// Chart formatting for this page
const fmtK = v => (v === 0 ? '$0' : '$' + (v / 1000).toFixed(2) + 'K');
const fmtMoney = v => '$' + Number(v).toLocaleString();
const fmtPct = v => v + '%';
const DEFAULT_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordDashboard() {
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

  // ── Derived values from API (with safe fallbacks) ─────────────────────────
  const landlord      = data?.landlord      || {};
  const portfolio     = data?.portfolio     || {};
  const kpis          = data?.kpis          || {};
  const rentTrend     = data?.monthly_rent_chart || [];
  const rentSparkline = data?.kpis?.rent_collection_trend || [];
  const primeAssets   = data?.prime_assets  || [];
  const ops           = data?.open_operations || [];
  const tenants       = data?.tenant_pulse  || [];
  const payments      = data?.recent_payments || [];

  const landlordName   = landlord.name || 'Landlord';
  const avatarInitials = initials(landlordName);
  const latestPayment  = payments[0];
  const dash = v => (loading ? '—' : v);

  const KPIS = [
    { tone: TONES2.success, icon: 'ti-file-text',      pillIcon: 'ti-arrow-up', pill: '+5 this month',
      value: dash(kpis.new_leases_this_month ?? 0), name: 'Signed', label: 'New leases' },
    { tone: TONES2.primary, icon: 'ti-wallet',         pillIcon: null,          pill: 'On-track',
      value: dash(fmtCurrency(kpis.rent_collected_this_month ?? 0)), name: null, label: 'Rent collected' },
    { tone: TONES2.error,   icon: 'ti-alert-triangle', pillIcon: 'ti-arrow-up', pill: `Priority: ${kpis.priority_tickets ?? 0}`,
      value: dash(kpis.open_tickets ?? 0), name: 'Active', label: 'Open tickets' },
    { tone: TONES2.warning, icon: 'ti-calendar',       pillIcon: 'ti-arrow-up', pill: 'Next 30 days',
      value: dash(kpis.renewals_next_30_days ?? 0), name: 'Upcoming', label: 'Renewals' },
  ];

  const RENT_SUMMARY = [
    { tone: TONES2.primary, icon: 'ti-wallet',     val: dash(fmtCurrency(kpis.rent_collected_this_month ?? 0)), lbl: 'Collected' },
    { tone: TONES2.warning, icon: 'ti-percentage', val: dash(`${kpis.rent_collection_pct ?? 0}%`),              lbl: 'Collection rate' },
    { tone: TONES2.success, icon: 'ti-receipt',
      val: latestPayment ? `+${fmtCurrency(latestPayment.amount)}` : dash('$0.00'),
      lbl: latestPayment ? latestPayment.tenant_name : 'Latest payment',
      title: latestPayment ? `${latestPayment.tenant_name} · ${latestPayment.property_name}${latestPayment.unit_ref ? `, ${latestPayment.unit_ref}` : ''}` : undefined },
  ];

  // Recent Documents — static for now, wire to docs API when built
  const DOCS = [
    { tone: TONES2.primary, icon: 'ti-file-text',    name: 'Lease Agreement - #402', meta: 'Updated 2 days ago · 1.2MB' },
    { tone: TONES2.success, icon: 'ti-report-money', name: 'Q3 Financial Report',    meta: 'Aug 15, 2023 · 4.0MB' },
    { tone: TONES2.warning, icon: 'ti-shield-check', name: 'Insurance Certificate',  meta: 'Expires in 4 months', metaCol: C2.warningIcon },
  ];

  const MESSAGES = [
    { from: 'Estate Manager',   col: C2.skyOnDark, time: '14:20', text: '"The inspection for Emerald Gardens is finalized. Sending over the report now."' },
    { from: 'Maintenance Team', col: C2.gold,      time: '13:05', text: '"Vendor dispatched for Regent Plaza pressure leak. ETA 35 mins."' },
  ];

  return (
    <PageShell
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
      <HeroBanner
        eyebrow="Executive Profile"
        image={heroImage}
        title={loading
          ? <span className="un2-skel" style={UI2.skeleton(SZ2.skeletonTitle, SZ2.control.sm, { onDark: true })} />
          : 'Welcome back,'}
        titleAccent={loading ? null : landlordName}
        subtitle={landlord.status || 'Property Owner · Active Portfolio'}
        subtitleIcon="ti-user-circle"
        stats={[
          { icon: 'ti-building', label: 'Properties',     value: portfolio.total_properties ?? '—' },
          { icon: 'ti-stack-2',  label: 'Total Units',    value: portfolio.total_units      ?? '—' },
          { icon: 'ti-users',    label: 'Active Tenants', value: portfolio.active_tenants   ?? '—' },
        ]}
        actions={<>
          <button className="un2-btn" style={UI2.btn.light}>
            <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" />
            Add maintenance request
          </button>
          <button className="un2-ghost" style={UI2.btn.ghostOnDark}>
            <i className="ti ti-message-dots" style={UI2.btnIcon} aria-hidden="true" />
            Message PM
          </button>
        </>}
      />

      {/* ── KPI CARDS ── */}
      <Grid layout="four">
        {KPIS.map(k => <StatCard key={k.label} {...k} />)}
      </Grid>

      {/* ── RENT COLLECTION + OCCUPANCY ── */}
      <Grid layout="wideLeft">
        <SectionCard
          icon="ti-building-bank" title="Rent Collection"
          action={<span style={UI2.pill(TONES2.success)}><i className="ti ti-trending-up" aria-hidden="true" />+2.4% from last quarter</span>}
        >
          <Grid layout="aside" as="div">
            <div style={S.chartWrap}>
              <BarChart
                labels={rentTrend.length ? rentTrend.map(d => d.month) : DEFAULT_MONTHS}
                values={rentTrend.length ? rentTrend.map(d => d.amount) : DEFAULT_MONTHS.map(() => 0)}
                formatValue={fmtMoney} formatTick={fmtK}
                ariaLabel="Monthly rent collection"
              />
            </div>
            <div style={S.rentSide}>
              {RENT_SUMMARY.map(r => (
                <div key={r.lbl + r.icon} style={UI2.row(LAYOUT2.rowGap)}>
                  <div style={UI2.iconBox(SZ2.icon.md, { soft: r.tone.tint, strong: r.tone.strong }, { round: true })}>
                    <i className={`ti ${r.icon}`} aria-hidden="true" />
                  </div>
                  <div style={UI2.minWidth0}>
                    <div style={UI2.text.stat}>{r.val}</div>
                    <div style={S.rentLbl} title={r.title}>{r.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </Grid>
        </SectionCard>

        <SectionCard icon="ti-clipboard-check" title="Occupancy Rate" decoration={<CardWave />}>
          <div style={S.occBody}>
            <DonutChart value={loading ? 0 : (kpis.occupancy_rate ?? 0)} label="Leased" />
            <div style={S.occTarget}>
              <div style={{ ...UI2.row(LAYOUT2.inlineGap), ...UI2.text.label, fontSize: FS2.base }}>
                <i className="ti ti-target-arrow" style={{ fontSize: FS2.xl, color: C2.primary }} aria-hidden="true" /> Target
              </div>
              <div style={{ ...UI2.text.number, fontSize: FS2.xxxl }}>96%</div>
              <span style={{ ...UI2.pill(TONES2.success), marginTop: SP2.sm }}>
                <i className="ti ti-calendar-check" aria-hidden="true" /> By year end
              </span>
            </div>
          </div>
        </SectionCard>
      </Grid>

      {/* ── PRIME ASSETS + OPEN OPERATIONS ── */}
      <Grid layout="wideLeft">
        <SectionCard
          icon="ti-building-community" title="Prime Assets" subtitle="High-performance properties in your active portfolio."
          action={
            <button className="un2-link" style={UI2.btn.link} onClick={() => window.location.href = '/landlord-portal/portfolio'}>
              View Portfolio Analytics <Arrow />
            </button>
          }
        >
          {loading && [0, 1].map(i => <PropertyListItem key={i} loading />)}
          {!loading && primeAssets.length === 0 && (
            <div style={{ ...UI2.empty, borderTop: `${SZ2.hairline}px solid ${C2.border}` }}>No active properties yet.</div>
          )}
          {primeAssets.map((prop, idx) => (
            <PropertyListItem
              key={prop.id || idx}
              image={propertyPlaceholder}
              name={prop.name}
              address={prop.address}
              units={prop.total_units}
              status={prop.badge === 'ELITE LISTING'
                ? { tone: TONES2.warning, label: 'ELITE LISTING' }
                : { tone: TONES2.success, label: prop.badge || 'STABILIZED' }}
              tag={mgmtBadgeFor(prop.management_tag)}
              paid
              metrics={[
                { icon: 'ti-home-check', label: 'Occupancy', value: `${prop.occupancy_pct ?? 0}%` },
                { icon: 'ti-tool', label: 'Maintenance',
                  value: prop.maint_open > 0 ? `${prop.maint_open} Open` : 'Clear',
                  color: prop.maint_open > 0 ? C2.errorDark : C2.successStrong },
              ]}
              actions={<>
                <button className="un2-btn" style={{ ...UI2.btn.soft, ...UI2.btnSm }}>
                  <i className="ti ti-eye" aria-hidden="true" /> Details
                </button>
                <button className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnSm }}>
                  <i className="ti ti-message-2" aria-hidden="true" /> Message Tenants
                </button>
              </>}
            />
          ))}
        </SectionCard>

        <SectionCard icon="ti-tool" title="Open Operations" subtitle="Active maintenance & contractor reliability">
          {!loading && ops.length === 0 && <div style={UI2.emptyInline}>No open tickets.</div>}
          {ops.slice(0, 2).map((op, i) => {
            const tag = PRIORITY_TAG[op.priority] || PRIORITY_TAG.STANDARD;
            return (
              <div key={op.id || i} className="un2-raise" style={S.opItem}>
                <div style={UI2.rowBetween()}>
                  <span style={UI2.tag(tag.tone)}>{tag.label}</span>
                  <span style={UI2.text.caption}>{op.time_ago}</span>
                </div>
                <div style={{ ...UI2.text.title, margin: pad(SP2.sm, 0, SP2.xxs) }}>{op.title}</div>
                <div style={UI2.text.meta}>{op.property_name}{op.location_note ? ` · ${op.location_note}` : ''}</div>
                <div style={{ ...UI2.rowBetween(), marginTop: LAYOUT2.rowGap }}>
                  <span style={{ ...UI2.pill(TONES2.neutral), fontWeight: FW2.medium }}>{op.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}</span>
                  <button className="un2-link" style={UI2.btn.link}>
                    {op.status === 'OPEN' ? 'Assign Vendor' : 'View Details'} <Arrow />
                  </button>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: SP2.sm }}>
            <div style={{ ...UI2.rowBetween(), alignItems: 'baseline' }}>
              <span style={UI2.text.title}>Vendor Reliability</span>
              <span style={{ ...UI2.text.stat, color: C2.successStrong }}>96%</span>
            </div>
            <div style={{ ...UI2.progressTrack, marginTop: LAYOUT2.rowGap }}><div style={UI2.progressFill(96)} /></div>
          </div>
          <div style={S.analytics}>
            <i className="ti ti-chart-bar" style={{ fontSize: FS2.display, color: C2.primary }} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <div style={UI2.text.titleLg}>Portfolio Analytics</div>
              <div style={{ ...UI2.text.label, marginTop: SP2.xxs }}>Portfolio analytics coming soon</div>
            </div>
            <i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />
          </div>
        </SectionCard>
      </Grid>

      {/* ── TENANT PULSE + DOCUMENTS + COMMUNICATION HUB ── */}
      <Grid layout="three">
        <SectionCard
          icon="ti-users" plainIcon title="Tenant Pulse"
          action={<i className="ti ti-chevron-right" style={{ ...UI2.chevron, marginTop: SP2.sm }} aria-hidden="true" />}
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
          icon="ti-file-text" title="Recent Documents"
          action={<button className="un2-link" style={{ ...UI2.btn.link, marginTop: SP2.sm }}>View All <Arrow /></button>}
        >
          {DOCS.map(d => (
            <ListRow
              key={d.name}
              leading={<div style={UI2.iconBox(SZ2.icon.md, { soft: d.tone.tint, strong: d.tone.strong })}><i className={`ti ${d.icon}`} aria-hidden="true" /></div>}
              title={d.name}
              meta={d.meta}
              metaColor={d.metaCol}
              trailing={
                <button style={{ ...UI2.btn.icon(SZ2.control.sm), color: C2.textSecondary }} aria-label={`Download ${d.name}`}>
                  <i className="ti ti-download" aria-hidden="true" />
                </button>
              }
            />
          ))}
        </SectionCard>

        <SectionCard
          variant="dark" icon="ti-message-dots" title="Communication Hub"
          action={<span style={UI2.pill({ strong: C2.success }, { solid: true })}>Active</span>}
        >
          {MESSAGES.map(m => (
            <MessageItem key={m.from} from={m.from} fromColor={m.col} time={m.time}>{m.text}</MessageItem>
          ))}
          <button className="un2-btn" style={{ ...UI2.btn.light, width: '100%', minHeight: SZ2.control.lg, marginTop: 'auto' }}>
            <i className="ti ti-message-2" style={{ fontSize: FS2.lg }} aria-hidden="true" />
            Open Messenger
          </button>
        </SectionCard>
      </Grid>

      {/* ── URBANNEST INTELLIGENCE ── */}
      <SectionCard
        as="section" icon="ti-sparkles" accentIcon title="UrbanNest Intelligence"
        badge={<span style={UI2.pill(TONES2.primary)}>AI INSIGHTS</span>}
      >
        <Grid layout="two" as="div">
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
            Local market data suggests a 4.2% potential increase for 2-bedroom units in Chelsea.
            Consider adjusting Emerald Gardens rates during next renewal cycle.
          </InsightCard>
          <InsightCard
            tone={TONES2.warning} icon="ti-alert-triangle" title="Maintenance Forecast" titleColor={C2.warningDark}
            actionLabel="Schedule Preventive Audit"
            visual={<i className="ti ti-calendar-event" style={{ fontSize: SZ2.icon.lg, color: C2.gold, lineHeight: LH2.none }} aria-hidden="true" />}
          >
            HVAC units in The Regent Plaza (South Wing) are approaching their 5-year efficiency limit.
            Predicted failure probability increases to 15% this winter.
          </InsightCard>
        </Grid>
      </SectionCard>

      <PageFooter />

    </PageShell>
  );
}
