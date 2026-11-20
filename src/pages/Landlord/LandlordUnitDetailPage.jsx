import React, { useState, useRef } from 'react';
import {
  PageShell, Grid, SectionCard, Breadcrumb, ListRow, EmptyState, PageFooter,
  DataTable, TextLink, DetailHeader, PhotoBento, CardWave,
} from '../../components/v2';
import {
  C2, TONES2, ACCENT2, AVATAR2, accentTone, T2, FS2, SP2, SZ2, LAYOUT2, OP2, pad, UI2,
} from '../../constants/v2';
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

// Property type labels for the header line ("LL01 – Apartment Complex") — same map as LandlordPropertyDetailPage.jsx
const PROP_TYPE_LABEL = {
  APARTMENT_COMPLEX: 'Apartment Complex', INDIVIDUAL_HOUSE: 'Individual House',
  MULTI_FAMILY: 'Multi-Family', CONDOMINIUM: 'Condominium', TOWNHOME: 'Townhome',
  STUDENT_HOUSING: 'Student Housing', VILLA: 'Villa',
  SERVICED_APARTMENT: 'Serviced Apt', COMMERCIAL: 'Commercial', MIXED_USE: 'Mixed Use',
};

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

// Icon colours: QA_TONES / DOC_TONES in the Design System v2 section below (same order)
const QA_ITEMS = [
  { icon: 'ti-message',      title: 'Message tenant',         sub: 'Start a new conversation' },
  { icon: 'ti-file-text',    title: 'Initiate lease renewal', sub: 'Send renewal offer' },
  { icon: 'ti-tool',         title: 'Add maintenance ticket', sub: 'Log a new issue' },
  { icon: 'ti-file-upload',  title: 'Request document',       sub: 'Ask tenant to upload' },
];

const DOC_ITEMS = [
  { icon: 'ti-file-text',       name: 'Lease agreement',              meta: 'PDF · 2.4 MB · Signed' },
  { icon: 'ti-clipboard-check', name: 'Move-in inspection report',    meta: 'PDF · 15.8 MB · Verified' },
  { icon: 'ti-shield-check',    name: 'Tenant insurance certificate', meta: 'PDF · 0.8 MB · Valid' },
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

// Styles for the modals below (Add Service, Edit Unit, Detail pop-up). The modals are unchanged by the
// v2 redesign — the page itself is built from v2 components/tokens (see "Design System v2" further down).
const S = {
  errBanner:{ background: C.redLight, color: C.red, padding: '10px 28px', fontSize: 13 },

  // ADD SERVICE MODAL
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,27,46,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 20px', zIndex: 1000, fontFamily: F.sans },
  modal:        { background: C.cardBg, borderRadius: 12, width: 460, maxWidth: '100%', boxShadow: '0 24px 50px rgba(0,0,0,0.3)', overflow: 'hidden', color: C.txtPrimary },
  modalHdr:     { padding: '18px 22px 4px' },
  modalHdrTitle:{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 },
  modalHdrSub:  { margin: 0, fontSize: 12.5, color: C.txtMuted },
  modalBody:    { padding: '8px 22px 4px', maxHeight: 380, overflowY: 'auto' },
  pickRow:      { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: `1px solid ${C.cardBdr}` },
  pickIcon:     { width: 26, height: 26, borderRadius: 6, background: '#e8f5f0', color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 },
  pickIconBank: { background: ACCENT2.violet.soft, color: ACCENT2.violet.fg },   // bank-linked marker — violet, same as the page's bank dot (no yellow)
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

  // EDIT UNIT MODAL
  editFormGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px' },
  editLabel:        { fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 },
  editInput:        { width: '100%', height: 36, border: `1px solid ${C.cardBdr}`, borderRadius: 6, padding: '0 10px', fontSize: 12.5, color: C.txtPrimary, fontFamily: F.sans, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  editSelect:       { width: '100%', height: 36, border: `1px solid ${C.cardBdr}`, borderRadius: 6, padding: '0 10px', fontSize: 12.5, color: C.txtPrimary, fontFamily: F.sans, outline: 'none', background: '#fff', boxSizing: 'border-box', cursor: 'pointer' },
  editCheckRow:     { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: C.txtPrimary, height: 36 },
  editSecLbl:       { fontSize: 9.5, color: C.txtMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  editAmenityGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, maxHeight: 175, overflowY: 'auto', paddingRight: 4 },
  editAmenityItem:  (checked) => ({ display: 'flex', alignItems: 'center', gap: 7, background: checked ? 'rgba(61,142,240,0.055)' : '#f8f9fb', border: `1px solid ${checked ? 'rgba(61,142,240,0.18)' : 'transparent'}`, borderRadius: 6, padding: '7px 9px', fontSize: 12, cursor: 'pointer', color: checked ? C.blueDark : C.txtPrimary, fontFamily: F.sans }),
  editGalGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 8 },
  editGalItem:      { position: 'relative', borderRadius: 8, overflow: 'hidden', height: 80, background: C.pageBg },
  editGalX:         { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  editFpSlot:       { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  editFpX:          { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },

  // DETAIL MODAL (owner / tenant / ancillary-services pop-ups opened from an eye icon)
  detailRow:  (last) => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${C.cardBdr}` }),
  detailLbl:  { fontSize: 11.5, color: C.txtMuted, fontWeight: 500 },
  detailVal:  { fontSize: 12.5, color: C.txtPrimary, fontWeight: 600, textAlign: 'right' },
  detailListRow: (last) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${C.cardBdr}` }),
};

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

// ─── Design System v2 — presentation for the main page ───────────────────────
// Visual layer only. Data still comes from exactly the same calls as before:
//   GET    /landlord/property/<id>/unit/<uid>/          (property, unit, stats, amenities, tenant, owners…)
//   GET    /auth/me/                                    (avatar)
//   GET    /landlord/account/services/                  (owned services → Add Service)
//   GET    /properties/<id>/units/<uid>/services/       (assigned services)
//   POST   /properties/<id>/units/<uid>/services/       (Add Service)
//   POST   /properties/<id>/units/<uid>/gallery/        (Add photo / video)
//   PATCH  /properties/<id>/units/<uid>/                (floor plan slot upload / remove)
// The modals above (Add Service, Edit Unit, Detail pop-up, Gallery lightbox) are unchanged.
//
// Layout (design: Downloads/image 25.png) — one page, no tabs:
//   Breadcrumb · DetailHeader (Unit N · Vacant pill · "LL01 – Apartment Complex" │ Edit · Listing · Share · Download)
//   PhotoBento stacked (main photo ‹ › · 2 tiles · Add) │ facts panel (4 stat tiles + Unit Status card)
//     — top portion per Screenshot 2026-11-20 172429.png
//   Unit & Lease Overview │ Floor Plan
//   Special Features │ Unit Services
//   Maintenance Queue │ Financial Command
//   Quick Actions │ Document Vault
//   Tenant │ Owner

// Tones (ACCENT2 / TONES2 only — no yellow) for the static lists above, same order as the arrays
const QA_TONES      = [accentTone(ACCENT2.blue), accentTone(ACCENT2.teal), accentTone(ACCENT2.rose), TONES2.neutral];
const DOC_TONES     = [accentTone(ACCENT2.rose), accentTone(ACCENT2.teal), accentTone(ACCENT2.violet)];
// Fact tiles: round accent icon boxes (same treatment as StatGroup / Dashboard rent rows)
const FACT_TONES    = [ACCENT2.blue, ACCENT2.teal, ACCENT2.violet, ACCENT2.rose].map(accentTone);
const CHIP_TONES    = [ACCENT2.blue, ACCENT2.teal, ACCENT2.violet, ACCENT2.rose].map(accentTone);
const chipTone      = i => CHIP_TONES[i % CHIP_TONES.length];
const PRIORITY_CFG  = p => ((p === 'URGENT' || p === 'HIGH') ? { tone: TONES2.error, label: 'Critical' }
  : p === 'MEDIUM' ? { tone: TONES2.purple, label: 'Medium' } : { tone: TONES2.neutral, label: 'Low' });
const RATING_MAX    = 5;

// Page-specific layout only — shared patterns come from UI2 and the v2 components.
const V = {
  headActions: { ...UI2.row(LAYOUT2.inlineGap), flexWrap: 'wrap', justifyContent: 'flex-end' },
  statusPill:  (tone) => ({ ...UI2.pill(tone), flexShrink: 0 }),
  disabled:    { opacity: OP2.muted, cursor: 'not-allowed' },
  hidden:      { display: 'none' },
  // Facts panel beside the gallery: 4 stat tiles on top, the Unit Status card fills the rest
  facts:       { ...UI2.stack(LAYOUT2.gridGap), minWidth: 0 },
  factTiles:   { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: LAYOUT2.gridGap },
  factTile:    { ...UI2.card, ...UI2.stack(SP2.sm), alignItems: 'center', padding: pad(SP2.lg, SP2.sm), minWidth: 0, textAlign: 'center' },
  factVal:     { ...T2.statInline, whiteSpace: 'nowrap' },   // small stat value — Inter 500 16 (same as Dashboard rent rows / StatGroup)
  statusCard:  { ...UI2.card, ...UI2.stack(SP2.lg), flex: 1, justifyContent: 'center' },
  statusHead:  { ...UI2.row(SP2.md), flexWrap: 'wrap', paddingBottom: SP2.lg, borderBottom: `${SZ2.hairline}px solid ${C2.borderLight}` },
  statusGrid:  { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: SP2.xl, rowGap: SP2.lg },
  factLbl:     { ...T2.label },
  factText:    { ...T2.statInline, marginTop: SP2.xxs, ...UI2.truncate },
  // Unit & Lease Overview — label ……… value rows in two divided columns
  kvRow:       (first) => ({ ...UI2.legendRow, padding: pad(SP2.md, 0), ...(first ? {} : { borderTop: `${SZ2.hairline}px solid ${C2.borderLight}` }) }),
  kvVal:       { ...UI2.legendVal, ...UI2.row(SP2.sm), justifyContent: 'flex-end', textAlign: 'right', minWidth: 0 },
  eyeBtn:      (on) => ({ ...UI2.btn.icon(SZ2.icon.sm), fontSize: FS2.md, color: on ? C2.primary : C2.textSubtle, background: on ? C2.primarySoft : C2.surfaceMuted, ...(on ? {} : { cursor: 'not-allowed' }) }),
  // Floor plan: main sheet + 3 page tiles (photo tiles / dashed add tiles — same look as PhotoBento)
  fpMain:      { ...UI2.photoTile, height: SZ2.chart },
  fpPages:     { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: LAYOUT2.gridGap, marginTop: LAYOUT2.gridGap },
  fpPage:      { ...UI2.photoTile, height: SZ2.thumb.h },
  fpImg:       (busy) => ({ ...UI2.photoMedia, cursor: busy ? 'progress' : 'pointer' }),
  fpLabel:     { ...UI2.chipOnDark, position: 'absolute', left: SP2.md, bottom: SP2.md },   // same spot as PhotoBento's badge
  // Features / services chips
  chips:       { display: 'flex', flexWrap: 'wrap', gap: SP2.sm, paddingTop: SP2.xs },
  bankDot:     UI2.dot(ACCENT2.violet.fg),
  legend:      { ...UI2.context, marginTop: SP2.md },
  // Tables / footers
  centerFoot:  { ...UI2.cardFoot, justifyContent: 'center' },
  segment:     { ...UI2.row(SP2.xs) },
  stars:       { ...UI2.row(SP2.xxs), color: C2.primary },
  starOff:     { color: C2.textSubtle },
  ownerName:   { ...UI2.row(SP2.xs), minWidth: 0 },
  primaryStar: { color: C2.primary, fontSize: FS2.sm },
};

const Stars = ({ value }) => (value > 0 ? (
  <span style={V.stars} aria-label={`${value} of ${RATING_MAX}`}>
    {Array.from({ length: RATING_MAX }, (_, i) => (
      <i key={i} className={`ti ${i < value ? 'ti-star-filled' : 'ti-star'}`} style={i < value ? undefined : V.starOff} aria-hidden="true" />
    ))}
  </span>
) : '—');

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

  // Unit Services (SVC-1, Session 40) — real data. ownedServices is this
  // landlord's account-level entitlement (GET /landlord/account/services/);
  // assignedServices is what's actually on THIS unit (GET
  // /properties/<pk>/units/<uid>/services/).
  const [ownedServices, setOwnedServices] = useState([]);
  const [assignedServices, setAssignedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);

  const pathParts = window.location.pathname.split('/');
  const propId = pathParts[pathParts.indexOf('property') + 1];
  const unitId = pathParts[pathParts.indexOf('unit') + 1];

  // Session 56 — re-runnable so uploads can refresh gallery_images / floor plan fields.
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

  // Session 56 — real gallery / floor-plan uploads (POST …/gallery/, multipart PATCH …/units/<uid>/).
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState(null);
  const galleryInputRef = useRef(null);

  // Session 59 — immediate-effect upload / remove for all 4 floor plan slots.
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

  // Avatar must reflect the logged-in landlord — fetched from /auth/me/.
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setCurrentUser(j.user || j))  // handle either { user: {...} } or flat shape
      .catch(() => {});
  }, []);

  // Session 40 (SVC-1) — this landlord's account-level entitlement.
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/account/services/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setOwnedServices(j.services || []))
      .catch(() => setOwnedServices([]));
  }, []);

  // Session 40 (SVC-1) — this unit's assigned services; re-run after a successful Add Service.
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

  // Session 53 — structured gallery_images (photo / video); falls back to gallery_urls, then sample photos.
  const hasRealGallery = !!unit.gallery_images?.length;
  const galleryItems = hasRealGallery
    ? unit.gallery_images
    : (unit.gallery_urls?.length
        ? unit.gallery_urls.map(u => ({ file_url: u, file_type: 'IMAGE' }))
        : FB_GALLERY.map(u => ({ file_url: u, file_type: 'IMAGE' })));
  const heroVideoIdx = galleryItems.findIndex(g => g.file_type === 'VIDEO');

  // Main photo = the video if one exists, else the first item; the ‹ › arrows step through the
  // gallery (heroIdx). The 2 side tiles show the items that follow it (PhotoBento stacked).
  const [heroIdx, setHeroIdx] = useState(0);
  const galCount = galleryItems.length;
  const mediaHeroIdx = galCount ? ((heroIdx % galCount) + galCount) % galCount : 0;
  const mediaHeroItem = galleryItems[mediaHeroIdx];
  const mediaThumbItems = galCount > 1
    ? [1, 2].filter(n => n < galCount).map(n => {
        const i = (mediaHeroIdx + n) % galCount;
        return { ...galleryItems[i], _idx: i };
      })
    : [];
  const stepHero = d => setHeroIdx(i => i + d);

  // Leads with the video (if any) the first time this unit's data loads.
  React.useEffect(() => {
    if (heroVideoIdx !== -1) { setPhotoIdx(heroVideoIdx); setHeroIdx(heroVideoIdx); }
  }, [unit.id, heroVideoIdx]);

  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const openLightbox = i => { setPhotoIdx(i); setGalleryLightboxOpen(true); };

  // lease_type is stored as the dropdown's raw value ('fixed' / 'month' — see EDIT_LEASE_TYPE_OPTIONS)
  const LEASE_TYPE_LABELS = { fixed: 'Fixed-Term', month: 'Month-to-Month' };
  const bedCount = unit.total_rooms ?? null;

  // Session 60 — Unit & Lease Overview fields
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
  const leaseStatusTone  = tenant.name ? TONES2.primary : TONES2.success;

  // Header: "Unit 101" (unit numbers that already say "Unit …" aren't doubled) · Vacant / Occupied pill ·
  // "LL01 – Apartment Complex"
  const unitNo = unit.unit_number || '';
  const unitTitle = /^unit\b/i.test(unitNo) ? unitNo : `Unit ${unitNo || '—'}`;
  const plural = (n, word) => `${n} ${word}${Number(n) === 1 ? '' : 's'}`;
  const occupied = !!tenant.name;
  const propTypeLabel = prop.property_type
    ? (PROP_TYPE_LABEL[prop.property_type] || String(prop.property_type).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))
    : null;
  const headerMeta = [prop.name, propTypeLabel].filter(Boolean).join(' – ');

  // Facts panel beside the gallery: 4 stat tiles + Unit Status card
  const areaValue = unit.total_area || unit.carpet_area;
  const factTiles = [
    { icon: 'ti-bed',           val: bedCount != null ? plural(bedCount, 'Bed') : '—' },
    { icon: 'ti-bath',          val: unit.total_baths != null ? plural(unit.total_baths, 'Bath') : '—' },
    { icon: 'ti-ruler-measure', val: areaValue ? `${Number(areaValue).toLocaleString()} sq ft` : '—' },
    { icon: 'ti-stack-2',       val: floorLabel },
  ];
  const statusFacts = [
    { lbl: 'Configuration',    val: bedCount != null ? plural(bedCount, 'Bedroom') : '—' },
    { lbl: 'Lease Agreement',  val: LEASE_TYPE_LABELS[unit.lease_type] || unit.lease_type || '—' },
    { lbl: 'Rent / Mo',        val: unit.rent_amount ? `$${Number(unit.rent_amount).toLocaleString()}` : '—' },
    { lbl: 'Security Deposit', val: unit.security_deposit ? `$${Number(unit.security_deposit).toLocaleString()}` : '—' },
  ];

  // Session 40 (SVC-1) — real data, shaped for the display / modal.
  const unitServices = assignedServices.map(row => ({
    id: row.service,
    name: row.service_name,
    icon: SERVICE_FALLBACK_ICON,
    requiresBankAccount: row.requires_payment_collection,
  }));
  // Session 60 — Unit Services falls back to 5 generic sample services until one is assigned.
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

  // Session 40 (SVC-1) — one real POST per checked service; all-settled, not all-or-nothing.
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

  // ── Header actions ────────────────────────────────────────────────────────
  // Session 41/44 — "List on Marketplace" opens the Create Listing wizard; disabled + relabelled
  // when the backend reports unit.active_listing (DRAFT / PENDING_PAYMENT / ACTIVE).
  const listing = unit.active_listing;
  const listingLabel = listing ? (listing.status === 'ACTIVE' ? 'Listed' : 'Listing in Progress') : 'List on Marketplace';
  const listingTitle = listing
    ? (listing.status === 'ACTIVE' ? 'This unit is already listed on the Marketplace.' : 'A listing is already in progress for this unit.')
    : undefined;
  const headerActions = (
    <div style={V.headActions}>
      {!loading && unit.id && (
        <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={() => setShowEditUnit(true)}>
          <i className="ti ti-pencil" style={UI2.btnIcon} aria-hidden="true" /> Edit
        </button>
      )}
      <button
        type="button" className="un2-btn"
        style={{ ...UI2.btn.soft, ...(listing ? V.disabled : {}) }}
        disabled={!!listing}
        title={listingTitle}
        onClick={() => {
          if (listing) return;
          window.location.href = `/landlord-portal/property/${propId}/unit/${unitId}/list/step-1`;
        }}
      >
        <i className="ti ti-building-store" style={UI2.btnIcon} aria-hidden="true" /> {listingLabel}
      </button>
      <button type="button" className="un2-btn" style={UI2.btn.soft}>
        <i className="ti ti-share" style={UI2.btnIcon} aria-hidden="true" /> Share Detail
      </button>
      <button type="button" className="un2-btn" style={UI2.btn.brand}>
        <i className="ti ti-download" style={UI2.btnIcon} aria-hidden="true" /> Download Report
      </button>
    </div>
  );

  // ── Facts panel (beside the gallery): 4 stat tiles + Unit Status card ────────
  const factsPanel = (
    <div style={V.facts}>
      <div style={V.factTiles}>
        {factTiles.map((f, i) => (
          <div key={f.icon} style={V.factTile}>
            <div style={UI2.iconBox(SZ2.icon.lg, FACT_TONES[i], { round: true })}><i className={`ti ${f.icon}`} aria-hidden="true" /></div>
            <span style={V.factVal}>{loading ? '—' : f.val}</span>
          </div>
        ))}
      </div>
      <div style={V.statusCard}>
        <div style={V.statusHead}>
          <span style={UI2.cardTitle}>Unit Status</span>
          {!loading && (
            <span style={V.statusPill(leaseStatusTone)}><span style={UI2.statusDot(leaseStatusTone)} />{leaseStatusLabel}</span>
          )}
        </div>
        <div style={V.statusGrid}>
          {statusFacts.map(f => (
            <div key={f.lbl} style={UI2.minWidth0}>
              <div style={V.factLbl}>{f.lbl}</div>
              <div style={V.factText}>{loading ? '—' : f.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Unit & Lease Overview ─────────────────────────────────────────────────
  const kvRows = (rows) => rows.map((r, i) => (
    <div key={r.lbl} style={V.kvRow(i === 0)}>
      <span>{r.lbl}</span>
      <span style={V.kvVal}>{r.val}</span>
    </div>
  ));
  const overviewCard = (
    <SectionCard
      style={UI2.cardFill} icon="ti-stack-2" title="Unit & Lease Overview"
      subtitle={unit.description || (loading ? '…' : 'No description added for this unit yet.')}
      decoration={<CardWave variant="single" height="35%" />}
    >
      <div className="un2-cols" style={{ '--un2-cols': 2 }}>
        <div>
          {kvRows([
            { lbl: 'Property / Unit',     val: unitPropLabel },
            { lbl: 'Floor Placement',     val: floorLabel },
            { lbl: 'Total / Carpet Area', val: areaLabel },
          ])}
        </div>
        <div>
          {kvRows([
            { lbl: 'Contractual Model', val: `${leaseWord} / ${stats.lease_term || '—'}` },
            { lbl: 'Ancillary Services', val: (
              <>
                <span style={{ color: ancillaryActive ? C2.successStrong : C2.textMuted }}>{ancillaryActive ? 'Active' : 'Inactive'}</span>
                <button
                  type="button" style={V.eyeBtn(ancillaryActive)} disabled={!ancillaryActive}
                  onClick={() => ancillaryActive && setDetailModal({ type: 'ancillary' })}
                  aria-label="View ancillary services"
                >
                  <i className="ti ti-eye" aria-hidden="true" />
                </button>
              </>
            ) },
            { lbl: 'Lease Status', val: (
              <><span style={UI2.statusDot(leaseStatusTone)} />{leaseStatusLabel}</>
            ) },
          ])}
        </div>
      </div>
    </SectionCard>
  );

  // ── Floor Plan: main sheet + pages 2–4 (click a sheet to replace it, × to remove) ──
  const fpSlot = (slot, tileStyle, main = false) => {
    const url = unit[slot.key];
    const busy = uploadingFpSlot === slot.key;
    const pick = () => { if (!busy) fpMainInputRefs.current[slot.key]?.click(); };
    return (
      <div key={slot.key} className={url ? 'un2-zoom' : undefined} style={tileStyle}>
        {url ? (
          <>
            <img src={url} alt={slot.label} style={V.fpImg(busy)} onClick={pick} />
            {main && <span style={V.fpLabel}>Floor Plan</span>}
            <button
              type="button" style={UI2.photoRemove} disabled={busy}
              onClick={e => { e.stopPropagation(); if (!busy) handleClearFloorPlanSlot(slot.key); }}
              aria-label={`Remove ${slot.label}`}
            >
              <i className={`ti ${busy ? 'ti-loader-2' : 'ti-x'}`} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className="un2-raise" style={UI2.addTile(busy)} onClick={pick} aria-busy={busy || undefined}>
            <i className={`ti ${busy ? 'ti-loader-2' : 'ti-plus'}`} style={UI2.addTileIcon} aria-hidden="true" />
            {busy ? 'Uploading…' : `Add ${slot.label.toLowerCase() === 'floor plan' ? 'floor plan' : slot.label}`}
          </button>
        )}
        <input
          ref={el => { fpMainInputRefs.current[slot.key] = el; }}
          type="file" accept="image/jpeg,image/png" style={V.hidden}
          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddFloorPlanSlot(slot.key, f); }}
        />
      </div>
    );
  };
  const floorPlanCard = (
    <SectionCard
      style={UI2.cardFill} icon="ti-layout-board-split" title="Floor Plan"
      action={unit.floor_plan_url && (
        <button type="button" style={UI2.btn.icon(SZ2.control.sm)} onClick={() => window.open(unit.floor_plan_url, '_blank', 'noopener')}
          title="Open floor plan" aria-label="Open floor plan">
          <i className="ti ti-arrows-diagonal" aria-hidden="true" />
        </button>
      )}
    >
      {fpSlot(FP_MAIN_SLOTS[0], V.fpMain, true)}
      <div style={V.fpPages}>{FP_MAIN_SLOTS.slice(1).map(s => fpSlot(s, V.fpPage))}</div>
    </SectionCard>
  );

  // ── Special Features │ Unit Services ──────────────────────────────────────
  const featuresCard = (
    <SectionCard style={UI2.cardFill} icon="ti-star" title="Special Features">
      {amenities.length === 0 ? (
        <div style={UI2.emptyInline}>{loading ? '…' : 'No amenities configured.'}</div>
      ) : (
        <div style={V.chips}>
          {amenities.map((a, i) => (
            <span key={a.id} style={UI2.featureChip(TONES2.neutral)}>
              <i className={`ti ${amenityIcon(a.name)}`} style={{ color: chipTone(i).strong }} aria-hidden="true" /> {a.name}
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );

  const servicesCard = (
    <SectionCard
      style={UI2.cardFill} icon="ti-stack-2" title="Unit Services"
      badge={showingSampleServices && <span style={UI2.pill()}>Sample</span>}
      action={<TextLink arrow={false} onClick={() => setAddServiceOpen(true)}><i className="ti ti-plus" aria-hidden="true" /> Add Service</TextLink>}
    >
      {servicesLoading ? (
        <div style={UI2.emptyInline}>Loading services…</div>
      ) : (
        <div style={V.chips}>
          {servicesToShow.map((s, i) => (
            <span key={s.id} style={UI2.featureChip(chipTone(i))} title={s.name}>
              <i className={`ti ${s.icon}`} aria-hidden="true" /> {s.name}
              {s.requiresBankAccount && <span style={V.bankDot} />}
            </span>
          ))}
        </div>
      )}
      {!showingSampleServices && unitServices.some(s => s.requiresBankAccount) && (
        <div style={V.legend}><span style={V.bankDot} /> = requires a linked bank account</div>
      )}
    </SectionCard>
  );

  // ── Maintenance Queue │ Financial Command ────────────────────────────────
  const maintenanceCard = (
    <SectionCard
      style={UI2.cardFill} centerBody={maintenance.length === 0} icon="ti-tool" title="Maintenance Queue"
      action={<TextLink arrow={false}><i className="ti ti-plus" aria-hidden="true" /> Add ticket</TextLink>}
    >
      {maintenance.length === 0 ? (
        <EmptyState icon="ti-clipboard-check" text="No open tickets." />
      ) : maintenance.map(t => {
        const p = PRIORITY_CFG(t.priority);
        return (
          <ListRow
            key={t.id}
            leading={<div style={UI2.iconBox(SZ2.icon.md, p.tone)}><i className="ti ti-tool" aria-hidden="true" /></div>}
            title={t.title}
            meta={t.time_ago}
            trailing={<span style={UI2.pill(p.tone)}>{p.label}</span>}
          />
        );
      })}
    </SectionCard>
  );

  const financialCard = (
    <SectionCard
      style={UI2.cardFill} icon="ti-database" title="Financial Command"
      action={<span style={UI2.pill()} title="Placeholder figures until the ledger API is connected">Passive mode</span>}
    >
      <DataTable
        columns={[
          { key: 'month',  label: 'Month',  type: 'primary', width: 1.3 },
          { key: 'amount', label: 'Amount', type: 'amount', fit: true },
          { key: 'payout', label: 'Payout', type: 'amount', fit: true },
          { key: 'status', label: 'Status', type: 'status', fit: true,
            render: r => <span style={UI2.statusPill(TONES2.success)}><span style={UI2.statusDot(TONES2.success)} />{r.status}</span> },
        ]}
        rows={LEDGER_ROWS}
        rowKey={r => r.month}
        minWidth={SZ2.tableMinCompact}
      />
      <div style={V.centerFoot}><TextLink>View full ledger</TextLink></div>
    </SectionCard>
  );

  // ── Quick Actions │ Document Vault ────────────────────────────────────────
  const quickActionsCard = (
    <SectionCard style={UI2.cardFill} icon="ti-bolt" title="Quick Actions">
      {QA_ITEMS.map((q, i) => (
        <ListRow
          key={q.title}
          variant="hover"
          leading={<div style={UI2.iconBox(SZ2.icon.md, QA_TONES[i])}><i className={`ti ${q.icon}`} aria-hidden="true" /></div>}
          title={q.title}
          meta={q.sub}
          trailing={<i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />}
        />
      ))}
    </SectionCard>
  );

  const documentsCard = (
    <SectionCard style={UI2.cardFill} icon="ti-folder" title="Document Vault" action={<TextLink>Full archive</TextLink>}>
      {DOC_ITEMS.map((d, i) => (
        <ListRow
          key={d.name}
          variant="hover"
          leading={<div style={UI2.iconBox(SZ2.icon.md, DOC_TONES[i])}><i className={`ti ${d.icon}`} aria-hidden="true" /></div>}
          title={d.name}
          meta={d.meta}
          trailing={<i className="ti ti-download" style={UI2.chevron} aria-hidden="true" />}
        />
      ))}
    </SectionCard>
  );

  // ── Tenant │ Owner — Current / Past segment, table rows with an eye → detail pop-up ──
  const segment = (value, onChange, pastCount) => (
    <div style={V.segment} role="tablist">
      {[{ id: 'current', label: 'Current' }, { id: 'past', label: `Past${pastCount > 0 ? ` (${pastCount})` : ''}` }].map(t => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} style={UI2.filterChip(value === t.id)} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
  const eyeCell = (label, onClick) => (
    <button type="button" style={V.eyeBtn(true)} onClick={onClick} aria-label={label}>
      <i className="ti ti-eye" aria-hidden="true" />
    </button>
  );

  const tenantRows = tenantTab === 'current' ? (tenant.name ? [tenant] : []) : pastTenants;
  const tenantCard = (
    <SectionCard
      style={UI2.cardFill} centerBody={tenantRows.length === 0} icon="ti-users" title="Tenant"
      action={segment(tenantTab, setTenantTab, pastTenants.length)}
    >
      {tenantRows.length === 0 ? (
        <EmptyState illustration="people" text={tenantTab === 'current' ? 'No tenant assigned to this unit.' : 'No past tenant records for this unit yet.'} />
      ) : (
      <DataTable
        columns={[
          { key: 'name', label: 'Tenant', type: 'primary', width: 1.5,
            render: (t, i) => (
              <div style={UI2.row(LAYOUT2.inlineGap)}>
                <div style={UI2.avatar(SZ2.icon.sm, AVATAR2[i % AVATAR2.length])}>{initials(t.name)}</div>
                <span style={UI2.truncate}>{t.name || 'Unknown tenant'}</span>
              </div>
            ) },
          { key: 'email', label: 'Contact', type: 'secondary', width: 1.5, optional: true, render: t => t.email || '—' },
          { key: 'move_in_date', label: 'Move-in', type: 'secondary', fit: true, render: t => t.move_in_date || '—' },
          { key: 'rating', label: 'Rating', type: 'status', fit: true, render: t => <Stars value={t.payment_rating} /> },
          { key: 'view', label: '', align: 'right', fit: true,
            render: t => eyeCell(`View ${t.name || 'tenant'} details`, () => setDetailModal({ type: 'tenant', row: { ...t, _past: tenantTab === 'past' } })) },
        ]}
        rows={tenantRows}
        rowKey={(t, i) => t.id || i}
      />
      )}
    </SectionCard>
  );

  const ownerRows = ownerTab === 'current' ? ownerships : pastOwnerships;
  const ownerCard = (
    <SectionCard
      style={UI2.cardFill} centerBody={ownerRows.length === 0} icon="ti-user" title="Owner"
      action={segment(ownerTab, setOwnerTab, pastOwnerships.length)}
    >
      {ownerRows.length === 0 ? (
        <EmptyState icon="ti-user-off" text={ownerTab === 'current' ? 'No current owner records for this unit.' : 'No past owner records for this unit yet.'} />
      ) : (
      <DataTable
        columns={[
          { key: 'owner_id', label: 'Owner ID', type: 'status', fit: true, render: o => <span style={UI2.tag(TONES2.neutral)}>{o.owner_id}</span> },
          { key: 'owner_name', label: 'Owner name', type: 'primary', width: 1.5,
            render: o => (
              <span style={V.ownerName}>
                <span style={UI2.truncate}>{o.owner_name}</span>
                {o.is_primary && <i className="ti ti-star-filled" style={V.primaryStar} title="Primary owner" aria-label="Primary owner" />}
              </span>
            ) },
          { key: 'role', label: 'Role', type: 'text', width: 1.1, optional: true },
          { key: 'share_pct', label: 'Stake', type: 'secondary', fit: true, render: o => `${o.share_pct}%` },
          { key: 'view', label: '', align: 'right', fit: true,
            render: o => eyeCell(`View ${o.owner_name} details`, () => setDetailModal({ type: 'owner', row: o })) },
        ]}
        rows={ownerRows}
        rowKey={(o, i) => `${o.owner_id}-${i}`}
      />
      )}
    </SectionCard>
  );

  return (
    <>
      <PageShell
        animate
        activePage="properties"
        title="UrbanNest Landlord"
        avatarText={initials(userLabel || 'L')}
        avatarLabel={`Profile: ${userLabel || 'Landlord'}`}
      >
        {error && <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}

        <Breadcrumb items={[
          { label: 'Properties', href: '/landlord-portal/portfolio' },
          { label: loading ? '…' : (prop.name || 'Property'), href: `/landlord-portal/property/${propId}` },
          { label: loading ? '…' : (unitNo || 'Unit') },
        ]} />

        {/* ── HEADER: Unit N · Vacant / Occupied · "LL01 – Apartment Complex" │ actions ── */}
        <DetailHeader
          title={loading ? <span className="un2-skel" style={UI2.skeleton(SZ2.skeletonTitle, SZ2.control.lg)} /> : unitTitle}
          action={!loading && (
            <span style={V.statusPill(occupied ? TONES2.primary : TONES2.success)}>
              <i className={`ti ${occupied ? 'ti-user-check' : 'ti-home'}`} aria-hidden="true" />{occupied ? 'Occupied' : 'Vacant'}
            </span>
          )}
          meta={loading ? null : (headerMeta || null)}
          metaIcon="ti-map-pin"
          aside={headerActions}
        />

        {/* ── GALLERY (main photo ‹ › · 2 tiles · Add) │ FACTS PANEL ── */}
        <Grid layout="wideLeft">
          <PhotoBento
            stacked
            main={{ src: mediaHeroItem?.file_url, video: mediaHeroItem?.file_type === 'VIDEO', onClick: () => openLightbox(mediaHeroIdx) }}
            tiles={mediaThumbItems.map(t => ({ src: t.file_url, video: t.file_type === 'VIDEO', onClick: () => openLightbox(t._idx) }))}
            onPrev={galCount > 1 ? () => stepHero(-1) : undefined}
            onNext={galCount > 1 ? () => stepHero(1) : undefined}
            badge={mediaHeroItem?.file_type === 'VIDEO' && <><i className="ti ti-player-play-filled" aria-hidden="true" /> Video Tour</>}
            add={{
              label: uploadingGallery ? 'Uploading…' : 'Add Photos / Videos',
              busy: uploadingGallery,
              onClick: () => galleryInputRef.current?.click(),
            }}
          />
          {factsPanel}
        </Grid>
        <input
          ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" style={V.hidden}
          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddGalleryFile(f); }}
        />
        {mediaUploadError && <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {mediaUploadError}</div>}

        <Grid layout="wideLeft">{overviewCard}{floorPlanCard}</Grid>
        <Grid layout="two">{featuresCard}{servicesCard}</Grid>
        <Grid layout="two">{maintenanceCard}{financialCard}</Grid>
        <Grid layout="two">{quickActionsCard}{documentsCard}</Grid>
        <Grid layout="two">{tenantCard}{ownerCard}</Grid>

        <PageFooter />
      </PageShell>

      {galleryLightboxOpen && (
        <GalleryLightbox items={galleryItems} index={photoIdx} onClose={() => setGalleryLightboxOpen(false)} onNav={setPhotoIdx} />
      )}

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
    </>
  );
}
