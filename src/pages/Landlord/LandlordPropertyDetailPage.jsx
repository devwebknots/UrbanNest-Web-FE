import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';

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

  errBanner:    { background:C.redLight, color:C.red, padding:'10px 28px', fontSize:13 },
  footer:       { textAlign:'center', fontSize:11, color:C.txtMuted, padding:'16px 0', borderTop:`1px solid ${C.cardBdr}`, margin:'20px 28px 0' },
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandlordPropertyDetailPage() {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('Chats');
  const [showFilter,   setShowFilter]   = useState(false);
  const [showNewChat,  setShowNewChat]  = useState(false);
  const [openChatId,   setOpenChatId]   = useState(null);
  const [openNotifId,  setOpenNotifId]  = useState(null);
  const [replyText,    setReplyText]    = useState({});

  const pathParts = window.location.pathname.split('/');
  const propId    = pathParts[pathParts.indexOf('property') + 1];

  useEffect(() => {
    if (!propId) return;
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/property/${propId}/`, {
      headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    })
      .then(r => { if(!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [propId]);

  const prop      = data?.property    || {};
  const stats     = data?.stats       || {};
  const units     = data?.units       || [];
  const owners    = data?.ownerships  || [];
  const amenities = data?.amenities   || [];
  const tickets   = data?.open_tickets|| [];
  const primary   = owners[0]         || {};
  const coOwners  = owners.slice(1);

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
              {/* Left — single large image */}
              <GImg src={prop.main_image_url} fallback={FB.main} alt={prop.name} style={{ borderRadius:8 }} />

              {/* Right — 2x2 grid */}
              <div style={S.galRight}>
                <GImg src={prop.thumb1_url} fallback={FB.t1} alt="Interior 1" style={{ borderRadius:6 }} />
                <GImg src={prop.thumb2_url} fallback={FB.t2} alt="Interior 2" style={{ borderRadius:6 }} />
                <GImg src={prop.thumb3_url} fallback={FB.t3} alt="Interior 3" style={{ borderRadius:6 }} />
                <div style={S.galAddCell} onClick={() => alert('Image upload coming soon')}>
                  <i className="ti ti-plus" style={{ fontSize:20 }} aria-hidden="true" />
                  <span>Add images</span>
                </div>
              </div>
            </div>
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
                      {amenities.map(a => (
                        <div key={a.id} style={S.amenityItem}>
                          <div style={S.amenityIcon}><i className="ti ti-check" style={{ fontSize:10 }} aria-hidden="true" /></div>
                          {a.name}
                        </div>
                      ))}
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
                  <button style={S.addUnitBtn}>+ Add Unit</button>
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
    </div>
  );
}
