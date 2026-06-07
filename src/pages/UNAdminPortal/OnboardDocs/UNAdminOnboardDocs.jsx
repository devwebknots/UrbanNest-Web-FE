import React, { useState, useEffect, useRef } from 'react';

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
  pageBg:        '#F1F5F9',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  white:         '#FFFFFF',
  neutral:       '#F8FAFC',
  danger:        '#E53E3E',
  green:         '#16A34A',
  dropdownBg:    '#E4ECFC',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const PERSONAS = [
  { key: 'ORG_PMS',   label: 'Org PMS' },
  { key: 'IND_PM',    label: 'Independent PM' },
  { key: 'LANDLORD',  label: 'Landlord' },
  { key: 'RENTER',    label: 'Renter' },
  { key: 'REA',       label: 'Real Estate Agent' },
  { key: 'TENANT',    label: 'Tenant' },
];

const COUNTRIES = [
  { value: '',   label: 'All countries' },
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'SG', label: 'Singapore' },
];

const COUNTRY_LABELS = Object.fromEntries(COUNTRIES.map(c => [c.value, c.label]));

const DOC_TYPES = [
  'REG_CERT', 'TAX_ID', 'PM_LICENSE', 'GST_CERT', 'PAN_CARD',
  'TRADE_LICENSE', 'TRN_CERT', 'VAT_CERT', 'UTR_CERT',
  'COMPANIES_HOUSE', 'OTHER',
];

// ─── Shared field styles ───────────────────────────────────────────────────────
const FL = {
  display: 'block', fontFamily: F.body, fontSize: '10px', fontWeight: 700,
  color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
};
const inputS = (error = false) => ({
  width: '100%', height: '40px', boxSizing: 'border-box',
  background: C.white, border: '1px solid ' + (error ? C.danger : C.borderMedium),
  borderRadius: '8px', padding: '0 12px',
  fontFamily: F.body, fontSize: '13px', color: C.textPrimary, outline: 'none',
});
const hintS = (error = false) => ({
  fontFamily: F.body, fontSize: '11px',
  color: error ? C.danger : C.textTertiary, marginTop: '4px',
});
const dividerS = { borderTop: '1px solid ' + C.border, margin: '18px 0' };
const sectionLabel = {
  fontFamily: F.body, fontSize: '10px', fontWeight: 700,
  color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: '14px',
};

// ─── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, onColor = C.green, offColor = C.danger }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: '40px', height: '22px', borderRadius: '11px', position: 'relative', cursor: 'pointer', flexShrink: 0, background: value ? onColor : offColor, transition: 'background 0.2s' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: C.white, position: 'absolute', top: '3px', left: value ? '21px' : '3px', transition: 'left 0.2s' }} />
    </div>
  );
}

// ─── CustomDropdown ────────────────────────────────────────────────────────────
function Dropdown({ options, value, onChange, placeholder = 'Select…', error = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => !disabled && setOpen(p => !p)} style={{
        height: '40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid ' + (error ? C.danger : C.borderMedium),
        background: disabled ? C.neutral : open ? C.dropdownBg : C.white,
        fontFamily: F.body, fontSize: '13px',
        color: selected ? C.textPrimary : C.textTertiary,
      }}>
        <span>{selected ? selected.label : placeholder}</span>
        <i className="ti ti-chevron-down" style={{ fontSize: '14px', color: C.textTertiary, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, background: C.white, border: '1px solid ' + C.borderMedium, borderRadius: '8px', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxHeight: '220px', overflowY: 'auto' }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ padding: '9px 12px', fontFamily: F.body, fontSize: '13px', cursor: 'pointer', color: opt.value === value ? C.primary : C.textPrimary, background: opt.value === value ? C.dropdownBg : 'transparent' }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = C.neutral; }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent'; }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function Badge({ type }) {
  const map = {
    required: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Required' },
    optional: { bg: C.neutral, color: C.textSecondary, border: C.border, label: 'Optional' },
    active:   { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Active' },
    inactive: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Inactive' },
  };
  const s = map[type] || map.optional;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '20px', fontFamily: F.body, fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color, border: '1px solid ' + s.border }}>
      {s.label}
    </span>
  );
}

// ─── View Popup ────────────────────────────────────────────────────────────────
function ViewPopup({ doc, onClose, onEdit }) {
  if (!doc) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ width: '440px', background: C.white, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: F.headline, fontSize: '16px', fontWeight: 700, color: C.textPrimary }}>{doc.doc_label}</h3>
            <p style={{ margin: '3px 0 0', fontFamily: F.body, fontSize: '12px', color: C.textTertiary }}>{COUNTRY_LABELS[doc.country] || 'All countries'} · {PERSONAS.find(p => p.key === doc.persona_type)?.label}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: C.textTertiary, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {[
            ['Doc Type Code',   doc.doc_type_code],
            ['Persona',         PERSONAS.find(p => p.key === doc.persona_type)?.label],
            ['Country',         COUNTRY_LABELS[doc.country] || 'All countries'],
            ['Hint',            doc.hint || '—'],
            ['Required',        doc.is_required ? 'Required' : 'Optional'],
            ['Max File Size',   (doc.max_file_size_mb || 10) + ' MB'],
            ['Accepted Formats',doc.accepted_formats || 'PDF, JPG, PNG'],
            ['Sort Order',      doc.sort_order ?? '—'],
            ['Status',          doc.is_active ? 'Active' : 'Inactive'],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: '14px' }}>
              <p style={{ margin: '0 0 3px', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', color: C.textPrimary }}>{String(val)}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid ' + C.border, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ height: '36px', padding: '0 18px', border: '1.5px solid ' + C.borderMedium, borderRadius: '8px', background: C.white, fontFamily: F.body, fontSize: '12px', fontWeight: 600, color: C.textPrimary, cursor: 'pointer' }}>Close</button>
          <button onClick={() => onEdit(doc)} style={{ height: '36px', padding: '0 18px', border: 'none', borderRadius: '8px', background: C.primary, fontFamily: F.body, fontSize: '12px', fontWeight: 700, color: C.white, cursor: 'pointer' }}>Edit</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────
function DocModal({ mode, doc, onClose, onSaved, token }) {
  const isEdit = mode === 'edit';
  const [personaType,      setPersonaType]      = useState(doc?.persona_type      || '');
  const [country,          setCountry]          = useState(doc?.country           || '');
  const [docLabel,         setDocLabel]         = useState(doc?.doc_label         || '');
  const [docTypeCode,      setDocTypeCode]      = useState(doc?.doc_type_code     || '');
  const [hint,             setHint]             = useState(doc?.hint              || '');
  const [isRequired,       setIsRequired]       = useState(doc?.is_required       ?? true);
  const [maxFileSizeMb,    setMaxFileSizeMb]    = useState(doc?.max_file_size_mb  || 10);
  const [acceptedFormats,  setAcceptedFormats]  = useState(doc?.accepted_formats  || 'PDF, JPG, PNG');
  const [sortOrder,        setSortOrder]        = useState(doc?.sort_order        || 1);
  const [isActive,         setIsActive]         = useState(doc?.is_active         ?? true);
  const [saving,           setSaving]           = useState(false);
  const [errors,           setErrors]           = useState({});

  // Auto-slugify doc label to doc type code
  const handleLabelChange = val => {
    setDocLabel(val);
    if (!isEdit) {
      setDocTypeCode(val.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''));
    }
  };

  const validate = () => {
    const e = {};
    if (!personaType)       e.personaType  = 'Required';
    if (!docLabel.trim())   e.docLabel     = 'Required';
    if (!docTypeCode.trim())e.docTypeCode  = 'Required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    const body = {
      persona_type:    personaType,
      country:         country || null,
      doc_label:       docLabel,
      doc_type_code:   docTypeCode,
      hint:            hint,
      is_required:     isRequired,
      max_file_size_mb:parseInt(maxFileSizeMb, 10),
      accepted_formats:acceptedFormats,
      sort_order:      parseInt(sortOrder, 10),
      is_active:       isActive,
    };

    try {
      const url    = isEdit ? `/api/admin/document-requirements/${doc.id}/` : '/api/admin/document-requirements/';
      const method = isEdit ? 'PATCH' : 'POST';
      const res    = await fetch(`http://localhost:8001${url}`, {
        method,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ api: data.detail || Object.values(data)[0]?.[0] || 'Could not save.' });
        setSaving(false);
        return;
      }
      onSaved(data, isEdit);
    } catch {
      setErrors({ api: 'Connection error.' });
      setSaving(false);
    }
  };

  const PERSONA_OPTIONS  = [{ value: '', label: 'Select persona…' }, ...PERSONAS.map(p => ({ value: p.key, label: p.label }))];
  const COUNTRY_OPTIONS  = COUNTRIES;
  const DOC_TYPE_OPTIONS = [{ value: '', label: 'Select or type code…' }, ...DOC_TYPES.map(d => ({ value: d, label: d }))];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ width: '500px', background: C.white, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', maxHeight: '100vh' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: F.headline, fontSize: '16px', fontWeight: 700, color: C.textPrimary }}>
              {isEdit ? 'Edit Document Requirement' : 'Add Document Requirement'}
            </h3>
            <p style={{ margin: '3px 0 0', fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>
              {isEdit ? 'Update this document requirement' : 'Define a new document requirement for onboarding'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: C.textTertiary, lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {errors.api && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: '#DC2626', flexShrink: 0 }} />
              <span style={{ fontFamily: F.body, fontSize: '12px', color: '#DC2626' }}>{errors.api}</span>
            </div>
          )}

          <div style={dividerS} />
          <p style={sectionLabel}>Scope</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <span style={FL}>Persona Type *</span>
              <Dropdown options={PERSONA_OPTIONS} value={personaType} placeholder="Select persona…" error={!!errors.personaType}
                onChange={v => { setPersonaType(v); setErrors(p => ({ ...p, personaType: '' })); }} />
              {errors.personaType && <p style={hintS(true)}>{errors.personaType}</p>}
            </div>
            <div>
              <span style={FL}>Country</span>
              <Dropdown options={COUNTRY_OPTIONS} value={country} placeholder="All countries"
                onChange={v => setCountry(v)} />
              <p style={hintS()}>Leave blank to apply to all countries</p>
            </div>
          </div>

          <div style={dividerS} />
          <p style={sectionLabel}>Document Details</p>

          <div style={{ marginBottom: '14px' }}>
            <span style={FL}>Document Label *</span>
            <input style={inputS(!!errors.docLabel)} placeholder="e.g. GST Certificate" value={docLabel}
              onChange={e => { handleLabelChange(e.target.value); setErrors(p => ({ ...p, docLabel: '' })); }} />
            {errors.docLabel && <p style={hintS(true)}>{errors.docLabel}</p>}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={FL}>Doc Type Code *</span>
            <input style={inputS(!!errors.docTypeCode)} placeholder="e.g. GST_CERT" value={docTypeCode}
              onChange={e => { setDocTypeCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')); setErrors(p => ({ ...p, docTypeCode: '' })); }} />
            {errors.docTypeCode
              ? <p style={hintS(true)}>{errors.docTypeCode}</p>
              : <p style={hintS()}>Auto-generated from label. Used as identifier in API.</p>}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={FL}>Hint / Description</span>
            <input style={inputS()} placeholder="e.g. GST Registration Certificate — max 10MB" value={hint}
              onChange={e => setHint(e.target.value)} />
            <p style={hintS()}>Shown to the user below the upload zone</p>
          </div>

          <div style={dividerS} />
          <p style={sectionLabel}>Requirements</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <span style={FL}>Required / Optional</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {[true, false].map(opt => (
                  <button key={String(opt)} type="button" onClick={() => setIsRequired(opt)}
                    style={{ flex: 1, height: '40px', borderRadius: '8px', cursor: 'pointer', fontFamily: F.body, fontSize: '12px', fontWeight: 600, transition: 'all 0.15s', border: isRequired === opt ? '2px solid ' + C.primary : '1.5px solid ' + C.borderMedium, background: isRequired === opt ? C.primary : C.white, color: isRequired === opt ? C.white : C.textSecondary }}>
                    {opt ? 'Required' : 'Optional'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span style={FL}>Max File Size (MB)</span>
              <input type="number" min="1" max="50" style={inputS()} value={maxFileSizeMb}
                onChange={e => setMaxFileSizeMb(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={FL}>Accepted Formats</span>
            <input style={inputS()} placeholder="PDF, JPG, PNG" value={acceptedFormats}
              onChange={e => setAcceptedFormats(e.target.value)} />
            <p style={hintS()}>Comma-separated list of accepted file types</p>
          </div>

          <div style={dividerS} />
          <p style={sectionLabel}>Display & Status</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <span style={FL}>Sort Order</span>
              <input type="number" min="1" style={inputS()} value={sortOrder}
                onChange={e => setSortOrder(e.target.value)} />
              <p style={hintS()}>Order within country + persona group</p>
            </div>
            <div>
              <span style={FL}>Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <Toggle value={isActive} onChange={setIsActive} />
                <span style={{ fontFamily: F.body, fontSize: '13px', color: isActive ? C.green : C.danger, fontWeight: 600 }}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={hintS()}>Inactive docs are hidden during onboarding</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid ' + C.border, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ height: '40px', padding: '0 20px', border: '1.5px solid ' + C.borderMedium, borderRadius: '8px', background: C.white, fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textPrimary, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ height: '40px', padding: '0 24px', border: 'none', borderRadius: '8px', background: saving ? C.borderMedium : C.primary, fontFamily: F.body, fontSize: '13px', fontWeight: 700, color: C.white, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
            {saving ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite' }} />Saving…</> : isEdit ? 'Save Changes' : 'Add Requirement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ doc, onCancel, onConfirm, deleting }) {
  if (!doc) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: C.white, borderRadius: '12px', padding: '28px 32px', width: '380px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <i className="ti ti-trash" style={{ fontSize: '20px', color: C.danger }} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontFamily: F.headline, fontSize: '16px', fontWeight: 700, color: C.textPrimary }}>Delete requirement?</h3>
        <p style={{ margin: '0 0 24px', fontFamily: F.body, fontSize: '13px', color: C.textSecondary, lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 600 }}>{doc.doc_label}</strong> will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ height: '38px', padding: '0 18px', border: '1.5px solid ' + C.borderMedium, borderRadius: '8px', background: C.white, fontFamily: F.body, fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textPrimary }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ height: '38px', padding: '0 18px', border: 'none', borderRadius: '8px', background: deleting ? '#FCA5A5' : C.danger, fontFamily: F.body, fontSize: '13px', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', color: C.white }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UNAdminOnboardDocs() {
  const [docs,          setDocs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activePersona, setActivePersona] = useState('ORG_PMS');
  const [filterCountry, setFilterCountry] = useState('');
  const [viewDoc,       setViewDoc]       = useState(null);
  const [modalMode,     setModalMode]     = useState(null); // 'add' | 'edit'
  const [editDoc,       setEditDoc]       = useState(null);
  const [deleteDoc,     setDeleteDoc]     = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [token,         setToken]         = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
    fetchDocs(t);
  }, []);

  const fetchDocs = async (t) => {
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:8001/api/admin/document-requirements/', {
        headers: { Authorization: 'Bearer ' + (t || token) },
      });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    }
    setLoading(false);
  };

  // Filter docs for current tab + country filter
  const filteredDocs = docs.filter(d =>
    d.persona_type === activePersona &&
    (filterCountry === '' || !d.country || d.country === filterCountry)
  );

  const handleToggleActive = async (doc) => {
    try {
      const res = await fetch(`http://localhost:8001/api/admin/document-requirements/${doc.id}/`, {
        method:  'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: !doc.is_active }),
      });
      if (res.ok) {
        setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_active: !d.is_active } : d));
      }
    } catch {}
  };

  const handleSaved = (saved, isEdit) => {
    if (isEdit) {
      setDocs(prev => prev.map(d => d.id === saved.id ? saved : d));
    } else {
      setDocs(prev => [...prev, saved]);
    }
    setModalMode(null);
    setEditDoc(null);
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:8001/api/admin/document-requirements/${deleteDoc.id}/`, {
        method:  'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== deleteDoc.id));
        setDeleteDoc(null);
      }
    } catch {}
    setDeleting(false);
  };

  const openEdit = (doc) => {
    setViewDoc(null);
    setEditDoc(doc);
    setModalMode('edit');
  };

  // Count per persona for tab badges
  const countPerPersona = {};
  PERSONAS.forEach(p => {
    countPerPersona[p.key] = docs.filter(d => d.persona_type === p.key && d.is_active).length;
  });

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadein { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        .doc-row:hover td { background: #F8FAFC; }
        .action-btn { width:30px; height:30px; border-radius:6px; border:1px solid #E2E8F0; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748B; transition:all 0.12s; }
        .action-btn:hover { background:#F1F5F9; color:#0F172A; }
        .action-btn.danger:hover { background:#FEF2F2; color:#E53E3E; border-color:#FECACA; }
      `}</style>

      <div style={{ padding: 'clamp(16px,2vw,28px)', fontFamily: F.body, animation: 'fadein 0.25s ease both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontFamily: F.body, fontSize: '12px', color: C.textTertiary }}>
              {docs.filter(d => d.is_active).length} active requirements across {PERSONAS.length} persona types
            </p>
          </div>
          <button onClick={() => { setEditDoc(null); setModalMode('add'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', height: '40px', padding: '0 18px', background: C.primary, color: C.white, border: 'none', borderRadius: '8px', fontFamily: F.body, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.primaryHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.primary; }}>
            <i className="ti ti-plus" style={{ fontSize: '14px' }} />
            Add Requirement
          </button>
        </div>

        {/* Persona tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid ' + C.border, marginBottom: '20px', gap: '2px' }}>
          {PERSONAS.map(p => (
            <button key={p.key} onClick={() => setActivePersona(p.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: '13px', fontWeight: activePersona === p.key ? 600 : 400, color: activePersona === p.key ? C.primary : C.textSecondary, borderBottom: activePersona === p.key ? '2px solid ' + C.primary : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s' }}>
              {p.label}
              {countPerPersona[p.key] > 0 && (
                <span style={{ background: activePersona === p.key ? C.primary : C.neutral, color: activePersona === p.key ? C.white : C.textTertiary, borderRadius: '20px', padding: '1px 7px', fontSize: '10px', fontWeight: 600 }}>
                  {countPerPersona[p.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontFamily: F.body, fontSize: '12px', color: C.textSecondary }}>Country:</span>
          <div style={{ width: '180px' }}>
            <Dropdown options={COUNTRIES} value={filterCountry} onChange={v => setFilterCountry(v)} placeholder="All countries" />
          </div>
          <span style={{ marginLeft: 'auto', fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>
            {filteredDocs.length} requirement{filteredDocs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + C.border, borderTopColor: C.primary, animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontFamily: F.body, fontSize: '13px', color: C.textSecondary }}>Loading requirements…</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <i className="ti ti-file-off" style={{ fontSize: '32px', color: C.textTertiary }} />
              <p style={{ fontFamily: F.headline, fontSize: '15px', fontWeight: 700, color: C.textPrimary, marginTop: '12px', marginBottom: '6px' }}>
                No requirements yet
              </p>
              <p style={{ fontFamily: F.body, fontSize: '12px', color: C.textSecondary, marginBottom: '20px' }}>
                Add document requirements for {PERSONAS.find(p => p.key === activePersona)?.label} onboarding.
              </p>
              <button onClick={() => { setEditDoc(null); setModalMode('add'); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', background: C.primary, color: C.white, border: 'none', borderRadius: '7px', fontFamily: F.body, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <i className="ti ti-plus" style={{ fontSize: '13px' }} /> Add first requirement
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.neutral }}>
                  {['Document', 'Country', 'Type Code', 'Hint', 'Required', 'Status', 'Sort', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: F.body, fontSize: '10px', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid ' + C.border, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDocs.sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99)).map(doc => (
                  <tr key={doc.id} className="doc-row" style={{ borderBottom: '1px solid ' + C.border }}>
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textPrimary }}>{doc.doc_label}</p>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: F.body, fontSize: '12px', color: C.textSecondary }}>
                        {doc.country ? COUNTRY_LABELS[doc.country] || doc.country : <span style={{ color: C.textTertiary, fontStyle: 'italic' }}>All countries</span>}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <code style={{ fontFamily: 'monospace', fontSize: '11px', background: C.neutral, padding: '2px 7px', borderRadius: '4px', color: C.textSecondary, border: '1px solid ' + C.border }}>
                        {doc.doc_type_code}
                      </code>
                    </td>
                    <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                      <p style={{ margin: 0, fontFamily: F.body, fontSize: '12px', color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.hint || '—'}
                      </p>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge type={doc.is_required ? 'required' : 'optional'} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Toggle value={doc.is_active} onChange={() => handleToggleActive(doc)} />
                    </td>
                    <td style={{ padding: '12px 14px', color: C.textTertiary, fontSize: '12px', textAlign: 'center' }}>
                      {doc.sort_order ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="action-btn" title="View" onClick={() => setViewDoc(doc)}>
                          <i className="ti ti-eye" style={{ fontSize: '14px' }} />
                        </button>
                        <button className="action-btn" title="Edit" onClick={() => openEdit(doc)}>
                          <i className="ti ti-edit" style={{ fontSize: '14px' }} />
                        </button>
                        <button className="action-btn danger" title="Delete" onClick={() => setDeleteDoc(doc)}>
                          <i className="ti ti-trash" style={{ fontSize: '14px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {viewDoc && <ViewPopup doc={viewDoc} onClose={() => setViewDoc(null)} onEdit={openEdit} />}
      {modalMode && (
        <DocModal mode={modalMode} doc={editDoc} onClose={() => { setModalMode(null); setEditDoc(null); }} onSaved={handleSaved} token={token} />
      )}
      {deleteDoc && <DeleteConfirm doc={deleteDoc} onCancel={() => setDeleteDoc(null)} onConfirm={handleDelete} deleting={deleting} />}
    </>
  );
}
