import React, { useState, useRef } from 'react';
import { PageShell, Grid, Breadcrumb, PageFooter, PageWave } from '../../components/layout';
import {
  SectionCard, CardHeader, ListRow, EmptyState,
  DataTable, TextLink, ActionTray, FilterMenu, DetailHeader, PhotoBento, StatGroup, CardWave,
  Modal, ModalSection, FormField, SelectField, IconField, FIELD2, ChoiceTile, Checkbox,
} from '../../components/ui';
import {
  C2, TONES2, ACCENT2, accentTone, FS2, FW2, LH2, T2, R2, BLUR2, SH2, SP2, SZ2, LAYOUT2, OP2, pad, UI2,
} from '../../constants';
import unitPlaceholder from '../../assets/landlord/unit-placeholder.jpg';
import { C, F } from './landlordTokens';
import { UNIT_DEMO, orDemo, isDemoId } from './propertyDemoData';

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

// Sample floor plan sheets — fill empty floor plan slots (display only)
const FB_FLOOR_PLANS = [
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
  'https://images.unsplash.com/photo-1574359411659-15573a27fd0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800&q=80',
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

// Document Vault filter (FilterMenu in the card header) — one option per document type
const DOC_TYPES = [
  { value: 'LEASE', label: 'Lease', icon: 'ti-file-text' }, { value: 'INSPECTION', label: 'Inspection', icon: 'ti-clipboard-check' },
  { value: 'INSURANCE', label: 'Insurance', icon: 'ti-shield-check' }, { value: 'OWNERSHIP', label: 'Ownership', icon: 'ti-certificate' },
];
const DOC_ITEMS = [
  { icon: 'ti-file-text',       name: 'Lease agreement',              meta: 'PDF · 2.4 MB · Signed',    type: 'LEASE' },
  { icon: 'ti-clipboard-check', name: 'Move-in inspection report',    meta: 'PDF · 15.8 MB · Verified', type: 'INSPECTION' },
  { icon: 'ti-shield-check',    name: 'Tenant insurance certificate', meta: 'PDF · 0.8 MB · Valid',     type: 'INSURANCE' },
  { icon: 'ti-file-certificate', name: 'Ownership document',          meta: 'PDF · 3.2 MB · Verified', type: 'OWNERSHIP' },
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

  // photo panel: the unit's first gallery photo (else the unit placeholder) — caption = live fact card
  const heroPhoto = galleryItemsForModal.find(g => g && g.file_type !== 'VIDEO')?.file_url;
  const money = v => (v === '' || v == null ? '—' : `$${Number(v).toLocaleString()}`);
  const unitTypeLabel = EDIT_UNIT_TYPE_OPTIONS.find(o => o.value === form.unit_type)?.label;
  const facts = [
    { icon: 'ti-bed', value: form.total_rooms || '—', label: 'Beds' },
    { icon: 'ti-bath', value: form.total_baths || '—', label: 'Baths' },
    { icon: 'ti-ruler-2', value: form.total_area || form.carpet_area || '—', label: 'Sq ft' },
  ];
  const off = saving ? EU.off : {};

  return (
    <Modal
      title={`Edit Unit ${form.unit_number || unit.unit_number || ''}`.trim()}
      subtitle="Keep the unit's details, pricing, photos and amenities up to date."
      onClose={onClose} note={saveError || undefined}
      media={{
        image: heroPhoto, fallback: unitPlaceholder,
        caption: (
          <div style={EU.card}>
            <div style={EU.cardTop}>
              <span style={EU.cardName}>Unit {form.unit_number || '—'}</span>
              {unitTypeLabel && <span style={EU.cardChip}>{unitTypeLabel}</span>}
            </div>
            <span style={EU.cardSub}>{[form.tower && `Tower ${form.tower}`, form.floor !== '' && form.floor != null && `Floor ${form.floor}`].filter(Boolean).join(' · ') || 'Tower / floor not set'}</span>
            <div style={EU.facts}>
              {facts.map(f => (
                <span key={f.label} style={EU.fact}>
                  <i className={`ti ${f.icon}`} style={EU.factIcon} aria-hidden="true" />
                  <span style={EU.factVal}>{f.value}</span>
                  <span style={EU.factLbl}>{f.label}</span>
                </span>
              ))}
            </div>
            <div style={EU.rent}>
              <span style={EU.rentVal}>{money(form.rent_amount)}</span>
              <span style={EU.rentLbl}>/ month</span>
            </div>
          </div>
        ),
      }}
      footer={<>
        <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...off }} onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...off }} onClick={handleSave} disabled={saving}>
          {!saving && <i className="ti ti-check" style={UI2.btnIcon} aria-hidden="true" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </>}
    >
      {/* ── Unit ── */}
      <ModalSection icon="ti-door" title="Unit" hint="Number, tower, type and ownership">
        <Grid layout="two" as="div" style={EU.grid}>
          <FormField label="Unit number">
            <input className="un2-focus-ring" style={FIELD2.input} value={form.unit_number} onChange={e => upd({ unit_number: e.target.value })} />
          </FormField>
          <FormField label="Tower">
            <input className="un2-focus-ring" style={FIELD2.input} value={form.tower} onChange={e => upd({ tower: e.target.value })} />
          </FormField>
          <FormField label="Unit type">
            <SelectField label="Unit type" placeholder="Select type" options={EDIT_UNIT_TYPE_OPTIONS} value={form.unit_type} onChange={v => upd({ unit_type: v || '' })} />
          </FormField>
          <FormField label="Ownership type">
            <SelectField label="Ownership type" placeholder="Select ownership" options={EDIT_UNIT_OWNERSHIP_TYPE_OPTIONS} value={form.ownership_type} onChange={v => upd({ ownership_type: v || '' })} />
          </FormField>
          <FormField label="Floor">
            <IconField icon="ti-stairs" type="number" value={form.floor} onChange={e => upd({ floor: e.target.value })} />
          </FormField>
          <FormField label="Student housing">
            <div style={EU.checkWrap}>
              <Checkbox checked={form.student_housing} onChange={() => upd({ student_housing: !form.student_housing })} label="This unit is student housing" />
            </div>
          </FormField>
        </Grid>
      </ModalSection>

      {/* ── Size & rooms ── */}
      <ModalSection icon="ti-ruler-2" title="Size & rooms" hint="Areas in square feet">
        <Grid layout="two" as="div" style={EU.grid}>
          <FormField label="Carpet area (sq ft)">
            <input className="un2-focus-ring" style={FIELD2.input} type="number" value={form.carpet_area} onChange={e => upd({ carpet_area: e.target.value })} />
          </FormField>
          <FormField label="Total area (sq ft)">
            <input className="un2-focus-ring" style={FIELD2.input} type="number" value={form.total_area} onChange={e => upd({ total_area: e.target.value })} />
          </FormField>
          <FormField label="Total rooms (beds)">
            <IconField icon="ti-bed" type="number" value={form.total_rooms} onChange={e => upd({ total_rooms: e.target.value })} />
          </FormField>
          <FormField label="Total baths">
            <IconField icon="ti-bath" type="number" value={form.total_baths} onChange={e => upd({ total_baths: e.target.value })} />
          </FormField>
        </Grid>
      </ModalSection>

      {/* ── Lease & pricing ── */}
      <ModalSection icon="ti-file-dollar" title="Lease & pricing" hint="How the unit is let, managed and priced">
        <Grid layout="two" as="div" style={EU.grid}>
          <FormField label="Lease type">
            <SelectField label="Lease type" placeholder="Select lease type" options={EDIT_LEASE_TYPE_OPTIONS} value={form.lease_type} onChange={v => upd({ lease_type: v || '' })} />
          </FormField>
          <FormField label="Management model">
            <SelectField label="Management model" placeholder="Select model" options={EDIT_MANAGEMENT_MODEL_OPTIONS} value={form.management_model} onChange={v => upd({ management_model: v || '' })} />
          </FormField>
          <FormField label="Rent amount">
            <IconField icon="ti-currency-dollar" type="number" value={form.rent_amount} onChange={e => upd({ rent_amount: e.target.value })} />
          </FormField>
          <FormField label="Security deposit">
            <IconField icon="ti-shield-dollar" type="number" value={form.security_deposit} onChange={e => upd({ security_deposit: e.target.value })} />
          </FormField>
          <FormField label="Available from">
            <input className="un2-focus-ring" style={FIELD2.input} type="date" value={form.available_date || ''} onChange={e => upd({ available_date: e.target.value })} />
          </FormField>
          <FormField label="Description" full>
            <textarea className="un2-focus-ring" style={FIELD2.textarea} value={form.description} onChange={e => upd({ description: e.target.value })} />
          </FormField>
        </Grid>
      </ModalSection>

      {/* ── Gallery ── */}
      <ModalSection
        icon="ti-photo" title="Photos & video" hint="Remove (×) and add to replace · a video plays in the hero spot on the unit page"
        action={<span style={UI2.pill(TONES2.primary)}>{galleryItemsForModal.length}</span>}
      >
        <Grid layout="four" as="div" style={EU.grid}>
          {galleryItemsForModal.map(g => (
            <div key={g.id} style={EU.photo}>
              {g.file_type === 'VIDEO'
                ? <video src={g.file_url} style={UI2.photoMedia} muted />
                : <img src={g.file_url} alt="" style={UI2.photoMedia} />}
              {g.file_type === 'VIDEO' && <span style={EU.play} aria-hidden="true"><i className="ti ti-player-play-filled" /></span>}
              <button
                type="button" className="un2-btn" style={EU.remove} onClick={() => handleDeleteGalleryItem(g.id)}
                disabled={galDeletingId === g.id} aria-label={g.file_type === 'VIDEO' ? 'Remove video' : 'Remove photo'}
              >
                <i className={`ti ${galDeletingId === g.id ? 'ti-loader-2' : 'ti-x'}`} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="un2-raise" style={EU.add(uploadingGalleryInModal)} onClick={() => { if (!uploadingGalleryInModal) galleryModalInputRef.current?.click(); }}>
            <i className={`ti ${uploadingGalleryInModal ? 'ti-loader-2' : 'ti-photo-plus'}`} style={EU.addIcon} aria-hidden="true" />
            {uploadingGalleryInModal ? 'Uploading…' : 'Add photo / video'}
          </button>
        </Grid>
        {galleryItemsForModal.length === 0 && <div style={UI2.emptyInline}>No real photos uploaded yet — the unit page shows samples.</div>}
        <input
          ref={galleryModalInputRef}
          type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" style={EU.hidden}
          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddGalleryInModal(f); }}
        />
      </ModalSection>

      {/* ── Floor plan ── */}
      <ModalSection icon="ti-layout-board" title="Floor plan" hint="Tap a page to replace it">
        <FormField label="Floor plan name">
          <input className="un2-focus-ring" style={FIELD2.input} value={form.floor_plan_name} onChange={e => upd({ floor_plan_name: e.target.value })} />
        </FormField>
        <Grid layout="four" as="div" style={EU.grid}>
          {FP_SLOTS.map(({ key, label }) => {
            const url = slotCurrentUrl(key);
            return (
              <div key={key} style={EU.slot}>
                {url ? (
                  <div className="un2-zoom" style={{ ...EU.photo, cursor: 'pointer' }} role="button" tabIndex={0}
                    onClick={() => fpInputRefs.current[key]?.click()} onKeyDown={e => { if (e.key === 'Enter') fpInputRefs.current[key]?.click(); }} aria-label={`Replace ${label}`}>
                    <img src={url} alt={label} style={UI2.photoMedia} />
                    <button type="button" className="un2-btn" style={EU.remove} onClick={e => { e.stopPropagation(); handleClearSlot(key); }} aria-label={`Remove ${label}`}>
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="un2-raise" style={EU.add()} onClick={() => fpInputRefs.current[key]?.click()}>
                    <i className="ti ti-upload" style={EU.addIcon} aria-hidden="true" /> Upload
                  </button>
                )}
                <span style={EU.cap}>{label}</span>
                <input
                  ref={el => (fpInputRefs.current[key] = el)}
                  type="file" accept="image/jpeg,image/png,image/webp" style={EU.hidden}
                  onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handlePickFile(key, f); }}
                />
              </div>
            );
          })}
        </Grid>
      </ModalSection>

      {/* ── Amenities ── */}
      <ModalSection
        icon="ti-armchair" title="Amenities" hint="What this unit offers"
        action={<span style={UI2.pill(TONES2.primary)}>{selectedAmenityIds.size} selected</span>}
      >
        <IconField icon="ti-search" placeholder="Search amenities…" value={amenitySearch} onChange={e => setAmenitySearch(e.target.value)} />
        <Grid layout="three" as="div" style={EU.tiles}>
          {filteredAmenityMaster.map(a => (
            <ChoiceTile
              key={a.id} icon={a.icon || amenityStyle(a.name).icon} label={a.name}
              selected={selectedAmenityIds.has(a.id)} onClick={() => toggleAmenity(a.id)}
            />
          ))}
        </Grid>
        {filteredAmenityMaster.length === 0 && <div style={UI2.emptyInline}>No amenities found.</div>}
      </ModalSection>
    </Modal>
  );
}

// Edit Unit modal — layout only (fields, tiles, buttons and the frame are the shared v2 standards)
const EU = {
  grid:     { columnGap: SP2.lg, rowGap: SP2.lg },
  tiles:    { columnGap: SP2.sm, rowGap: SP2.sm },
  checkWrap:{ ...UI2.row(0), minHeight: SZ2.field },
  slot:     { ...UI2.stack(SP2.xs), minWidth: 0 },
  photo:    { ...UI2.photoTile, height: SZ2.modalPhoto },
  add:      (busy) => ({ ...UI2.addTile(busy), height: SZ2.modalPhoto }),
  addIcon:  { ...UI2.addTileIcon, fontSize: FS2.xl },
  remove:   { ...UI2.btn.icon(SZ2.control.sm), position: 'absolute', top: SP2.xs, right: SP2.xs, background: C2.white, color: C2.textSecondary, boxShadow: SH2.md },
  play:     { ...UI2.center, position: 'absolute', inset: 0, color: C2.white, fontSize: FS2.xxl, pointerEvents: 'none' },
  cap:      { ...UI2.text.meta, textAlign: 'center' },
  hidden:   { display: 'none' },
  off:      { opacity: 0.6, cursor: 'not-allowed' },
  // live fact card on the Modal photo panel (white glass — different from Edit Property's dark caption)
  card:     { ...UI2.stack(SP2.sm), padding: SP2.md, borderRadius: R2.lg, background: C2.glassCaption, boxShadow: SH2.lg, backdropFilter: BLUR2.glass, WebkitBackdropFilter: BLUR2.glass },
  cardTop:  { ...UI2.row(SP2.sm), justifyContent: 'space-between' },
  cardName: { ...T2.sectionTitle, ...UI2.truncate, minWidth: 0 },
  cardChip: { ...UI2.pill(TONES2.primary), flexShrink: 0 },
  cardSub:  { ...UI2.text.meta, marginTop: -SP2.xs },
  facts:    { display: 'flex', justifyContent: 'space-between', gap: SP2.xs, padding: pad(SP2.sm, 0), borderTop: `${SZ2.hairline}px solid ${C2.divider}`, borderBottom: `${SZ2.hairline}px solid ${C2.divider}` },
  fact:     { ...UI2.stack(0), alignItems: 'center', flex: 1, minWidth: 0 },
  factIcon: { fontSize: FS2.md, color: C2.primary },
  factVal:  { fontSize: FS2.md, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.heading },
  factLbl:  { ...T2.caption },
  rent:     { ...UI2.row(SP2.xs), alignItems: 'baseline' },
  rentVal:  { ...T2.kpiValue, color: C2.navyDeep },
  rentLbl:  { ...T2.caption },
};

// ─── Design System v2 — presentation for the main page ───────────────────────
// Visual layer only. Data still comes from exactly the same calls as before:
//   GET    /landlord/property/<id>/unit/<uid>/          (property, unit, stats, amenities, tenant, owners…)
//   GET    /auth/me/                                    (avatar)
//   GET    /landlord/account/services/                  (owned services → Add Service)
//   GET    /properties/<id>/units/<uid>/services/       (assigned services)
//   POST   /properties/<id>/units/<uid>/services/       (Add Service)
//   POST   /properties/<id>/units/<uid>/gallery/        (Add photo / video)
//   PATCH  /properties/<id>/units/<uid>/                (floor plan slot upload / remove)
// The modals above (Add Service, Detail pop-up, Gallery lightbox) are unchanged; Edit Unit is on the v2 Modal template.
//
// Layout — top per Downloads/image 61.png, cards below = the original unit-page design:
//   Breadcrumb · DetailHeader (Unit N · Vacant pill · "LL01 – Apartment Complex" │ Edit · Listing · Share · Download)
//   Gallery — PhotoBento gallery (wide main photo · 2 × 2 photos · "+N more" on the last tile)
//   StatGroup (open, 6 stats split by hairlines, like the property page) — Rent · Security Dep. · Configuration · Total Beds · Total Baths · Lease Agreement
//   Unit & Lease Overview │ Floor Plan
//   Special Features │ Unit Services
//   Maintenance Queue │ Financial Command
//   Quick Actions │ Document Vault
//   Tenant │ Owner

// Tones (ACCENT2 / TONES2 only — no yellow) for the static lists above, same order as the arrays
const QA_TONES      = [accentTone(ACCENT2.blue), accentTone(ACCENT2.teal), accentTone(ACCENT2.rose), TONES2.neutral];
const DOC_TONES     = [accentTone(ACCENT2.rose), accentTone(ACCENT2.teal), accentTone(ACCENT2.violet), accentTone(ACCENT2.blue)];
// StatGroup: accent per stat, cycling the harmonised ACCENT2 set
const FACT_ACCENTS  = [ACCENT2.blue, ACCENT2.teal, ACCENT2.violet, ACCENT2.rose];
const factAccent    = i => FACT_ACCENTS[i % FACT_ACCENTS.length];
// Maintenance priority — shown as dot + coloured word (UI2.statusPill, no box)
const PRIORITY_CFG  = p => ((p === 'URGENT' || p === 'HIGH') ? { tone: TONES2.error, label: 'Critical' }
  : p === 'MEDIUM' ? { tone: TONES2.purple, label: 'Medium' } : { tone: TONES2.neutral, label: 'Low' });
const RATING_MAX    = 5;
const optLabel      = (opts, v) => (opts.find(o => o.value === v) || {}).label || v || '—';

// Page-specific layout only — shared patterns come from UI2 and the v2 components.
const V = {
  headBtn:     { ...UI2.btn.light, boxShadow: SH2.glass },   // white button on the PageWave gradient, same mild shadow as containers
  statusPill:  (tone) => ({ ...UI2.pill(tone), flexShrink: 0 }),
  disabled:    { opacity: OP2.muted, cursor: 'not-allowed' },
  hidden:      { display: 'none' },
  // Unit & Lease Overview rows = UI2.kvRow / UI2.kvVal (shared row spacing LAYOUT2.rowY)
  eyeBtn:      (on) => ({ ...UI2.btn.icon(SZ2.icon.xs), fontSize: FS2.sm, color: on ? C2.primary : C2.textSubtle, background: on ? C2.primarySoft : C2.surfaceMuted, ...(on ? {} : { cursor: 'not-allowed' }) }),
  // Floor plan: main sheet + 3 page tiles (photo tiles / dashed add tiles — same look as PhotoBento)
  fpOpen:      { display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: LAYOUT2.cardY },   // same top inset as the card beside it → headers line up
  fpMain:      { ...UI2.photoTile, height: SZ2.floorPlanMain },   // fixed — keeps the Overview / Floor Plan row compact
  fpPages:     { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: LAYOUT2.gridGap, marginTop: LAYOUT2.gridGap },
  fpPage:      { ...UI2.photoTile, height: SZ2.thumb.h },
  fpImg:       (busy) => ({ ...UI2.photoMedia, cursor: busy ? 'progress' : 'pointer' }),
  fpLabel:     { ...UI2.chipOnDark, position: 'absolute', left: SP2.md, bottom: SP2.md },   // same spot as PhotoBento's badge
  // Features / services chips
  chips:       { display: 'flex', flexWrap: 'wrap', gap: SP2.sm, paddingTop: SP2.xs },
  bankDot:     UI2.dot(ACCENT2.violet.fg),
  legend:      { ...UI2.context, marginTop: SP2.md },
  // Tables / footers
  endFoot:     { ...UI2.cardFoot, justifyContent: 'flex-end' },   // footer link on the right end
  segment:     { ...UI2.row(SP2.xs) },
  stars:       { ...UI2.row(SP2.xxs), color: C2.primary },
  starOff:     { color: C2.textSubtle },
  assignBtn:   { ...UI2.btn.brand, ...UI2.btnSm },
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
  const [docType, setDocType] = useState(null);   // Document Vault filter (null = all)
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
  // eslint-disable-next-line no-unused-vars -- read by the gallery "Add Photo / Video" button (commented out for now)
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

  // Main photo = the video if one exists, else the first item ("Primary view"); the 2 × 2 tiles
  // show the up-to-4 items that follow it (PhotoBento gallery). Any tile opens the lightbox.
  const [heroIdx, setHeroIdx] = useState(0);
  const galCount = galleryItems.length;
  const mediaHeroIdx = galCount ? ((heroIdx % galCount) + galCount) % galCount : 0;
  const mediaHeroItem = galleryItems[mediaHeroIdx];
  // The side is ALWAYS a full 2 × 2 of equal tiles: up to 4 real photos after the main one; any empty
  // cell is filled with a sample photo (FB_GALLERY — display only, not clickable). When the gallery has
  // more than 5 items, the LAST tile carries "+N more" (N = photos / videos not visible, the covered
  // tile included) and opens the lightbox.
  const SIDE_TILES = 4;
  const realSide = Array.from({ length: Math.min(Math.max(galCount - 1, 0), SIDE_TILES) }, (_, k) => {
    const i = (mediaHeroIdx + k + 1) % galCount;
    return { ...galleryItems[i], _idx: i };
  });
  // Samples skip any photo already on screen (main + real tiles), so no image appears twice
  const shownUrls = new Set([mediaHeroItem?.file_url, ...realSide.map(t => t.file_url)]);
  const freshSamples = FB_GALLERY.filter(u => !shownUrls.has(u));
  const samplePool = freshSamples.length ? freshSamples : FB_GALLERY;
  const sampleSide = Array.from({ length: SIDE_TILES - realSide.length }, (_, k) => ({
    file_url: samplePool[k % samplePool.length], file_type: 'IMAGE', _sample: true,
  }));
  const mediaThumbItems = [...realSide, ...sampleSide];
  const moreCount = galCount - SIDE_TILES;   // main + 3 uncovered tiles are visible
  if (moreCount > 0) mediaThumbItems[SIDE_TILES - 1].more = { count: `+${moreCount} more` };

  // Leads with the video (if any) the first time this unit's data loads.
  React.useEffect(() => {
    if (heroVideoIdx !== -1) { setPhotoIdx(heroVideoIdx); setHeroIdx(heroVideoIdx); }
  }, [unit.id, heroVideoIdx]);

  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const openLightbox = i => { setPhotoIdx(i); setGalleryLightboxOpen(true); };

  // lease_type is stored as the dropdown's raw value ('fixed' / 'month' — see EDIT_LEASE_TYPE_OPTIONS)
  const LEASE_TYPE_LABELS = { fixed: 'Fixed-Term', month: 'Month-to-Month' };
  const bedCount = unit.total_rooms ?? null;

  // Unit & Lease Overview fields
  const unitPropLabel = `${prop.name || '—'}/${unit.unit_number || '—'}`;
  const areaLabel = (unit.total_area || unit.carpet_area)
    ? `${unit.total_area ?? '—'}/${unit.carpet_area ?? '—'} sq ft`
    : '—';
  const floorLabel = (() => {
    const o = ordinalSuffix(unit.floor);
    return o ? `${o} Floor` : '—';
  })();
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

  // Summary row under the gallery: 6 stats in one open StatGroup (same as the property page header)
  const money = v => (v ? `$${Number(v).toLocaleString()}` : '—');
  const bathCount = unit.total_baths ?? null;
  const facts = [
    { label: 'Rent / Mo',       icon: 'ti-cash',            value: money(unit.rent_amount) },
    { label: 'Security Dep.',   icon: 'ti-shield-check',    value: money(unit.security_deposit) },
    { label: 'Configuration',   icon: 'ti-layout-grid',     value: bedCount != null ? plural(bedCount, 'Bedroom') : optLabel(EDIT_UNIT_TYPE_OPTIONS, unit.unit_type) },
    { label: 'Total Beds',      icon: 'ti-bed',             value: bedCount != null ? plural(bedCount, 'Bed') : '—' },
    { label: 'Total Baths',     icon: 'ti-bath',            value: bathCount != null ? plural(bathCount, 'Bath') : '—' },
    { label: 'Lease Agreement', icon: 'ti-file-text',       value: LEASE_TYPE_LABELS[unit.lease_type] || unit.lease_type || '—' },
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
  // Secondary header actions sit on the PageWave gradient → white light buttons (soft would blend into the blue)
  const headerActions = (
    <ActionTray
      label="Options"
      primary={(
        <button type="button" className="un2-btn" style={UI2.btn.brand}>
          <i className="ti ti-download" style={UI2.btnIcon} aria-hidden="true" /> Download Report
        </button>
      )}
    >
      {!loading && unit.id && (
        <button type="button" className="un2-btn" style={V.headBtn} onClick={() => setShowEditUnit(true)}>
          <i className="ti ti-pencil" style={UI2.btnIcon} aria-hidden="true" /> Edit
        </button>
      )}
      <button
        type="button" className="un2-btn"
        style={{ ...V.headBtn, ...(listing ? V.disabled : {}) }}
        disabled={!!listing}
        title={listingTitle}
        onClick={() => {
          if (listing) return;
          window.location.href = `/landlord-portal/property/${propId}/unit/${unitId}/list/step-1`;
        }}
      >
        <i className="ti ti-building-store" style={UI2.btnIcon} aria-hidden="true" /> {listingLabel}
      </button>
      <button type="button" className="un2-btn" style={V.headBtn}>
        <i className="ti ti-share" style={UI2.btnIcon} aria-hidden="true" /> Share Detail
      </button>
    </ActionTray>
  );

  // ── Gallery — open on the page (no card): photos take the full width ──────
  const galleryCard = (
      <PhotoBento
        gallery
        label="Primary view"
        main={{ src: mediaHeroItem?.file_url, video: mediaHeroItem?.file_type === 'VIDEO', onClick: () => openLightbox(mediaHeroIdx) }}
        tiles={mediaThumbItems.map(t => ({ src: t.file_url, video: t.file_type === 'VIDEO', more: t.more, onClick: t._sample ? undefined : () => openLightbox(t._idx) }))}
        badge={heroVideoIdx !== -1 && (
          <><i className="ti ti-player-play-filled" aria-hidden="true" /> Video Tour</>
        )}
        // "Add Photo / Video" button on the main photo — hidden for now (uploads still work from Edit Unit).
        // add={{
        //   label: uploadingGallery ? 'Uploading…' : 'Add Photo / Video',
        //   busy: uploadingGallery,
        //   onClick: () => galleryInputRef.current?.click(),
        // }}
      />
  );

  // ── Unit & Lease Overview ─────────────────────────────────────────────────
  const kvRows = (rows) => rows.map((r, i) => (
    <div key={r.lbl} style={UI2.kvRow(i === 0)}>
      <span>{r.lbl}</span>
      <span style={UI2.kvVal}>{r.val}</span>
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
            { lbl: 'Unit Type',           val: unit.unit_type ? optLabel(EDIT_UNIT_TYPE_OPTIONS, unit.unit_type) : UNIT_DEMO.overview.unit_type },
            { lbl: 'Rooms / Baths',       val: `${bedCount ?? UNIT_DEMO.overview.rooms} / ${bathCount ?? UNIT_DEMO.overview.baths}` },
          ])}
        </div>
        <div>
          {kvRows([
            { lbl: 'Contractual Model', val: `${leaseWord} / ${stats.lease_term || UNIT_DEMO.overview.lease_term}` },
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
            { lbl: 'Lease Duration', val: stats.lease_term || UNIT_DEMO.overview.lease_term },
            { lbl: 'Notice Period',  val: unit.notice_period ? plural(unit.notice_period, 'Day') : UNIT_DEMO.overview.notice_period },
            { lbl: 'Lease Status', val: (
              <><span style={UI2.statusDot(leaseStatusTone)} />{leaseStatusLabel}</>
            ) },
          ])}
        </div>
      </div>
    </SectionCard>
  );

  // ── Floor Plan: main sheet + pages 2–4 (click a sheet to replace it, × to remove) ──
  // Empty slot → sample floor plan image (display only, no label); clicking it uploads the real page.
  const fpSample = i => {
    const pool = [unit.floor_plan_url, ...FB_FLOOR_PLANS].filter(Boolean);
    return pool[i % pool.length];
  };
  const fpSlot = (slot, tileStyle, main = false, idx = 0) => {
    const url = unit[slot.key];
    const busy = uploadingFpSlot === slot.key;
    const pick = () => { if (!busy) fpMainInputRefs.current[slot.key]?.click(); };
    const sampleUrl = url ? null : fpSample(idx);
    return (
      <div key={slot.key} className="un2-zoom" style={tileStyle}>
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
          <>
            <img src={sampleUrl} alt={`Sample ${slot.label}`} title={`Upload ${slot.label}`} style={V.fpImg(busy)} onClick={pick} aria-busy={busy || undefined} />
            {/* "Sample" label hidden for now:
            <span style={V.fpLabel}>{busy ? 'Uploading…' : (main ? 'Floor Plan · Sample' : 'Sample')}</span> */}
          </>
        )}
        <input
          ref={el => { fpMainInputRefs.current[slot.key] = el; }}
          type="file" accept="image/jpeg,image/png" style={V.hidden}
          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddFloorPlanSlot(slot.key, f); }}
        />
      </div>
    );
  };
  // Open on the page (no card): standard card header, then the main sheet (fixed SZ2.floorPlanMain height,
  // so the row stays compact) and pages 2–4 under it; empty slots show sample sheets
  const floorPlanCard = (
    <div style={V.fpOpen}>
      <CardHeader
        icon="ti-layout-board-split" title="Floor Plan"
        action={unit.floor_plan_url && (
          <button type="button" style={UI2.btn.icon(SZ2.control.sm)} onClick={() => window.open(unit.floor_plan_url, '_blank', 'noopener')}
            title="Open floor plan" aria-label="Open floor plan">
            <i className="ti ti-arrows-diagonal" aria-hidden="true" />
          </button>
        )}
      />
      {fpSlot(FP_MAIN_SLOTS[0], V.fpMain, true)}
      <div style={V.fpPages}>{FP_MAIN_SLOTS.slice(1).map((s, i) => fpSlot(s, V.fpPage, false, i + 1))}</div>
    </div>
  );

  // ── Special Features │ Unit Services ──────────────────────────────────────
  const featuresCard = (
    <SectionCard style={UI2.cardFill} icon="ti-star" title="Special Features">
      {amenities.length === 0 ? (
        <div style={UI2.emptyInline}>{loading ? '…' : 'No amenities configured.'}</div>
      ) : (
        <div style={V.chips}>
          {amenities.map((a, i) => (
            <span key={a.id} style={UI2.featureChip()}>
              <i className={`ti ${amenityIcon(a.name)}`} style={UI2.featureChipIcon(i)} aria-hidden="true" /> {a.name}
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );

  const servicesCard = (
    <SectionCard
      style={UI2.cardFill} icon="ti-stack-2" title="Unit Services"
      action={<TextLink arrow={false} onClick={() => setAddServiceOpen(true)}><i className="ti ti-plus" aria-hidden="true" /> Add Service</TextLink>}
    >
      {servicesLoading ? (
        <div style={UI2.emptyInline}>Loading services…</div>
      ) : (
        <div style={V.chips}>
          {servicesToShow.map((s, i) => (
            <span key={s.id} style={UI2.featureChip()} title={s.name}>
              <i className={`ti ${s.icon}`} style={UI2.featureChipIcon(i)} aria-hidden="true" /> {s.name}
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
  // REAL tickets first; when the unit has none (once loaded), sample tickets from UNIT_DEMO with a "Sample" pill
  const viewMaintenance = loading ? [] : orDemo(maintenance, UNIT_DEMO.maintenance);
  const maintIsSample = viewMaintenance.some(t => isDemoId(t.id));
  const maintenanceCard = (
    <SectionCard
      style={UI2.cardFill} centerBody={viewMaintenance.length === 0} icon="ti-tool" title="Maintenance Queue"
      badge={maintIsSample && <span style={UI2.pill()} title="Sample data until a ticket is logged">Sample</span>}
      action={<TextLink arrow={false}><i className="ti ti-plus" aria-hidden="true" /> Add ticket</TextLink>}
    >
      {viewMaintenance.length === 0 ? (
        <EmptyState icon="ti-clipboard-check" text="No open tickets." />
      ) : viewMaintenance.map(t => {
        const p = PRIORITY_CFG(t.priority);
        return (
          <ListRow
            key={t.id}
            leading={<div style={UI2.iconBox(SZ2.icon.md, p.tone)}><i className="ti ti-tool" aria-hidden="true" /></div>}
            title={t.title}
            meta={t.time_ago}
            trailing={<span style={UI2.statusPill(p.tone)}><span style={UI2.statusDot(p.tone)} />{p.label}</span>}
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
          { key: 'status', label: 'Status', type: 'status', fit: true, align: 'right',   // last column → ends flush right
            render: r => <span style={UI2.statusPill(TONES2.success)}><span style={UI2.statusDot(TONES2.success)} />{r.status}</span> },
        ]}
        rows={LEDGER_ROWS}
        rowKey={r => r.month}
      />
      <div style={V.endFoot}><TextLink>View full ledger</TextLink></div>
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

  // Document Vault: filter icon in the header (by type) · footer = "Full archive" on the right
  // Tones keep each document's own colour.
  const shownDocs = DOC_ITEMS.map((d, i) => ({ ...d, tone: DOC_TONES[i] })).filter(d => !docType || d.type === docType);
  const docTypeLabel = docType ? DOC_TYPES.find(t => t.value === docType)?.label.toLowerCase() : '';
  const documentsCard = (
    <SectionCard
      style={UI2.cardFill} icon="ti-folder" title="Document Vault"
      action={(
        <FilterMenu
          title="Filter by type" allLabel="All documents" allIcon="ti-files" ariaLabel="Filter documents by type"
          options={DOC_TYPES} value={docType} onChange={setDocType}
        />
      )}
    >
      {shownDocs.length === 0 && <div style={UI2.emptyInline}>No {docTypeLabel} documents yet.</div>}
      {shownDocs.map(d => (
        <ListRow
          key={d.name}
          variant="hover"
          leading={<div style={UI2.iconBox(SZ2.icon.md, d.tone)}><i className={`ti ${d.icon}`} aria-hidden="true" /></div>}
          title={d.name}
          meta={d.meta}
          trailing={<i className="ti ti-download" style={UI2.chevron} aria-hidden="true" />}
        />
      ))}
      <div style={{ ...UI2.cardFoot, justifyContent: 'flex-end' }}>
        <TextLink>Full archive</TextLink>
      </div>
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

  // Tenant card: REAL current / past tenants first; when the API has none (once loaded), sample rows from
  // UNIT_DEMO (propertyDemoData.js) fill the card, flagged with a "Sample" pill. Display only.
  // Columns: Tenant ID · Name · Move-in · Renewal Window (current) / Lease End (past) · eye → details.
  const viewTenant      = tenant.name ? tenant : (loading ? null : UNIT_DEMO.tenant);
  const viewPastTenants = loading ? [] : orDemo(pastTenants, UNIT_DEMO.past_tenants);
  const tenantRows = tenantTab === 'current' ? (viewTenant ? [viewTenant] : []) : viewPastTenants;
  const tenantIsSample = tenantRows.some(t => isDemoId(t.id));
  const tenantCard = (
    <SectionCard
      style={UI2.cardFill} centerBody={tenantRows.length === 0} icon="ti-users" title="Tenant"
      badge={tenantIsSample && <span style={UI2.pill()} title="Sample data until a tenant is assigned">Sample</span>}
      action={segment(tenantTab, setTenantTab, viewPastTenants.length)}
    >
      {tenantRows.length === 0 ? (
        <EmptyState icon="ti-users" text={tenantTab === 'current' ? 'No tenant assigned to this unit.' : 'No past tenant records for this unit yet.'}>
          {tenantTab === 'current' && !loading && (
            <button type="button" className="un2-btn" style={V.assignBtn}>
              <i className="ti ti-user-plus" style={UI2.btnIcon} aria-hidden="true" /> Assign Tenant
            </button>
          )}
        </EmptyState>
      ) : (
      <DataTable
        columns={[
          { key: 'tenant_id', label: 'Tenant ID', type: 'secondary', fit: true,
            render: t => t.tenant_id || (t.id && !isDemoId(t.id) ? `TNT-${t.id}` : '—') },   // plain text — no tag box in tables
          { key: 'name', label: 'Name', type: 'primary', width: 1.5, render: t => t.name || 'Unknown tenant' },
          { key: 'move_in_date', label: 'Move-in', type: 'secondary', fit: true, render: t => t.move_in_date || '—' },
          // Current tenant → renewal window (or lease end) · past tenants → when the lease ended
          tenantTab === 'current'
            ? { key: 'renewal', label: 'Renewal Window', type: 'secondary', fit: true,
                render: t => t.renewal_window || t.lease_end_date || '—' }
            : { key: 'lease_end', label: 'Lease End', type: 'secondary', fit: true,
                render: t => t.lease_end_date || '—' },
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
          { key: 'owner_id', label: 'Owner ID', type: 'secondary', fit: true, render: o => o.owner_id },   // plain text — no tag box in tables
          { key: 'owner_name', label: 'Owner name', type: 'primary', width: 1.5,
            render: o => o.owner_name },
          { key: 'role', label: 'Role', type: 'text', fit: true },
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
        backdrop={<PageWave />}
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

        {/* ── GALLERY: wide main photo · 2 × 2 photos · "Add Photo / Video" on the photo ── */}
        {galleryCard}
        <input
          ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" style={V.hidden}
          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleAddGalleryFile(f); }}
        />
        {mediaUploadError && <div style={UI2.errorBanner}><i className="ti ti-alert-circle" aria-hidden="true" /> {mediaUploadError}</div>}

        {/* ── 6 FACTS: Rent · Deposit · Configuration · Beds · Baths · Lease Agreement — same StatGroup as the property page ── */}
        <StatGroup fill items={facts.map((f, i) => ({ ...f, value: loading ? '—' : f.value, accent: factAccent(i) }))} />

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
            { label: 'Tenant ID', value: detailModal.row.tenant_id || '—' },
            { label: 'Occupation', value: detailModal.row.occupation || '—' },
            { label: 'Company', value: detailModal.row.company || '—' },
            { label: 'Contact', value: detailModal.row.email || '—' },
            { label: 'Move-in Date', value: detailModal.row.move_in_date || '—' },
            { label: 'Lease Start Date', value: detailModal.row.lease_start_date || '—' },
            { label: 'Lease End Date', value: detailModal.row.lease_end_date || '—' },
            ...(detailModal.row._past ? [] : [{ label: 'Renewal Window', value: detailModal.row.renewal_window || '—' }]),
            { label: 'Payment Rating', value: <Stars value={detailModal.row.payment_rating} /> },
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
