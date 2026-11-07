import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';
import { CustomDropdown } from '../../components/ui';
import LandlordUnitSelection from './Listing/LandlordUnitSelection';

Chart.register(...registerables);

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Fallback images ──────────────────────────────────────────────────────────
const FB = {
  main:   'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  t1:     'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
  t2:     'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  t3:     'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80',
  unit:   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
};

// Session 57 fix — same colored icon-chip treatment as
// PMPropertyDetailPage.jsx's amenityStyle()/SpecialFeatures, ported here so
// the Landlord Amenities section (both the main page display and the Edit
// modal's picker) matches the look/feel the user asked for instead of the
// old plain checkmark+icon+text row.
function amenityStyle(name) {
  const map = {
    'Smart Home':{ icon:'ti-home-signal',bg:'#EFF6FF',color:'#2563EB' },'24 hours CCTV':{ icon:'ti-video',bg:'#F0FDF4',color:'#16A34A' },
    'CCTV':{ icon:'ti-video',bg:'#F0FDF4',color:'#16A34A' },'EV Charging':{ icon:'ti-bolt',bg:'#F0FDF4',color:'#16A34A' },
    'Near public transport':{ icon:'ti-bus',bg:'#EFF6FF',color:'#2563EB' },'Short/Long term lease':{ icon:'ti-file-text',bg:'#F0FDF4',color:'#16A34A' },
    'Zero Deposit':{ icon:'ti-shield-check',bg:'#F0FDF4',color:'#16A34A' },'Swimming Pool':{ icon:'ti-droplet',bg:'#EFF6FF',color:'#2563EB' },
    'Gym':{ icon:'ti-barbell',bg:'#FEF3C7',color:'#D97706' },'Parking':{ icon:'ti-car',bg:'#F1F5F9',color:'#64748B' },
    'Elevator':{ icon:'ti-elevator',bg:'#EEF2FF',color:'#7C3AED' },'Pet Friendly':{ icon:'ti-paw',bg:'#FEF3C7',color:'#D97706' },
    'Community Hall':{ icon:'ti-users',bg:'#EFF6FF',color:'#2563EB' },'Laundry':{ icon:'ti-wash',bg:'#F0FDF4',color:'#16A34A' },
    'Rooftop':{ icon:'ti-building',bg:'#EEF2FF',color:'#7C3AED' },'Air Condition':{ icon:'ti-snowflake',bg:'#EFF6FF',color:'#2563EB' },
    'Balcony':{ icon:'ti-door',bg:'#F0FDF4',color:'#16A34A' },'Furnished':{ icon:'ti-sofa',bg:'#FEF3C7',color:'#D97706' },
    'Intercom':{ icon:'ti-phone',bg:'#EEF2FF',color:'#7C3AED' },'Dishwasher':{ icon:'ti-wash-dry',bg:'#F0FDF4',color:'#16A34A' },
  };
  return map[name] || { icon:'ti-star', bg:'#F0FDF4', color:'#16A34A' };
}

const PROP_TYPE_LABEL = {
  APARTMENT_COMPLEX:'Apartment Complex', INDIVIDUAL_HOUSE:'Individual House',
  MULTI_FAMILY:'Multi-Family', CONDOMINIUM:'Condominium', TOWNHOME:'Townhome',
  STUDENT_HOUSING:'Student Housing', VILLA:'Villa',
  SERVICED_APARTMENT:'Serviced Apt', COMMERCIAL:'Commercial', MIXED_USE:'Mixed Use',
};

const initials = n => (n||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';

const AVATAR_COLORS = [
  { bg:'#e0e7ff', col:'#3730a3' },{ bg:'#fce7f3', col:'#9d174d' },
  { bg:'#fef3c7', col:'#92400e' },{ bg:'#dcfce7', col:'#14532d' },
];

// ─── Static placeholder data ──────────────────────────────────────────────────
const LEDGER_L = [
  { date:'Jun 28', cat:'Rent',        who:'Evelyn Rose',  amt:'+$4,200', pos:true },
  { date:'Jun 26', cat:'Maintenance', who:'AquaFix',      amt:'-$850',   pos:false },
  { date:'Jun 24', cat:'Utilities',   who:'NYC Grid',     amt:'-$1,420', pos:false },
];
const LEDGER_R = [
  { date:'Jun 20', cat:'Rent',        who:'James Miller', amt:'+$2,850', pos:true },
  { date:'Jun 18', cat:'Insurance',   who:'Allstate',     amt:'-$620',   pos:false },
  { date:'Jun 15', cat:'Rent',        who:'Evelyn Rose',  amt:'+$4,200', pos:true },
];
const DOC_ITEMS = [
  { icon:'ti-file-text',   bg:C.blueLight,  col:C.blue,      name:'Lease agreements',        meta:'16 active files' },
  { icon:'ti-certificate', bg:C.greenLight, col:C.greenDark, name:'Certificates and permits', meta:'Fire & safety 2026' },
  { icon:'ti-license',     bg:C.amberLight, col:C.amber,     name:'Vendor contracts',         meta:'6 agreements' },
  { icon:'ti-receipt-tax', bg:C.stdBg,      col:C.txtMuted,  name:'Tax documents',            meta:'171 invoices' },
];
const QA_ITEMS = [
  { icon:'ti-clock',          bg:C.amberLight, col:C.amber,     title:'Lease renewal due',    sub:'Unit A1 · expires in 14 days', time:'Today' },
  { icon:'ti-alert-triangle', bg:C.redLight,   col:C.red,       title:'PM approval needed',   sub:'Water pressure repair quote',  time:'2h ago' },
  { icon:'ti-message',        bg:C.blueLight,  col:C.blue,      title:'Tenant message',       sub:'Unit A2 · heating issue',      time:'Yesterday' },
  { icon:'ti-file-check',     bg:C.greenLight, col:C.greenDark, title:'Document ready',       sub:'Q2 financial report',          time:'Jul 1' },
];
const CHAT_THREADS = [
  {
    id:'chat-em', av:'EM', name:'Estate Manager', preview:'HVAC check confirmed for tomorrow.',
    messages:[
      { from:'them', text:'HVAC check confirmed for tomorrow at 10 AM.' },
      { from:'me',   text:'Great, thanks! Will the tech need roof access?' },
      { from:'them', text:'Yes, roof access needed. Key is with reception.' },
    ],
  },
  {
    id:'chat-a2', av:'A2', name:'Unit A2 · Tenant', preview:'Heating not working, need help.',
    messages:[
      { from:'them', text:'Hi, the heating unit stopped working since last night.' },
      { from:'me',   text:"Sorry! I'll raise a maintenance ticket right away." },
    ],
  },
];
const NOTIFICATIONS = [
  {
    id:'n1', icon:'ti-clock',      iconBg:C.blueLight, iconCol:C.blue,
    title:'Lease renewal alert', preview:'Unit A1 expires in 14 days.',
    full:'The lease for Unit A1 is expiring in 14 days on July 21, 2026. Please contact the tenant to initiate the renewal process or prepare a new lease agreement.',
    hasImage:true, time:'Today',
  },
  {
    id:'n2', icon:'ti-file-check', iconBg:C.greenLight, iconCol:C.greenDark,
    title:'Report ready', preview:'Q2 financial report is available.',
    full:'Your Q2 2026 financial report for Idex Properties is ready. Download it from the Document Vault or view it directly in the Financials section.',
    hasImage:false, time:'Jul 1',
  },
];

// ─── Bulk Add Service (SVC-1, Session 40) — wired to the real backend ─────────
// ownedServices now comes from GET /landlord/account/services/ (fetched in
// the main component below and passed down as a prop) instead of a static
// mock list, and per-unit assignment comes from a real fetch per unit
// against GET /properties/<pk>/units/<uid>/services/ (also fetched in the
// main component — there's no per-unit services field on
// LandlordPropertyDetailView's response, so this page makes its own calls).
//
// IMPORTANT behavior change from the original wireframe: the real bulk
// endpoint (POST /properties/<pk>/units/services/bulk/) is one atomic
// transaction — all-or-nothing, per the confirmed design (a partial
// "8 added, 2 flagged" result is NOT how the real endpoint behaves; if
// even one selected unit can't resolve a required bank account, or doesn't
// belong to this landlord, NOTHING is created and the whole request comes
// back as a single error naming the problem units). The Result stage below
// reflects that honestly — full success, or a single error banner — rather
// than the wireframe's per-unit flagged list, since that per-unit outcome
// isn't actually possible with this endpoint.
const SERVICE_FALLBACK_ICON = 'ti-adjustments';

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  shell:    { display:'flex', height:'100vh', fontFamily:F.sans, background:C.pageBg, overflow:'hidden' },
  main:     { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar:   { background:C.topbarBg, borderBottom:`1px solid ${C.topbarBdr}`, padding:'0 24px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  topTitle: { fontSize:14, fontWeight:600, color:C.txtPrimary },
  topRight: { display:'flex', alignItems:'center', gap:10 },
  iconBtn:  { width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:C.txtSec, cursor:'pointer', background:'transparent', border:'none', fontSize:16 },
  avatar:   { width:32, height:32, borderRadius:'50%', background:C.navBg, color:'#fff', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center' },
  content:  { flex:1, overflowY:'auto', padding:'0 0 40px' },

  // BREADCRUMB
  bread:    { padding:'12px 28px 0', display:'flex', alignItems:'center', gap:6, fontSize:13 },
  breadLink:{ color:C.blue, cursor:'pointer', fontWeight:500 },
  breadSep: { color:C.txtMuted },
  breadCur: { color:C.txtPrimary },

  // HERO
  heroWrap: { padding:'14px 28px 0' },
  heroRow:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  propName: { fontSize:26, fontWeight:700, color:C.txtPrimary, letterSpacing:-0.4 },
  propAddr: { fontSize:12.5, color:C.txtMuted, display:'flex', alignItems:'center', gap:4, marginTop:3 },
  typeBadge:{ display:'inline-flex', alignItems:'center', background:'#e8f5f0', color:C.teal, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, letterSpacing:0.3, marginLeft:10 },

  // STATS — 2 cards, each with 2 stats + divider (matching screenshot)
  statsWrap:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, minWidth:230 },
  statBox:  { background:C.cardBg, border:`1px solid ${C.cardBdr}`, borderRadius:10, padding:'8px 14px' },
  statLbl:  { fontSize:9.5, color:C.txtMuted, fontWeight:500, letterSpacing:0.6, textTransform:'uppercase', marginBottom:4 },
  statVal:  { fontSize:16, fontWeight:550, color:C.txtPrimary, lineHeight:1.2 },
  statDiv:  { height:1, background:C.cardBdr, margin:'7px 0' },

  // GALLERY: left = single image, right = 2x2 grid
  gallery:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, height:300, margin:'14px 0 0', borderRadius:12, overflow:'hidden' },
  galLeft:     { position:'relative', overflow:'hidden', borderRadius:8 },
  galImg:      { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  galRight:    { display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:6, height:'100%', overflow:'hidden'  },
  galCell:     { position:'relative', overflow:'hidden', borderRadius:6 },
  galAddCell:  { background:C.pageBg, border:`1px dashed ${C.cardBdr}`, borderRadius:6, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, color:C.txtMuted, cursor:'pointer', fontSize:11, fontWeight:500 , minHeight:0, overflow:'hidden'},
  sampleBanner:{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:9.5, fontWeight:700, letterSpacing:1.2, padding:'2px 9px', borderRadius:3, textTransform:'uppercase', whiteSpace:'nowrap', pointerEvents:'none' },
  galOverlay:  { position:'absolute', bottom:10, right:10, background:C.navBg, color:'#fff', fontSize:11.5, fontWeight:600, padding:'6px 12px', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:5 },

  // SECTION WRAP
  sw: { padding:'20px 28px 0' },

  // 50/25/25 row
  descRow:  { display:'grid', gridTemplateColumns:'50fr 25fr 25fr', gap:14, marginBottom:20 },

  // CARDS
  card:     { background:C.cardBg, border:`1px solid ${C.cardBdr}`, borderRadius:12, padding:'18px 20px' },
  cardHdr:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  cardTitle:{ fontSize:14, fontWeight:600, color:C.txtPrimary },
  cardLink: { fontSize:11.5, color:C.blue, cursor:'pointer', fontWeight:500 },
  divider:  { height:1, background:C.cardBdr, margin:'8px 0' },
  secLbl:   { fontSize:9.5, color:C.txtMuted, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:4, marginTop:8 },

  // AMENITIES
  amenityGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginTop:10 },
  amenityItem:{ display:'flex', alignItems:'center', gap:7, background:'#f8f9fb', borderRadius:6, padding:'6px 9px', fontSize:12 },
  amenityIcon:{ width:18, height:18, borderRadius:4, background:'#e8f5f0', display:'flex', alignItems:'center', justifyContent:'center', color:C.teal, fontSize:10, flexShrink:0 },

  // OWNERSHIP
  ownerRow: { display:'flex', alignItems:'center', gap:9, marginBottom:8 },
  ownerAv:  { width:34, height:34, borderRadius:'50%', background:C.blueLight, color:C.blueDark, fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  ownerName:{ fontSize:13, fontWeight:600, color:C.txtPrimary },
  ownerSub: { fontSize:11, color:C.txtMuted },
  ledgerBtn:{ width:'100%', background:'#fff', border:`1px solid ${C.cardBdr}`, borderRadius:6, padding:'7px 0', fontSize:12, fontWeight:500, color:C.txtPrimary, cursor:'pointer', marginTop:10, fontFamily:F.sans },

  // HEALTH
  healthHdr:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  healthBadge: (bg,col) => ({ background:bg, color:col, fontSize:10, fontWeight:600, padding:'2px 9px', borderRadius:20 }),
  healthScore: { fontSize:30, fontWeight:700, lineHeight:1, marginBottom:2 },
  healthSub:   { fontSize:11, color:C.txtMuted, marginBottom:10 },
  metricRow:   { display:'flex', flexDirection:'column', gap:2, marginBottom:7 },
  metricTop:   { display:'flex', justifyContent:'space-between', fontSize:11.5 },
  barTrack:    { height:4, background:'#e5e8ed', borderRadius:2, overflow:'hidden' },
  barFill:     (w,bg) => ({ height:'100%', width:`${w}%`, background:bg, borderRadius:2 }),
  healthFooter:{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.cardBdr}`, fontSize:10.5, color:C.txtMuted, display:'flex', alignItems:'center', gap:4 },

  // UNIT INVENTORY
  unitHdr:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  unitHdrTtl: { fontSize:15, fontWeight:700, color:C.txtPrimary },
  unitHdrR:   { display:'flex', gap:8 },
  filterBtn:  { background:'#fff', border:`1px solid ${C.cardBdr}`, borderRadius:6, padding:'6px 12px', fontSize:12, color:C.txtSec, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:F.sans },
  btnBulk:    { background:'#fff', border:`1.5px solid ${C.blue}`, borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:700, color:C.blue, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:F.sans },
  // "List Multi Units" entry point (Session 42/43) — teal to distinguish it
  // from the blue "Add Service to All Units" bulk action, matching the teal
  // already used for amenity/marketplace accents elsewhere on this page.
  btnMulti:   { background:'#fff', border:`1.5px solid ${C.teal}`, borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:700, color:C.teal, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:F.sans },
  btnMultiDisabled: { opacity:0.5, cursor:'not-allowed' },
  addUnitBtn: { background:C.navBg, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:F.sans },
  unitGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 },
  unitCard:   { background:C.cardBg, border:`1px solid ${C.cardBdr}`, borderRadius:10, overflow:'hidden' },
  unitImgWrap:{ position:'relative', height:100, overflow:'hidden', background:C.pageBg },
  unitImg:    { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  unitRentBadge:(bg,col) => ({ position:'absolute', top:7, right:7, fontSize:9.5, fontWeight:700, padding:'2px 6px', borderRadius:4, background:bg, color:col }),
  unitBody:   { padding:'11px 13px 13px' },
  unitNum:    { fontSize:13.5, fontWeight:700, color:C.txtPrimary, marginBottom:3 },
  unitTenant: { fontSize:12, color:C.txtSec, marginBottom:7, fontStyle:'italic' },
  unitStatusRow:{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:C.txtMuted, marginBottom:4 },
  unitBtns:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 },
  unitBtnDark:{ background:C.navBg, color:'#fff', border:'none', borderRadius:6, padding:'6px 0', fontSize:11.5, fontWeight:500, cursor:'pointer', fontFamily:F.sans, textAlign:'center' },
  unitBtnOut: { background:'#fff', border:`1px solid ${C.cardBdr}`, borderRadius:6, padding:'6px 0', fontSize:11.5, color:C.txtPrimary, cursor:'pointer', fontFamily:F.sans, textAlign:'center' },
  unitImgFallback:{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, background:C.pageBg },

  // BOTTOM ROWS
  row1:    { display:'grid', gridTemplateColumns:'35fr 35fr 30fr', gap:14, marginBottom:14 },
  row2:    { display:'grid', gridTemplateColumns:'40fr 60fr', gap:14, marginBottom:14 },
  row3:    { display:'grid', gridTemplateColumns:'60fr 40fr', gap:14, marginBottom:0 },

  // MAINT
  maintItem:   { display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`1px solid ${C.cardBdr}` },
  maintBadge:  (bg,col) => ({ width:28, height:28, borderRadius:6, background:bg, color:col, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }),
  maintTitle:  { fontSize:12.5, fontWeight:500, color:C.txtPrimary },
  maintSub:    { fontSize:11, color:C.txtMuted },
  statusPill:  (bg,col) => ({ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:bg, color:col, marginLeft:'auto', flexShrink:0 }),

  // QUICK ACTIONS
  qaItem:   { display:'flex', alignItems:'flex-start', gap:8, padding:'8px 0', borderBottom:`1px solid ${C.cardBdr}` },
  qaIcon:   (bg) => ({ width:28, height:28, borderRadius:7, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }),
  qaTitle:  { fontSize:12.5, fontWeight:500, color:C.txtPrimary, lineHeight:1.3 },
  qaSub:    { fontSize:11, color:C.txtMuted, marginTop:1 },
  qaTime:   { fontSize:10.5, color:C.txtMuted, marginLeft:'auto', paddingLeft:6, flexShrink:0 },

  // DOC VAULT
  docItem:  { display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`1px solid ${C.cardBdr}` },
  docIcon:  (bg,col) => ({ width:28, height:28, borderRadius:6, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color:col, fontSize:14, flexShrink:0 }),

  // RENT COLLECTION
  rentTrendWrap:   { position:'relative', height:90, background:'#f3f4f6', borderRadius:8, marginBottom:14, overflow:'hidden', display:'flex', alignItems:'flex-end', padding:'10px 8px 0', gap:5 },
  rentBar:    (h,bg) => ({ flex:1, height:`${h}%`, background:bg, borderRadius:'3px 3px 0 0' }),
  rentGraphOverlay:{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'rgba(0,0,0,0.45)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:1.2, padding:'3px 10px', borderRadius:3, textTransform:'uppercase', whiteSpace:'nowrap' },
  rentStats:  { display:'flex', gap:0 },
  rentStatIt: (first,last) => ({ flex:1, paddingLeft:first?0:14, paddingRight:last?0:14, borderRight:last?'none':`1px solid ${C.cardBdr}` }),
  rentStatLbl:{ fontSize:9.5, color:C.txtMuted, fontWeight:500, letterSpacing:0.5, textTransform:'uppercase', marginBottom:4 },
  rentStatVal:{ fontSize:17, fontWeight:500 },

  // LEDGER
  ledgerCols:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px' },
  ledgerHdr: { display:'grid', gridTemplateColumns:'52px 1fr 1fr 60px', gap:3, padding:'5px 0', borderBottom:`1px solid ${C.cardBdr}` },
  ledgerRow: { display:'grid', gridTemplateColumns:'52px 1fr 1fr 60px', gap:3, padding:'7px 0', borderBottom:`1px solid ${C.cardBdr}`, alignItems:'center' },
  lTh:       { fontSize:9.5, color:C.txtMuted, fontWeight:500, letterSpacing:0.4, textTransform:'uppercase' },
  lTd:       { fontSize:11.5, color:C.txtPrimary },

  // RESIDENT DIR
  dirHdr:    { display:'grid', gridTemplateColumns:'2fr 0.8fr 1fr 1.1fr 1fr 0.5fr', gap:4, padding:'5px 0', borderBottom:`1px solid ${C.cardBdr}` },
  dirRow:    { display:'grid', gridTemplateColumns:'2fr 0.8fr 1fr 1.1fr 1fr 0.5fr', gap:4, padding:'8px 0', borderBottom:`1px solid ${C.cardBdr}`, alignItems:'center' },
  dirTh:     { fontSize:9.5, color:C.txtMuted, fontWeight:500, letterSpacing:0.4, textTransform:'uppercase' },
  dirTd:     { fontSize:12, color:C.txtPrimary },
  tenantAv:  (bg,col) => ({ width:24, height:24, borderRadius:'50%', background:bg, color:col, fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }),

  // COMMUNICATIONS
  tabRow:       { display:'flex', borderBottom:`1px solid ${C.cardBdr}`, marginBottom:10 },
  tab:          (a) => ({ fontSize:12.5, padding:'6px 14px', cursor:'pointer', borderBottom: a?`2px solid ${C.blue}`:'2px solid transparent', color:a?C.txtPrimary:C.txtMuted, fontWeight:a?500:400 }),
  newChatBtn: { display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11.5, fontWeight:500, color:'#fff', background:C.navBg, border:'none', borderRadius:6, padding:'6px 16px', cursor:'pointer', marginBottom:10, fontFamily:F.sans, width:'auto', alignSelf:'center' },
  newChatForm:  { background:C.pageBg, border:`1px solid ${C.cardBdr}`, borderRadius:8, padding:'10px', marginBottom:10 },
  ncSelect:     { width:'100%', marginBottom:8, fontSize:12, border:`1px solid ${C.cardBdr}`, borderRadius:5, padding:'6px 8px', background:'#fff', color:C.txtPrimary, fontFamily:F.sans },
  ncInputRow:   { display:'flex', gap:6 },
  ncInput:      { flex:1, fontSize:12, border:`1px solid ${C.cardBdr}`, borderRadius:5, padding:'6px 8px', background:'#fff', color:C.txtPrimary, fontFamily:F.sans, outline:'none' },
  ncSendBtn:    { background:C.teal, color:'#fff', border:'none', borderRadius:5, padding:'6px 12px', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:F.sans },
  msgItem:      { display:'flex', alignItems:'flex-start', gap:8, padding:'8px 0', borderBottom:`1px solid ${C.cardBdr}`, cursor:'pointer' },
  msgAv:        { width:28, height:28, borderRadius:'50%', background:C.stdBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:500, color:C.txtSec, flexShrink:0 },
  msgName:      { fontSize:12.5, fontWeight:500, color:C.txtPrimary },
  msgPreview:   { fontSize:11, color:C.txtMuted, marginTop:1 },
  msgTime:      { fontSize:10.5, color:C.txtMuted, marginLeft:'auto', paddingLeft:6, flexShrink:0 },
  chatExpanded: { background:C.pageBg, border:`1px solid ${C.cardBdr}`, borderRadius:8, padding:'10px', marginTop:6 },
  threadWrap:   { display:'flex', flexDirection:'column', gap:6, marginBottom:8, maxHeight:120, overflowY:'auto' },
  bubbleRight:  { background:C.blueLight, color:C.blueDark, fontSize:11, padding:'6px 9px', borderRadius:'8px 8px 2px 8px', alignSelf:'flex-end', maxWidth:'80%' },
  bubbleLeft:   { background:'#fff', border:`1px solid ${C.cardBdr}`, color:C.txtPrimary, fontSize:11, padding:'6px 9px', borderRadius:'8px 8px 8px 2px', alignSelf:'flex-start', maxWidth:'80%' },
  replyRow:     { display:'flex', gap:6, marginTop:6 },
  replyInput:   { flex:1, fontSize:12, border:`1px solid ${C.cardBdr}`, borderRadius:6, padding:'6px 9px', fontFamily:F.sans, outline:'none', background:'#fff' },
  sendBtn:      { width:30, height:30, borderRadius:'50%', background:C.teal, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  notifItem:    { display:'flex', alignItems:'flex-start', gap:8, padding:'8px 0', borderBottom:`1px solid ${C.cardBdr}`, cursor:'pointer' },
  notifIconWrap:(bg) => ({ width:28, height:28, borderRadius:7, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }),
  notifPopup:   { background:C.pageBg, border:`1px solid ${C.cardBdr}`, borderRadius:8, padding:'12px', marginTop:6 },
  notifImgArea: { height:70, background:'linear-gradient(135deg,#dbeafe,#eff6ff)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 },
  notifFullText:{ fontSize:11.5, color:C.txtSec, lineHeight:1.6, marginBottom:8 },
  markReadBtn:  { fontSize:11.5, color:C.blue, background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:F.sans, fontWeight:500 },

  // FILTER MODAL
  overlay:      { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modalBox:     { background:'#fff', borderRadius:14, width:540, padding:'24px 28px' },
  modalHdr:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${C.cardBdr}` },
  modalTitle:   { fontSize:16, fontWeight:700, color:C.txtPrimary, display:'flex', alignItems:'center', gap:8 },
  modalClose:   { background:'none', border:'none', fontSize:20, color:C.txtMuted, cursor:'pointer', lineHeight:1 },
  filterGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 20px', marginBottom:24 },
  filterField:  { display:'flex', flexDirection:'column', gap:5 },
  filterLbl:    { fontSize:12.5, color:C.txtSec, display:'flex', alignItems:'center', gap:5 },
  filterSelect: { border:`1px solid ${C.cardBdr}`, borderRadius:7, padding:'8px 10px', fontSize:12.5, color:C.txtPrimary, fontFamily:F.sans, background:'#fff', cursor:'pointer', outline:'none' },
  modalFooter:  { display:'flex', justifyContent:'flex-end', gap:10 },
  resetBtn:     { background:'none', border:'none', fontSize:13.5, color:C.txtSec, cursor:'pointer', padding:'8px 16px', fontFamily:F.sans },
  applyBtn:     { background:C.navBg, color:'#fff', border:'none', borderRadius:7, padding:'9px 22px', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:F.sans },

  // BULK ADD SERVICE MODAL (Unit Inventory → "Add Service to All Units")
  bulkOverlay:      { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(13,27,46,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'30px 20px', zIndex:1000, fontFamily:F.sans },
  bulkModal:        { background:'#fff', borderRadius:12, width:560, maxWidth:'100%', boxShadow:'0 24px 50px rgba(0,0,0,0.3)', overflow:'hidden', color:C.txtPrimary },
  bulkModalHdr:     { padding:'18px 22px 6px' },
  bulkModalHdrTitle:{ margin:'0 0 3px', fontSize:16, fontWeight:700 },
  bulkModalHdrSub:  { margin:0, fontSize:12, color:C.txtMuted },
  bulkSvcRow:       { padding:'12px 22px 4px' },
  bulkSvcLbl:       { fontSize:10.5, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:C.txtMuted, marginBottom:6 },
  bulkSelectAllRow: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 22px 6px', borderTop:`1px solid ${C.cardBdr}`, marginTop:10 },
  bulkSelectAllLbl: { fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:7, cursor:'pointer' },
  bulkSelectCount:  { fontSize:11.5, color:C.txtMuted },
  bulkPickList:     { maxHeight:300, overflowY:'auto', padding:'0 22px' },
  bulkPickRow:      { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:`1px solid ${C.cardBdr}` },
  bulkPickName:     { fontSize:12.5, fontWeight:700 },
  bulkPickSub:      { fontSize:11, color:C.txtMuted, marginTop:1 },
  bulkAlreadyTag:   { fontSize:10, fontWeight:700, background:'#f1f3f7', color:C.txtMuted, padding:'2px 8px', borderRadius:10, marginLeft:'auto', flexShrink:0, alignSelf:'center' },
  bulkResolveNote:  (ok) => ({ fontSize:10.5, marginTop:4, padding:'3px 8px', borderRadius:5, display:'inline-flex', alignItems:'center', gap:4, fontWeight:600, background: ok ? C.greenLight : C.redLight, color: ok ? C.greenDark : C.red }),
  bulkModalFooter:  { padding:'14px 22px 20px', display:'flex', justifyContent:'flex-end', gap:10, marginTop:6 },
  bulkBtnSecondary: { background:'#fff', color:C.txtPrimary, border:`1px solid ${C.cardBdr}`, padding:'9px 16px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans },
  bulkBtnPrimary:   (disabled) => ({ background: disabled ? '#9db8e8' : C.blue, color:'#fff', border:'none', padding:'9px 16px', borderRadius:7, fontSize:13, fontWeight:700, cursor: disabled?'default':'pointer', fontFamily:F.sans, opacity: disabled?0.6:1 }),
  bulkResultBody:       { padding:'20px 22px 6px' },
  bulkResultBanner:     { display:'flex', alignItems:'center', gap:10, background:C.greenLight, borderRadius:8, padding:'12px 14px', marginBottom:14 },
  bulkResultCheck:      { width:26, height:26, borderRadius:'50%', background:C.green, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 },
  bulkResultTitle:      { fontSize:13.5, fontWeight:700, color:'#14532d' },
  bulkResultSub:        { fontSize:11.5, color:'#166534', marginTop:1 },
  bulkFlagSectionTitle: { fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:C.red, margin:'4px 0 8px' },
  bulkFlagRow:          { display:'flex', alignItems:'center', justifyContent:'space-between', background:C.redLight, borderRadius:7, padding:'9px 12px', marginBottom:6 },
  bulkFlagName:         { fontSize:12.5, fontWeight:700 },
  bulkFlagReason:       { fontSize:11, color:'#991b1b', marginTop:1 },
  bulkFlagAction:       { fontSize:11.5, fontWeight:700, color:C.blue, flexShrink:0, cursor:'pointer' },

  errBanner:    { background:C.redLight, color:C.red, padding:'10px 28px', fontSize:13 },
  footer:       { textAlign:'center', fontSize:11, color:C.txtMuted, padding:'16px 0', borderTop:`1px solid ${C.cardBdr}`, margin:'20px 28px 0' },

  // EDIT PROPERTY / EDIT UNIT MODALS (shared shapes — proper Edit functionality)
  editBtn:          { display:'flex', alignItems:'center', gap:5, background:'#fff', border:`1px solid ${C.cardBdr}`, borderRadius:6, padding:'6px 13px', fontSize:12, fontWeight:600, color:C.txtPrimary, cursor:'pointer', fontFamily:F.sans, marginLeft:10 },
  editFormGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 14px' },
  editLabel:        { fontSize:10, fontWeight:700, color:C.txtMuted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 },
  editInput:        { width:'100%', height:36, border:`1px solid ${C.cardBdr}`, borderRadius:6, padding:'0 10px', fontSize:12.5, color:C.txtPrimary, fontFamily:F.sans, outline:'none', background:'#fff', boxSizing:'border-box' },
  editImgGrid:      { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginTop:8 },
  editImgSlot:      { display:'flex', flexDirection:'column', alignItems:'center' },
  editImgX:         { position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 },
  editImgReplaceBtn:{ marginTop:5, fontSize:10.5, fontWeight:600, color:C.blue, background:'none', border:'none', cursor:'pointer', fontFamily:F.sans, padding:0 },
  editAmenityGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, maxHeight:195, overflowY:'auto', paddingRight:4 },
  // Session 58 fix — selected state was too heavy (solid blue border + solid
  // blueLight fill); per explicit feedback, both are now a barely-there
  // tint of C.blue (rgba at low alpha) rather than a flat token color.
  editAmenityItem:  (checked) => ({ display:'flex', alignItems:'center', gap:7, background: checked ? 'rgba(61,142,240,0.055)' : '#f8f9fb', border:`1px solid ${checked ? 'rgba(61,142,240,0.18)' : 'transparent'}`, borderRadius:6, padding:'7px 9px', fontSize:12, cursor:'pointer', color: checked ? C.blueDark : C.txtPrimary, fontFamily:F.sans }),
  editGalWrap:      { position:'relative', borderRadius:8, overflow:'hidden' },
  editGalX:         { position:'absolute', top:6, right:6, width:22, height:22, borderRadius:'50%', background:'rgba(0,0,0,0.65)', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, zIndex:2 },
};

// ─── Edit Property — field options derived from the backend's real choices
// (OWNERSHIP_TYPE_CHOICES / PROPERTY_TYPE_CHOICES confirmed live against
// properties/models.py — not guessed) ──────────────────────────────────────────
const EDIT_PROPERTY_TYPE_OPTIONS = Object.entries(PROP_TYPE_LABEL).map(([value, label]) => ({ value, label }));
const EDIT_OWNERSHIP_TYPE_OPTIONS = [
  { value: 'SELF_OWNED', label: 'Self-Owned' },
  { value: 'CO_OWNED',   label: 'Co-Owned' },
  { value: 'CORPORATE',  label: 'Corporate / LLC' },
  { value: 'LEASEHOLD',  label: 'Leasehold' },
];
const EDIT_COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'SG', label: 'Singapore' },
];
const EDIT_STATES = {
  US: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  IN: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'],
  AE: ['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'],
  GB: ['England','Scotland','Wales','Northern Ireland'],
  AU: ['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','Australian Capital Territory','Northern Territory'],
  CA: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan'],
  SG: ['Central Region','East Region','North Region','North-East Region','West Region'],
};

// ─── Unit pill helper ─────────────────────────────────────────────────────────
const unitPillCfg = s => {
  if (['OCCUPIED','LEASED','ACTIVE'].includes(s)) return { bg:C.greenLight, col:C.greenDark, label:'PAID' };
  if (s === 'OVERDUE') return { bg:C.redLight, col:C.red, label:'OVERDUE' };
  return { bg:C.stdBg, col:C.stdTx, label:'VACANT' };
};

const maintBadgeCfg = p => {
  if (p==='URGENT'||p==='HIGH') return { bg:C.redLight, col:C.red };
  if (p==='MEDIUM') return { bg:C.amberLight, col:C.amber };
  return { bg:C.stdBg, col:C.stdTx };
};

// Session 53 fix: same large click-to-enlarge lightbox used on
// LandlordUnitDetailPage.jsx / PMUnitDetailPage.jsx / PMPropertyDetailPage.jsx.
function GalleryLightbox({ items, index, onClose, onNav }) {
  const item = items[index];
  const total = items.length;
  const go = (delta) => { if (total < 1) return; onNav(((index + delta) % total + total) % total); };
  const isVideo = item?.file_type === 'VIDEO';
  const src = item?.file_url;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
      <button onClick={onClose} style={{ position:'absolute', top:20, right:20, width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:1000 }}>
        <i className="ti ti-x" style={{ fontSize:18, color:'#fff' }} />
      </button>
      {isVideo ? (
        <video src={src} controls autoPlay onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'88vh', borderRadius:10, outline:'none', display:'block' }} />
      ) : (
        <img src={src} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'88vh', borderRadius:10, objectFit:'contain', display:'block' }} />
      )}
      {total > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); go(-1); }} style={{ position:'absolute', left:20, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <i className="ti ti-chevron-left" style={{ fontSize:20, color:'#fff' }} />
          </button>
          <button onClick={e => { e.stopPropagation(); go(1); }} style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <i className="ti ti-chevron-right" style={{ fontSize:20, color:'#fff' }} />
          </button>
          <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.7)', fontSize:13, fontFamily:F.sans }}>{index + 1} / {total}</div>
        </>
      )}
    </div>
  );
}

// ─── GalleryImage ─────────────────────────────────────────────────────────────
function GImg({ src, fallback, alt, style }) {
  const [useFB, setUseFB] = useState(!src);
  return (
    <div style={{ position:'relative', overflow:'hidden', width:'100%', height:'100%',minHeight:0, ...style }}>
      <img
        src={useFB ? fallback : src}
        alt={alt}
        style={S.galImg}
        onError={() => setUseFB(true)}
      />
      {useFB && <div style={S.sampleBanner}>Sample Image</div>}
    </div>
  );
}

// ─── Unit image with fallback ─────────────────────────────────────────────────
function UnitImg({ src, rentBadge }) {
  const [useFB, setUseFB] = useState(!src);
  const pill = rentBadge;
  return (
    <div style={S.unitImgWrap}>
      {useFB ? (
        <div style={S.unitImgFallback}>
          <i className="ti ti-home" style={{ fontSize:22, color:C.txtMuted }} aria-hidden="true" />
          <div style={{ fontSize:9, color:C.txtMuted, letterSpacing:1, textTransform:'uppercase' }}>Sample image</div>
        </div>
      ) : (
        <img src={src} alt="Unit" style={S.unitImg} onError={() => setUseFB(true)} />
      )}
      <span style={S.unitRentBadge(pill.bg, pill.col)}>{pill.label}</span>
    </div>
  );
}

// ─── Rent bar chart ───────────────────────────────────────────────────────────
function RentBarChart() {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const amounts = [390, 395, 398, 428, 410];
    const maxVal = Math.max(...amounts);
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: ['JUN','JUL','AUG','SEP','OCT'],
        datasets: [{
          data: amounts,
          backgroundColor: amounts.map(a => a === maxVal ? C.navBg : '#c5d5ea'),
          borderRadius: { topLeft:4, topRight:4 },
          borderSkipped: false,
          barPercentage: 0.6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: v => '$'+v.raw.toLocaleString() } } },
        scales: {
          x: { grid:{ display:false }, ticks:{ font:{ size:9, family:F.sans }, color:'#9ca3af' } },
          y: { grid:{ color:'#f3f4f6' }, ticks:{ font:{ size:9, family:F.sans }, color:'#9ca3af', callback: v => '$'+(v/1000)+'K' } },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);
  return (
    <div style={{ position:'relative', height:100, marginBottom:14 }}>
      <canvas ref={ref} role="img" aria-label="Monthly rent collection bar chart" />
      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'rgba(0,0,0,0.45)', color:'#fff', fontSize:10, fontWeight:700,
        letterSpacing:1.2, padding:'3px 10px', borderRadius:3, textTransform:'uppercase', whiteSpace:'nowrap',
      }}>
        Sample Graph
      </div>
    </div>
  );
}

// ─── Filter Modal ─────────────────────────────────────────────────────────────
function FilterModal({ onClose }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={S.modalHdr}>
          <div style={S.modalTitle}>
            <i className="ti ti-adjustments-horizontal" style={{ fontSize:18 }} aria-hidden="true" />
            Filter Properties
          </div>
          <button style={S.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={S.filterGrid}>
          {[
            { lbl:'Property Type', icon:'ti-building',    opts:['All Properties','Apartment','Multi-Family','Villa','Commercial'] },
            { lbl:'Unit Type',     icon:'ti-door',        opts:['All Types','Studio','1 Bed','2 Bed','3 Bed','4 Bed+'] },
            { lbl:'Unit Status',   icon:'ti-info-circle', opts:['All Status','Occupied','Vacant','Overdue'] },
            { lbl:'Bed',           icon:'ti-bed',         opts:['Any','1','2','3','4+'] },
            { lbl:'Bath',          icon:'ti-bath',        opts:['Any','1','2','3+'] },
            { lbl:'Sqft range',    icon:'ti-ruler',       opts:['Any','< 500','500–1000','1000–2000','2000+'] },
          ].map(f => (
            <div key={f.lbl} style={S.filterField}>
              <label style={S.filterLbl}>
                <i className={`ti ${f.icon}`} style={{ fontSize:13, color:C.txtMuted }} aria-hidden="true" />
                {f.lbl}
              </label>
              <select style={S.filterSelect}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={S.modalFooter}>
          <button style={S.resetBtn} onClick={onClose}>Reset</button>
          <button style={S.applyBtn} onClick={onClose}>Apply Filter</button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Add Service modal ─────────────────────────────────────────────────────
// Deliberately does NOT touch PaymentCartContext/PaymentCartModal — bulk-
// adding a service across units is assignment of something already owned at
// the account level, not a purchase (Entitlement doc §4.2). Only "Buy
// Service" (account-level, Settings → Services) goes through the Payment
// Cart.
//
// Session 40 — wired to the real bulk endpoint. Two stages remain (pick,
// result), but the result stage no longer shows a per-unit "flagged" list —
// see the comment above SERVICE_FALLBACK_ICON for why: the real endpoint is
// atomic, so it's either full success or one error covering the whole
// batch. The picker still warns inline that a bank-account-requiring
// service MIGHT fail for units without one, using a real per-unit lookup
// (ownedBankAccounts) rather than a client-side resolution guess.
//
// NOTE: "+ Add Bank Account" here navigates to Settings → Bank Accounts
// rather than opening an inline modal, the same simplification made in
// LandlordUnitDetailPage.jsx's Add Service modal (BankAccountModal isn't
// factored out into a shared component yet).
function BulkAddServiceModal({ propId, propName, units, ownedServices, unitServicesMap, onClose, onComplete }) {
  const [serviceId, setServiceId] = useState(ownedServices[0]?.id ?? null);
  const [checked, setChecked] = useState({});
  const [stage, setStage] = useState('pick'); // 'pick' | 'result'
  const [result, setResult] = useState(null); // { addedCount, serviceName } on success
  const [submitError, setSubmitError] = useState(null); // string on failure
  const [submitting, setSubmitting] = useState(false);

  const service = ownedServices.find(s => s.id === serviceId);
  const getUnitServiceIds = unitId => unitServicesMap[unitId] || [];
  const isAssigned = unit => getUnitServiceIds(unit.id).includes(serviceId);
  const eligibleUnits = units.filter(u => !isAssigned(u));
  const alreadyUnits = units.filter(u => isAssigned(u));

  // Reset the checklist to "all eligible units checked" whenever the picked
  // service changes.
  useEffect(() => {
    setChecked(Object.fromEntries(
      units.filter(u => !getUnitServiceIds(u.id).includes(serviceId)).map(u => [u.id, true])
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, units]);

  const toggle = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const checkedCount = eligibleUnits.filter(u => checked[u.id]).length;
  const allEligibleChecked = eligibleUnits.length > 0 && eligibleUnits.every(u => checked[u.id]);
  const toggleAll = () => {
    setChecked(Object.fromEntries(eligibleUnits.map(u => [u.id, !allEligibleChecked])));
  };

  const goToBankAccounts = () => { window.location.href = '/landlord-portal/settings'; };

  const handleSubmit = async () => {
    const selected = eligibleUnits.filter(u => checked[u.id]);
    if (selected.length === 0 || !service) return;
    setSubmitting(true);
    setSubmitError(null);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/properties/${propId}/units/services/bulk/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ service: serviceId, unit_ids: selected.map(u => u.id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.service?.[0] || body?.detail || `Request rejected (${res.status})`;
        setSubmitError(message);
        setStage('result');
        setSubmitting(false);
        return;
      }
      onComplete(); // tells the parent to re-fetch unitServicesMap
      setResult({ addedCount: selected.length, serviceName: service.name });
      setStage('result');
    } catch (e) {
      setSubmitError('Network error — please try again.');
      setStage('result');
    }
    setSubmitting(false);
  };

  if (stage === 'result' && (result || submitError)) {
    return (
      <div style={S.bulkOverlay} onClick={onClose}>
        <div style={S.bulkModal} onClick={e => e.stopPropagation()}>
          <div style={S.bulkModalHdr}>
            <h3 style={S.bulkModalHdrTitle}>Add Service to All Units</h3>
            <p style={S.bulkModalHdrSub}>{propName} · {result ? result.serviceName : service?.name}</p>
          </div>
          <div style={S.bulkResultBody}>
            {result && (
              <div style={S.bulkResultBanner}>
                <div style={S.bulkResultCheck}>✓</div>
                <div>
                  <div style={S.bulkResultTitle}>{result.addedCount} Added</div>
                  <div style={S.bulkResultSub}>{result.serviceName} is now active on {result.addedCount} unit{result.addedCount === 1 ? '' : 's'}.</div>
                </div>
              </div>
            )}
            {submitError && (
              <>
                <div style={S.bulkFlagSectionTitle}>Nothing was added</div>
                <div style={S.bulkFlagRow}>
                  <div>
                    <div style={S.bulkFlagName}>The batch was rejected</div>
                    <div style={S.bulkFlagReason}>{submitError}</div>
                  </div>
                  <span style={S.bulkFlagAction} onClick={goToBankAccounts}>+ Add Bank Account</span>
                </div>
              </>
            )}
          </div>
          <div style={S.bulkModalFooter}>
            <button style={S.bulkBtnPrimary(false)} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.bulkOverlay} onClick={onClose}>
      <div style={S.bulkModal} onClick={e => e.stopPropagation()}>
        <div style={S.bulkModalHdr}>
          <h3 style={S.bulkModalHdrTitle}>Add Service to All Units</h3>
          <p style={S.bulkModalHdrSub}>{propName} · {units.length} unit{units.length === 1 ? '' : 's'}</p>
        </div>

        <div style={S.bulkSvcRow}>
          <div style={S.bulkSvcLbl}>Service</div>
          <CustomDropdown
            options={ownedServices.map(s => ({
              value: s.id,
              label: `${s.name} — ${s.price} ${s.priceUnit}${s.requiresBankAccount ? ' · requires bank account' : ''}`,
            }))}
            value={serviceId}
            onChange={setServiceId}
            placeholder="Select a service…"
          />
          {ownedServices.length === 0 && (
            <div style={{ fontSize: 11.5, color: C.txtMuted, marginTop: 4 }}>
              No services on your account yet — buy one from Settings → Services first.
            </div>
          )}
        </div>

        <div style={S.bulkSelectAllRow}>
          <label style={S.bulkSelectAllLbl}>
            <input type="checkbox" checked={allEligibleChecked} onChange={toggleAll} disabled={eligibleUnits.length === 0} style={{ accentColor: C.blue, width: 15, height: 15 }} />
            Select all
          </label>
          <span style={S.bulkSelectCount}>{checkedCount} of {eligibleUnits.length} eligible units selected</span>
        </div>

        <div style={S.bulkPickList}>
          {alreadyUnits.map(u => (
            <div key={u.id} style={{ ...S.bulkPickRow, opacity: 0.55 }}>
              <input type="checkbox" disabled style={{ marginTop: 3, width: 15, height: 15, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={S.bulkPickName}>{u.unit_name}</div>
                <div style={S.bulkPickSub}>{u.tenant_name || 'Vacant'}</div>
              </div>
              <span style={S.bulkAlreadyTag}>Already added</span>
            </div>
          ))}
          {eligibleUnits.map(u => {
            const isChecked = !!checked[u.id];
            return (
              <div key={u.id} style={S.bulkPickRow}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(u.id)}
                  style={{ marginTop: 3, width: 15, height: 15, accentColor: C.blue, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={S.bulkPickName}>{u.unit_name}</div>
                  <div style={S.bulkPickSub}>{u.tenant_name || 'Vacant'}</div>
                  {isChecked && service?.requiresBankAccount && (
                    <div style={S.bulkResolveNote(true)}>
                      Requires a resolvable bank account — checked by the server when you submit. If any selected unit can't resolve one, the whole batch is rejected (nothing is added).
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {eligibleUnits.length === 0 && alreadyUnits.length > 0 && (
            <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic', padding: '10px 0' }}>Every unit already has this service.</div>
          )}
          {units.length === 0 && (
            <div style={{ fontSize: 12, color: C.txtMuted, padding: '14px 0' }}>No units on this property yet.</div>
          )}
        </div>

        <div style={S.bulkModalFooter}>
          <button style={S.bulkBtnSecondary} onClick={onClose}>Cancel</button>
          <button
            style={S.bulkBtnPrimary(checkedCount === 0 || submitting || !service)}
            disabled={checkedCount === 0 || submitting || !service}
            onClick={handleSubmit}
          >
            {submitting ? 'Adding…' : `Add to ${checkedCount} Unit${checkedCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Property Modal — proper Edit functionality (text fields, address,
// per-slot image replace/remove, and amenity add/remove) requested
// explicitly: "No.. I need a proper edit functionality for both Property
// and Unit to be build now itself." All fields below are confirmed
// PATCH-able server-side with zero backend change (PropertyWriteSerializer
// already accepts every one of them); image removal uses a JSON
// PATCH {field: null} (confirmed live against the real API — multipart
// can't express "clear this field", so clear and replace use two
// different request shapes); amenity add/remove uses the existing
// POST .../amenities/ plus the newly-added
// DELETE .../amenities/<amenity_id>/ (see properties/views.py
// PropertyAmenityDetailView — added this session because no removal
// endpoint existed at all before).
function EditPropertyModal({ propId, prop, amenities, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:           prop.name || '',
    property_type:  prop.property_type || '',
    value:          prop.value ?? '',
    build_year:     prop.build_year ?? '',
    ownership_type: prop.ownership_type || '',
    description:    prop.description || '',
    country:        prop.country || 'US',
    street1:        prop.street1 || '',
    street2:        prop.street2 || '',
    landmark:       prop.landmark || '',
    city:           prop.city || '',
    state:          prop.state || '',
    zip_code:       prop.zip_code || '',
  });
  const upd = patch => setForm(f => ({ ...f, ...patch }));

  const [amenityMaster, setAmenityMaster]         = useState([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState(new Set((amenities || []).map(a => a.id)));
  const [amenitySearch, setAmenitySearch]         = useState('');

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Image slots — pendingFiles holds a File chosen to replace a slot;
  // clearedSlots marks a slot the user explicitly removed. Both are local
  // until Save, so Cancel discards them with no server calls made.
  const [pendingFiles, setPendingFiles]   = useState({});
  const [clearedSlots, setClearedSlots]   = useState(new Set());
  const fileInputRefs = useRef({});

  // Video — Property's hero-video-autoplay display (see galleryList /
  // heroVideoIdx below in LandlordPropertyDetailPage) reads only the
  // gallery relation for a VIDEO-type item, not the legacy video_url field,
  // so video is managed the same way as Unit's gallery video: an immediate
  // POST/DELETE against /api/properties/<id>/gallery/, same pattern as
  // EditUnitModal's handleAddGalleryInModal/handleDeleteGalleryItem. Only
  // one video is supported (matches heroVideoIdx picking the first VIDEO
  // item it finds), so the UI shows either the current video + remove, or
  // an "Add video" tile — never both.
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const videoInputRef = useRef(null);
  const videoItem = (prop.gallery_images || []).find(g => g && g.file_type === 'VIDEO') || null;

  const handleAddVideo = async (file) => {
    if (!file) return;
    setUploadingVideo(true);
    try {
      const token = localStorage.getItem('access_token');
      const fd = new FormData();
      fd.append('file_url', file);
      fd.append('file_type', 'VIDEO');
      const r = await fetch(`${API_BASE}/properties/${propId}/gallery/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!r.ok) throw new Error(`Could not upload video (${r.status})`);
      await onSaved();
    } catch (e) {
      setSaveError(e.message || 'Could not upload that video.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async (galleryId) => {
    setDeletingVideoId(galleryId);
    try {
      const token = localStorage.getItem('access_token');
      const r = await fetch(`${API_BASE}/properties/${propId}/gallery/${galleryId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok && r.status !== 204) throw new Error(`Could not remove video (${r.status})`);
      await onSaved();
    } catch (e) {
      setSaveError(e.message || 'Could not remove that video.');
    } finally {
      setDeletingVideoId(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/amenities/?category=PROPERTY`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(j => setAmenityMaster((j || []).map(a => ({ id: a.id, icon: a.icon, name: a.name }))))
      .catch(() => setAmenityMaster([]));
  }, []);

  const toggleAmenity = (id) => {
    setSelectedAmenityIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const IMAGE_SLOTS = [
    { key: 'main_image_url', label: 'Main photo' },
    { key: 'thumb1_url',     label: 'Photo 2' },
    { key: 'thumb2_url',     label: 'Photo 3' },
    { key: 'thumb3_url',     label: 'Photo 4' },
  ];

  const slotCurrentUrl = (key) => {
    if (clearedSlots.has(key)) return null;
    if (pendingFiles[key]) return URL.createObjectURL(pendingFiles[key]);
    return prop[key] || null;
  };

  const handlePickFile = (key, file) => {
    if (!file) return;
    setPendingFiles(prev => ({ ...prev, [key]: file }));
    setClearedSlots(prev => { const n = new Set(prev); n.delete(key); return n; });
  };

  const handleClearSlot = (key) => {
    setPendingFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
    setClearedSlots(prev => new Set(prev).add(key));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const token = localStorage.getItem('access_token');

      // 1 — text / address fields as one JSON PATCH
      const textBody = {
        name: form.name,
        property_type: form.property_type,
        value: form.value === '' ? null : form.value,
        build_year: form.build_year === '' ? null : Number(form.build_year),
        ownership_type: form.ownership_type,
        description: form.description,
        country: form.country,
        street1: form.street1,
        street2: form.street2,
        landmark: form.landmark,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
      };
      let res = await fetch(`${API_BASE}/properties/${propId}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(textBody),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || Object.values(e)[0]?.[0] || `Save failed (${res.status})`);
      }

      // 2 — image slots: a cleared slot is a JSON {field: null} PATCH, a
      // replaced slot is a multipart PATCH with just that one field.
      for (const { key } of IMAGE_SLOTS) {
        if (clearedSlots.has(key)) {
          const r = await fetch(`${API_BASE}/properties/${propId}/`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: null }),
          });
          if (!r.ok) throw new Error(`Could not remove ${key.replace('_url', '')} (${r.status})`);
        } else if (pendingFiles[key]) {
          const fd = new FormData();
          fd.append(key, pendingFiles[key]);
          const r = await fetch(`${API_BASE}/properties/${propId}/`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (!r.ok) throw new Error(`Could not upload ${key.replace('_url', '')} (${r.status})`);
        }
      }

      // 3 — amenities: diff selected vs original, add/remove only the delta
      const originalIds = new Set((amenities || []).map(a => a.id));
      const toAdd    = [...selectedAmenityIds].filter(id => !originalIds.has(id));
      const toRemove = [...originalIds].filter(id => !selectedAmenityIds.has(id));
      for (const amenityId of toAdd) {
        await fetch(`${API_BASE}/properties/${propId}/amenities/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amenity: amenityId, access_type: 'ALL' }),
        });
      }
      for (const amenityId of toRemove) {
        await fetch(`${API_BASE}/properties/${propId}/amenities/${amenityId}/`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await onSaved();
      onClose();
    } catch (e) {
      setSaveError(e.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  const stateOptions = (EDIT_STATES[form.country] || []).map(s => ({ value: s, label: s }));
  const filteredAmenityMaster = amenitySearch
    ? amenityMaster.filter(a => a.name.toLowerCase().includes(amenitySearch.toLowerCase()))
    : amenityMaster;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modalBox, width: 680, maxHeight: '86vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHdr}>
          <div style={S.modalTitle}><i className="ti ti-pencil" aria-hidden="true" /> Edit Property</div>
          <button style={S.modalClose} onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {saveError && <div style={{ ...S.errBanner, borderRadius: 8, padding: '9px 12px', marginBottom: 14 }}><i className="ti ti-alert-circle" aria-hidden="true" /> {saveError}</div>}

        <div style={S.editFormGrid}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={S.editLabel}>Property Name</div>
            <input style={S.editInput} value={form.name} onChange={e => upd({ name: e.target.value })} />
          </div>
          <div>
            <div style={S.editLabel}>Property Type</div>
            <CustomDropdown options={EDIT_PROPERTY_TYPE_OPTIONS} value={form.property_type} onChange={v => upd({ property_type: v })} placeholder="Select Type" />
          </div>
          <div>
            <div style={S.editLabel}>Ownership Type</div>
            <CustomDropdown options={EDIT_OWNERSHIP_TYPE_OPTIONS} value={form.ownership_type} onChange={v => upd({ ownership_type: v })} placeholder="Select Ownership" />
          </div>
          <div>
            <div style={S.editLabel}>Value ($)</div>
            <input style={S.editInput} type="number" value={form.value} onChange={e => upd({ value: e.target.value })} />
          </div>
          <div>
            <div style={S.editLabel}>Build Year</div>
            <input style={S.editInput} type="number" value={form.build_year} onChange={e => upd({ build_year: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={S.editLabel}>Description</div>
            <textarea style={{ ...S.editInput, height: 70, resize: 'vertical', paddingTop: 8 }} value={form.description} onChange={e => upd({ description: e.target.value })} />
          </div>

          <div style={{ gridColumn: '1 / -1', ...S.secLbl, marginTop: 4 }}>Address</div>
          <div>
            <div style={S.editLabel}>Country</div>
            <CustomDropdown options={EDIT_COUNTRY_OPTIONS} value={form.country} onChange={v => upd({ country: v, state: '' })} placeholder="Select Country" />
          </div>
          <div>
            <div style={S.editLabel}>State</div>
            <CustomDropdown options={stateOptions} value={form.state} onChange={v => upd({ state: v })} placeholder={form.country ? 'Select State' : 'Select country first'} disabled={!form.country} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={S.editLabel}>Street Address</div>
            <input style={S.editInput} value={form.street1} onChange={e => upd({ street1: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={S.editLabel}>Street Address 2 (optional)</div>
            <input style={S.editInput} value={form.street2} onChange={e => upd({ street2: e.target.value })} />
          </div>
          <div>
            <div style={S.editLabel}>Landmark</div>
            <input style={S.editInput} value={form.landmark} onChange={e => upd({ landmark: e.target.value })} />
          </div>
          <div>
            <div style={S.editLabel}>City</div>
            <input style={S.editInput} value={form.city} onChange={e => upd({ city: e.target.value })} />
          </div>
          <div>
            <div style={S.editLabel}>ZIP / Postal Code</div>
            <input style={S.editInput} value={form.zip_code} onChange={e => upd({ zip_code: e.target.value })} />
          </div>
        </div>

        <div style={{ ...S.secLbl, marginTop: 18 }}>Photos</div>
        <div style={S.editImgGrid}>
          {IMAGE_SLOTS.map(({ key, label }) => {
            const url = slotCurrentUrl(key);
            // Session 57 fix — unified with Unit's Gallery Photos / Floor Plan
            // pattern: the tile itself is the click target (no separate
            // "Replace"/"Upload" text link underneath).
            return (
              <div key={key} style={S.editImgSlot}>
                <div
                  onClick={() => fileInputRefs.current[key]?.click()}
                  style={{ position: 'relative', width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', background: C.pageBg, cursor: 'pointer' }}
                >
                  {url ? (
                    <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: C.txtMuted, fontSize: 11, border: `1px dashed ${C.cardBdr}`, borderRadius: 8 }}>
                      <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
                      Upload
                    </div>
                  )}
                  {url && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleClearSlot(key); }}
                      style={S.editImgX}
                      aria-label={`Remove ${label}`}
                    >
                      <i className="ti ti-x" style={{ fontSize: 12 }} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: C.txtMuted, marginTop: 4, textAlign: 'center' }}>{label}</div>
                <input
                  ref={el => (fileInputRefs.current[key] = el)}
                  type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handlePickFile(key, f); }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ ...S.secLbl, marginTop: 18 }}>Video</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 8 }}>
          <div style={S.editImgSlot}>
            {videoItem ? (
              <div style={{ position: 'relative', width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', background: C.pageBg }}>
                <video src={videoItem.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                <button
                  type="button"
                  onClick={() => handleDeleteVideo(videoItem.id)}
                  disabled={deletingVideoId === videoItem.id}
                  style={S.editImgX}
                  aria-label="Remove video"
                >
                  <i className={`ti ${deletingVideoId === videoItem.id ? 'ti-loader-2' : 'ti-x'}`} style={{ fontSize: 12 }} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => { if (!uploadingVideo) videoInputRef.current?.click(); }}
                style={{ width: '100%', height: 90, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: C.txtMuted, fontSize: 11, border: `1px dashed ${C.cardBdr}`, cursor: uploadingVideo ? 'wait' : 'pointer' }}
              >
                <i className={`ti ${uploadingVideo ? 'ti-loader-2' : 'ti-video-plus'}`} style={{ fontSize: 16 }} aria-hidden="true" />
                {uploadingVideo ? 'Uploading…' : 'Add video'}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: C.txtMuted, marginTop: 4, textAlign: 'center' }}>Video tour</div>
            <input
              ref={videoInputRef}
              type="file" accept="video/mp4,video/quicktime" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddVideo(f); }}
            />
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: C.txtMuted, marginTop: 4 }}>
          When a video is set, it plays automatically in the hero spot on the Property page.
        </div>

        <div style={{ ...S.secLbl, marginTop: 18 }}>Amenities</div>
        <input
          style={{ ...S.editInput, marginBottom: 8 }}
          placeholder="Search amenities…"
          value={amenitySearch}
          onChange={e => setAmenitySearch(e.target.value)}
        />
        <div style={S.editAmenityGrid}>
          {filteredAmenityMaster.map(a => {
            const checked = selectedAmenityIds.has(a.id);
            const { icon, bg, color } = amenityStyle(a.name);
            return (
              <div key={a.id} onClick={() => toggleAmenity(a.id)} style={S.editAmenityItem(checked)}>
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${a.icon || icon}`} style={{ fontSize: 12, color }} aria-hidden="true" />
                </div>
                <span style={{ flex: 1 }}>{a.name}</span>
                {checked && <i className="ti ti-circle-check-filled" style={{ fontSize: 14, color: C.blue }} aria-hidden="true" />}
              </div>
            );
          })}
          {filteredAmenityMaster.length === 0 && (
            <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic' }}>No amenities found.</div>
          )}
        </div>

        <div style={{ ...S.modalFooter, marginTop: 20 }}>
          <button style={S.resetBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={S.applyBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandlordPropertyDetailPage() {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('Chats');
  const [showFilter,   setShowFilter]   = useState(false);
  const [showBulkAdd,  setShowBulkAdd]  = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(false);
  // LST-8's real "List Ready" gate — rendered as a modal (see that file's
  // own header note for why), not a routed page, so it's just local state.
  const [showUnitSelection, setShowUnitSelection] = useState(false);
  const [showNewChat,  setShowNewChat]  = useState(false);
  const [openChatId,   setOpenChatId]   = useState(null);
  const [openNotifId,  setOpenNotifId]  = useState(null);
  const [replyText,    setReplyText]    = useState({});

  // Unit Services (bulk, SVC-1, Session 40) — real data. ownedServices is
  // this landlord's account-level entitlement (GET
  // /landlord/account/services/, same source LandlordUnitDetailPage.jsx
  // uses). unitServicesMap is { [unitId]: [serviceId, ...] }, built from one
  // real GET per unit against /properties/<pk>/units/<uid>/services/ — there
  // is no per-unit services field on LandlordPropertyDetailView's own
  // response, so this page fetches it separately. Both pages now read the
  // same real UnitService rows, so a bulk add here shows up immediately on
  // LandlordUnitDetailPage.jsx (no FE-only store needed to keep them in
  // sync anymore).
  const [ownedServices, setOwnedServices] = useState([]);
  const [unitServicesMap, setUnitServicesMap] = useState({});

  const pathParts = window.location.pathname.split('/');
  const propId    = pathParts[pathParts.indexOf('property') + 1];

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/account/services/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setOwnedServices(j.services || []))
      .catch(() => setOwnedServices([]));
  }, []);

  // Fetches every listed unit's assigned services in one pass. Re-run after
  // a successful bulk add so the picker/checklist reflect the new state.
  const refreshUnitServices = React.useCallback((unitList) => {
    const token = localStorage.getItem('access_token');
    Promise.all(
      unitList.map(u =>
        fetch(`${API_BASE}/properties/${propId}/units/${u.id}/services/`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        })
          .then(r => (r.ok ? r.json() : []))
          .then(rows => [u.id, (rows || []).map(row => row.service)])
          .catch(() => [u.id, []])
      )
    ).then(pairs => setUnitServicesMap(Object.fromEntries(pairs)));
  }, [propId]);

  // Session 56 — pulled out of the effect below so the new "Add images"
  // upload flow (further down) can re-run the same fetch afterward and
  // pick up the real main_image_url/thumbN_url the backend just saved,
  // instead of trusting local state to guess what the server now has.
  const fetchPropertyDetail = React.useCallback(() => {
    if (!propId) return;
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE}/landlord/property/${propId}/`, {
      headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    })
      .then(r => { if(!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [propId]);

  useEffect(() => { fetchPropertyDetail(); }, [fetchPropertyDetail]);

  // Session 56 — real "Add images" upload, replacing the old
  // alert('Image upload coming soon') stub. Fills the first empty slot
  // among main_image_url/thumb1_url/thumb2_url/thumb3_url (same fields
  // AddNewProperty.jsx's Primary Info tab writes to), via the same
  // multipart PATCH /api/properties/<id>/ the create flow uses — no new
  // backend endpoint needed, PropertyWriteSerializer already accepts
  // these fields from either persona. On success, refetches this page's
  // own data so the real image replaces the sample fallback immediately.
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);
  const imageInputRef = useRef(null);

  const emptyImageSlot = () => {
    if (!prop.main_image_url) return 'main_image_url';
    if (!prop.thumb1_url) return 'thumb1_url';
    if (!prop.thumb2_url) return 'thumb2_url';
    if (!prop.thumb3_url) return 'thumb3_url';
    return 'thumb3_url'; // all full — replace the last thumb rather than no-op
  };

  const handleAddImageFile = async (file) => {
    if (!file || !propId) return;
    const slot = emptyImageSlot();
    setUploadingImage(true);
    setImageUploadError(null);
    try {
      const token = localStorage.getItem('access_token');
      const form = new FormData();
      form.append(slot, file);
      const res = await fetch(`${API_BASE}/properties/${propId}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || e.error || `Upload failed (${res.status})`);
      }
      await fetchPropertyDetail();
    } catch (e) {
      setImageUploadError(e.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const prop      = data?.property    || {};
  const stats     = data?.stats       || {};
  const units     = data?.units       || [];
  const owners    = data?.ownerships  || [];
  const amenities = data?.amenities   || [];
  const tickets   = data?.open_tickets|| [];
  const primary   = owners[0]         || {};
  const coOwners  = owners.slice(1);

  // Session 53 fix: mirror PMPropertyDetailPage.jsx's Gallery fix. The
  // backend now also returns the property's full gallery_images
  // ({file_url, file_type}) alongside the long-standing main_image_url/
  // thumb1-3_url quartet. When the gallery holds a video, it becomes the
  // hero and autoplays instead of main_image_url — main_image_url then
  // shifts into the first thumb slot so it isn't lost, and thumb3 is the
  // one dropped to keep the fixed 3-thumb-plus-"Add" grid. Every hero/thumb
  // is clickable into a large lightbox with left/right navigation across
  // every real image/video this property actually has.
  const galleryList = prop.gallery_images || [];
  const heroVideoIdx = galleryList.findIndex(g => g && g.file_type === 'VIDEO');
  const heroIsVideo = heroVideoIdx !== -1;
  const heroVideoItem = heroIsVideo ? galleryList[heroVideoIdx] : null;
  const galHero = heroIsVideo ? (heroVideoItem.file_url || FB.main) : (prop.main_image_url || FB.main);
  const galThumbSlots = heroIsVideo
    ? [prop.main_image_url || null, prop.thumb1_url || null, prop.thumb2_url || null]
    : [prop.thumb1_url || null, prop.thumb2_url || null, prop.thumb3_url || null];
  const galThumbFallbacks = heroIsVideo ? [FB.main, FB.t1, FB.t2] : [FB.t1, FB.t2, FB.t3];
  const galHeroObj = heroIsVideo ? { file_url: heroVideoItem.file_url, file_type: 'VIDEO' }
    : (prop.main_image_url ? { file_url: prop.main_image_url, file_type: 'IMAGE' } : null);
  const galThumbObjs = galThumbSlots.map(u => (u ? { file_url: u, file_type: 'IMAGE' } : null));
  const galLightboxItems = [...(galHeroObj ? [galHeroObj] : []), ...galThumbObjs.filter(Boolean)];
  const galHasRealItems = galLightboxItems.length > 0;
  const [galLightboxIdx, setGalLightboxIdx] = useState(null);
  const galOpenLightbox = (idx) => { if (galHasRealItems && idx != null) setGalLightboxIdx(idx); };
  const galThumbLightboxIdx = (slotUrl) => {
    if (!slotUrl) return null;
    const pos = galThumbObjs.filter(Boolean).findIndex(o => o.file_url === slotUrl);
    return pos === -1 ? null : (galHeroObj ? 1 : 0) + pos;
  };

  // Session 40 (SVC-1) — once the property's units are known, fetch each
  // one's real assigned services for the Bulk Add Service picker/checklist.
  React.useEffect(() => {
    if (units.length > 0) refreshUnitServices(units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units.length, propId]);

  // Health score
  const occ        = stats.occupancy_pct ?? 0;
  const maintScore = stats.maint_open > 0 ? Math.max(0, 100 - stats.maint_open * 20) : 100;
  const healthScore= Math.round((occ * 0.4) + (maintScore * 0.4) + 20);
  const healthCfg  = healthScore >= 70
    ? { label:'Good',            bg:C.greenLight, col:C.greenDark, scoreCol:C.greenDark }
    : healthScore >= 40
    ? { label:'Fair',            bg:C.amberLight, col:C.amber,     scoreCol:C.amber }
    : { label:'Needs attention', bg:C.redLight,   col:C.red,       scoreCol:C.red };

  const tenantUnits = units.filter(u => u.tenant_name);

  const toggleChat = id => setOpenChatId(prev => prev === id ? null : id);
  const toggleNotif = id => setOpenNotifId(prev => prev === id ? null : id);

  return (
    <div style={S.shell}>
      <NavF activePage="properties" />

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
            <div style={S.avatar}>{initials(primary.owner_name || 'L')}</div>
          </div>
        </header>

        <main style={S.content}>
          {error && <div style={S.errBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}

          {/* BREADCRUMB — inside content */}
          <div style={S.bread}>
            <span style={S.breadLink} onClick={() => window.location.href='/landlord-portal/portfolio'}>Properties</span>
            <span style={S.breadSep}>›</span>
            <span style={S.breadCur}>{loading ? '…' : prop.name}</span>
          </div>

          {/* HERO */}
          <div style={S.heroWrap}>
            <div style={S.heroRow}>
              <div>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={S.propName}>{loading ? '…' : prop.name}</div>
                  {prop.property_type && (
                    <span style={S.typeBadge}>{PROP_TYPE_LABEL[prop.property_type] || prop.property_type}</span>
                  )}
                  {!loading && prop.id && (
                    <button style={S.editBtn} onClick={() => setShowEditProperty(true)}>
                      <i className="ti ti-pencil" style={{ fontSize:13 }} aria-hidden="true" /> Edit
                    </button>
                  )}
                </div>
                <div style={S.propAddr}>
                  <i className="ti ti-map-pin" style={{ fontSize:12 }} aria-hidden="true" />
                  {prop.address || `${prop.city}, ${prop.country}`}
                </div>
              </div>

              {/* STATS — 2 cards each with 2 stats + divider */}
              <div style={S.statsWrap}>
                <div style={S.statBox}>
                  <div style={S.statLbl}>Total units</div>
                  <div style={S.statVal}>{stats.total_units ?? '—'} Units</div>
                  <div style={S.statDiv} />
                  <div style={S.statLbl}>Collection</div>
                  <div style={{ ...S.statVal, color:C.txtPrimary }}>{stats.collection_pct ?? 0}%</div>
                </div>
                <div style={S.statBox}>
                  <div style={S.statLbl}>Occupancy</div>
                  <div style={{ ...S.statVal, color:occ >= 80 ? C.greenDark : C.amber }}>{occ}%</div>
                  <div style={S.statDiv} />
                  <div style={S.statLbl}>Maintenance</div>
                  <div style={{ ...S.statVal, color: stats.maint_open > 0 ? C.amber : C.txtPrimary }}>
                    {stats.maint_open > 0 ? `${stats.maint_open} Open` : 'Clear'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GALLERY — outside heroWrap, aligned with page padding */}
          <div style={{ padding:'0 28px' }}>
            <div style={S.gallery}>
              {/* Left — single large image, or the gallery's video when one exists */}
              <div
                onClick={() => galOpenLightbox(galHeroObj ? 0 : null)}
                style={{ position:'relative', overflow:'hidden', borderRadius:8, cursor: galHeroObj ? 'pointer' : 'default' }}
              >
                {heroIsVideo ? (
                  <video src={galHero} muted autoPlay loop playsInline style={S.galImg} />
                ) : (
                  <GImg src={prop.main_image_url} fallback={FB.main} alt={prop.name} style={{ borderRadius:8 }} />
                )}
              </div>

              {/* Right — 2x2 grid */}
              <div style={S.galRight}>
                {galThumbSlots.map((url, i) => (
                  <div key={i}
                    onClick={() => galOpenLightbox(galThumbLightboxIdx(url))}
                    style={{ minHeight:0, overflow:'hidden', borderRadius:6, cursor: galThumbLightboxIdx(url) != null ? 'pointer' : 'default' }}
                  >
                    <GImg src={url} fallback={galThumbFallbacks[i]} alt={`Interior ${i + 1}`} style={{ borderRadius:6 }} />
                  </div>
                ))}
                <div
                  style={{ ...S.galAddCell, opacity: uploadingImage ? 0.6 : 1, cursor: uploadingImage ? 'wait' : 'pointer' }}
                  onClick={() => { if (!uploadingImage) imageInputRef.current?.click(); }}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display:'none' }}
                    onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddImageFile(f); }}
                  />
                  <i className={`ti ${uploadingImage ? 'ti-loader-2' : 'ti-plus'}`} style={{ fontSize:20 }} aria-hidden="true" />
                  <span>{uploadingImage ? 'Uploading…' : 'Add images'}</span>
                </div>
              </div>
            </div>
            {imageUploadError && (
              <div style={{ marginTop:8, fontSize:12.5, color:C.red || '#DC2626' }}>
                <i className="ti ti-alert-circle" aria-hidden="true" /> {imageUploadError}
              </div>
            )}
            {galLightboxIdx !== null && galHasRealItems && (
              <GalleryLightbox items={galLightboxItems} index={galLightboxIdx} onClose={() => setGalLightboxIdx(null)} onNav={setGalLightboxIdx} />
            )}
          </div>


          {/* DESC / OWNERSHIP / HEALTH — 50/25/25 */}
          <div style={S.sw}>
            <div style={S.descRow}>

              {/* 50% — Description + Amenities */}
              <div style={S.card}>
                <div style={S.cardTitle}>{prop.name ? `The vision of ${prop.name}` : 'About this property'}</div>
                {prop.description && (
                  <p style={{ fontSize:12.5, color:C.txtSec, lineHeight:1.7, margin:'8px 0 12px' }}>{prop.description}</p>
                )}
                {amenities.length > 0 ? (
                  <>
                    <div style={{ fontSize:9.5, color:C.txtMuted, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:6, marginTop:prop.description?0:8 }}>Amenities</div>
                    <div style={S.amenityGrid}>
                      {amenities.map(a => {
                        const { icon, bg, color } = amenityStyle(a.name);
                        return (
                          <div key={a.id} style={{ ...S.amenityItem, background: bg }}>
                            <div style={{ ...S.amenityIcon, background: 'rgba(255,255,255,0.65)', color }}>
                              <i className={`ti ${icon}`} style={{ fontSize: 11 }} aria-hidden="true" />
                            </div>
                            {a.name}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize:12, color:C.txtMuted, fontStyle:'italic', marginTop:8 }}>No amenities configured.</div>
                )}
              </div>

              {/* 25% — Ownership Cluster */}
              <div style={S.card}>
                <div style={S.cardTitle}>Ownership Cluster</div>
                <div style={S.secLbl}>Primary owner</div>
                {primary.owner_name ? (
                  <div style={S.ownerRow}>
                    <div style={S.ownerAv}>{initials(primary.owner_name)}</div>
                    <div>
                      <div style={S.ownerName}>{primary.owner_name}</div>
                      <div style={S.ownerSub}>Type: Full ({primary.share_pct}%)</div>
                    </div>
                  </div>
                ) : <div style={{ fontSize:12, color:C.txtMuted }}>—</div>}
                <div style={S.divider} />
                <div style={S.secLbl}>Co-owners</div>
                {coOwners.length > 0
                  ? coOwners.map((o,i) => <div key={i} style={{ fontSize:12.5, color:C.txtSec, marginBottom:4 }}>{o.owner_name} — {o.share_pct}%</div>)
                  : <div style={{ fontSize:12, color:C.txtMuted }}>None registered</div>}
                <div style={S.divider} />
                <div style={S.secLbl}>Assigned Manager</div>
                <div style={{ fontSize:12.5, color:C.txtSec }}>
                  {prop.assigned_pm
                    ? <><i className="ti ti-user-check" style={{ fontSize:12, marginRight:4 }} aria-hidden="true" />{prop.assigned_pm}</>
                    : <span style={{ color:C.txtMuted }}>None assigned</span>}
                </div>
                <button style={S.ledgerBtn}>View Ownership Ledger</button>
              </div>

              {/* 25% — Property Health */}
              <div style={S.card}>
                <div style={S.healthHdr}>
                  <div style={S.cardTitle}>Property Health</div>
                  <span style={S.healthBadge(healthCfg.bg, healthCfg.col)}>{healthCfg.label}</span>
                </div>
                <div style={{ ...S.healthScore, color:healthCfg.scoreCol }}>{healthScore}</div>
                <div style={S.healthSub}>Overall score / 100</div>
                {[
                  { lbl:'Occupancy',       val:`${occ}%`,                         w:occ,        col:occ>=80?C.greenDark:C.amber,       bar:occ>=80?'#16a34a':C.amber },
                  { lbl:'Rent collection', val:'—',                                w:0,          col:C.blue,                             bar:C.blue },
                  { lbl:'Maintenance',     val:stats.maint_open>0?`${stats.maint_open} open`:'Clear', w:maintScore, col:maintScore>50?C.greenDark:C.red, bar:maintScore>50?'#16a34a':C.red },
                  { lbl:'Lease renewals',  val:'0 due',                            w:0,          col:C.txtSec,                           bar:C.amber },
                ].map(m => (
                  <div key={m.lbl} style={S.metricRow}>
                    <div style={S.metricTop}>
                      <span style={{ fontSize:11.5, color:C.txtSec }}>{m.lbl}</span>
                      <span style={{ fontSize:11.5, fontWeight:500, color:m.col }}>{m.val}</span>
                    </div>
                    <div style={S.barTrack}><div style={S.barFill(m.w, m.bar)} /></div>
                  </div>
                ))}
                <div style={S.healthFooter}>
                  <i className="ti ti-info-circle" style={{ fontSize:12, flexShrink:0 }} aria-hidden="true" />
                  Updates monthly from live data
                </div>
              </div>
            </div>

            {/* UNIT INVENTORY */}
            <div style={{ marginBottom:20 }}>
              <div style={S.unitHdr}>
                <div style={S.unitHdrTtl}>Unit Inventory</div>
                <div style={S.unitHdrR}>
                  <button style={S.filterBtn} onClick={() => setShowFilter(true)}>
                    <i className="ti ti-filter" style={{ fontSize:12 }} aria-hidden="true" />
                    Filter
                  </button>
                  <button style={S.btnBulk} onClick={() => setShowBulkAdd(true)}>
                    <i className="ti ti-apps" style={{ fontSize:13 }} aria-hidden="true" />
                    Add Service to All Units
                  </button>
                  {/* "List Ready" gate (LST-8) — now the real thing: this button
                      opens the Unit Selection modal (readiness pulled live
                      from the A6 rules engine, GET .../units/<uid>/readiness/),
                      where the landlord picks which units to include and it
                      routes to the Individual or Multi-Unit wizard depending on
                      how many List Ready units they check. The gate on THIS
                      button is now just "is there anything to pick from" — the
                      real per-unit readiness gate lives on that screen instead
                      of here. Replaces the old `units.length < 2` placeholder. */}
                  <button
                    style={{ ...S.btnMulti, ...(units.length < 1 ? S.btnMultiDisabled : {}) }}
                    disabled={units.length < 1}
                    title={units.length < 1 ? 'Add a unit first to list it on the marketplace' : 'Choose which units to list on the marketplace'}
                    onClick={() => setShowUnitSelection(true)}
                  >
                    <i className="ti ti-layout-grid" style={{ fontSize:13 }} aria-hidden="true" />
                    List Multi Units
                  </button>
                  <button style={S.addUnitBtn} onClick={() => window.location.href = `/landlord-portal/property/${propId}/add-unit`}>+ Add Unit</button>
                </div>
              </div>
              <div style={S.unitGrid}>
                {units.map(u => {
                  const pill = unitPillCfg(u.status);
                  return (
                    <div key={u.id} style={S.unitCard}>
                      <UnitImg src={u.main_image_url || FB.unit} rentBadge={pill} />
                      <div style={S.unitBody}>
                        <div style={S.unitNum}>{u.unit_name}</div>
                        <div style={S.unitTenant}>
                          {u.tenant_name ? `Tenant: ${u.tenant_name}` : 'Vacant'}
                        </div>
                        <div style={S.unitStatusRow}>
                          <span>Lease ends</span>
                          <span style={{ color:C.txtPrimary }}>{u.lease_end || '—'}</span>
                        </div>
                        <div style={{ ...S.unitStatusRow, marginBottom:0 }}>
                          <span>Maintenance</span>
                          <span style={{ color: u.maint_open > 0 ? C.red : C.greenDark, fontWeight:500 }}>
                            {u.maint_open > 0 ? `${u.maint_open} open` : 'Clear'}
                          </span>
                        </div>
                        <div style={S.unitBtns}>
                          <button
                            style={S.unitBtnDark}
                            onClick={() => window.location.href=`/landlord-portal/property/${propId}/unit/${u.id}`}
                          >
                            View Unit
                          </button>
                          <button style={S.unitBtnOut}>Message</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {units.length === 0 && !loading && (
                  <div style={{ fontSize:12, color:C.txtMuted, padding:'12px 0' }}>No units added yet.</div>
                )}
              </div>
            </div>

            {/* ROW 1: Maintenance 35% | Quick Actions 35% | Doc Vault 30% */}
            <div style={S.row1}>

              {/* Maintenance Queue */}
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Maintenance Queue</div>
                  <span style={S.cardLink}>Create ticket</span>
                </div>
                {tickets.length === 0 && <div style={{ fontSize:12, color:C.txtMuted }}>No open tickets.</div>}
                {tickets.map((t,i) => {
                  const bc = maintBadgeCfg(t.priority);
                  return (
                    <div key={t.id} style={{ ...S.maintItem, ...(i===tickets.length-1?{borderBottom:'none'}:{}) }}>
                      <div style={S.maintBadge(bc.bg, bc.col)}>#{t.id}</div>
                      <div style={{ flex:1 }}>
                        <div style={S.maintTitle}>{t.title}</div>
                        <div style={S.maintSub}>{t.priority} · {t.time_ago}</div>
                      </div>
                      <span style={S.statusPill(C.stdBg, C.stdTx)}>{t.status==='IN_PROGRESS'?'In Progress':'Open'}</span>
                    </div>
                  );
                })}
                <div style={{ ...S.divider, marginTop:8 }} />
                <div style={{ fontSize:11, color:C.txtMuted }}>Vendor score <span style={{ color:C.greenDark, fontWeight:500 }}>4.8 ★</span></div>
              </div>

              {/* Quick Actions */}
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Quick Actions</div>
                  <span style={S.statusPill(C.amberLight, C.amber)}>3 pending</span>
                </div>
                {QA_ITEMS.map((q,i) => (
                  <div key={i} style={{ ...S.qaItem, ...(i===QA_ITEMS.length-1?{borderBottom:'none'}:{}) }}>
                    <div style={S.qaIcon(q.bg)}>
                      <i className={`ti ${q.icon}`} style={{ fontSize:13, color:q.col }} aria-hidden="true" />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={S.qaTitle}>{q.title}</div>
                      <div style={S.qaSub}>{q.sub}</div>
                    </div>
                    <span style={S.qaTime}>{q.time}</span>
                  </div>
                ))}
              </div>

              {/* Document Vault */}
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Document Vault</div>
                  <span style={S.cardLink}>Full archive →</span>
                </div>
                {DOC_ITEMS.map((d,i) => (
                  <div key={i} style={{ ...S.docItem, ...(i===DOC_ITEMS.length-1?{borderBottom:'none'}:{}) }}>
                    <div style={S.docIcon(d.bg, d.col)}>
                      <i className={`ti ${d.icon}`} aria-hidden="true" />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:C.txtPrimary }}>{d.name}</div>
                      <div style={{ fontSize:10.5, color:C.txtMuted }}>{d.meta}</div>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize:13, color:C.txtMuted }} aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2: Rent Collection 40% | Recent Ledger 60% */}
            <div style={S.row2}>

              {/* Rent Collection */}
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Rent Collection</div>
                  <span style={{ fontSize:12, fontWeight:500, color:C.greenDark }}>+5.2%</span>
                </div>
                <RentBarChart />
                <div style={S.rentStats}>
                  {[
                    { lbl:'Funding',      val:'$4,250',  col:C.amber,      first:true,  last:false },
                    { lbl:'Expenses',     val:'$12,800', col:C.txtPrimary, first:false, last:false },
                    { lbl:'Vendor Bills', val:'$2,100',  col:C.txtPrimary, first:false, last:true },
                  ].map(s => (
                    <div key={s.lbl} style={S.rentStatIt(s.first, s.last)}>
                      <div style={S.rentStatLbl}>{s.lbl}</div>
                      <div style={{ ...S.rentStatVal, color:s.col }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Ledger — 1x2 */}
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Recent Ledger Entries</div>
                  <span style={S.cardLink}>Export full ledger →</span>
                </div>
                <div style={S.ledgerCols}>
                  {[LEDGER_L, LEDGER_R].map((col, ci) => (
                    <div key={ci} style={{ ...(ci===1?{ borderLeft:`1px solid ${C.cardBdr}`, paddingLeft:18 }:{}) }}>
                      <div style={S.ledgerHdr}>
                        {['Date','Category','Tenant/vendor','Amount'].map(h => (
                          <span key={h} style={{ ...S.lTh, ...(h==='Amount'?{textAlign:'right'}:{}) }}>{h}</span>
                        ))}
                      </div>
                      {col.map((l,i) => (
                        <div key={i} style={{ ...S.ledgerRow, ...(i===col.length-1?{borderBottom:'none'}:{}) }}>
                          <span style={{ ...S.lTd, color:C.txtMuted }}>{l.date}</span>
                          <span style={S.lTd}>{l.cat}</span>
                          <span style={S.lTd}>{l.who}</span>
                          <span style={{ ...S.lTd, color:l.pos?C.greenDark:C.red, fontWeight:500, textAlign:'right' }}>{l.amt}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ROW 3: Resident Directory 60% | Communications 40% */}
            <div style={S.row3}>

              {/* Resident Directory */}
              <div style={S.card}>
                <div style={S.cardHdr}><div style={S.cardTitle}>Resident Directory</div></div>
                <div style={S.dirHdr}>
                  {['Tenant Name','Unit #','Lease Status','Lease End Date','Lease Renewal','Action'].map(h => (
                    <span key={h} style={S.dirTh}>{h}</span>
                  ))}
                </div>
                {tenantUnits.length === 0 && (
                  <div style={{ fontSize:12, color:C.txtMuted, padding:'12px 0' }}>No active tenants.</div>
                )}
                {tenantUnits.map((u,i) => {
                  const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const isLast = i === tenantUnits.length - 1;
                  return (
                    <div key={u.id} style={{ ...S.dirRow, ...(isLast?{borderBottom:'none'}:{}) }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={S.tenantAv(ac.bg, ac.col)}>{initials(u.tenant_name)}</div>
                        <span style={S.dirTd}>{u.tenant_name}</span>
                      </div>
                      <span style={S.dirTd}>{u.unit_name}</span>
                      <span style={{ ...S.statusPill(u.rent_status==='PAID'?C.greenLight:C.redLight, u.rent_status==='PAID'?C.greenDark:C.red), marginLeft:0 }}>
                        {u.rent_status==='PAID'?'Active':'Overdue'}
                      </span>
                      <span style={S.dirTd}>{u.lease_end || '—'}</span>
                      <span style={{ ...S.dirTd, color:u.maint_open>0?C.red:C.txtMuted }}>
                        {u.maint_open>0?'Active ticket':'—'}
                      </span>
                      <i className="ti ti-dots" style={{ fontSize:15, color:C.txtMuted, cursor:'pointer' }} aria-hidden="true" />
                    </div>
                  );
                })}
              </div>

              {/* Communications */}
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Communications</div>
                  <span style={S.cardLink}>Open messenger →</span>
                </div>
                <div style={S.tabRow}>
                  {['Chats','Notifications'].map(tab => (
                    <div key={tab} style={S.tab(activeTab===tab)} onClick={() => setActiveTab(tab)}>{tab}</div>
                  ))}
                </div>

                {/* CHATS */}
                {activeTab === 'Chats' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'right' }}>
                        <button style={S.newChatBtn} onClick={() => setShowNewChat(p => !p)}>
                           <i className="ti ti-plus" style={{ fontSize:12 }} aria-hidden="true" />
                           New conversation
                        </button>
                    </div>
                    {showNewChat && (
                      <div style={S.newChatForm}>
                        <select style={S.ncSelect}>
                          <option value="">Select recipient…</option>
                          <option>Property Manager</option>
                          <option>Unit A1 Tenant</option>
                          <option>Unit A2 Tenant</option>
                        </select>
                        <div style={S.ncInputRow}>
                          <input type="text" placeholder="Type first message…" style={S.ncInput} />
                          <button style={S.ncSendBtn}>Send</button>
                        </div>
                      </div>
                    )}
                    {CHAT_THREADS.map(chat => (
                      <div key={chat.id}>
                        <div style={S.msgItem} onClick={() => toggleChat(chat.id)}>
                          <div style={S.msgAv}>{chat.av}</div>
                          <div style={{ flex:1 }}>
                            <div style={S.msgName}>{chat.name}</div>
                            <div style={S.msgPreview}>{chat.preview}</div>
                          </div>
                          <span style={S.msgTime}>10:{chat.id==='chat-em'?'12':'45'}</span>
                        </div>
                        {openChatId === chat.id && (
                          <div style={S.chatExpanded}>
                            <div style={S.threadWrap}>
                              {chat.messages.map((m,i) => (
                                <div key={i} style={m.from==='me' ? S.bubbleRight : S.bubbleLeft}>{m.text}</div>
                              ))}
                            </div>
                            <div style={S.replyRow}>
                              <input
                                type="text"
                                placeholder="Reply…"
                                style={S.replyInput}
                                value={replyText[chat.id] || ''}
                                onChange={e => setReplyText(p => ({ ...p, [chat.id]: e.target.value }))}
                              />
                              <button style={S.sendBtn} aria-label="Send">
                                <i className="ti ti-send" style={{ fontSize:13, color:'#fff' }} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* NOTIFICATIONS */}
                {activeTab === 'Notifications' && (
                  <div>
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id}>
                        <div style={S.notifItem} onClick={() => toggleNotif(n.id)}>
                          <div style={S.notifIconWrap(n.iconBg)}>
                            <i className={`ti ${n.icon}`} style={{ fontSize:13, color:n.iconCol }} aria-hidden="true" />
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={S.msgName}>{n.title}</div>
                            <div style={S.msgPreview}>{n.preview}</div>
                          </div>
                          <span style={S.msgTime}>{n.time}</span>
                        </div>
                        {openNotifId === n.id && (
                          <div style={S.notifPopup}>
                            {n.hasImage && (
                              <div style={S.notifImgArea}>
                                <i className="ti ti-calendar" style={{ fontSize:28, color:C.blue }} aria-hidden="true" />
                              </div>
                            )}
                            <div style={{ fontSize:13, fontWeight:600, color:C.txtPrimary, marginBottom:6 }}>{n.title}</div>
                            <div style={S.notifFullText}>{n.full}</div>
                            <button style={S.markReadBtn}>Mark as read</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={S.footer}>© 2023 UrbanNest Property Management. All Rights Reserved.</div>
          </div>
        </main>
      </div>

      {showFilter && <FilterModal onClose={() => setShowFilter(false)} />}
      {showUnitSelection && (
        <LandlordUnitSelection propId={propId} onClose={() => setShowUnitSelection(false)} />
      )}
      {showBulkAdd && (
        <BulkAddServiceModal
          propId={propId}
          propName={prop.name}
          units={units}
          ownedServices={ownedServices}
          unitServicesMap={unitServicesMap}
          onClose={() => setShowBulkAdd(false)}
          onComplete={() => refreshUnitServices(units)}
        />
      )}
      {showEditProperty && (
        <EditPropertyModal
          propId={propId}
          prop={prop}
          amenities={amenities}
          onClose={() => setShowEditProperty(false)}
          onSaved={fetchPropertyDetail}
        />
      )}
    </div>
  );
}
