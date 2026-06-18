import React, { useState, useEffect } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:      '#002D5B',
  white:        '#FFFFFF',
  pageBg:       '#F8FAFC',
  neutral:      '#F1F5F9',
  border:       'rgba(0,0,0,0.06)',
  borderLight:  'rgba(0,0,0,0.05)',
  borderMedium: 'rgba(0,0,0,0.10)',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  danger:       '#E53E3E',
  dangerBg:     '#FEF2F2',
  dangerBorder: '#FECACA',
  green:        '#16A34A',
  greenBg:      '#F0FDF4',
  greenBorder:  '#BBF7D0',
  amber:        '#92400E',
  amberBg:      '#FEF3C7',
  amberBorder:  '#FCD34D',
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

// ─── Shared styles ────────────────────────────────────────────────────────────
const fieldLabel = {
  fontFamily:    F.body,
  fontSize:      10,
  fontWeight:    700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color:         C.textSecondary,
  display:       'block',
  marginBottom:  5,
};

const inputStyle = {
  width:        '100%',
  height:       36,
  borderRadius: 8,
  background:   '#F8FAFC',
  border:       `1px solid ${C.border}`,
  boxSizing:    'border-box',
  padding:      '0 12px',
  fontFamily:   F.body,
  fontSize:     13,
  color:        C.textPrimary,
  outline:      'none',
};

const overlayStyle = {
  position:       'fixed',
  inset:          0,
  background:     'rgba(0,0,0,0.4)',
  zIndex:         1000,
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
};

const modalBase = {
  background:   C.white,
  borderRadius: 12,
  padding:      28,
  width:        '90%',
  maxWidth:     500,
  boxShadow:    '0 8px 40px rgba(0,0,0,0.14)',
  border:       `1px solid ${C.borderLight}`,
  maxHeight:    '90vh',
  overflowY:    'auto',
};

const btnPrimary = {
  height:       36,
  padding:      '0 18px',
  borderRadius: 8,
  border:       'none',
  background:   C.primary,
  fontFamily:   F.body,
  fontSize:     13,
  fontWeight:   700,
  color:        C.white,
  cursor:       'pointer',
  display:      'flex',
  alignItems:   'center',
  gap:          6,
};

const btnCancel = {
  height:       36,
  padding:      '0 18px',
  borderRadius: 8,
  border:       `1px solid ${C.borderMedium}`,
  background:   C.white,
  fontFamily:   F.body,
  fontSize:     13,
  fontWeight:   700,
  color:        C.textPrimary,
  cursor:       'pointer',
};

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ value, onChange, activeLabel = 'Active', inactiveLabel = 'Inactive', hint }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <div
          onClick={() => onChange(!value)}
          style={{
            width: 40, height: 22, borderRadius: 11,
            background: value ? C.green : C.textTertiary,
            display: 'flex', alignItems: 'center',
            padding: '0 3px', cursor: 'pointer',
            transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: C.white,
            marginLeft: value ? 'auto' : 0,
            transition: 'margin 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }} />
        </div>
        <span style={{
          fontFamily: F.body, fontSize: 13, fontWeight: 700,
          color: value ? C.green : C.textTertiary,
        }}>
          {value ? activeLabel : inactiveLabel}
        </span>
      </div>
      {hint && (
        <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, margin: 0, paddingLeft: 50 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, subMessage, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalBase, maxWidth: 420 }}>
        <h3 style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: danger ? C.danger : C.primary, margin: '0 0 10px' }}>
          {danger ? 'Confirm Delete' : 'Confirm'}
        </h3>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary, margin: '0 0 8px', lineHeight: 1.6 }}>
          {message}
        </p>
        {subMessage && (
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
            {subMessage}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onCancel} style={btnCancel}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, background: danger ? C.danger : C.primary }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section badge colors ─────────────────────────────────────────────────────
const sectionColors = {
  OWNERSHIP: { bg: C.amberBg,   color: C.amber,      border: C.amberBorder  },
  KYC:       { bg: C.indigoBg,  color: C.indigoText,  border: C.indigoBorder },
  ONBOARDING:{ bg: C.greenBg,   color: C.green,       border: C.greenBorder  },
};

function SectionBadge({ code, label }) {
  const cc = sectionColors[code] || { bg: C.neutral, color: C.textSecondary, border: C.border };
  return (
    <span style={{
      display:       'inline-block',
      fontSize:      10,
      fontWeight:    700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      padding:       '2px 7px',
      borderRadius:  4,
      background:    cc.bg,
      color:         cc.color,
      border:        `0.5px solid ${cc.border}`,
      marginRight:   4,
    }}>
      {label || code}
    </span>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function DocTypeModal({ existing, sections, onClose, onSaved }) {
  const isEdit = Boolean(existing);

  const [name,          setName]          = useState(existing?.name          || '');
  const [country,       setCountry]       = useState(existing?.country       || '');
  const [isRequired,    setIsRequired]    = useState(existing?.is_required   ?? true);
  const [isActive,      setIsActive]      = useState(existing?.is_active     ?? true);
  const [selectedSecs,  setSelectedSecs]  = useState(
    existing?.sections?.map(s => s.section_code).filter(Boolean) || []
  );
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  function toggleSection(code) {
    setSelectedSecs(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Document name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      const url    = isEdit ? `${API}/document-types/${existing.id}/` : `${API}/document-types/`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: authH(),
        body: JSON.stringify({
          name:        name.trim(),
          country:     country.trim(),
          is_required:   isRequired,
          is_active:     isActive,
          section_codes: selectedSecs,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(errData) || 'Save failed');
      }
      const data = await res.json();
      onSaved(data, isEdit);
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        <h3 style={{ fontFamily: F.headline, fontSize: 20, fontWeight: 700, color: C.primary, margin: '0 0 22px' }}>
          {isEdit ? 'Edit Document Type' : 'Add Document Type'}
        </h3>

        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: C.danger, fontFamily: F.body }}>
            {error}
          </div>
        )}

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Document Name <span style={{ color: C.danger }}>*</span></label>
          <input
            style={inputStyle}
            placeholder="e.g. Government ID, Proof of Address"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Country */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Country</label>
          <input
            style={inputStyle}
            placeholder="e.g. US, IN, UK — leave blank for Global"
            value={country}
            onChange={e => setCountry(e.target.value)}
          />
          <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, margin: '3px 0 0' }}>
            Leave blank to apply globally to all countries
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.borderLight}`, margin: '16px 0' }} />

        {/* Sections */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>
            Assign to Sections
            <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, background: C.neutral, color: C.textTertiary, borderRadius: 3, padding: '1px 5px', marginLeft: 6, border: `1px solid ${C.border}` }}>
              OPTIONAL
            </span>
          </label>
          {sections.length === 0 ? (
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>
              No sections available. Add sections in Reference Data first.
            </p>
          ) : (
            sections.map(sec => {
              const checked = selectedSecs.includes(sec.ref_code);
              const cc = sectionColors[sec.ref_code] || { bg: C.neutral, color: C.textSecondary, border: C.border };
              return (
                <div
                  key={sec.ref_code}
                  onClick={() => toggleSection(sec.ref_code)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                    padding:      '9px 11px',
                    borderRadius: 8,
                    marginBottom: 6,
                    cursor:       'pointer',
                    border:       checked ? `1px solid rgba(0,45,91,0.12)` : `1px solid ${C.borderLight}`,
                    background:   checked ? '#F7F9FF' : C.white,
                    transition:   'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16,
                    border: checked ? `none` : `1px solid ${C.borderMedium}`,
                    borderRadius: 4,
                    background: checked ? C.primary : '#F8FAFC',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <i className="ti ti-check" style={{ fontSize: 10, color: C.white }} />}
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                    {sec.ref_value}
                  </span>
                  <span style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginLeft: 'auto' }}>
                    {sec.ref_code.toLowerCase()}
                  </span>
                </div>
              );
            })
          )}
          <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, margin: '4px 0 0' }}>
            Can be assigned to sections later via Edit
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.borderLight}`, margin: '16px 0' }} />

        {/* Mandatory */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Mandatory by default</label>
          <Toggle
            value={isRequired}
            onChange={setIsRequired}
            activeLabel="Mandatory"
            inactiveLabel="Optional"
            hint="PMs can override this per portfolio"
          />
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <label style={fieldLabel}>Status</label>
          <Toggle
            value={isActive}
            onChange={setIsActive}
            hint={isActive ? 'Visible across the platform' : 'Hidden from the platform'}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel} disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={saving}>
            {!isEdit && <i className="ti ti-plus" style={{ fontSize: 13 }} />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Document Type'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ item, onClose, onEdit }) {
  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: F.headline, fontSize: 20, fontWeight: 700, color: C.primary, margin: 0 }}>
            Document Type
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 18 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {[
          { label: 'Document Name', value: item.name },
          { label: 'Country',       value: item.country || 'Global (all countries)' },
        ].map(({ label, value }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>{label}</label>
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: C.textSecondary, cursor: 'default' }}>
              {value}
            </div>
          </div>
        ))}

        {/* Sections */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Assigned Sections</label>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: `1px solid ${C.borderLight}`, minHeight: 38 }}>
            {item.sections?.length > 0
              ? item.sections.map(s => (
                  <SectionBadge key={s.section_code} code={s.section_code} label={s.section_value} />
                ))
              : <span style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary }}>Not assigned to any section</span>
            }
          </div>
        </div>

        {/* Mandatory */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Mandatory</label>
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 4,
            background: item.is_required ? C.neutral     : C.neutral,
            color: item.is_required ? C.textPrimary : C.textTertiary,
            border: `0.5px solid ${C.border}`,
          }}>
            {item.is_required ? 'Mandatory' : 'Optional'}
          </span>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <label style={fieldLabel}>Status</label>
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 4,
            background: item.is_active ? C.greenBg : C.amberBg,
            color: item.is_active ? C.green : C.amber,
            border: `0.5px solid ${item.is_active ? C.greenBorder : C.amberBorder}`,
          }}>
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Close</button>
          <button onClick={() => { onClose(); onEdit(item); }} style={btnPrimary}>
            <i className="ti ti-pencil" style={{ fontSize: 13 }} />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main DocumentTypesTab ────────────────────────────────────────────────────
export default function DocumentTypesTab() {
  const [items,        setItems]        = useState([]);
  const [sections,     setSections]     = useState([]); // from UNReference DOCUMENT_SECTIONS
  const [activeSubTab, setActiveSubTab] = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [countryFilter,setCountryFilter]= useState('');
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [viewItem,     setViewItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Load sections from UNReference
  async function loadSections() {
    try {
      const res  = await fetch(`${API}/references/?module=DOCUMENT_SECTION&is_active=true`, { headers: authH() });
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.results || []);
      setSections(rows.map(r => ({ ref_code: r.ref_code, ref_value: r.ref_value })));
    } catch {
      // silently fail — no sections available
    }
  }

  // Load document types
  async function loadItems() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/document-types/`, { headers: authH() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
    loadItems();
  }, []);

  function handleSaved(data, isEdit) {
    if (isEdit) {
      setItems(prev => prev.map(x => x.id === data.id ? data : x));
      showToast('Document type updated.');
    } else {
      setItems(prev => [data, ...prev]);
      showToast('Document type added.');
    }
    setShowModal(false);
    setEditItem(null);
  }

  async function handleDelete(item) {
    // Check if item has section assignments
    if (item.sections?.length > 0) {
      showToast(`Cannot delete — remove from ${item.sections.length} section(s) first.`);
      setDeleteTarget(null);
      return;
    }
    try {
      await fetch(`${API}/document-types/${item.id}/`, { method: 'DELETE', headers: authH() });
      setItems(prev => prev.filter(x => x.id !== item.id));
      showToast('Document type deleted.');
    } catch {
      showToast('Delete failed. Please try again.');
    } finally {
      setDeleteTarget(null);
    }
  }

  // Filter items based on active sub-tab
  const filtered = items.filter(item => {
    const matchSearch  = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCountry = !countryFilter || (item.country || 'Global') === countryFilter;
    const matchSection = activeSubTab === 'ALL'
      ? true
      : item.sections?.some(s => s.section_code === activeSubTab);
    return matchSearch && matchCountry && matchSection;
  });

  // Unique countries for filter
  const countries = [...new Set(items.map(i => i.country || 'Global'))].sort();

  // Sub-tabs: ALL + one per section
  const subTabs = [
    { id: 'ALL', label: 'All' },
    ...sections.map(s => ({ id: s.ref_code, label: s.ref_value })),
  ];

  // Action icon button
  const ActionBtn = ({ onClick, icon, danger }) => (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 7,
        border: `1px solid ${danger ? C.dangerBorder : C.borderLight}`,
        background: danger ? C.dangerBg : C.white,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? C.danger : C.textSecondary,
      }}
    >
      <i className={`ti ti-${icon}`} style={{ fontSize: 13 }} />
    </button>
  );

  // Grid columns per sub-tab
  const allCols    = '1.2fr 90px 160px 110px 90px 96px';
  const secCols    = '1.2fr 90px 60px 120px 90px 96px';
  const activeCols = activeSubTab === 'ALL' ? allCols : secCols;

  const allHeaders = ['Document Name', 'Country', 'Sections', 'Mandatory', 'Status', 'Actions'];
  const secHeaders = ['Document Name', 'Country', 'Sort', 'Mandatory', 'Status', 'Actions'];
  const activeHeaders = activeSubTab === 'ALL' ? allHeaders : secHeaders;

  return (
    <>
      <Toast message={toast} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0, flexWrap: 'wrap' }}>
        <div style={{ height: 36, background: C.neutral, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flex: 1, maxWidth: 280 }}>
          <i className="ti ti-search" style={{ fontSize: 13, color: C.textTertiary }} />
          <input
            style={{ border: 'none', background: 'none', outline: 'none', fontFamily: F.body, fontSize: 13, color: C.textPrimary, width: '100%' }}
            placeholder="Search document types..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          style={{ height: 36, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.borderMedium}`, background: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary, cursor: 'pointer' }}
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
        >
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          style={{ ...btnPrimary, marginLeft: 'auto' }}
        >
          <i className="ti ti-plus" style={{ fontSize: 13 }} />
          Add Document Type
        </button>
      </div>

      {/* Card with sub-tabs + table */}
      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, overflow: 'hidden', marginTop: 16 }}>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.borderLight}`, padding: '0 16px' }}>
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                fontFamily:   F.body,
                fontSize:     13,
                fontWeight:   600,
                padding:      '10px 16px',
                border:       'none',
                background:   'none',
                color:        activeSubTab === tab.id ? C.primary : C.textTertiary,
                borderBottom: `2px solid ${activeSubTab === tab.id ? C.primary : 'transparent'}`,
                marginBottom: -1,
                cursor:       'pointer',
                whiteSpace:   'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table head */}
        <div style={{ display: 'grid', gridTemplateColumns: activeCols, gap: 8, padding: '10px 16px', background: C.pageBg, borderBottom: `1px solid ${C.borderLight}` }}>
          {activeHeaders.map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.textTertiary, fontFamily: F.body, fontSize: 13 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.textTertiary, fontFamily: F.body, fontSize: 13 }}>
            {search ? `No document types matching "${search}"` : 'No document types yet.'}
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id}
              style={{ display: 'grid', gridTemplateColumns: activeCols, gap: 8, padding: '11px 16px', borderBottom: `1px solid ${C.borderLight}`, alignItems: 'center', background: idx % 2 === 1 ? '#FAFBFC' : C.white }}
            >
              {/* Document Name */}
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                {item.name}
              </span>

              {/* Country */}
              <span style={{ fontFamily: F.body, fontSize: 12, color: item.country ? C.textPrimary : C.textTertiary }}>
                {item.country || 'Global'}
              </span>

              {/* Sections (All tab only) */}
              {activeSubTab === 'ALL' && (
                <span>
                  {item.sections?.length > 0
                    ? item.sections.map(s => (
                        <SectionBadge key={s.section_code} code={s.section_code} label={s.section_value} />
                      ))
                    : <span style={{ fontFamily: F.body, fontSize: 11, color: C.borderMedium, fontStyle: 'italic' }}>Not assigned</span>
                  }
                </span>
              )}

              {/* Sort (section tabs only) */}
              {activeSubTab !== 'ALL' && (
                <span style={{ fontFamily: F.body, fontSize: 12, color: C.textTertiary, textAlign: 'center' }}>
                  {item.sections?.find(s => s.section_code === activeSubTab)?.sort_order ?? '—'}
                </span>
              )}

              {/* Mandatory */}
              <span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 4,
                  background: item.is_required ? C.neutral  : C.neutral,
                  color:      item.is_required ? C.textPrimary : C.textTertiary,
                  border:     `0.5px solid ${C.border}`,
                }}>
                  {item.is_required ? 'Mandatory' : 'Optional'}
                </span>
              </span>

              {/* Status */}
              <span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 4,
                  background: item.is_active ? C.greenBg  : C.amberBg,
                  color:      item.is_active ? C.green    : C.amber,
                  border:     `0.5px solid ${item.is_active ? C.greenBorder : C.amberBorder}`,
                }}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 5 }}>
                <ActionBtn onClick={() => setViewItem(item)}   icon="eye"     />
                <ActionBtn onClick={() => { setEditItem(item); setShowModal(true); }} icon="pencil"  />
                <ActionBtn onClick={() => setDeleteTarget(item)} icon="trash" danger />
              </div>
            </div>
          ))
        )}

        {/* + Add link at bottom right */}
        <div
          onClick={() => { setEditItem(null); setShowModal(true); }}
          style={{ padding: '10px 16px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, cursor: 'pointer', fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.primary }}
          onMouseEnter={e => e.currentTarget.style.background = C.neutral}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <i className="ti ti-plus" style={{ fontSize: 13 }} />
          {activeSubTab === 'ALL' ? 'Add Document Type' : `Assign to ${subTabs.find(t => t.id === activeSubTab)?.label}`}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <DocTypeModal
          existing={editItem}
          sections={sections}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* View Modal */}
      {viewItem && (
        <ViewModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={item => { setEditItem(item); setShowModal(true); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}"?`}
          subMessage={
            deleteTarget.sections?.length > 0
              ? `This document is assigned to ${deleteTarget.sections.length} section(s). Remove assignments first.`
              : 'This will permanently remove it from the master catalogue. This cannot be undone.'
          }
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel={deleteTarget.sections?.length > 0 ? 'OK' : 'Delete'}
          danger={!(deleteTarget.sections?.length > 0)}
        />
      )}
    </>
  );
}
