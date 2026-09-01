// Intended path: src/pages/Landlord/LandlordSettingsPage.jsx
// Route: /landlord-portal/settings
//
// Built FE-first against mock data per SVC_011 / ARCH_001 — wireframes for
// both tabs were reviewed and frozen in Session 40 before this file was
// written (settings_bank_accounts_wireframe.html, settings_services_wireframe.html).
//
// landlordTokens.js was shared after this file was first built — every C.* key used
// below (pageBg, topbarBg, topbarBdr, txtPrimary, txtSec, txtMuted, navBg, blue,
// blueLight, blueDark, cardBg, cardBdr, greenLight, greenDark, red, amber, amberLight,
// stdBg) has been checked against the real export and exists with no changes needed.
//
// Still worth confirming: `activePage="settings"` below is a guess at what NavF
// expects to highlight the Settings nav item, since NavF.jsx itself wasn't
// uploaded this session — please check it matches NavF's actual prop values.
//
// Buy Service now goes through the shared Payment Cart module (src/pages/Payment/)
// instead of completing instantly — see the "PAYMENT CART INTEGRATION" note further
// down for how this page wires into it. That module's buttons come from the existing
// shared <Button> (src/components/ui/Button.jsx), themed with these same landlordTokens
// values via its `style`/`theme` props rather than reimplementing button styling —
// this page's own buttons (+ Add Bank Account, Save, etc.) are unchanged, still the
// raw <button style={S.xxx}> pattern already used throughout the other Landlord pages.

import React, { useState } from 'react';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';
import { CustomDropdown } from '../../components/ui';
import { usePaymentCart } from '../Payment/PaymentCartContext';
import PaymentCartTrigger from '../Payment/PaymentCartTrigger';
import PaymentCartModal from '../Payment/PaymentCartModal';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

const initials = n => (n || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─── Static placeholder data ──────────────────────────────────────────────────
// Not yet wired to a backend model — mirrors the same precedent used for
// LEDGER_ROWS / QA_ITEMS / DOC_ITEMS on the other Landlord pages. OwnerBankAccount
// CRUD (SVC-6) and the Service Catalog read endpoint are both pending backend work;
// this page is intentionally built FE-first against mock data per SVC_011.
const MOCK_BANK_ACCOUNTS = [
  { id: 'ba1', bank_name: 'Chase Bank',       holder_name: 'Sarah Palin', account_last4: '4821', currency: 'USD', country: 'United States', is_default: true  },
  { id: 'ba2', bank_name: 'Bank of America',  holder_name: 'Sarah Palin', account_last4: '0093', currency: 'USD', country: 'United States', is_default: false },
  { id: 'ba3', bank_name: 'Wells Fargo',      holder_name: 'Sarah Palin', account_last4: '7742', currency: 'USD', country: 'United States', is_default: false },
];

// Services are now real — fetched from GET /landlord/services/catalog/
// (Session 40, second pass) and normalized below via normalizeService().
// MOCK_SERVICES is gone; requiresBankAccount now reflects the real
// UNService.requires_payment_collection field instead of a "pending" chip.

// ref: UNService.price_unit choices (core/models.py)
const PRICE_UNIT_LABELS = {
  PER_UNIT: '/ Unit',
  PER_MONTH: '/ Month',
  PER_PROPERTY: '/ Property',
  FLAT_FEE: '/ Flat Fee',
};

// UNService has no dedicated "icon" or short marketing "tag" field yet —
// every card uses the same glyph, and the tag line reuses short_description
// (so it echoes the description below it). Cosmetic gap only, until the
// catalog model grows those fields; flagging rather than inventing fake data.
const SERVICE_FALLBACK_ICON = 'ti-adjustments';

// image.url from the backend is host-relative (e.g. "/media/services/x.png")
// — resolve it against the API's origin, not API_BASE (which includes /api).
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const formatPrice = price => {
  const n = Number(price) || 0;
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
};

const formatOwnedSince = isoString => {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function normalizeService(s) {
  return {
    id: s.id,
    name: s.name,
    tag: s.short_description,
    shortDesc: s.short_description,
    longDesc: s.long_description,
    image: s.image ? (String(s.image).startsWith('http') ? s.image : `${API_ORIGIN}${s.image}`) : null,
    icon: SERVICE_FALLBACK_ICON,
    price: formatPrice(s.price),
    priceUnit: PRICE_UNIT_LABELS[s.price_unit] || s.price_unit,
    requiresPayment: !!s.requires_payment_collection,
    requiresBankAccount: !!s.requires_payment_collection,
    owned: !!s.owned,
    ownedSince: formatOwnedSince(s.owned_since),
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  shell:    { display: 'flex', height: '100vh', fontFamily: F.sans, background: C.pageBg, overflow: 'hidden' },
  main:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:   { background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  topTitle: { fontSize: 14, fontWeight: 600, color: C.txtPrimary },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn:  { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtSec, cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 16 },
  avatar:   { width: 32, height: 32, borderRadius: '50%', background: C.navBg, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1, overflowY: 'auto', padding: '20px 28px 40px' },

  pageHdrRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 },
  pageTitle:{ fontSize: 20, fontWeight: 700, color: C.txtPrimary, margin: '0 0 4px' },
  pageSub:  { fontSize: 13, color: C.txtMuted, margin: '0 0 20px' },

  tabstrip: { display: 'flex', gap: 4, borderBottom: `1px solid ${C.cardBdr}`, marginBottom: 22 },
  tab:      (active) => ({ padding: '10px 18px', fontSize: 13.5, fontWeight: 600, color: active ? C.txtPrimary : C.txtMuted, borderBottom: active ? `2px solid ${C.blue}` : '2px solid transparent', cursor: 'pointer' }),

  sectionHdr:  { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 14px' },
  sectionHdr2: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 0 14px' },
  sectionH2: { fontSize: 15, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  sectionCount: { fontSize: 12.5, color: C.txtMuted },

  btnPrimary: { background: C.navBg, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.sans },
  btnSecondary: { background: '#fff', color: C.txtPrimary, border: `1px solid ${C.cardBdr}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.sans },

  // BANK ACCOUNTS — 2 per row (1×2), per approval
  bankGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  bankCard: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 },
  bankLeft: { display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 },
  bankIcon: { width: 34, height: 34, borderRadius: 8, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.blueDark, flexShrink: 0 },
  bankName: { fontSize: 13.5, fontWeight: 700, color: C.txtPrimary, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  bankSub:  { fontSize: 11.5, color: C.txtMuted, marginTop: 3, lineHeight: 1.5 },
  pillDefault: { background: C.greenLight, color: C.greenDark, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
  bankActions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${C.cardBdr}`, paddingTop: 10 },
  iconBtnSm: { width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.cardBdr}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, color: C.txtSec, cursor: 'pointer', flexShrink: 0 },
  iconBtnDanger: { color: C.red },
  linkBtn:  { fontSize: 11.5, fontWeight: 600, color: C.blue, cursor: 'pointer', marginRight: 'auto' },

  emptyState: { background: C.cardBg, border: `1px dashed ${C.cardBdr}`, borderRadius: 10, padding: '48px 24px', textAlign: 'center' },
  emptyIcon:  { width: 48, height: 48, borderRadius: '50%', background: C.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20, color: C.txtMuted },
  emptyH3:    { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary, margin: '0 0 6px' },
  emptyP:     { fontSize: 12.5, color: C.txtMuted, maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.6 },

  // SERVICES — 3 per row
  svcGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  svcCard:  { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  svcMedia: { position: 'relative', height: 130, backgroundSize: 'cover', backgroundPosition: 'center' },
  svcMediaPlaceholder: { background: C.navBg, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  svcIconGlyph: { width: 40, height: 40, borderRadius: 8, border: `2px solid ${C.blue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', background: 'rgba(255,255,255,0.08)' },
  svcBadge: { position: 'absolute', top: 10, right: 10, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  svcBadgeOwned: { background: C.greenLight, color: C.greenDark },
  svcBadgePrice: { background: C.navBg, color: '#fff' },
  svcBody:  { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  svcTitle: { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary },
  svcTag:   { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted },
  svcDesc:  { fontSize: 12.5, color: C.txtSec, lineHeight: 1.5, flex: 1 },
  svcBtn:   { marginTop: 10, textAlign: 'center', padding: 9, borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 },
  svcBtnBuy:  { background: C.navBg, color: '#fff' },
  svcBtnView: { background: '#fff', border: `1px solid ${C.cardBdr}`, color: C.txtPrimary },
  svcBtnInCart: { background: C.greenLight, color: C.greenDark },

  // MODALS
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,27,46,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px', overflowY: 'auto', zIndex: 1000 },

  modal:    { background: '#fff', borderRadius: 12, width: 440, maxWidth: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  modalH3:  { margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.txtPrimary },
  modalSub: { fontSize: 12.5, color: C.txtMuted, margin: '0 0 18px' },
  field:    { marginBottom: 14 },
  fieldLbl: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: C.txtPrimary },
  fieldInput: { width: '100%', padding: '9px 10px', border: `1px solid ${C.cardBdr}`, borderRadius: 7, fontSize: 13, fontFamily: F.sans, color: C.txtPrimary, background: '#fff', boxSizing: 'border-box' },
  fieldRow: { display: 'flex', gap: 10 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.txtPrimary, margin: '4px 0 20px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },

  svcModal:      { background: '#fff', borderRadius: 12, width: 760, maxWidth: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  svcModalHero:  { position: 'relative', height: 200, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end' },
  svcModalHeroPlaceholder: { background: C.navBg },
  svcModalHeroTitle: { color: '#fff', fontSize: 24, fontWeight: 700, padding: '18px 24px', textShadow: '0 2px 8px rgba(0,0,0,0.4)' },
  svcModalClose: { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', border: 'none' },
  svcModalBody:  { display: 'flex' },
  svcModalLeft:  { flex: 1.5, padding: '22px 24px', borderRight: `1px solid ${C.cardBdr}` },
  svcModalRight: { flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  metaLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, marginBottom: 4 },
  bodyLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txtMuted, margin: '0 0 6px' },
  bodyText:  { fontSize: 13, lineHeight: 1.6, color: C.txtPrimary, margin: '0 0 18px' },
  statusPillOwned: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: C.greenLight, color: C.greenDark },
  statusPillNotOwned: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: C.stdBg, color: C.txtMuted },
  flagChip: { fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6, display: 'inline-block' },
  flagChipYes: { background: C.amberLight, color: C.amber },
  flagChipNo:  { background: C.stdBg, color: C.txtMuted },
  flagChipPending: { background: C.blueLight, color: C.blueDark, border: `1px dashed ${C.cardBdr}` },
  priceBig: { fontSize: 22, fontWeight: 700, color: C.txtPrimary },
  priceUnit:{ fontSize: 12, fontWeight: 600, color: C.txtMuted },
  svcModalFooter: { padding: '16px 24px', borderTop: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  svcModalFooterNote: { fontSize: 11.5, color: C.txtMuted, maxWidth: 380, lineHeight: 1.5 },

  footer: { textAlign: 'center', fontSize: 11, color: C.txtMuted, padding: '16px 0', borderTop: `1px solid ${C.cardBdr}`, margin: '20px 0 0' },
};

// ─── Bank Account modal (Add / Edit) ──────────────────────────────────────────
function BankAccountModal({ account, hasOtherAccounts, onClose, onSave }) {
  const isEdit = !!account;
  const [form, setForm] = useState({
    holder_name: account?.holder_name || '',
    bank_name: account?.bank_name || '',
    account_number: '',
    routing_number: '',
    currency: account?.currency || 'USD',
    country: account?.country || 'United States',
    is_default: account ? account.is_default : !hasOtherAccounts,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h3 style={S.modalH3}>{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}</h3>
        <p style={S.modalSub}>This is where rent and service payouts will be sent.</p>

        <div style={S.field}>
          <label style={S.fieldLbl}>Account Holder Name</label>
          <input style={S.fieldInput} type="text" placeholder="Sarah Palin" value={form.holder_name} onChange={e => set('holder_name', e.target.value)} />
        </div>
        <div style={S.field}>
          <label style={S.fieldLbl}>Bank Name</label>
          <input style={S.fieldInput} type="text" placeholder="e.g. Chase Bank" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} />
        </div>
        <div style={S.field}>
          <label style={S.fieldLbl}>Account Number</label>
          <input style={S.fieldInput} type="text" placeholder="•••• •••• •••• ••••" value={form.account_number} onChange={e => set('account_number', e.target.value)} />
        </div>
        <div style={S.fieldRow}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Routing Number</label>
            <input style={S.fieldInput} type="text" placeholder="e.g. 021000021" value={form.routing_number} onChange={e => set('routing_number', e.target.value)} />
          </div>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Currency</label>
            <CustomDropdown
              options={[{ value: 'USD', label: 'USD' }]}
              value={form.currency}
              onChange={v => set('currency', v)}
              placeholder="Select currency…"
            />
          </div>
        </div>
        <div style={S.field}>
          <label style={S.fieldLbl}>Country</label>
          <CustomDropdown
            options={[{ value: 'United States', label: 'United States' }]}
            value={form.country}
            onChange={v => set('country', v)}
            placeholder="Select country…"
          />
        </div>
        <div style={S.checkboxRow}>
          <input
            type="checkbox"
            checked={form.is_default}
            disabled={!hasOtherAccounts}
            onChange={e => set('is_default', e.target.checked)}
          />
          <span>Set as default bank account{!hasOtherAccounts ? ' (only account — always default)' : ''}</span>
        </div>
        <div style={S.modalActions}>
          <button style={S.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={S.btnPrimary} onClick={() => onSave(form)}>Save Bank Account</button>
        </div>
      </div>
    </div>
  );
}

// ─── Service detail modal ─────────────────────────────────────────────────────
function ServiceDetailModal({ service, inCart, onClose, onAddToCart }) {
  const heroStyle = service.image
    ? { ...S.svcModalHero, backgroundImage: `url(${service.image})` }
    : { ...S.svcModalHero, ...S.svcModalHeroPlaceholder };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.svcModal} onClick={e => e.stopPropagation()}>
        <div style={heroStyle}>
          <button style={S.svcModalClose} onClick={onClose} aria-label="Close">✕</button>
          <div style={S.svcModalHeroTitle}>{service.name}</div>
        </div>
        <div style={S.svcModalBody}>
          <div style={S.svcModalLeft}>
            <div style={S.bodyLabel}>Short Description</div>
            <p style={S.bodyText}>{service.shortDesc}</p>
            <div style={S.bodyLabel}>Detailed Description</div>
            <p style={S.bodyText}>{service.longDesc}</p>
          </div>
          <div style={S.svcModalRight}>
            <div>
              <div style={S.metaLabel}>Your Status</div>
              {service.owned
                ? <span style={S.statusPillOwned}>✓ Owned{service.ownedSince ? ` since ${service.ownedSince}` : ''}</span>
                : <span style={S.statusPillNotOwned}>○ Not Purchased</span>}
            </div>
            <div>
              <div style={S.metaLabel}>Requires Payment to Activate</div>
              <span style={{ ...S.flagChip, ...(service.requiresPayment ? S.flagChipYes : S.flagChipNo) }}>
                {service.requiresPayment ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <div style={S.metaLabel}>Requires Bank Account</div>
              <span style={{ ...S.flagChip, ...(service.requiresBankAccount ? S.flagChipYes : S.flagChipNo) }}>
                {service.requiresBankAccount ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <div style={S.metaLabel}>Pricing Model</div>
              <div style={S.priceBig}>{service.price} <span style={S.priceUnit}>{service.priceUnit}</span></div>
            </div>
          </div>
        </div>
        <div style={S.svcModalFooter}>
          <div style={S.svcModalFooterNote}>
            {service.owned
              ? 'Already on your account. To use it on a specific unit, add it from that unit’s page.'
              : inCart
              ? 'This is in your cart — open the Cart to review and confirm the purchase.'
              : 'Adds this to your cart. Nothing is purchased until you confirm from the Cart — you’ll choose which units it applies to separately, from each unit’s page.'}
          </div>
          {!service.owned && (
            <button
              style={inCart ? { ...S.btnPrimary, ...S.svcBtnInCart } : S.btnPrimary}
              disabled={inCart}
              onClick={() => onAddToCart(service)}
            >
              {inCart ? '✓ In Cart' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandlordSettingsPage() {
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' | 'services'
  const [currentUser, setCurrentUser] = useState(null);

  const [bankAccounts, setBankAccounts] = useState(MOCK_BANK_ACCOUNTS);
  const [bankModal, setBankModal] = useState(null); // null | 'add' | account object (edit)

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [openService, setOpenService] = useState(null);

  // Fetches the real catalog (GET /landlord/services/catalog/) — each entry
  // already carries `owned`/`owned_since` from the backend, so no second
  // round-trip against LandlordAccountService is needed here. Reused after a
  // purchase confirms, so "owned" reflects the database rather than a local
  // guess.
  const fetchCatalog = React.useCallback(() => {
    const token = localStorage.getItem('access_token');
    setServicesError(null);
    return fetch(`${API_BASE}/landlord/services/catalog/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setServices((j.services || []).map(normalizeService)))
      .catch(() => setServicesError('Could not load services. Please refresh the page.'))
      .finally(() => setServicesLoading(false));
  }, []);

  React.useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  // ─── PAYMENT CART INTEGRATION ─────────────────────────────────────────────
  // Cart state/UI live in src/pages/Payment/ (PaymentCartContext, -Trigger,
  // -Modal) so any future module can reuse the same checkout flow. This page
  // only supplies: (1) how a service becomes a cart line item, and (2) what
  // "Confirm & Pay" actually does once the cart confirms a purchase — the
  // cart module itself has no idea what a "service" is.
  const { addItem, isInCart } = usePaymentCart();
  const [cartOpen, setCartOpen] = useState(false);

  // Only a flat-fee service actually costs anything the moment it's bought —
  // a per-unit/per-property service (SVC_001/§4.2: buying only creates the
  // account-level entitlement) charges $0 today and only bills once it's
  // assigned to a unit. The cart itself doesn't know this rule — it just sums
  // whatever amountDueToday each item is given (see PaymentCartContext.jsx).
  const serviceToCartItem = service => {
    const numericPrice = Number((service.price || '').replace(/[^0-9.]/g, '')) || 0;
    const isFlatFee = /flat fee/i.test(service.priceUnit || '');
    return {
      id: service.id,
      name: service.name,
      subtitle: service.tag,
      icon: service.icon,
      priceLabel: `${service.price} ${service.priceUnit}`,
      amountDueToday: isFlatFee ? numericPrice : 0,
      moduleKey: 'landlord-service',
      meta: service,
    };
  };

  const addToCart = service => {
    addItem(serviceToCartItem(service));
    setOpenService(null);
  };

  // Called by PaymentCartModal's "Confirm & Pay", once, with only the items
  // the landlord left checked. No real payment gateway exists yet — the mock
  // checkout screen (see PaymentCartModal's footer note) still stands in for
  // that, but the entitlement it grants is now real: this POSTs to
  // LandlordAccountService (SVC-1) and, on success, re-fetches the catalog so
  // "owned" reflects the database. Throws on failure so PaymentCartModal can
  // show the error and leave the item in the cart to retry, instead of
  // silently completing as if it purchased.
  const handleConfirmPurchase = async checkedItems => {
    const serviceIds = checkedItems
      .filter(i => i.moduleKey === 'landlord-service')
      .map(i => i.id);
    if (serviceIds.length === 0) return;

    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE}/landlord/account/services/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_ids: serviceIds }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Could not complete this purchase. Please try again.');
    }
    await fetchCatalog();
  };

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setCurrentUser(j.user || j))
      .catch(() => {});
  }, []);

  const userLabel = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email
    : '';

  const ownedServices = services.filter(s => s.owned);
  const availableServices = services.filter(s => !s.owned);

  const setDefaultAccount = id => {
    setBankAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
  };

  const saveBankAccount = form => {
    // TODO(backend): POST/PATCH OwnerBankAccount once SVC-6 lands.
    if (bankModal === 'add') {
      const newAccount = {
        id: `ba${Date.now()}`,
        bank_name: form.bank_name,
        holder_name: form.holder_name,
        account_last4: (form.account_number || '').slice(-4) || '0000',
        currency: form.currency,
        country: form.country,
        is_default: form.is_default,
      };
      setBankAccounts(prev => {
        const next = form.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev;
        return [...next, newAccount];
      });
    } else if (bankModal && bankModal.id) {
      setBankAccounts(prev => prev.map(a => {
        if (a.id !== bankModal.id) return form.is_default ? { ...a, is_default: false } : a;
        return { ...a, bank_name: form.bank_name, holder_name: form.holder_name, currency: form.currency, country: form.country, is_default: form.is_default };
      }));
    }
    setBankModal(null);
  };

  return (
    <div style={S.shell}>
      {/* NOTE: 'settings' is assumed to be the correct activePage key for NavF's
          Settings nav item — please confirm against NavF.jsx. */}
      <NavF activePage="settings" />

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
          <div style={S.pageHdrRow}>
            <div>
              <h1 style={S.pageTitle}>Settings</h1>
              <p style={S.pageSub}>Manage your bank accounts and platform services</p>
            </div>
            <PaymentCartTrigger
              onClick={() => setCartOpen(true)}
              theme={{ txtPrimary: C.txtPrimary, cardBdr: C.cardBdr, font: F.sans }}
            />
          </div>

          <div style={S.tabstrip}>
            <div style={S.tab(activeTab === 'bank')} onClick={() => setActiveTab('bank')}>Bank Accounts</div>
            <div style={S.tab(activeTab === 'services')} onClick={() => setActiveTab('services')}>Services</div>
          </div>

          {/* ─── BANK ACCOUNTS TAB ─── */}
          {activeTab === 'bank' && (
            <>
              <div style={S.sectionHdr}>
                <div style={S.sectionH2}>Your Bank Accounts</div>
                <button style={S.btnPrimary} onClick={() => setBankModal('add')}>+ Add Bank Account</button>
              </div>

              {bankAccounts.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={S.emptyIcon}><i className="ti ti-building-bank" aria-hidden="true" /></div>
                  <h3 style={S.emptyH3}>No bank accounts added yet</h3>
                  <p style={S.emptyP}>Some services collect rent or deposits on your behalf and need a bank account to remit to. Add one now, or you'll be prompted the first time you add a service that needs it.</p>
                  <button style={S.btnPrimary} onClick={() => setBankModal('add')}>+ Add Bank Account</button>
                </div>
              ) : (
                <div style={S.bankGrid}>
                  {bankAccounts.map(a => (
                    <div key={a.id} style={S.bankCard}>
                      <div style={S.bankLeft}>
                        <div style={S.bankIcon}><i className="ti ti-building-bank" aria-hidden="true" /></div>
                        <div style={{ minWidth: 0 }}>
                          <div style={S.bankName}>
                            {a.bank_name}
                            {a.is_default && <span style={S.pillDefault}>Default</span>}
                          </div>
                          <div style={S.bankSub}>{a.holder_name} · •••• •••• •••• {a.account_last4} · {a.currency} · {a.country}</div>
                        </div>
                      </div>
                      <div style={S.bankActions}>
                        {!a.is_default && <span style={S.linkBtn} onClick={() => setDefaultAccount(a.id)}>Set as default</span>}
                        <span style={S.iconBtnSm} onClick={() => setBankModal(a)} aria-label="Edit"><i className="ti ti-pencil" aria-hidden="true" /></span>
                        <span style={{ ...S.iconBtnSm, ...S.iconBtnDanger }} aria-label="Delete"><i className="ti ti-trash" aria-hidden="true" /></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── SERVICES TAB ─── */}
          {activeTab === 'services' && servicesLoading && (
            <div style={{ fontSize: 12.5, color: C.txtMuted, padding: '24px 0' }}>Loading services…</div>
          )}
          {activeTab === 'services' && !servicesLoading && servicesError && (
            <div style={{ ...S.emptyState, marginBottom: 20 }}>
              <p style={S.emptyP}>{servicesError}</p>
              <button style={S.btnPrimary} onClick={fetchCatalog}>Retry</button>
            </div>
          )}
          {activeTab === 'services' && !servicesLoading && !servicesError && (
            <>
              <div style={S.sectionHdr}>
                <div style={S.sectionH2}>Your Services</div>
                <span style={S.sectionCount}>{ownedServices.length} of {services.length} active on your account</span>
              </div>
              <div style={S.svcGrid}>
                {ownedServices.map(s => (
                  <div key={s.id} style={S.svcCard} onClick={() => setOpenService(s)}>
                    {s.image ? (
                      <div style={{ ...S.svcMedia, backgroundImage: `url(${s.image})` }}>
                        <span style={{ ...S.svcBadge, ...S.svcBadgeOwned }}>✓ Owned</span>
                      </div>
                    ) : (
                      <div style={{ ...S.svcMedia, ...S.svcMediaPlaceholder }}>
                        <div style={S.svcIconGlyph}><i className={`ti ${s.icon}`} aria-hidden="true" /></div>
                        <span style={{ ...S.svcBadge, ...S.svcBadgeOwned }}>✓ Owned</span>
                      </div>
                    )}
                    <div style={S.svcBody}>
                      <div style={S.svcTag}>{s.tag}</div>
                      <div style={S.svcTitle}>{s.name}</div>
                      <div style={S.svcDesc}>{s.shortDesc}</div>
                      <div style={{ ...S.svcBtn, ...S.svcBtnView }}>VIEW DETAILS</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={S.sectionHdr2}>
                <div style={S.sectionH2}>Available Services</div>
                <span style={S.sectionCount}>{availableServices.length} not yet purchased</span>
              </div>
              <div style={S.svcGrid}>
                {availableServices.map(s => {
                  const inCart = isInCart(s.id);
                  return (
                    <div key={s.id} style={S.svcCard} onClick={() => setOpenService(s)}>
                      {s.image ? (
                        <div style={{ ...S.svcMedia, backgroundImage: `url(${s.image})` }}>
                          <span style={{ ...S.svcBadge, ...S.svcBadgePrice }}>{s.price}{s.priceUnit}</span>
                        </div>
                      ) : (
                        <div style={{ ...S.svcMedia, ...S.svcMediaPlaceholder }}>
                          <div style={S.svcIconGlyph}><i className={`ti ${s.icon}`} aria-hidden="true" /></div>
                          <span style={{ ...S.svcBadge, ...S.svcBadgePrice }}>{s.price}{s.priceUnit}</span>
                        </div>
                      )}
                      <div style={S.svcBody}>
                        <div style={S.svcTag}>{s.tag}</div>
                        <div style={S.svcTitle}>{s.name}</div>
                        <div style={S.svcDesc}>{s.shortDesc}</div>
                        <div
                          style={{ ...S.svcBtn, ...(inCart ? S.svcBtnInCart : S.svcBtnBuy) }}
                          onClick={e => { e.stopPropagation(); if (!inCart) addToCart(s); }}
                        >
                          {inCart ? '✓ IN CART' : 'BUY SERVICE'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div style={S.footer}>© 2023 UrbanNest Property Management. All Rights Reserved.</div>
        </main>
      </div>

      {bankModal && (
        <BankAccountModal
          account={bankModal === 'add' ? null : bankModal}
          hasOtherAccounts={bankAccounts.length > 0}
          onClose={() => setBankModal(null)}
          onSave={saveBankAccount}
        />
      )}

      {openService && (
        <ServiceDetailModal
          service={openService}
          inCart={isInCart(openService.id)}
          onClose={() => setOpenService(null)}
          onAddToCart={addToCart}
        />
      )}

      {cartOpen && (
        <PaymentCartModal
          onClose={() => setCartOpen(false)}
          onConfirm={handleConfirmPurchase}
          theme={{
            navBg: C.navBg, cardBg: C.cardBg, cardBdr: C.cardBdr,
            txtPrimary: C.txtPrimary, txtSec: C.txtSec, txtMuted: C.txtMuted,
            blue: C.blue, blueLight: C.blueLight, blueDark: C.blueDark,
            greenLight: C.greenLight, greenDark: C.greenDark, red: C.red,
            font: F.sans,
          }}
        />
      )}
    </div>
  );
}
