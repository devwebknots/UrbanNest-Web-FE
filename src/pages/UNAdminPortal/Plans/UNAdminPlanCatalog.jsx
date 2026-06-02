import React, { useState, useEffect, useCallback } from 'react';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  primary: '#002D5B', primaryHover: '#003d7a',
  pageBg: '#F8FAFC',
  border: '#E2E8F0', borderMedium: '#CBD5E1',
  textPrimary: '#0F172A', textSecondary: '#64748B', textTertiary: '#94A3B8',
  danger: '#E53E3E', white: '#FFFFFF', neutral: '#F1F5F9', green: '#16A34A',
  amberBg: '#FEF3C7', amberBorder: '#FCD34D', amberText: '#92400E',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const API_BASE  = 'http://127.0.0.1:8001';
const PLANS_URL = `${API_BASE}/api/admin/plans/`;

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
}

async function apiGetPlans() {
  const res = await fetch(PLANS_URL, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load plans');
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}
async function apiGetReferences() {
  const res = await fetch(`${PLANS_URL}references/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load references');
  return res.json();
}
async function apiCreatePlan(formData) {
  const res = await fetch(PLANS_URL, {
    method: 'POST',
    headers: getAuthHeaders(), // no Content-Type — browser sets multipart boundary
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.stringify(JSON.parse(text)); } catch {}
    throw new Error(msg.substring(0, 300));
  }
  return res.json();
}
async function apiUpdatePlan(id, formData) {
  const res = await fetch(`${PLANS_URL}${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(), // no Content-Type — browser sets multipart boundary
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.stringify(JSON.parse(text)); } catch {}
    throw new Error(msg.substring(0, 300));
  }
  return res.json();
}
async function apiDeletePlan(id) {
  const res = await fetch(`${PLANS_URL}${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to delete plan');
}
async function apiGetHistory(id) {
  const res = await fetch(`${PLANS_URL}${id}/history/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load history');
  const data = await res.json();
  return Array.isArray(data) ? data : data.history || data.results || [];
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const RECEIVER_OPTIONS = [
  { value: 'INDEPENDENT_PM',    label: 'Independent PM' },
  { value: 'ORGANIZATIONAL_PM', label: 'Organizational PM' },
  { value: 'LANDLORD',          label: 'Landlord' },
  { value: 'RENTER',            label: 'Renter' },
  { value: 'TENANT',            label: 'Tenant' },
  { value: 'REAL_ESTATE_AGENT', label: 'Real Estate Agent' },
];

const RECEIVER_TABS = [
  { id: 'all',     label: 'All Plans',      receivers: null },
  { id: 'ind_pm',  label: 'Independent PM', receivers: ['INDEPENDENT_PM'] },
  { id: 'org_pms', label: 'Org PMS',        receivers: ['ORGANIZATIONAL_PM'] },
  { id: 'landlord',label: 'Landlord',       receivers: ['LANDLORD'] },
];

const STATUS_LABELS = {
  ACTIVE: 'Active', INACTIVE: 'Inactive', COMING_SOON: 'Coming Soon',
  SUSPENDED: 'Suspended', DEPRECATED: 'Deprecated',
};
const STATUS_STYLES = {
  ACTIVE:      { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  INACTIVE:    { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  COMING_SOON: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  SUSPENDED:   { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  DEPRECATED:  { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
};

const CURRENCY_SYMBOLS = { USD:'$', INR:'₹', EUR:'€', GBP:'£', AED:'AED ', SGD:'S$', AUD:'A$', CAD:'C$' };
function currSymbol(code) { return CURRENCY_SYMBOLS[code] || (code + ' '); }
function fmtPrice(amount, currency) {
  if (!amount && amount !== 0) return '—';
  const sym = currSymbol(currency);
  const n = parseFloat(amount);
  return n % 1 === 0 ? `${sym}${n.toLocaleString()}` : `${sym}${n.toFixed(2)}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'2-digit', year:'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month:'short', day:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtUnitRange(plan) {
  const min = plan.unit_limit_min ?? 0;
  const max = plan.unit_limit_max;
  if (max === null || max === undefined) return `${min}+ units`;
  return `${min} – ${max} units`;
}

const PLAN_THEMES = {
  Starter:      { bg: '#0A1628', accent: '#3B82F6' },
  Growth:       { bg: '#0D1B0A', accent: '#22C55E' },
  Professional: { bg: '#1A0A28', accent: '#A855F7' },
  Enterprise:   { bg: '#1A0E00', accent: '#F59E0B' },
  default:      { bg: '#0A1628', accent: '#3B82F6' },
};
function planTheme(name) {
  for (const key of Object.keys(PLAN_THEMES)) {
    if (name?.includes(key)) return PLAN_THEMES[key];
  }
  return PLAN_THEMES.default;
}

// Empty filter state
const EMPTY_FILTERS = { status: '', currency: '', receiver: '', unitMin: '', unitMax: '' };
function filtersAreEmpty(f) {
  return !f.status && !f.currency && !f.receiver && !f.unitMin && !f.unitMax;
}
function countActiveFilters(f) {
  return [f.status, f.currency, f.receiver, (f.unitMin || f.unitMax) ? 'range' : ''].filter(Boolean).length;
}

// ─── Inline SVG Icons ──────────────────────────────────────────────────────────
const SvgX = ({ size=16, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgChevron = ({ direction='down', size=14, color='#64748B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
    <path d={direction==='down'?'M6 9l6 6 6-6':'M6 15l6-6 6 6'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SvgFunnel = ({ size=16, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 4.5h18M7 12h10M10 19.5h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SvgTrash = ({ size=16, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgClock = ({ size=32, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SvgAlert = ({ size=32, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgPlan = ({ size=40, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5"/>
    <path d="M7 9h10M7 12h6M7 15h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const SvgHistory = ({ size=14, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 109-9H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
// Small icons for filter field labels (matching Image 1 style)
const SvgStatusIcon = ({ size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={C.primary} strokeWidth="2"/>
    <path d="M12 8v4M12 16h.01" stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgCurrencyIcon = ({ size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={C.primary} strokeWidth="2"/>
    <path d="M12 6v2m0 8v2m-3-6h6m-6 0a3 3 0 003 3m-3-3a3 3 0 013-3" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const SvgReceiverIcon = ({ size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4" stroke={C.primary} strokeWidth="2"/>
    <path d="M3 21c0-4 2.7-7 6-7s6 3 6 7" stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 3.5a4 4 0 010 7M21 21c0-4-2-6.5-5-7" stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgUnitIcon = ({ size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="10" width="8" height="11" rx="1" stroke={C.primary} strokeWidth="2"/>
    <rect x="13" y="3" width="8" height="18" rx="1" stroke={C.primary} strokeWidth="2"/>
  </svg>
);

// ─── Reusable primitives ───────────────────────────────────────────────────────
function Spinner({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{animation:'spin 0.8s linear infinite', flexShrink:0}}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 019.8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.INACTIVE;
  return (
    <span style={{background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:20, padding:'2px 9px', fontFamily:F.body, fontSize:11, fontWeight:700, letterSpacing:'0.04em', whiteSpace:'nowrap'}}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <span style={{fontFamily:F.body, fontSize:13, color:'#991B1B'}}>{message}</span>
      <button onClick={onDismiss} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center'}}>
        <SvgX size={16} color="#991B1B"/>
      </button>
    </div>
  );
}

// ─── Shared filter dropdown (used in both popup and sidebar) ───────────────────
// Matches Image 1: uppercase label with small icon above, white rounded dropdown
function FilterDropdown({ icon, label, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const sel = options.find(o => o.value === value);
  return (
    <div>
      {/* Label row — icon + uppercase text, Image 1 style */}
      <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:7}}>
        {icon}
        <span style={{fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textSecondary, letterSpacing:'0.1em', textTransform:'uppercase'}}>{label}</span>
      </div>
      <div style={{position:'relative'}}>
        <div onClick={() => setOpen(o => !o)}
          style={{background:C.white, border:`1px solid ${open ? C.borderMedium : C.border}`, borderRadius:8, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', boxShadow: open ? '0 0 0 3px rgba(0,45,91,0.06)' : 'none', transition:'box-shadow 0.15s'}}>
          <span style={{fontFamily:F.body, fontSize:13, color: sel && sel.value ? C.textPrimary : C.textTertiary}}>
            {sel && sel.value ? sel.label : placeholder}
          </span>
          <SvgChevron direction={open ? 'up' : 'down'} color={C.textSecondary}/>
        </div>
        {open && (
          <div style={{position:'absolute', top:'100%', left:0, right:0, zIndex:999, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', marginTop:4, maxHeight:200, overflowY:'auto'}}>
            <div onClick={() => { onChange(''); setOpen(false); }}
              style={{padding:'10px 14px', cursor:'pointer', fontFamily:F.body, fontSize:13, color:!value ? C.primary : C.textSecondary, fontWeight:!value ? 600 : 400, background:!value ? '#E4ECFC' : 'transparent'}}>
              {placeholder}
            </div>
            {options.filter(o => o.value).map(opt => (
              <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{padding:'10px 14px', cursor:'pointer', fontFamily:F.body, fontSize:13, color:value === opt.value ? C.primary : C.textPrimary, fontWeight:value === opt.value ? 600 : 400, background:value === opt.value ? '#E4ECFC' : 'transparent'}}>
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FormDropdown (used in Add/Edit modal only) ────────────────────────────────
function FormDropdown({ value, onChange, options, placeholder, error, open, setOpen }) {
  const sel = options.find(o => o.value === value);
  const inputStyle = {
    width:'100%', boxSizing:'border-box',
    background: open ? '#E4ECFC' : C.neutral,
    border:`1px solid ${error ? C.danger : open ? '#BFDBFE' : C.border}`,
    borderRadius:8, padding:'10px 12px',
    fontFamily:F.body, fontSize:13, color:C.textPrimary, outline:'none',
    display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer',
  };
  return (
    <div style={{position:'relative'}}>
      <div style={inputStyle} onClick={() => setOpen(o => !o)}>
        <span style={{color: sel ? C.textPrimary : C.textTertiary}}>{sel?.label || placeholder || 'Select...'}</span>
        <SvgChevron direction={open ? 'up' : 'down'}/>
      </div>
      {open && (
        <div style={{position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', marginTop:4, maxHeight:220, overflowY:'auto'}}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{padding:'10px 14px', cursor:'pointer', fontFamily:F.body, fontSize:13, color:value === opt.value ? C.primary : C.textPrimary, fontWeight:value === opt.value ? 600 : 400, background:value === opt.value ? '#E4ECFC' : 'transparent'}}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FILTER POPUP (Stage 1 — Image 1 pattern) ─────────────────────────────────
// Modal triggered by funnel icon on the main page.
// User sets initial filters → Apply → results page with sidebar appears.
function FilterPopup({ initialFilters, references, onApply, onClose }) {
  const [draft, setDraft] = useState({ ...initialFilters });
  const set = (k, v) => setDraft(f => ({ ...f, [k]: v }));

  const currencyOptions = [
    { value: '', label: 'All Currencies' },
    ...((references?.currencies || []).map(c => ({ value: c.ref_code, label: `${c.ref_code} — ${c.ref_value}` }))),
  ];
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];
  const receiverOptions = [
    { value: '', label: 'All Receivers' },
    ...RECEIVER_OPTIONS,
  ];

  const handleApply = () => onApply(draft);
  const handleReset = () => setDraft({ ...EMPTY_FILTERS });

  return (
    <div style={{position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:'rgba(15,23,42,0.3)', backdropFilter:'blur(2px)'}}/>
      <div style={{position:'relative', zIndex:1, width:'100%', maxWidth:680, background:C.white, borderRadius:20, boxShadow:'0 24px 60px rgba(0,0,0,0.18)', overflow:'hidden'}}>

        {/* Header — matches Image 1 */}
        <div style={{padding:'28px 32px 0', display:'flex', alignItems:'center', gap:12}}>
          <div style={{width:32, height:32, borderRadius:8, background:C.neutral, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <SvgFunnel size={16} color={C.primary}/>
          </div>
          <h2 style={{fontFamily:F.headline, fontSize:24, fontWeight:700, color:C.textPrimary, margin:0}}>
            Filter Plans
          </h2>
          <button onClick={onClose} style={{marginLeft:'auto', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center'}}>
            <SvgX size={20} color={C.textTertiary}/>
          </button>
        </div>

        {/* Filter grid — 3 columns, Image 1 layout */}
        <div style={{padding:'24px 32px 0'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px 24px'}}>
            <FilterDropdown
              icon={<SvgStatusIcon/>}
              label="Plan Status"
              value={draft.status}
              onChange={v => set('status', v)}
              options={statusOptions}
              placeholder="All Statuses"
            />
            <FilterDropdown
              icon={<SvgCurrencyIcon/>}
              label="Currency"
              value={draft.currency}
              onChange={v => set('currency', v)}
              options={currencyOptions}
              placeholder="All Currencies"
            />
            <FilterDropdown
              icon={<SvgReceiverIcon/>}
              label="Receiver"
              value={draft.receiver}
              onChange={v => set('receiver', v)}
              options={receiverOptions}
              placeholder="All Receivers"
            />
          </div>

          {/* Unit Range — full width row below */}
          <div style={{marginTop:20}}>
            <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:7}}>
              <SvgUnitIcon/>
              <span style={{fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textSecondary, letterSpacing:'0.1em', textTransform:'uppercase'}}>Unit Range</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div style={{position:'relative'}}>
                <input type="number" min="0" placeholder="Min units" value={draft.unitMin}
                  onChange={e => set('unitMin', e.target.value)}
                  style={{width:'100%', boxSizing:'border-box', background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', fontFamily:F.body, fontSize:13, color:C.textPrimary, outline:'none'}}/>
              </div>
              <div>
                <input type="number" min="0" placeholder="Max units" value={draft.unitMax}
                  onChange={e => set('unitMax', e.target.value)}
                  style={{width:'100%', boxSizing:'border-box', background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', fontFamily:F.body, fontSize:13, color:C.textPrimary, outline:'none'}}/>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Reset All + Apply Filters, Image 1 style */}
        <div style={{padding:'24px 32px', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:16, marginTop:8}}>
          <button onClick={handleReset}
            style={{background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:13, fontWeight:600, color:C.textSecondary, padding:'10px 4px'}}>
            Reset All
          </button>
          <button onClick={handleApply}
            onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
            style={{background:C.primary, color:C.white, border:'none', borderRadius:10, fontFamily:F.body, fontSize:13, fontWeight:700, padding:'12px 28px', cursor:'pointer', letterSpacing:'0.04em'}}>
            Apply Filters
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── FILTER SIDEBAR (Stage 2 — Image 2 pattern) ────────────────────────────────
// Appears after first filter apply. Stays on page for further refinement.
// Width 220px, white bg, left of the cards grid.
function FilterSidebar({ filters, references, onChange, onApply, onReset }) {
  const [local, setLocal] = useState({ ...filters });
  const set = (k, v) => {
    const updated = { ...local, [k]: v };
    setLocal(updated);
  };
  // Sync if parent filters change (e.g. reset from outside)
  useEffect(() => { setLocal({ ...filters }); }, [filters]);

  const currencyOptions = [
    { value: '', label: 'All Currencies' },
    ...((references?.currencies || []).map(c => ({ value: c.ref_code, label: `${c.ref_code} — ${c.ref_value}` }))),
  ];
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];
  const receiverOptions = [
    { value: '', label: 'All Receivers' },
    ...RECEIVER_OPTIONS,
  ];

  return (
    <div style={{width:220, flexShrink:0, background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:'20px 18px', display:'flex', flexDirection:'column', gap:0, alignSelf:'flex-start', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
      {/* Header */}
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${C.border}`}}>
        <SvgFunnel size={15} color={C.primary}/>
        <span style={{fontFamily:F.headline, fontSize:15, fontWeight:700, color:C.textPrimary}}>Plan Filter(s)</span>
      </div>

      {/* Status */}
      <div style={{marginBottom:18}}>
        <FilterDropdown
          icon={<SvgStatusIcon/>}
          label="Plan Status"
          value={local.status}
          onChange={v => set('status', v)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </div>

      {/* Currency */}
      <div style={{marginBottom:18}}>
        <FilterDropdown
          icon={<SvgCurrencyIcon/>}
          label="Currency"
          value={local.currency}
          onChange={v => set('currency', v)}
          options={currencyOptions}
          placeholder="All Currencies"
        />
      </div>

      {/* Receiver */}
      <div style={{marginBottom:18}}>
        <FilterDropdown
          icon={<SvgReceiverIcon/>}
          label="Receiver"
          value={local.receiver}
          onChange={v => set('receiver', v)}
          options={receiverOptions}
          placeholder="All Receivers"
        />
      </div>

      {/* Unit Range */}
      <div style={{marginBottom:22}}>
        <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:7}}>
          <SvgUnitIcon/>
          <span style={{fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textSecondary, letterSpacing:'0.1em', textTransform:'uppercase'}}>Unit Range</span>
        </div>
        <input type="number" min="0" placeholder="Min units" value={local.unitMin}
          onChange={e => set('unitMin', e.target.value)}
          style={{width:'100%', boxSizing:'border-box', background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 11px', fontFamily:F.body, fontSize:13, color:C.textPrimary, outline:'none', marginBottom:8}}/>
        <input type="number" min="0" placeholder="Max units" value={local.unitMax}
          onChange={e => set('unitMax', e.target.value)}
          style={{width:'100%', boxSizing:'border-box', background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 11px', fontFamily:F.body, fontSize:13, color:C.textPrimary, outline:'none'}}/>
      </div>

      {/* Apply Filter — full width primary, Image 2 style */}
      <button onClick={() => onApply(local)}
        onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
        onMouseLeave={e => e.currentTarget.style.background = C.primary}
        style={{width:'100%', background:C.primary, color:C.white, border:'none', borderRadius:8, fontFamily:F.body, fontSize:13, fontWeight:700, padding:'11px', cursor:'pointer', marginBottom:8, letterSpacing:'0.04em'}}>
        Apply Filter
      </button>

      {/* Reset — full width secondary */}
      <button onClick={onReset}
        style={{width:'100%', background:C.white, color:C.textSecondary, border:`1px solid ${C.border}`, borderRadius:8, fontFamily:F.body, fontSize:13, fontWeight:600, padding:'10px', cursor:'pointer'}}>
        Reset
      </button>
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, onViewDetails }) {
  const [hover, setHover] = useState(false);
  const theme = planTheme(plan.name);
  const isEnterprise = plan.unit_limit_max === null || plan.unit_limit_max === undefined;
  const currency = plan.monthly_price_currency || 'USD';

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{background:C.white, borderRadius:14, border:`1px solid ${hover ? C.borderMedium : C.border}`, overflow:'hidden', display:'flex', flexDirection:'column', transition:'box-shadow 0.2s, border-color 0.2s', boxShadow: hover ? '0 8px 24px rgba(0,45,91,0.10)' : '0 2px 8px rgba(0,0,0,0.04)'}}>

      {/* Hero — shows uploaded image if available, dark grid theme otherwise */}
      <div style={{height:148, background:theme.bg, position:'relative', overflow:'hidden', flexShrink:0, borderRadius:'14px 14px 0 0'}}>
        {plan.image_url
          ? <img src={plan.image_url} alt={plan.name} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}}/>
          : <div style={{position:'absolute', inset:0, backgroundImage:`linear-gradient(${theme.accent}18 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}18 1px, transparent 1px)`, backgroundSize:'24px 24px'}}/>
        }
        {/* Dark gradient overlay — ensures text legibility over both image and grid */}
        <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 100%)'}}/>
        <div style={{position:'absolute', top:10, right:10}}>
          <span style={{background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, padding:'3px 8px', fontFamily:F.body, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.06em'}}>{currency}</span>
        </div>
        <div style={{position:'absolute', top:10, left:10}}>
          <StatusBadge status={plan.status}/>
        </div>
        <div style={{position:'absolute', bottom:0, left:0, right:0, padding:'28px 14px 10px'}}>
          <h3 style={{fontFamily:F.headline, fontSize:17, fontWeight:700, color:C.white, margin:0}}>{plan.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div style={{padding:'12px 14px 14px', flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{marginBottom:8}}>
          <span style={{background:C.neutral, borderRadius:20, padding:'2px 8px', fontFamily:F.body, fontSize:10, color:C.textSecondary}}>
            {fmtUnitRange(plan)}
          </span>
        </div>
        <div style={{marginBottom:8}}>
          {isEnterprise
            ? <span style={{fontFamily:F.headline, fontSize:17, fontWeight:700, color:C.textSecondary}}>Custom pricing</span>
            : <div>
                <span style={{fontFamily:F.headline, fontSize:19, fontWeight:700, color:C.textPrimary}}>{fmtPrice(plan.monthly_price, currency)}</span>
                <span style={{fontFamily:F.body, fontSize:11, color:C.textSecondary, marginLeft:3}}>/ mo</span>
                {plan.annual_price && (
                  <div><span style={{fontFamily:F.body, fontSize:11, color:C.textSecondary}}>({fmtPrice(plan.annual_price, plan.annual_price_currency || currency)} / yr)</span></div>
                )}
              </div>
          }
        </div>
        <p style={{fontFamily:F.body, fontSize:12, color:C.textSecondary, margin:'0 0 14px', lineHeight:1.5, flex:1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
          {plan.short_description || '—'}
        </p>
        <button onClick={() => onViewDetails(plan)}
          style={{width:'100%', padding:'9px', border:`1px solid ${hover ? C.primary : C.borderMedium}`, borderRadius:8, background: hover ? C.neutral : 'transparent', fontFamily:F.body, fontSize:11, fontWeight:700, color: hover ? C.primary : C.textPrimary, textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer', transition:'all 0.15s'}}>
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Plan Detail Panel (z-200) ─────────────────────────────────────────────────
function PlanDetailPanel({ plan, onClose, onEdit, onDelete, onShowHistory }) {
  const currency = plan.monthly_price_currency || 'USD';
  const isEnterprise = plan.unit_limit_max === null || plan.unit_limit_max === undefined;
  const theme = planTheme(plan.name);
  const receiverLabels = (plan.receivers || []).map(r => RECEIVER_OPTIONS.find(o => o.value===r)?.label || r).join(', ');
  const dl = {fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textTertiary, letterSpacing:'0.08em', textTransform:'uppercase', margin:'0 0 6px'};
  const dv = {fontFamily:F.body, fontSize:13, color:C.textPrimary, margin:0, lineHeight:1.5};

  return (
    <div style={{position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:'rgba(15,23,42,0.25)', backdropFilter:'blur(2px)'}}/>
      <div style={{position:'relative', zIndex:1, width:'100%', maxWidth:640, background:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', maxHeight:'92vh', display:'flex', flexDirection:'column'}}>

        {/* Hero — shows uploaded image if available, dark grid theme otherwise */}
        <div style={{height:180, background:theme.bg, position:'relative', overflow:'hidden', flexShrink:0}}>
          {plan.image_url
            ? <img src={plan.image_url} alt={plan.name} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}}/>
            : <div style={{position:'absolute', inset:0, backgroundImage:`linear-gradient(${theme.accent}20 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}20 1px, transparent 1px)`, backgroundSize:'24px 24px'}}/>
          }
          {/* Dark gradient overlay — ensures text legibility over both image and grid */}
          <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 100%)'}}/>
          <div style={{position:'absolute', inset:0, display:'flex', alignItems:'flex-end', padding:'20px 24px'}}>
            <div>
              <h2 style={{fontFamily:F.headline, fontSize:26, fontWeight:700, color:C.white, margin:'0 0 6px'}}>{plan.name}</h2>
              <span style={{background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:20, padding:'2px 10px', fontFamily:F.body, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.06em'}}>{fmtUnitRange(plan)}</span>
            </div>
          </div>
          <div style={{position:'absolute', top:12, right:12, display:'flex', alignItems:'center', gap:8}}>
            <span style={{background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, padding:'3px 8px', fontFamily:F.body, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.06em'}}>{currency}</span>
            <button onClick={onClose} style={{width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <SvgX size={14} color={C.white}/>
            </button>
          </div>
          <div style={{position:'absolute', top:14, left:14}}><StatusBadge status={plan.status}/></div>
        </div>

        {/* Body */}
        <div style={{display:'flex', flex:1, overflowY:'auto', minHeight:420}}>
          <div style={{flex:1, padding:'clamp(16px,2vw,24px)', borderRight:`1px solid ${C.border}`}}>
            <p style={dl}>Short Description</p>
            <p style={{...dv, fontWeight:500, marginBottom:20}}>{plan.short_description || '—'}</p>
            <p style={dl}>Full Description</p>
            <p style={{...dv, fontWeight:400, color:C.textSecondary, lineHeight:1.6}}>{plan.long_description || '—'}</p>
          </div>
          <div style={{width:'clamp(160px,18vw,200px)', flexShrink:0, padding:'clamp(16px,2vw,24px) clamp(12px,1.5vw,20px)', display:'flex', flexDirection:'column', gap:18}}>
            <div>
              <p style={dl}>Monthly Price</p>
              {isEnterprise
                ? <span style={{fontFamily:F.headline, fontSize:16, fontWeight:700, color:C.textSecondary}}>Custom</span>
                : <span style={{fontFamily:F.headline, fontSize:'clamp(18px,1.8vw,22px)', fontWeight:700, color:C.textPrimary}}>{fmtPrice(plan.monthly_price, currency)}<span style={{fontFamily:F.body, fontSize:12, color:C.textSecondary, fontWeight:400}}>/mo</span></span>
              }
            </div>
            {plan.annual_price && (
              <div>
                <p style={dl}>Annual Price</p>
                <span style={{fontFamily:F.headline, fontSize:16, fontWeight:700, color:C.textPrimary}}>{fmtPrice(plan.annual_price, plan.annual_price_currency||currency)}<span style={{fontFamily:F.body, fontSize:12, color:C.textSecondary, fontWeight:400}}>/yr</span></span>
              </div>
            )}
            <div><p style={dl}>Unit Range</p><span style={dv}>{fmtUnitRange(plan)}</span></div>
            <div><p style={dl}>Receivers</p><span style={dv}>{receiverLabels || '—'}</span></div>
            <div><p style={dl}>Display Order</p><span style={dv}>{plan.display_order ?? '—'}</span></div>
            {plan.scheduled_status && (
              <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16}}>
                <p style={dl}>Scheduled Change</p>
                <StatusBadge status={plan.scheduled_status}/>
                {plan.effective_from && <p style={{fontFamily:F.body, fontSize:11, color:C.textSecondary, margin:'6px 0 0'}}>Effective: {fmtDate(plan.effective_from)}</p>}
              </div>
            )}
            {(plan.start_date || plan.end_date) && (
              <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16}}>
                {plan.start_date && <><p style={dl}>Start Date</p><p style={{...dv, marginBottom:12}}>{fmtDate(plan.start_date)}</p></>}
                {plan.end_date && <><p style={dl}>End Date</p><p style={dv}>{fmtDate(plan.end_date)}</p></>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'16px 24px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:C.white, flexShrink:0}}>
          <button onClick={() => onDelete(plan)} style={{display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:12, fontWeight:700, color:C.danger, textTransform:'uppercase', letterSpacing:'0.06em', padding:'8px 0'}}>
            <SvgTrash size={15} color={C.danger}/> Delete Plan
          </button>
          <div style={{display:'flex', gap:10}}>
            <button onClick={() => onShowHistory(plan)} style={{display:'flex', alignItems:'center', gap:6, background:C.neutral, color:C.textSecondary, border:`1px solid ${C.border}`, borderRadius:8, fontFamily:F.body, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'10px 16px', cursor:'pointer'}}>
              <SvgHistory size={14} color={C.textSecondary}/> History
            </button>
            <button onClick={() => onEdit(plan)} style={{background:C.primary, color:C.white, border:'none', borderRadius:8, fontFamily:F.body, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'10px 20px', cursor:'pointer'}}>
              Edit Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── History Popup (z-300 — layered over View popup) ──────────────────────────
function HistoryPopup({ plan, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGetHistory(plan.id);
        if (!cancelled) setHistory(data);
      } catch { if (!cancelled) setError('Could not load history.'); }
      finally   { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [plan.id]);

  const FIELD_LABELS = { monthly_price:'Monthly Price', annual_price:'Annual Price', monthly_price_currency:'Monthly Currency', annual_price_currency:'Annual Currency', status:'Status' };

  return (
    <div style={{position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:'rgba(15,23,42,0.18)', backdropFilter:'blur(1px)'}}/>
      <div style={{position:'relative', zIndex:1, width:'100%', maxWidth:640, background:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.22)', maxHeight:'72vh', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'20px 24px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
          <h3 style={{fontFamily:F.headline, fontSize:20, fontWeight:700, color:C.textPrimary, margin:0}}>Price Change History — {plan.name}</h3>
          <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center'}}><SvgX size={18} color={C.textSecondary}/></button>
        </div>
        <div style={{flex:1, overflowY:'auto', minHeight:320}}>
          {loading ? (
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', padding:'48px 0', gap:10}}>
              <Spinner size={20}/><span style={{fontFamily:F.body, fontSize:13, color:C.textSecondary}}>Loading history...</span>
            </div>
          ) : error ? (
            <div style={{textAlign:'center', padding:'40px 20px'}}><p style={{fontFamily:F.body, fontSize:13, color:C.danger}}>{error}</p></div>
          ) : history.length === 0 ? (
            <div style={{textAlign:'center', padding:'48px 20px'}}>
              <div style={{display:'flex', justifyContent:'center', marginBottom:12}}><SvgClock size={32} color={C.textTertiary}/></div>
              <p style={{fontFamily:F.body, fontSize:14, fontWeight:600, color:C.textSecondary, margin:'0 0 6px'}}>No changes recorded yet</p>
              <p style={{fontFamily:F.body, fontSize:12, color:C.textTertiary, margin:0}}>Price and status changes will appear here</p>
            </div>
          ) : (
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:C.neutral}}>
                  {['Date','Field','Old Value','New Value','Changed By'].map(col => (
                    <th key={col} style={{padding:'10px 14px', fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'left', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap'}}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={row.id||i} style={{borderBottom:`1px solid ${C.border}`, background: i%2===0 ? C.white : '#FAFBFC'}}>
                    <td style={{padding:'10px 14px', fontFamily:F.body, fontSize:12, color:C.textSecondary, whiteSpace:'nowrap'}}>{fmtDateTime(row.changed_at)}</td>
                    <td style={{padding:'10px 14px', fontFamily:F.body, fontSize:12, fontWeight:600, color:C.textPrimary, whiteSpace:'nowrap'}}>{FIELD_LABELS[row.field_changed]||row.field_changed}</td>
                    <td style={{padding:'10px 14px', fontFamily:F.body, fontSize:12, color:C.danger}}>{row.old_value||'—'}</td>
                    <td style={{padding:'10px 14px', fontFamily:F.body, fontSize:12, color:C.green, fontWeight:600}}>{row.new_value||'—'}</td>
                    <td style={{padding:'10px 14px', fontFamily:F.body, fontSize:11, color:C.textSecondary}}>
                      <div>{row.changed_by_name||row.changed_by_email||'—'}</div>
                      {row.notes && <div style={{color:C.textTertiary, marginTop:2}}>{row.notes}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Plan Form Modal (Add / Edit) ──────────────────────────────────────────────
function PlanFormModal({ mode, plan, references, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const emptyForm = {
    name:'', short_description:'', long_description:'',
    receivers:[], icon:'ti-plan', display_order:0,
    unit_limit_min:0, unit_limit_max:'',
    monthly_price:'', monthly_price_currency:'USD',
    annual_price:'', annual_price_currency:'USD',
    status:'ACTIVE',
    scheduled_status:'', effective_from:'', term_on:'',
    start_date:'', end_date:'',
  };
  const [form, setForm]     = useState(isEdit ? { ...emptyForm, ...plan, unit_limit_max: plan?.unit_limit_max??'', annual_price: plan?.annual_price??'', annual_price_currency: plan?.annual_price_currency||'USD', scheduled_status: plan?.scheduled_status||'', effective_from: plan?.effective_from||'', term_on: plan?.term_on||'', start_date: plan?.start_date||'', end_date: plan?.end_date||'' } : emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [annualOpen, setAnnualOpen] = useState(!!(plan?.annual_price));
  const [isUnlimited, setIsUnlimited] = useState(isEdit && (plan?.unit_limit_max === null || plan?.unit_limit_max === undefined));
  const [receiverOpen, setReceiverOpen]       = useState(false);
  const [statusOpen, setStatusOpen]           = useState(false);
  const [mCurrOpen, setMCurrOpen]             = useState(false);
  const [aCurrOpen, setACurrOpen]             = useState(false);
  const [schedStatusOpen, setSchedStatusOpen] = useState(false);
  // Image upload state
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(plan?.image_url || plan?.image || null);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef                    = React.useRef();

  const handleImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleReceiver = (val) => set('receivers', form.receivers.includes(val) ? form.receivers.filter(r => r!==val) : [...form.receivers, val]);

  const currencyOptions = (references?.currencies||[]).length
    ? (references.currencies||[]).map(c => ({ value:c.ref_code, label:`${c.ref_code} — ${c.ref_value}` }))
    : Object.keys(CURRENCY_SYMBOLS).map(k => ({ value:k, label:k }));
  const statusOptions = (references?.statuses||[]).length
    ? (references.statuses||[]).map(s => ({ value:s.ref_code, label: s.ref_value||STATUS_LABELS[s.ref_code]||s.ref_code }))
    : Object.entries(STATUS_LABELS).map(([v,l]) => ({ value:v, label:l }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name = 'Plan name is required';
    if (!form.short_description.trim()) e.short_description = 'Short description is required';
    if (form.receivers.length === 0)    e.receivers = 'Select at least one receiver';
    if (form.monthly_price===''||isNaN(form.monthly_price)) e.monthly_price = 'Valid monthly price is required';
    if (!isUnlimited) {
      const max = parseFloat(form.unit_limit_max), min = parseFloat(form.unit_limit_min);
      if (isNaN(max)||form.unit_limit_max==='') e.unit_limit_max = 'Valid max units required (or check Unlimited)';
      else if (max <= min) e.unit_limit_max = 'Max must be greater than min';
    }
    if (Object.keys(e).length) { setErrors(e); return false; }
    return true;
  };

  const buildFormData = () => {
    // Rule: NEVER send empty string '' for nullable numeric/decimal Django fields.
    // DRF DecimalField and IntegerField accept null (via allow_null=True) but NOT ''.
    // Strategy: omit nullable fields entirely when they have no value — partial=True
    // PATCH leaves them unchanged; for CREATE the model default (null) applies.

    const fd = new FormData();

    // ── Always-required fields ──────────────────────────────────────────────
    fd.append('name',                   form.name);
    fd.append('short_description',      form.short_description);
    fd.append('long_description',       form.long_description || '');
    fd.append('receivers',              JSON.stringify(form.receivers));
    fd.append('icon',                   form.icon || 'ti-plan');
    fd.append('display_order',          parseInt(form.display_order) || 0);
    fd.append('unit_limit_min',         parseInt(form.unit_limit_min) || 0);
    fd.append('monthly_price',          parseFloat(form.monthly_price) || 0);
    fd.append('monthly_price_currency', form.monthly_price_currency || 'USD');
    fd.append('status',                 form.status || 'ACTIVE');

    // ── unit_limit_max: integer or null ─────────────────────────────────────
    // Unlimited = null. Do NOT send '' — send nothing and let partial PATCH
    // preserve null, OR send the integer for a defined max.
    if (!isUnlimited && form.unit_limit_max !== '' && form.unit_limit_max !== null) {
      fd.append('unit_limit_max', parseInt(form.unit_limit_max));
    }
    // isUnlimited: omit field entirely — model default null stays

    // ── Annual pricing: decimal or omit ─────────────────────────────────────
    // Only send when toggle is ON and value is present.
    // When toggle is OFF: omit entirely on PATCH (preserve existing).
    // To explicitly CLEAR annual price on edit, the user must toggle off — 
    // handled by the backend receiving no annual_price field (partial PATCH).
    if (annualOpen && form.annual_price !== '' && form.annual_price !== null) {
      fd.append('annual_price',          parseFloat(form.annual_price) || 0);
      fd.append('annual_price_currency', form.annual_price_currency || 'USD');
    }
    // annualOpen is false: omit both — partial PATCH keeps existing value
    // This means "save without changing annual price" on edit
    // If user explicitly toggled OFF to clear: that's a Phase 2 UX improvement

    // ── Scheduled status: string or omit ────────────────────────────────────
    if (form.scheduled_status) {
      fd.append('scheduled_status', form.scheduled_status);
      if (form.effective_from) fd.append('effective_from', form.effective_from);
      if (form.term_on)        fd.append('term_on',        form.term_on);
    }
    // No scheduled status: omit to preserve existing, or send '' to clear
    // CharField accepts '' (blank) so this is safe unlike DecimalField
    if (!form.scheduled_status) fd.append('scheduled_status', '');

    // ── Optional dates ───────────────────────────────────────────────────────
    if (form.start_date) fd.append('start_date', form.start_date);
    if (form.end_date)   fd.append('end_date',   form.end_date);

    // ── Image ────────────────────────────────────────────────────────────────
    // Only append if a NEW file was selected. Omitting preserves existing image.
    if (imageFile) fd.append('image', imageFile);

    return fd;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setApiError('');
    try {
      const saved = isEdit ? await apiUpdatePlan(plan.id, buildFormData()) : await apiCreatePlan(buildFormData());
      onSaved(saved, isEdit);
    } catch (err) { setApiError(err.message||'Something went wrong.'); }
    finally { setSaving(false); }
  };

  const inp = (err) => ({ width:'100%', boxSizing:'border-box', background:C.neutral, border:`1px solid ${err ? C.danger : C.border}`, borderRadius:8, padding:'10px 12px', fontFamily:F.body, fontSize:13, color:C.textPrimary, outline:'none' });
  const lbl = { fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textSecondary, letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:6 };
  const err = { fontFamily:F.body, fontSize:11, color:C.danger, marginTop:4 };
  const sec = { fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textTertiary, letterSpacing:'0.08em', textTransform:'uppercase', margin:'0 0 4px' };

  return (
    <div style={{position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(3px)'}}/>
      <div style={{position:'relative', zIndex:1, width:'100%', maxWidth:620, background:C.white, borderRadius:16, boxShadow:'0 24px 60px rgba(0,0,0,0.2)', maxHeight:'94vh', display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <div style={{padding:'20px 28px 0', flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{fontFamily:F.headline, fontSize:22, fontWeight:700, color:C.textPrimary, margin:0}}>{isEdit ? 'Edit Plan' : 'Add New Plan'}</h2>
          <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center'}}><SvgX size={18} color={C.textSecondary}/></button>
        </div>
        <div style={{overflowY:'auto', flex:1, padding:'16px 28px 8px'}}>
          {apiError && <ErrorBanner message={apiError} onDismiss={() => setApiError('')}/>}

          {/* ── Image Upload — same pattern as Service Catalog ── */}
          <div style={{marginBottom:20}}>
            <label style={lbl}>Plan Image</label>
            {imagePreview ? (
              <div style={{position:'relative', borderRadius:10, overflow:'hidden'}}>
                <img src={imagePreview} alt="" style={{width:'100%', height:180, objectFit:'cover', display:'block'}}/>
                <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                  style={{position:'absolute', top:10, right:10, width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <SvgX size={12} color={C.white}/>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
                style={{border:`2px dashed ${dragOver ? C.primary : C.borderMedium}`, borderRadius:10, padding:'32px 20px', textAlign:'center', cursor:'pointer', background: dragOver ? '#EEF2FF' : C.neutral, transition:'all 0.15s'}}>
                <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke={C.textTertiary} strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill={C.textTertiary}/>
                    <path d="M3 15l5-5 4 4 3-3 6 6" stroke={C.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 7h4M17 5v4" stroke={C.textTertiary} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{fontFamily:F.body, fontSize:13, color:C.textSecondary, margin:'0 0 4px'}}>Click to upload or drag and drop</p>
                <p style={{fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textTertiary, letterSpacing:'0.06em', textTransform:'uppercase', margin:0}}>High-resolution JPG or PNG preferred</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handleImageFile(e.target.files[0])}/>
          </div>

          <div style={{marginBottom:16}}>
            <label style={lbl}>Plan Name</label>
            <input style={inp(errors.name)} placeholder="e.g., Starter, Growth, Professional" value={form.name} onChange={e => set('name', e.target.value)}/>
            {errors.name && <p style={err}>{errors.name}</p>}
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Short Description</label>
            <textarea style={{...inp(errors.short_description), height:72, resize:'vertical'}} placeholder="Brief description shown on the plan card..." value={form.short_description} onChange={e => set('short_description', e.target.value)}/>
            {errors.short_description && <p style={err}>{errors.short_description}</p>}
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Full Description</label>
            <textarea style={{...inp(), height:90, resize:'vertical'}} placeholder="Detailed plan description, features, limitations..." value={form.long_description} onChange={e => set('long_description', e.target.value)}/>
          </div>

          {/* Receivers */}
          <div style={{marginBottom:16}}>
            <label style={lbl}>Plan Receivers</label>
            <div style={{position:'relative'}}>
              <div onClick={() => setReceiverOpen(o => !o)} style={{...inp(errors.receivers), display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background: receiverOpen ? '#E4ECFC' : C.neutral, border:`1px solid ${receiverOpen ? '#BFDBFE' : errors.receivers ? C.danger : C.border}`}}>
                <span style={{color: form.receivers.length ? C.textPrimary : C.textTertiary, fontSize:13}}>
                  {form.receivers.length ? form.receivers.map(r => RECEIVER_OPTIONS.find(o => o.value===r)?.label).filter(Boolean).join(', ') : 'Select receivers...'}
                </span>
                <SvgChevron direction={receiverOpen ? 'up' : 'down'}/>
              </div>
              {receiverOpen && (
                <div style={{position:'absolute', top:'100%', left:0, right:0, zIndex:60, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', marginTop:4}}>
                  {RECEIVER_OPTIONS.map(opt => {
                    const sel = form.receivers.includes(opt.value);
                    return (
                      <div key={opt.value} onClick={() => toggleReceiver(opt.value)} style={{padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, background: sel ? '#E4ECFC' : 'transparent', fontFamily:F.body, fontSize:13, color: sel ? C.primary : C.textPrimary, fontWeight: sel ? 600 : 400}}>
                        <div style={{width:16, height:16, borderRadius:4, border:`2px solid ${sel ? C.primary : C.borderMedium}`, background: sel ? C.primary : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                          {sel && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {opt.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {errors.receivers && <p style={err}>{errors.receivers}</p>}
          </div>

          {/* Unit Range */}
          <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:16}}>
            <p style={sec}>Unit Range</p>
            <p style={{fontFamily:F.body, fontSize:12, color:C.textSecondary, margin:'0 0 12px', lineHeight:1.5}}>Minimum and maximum units for this plan tier.</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div>
                <label style={lbl}>Min Units</label>
                <input type="number" min="0" style={inp()} value={form.unit_limit_min} onChange={e => set('unit_limit_min', e.target.value)}/>
              </div>
              <div>
                <label style={lbl}>Max Units</label>
                <input type="number" min="0" style={inp(errors.unit_limit_max)} placeholder={isUnlimited ? 'Unlimited' : 'e.g., 200'} value={isUnlimited ? '' : form.unit_limit_max} onChange={e => set('unit_limit_max', e.target.value)} disabled={isUnlimited}/>
                {errors.unit_limit_max && <p style={err}>{errors.unit_limit_max}</p>}
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginTop:10}}>
              <div onClick={() => setIsUnlimited(v => !v)} style={{width:36, height:20, borderRadius:10, background: isUnlimited ? C.primary : C.borderMedium, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0}}>
                <div style={{position:'absolute', top:2, left: isUnlimited ? 18 : 2, width:16, height:16, borderRadius:'50%', background:C.white, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
              </div>
              <span style={{fontFamily:F.body, fontSize:12, color: isUnlimited ? C.primary : C.textSecondary, fontWeight: isUnlimited ? 600 : 400}}>Unlimited (Enterprise — null max)</span>
            </div>
          </div>

          {/* Monthly Pricing */}
          <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:16}}>
            <p style={sec}>Monthly Pricing</p>
            <p style={{fontFamily:F.body, fontSize:12, color:C.textSecondary, margin:'0 0 12px', lineHeight:1.5}}>Set to $0 for Enterprise (custom/sales pricing).</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div>
                <label style={lbl}>Monthly Price</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontFamily:F.body, fontSize:13, color:C.textSecondary}}>{currSymbol(form.monthly_price_currency)}</span>
                  <input type="number" step="0.01" min="0" style={{...inp(errors.monthly_price), paddingLeft: form.monthly_price_currency?.length>2 ? 52 : 30}} placeholder="0.00" value={form.monthly_price} onChange={e => set('monthly_price', e.target.value)}/>
                </div>
                {errors.monthly_price && <p style={err}>{errors.monthly_price}</p>}
              </div>
              <div>
                <label style={lbl}>Currency</label>
                <FormDropdown value={form.monthly_price_currency} onChange={v => set('monthly_price_currency', v)} options={currencyOptions} open={mCurrOpen} setOpen={setMCurrOpen}/>
              </div>
            </div>
          </div>

          {/* Annual Pricing */}
          <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:16}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: annualOpen ? 12 : 0}}>
              <div>
                <p style={sec}>Annual Pricing</p>
                <p style={{fontFamily:F.body, fontSize:11, color:C.textSecondary, margin:'2px 0 0'}}>Optional — Phase 1</p>
              </div>
              <div onClick={() => setAnnualOpen(o => !o)} style={{width:36, height:20, borderRadius:10, background: annualOpen ? C.primary : C.borderMedium, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0}}>
                <div style={{position:'absolute', top:2, left: annualOpen ? 18 : 2, width:16, height:16, borderRadius:'50%', background:C.white, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
              </div>
            </div>
            {annualOpen && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                <div>
                  <label style={lbl}>Annual Price</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontFamily:F.body, fontSize:13, color:C.textSecondary}}>{currSymbol(form.annual_price_currency)}</span>
                    <input type="number" step="0.01" min="0" style={{...inp(), paddingLeft: form.annual_price_currency?.length>2 ? 52 : 30}} placeholder="0.00" value={form.annual_price} onChange={e => set('annual_price', e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Annual Currency</label>
                  <FormDropdown value={form.annual_price_currency} onChange={v => set('annual_price_currency', v)} options={currencyOptions} open={aCurrOpen} setOpen={setACurrOpen}/>
                </div>
              </div>
            )}
          </div>

          {/* Status + Order */}
          <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:16}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div>
                <label style={lbl}>Plan Status</label>
                <FormDropdown value={form.status} onChange={v => set('status', v)} options={statusOptions} open={statusOpen} setOpen={setStatusOpen}/>
              </div>
              <div>
                <label style={lbl}>Display Order</label>
                <input type="number" min="0" style={inp()} value={form.display_order} onChange={e => set('display_order', e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Scheduled Status */}
          <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:8}}>
            <p style={sec}>Scheduled Status Change</p>
            <p style={{fontFamily:F.body, fontSize:12, color:C.textSecondary, margin:'0 0 12px', lineHeight:1.5}}>Suspension takes effect end of billing month. Reactivation is immediate. (Rules UNPLAN_SUS_001–006)</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14}}>
              <div>
                <label style={lbl}>Scheduled Status</label>
                <div style={{position:'relative'}}>
                  <div onClick={() => setSchedStatusOpen(o => !o)} style={{...inp(), display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background: schedStatusOpen ? '#E4ECFC' : C.neutral, border:`1px solid ${schedStatusOpen ? '#BFDBFE' : C.border}`}}>
                    <span style={{fontSize:13, color: form.scheduled_status ? C.textPrimary : C.textTertiary}}>{form.scheduled_status ? (STATUS_LABELS[form.scheduled_status]||form.scheduled_status) : 'None'}</span>
                    <SvgChevron direction={schedStatusOpen ? 'up' : 'down'}/>
                  </div>
                  {schedStatusOpen && (
                    <div style={{position:'absolute', top:'100%', left:0, right:0, zIndex:60, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', marginTop:4}}>
                      {[{value:'',label:'None'}, ...statusOptions].map(opt => (
                        <div key={opt.value} onClick={() => { set('scheduled_status', opt.value); setSchedStatusOpen(false); }} style={{padding:'10px 14px', cursor:'pointer', fontFamily:F.body, fontSize:13, color: form.scheduled_status===opt.value ? C.primary : C.textPrimary, fontWeight: form.scheduled_status===opt.value ? 600 : 400, background: form.scheduled_status===opt.value ? '#E4ECFC' : 'transparent'}}>
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={lbl}>Effective From</label>
                <input type="date" style={{...inp(), opacity: form.scheduled_status ? 1 : 0.5}} value={form.effective_from} onChange={e => set('effective_from', e.target.value)} disabled={!form.scheduled_status}/>
              </div>
              <div>
                <label style={lbl}>Term On</label>
                <input type="date" style={{...inp(), opacity: form.scheduled_status ? 1 : 0.5}} value={form.term_on} onChange={e => set('term_on', e.target.value)} disabled={!form.scheduled_status}/>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={{borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:8}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              {[['Start Date','start_date'],['End Date','end_date']].map(([l,k]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input type="date" style={inp()} value={form[k]} onChange={e => set(k, e.target.value)}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{padding:'14px 28px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'flex-end', gap:12, flexShrink:0, background:C.white}}>
          <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:12, fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.06em', padding:'10px 16px'}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{background: saving ? C.borderMedium : C.primary, color:C.white, border:'none', borderRadius:8, fontFamily:F.body, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'10px 24px', cursor: saving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:8}}>
            {saving && <Spinner size={14}/>}
            {isEdit ? 'Save Changes' : 'Save Plan'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ plan, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState('');
  const handleConfirm = async () => {
    setDeleting(true);
    try { await apiDeletePlan(plan.id); onDeleted(plan.id); }
    catch { setApiError('Could not delete plan. Please try again.'); setDeleting(false); }
  };
  return (
    <div style={{position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:'rgba(15,23,42,0.5)'}}/>
      <div style={{position:'relative', zIndex:1, width:420, background:C.white, borderRadius:16, padding:32, boxShadow:'0 24px 60px rgba(0,0,0,0.2)', textAlign:'center'}}>
        <div style={{width:52, height:52, borderRadius:'50%', background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
          <SvgTrash size={22} color={C.danger}/>
        </div>
        <h3 style={{fontFamily:F.headline, fontSize:18, fontWeight:700, color:C.textPrimary, margin:'0 0 8px'}}>Delete Plan?</h3>
        <p style={{fontFamily:F.body, fontSize:13, color:C.textSecondary, margin:'0 0 16px', lineHeight:1.5}}><strong>{plan.name}</strong> will be permanently removed. This cannot be undone.</p>
        {apiError && <p style={{fontFamily:F.body, fontSize:12, color:C.danger, marginBottom:12}}>{apiError}</p>}
        <div style={{display:'flex', gap:12, justifyContent:'center'}}>
          <button onClick={onClose} style={{padding:'10px 20px', border:`1px solid ${C.border}`, borderRadius:8, background:C.white, fontFamily:F.body, fontSize:13, fontWeight:600, color:C.textSecondary, cursor:'pointer'}}>Cancel</button>
          <button onClick={handleConfirm} disabled={deleting} style={{padding:'10px 20px', border:'none', borderRadius:8, background:C.danger, fontFamily:F.body, fontSize:13, fontWeight:700, color:C.white, cursor: deleting ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:8}}>
            {deleting && <Spinner size={14}/>}{deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Apply filters to plan list ────────────────────────────────────────────────
function applyFilters(plans, activeTab, filters) {
  return plans.filter(p => {
    const planReceivers = p.receivers || [];

    // 1. Receiver tab — plan must serve at least one receiver this tab covers
    const tab = RECEIVER_TABS.find(t => t.id === activeTab);
    if (tab?.receivers && !planReceivers.some(r => tab.receivers.includes(r))) return false;

    // 2. Filter panel receiver — plan must include the selected receiver.
    //    Also enforce tab scope: if tab=org_pms and filter=INDEPENDENT_PM → 0 results.
    if (filters.receiver) {
      if (!planReceivers.includes(filters.receiver)) return false;
      if (tab?.receivers && !tab.receivers.includes(filters.receiver)) return false;
    }

    // 3. Status
    if (filters.status && p.status !== filters.status) return false;

    // 4. Currency
    if (filters.currency && p.monthly_price_currency !== filters.currency) return false;

    // 5. Unit range
    if (filters.unitMin !== '' && filters.unitMin !== null && filters.unitMin !== undefined) {
      if ((p.unit_limit_min ?? 0) < parseFloat(filters.unitMin)) return false;
    }
    if (filters.unitMax !== '' && filters.unitMax !== null && filters.unitMax !== undefined) {
      const max = p.unit_limit_max;
      if (max !== null && max !== undefined && max > parseFloat(filters.unitMax)) return false;
    }

    return true;
  });
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function UNAdminPlanCatalog() {
  const [activeTab, setActiveTab]         = useState('all');
  const [plans, setPlans]                 = useState([]);
  const [references, setReferences]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState('');

  // Filter state
  // appliedFilters = what's currently filtering the results (empty = no filter = default view)
  // filterPopupOpen = Stage 1 popup
  // isFiltered = whether sidebar should show (Stage 2 layout)
  const [appliedFilters, setAppliedFilters]   = useState({ ...EMPTY_FILTERS });
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const isFiltered = !filtersAreEmpty(appliedFilters);

  // Popups / modals
  const [selectedPlan, setSelectedPlan]   = useState(null);
  const [historyPlan, setHistoryPlan]     = useState(null);
  const [modal, setModal]                 = useState(null);
  const [editTarget, setEditTarget]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [plansData, refsData] = await Promise.all([apiGetPlans(), apiGetReferences()]);
      setPlans(plansData);
      setReferences(refsData);
    } catch { setLoadError('Could not load plans. Check your connection and try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredPlans = applyFilters(plans, activeTab, appliedFilters);
  const activeFilterCount = countActiveFilters(appliedFilters);

  // ── Filter handlers ──
  // Stage 1 popup → apply → show sidebar (Stage 2)
  const handlePopupApply = (filters) => {
    setAppliedFilters(filters);
    setFilterPopupOpen(false);
  };
  // Stage 2 sidebar → apply inline
  const handleSidebarApply = (filters) => {
    setAppliedFilters(filters);
  };
  // Reset — clears filters + hides sidebar (back to default view)
  const handleReset = () => {
    setAppliedFilters({ ...EMPTY_FILTERS });
  };
  // Open popup: if already filtered, pre-populate with current filters
  const handleOpenFilterPopup = () => {
    setFilterPopupOpen(true);
  };

  // ── CRUD handlers ──
  const handleEdit   = (plan) => { setEditTarget(plan); setSelectedPlan(null); setHistoryPlan(null); setModal('edit'); };
  const handleDelete = (plan) => { setDeleteTarget(plan); setSelectedPlan(null); setHistoryPlan(null); setModal('delete'); };
  const handleShowHistory = (plan) => { setHistoryPlan(plan); };
  const handleCloseHistory = () => { setHistoryPlan(null); };
  const handleSaved  = (saved, wasEdit) => {
    setPlans(prev => wasEdit ? prev.map(p => p.id===saved.id ? saved : p) : [saved, ...prev]);
    setModal(null); setEditTarget(null);
  };
  const handleDeleted = (id) => {
    setPlans(prev => prev.filter(p => p.id!==id));
    setModal(null); setDeleteTarget(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:F.body}}>

      {/* Page title */}
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:F.headline, fontSize:'clamp(22px,2.2vw,28px)', fontWeight:700, color:C.textPrimary, margin:0}}>Plan Catalog</h1>
      </div>

      {/* ── Receiver tabs + Funnel icon + Add Plan ─────────────────────────── */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderBottom:`1px solid ${C.border}`, marginBottom:'clamp(16px,2vw,24px)'}}>
        <div style={{display:'flex', overflowX:'auto', flexShrink:1}}>
          {RECEIVER_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            // When filters are applied, count how many plans this tab would show
            // A tab is disabled if filtered AND it returns zero results
            const tabCount = isFiltered
              ? applyFilters(plans, tab.id, appliedFilters).length
              : null;
            const isDisabled = isFiltered && tabCount === 0;
            return (
              <button key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                style={{
                  background:'none', border:'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  padding:'10px clamp(10px,1.2vw,18px)',
                  fontFamily:F.body, fontSize:13,
                  fontWeight: isActive ? 700 : 400,
                  color: isDisabled ? C.textTertiary : isActive ? C.primary : C.textSecondary,
                  borderBottom: isActive && !isDisabled ? `2.5px solid ${C.primary}` : '2.5px solid transparent',
                  marginBottom:-1, whiteSpace:'nowrap', flexShrink:0,
                  opacity: isDisabled ? 0.4 : 1,
                  transition:'opacity 0.15s, color 0.15s',
                }}>
                {tab.label}
                {/* Show count badge on tabs when filtered */}
                {isFiltered && !isDisabled && tabCount !== null && (
                  <span style={{marginLeft:5, background: isActive ? C.primary : C.neutral, color: isActive ? C.white : C.textSecondary, borderRadius:20, padding:'1px 6px', fontSize:10, fontWeight:700}}>
                    {tabCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right controls — Funnel + Add Plan */}
        <div style={{display:'flex', alignItems:'center', gap:10, paddingBottom:8, flexShrink:0, marginLeft:12}}>
          {/* Funnel filter button — highlighted when filters active */}
          <button onClick={handleOpenFilterPopup}
            style={{display:'flex', alignItems:'center', gap:6, background: isFiltered ? C.primary : C.white, color: isFiltered ? C.white : C.textSecondary, border:`1px solid ${isFiltered ? C.primary : C.borderMedium}`, borderRadius:7, fontFamily:F.body, fontSize:13, fontWeight:600, padding:'8px 14px', cursor:'pointer', position:'relative', transition:'all 0.15s'}}>
            <SvgFunnel size={14} color={isFiltered ? C.white : C.textSecondary}/>
            Filter
            {/* Active count badge */}
            {activeFilterCount > 0 && (
              <span style={{position:'absolute', top:-7, right:-7, width:18, height:18, borderRadius:'50%', background:'#EF4444', color:C.white, fontFamily:F.body, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1}}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Add Plan */}
          <button onClick={() => setModal('add')}
            onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
            style={{display:'flex', alignItems:'center', gap:7, background:C.primary, color:C.white, border:'none', borderRadius:7, fontFamily:F.body, fontSize:13, fontWeight:700, padding:'8px 16px', cursor:'pointer', letterSpacing:'0.04em', whiteSpace:'nowrap'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Add Plan
          </button>
        </div>
      </div>

      {/* ── Main content — either default full-width grid, or sidebar + grid ── */}
      {loading ? (
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', padding:'80px 0', gap:12}}>
          <Spinner size={22}/>
          <span style={{fontFamily:F.body, fontSize:14, color:C.textSecondary}}>Loading plans...</span>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : loadError ? (
        <div style={{textAlign:'center', padding:'60px 20px'}}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:12}}><SvgAlert size={36} color={C.danger}/></div>
          <p style={{fontFamily:F.body, fontSize:14, color:C.textSecondary, marginBottom:16}}>{loadError}</p>
          <button onClick={loadAll} style={{background:C.primary, color:C.white, border:'none', borderRadius:8, fontFamily:F.body, fontSize:13, fontWeight:700, padding:'10px 20px', cursor:'pointer'}}>Retry</button>
        </div>
      ) : (
        <div style={{display:'flex', gap:24, alignItems:'flex-start'}}>

          {/* Sidebar — only visible when filters are applied (Stage 2) */}
          {isFiltered && (
            <FilterSidebar
              filters={appliedFilters}
              references={references}
              onChange={setAppliedFilters}
              onApply={handleSidebarApply}
              onReset={handleReset}
            />
          )}

          {/* Cards area */}
          <div style={{flex:1, minWidth:0}}>
            {/* Result count */}
            <div style={{marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <span style={{fontFamily:F.body, fontSize:12, color:C.textTertiary}}>
                {filteredPlans.length} plan{filteredPlans.length!==1?'s':''} shown{isFiltered ? ' (filtered)' : ''}
              </span>
              {/* Active filter summary chips — shown alongside result count */}
              {isFiltered && (
                <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', justifyContent:'flex-end'}}>
                  {appliedFilters.status && <FilterChip label={STATUS_LABELS[appliedFilters.status] || appliedFilters.status} onRemove={() => setAppliedFilters(f => ({...f, status:''}))}/>}
                  {appliedFilters.currency && <FilterChip label={appliedFilters.currency} onRemove={() => setAppliedFilters(f => ({...f, currency:''}))}/>}
                  {appliedFilters.receiver && <FilterChip label={RECEIVER_OPTIONS.find(r => r.value===appliedFilters.receiver)?.label || appliedFilters.receiver} onRemove={() => setAppliedFilters(f => ({...f, receiver:''}))}/>}
                  {(appliedFilters.unitMin||appliedFilters.unitMax) && <FilterChip label={`Units: ${appliedFilters.unitMin||'0'}–${appliedFilters.unitMax||'∞'}`} onRemove={() => setAppliedFilters(f => ({...f, unitMin:'', unitMax:''}))}/>}
                </div>
              )}
            </div>

            {filteredPlans.length === 0 ? (
              <div style={{textAlign:'center', padding:'60px 20px'}}>
                <div style={{display:'flex', justifyContent:'center', marginBottom:16}}><SvgPlan size={40} color={C.textTertiary}/></div>
                <p style={{fontFamily:F.body, fontSize:14, color:C.textSecondary, marginBottom:12}}>No plans match the current filters.</p>
                <button onClick={handleReset} style={{background:'none', border:`1px solid ${C.border}`, borderRadius:8, fontFamily:F.body, fontSize:13, fontWeight:600, color:C.textSecondary, padding:'9px 18px', cursor:'pointer'}}>Clear Filters</button>
              </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isFiltered ? 'clamp(180px,17vw,220px)' : 'clamp(200px,20vw,240px)'}, 1fr))`, gap:'clamp(14px,1.5vw,20px)'}}>
                {filteredPlans.map(plan => (
                  <PlanCard key={plan.id} plan={plan} onViewDetails={setSelectedPlan}/>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stage 1: Filter Popup ─────────────────────────────────────────────── */}
      {filterPopupOpen && (
        <FilterPopup
          initialFilters={appliedFilters}
          references={references}
          onApply={handlePopupApply}
          onClose={() => setFilterPopupOpen(false)}
        />
      )}

      {/* ── View Detail Panel (z-200) ─────────────────────────────────────────── */}
      {selectedPlan && (
        <PlanDetailPanel
          plan={selectedPlan}
          onClose={() => { setSelectedPlan(null); setHistoryPlan(null); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShowHistory={handleShowHistory}
        />
      )}

      {/* ── History Popup (z-300 — layered over View) ──────────────────────────── */}
      {historyPlan && (
        <HistoryPopup plan={historyPlan} onClose={handleCloseHistory}/>
      )}

      {/* ── Add / Edit modal ──────────────────────────────────────────────────── */}
      {(modal==='add'||modal==='edit') && (
        <PlanFormModal
          mode={modal}
          plan={modal==='edit' ? editTarget : null}
          references={references}
          onClose={() => { setModal(null); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete confirm ────────────────────────────────────────────────────── */}
      {modal==='delete' && deleteTarget && (
        <DeleteConfirmModal
          plan={deleteTarget}
          onClose={() => { setModal(null); setDeleteTarget(null); }}
          onDeleted={handleDeleted}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Filter Chip (active filter tag with × remove) ─────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:5, background:'#E4ECFC', color:C.primary, border:`1px solid #BFDBFE`, borderRadius:20, padding:'3px 10px', fontFamily:F.body, fontSize:11, fontWeight:600}}>
      {label}
      <span onClick={onRemove} style={{cursor:'pointer', display:'flex', alignItems:'center', opacity:0.7}}>
        <SvgX size={11} color={C.primary}/>
      </span>
    </span>
  );
}
