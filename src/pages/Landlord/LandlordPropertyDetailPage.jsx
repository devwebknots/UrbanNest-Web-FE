import React, { useState, useEffect, useRef } from 'react';
import {
  PageShell, Grid, PropertyHero, StatTile, SectionCard, CardWave, Breadcrumb, TabBar, ListRow, EmptyState, PageFooter,
  MediaListItem, DataTable, MetricBar, BarChart, Gauge,
} from '../../components/v2';
import { C2, TONES2, GSTOPS2, AVATAR2, R2, FS2, FW2, SP2, SZ2, LAYOUT2, OP2, pad, UI2 } from '../../constants/v2';
import { C, F } from './landlordTokens';
import { CustomDropdown } from '../../components/ui';
import LandlordUnitSelection from './Listing/LandlordUnitSelection';

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

  // CARDS
  secLbl:   { fontSize:9.5, color:C.txtMuted, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:4, marginTop:8 },

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

  // EDIT PROPERTY / EDIT UNIT MODALS (shared shapes — proper Edit functionality)
  editFormGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 14px' },
  editLabel:        { fontSize:10, fontWeight:700, color:C.txtMuted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 },
  editInput:        { width:'100%', height:36, border:`1px solid ${C.cardBdr}`, borderRadius:6, padding:'0 10px', fontSize:12.5, color:C.txtPrimary, fontFamily:F.sans, outline:'none', background:'#fff', boxSizing:'border-box' },
  editImgGrid:      { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginTop:8 },
  editImgSlot:      { display:'flex', flexDirection:'column', alignItems:'center' },
  editImgX:         { position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 },
  editAmenityGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, maxHeight:195, overflowY:'auto', paddingRight:4 },
  // Session 58 fix — selected state was too heavy (solid blue border + solid
  // blueLight fill); per explicit feedback, both are now a barely-there
  // tint of C.blue (rgba at low alpha) rather than a flat token color.
  editAmenityItem:  (checked) => ({ display:'flex', alignItems:'center', gap:7, background: checked ? 'rgba(61,142,240,0.055)' : '#f8f9fb', border:`1px solid ${checked ? 'rgba(61,142,240,0.18)' : 'transparent'}`, borderRadius:6, padding:'7px 9px', fontSize:12, cursor:'pointer', color: checked ? C.blueDark : C.txtPrimary, fontFamily:F.sans }),
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

// ─── Design System v2 — presentation for the main page ───────────────────────
// Visual layer only. Data still comes from exactly the same calls as before:
//   GET  /landlord/property/<id>/                 (property, stats, units, ownerships, amenities, open_tickets)
//   GET  /landlord/account/services/              (owned services → Bulk Add Service)
//   GET  /properties/<id>/units/<uid>/services/   (per-unit services)
//   PATCH /properties/<id>/                       (Add images upload)
// The modals further up (Filter, Bulk Add Service, Edit Property, Unit Selection,
// Gallery lightbox) are unchanged.

// Tones for the static placeholder lists above (same order as the arrays)
const QA_TONES    = [TONES2.warning, TONES2.error, TONES2.primary, TONES2.success];
const DOC_TONES   = [TONES2.primary, TONES2.success, TONES2.warning, TONES2.neutral];
const NOTIF_TONES = { n1: TONES2.primary, n2: TONES2.success };
const UNIT_TAG_TONE = { PAID: TONES2.success, OVERDUE: TONES2.error, VACANT: TONES2.neutral };
const PRIORITY_TONE = p => (p === 'URGENT' || p === 'HIGH') ? TONES2.error : p === 'MEDIUM' ? TONES2.warning : TONES2.neutral;

// Rent Collection — placeholder figures (same numbers as before; flagged "Sample data" in the UI)
const RENT_MONTHS = ['JUN', 'JUL', 'AUG', 'SEP', 'OCT'];
const RENT_SAMPLE = [390, 395, 398, 428, 410];
const RENT_SUMMARY = [
  { icon: 'ti-stack-2',      lbl: 'Funding',      val: '$4,250' },
  { icon: 'ti-credit-card',  lbl: 'Expenses',     val: '$12,800' },
  { icon: 'ti-file-invoice', lbl: 'Vendor Bills', val: '$2,100' },
];
const LEDGER_ROWS = [...LEDGER_L, ...LEDGER_R];
const fmtMoney = v => '$' + Number(v).toLocaleString();
const fmtK     = v => '$' + (v / 1000) + 'K';

const HERO_AMENITIES = 4;   // amenities listed in the hero before "+N more"

const V = {
  healthBody:    { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: SP2.lg },
  healthMetrics: { ...UI2.stack(SP2.md), flex: `1 1 ${SZ2.thumbXl.w}px`, minWidth: 0, paddingLeft: SP2.lg, borderLeft: `${SZ2.hairline}px solid ${C2.border}` },
  unitActions:   { display: 'flex', flexWrap: 'wrap', gap: LAYOUT2.inlineGap },
  // Overview unit row: fixed-width cards side by side, scrolls sideways (snaps per card)
  // padding leaves room for the cards' SH2.card shadow + hover lift (overflow-x would clip it); bottom margin takes it back
  unitScroller:  { display: 'flex', alignItems: 'stretch', gap: LAYOUT2.gridGap, flex: 1, minWidth: 0, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', padding: pad(SP2.sm, SP2.sm, SP2.xl), scrollPaddingLeft: SP2.sm, marginBottom: -SP2.md },
  unitSlide:     { flex: `0 0 ${SZ2.unitCard}px`, maxWidth: '100%', scrollSnapAlign: 'start' },
  scrollArrow:   { ...UI2.btn.iconOutline(SZ2.control.sm), borderRadius: R2.round },
  fill:          { flex: 1 },
  snapshotEdit:  { ...UI2.btn.outline, ...UI2.btnSm },
  newChatBtn:    { ...UI2.btn.brand, width: 'fit-content', margin: pad(SP2.md, 'auto', 0), padding: pad(0, SP2.xl) },  // dark-blue brand button, centred
  disabled:      { opacity: OP2.muted, cursor: 'not-allowed' },
  chartWrap:     { position: 'relative', height: SZ2.chart },
  rentSummary:   { display: 'flex', flexWrap: 'wrap', gap: SP2.lg, marginTop: SP2.lg, paddingTop: SP2.lg, borderTop: `${SZ2.hairline}px solid ${C2.border}` },
  rentStat:      { ...UI2.row(LAYOUT2.rowGap), flex: '1 1 0', minWidth: 0 },
  score:         { fontWeight: FW2.bold, color: C2.successStrong },
  ticketNo:      { fontSize: FS2.xs, fontWeight: FW2.bold },
  commBody:      { marginTop: LAYOUT2.rowGap },
  thread:        { ...UI2.stack(SP2.sm), maxHeight: SZ2.threadMax, overflowY: 'auto', marginBottom: SP2.sm },
  sendBtn:       { width: SZ2.control.md, padding: 0, flexShrink: 0 },
  hidden:        { display: 'none' },
};


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
  const galThumbSlots = heroIsVideo
    ? [prop.main_image_url || null, prop.thumb1_url || null, prop.thumb2_url || null]
    : [prop.thumb1_url || null, prop.thumb2_url || null, prop.thumb3_url || null];
  const galHeroObj = heroIsVideo ? { file_url: heroVideoItem.file_url, file_type: 'VIDEO' }
    : (prop.main_image_url ? { file_url: prop.main_image_url, file_type: 'IMAGE' } : null);
  const galThumbObjs = galThumbSlots.map(u => (u ? { file_url: u, file_type: 'IMAGE' } : null));
  const galBaseItems = [...(galHeroObj ? [galHeroObj] : []), ...galThumbObjs.filter(Boolean)];
  const galLightboxItems = [...galBaseItems, ...galleryList.filter(g => g && g.file_url && !galBaseItems.some(b => b.file_url === g.file_url))];
  const galHasRealItems = galLightboxItems.length > 0;
  // Hero photo strip: the photos after the main one; the rest sit behind "+N"
  // Hero slider photos: main image first, then gallery photos (videos skipped, no duplicates)
  const heroSlides = [...new Set([prop.main_image_url || FB.main, ...galLightboxItems.filter(g => g.file_type !== 'VIDEO').map(g => g.file_url)])];
  const [galLightboxIdx, setGalLightboxIdx] = useState(null);
  const galOpenLightbox = (idx) => { if (galHasRealItems && idx != null) setGalLightboxIdx(idx); };

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

  // ── v2 view state (presentation only — no data changes) ──────────────────
  const [tab, setTab] = useState('overview');
  const [unitFilter, setUnitFilter] = useState('all');
  const unitRowRef = useRef(null);
  // Unit row scroll state: does it overflow, is it at the start / end (drives the ‹ › arrows)
  const [unitEdges, setUnitEdges] = useState({ overflow: false, start: true, end: true });
  const updateUnitEdges = React.useCallback(() => {
    const el = unitRowRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { overflow: max > SP2.xs, start: el.scrollLeft <= SP2.xs, end: el.scrollLeft >= max - SP2.xs };
    setUnitEdges(p => (p.overflow === next.overflow && p.start === next.start && p.end === next.end ? p : next));
  }, []);
  useEffect(() => {
    updateUnitEdges();
    window.addEventListener('resize', updateUnitEdges);
    return () => window.removeEventListener('resize', updateUnitEdges);
  }, [updateUnitEdges, units.length, tab]);

  const healthTone = healthScore >= 70 ? TONES2.success : healthScore >= 40 ? TONES2.warning : TONES2.error;
  const isVacant = u => unitPillCfg(u.status).label === 'VACANT';
  const vacantCount = units.filter(isVacant).length;
  const shownUnits = units.filter(u => unitFilter === 'all' || (unitFilter === 'vacant' ? isVacant(u) : !isVacant(u)));
  const goUnit = u => { window.location.href = `/landlord-portal/property/${propId}/unit/${u.id}`; };

  // ── Sections (each is reused by the Overview tab and its own tab) ──────────
  const ownershipCard = (
    <SectionCard icon="ti-users-group" title="Ownership Cluster">
      <div style={UI2.stack(LAYOUT2.rowGap)}>
        {primary.owner_name ? (
          <div style={UI2.row(SP2.md)}>
            <div style={UI2.avatar(SZ2.icon.lg, TONES2.primary)}>{initials(primary.owner_name)}</div>
            <div style={UI2.minWidth0}>
              <div style={UI2.text.caption}>Primary Owner</div>
              <div style={UI2.text.titleLg}>{primary.owner_name}</div>
              <div style={UI2.text.label}>Type: Full ({primary.share_pct}%)</div>
            </div>
          </div>
        ) : <div style={UI2.text.meta}>—</div>}
        <div style={UI2.divider} />
        <div>
          <div style={UI2.text.caption}>Co-Owners</div>
          {coOwners.length > 0
            ? coOwners.map((o, i) => <div key={i} style={UI2.text.body}>{o.owner_name} — {o.share_pct}%</div>)
            : <div style={UI2.text.body}>None registered</div>}
        </div>
        <div style={UI2.divider} />
        <div>
          <div style={UI2.text.caption}>Assigned Manager</div>
          <div style={UI2.text.body}>
            {prop.assigned_pm
              ? <><i className="ti ti-user-check" aria-hidden="true" /> {prop.assigned_pm}</>
              : 'None assigned'}
          </div>
        </div>
        <button type="button" className="un2-raise" style={{ ...UI2.btn.outline, width: '100%', marginTop: SP2.xs }}>
          View Ownership Ledger <i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </SectionCard>
  );

  const healthCard = (
    <SectionCard
      icon="ti-heart-rate-monitor" title="Property Health" decoration={<CardWave variant="single" height="22%" />}
      action={<span style={UI2.pill(healthTone)}>{healthCfg.label} <i className="ti ti-info-circle" aria-hidden="true" /></span>}
    >
      <div style={V.healthBody}>
        <Gauge value={healthScore} caption="Overall score" tone={TONES2.success} gradient={GSTOPS2.success} size={SZ2.donut} />
        <div style={V.healthMetrics}>
          <MetricBar label="Occupancy" value={`${occ}%`} pct={occ} tone={occ >= 80 ? TONES2.success : TONES2.warning} valueTone />
          <MetricBar label="Rent collection" value={`${stats.collection_pct ?? 0}%`} pct={stats.collection_pct ?? 0} tone={TONES2.warning} valueTone />
          <MetricBar label="Maintenance" value={stats.maint_open > 0 ? `${stats.maint_open} open` : 'Clear'}
            pct={maintScore} tone={maintScore > 50 ? TONES2.success : TONES2.error} valueTone gradient={maintScore > 50} />
          <MetricBar label="Lease renewals" value="0 due" pct={0} tone={TONES2.warning} />
        </div>
      </div>
    </SectionCard>
  );

  const quickActionsCard = (
    <SectionCard icon="ti-bolt" title="Quick Actions" action={<span style={UI2.pill(TONES2.warning)}>3 pending</span>}>
      {QA_ITEMS.map((q, i) => (
        <ListRow
          key={q.title}
          leading={<div style={UI2.iconBox(SZ2.icon.md, QA_TONES[i], { round: true })}><i className={`ti ${q.icon}`} aria-hidden="true" /></div>}
          title={q.title}
          meta={q.sub}
          trailing={<span style={UI2.text.caption}>{q.time}</span>}
        />
      ))}
    </SectionCard>
  );

  // Header actions shared by the Overview carousel and the Units tab
  const unitHeaderActions = (
    <div style={V.unitActions}>
      <button type="button" className="un2-raise" style={{ ...UI2.btn.outline, ...UI2.btnSm }} onClick={() => setShowFilter(true)}>
        <i className="ti ti-filter" style={UI2.btnIcon} aria-hidden="true" /> Filter
      </button>
      <button type="button" className="un2-raise" style={{ ...UI2.btn.outlineTone(TONES2.primary), ...UI2.btnSm }} onClick={() => setShowBulkAdd(true)}>
        <i className="ti ti-apps" style={UI2.btnIcon} aria-hidden="true" /> Add Service to All Units
      </button>
      {/* "List Ready" gate (LST-8): opens the Unit Selection modal, where readiness
          comes live from the A6 rules engine. Disabled until a unit exists. */}
      <button
        type="button" className="un2-raise"
        style={{ ...UI2.btn.outlineTone(TONES2.success), ...UI2.btnSm, ...(units.length < 1 ? V.disabled : {}) }}
        disabled={units.length < 1}
        title={units.length < 1 ? 'Add a unit first to list it on the marketplace' : 'Choose which units to list on the marketplace'}
        onClick={() => setShowUnitSelection(true)}
      >
        <i className="ti ti-layout-grid" style={UI2.btnIcon} aria-hidden="true" /> List Multi Units
      </button>
      <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnSm }}
        onClick={() => { window.location.href = `/landlord-portal/property/${propId}/add-unit`; }}>
        <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Add Unit
      </button>
    </div>
  );

  // Unit names often already start with the property name ("LL01 — Unit 101") — don't repeat it
  const unitLabel = u => (!prop.name || (u.unit_name || '').startsWith(prop.name)) ? u.unit_name : `${prop.name} — ${u.unit_name}`;

  // withActions: View Unit / Message buttons under the details (Overview row); otherwise the whole tile links to the unit
  const unitItem = (u, withActions) => {
    const pill = unitPillCfg(u.status);
    return (
      <MediaListItem
        key={u.id}
        image={u.main_image_url || FB.unit}
        fallbackIcon="ti-home"
        tag={{ tone: UNIT_TAG_TONE[pill.label] || TONES2.neutral, label: pill.label }}
        title={unitLabel(u)}
        subtitle={u.tenant_name ? `Tenant: ${u.tenant_name}` : 'Vacant'}
        details={[
          { label: 'Lease ends',  value: u.lease_end || '—' },
          { label: 'Maintenance', value: u.maint_open > 0 ? `${u.maint_open} open` : 'Clear',
            color: u.maint_open > 0 ? C2.errorDark : C2.successStrong },
        ]}
        onClick={withActions ? undefined : () => goUnit(u)}
        stacked={withActions}
        actions={withActions && (
          <>
            <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnSm, ...V.fill }} onClick={() => goUnit(u)}>View Unit</button>
            <button type="button" className="un2-raise" style={{ ...UI2.btn.outline, ...UI2.btnSm, ...V.fill }}
              onClick={() => { setActiveTab('Chats'); setShowNewChat(true); }}>Message</button>
          </>
        )}
      />
    );
  };

  // Overview: fixed-width unit cards side by side in one row that scrolls sideways.
  // Arrows scroll one card and grey out at either end (unitEdges, updated on scroll / resize).
  const scrollUnits = d => unitRowRef.current?.scrollBy({ left: d * (SZ2.unitCard + LAYOUT2.gridGap) });
  const unitsRowCard = (
    <SectionCard
      as="section" icon="ti-stack-2" title="Unit Inventory"
      badge={units.length > 0 && <span style={UI2.pill()}>{units.length}</span>}
      action={unitHeaderActions}
    >
      {units.length === 0 && !loading && <EmptyState icon="ti-door" text="No units added yet." />}
      {units.length > 0 && (
        <div style={UI2.row(LAYOUT2.inlineGap)}>
          {unitEdges.overflow && (
            <button type="button" className="un2-raise" style={{ ...V.scrollArrow, ...(unitEdges.start ? V.disabled : {}) }}
              disabled={unitEdges.start} onClick={() => scrollUnits(-1)} aria-label="Scroll units left">
              <i className="ti ti-chevron-left" aria-hidden="true" />
            </button>
          )}
          <div ref={unitRowRef} className="un2-scroll-hidden" style={V.unitScroller} onScroll={updateUnitEdges}>
            {units.map(u => <div key={u.id} style={V.unitSlide}>{unitItem(u, true)}</div>)}
          </div>
          {unitEdges.overflow && (
            <button type="button" className="un2-raise" style={{ ...V.scrollArrow, ...(unitEdges.end ? V.disabled : {}) }}
              disabled={unitEdges.end} onClick={() => scrollUnits(1)} aria-label="Scroll units right">
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );

  const unitsCard = () => (
    <SectionCard icon="ti-stack-2" title="Unit Inventory" action={unitHeaderActions}>
      <div style={{ ...UI2.row(LAYOUT2.inlineGap), flexWrap: 'wrap', marginBottom: LAYOUT2.cardHeaderGap }}>
        {[
          { id: 'all',      label: `All Units (${units.length})` },
          { id: 'vacant',   label: `Vacant (${vacantCount})` },
          { id: 'occupied', label: `Occupied (${units.length - vacantCount})` },
        ].map(f => (
          <button key={f.id} type="button" style={UI2.filterChip(unitFilter === f.id)} onClick={() => setUnitFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {units.length === 0 && !loading && <EmptyState icon="ti-door" text="No units added yet." />}
      {units.length > 0 && shownUnits.length === 0 && <div style={UI2.emptyInline}>No units match this filter.</div>}
      <Grid layout="two" as="div">{shownUnits.map(u => unitItem(u, false))}</Grid>
    </SectionCard>
  );

  const rentCard = (
    <SectionCard
      icon="ti-coins" title="Rent Collection"
      action={
        <div style={UI2.row(LAYOUT2.inlineGap)}>
          <span style={UI2.pill(TONES2.success)}>+5.2%</span>
          <span style={UI2.pill()} title="Placeholder figures until the rent API is connected">Sample data</span>
        </div>
      }
    >
      <div style={V.chartWrap}>
        <BarChart labels={RENT_MONTHS} values={RENT_SAMPLE} formatValue={fmtMoney} formatTick={fmtK} ariaLabel="Monthly rent collection (sample)" />
      </div>
      <div style={V.rentSummary}>
        {RENT_SUMMARY.map(r => (
          <div key={r.lbl} style={V.rentStat}>
            <div style={UI2.iconBox(SZ2.icon.sm, TONES2.primary)}><i className={`ti ${r.icon}`} aria-hidden="true" /></div>
            <div style={UI2.minWidth0}>
              <div style={UI2.text.caption}>{r.lbl}</div>
              <div style={{ ...UI2.text.stat, ...UI2.truncate }}>{r.val}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  const ledgerCard = (
    <SectionCard
      icon="ti-file-invoice" title="Recent Ledger Entries"
      action={
        <button type="button" style={UI2.btn.icon(SZ2.control.sm)} aria-label="Export full ledger" title="Export full ledger">
          <i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />
        </button>
      }
    >
      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: l => <span style={UI2.text.label}>{l.date}</span> },
          { key: 'cat',  label: 'Category', width: 1.2 },
          { key: 'who',  label: 'Tenant/Vendor', width: 1.4 },
          { key: 'amt',  label: 'Amount', align: 'right',
            render: l => <span style={{ fontWeight: FW2.semibold, color: l.pos ? C2.successStrong : C2.errorDark }}>{l.amt}</span> },
        ]}
        rows={LEDGER_ROWS}
        minWidth={SZ2.tableMinCompact}
      />
    </SectionCard>
  );

  const maintenanceCard = (
    <SectionCard icon="ti-tool" title="Maintenance Queue" centerBody={tickets.length === 0} action={<button type="button" className="un2-link" style={UI2.btn.link}>Create ticket</button>}>
      {tickets.length === 0 ? (
        <EmptyState icon="ti-clipboard-check" title="All clear!" text="No pending maintenance requests.">
          <div style={UI2.text.label}>Vendor score <span style={V.score}>4.8 <i className="ti ti-star-filled" aria-hidden="true" /></span></div>
        </EmptyState>
      ) : (
        <>
          {tickets.map(t => {
            const tone = PRIORITY_TONE(t.priority);
            return (
              <ListRow
                key={t.id}
                leading={<div style={{ ...UI2.iconBox(SZ2.icon.md, tone), ...V.ticketNo }}>#{t.id}</div>}
                title={t.title}
                meta={`${t.priority} · ${t.time_ago}`}
                trailing={<span style={UI2.pill(TONES2.neutral)}>{t.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}</span>}
              />
            );
          })}
          <div style={{ ...UI2.text.label, marginTop: SP2.sm }}>Vendor score <span style={V.score}>4.8 <i className="ti ti-star-filled" aria-hidden="true" /></span></div>
        </>
      )}
    </SectionCard>
  );

  const documentsCard = (
    <SectionCard
      icon="ti-folder" title="Document Vault"
      action={<button type="button" className="un2-link" style={UI2.btn.link}>Full archive <i className="ti ti-arrow-right" aria-hidden="true" /></button>}
    >
      {DOC_ITEMS.map((d, i) => (
        <ListRow
          key={d.name}
          leading={<div style={UI2.iconBox(SZ2.icon.md, DOC_TONES[i])}><i className={`ti ${d.icon}`} aria-hidden="true" /></div>}
          title={d.name}
          meta={d.meta}
          trailing={<i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />}
        />
      ))}
    </SectionCard>
  );

  const commsCard = (
    <SectionCard
      icon="ti-messages" title="Communications"
      action={<button type="button" className="un2-link" style={UI2.btn.link}>Open messenger <i className="ti ti-arrow-right" aria-hidden="true" /></button>}
    >
      <TabBar
        variant="underline" ariaLabel="Communications"
        tabs={[{ id: 'Chats', label: 'Chats' }, { id: 'Notifications', label: 'Notifications' }]}
        value={activeTab} onChange={setActiveTab}
      />

      {/* CHATS */}
      {activeTab === 'Chats' && (
        <div style={V.commBody}>
          {showNewChat && (
            <div style={{ ...UI2.inset, ...UI2.stack(LAYOUT2.rowGap), marginBottom: LAYOUT2.rowGap }}>
              <select style={UI2.select} aria-label="Recipient">
                <option value="">Select recipient…</option>
                <option>Property Manager</option>
                <option>Unit A1 Tenant</option>
                <option>Unit A2 Tenant</option>
              </select>
              <div style={UI2.row(LAYOUT2.inlineGap)}>
                <input type="text" placeholder="Type first message…" style={UI2.input} aria-label="First message" />
                <button type="button" className="un2-btn" style={UI2.btn.brand}>Send</button>
              </div>
            </div>
          )}
          {CHAT_THREADS.map(chat => (
            <div key={chat.id}>
              <ListRow
                variant="hover"
                onClick={() => toggleChat(chat.id)}
                leading={<div style={UI2.avatar(SZ2.icon.lg, TONES2.neutral)}>{chat.av}</div>}
                title={chat.name}
                meta={chat.preview}
                trailing={<span style={UI2.text.caption}>10:{chat.id === 'chat-em' ? '12' : '45'}</span>}
              />
              {openChatId === chat.id && (
                <div style={UI2.inset}>
                  <div style={V.thread}>
                    {chat.messages.map((m, i) => <div key={i} style={UI2.bubble(m.from === 'me')}>{m.text}</div>)}
                  </div>
                  <div style={UI2.row(LAYOUT2.inlineGap)}>
                    <input
                      type="text" placeholder="Reply…" style={UI2.input} aria-label="Reply"
                      value={replyText[chat.id] || ''}
                      onChange={e => setReplyText(p => ({ ...p, [chat.id]: e.target.value }))}
                    />
                    <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...V.sendBtn }} aria-label="Send">
                      <i className="ti ti-send" aria-hidden="true" />
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
        <div style={V.commBody}>
          {NOTIFICATIONS.map(n => (
            <div key={n.id}>
              <ListRow
                variant="hover"
                onClick={() => toggleNotif(n.id)}
                leading={<div style={UI2.iconBox(SZ2.icon.md, NOTIF_TONES[n.id] || TONES2.primary)}><i className={`ti ${n.icon}`} aria-hidden="true" /></div>}
                title={n.title}
                meta={n.preview}
                trailing={<span style={UI2.text.caption}>{n.time}</span>}
              />
              {openNotifId === n.id && (
                <div style={{ ...UI2.inset, ...UI2.stack(SP2.sm) }}>
                  {n.hasImage && (
                    <div style={{ ...UI2.tonePanel(TONES2.primary), ...UI2.center }}>
                      <i className="ti ti-calendar" style={{ fontSize: FS2.score, color: C2.primary }} aria-hidden="true" />
                    </div>
                  )}
                  <div style={UI2.text.titleLg}>{n.title}</div>
                  <div style={UI2.text.body}>{n.full}</div>
                  <button type="button" className="un2-link" style={UI2.btn.link}>Mark as read</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Chats' && (
        <button type="button" className="un2-btn" style={V.newChatBtn} onClick={() => setShowNewChat(p => !p)}>
          <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> New conversation
        </button>
      )}
    </SectionCard>
  );

  const residentsCard = (
    <SectionCard as="section" icon="ti-users" title="Resident Directory">
      <DataTable
        columns={[
          { key: 'tenant', label: 'Tenant Name', width: 2,
            render: (u, i) => (
              <div style={UI2.row(LAYOUT2.inlineGap)}>
                <div style={UI2.avatar(SZ2.icon.sm, AVATAR2[i % AVATAR2.length])}>{initials(u.tenant_name)}</div>
                <span style={{ ...UI2.text.title, ...UI2.truncate }}>{u.tenant_name}</span>
              </div>
            ) },
          { key: 'unit_name', label: 'Unit #' },
          { key: 'status', label: 'Lease Status',
            render: u => <span style={UI2.pill(u.rent_status === 'PAID' ? TONES2.success : TONES2.error)}>{u.rent_status === 'PAID' ? 'Active' : 'Overdue'}</span> },
          { key: 'lease_end', label: 'Lease End Date', width: 1.2, render: u => u.lease_end || '—' },
          { key: 'renewal', label: 'Renewal',
            render: u => <span style={{ color: u.maint_open > 0 ? C2.errorDark : C2.textMuted }}>{u.maint_open > 0 ? 'Active ticket' : '—'}</span> },
          { key: 'action', label: '', width: 0.5, align: 'right',
            render: u => (
              <button type="button" style={UI2.btn.icon(SZ2.control.sm)} aria-label={`Actions for ${u.tenant_name}`}>
                <i className="ti ti-dots" aria-hidden="true" />
              </button>
            ) },
        ]}
        rows={tenantUnits}
        rowKey={u => u.id}
        empty={<EmptyState illustration="people" text="No active tenants." />}
      />
    </SectionCard>
  );

  const TABS = [
    { id: 'overview',    label: 'Overview',    icon: 'ti-layout-grid' },
    { id: 'units',       label: 'Units',       icon: 'ti-stack-2' },
    { id: 'maintenance', label: 'Maintenance', icon: 'ti-tool' },
    { id: 'tenants',     label: 'Tenants',     icon: 'ti-users' },
    { id: 'documents',   label: 'Documents',   icon: 'ti-file-text' },
    { id: 'financials',  label: 'Financials',  icon: 'ti-chart-bar' },
  ];

  const extraAmenities = amenities.slice(HERO_AMENITIES);

  return (
    <>
      <PageShell
        activePage="properties"
        title="UrbanNest Landlord"
        avatarText={initials(primary.owner_name || 'L')}
        avatarLabel={`Profile: ${primary.owner_name || 'Landlord'}`}
      >
        {error && <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}

        <Breadcrumb items={[
          { label: 'Properties', href: '/landlord-portal/portfolio' },
          { label: loading ? '…' : prop.name },
        ]} />

        {/* ── HERO (photo slider) + PROPERTY SNAPSHOT ── */}
        <Grid layout="mainSide">
          <PropertyHero
            slides={heroSlides}
            title={loading
              ? <span className="un2-skel" style={UI2.skeleton(SZ2.skeletonTitle, SZ2.control.lg, { onDark: true })} />
              : prop.name}
            badge={prop.property_type ? (PROP_TYPE_LABEL[prop.property_type] || prop.property_type) : null}
            address={loading ? null : (prop.address || [prop.city, prop.country].filter(Boolean).join(', ') || null)}
            eyebrow={prop.name ? `The vision of ${prop.name}` : null}
            description={prop.description}
            features={[
              ...amenities.slice(0, HERO_AMENITIES).map(a => ({ icon: amenityStyle(a.name).icon, label: a.name })),
              ...(extraAmenities.length > 0
                ? [{ icon: 'ti-plus', label: `${extraAmenities.length} more`, title: extraAmenities.map(a => a.name).join(', ') }]
                : []),
            ]}
            topActions={[
              ...(galHasRealItems ? [{ icon: 'ti-photo', label: 'Open gallery', onClick: () => galOpenLightbox(0) }] : []),
              { icon: 'ti-camera-plus', label: uploadingImage ? 'Uploading…' : 'Add photo', busy: uploadingImage,
                onClick: () => { if (!uploadingImage) imageInputRef.current?.click(); } },
            ]}
          />
          <SectionCard
            icon="ti-building" title="Property Snapshot"
            action={!loading && prop.id && (
              <button type="button" className="un2-raise" style={V.snapshotEdit} onClick={() => setShowEditProperty(true)}>
                <i className="ti ti-pencil" style={UI2.btnIcon} aria-hidden="true" /> Edit
              </button>
            )}
          >
            <Grid layout="two" as="div">
              <StatTile icon="ti-box" label="Total Units" value={stats.total_units ?? '—'} />
              <StatTile icon="ti-clock" label="Collection" value={`${stats.collection_pct ?? 0}%`} />
              <StatTile icon="ti-users" label="Occupancy" value={`${occ}%`} />
              <StatTile icon="ti-check" label="Maintenance" labelFirst
                value={stats.maint_open > 0 ? `${stats.maint_open} Open` : 'Clear'}
                tone={stats.maint_open > 0 ? TONES2.warning : TONES2.success} />
            </Grid>
          </SectionCard>
        </Grid>
        <input
          ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={V.hidden}
          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddImageFile(f); }}
        />

        {imageUploadError && <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {imageUploadError}</div>}

        <TabBar tabs={TABS} value={tab} onChange={setTab} ariaLabel="Property sections" />

        {/* Overview: rows with the same main / side split as the hero row. Cards in one row
            stretch to the same height (e.g. Maintenance Queue = Unit Inventory). */}
        {tab === 'overview' && <>
          <Grid layout="mainSide">
            <Grid layout="wideRight" as="div">{ownershipCard}{healthCard}</Grid>
            {quickActionsCard}
          </Grid>
          <Grid layout="mainSide">{unitsRowCard}{maintenanceCard}</Grid>
          <Grid layout="mainSide">
            <Grid layout="two" as="div">{rentCard}{ledgerCard}</Grid>
            {commsCard}
          </Grid>
          <Grid layout="mainSide">{residentsCard}<div aria-hidden="true" /></Grid>
        </>}
        {tab === 'units'       && unitsCard()}
        {tab === 'maintenance' && maintenanceCard}
        {tab === 'tenants'     && residentsCard}
        {tab === 'documents'   && documentsCard}
        {tab === 'financials'  && <Grid layout="two">{rentCard}{ledgerCard}</Grid>}

        <PageFooter />
      </PageShell>

      {galLightboxIdx !== null && galHasRealItems && (
        <GalleryLightbox items={galLightboxItems} index={galLightboxIdx} onClose={() => setGalLightboxIdx(null)} onNav={setGalLightboxIdx} />
      )}
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
    </>
  );
}
