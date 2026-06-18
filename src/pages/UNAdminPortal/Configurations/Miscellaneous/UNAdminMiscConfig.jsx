import React, { useState, useEffect } from 'react';
import DocumentTypesTab from './DocumentTypesTab';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#002D5B',
  pageBg:        '#F8FAFC',
  white:         '#FFFFFF',
  border:        'rgba(0,0,0,0.06)',
  borderMedium:  'rgba(0,0,0,0.10)',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  neutral:       '#F1F5F9',
  danger:        '#E53E3E',
  dangerBg:      '#FEF2F2',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const API   = 'http://localhost:8001/api/admin';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });

// ─── Shared styles ────────────────────────────────────────────────────────────
const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const modalBox = {
  background: C.white, borderRadius: 12,
  padding: 28, width: '90%', maxWidth: 480,
  boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
  border: '1px solid rgba(0,0,0,0.05)',
};
const btnPrimary = {
  background: C.primary, color: C.white,
  border: 'none', borderRadius: 8,
  padding: '9px 20px', fontSize: 13, fontWeight: 700,
  fontFamily: F.body, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
};
const btnOutline = {
  background: C.white, color: C.textPrimary,
  border: '1px solid rgba(0,0,0,0.10)', borderRadius: 8,
  padding: '9px 20px', fontSize: 13, fontWeight: 700,
  fontFamily: F.body, cursor: 'pointer',
};
const inputBase = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.08)', fontSize: 13,
  fontFamily: F.body, color: C.textPrimary,
  background: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 10, fontWeight: 700, fontFamily: F.body,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: C.textSecondary, display: 'block', marginBottom: 5,
};

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={overlay}>
      <div style={{ ...modalBox, maxWidth: 400 }}>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.textPrimary, margin: '0 0 24px', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnOutline}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, background: C.danger }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AMENITIES TAB
// ═══════════════════════════════════════════════════════════════════════════════

// Category badge — neutral grey only, no color coding (project-wide rule)
function CategoryBadge({ category }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 700,
      fontFamily: F.body, letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 4,
      background: '#F1F5F9', color: '#64748B',
      border: '1px solid rgba(0,0,0,0.06)', whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  );
}

function AmenityModal({ existing, onClose, onSaved }) {
  const isEdit = Boolean(existing);
  const [name,     setName]     = useState(existing?.name     || '');
  const [icon,     setIcon]     = useState(existing?.icon     || '');
  const [category, setCategory] = useState(existing?.category || '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    if (!name.trim()) { setError('Amenity name is required.'); return; }
    if (!category)    { setError('Please select a category.'); return; }
    setError('');
    setSaving(true);
    try {
      const url    = isEdit ? `${API}/amenities/${existing.id}/` : `${API}/amenities/`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method, headers: authH(),
        body: JSON.stringify({ name: name.trim(), icon: icon.trim(), category }),
      });
      if (!res.ok) throw new Error('Save failed');
      onSaved(await res.json(), isEdit);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlay}>
      <div style={modalBox}>
        <h3 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.primary, margin: '0 0 22px' }}>
          {isEdit ? 'Edit Amenity' : 'Add Amenity'}
        </h3>

        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: C.danger, fontFamily: F.body }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Amenity Name</label>
          <input style={inputBase} placeholder="e.g. Swimming Pool" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Category</label>
          <select style={{ ...inputBase, cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Select Category</option>
            <option value="PROPERTY">Property</option>
            <option value="UNIT">Unit</option>
            <option value="BOTH">Both</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>
            Upload Icon
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.textTertiary, marginLeft: 4 }}>
              (icon class, e.g. ti-swimming-pool)
            </span>
          </label>
          <div style={{ border: '1.5px dashed rgba(0,0,0,0.12)', borderRadius: 8, padding: '20px 16px', textAlign: 'center', background: '#FAFBFC' }}>
            {icon ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <i className={icon} style={{ fontSize: 32, color: C.primary }} />
                <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: F.body }}>{icon}</span>
                <input style={{ ...inputBase, maxWidth: 280, margin: '4px auto 0' }} placeholder="e.g. ti-swimming-pool" value={icon} onChange={e => setIcon(e.target.value)} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-upload" style={{ fontSize: 28, color: '#CBD5E1' }} />
                <span style={{ fontSize: 13, color: C.textTertiary, fontFamily: F.body }}>Enter icon class below</span>
                <input style={{ ...inputBase, maxWidth: 280, margin: '4px auto 0' }} placeholder="e.g. ti-swimming-pool" value={icon} onChange={e => setIcon(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnOutline} disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Amenity'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AmenitiesTab() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/amenities/`, { headers: authH() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.results || []));
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleSaved(data, isEdit) {
    setItems(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [data, ...prev]);
    showToast(isEdit ? 'Amenity updated.' : 'Amenity added.');
    setShowModal(false); setEditItem(null);
  }

  async function handleDelete(id) {
    try {
      await fetch(`${API}/amenities/${id}/`, { method: 'DELETE', headers: authH() });
      setItems(prev => prev.filter(x => x.id !== id));
      showToast('Amenity deleted.');
    } catch { showToast('Delete failed.'); } finally { setDeleteTarget(null); }
  }

  const filtered = items.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
  const col1 = filtered.filter((_, i) => i % 3 === 0);
  const col2 = filtered.filter((_, i) => i % 3 === 1);
  const col3 = filtered.filter((_, i) => i % 3 === 2);

  function AmenityRow({ item }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto auto', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {item.icon
            ? <i className={item.icon} style={{ fontSize: 15, color: C.textSecondary }} />
            : <i className="ti ti-photo" style={{ fontSize: 15, color: '#CBD5E1' }} />
          }
        </div>
        <span title={item.name} style={{ fontSize: 13, fontWeight: 500, fontFamily: F.body, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>
        <CategoryBadge category={item.category} />
        <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: C.textTertiary }} title="Edit">
          <i className="ti ti-pencil" style={{ fontSize: 14 }} />
        </button>
        <button onClick={() => setDeleteTarget(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: C.danger }} title="Delete">
          <i className="ti ti-trash" style={{ fontSize: 14 }} />
        </button>
      </div>
    );
  }

  function Column({ rows }) {
    return (
      <div style={{ flex: 1, background: C.white, borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)', padding: '0 14px', minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto auto', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div />
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F.body, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>Amenity Item</span>
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F.body, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>Category</span>
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F.body, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary, gridColumn: 'span 2' }}>Actions</span>
        </div>
        {rows.length === 0
          ? <p style={{ fontSize: 12, color: C.textTertiary, fontFamily: F.body, padding: '16px 0', margin: 0 }}>—</p>
          : rows.map(item => <AmenityRow key={item.id} item={item} />)
        }
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: C.primary, color: C.white, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontFamily: F.body, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, width: '100%' }}>
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textTertiary }} />
          <input style={{ ...inputBase, paddingLeft: 36, width: 320 }} placeholder="Search Amenities..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} style={{ ...btnPrimary, whiteSpace: 'nowrap', marginLeft: 'auto' }}>
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Add Amenity
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.textTertiary, fontFamily: F.body, fontSize: 13 }}>Loading amenities…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.textTertiary, fontFamily: F.body, fontSize: 13 }}>
          {search ? `No amenities matching "${search}"` : 'No amenities yet. Click + Add Amenity to get started.'}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Column rows={col1} />
          <Column rows={col2} />
          <Column rows={col3} />
        </div>
      )}

      {showModal && <AmenityModal existing={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSaved={handleSaved} />}
      {deleteTarget && <ConfirmModal message={`Delete "${deleteTarget.name}"? This cannot be undone.`} onConfirm={() => handleDelete(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'amenities',      label: 'Amenity(s)' },
  { id: 'document-types', label: 'Document Types' },
  { id: 'coming-soon-1',  label: 'Coming soon', disabled: true },
  { id: 'coming-soon-2',  label: 'Coming soon', disabled: true },
];

export default function UNAdminMiscConfig() {
  const [activeTab, setActiveTab] = useState('amenities');

  return (
    <div style={{ padding: '28px 32px', fontFamily: F.body }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>
        Operations <span style={{ margin: '0 5px' }}>›</span>
        <span style={{ color: C.textSecondary }}>Miscellaneous Configurations</span>
      </div>

      {/* Heading */}
      <h1 style={{ fontFamily: F.headline, fontSize: 28, fontWeight: 700, color: C.primary, margin: '0 0 4px' }}>
        Miscellaneous Configurations
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 28px' }}>
        Manage global system configurations and settings
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 28 }}>
        {TABS.map(tab => {
          const isActive   = activeTab === tab.id;
          const isDisabled = tab.disabled;
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none',
                borderBottom: isActive ? `2px solid ${C.primary}` : '2px solid transparent',
                padding: '10px 20px', marginBottom: -1,
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                fontFamily: F.body,
                color: isDisabled ? C.textTertiary : isActive ? C.primary : C.textSecondary,
                cursor: isDisabled ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'amenities'      && <AmenitiesTab />}
      {activeTab === 'document-types' && <DocumentTypesTab />}
    </div>
  );
}
