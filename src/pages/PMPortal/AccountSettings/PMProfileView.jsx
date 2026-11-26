/**
 * PMProfileView.jsx — PM Portal: Account Settings → My Profile (Design System v2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Route:   /pm-portal/account/profile                 Layout: Downloads/image 171.png
 *
 *   NavPM sidebar │ PM top bar                                          (PMPageShell)
 *                 │ wave backdrop · "Independent Property Manager" header (T2.heroHeading + T2.lead)
 *                 │ Account Settings tabs (TabBar underline + icons — same routes as AccountSettingsSubnav)
 *                 │ <Grid layout="steps">  StepList (vertical) │ form: title · fields (FIELD2 standard)
 *                 │                                            │ footer: View only / note · Back (soft) · Next (brand)
 *                 │ PageFooter
 *
 * Modes:   VIEW (fields shown read-only, ReadField) / EDIT (fields unlocked except name) — pencil icon toggles.
 * Steps:   1 → 2 → 3 (same content + API calls as the v1 page; only the presentation is v2).
 * Pop-ups: standard v2 Modal (variant confirm) — delete profile, unsaved changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PMPageShell, Grid, PageFooter, ImageBackdrop } from '../../../components/layout';
import {
  TabBar, StepList, FormField, ReadField, SelectField, FIELD2, Checkbox, ChoiceTile, Modal, ModalSection,
} from '../../../components/ui';
import { C2, TONES2, SH2, FS2, SP2, SZ2, T2, UI2 } from '../../../constants';
import { WZ, ChipInput } from '../../Landlord/Listing/listingWizardV2';   // shared v2 form-layout styles + chip field
import { ACCOUNT_SETTINGS_TABS } from './AccountSettingsSubnav';
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';   // soft blue wave lines (same art as Approvals / Create Listing)

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api').replace(/\/api\/?$/, '');

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

// Form header per step (icon box · title · subtitle). Steps without an entry keep "Independent PM registration".
const STEP_HEADS = {
  2: { icon: 'ti-id-badge-2', title: 'Service Area & License', sub: 'Define your service coverage and professional credentials.' },
};

// Account Settings tabs — same routes as AccountSettingsSubnav, with the v2 icons (NavPM uses the same icons)
const TAB_ICONS = {
  profile: 'ti-user', bank: 'ti-building-bank', subscription: 'ti-credit-card',
  services: 'ti-settings', transactions: 'ti-file-invoice', integrations: 'ti-puzzle',
};

// Type of business — ChoiceTile icons
const BUSINESS = [
  ['property_management', 'Property Management', 'ti-home-cog'],
  ['tenant_placement',    'Tenant Placement',    'ti-users'],
  ['buy',                 'Buy',                 'ti-shopping-cart'],
  ['sell',                'Sell',                'ti-tag'],
];
const PROPERTY_TYPES = [['residential','Residential'],['commercial','Commercial'],['student_housing','Student Housing'],['short_term','Short-term'],['mixed','Mixed']];

// ─── US States ─────────────────────────────────────────────────────────────────
const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

// ── Page-specific layout only (every look comes from v2 tokens / components) ──
const S = {
  headBlock: UI2.pageHead.block,                       // shared header-block spacing (Approvals / Listings)
  title:     { ...T2.heroHeading, margin: 0 },
  sub:       { ...T2.lead, margin: `${SP2.xs}px 0 0` },
  tabs:      UI2.pageHead.next,
  form:      { ...UI2.stack(SP2.xl), minWidth: 0 },
  formHead:  { ...UI2.rowBetween(SP2.md), alignItems: 'flex-start' },
  formTitle: { ...T2.pageTitle, margin: 0 },
  formSub:   { ...T2.label, margin: `${SP2.xs}px 0 0` },
  headActs:  { ...UI2.row(SP2.sm), flexShrink: 0 },
  // header actions on the light-blue wave = the Listings header pair: white light (secondary) + brand (main)
  editBtn:   UI2.btn.brand,                                             // main action (Edit)
  deleteBtn: UI2.btn.light,                                             // secondary action on the wave (Delete)
  locked:    { ...T2.caption, textTransform: 'none', letterSpacing: 0 },   // "(Locked)" after a caps label
  group:     UI2.stack(SP2.sm),                       // caps label · control row · hint
  subhead:   { ...UI2.capsLabel, display: 'block' },  // caps sub-section title (Service Area / License …)
  hintRow:   UI2.rowBetween(SP2.md),
  // profile photo — round preview + soft upload button + hint
  photoRow:  UI2.row(SP2.lg),
  photo:     { ...UI2.avatar(SZ2.profilePhoto, { soft: C2.chipBlue, fg: C2.navy }), boxShadow: SH2.avatarRing, overflow: 'hidden', fontSize: FS2.xxl },
  photoImg:  { width: '100%', height: '100%', objectFit: 'cover' },
  btnIcon:   UI2.btnIcon,
  // file field (license document) — the standard field box with a trailing paperclip
  fileBtn:   { ...FIELD2.input, ...UI2.rowBetween(SP2.sm), cursor: 'pointer', textAlign: 'left' },
  filePh:    { color: C2.textMuted },
  fileRead:  { background: C2.fieldReadOnly, cursor: 'default' },   // view mode = ReadField background
  // step header (steps 2+): round tinted icon box beside the step title
  stepHead:  { ...UI2.row(SP2.lg), minWidth: 0 },
  stepIcon:  { ...UI2.iconBox(SZ2.icon.lg, TONES2.primary, { round: true }), fontSize: FS2.xl },
  sections:  { minWidth: 0 },   // ModalSection groups (divider between them via .un2-modal-sec)
  // ID documents upload slot
  upload:    { ...UI2.addTile(false), height: SZ2.thumbXl.h },
  uploadOff: UI2.btnOff,
  // info / success notes
  note:      (tone) => ({ ...UI2.tintRow, background: tone.tint, color: tone.fg, ...T2.label }),
  noteIcon:  { fontSize: FS2.lg, flexShrink: 0 },
  // fee type + value side by side
  feeRow:    { display: 'flex', gap: SP2.sm, minWidth: 0 },
  feeVal:    { ...FIELD2.input, width: SZ2.btnSm.w, flexShrink: 0, textAlign: 'center' },
  // footer
  foot:      { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', paddingTop: SP2.lg, borderTop: `${SZ2.hairline}px solid ${C2.border}` },
  footNote:  { ...UI2.btn.link, cursor: 'default' },
  footActs:  { ...UI2.row(SP2.sm), marginLeft: 'auto' },
  modalText: { ...T2.body, margin: 0 },
};

// ─── Small v2 field helpers (view mode → ReadField, edit mode → standard field) ──
function TextField({ view, value, onChange, invalid, placeholder, type = 'text', ...rest }) {
  if (view) return <ReadField value={value} />;
  return (
    <input
      className="un2-focus-ring" type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ ...FIELD2.input, ...(invalid ? FIELD2.invalid : {}) }} {...rest}
    />
  );
}

function PickField({ view, value, options, onChange, placeholder = 'Select…', label }) {
  const cur = options.find(o => o.value === value);
  if (view) return <ReadField value={cur ? cur.label : ''} icon="ti-chevron-down" />;
  return <SelectField value={value} options={options} onChange={onChange} placeholder={placeholder} label={label} />;
}

function Hint({ error, children }) {
  return error ? <span style={FIELD2.error}>{error}</span> : children ? <span style={WZ.hint}>{children}</span> : null;
}

// ─── Photo upload — round preview + soft button ──────────────────────────────
function PhotoUpload({ preview, onChange, disabled }) {
  const ref = useRef();
  return (
    <div style={S.photoRow}>
      <div style={S.photo}>
        {preview ? <img src={preview} alt="Profile" style={S.photoImg} /> : <i className="ti ti-user" aria-hidden="true" />}
      </div>
      <div style={UI2.stack(SP2.xs)}>
        <input ref={ref} type="file" accept="image/jpeg,image/png" hidden onChange={onChange} disabled={disabled} />
        <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...(disabled ? { cursor: 'default' } : {}) }} onClick={() => !disabled && ref.current?.click()}>
          <i className="ti ti-cloud-upload" style={S.btnIcon} aria-hidden="true" />
          {disabled ? 'Photo on file' : 'Upload photo'}
        </button>
        <span style={WZ.hint}>JPG or PNG, max 5MB. Optional.</span>
      </div>
    </div>
  );
}

// ─── File attach — standard field box (FIELD2.input + IconField slots) ───────
//   empty → placeholder + paperclip · picked → file icon · name · × to clear (edit mode only)
function FileAttach({ label, onChange, onClear, fileName, disabled, invalid }) {
  const ref = useRef();
  if (disabled && !fileName) return <ReadField placeholder={label} icon="ti-paperclip" />;
  return (
    <div style={FIELD2.iconWrap}>
      <input ref={ref} type="file" hidden onChange={onChange} accept=".pdf,.jpg,.png" />
      <button type="button" className={disabled ? undefined : 'un2-focus-ring'} disabled={disabled}
        style={{ ...S.fileBtn, ...(fileName ? FIELD2.withIcon : {}), ...FIELD2.withTrail, ...(disabled ? S.fileRead : {}), ...(invalid ? FIELD2.invalid : {}) }}
        onClick={() => ref.current?.click()}>
        <span style={{ ...UI2.truncate, ...(fileName ? {} : S.filePh) }}>{fileName || label}</span>
      </button>
      {fileName && <i className="ti ti-file-text" style={{ ...FIELD2.iconSlot('left'), color: C2.primary, pointerEvents: 'none' }} aria-hidden="true" />}
      {fileName && !disabled && onClear
        ? <button type="button" style={{ ...FIELD2.iconSlot('right'), cursor: 'pointer' }} onClick={onClear} aria-label="Remove file" title="Remove file"><i className="ti ti-x" aria-hidden="true" /></button>
        : <i className="ti ti-paperclip" style={{ ...FIELD2.iconSlot('right'), pointerEvents: 'none' }} aria-hidden="true" />}
    </div>
  );
}

// ─── ID documents — dashed upload slot (UI2.addTile) + file chips ────────────
function DocUploadZone({ files, onAdd, onRemove, disabled }) {
  const ref = useRef();
  const MAX = 3;
  const full = files.length >= MAX;
  return (
    <div style={UI2.stack(SP2.sm)}>
      <input ref={ref} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" hidden disabled={disabled}
        onChange={e => { onAdd(Array.from(e.target.files).slice(0, MAX - files.length)); e.target.value = ''; }} />
      <button type="button" className={disabled || full ? undefined : 'un2-raise'} disabled={disabled || full}
        style={{ ...S.upload, ...(disabled || full ? S.uploadOff : {}) }} onClick={() => ref.current?.click()}>
        <i className="ti ti-cloud-upload" style={UI2.addTileIcon} aria-hidden="true" />
        {disabled ? 'ID document(s) on file' : 'Upload ID document(s)'}
        <span style={WZ.hint}>Up to 3 files — JPG, PNG, or PDF. Max 10MB each.</span>
      </button>
      {files.length > 0 && (
        <div style={FIELD2.chipList}>
          {files.map((f, i) => (
            <span key={i} style={FIELD2.chip}>
              <i className="ti ti-file" aria-hidden="true" />{typeof f === 'string' ? f : f.name}
              {!disabled && <button type="button" style={FIELD2.chipX} onClick={() => onRemove(i)} aria-label="Remove file"><i className="ti ti-x" aria-hidden="true" /></button>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tinted note (info / success) ────────────────────────────────────────────
function Note({ tone, icon, children }) {
  return (
    <div style={S.note(tone)}>
      <i className={`ti ${icon}`} style={S.noteIcon} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

// ─── Main PMProfileView Component ─────────────────────────────────────────────
export default function PMProfileView() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── User ──────────────────────────────────────────────────────────────────
  const [, setUserName]  = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [, setUserRole]  = useState('Independent PM');

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
        if (d1.profile_photo)       setPhotoPreview(`${API_BASE}${d1.profile_photo}`);

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

  // SelectField lists real choices only (its placeholder shows when nothing is picked)
  const opts = list => list.filter(o => o.value !== '');
  const clearErr = k => setErrors(p => ({ ...p, [k]: '' }));
  const [cityDraft, setCityDraft] = useState('');
  const stepHead = STEP_HEADS[currentStep];

  // ── Footer: note on the left · Back (soft) + main action (brand) ──────────
  const renderFooter = () => {
    const spinner = <i className="ti ti-loader-2 un2-spin" style={S.btnIcon} aria-hidden="true" />;
    let note, main;
    if (V) {
      note = <><i className="ti ti-eye" style={S.btnIcon} aria-hidden="true" />View only</>;
      main = currentStep < 3 && (
        <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={handleNext}>
          Next <i className="ti ti-arrow-right" style={S.btnIcon} aria-hidden="true" />
        </button>
      );
    } else if (currentStep === 3) {
      note = <><i className="ti ti-device-floppy" style={S.btnIcon} aria-hidden="true" />{isReactivation ? 'Review all steps then reactivate' : 'Changes saved on submit'}</>;
      main = (
        <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...(saving ? UI2.btnOff : {}) }} onClick={handleSubmit} disabled={saving}>
          {saving ? <>{spinner}Saving…</>
            : isReactivation ? <><i className="ti ti-refresh" style={S.btnIcon} aria-hidden="true" />Reactivate Account</>
            : <><i className="ti ti-device-floppy" style={S.btnIcon} aria-hidden="true" />Submit</>}
        </button>
      );
    } else {
      note = <><i className="ti ti-device-floppy" style={S.btnIcon} aria-hidden="true" />Progress auto-saved</>;
      main = (
        <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...(saving ? UI2.btnOff : {}) }} onClick={handleContinue} disabled={saving}>
          {saving ? <>{spinner}Saving…</> : <>Continue <i className="ti ti-arrow-right" style={S.btnIcon} aria-hidden="true" /></>}
        </button>
      );
    }
    return (
      <div style={S.foot}>
        <span style={S.footNote}>{note}</span>
        <div style={S.footActs}>
          <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={handleBack}>
            <i className="ti ti-arrow-left" style={S.btnIcon} aria-hidden="true" /> Back
          </button>
          {main}
        </div>
      </div>
    );
  };

  const lockedLabel = text => <>{text} <span style={S.locked}>(Locked)</span></>;

  // ── Form content per step ─────────────────────────────────────────────────
  const renderFormContent = () => {
    if (currentStep === 1) return (
      <>
        {/* Name — always locked */}
        <div style={FIELD2.grid}>
          <FormField label={lockedLabel('First Name')}><ReadField value={firstName} /></FormField>
          <FormField label={lockedLabel('Last Name')}><ReadField value={lastName} /></FormField>
        </div>

        <FormField label="Profile Photo">
          <PhotoUpload preview={photoPreview} disabled={V}
            onChange={e => { const f = e.target.files[0]; if (f) { setPhotoPreview(URL.createObjectURL(f)); markDirty(); } }} />
        </FormField>

        <div style={FIELD2.grid}>
          <FormField label="Years of Experience *">
            <PickField view={V} value={yearsExp} options={opts(EXP_OPTIONS)} placeholder="Select range…" label="Years of experience"
              onChange={v => { setYearsExp(v); markDirty(); clearErr('yearsExp'); }} />
            <Hint error={errors.yearsExp} />
          </FormField>
          <FormField label="Max Units Capacity *">
            <TextField view={V} type="number" min="1" placeholder="e.g. 25" value={maxUnits} invalid={!!errors.maxUnits}
              onChange={e => { setMaxUnits(e.target.value); markDirty(); clearErr('maxUnits'); }} />
            <Hint error={errors.maxUnits}>How many units can you manage?</Hint>
          </FormField>
        </div>

        <FormField label="Bio / About Me *">
          <textarea className="un2-focus-ring" placeholder="Describe your experience…" readOnly={V}
            style={{ ...FIELD2.textarea, ...(V ? { background: C2.fieldReadOnly, resize: 'none' } : {}), ...(errors.bio ? FIELD2.invalid : {}) }}
            value={bio} onChange={e => { setBio(e.target.value); markDirty(); clearErr('bio'); }} />
          <div style={S.hintRow}>
            <Hint error={errors.bio}>Shown publicly on your profile. Min 50 characters.</Hint>
            <span style={bio.length > 0 && bio.length < 50 ? FIELD2.error : WZ.hint}>{bio.length}/50</span>
          </div>
        </FormField>

        <div style={S.group}>
          <span style={S.subhead}>Type of Business</span>
          <Grid layout="four" as="div" style={WZ.tiles}>
            {BUSINESS.map(([k, l, icon]) => (
              <ChoiceTile key={k} icon={icon} label={l} selected={businessTypes[k]}
                onClick={() => { if (V) return; setBusinessTypes(p => ({ ...p, [k]: !p[k] })); markDirty(); }} />
            ))}
          </Grid>
          <span style={WZ.hint}>Select all that apply</span>
        </div>

        <div style={S.group}>
          <span style={S.subhead}>Property Types Managed</span>
          <div style={WZ.checks}>
            {PROPERTY_TYPES.map(([k, l]) => (
              <Checkbox key={k} label={l} checked={propertyTypes[k]} disabled={V}
                onChange={() => { setPropertyTypes(p => ({ ...p, [k]: !p[k] })); markDirty(); clearErr('propertyTypes'); }} />
            ))}
          </div>
          <Hint error={errors.propertyTypes}>Select all that apply</Hint>
        </div>
      </>
    );

    // Step 2 — three titled groups (ModalSection: icon box · title · faint divider between groups)
    if (currentStep === 2) return (
      <div style={S.sections}>
        <ModalSection icon="ti-map-pin" title="Service Area">
        <div style={FIELD2.grid}>
          <FormField label="Country (Auto-detected)"><ReadField value="United States" icon="ti-chevron-down" /></FormField>
          <FormField label="State / Region *">
            <PickField view={V} value={state} options={opts(STATE_OPTIONS)} placeholder="Select state…" label="State / Region"
              onChange={v => { setState(v); markDirty(); clearErr('state'); }} />
            <Hint error={errors.state}>Determines license requirements</Hint>
          </FormField>
          <FormField label="Cities Served *" full>
            {V ? <ReadField value={cities.join(', ')} /> : (
              <ChipInput items={cities} draft={cityDraft} onDraft={setCityDraft} label="Cities served"
                placeholder={cities.length ? 'Add city…' : 'Type a city and press Enter'}
                onAdd={() => { const c = cityDraft.trim(); if (c && !cities.includes(c)) { setCities(p => [...p, c]); markDirty(); clearErr('cities'); } setCityDraft(''); }}
                onRemove={i => { setCities(p => p.filter((_, idx) => idx !== i)); markDirty(); }} />
            )}
            <Hint error={errors.cities}>{V ? null : 'Type a city name and press Enter'}</Hint>
          </FormField>
        </div>
        </ModalSection>

        <ModalSection icon="ti-shield-check" title="Professional License">
        <div style={FIELD2.grid}>
          <FormField label="License Number">
            <TextField view={V} placeholder="e.g. PM-12345" value={licenseNum}
              onChange={e => {
                const val = e.target.value;
                setLicenseNum(val);
                markDirty();
                // When license # cleared, also clear dependent fields
                if (!val.trim()) { setIssuingState(''); setExpiryDate(''); setLicenseFile(null); setLicenseFileName(''); }
              }} />
          </FormField>
          <FormField label={`Issuing State ${licenseRequired && !V ? '*' : ''}`}>
            <PickField view={V || !licenseRequired} value={issuingState} options={opts(ISSUING_OPTIONS)} placeholder="Select state…" label="Issuing state"
              onChange={v => { setIssuingState(v); markDirty(); clearErr('issuingState'); }} />
            <Hint error={errors.issuingState} />
          </FormField>
          <FormField label={`License Expiry Date ${licenseRequired && !V ? '*' : ''}`}>
            <TextField view={V || !licenseRequired} type="date" min={new Date().toISOString().split('T')[0]} value={expiryDate} invalid={!!errors.expiryDate}
              onChange={e => { setExpiryDate(e.target.value); markDirty(); clearErr('expiryDate'); }} />
            <Hint error={errors.expiryDate} />
          </FormField>
          <FormField label={`License Document ${licenseRequired && !V ? '*' : '(Optional)'}`}>
            <FileAttach label="Upload file…" disabled={V || !licenseRequired} invalid={!!errors.licenseFile}
              fileName={licenseFile instanceof File ? licenseFile.name : licenseFileName}
              onChange={e => { setLicenseFile(e.target.files[0]); setLicenseFileName(''); markDirty(); clearErr('licenseFile'); }}
              onClear={() => { setLicenseFile(null); setLicenseFileName(''); markDirty(); }} />
            <Hint error={errors.licenseFile} />
          </FormField>
        </div>
        {!V && <Note tone={TONES2.primary} icon="ti-info-circle">Changes to your license details will be sent for re-verification.</Note>}
        </ModalSection>

        <ModalSection icon="ti-building" title="Brokerage Information">
        <div style={FIELD2.grid}>
          <FormField label="Brokerage Name">
            <TextField view={V} placeholder="Enter brokerage name" value={brokerageName} onChange={e => { setBrokerageName(e.target.value); markDirty(); }} />
          </FormField>
          <FormField label="Brokerage License #">
            <TextField view={V} placeholder="Enter license number" value={brokerageLic} onChange={e => { setBrokerageLic(e.target.value); markDirty(); }} />
          </FormField>
        </div>
        </ModalSection>
      </div>
    );

    if (currentStep === 3) return (
      <>
        <div style={UI2.stack(SP2.xs)}>
          <span style={S.subhead}>Fee Structure</span>
          <span style={WZ.hint}>Visible on your public profile</span>
        </div>
        <FormField label="Management Fee Type *">
          <div style={S.feeRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <PickField view={V} value={mgmtType} options={opts(MGMT_OPTS)} label="Management fee type"
                onChange={v => { setMgmtType(v); markDirty(); clearErr('mgmtType'); }} />
            </div>
            {mgmtShowVal && <input className="un2-focus-ring" style={S.feeVal} value={mgmtValue} readOnly={V} placeholder="0" onChange={e => { setMgmtValue(e.target.value); markDirty(); }} />}
          </div>
          <Hint error={errors.mgmtType}>% of monthly rent / Flat monthly / Negotiable</Hint>
        </FormField>
        <div style={FIELD2.grid}>
          <FormField label="Lease-up / Onboarding Fee">
            <div style={S.feeRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <PickField view={V} value={leaseType} options={opts(LEASE_OPTS)} label="Lease-up fee" onChange={v => { setLeaseType(v); markDirty(); }} />
              </div>
              {leaseShowVal && <input className="un2-focus-ring" style={S.feeVal} value={leaseValue} readOnly={V} placeholder="$0" onChange={e => { setLeaseValue(e.target.value); markDirty(); }} />}
            </div>
            <Hint>One month's rent / Flat / None / Negotiable</Hint>
          </FormField>
          <FormField label="Lease Renewal Fee">
            <div style={S.feeRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <PickField view={V} value={renewalType} options={opts(RENEWAL_OPTS)} label="Renewal fee" onChange={v => { setRenewalType(v); markDirty(); }} />
              </div>
              {renewShowVal && <input className="un2-focus-ring" style={S.feeVal} value={renewalValue} readOnly={V} placeholder="0%" onChange={e => { setRenewalValue(e.target.value); markDirty(); }} />}
            </div>
            <Hint>% / Flat / None / Negotiable</Hint>
          </FormField>
        </div>

        <div style={WZ.rule} />
        <span style={S.subhead}>Identity Verification</span>
        <div style={FIELD2.grid}>
          <FormField label="ID Type *">
            <PickField view={V} value={idType} options={opts(ID_OPTS)} label="ID type" onChange={v => { setIdType(v); markDirty(); clearErr('idType'); }} />
            <Hint error={errors.idType}>Filtered by country</Hint>
          </FormField>
          <FormField label="ID Number *">
            <TextField view={V} placeholder="Enter ID number" value={idNumber} invalid={!!errors.idNumber}
              onChange={e => { setIdNumber(e.target.value); markDirty(); clearErr('idNumber'); }} />
            <Hint error={errors.idNumber} />
          </FormField>
        </div>
        <div style={UI2.stack(SP2.xs)}>
          <DocUploadZone files={idFiles} disabled={V}
            onAdd={f => { setIdFiles(p => [...p, ...f].slice(0, 3)); markDirty(); clearErr('idFiles'); }}
            onRemove={i => { setIdFiles(p => p.filter((_, idx) => idx !== i)); markDirty(); }} />
          <Hint error={errors.idFiles} />
        </div>

        {!V && (
          <>
            <div style={WZ.rule} />
            <span style={S.subhead}>Terms &amp; Subscription</span>
            <Note tone={TONES2.success} icon="ti-gift">Your 30-day free trial is active. Changes take effect immediately.</Note>
            <div style={UI2.stack(SP2.xs)}>
              <Checkbox checked={agreed} strong
                label="I confirm these changes are accurate and agree to the Terms of Service"
                onChange={() => { setAgreed(p => !p); markDirty(); clearErr('agreed'); }} />
              <Hint error={errors.agreed} />
            </div>
          </>
        )}
      </>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <PMPageShell activeId="account-profile" animate backdrop={<ImageBackdrop image={backdropArt} />} searchPlaceholder="Search portfolios, settings, or help…">

      {/* ── Header: rule · title · subtitle → Account Settings tabs ── */}
      <section style={S.headBlock}>
        <h1 style={S.title}>Independent Property Manager</h1>
        <p style={S.sub}>Register and set up your profile to manage your properties with ease.</p>
        <div style={S.tabs}>
          <TabBar
            variant="underline"
            ariaLabel="Account settings"
            value="profile"
            onChange={id => { const t = ACCOUNT_SETTINGS_TABS.find(x => x.id === id); if (t && id !== 'profile') navigate(t.route); }}
            tabs={ACCOUNT_SETTINGS_TABS.map(t => ({ id: t.id, label: t.label, icon: TAB_ICONS[t.id] }))}
          />
        </div>
      </section>

      {/* ── Step list │ form ── */}
      <Grid layout="steps" as="div">
        <StepList steps={STEPS} current={currentStep} />

        <div style={S.form}>
          <div style={S.formHead}>
            {stepHead ? (
              <div style={S.stepHead}>
                <span style={S.stepIcon} aria-hidden="true"><i className={`ti ${stepHead.icon}`} /></span>
                <div style={UI2.minWidth0}>
                  <h2 style={S.formTitle}>{stepHead.title}</h2>
                  <p style={S.formSub}>{stepHead.sub}</p>
                </div>
              </div>
            ) : (
              <div style={UI2.minWidth0}>
                <h2 style={S.formTitle}>Independent PM registration</h2>
                <p style={S.formSub}>
                  {editMode ? 'Make your changes below. Click Continue to save.' : 'Pre-filled from your account — click the pencil icon to edit.'}
                </p>
              </div>
            )}
            <div style={S.headActs}>
              {/* same pair as the PM Listings header on the wave: white light button, then the brand button */}
              <button type="button" className="un2-btn" style={S.deleteBtn} onClick={() => setShowDeleteModal(true)}>
                <i className="ti ti-trash" style={S.btnIcon} aria-hidden="true" /> Delete
              </button>
              <button type="button" className="un2-btn" style={S.editBtn} onClick={toggleEdit}>
                <i className={`ti ${editMode ? 'ti-x' : 'ti-pencil'}`} style={S.btnIcon} aria-hidden="true" /> {editMode ? 'Cancel edit' : 'Edit'}
              </button>
            </div>
          </div>

          {errors.api && (
            <div style={UI2.errorBanner} role="alert">
              <i className="ti ti-alert-circle" aria-hidden="true" /><span>{errors.api}</span>
            </div>
          )}

          {renderFormContent()}
          {renderFooter()}
        </div>
      </Grid>

      <PageFooter />

      {/* Delete confirmation */}
      {showDeleteModal && (
        <Modal variant="confirm" icon="ti-trash" tone={TONES2.error} title="Delete Profile?" size="sm"
          onClose={() => !deleting && setShowDeleteModal(false)}
          footer={<>
            <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
            <button type="button" className="un2-btn" style={{ ...UI2.btn.danger, ...(deleting ? UI2.btnOff : {}) }} onClick={handleDelete} disabled={deleting}>
              <i className={`ti ${deleting ? 'ti-loader-2 un2-spin' : 'ti-trash'}`} style={S.btnIcon} aria-hidden="true" />
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </>}>
          <p style={S.modalText}>
            This will deactivate your Independent PM profile and remove your access to the PM portal. Your data will be retained for auditing purposes. This action can be reversed by contacting support.
          </p>
        </Modal>
      )}

      {/* Unsaved changes warning */}
      {showUnsavedWarning && (
        <Modal variant="confirm" icon="ti-alert-triangle" tone={TONES2.error} title="Unsaved Changes" size="sm"
          onClose={() => setShowUnsavedWarning(false)}
          footer={<>
            <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={() => setShowUnsavedWarning(false)}>Stay</button>
            <button type="button" className="un2-btn" style={UI2.btn.brand}
              onClick={() => { setShowUnsavedWarning(false); setCurrentStep(pendingBackStep); setIsDirty(false); }}>Leave anyway</button>
          </>}>
          <p style={S.modalText}>You have unsaved changes on this step. If you go back now, your changes will be lost.</p>
        </Modal>
      )}
    </PMPageShell>
  );
}
