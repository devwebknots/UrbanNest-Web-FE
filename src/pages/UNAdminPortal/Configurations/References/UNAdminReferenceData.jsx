import React, { useState, useEffect, useRef } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#002D5B',
  pageBg:        '#F8FAFC',
  white:         '#FFFFFF',
  neutral:       '#F1F5F9',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  danger:        '#E53E3E',
  dangerBg:      '#FEF2F2',
  green:         '#166534',
  greenBg:       '#F0FDF4',
  greenBorder:   '#BBF7D0',
  amberBg:       '#FEF3C7',
  amberText:     '#92400E',
  amberBorder:   '#FCD34D',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const API   = 'http://localhost:8001/api/admin';
const authH = () => ({
  Authorization:  `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toRefCode(str) {
  return str.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      background: C.primary, color: C.white,
      padding: '10px 20px', borderRadius: 8,
      fontSize: 13, fontFamily: F.body, fontWeight: 700,
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    }}>
      {message}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalBase, maxWidth: 400 }}>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.textPrimary, margin: '0 0 24px', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnCancel}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, background: C.danger }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const modalBase = {
  background: C.white, borderRadius: 12,
  padding: 28, width: '90%', maxWidth: 520,
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
};
const btnPrimary = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: 'none', background: C.primary,
  fontFamily: F.body, fontSize: 13, fontWeight: 700,
  color: C.white, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
};
const btnCancel = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: `1.5px solid ${C.borderMedium}`, background: C.white,
  fontFamily: F.body, fontSize: 13, fontWeight: 700,
  color: C.textPrimary, cursor: 'pointer',
};
const fieldLabel = {
  fontFamily: F.body, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: C.textSecondary, display: 'block', marginBottom: 5,
};
const inputStyle = {
  width: '100%', height: 38, borderRadius: 8,
  background: C.neutral, border: 'none',
  boxSizing: 'border-box', padding: '0 12px',
  fontFamily: F.body, fontSize: 13, color: C.textPrimary,
  outline: 'none',
};
const inputFocusStyle = {
  ...inputStyle,
  border: `1.5px solid ${C.primary}`,
  background: C.neutral,
};
const inputLockedStyle = {
  ...inputStyle,
  background: '#F8FAFC',
  border: `1px dashed ${C.borderMedium}`,
  color: C.textSecondary,
  cursor: 'not-allowed',
};
const hintStyle = {
  fontFamily: F.body, fontSize: 11,
  color: C.textTertiary, marginTop: 4, lineHeight: 1.5,
};

// ─── Autocomplete input ───────────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, suggestions, placeholder, hint, onBlur }) {
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );
  const showCreate = value.trim() && !suggestions.includes(value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        style={focused ? inputFocusStyle : inputStyle}
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => { setFocused(false); if (onBlur) onBlur(); }}
      />
      {open && (filtered.length > 0 || showCreate) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: C.white, border: `1px solid ${C.border}`,
          borderRadius: 8, marginTop: 4, zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {filtered.map(s => (
            <div
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              style={{
                padding: '8px 12px', fontSize: 12, fontFamily: F.body,
                color: C.textSecondary, cursor: 'pointer',
                borderBottom: `1px solid ${C.neutral}`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.neutral}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
              {s}
            </div>
          ))}
          {showCreate && (
            <div
              onMouseDown={() => {
                onChange(toRefCode(value));
                setOpen(false);
              }}
              style={{
                padding: '8px 12px', fontSize: 12, fontFamily: F.body,
                color: C.primary, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.neutral}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
              <i className="ti ti-plus" style={{ fontSize: 12 }} />
              Create "{toRefCode(value)}" as new
            </div>
          )}
        </div>
      )}
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, activeLabel = 'Active', inactiveLabel = 'Inactive', hint }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8,
      background: value ? '#EEF4FF' : C.neutral,
      border: value ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
    }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: value ? C.primary : C.borderMedium,
          display: 'flex', alignItems: 'center',
          padding: '0 3px', cursor: 'pointer',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: C.white,
          marginLeft: value ? 'auto' : 0,
          transition: 'margin 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: value ? C.textPrimary : C.textSecondary }}>
        {value ? activeLabel : inactiveLabel}
      </span>
      {hint && <span style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginLeft: 'auto' }}>{hint}</span>}
    </div>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ allModules, allRefTypes, onClose, onSaved }) {
  const [module,    setModule]    = useState('');
  const [refType,   setRefType]   = useState('');
  const [refCode,   setRefCode]   = useState('');
  const [refValue,  setRefValue]  = useState('');
  const [desc,      setDesc]      = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive,  setIsActive]  = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  // Filter ref types by selected module
  const filteredRefTypes = allRefTypes.filter(rt =>
    rt.module === toRefCode(module)
  ).map(rt => rt.ref_type);

  async function handleSubmit() {
    if (!module.trim())   { setError('Module is required.'); return; }
    if (!refType.trim())  { setError('Ref Type is required.'); return; }
    if (!refCode.trim())  { setError('Ref Code is required.'); return; }
    if (!refValue.trim()) { setError('Ref Value is required.'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${API}/references/`, {
        method: 'POST',
        headers: authH(),
        body: JSON.stringify({
          module:      toRefCode(module),
          ref_type:    toRefCode(refType),
          ref_code:    refCode,
          ref_value:   refValue.trim(),
          description: desc.trim(),
          sort_order:  Number(sortOrder),
          is_active:   isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || 'Save failed');
      }
      const data = await res.json();
      onSaved(data);
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        {/* Title */}
        <h3 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.primary, margin: '0 0 22px' }}>
          Add Reference
        </h3>

        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: C.danger, fontFamily: F.body }}>
            {error}
          </div>
        )}

        {/* Module */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Module <span style={{ color: C.danger }}>*</span></label>
          <AutocompleteInput
            value={module}
            onChange={v => setModule(v)}
            suggestions={allModules}
            placeholder="e.g. DOCUMENT_SECTIONS, PROPERTY_TYPES"
            hint="Type freely — auto-formatted to UPPERCASE_UNDERSCORES."
          />
        </div>

        {/* Ref Type */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Ref Type <span style={{ color: C.danger }}>*</span></label>
          <AutocompleteInput
            value={refType}
            onChange={v => setRefType(v)}
            suggestions={filteredRefTypes}
            placeholder="e.g. SECTION, STATUS, CATEGORY"
            hint="Sub-group within the module. Suggestions shown based on selected module."
          />
        </div>

        {/* Ref Code */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>
            Ref Code <span style={{ color: C.danger }}>*</span>
            <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', background: '#EEF2FF', color: '#3730A3', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
              AUTO-FORMATTED
            </span>
          </label>
          <input
            style={inputStyle}
            placeholder='e.g. type "ownership" → OWNERSHIP'
            value={refCode}
            onChange={e => setRefCode(toRefCode(e.target.value))}
          />
          <div style={hintStyle}>Locked after save. Used internally — never shown to end users.</div>
        </div>

        {/* Ref Value */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Ref Value <span style={{ color: C.danger }}>*</span></label>
          <input
            style={inputStyle}
            placeholder="e.g. Ownership Verification, KYC / Identity"
            value={refValue}
            onChange={e => setRefValue(e.target.value)}
          />
          <div style={hintStyle}>Display label shown in dropdowns and sub-tabs across the platform.</div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Description</label>
          <textarea
            style={{ ...inputStyle, height: 64, padding: '10px 12px', resize: 'vertical', lineHeight: 1.5 }}
            placeholder="What is this reference value used for?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />

        {/* Sort Order */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Sort Order</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              style={{ ...inputStyle, width: 64 }}
              type="number"
              min={1}
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            />
            <span style={hintStyle}>Order within the module + ref type group</span>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <label style={fieldLabel}>Status</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              onClick={() => setIsActive(!isActive)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: isActive ? C.green : C.borderMedium,
                display: 'flex', alignItems: 'center',
                padding: '0 3px', cursor: 'pointer',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: C.white,
                marginLeft: isActive ? 'auto' : 0,
                transition: 'margin 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: isActive ? C.green : C.textSecondary }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, margin: 0, paddingLeft: 54 }}>
            {isActive ? 'Visible across the platform' : 'Hidden from the platform'}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel} disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={saving}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            {saving ? 'Saving…' : 'Add Reference'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onSaved }) {
  const [isActive, setIsActive] = useState(item.is_active);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/references/${item.id}/`, {
        method: 'PATCH',
        headers: authH(),
        body: JSON.stringify({ is_active: isActive }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      onSaved(data);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const LockedField = ({ label, value }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabel}>
        {label}
        <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', background: C.neutral, color: C.textTertiary, borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
          LOCKED
        </span>
      </label>
      <div style={{ ...inputLockedStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{value}</span>
        <i className="ti ti-lock" style={{ fontSize: 13, color: C.borderMedium }} />
      </div>
    </div>
  );

  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        <h3 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.primary, margin: '0 0 16px' }}>
          Edit Reference
        </h3>

        {/* Warning */}
        <div style={{ background: C.amberBg, borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <i className="ti ti-lock" style={{ fontSize: 14, color: C.amberText, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: F.body, fontSize: 11, color: C.amberText, lineHeight: 1.5 }}>
            All fields are locked after creation. Only Active / Inactive can be changed.
          </span>
        </div>

        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: C.danger, fontFamily: F.body }}>
            {error}
          </div>
        )}

        <LockedField label="Module"    value={item.module} />
        <LockedField label="Ref Type"  value={item.ref_type} />
        <LockedField label="Ref Code"  value={item.ref_code} />
        <LockedField label="Ref Value" value={item.ref_value} />

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>
            Description
            <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', background: C.neutral, color: C.textTertiary, borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
              LOCKED
            </span>
          </label>
          <div style={{ ...inputLockedStyle, height: 'auto', minHeight: 52, padding: '10px 12px', lineHeight: 1.5 }}>
            {item.description || <span style={{ color: C.textTertiary }}>No description</span>}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>
            Sort Order
            <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', background: C.neutral, color: C.textTertiary, borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
              LOCKED
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...inputLockedStyle, width: 64, display: 'flex', alignItems: 'center' }}>
              {item.sort_order}
            </div>
          </div>
        </div>

        {/* Status — only editable field */}
        <div style={{ marginBottom: 20 }}>
          <label style={fieldLabel}>
            Status
            <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', background: C.greenBg, color: C.green, border: `0.5px solid ${C.greenBorder}`, borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
              ONLY EDITABLE FIELD
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              onClick={() => setIsActive(!isActive)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: isActive ? C.green : C.borderMedium,
                display: 'flex', alignItems: 'center',
                padding: '0 3px', cursor: 'pointer',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: C.white,
                marginLeft: isActive ? 'auto' : 0,
                transition: 'margin 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: isActive ? C.green : C.textSecondary }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, margin: 0, paddingLeft: 54 }}>
            {isActive ? 'Visible across the platform' : 'Hidden from the platform'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel} disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UNAdminReferenceData() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [refTypeFilter,setRefTypeFilter]= useState('');
  const [activeTab,    setActiveTab]    = useState('ALL');
  const [showAdd,      setShowAdd]      = useState(false);
  const [addModule,    setAddModule]    = useState('');
  const [editItem,     setEditItem]     = useState(null);
  const [viewItem,     setViewItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/references/`, { headers: authH() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Derived data
  const allModules  = [...new Set(items.map(i => i.module))].sort();
  const allRefTypes = items.map(i => ({ module: i.module, ref_type: i.ref_type }))
    .filter((v, i, a) => a.findIndex(x => x.module === v.module && x.ref_type === v.ref_type) === i);

  // Tabs: ALL + one per module
  const tabs = ['ALL', ...allModules];

  // Filtered items
  const filtered = items.filter(item => {
    const matchTab    = activeTab === 'ALL' || item.module === activeTab;
    const matchSearch = !search || [item.module, item.ref_type, item.ref_code, item.ref_value]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchModule   = !moduleFilter   || item.module   === moduleFilter;
    const matchRefType  = !refTypeFilter  || item.ref_type === refTypeFilter;
    return matchTab && matchSearch && matchModule && matchRefType;
  });

  // Group by module
  const groups = filtered.reduce((acc, item) => {
    if (!acc[item.module]) acc[item.module] = [];
    acc[item.module].push(item);
    return acc;
  }, {});

  function handleSaved(data) {
    setItems(prev => {
      const exists = prev.find(x => x.id === data.id);
      return exists ? prev.map(x => x.id === data.id ? data : x) : [data, ...prev];
    });
    showToast(editItem ? 'Reference updated.' : 'Reference added.');
    setShowAdd(false);
    setEditItem(null);
    setAddModule('');
  }

  async function handleDelete(id) {
    try {
      await fetch(`${API}/references/${id}/`, { method: 'DELETE', headers: authH() });
      setItems(prev => prev.filter(x => x.id !== id));
      showToast('Reference deleted.');
    } catch {
      showToast('Delete failed. Please try again.');
    } finally {
      setDeleteTarget(null);
    }
  }

  function openAddForModule(moduleName) {
    setAddModule(moduleName);
    setShowAdd(true);
  }

  // Unique ref types for filter dropdown
  const refTypeOptions = [...new Set(
    (moduleFilter ? items.filter(i => i.module === moduleFilter) : items).map(i => i.ref_type)
  )].sort();

  return (
    <div style={{ padding: '28px 32px', fontFamily: F.body }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            Configurations
            <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
            <span style={{ color: C.textSecondary }}>Reference Data</span>
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily: F.headline, fontSize: 26, fontWeight: 700, color: C.primary, margin: '0 0 3px' }}>
            Reference Data
          </h1>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 22px' }}>
            Manage system-wide reference values used across all modules
          </p>

          {/* Module tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 22, overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setModuleFilter(''); setRefTypeFilter(''); }}
                style={{
                  fontFamily: F.body, fontSize: 13, fontWeight: 600,
                  padding: '10px 20px', border: 'none', background: 'none',
                  color: activeTab === tab ? C.primary : C.textTertiary,
                  borderBottom: `2px solid ${activeTab === tab ? C.primary : 'transparent'}`,
                  marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {tab === 'ALL' ? 'All' : tab.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
            <div style={{ height: 38, background: C.neutral, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flex: 1, maxWidth: 320 }}>
              <i className="ti ti-search" style={{ fontSize: 14, color: C.textTertiary }} />
              <input
                style={{ border: 'none', background: 'none', outline: 'none', fontFamily: F.body, fontSize: 13, color: C.textPrimary, width: '100%' }}
                placeholder="Search reference data..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Module filter */}
            <select
              style={{ height: 38, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${C.borderMedium}`, background: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary, cursor: 'pointer' }}
              value={moduleFilter}
              onChange={e => { setModuleFilter(e.target.value); setRefTypeFilter(''); }}
            >
              <option value="">All Modules</option>
              {allModules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            {/* Ref Type filter */}
            <select
              style={{ height: 38, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${C.borderMedium}`, background: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary, cursor: 'pointer' }}
              value={refTypeFilter}
              onChange={e => setRefTypeFilter(e.target.value)}
            >
              <option value="">All Ref Types</option>
              {refTypeOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button
              onClick={() => { setAddModule(''); setShowAdd(true); }}
              style={{ ...btnPrimary, marginLeft: 'auto' }}
            >
              <i className="ti ti-plus" style={{ fontSize: 14 }} />
              Add Reference
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>Loading...</div>
          ) : Object.keys(groups).length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>
              {search ? `No results matching "${search}"` : 'No reference data yet. Click + Add Reference to get started.'}
            </div>
          ) : (
            Object.entries(groups).map(([moduleName, rows]) => (
              <div key={moduleName} style={{ marginBottom: 24 }}>

                {/* Group label */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {moduleName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    <span style={{ fontSize: 10, fontWeight: 700, background: C.border, color: C.textSecondary, borderRadius: 20, padding: '1px 7px' }}>
                      {rows.length}
                    </span>
                  </div>
                </div>

                {/* Table card */}
                <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>

                  {/* Table head */}
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 140px 180px 1fr 50px 90px 110px', gap: 12, padding: '10px 16px', background: C.pageBg, borderBottom: `1px solid ${C.border}` }}>
                    {['Ref Type', 'Ref Code', 'Ref Value', 'Description', 'Sort', 'Status', 'Actions'].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Rows */}
                  {rows.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{ display: 'grid', gridTemplateColumns: '160px 140px 180px 1fr 50px 90px 110px', gap: 12, padding: '11px 16px', borderBottom: `1px solid ${C.neutral}`, alignItems: 'center', background: idx % 2 === 1 ? '#FAFBFC' : C.white }}
                    >
                      {/* Ref Type */}
                      <span style={{ fontSize: 12, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.ref_type}</span>

                      {/* Ref Code */}
                      <span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, background: C.neutral, border: `0.5px solid ${C.border}`, borderRadius: 4, padding: '2px 7px', color: C.textSecondary }}>
                          {item.ref_code}
                        </span>
                      </span>

                      {/* Ref Value */}
                      <span style={{ fontSize: 13, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.ref_value}</span>

                      {/* Description */}
                      <span style={{ fontSize: 12, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || <span style={{ color: C.borderMedium }}>—</span>}
                      </span>

                      {/* Sort */}
                      <span style={{ fontSize: 12, color: C.textTertiary, textAlign: 'center' }}>{item.sort_order}</span>

                      {/* Status badge */}
                      <span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                          padding: '3px 8px', borderRadius: 4,
                          background: item.is_active ? C.greenBg : C.amberBg,
                          color:      item.is_active ? C.green   : C.amberText,
                          border:     `0.5px solid ${item.is_active ? C.greenBorder : C.amberBorder}`,
                        }}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </span>

                      {/* Actions — view, edit, delete in rounded square buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => setViewItem(item)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary }}
                          title="View"
                        >
                          <i className="ti ti-eye" style={{ fontSize: 14 }} />
                        </button>
                        <button
                          onClick={() => setEditItem(item)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary }}
                          title="Edit"
                        >
                          <i className="ti ti-pencil" style={{ fontSize: 14 }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid #FECACA`, background: C.dangerBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.danger }}
                          title="Delete"
                        >
                          <i className="ti ti-trash" style={{ fontSize: 14 }} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* + Add to [Module] — right-aligned, bottom of card */}
                  <div
                    onClick={() => openAddForModule(moduleName)}
                    style={{ padding: '10px 16px', borderTop: `1px solid ${C.neutral}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, cursor: 'pointer', fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.primary }}
                    onMouseEnter={e => e.currentTarget.style.background = C.neutral}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="ti ti-plus" style={{ fontSize: 13 }} />
                    Add to {moduleName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                </div>
              </div>
            ))
          )}

      {/* View Modal */}
      {viewItem && (
        <div style={overlayStyle}>
          <div style={modalBase}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.primary, margin: 0 }}>
                View Reference
              </h3>
              <button onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 20 }}>
                <i className="ti ti-x" />
              </button>
            </div>

            {[
              { label: 'Module',      value: viewItem.module },
              { label: 'Ref Type',    value: viewItem.ref_type },
              { label: 'Ref Code',    value: viewItem.ref_code, mono: true },
              { label: 'Ref Value',   value: viewItem.ref_value },
              { label: 'Description', value: viewItem.description || '—' },
              { label: 'Sort Order',  value: viewItem.sort_order },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>{label}</label>
                <div style={{ ...inputLockedStyle, height: 'auto', minHeight: 38, padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
                  {mono
                    ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{value}</span>
                    : <span style={{ fontSize: 13 }}>{value}</span>
                  }
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <label style={fieldLabel}>Status</label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 4,
                  background: viewItem.is_active ? C.greenBg : C.amberBg,
                  color:      viewItem.is_active ? C.green   : C.amberText,
                  border:     `0.5px solid ${viewItem.is_active ? C.greenBorder : C.amberBorder}`,
                }}>
                  {viewItem.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setViewItem(null)} style={btnCancel}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <AddModal
          allModules={allModules}
          allRefTypes={allRefTypes}
          prefilledModule={addModule}
          onClose={() => { setShowAdd(false); setAddModule(''); }}
          onSaved={handleSaved}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.ref_code}"? This cannot be undone and may break system references.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

