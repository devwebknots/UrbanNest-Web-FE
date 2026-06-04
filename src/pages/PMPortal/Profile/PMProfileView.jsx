/**
 * PMProfileView.jsx — PM Portal: My Profile → Persona
 * ─────────────────────────────────────────────────────────────────────────────
 * Route:   /pm-portal/profile/persona
 * Nav:     Nav B — My Profile → Persona active
 * Layout:  3-col shell (NavB 185px + Stepper 200px + Form scrollable)
 * Modes:   VIEW (all fields locked) / EDIT (fields unlocked except name)
 * Steps:   1 → 2 → 3 (same content as onboarding, view/edit aware)
 * Session: 6 — built May 28, 2026
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CustomDropdown } from '../../../components/ui';
import NavB from '../../../components/layout/NavB';

// ─── Tabler Icons CDN ──────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  navBg:         '#111827',
  pageBg:        '#F1F5F9',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  white:         '#FFFFFF',
  neutral:       '#F8FAFC',
  danger:        '#E53E3E',
  dangerBg:      '#FEE2E2',
  dangerBorder:  '#FECACA',
  green:         '#16A34A',
  dropdownBg:    '#E4ECFC',
  contextBg:     '#EEF2FF',
  contextBorder: '#C7D2FE',
  successBg:     '#ECFDF5',
  successBorder: '#6EE7B7',
  successText:   '#065F46',
  infoBg:        '#EFF6FF',
  infoBorder:    '#BFDBFE',
  infoText:      '#1D4ED8',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FCD34D',
  amberText:     '#92400E',
  activeNavBg:   'rgba(255,255,255,0.10)',
  activeNavBdr:  'rgba(255,255,255,0.15)',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const API_BASE = 'http://localhost:8001';

// ─── JWT decode ────────────────────────────────────────────────────────────────
function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

// ─── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Professional Profile',   sub: 'Tell landlords about you and your experience' },
  { n: 2, label: 'Service Area & License', sub: 'Where you operate and your professional credentials' },
  { n: 3, label: 'Fees & Identity',        sub: 'Your fee structure & ID verification' },
];

// ─── US States ─────────────────────────────────────────────────────────────────
const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

// ─── Field styles (identical to onboarding screens) ───────────────────────────
const FL = {
  display: 'block', fontFamily: F.body, fontSize: '10px', fontWeight: 700,
  color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
};
const inputS = (disabled = false, error = false) => ({
  width: '100%', height: '40px', boxSizing: 'border-box',
  background: disabled ? C.neutral : C.white,
  border: '1px solid ' + (error ? C.danger : disabled ? C.border : C.borderMedium),
  borderRadius: '8px', padding: '0 12px',
  fontFamily: F.body, fontSize: '13px',
  color: disabled ? C.textTertiary : C.textPrimary,
  cursor: disabled ? 'not-allowed' : 'text', outline: 'none',
});
const hintS = (error = false) => ({
  fontFamily: F.body, fontSize: '11px',
  color: error ? C.danger : C.textTertiary, marginTop: '4px',
});
const dividerS = { borderTop: '1px solid ' + C.border, margin: '20px 0' };

// ─── Header — Standard per DesignSystem §8 ─────────────────────────────────────
function Header({ userName, userRole }) {
  return (
    <div style={{ height: '60px', flexShrink: 0, background: C.white, borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,3vw,36px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.neutral, borderRadius: '8px', padding: '0 14px', height: '36px', width: '280px' }}>
        <i className="ti ti-search" style={{ fontSize: '14px', color: C.textTertiary }} />
        <input type="text" placeholder="Search portfolios, settings, or help…" style={{ background: 'none', border: 'none', outline: 'none', fontFamily: F.body, fontSize: '12px', color: C.textSecondary, width: '100%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <i className="ti ti-bell" style={{ fontSize: '18px', color: C.textSecondary, cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', borderLeft: '1px solid ' + C.border }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textPrimary }}>{userName}</p>
            <p style={{ margin: 0, fontFamily: F.body, fontSize: '9px', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{userRole}</p>
          </div>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-user" style={{ fontSize: '16px', color: C.white }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vertical Stepper (identical to onboarding) ────────────────────────────────
function VerticalStepper({ current }) {
  return (
    <div style={{ width: '200px', minWidth: '200px', flexShrink: 0, background: C.pageBg, borderRight: '1px solid ' + C.border, padding: 'clamp(16px,2vw,24px) 16px 24px clamp(20px,3vw,48px)', display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
      {STEPS.map((step, idx) => {
        const done = step.n < current, active = step.n === current;
        return (
          <div key={step.n} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '3px', flexShrink: 0, background: active || done ? C.primary : 'transparent', border: '2px solid ' + (active || done ? C.primary : C.borderMedium) }} />
              {idx < STEPS.length - 1 && <div style={{ width: '1.5px', flex: 1, minHeight: '44px', background: done ? C.primary : C.borderMedium, margin: '4px 0', opacity: done ? 1 : 0.35 }} />}
            </div>
            <div style={{ paddingBottom: idx < STEPS.length - 1 ? '16px' : 0 }}>
              <p style={{ margin: '0 0 3px', fontFamily: F.headline, fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? C.textPrimary : done ? C.textSecondary : C.textTertiary, lineHeight: 1.3 }}>{step.label}</p>
              <p style={{ margin: 0, fontFamily: F.body, fontSize: '11px', color: active ? C.textSecondary : C.textTertiary, lineHeight: 1.45 }}>{step.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Checkbox (identical to onboarding) ───────────────────────────────────────
function Checkbox({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer', userSelect: 'none', opacity: disabled ? 0.6 : 1 }}>
      <div onClick={disabled ? undefined : onChange}
        style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, border: checked ? ('2px solid ' + C.primary) : ('1.5px solid ' + C.borderMedium), background: checked ? C.primary : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {checked && <i className="ti ti-check" style={{ fontSize: '10px', color: C.white }} />}
      </div>
      <span style={{ fontFamily: F.body, fontSize: '13px', color: C.textPrimary }}>{label}</span>
    </label>
  );
}

// ─── Photo Upload (identical to onboarding) ────────────────────────────────────
function PhotoUpload({ preview, onChange, disabled }) {
  const ref = useRef();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, background: C.neutral, border: '1.5px solid ' + C.borderMedium, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {preview ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="ti ti-user" style={{ fontSize: '20px', color: C.textTertiary }} />}
      </div>
      <div>
        <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={onChange} disabled={disabled} />
        <button type="button" onClick={() => !disabled && ref.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: C.white, border: '1.5px solid ' + C.borderMedium, borderRadius: '7px', fontFamily: F.body, fontSize: '12px', fontWeight: 600, color: disabled ? C.textTertiary : C.textPrimary, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
        >
          <i className="ti ti-upload" style={{ fontSize: '12px' }} />
          {disabled ? 'Photo on file' : 'Upload photo'}
        </button>
        <p style={{ ...hintS(), margin: '5px 0 0' }}>JPG or PNG, max 5MB. Optional.</p>
      </div>
    </div>
  );
}

// ─── City Tag Input (identical to onboarding) ──────────────────────────────────
function CityTagInput({ tags, onAdd, onRemove, error, disabled }) {
  const [val, setVal] = useState('');
  const ref = useRef();
  const handleKey = e => {
    if ((e.key === 'Enter' || e.key === ',') && val.trim()) { e.preventDefault(); onAdd(val.trim()); setVal(''); }
    if (e.key === 'Backspace' && !val && tags.length) onRemove(tags[tags.length - 1]);
  };
  return (
    <div onClick={() => !disabled && ref.current?.focus()}
      style={{ minHeight: '40px', background: disabled ? C.neutral : C.white, border: '1px solid ' + (error ? C.danger : disabled ? C.border : C.borderMedium), borderRadius: '8px', padding: '5px 10px', display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'text', boxSizing: 'border-box' }}
    >
      {tags.map(t => (
        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: C.dropdownBg, border: '1px solid #BFDBFE', borderRadius: '5px', padding: '2px 7px', fontFamily: F.body, fontSize: '12px', fontWeight: 500, color: C.textPrimary }}>
          {t}
          {!disabled && <button type="button" onClick={e => { e.stopPropagation(); onRemove(t); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.textSecondary, fontSize: '12px', lineHeight: 1 }}>×</button>}
        </span>
      ))}
      {!disabled && <input ref={ref} value={val} onChange={e => setVal(e.target.value)} onKeyDown={handleKey} placeholder={tags.length ? 'Add city…' : 'Type a city and press Enter'} style={{ flex: 1, minWidth: '120px', background: 'none', border: 'none', outline: 'none', fontFamily: F.body, fontSize: '13px', color: C.textPrimary }} />}
    </div>
  );
}

// ─── File Attach (identical to onboarding) ─────────────────────────────────────
function FileAttach({ label, onChange, fileName, disabled }) {
  const ref = useRef();
  return (
    <div onClick={() => !disabled && ref.current?.click()}
      style={{ height: '40px', background: disabled ? C.neutral : C.white, border: '1px solid ' + (disabled ? C.border : C.borderMedium), borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: F.body, fontSize: '13px', color: fileName ? C.textPrimary : C.textTertiary, boxSizing: 'border-box' }}
    >
      <input ref={ref} type="file" style={{ display: 'none' }} onChange={onChange} accept=".pdf,.jpg,.png" disabled={disabled} />
      <span>{fileName || label}</span>
      <i className="ti ti-paperclip" style={{ fontSize: '15px', color: C.textTertiary }} />
    </div>
  );
}

// ─── Doc Upload Zone (identical to onboarding) ────────────────────────────────
function DocUploadZone({ files, onAdd, onRemove, disabled }) {
  const ref = useRef();
  const MAX = 3;
  return (
    <div>
      <div onClick={() => !disabled && files.length < MAX && ref.current?.click()}
        style={{ border: '1.5px dashed ' + C.borderMedium, borderRadius: '10px', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', cursor: disabled ? 'not-allowed' : files.length < MAX ? 'pointer' : 'default', background: disabled ? C.neutral : C.white, opacity: disabled ? 0.7 : 1 }}
        onMouseEnter={e => { if (!disabled && files.length < MAX) e.currentTarget.style.borderColor = C.primary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMedium; }}
      >
        <input ref={ref} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={e => { onAdd(Array.from(e.target.files).slice(0, MAX - files.length)); e.target.value = ''; }} disabled={disabled} />
        <i className="ti ti-upload" style={{ fontSize: '20px', color: C.textTertiary }} />
        <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textPrimary }}>{disabled ? 'ID document(s) on file' : 'Upload ID document(s)'}</p>
        <p style={{ margin: 0, fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>Up to 3 files — JPG, PNG, or PDF. Max 10MB each.</p>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: C.neutral, border: '1px solid ' + C.borderMedium, borderRadius: '5px', padding: '3px 9px', fontFamily: F.body, fontSize: '11px', color: C.textPrimary }}>
              <i className="ti ti-file" style={{ fontSize: '11px', color: C.textSecondary }} />{typeof f === 'string' ? f : f.name}
              {!disabled && <button type="button" onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, fontSize: '13px', padding: '0', lineHeight: 1 }}>×</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteConfirmModal({ open, onCancel, onConfirm, deleting }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: '14px', padding: '28px 32px', maxWidth: '420px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'fadein 0.2s ease both' }}>
        {/* Icon */}
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: C.dangerBg, border: '1px solid ' + C.dangerBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <i className="ti ti-trash" style={{ fontSize: '20px', color: C.danger }} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontFamily: F.headline, fontSize: '18px', fontWeight: 700, color: C.textPrimary }}>Delete Profile?</h2>
        <p style={{ margin: '0 0 24px', fontFamily: F.body, fontSize: '13px', color: C.textSecondary, lineHeight: 1.6 }}>
          This will deactivate your Independent PM profile and remove your access to the PM portal. Your data will be retained for auditing purposes. This action can be reversed by contacting support.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel}
            style={{ flex: 1, height: '42px', background: C.white, border: '1.5px solid ' + C.borderMedium, borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textSecondary, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex: 1, height: '42px', background: deleting ? C.borderMedium : C.danger, border: 'none', borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 700, color: C.white, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {deleting
              ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite' }} />Deleting…</>
              : <><i className="ti ti-trash" style={{ fontSize: '14px' }} />Yes, Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unsaved Changes Warning ───────────────────────────────────────────────────
function UnsavedWarning({ open, onStay, onLeave }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: '14px', padding: '28px 32px', maxWidth: '380px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'fadein 0.2s ease both' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: C.amberBg, border: '1px solid ' + C.amberBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '20px', color: C.amber }} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontFamily: F.headline, fontSize: '18px', fontWeight: 700, color: C.textPrimary }}>Unsaved Changes</h2>
        <p style={{ margin: '0 0 24px', fontFamily: F.body, fontSize: '13px', color: C.textSecondary, lineHeight: 1.6 }}>
          You have unsaved changes on this step. If you go back now, your changes will be lost.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onStay} style={{ flex: 1, height: '42px', background: C.white, border: '1.5px solid ' + C.borderMedium, borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textSecondary, cursor: 'pointer' }}>Stay</button>
          <button onClick={onLeave} style={{ flex: 1, height: '42px', background: C.primary, border: 'none', borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 700, color: C.white, cursor: 'pointer' }}>Leave anyway</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main PMProfileView Component ─────────────────────────────────────────────
export default function PMProfileView() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── User ──────────────────────────────────────────────────────────────────
  const [userName,  setUserName]  = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [userRole,  setUserRole]  = useState('Independent PM');

  // ── Navigation state ──────────────────────────────────────────────────────
  const [currentStep,    setCurrentStep]    = useState(1);
  const [editMode,       setEditMode]       = useState(false);
  const [isDirty,        setIsDirty]        = useState(false);
  const [isReactivation, setIsReactivation] = useState(false);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [showUnsavedWarning,setShowUnsavedWarning]= useState(false);
  const [pendingBackStep,   setPendingBackStep]   = useState(null);
  const [deleting,          setDeleting]          = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [errors,            setErrors]            = useState({});

  // ── Step 1 fields ─────────────────────────────────────────────────────────
  const [photoPreview, setPhotoPreview] = useState(null);
  const [yearsExp,     setYearsExp]     = useState('');
  const [maxUnits,     setMaxUnits]     = useState('');
  const [bio,          setBio]          = useState('');
  const [businessTypes, setBusinessTypes] = useState({ property_management: false, tenant_placement: false, buy: false, sell: false });
  const [propertyTypes, setPropertyTypes] = useState({ residential: false, commercial: false, student_housing: false, short_term: false, mixed: false });

  // ── Step 2 fields ─────────────────────────────────────────────────────────
  const [state,         setState]         = useState('');
  const [cities,        setCities]        = useState([]);
  const [licenseNum,    setLicenseNum]    = useState('');
  const [issuingState,  setIssuingState]  = useState('');
  const [expiryDate,    setExpiryDate]    = useState('');
  const [licenseFile,   setLicenseFile]   = useState(null);
  const [licenseFileName, setLicenseFileName] = useState('');
  const [brokerageName, setBrokerageName] = useState('');
  const [brokerageLic,  setBrokerageLic]  = useState('');

  // ── Step 3 fields ─────────────────────────────────────────────────────────
  const [mgmtType,     setMgmtType]     = useState('');
  const [mgmtValue,    setMgmtValue]    = useState('');
  const [leaseType,    setLeaseType]    = useState('');
  const [leaseValue,   setLeaseValue]   = useState('');
  const [renewalType,  setRenewalType]  = useState('');
  const [renewalValue, setRenewalValue] = useState('');
  const [idType,       setIdType]       = useState('');
  const [idNumber,     setIdNumber]     = useState('');
  const [idFiles,      setIdFiles]      = useState([]);
  const [agreed,       setAgreed]       = useState(false);

  // ── Dirty helper ──────────────────────────────────────────────────────────
  const markDirty = () => setIsDirty(true);

  // ── Load existing profile ─────────────────────────────────────────────────
  useEffect(() => {
    // Check URL for ?mode=edit — coming from PersonaSelect inactive card
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'edit') {
      setEditMode(true);
      setCurrentStep(1);
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Load user info
    fetch(`${API_BASE}/api/auth/me/`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const full = ((data.first_name || '') + ' ' + (data.last_name || '')).trim() || data.email || 'User';
          setUserName(full);
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setUserRole(data.role || data.active_persona || 'Independent PM');
        } else {
          const d = decodeJWT(token);
          if (d) { setUserName(((d.first_name || '') + ' ' + (d.last_name || '')).trim() || d.email || 'User'); setFirstName(d.first_name || ''); setLastName(d.last_name || ''); }
        }
      })
      .catch(() => { const d = decodeJWT(token); if (d) setUserName(d.email || 'User'); });

    // Load existing PM profile
    fetch(`${API_BASE}/api/pm/register/`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        // ── Detect reactivation mode ──────────────────────────────────────────
        if (data.registration_status === 'INACTIVE') {
          setIsReactivation(true);
          setEditMode(true);
          setCurrentStep(1);
        }
        // ── Step 1 — inside independent_detail ───────────────────────────────
        const d1 = data.independent_detail || {};
        if (d1.years_of_experience) setYearsExp(d1.years_of_experience);
        if (d1.max_units_capacity)  setMaxUnits(String(d1.max_units_capacity));
        if (d1.bio)                 setBio(d1.bio);
        if (d1.profile_photo)       setPhotoPreview(`http://localhost:8001${d1.profile_photo}`);

        // property_types comes back as ["[\"RESIDENTIAL\",\"COMMERCIAL\"]"] — parse twice
        if (d1.property_types?.length) {
          try {
            const raw = d1.property_types[0];
            const arr = typeof raw === 'string' ? JSON.parse(raw) : d1.property_types;
            setPropertyTypes(prev => { const n = {...prev}; arr.forEach(k => { const key = k.toLowerCase(); if (key in n) n[key] = true; }); return n; });
          } catch {}
        }
        if (d1.business_types?.length) {
          try {
            const raw = d1.business_types[0];
            const arr = typeof raw === 'string' ? JSON.parse(raw) : d1.business_types;
            setBusinessTypes(prev => { const n = {...prev}; arr.forEach(k => { const key = k.toLowerCase(); if (key in n) n[key] = true; }); return n; });
          } catch {}
        }

        // ── Step 2 — service_areas[] + licenses[] are arrays, take first item ─
        const sa = Array.isArray(data.service_areas) ? data.service_areas[0] : null;
        if (sa) {
          if (sa.state) setState(sa.state);
          // cities also comes back as ["[\"city1\",\"city2\"]"] — parse twice
          if (sa.cities?.length) {
            try {
              const raw = sa.cities[0];
              const arr = typeof raw === 'string' ? JSON.parse(raw) : sa.cities;
              setCities(Array.isArray(arr) ? arr : []);
            } catch { setCities([]); }
          }
        }
        const lic = Array.isArray(data.licenses) ? data.licenses[0] : null;
        if (lic) {
          if (lic.license_number)   setLicenseNum(lic.license_number);
          if (lic.issuing_state)    setIssuingState(lic.issuing_state);
          if (lic.expiry_date)      setExpiryDate(lic.expiry_date);
          if (lic.brokerage_name)   setBrokerageName(lic.brokerage_name);
          if (lic.brokerage_license)setBrokerageLic(lic.brokerage_license);
          if (lic.license_document) setLicenseFileName(lic.license_document.split('/').pop());
        }

        // ── Step 3 — fee_structure + identity_verification at top level ───────
        const fee = data.fee_structure || {};
        if (fee.management_fee_type)  setMgmtType(fee.management_fee_type);
        if (fee.management_fee_value) setMgmtValue(String(fee.management_fee_value));
        if (fee.lease_up_fee_type)    setLeaseType(fee.lease_up_fee_type);
        if (fee.lease_up_fee_value)   setLeaseValue(String(fee.lease_up_fee_value));
        if (fee.renewal_fee_type)     setRenewalType(fee.renewal_fee_type);
        if (fee.renewal_fee_value)    setRenewalValue(String(fee.renewal_fee_value));

        const idv = data.identity_verification || {};
        if (idv.id_type)   setIdType(idv.id_type);
        if (idv.id_number) setIdNumber(idv.id_number);
        // Show existing uploaded ID docs as filename strings
        const existingDocs = [idv.id_document_1, idv.id_document_2, idv.id_document_3]
          .filter(Boolean)
          .map(path => path.split('/').pop());
        if (existingDocs.length) setIdFiles(existingDocs);
      })
      .catch(() => {});
  }, [location.search]);

  // ── Handle soft delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE}/api/pm/register/`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_status: 'INACTIVE' }),
      });
      navigate('/persona-select');
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ── Toggle edit mode ──────────────────────────────────────────────────────
  const toggleEdit = () => {
    setEditMode(p => !p);
    setIsDirty(false);
    setErrors({});
  };

  // ── Navigate back ─────────────────────────────────────────────────────────
  const handleBack = () => {
    if (currentStep === 1) { navigate('/pm-portal/dashboard/my-dashboard'); return; }
    if (editMode && isDirty) {
      setPendingBackStep(currentStep - 1);
      setShowUnsavedWarning(true);
    } else {
      setCurrentStep(p => p - 1);
    }
  };

  // ── Navigate next (view mode) ─────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(p => p + 1);
  };

  // ── Save + Continue (edit mode) ───────────────────────────────────────────
  const handleContinue = async () => {
    // ── Clear previous errors first ─────────────────────────────────────────
    setErrors({});

    // ── Frontend validation ──────────────────────────────────────────────────
    const e = {};
    if (currentStep === 1) {
      if (!yearsExp)                                          e.yearsExp      = 'Required';
      if (!maxUnits)                                         e.maxUnits      = 'Required';
      if (bio.trim().length < 50)                            e.bio           = 'Minimum 50 characters';
      if (!Object.values(propertyTypes).some(Boolean))       e.propertyTypes = 'Select at least one';
    }
    if (currentStep === 2) {
      if (!state)                                            e.state         = 'Required';
      if (!cities.length)                                    e.cities        = 'Add at least one city';
      if (licenseRequired && !issuingState)                  e.issuingState  = 'Required when license number is provided';
      if (licenseRequired && !expiryDate)                    e.expiryDate    = 'Required when license number is provided';
      if (licenseRequired && !(licenseFile instanceof File) && !licenseFileName)
                                                             e.licenseFile   = 'Required when license number is provided';
    }
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      if (currentStep === 1) {
        const formData = new FormData();
        formData.append('years_of_experience', yearsExp);
        formData.append('bio', bio);
        formData.append('max_units_capacity', maxUnits);
        formData.append('property_types', JSON.stringify(Object.entries(propertyTypes).filter(([,v]) => v).map(([k]) => k.toUpperCase())));
        formData.append('business_types',  JSON.stringify(Object.entries(businessTypes).filter(([,v]) => v).map(([k]) => k.toUpperCase())));
        const res = await fetch(`${API_BASE}/api/pm/register/`, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: formData });
        if (!res.ok) { const d = await res.json(); setErrors({ api: d.detail || 'Could not save.' }); setSaving(false); return; }
      } else if (currentStep === 2) {
        const formData = new FormData();
        formData.append('country',  'US');
        formData.append('state',    state);
        formData.append('cities',   JSON.stringify(cities));
        if (licenseNum)    formData.append('license_number',    licenseNum);
        if (issuingState)  formData.append('issuing_state',     issuingState);
        if (expiryDate)    formData.append('expiry_date',       expiryDate);
        if (brokerageName) formData.append('brokerage_name',    brokerageName);
        if (brokerageLic)  formData.append('brokerage_license', brokerageLic);
        if (licenseFile instanceof File) formData.append('license_document', licenseFile);
        const res = await fetch(`${API_BASE}/api/pm/register/step-2/`, {
          method: 'PATCH', headers: { Authorization: 'Bearer ' + token }, body: formData,
        });
        if (!res.ok) { const d = await res.json(); setErrors({ api: d.detail || Object.values(d)[0] || 'Could not save.' }); setSaving(false); return; }
      }
      setSaving(false);
      setIsDirty(false);
      setCurrentStep(p => p + 1);
    } catch { setErrors({ api: 'Connection error.' }); setSaving(false); }
  };

  // ── Submit (Step 3 edit mode) ─────────────────────────────────────────────
  const handleSubmit = async () => {
    // ── Clear previous errors first ─────────────────────────────────────────
    setErrors({});

    // ── Frontend validation ──────────────────────────────────────────────────
    const e = {};
    if (!mgmtType)        e.mgmtType  = 'Required';
    if (!idType)          e.idType    = 'Required';
    if (!idNumber.trim()) e.idNumber  = 'Required';
    const hasIdDoc = idFiles.some(f => f instanceof File) || idFiles.some(f => typeof f === 'string' && f.length > 0);
    if (!hasIdDoc)        e.idFiles   = 'At least one ID document is required';
    if (!agreed)          e.agreed    = 'You must accept the Terms of Service to save';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      const formData = new FormData();
      formData.append('management_fee_type', mgmtType);
      const cleanNum = v => v ? String(v).replace(/[^0-9.]/g, '') : null;
      if (cleanNum(mgmtValue))    formData.append('management_fee_value', cleanNum(mgmtValue));
      if (leaseType)              formData.append('lease_up_fee_type', leaseType);
      if (cleanNum(leaseValue))   formData.append('lease_up_fee_value', cleanNum(leaseValue));
      if (renewalType)            formData.append('renewal_fee_type', renewalType);
      if (cleanNum(renewalValue)) formData.append('renewal_fee_value', cleanNum(renewalValue));
      formData.append('id_type',       idType);
      formData.append('id_number',     idNumber);
      formData.append('terms_accepted','true');
      // Only send actual File objects — skip existing filename strings
      const newIdFiles = idFiles.filter(f => f instanceof File);
      if (newIdFiles[0]) formData.append('id_document_1', newIdFiles[0]);
      if (newIdFiles[1]) formData.append('id_document_2', newIdFiles[1]);
      if (newIdFiles[2]) formData.append('id_document_3', newIdFiles[2]);
      const res = await fetch(`${API_BASE}/api/pm/register/step-3/`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + token }, body: formData });
      if (!res.ok) { const d = await res.json(); setErrors({ api: d.detail || 'Could not save.' }); setSaving(false); return; }

      // If reactivating — call submit endpoint to set ACTIVE + activate persona
      if (isReactivation) {
        const submitRes = await fetch(`${API_BASE}/api/pm/submit/`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        });
        if (!submitRes.ok) { const d = await submitRes.json(); setErrors({ api: d.detail || 'Reactivation failed.' }); setSaving(false); return; }
        navigate('/pm-portal/dashboard/my-dashboard');
        return;
      }

      setSaving(false);
      setIsDirty(false);
      setEditMode(false);
    } catch { setErrors({ api: 'Connection error.' }); setSaving(false); }
  };

  // ── Options ───────────────────────────────────────────────────────────────
  const EXP_OPTIONS     = [{ value: '', label: 'Select range…' }, { value: '0-1', label: '0–1 years' }, { value: '1-3', label: '1–3 years' }, { value: '3-5', label: '3–5 years' }, { value: '5-10', label: '5–10 years' }, { value: '10+', label: '10+ years' }];
  const STATE_OPTIONS   = [{ value: '', label: 'Select state…' }, ...US_STATES.map(s => ({ value: s, label: s }))];
  const ISSUING_OPTIONS = [{ value: '', label: 'Select state…' }, ...US_STATES.map(s => ({ value: s, label: s }))];
  const MGMT_OPTS       = [{ value: '', label: 'Select…' }, { value: 'PERCENTAGE', label: '% of Monthly Rent' }, { value: 'FLAT', label: 'Flat Monthly Fee' }, { value: 'NEGOTIABLE', label: 'Negotiable' }];
  const LEASE_OPTS      = [{ value: '', label: 'Select…' }, { value: 'ONE_MONTH', label: "One Month's Rent" }, { value: 'FLAT', label: 'Flat Fee' }, { value: 'NONE', label: 'None' }, { value: 'NEGOTIABLE', label: 'Negotiable' }];
  const RENEWAL_OPTS    = [{ value: '', label: 'Select…' }, { value: 'PERCENTAGE', label: '% of Monthly Rent' }, { value: 'FLAT', label: 'Flat Fee' }, { value: 'NONE', label: 'None' }, { value: 'NEGOTIABLE', label: 'Negotiable' }];
  const ID_OPTS         = [{ value: '', label: 'Select…' }, { value: 'DRIVERS_LICENSE', label: "Driver's License" }, { value: 'PASSPORT', label: 'Passport' }, { value: 'STATE_ID', label: 'State ID' }, { value: 'MILITARY_ID', label: 'Military ID' }];

  const V = !editMode; // shorthand: V = view mode (all fields locked)
  const mgmtShowVal    = ['PERCENTAGE', 'FLAT'].includes(mgmtType);
  const leaseShowVal   = ['FLAT'].includes(leaseType);
  const renewShowVal   = ['PERCENTAGE', 'FLAT'].includes(renewalType);
  // License # drives mandatory fields in Step 2
  const licenseRequired = licenseNum.trim().length > 0;

  // ── Footer buttons ────────────────────────────────────────────────────────
  const renderFooter = () => {
    const backBtn = (
      <button onClick={handleBack}
        style={{ display: 'flex', alignItems: 'center', gap: '7px', height: '44px', padding: '0 22px', background: C.white, color: C.textPrimary, border: '1.5px solid ' + C.borderMedium, borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} /> Back
      </button>
    );

    if (V) {
      // View mode: Back + Next (no save)
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ti ti-eye" style={{ fontSize: '13px', color: C.textTertiary }} />
            <span style={{ fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>View only</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {backBtn}
            {currentStep < 3 && (
              <button onClick={handleNext}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 28px', background: C.primary, color: C.white, border: 'none', borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
                onMouseLeave={e => e.currentTarget.style.background = C.primary}
              >
                Next <i className="ti ti-arrow-right" style={{ fontSize: '14px' }} />
              </button>
            )}
          </div>
        </div>
      );
    }

    // Edit mode
    if (currentStep === 3) {
      // Step 3: Back + Submit / Reactivate Account
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ti ti-device-floppy" style={{ fontSize: '13px', color: C.textTertiary }} />
            <span style={{ fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>
              {isReactivation ? 'Review all steps then reactivate' : 'Changes saved on submit'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {backBtn}
            <button onClick={handleSubmit} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 28px', background: saving ? C.borderMedium : C.primary, color: C.white, border: 'none', borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = C.primaryHover; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.primary; }}
            >
              {saving
                ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite' }} />Saving…</>
                : isReactivation
                  ? <><i className="ti ti-refresh" style={{ fontSize: '14px' }} />Reactivate Account</>
                  : <><i className="ti ti-device-floppy" style={{ fontSize: '14px' }} />Submit</>
              }
            </button>
          </div>
        </div>
      );
    }

    // Steps 1 & 2: Back + Continue (auto-saves)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ti ti-device-floppy" style={{ fontSize: '13px', color: C.textTertiary }} />
          <span style={{ fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>Progress auto-saved</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {backBtn}
          <button onClick={handleContinue} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 28px', background: saving ? C.borderMedium : C.primary, color: C.white, border: 'none', borderRadius: '9px', fontFamily: F.body, fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = C.primaryHover; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.primary; }}
          >
            {saving ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite' }} />Saving…</> : <>Continue <i className="ti ti-arrow-right" style={{ fontSize: '14px' }} /></>}
          </button>
        </div>
      </div>
    );
  };

  // ── Form content per step ─────────────────────────────────────────────────
  const renderFormContent = () => {
    if (currentStep === 1) return (
      <>
        <div style={dividerS} />
        {/* Name row — always locked */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <div>
            <span style={FL}>First Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.textTertiary }}>(Locked)</span></span>
            <input style={inputS(true)} value={firstName} readOnly />
          </div>
          <div>
            <span style={FL}>Last Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.textTertiary }}>(Locked)</span></span>
            <input style={inputS(true)} value={lastName} readOnly />
          </div>
        </div>
        <div style={dividerS} />

        {/* Profile photo */}
        <div style={{ marginBottom: '18px' }}>
          <span style={FL}>Profile Photo</span>
          <PhotoUpload preview={photoPreview} onChange={e => { const f = e.target.files[0]; if (f) { setPhotoPreview(URL.createObjectURL(f)); markDirty(); } }} disabled={V} />
        </div>
        <div style={dividerS} />

        {/* Experience + Max units */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <div>
            <span style={FL}>Years of Experience *</span>
            <CustomDropdown options={EXP_OPTIONS} value={yearsExp} placeholder="Select range…" disabled={V} error={!!errors.yearsExp} onChange={v => { setYearsExp(v); markDirty(); setErrors(p => ({ ...p, yearsExp: '' })); }} />
            {errors.yearsExp && <p style={hintS(true)}>{errors.yearsExp}</p>}
          </div>
          <div>
            <span style={FL}>Max Units Capacity *</span>
            <input type="number" min="1" placeholder="e.g. 25" style={inputS(V, !!errors.maxUnits)} value={maxUnits} readOnly={V} onChange={e => { setMaxUnits(e.target.value); markDirty(); setErrors(p => ({ ...p, maxUnits: '' })); }} />
            {errors.maxUnits ? <p style={hintS(true)}>{errors.maxUnits}</p> : <p style={hintS()}>How many units can you manage?</p>}
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: '18px' }}>
          <span style={FL}>Bio / About Me *</span>
          <textarea placeholder="Describe your experience…" readOnly={V}
            style={{ width: '100%', minHeight: '100px', background: V ? C.neutral : C.white, border: '1px solid ' + (errors.bio ? C.danger : V ? C.border : C.borderMedium), borderRadius: '8px', padding: '10px 12px', fontFamily: F.body, fontSize: '13px', color: V ? C.textSecondary : C.textPrimary, resize: V ? 'none' : 'vertical', outline: 'none', lineHeight: 1.55, boxSizing: 'border-box', cursor: V ? 'default' : 'text' }}
            value={bio} onChange={e => { setBio(e.target.value); markDirty(); setErrors(p => ({ ...p, bio: '' })); }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ ...hintS(!!errors.bio), margin: 0 }}>{errors.bio || 'Shown publicly on your profile. Min 50 characters.'}</p>
            <p style={{ ...hintS(bio.length < 50 && bio.length > 0), margin: 0 }}>{bio.length}/50</p>
          </div>
        </div>
        <div style={dividerS} />

        {/* Type of Business */}
        <div style={{ marginBottom: '18px' }}>
          <span style={FL}>Type of Business</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: '8px' }}>
            {[['property_management','Property Management'],['tenant_placement','Tenant Placement'],['buy','Buy'],['sell','Sell']].map(([k,l]) => (
              <Checkbox key={k} label={l} checked={businessTypes[k]} disabled={V} onChange={() => { setBusinessTypes(p => ({ ...p, [k]: !p[k] })); markDirty(); }} />
            ))}
          </div>
          <p style={hintS()}>Select all that apply</p>
        </div>

        {/* Property Types */}
        <div style={{ marginBottom: '24px' }}>
          <span style={FL}>Property Types Managed</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: '8px' }}>
            {[['residential','Residential'],['commercial','Commercial'],['student_housing','Student Housing'],['short_term','Short-term'],['mixed','Mixed']].map(([k,l]) => (
              <Checkbox key={k} label={l} checked={propertyTypes[k]} disabled={V} onChange={() => { setPropertyTypes(p => ({ ...p, [k]: !p[k] })); markDirty(); setErrors(p => ({ ...p, propertyTypes: '' })); }} />
            ))}
          </div>
          {errors.propertyTypes ? <p style={hintS(true)}>{errors.propertyTypes}</p> : <p style={hintS()}>Select all that apply</p>}
        </div>
        <div style={dividerS} />
        {renderFooter()}
      </>
    );

    if (currentStep === 2) return (
      <>
        <div style={dividerS} />
        <p style={{ margin: '0 0 14px', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Service Area</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span style={FL}>Country (Auto-detected)</span>
            <CustomDropdown options={[{value:'US',label:'United States'}]} value="US" placeholder="United States" disabled />
          </div>
          <div>
            <span style={FL}>State / Region *</span>
            <CustomDropdown options={STATE_OPTIONS} value={state} placeholder="Select state…" disabled={V} error={!!errors.state} onChange={v => { setState(v); markDirty(); setErrors(p => ({ ...p, state: '' })); }} />
            {errors.state ? <p style={hintS(true)}>{errors.state}</p> : <p style={hintS()}>Determines license requirements</p>}
          </div>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={FL}>Cities Served *</span>
          <CityTagInput tags={cities} onAdd={c => { setCities(p => [...p, c]); markDirty(); }} onRemove={c => { setCities(p => p.filter(x => x !== c)); markDirty(); }} error={!!errors.cities} disabled={V} />
          {errors.cities ? <p style={hintS(true)}>{errors.cities}</p> : <p style={hintS()}>Type a city name and press Enter</p>}
        </div>
        <div style={dividerS} />

        <p style={{ margin: '0 0 14px', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Professional License</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span style={FL}>License Number</span>
            <input style={inputS(V)} placeholder="e.g. PM-12345" value={licenseNum} readOnly={V}
              onChange={e => {
                const val = e.target.value;
                setLicenseNum(val);
                markDirty();
                // When license # cleared, also clear dependent fields
                if (!val.trim()) {
                  setIssuingState('');
                  setExpiryDate('');
                  setLicenseFile(null);
                  setLicenseFileName('');
                }
              }}
            />
          </div>
          <div>
            <span style={FL}>Issuing State {licenseRequired && !V ? '*' : ''}</span>
            <CustomDropdown
              options={ISSUING_OPTIONS}
              value={issuingState}
              placeholder="Select state…"
              disabled={V || !licenseRequired}
              error={!!errors.issuingState}
              onChange={v => { setIssuingState(v); markDirty(); setErrors(p => ({ ...p, issuingState: '' })); }}
            />
            {errors.issuingState && <p style={hintS(true)}>{errors.issuingState}</p>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span style={FL}>License Expiry Date {licenseRequired && !V ? '*' : ''}</span>
            <div style={{ position: 'relative' }}>
              <input type="date" min={new Date().toISOString().split('T')[0]}
                readOnly={V || !licenseRequired}
                style={{ ...inputS(V || !licenseRequired, !!errors.expiryDate), paddingRight: '36px', color: expiryDate ? C.textPrimary : C.textTertiary, cursor: (V || !licenseRequired) ? 'default' : 'pointer', colorScheme: 'light' }}
                value={expiryDate}
                onChange={e => { setExpiryDate(e.target.value); markDirty(); setErrors(p => ({ ...p, expiryDate: '' })); }}
              />
              <i className="ti ti-calendar" style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: C.textTertiary, pointerEvents: 'none' }} />
            </div>
            {errors.expiryDate && <p style={hintS(true)}>{errors.expiryDate}</p>}
          </div>
          <div>
            <span style={FL}>License Document {licenseRequired && !V ? '*' : '(Optional)'}</span>
            <FileAttach
              label="Upload file…"
              fileName={licenseFile instanceof File ? licenseFile.name : licenseFileName}
              disabled={V || !licenseRequired}
              onChange={e => { setLicenseFile(e.target.files[0]); setLicenseFileName(''); markDirty(); setErrors(p => ({ ...p, licenseFile: '' })); }}
            />
            {errors.licenseFile && <p style={hintS(true)}>{errors.licenseFile}</p>}
          </div>
        </div>

        {!V && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: C.infoBg, border: '1px solid ' + C.infoBorder, borderRadius: '8px', padding: '11px 14px', marginBottom: '8px' }}>
            <i className="ti ti-info-circle" style={{ fontSize: '15px', color: C.infoText, flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontFamily: F.body, fontSize: '12px', color: C.infoText, lineHeight: 1.55 }}>Changes to your license details will be sent for re-verification.</p>
          </div>
        )}
        <div style={dividerS} />

        <p style={{ margin: '0 0 14px', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brokerage Information</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <span style={FL}>Brokerage Name</span>
            <input style={inputS(V)} placeholder="Enter brokerage name" value={brokerageName} readOnly={V} onChange={e => { setBrokerageName(e.target.value); markDirty(); }} />
          </div>
          <div>
            <span style={FL}>Brokerage License #</span>
            <input style={inputS(V)} placeholder="Enter license number" value={brokerageLic} readOnly={V} onChange={e => { setBrokerageLic(e.target.value); markDirty(); }} />
          </div>
        </div>
        <div style={dividerS} />
        {renderFooter()}
      </>
    );

    if (currentStep === 3) return (
      <>
        <div style={dividerS} />
        <p style={{ margin: '0 0 4px', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fee Structure</p>
        <p style={{ margin: '0 0 16px', fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>Visible on your public profile</p>

        <div style={{ marginBottom: '16px' }}>
          <span style={FL}>Management Fee Type *</span>
          <div style={{ display: 'grid', gridTemplateColumns: mgmtShowVal ? '1fr 80px' : '1fr', gap: '10px' }}>
            <CustomDropdown options={MGMT_OPTS} value={mgmtType} placeholder="Select…" disabled={V} error={!!errors.mgmtType} onChange={v => { setMgmtType(v); markDirty(); setErrors(p => ({ ...p, mgmtType: '' })); }} />
            {mgmtShowVal && <input type="text" style={{ ...inputS(V), textAlign: 'center' }} value={mgmtValue} readOnly={V} onChange={e => { setMgmtValue(e.target.value); markDirty(); }} placeholder="0" />}
          </div>
          {errors.mgmtType ? <p style={hintS(true)}>{errors.mgmtType}</p> : <p style={hintS()}>% of monthly rent / Flat monthly / Negotiable</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '4px' }}>
          <div>
            <span style={FL}>Lease-up / Onboarding Fee</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <CustomDropdown options={LEASE_OPTS} value={leaseType} placeholder="Select…" disabled={V} onChange={v => { setLeaseType(v); markDirty(); }} />
              {leaseShowVal && <input type="text" style={{ ...inputS(V), width: '68px', textAlign: 'center', flexShrink: 0 }} value={leaseValue} readOnly={V} onChange={e => { setLeaseValue(e.target.value); markDirty(); }} placeholder="$0" />}
            </div>
            <p style={hintS()}>One month's rent / Flat / None / Negotiable</p>
          </div>
          <div>
            <span style={FL}>Lease Renewal Fee</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <CustomDropdown options={RENEWAL_OPTS} value={renewalType} placeholder="Select…" disabled={V} onChange={v => { setRenewalType(v); markDirty(); }} />
              {renewShowVal && <input type="text" style={{ ...inputS(V), width: '68px', textAlign: 'center', flexShrink: 0 }} value={renewalValue} readOnly={V} onChange={e => { setRenewalValue(e.target.value); markDirty(); }} placeholder="0%" />}
            </div>
            <p style={hintS()}>% / Flat / None / Negotiable</p>
          </div>
        </div>
        <div style={dividerS} />

        <p style={{ margin: '0 0 14px', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Identity Verification</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
          <div>
            <span style={FL}>ID Type *</span>
            <CustomDropdown options={ID_OPTS} value={idType} placeholder="Select…" disabled={V} error={!!errors.idType} onChange={v => { setIdType(v); markDirty(); setErrors(p => ({ ...p, idType: '' })); }} />
            {errors.idType ? <p style={hintS(true)}>{errors.idType}</p> : <p style={hintS()}>Filtered by country</p>}
          </div>
          <div>
            <span style={FL}>ID Number *</span>
            <input style={inputS(V, !!errors.idNumber)} placeholder="Enter ID number" value={idNumber} readOnly={V} onChange={e => { setIdNumber(e.target.value); markDirty(); setErrors(p => ({ ...p, idNumber: '' })); }} />
            {errors.idNumber && <p style={hintS(true)}>{errors.idNumber}</p>}
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <DocUploadZone files={idFiles} onAdd={f => { setIdFiles(p => [...p, ...f].slice(0, 3)); markDirty(); setErrors(p => ({ ...p, idFiles: '' })); }} onRemove={i => { setIdFiles(p => p.filter((_, idx) => idx !== i)); markDirty(); }} disabled={V} />
          {errors.idFiles && <p style={hintS(true)}>{errors.idFiles}</p>}
        </div>

        {!V && (
          <>
            <div style={dividerS} />
            <p style={{ margin: '0 0 12px', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Terms &amp; Subscription</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: C.successBg, border: '1px solid ' + C.successBorder, borderRadius: '8px', padding: '11px 14px', marginBottom: '14px' }}>
              <i className="ti ti-gift" style={{ fontSize: '15px', color: C.successText, flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontFamily: F.body, fontSize: '12px', color: C.successText, lineHeight: 1.55 }}>Your 30-day free trial is active. Changes take effect immediately.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none', marginBottom: '4px' }}
              onClick={() => { setAgreed(p => !p); markDirty(); setErrors(p => ({ ...p, agreed: '' })); }}
            >
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, marginTop: '2px', border: errors.agreed ? ('2px solid ' + C.danger) : agreed ? ('2px solid ' + C.primary) : ('1.5px solid ' + C.borderMedium), background: agreed ? C.primary : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', cursor: 'pointer' }}>
                {agreed && <i className="ti ti-check" style={{ fontSize: '10px', color: C.white }} />}
              </div>
              <span style={{ fontFamily: F.body, fontSize: '13px', color: C.textPrimary, lineHeight: 1.55 }}>
                I confirm these changes are accurate and agree to the{' '}
                <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</a>
              </span>
            </div>
            {errors.agreed && <p style={{ ...hintS(true), marginBottom: '8px' }}>{errors.agreed}</p>}
          </>
        )}
        <div style={dividerS} />
        {renderFooter()}
      </>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes spin    { to   { transform: rotate(360deg); } }
        .pm-form-scroll::-webkit-scrollbar { width: 5px; }
        .pm-form-scroll::-webkit-scrollbar-track { background: transparent; }
        .pm-form-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>

        {/* ── Col 1: Nav B ── */}
        <NavB activeId="persona" />

        {/* ── Col 2+3: right side ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Header */}
          <Header userName={userName} userRole={userRole} />

          {/* ── Full-width title block ── */}
          <div style={{ flexShrink: 0, padding: 'clamp(20px,2.5vw,32px) clamp(20px,3vw,48px) 0', background: C.pageBg }}>
            <h1 style={{ margin: '0 0 4px', fontFamily: F.headline, fontSize: 'clamp(22px,2.2vw,28px)', fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
              Independent Property Manager
            </h1>

            {/* Green subtitle + mode badge + icons — all in one row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontFamily: F.headline, fontSize: 'clamp(13px,1.2vw,15px)', fontWeight: 600, color: C.green }}>
                Registration &amp; Profile Setup
              </p>
              {/* Trash + Pencil icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Mode badge */}
                <span style={{ fontFamily: F.body, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', borderRadius: '4px', padding: '3px 8px', background: editMode ? C.amberBg : C.contextBg, color: editMode ? C.amberText : C.primary, border: '1px solid ' + (editMode ? C.amberBorder : C.contextBorder) }}>
                  {editMode ? 'EDIT MODE' : 'VIEW MODE'}
                </span>
                {/* Trash icon */}
                <div onClick={() => setShowDeleteModal(true)}
                  style={{ width: '32px', height: '32px', borderRadius: '7px', border: '1px solid ' + C.dangerBorder, background: C.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FECACA'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.dangerBg; }}
                  title="Delete profile"
                >
                  <i className="ti ti-trash" style={{ fontSize: '15px', color: C.danger }} />
                </div>
                {/* Pencil icon — toggles edit/view */}
                <div onClick={toggleEdit}
                  style={{ width: '32px', height: '32px', borderRadius: '7px', border: '1px solid ' + (editMode ? C.primary : C.contextBorder), background: editMode ? C.primary : C.contextBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  title={editMode ? 'Exit edit mode' : 'Edit profile'}
                >
                  <i className="ti ti-pencil" style={{ fontSize: '15px', color: editMode ? C.white : C.primary }} />
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', color: C.textSecondary, lineHeight: 1.6, maxWidth: '580px' }}>
              {editMode
                ? 'Edit your profile details below. First name and last name cannot be changed here.'
                : 'Your professional profile as seen by landlords. Click the pencil icon to edit.'}
            </p>
          </div>

          {/* Body row: stepper + form */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

            {/* Stepper */}
            <VerticalStepper current={currentStep} />

            {/* Form scroll area */}
            <div className="pm-form-scroll" style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth: 0 }}>
              <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: '12px', padding: 'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth: '780px', width: '100%', animation: 'fadein 0.3s ease both' }}>

                {/* Card header */}
                <h2 style={{ margin: '0 0 4px', fontFamily: F.headline, fontSize: '18px', fontWeight: 700, color: C.textPrimary }}>
                  Independent PM registration
                </h2>
                <p style={{ margin: '0 0 4px', fontFamily: F.body, fontSize: '12px', color: C.textTertiary }}>
                  {editMode ? 'Make your changes below. Click Continue to save.' : 'Pre-filled from your account — click the pencil icon to edit.'}
                </p>

                {/* API error */}
                {errors.api && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginTop: '12px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: '15px', color: '#DC2626', flexShrink: 0 }} />
                    <span style={{ fontFamily: F.body, fontSize: '12px', color: '#DC2626' }}>{errors.api}</span>
                  </div>
                )}

                {renderFormContent()}
              </div>

              {/* Page footer */}
              <p style={{ textAlign: 'center', fontFamily: F.body, fontSize: '10px', color: C.textTertiary, margin: '24px 0 16px', letterSpacing: '0.04em' }}>
                © 2024 URBANNEST EDITORIAL SYSTEMS. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      {/* Unsaved changes warning */}
      <UnsavedWarning
        open={showUnsavedWarning}
        onStay={() => setShowUnsavedWarning(false)}
        onLeave={() => { setShowUnsavedWarning(false); setCurrentStep(pendingBackStep); setIsDirty(false); }}
      />
    </>
  );
}
