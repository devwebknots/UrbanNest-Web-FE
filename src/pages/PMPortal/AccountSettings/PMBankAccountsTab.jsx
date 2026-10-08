// PMBankAccountsTab.jsx — PM Portal: Account Settings → Bank Accounts
// Route: /pm-portal/account/bank-accounts
//
// Session 49, Phase 2 (full functional parity round) — this tab was a
// sample-data stub before this round (see git history / backlog note on
// the original build). Rebuilt against real backend endpoints added this
// same round in independent_pm/views.py + independent_pm/urls.py.
//
// Three sub-tabs, per the reviewer's own description of the real bank
// account model shape (properties/models.py — PMBankAccount,
// PropertyBankAccount, UnitBankAccount all already existed; only the PM-
// facing API around them was missing):
//
//   PM Account      — PMBankAccount, full CRUD, this PM's own accounts.
//                      GET/POST /api/pm/bank-accounts/,
//                      PATCH/DELETE /api/pm/bank-accounts/<id>/.
//                      Visual/interaction pattern ported from Landlord's
//                      Bank Accounts tab (LandlordSettingsPage.jsx) — the
//                      bank-row list, default pill, Add/Edit modal, and
//                      Account Details panel are all the same shape. Two
//                      purely-decorative Landlord additions were NOT
//                      ported: the fabricated "Corporate Card"
//                      network/expiry visual and the sample "Payout
//                      Telemetry" preview card — both explicitly invented,
//                      illustrative-only content on Landlord's own page
//                      (see that file's own comments on
//                      getFakeCardDetails/bankTelemetryCard), and PM's
//                      accounts don't represent the same "cards" framing
//                      (rent payouts to a landlord) to begin with. Colors/
//                      fonts use PM Portal's own established tokens (Noto
//                      Serif/Nunito Sans/#002D5B — same as every other PM
//                      Portal page, including the other 5 Account Settings
//                      tabs built this session) rather than Landlord's
//                      Inter/navy tokens, so this page stays visually
//                      consistent with the rest of PM Portal it lives
//                      inside, rather than switching design systems
//                      mid-portal. Flagging this explicitly since "exactly
//                      as Landlord" was the instruction — this is a
//                      judgment call on "exactly" meaning layout/pattern/
//                      polish, not literal brand colors.
//
//   Property Owner   — PropertyBankAccount rows across every property this
//                       PM manages. GET/PATCH
//                       /api/pm/bank-accounts/property-owners/. PM-fillable
//                       modules (Property Operating, Property Reserve, PM
//                       Operating, PM Trust, Rent Collection, Security
//                       Deposit) are reassignable here, per the reviewer's
//                       explicit instruction. Owner Settlement rows are
//                       locked — shown, not editable — since that account
//                       is filled by the property owner via Landlord
//                       Portal, not by the PM (the model's own comment is
//                       explicit about this split).
//
//   Unit Owner        — same idea, UnitBankAccount across every unit under
//                        those properties. GET/PATCH
//                        /api/pm/bank-accounts/unit-owners/. Unit Reserve
//                        is reassignable; Owner Settlement is locked for
//                        the same reason as above.
//
// No Landlord page has a 3-way split like this (OwnerBankAccount is 1:1
// with its owner, nothing to aggregate across properties) — the Property
// Owner / Unit Owner tabs are new UI, built in the same visual language
// (card/table treatment, lock icon + tooltip for non-editable rows) as the
// rest of this page rather than copied from anywhere, since nothing to
// copy exists on the Landlord side for this part.

import React, { useState, useEffect, useCallback } from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';
import AccountSettingsSubnav from './AccountSettingsSubnav';
import { CustomDropdown } from '../../../components/ui';

const C = {
  primary:      '#002D5B',
  primaryLight: '#E8EEF4',
  pageBg:       '#F8FAFC',
  white:        '#FFFFFF',
  border:       'rgba(0,0,0,0.06)',
  borderMedium: 'rgba(0,0,0,0.10)',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  green:        '#16A34A',
  greenBg:      '#F0FDF4',
  greenBorder:  '#BBF7D0',
  red:          '#DC2626',
  redBg:        '#FEF2F2',
  amber:        '#92400E',
  amberBg:      '#FEF3C7',
  amberBorder:  '#FCD34D',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });

// Real bank logos for the PM Account row — ported from Landlord's own
// Bank Accounts tab (LandlordSettingsPage.jsx): bank_name is free text the
// PM typed in (PMBankAccount has no institution-id/enum to key off), so
// this only resolves for institutions in this curated name→domain map. An
// unrecognized name (a small regional bank, a credit union, a typo) falls
// back to the generic ti-building-bank icon rather than guessing — same
// "don't fabricate" rule as account_type_display elsewhere on this tab.
// Uses Google's public favicon CDN (keyless, free) to fetch each bank's
// real favicon — real artwork, not fabricated, though lower-fidelity than
// a proper wordmark logo.
const BANK_LOGO_FAVICON_SIZE = 128;
const BANK_LOGO_DOMAINS = {
  'chase': 'chase.com', 'chase bank': 'chase.com', 'jpmorgan chase': 'chase.com', 'jpmorgan': 'chase.com',
  'bank of america': 'bankofamerica.com', 'bofa': 'bankofamerica.com',
  'wells fargo': 'wellsfargo.com',
  'citibank': 'citibank.com', 'citi': 'citibank.com',
  'american express': 'americanexpress.com', 'amex': 'americanexpress.com',
  'capital one': 'capitalone.com',
  'us bank': 'usbank.com', 'u.s. bank': 'usbank.com',
  'pnc': 'pnc.com', 'pnc bank': 'pnc.com',
  'td bank': 'td.com',
  'truist': 'truist.com', 'truist bank': 'truist.com',
  'regions': 'regions.com', 'regions bank': 'regions.com',
  'fifth third': '53.com', 'fifth third bank': '53.com',
  'ally': 'ally.com', 'ally bank': 'ally.com',
  'discover': 'discover.com', 'discover bank': 'discover.com',
  'hsbc': 'hsbc.com',
  'citizens bank': 'citizensbank.com', 'citizens': 'citizensbank.com',
  'keybank': 'key.com', 'key bank': 'key.com',
  'synchrony': 'synchronybank.com', 'synchrony bank': 'synchronybank.com',
  'navy federal': 'navyfederal.org', 'navy federal credit union': 'navyfederal.org',
  'usaa': 'usaa.com',
  'charles schwab': 'schwab.com', 'schwab': 'schwab.com',
  'goldman sachs': 'goldmansachs.com', 'marcus': 'marcus.com', 'marcus by goldman sachs': 'marcus.com',
  'santander': 'santanderbank.com', 'santander bank': 'santanderbank.com',
  'first republic': 'firstrepublic.com', 'first republic bank': 'firstrepublic.com',
  'huntington': 'huntington.com', 'huntington bank': 'huntington.com',
  'bmo': 'bmo.com', 'bmo harris': 'bmo.com',
  'comerica': 'comerica.com', 'comerica bank': 'comerica.com',
  'm&t bank': 'mtb.com', 'mt bank': 'mtb.com',
};
function getBankLogoUrl(bankName) {
  if (!bankName) return null;
  const name = bankName.trim().toLowerCase();
  // Exact match first (the common case). PM-entered names are often
  // longer free text that embeds a recognized bank name alongside other
  // words — "Wells Fargo Business", "Chase Business Banking" — so fall
  // back to a substring match, preferring the longest key that matches
  // (so "chase bank" wins over the shorter "chase" when both would).
  let domain = BANK_LOGO_DOMAINS[name];
  if (!domain) {
    let bestKey = null;
    for (const key of Object.keys(BANK_LOGO_DOMAINS)) {
      if (name.includes(key) && (!bestKey || key.length > bestKey.length)) bestKey = key;
    }
    domain = bestKey ? BANK_LOGO_DOMAINS[bestKey] : null;
  }
  return domain ? `https://www.google.com/s2/favicons?sz=${BANK_LOGO_FAVICON_SIZE}&domain=${domain}` : null;
}

const S = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body },
  main:  { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 },
  content: { flex: 1, minHeight: 0, padding: '28px 32px', overflowY: 'auto' },
  crumb: { fontSize: 12, color: C.textTertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 },
  h1: { fontFamily: F.headline, fontSize: 26, fontWeight: 500, color: C.primary, margin: '0 0 3px' },
  sub: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 18px', maxWidth: 820 },

  subTabRow: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` },
  subTab: (active) => ({ padding: '9px 16px', fontSize: 13, fontWeight: 600, color: active ? C.textPrimary : C.textTertiary, borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent', cursor: 'pointer' }),

  banner: { background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: 12, color: C.amber, lineHeight: 1.5, display: 'flex', gap: 10, alignItems: 'flex-start' },

  pageRow: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' },
  leftCard: { background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 16, padding: 24, minHeight: 300 },
  sectionTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 4 },
  sectionH2: { fontFamily: F.headline, fontSize: 18, fontWeight: 600, color: C.textPrimary, margin: 0 },
  sectionSub: { fontSize: 11.5, color: C.textTertiary, margin: '10px 0 18px' },
  btnLinkAdd: { background: 'transparent', color: '#3d8ef0', border: 'none', padding: 0, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F.body },

  // Plain dotted-line list (reviewer's "try and see" ask) in place of the
  // earlier bordered/background card-per-row treatment — rows sit flush on
  // the panel background, separated by a dashed rule instead of a boxed
  // card; the selected row keeps a soft tint but no longer draws its own
  // border, and the "Add another account" entry (already dashed-bordered)
  // now reads as a natural continuation of the same dotted visual language.
  grid: { display: 'flex', flexDirection: 'column' },
  row: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', cursor: 'pointer', borderBottom: `1px dashed ${C.borderMedium}` },
  // Matches the info-box background used elsewhere on PM Portal (e.g. the
  // Integrations tab's Merchant Account / Last Reconciliation box) rather
  // than the earlier blue-tinted primaryLight highlight.
  rowSelected: { background: C.pageBg },
  bankIcon: { width: 30, height: 30, borderRadius: 7, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.primary, flexShrink: 0 },
  // Real-logo variant of bankIcon, used when getBankLogoUrl() resolves the
  // row's bank_name — white tile + padding so a colorful/transparent logo
  // sits on a neutral background instead of the generic icon tint.
  bankLogoBox: { width: 30, height: 30, borderRadius: 7, background: C.white, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 4 },
  bankLogoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  rowMid: { flex: 1, minWidth: 0 },
  rowTop: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  bankName: { fontSize: 13, fontWeight: 500, color: C.textPrimary },
  rowSub: { fontSize: 10.5, color: C.textSecondary, marginTop: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  pillDefault: { background: C.greenBg, color: C.green, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' },
  rowRight: { display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 },
  rowIconBtn: { width: 23, height: 23, borderRadius: 6, border: `1px solid ${C.borderMedium}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.textSecondary, cursor: 'pointer', flexShrink: 0 },
  iconBtnDanger: { color: C.red, borderColor: '#fecaca' },
  addCard: { marginTop: 10, border: `1.5px dashed ${C.borderMedium}`, borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: C.textSecondary },
  addIcon: { width: 30, height: 30, borderRadius: 7, background: C.pageBg, color: C.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 },
  addTitle: { fontSize: 12.5, fontWeight: 700, color: C.textPrimary },
  addSub: { fontSize: 10.5, color: C.textTertiary },

  detailsPanel: { background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 16, padding: 22, position: 'sticky', top: 0 },
  detailsLabel: { fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: C.textTertiary, marginBottom: 14 },
  detailRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '9px 0', borderBottom: `1px solid ${C.border}` },
  detailRowLast: { borderBottom: 'none' },
  detailLabel: { color: C.textSecondary },
  detailValue: { fontWeight: 700, color: C.textPrimary, textAlign: 'right' },
  detailValueMono: { fontWeight: 700, color: C.textPrimary, textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  statusActive: { fontSize: 12.5, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 5 },
  linkBtn: { fontSize: 12.5, fontWeight: 700, color: C.primary, cursor: 'pointer' },

  emptyState: { background: C.white, border: `1px dashed ${C.borderMedium}`, borderRadius: 10, padding: '44px 24px', textAlign: 'center' },
  emptyIcon:  { width: 44, height: 44, borderRadius: '50%', background: C.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 19, color: C.textTertiary },
  emptyH3:    { fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: '0 0 6px' },
  emptyP:     { fontSize: 12.5, color: C.textTertiary, maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.6 },

  // Search + every facet dropdown sit in one non-wrapping row, each
  // labeled above its control so the filter stays identifiable even once
  // a value is picked (a selected CustomDropdown shows only the picked
  // label, e.g. "Wells Fargo Business", with nothing else to say which
  // facet that is). Fixed, compact widths on the facets — not a 50/50
  // split — is what keeps the whole bar fitting on one line.
  filterBar: { display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14, flexWrap: 'nowrap' },
  filterField: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  filterFieldLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.textTertiary, whiteSpace: 'nowrap' },
  filterSearchField: { flex: '1 1 200px', minWidth: 130 },
  filterFacetField: { flex: '0 0 148px' },
  filterSearchWrap: { position: 'relative' },
  filterSearchIcon: { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.textTertiary, pointerEvents: 'none' },
  filterSearchInput: { width: '100%', padding: '9px 10px 9px 32px', border: `1px solid ${C.borderMedium}`, borderRadius: 8, fontSize: 12.5, fontFamily: F.body, color: C.textPrimary, background: C.white, boxSizing: 'border-box' },
  filterClear: { fontSize: 11.5, fontWeight: 700, color: C.textTertiary, cursor: 'pointer', whiteSpace: 'nowrap', padding: '9px 0' },

  table: { width: '100%', borderCollapse: 'collapse', background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px', borderBottom: `1px solid ${C.border}` },
  td: { fontSize: 12.5, color: C.textPrimary, padding: '12px 14px', borderBottom: `1px solid ${C.border}` },
  groupHeadTd: { fontSize: 12, fontWeight: 700, color: C.primary, padding: '10px 14px', background: C.pageBg, borderBottom: `1px solid ${C.border}` },
  lockPill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: C.textTertiary },
  unassignedPill: { fontSize: 10.5, fontWeight: 700, color: C.amber, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 20, padding: '2px 8px' },

  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,27,46,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px', overflowY: 'auto', zIndex: 1000 },
  modal:    { background: C.white, borderRadius: 12, width: 440, maxWidth: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
  modalH3:  { margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline },
  modalSub: { fontSize: 12.5, color: C.textTertiary, margin: '0 0 18px' },
  field:    { marginBottom: 14 },
  fieldLbl: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: C.textPrimary },
  fieldInput: { width: '100%', padding: '9px 10px', border: `1px solid ${C.borderMedium}`, borderRadius: 7, fontSize: 13, fontFamily: F.body, color: C.textPrimary, background: C.white, boxSizing: 'border-box' },
  fieldRow: { display: 'flex', gap: 10 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.textPrimary, margin: '4px 0 20px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  btnPrimary: { background: C.primary, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
  btnSecondary: { background: C.white, color: C.textPrimary, border: `1px solid ${C.borderMedium}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
};

function getBankIcon() {
  return <i className="ti ti-building-bank" aria-hidden="true" />;
}

// Sentinel value for the "Assigned Account" filter's "Not Assigned" option
// (an empty string would collide with a real, unset CustomDropdown value).
const UNASSIGNED_FILTER_VALUE = '__unassigned__';
const ALL_FILTER_OPTION = { value: 'all', label: 'All' };
// Dedup + sort unique, non-empty values out of a row list for a filter
// dropdown's option set.
const uniqueOptions = (rows, pick, labelPrefix = '') => {
  const seen = new Set();
  const out = [];
  rows.forEach(r => {
    const v = pick(r);
    if (v === null || v === undefined || v === '') return;
    const key = String(v);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ value: key, label: `${labelPrefix}${key}` });
  });
  out.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  return out;
};

// ─── Add/Edit PM Bank Account modal — ported from Landlord's BankAccountModal ──
function BankAccountModal({ account, hasOtherAccounts, holderName, saving, error, onClose, onSave }) {
  const isEdit = !!account;
  const [form, setForm] = useState({
    bank_name: account?.bank_name || '',
    account_number: '',
    routing_number: '',
    account_type: account?.account_type || 'checking',
    currency: account?.currency || 'USD',
    country: account?.country || 'United States',
    is_default: account ? account.is_default : !hasOtherAccounts,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h3 style={S.modalH3}>{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}</h3>
        <p style={S.modalSub}>This is where your management fee payouts will be sent.</p>

        <div style={S.field}>
          <label style={S.fieldLbl}>Account Holder Name</label>
          <input style={{ ...S.fieldInput, background: C.pageBg, color: C.textTertiary }} type="text" value={holderName} disabled title="The account holder is always your own UrbanNest account name" />
        </div>
        <div style={S.field}>
          <label style={S.fieldLbl}>Bank Name</label>
          <input style={S.fieldInput} type="text" placeholder="e.g. Chase Bank" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} />
        </div>
        <div style={S.field}>
          <label style={S.fieldLbl}>Account Number</label>
          <input
            style={S.fieldInput}
            type="text"
            placeholder={isEdit ? (account?.account_last4 ? `Current: •••• ${account.account_last4} — leave blank to keep` : 'Leave blank to keep the current number') : '•••• •••• •••• ••••'}
            value={form.account_number}
            onChange={e => set('account_number', e.target.value)}
          />
        </div>
        <div style={S.fieldRow}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Routing Number</label>
            <input
              style={S.fieldInput}
              type="text"
              placeholder={isEdit && account?.routing_masked ? `Current: ${account.routing_masked} — leave blank to keep` : 'e.g. 021000021'}
              value={form.routing_number}
              onChange={e => set('routing_number', e.target.value)}
            />
          </div>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Account Type</label>
            <CustomDropdown
              options={[{ value: 'checking', label: 'Checking' }, { value: 'savings', label: 'Savings' }]}
              value={form.account_type}
              onChange={v => set('account_type', v)}
              placeholder="Select account type…"
            />
          </div>
        </div>
        <div style={S.fieldRow}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Currency</label>
            <CustomDropdown options={[{ value: 'USD', label: 'USD' }]} value={form.currency} onChange={v => set('currency', v)} placeholder="Select currency…" />
          </div>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLbl}>Country</label>
            <CustomDropdown options={[{ value: 'United States', label: 'United States' }]} value={form.country} onChange={v => set('country', v)} placeholder="Select country…" />
          </div>
        </div>
        <div style={S.checkboxRow}>
          <input type="checkbox" checked={form.is_default} disabled={!hasOtherAccounts} onChange={e => set('is_default', e.target.checked)} />
          <span>Set as default bank account{!hasOtherAccounts ? ' (only account — always default)' : ''}</span>
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 4, marginBottom: 4 }}>{error}</div>}
        <div style={S.modalActions}>
          <button style={S.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={() => onSave(form)} disabled={saving || !form.bank_name || (!isEdit && !form.account_number)}>
            {saving ? 'Saving…' : 'Save Bank Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reassign modal (Property Owner / Unit Owner tabs) ─────────────────────
function AssignAccountModal({ row, pmAccounts, saving, error, onClose, onSave }) {
  const [pmBankAccountId, setPmBankAccountId] = useState(row.pm_bank_account || '');
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h3 style={S.modalH3}>Assign Bank Account</h3>
        <p style={S.modalSub}>{row.property_name || row.unit_number} — {row.module_display}</p>
        <div style={S.field}>
          <label style={S.fieldLbl}>Your Bank Account</label>
          {pmAccounts.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textTertiary }}>You haven't added any bank accounts yet — add one on the PM Account tab first.</div>
          ) : (
            <CustomDropdown
              options={pmAccounts.map(a => ({ value: String(a.id), label: `${a.nickname || a.bank_name} (••••${a.account_last4})${a.is_default ? ' — Default' : ''}` }))}
              value={String(pmBankAccountId)}
              onChange={v => setPmBankAccountId(v)}
              placeholder="Select an account…"
            />
          )}
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 4, marginBottom: 4 }}>{error}</div>}
        <div style={S.modalActions}>
          <button style={S.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={() => onSave(pmBankAccountId)} disabled={saving || !pmBankAccountId}>
            {saving ? 'Saving…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PMBankAccountsTab() {
  const [subTab, setSubTab] = useState('pm'); // 'pm' | 'property-owners' | 'unit-owners'

  // ── PM Account tab state ──
  const [pmAccounts, setPmAccounts] = useState([]);
  const [pmLoading, setPmLoading] = useState(true);
  const [pmError, setPmError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [bankModal, setBankModal] = useState(null); // null | 'add' | account object
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaveError, setBankSaveError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Property Owner / Unit Owner tab state ──
  const [propRows, setPropRows] = useState([]);
  const [propLoading, setPropLoading] = useState(true);
  const [propError, setPropError] = useState(null);
  const [unitRows, setUnitRows] = useState([]);
  const [unitLoading, setUnitLoading] = useState(true);
  const [unitError, setUnitError] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { row, kind: 'property'|'unit' }
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // ── Property Owner / Unit Owner filters — kept independent per tab so
  // switching tabs doesn't clear what you had set on the other one.
  const [propFilter, setPropFilter] = useState({ q: '', account: 'all', property: 'all' });
  const [unitFilter, setUnitFilter] = useState({ q: '', account: 'all', property: 'all', unit: 'all' });

  const fetchPmAccounts = useCallback(() => {
    setPmLoading(true);
    fetch(`${API_BASE}/pm/bank-accounts/`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error('Could not load your bank accounts.'); return r.json(); })
      .then(data => { setPmAccounts(data); setPmError(null); })
      .catch(e => setPmError(e.message))
      .finally(() => setPmLoading(false));
  }, []);

  const fetchPropRows = useCallback(() => {
    setPropLoading(true);
    fetch(`${API_BASE}/pm/bank-accounts/property-owners/`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error('Could not load property accounts.'); return r.json(); })
      .then(data => { setPropRows(data); setPropError(null); })
      .catch(e => setPropError(e.message))
      .finally(() => setPropLoading(false));
  }, []);

  const fetchUnitRows = useCallback(() => {
    setUnitLoading(true);
    fetch(`${API_BASE}/pm/bank-accounts/unit-owners/`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error('Could not load unit accounts.'); return r.json(); })
      .then(data => { setUnitRows(data); setUnitError(null); })
      .catch(e => setUnitError(e.message))
      .finally(() => setUnitLoading(false));
  }, []);

  useEffect(() => { fetchPmAccounts(); }, [fetchPmAccounts]);
  useEffect(() => { fetchPropRows(); }, [fetchPropRows]);
  useEffect(() => { fetchUnitRows(); }, [fetchUnitRows]);

  const holderName = pmAccounts[0]?.holder_name || '';

  const saveBankAccount = (form) => {
    setBankSaving(true);
    setBankSaveError(null);
    const isEdit = bankModal && bankModal !== 'add';
    const url = isEdit ? `${API_BASE}/pm/bank-accounts/${bankModal.id}/` : `${API_BASE}/pm/bank-accounts/`;
    const method = isEdit ? 'PATCH' : 'POST';
    fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      .then(r => { if (!r.ok) return r.json().then(d => { throw new Error(d.detail || 'Could not save this bank account.'); }); return r.json(); })
      .then(() => { setBankModal(null); fetchPmAccounts(); })
      .catch(e => setBankSaveError(e.message))
      .finally(() => setBankSaving(false));
  };

  const deleteBankAccount = (account) => {
    fetch(`${API_BASE}/pm/bank-accounts/${account.id}/`, { method: 'DELETE', headers: authHeaders() })
      .then(r => { if (!r.ok && r.status !== 204) throw new Error('Could not remove this account.'); })
      .then(() => { setDeleteConfirm(null); if (selectedId === account.id) setSelectedId(null); fetchPmAccounts(); })
      .catch(e => setPmError(e.message));
  };

  const setDefaultAccount = (id) => {
    fetch(`${API_BASE}/pm/bank-accounts/${id}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ is_default: true }) })
      .then(r => { if (!r.ok) throw new Error('Could not set this as default.'); })
      .then(fetchPmAccounts)
      .catch(e => setPmError(e.message));
  };

  const saveAssignment = (pmBankAccountId) => {
    setAssignSaving(true);
    setAssignError(null);
    const { row, kind } = assignModal;
    const base = kind === 'property' ? `${API_BASE}/pm/bank-accounts/property-owners/` : `${API_BASE}/pm/bank-accounts/unit-owners/`;
    fetch(`${base}${row.id}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ pm_bank_account: pmBankAccountId }) })
      .then(r => { if (!r.ok) return r.json().then(d => { throw new Error(d.detail || 'Could not save this assignment.'); }); return r.json(); })
      .then(() => { setAssignModal(null); kind === 'property' ? fetchPropRows() : fetchUnitRows(); })
      .catch(e => setAssignError(e.message))
      .finally(() => setAssignSaving(false));
  };

  const defaultAcct = pmAccounts.find(b => b.is_default) || pmAccounts[0] || null;
  const selectedAccount = pmAccounts.find(a => a.id === selectedId) || defaultAcct;

  // Filters for the Property Owner / Unit Owner tables — three independent
  // facets (Assigned Account, Property, and — Unit Owner only — Unit #)
  // plus a free-text search across those same fields. Facet option lists
  // are built from whatever's actually in that tab's rows, so the
  // dropdowns never offer a property/account/unit that isn't present.
  const propAccountOptions = [ALL_FILTER_OPTION, { value: UNASSIGNED_FILTER_VALUE, label: 'Not Assigned' }, ...uniqueOptions(propRows, r => r.account_display)];
  const propPropertyOptions = [ALL_FILTER_OPTION, ...uniqueOptions(propRows, r => r.property_name)];

  const filteredPropRows = propRows.filter(r => {
    if (propFilter.account !== 'all') {
      if (propFilter.account === UNASSIGNED_FILTER_VALUE) { if (r.account_display) return false; }
      else if (r.account_display !== propFilter.account) return false;
    }
    if (propFilter.property !== 'all' && r.property_name !== propFilter.property) return false;
    const q = propFilter.q.trim().toLowerCase();
    if (q && ![r.property_name, r.account_display].some(v => (v || '').toLowerCase().includes(q))) return false;
    return true;
  });
  // Group property rows by property for the table's group-header rows.
  const propByProperty = filteredPropRows.reduce((acc, r) => {
    (acc[r.property_id] = acc[r.property_id] || { name: r.property_name, rows: [] }).rows.push(r);
    return acc;
  }, {});

  const unitAccountOptions = [ALL_FILTER_OPTION, { value: UNASSIGNED_FILTER_VALUE, label: 'Not Assigned' }, ...uniqueOptions(unitRows, r => r.account_display)];
  const unitPropertyOptions = [ALL_FILTER_OPTION, ...uniqueOptions(unitRows, r => r.property_name)];
  // Unit # options narrow to the selected property, if any, so the
  // dropdown never offers a unit that belongs to a different property.
  const unitNumberPool = unitFilter.property !== 'all' ? unitRows.filter(r => r.property_name === unitFilter.property) : unitRows;
  const unitNumberOptions = [ALL_FILTER_OPTION, ...uniqueOptions(unitNumberPool, r => r.unit_number, 'Unit ')];

  const filteredUnitRows = unitRows.filter(r => {
    if (unitFilter.account !== 'all') {
      if (unitFilter.account === UNASSIGNED_FILTER_VALUE) { if (r.account_display) return false; }
      else if (r.account_display !== unitFilter.account) return false;
    }
    if (unitFilter.property !== 'all' && r.property_name !== unitFilter.property) return false;
    if (unitFilter.unit !== 'all' && String(r.unit_number) !== unitFilter.unit) return false;
    const q = unitFilter.q.trim().toLowerCase();
    if (q && ![r.property_name, r.unit_number, r.account_display].some(v => (v || '').toString().toLowerCase().includes(q))) return false;
    return true;
  });
  const unitByKey = filteredUnitRows.reduce((acc, r) => {
    const key = `${r.property_name} — Unit ${r.unit_number}`;
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});

  return (
    <div style={S.shell}>
      <NavB activeId="account-bank" />
      <div style={S.main}>
        <PMTopBar />
        <div style={S.content}>
          <div style={S.crumb}>
            Account Settings <i className="ti ti-chevron-right" style={{ fontSize: 12 }} aria-hidden="true" />
            <span style={{ color: C.textSecondary }}>Bank Accounts</span>
          </div>
          <h1 style={S.h1}>Bank Accounts</h1>
          <p style={S.sub}>Your own payout accounts, and the accounts linked to the properties and units you manage.</p>

          <AccountSettingsSubnav activeTab="bank" />

          <div style={S.subTabRow}>
            <div style={S.subTab(subTab === 'pm')} onClick={() => setSubTab('pm')}>PM Account</div>
            <div style={S.subTab(subTab === 'property-owners')} onClick={() => setSubTab('property-owners')}>Property Owner</div>
            <div style={S.subTab(subTab === 'unit-owners')} onClick={() => setSubTab('unit-owners')}>Unit Owner</div>
          </div>

          {/* ─── PM ACCOUNT TAB ─── */}
          {subTab === 'pm' && pmLoading && (
            <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '24px 0' }}>Loading your bank accounts…</div>
          )}
          {subTab === 'pm' && !pmLoading && pmError && (
            <div style={{ ...S.emptyState, marginBottom: 20 }}>
              <p style={S.emptyP}>{pmError}</p>
              <button style={S.btnPrimary} onClick={fetchPmAccounts}>Retry</button>
            </div>
          )}
          {subTab === 'pm' && !pmLoading && !pmError && (
            <div style={S.pageRow}>
              <div style={S.leftCard}>
                <div style={S.sectionTop}>
                  <div style={S.sectionH2}>Your Bank Accounts</div>
                  <button style={S.btnLinkAdd} onClick={() => setBankModal('add')}>+ Add Bank Account</button>
                </div>
                <p style={S.sectionSub}>Reused across the properties you manage — the dropdown you see there when assigning a PM Operating, PM Trust, Rent Collection, or Security Deposit account pulls from this list.</p>

                {pmAccounts.length === 0 ? (
                  <div style={S.emptyState}>
                    <div style={S.emptyIcon}><i className="ti ti-building-bank" aria-hidden="true" /></div>
                    <h3 style={S.emptyH3}>No bank accounts added yet</h3>
                    <p style={S.emptyP}>Add your own payout account so it can be assigned to properties and units you manage.</p>
                    <button style={S.btnPrimary} onClick={() => setBankModal('add')}>+ Add Bank Account</button>
                  </div>
                ) : (
                  <div style={S.grid}>
                    {pmAccounts.map(a => {
                      const isSelected = a.id === selectedAccount?.id;
                      const logoUrl = getBankLogoUrl(a.bank_name);
                      return (
                        <div key={a.id} style={{ ...S.row, ...(isSelected ? S.rowSelected : {}) }} onClick={() => setSelectedId(a.id)}>
                          {logoUrl ? (
                            <div style={S.bankLogoBox}>
                              <img
                                src={logoUrl}
                                alt={`${a.bank_name} logo`}
                                style={S.bankLogoImg}
                                // Google's favicon CDN occasionally has
                                // nothing for a domain — fall back to the
                                // generic icon tile rather than a broken image.
                                onError={e => {
                                  e.currentTarget.parentElement.style.display = 'none';
                                  e.currentTarget.parentElement.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            </div>
                          ) : null}
                          <div style={{ ...S.bankIcon, display: logoUrl ? 'none' : 'flex' }}>{getBankIcon()}</div>
                          <div style={S.rowMid}>
                            <div style={S.rowTop}>
                              <span style={S.bankName}>{a.bank_name}</span>
                              {a.is_default && <span style={S.pillDefault}>Default</span>}
                            </div>
                            <div style={S.rowSub}>•••• {a.account_last4 || '····'} · {a.account_type_display || '—'}</div>
                          </div>
                          <div style={S.rowRight}>
                            <span style={S.rowIconBtn} onClick={(e) => { e.stopPropagation(); setBankModal(a); }} aria-label="Edit"><i className="ti ti-pencil" aria-hidden="true" /></span>
                            <span style={{ ...S.rowIconBtn, ...S.iconBtnDanger }} onClick={(e) => { e.stopPropagation(); setDeleteConfirm(a); }} aria-label="Delete"><i className="ti ti-trash" aria-hidden="true" /></span>
                          </div>
                        </div>
                      );
                    })}
                    <div style={S.addCard} onClick={() => setBankModal('add')}>
                      <div style={S.addIcon}><i className="ti ti-plus" aria-hidden="true" /></div>
                      <div>
                        <div style={S.addTitle}>Add another account</div>
                        <div style={S.addSub}>Keep a second account on hand for a different property mix.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={S.detailsPanel}>
                <div style={S.detailsLabel}>Account Details</div>
                {selectedAccount ? (
                  <>
                    <div style={S.detailRow}>
                      <span style={S.detailLabel}>Bank Name</span>
                      <span style={S.detailValue}>{selectedAccount.bank_name}</span>
                    </div>
                    <div style={S.detailRow}>
                      <span style={S.detailLabel}>Account Type</span>
                      <span style={S.detailValue}>{selectedAccount.account_type_display || '—'}</span>
                    </div>
                    <div style={S.detailRow}>
                      <span style={S.detailLabel}>Account #</span>
                      <span style={S.detailValueMono}>•••• {selectedAccount.account_last4 || '····'}</span>
                    </div>
                    <div style={S.detailRow}>
                      <span style={S.detailLabel}>Routing #</span>
                      <span style={S.detailValueMono}>{selectedAccount.routing_masked || '—'}</span>
                    </div>
                    <div style={{ ...S.detailRow, ...S.detailRowLast }}>
                      <span style={S.detailLabel}>Status</span>
                      {selectedAccount.is_default
                        ? <span style={S.statusActive}>● Default</span>
                        : <span style={S.linkBtn} onClick={() => setDefaultAccount(selectedAccount.id)}>✓ Set as default</span>}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: C.textTertiary }}>Select an account to see its details.</p>
                )}
              </div>
            </div>
          )}

          {/* ─── PROPERTY OWNER TAB ─── */}
          {subTab === 'property-owners' && propLoading && (
            <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '24px 0' }}>Loading property accounts…</div>
          )}
          {subTab === 'property-owners' && !propLoading && propError && (
            <div style={{ ...S.emptyState, marginBottom: 20 }}>
              <p style={S.emptyP}>{propError}</p>
              <button style={S.btnPrimary} onClick={fetchPropRows}>Retry</button>
            </div>
          )}
          {subTab === 'property-owners' && !propLoading && !propError && (
            propRows.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}><i className="ti ti-building" aria-hidden="true" /></div>
                <h3 style={S.emptyH3}>No managed properties yet</h3>
                <p style={S.emptyP}>Bank account assignments for the properties you manage will show up here once you have properties set up.</p>
              </div>
            ) : (
              <>
                <div style={S.filterBar}>
                  <div style={{ ...S.filterField, ...S.filterSearchField }}>
                    <span style={S.filterFieldLabel}>Search</span>
                    <div style={S.filterSearchWrap}>
                      <i className="ti ti-search" style={S.filterSearchIcon} aria-hidden="true" />
                      <input
                        style={S.filterSearchInput}
                        type="text"
                        placeholder="Property or account…"
                        value={propFilter.q}
                        onChange={e => setPropFilter(f => ({ ...f, q: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div style={{ ...S.filterField, ...S.filterFacetField }}>
                    <span style={S.filterFieldLabel}>Assigned Account</span>
                    <CustomDropdown options={propAccountOptions} value={propFilter.account} onChange={v => setPropFilter(f => ({ ...f, account: v }))} />
                  </div>
                  <div style={{ ...S.filterField, ...S.filterFacetField }}>
                    <span style={S.filterFieldLabel}>Property</span>
                    <CustomDropdown options={propPropertyOptions} value={propFilter.property} onChange={v => setPropFilter(f => ({ ...f, property: v }))} />
                  </div>
                  {(propFilter.q || propFilter.account !== 'all' || propFilter.property !== 'all') && (
                    <span style={S.filterClear} onClick={() => setPropFilter({ q: '', account: 'all', property: 'all' })}>Clear filters</span>
                  )}
                </div>
                {Object.keys(propByProperty).length === 0 ? (
                  <div style={S.emptyState}>
                    <div style={S.emptyIcon}><i className="ti ti-filter-off" aria-hidden="true" /></div>
                    <h3 style={S.emptyH3}>No matches</h3>
                    <p style={S.emptyP}>Nothing matches these filters. Try a different search term or status.</p>
                  </div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Module</th>
                        <th style={S.th}>Assigned Account</th>
                        <th style={S.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(propByProperty).map(([propId, group]) => (
                        <React.Fragment key={propId}>
                          <tr><td style={S.groupHeadTd} colSpan={3}><i className="ti ti-building" style={{ marginRight: 6 }} aria-hidden="true" />{group.name}</td></tr>
                          {group.rows.map(r => (
                            <tr key={r.id}>
                              <td style={S.td}>{r.module_display}</td>
                              <td style={S.td}>
                                {r.account_display
                                  ? r.account_display
                                  : r.editable
                                    ? <span style={S.unassignedPill}>Not assigned</span>
                                    : <span style={{ color: C.textTertiary }}>Not yet linked by owner</span>}
                              </td>
                              <td style={{ ...S.td, textAlign: 'right' }}>
                                {r.editable ? (
                                  <span style={S.linkBtn} onClick={() => setAssignModal({ row: r, kind: 'property' })}>{r.account_display ? 'Reassign' : 'Assign'}</span>
                                ) : (
                                  <span style={S.lockPill} title="Filled by the property owner via Landlord Portal"><i className="ti ti-lock" aria-hidden="true" />Owner-filled</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )
          )}

          {/* ─── UNIT OWNER TAB ─── */}
          {subTab === 'unit-owners' && unitLoading && (
            <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '24px 0' }}>Loading unit accounts…</div>
          )}
          {subTab === 'unit-owners' && !unitLoading && unitError && (
            <div style={{ ...S.emptyState, marginBottom: 20 }}>
              <p style={S.emptyP}>{unitError}</p>
              <button style={S.btnPrimary} onClick={fetchUnitRows}>Retry</button>
            </div>
          )}
          {subTab === 'unit-owners' && !unitLoading && !unitError && (
            unitRows.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}><i className="ti ti-home" aria-hidden="true" /></div>
                <h3 style={S.emptyH3}>No managed units yet</h3>
                <p style={S.emptyP}>Bank account assignments for the units you manage will show up here once you have units set up.</p>
              </div>
            ) : (
              <>
                <div style={S.filterBar}>
                  <div style={{ ...S.filterField, ...S.filterSearchField }}>
                    <span style={S.filterFieldLabel}>Search</span>
                    <div style={S.filterSearchWrap}>
                      <i className="ti ti-search" style={S.filterSearchIcon} aria-hidden="true" />
                      <input
                        style={S.filterSearchInput}
                        type="text"
                        placeholder="Property, unit, or account…"
                        value={unitFilter.q}
                        onChange={e => setUnitFilter(f => ({ ...f, q: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div style={{ ...S.filterField, ...S.filterFacetField }}>
                    <span style={S.filterFieldLabel}>Assigned Account</span>
                    <CustomDropdown options={unitAccountOptions} value={unitFilter.account} onChange={v => setUnitFilter(f => ({ ...f, account: v }))} />
                  </div>
                  <div style={{ ...S.filterField, ...S.filterFacetField }}>
                    <span style={S.filterFieldLabel}>Property</span>
                    {/* Changing Property resets Unit #, since the unit list is scoped to the selected property. */}
                    <CustomDropdown options={unitPropertyOptions} value={unitFilter.property} onChange={v => setUnitFilter(f => ({ ...f, property: v, unit: 'all' }))} />
                  </div>
                  <div style={{ ...S.filterField, ...S.filterFacetField }}>
                    <span style={S.filterFieldLabel}>Unit #</span>
                    <CustomDropdown options={unitNumberOptions} value={unitFilter.unit} onChange={v => setUnitFilter(f => ({ ...f, unit: v }))} />
                  </div>
                  {(unitFilter.q || unitFilter.account !== 'all' || unitFilter.property !== 'all' || unitFilter.unit !== 'all') && (
                    <span style={S.filterClear} onClick={() => setUnitFilter({ q: '', account: 'all', property: 'all', unit: 'all' })}>Clear filters</span>
                  )}
                </div>
                {Object.keys(unitByKey).length === 0 ? (
                  <div style={S.emptyState}>
                    <div style={S.emptyIcon}><i className="ti ti-filter-off" aria-hidden="true" /></div>
                    <h3 style={S.emptyH3}>No matches</h3>
                    <p style={S.emptyP}>Nothing matches these filters. Try a different search term or status.</p>
                  </div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Module</th>
                        <th style={S.th}>Assigned Account</th>
                        <th style={S.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(unitByKey).map(([key, rows]) => (
                        <React.Fragment key={key}>
                          <tr><td style={S.groupHeadTd} colSpan={3}><i className="ti ti-home" style={{ marginRight: 6 }} aria-hidden="true" />{key}</td></tr>
                          {rows.map(r => (
                            <tr key={r.id}>
                              <td style={S.td}>{r.module_display}</td>
                              <td style={S.td}>
                                {r.account_display
                                  ? r.account_display
                                  : r.editable
                                    ? <span style={S.unassignedPill}>Not assigned</span>
                                    : <span style={{ color: C.textTertiary }}>Not yet linked by owner</span>}
                              </td>
                              <td style={{ ...S.td, textAlign: 'right' }}>
                                {r.editable ? (
                                  <span style={S.linkBtn} onClick={() => setAssignModal({ row: r, kind: 'unit' })}>{r.account_display ? 'Reassign' : 'Assign'}</span>
                                ) : (
                                  <span style={S.lockPill} title="Filled by the unit owner via Landlord Portal"><i className="ti ti-lock" aria-hidden="true" />Owner-filled</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )
          )}
        </div>
      </div>

      {bankModal && (
        <BankAccountModal
          account={bankModal === 'add' ? null : bankModal}
          hasOtherAccounts={pmAccounts.length > 0}
          holderName={holderName}
          saving={bankSaving}
          error={bankSaveError}
          onClose={() => { setBankModal(null); setBankSaveError(null); }}
          onSave={saveBankAccount}
        />
      )}

      {deleteConfirm && (
        <div style={S.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalH3}>Remove Bank Account</h3>
            <p style={S.modalSub}>Remove {deleteConfirm.bank_name} (•••• {deleteConfirm.account_last4})? Any property or unit currently assigned to it will show as unassigned.</p>
            <div style={S.modalActions}>
              <button style={S.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...S.btnPrimary, background: C.red }} onClick={() => deleteBankAccount(deleteConfirm)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {assignModal && (
        <AssignAccountModal
          row={assignModal.row}
          pmAccounts={pmAccounts}
          saving={assignSaving}
          error={assignError}
          onClose={() => { setAssignModal(null); setAssignError(null); }}
          onSave={saveAssignment}
        />
      )}
    </div>
  );
}
