// PMBankAccountsTab.jsx — PM Portal: Account Settings → Bank Accounts (Design System v2)
// Route: /pm-portal/account/bank-accounts                     Layout: Downloads/image 178.png
//
//   NavPM sidebar │ PM top bar                                                    (PMPageShell)
//                 │ wave backdrop · Breadcrumb · "Bank Accounts" header (T2.heroHeading + T2.lead)
//                 │ Account Settings tabs (AccountSettingsTabs — shared v2 strip)
//                 │ sub-tabs PM Account · Property Owner · Unit Owner (TabBar underline — the app-wide tabs)
//                 │ PM Account:     divided columns (un2-cols-2-wide-first) — your accounts (ListRow list or the
//                 │                 big empty state) │ Account Details (icon header · kv rows)
//                 │ Property / Unit Owner (images 179 / 180) — one shared master–detail (renderMasterDetail):
//                 │   properties list card (ListRow, search) │ selected property card + Assign to Multiple ·
//                 │   Property: one row per module (icon · account · Assign / Owner-filled · ⋯)
//                 │   Unit:     one row per unit (Unit # · Owner settlement · Unit reserve · Assign · ⋯)
//                 │ PageFooter
//
// Data + actions are unchanged from the v1 page (Session 49 build):
//   PM Account      PMBankAccount CRUD — GET/POST /api/pm/bank-accounts/, PATCH/DELETE /api/pm/bank-accounts/<id>/
//   Property Owner  PropertyBankAccount rows — GET/PATCH /api/pm/bank-accounts/property-owners/
//   Unit Owner      UnitBankAccount rows — GET/PATCH /api/pm/bank-accounts/unit-owners/
//   Owner Settlement rows are owner-filled (locked); the PM-fillable modules can be (re)assigned.
// Pop-ups use the standard v2 Modal (add / edit account, assign account, remove confirm).

import React, { useState, useEffect, useCallback } from 'react';
import { PMPageShell, Grid, Breadcrumb, PageFooter, ImageBackdrop } from '../../../components/layout';
import {
  TabBar, BankArt, CardsArt, ListRow, OptionsMenu, EmptyState, DataTable, Modal, FormField, ReadField, SelectField, FIELD2, Checkbox,
} from '../../../components/ui';
import { C2, TONES2, SH2, FS2, R2, SP2, SZ2, T2, UI2 } from '../../../constants';
// import AccountSettingsTabs from './AccountSettingsTabs';   // tab strip commented out for now (see the header block)
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';   // soft blue wave lines (same art as Approvals / Profile)

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


const SUB_TABS = [
  { id: 'pm',              label: 'PM Account',     icon: 'ti-stack-2' },
  { id: 'property-owners', label: 'Property Owner', icon: 'ti-building' },
  { id: 'unit-owners',     label: 'Unit Owner',     icon: 'ti-home' },
];

// ── Page-specific layout only (every look comes from v2 tokens / components) ──
const S = {
  headBlock: UI2.pageHead.block,                       // shared header-block spacing (Approvals / Profile)
  head:      UI2.stack(SP2.xs),
  title:     { ...T2.heroHeading, margin: 0 },
  sub:       { ...T2.lead, margin: 0 },
  tabs:      UI2.pageHead.next,
  // PM Account — two divided columns, open on the page
  col:       { ...UI2.stack(SP2.lg), minWidth: 0 },
  colTop:    { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap' },
  colTitle:  { ...UI2.cardTitle, margin: 0 },
  colSub:    { ...UI2.cardSubtitle, margin: 0 },
  detHead:   { ...UI2.row(SP2.md), alignItems: 'flex-start' },
  detIcon:   UI2.iconBox(SZ2.icon.lg, TONES2.primary),
  emptyBox:  { paddingTop: SP2.xxl, paddingBottom: SP2.xxl },
  // account rows
  rowSel:    { background: C2.primaryWash, borderRadius: R2.lg },
  logoBox:   { ...UI2.iconBox(SZ2.icon.md, { soft: C2.white, fg: C2.primary }), padding: SP2.xs, boxShadow: SH2.control, overflow: 'hidden' },
  logoImg:   { width: '100%', height: '100%', objectFit: 'contain' },
  bankIcon:  UI2.iconBox(SZ2.icon.md, TONES2.primary),
  titleRow:  { ...UI2.row(SP2.sm), minWidth: 0 },
  defPill:   UI2.pill(TONES2.success),
  rowActs:   UI2.row(SP2.xs),
  addBtn:    { ...UI2.btn.brand, ...UI2.btnSm },
  btnIcon:   UI2.btnIcon,
  // Account Details — label / value rows
  kvVal:     UI2.kvVal,
  setDef:    UI2.btn.link,
  secTitle:  { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  panel:     UI2.card,
  searchIcon:UI2.toolbar.searchIcon,
  input:     UI2.searchInput,
  rowBtn:    { ...UI2.btn.brand, ...UI2.btnSmStd },       // standard small row action (= Listings "List") — Assign / Reassign
  // Property Owner master–detail
  listCard:  { ...UI2.card, ...UI2.stack(SP2.md), alignSelf: 'start' },
  listHead:  { ...UI2.rowBetween(SP2.sm) },
  count:     { color: C2.textMuted },
  listSearch:{ ...UI2.toolbar.search, width: '100%' },
  detailTop: { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', marginBottom: SP2.lg },
  detailHead:{ ...UI2.row(SP2.md), minWidth: 0 },
  modCount:  UI2.pill(TONES2.primary),
  modCell:   UI2.row(SP2.md),
  modIcon:   UI2.iconBox(SZ2.icon.sm, TONES2.neutral),
  ownerPill: UI2.statusPill(TONES2.neutral),
  notSet:    UI2.statusPill(TONES2.error),               // table status = dot + coloured word, no box (UI2.statusPill)
  muted:     { color: C2.textMuted },
  modalText: { ...T2.body, margin: 0 },
};

// Module → icon (Property Owner modules table). Unknown modules fall back to the bank icon.
const MODULE_ICONS = {
  'property operating': 'ti-stack-2', 'owner settlement': 'ti-user', 'pm operating': 'ti-briefcase', 'pm trust': 'ti-shield-check',
  'rent collection': 'ti-file-invoice', 'property reserve': 'ti-coins', 'security deposit': 'ti-lock', 'unit reserve': 'ti-coins',
};
const moduleIcon = name => MODULE_ICONS[(name || '').trim().toLowerCase()] || 'ti-building-bank';

const accountLabel = a => `${a.nickname || a.bank_name} (••••${a.account_last4})${a.is_default ? ' — Default' : ''}`;

// Bank mark — the bank's real favicon when getBankLogoUrl() knows it, else the tinted bank icon box
function BankMark({ name }) {
  const url = getBankLogoUrl(name);
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <span style={S.bankIcon} aria-hidden="true"><i className="ti ti-building-bank" /></span>;
  return <span style={S.logoBox}><img src={url} alt={`${name} logo`} style={S.logoImg} onError={() => setFailed(true)} /></span>;
}


// ─── Add / Edit PM bank account — standard v2 Modal + form ───────────────────
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
  const off = saving || !form.bank_name || (!isEdit && !form.account_number);

  return (
    <Modal
      title={isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
      subtitle="This is where your management fee payouts will be sent."
      onClose={() => !saving && onClose()}
      note={error}
      footer={<>
        <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...(off ? UI2.btnOff : {}) }} onClick={() => onSave(form)} disabled={off}>
          {saving ? 'Saving…' : 'Save Bank Account'}
        </button>
      </>}
    >
      <div style={FIELD2.grid}>
        <FormField label="Account Holder Name" full><ReadField value={holderName} icon="ti-lock" /></FormField>
        <FormField label="Bank Name" full>
          <input className="un2-focus-ring" style={FIELD2.input} placeholder="e.g. Chase Bank" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} />
        </FormField>
        <FormField label="Account Number" full>
          <input className="un2-focus-ring" style={FIELD2.input} value={form.account_number} onChange={e => set('account_number', e.target.value)}
            placeholder={isEdit ? (account?.account_last4 ? `Current: •••• ${account.account_last4} — leave blank to keep` : 'Leave blank to keep the current number') : '•••• •••• •••• ••••'} />
        </FormField>
        <FormField label="Routing Number">
          <input className="un2-focus-ring" style={FIELD2.input} value={form.routing_number} onChange={e => set('routing_number', e.target.value)}
            placeholder={isEdit && account?.routing_masked ? `Current: ${account.routing_masked}` : 'e.g. 021000021'} />
        </FormField>
        <FormField label="Account Type">
          <SelectField label="Account type" value={form.account_type} onChange={v => set('account_type', v)}
            options={[{ value: 'checking', label: 'Checking' }, { value: 'savings', label: 'Savings' }]} />
        </FormField>
        <FormField label="Currency">
          <SelectField label="Currency" value={form.currency} onChange={v => set('currency', v)} options={[{ value: 'USD', label: 'USD' }]} />
        </FormField>
        <FormField label="Country">
          <SelectField label="Country" value={form.country} onChange={v => set('country', v)} options={[{ value: 'United States', label: 'United States' }]} />
        </FormField>
        <FormField full>
          <Checkbox checked={form.is_default} disabled={!hasOtherAccounts} onChange={() => set('is_default', !form.is_default)}
            label={`Set as default bank account${!hasOtherAccounts ? ' (only account — always default)' : ''}`} />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Assign one of your accounts to a property / unit module ─────────────────
function AssignAccountModal({ row, pmAccounts, saving, error, onClose, onSave }) {
  const [pmBankAccountId, setPmBankAccountId] = useState(row.pm_bank_account ? String(row.pm_bank_account) : '');
  const off = saving || !pmBankAccountId;
  return (
    <Modal
      size="sm" media={false} icon="ti-building-bank"
      title="Assign Bank Account"
      subtitle={`${row.property_name || `Unit ${row.unit_number}`} — ${row.module_display}`}
      onClose={() => !saving && onClose()}
      note={error}
      footer={<>
        <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...(off ? UI2.btnOff : {}) }} onClick={() => onSave(pmBankAccountId)} disabled={off}>
          {saving ? 'Saving…' : 'Assign'}
        </button>
      </>}
    >
      <FormField label="Your Bank Account">
        {pmAccounts.length === 0
          ? <span style={UI2.text.meta}>You haven't added any bank accounts yet — add one on the PM Account tab first.</span>
          : <SelectField label="Your bank account" value={pmBankAccountId} onChange={v => setPmBankAccountId(v)} placeholder="Select an account…"
              itemIcon="ti-building-bank" options={pmAccounts.map(a => ({ value: String(a.id), label: accountLabel(a) }))} />}
      </FormField>
    </Modal>
  );
}


// ─── Assign one account to several modules / units of a property at once ─────
// Same PATCH as the single assign, sent once per ticked item (there is no bulk endpoint).
// target = { kind, name, noun ('module' | 'unit'), items: [{ id, label, current }] }
function BulkAssignModal({ target, pmAccounts, saving, error, onClose, onSave }) {
  const { name, noun, items } = target;
  const [accountId, setAccountId] = useState('');
  const [picked, setPicked] = useState(() => new Set(items.map(it => it.id)));
  const toggle = id => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const off = saving || !accountId || picked.size === 0;
  return (
    <Modal
      size="sm" media={false} icon="ti-stack-2"
      title="Assign to Multiple"
      subtitle={`${name} — pick one of your accounts and the ${noun}s it should cover.`}
      onClose={() => !saving && onClose()}
      note={error}
      footer={<>
        <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...(off ? UI2.btnOff : {}) }} onClick={() => onSave(accountId, [...picked])} disabled={off}>
          {saving ? 'Saving…' : `Assign to ${picked.size} ${noun}${picked.size === 1 ? '' : 's'}`}
        </button>
      </>}
    >
      <div style={UI2.stack(SP2.lg)}>
        <FormField label="Your Bank Account">
          {pmAccounts.length === 0
            ? <span style={UI2.text.meta}>You haven't added any bank accounts yet — add one on the PM Account tab first.</span>
            : <SelectField label="Your bank account" value={accountId} onChange={setAccountId} placeholder="Select an account…"
                itemIcon="ti-building-bank" options={pmAccounts.map(a => ({ value: String(a.id), label: accountLabel(a) }))} />}
        </FormField>
        <FormField label={noun === 'unit' ? 'Units' : 'Modules'}>
          <div style={UI2.stack(SP2.sm)}>
            {items.map(it => (
              <Checkbox key={it.id} checked={picked.has(it.id)} onChange={() => toggle(it.id)} label={it.label}
                hint={it.current ? `Currently: ${it.current}` : 'Not assigned'} />
            ))}
          </div>
        </FormField>
      </div>
    </Modal>
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
  // Property / Unit Owner master–detail, per tab: selected property · list search open · list search text
  const [selectedGroup, setSelectedGroup] = useState({});
  const [searchOpen, setSearchOpen] = useState({});
  const [listQuery, setListQuery] = useState({});
  const [bulkModal, setBulkModal] = useState(null);   // null | property group
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState(null);


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

  const saveBulkAssignment = (pmBankAccountId, rowIds) => {
    setBulkSaving(true);
    setBulkError(null);
    const { kind } = bulkModal;
    const base = `${API_BASE}/pm/bank-accounts/${kind === 'unit' ? 'unit-owners' : 'property-owners'}/`;
    rowIds.reduce((chain, id) => chain.then(() =>
      fetch(`${base}${id}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ pm_bank_account: pmBankAccountId }) })
        .then(r => { if (!r.ok) return r.json().then(d => { throw new Error(d.detail || 'Could not save one of the assignments.'); }); })
    ), Promise.resolve())
      .then(() => { setBulkModal(null); kind === 'unit' ? fetchUnitRows() : fetchPropRows(); })
      .catch(e => { setBulkError(e.message); kind === 'unit' ? fetchUnitRows() : fetchPropRows(); })
      .finally(() => setBulkSaving(false));
  };

  const defaultAcct = pmAccounts.find(b => b.is_default) || pmAccounts[0] || null;
  const selectedAccount = pmAccounts.find(a => a.id === selectedId) || defaultAcct;

  const skeleton = (
    <div style={UI2.stack(SP2.md)}>
      {[0, 1, 2].map(i => <div key={i} className="un2-skel" style={UI2.skeleton('100%', SZ2.field)} />)}
    </div>
  );
  const errorBox = (msg, retry) => (
    <div style={UI2.errorBanner} role="alert">
      <i className="ti ti-alert-circle" aria-hidden="true" /> {msg} —{' '}
      <button type="button" style={UI2.btn.link} onClick={retry}>Retry</button>
    </div>
  );

  // ── Table cells shared by the Property / Unit tables (standard: dot + coloured word, brand small button) ──
  const accountCell = r => (!r ? <span style={S.muted}>—</span>
    : r.account_display ? r.account_display
    : r.editable ? <span style={S.notSet}><span style={UI2.statusDot(TONES2.error)} />Not assigned</span>
    : <span style={S.muted}>Not yet linked by owner</span>);
  const ownerCell = (r, who) => (r?.account_display
    ? <span style={S.ownerPill} title={`${r.account_display} — filled by the ${who} owner via Landlord Portal`}><span style={UI2.statusDot(TONES2.neutral)} />Owner-filled</span>
    : <span style={S.muted}>Not yet linked by owner</span>);
  const assignBtn = (r, kind) => (
    <button type="button" className="un2-btn" style={S.rowBtn} onClick={() => setAssignModal({ row: r, kind })}>
      {r.account_display ? 'Reassign' : 'Assign'}
    </button>
  );
  const moreMenu = (r, kind) => {
    const items = [
      ...(r?.editable ? [{ label: r.account_display ? 'Reassign account' : 'Assign account', icon: 'ti-building-bank', onClick: () => setAssignModal({ row: r, kind }) }] : []),
      ...(r?.property_id ? [{ label: 'View property', icon: 'ti-building', onClick: () => { window.location.href = `/pm-portal/properties/${r.property_id}`; } }] : []),
    ];
    return items.length ? <OptionsMenu inline items={items} /> : null;
  };

  // rows → one group per property (keeps API order)
  const byProperty = rows => Object.values(rows.reduce((acc, r) => {
    const key = r.property_id ?? r.property_name;
    (acc[key] = acc[key] || { id: key, name: r.property_name, rows: [] }).rows.push(r);
    return acc;
  }, {}));
  // a property's unit rows → one entry per unit: Owner Settlement (owner-filled) + Unit Reserve (PM-assignable)
  const unitsOf = group => Object.values(group.rows.reduce((acc, r) => {
    const u = (acc[r.unit_number] = acc[r.unit_number] || { id: `${group.id}-${r.unit_number}`, unit_number: r.unit_number, property_id: r.property_id });
    const m = (r.module_display || '').toLowerCase();
    if (m.includes('settlement') || (!r.editable && !u.settlement)) u.settlement = r; else u.reserve = r;
    return acc;
  }, {}));

  // ── Shared master–detail (design images 179 / 180): properties list card │ selected property card ──
  const renderMasterDetail = ({ kind, loading, error, retry, rows, emptyIcon, emptyTitle, emptyText, listMeta, count, columns, tableRows, bulkItems }) => {
    if (loading) return skeleton;
    if (error) return errorBox(error, retry);
    if (rows.length === 0) {
      return <section style={S.panel}><EmptyState icon={emptyIcon} title={emptyTitle} text={emptyText} /></section>;
    }
    const groups = byProperty(rows);
    const q = (listQuery[kind] || '').trim().toLowerCase();
    const listed = q
      ? groups.filter(gr => (gr.name || '').toLowerCase().includes(q) || gr.rows.some(r => [r.account_display, r.unit_number].some(v => String(v || '').toLowerCase().includes(q))))
      : groups;
    const current = groups.find(gr => gr.id === selectedGroup[kind]) || listed[0] || groups[0];
    const items = bulkItems(current);
    const open = !!searchOpen[kind];

    return (
      <Grid layout="steps" as="div">
        {/* master — properties list */}
        <section style={S.listCard}>
          <div style={S.listHead}>
            <h2 style={S.colTitle}>Properties <span style={S.count}>({groups.length})</span></h2>
            <button type="button" style={UI2.btn.icon(SZ2.control.sm)} aria-label="Search properties" aria-expanded={open}
              onClick={() => { if (open) setListQuery(p => ({ ...p, [kind]: '' })); setSearchOpen(p => ({ ...p, [kind]: !open })); }}>
              <i className={`ti ${open ? 'ti-x' : 'ti-search'}`} aria-hidden="true" />
            </button>
          </div>
          {open && (
            <label className="un2-focus-ring" style={S.listSearch}>
              <i className="ti ti-search" style={S.searchIcon} aria-hidden="true" />
              <input style={S.input} type="search" placeholder={kind === 'unit' ? 'Property, unit or account…' : 'Property or account…'}
                value={listQuery[kind] || ''} autoFocus aria-label="Search properties"
                onChange={e => setListQuery(p => ({ ...p, [kind]: e.target.value }))} />
            </label>
          )}
          <div style={UI2.stack(SP2.xs)}>
            {listed.length === 0
              ? <div style={UI2.emptyInline}>No properties match.</div>
              : listed.map(gr => (
                <ListRow
                  key={gr.id}
                  variant="hover"
                  onClick={() => setSelectedGroup(p => ({ ...p, [kind]: gr.id }))}
                  style={gr.id === current.id ? S.rowSel : undefined}
                  leading={<span style={S.bankIcon} aria-hidden="true"><i className="ti ti-building" /></span>}
                  title={gr.name}
                  meta={listMeta(gr)}
                  trailing={<i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />}
                />
              ))}
          </div>
        </section>

        {/* detail — the selected property */}
        <section style={S.panel}>
          <div style={S.detailTop}>
            <div style={S.detailHead}>
              <span style={S.detIcon} aria-hidden="true"><i className="ti ti-building" /></span>
              <h2 style={S.secTitle}>{current.name}</h2>
              <span style={S.modCount}>{count(current)}</span>
            </div>
            {items.length > 0 && (
              <button type="button" className="un2-btn" style={UI2.btn.soft}
                onClick={() => { setBulkError(null); setBulkModal({ kind, name: current.name, items, noun: kind === 'unit' ? 'unit' : 'module' }); }}>
                <i className="ti ti-stack-2" style={S.btnIcon} aria-hidden="true" /> Assign to Multiple
              </button>
            )}
          </div>
          <DataTable columns={columns} rows={tableRows(current)} rowKey={r => r.id}
            empty={<EmptyState icon="ti-building-bank" text="Nothing to show for this property." />} />
        </section>
      </Grid>
    );
  };

  // Property Owner — one row per module of the property
  const PROPERTY_COLUMNS = [
    { key: 'module', label: 'Module', type: 'primary', width: 1.3, render: r => (
      <span style={S.modCell}>
        <span style={S.modIcon} aria-hidden="true"><i className={`ti ${moduleIcon(r.module_display)}`} /></span>
        {r.module_display}
      </span>
    ) },
    { key: 'account', label: 'Assigned account', width: 1.3, render: accountCell },
    { key: 'act', label: 'Action', fit: true, render: r => (r.editable ? assignBtn(r, 'property') : ownerCell(r, 'property')) },
    { key: 'more', label: '', render: r => moreMenu(r, 'property') },
  ];

  // Unit Owner — one row per unit: Owner Settlement (owner-filled) · Unit Reserve (PM assigns)
  const UNIT_COLUMNS = [
    { key: 'unit', label: 'Unit #', type: 'primary', render: u => (
      <span style={S.modCell}>
        <span style={S.modIcon} aria-hidden="true"><i className="ti ti-home" /></span>
        Unit {u.unit_number}
      </span>
    ) },
    { key: 'settle',  label: 'Owner settlement', width: 1.2, render: u => ownerCell(u.settlement, 'unit') },
    { key: 'reserve', label: 'Unit reserve', width: 1.2, render: u => accountCell(u.reserve) },
    { key: 'act', label: 'Action', fit: true, render: u => (u.reserve?.editable ? assignBtn(u.reserve, 'unit') : <span style={S.muted}>—</span>) },
    { key: 'more', label: '', render: u => moreMenu(u.reserve || u.settlement, 'unit') },
  ];

  // ── PM Account: your accounts │ Account Details ──────────────────────────
  const renderPmTab = () => {
    if (pmLoading) return skeleton;
    if (pmError) return errorBox(pmError, fetchPmAccounts);
    const empty = pmAccounts.length === 0;
    return (
      <div className="un2-cols un2-cols-2-wide-first">
        <div style={S.col}>
          {empty ? (
            <div style={S.emptyBox}>
              <EmptyState
                illustration={<BankArt />}
                title="No bank accounts added yet"
                text="Add your own payout account so it can be assigned to properties and units you manage."
              >
                <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => setBankModal('add')}>
                  <i className="ti ti-plus" style={S.btnIcon} aria-hidden="true" /> Add Bank Account
                </button>
              </EmptyState>
            </div>
          ) : (
            <>
              <div style={S.colTop}>
                <div style={UI2.minWidth0}>
                  <h2 style={S.colTitle}>Your Bank Accounts</h2>
                  <p style={S.colSub}>Reused across the properties you manage — PM Operating, PM Trust, Rent Collection and Security Deposit pick from this list.</p>
                </div>
                <button type="button" className="un2-btn" style={S.addBtn} onClick={() => setBankModal('add')}>
                  <i className="ti ti-plus" style={S.btnIcon} aria-hidden="true" /> Add Bank Account
                </button>
              </div>
              <div>
                {pmAccounts.map(a => (
                  <ListRow
                    key={a.id}
                    variant="hover"
                    onClick={() => setSelectedId(a.id)}
                    style={a.id === selectedAccount?.id ? S.rowSel : undefined}
                    leading={<BankMark name={a.bank_name} />}
                    title={<span style={S.titleRow}>{a.bank_name}{a.is_default && <span style={S.defPill}>Default</span>}</span>}
                    meta={`•••• ${a.account_last4 || '····'} · ${a.account_type_display || '—'}`}
                    trailing={(
                      <span style={S.rowActs}>
                        <button type="button" style={UI2.btn.rowIcon(TONES2.primary)} title="Edit" aria-label={`Edit ${a.bank_name}`}
                          onClick={e => { e.stopPropagation(); setBankModal(a); }}><i className="ti ti-pencil" aria-hidden="true" /></button>
                        <button type="button" style={UI2.btn.rowIcon(TONES2.error)} title="Remove" aria-label={`Remove ${a.bank_name}`}
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(a); }}><i className="ti ti-trash" aria-hidden="true" /></button>
                      </span>
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={S.col}>
          <div style={S.detHead}>
            <span style={S.detIcon} aria-hidden="true"><i className="ti ti-building-bank" /></span>
            <div style={UI2.minWidth0}>
              <h2 style={S.colTitle}>Account Details</h2>
              <p style={S.colSub}>{selectedAccount ? selectedAccount.bank_name : 'Select an account to see its details.'}</p>
            </div>
          </div>
          {selectedAccount ? (
            <div>
              {[
                ['Bank Name', selectedAccount.bank_name],
                ['Account Type', selectedAccount.account_type_display || '—'],
                ['Account #', `•••• ${selectedAccount.account_last4 || '····'}`],
                ['Routing #', selectedAccount.routing_masked || '—'],
              ].map(([k, v], i) => (
                <div key={k} style={UI2.kvRow(i === 0)}><span>{k}</span><span style={S.kvVal}>{v}</span></div>
              ))}
              <div style={UI2.kvRow(false)}>
                <span>Status</span>
                <span style={S.kvVal}>
                  {selectedAccount.is_default
                    ? <span style={S.defPill}>Default</span>
                    : <button type="button" style={S.setDef} onClick={() => setDefaultAccount(selectedAccount.id)}><i className="ti ti-check" aria-hidden="true" /> Set as default</button>}
                </span>
              </div>
            </div>
          ) : (
            <div style={S.emptyBox}>
              <EmptyState illustration={<CardsArt />} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <PMPageShell activeId="account-bank" animate backdrop={<ImageBackdrop image={backdropArt} />} searchPlaceholder="Search portfolios, settings, or help…">
      <Breadcrumb items={[{ label: 'Account Settings', href: '/pm-portal/account/profile' }, { label: 'Bank Accounts' }]} />

      {/* ── Header: title · subtitle → Account Settings tabs → sub-tabs ── */}
      <section style={S.headBlock}>
        <div style={S.head}>
          <h1 style={S.title}>Bank Accounts</h1>
          <p style={S.sub}>Your own payout accounts, and the accounts linked to the properties and units you manage.</p>
        </div>
        {/* Account Settings tab strip commented out for now (user 2026-11-27) — the sidebar already lists every Account Settings page; uncomment to restore
        <div style={S.tabs}><AccountSettingsTabs active="bank" /></div> */}
        <div style={S.tabs}>
          <TabBar variant="underline" ariaLabel="Bank account owner" value={subTab} onChange={setSubTab} tabs={SUB_TABS} />
        </div>
      </section>

      {subTab === 'pm' && renderPmTab()}

      {subTab === 'property-owners' && renderMasterDetail({
        kind: 'property', loading: propLoading, error: propError, retry: fetchPropRows, rows: propRows,
        emptyIcon: 'ti-building', emptyTitle: 'No managed properties yet',
        emptyText: 'Bank account assignments for the properties you manage will show up here once you have properties set up.',
        listMeta: gr => `Property · ${gr.rows.length} modules`,
        count: gr => `${gr.rows.length} Modules`,
        columns: PROPERTY_COLUMNS,
        tableRows: gr => gr.rows,
        bulkItems: gr => gr.rows.filter(r => r.editable).map(r => ({ id: r.id, label: r.module_display, current: r.account_display })),
      })}

      {subTab === 'unit-owners' && renderMasterDetail({
        kind: 'unit', loading: unitLoading, error: unitError, retry: fetchUnitRows, rows: unitRows,
        emptyIcon: 'ti-home', emptyTitle: 'No managed units yet',
        emptyText: 'Bank account assignments for the units you manage will show up here once you have units set up.',
        listMeta: gr => `${unitsOf(gr).length} Units`,
        count: gr => `${unitsOf(gr).length} Units`,
        columns: UNIT_COLUMNS,
        tableRows: unitsOf,
        bulkItems: gr => unitsOf(gr).filter(u => u.reserve?.editable).map(u => ({ id: u.reserve.id, label: `Unit ${u.unit_number} — Unit Reserve`, current: u.reserve.account_display })),
      })}

      <PageFooter />

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
        <Modal variant="confirm" icon="ti-trash" tone={TONES2.error} title="Remove Bank Account?" size="sm"
          onClose={() => setDeleteConfirm(null)}
          footer={<>
            <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button type="button" className="un2-btn" style={UI2.btn.danger} onClick={() => deleteBankAccount(deleteConfirm)}>
              <i className="ti ti-trash" style={S.btnIcon} aria-hidden="true" /> Remove
            </button>
          </>}>
          <p style={S.modalText}>
            Remove {deleteConfirm.bank_name} (•••• {deleteConfirm.account_last4})? Any property or unit currently assigned to it will show as unassigned.
          </p>
        </Modal>
      )}

      {bulkModal && (
        <BulkAssignModal
          target={bulkModal}
          pmAccounts={pmAccounts}
          saving={bulkSaving}
          error={bulkError}
          onClose={() => { setBulkModal(null); setBulkError(null); }}
          onSave={saveBulkAssignment}
        />
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
    </PMPageShell>
  );
}
