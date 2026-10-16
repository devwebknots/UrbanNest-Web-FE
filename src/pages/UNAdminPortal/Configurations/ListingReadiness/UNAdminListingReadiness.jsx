import React, { useState, useEffect } from 'react';

// ─── Design tokens (matches UNAdminReferenceData.jsx exactly) ─────────────────
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
  blue:          '#1D4ED8',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
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

const SCOPE_LABEL = {
  UNIT_READINESS:      'Unit Readiness',
  LISTING_PUBLICATION: 'Listing Publication',
};

// ─── Shared styles (matches UNAdminReferenceData.jsx) ─────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
};
const modalBase = {
  background: C.white, borderRadius: 12,
  padding: 28, width: '90%', maxWidth: 640,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
};
const btnPrimary = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: 'none', background: C.primary,
  fontFamily: F.body, fontSize: 13, fontWeight: 500,
  color: C.white, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
};
const btnCancel = {
  height: 38, padding: '0 20px', borderRadius: 8,
  border: `1.5px solid ${C.borderMedium}`, background: C.white,
  fontFamily: F.body, fontSize: 13, fontWeight: 500,
  color: C.textPrimary, cursor: 'pointer',
};
const fieldLabel = {
  fontFamily: F.body, fontSize: 10, fontWeight: 500,
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
const selectStyle = { ...inputStyle, cursor: 'pointer' };
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

function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      background: C.primary, color: C.white,
      padding: '10px 20px', borderRadius: 8,
      fontSize: 13, fontFamily: F.body, fontWeight: 500,
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    }}>
      {message}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel, busy }) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalBase, maxWidth: 420 }}>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.textPrimary, margin: '0 0 24px', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnCancel} disabled={busy}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, background: C.danger }} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: value ? C.green : C.borderMedium,
        display: 'flex', alignItems: 'center',
        padding: '0 3px', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%', background: C.white,
        marginLeft: value ? 'auto' : 0,
        transition: 'margin 0.2s',
      }} />
    </div>
  );
}

// ─── Badges (pill style, matches wireframe exactly) ───────────────────────────
function Pill({ bg, color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
      background: bg, color,
    }}>
      {children}
    </span>
  );
}
const TypeBadge     = ({ isCustom }) => isCustom ? <Pill bg={C.blueBg} color={C.blue}>Custom</Pill> : <Pill bg={C.neutral} color={C.textSecondary}>System</Pill>;
const SeverityBadge  = ({ severity }) => severity === 'BLOCKING' ? <Pill bg={C.dangerBg} color="#B91C1C">Blocking</Pill> : <Pill bg={C.amberBg} color={C.amberText}>Warning</Pill>;
const StatusBadge    = ({ enabled }) => enabled ? <Pill bg={C.greenBg} color={C.green}>Enabled</Pill> : <Pill bg={C.neutral} color={C.textSecondary}>Disabled</Pill>;

// ─── What-it-checks text for a Custom Rule (built from its condition) ────────
function describeCustomCondition(rule, operatorLabels) {
  if (rule.description) return rule.description;
  const opLabel = operatorLabels?.[rule.condition_operator] || rule.condition_operator;
  const field   = rule.field_label || rule.condition_field_path;
  if (rule.condition_operator === 'IS_SET' || rule.condition_operator === 'IS_EMPTY') {
    return `${field} ${opLabel}`;
  }
  return `${field} ${opLabel} ${rule.condition_value}`;
}

// ─── Rule Modal — handles View (System), Add Custom, Edit Custom ─────────────
function RuleModal({ mode, rule, categories, fieldsData, onClose, onSaved }) {
  const isSystemView = mode === 'view-system';
  const isCustomForm = mode === 'add-custom' || mode === 'edit-custom';
  const isEdit        = mode === 'edit-custom';

  const [name,        setName]        = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [categoryId,  setCategoryId]  = useState(rule?.category?.id || (categories[0]?.id ?? ''));
  const [fieldKey,     setFieldKey]     = useState(rule?.condition_field_path || '');
  const [operator,     setOperator]     = useState(rule?.condition_operator || '');
  const [value,        setValue]        = useState(rule?.condition_value || '');
  const [severity,     setSeverity]     = useState(rule?.severity || rule?.default_severity || 'WARNING');
  const [enabled,      setEnabled]      = useState(rule?.enabled ?? true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const selectedCategory = categories.find(c => c.id === Number(categoryId)) || categories.find(c => c.id === categoryId);
  const scope = selectedCategory?.scope;
  const availableFields = (fieldsData.fields || []).filter(f => !scope || f.scopes.includes(scope));
  const selectedField   = availableFields.find(f => f.key === fieldKey) || (fieldsData.fields || []).find(f => f.key === fieldKey);
  const validOperators  = selectedField ? (fieldsData.operators_by_value_type?.[selectedField.value_type] || []) : [];
  const needsValue       = operator && operator !== 'IS_SET' && operator !== 'IS_EMPTY';

  useEffect(() => {
    // Reset field/operator when the category (hence scope) changes and the
    // currently chosen field is no longer valid for the new scope.
    if (isCustomForm && fieldKey && !availableFields.find(f => f.key === fieldKey)) {
      setFieldKey('');
      setOperator('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    // Reset operator if it's no longer valid for the newly selected field's type.
    if (operator && selectedField && !validOperators.includes(operator)) {
      setOperator('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldKey]);

  async function handleSaveSystem() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/readiness-rules/defaults/`, {
        method: 'PATCH', headers: authH(),
        body: JSON.stringify({ rule_definition: rule.id, enabled, severity }),
      });
      if (!res.ok) throw new Error('Save failed');
      onSaved(await res.json());
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  }

  async function handleSaveCustom() {
    if (!name.trim())        { setError('Rule name is required.'); return; }
    if (!categoryId)         { setError('Category is required.'); return; }
    if (!fieldKey)           { setError('Field is required.'); return; }
    if (!operator)           { setError('Operator is required.'); return; }
    if (needsValue && !value.trim()) { setError('A comparison value is required for this operator.'); return; }
    setError(''); setSaving(true);
    try {
      const payload = {
        category: Number(categoryId),
        name: name.trim(),
        description: description.trim(),
        default_severity: severity,
        condition_field_path: fieldKey,
        condition_operator: operator,
        condition_value: needsValue ? value.trim() : '',
      };
      const url    = isEdit ? `${API}/readiness-rules/custom/${rule.id}/` : `${API}/readiness-rules/custom/`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: authH(), body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const firstError = Object.values(data)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : (firstError || 'Save failed'));
      }
      const savedRule = await res.json();

      // Custom Rule's severity/enabled live on the PLATFORM_DEFAULT config,
      // not on the rule definition itself — a second PATCH keeps that in
      // sync (mirrors how PlatformDefaultsView drives every other row).
      const configRes = await fetch(`${API}/readiness-rules/defaults/`, {
        method: 'PATCH', headers: authH(),
        body: JSON.stringify({ rule_definition: savedRule.id, enabled, severity }),
      });
      const finalRule = configRes.ok ? await configRes.json() : { ...savedRule, enabled, severity, source: 'PLATFORM_DEFAULT' };
      onSaved(finalRule, isEdit);
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  }

  const LockedField = ({ label, value: v }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabel}>{label}</label>
      <div style={{ ...inputLockedStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{v}</span>
        <i className="ti ti-lock" style={{ fontSize: 13, color: C.borderMedium }} />
      </div>
    </div>
  );

  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 500, color: C.primary, margin: '0 0 4px' }}>
            {isSystemView ? 'View Rule' : isEdit ? 'Edit Custom Rule' : 'Add Custom Rule'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 20 }}>
            <i className="ti ti-x" />
          </button>
        </div>
        {isCustomForm && (
          <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, margin: '0 0 20px' }}>
            Built from a vetted list of fields — no code required, and nothing outside this list can be checked.
          </p>
        )}
        {isSystemView && <div style={{ marginBottom: 16 }} />}

        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: C.danger, fontFamily: F.body }}>
            {error}
          </div>
        )}

        {isSystemView ? (
          <>
            <LockedField label="Rule Name" value={rule.name} />
            <LockedField label="Category" value={`${rule.category?.name} (${SCOPE_LABEL[rule.category?.scope] || rule.category?.scope})`} />
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>What It Checks</label>
              <div style={{ ...inputLockedStyle, height: 'auto', minHeight: 52, padding: '10px 12px', lineHeight: 1.5 }}>
                {rule.description || 'This rule’s logic is implemented in code (evaluators.py) — it isn’t stored as a condition.'}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ flex: 1.4 }}>
                <label style={fieldLabel}>Rule Name <span style={{ color: C.danger }}>*</span></label>
                <input style={inputStyle} placeholder="e.g. Rent Amount Set" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Category <span style={{ color: C.danger }}>*</span></label>
                <select style={selectStyle} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({SCOPE_LABEL[c.scope] || c.scope})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Description</label>
              <input style={inputStyle} placeholder="Optional — shown in the What It Checks column" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />

            <label style={fieldLabel}>Condition</label>
            <div style={hintStyle}>
              Pick a field from the registry, an operator valid for that field's type, and (if needed) a value to compare against.
            </div>
            <div style={{ display: 'flex', gap: 10, background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, margin: '10px 0 16px' }}>
              <div style={{ flex: 1.3 }}>
                <label style={{ ...fieldLabel, color: C.textTertiary, fontSize: 9.5 }}>Field</label>
                <select style={{ ...selectStyle, border: `1.5px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontWeight: 500 }} value={fieldKey} onChange={e => setFieldKey(e.target.value)}>
                  <option value="">Select a field…</option>
                  {availableFields.map(f => <option key={f.key} value={f.key}>{f.label} ({f.value_type.toLowerCase()})</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...fieldLabel, color: C.textTertiary, fontSize: 9.5 }}>Operator</label>
                <select style={selectStyle} value={operator} onChange={e => setOperator(e.target.value)} disabled={!selectedField}>
                  <option value="">Select…</option>
                  {validOperators.map(op => <option key={op} value={op}>{fieldsData.operator_labels?.[op] || op}</option>)}
                </select>
              </div>
              <div style={{ flex: 0.7 }}>
                <label style={{ ...fieldLabel, color: C.textTertiary, fontSize: 9.5 }}>Value</label>
                <input
                  style={{ ...inputStyle, background: needsValue ? C.white : C.neutral, border: needsValue ? `1px solid ${C.borderMedium}` : 'none' }}
                  value={needsValue ? value : ''}
                  onChange={e => setValue(e.target.value)}
                  disabled={!needsValue}
                  placeholder={needsValue ? 'e.g. 0' : 'n/a'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 200 }}>
                <label style={fieldLabel}>Severity</label>
                <select style={selectStyle} value={severity} onChange={e => setSeverity(e.target.value)}>
                  <option value="WARNING">Warning</option>
                  <option value="BLOCKING">Blocking</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Applies To</label>
                <div style={{ ...inputLockedStyle, display: 'flex', alignItems: 'center' }}>
                  All accounts (as a platform default rule)
                </div>
              </div>
            </div>

            {selectedField && operator && (
              <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: C.green, marginBottom: 6, lineHeight: 1.6 }}>
                <strong>Preview:</strong> "{name || 'This rule'}" will show a{' '}
                <span style={{ fontWeight: 500 }}>{severity === 'BLOCKING' ? 'Blocking' : 'Warning'}</span> when{' '}
                {selectedField.label} {(fieldsData.operator_labels?.[operator] || operator).toLowerCase()}
                {needsValue ? ` "${value || '…'}"` : ''} is not satisfied — right alongside every other rule in this category.
              </div>
            )}
          </>
        )}

        {(isSystemView || isEdit) && (
          <div style={{ marginTop: isSystemView ? 4 : 4, marginBottom: 20 }}>
            <label style={fieldLabel}>Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              {isSystemView && (
                <select style={{ ...selectStyle, width: 140 }} value={severity} onChange={e => setSeverity(e.target.value)}>
                  <option value="WARNING">Warning</option>
                  <option value="BLOCKING">Blocking</option>
                </select>
              )}
              <Toggle value={enabled} onChange={setEnabled} />
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: enabled ? C.green : C.textSecondary }}>
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, margin: 0 }}>
              {enabled ? 'This rule is evaluated everywhere it applies.' : 'This rule is skipped everywhere it applies.'}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={btnCancel} disabled={saving}>{isSystemView ? 'Close' : 'Cancel'}</button>
          <button onClick={isSystemView ? handleSaveSystem : handleSaveCustom} style={btnPrimary} disabled={saving}>
            {!isSystemView && !isEdit && <i className="ti ti-plus" style={{ fontSize: 14 }} />}
            {saving ? 'Saving…' : isSystemView ? 'Save' : isEdit ? 'Save Changes' : 'Save Rule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UNAdminListingReadiness() {
  const [items,        setItems]        = useState([]);
  const [fieldsData,   setFieldsData]   = useState({ fields: [], operator_labels: {}, operators_by_value_type: {} });
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [activeTab,    setActiveTab]    = useState('ALL');
  const [modal,        setModal]        = useState(null); // { mode, rule }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toast,        setToast]        = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function loadRules() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/readiness-rules/defaults/`, { headers: authH() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.results || []));
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  }

  async function loadFields() {
    try {
      const res  = await fetch(`${API}/readiness-rules/fields/`, { headers: authH() });
      const data = await res.json();
      setFieldsData(data);
    } catch { /* field picker just stays empty */ }
  }

  useEffect(() => { loadRules(); loadFields(); }, []);

  // Categories derived from the loaded rules — same "no separate endpoint"
  // approach as UNAdminReferenceData.jsx's module/ref-type derivation.
  const categories = items
    .map(i => i.category)
    .filter((v, i, a) => v && a.findIndex(x => x.id === v.id) === i)
    .sort((a, b) => (a.scope === b.scope ? a.sort_order - b.sort_order : a.scope.localeCompare(b.scope)));

  const tabs = [
    { id: 'ALL', label: 'All Rules' },
    { id: 'UNIT_READINESS', label: 'Unit Readiness' },
    { id: 'LISTING_PUBLICATION', label: 'Listing Publication' },
  ];

  const filtered = items.filter(item => {
    const matchTab      = activeTab === 'ALL' || item.category?.scope === activeTab;
    const matchSearch    = !search || [item.name, item.description, item.field_label]
      .filter(Boolean).some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !categoryFilter || String(item.category?.id) === String(categoryFilter);
    const matchSeverity = !severityFilter || item.severity === severityFilter;
    return matchTab && matchSearch && matchCategory && matchSeverity;
  });

  const groups = filtered.reduce((acc, item) => {
    const key = item.category?.id ?? 'uncategorized';
    if (!acc[key]) acc[key] = { category: item.category, rows: [] };
    acc[key].rows.push(item);
    return acc;
  }, {});

  function handleSaved(rule, wasEdit) {
    setItems(prev => {
      const exists = prev.find(x => x.id === rule.id);
      return exists ? prev.map(x => x.id === rule.id ? rule : x) : [...prev, rule];
    });
    showToast(modal?.mode === 'view-system' ? 'Rule updated.' : wasEdit ? 'Custom rule updated.' : 'Custom rule added.');
    setModal(null);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`${API}/readiness-rules/custom/${deleteTarget.id}/`, { method: 'DELETE', headers: authH() });
      setItems(prev => prev.filter(x => x.id !== deleteTarget.id));
      showToast('Custom rule deleted.');
    } catch {
      showToast('Delete failed. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const severityOptions = ['BLOCKING', 'WARNING'];

  return (
    <div style={{ padding: '28px 32px', fontFamily: F.body }}>

      {/* Breadcrumb removed (Session 50, continued) — this screen now only
          ever renders nested inside UNAdminRuleEngine.jsx's "Listings" tab,
          which already shows its own "Configurations › Rule Engine ›
          Listings" breadcrumb above this, so this one was redundant. */}

      {/* Heading */}
      <h1 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 500, color: C.primary, margin: '10px 0 20px' }}>
        Listing Readiness Rules
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 22px', maxWidth: 760 }}>
        Platform defaults for when a unit is "List Ready" and when a listing can publish. Independent PM and Org PM accounts inherit every rule below unless they set their own override.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 16, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: F.body, fontSize: 13, fontWeight: 500,
              padding: '10px 20px', border: 'none', background: 'none',
              color: activeTab === tab.id ? C.primary : C.textTertiary,
              borderBottom: `2px solid ${activeTab === tab.id ? C.primary : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ height: 38, background: C.neutral, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flex: 1, maxWidth: 320 }}>
          <i className="ti ti-search" style={{ fontSize: 14, color: C.textTertiary }} />
          <input
            style={{ border: 'none', background: 'none', outline: 'none', fontFamily: F.body, fontSize: 13, color: C.textPrimary, width: '100%' }}
            placeholder="Search rules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${C.borderMedium}`, background: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.textPrimary, cursor: 'pointer' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${C.borderMedium}`, background: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.textPrimary, cursor: 'pointer' }}
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          {severityOptions.map(s => <option key={s} value={s}>{s === 'BLOCKING' ? 'Blocking' : 'Warning'}</option>)}
        </select>

        <button
          onClick={() => setModal({ mode: 'add-custom', rule: null })}
          style={{ ...btnPrimary, height: 37, padding: '0 19px', marginLeft: 'auto' }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Add Custom Rule
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>Loading...</div>
      ) : Object.keys(groups).length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>
          {search ? `No results matching "${search}"` : 'No rules found.'}
        </div>
      ) : (
        Object.values(groups).map(({ category, rows }) => (
          <div key={category?.id ?? 'uncategorized'} style={{ marginBottom: 20 }}>

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: C.neutral, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: C.textSecondary, display: 'flex', justifyContent: 'space-between' }}>
                <span>{(category?.name || 'UNCATEGORIZED').toUpperCase()}</span>
                <span>{rows.length} rule{rows.length !== 1 ? 's' : ''}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 90px 110px 100px 130px', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
                {['Rule', 'What It Checks', 'Type', 'Severity', 'Status', 'Actions'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
                ))}
              </div>

              {rows.map((item, idx) => (
                <div
                  key={item.id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 90px 110px 100px 130px', gap: 12, padding: '11px 16px', borderBottom: `1px solid ${C.neutral}`, alignItems: 'center', background: idx % 2 === 1 ? '#FAFBFC' : C.white }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
                    {item.name}
                    {item.is_custom && <span style={{ fontWeight: 500, color: C.textTertiary, fontStyle: 'italic' }}> (custom)</span>}
                  </span>
                  <span style={{ fontSize: 12, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.is_custom ? describeCustomCondition(item, fieldsData.operator_labels) : (item.description || '—')}
                  </span>
                  <span><TypeBadge isCustom={item.is_custom} /></span>
                  <span><SeverityBadge severity={item.severity} /></span>
                  <span
                    onClick={async () => {
                      const res = await fetch(`${API}/readiness-rules/defaults/`, {
                        method: 'PATCH', headers: authH(),
                        body: JSON.stringify({ rule_definition: item.id, enabled: !item.enabled }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
                        showToast(updated.enabled ? 'Rule enabled.' : 'Rule disabled.');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click to toggle"
                  >
                    <StatusBadge enabled={item.enabled} />
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.is_custom ? (
                      <>
                        <span onClick={() => setModal({ mode: 'edit-custom', rule: item })} style={{ color: C.primary, fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}>Edit</span>
                        <span onClick={() => setDeleteTarget(item)} style={{ color: '#B91C1C', fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}>Delete</span>
                      </>
                    ) : (
                      <span onClick={() => setModal({ mode: 'view-system', rule: item })} style={{ color: '#3D8EF0', fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}>View</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div style={{ fontSize: 11, color: C.textTertiary, fontStyle: 'italic', margin: '-6px 0 16px' }}>
        System rules ship with the platform and can only be enabled, disabled or re-severitied here (their logic lives in code). Custom rules are built from the field picker and can be fully edited or deleted.
      </div>

      {modal && (
        <RuleModal
          mode={modal.mode}
          rule={modal.rule}
          categories={categories}
          fieldsData={fieldsData}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}"? This cannot be undone and will remove this rule from every account's readiness evaluation.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={deleting}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
