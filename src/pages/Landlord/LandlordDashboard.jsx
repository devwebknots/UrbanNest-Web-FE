import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { PageShell, HeroBanner, SectionCard, StatCard } from '../../components/v2';
import {
  C2, TONES2, AVATAR2, CHART2, ILLUS2, G2, R2, SH2,
  F2, FS2, FW2, LH2, LS2, T2,
  SP2, SZ2, LAYOUT2, pad, UI2,
} from '../../constants/v2';
import heroImage from '../../assets/v2/landlord/dashboard-hero.jpg';
import propertyPlaceholder from '../../assets/v2/landlord/property-placeholder.jpg';

Chart.register(...registerables);

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Design System v2 — Landlord Dashboard ───────────────────────────────────
// Visual layer only. Data comes from GET /landlord/dashboard/ exactly as before:
//   landlord · portfolio · kpis · monthly_rent_chart · kpis.rent_collection_trend
//   prime_assets · open_operations · tenant_pulse · recent_payments
//
// Built from shared v2 pieces — no page-level spacing of its own:
//   PageShell (sidebar + topbar + section rhythm) · HeroBanner · StatCard ·
//   SectionCard · un2-grid-* section grids · UI2 / LAYOUT2 inside cards.

// ─── Card-internal styles specific to this page (tokens only) ────────────────
const S = {
  chartWrap: { position: 'relative', height: SZ2.chart },
  rentSide:  { ...UI2.stack(SP2.lg), justifyContent: 'center', paddingLeft: SP2.xl, borderLeft: `1px solid ${C2.border}` },
  rentLbl:   { ...UI2.text.label, ...UI2.truncate, maxWidth: 140 },

  occBody:   { display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: SP2.lg, flexWrap: 'wrap' },
  occTarget: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: LAYOUT2.inlineGap },

  propRow:   { display: 'grid', gridTemplateColumns: `${SZ2.thumb.w}px minmax(0,1fr) auto`, gap: SP2.lg, alignItems: 'center', padding: pad(SP2.lg, SP2.xs), borderTop: `1px solid ${C2.border}` },
  propMeta:  { display: 'flex', alignItems: 'center', gap: LAYOUT2.inlineGap, flexWrap: 'wrap', fontSize: FS2.sm, color: C2.textSecondary, margin: pad(SP2.sm, 0, SP2.md) },

  opItem:    { ...UI2.tile, padding: pad(SP2.md, SP2.lg), marginBottom: LAYOUT2.rowGap },
  analytics: { ...UI2.tonePanel(TONES2.primary), ...UI2.row(SP2.lg), marginTop: SP2.xl },

  commMsg:   { padding: pad(SP2.md, SP2.lg), borderRadius: R2.lg, background: C2.onDark.surfaceSoft, border: `1px solid ${C2.onDark.borderSoft}`, marginBottom: LAYOUT2.rowGap },
  commFrom:  { fontSize: FS2.xs, fontWeight: FW2.bold, letterSpacing: LS2.wide, textTransform: 'uppercase' },
  commText:  { fontSize: FS2.sm, lineHeight: LH2.body, color: C2.onDark.textSoft, marginTop: SP2.xs },

  intelCard: (t) => ({ ...UI2.tonePanel(t), minHeight: SZ2.panelMin }),
  intelHead: { ...UI2.row(LAYOUT2.rowGap), marginBottom: LAYOUT2.rowGap },
  intelBody: { ...T2.body, position: 'relative', maxWidth: '72%', marginBottom: LAYOUT2.rowGap },
  intelLink: (col) => ({ ...UI2.btn.link, position: 'relative', fontWeight: FW2.bold, letterSpacing: LS2.wide, textTransform: 'uppercase', color: col }),

  footer:    { textAlign: 'center', ...UI2.text.caption, padding: pad(SP2.lg, 0, SP2.xs), borderTop: `1px solid ${C2.border}` },
  footLinks: { marginTop: SP2.sm, display: 'flex', justifyContent: 'center', gap: SP2.lg },
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

// ─── Chart components (same data inputs as before) ───────────────────────────
function RentSparkline({ data = [] }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const labels = data.map(d => d.month);
    const values = data.map(d => d.pct);
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets: [{ data: values, borderColor: CHART2.line, borderWidth: 2.5, pointRadius: 0, fill: true, backgroundColor: CHART2.lineFill, tension: 0.4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => v.raw + '%' } } },
        scales: { x: { display: false }, y: { display: false, min: Math.max(0, Math.min(...values) - 5), max: 101 } },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);
  return <canvas ref={ref} role="img" aria-label="Rent collection trend">Rent collection trend</canvas>;
}

function OccupancyDonut({ value = 0 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: { datasets: [{ data: [value, 100 - value], backgroundColor: [CHART2.barActive, CHART2.track], borderWidth: 0, borderRadius: value > 0 && value < 100 ? R2.md : 0 }] },
      options: { responsive: false, cutout: '80%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => v.raw + '%' } } } },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [value]);
  return (
    <div style={{ position: 'relative', width: SZ2.donut, height: SZ2.donut }}>
      <canvas ref={ref} width={SZ2.donut} height={SZ2.donut} role="img" aria-label={`Occupancy ${value}%`}>{value}% occupied</canvas>
      <div style={{ ...UI2.center, position: 'absolute', inset: 0, flexDirection: 'column', pointerEvents: 'none' }}>
        <div style={{ ...UI2.text.number, fontSize: FS2.display }}>{value}%</div>
        <div style={{ ...UI2.text.label, fontSize: FS2.base, marginTop: SP2.sm }}>Leased</div>
      </div>
    </div>
  );
}

function RentBarChart({ data = [] }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const labels  = data.length ? data.map(d => d.month)  : ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const amounts = data.length ? data.map(d => d.amount) : [0, 0, 0, 0, 0, 0];
    const maxVal  = Math.max(...amounts);
    const bg = amounts.map(a => (a === maxVal && maxVal > 0) ? CHART2.barActive : CHART2.bar);
    const tickFont = { size: FS2.xs, family: F2.body };
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: { labels, datasets: [{ data: amounts, backgroundColor: bg, borderRadius: { topLeft: R2.sm, topRight: R2.sm }, borderSkipped: false, barPercentage: 0.62, minBarLength: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => '$' + Number(v.raw).toLocaleString() } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: tickFont, color: CHART2.tick } },
          y: {
            beginAtZero: true, suggestedMax: maxVal > 0 ? undefined : 1000,
            border: { display: false }, grid: { color: CHART2.grid },
            ticks: { font: tickFont, color: CHART2.tick, maxTicksLimit: 6, callback: v => v === 0 ? '$0' : '$' + (v / 1000).toFixed(2) + 'K' },
          },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);
  return <canvas ref={ref} role="img" aria-label="Monthly rent collection">Monthly rent bar chart</canvas>;
}

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
          ? <span className="un2-skel" style={{ display: 'inline-block', width: 300, height: SZ2.control.sm, opacity: 0.25 }} />
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
          <button className="un2-btn" style={UI2.btn.success}>
            <i className="ti ti-plus" style={{ fontSize: FS2.md }} aria-hidden="true" />
            Add maintenance request
          </button>
          <button className="un2-ghost" style={UI2.btn.ghostOnDark}>
            <i className="ti ti-message-dots" style={{ fontSize: FS2.md }} aria-hidden="true" />
            Message PM
          </button>
        </>}
      />

      {/* ── KPI CARDS ── */}
      <section className="un2-grid-4">
        {KPIS.map(k => <StatCard key={k.label} {...k} />)}
      </section>

      {/* ── RENT COLLECTION + OCCUPANCY ── */}
      <section className="un2-grid-wide-left">
        <SectionCard
          icon="ti-building-bank" title="Rent Collection"
          action={<span style={UI2.pill(TONES2.success)}><i className="ti ti-trending-up" aria-hidden="true" />+2.4% from last quarter</span>}
        >
          <div className="un2-grid-aside">
            <div style={S.chartWrap}><RentBarChart data={rentTrend} /></div>
            <div style={S.rentSide}>
              {RENT_SUMMARY.map(r => (
                <div key={r.lbl + r.icon} style={UI2.row(LAYOUT2.rowGap)}>
                  <div style={UI2.iconBox(SZ2.icon.md, { soft: r.tone.tint, strong: r.tone.strong }, { round: true })}>
                    <i className={`ti ${r.icon}`} aria-hidden="true" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={UI2.text.stat}>{r.val}</div>
                    <div style={S.rentLbl} title={r.title}>{r.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon="ti-clipboard-check" title="Occupancy Rate">
          <div style={S.occBody}>
            <OccupancyDonut value={loading ? 0 : (kpis.occupancy_rate ?? 0)} />
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
      </section>

      {/* ── PRIME ASSETS + OPEN OPERATIONS ── */}
      <section className="un2-grid-split">
        <SectionCard
          icon="ti-building-community" title="Prime Assets" subtitle="High-performance properties in your active portfolio."
          action={
            <button className="un2-link" style={UI2.btn.link} onClick={() => window.location.href = '/landlord-portal/portfolio'}>
              View Portfolio Analytics <Arrow />
            </button>
          }
        >
          {loading && [0, 1].map(i => (
            <div key={i} style={S.propRow}>
              <img src={propertyPlaceholder} alt="" style={{ ...UI2.thumb, opacity: 0.6 }} />
              <div style={UI2.stack(LAYOUT2.rowGap)}>
                <div className="un2-skel" style={{ width: 180, height: SP2.lg }} />
                <div className="un2-skel" style={{ width: 260, height: SP2.md }} />
                <div className="un2-skel" style={{ width: 200, height: SZ2.control.sm }} />
              </div>
              <div />
            </div>
          ))}
          {!loading && primeAssets.length === 0 && (
            <div style={{ ...UI2.empty, borderTop: `1px solid ${C2.border}` }}>No active properties yet.</div>
          )}
          {primeAssets.map((prop, idx) => {
            const badge = prop.badge === 'ELITE LISTING'
              ? { tone: TONES2.warning, label: 'ELITE LISTING' }
              : { tone: TONES2.success, label: prop.badge || 'STABILIZED' };
            const mgmtBadge = mgmtBadgeFor(prop.management_tag);
            return (
              <div key={prop.id || idx} style={S.propRow}>
                <img src={propertyPlaceholder} alt="" style={UI2.thumb} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...UI2.row(LAYOUT2.inlineGap), flexWrap: 'wrap', marginBottom: SP2.sm }}>
                    <span style={UI2.tag(badge.tone)}>{badge.label}</span>
                    {mgmtBadge && <span style={UI2.tag(mgmtBadge.tone)}>{mgmtBadge.label}</span>}
                  </div>
                  <div style={{ ...UI2.row(LAYOUT2.inlineGap), ...UI2.text.titleLg }}>
                    {prop.name}
                    <span style={{ ...UI2.row(SP2.xs), fontSize: FS2.sm, fontWeight: FW2.semibold, color: C2.successDark }}>
                      <i className="ti ti-circle-check" aria-hidden="true" /> Paid
                    </span>
                  </div>
                  <div style={{ ...UI2.text.meta, marginTop: SP2.xxs }}>{prop.address}{prop.total_units ? ` · ${prop.total_units} Units` : ''}</div>
                  <div style={S.propMeta}>
                    <span>Occupancy <strong style={{ color: C2.textPrimary }}>{prop.occupancy_pct ?? 0}%</strong></span>
                    <span style={{ color: C2.textMuted }}>·</span>
                    <span>
                      Maintenance{' '}
                      <strong style={{ color: prop.maint_open > 0 ? C2.errorDark : C2.successStrong }}>
                        {prop.maint_open > 0 ? `${prop.maint_open} Open` : 'Clear'}
                      </strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: LAYOUT2.inlineGap, flexWrap: 'wrap' }}>
                    <button className="un2-raise" style={{ ...UI2.btn.outline, minHeight: SZ2.control.sm, padding: pad(SP2.xs, SP2.xl) }}>Details</button>
                    <button className="un2-btn" style={{ ...UI2.btn.dark, minHeight: SZ2.control.sm, padding: pad(SP2.xs, SP2.lg) }}>Message Tenants</button>
                  </div>
                </div>
                <button className="un2-raise" style={UI2.btn.iconOutline()} aria-label="More actions"><i className="ti ti-dots-vertical" aria-hidden="true" /></button>
              </div>
            );
          })}
        </SectionCard>

        <SectionCard icon="ti-tool" title="Open Operations" subtitle="Active maintenance & contractor reliability">
          {!loading && ops.length === 0 && <div style={{ ...UI2.empty, padding: pad(SP2.xs, 0, SP2.md), textAlign: 'left' }}>No open tickets.</div>}
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
            <i className="ti ti-chevron-right" style={{ fontSize: FS2.xl, color: C2.textSecondary }} aria-hidden="true" />
          </div>
        </SectionCard>
      </section>

      {/* ── TENANT PULSE + DOCUMENTS + COMMUNICATION HUB ── */}
      <section className="un2-grid-3">
        <SectionCard
          icon="ti-users" plainIcon title="Tenant Pulse"
          action={<i className="ti ti-chevron-right" style={{ fontSize: FS2.xl, color: C2.textSecondary, marginTop: SP2.sm }} aria-hidden="true" />}
        >
          {!loading && tenants.length === 0 && (
            <div style={{ ...UI2.center, ...UI2.stack(LAYOUT2.rowGap), minHeight: SZ2.emptyMin }}>
              <svg width="140" height="74" viewBox="0 0 140 74" aria-hidden="true">
                <circle cx="36" cy="26" r="11" fill={ILLUS2.personBack} /><path d="M14 66c0-14 10-22 22-22s22 8 22 22z" fill={ILLUS2.personBackBody} />
                <circle cx="104" cy="26" r="11" fill={ILLUS2.personBack} /><path d="M82 66c0-14 10-22 22-22s22 8 22 22z" fill={ILLUS2.personBackBody} />
                <circle cx="70" cy="18" r="14" fill={ILLUS2.personFront} /><path d="M42 70c0-18 12-28 28-28s28 10 28 28z" fill={ILLUS2.personFrontBody} />
              </svg>
              <div style={{ ...UI2.text.label, fontSize: FS2.md }}>No active tenants.</div>
            </div>
          )}
          {tenants.slice(0, 3).map((t, i) => (
            <div key={i} className="un2-row-hover" style={{ ...UI2.row(LAYOUT2.rowGap), padding: pad(SP2.md, SP2.sm), borderRadius: R2.md }}>
              <div style={UI2.avatar(SZ2.icon.md, AVATAR2[i % AVATAR2.length])}>{initials(t.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={UI2.text.title}>{t.name}</div>
                <div style={UI2.text.meta}>{t.property_name} {t.unit_ref ? `· ${t.unit_ref}` : ''}</div>
              </div>
              <span style={{ ...UI2.pill(TONES2.success), marginLeft: 'auto' }}>Active</span>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          icon="ti-file-text" title="Recent Documents"
          action={<button className="un2-link" style={{ ...UI2.btn.link, marginTop: SP2.sm }}>View All <Arrow /></button>}
        >
          {DOCS.map(d => (
            <div key={d.name} style={UI2.listRow}>
              <div style={UI2.iconBox(SZ2.icon.md, { soft: d.tone.tint, strong: d.tone.strong })}><i className={`ti ${d.icon}`} aria-hidden="true" /></div>
              <div style={{ minWidth: 0 }}>
                <div style={UI2.text.title}>{d.name}</div>
                <div style={{ ...UI2.text.meta, ...(d.metaCol ? { color: d.metaCol } : {}) }}>{d.meta}</div>
              </div>
              <button style={{ ...UI2.btn.icon(SZ2.control.sm), marginLeft: 'auto', color: C2.textSecondary }} aria-label={`Download ${d.name}`}>
                <i className="ti ti-download" aria-hidden="true" />
              </button>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          variant="dark" icon="ti-message-dots" title="Communication Hub"
          action={<span style={UI2.pill({ strong: C2.success }, { solid: true })}>Active</span>}
        >
          {MESSAGES.map(m => (
            <div key={m.from} style={S.commMsg}>
              <div style={UI2.rowBetween()}>
                <span style={{ ...S.commFrom, color: m.col }}>{m.from}</span>
                <span style={{ fontSize: FS2.xs, color: C2.onDark.textFaint }}>{m.time}</span>
              </div>
              <div style={S.commText}>{m.text}</div>
            </div>
          ))}
          <button className="un2-btn" style={{ ...UI2.btn.success, width: '100%', minHeight: SZ2.control.lg, marginTop: 'auto' }}>
            <i className="ti ti-message-2" style={{ fontSize: FS2.lg }} aria-hidden="true" />
            Open Messenger
          </button>
        </SectionCard>
      </section>

      {/* ── URBANNEST INTELLIGENCE ── */}
      <SectionCard as="section" title={null}>
        <div style={{ ...UI2.row(LAYOUT2.rowGap), marginBottom: LAYOUT2.cardHeaderGap }}>
          <div style={{ ...UI2.iconBox(SZ2.icon.md, TONES2.primary, { solid: true }), background: G2.primaryButton, boxShadow: SH2.primary }}>
            <i className="ti ti-sparkles" aria-hidden="true" />
          </div>
          <div style={UI2.cardTitle}>UrbanNest Intelligence</div>
          <span style={UI2.pill(TONES2.primary)}>AI INSIGHTS</span>
        </div>
        <div className="un2-grid-2">
          <div style={S.intelCard(TONES2.success)}>
            <div style={S.intelHead}>
              <div style={UI2.iconBox(SZ2.icon.sm, TONES2.success, { solid: true })}><i className="ti ti-trending-up" aria-hidden="true" /></div>
              <div style={{ ...UI2.text.titleLg, fontWeight: FW2.bold }}>Rent Trend Analysis</div>
            </div>
            <div style={S.intelBody}>
              Local market data suggests a 4.2% potential increase for 2-bedroom units in Chelsea.
              Consider adjusting Emerald Gardens rates during next renewal cycle.
            </div>
            <button className="un2-link" style={S.intelLink(C2.successDark)}>Review Market Comp <Arrow /></button>
            <div style={{ position: 'absolute', right: SP2.md, bottom: SP2.md, width: '34%', height: SZ2.icon.lg + SZ2.icon.sm }}>
              {rentSparkline.length > 0 ? (
                <RentSparkline data={rentSparkline} />
              ) : (
                <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="lld-spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={CHART2.line} stopOpacity="0.28" /><stop offset="1" stopColor={CHART2.line} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 72 C30 70 45 62 70 64 C95 66 105 44 130 46 C150 48 160 30 178 22 L190 10 L200 10 L200 80 L0 80 Z" fill="url(#lld-spark)" />
                  <path d="M0 72 C30 70 45 62 70 64 C95 66 105 44 130 46 C150 48 160 30 178 22 L190 10" fill="none" stroke={CHART2.line} strokeWidth="3" strokeLinecap="round" />
                  <circle cx="190" cy="10" r="5" fill={CHART2.line} />
                </svg>
              )}
            </div>
          </div>
          <div style={S.intelCard(TONES2.warning)}>
            <div style={S.intelHead}>
              <div style={UI2.iconBox(SZ2.icon.sm, TONES2.warning, { solid: true })}><i className="ti ti-alert-triangle" aria-hidden="true" /></div>
              <div style={{ ...UI2.text.titleLg, fontWeight: FW2.bold, color: C2.warningDark }}>Maintenance Forecast</div>
            </div>
            <div style={S.intelBody}>
              HVAC units in The Regent Plaza (South Wing) are approaching their 5-year efficiency limit.
              Predicted failure probability increases to 15% this winter.
            </div>
            <button className="un2-link" style={S.intelLink(C2.warningIcon)}>Schedule Preventive Audit <Arrow /></button>
            {/* Decorative illustration icon — intentionally larger than the type scale */}
            <i className="ti ti-calendar-event" style={{ position: 'absolute', right: SP2.xxl, bottom: SP2.xxl, fontSize: SZ2.icon.lg * 1.5, color: C2.gold, opacity: 0.9 }} aria-hidden="true" />
          </div>
        </div>
      </SectionCard>

      {/* Footer */}
      <footer style={S.footer}>
        © 2023 UrbanNest Property Management. All Rights Reserved.
        <div style={S.footLinks}>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          <span style={{ cursor: 'pointer' }}>Global Compliance</span>
        </div>
      </footer>

    </PageShell>
  );
}
