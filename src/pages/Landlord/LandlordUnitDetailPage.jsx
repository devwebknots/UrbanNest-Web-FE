import React, { useState } from 'react';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';

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

  // AMENITIES — fixed height, 2 per row, scrolls internally past 3 rows
  amenityGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, maxHeight: 138, overflowY: 'auto', paddingRight: 4 },
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
};

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

export default function LandlordUnitDetailPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [tenantTab, setTenantTab] = useState('current');
  const [pastIdx, setPastIdx] = useState(0);

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

  React.useEffect(() => {
    if (!propId || !unitId) return;
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/landlord/property/${propId}/unit/${unitId}/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [propId, unitId]);

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
  const userLabel = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email
    : '';

  const nextPastTenant = () => setPastIdx(p => (p + 1) % pastTenants.length);
  const prevPastTenant = () => setPastIdx(p => (p - 1 + pastTenants.length) % pastTenants.length);
  const activePastTenant = pastTenants[pastIdx] || {};

  const gallery = unit.gallery_urls?.length ? unit.gallery_urls : FB_GALLERY;
  const usingFallbackGallery = !unit.gallery_urls?.length;

  const nextPhoto = () => setPhotoIdx(p => (p + 1) % gallery.length);
  const prevPhoto = () => setPhotoIdx(p => (p - 1 + gallery.length) % gallery.length);

  const specs = [
    { lbl: 'Floor',        val: unit.floor || '—' },
    { lbl: 'Total area',   val: unit.total_area ? `${unit.total_area} sq ft` : '—' },
    { lbl: 'Carpet area',  val: unit.carpet_area ? `${unit.carpet_area} sq ft` : '—' },
    { lbl: 'Layout',       val: (unit.total_rooms || unit.total_baths) ? `${unit.total_rooms ?? '—'} Bed · ${unit.total_baths ?? '—'} Bath` : '—' },
    { lbl: 'Unit type',    val: unit.unit_type || '—' },
    { lbl: 'Lease type',   val: unit.lease_type || '—' },
    { lbl: 'Tower',        val: unit.tower || '—' },
    { lbl: 'Student housing', val: unit.student_housing ? 'Yes' : 'No' },
  ];

  const rating = tenant.payment_rating || 0;

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
              <button style={S.btnOutline}><i className="ti ti-share" style={{ fontSize: 13 }} aria-hidden="true" />Share detail</button>
              <button style={S.btnDark}><i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" />Download report</button>
            </div>
          </div>

          {/* STAT STRIP */}
          <div style={S.statStrip}>
            <div style={S.statCell}>
              <span style={S.statLbl}>Tenant</span>
              <span style={S.statVal}>{tenant.name || 'Vacant'}</span>
            </div>
            <div style={S.statCell}>
              <span style={S.statLbl}>Monthly rent</span>
              <span style={S.statVal}>{stats.monthly_rent ? `$${stats.monthly_rent}` : '—'}</span>
            </div>
            <div style={S.statCell}>
              <span style={S.statLbl}>Status</span>
              <span style={{ ...S.statVal, color: stats.rent_status === 'PAID' ? C.greenDark : C.txtSec }}>{stats.rent_status || '—'}</span>
            </div>
            <div style={S.statCell}>
              <span style={S.statLbl}>Lease term</span>
              <span style={S.statVal}>{stats.lease_term || '—'}</span>
            </div>
            <div style={S.statCell}>
              <span style={S.statLbl}>Maintenance</span>
              <span style={{ ...S.statVal, color: stats.maint_open > 0 ? C.amber : C.greenDark }}>
                {stats.maint_open > 0 ? `${stats.maint_open} open` : 'Clear'}
              </span>
            </div>
            <div style={S.statCell}>
              <span style={S.statLbl}>Owner mode</span>
              <span style={S.toggleOn}><i className="ti ti-toggle-right" style={{ fontSize: 18 }} aria-hidden="true" />Active</span>
            </div>
          </div>

          <div style={S.sw}>

            {/* GALLERY + FLOOR PLAN */}
            <div style={S.row60_40}>
              <div style={S.galWrap}>
                <img src={gallery[photoIdx]} alt={unit.unit_number} style={S.galImg} />
                {gallery.length > 1 && (
                  <>
                    <button style={S.galArrow('left')} onClick={prevPhoto} aria-label="Previous photo"><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                    <button style={S.galArrow('right')} onClick={nextPhoto} aria-label="Next photo"><i className="ti ti-chevron-right" aria-hidden="true" /></button>
                  </>
                )}
                <div style={S.galCount}>{photoIdx + 1} / {gallery.length}{usingFallbackGallery ? ' · Sample' : ''}</div>
              </div>

              <div style={S.card}>
                <div style={S.cardTitle}>Floor plan</div>
                {unit.floor_plan_url ? (
                  <div style={{ ...S.floorPlanBox, background: 'transparent', padding: 0, overflow: 'hidden' }}>
                    <img src={unit.floor_plan_url} alt="Floor plan" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                ) : (
                  <div style={{ ...S.floorPlanBox, position: 'relative', padding: 0, overflow: 'hidden', color: 'transparent' }}>
                    <img src={FB_GALLERY[0]} alt="Sample floor plan" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    <span style={S.floorPlanSample}>Sample floor plan</span>
                  </div>
                )}
                <button style={S.floorPlanBtn}><i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" />Download floor plan (PDF)</button>
              </div>
            </div>

            {/* OVERVIEW + SPECS / AMENITIES */}
            <div style={S.row65_35}>
              <div style={S.card}>
                <div style={S.cardTitle}>Unit Overview</div>
                <p style={{ fontSize: 12.5, color: C.txtSec, lineHeight: 1.7, margin: '8px 0 0' }}>
                  {unit.description || 'No description added for this unit yet.'}
                </p>
                <div style={S.specGrid}>
                  {specs.map(s => (
                    <div key={s.lbl}>
                      <div style={S.specLbl}>{s.lbl}</div>
                      <div style={S.specVal}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardTitle}>Amenity(s)</div>
                {amenities.length === 0 && <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic', marginTop: 10 }}>No amenities configured.</div>}
                {amenities.length > 0 && (
                  <div className={amenities.length > 6 ? 'un-amenity-scroll' : ''} style={S.amenityGrid}>
                    {amenities.map(a => (
                      <div key={a.id} style={S.amenityItem}>
                        <div style={S.amenityIcon}><i className={`ti ${amenityIcon(a.name)}`} style={{ fontSize: 11 }} aria-hidden="true" /></div>
                        {a.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* UNIT SERVICES */}
            <div style={{ ...S.row60_40, gridTemplateColumns: '1fr' }}>
              <div style={S.card}>
                <div style={S.cardHdr}>
                  <div style={S.cardTitle}>Unit Services</div>
                  <span style={S.cardLink} onClick={() => setAddServiceOpen(true)}>+ Add Service</span>
                </div>
                {servicesLoading && (
                  <div style={S.serviceEmpty}>Loading services…</div>
                )}
                {!servicesLoading && unitServices.length === 0 && (
                  <div style={S.serviceEmpty}>No services assigned to this unit yet.</div>
                )}
                {unitServices.length > 0 && (
                  <div style={S.serviceGrid}>
                    {unitServices.map(s => (
                      <div key={s.id} style={S.serviceItem} title={s.name}>
                        <div style={{ ...S.serviceIcon, ...(s.requiresBankAccount ? S.serviceIconBank : {}) }}>
                          <i className={`ti ${s.icon}`} aria-hidden="true" />
                        </div>
                        <span style={S.serviceItemName}>{s.name}</span>
                        {s.requiresBankAccount && <div style={S.bankDot} />}
                      </div>
                    ))}
                  </div>
                )}
                {unitServices.some(s => s.requiresBankAccount) && (
                  <div style={S.serviceLegend}><div style={S.serviceLegendDot} /> = requires a linked bank account</div>
                )}
              </div>
            </div>

            {/* TENANT PROFILE / FINANCIAL COMMAND */}
            <div style={S.row50_50}>
              <div style={S.card}>
                <div style={S.tenantTabRow}>
                  <div style={S.tenantTab(tenantTab === 'current')} onClick={() => setTenantTab('current')}>Current Tenant</div>
                  <div style={S.tenantTab(tenantTab === 'past')} onClick={() => { setTenantTab('past'); setPastIdx(0); }}>Past Tenant(s){pastTenants.length > 0 ? ` (${pastTenants.length})` : ''}</div>
                </div>

                {tenantTab === 'current' && (
                  <>
                    <div style={S.tenantHdr}>
                      <div style={S.tenantAv}>{initials(tenant.name || '?')}</div>
                      <div>
                        <div style={S.tenantName}>{tenant.name || 'No Tenant Assigned'}</div>
                        {tenant.occupation && <div style={S.tenantSub}>{tenant.occupation}{tenant.company ? ` · ${tenant.company}` : ''}</div>}
                      </div>
                      {tenant.name && <span style={S.goodStandingPill}>Good standing</span>}
                    </div>
                    <div style={S.divider} />
                    <div style={S.tenantGrid}>
                      <div>
                        <div style={S.tenantFieldLbl}>Contact</div>
                        <div style={S.tenantFieldVal}>{tenant.email || '—'}</div>
                      </div>
                      <div>
                        <div style={S.tenantFieldLbl}>Move-in date</div>
                        <div style={S.tenantFieldVal}>{tenant.move_in_date || '—'}</div>
                      </div>
                      <div>
                        <div style={S.tenantFieldLbl}>Renewal window</div>
                        <div style={S.tenantFieldVal}>{tenant.renewal_window || '—'}</div>
                      </div>
                      <div>
                        <div style={S.tenantFieldLbl}>Payment rating</div>
                        <div style={S.stars}>
                          {rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—'}
                        </div>
                      </div>
                    </div>
                    {tenant.name && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <span style={S.cardLink} onClick={() => window.location.href = '/landlord-portal/tenants'}>View Detail</span>
                      </div>
                    )}
                  </>
                )}

                {tenantTab === 'past' && (
                  <>
                    {pastTenants.length === 0 && (
                      <div style={{ fontSize: 12, color: C.txtMuted, fontStyle: 'italic', padding: '8px 0' }}>
                        No past tenant records for this unit yet.
                      </div>
                    )}
                    {pastTenants.length > 0 && (
                      <>
                        <div style={S.tenantHdr}>
                          <div style={S.tenantAv}>{initials(activePastTenant.name || '?')}</div>
                          <div>
                            <div style={S.tenantName}>{activePastTenant.name || 'Unknown tenant'}</div>
                            {activePastTenant.occupation && <div style={S.tenantSub}>{activePastTenant.occupation}{activePastTenant.company ? ` · ${activePastTenant.company}` : ''}</div>}
                          </div>
                          <span style={{ ...S.goodStandingPill, background: C.stdBg, color: C.txtSec }}>Past tenant</span>
                        </div>
                        <div style={S.divider} />
                        <div style={S.tenantGrid}>
                          <div>
                            <div style={S.tenantFieldLbl}>Contact</div>
                            <div style={S.tenantFieldVal}>{activePastTenant.email || '—'}</div>
                          </div>
                          <div>
                            <div style={S.tenantFieldLbl}>Move-in date</div>
                            <div style={S.tenantFieldVal}>{activePastTenant.move_in_date || '—'}</div>
                          </div>
                          <div>
                            <div style={S.tenantFieldLbl}>Lease end date</div>
                            <div style={S.tenantFieldVal}>{activePastTenant.lease_end_date || '—'}</div>
                          </div>
                          <div>
                            <div style={S.tenantFieldLbl}>Payment rating</div>
                            <div style={S.stars}>
                              {activePastTenant.payment_rating > 0 ? '★'.repeat(activePastTenant.payment_rating) + '☆'.repeat(5 - activePastTenant.payment_rating) : '—'}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                          <span style={S.cardLink} onClick={() => window.location.href = '/landlord-portal/tenants'}>View Details</span>
                        </div>
                        {pastTenants.length > 1 && (
                          <div style={S.pastNavRow}>
                            <button style={S.pastArrow} onClick={prevPastTenant} aria-label="Previous past tenant"><i className="ti ti-chevron-left" style={{ fontSize: 14 }} aria-hidden="true" /></button>
                            <span style={S.pastCount}>{pastIdx + 1} / {pastTenants.length}</span>
                            <button style={S.pastArrow} onClick={nextPastTenant} aria-label="Next past tenant"><i className="ti ti-chevron-right" style={{ fontSize: 14 }} aria-hidden="true" /></button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
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

            {/* MAINTENANCE / QUICK ACTIONS / DOCUMENT VAULT */}
            <div style={S.row3up}>
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

            <div style={S.footer}>© 2023 UrbanNest Property Management. All Rights Reserved.</div>
          </div>
        </main>
      </div>

      {addServiceOpen && (
        <AddServiceModal
          unitNumber={loading ? '' : unit.unit_number}
          ownedServices={ownedServicesForModal}
          assignedIds={assignedServiceIds}
          onClose={() => setAddServiceOpen(false)}
          onAdd={handleAddServices}
        />
      )}
    </div>
  );
}
