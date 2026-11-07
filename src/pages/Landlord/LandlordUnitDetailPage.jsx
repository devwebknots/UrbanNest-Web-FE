import React, { useState, useRef } from 'react';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';

// Session 57 fix — same colored icon-chip treatment as
// LandlordPropertyDetailPage.jsx's amenityStyle() (itself ported from
// PMPropertyDetailPage.jsx's SpecialFeatures), so Unit's Amenities section
// matches the look/feel the user asked for instead of the old plain
// checkmark+icon+text row. Falls back to the existing amenityIcon() keyword
// map below for the glyph when a name isn't in this exact-match table.
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

// Session 53 fix: large click-to-enlarge lightbox with left/right navigation,
// same component used on PMUnitDetailPage.jsx/PMPropertyDetailPage.jsx —
// reused here so Landlord gets the identical gallery experience PM already
// has. `items` is [{file_url, file_type}], `index` the currently shown one.
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
          <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.7)', fontSize:13, fontFamily:F.body }}>{index + 1} / {total}</div>
        </>
      )}
    </div>
  );
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// ─── Fallback images ──────────────────────────────────────────────────────────
const FB_GALLERY = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
];

const initials = n => (n || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─── Static placeholder data ──────────────────────────────────────────────────
// Consistent with LandlordPropertyDetailPage.jsx — Financial Command, Quick
// Actions and Document Vault are not yet wired to a backend model there
// either, so this page follows the same precedent rather than inventing new
// models mid-task. Track wiring these for real as a backlog item.
const LEDGER_ROWS = [
  { month: 'April 2024', amount: '$1,200', payout: '$1,080', status: 'Collected' },
  { month: 'March 2024', amount: '$1,200', payout: '$1,080', status: 'Collected' },
  { month: 'February 2024', amount: '$1,200', payout: '$1,080', status: 'Collected' },
];

const QA_ITEMS = [
  { icon: 'ti-message',      bg: C.blueLight,  col: C.blue,      title: 'Message tenant',            sub: 'Start a new conversation' },
  { icon: 'ti-file-text',    bg: C.greenLight, col: C.greenDark, title: 'Initiate lease renewal',     sub: 'Send renewal offer' },
  { icon: 'ti-tool',         bg: C.amberLight, col: C.amber,     title: 'Add maintenance ticket',     sub: 'Log a new issue' },
  { icon: 'ti-file-upload',  bg: C.stdBg,      col: C.txtSec,    title: 'Request document',           sub: 'Ask tenant to upload' },
];

const DOC_ITEMS = [
  { icon: 'ti-file-text',   bg: C.blueLight,  col: C.blue,      name: 'Lease agreement',           meta: 'PDF · 2.4 MB · Signed' },
  { icon: 'ti-clipboard-check', bg: C.greenLight, col: C.greenDark, name: 'Move-in inspection report', meta: 'PDF · 15.8 MB · Verified' },
  { icon: 'ti-shield-check', bg: C.amberLight, col: C.amber,     name: 'Tenant insurance certificate', meta: 'PDF · 0.8 MB · Valid' },
];

// ─── Unit Services (SVC-1, Session 40) — wired to the real backend ────────────
// Owned-services catalog now comes from GET /landlord/account/services/
// (this landlord's real LandlordAccountService rows), and this unit's
// assigned services come from GET /properties/<pk>/units/<uid>/services/ —
// both fetched in the component below. The backend has no icon field for a
// service, so every real service falls back to this generic glyph.
const SERVICE_FALLBACK_ICON = 'ti-adjustments';

// The live "will this be blocked by a missing bank account" preview that
// used to run against MOCK_RESOLVED_BANK_ACCOUNT has been removed — it
// can't be faithfully replicated client-side without also having the
// landlord-side bank-account endpoints (not built yet). Instead, submitting
// a service that needs a bank account and has none resolvable now relies on
// the real backend's §4.3 check, which returns a real error message shown
// in the modal below (see AddServiceModal's `submitError` state).

const S = {
  shell:    { display: 'flex', height: '100vh', fontFamily: F.sans, background: C.pageBg, overflow: 'hidden' },
  main:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:   { background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  topTitle: { fontSize: 14, fontWeight: 600, color: C.txtPrimary },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn:  { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtSec, cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 16 },
  avatar:   { width: 32, height: 32, borderRadius: '50%', background: C.navBg, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1, overflowY: 'auto', padding: '0 0 40px' },

  bread:    { padding: '12px 28px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 },
  breadLink:{ color: C.blue, cursor: 'pointer', fontWeight: 500 },
  breadSep: { color: C.txtMuted },
  breadCur: { color: C.txtPrimary },

  titleRow: { padding: '14px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  unitName: { fontSize: 26, fontWeight: 700, color: C.txtPrimary, letterSpacing: -0.4 },
  actionBtns: { display: 'flex', gap: 8 },
  btnOutline: { background: '#fff', border: `1px solid ${C.cardBdr}`, borderRadius: 6, padding: '8px 14px', fontSize: 12.5, color: C.txtPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.sans },
  btnDark:    { background: C.navBg, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.sans },

  statStrip: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 10, margin: '14px 28px 0', padding: '12px 16px' },
  statCell:  { display: 'flex', flexDirection: 'column', gap: 3 },
  statLbl:   { fontSize: 9.5, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' },
  statVal:   { fontSize: 13.5, fontWeight: 600, color: C.txtPrimary },
  toggleOn:  { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: C.greenDark },

  sw: { padding: '20px 28px 0' },
  row60_40:  { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginBottom: 20 },
  row65_35:  { display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 12, marginBottom: 20 },
  row50_50:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
  row3up:    { display: 'grid', gridTemplateColumns: '35fr 35fr 30fr', gap: 12 },

  card:     { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '18px 20px' },
  cardHdr:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle:{ fontSize: 14, fontWeight: 600, color: C.txtPrimary },
  cardLink: { fontSize: 11.5, color: C.blue, cursor: 'pointer', fontWeight: 500 },
  divider:  { height: 1, background: C.cardBdr, margin: '8px 0' },

  // GALLERY
  galWrap:  { position: 'relative', borderRadius: 12, overflow: 'hidden', height: 300, background: C.stdBg },
  galImg:   { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  galArrow: (side) => ({ position: 'absolute', top: '50%', [side]: 12, transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }),
  galCount: { position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },

  // FLOOR PLAN
  floorPlanBox: { height: 210, background: C.stdBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: C.txtMuted, marginBottom: 12 },
  floorPlanSample: { position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' },
  floorPlanBtn: { width: '100%', background: C.navBg, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 0', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: F.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },

  // SPECS
  specGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px 16px', marginTop: 14 },
  specLbl:  { fontSize: 9.5, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  specVal:  { fontSize: 12.5, fontWeight: 600, color: C.txtPrimary },

  // AMENITIES ("Special Features") — Session 59: back to plain gray chips,
  // 3 per row to match the reference layout (was 2/row + colored, per an
  // earlier request; the user has since asked to keep color on Unit
  // Services instead and revert Special Features to plain).
  amenityGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10, maxHeight: 148, overflowY: 'auto', paddingRight: 4 },
  amenityItem: { display: 'flex', alignItems: 'center', gap: 7, background: '#f8f9fb', borderRadius: 6, padding: '8px 9px', fontSize: 12 },
  amenityIcon: { width: 20, height: 20, borderRadius: 4, background: '#e8f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.teal, fontSize: 11, flexShrink: 0 },

  // UNIT SERVICES — 4 per row, narrower chip than an amenity chip; name
  // truncates with ellipsis rather than wrapping/growing the row.
  serviceGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 },
  serviceItem:     { position: 'relative', display: 'flex', alignItems: 'center', gap: 7, background: '#f8f9fb', borderRadius: 6, padding: '8px 9px', fontSize: 12, fontWeight: 500, minWidth: 0 },
  serviceItemName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  serviceIcon:     { width: 20, height: 20, borderRadius: 5, background: '#e8f5f0', color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 },
  serviceIconBank: { background: C.amberLight, color: C.amber },
  // Small corner dot instead of a text pill — a full "Bank-linked" label
  // doesn't fit a 4-up chip without forcing the service name to truncate.
  bankDot:         { position: 'absolute', top: 5, right: 6, width: 7, height: 7, borderRadius: '50%', background: C.amber, border: '1.5px solid #f8f9fb' },
  serviceLegend:   { display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: C.txtMuted },
  serviceLegendDot:{ width: 7, height: 7, borderRadius: '50%', background: C.amber, flexShrink: 0 },
  serviceEmpty:    { fontSize: 12, color: C.txtMuted, fontStyle: 'italic', marginTop: 10 },

  // ADD SERVICE MODAL
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,27,46,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 20px', zIndex: 1000, fontFamily: F.sans },
  modal:        { background: C.cardBg, borderRadius: 12, width: 460, maxWidth: '100%', boxShadow: '0 24px 50px rgba(0,0,0,0.3)', overflow: 'hidden', color: C.txtPrimary },
  modalHdr:     { padding: '18px 22px 4px' },
  modalHdrTitle:{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 },
  modalHdrSub:  { margin: 0, fontSize: 12.5, color: C.txtMuted },
  modalBody:    { padding: '8px 22px 4px', maxHeight: 380, overflowY: 'auto' },
  pickRow:      { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: `1px solid ${C.cardBdr}` },
  pickIcon:     { width: 26, height: 26, borderRadius: 6, background: '#e8f5f0', color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 },
  pickIconBank: { background: C.amberLight, color: C.amber },
  pickName:     { fontSize: 13, fontWeight: 700 },
  pickSub:      { fontSize: 11.5, color: C.txtMuted, marginTop: 1 },
  resolveNote:  (ok) => ({ fontSize: 11, marginTop: 6, padding: '5px 9px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, background: ok ? C.greenLight : C.redLight, color: ok ? C.greenDark : C.red }),
  inlineAddBank:    { marginTop: 8, background: C.redLight, border: '1px dashed #f3b3b3', borderRadius: 8, padding: '10px 12px' },
  inlineAddBankMsg: { fontSize: 11.5, color: '#991b1b', marginBottom: 6 },
  inlineAddBankLink:{ fontSize: 11.5, fontWeight: 700, color: C.blue, cursor: 'pointer' },
  modalFooter:  { padding: '14px 22px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  modalBtnSecondary: { background: '#fff', color: C.txtPrimary, border: `1px solid ${C.cardBdr}`, padding: '9px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.sans },
  modalBtnPrimary:   (disabled) => ({ background: disabled ? '#9db8e8' : C.blue, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', fontFamily: F.sans, opacity: disabled ? 0.6 : 1 }),
  emptyModal:      { padding: '30px 22px 26px', textAlign: 'center' },
  emptyModalIcon:  { width: 44, height: 44, borderRadius: '50%', background: '#f1f3f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 18, color: C.txtMuted },
  emptyModalTitle: { fontSize: 14, margin: '0 0 6px', fontWeight: 700 },
  emptyModalBody:  { fontSize: 12, color: C.txtMuted, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 16px' },

  // TENANT PROFILE
  tenantHdr: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  tenantTabRow: { display: 'flex', borderBottom: `1px solid ${C.cardBdr}`, marginBottom: 12 },
  tenantTab: (active) => ({ fontSize: 12.5, padding: '6px 14px', cursor: 'pointer', borderBottom: active ? `2px solid ${C.blue}` : '2px solid transparent', color: active ? C.txtPrimary : C.txtMuted, fontWeight: active ? 500 : 400 }),
  pastNavRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  pastArrow: { width: 26, height: 26, borderRadius: '50%', background: C.stdBg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  pastCount: { fontSize: 11, color: C.txtMuted, fontWeight: 500 },
  tenantAv:  { width: 42, height: 42, borderRadius: '50%', background: C.blueLight, color: C.blueDark, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tenantName:{ fontSize: 14.5, fontWeight: 600, color: C.txtPrimary },
  tenantSub: { fontSize: 11.5, color: C.txtMuted },
  goodStandingPill: { marginLeft: 'auto', background: C.greenLight, color: C.greenDark, fontSize: 10.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  tenantGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' },
  tenantFieldLbl: { fontSize: 9.5, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  tenantFieldVal: { fontSize: 12.5, color: C.txtPrimary, fontWeight: 500 },
  stars: { color: C.amber, fontSize: 12 },

  // LEDGER
  ledgerTable: { width: '100%', borderCollapse: 'collapse' },
  ledgerHdrRow:{ borderBottom: `1px solid ${C.cardBdr}` },
  ledgerTh:  { fontSize: 9.5, color: C.txtMuted, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', textAlign: 'left', padding: '0 0 8px' },
  ledgerRow: { borderBottom: `1px solid ${C.cardBdr}` },
  ledgerTd:  { fontSize: 12, color: C.txtPrimary, padding: '9px 0' },

  // MAINT / QA / DOCS (shared list item shapes — mirrors LandlordPropertyDetailPage)
  listItem: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: `1px solid ${C.cardBdr}` },
  listIcon: (bg) => ({ width: 28, height: 28, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  listTitle:{ fontSize: 12.5, fontWeight: 500, color: C.txtPrimary, lineHeight: 1.3 },
  listSub:  { fontSize: 11, color: C.txtMuted, marginTop: 1 },
  statusPill: (bg, col) => ({ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: bg, color: col, marginLeft: 'auto', flexShrink: 0 }),

  footer:   { textAlign: 'center', fontSize: 11, color: C.txtMuted, padding: '16px 0', borderTop: `1px solid ${C.cardBdr}`, margin: '20px 28px 0' },
  errBanner:{ background: C.redLight, color: C.red, padding: '10px 28px', fontSize: 13 },

  // EDIT UNIT MODAL (proper Edit functionality — matches LandlordPropertyDetailPage.jsx's shapes)
  editBtn:          { display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: `1px solid ${C.cardBdr}`, borderRadius: 6, padding: '6px 13px', fontSize: 12, fontWeight: 600, color: C.txtPrimary, cursor: 'pointer', fontFamily: F.sans, marginLeft: 10 },
  editFormGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px' },
  editLabel:        { fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 },
  editInput:        { width: '100%', height: 36, border: `1px solid ${C.cardBdr}`, borderRadius: 6, padding: '0 10px', fontSize: 12.5, color: C.txtPrimary, fontFamily: F.sans, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  editSelect:       { width: '100%', height: 36, border: `1px solid ${C.cardBdr}`, borderRadius: 6, padding: '0 10px', fontSize: 12.5, color: C.txtPrimary, fontFamily: F.sans, outline: 'none', background: '#fff', boxSizing: 'border-box', cursor: 'pointer' },
  editCheckRow:     { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: C.txtPrimary, height: 36 },
  editSecLbl:       { fontSize: 9.5, color: C.txtMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  editAmenityGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, maxHeight: 175, overflowY: 'auto', paddingRight: 4 },
  // Session 58 fix — same as LandlordPropertyDetailPage.jsx's editAmenityItem:
  // selected state is now a barely-there rgba tint instead of a flat
  // blueLight fill + solid blue border.
  editAmenityItem:  (checked) => ({ display: 'flex', alignItems: 'center', gap: 7, background: checked ? 'rgba(61,142,240,0.055)' : '#f8f9fb', border: `1px solid ${checked ? 'rgba(61,142,240,0.18)' : 'transparent'}`, borderRadius: 6, padding: '7px 9px', fontSize: 12, cursor: 'pointer', color: checked ? C.blueDark : C.txtPrimary, fontFamily: F.sans }),
  editGalGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 8 },
  editGalItem:      { position: 'relative', borderRadius: 8, overflow: 'hidden', height: 80, background: C.pageBg },
  editGalX:         { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  editFpSlot:       { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  editFpX:          { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  editFpReplaceBtn: { marginTop: 5, fontSize: 10.5, fontWeight: 600, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans, padding: 0 },

  // Session 59 — redesign per attached reference: horizontal KPI cards,
  // hero + 2x2 media gallery, 60/40 Unit&Lease/Floor-plan row, and a
  // dedicated Owner Details card (see ownerships/past_ownerships below).
  // Session 60 fix — KPI cards moved below the gallery (per feedback) and
  // shrunk ~20% in height: tighter padding/gap, smaller icon & value type.
  kpiRow:   { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 },
  kpiCard:  { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '8px 11px', display: 'flex', flexDirection: 'column', gap: 4 },
  kpiTop:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  kpiLbl:   { fontSize: 8.5, color: C.txtMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' },
  kpiIcon:  { width: 18, height: 18, borderRadius: 5, background: C.stdBg, color: C.txtSec, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 },
  kpiVal:   { fontSize: 14, fontWeight: 700, color: C.txtPrimary },
  kpiSub:   { fontSize: 9, color: C.txtMuted },

  // Session 60 fix — mediaGrid previously set only an overall `height`, but
  // with no explicit row track, the implicit grid row sized to its tallest
  // child's *content* (the hero <img>'s natural aspect ratio), not to that
  // 320px — so the image/video spilled past the card's rounded corners
  // instead of being clipped to it. A single explicit `1fr` row track makes
  // that 320px concrete, so heroBox/subGrid's `height:'100%'` (and
  // subTile's own 1fr rows) resolve against a real pixel value and
  // `overflow:hidden` actually clips the media.
  mediaCard:   { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: 16, marginBottom: 20, overflow: 'hidden' },
  mediaHdr:    { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  mediaCount:  { fontSize: 10.5, color: C.txtMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' },
  mediaGrid:   { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gridTemplateRows: '1fr', gap: 10, height: 320, overflow: 'hidden' },
  heroBox:     { position: 'relative', borderRadius: 10, overflow: 'hidden', background: C.stdBg, cursor: 'pointer', height: '100%', minHeight: 0, minWidth: 0 },
  subGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, height: '100%', minHeight: 0 },
  subTile:     { position: 'relative', borderRadius: 10, overflow: 'hidden', background: C.stdBg, cursor: 'pointer', minHeight: 0, minWidth: 0 },
  primaryBadge:{ position: 'absolute', top: 10, left: 10, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, padding: '4px 9px', borderRadius: 5, textTransform: 'uppercase' },
  videoTourBtn:{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 },
  viewAllOverlay: { position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.62)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, textAlign: 'center' },

  fpMainGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 },
  fpMainTile:  { position: 'relative', borderRadius: 8, overflow: 'hidden', height: 96, background: C.stdBg, cursor: 'pointer' },
  fpMainX:     { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  fpMainLbl:   { position: 'absolute', bottom: 5, left: 7, fontSize: 10, fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' },
  fpMainEmpty: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: C.txtMuted, fontSize: 10.5, border: `1px dashed ${C.cardBdr}`, borderRadius: 8, boxSizing: 'border-box' },

  // OWNER DETAILS — dark-header table, same shape as the reference's Owner
  // Details card; mirrors the Ledger table's row styling.
  ownerTable:  { width: '100%', borderCollapse: 'collapse' },
  ownerThRow:  { background: C.navBg },
  ownerTh:     { fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', textAlign: 'left', padding: '8px 8px' },
  ownerRow:    { borderBottom: `1px solid ${C.cardBdr}` },
  ownerTd:     { fontSize: 12, color: C.txtPrimary, padding: '9px 8px' },
  ownerIdPill: { fontSize: 10.5, fontWeight: 600, color: C.txtSec, background: C.stdBg, padding: '2px 8px', borderRadius: 4 },
  viewTh:      { width: 36, textAlign: 'center' },
  viewTd:      { textAlign: 'center', padding: '6px 8px' },
  eyeBtn:      (enabled) => ({ width: 22, height: 22, borderRadius: '50%', border: 'none', background: enabled ? C.blueLight : C.stdBg, color: enabled ? C.blue : '#c3c9d2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: enabled ? 'pointer' : 'default', flexShrink: 0 }),

  // Session 60 — Unit & Lease Overview rebuilt per reference: description,
  // a barely-visible dashed rule, then a 2-column field grid (label left /
  // value right) inside two lightly-tinted panels.
  leaseDivider:    { borderTop: `1px dashed ${C.cardBdr}`, opacity: 0.7, margin: '14px 0 0' },
  leaseFieldsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 },
  leaseFieldsCol:  { background: '#f8f9fb', border: `1px solid ${C.cardBdr}`, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 11 },
  leaseFieldRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  leaseFieldLbl:   { fontSize: 11.5, color: C.txtMuted, fontWeight: 500 },
  leaseFieldVal:   { fontSize: 12.5, color: C.txtPrimary, fontWeight: 600, textAlign: 'right' },

  // Segmented Current/Past toggle — replaces the underlined tab row inside
  // cards that now follow the Financial Command table pattern (Owner,
  // Tenant), keeping the header row's balance (title left, control right).
  segToggle: { display: 'flex', background: C.stdBg, borderRadius: 20, padding: 2, gap: 2, flexShrink: 0 },
  segBtn:    (active) => ({ fontSize: 10.5, fontWeight: 600, padding: '4px 11px', borderRadius: 18, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? '#fff' : 'transparent', color: active ? C.txtPrimary : C.txtMuted, boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }),

  // DETAIL MODAL (owner / tenant / ancillary-services pop-ups opened from an
  // eye icon) — reuses the Add-Service modal's overlay/card shapes.
  detailRow:  (last) => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${C.cardBdr}` }),
  detailLbl:  { fontSize: 11.5, color: C.txtMuted, fontWeight: 500 },
  detailVal:  { fontSize: 12.5, color: C.txtPrimary, fontWeight: 600, textAlign: 'right' },
  detailListRow: (last) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${C.cardBdr}` }),
};

// A fixed-position palette (not name-matched like amenities, since service
// catalogs are assignable/freeform) so Unit Services reads as colorful
// without needing a name→color map the way Special Features used to.
const SERVICE_COLOR_PALETTE = [
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#F0FDF4', color: '#16A34A' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#EEF2FF', color: '#7C3AED' },
  { bg: '#FDF2F8', color: '#DB2777' },
  { bg: '#F1F5F9', color: '#64748B' },
];
const serviceStyle = i => SERVICE_COLOR_PALETTE[i % SERVICE_COLOR_PALETTE.length];

// Session 60 — Unit Services now falls back to these 5 sample services
// (generic, not owned/assigned) whenever the unit has no real services
// assigned yet, so the card never renders empty. The moment a real service
// is assigned, the real list (unitServices) takes over exclusively — see
// `servicesToShow` in the component below.
const SAMPLE_SERVICES = [
  { id: 'sample-maintenance', name: 'Maintenance',           icon: 'ti-tool' },
  { id: 'sample-lease',       name: 'Lease Management',      icon: 'ti-file-text' },
  { id: 'sample-financial',   name: 'Financial Management',  icon: 'ti-cash' },
  { id: 'sample-analytics',   name: 'Analytics',              icon: 'ti-chart-bar' },
  { id: 'sample-comms',       name: 'Communication',          icon: 'ti-message-circle' },
];

// e.g. 1 -> "1st", 2 -> "2nd" — used for Floor Placement in the Unit &
// Lease Overview card.
const ordinalSuffix = n => {
  if (n == null || n === '' || isNaN(n)) return null;
  const v = Number(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const r = v % 100;
  return `${v}${s[(r - 20) % 10] || s[r] || s[0]}`;
};

// Session 60 — small reusable pop-up opened from an eye icon: either a
// label/value fact sheet (`rows`) for one owner/tenant row, or a simple
// checklist (`list`) for the Ancillary Services ("which amenities") view.
// Reuses the Add-Service modal's overlay/card shapes so it matches the
// rest of the page's modal styling.
function DetailModal({ title, subtitle, rows, list, onClose }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modal, width: 420 }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHdr}>
          <h3 style={S.modalHdrTitle}>{title}</h3>
          {subtitle && <p style={S.modalHdrSub}>{subtitle}</p>}
        </div>
        <div style={{ ...S.modalBody, maxHeight: 420 }}>
          {list ? (
            list.length === 0 ? (
              <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic', padding: '8px 0' }}>None configured.</div>
            ) : (
              list.map((name, i) => (
                <div key={i} style={S.detailListRow(i === list.length - 1)}>
                  <i className="ti ti-check" style={{ fontSize: 13, color: C.greenDark }} aria-hidden="true" />
                  <span style={{ fontSize: 12.5, color: C.txtPrimary }}>{name}</span>
                </div>
              ))
            )
          ) : (
            rows.map((r, i) => (
              <div key={i} style={S.detailRow(i === rows.length - 1)}>
                <span style={S.detailLbl}>{r.label}</span>
                <span style={S.detailVal}>{r.value}</span>
              </div>
            ))
          )}
        </div>
        <div style={S.modalFooter}>
          <button style={S.modalBtnSecondary} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const maintBadgeCfg = p => {
  if (p === 'URGENT' || p === 'HIGH') return { bg: C.redLight, col: C.red, label: 'Critical' };
  if (p === 'MEDIUM') return { bg: C.amberLight, col: C.amber, label: 'Medium' };
  return { bg: C.stdBg, col: C.txtSec, label: 'Low' };
};

// Maps amenity names to a relevant Tabler icon, keyword-matched. Falls back
// to a checkmark for anything unrecognized so nothing ever renders blank.
const AMENITY_ICON_MAP = [
  ['air condition',  'ti-wind'],
  ['a/c',            'ti-wind'],
  ['balcony',        'ti-door'],
  ['dishwasher',     'ti-glass-full'],
  ['furnish',        'ti-armchair'],
  ['fireplace',      'ti-flame'],
  ['heat',           'ti-temperature'],
  ['cctv',           'ti-camera'],
  ['camera',         'ti-camera'],
  ['security',       'ti-shield-check'],
  ['parking',        'ti-car'],
  ['garage',         'ti-car'],
  ['gym',            'ti-barbell'],
  ['fitness',        'ti-barbell'],
  ['pool',           'ti-pool'],
  ['wifi',           'ti-wifi'],
  ['internet',       'ti-wifi'],
  ['elevator',       'ti-arrows-vertical'],
  ['lift',           'ti-arrows-vertical'],
  ['pet',            'ti-paw'],
  ['laundry',        'ti-wash-machine'],
  ['washer',         'ti-wash-machine'],
  ['dryer',          'ti-wash-machine'],
  ['garden',         'ti-plant-2'],
  ['storage',        'ti-box'],
  ['closet',         'ti-box'],
  ['tv',             'ti-device-tv'],
  ['television',     'ti-device-tv'],
  ['microwave',      'ti-microwave'],
  ['refrigerator',   'ti-fridge'],
  ['fridge',         'ti-fridge'],
  ['bathtub',        'ti-bath'],
  ['bath',           'ti-bath'],
  ['smoke',          'ti-alarm-smoke'],
  ['alarm',          'ti-alarm-smoke'],
  ['water',          'ti-droplet'],
  ['solar',          'ti-solar-panel'],
  ['view',           'ti-eye'],
];

const amenityIcon = name => {
  const n = (name || '').toLowerCase();
  const hit = AMENITY_ICON_MAP.find(([kw]) => n.includes(kw));
  return hit ? hit[1] : 'ti-check';
};

// ─── Add Service modal ─────────────────────────────────────────────────────────
// Deliberately does NOT touch PaymentCartContext/PaymentCartModal — adding a
// service to a unit is assignment of something already owned at the account
// level, not a purchase (Entitlement doc §4.2). "Buy Service" (account-level,
// Settings → Services) is the only flow that goes through the Payment Cart.
//
// Session 40 — wired to the real backend. Checking a row no longer shows a
// client-side "will this resolve a bank account" preview (that logic lived
// entirely in mock data before); instead, submitting fires one real POST
// per checked service to /properties/<pk>/units/<uid>/services/, and any
// row the backend rejects (unresolved entitlement, or — for a service
// flagged requires_payment_collection — no resolvable OwnerBankAccount per
// §4.3) shows up as a real per-service error below the checklist rather
// than blocking submission up front. `submitting`/`submitError` are new;
// everything else about the two remaining states (checklist, empty) is
// unchanged from the wireframe.
function AddServiceModal({ unitNumber, ownedServices, assignedIds, onClose, onAdd }) {
  const available = ownedServices.filter(s => !assignedIds.includes(s.id));
  const [checked, setChecked] = useState(() =>
    Object.fromEntries(available.map(s => [s.id, true]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState([]); // [{ name, message }]

  const toggle = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const checkedServices = available.filter(s => checked[s.id]);
  const canSubmit = checkedServices.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitErrors([]);
    const result = await onAdd(checkedServices);
    setSubmitting(false);
    if (result?.errors?.length) {
      setSubmitErrors(result.errors);
    } else {
      onClose();
    }
  };

  const goToBankAccounts = () => { window.location.href = '/landlord-portal/settings'; };

  // State 2 — nothing left to add
  if (available.length === 0) {
    // Session 40 fix — this used to say "Nothing left to add" (implying
    // everything is already assigned) for BOTH real causes: (a) the
    // landlord genuinely owns zero services at the account level yet, and
    // (b) they own some, but all of them are already on this unit. Those
    // need different copy — (a) especially, since without it the modal
    // reads as a bug ("it says no services are on the unit, but Add
    // Service says there's nothing to add") rather than what's actually
    // true: there's nothing to add because there's nothing bought yet.
    const ownsNothing = ownedServices.length === 0;
    return (
      <div style={S.modalOverlay} onClick={onClose}>
        <div style={S.modal} onClick={e => e.stopPropagation()}>
          <div style={S.modalHdr}>
            <h3 style={S.modalHdrTitle}>Add Service to Unit {unitNumber}</h3>
          </div>
          <div style={S.emptyModal}>
            <div style={S.emptyModalIcon}>{ownsNothing ? '🛈' : '✓'}</div>
            <h4 style={S.emptyModalTitle}>{ownsNothing ? 'No services on your account yet' : 'Nothing left to add'}</h4>
            <p style={S.emptyModalBody}>
              {ownsNothing
                ? "You haven't bought any services at the account level yet. Buy one from Settings → Services, then come back here to assign it to this unit."
                : 'Every service on your account is already assigned to this unit. Buy another service from Settings → Services to add more.'}
            </p>
            <div style={S.modalBtnSecondary} onClick={goToBankAccounts}>Go to Settings → Services</div>
          </div>
        </div>
      </div>
    );
  }

  // State 1 — checklist
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHdr}>
          <h3 style={S.modalHdrTitle}>Add Service to Unit {unitNumber}</h3>
          <p style={S.modalHdrSub}>Choose from services already on your account. Only unassigned ones are shown.</p>
        </div>

        <div style={S.modalBody}>
          {available.map(s => {
            const isChecked = !!checked[s.id];
            return (
              <div key={s.id} style={S.pickRow}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(s.id)}
                  style={{ marginTop: 3, width: 15, height: 15, accentColor: C.blue, flexShrink: 0 }}
                />
                <div style={{ ...S.pickIcon, ...(s.requiresBankAccount ? S.pickIconBank : {}) }}>
                  <i className={`ti ${s.icon}`} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.pickName}>{s.name}</div>
                  <div style={S.pickSub}>
                    {s.price} {s.priceUnit}{s.requiresBankAccount ? ' · requires bank account' : ' · no bank account needed'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {submitErrors.length > 0 && (
          <div style={S.modalBody}>
            {submitErrors.map((e, i) => (
              <div key={i} style={S.resolveNote(false)}>✕ {e.name}: {e.message}</div>
            ))}
            <div style={S.inlineAddBank}>
              <div style={S.inlineAddBankMsg}>A service listed above without a bank account may need one added first.</div>
              <span style={S.inlineAddBankLink} onClick={goToBankAccounts}>+ Add Bank Account →</span>
            </div>
          </div>
        )}

        <div style={S.modalFooter}>
          <div style={S.modalBtnSecondary} onClick={onClose}>Cancel</div>
          <button style={S.modalBtnPrimary(!canSubmit)} disabled={!canSubmit} onClick={handleSubmit}>
            {submitting
              ? 'Adding…'
              : `Add ${checkedServices.length || ''} Service${checkedServices.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Unit field options — derived from the backend's real choices,
// confirmed live against properties/models.py's UNIT_TYPE_CHOICES /
// OWNERSHIP_TYPE_CHOICES / LEASE_TYPE_CHOICES / MANAGEMENT_MODEL_CHOICES
// (Unit's ownership_type values are lowercase — a different casing than
// Property's — not a typo, just how the backend actually stores it).
const EDIT_UNIT_TYPE_OPTIONS = [
  { value: 'studio',       label: 'Studio' },
  { value: '1br',          label: '1 Bedroom' },
  { value: '2br',          label: '2 Bedroom' },
  { value: '3br',          label: '3 Bedroom' },
  { value: '4br_plus',     label: '4 Bedroom+' },
  { value: 'penthouse',    label: 'Penthouse' },
  { value: 'student_room', label: 'Student Room' },
  { value: 'serviced',     label: 'Serviced Unit' },
  { value: 'commercial',   label: 'Commercial Unit' },
];
const EDIT_UNIT_OWNERSHIP_TYPE_OPTIONS = [
  { value: 'self_owned', label: 'Self-Owned' },
  { value: 'co_owned',   label: 'Co-Owned' },
  { value: 'corporate',  label: 'Corporate / LLC' },
  { value: 'leasehold',  label: 'Leasehold' },
];
const EDIT_LEASE_TYPE_OPTIONS = [
  { value: 'fixed',   label: 'Fixed-Term' },
  { value: 'month',   label: 'Month-to-Month' },
  { value: 'short',   label: 'Short-Term' },
  { value: 'student', label: 'Student Lease' },
];
const EDIT_MANAGEMENT_MODEL_OPTIONS = [
  { value: 'full',      label: 'Full Management' },
  { value: 'rent_only', label: 'Rent Collection Only' },
  { value: 'owner',     label: 'Owner Managed' },
];

// ─── Edit Unit Modal — proper Edit functionality (every UnitWriteSerializer
// text/numeric field, floor plan + its 3 thumbnails with real
// replace/remove, gallery item delete wired to the gallery DELETE endpoint
// that already existed but had no UI hook, and amenity add/remove via the
// existing POST plus the newly-added
// DELETE .../units/<uid>/amenities/<amenity_id>/). Built per the explicit
// directive: "No.. I need a proper edit functionality for both Property
// and Unit to be build now itself."
function EditUnitModal({ propId, unitId, unit, amenities, onClose, onSaved }) {
  const [form, setForm] = useState({
    unit_number:       unit.unit_number || '',
    tower:             unit.tower || '',
    unit_type:         unit.unit_type || '',
    ownership_type:    unit.ownership_type || '',
    floor:             unit.floor ?? '',
    lease_type:        unit.lease_type || '',
    management_model:  unit.management_model || '',
    carpet_area:       unit.carpet_area ?? '',
    total_area:        unit.total_area ?? '',
    total_rooms:       unit.total_rooms ?? '',
    total_baths:       unit.total_baths ?? '',
    student_housing:   !!unit.student_housing,
    rent_amount:       unit.rent_amount ?? '',
    security_deposit:  unit.security_deposit ?? '',
    floor_plan_name:   unit.floor_plan_name || '',
    description:       unit.description || '',
    available_date:    unit.available_date || '',
  });
  const upd = patch => setForm(f => ({ ...f, ...patch }));

  const [amenityMaster, setAmenityMaster]           = useState([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState(new Set((amenities || []).map(a => a.id)));
  const [amenitySearch, setAmenitySearch]           = useState('');

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [galDeletingId, setGalDeletingId] = useState(null);

  // Floor plan + its 3 thumbnails — same local pending/cleared pattern as
  // LandlordPropertyDetailPage.jsx's EditPropertyModal image slots.
  const [pendingFiles, setPendingFiles] = useState({});
  const [clearedSlots, setClearedSlots] = useState(new Set());
  const fpInputRefs = useRef({});
  const galleryModalInputRef = useRef(null);
  const [uploadingGalleryInModal, setUploadingGalleryInModal] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/amenities/?category=UNIT`, { headers: { Authorization: 'Bearer ' + token } })
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

  const FP_SLOTS = [
    { key: 'floor_plan_url',    label: 'Floor plan' },
    { key: 'floor_plan_thumb1', label: 'Page 2' },
    { key: 'floor_plan_thumb2', label: 'Page 3' },
    { key: 'floor_plan_thumb3', label: 'Page 4' },
  ];

  const slotCurrentUrl = (key) => {
    if (clearedSlots.has(key)) return null;
    if (pendingFiles[key]) return URL.createObjectURL(pendingFiles[key]);
    return unit[key] || null;
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

  // Gallery item delete — fires immediately (same immediate-effect pattern
  // as the page's existing "Add photo"), using the DELETE endpoint that
  // already existed server-side (UnitGalleryDetailView) but had no UI
  // hook anywhere before this.
  const handleDeleteGalleryItem = async (galleryId) => {
    setGalDeletingId(galleryId);
    try {
      const token = localStorage.getItem('access_token');
      const r = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/gallery/${galleryId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok && r.status !== 204) throw new Error(`Could not delete photo (${r.status})`);
      await onSaved();
    } catch (e) {
      setSaveError(e.message || 'Could not delete that photo.');
    } finally {
      setGalDeletingId(null);
    }
  };

  const handleAddGalleryInModal = async (file) => {
    if (!file) return;
    setUploadingGalleryInModal(true);
    try {
      const token = localStorage.getItem('access_token');
      const isVideo = file.type.startsWith('video/');
      const fd = new FormData();
      fd.append('file_url', file);
      fd.append('file_type', isVideo ? 'VIDEO' : 'IMAGE');
      const r = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/gallery/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!r.ok) throw new Error(`Could not upload photo (${r.status})`);
      await onSaved();
    } catch (e) {
      setSaveError(e.message || 'Could not upload that photo.');
    } finally {
      setUploadingGalleryInModal(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const token = localStorage.getItem('access_token');

      const textBody = {
        unit_number: form.unit_number,
        tower: form.tower,
        unit_type: form.unit_type,
        ownership_type: form.ownership_type,
        floor: form.floor === '' ? null : form.floor,
        lease_type: form.lease_type,
        management_model: form.management_model,
        carpet_area: form.carpet_area === '' ? null : form.carpet_area,
        total_area: form.total_area === '' ? null : form.total_area,
        total_rooms: form.total_rooms === '' ? null : form.total_rooms,
        total_baths: form.total_baths === '' ? null : form.total_baths,
        student_housing: !!form.student_housing,
        rent_amount: form.rent_amount === '' ? null : form.rent_amount,
        security_deposit: form.security_deposit === '' ? null : form.security_deposit,
        floor_plan_name: form.floor_plan_name,
        description: form.description,
        available_date: form.available_date || null,
      };
      let res = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(textBody),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || Object.values(e)[0]?.[0] || `Save failed (${res.status})`);
      }

      for (const { key } of FP_SLOTS) {
        if (clearedSlots.has(key)) {
          const r = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: null }),
          });
          if (!r.ok) throw new Error(`Could not remove ${key} (${r.status})`);
        } else if (pendingFiles[key]) {
          const fd = new FormData();
          fd.append(key, pendingFiles[key]);
          const r = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (!r.ok) throw new Error(`Could not upload ${key} (${r.status})`);
        }
      }

      const originalIds = new Set((amenities || []).map(a => a.id));
      const toAdd    = [...selectedAmenityIds].filter(id => !originalIds.has(id));
      const toRemove = [...originalIds].filter(id => !selectedAmenityIds.has(id));
      for (const amenityId of toAdd) {
        await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/amenities/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amenity: amenityId }),
        });
      }
      for (const amenityId of toRemove) {
        await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/amenities/${amenityId}/`, {
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

  const filteredAmenityMaster = amenitySearch
    ? amenityMaster.filter(a => a.name.toLowerCase().includes(amenitySearch.toLowerCase()))
    : amenityMaster;

  const galleryItemsForModal = unit.gallery_images || [];

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modal, width: 700, maxHeight: '86vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHdr}>
          <h3 style={S.modalHdrTitle}><i className="ti ti-pencil" aria-hidden="true" /> Edit Unit {unit.unit_number}</h3>
        </div>
        <div style={{ padding: '4px 22px 22px' }}>
          {saveError && <div style={{ ...S.errBanner, borderRadius: 8, padding: '9px 12px', marginBottom: 14 }}><i className="ti ti-alert-circle" aria-hidden="true" /> {saveError}</div>}

          <div style={S.editFormGrid}>
            <div>
              <div style={S.editLabel}>Unit Number</div>
              <input style={S.editInput} value={form.unit_number} onChange={e => upd({ unit_number: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Tower</div>
              <input style={S.editInput} value={form.tower} onChange={e => upd({ tower: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Unit Type</div>
              <select style={S.editSelect} value={form.unit_type} onChange={e => upd({ unit_type: e.target.value })}>
                <option value="">Select type…</option>
                {EDIT_UNIT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={S.editLabel}>Ownership Type</div>
              <select style={S.editSelect} value={form.ownership_type} onChange={e => upd({ ownership_type: e.target.value })}>
                <option value="">Select ownership…</option>
                {EDIT_UNIT_OWNERSHIP_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={S.editLabel}>Lease Type</div>
              <select style={S.editSelect} value={form.lease_type} onChange={e => upd({ lease_type: e.target.value })}>
                <option value="">Select lease type…</option>
                {EDIT_LEASE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={S.editLabel}>Management Model</div>
              <select style={S.editSelect} value={form.management_model} onChange={e => upd({ management_model: e.target.value })}>
                <option value="">Select model…</option>
                {EDIT_MANAGEMENT_MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={S.editLabel}>Floor</div>
              <input style={S.editInput} type="number" value={form.floor} onChange={e => upd({ floor: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Carpet Area (sq ft)</div>
              <input style={S.editInput} type="number" value={form.carpet_area} onChange={e => upd({ carpet_area: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Total Area (sq ft)</div>
              <input style={S.editInput} type="number" value={form.total_area} onChange={e => upd({ total_area: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Total Rooms (Beds)</div>
              <input style={S.editInput} type="number" value={form.total_rooms} onChange={e => upd({ total_rooms: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Total Baths</div>
              <input style={S.editInput} type="number" value={form.total_baths} onChange={e => upd({ total_baths: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Student Housing</div>
              <label style={S.editCheckRow}>
                <input type="checkbox" checked={form.student_housing} onChange={e => upd({ student_housing: e.target.checked })} />
                This unit is student housing
              </label>
            </div>
            <div>
              <div style={S.editLabel}>Rent Amount ($)</div>
              <input style={S.editInput} type="number" value={form.rent_amount} onChange={e => upd({ rent_amount: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Security Deposit ($)</div>
              <input style={S.editInput} type="number" value={form.security_deposit} onChange={e => upd({ security_deposit: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Available From</div>
              <input style={S.editInput} type="date" value={form.available_date || ''} onChange={e => upd({ available_date: e.target.value })} />
            </div>
            <div>
              <div style={S.editLabel}>Floor Plan Name</div>
              <input style={S.editInput} value={form.floor_plan_name} onChange={e => upd({ floor_plan_name: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={S.editLabel}>Description</div>
              <textarea style={{ ...S.editInput, height: 70, resize: 'vertical', paddingTop: 8 }} value={form.description} onChange={e => upd({ description: e.target.value })} />
            </div>
          </div>

          <div style={{ ...S.editSecLbl, marginTop: 18 }}>Gallery Photos &amp; Video</div>
          <div style={S.editGalGrid}>
            {galleryItemsForModal.map(g => (
              <div key={g.id} style={{ ...S.editGalItem, position: 'relative' }}>
                {g.file_type === 'VIDEO' ? (
                  <video src={g.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                ) : (
                  <img src={g.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {g.file_type === 'VIDEO' && (
                  <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: 0.3, padding: '2px 5px', borderRadius: 4 }}>VIDEO</div>
                )}
                <button
                  type="button"
                  style={S.editGalX}
                  onClick={() => handleDeleteGalleryItem(g.id)}
                  disabled={galDeletingId === g.id}
                  aria-label={g.file_type === 'VIDEO' ? 'Remove video' : 'Remove photo'}
                >
                  <i className={`ti ${galDeletingId === g.id ? 'ti-loader-2' : 'ti-x'}`} style={{ fontSize: 11 }} aria-hidden="true" />
                </button>
              </div>
            ))}
            <div
              style={{ ...S.editGalItem, border: `1px dashed ${C.cardBdr}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: uploadingGalleryInModal ? 'wait' : 'pointer', color: C.txtMuted, fontSize: 10.5 }}
              onClick={() => { if (!uploadingGalleryInModal) galleryModalInputRef.current?.click(); }}
            >
              <input
                ref={galleryModalInputRef}
                type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddGalleryInModal(f); }}
              />
              <i className={`ti ${uploadingGalleryInModal ? 'ti-loader-2' : 'ti-plus'}`} style={{ fontSize: 16 }} aria-hidden="true" />
              {uploadingGalleryInModal ? 'Uploading…' : 'Add photo / video'}
            </div>
            {galleryItemsForModal.length === 0 && (
              <div style={{ gridColumn: '2 / span 3', fontSize: 11.5, color: C.txtMuted, fontStyle: 'italic', alignSelf: 'center' }}>No real photos uploaded yet — showing samples on the unit page.</div>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: C.txtMuted, marginTop: 4 }}>
            Replacing a photo or video here means removing it (×) and adding the new one. If a video is present, it plays automatically in the hero spot on the Unit page.
          </div>

          <div style={{ ...S.editSecLbl, marginTop: 18 }}>Floor Plan</div>
          <div style={S.editGalGrid}>
            {FP_SLOTS.map(({ key, label }) => {
              const url = slotCurrentUrl(key);
              // Session 57 fix — Floor Plan used to have its own pattern (a
              // separate "Replace"/"Upload" text link under each tile) that
              // didn't match Gallery Photos' pattern (click the tile itself,
              // X badge to remove). Unified: the whole tile is now the click
              // target, same as Gallery Photos, just keeping the small
              // position label since these 4 slots are order-meaningful
              // (Gallery Photos' tiles aren't).
              return (
                <div key={key} style={S.editFpSlot}>
                  <div
                    onClick={() => fpInputRefs.current[key]?.click()}
                    style={{ position: 'relative', width: '100%', height: 80, borderRadius: 8, overflow: 'hidden', background: C.pageBg, cursor: 'pointer' }}
                  >
                    {url ? (
                      <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: C.txtMuted, fontSize: 10.5, border: `1px dashed ${C.cardBdr}`, borderRadius: 8 }}>
                        <i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" />
                        Upload
                      </div>
                    )}
                    {url && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleClearSlot(key); }}
                        style={S.editFpX}
                        aria-label={`Remove ${label}`}
                      >
                        <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.txtMuted, marginTop: 4, textAlign: 'center' }}>{label}</div>
                  <input
                    ref={el => (fpInputRefs.current[key] = el)}
                    type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handlePickFile(key, f); }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ ...S.editSecLbl, marginTop: 18 }}>Amenities</div>
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
        </div>

        <div style={S.modalFooter}>
          <button style={S.modalBtnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={S.modalBtnPrimary(saving)} disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

export default function LandlordUnitDetailPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [tenantTab, setTenantTab] = useState('current');
  const [ownerTab, setOwnerTab] = useState('current');
  // Session 60 — one shared piece of state for every eye-icon pop-up
  // (Owner row detail, Tenant row detail, Ancillary Services checklist);
  // null = closed, otherwise { type: 'owner'|'tenant'|'ancillary', row? }.
  const [detailModal, setDetailModal] = useState(null);

  // Unit Services (SVC-1, Session 40) — real data now. ownedServices is this
  // landlord's account-level entitlement (GET /landlord/account/services/);
  // assignedServices is what's actually on THIS unit (GET
  // /properties/<pk>/units/<uid>/services/, the real UnitService rows —
  // this is also what a bulk add on LandlordPropertyDetailPage.jsx now
  // writes to, so the two pages agree without any FE-only shared store).
  const [ownedServices, setOwnedServices] = useState([]);
  const [assignedServices, setAssignedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);

  // Forces the amenities scrollbar to stay visible (webkit/Chrome hides
  // scrollbars until active-scroll by default on macOS) — can't target
  // ::-webkit-scrollbar from an inline style object, so it's scoped here.
  const amenityScrollStyle = `
    .un-amenity-scroll::-webkit-scrollbar { width: 5px; }
    .un-amenity-scroll::-webkit-scrollbar-track { background: transparent; }
    .un-amenity-scroll::-webkit-scrollbar-thumb { background: ${C.cardBdr}; border-radius: 3px; }
    .un-amenity-scroll { scrollbar-width: thin; scrollbar-color: ${C.cardBdr} transparent; }
  `;

  const pathParts = window.location.pathname.split('/');
  const propId = pathParts[pathParts.indexOf('property') + 1];
  const unitId = pathParts[pathParts.indexOf('unit') + 1];

  // Session 56 — pulled out of the effect below so the new "Add photos" /
  // "Upload floor plan" flows (further down) can re-run this fetch after
  // a successful upload and pick up the real gallery_images/floor_plan_url
  // the backend just saved, same pattern as LandlordPropertyDetailPage.jsx's
  // fetchPropertyDetail.
  const fetchUnitDetail = React.useCallback(() => {
    if (!propId || !unitId) return;
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE}/landlord/property/${propId}/unit/${unitId}/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [propId, unitId]);

  React.useEffect(() => { fetchUnitDetail(); }, [fetchUnitDetail]);

  // Session 56 — real gallery/floor-plan uploads for the landlord Unit
  // detail page, which had no edit affordance at all before this (the
  // gallery carousel and floor plan box were both read-only, falling back
  // to sample images whenever the real fields were empty). Gallery photos
  // go through the same POST /api/properties/<pk>/units/<uid>/gallery/
  // endpoint AddNewProperty.jsx's landlord unit-creation flow already uses;
  // the floor plan goes through the same multipart PATCH
  // /api/properties/<pk>/units/<uid>/ that flow uses for floor_plan_url.
  // No new backend endpoints — both already existed and already worked
  // (confirmed live: unit 8's 5 real gallery rows + floor plan were
  // created this exact way), they just had no UI hook on this page yet.
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState(null);
  const galleryInputRef = useRef(null);

  // Session 59 — the main (non-modal) page previously only let you
  // upload/replace the single primary floor_plan_url slot. The redesign's
  // 2x2 floor plan grid needs the same immediate-effect upload for all 4
  // slots (floor_plan_url + 3 thumbs), plus a remove, mirroring the
  // gallery's immediate-effect pattern above rather than the Edit modal's
  // deferred-until-Save pattern (there is no "Save" button out here).
  const FP_MAIN_SLOTS = [
    { key: 'floor_plan_url',    label: 'Floor plan' },
    { key: 'floor_plan_thumb1', label: 'Page 2' },
    { key: 'floor_plan_thumb2', label: 'Page 3' },
    { key: 'floor_plan_thumb3', label: 'Page 4' },
  ];
  const [uploadingFpSlot, setUploadingFpSlot] = useState(null); // holds the key currently in flight
  const fpMainInputRefs = useRef({});

  const handleAddFloorPlanSlot = async (key, file) => {
    if (!file || !propId || !unitId) return;
    setUploadingFpSlot(key);
    setMediaUploadError(null);
    try {
      const token = localStorage.getItem('access_token');
      const form = new FormData();
      form.append(key, file);
      const res = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || e.error || `Upload failed (${res.status})`);
      }
      await fetchUnitDetail();
    } catch (e) {
      setMediaUploadError(e.message || 'Floor plan upload failed. Please try again.');
    } finally {
      setUploadingFpSlot(null);
    }
  };

  const handleClearFloorPlanSlot = async (key) => {
    setUploadingFpSlot(key);
    setMediaUploadError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: null }),
      });
      if (!res.ok) throw new Error(`Could not remove that floor plan (${res.status})`);
      await fetchUnitDetail();
    } catch (e) {
      setMediaUploadError(e.message || 'Could not remove that floor plan.');
    } finally {
      setUploadingFpSlot(null);
    }
  };

  const handleAddGalleryFile = async (file) => {
    if (!file || !propId || !unitId) return;
    setUploadingGallery(true);
    setMediaUploadError(null);
    try {
      const token = localStorage.getItem('access_token');
      const isVideo = file.type.startsWith('video/');
      const form = new FormData();
      form.append('file_url', file);
      form.append('file_type', isVideo ? 'VIDEO' : 'IMAGE');
      const res = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/gallery/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || e.error || `Upload failed (${res.status})`);
      }
      await fetchUnitDetail();
    } catch (e) {
      setMediaUploadError(e.message || 'Photo upload failed. Please try again.');
    } finally {
      setUploadingGallery(false);
    }
  };

  // Avatar must reflect the logged-in landlord, not the unit's tenant or
  // owner — fetch /auth/me/ independently rather than deriving it from
  // whatever entity happens to be on screen.
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setCurrentUser(j.user || j))  // handle either { user: {...} } or flat shape
      .catch(() => {});
  }, []);

  // Session 40 (SVC-1) — this landlord's account-level entitlement. Fetched
  // once; re-fetched on demand isn't needed here since Buy Service (the
  // only thing that changes this list) doesn't exist in this FE yet.
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/account/services/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setOwnedServices(j.services || []))
      .catch(() => setOwnedServices([]));
  }, []);

  // Session 40 (SVC-1) — this unit's actual assigned services. Pulled out
  // into its own function so it can be re-run after a successful Add
  // Service, not just on mount.
  const fetchAssignedServices = React.useCallback(() => {
    if (!propId || !unitId) return;
    const token = localStorage.getItem('access_token');
    setServicesLoading(true);
    fetch(`${API_BASE}/properties/${propId}/units/${unitId}/services/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => { setAssignedServices(j); setServicesLoading(false); })
      .catch(() => { setAssignedServices([]); setServicesLoading(false); });
  }, [propId, unitId]);

  React.useEffect(() => { fetchAssignedServices(); }, [fetchAssignedServices]);

  const prop   = data?.property || {};
  const unit   = data?.unit || {};
  const stats  = data?.stats || {};
  const amenities = data?.amenities || [];
  const tenant = data?.tenant_profile || {};
  const maintenance = data?.maintenance || [];
  const pastTenants = data?.past_tenants || [];
  const ownerships = data?.ownerships || [];
  const pastOwnerships = data?.past_ownerships || [];
  const userLabel = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email
    : '';

  // Session 53 fix: backend now returns structured gallery_images
  // ({file_url, file_type}) alongside the old flat gallery_urls — using it
  // here lets a real uploaded video (a) become the autoplaying hero instead
  // of being silently treated as just another photo, and (b) be told apart
  // from a photo at all when the gallery is opened in the new lightbox.
  const hasRealGallery = !!unit.gallery_images?.length;
  const galleryItems = hasRealGallery
    ? unit.gallery_images
    : (unit.gallery_urls?.length
        ? unit.gallery_urls.map(u => ({ file_url: u, file_type: 'IMAGE' }))
        : FB_GALLERY.map(u => ({ file_url: u, file_type: 'IMAGE' })));
  const usingFallbackGallery = !unit.gallery_urls?.length && !hasRealGallery;
  const heroVideoIdx = galleryItems.findIndex(g => g.file_type === 'VIDEO');

  // Session 59 — "Architectural Media Gallery" redesign: a fixed hero (the
  // video if one exists, else the first image) alongside up to 3 other
  // items in a 2x2 sub-grid, with a "view all" overlay on the 4th tile
  // when more exist. Unlike the old single cycling carousel, the hero and
  // the thumbnails are all visible at once, same idea as
  // LandlordPropertyDetailPage.jsx's Gallery block.
  const mediaHeroIdx = heroVideoIdx !== -1 ? heroVideoIdx : 0;
  const mediaHeroItem = galleryItems[mediaHeroIdx];
  const mediaThumbItems = galleryItems
    .map((g, i) => ({ ...g, _idx: i }))
    .filter(g => g._idx !== mediaHeroIdx)
    .slice(0, 4);
  const mediaExtraCount = Math.max(0, galleryItems.length - 1 - mediaThumbItems.length);

  // Leads with the video (if any) the first time this unit's data loads,
  // same "video becomes the default main image, autoplaying" behavior as
  // the PM Unit/Property detail pages.
  React.useEffect(() => {
    if (heroVideoIdx !== -1) setPhotoIdx(heroVideoIdx);
  }, [unit.id, heroVideoIdx]);

  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);

  // Session 59 — horizontal KPI cards (reference design). lease_type is
  // stored as the dropdown's raw value ('fixed'/'month' — see
  // EDIT_LEASE_TYPE_OPTIONS), so it's mapped to the same label the Edit
  // modal shows rather than printing the raw code.
  const LEASE_TYPE_LABELS = { fixed: 'Fixed-Term', month: 'Month-to-Month' };
  const bedCount = unit.total_rooms ?? null;

  // Session 60 — Unit & Lease Overview fields (replaces the old 8-field
  // specGrid). Property/Unit combines the breadcrumb's property code with
  // this unit's number; Floor Placement renders unit.floor as an ordinal;
  // Contractual Model pairs the same lease-type word the KPI row uses with
  // the existing lease_term stat; Ancillary Services reads Active/Inactive
  // off whether any amenities are configured (the eye icon then opens a
  // DetailModal listing them — "Pet Policy, Parking" etc., per the
  // reference); Lease Status is derived from whether a tenant is assigned,
  // same signal the old stat strip used for "Status".
  const unitPropLabel = `${prop.name || '—'}/${unit.unit_number || '—'}`;
  const floorLabel = (() => {
    const o = ordinalSuffix(unit.floor);
    return o ? `${o} Floor` : '—';
  })();
  const areaLabel = (unit.total_area || unit.carpet_area)
    ? `${unit.total_area ?? '—'}/${unit.carpet_area ?? '—'} sq ft`
    : '—';
  const leaseWord = unit.lease_type === 'fixed' ? 'Fixed'
    : unit.lease_type === 'month' ? 'Month-to-Month'
    : (unit.lease_type || '—');
  const ancillaryActive = amenities.length > 0;
  const leaseStatusLabel = tenant.name ? 'Active' : 'Ready For Intake';
  const leaseStatusColor = tenant.name ? C.greenDark : C.txtSec;

  const kpis = [
    { icon: 'ti-cash',        lbl: 'Rent / mo',     val: unit.rent_amount ? `$${unit.rent_amount}` : '—', sub: 'Standard rate' },
    { icon: 'ti-shield-lock', lbl: 'Security Dep.', val: unit.security_deposit ? `$${unit.security_deposit}` : '—', sub: 'Escrow protected' },
    { icon: 'ti-layout-2',    lbl: 'Configuration', val: bedCount != null ? `${bedCount} Bedroom${bedCount === 1 ? '' : 's'}` : '—', sub: 'Configured' },
    { icon: 'ti-bed',         lbl: 'Total Beds',    val: bedCount != null ? `${bedCount} Bed${bedCount === 1 ? '' : 's'}` : '—', sub: 'Master suite' },
    { icon: 'ti-bath',        lbl: 'Total Baths',   val: unit.total_baths != null ? `${unit.total_baths} Bath${unit.total_baths === 1 ? '' : 's'}` : '—', sub: 'Full ensuite' },
    { icon: 'ti-file-text',   lbl: 'Lease Agreement', val: LEASE_TYPE_LABELS[unit.lease_type] || unit.lease_type || '—', sub: '12-Month Standard' },
  ];

  // Session 40 (SVC-1) — real data, shaped for the display/modal styles
  // that were built against the old mock fields (icon, requiresBankAccount,
  // priceUnit). No icon comes back from the backend, so every service uses
  // the same fallback glyph.
  const unitServices = assignedServices.map(row => ({
    id: row.service,
    name: row.service_name,
    icon: SERVICE_FALLBACK_ICON,
    requiresBankAccount: row.requires_payment_collection,
  }));
  // Session 60 — Unit Services falls back to 5 generic sample services
  // whenever nothing real is assigned yet, so the card is never empty.
  const showingSampleServices = !servicesLoading && unitServices.length === 0;
  const servicesToShow = unitServices.length > 0 ? unitServices : SAMPLE_SERVICES;
  const ownedServicesForModal = ownedServices.map(s => ({
    id: s.id,
    name: s.name,
    icon: SERVICE_FALLBACK_ICON,
    requiresBankAccount: s.requires_payment_collection,
    price: s.price != null ? `$${s.price}` : '',
    priceUnit: s.price_unit === 'PER_UNIT' ? '/ Unit' : s.price_unit === 'PER_PROPERTY' ? '/ Property' : s.price_unit === 'PER_MONTH' ? '/ Month' : '/ Flat Fee',
  }));
  const assignedServiceIds = assignedServices.map(row => row.service);

  // Session 40 (SVC-1) — one real POST per checked service (the backend
  // endpoint takes a single `service` id per call, unlike the checklist
  // modal which lets you check several at once). All-settled rather than
  // all-or-nothing on purpose: if 2 of 3 succeed, those 2 should stick
  // rather than the whole batch rolling back — unlike the bulk "Add to All
  // Units" endpoint, this isn't one atomic operation server-side, it's N
  // independent single-unit calls from the FE's perspective.
  const handleAddServices = async (services) => {
    const token = localStorage.getItem('access_token');
    const errors = [];
    for (const s of services) {
      try {
        const res = await fetch(`${API_BASE}/properties/${propId}/units/${unitId}/services/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ service: s.id }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const message = body?.service?.[0] || body?.detail || `Failed (${res.status})`;
          errors.push({ name: s.name, message });
        }
      } catch (e) {
        errors.push({ name: s.name, message: 'Network error — please try again.' });
      }
    }
    fetchAssignedServices();
    return { errors };
  };

  return (
    <div style={S.shell}>
      <style>{amenityScrollStyle}</style>
      <NavF activePage="properties" />

      <div style={S.main}>
        <header style={S.topbar}>
          <div style={S.topTitle}>UrbanNest Landlord</div>
          <div style={S.topRight}>
            <button style={S.iconBtn} aria-label="Notifications"><i className="ti ti-bell" aria-hidden="true" /></button>
            <button style={S.iconBtn} aria-label="Help"><i className="ti ti-help-circle" aria-hidden="true" /></button>
            <div style={S.avatar}>{initials(userLabel || 'L')}</div>
          </div>
        </header>

        <main style={S.content}>
          {error && <div style={S.errBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}

          {/* BREADCRUMB */}
          <div style={S.bread}>
            <span style={S.breadLink} onClick={() => window.location.href = '/landlord-portal/portfolio'}>Properties</span>
            <span style={S.breadSep}>›</span>
            <span style={S.breadLink} onClick={() => window.location.href = `/landlord-portal/property/${propId}`}>{loading ? '…' : prop.name}</span>
            <span style={S.breadSep}>›</span>
            <span style={S.breadCur}>{loading ? '…' : unit.unit_number}</span>
          </div>

          {/* TITLE ROW */}
          <div style={S.titleRow}>
            <div style={S.unitName}>{loading ? '…' : unit.unit_number}</div>
            <div style={S.actionBtns}>
              {!loading && unit.id && (
                <button style={S.editBtn} onClick={() => setShowEditUnit(true)}>
                  <i className="ti ti-pencil" style={{ fontSize: 13 }} aria-hidden="true" /> Edit
                </button>
              )}
              {/* Session 41 — entry point into the Create Listing wizard
                  (UrbanNest_Listing_Architecture.md §2). Originally FE-only
                  with no gating at all (unconditional link into the wizard
                  even for an already-listed unit). Session 44 continuation:
                  the backend (LandlordUnitDetailView) now reports
                  unit.active_listing when a DRAFT/PENDING_PAYMENT/ACTIVE
                  Listing already exists for this unit — disable the button
                  and relabel it instead of letting a second wizard run
                  start. Still doesn't call the A6 readiness engine itself;
                  that's a separate, larger piece of wiring for a unit with
                  no listing yet (would gate whether the button is clickable
                  at all based on LIST_READY/NOT_READY), left for later FE
                  work rather than folded into this narrow fix. */}
              <button
                style={
                  unit.active_listing
                    ? { ...S.btnOutline, background: C.mutedBg || '#e5e7eb', color: C.muted || '#6b7280', border: 'none', cursor: 'not-allowed' }
                    : { ...S.btnOutline, background: C.blue, color: '#fff', border: 'none' }
                }
                disabled={!!unit.active_listing}
                onClick={() => {
                  if (unit.active_listing) return;
                  window.location.href = `/landlord-portal/property/${propId}/unit/${unitId}/list/step-1`;
                }}
                title={
                  unit.active_listing
                    ? (unit.active_listing.status === 'ACTIVE'
                        ? 'This unit is already listed on the Marketplace.'
                        : 'A listing is already in progress for this unit.')
                    : undefined
                }
              >
                <i className="ti ti-building-store" style={{ fontSize: 13 }} aria-hidden="true" />
                {unit.active_listing
                  ? (unit.active_listing.status === 'ACTIVE' ? 'Listed' : 'Listing in Progress')
                  : 'List on Marketplace'}
              </button>
              <button style={S.btnOutline}><i className="ti ti-share" style={{ fontSize: 13 }} aria-hidden="true" />Share detail</button>
              <button style={S.btnDark}><i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" />Download report</button>
            </div>
          </div>

          <div style={S.sw}>

            {/* HERO MEDIA */}
            <div style={S.mediaCard}>
              <div style={S.mediaHdr}>
                <div style={S.cardTitle}>Gallery</div>
                <span style={S.mediaCount}>{galleryItems.length} ITEM{galleryItems.length === 1 ? '' : 'S'}{usingFallbackGallery ? ' · SAMPLE' : ''}</span>
              </div>
              <div style={S.mediaGrid}>
                <div style={S.heroBox} onClick={() => setGalleryLightboxOpen(true)}>
                  {mediaHeroItem?.file_type === 'VIDEO' ? (
                    <video src={mediaHeroItem?.file_url} muted autoPlay loop playsInline style={S.galImg} />
                  ) : (
                    <img src={mediaHeroItem?.file_url} alt={unit.unit_number} style={S.galImg} />
                  )}
                  <span style={S.primaryBadge}>Primary View</span>
                  {mediaHeroItem?.file_type === 'VIDEO' && (
                    <span style={S.videoTourBtn}><i className="ti ti-player-play" style={{ fontSize: 11 }} aria-hidden="true" />Video Tour</span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); if (!uploadingGallery) galleryInputRef.current?.click(); }}
                    disabled={uploadingGallery}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(15,23,42,0.65)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, cursor: uploadingGallery ? 'wait' : 'pointer' }}
                  >
                    <i className={`ti ${uploadingGallery ? 'ti-loader-2' : 'ti-plus'}`} style={{ fontSize: 13 }} aria-hidden="true" />
                    {uploadingGallery ? 'Uploading…' : 'Add photo / video'}
                  </button>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddGalleryFile(f); }}
                  />
                </div>
                <div style={S.subGrid}>
                  {mediaThumbItems.map((item, i) => {
                    const isLast = i === mediaThumbItems.length - 1;
                    const showOverlay = isLast && mediaExtraCount > 0;
                    return (
                      <div key={item._idx} style={S.subTile} onClick={() => setGalleryLightboxOpen(true)}>
                        {item.file_type === 'VIDEO' ? (
                          <video src={item.file_url} muted style={S.galImg} />
                        ) : (
                          <img src={item.file_url} alt="" style={S.galImg} />
                        )}
                        {showOverlay && (
                          <div style={S.viewAllOverlay}>
                            <i className="ti ti-photo" style={{ fontSize: 16 }} aria-hidden="true" />
                            View All Photos
                            <span style={{ fontWeight: 400, fontSize: 9.5 }}>+{mediaExtraCount} more</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {galleryLightboxOpen && (
                <GalleryLightbox items={galleryItems} index={photoIdx} onClose={() => setGalleryLightboxOpen(false)} onNav={setPhotoIdx} />
              )}
            </div>
            {mediaUploadError && (
              <div style={{ marginTop: -10, marginBottom: 14, fontSize: 12.5, color: C.red || '#DC2626' }}>
                <i className="ti ti-alert-circle" aria-hidden="true" /> {mediaUploadError}
              </div>
            )}

            {/* KPI ROW — moved below the gallery per feedback */}
            <div style={S.kpiRow}>
              {kpis.map(k => (
                <div key={k.lbl} style={S.kpiCard}>
                  <div style={S.kpiTop}>
                    <span style={S.kpiLbl}>{k.lbl}</span>
                    <div style={S.kpiIcon}><i className={`ti ${k.icon}`} aria-hidden="true" /></div>
                  </div>
                  <div style={S.kpiVal}>{k.val}</div>
                  <div style={S.kpiSub}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* UNIT & LEASE OVERVIEW (60%) + FLOOR PLAN (40%) */}
            <div style={S.row60_40}>
              <div style={S.card}>
                <div style={S.cardTitle}>Unit & Lease Overview</div>
                <p style={{ fontSize: 12.5, color: C.txtSec, lineHeight: 1.7, margin: '8px 0 0' }}>
                  {unit.description || 'No description added for this unit yet.'}
                </p>
                <div style={S.leaseDivider} />
                <div style={S.leaseFieldsGrid}>
                  <div style={S.leaseFieldsCol}>
                    <div style={S.leaseFieldRow}>
                      <span style={S.leaseFieldLbl}>Property / Unit</span>
                      <span style={S.leaseFieldVal}>{unitPropLabel}</span>
                    </div>
                    <div style={S.leaseFieldRow}>
                      <span style={S.leaseFieldLbl}>Floor Placement</span>
                      <span style={S.leaseFieldVal}>{floorLabel}</span>
                    </div>
                    <div style={S.leaseFieldRow}>
                      <span style={S.leaseFieldLbl}>Total / Carpet Area</span>
                      <span style={S.leaseFieldVal}>{areaLabel}</span>
                    </div>
                  </div>
                  <div style={S.leaseFieldsCol}>
                    <div style={S.leaseFieldRow}>
                      <span style={S.leaseFieldLbl}>Contractual Model</span>
                      <span style={S.leaseFieldVal}>{leaseWord} / {stats.lease_term || '—'}</span>
                    </div>
                    <div style={S.leaseFieldRow}>
                      <span style={S.leaseFieldLbl}>Ancillary Services</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ ...S.leaseFieldVal, color: ancillaryActive ? C.greenDark : C.txtMuted }}>
                          {ancillaryActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          style={S.eyeBtn(ancillaryActive)}
                          disabled={!ancillaryActive}
                          onClick={() => ancillaryActive && setDetailModal({ type: 'ancillary' })}
                          aria-label="View ancillary services"
                        >
                          <i className="ti ti-eye" style={{ fontSize: 11 }} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div style={S.leaseFieldRow}>
                      <span style={S.leaseFieldLbl}>Lease Status</span>
                      <span style={{ ...S.leaseFieldVal, color: leaseStatusColor, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: leaseStatusColor, display: 'inline-block' }} />
                        {leaseStatusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardTitle}>Floor Plan</div>
                <div style={S.fpMainGrid}>
                  {FP_MAIN_SLOTS.map(slot => {
                    const url = unit[slot.key];
                    const busy = uploadingFpSlot === slot.key;
                    return (
                      <div key={slot.key} style={S.fpMainTile}>
                        {url ? (
                          <>
                            <img
                              src={url}
                              alt={slot.label}
                              style={{ ...S.galImg, cursor: busy ? 'wait' : 'pointer' }}
                              onClick={() => { if (!busy) fpMainInputRefs.current[slot.key]?.click(); }}
                            />
                            <span style={S.fpMainLbl}>{slot.label}</span>
                            <button
                              style={S.fpMainX}
                              disabled={busy}
                              onClick={e => { e.stopPropagation(); if (!busy) handleClearFloorPlanSlot(slot.key); }}
                              aria-label={`Remove ${slot.label}`}
                            >
                              <i className={`ti ${busy ? 'ti-loader-2' : 'ti-x'}`} style={{ fontSize: 11 }} aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <div
                            style={{ ...S.fpMainEmpty, cursor: busy ? 'wait' : 'pointer' }}
                            onClick={() => { if (!busy) fpMainInputRefs.current[slot.key]?.click(); }}
                          >
                            <i className={`ti ${busy ? 'ti-loader-2' : 'ti-plus'}`} style={{ fontSize: 16 }} aria-hidden="true" />
                            {busy ? 'Uploading…' : `+ Add ${slot.label}`}
                          </div>
                        )}
                        <input
                          ref={el => { fpMainInputRefs.current[slot.key] = el; }}
                          type="file"
                          accept="image/jpeg,image/png"
                          style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddFloorPlanSlot(slot.key, f); }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SPECIAL FEATURES (plain) / UNIT SERVICES (colored) */}
            <div style={S.row50_50}>
              <div style={S.card}>
                <div style={S.cardTitle}>Special Features</div>
                {amenities.length === 0 && <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic', marginTop: 10 }}>No amenities configured.</div>}
                {amenities.length > 0 && (
                  <div className={amenities.length > 6 ? 'un-amenity-scroll' : ''} style={S.amenityGrid}>
                    {amenities.map(a => (
                      <div key={a.id} style={S.amenityItem}>
                        <div style={S.amenityIcon}>
                          <i className={`ti ${amenityIcon(a.name)}`} style={{ fontSize: 11 }} aria-hidden="true" />
                        </div>
                        {a.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={S.cardTitle}>Unit Services</div>
                    {showingSampleServices && <span style={S.mediaCount}>SAMPLE</span>}
                  </div>
                  <span style={S.cardLink} onClick={() => setAddServiceOpen(true)}>+ Add Service</span>
                </div>
                {servicesLoading && (
                  <div style={S.serviceEmpty}>Loading services…</div>
                )}
                {!servicesLoading && (
                  <div style={S.serviceGrid}>
                    {servicesToShow.map((s, i) => {
                      const sc = serviceStyle(i);
                      return (
                        <div key={s.id} style={{ ...S.serviceItem, background: sc.bg }} title={s.name}>
                          <div style={{ ...S.serviceIcon, background: 'rgba(255,255,255,0.65)', color: sc.color, ...(s.requiresBankAccount ? S.serviceIconBank : {}) }}>
                            <i className={`ti ${s.icon}`} aria-hidden="true" />
                          </div>
                          <span style={S.serviceItemName}>{s.name}</span>
                          {s.requiresBankAccount && <div style={S.bankDot} />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!showingSampleServices && unitServices.some(s => s.requiresBankAccount) && (
                  <div style={S.serviceLegend}><div style={S.serviceLegendDot} /> = requires a linked bank account</div>
                )}
              </div>
            </div>

            {/* MAINTENANCE QUEUE / FINANCIAL COMMAND */}
            <div style={S.row50_50}>
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Maintenance Queue</div>
                  <span style={S.cardLink}>Add ticket</span>
                </div>
                {maintenance.length === 0 && <div style={{ fontSize: 12, color: C.txtMuted }}>No open tickets.</div>}
                {maintenance.map((t, i) => {
                  const bc = maintBadgeCfg(t.priority);
                  return (
                    <div key={t.id} style={i === maintenance.length - 1 ? { ...S.listItem, borderBottom: 'none' } : S.listItem}>
                      <div style={S.listIcon(bc.bg)}><i className="ti ti-tool" style={{ fontSize: 13, color: bc.col }} aria-hidden="true" /></div>
                      <div style={{ flex: 1 }}>
                        <div style={S.listTitle}>{t.title}</div>
                        <div style={S.listSub}>{t.time_ago}</div>
                      </div>
                      <span style={S.statusPill(bc.bg, bc.col)}>{bc.label}</span>
                    </div>
                  );
                })}
              </div>

              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Financial Command</div>
                  <span style={S.statusPill(C.stdBg, C.txtSec)}>Passive mode</span>
                </div>
                <table style={S.ledgerTable}>
                  <thead>
                    <tr style={S.ledgerHdrRow}>
                      <th style={S.ledgerTh}>Month</th>
                      <th style={S.ledgerTh}>Amount</th>
                      <th style={S.ledgerTh}>Payout</th>
                      <th style={S.ledgerTh}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEDGER_ROWS.map((r, i) => (
                      <tr key={i} style={i === LEDGER_ROWS.length - 1 ? {} : S.ledgerRow}>
                        <td style={S.ledgerTd}>{r.month}</td>
                        <td style={S.ledgerTd}>{r.amount}</td>
                        <td style={S.ledgerTd}>{r.payout}</td>
                        <td style={{ ...S.ledgerTd, color: C.greenDark, fontWeight: 500 }}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <span style={S.cardLink}>View Full Ledger</span>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS / DOCUMENT VAULT */}
            <div style={S.row50_50}>
              <div style={S.card}>
                <div style={S.cardHdr}><div style={S.cardTitle}>Quick Actions</div></div>
                {QA_ITEMS.map((q, i) => (
                  <div key={i} style={i === QA_ITEMS.length - 1 ? { ...S.listItem, borderBottom: 'none' } : S.listItem}>
                    <div style={S.listIcon(q.bg)}><i className={`ti ${q.icon}`} style={{ fontSize: 13, color: q.col }} aria-hidden="true" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={S.listTitle}>{q.title}</div>
                      <div style={S.listSub}>{q.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Document Vault</div>
                  <span style={S.cardLink}>Full Archive →</span>
                </div>
                {DOC_ITEMS.map((d, i) => (
                  <div key={i} style={i === DOC_ITEMS.length - 1 ? { ...S.listItem, borderBottom: 'none' } : S.listItem}>
                    <div style={S.listIcon(d.bg)}><i className={`ti ${d.icon}`} style={{ fontSize: 13, color: d.col }} aria-hidden="true" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={S.listTitle}>{d.name}</div>
                      <div style={S.listSub}>{d.meta}</div>
                    </div>
                    <i className="ti ti-download" style={{ fontSize: 13, color: C.txtMuted }} aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>

            {/* TENANT / OWNER — both rebuilt as Financial Command-style
                tables (header + Current/Past segmented toggle, then a
                table) with an added "view" column that opens a detail
                pop-up, per feedback. */}
            <div style={S.row50_50}>
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Tenant</div>
                  <div style={S.segToggle}>
                    <span style={S.segBtn(tenantTab === 'current')} onClick={() => setTenantTab('current')}>Current</span>
                    <span style={S.segBtn(tenantTab === 'past')} onClick={() => setTenantTab('past')}>Past{pastTenants.length > 0 ? ` (${pastTenants.length})` : ''}</span>
                  </div>
                </div>
                {(() => {
                  const rows = tenantTab === 'current'
                    ? (tenant.name ? [tenant] : [])
                    : pastTenants;
                  if (rows.length === 0) {
                    return (
                      <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic', padding: '8px 0' }}>
                        {tenantTab === 'current' ? 'No tenant assigned to this unit.' : 'No past tenant records for this unit yet.'}
                      </div>
                    );
                  }
                  return (
                    <table style={S.ledgerTable}>
                      <thead>
                        <tr style={S.ledgerHdrRow}>
                          <th style={S.ledgerTh}>Tenant</th>
                          <th style={S.ledgerTh}>Contact</th>
                          <th style={S.ledgerTh}>Move-in</th>
                          <th style={S.ledgerTh}>Rating</th>
                          <th style={{ ...S.ledgerTh, ...S.viewTh }}> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((t, i) => (
                          <tr key={t.id || i} style={i === rows.length - 1 ? {} : S.ledgerRow}>
                            <td style={S.ledgerTd}>{t.name || 'Unknown tenant'}</td>
                            <td style={S.ledgerTd}>{t.email || '—'}</td>
                            <td style={S.ledgerTd}>{t.move_in_date || '—'}</td>
                            <td style={S.ledgerTd}>
                              <span style={S.stars}>{t.payment_rating > 0 ? '★'.repeat(t.payment_rating) + '☆'.repeat(5 - t.payment_rating) : '—'}</span>
                            </td>
                            <td style={{ ...S.ledgerTd, ...S.viewTd }}>
                              <button style={S.eyeBtn(true)} onClick={() => setDetailModal({ type: 'tenant', row: { ...t, _past: tenantTab === 'past' } })} aria-label={`View ${t.name || 'tenant'} details`}>
                                <i className="ti ti-eye" style={{ fontSize: 11 }} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Owner</div>
                  <div style={S.segToggle}>
                    <span style={S.segBtn(ownerTab === 'current')} onClick={() => setOwnerTab('current')}>Current</span>
                    <span style={S.segBtn(ownerTab === 'past')} onClick={() => setOwnerTab('past')}>Past{pastOwnerships.length > 0 ? ` (${pastOwnerships.length})` : ''}</span>
                  </div>
                </div>
                {(() => {
                  const rows = ownerTab === 'current' ? ownerships : pastOwnerships;
                  if (rows.length === 0) {
                    return (
                      <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic', padding: '8px 0' }}>
                        {ownerTab === 'current' ? 'No current owner records for this unit.' : 'No past owner records for this unit yet.'}
                      </div>
                    );
                  }
                  return (
                    <table style={S.ledgerTable}>
                      <thead>
                        <tr style={S.ledgerHdrRow}>
                          <th style={S.ledgerTh}>Owner ID</th>
                          <th style={S.ledgerTh}>Owner Name</th>
                          <th style={S.ledgerTh}>Role</th>
                          <th style={S.ledgerTh}>Stake</th>
                          <th style={{ ...S.ledgerTh, ...S.viewTh }}> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((o, i) => (
                          <tr key={`${o.owner_id}-${i}`} style={i === rows.length - 1 ? {} : S.ledgerRow}>
                            <td style={S.ledgerTd}><span style={S.ownerIdPill}>{o.owner_id}</span></td>
                            <td style={S.ledgerTd}>{o.owner_name}{o.is_primary ? ' ★' : ''}</td>
                            <td style={S.ledgerTd}>{o.role}</td>
                            <td style={S.ledgerTd}>{o.share_pct}%</td>
                            <td style={{ ...S.ledgerTd, ...S.viewTd }}>
                              <button style={S.eyeBtn(true)} onClick={() => setDetailModal({ type: 'owner', row: o })} aria-label={`View ${o.owner_name} details`}>
                                <i className="ti ti-eye" style={{ fontSize: 11 }} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>

            <div style={S.footer}>© 2023 UrbanNest Property Management. All Rights Reserved.</div>
          </div>
        </main>
      </div>

      {detailModal?.type === 'ancillary' && (
        <DetailModal
          title="Ancillary Services"
          subtitle={`${amenities.length} associated with this unit`}
          list={amenities.map(a => a.name)}
          onClose={() => setDetailModal(null)}
        />
      )}
      {detailModal?.type === 'owner' && (
        <DetailModal
          title={detailModal.row.owner_name}
          subtitle={detailModal.row.owner_id}
          rows={[
            { label: 'Role', value: detailModal.row.role },
            { label: 'Stake', value: `${detailModal.row.share_pct}%` },
            { label: 'Start Date', value: detailModal.row.start_date || '—' },
            { label: 'End Date', value: detailModal.row.end_date || '—' },
            { label: 'Email', value: detailModal.row.owner_email || '—' },
          ]}
          onClose={() => setDetailModal(null)}
        />
      )}
      {detailModal?.type === 'tenant' && (
        <DetailModal
          title={detailModal.row.name || 'Tenant'}
          subtitle={detailModal.row._past ? 'Past tenant' : 'Current tenant'}
          rows={[
            { label: 'Occupation', value: detailModal.row.occupation || '—' },
            { label: 'Company', value: detailModal.row.company || '—' },
            { label: 'Contact', value: detailModal.row.email || '—' },
            { label: 'Move-in Date', value: detailModal.row.move_in_date || '—' },
            detailModal.row._past
              ? { label: 'Lease End Date', value: detailModal.row.lease_end_date || '—' }
              : { label: 'Renewal Window', value: detailModal.row.renewal_window || '—' },
            { label: 'Payment Rating', value: detailModal.row.payment_rating > 0 ? '★'.repeat(detailModal.row.payment_rating) + '☆'.repeat(5 - detailModal.row.payment_rating) : '—' },
          ]}
          onClose={() => setDetailModal(null)}
        />
      )}

      {addServiceOpen && (
        <AddServiceModal
          unitNumber={loading ? '' : unit.unit_number}
          ownedServices={ownedServicesForModal}
          assignedIds={assignedServiceIds}
          onClose={() => setAddServiceOpen(false)}
          onAdd={handleAddServices}
        />
      )}
      {showEditUnit && (
        <EditUnitModal
          propId={propId}
          unitId={unitId}
          unit={unit}
          amenities={amenities}
          onClose={() => setShowEditUnit(false)}
          onSaved={fetchUnitDetail}
        />
      )}
    </div>
  );
}
