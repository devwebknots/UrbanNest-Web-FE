import React, { useState, useEffect, useRef, useContext } from 'react';
import { Chart, registerables } from 'chart.js';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';

Chart.register(...registerables);

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Color constants (Figma-matched) Constant C & F from 'landlordTokens'─────────────────────────────────────────


// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  shell:      { display:'flex', height:'100vh', fontFamily:F.sans, background:C.pageBg, overflow:'hidden' },
  nav:        { width:164, minWidth:164, background:C.navBg, display:'flex', flexDirection:'column', flexShrink:0 },
  navLogo:    { padding:'20px 16px 14px', color:'#fff', fontSize:15, fontWeight:700, letterSpacing:0.2 },
  navLogoSub: { display:'block', fontSize:9, color:'#3d6a9a', fontWeight:400, letterSpacing:1.2, textTransform:'uppercase', marginTop:2 },
  navSection: { flex:1, paddingTop:4 },
  navItem: a => ({
    display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
    color: a ? C.navActive : C.navText, fontSize:12.5, fontWeight: a ? 500 : 400,
    cursor:'pointer', userSelect:'none',
    borderLeft: a ? `3px solid ${C.navBorder}` : '3px solid transparent',
    background: a ? 'rgba(255,255,255,0.07)' : 'transparent',
  }),
  navIcon:    { fontSize:15, width:16, flexShrink:0 },
  navBottom:  { padding:'12px 0', borderTop:'1px solid rgba(255,255,255,0.07)' },
  navAdd:     { margin:'10px 12px 4px', background:C.blue, color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', fontSize:11.5, fontWeight:500, cursor:'pointer', width:'calc(100% - 24px)', display:'flex', alignItems:'center', gap:6, justifyContent:'center', fontFamily:F.sans },
  main:       { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar:     { background:C.topbarBg, borderBottom:`1px solid ${C.topbarBdr}`, padding:'0 24px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  topbarTitle:{ fontSize:14, fontWeight:600, color:C.txtPrimary, letterSpacing:0.1 },
  topbarRight:{ display:'flex', alignItems:'center', gap:10 },
  iconBtn:    { width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:C.txtSec, cursor:'pointer', background:'transparent', border:'none', fontSize:16 },
  avatar:     { width:32, height:32, borderRadius:'50%', background:C.navBg, color:'#fff', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  content:    { flex:1, overflowY:'auto', padding:'20px 24px 32px' },
  topRow:     { display:'grid', gridTemplateColumns:'1.45fr 1fr 1fr', gap:16, marginBottom:16 },
  heroCard:   { background:C.heroBg, borderRadius:12, padding:'20px 22px', color:'#fff', position:'relative', overflow:'hidden' },
  epBadge:    { background:C.heroBadgeBg, color:C.heroBadgeTx, fontSize:9.5, fontWeight:600, padding:'3px 9px', borderRadius:4, letterSpacing:0.6, textTransform:'uppercase', display:'inline-block', marginBottom:10 },
  heroName:   { fontSize:22, fontWeight:700, color:'#fff', marginBottom:4, letterSpacing:-0.3 },
  heroSub:    { fontSize:11.5, color:C.heroSubTx, display:'flex', alignItems:'center', gap:5, marginBottom:18 },
  heroStats:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 },
  hStat:      { background:C.heroStatBg, borderRadius:6, padding:'8px 10px' },
  hStatLbl:   { fontSize:9, color:'#4a6d8c', fontWeight:500, letterSpacing:0.6, textTransform:'uppercase', marginBottom:3 },
  hStatVal:   { fontSize:20, fontWeight:700, color:'#fff', lineHeight:1 },
  heroBtns:   { display:'flex', gap:8 },
  btnTeal:    { background:C.btnTeal, color:'#fff', border:'none', borderRadius:6, padding:'8px 13px', fontSize:11.5, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:F.sans },
  btnGhost:   { background:'rgba(255,255,255,0.09)', color:'#fff', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'8px 13px', fontSize:11.5, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:F.sans },
  kpiCard:    { background:C.cardBg, borderRadius:12, border:`1px solid ${C.cardBdr}`, padding:'18px 20px', display:'flex', flexDirection:'column' },
  kpiLabel:   { fontSize:10, color:C.txtMuted, fontWeight:500, letterSpacing:0.7, textTransform:'uppercase', marginBottom:6 },
  kpiBig:     { fontSize:34, fontWeight:700, color:C.txtPrimary, lineHeight:1, marginBottom:4, letterSpacing:-0.5 },
  kpiSub:     { fontSize:11 },
  kpiChartWrap:{ flex:1, position:'relative', marginTop:10, minHeight:64 },
  statRow:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
  statCard:   { background:C.cardBg, border:`1px solid ${C.cardBdr}`, borderRadius:10, padding:'14px 16px 16px' },
  statBadge: (bg,col) => ({ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:4, background:bg, color:col, marginBottom:10 }),
  statNum:    { fontSize:22, fontWeight:700, color:C.txtPrimary, lineHeight:1, marginBottom:3 },
  statLbl:    { fontSize:11, color:C.txtSec },
  sectionHeading: { fontSize:18, fontWeight:700, color:C.txtPrimary, marginBottom:3 },
  sectionSub: { fontSize:12, color:C.txtMuted, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' },
  sectionLink:{ fontSize:12, color:C.blue, cursor:'pointer', fontWeight:500 },
  midRow:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  sectionCard:{ background:C.cardBg, border:`1px solid ${C.cardBdr}`, borderRadius:12, overflow:'hidden' },
  cardHdr:    { padding:'16px 18px 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  cardTitle:  { fontSize:14, fontWeight:600, color:C.txtPrimary },
  propCard:   { display:'grid', gridTemplateColumns:'80px 1fr', gap:12, padding:'13px 18px', borderBottom:`1px solid ${C.cardBdr}`, alignItems:'start' },
  propImg:    { width:80, height:60, borderRadius:6, background:'#d1d9e8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#8898b0', flexShrink:0 },
  propBadge: (bg,col) => ({ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, background:bg, color:col, letterSpacing:0.4, display:'inline-block', marginBottom:4 }),
  propName:   { fontSize:13.5, fontWeight:600, color:C.txtPrimary, display:'flex', alignItems:'center', gap:6 },
  propAddr:   { fontSize:11, color:C.txtMuted, marginBottom:6, marginTop:1 },
  propMeta:   { display:'flex', gap:14, fontSize:11.5, color:C.txtSec, marginBottom:8 },
  propBtns:   { display:'flex', gap:6 },
  propBtnOut: { fontSize:11, border:`1px solid ${C.cardBdr}`, borderRadius:5, padding:'4px 11px', cursor:'pointer', background:'#fff', color:C.txtPrimary, fontWeight:500, fontFamily:F.sans },
  propBtnDark:{ fontSize:11, background:C.navBg, color:'#fff', border:'none', borderRadius:5, padding:'4px 11px', cursor:'pointer', fontWeight:500, fontFamily:F.sans },
  chartWrap:  { padding:'0 18px 14px', height:180, position:'relative' },
  pmtsHdr:    { fontSize:10, color:C.txtMuted, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', padding:'10px 18px 6px', borderTop:`1px solid ${C.cardBdr}` },
  pmtRow:     { display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 18px', color:C.txtPrimary },
  opsItem:    { padding:'12px 18px', borderBottom:`1px solid ${C.cardBdr}` },
  opsTagRow:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 },
  opsTag: (bg,col) => ({ fontSize:9, fontWeight:700, letterSpacing:0.5, padding:'2px 7px', borderRadius:3, background:bg, color:col, display:'inline-block' }),
  opsTime:    { fontSize:10, color:C.txtMuted },
  opsTitle:   { fontSize:12.5, fontWeight:600, color:C.txtPrimary, marginBottom:2 },
  opsSub:     { fontSize:11, color:C.txtMuted, marginBottom:6 },
  opsFooter:  { display:'flex', justifyContent:'space-between', alignItems:'center' },
  opsStatus:  { fontSize:10.5, padding:'2px 8px', borderRadius:4, background:C.stdBg, color:C.stdTx, fontWeight:500 },
  opsBtn:     { fontSize:11.5, color:C.blue, cursor:'pointer', background:'none', border:'none', padding:0, fontWeight:500, fontFamily:F.sans },
  vendorSection:{ padding:'12px 18px' },
  vendorLbl:  { fontSize:10.5, color:C.txtMuted, fontWeight:500, letterSpacing:0.4, textTransform:'uppercase', marginBottom:8 },
  vendorBar:  { height:5, background:'#e5e7eb', borderRadius:3, overflow:'hidden', marginBottom:4 },
  vendorFill: { height:'100%', background:C.green, borderRadius:3 },
  bottomRow:  { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 },
  tenantItem: { display:'flex', alignItems:'center', gap:10, padding:'9px 18px', borderBottom:`1px solid ${C.cardBdr}`, cursor:'pointer' },
  tAvatar: (bg,col) => ({ width:34, height:34, borderRadius:'50%', background:bg, color:col, fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }),
  tName:      { fontSize:12.5, fontWeight:500, color:C.txtPrimary, lineHeight:1.3 },
  tSub:       { fontSize:11, color:C.txtMuted, lineHeight:1.3 },
  tStatus:    { fontSize:10, padding:'2px 7px', borderRadius:4, background:C.greenLight, color:C.greenDark, marginLeft:'auto', fontWeight:500, flexShrink:0 },
  docItem:    { display:'flex', alignItems:'center', gap:10, padding:'10px 18px', borderBottom:`1px solid ${C.cardBdr}` },
  docIcon: (bg,col) => ({ width:34, height:34, borderRadius:6, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:col, flexShrink:0 }),
  docName:    { fontSize:12, fontWeight:500, color:C.txtPrimary, lineHeight:1.3 },
  docMeta:    { fontSize:10.5, color:C.txtMuted, lineHeight:1.3 },
  docOpenBtn: { display:'block', width:'100%', padding:'10px 18px', textAlign:'center', color:C.blue, fontSize:12, fontWeight:600, letterSpacing:0.4, textTransform:'uppercase', background:'none', border:'none', borderTop:`1px solid ${C.cardBdr}`, cursor:'pointer', fontFamily:F.sans },
  commCard:   { background:C.commBg, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' },
  commHdr:    { padding:'16px 18px 12px', borderBottom:'1px solid rgba(255,255,255,0.08)' },
  commTitle:  { fontSize:14, fontWeight:600, color:'#fff' },
  commMsg:    { padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' },
  commSender: { fontSize:9.5, color:'#4a7ab5', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', marginBottom:4 },
  commText:   { fontSize:11.5, color:'#c8dff5', lineHeight:1.55 },
  commBtn:    { margin:'12px 18px', background:C.btnTeal, color:'#fff', border:'none', borderRadius:6, padding:'9px 0', fontSize:12, fontWeight:500, cursor:'pointer', width:'calc(100% - 36px)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:F.sans },
  intelHdr:   { display:'flex', alignItems:'center', gap:8, marginBottom:12 },
  intelIcon:  { width:24, height:24, borderRadius:5, background:C.blue, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13 },
  intelTitle: { fontSize:15, fontWeight:700, color:C.txtPrimary },
  intelRow:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 },
  intelCard: (bg,bdr) => ({ background:bg, border:`1px solid ${bdr}`, borderRadius:12, padding:'16px 18px' }),
  intelCardHdr:{ display:'flex', alignItems:'center', gap:8, marginBottom:10 },
  intelCardIcon:(bg) => ({ width:30, height:30, borderRadius:6, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14 }),
  intelCardTitle:{ fontSize:12.5, fontWeight:600, color:C.txtPrimary },
  intelCardBody: { fontSize:11.5, color:'#374151', lineHeight:1.6, marginBottom:10 },
  intelCardLink:(col) => ({ fontSize:10.5, color:col, fontWeight:600, cursor:'pointer', letterSpacing:0.4, textTransform:'uppercase' }),
  footer:     { textAlign:'center', fontSize:11, color:C.txtMuted, padding:'16px 0', borderTop:`1px solid ${C.cardBdr}` },
  footerLinks:{ marginTop:4, display:'flex', justifyContent:'center', gap:16 },
  footerLink: { fontSize:11, color:C.txtMuted, cursor:'pointer' },
  skeleton:   { background:'#e5e8ed', borderRadius:4, animation:'pulse 1.5s ease-in-out infinite' },
  errBanner:  { background:C.redLight, color:C.red, padding:'12px 18px', borderRadius:8, fontSize:13, marginBottom:16 },
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_MAIN = [
  { id:'dashboard',   label:'Dashboard',   icon:'ti-layout-dashboard' },
  { id:'properties',  label:'Properties',  icon:'ti-building' },
  { id:'leases',      label:'Leases',      icon:'ti-file-text' },
  { id:'finances',    label:'Finances',    icon:'ti-wallet' },
  { id:'maintenance', label:'Maintenance', icon:'ti-tool' },
  { id:'tenants',     label:'Tenants',     icon:'ti-users' },
  { id:'documents',   label:'Documents',   icon:'ti-folder' },
];
const NAV_BOTTOM = [
  { id:'reports',   label:'Reports',   icon:'ti-chart-bar' },
  { id:'analytics', label:'Analytics', icon:'ti-chart-line' },
  { id:'insights',  label:'Insights',  icon:'ti-bulb' },
  { id:'settings',  label:'Settings',  icon:'ti-settings' },
];

// Avatar colours cycling
const AVATAR_COLORS = [
  { bg:'#e0e7ff', col:'#3730a3' },
  { bg:'#fce7f3', col:'#9d174d' },
  { bg:'#fef3c7', col:'#92400e' },
  { bg:'#dcfce7', col:'#14532d' },
];
const initials = (name='') => name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '??';
const fmtCurrency = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });

// ─── Chart components ─────────────────────────────────────────────────────────
function RentSparkline({ data = [] }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const labels = data.length ? data.map(d => d.month) : ['Jun','Jul','Aug','Sep','Oct','Nov'];
    const values = data.length ? data.map(d => d.pct)   : [0,0,0,0,0,0];
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{ data: values, borderColor:'#16a34a', borderWidth:2, pointRadius:0, fill:true, backgroundColor:'rgba(22,163,74,0.08)', tension:0.4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: v => v.raw+'%' } } },
        scales: {
          x: { grid:{ display:false }, ticks:{ font:{ size:9, family:F.sans }, color:'#9ca3af' } },
          y: { display:false, min: Math.max(0, Math.min(...values) - 5), max: 101 },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);
  return <canvas ref={ref} role="img" aria-label="Rent collection trend">Rent collection trend over 6 months</canvas>;
}

function OccupancyDonut({ value = 0 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [value, 100 - value],
          backgroundColor: ['#0d1b2e', '#e5e8ed'],
          borderWidth: 0,
          borderRadius: 3,
        }],
      },
      options: {
        responsive: false, cutout:'74%',
        plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: v => v.raw+'%' } } },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [value]);
  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', flex:1 }}>
      <canvas ref={ref} width={110} height={110} role="img" aria-label={`Occupancy ${value}%`}>{value}% occupied</canvas>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#0d1b2e', lineHeight:1 }}>{value}%</div>
        <div style={{ fontSize:9, color:'#9ca3af', marginTop:1 }}>leased</div>
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
    const labels  = data.length ? data.map(d => d.month)  : ['JUN','JUL','AUG','SEP','OCT'];
    const amounts = data.length ? data.map(d => d.amount)  : [0,0,0,0,0];
    // Highlight the highest bar in dark navy
    const maxVal  = Math.max(...amounts);
    const bgColors = amounts.map(a => (a === maxVal && maxVal > 0) ? C.navyBar : C.barLight);
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: amounts, backgroundColor: bgColors, borderRadius:{ topLeft:4, topRight:4 }, borderSkipped:false, barPercentage:0.6 }],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: v => '$'+v.raw.toLocaleString() } } },
        scales: {
          x: { grid:{ display:false }, ticks:{ font:{ size:10, family:F.sans }, color:'#9ca3af' } },
          y: { grid:{ color:'#f3f4f6', lineWidth:1 }, ticks:{ font:{ size:9, family:F.sans }, color:'#9ca3af', callback: v => '$'+(v/1000)+'K' } },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);
  return <canvas ref={ref} role="img" aria-label="Monthly rent collection">Monthly rent bar chart</canvas>;
}

// ─── Priority tag config ──────────────────────────────────────────────────────
const PRIORITY_TAG = {
  URGENT:   { bg: C.redLight,   col: C.red,    label: 'URGENT'   },
  HIGH:     { bg: C.redLight,   col: C.red,    label: 'HIGH'     },
  STANDARD: { bg: C.stdBg,      col: C.stdTx,  label: 'STANDARD' },
  MEDIUM:   { bg: C.amberLight, col: C.amber,  label: 'STANDARD' },
  LOW:      { bg: C.stdBg,      col: C.stdTx,  label: 'STANDARD' },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

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

  return (
    <div style={S.shell}>

      {/* ── LEFT NAV ── */}
      <NavF activePage="dashboard" />

      {/* ── MAIN ── */}
      <div style={S.main}>

        {/* TOPBAR — title + bell + help + avatar only */}
        <header style={S.topbar}>
          <div style={S.topbarTitle}>UrbanNest Landlord</div>
          <div style={S.topbarRight}>
            <button style={S.iconBtn} aria-label="Notifications">
              <i className="ti ti-bell" aria-hidden="true" />
            </button>
            <button style={S.iconBtn} aria-label="Help">
              <i className="ti ti-help-circle" aria-hidden="true" />
            </button>
            <div style={S.avatar} role="img" aria-label={`Profile: ${landlordName}`}>
              {loading ? 'MV' : avatarInitials}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={S.content}>

          {error && (
            <div style={S.errBanner}>
              <i className="ti ti-alert-circle" aria-hidden="true" /> Could not load dashboard data — {error}
            </div>
          )}

          {/* ── ROW 1: Hero + KPI cards ── */}
          <div style={S.topRow}>

            {/* Hero */}
            <div style={S.heroCard}>
              <div style={S.epBadge}>Executive Profile</div>
              <div style={S.heroName}>
                {loading ? <span style={{ ...S.skeleton, display:'inline-block', width:180, height:26 }} /> : landlordName}
              </div>
              <div style={S.heroSub}>
                <i className="ti ti-circle-check" style={{ fontSize:12, color:C.btnTeal }} aria-hidden="true" />
                {landlord.status || 'Property Owner · Active Portfolio'}
              </div>
              <div style={S.heroStats}>
                {[
                  { label:'Properties',     val: portfolio.total_properties ?? '—' },
                  { label:'Total units',    val: portfolio.total_units      ?? '—' },
                  { label:'Active tenants', val: portfolio.active_tenants   ?? '—' },
                ].map(s => (
                  <div key={s.label} style={S.hStat}>
                    <div style={S.hStatLbl}>{s.label}</div>
                    <div style={S.hStatVal}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={S.heroBtns}>
                <button style={S.btnTeal}>
                  <i className="ti ti-tool" style={{ fontSize:12 }} aria-hidden="true" />
                  Add maintenance request
                </button>
                <button style={S.btnGhost}>
                  <i className="ti ti-message" style={{ fontSize:12 }} aria-hidden="true" />
                  Message PM
                </button>
              </div>
            </div>

            {/* Rent Collection KPI */}
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Rent Collection</div>
              <div style={S.kpiBig}>{loading ? '—' : `${kpis.rent_collection_pct ?? 0}%`}</div>
              <div style={{ ...S.kpiSub, color: C.greenDark }}>
                {loading ? '' : '+2.4% from last quarter'}
              </div>
              <div style={S.kpiChartWrap}>
                <RentSparkline data={rentSparkline} />
              </div>
            </div>

            {/* Occupancy Rate KPI */}
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>Occupancy Rate</div>
              <div style={S.kpiBig}>{loading ? '—' : `${kpis.occupancy_rate ?? 0}%`}</div>
              <div style={{ ...S.kpiSub, color: C.txtSec }}>Target: 96% by year end</div>
              <OccupancyDonut value={kpis.occupancy_rate ?? 0} />
            </div>
          </div>

          {/* ── ROW 2: 4 stat cards ── */}
          <div style={S.statRow}>
            <div style={S.statCard}>
              <div style={S.statBadge(C.greenLight, C.greenDark)}>
                <i className="ti ti-users" style={{ fontSize:10 }} aria-hidden="true" />
                +5 this month
              </div>
              <div style={S.statNum}>{loading ? '—' : `${kpis.new_leases_this_month ?? 0} Signed`}</div>
              <div style={S.statLbl}>New leases</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statBadge(C.blueLight, C.blueDark)}>
                <i className="ti ti-circle-check" style={{ fontSize:10 }} aria-hidden="true" />
                On-track
              </div>
              <div style={S.statNum}>{loading ? '—' : fmtCurrency(kpis.rent_collected_this_month ?? 0)}</div>
              <div style={S.statLbl}>Rent collected</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statBadge(C.redLight, C.red)}>
                <i className="ti ti-alert-triangle" style={{ fontSize:10 }} aria-hidden="true" />
                {kpis.priority_tickets ?? 0} Priority
              </div>
              <div style={S.statNum}>{loading ? '—' : `${kpis.open_tickets ?? 0} Active`}</div>
              <div style={S.statLbl}>Open tickets</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statBadge(C.amberLight, C.amber)}>
                <i className="ti ti-calendar" style={{ fontSize:10 }} aria-hidden="true" />
                Next 30 days
              </div>
              <div style={S.statNum}>{loading ? '—' : `${kpis.renewals_next_30_days ?? 0} Upcoming`}</div>
              <div style={S.statLbl}>Renewals</div>
            </div>
          </div>

          {/* ── Prime Assets ── */}
          <div style={S.sectionHeading}>Prime Assets</div>
          <div style={S.sectionSub}>
            <span>High-performance properties in your active portfolio.</span>
            <span style={S.sectionLink} onClick={() => window.location.href = '/landlord-portal/portfolio'}>View Portfolio Analytics →</span>
          </div>

          {/* ── ROW 3: Property cards + Monthly rent chart ── */}
          <div style={S.midRow}>

            {/* Property cards */}
            <div style={S.sectionCard}>
              {primeAssets.length === 0 && !loading && (
                <div style={{ padding:'24px 18px', textAlign:'center', color:C.txtMuted, fontSize:12 }}>
                  No active properties yet.
                </div>
              )}
              {(primeAssets.length > 0 ? primeAssets : [{}, {}]).map((prop, idx) => {
                const isLast = idx === primeAssets.length - 1;
                const badge  = prop.badge === 'ELITE LISTING'
                  ? { bg: C.amberLight, col:'#92400e', label:'ELITE LISTING' }
                  : { bg: C.greenLight, col:'#14532d', label: prop.badge || 'STABILIZED' };
                return (
                  <div key={prop.id || idx} style={{ ...S.propCard, ...(isLast ? { borderBottom:'none' } : {}) }}>
                    <div style={S.propImg}>
                      <i className="ti ti-building" aria-hidden="true" />
                    </div>
                    <div>
                      {prop.name && <div style={S.propBadge(badge.bg, badge.col)}>{badge.label}</div>}
                      <div style={S.propName}>
                        {prop.name || <span style={{ ...S.skeleton, display:'inline-block', width:140, height:16 }} />}
                        {prop.name && (
                          <span style={{ fontSize:11, color:C.greenDark, display:'flex', alignItems:'center', gap:3 }}>
                            <i className="ti ti-circle-check" style={{ fontSize:11 }} aria-hidden="true" /> Paid
                          </span>
                        )}
                      </div>
                      <div style={S.propAddr}>{prop.address}{prop.total_units ? ` · ${prop.total_units} Units` : ''}</div>
                      <div style={S.propMeta}>
                        <span>Occupancy <strong style={{ color:C.txtPrimary }}>{prop.occupancy_pct ?? 0}%</strong></span>
                        <span>
                          Maintenance{' '}
                          <strong style={{ color: prop.maint_open > 0 ? C.red : C.greenDark }}>
                            {prop.maint_open > 0 ? `${prop.maint_open} Open` : 'Clear'}
                          </strong>
                        </span>
                      </div>
                      <div style={S.propBtns}>
                        <button style={S.propBtnOut}>Details</button>
                        <button style={S.propBtnDark}>Message Tenants</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly rent collection */}
            <div style={S.sectionCard}>
              <div style={S.cardHdr}>
                <div style={S.cardTitle}>Monthly Rent Collection</div>
                <div style={{ display:'flex', gap:6 }}>
                  <button style={{ border:`1px solid ${C.cardBdr}`, background:'#fff', borderRadius:4, padding:'3px 7px', cursor:'pointer', fontSize:12, color:C.txtSec }}>
                    <i className="ti ti-download" style={{ fontSize:11 }} aria-hidden="true" />
                  </button>
                  <button style={{ border:`1px solid ${C.cardBdr}`, background:'#fff', borderRadius:4, padding:'3px 7px', cursor:'pointer', fontSize:12, color:C.txtSec }}>
                    <i className="ti ti-dots-vertical" style={{ fontSize:11 }} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div style={S.chartWrap}>
                <RentBarChart data={rentTrend} />
              </div>
              <div style={S.pmtsHdr}>Recent Payments</div>
              {payments.length === 0 && !loading && (
                <div style={{ padding:'8px 18px 14px', fontSize:12, color:C.txtMuted }}>No payments recorded yet.</div>
              )}
              {payments.slice(0, 2).map((p, i) => (
                <div key={i} style={{ ...S.pmtRow, paddingBottom: i === payments.length - 1 ? 14 : undefined }}>
                  <span>
                    {p.tenant_name}
                    <span style={{ color:C.txtMuted }}> · {p.property_name}{p.unit_ref ? `, ${p.unit_ref}` : ''}</span>
                  </span>
                  <span style={{ color:C.greenDark, fontWeight:600 }}>+{fmtCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── ROW 4: Open Operations + vendor ── */}
          <div style={S.midRow}>
            <div style={S.sectionCard}>
              <div style={S.cardHdr}><div style={S.cardTitle}>Open Operations</div></div>
              {ops.length === 0 && !loading && (
                <div style={{ padding:'20px 18px', fontSize:12, color:C.txtMuted }}>No open tickets.</div>
              )}
              {ops.slice(0, 2).map((op, i) => {
                const tag = PRIORITY_TAG[op.priority] || PRIORITY_TAG.STANDARD;
                return (
                  <div key={op.id || i} style={{ ...S.opsItem, ...(i === ops.length - 1 ? { borderBottom:'none' } : {}) }}>
                    <div style={S.opsTagRow}>
                      <span style={S.opsTag(tag.bg, tag.col)}>{tag.label}</span>
                      <span style={S.opsTime}>{op.time_ago}</span>
                    </div>
                    <div style={S.opsTitle}>{op.title}</div>
                    <div style={S.opsSub}>{op.property_name}{op.location_note ? ` · ${op.location_note}` : ''}</div>
                    <div style={S.opsFooter}>
                      <span style={S.opsStatus}>{op.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}</span>
                      <button style={S.opsBtn}>
                        {op.status === 'OPEN' ? 'Assign Vendor →' : 'View Details →'}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div style={S.vendorSection}>
                <div style={S.vendorLbl}>Vendor Performance</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:C.txtPrimary, marginBottom:6 }}>
                  <span>Reliability Score</span>
                  <span style={{ fontWeight:700, color:C.greenDark }}>96%</span>
                </div>
                <div style={S.vendorBar}><div style={{ ...S.vendorFill, width:'96%' }} /></div>
              </div>
            </div>

            {/* Placeholder right panel */}
            <div style={{ ...S.sectionCard, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:200 }}>
              <i className="ti ti-chart-area" style={{ fontSize:32, color:'#d1d9e8', marginBottom:8 }} aria-hidden="true" />
              <div style={{ fontSize:12, color:C.txtMuted }}>Portfolio analytics coming soon</div>
            </div>
          </div>

          {/* ── ROW 5: Tenant Pulse + Recent Docs + Comm Hub ── */}
          <div style={S.bottomRow}>

            {/* Tenant Pulse */}
            <div style={S.sectionCard}>
              <div style={S.cardHdr}>
                <div style={S.cardTitle}>Tenant Pulse</div>
                <i className="ti ti-users" style={{ fontSize:15, color:C.txtMuted }} aria-hidden="true" />
              </div>
              {tenants.length === 0 && !loading && (
                <div style={{ padding:'20px 18px', fontSize:12, color:C.txtMuted }}>No active tenants.</div>
              )}
              {tenants.slice(0, 3).map((t, i) => {
                const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div key={i} style={S.tenantItem}>
                    <div style={S.tAvatar(ac.bg, ac.col)}>{initials(t.name)}</div>
                    <div>
                      <div style={S.tName}>{t.name}</div>
                      <div style={S.tSub}>{t.property_name} {t.unit_ref ? `· ${t.unit_ref}` : ''}</div>
                    </div>
                    <div style={S.tStatus}>Active</div>
                  </div>
                );
              })}
            </div>

            {/* Recent Documents — static for now, wire to docs API when built */}
            <div style={S.sectionCard}>
              <div style={S.cardHdr}><div style={S.cardTitle}>Recent Documents</div></div>
              {[
                { icon:'ti-file-text',   bg:'#eff6ff', col:C.blue,      name:'Lease Agreement - #402', meta:'Updated 2 days ago · 1.2MB' },
                { icon:'ti-report-money',bg:'#f0fdf4', col:C.greenDark, name:'Q3 Financial Report',    meta:'Aug 15, 2023 · 4.0MB' },
                { icon:'ti-shield-check',bg:C.amberLight, col:C.amber,  name:'Insurance Certificate',  meta:'Expires in 4 months' },
              ].map(d => (
                <div key={d.name} style={S.docItem}>
                  <div style={S.docIcon(d.bg, d.col)}>
                    <i className={`ti ${d.icon}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={S.docName}>{d.name}</div>
                    <div style={S.docMeta}>{d.meta}</div>
                  </div>
                </div>
              ))}
              <button style={S.docOpenBtn}>Open Document Hub</button>
            </div>

            {/* Communication Hub */}
            <div style={S.commCard}>
              <div style={S.commHdr}><div style={S.commTitle}>Communication Hub</div></div>
              <div style={S.commMsg}>
                <div style={S.commSender}>Estate Manager</div>
                <div style={S.commText}>"The inspection for Emerald Gardens is finalized. Sending over the report now."</div>
              </div>
              <div style={S.commMsg}>
                <div style={S.commSender}>Maintenance Team</div>
                <div style={S.commText}>"Vendor dispatched for Regent Plaza pressure leak. ETA 35 mins."</div>
              </div>
              <button style={S.commBtn}>
                <i className="ti ti-message-2" style={{ fontSize:13 }} aria-hidden="true" />
                Open Messenger
              </button>
            </div>
          </div>

          {/* ── UrbanNest Intelligence ── */}
          <div style={S.intelHdr}>
            <div style={S.intelIcon}>
              <i className="ti ti-sparkles" style={{ fontSize:13 }} aria-hidden="true" />
            </div>
            <div style={S.intelTitle}>UrbanNest Intelligence</div>
          </div>
          <div style={S.intelRow}>
            <div style={S.intelCard(C.intelBg, C.intelBdr)}>
              <div style={S.intelCardHdr}>
                <div style={S.intelCardIcon(C.teal)}>
                  <i className="ti ti-trending-up" style={{ fontSize:14 }} aria-hidden="true" />
                </div>
                <div style={S.intelCardTitle}>Rent Trend Analysis</div>
              </div>
              <div style={S.intelCardBody}>
                Local market data suggests a 4.2% potential increase for 2-bedroom units in Chelsea.
                Consider adjusting Emerald Gardens rates during next renewal cycle.
              </div>
              <div style={S.intelCardLink(C.teal)}>Review Market Comp →</div>
            </div>
            <div style={S.intelCard(C.intelAmBg, C.intelAmBdr)}>
              <div style={S.intelCardHdr}>
                <div style={S.intelCardIcon(C.amber)}>
                  <i className="ti ti-alert-triangle" style={{ fontSize:14 }} aria-hidden="true" />
                </div>
                <div style={S.intelCardTitle}>Maintenance Forecast</div>
              </div>
              <div style={S.intelCardBody}>
                HVAC units in The Regent Plaza (South Wing) are approaching their 5-year efficiency limit.
                Predicted failure probability increases to 15% this winter.
              </div>
              <div style={S.intelCardLink(C.amber)}>Schedule Preventive Audit →</div>
            </div>
          </div>

          {/* Footer */}
          <div style={S.footer}>
            © 2023 UrbanNest Property Management. All Rights Reserved.
            <div style={S.footerLinks}>
              <span style={S.footerLink}>Privacy Policy</span>
              <span style={S.footerLink}>Terms of Service</span>
              <span style={S.footerLink}>Global Compliance</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
