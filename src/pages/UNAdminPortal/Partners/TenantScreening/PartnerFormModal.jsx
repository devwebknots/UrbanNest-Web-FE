/**
 * PartnerFormModal.jsx — UN Admin → Partners → Tenant Screening.
 * ─────────────────────────────────────────────────────────────────────────────
 * Add/Edit/View Partner, per the approved wireframe
 * (https://claude.ai/artifact/M7ZMt4KgSZBXBCxKCTApeJ) plus the Session 71
 * revision pass. Shared by "+ Add Partner", each card's "Configure"/"View"
 * actions, and the Capability Matrix tab's pencil/eye icons — `partner`
 * null means Add, an object means Edit or View (pre-filled either way).
 *
 * `mode` ('add' | 'edit' | 'view') controls whether the form is editable.
 * It defaults from `partner` when omitted (null → 'add', object → 'edit'),
 * so older call sites that only ever passed `partner` still work; every
 * call site in this feature now passes `mode` explicitly. In 'view' mode
 * every field is rendered disabled/protected and there is no Save — only
 * Close — per the user's explicit requirement that View open "the same
 * pop up as Edit... but all fields in Protected mode."
 *
 * Partner credentials are NEVER rendered here — only a status line
 * ("Configured in backend" / "Not yet configured"), per the spec's
 * explicit requirement that credentials never be exposed in frontend
 * code, browser storage, or logs. There is no backend endpoint yet to
 * configure them against (ARCH_001 — FE first); Save writes only the
 * non-secret fields below into the caller's in-memory state.
 */
import React, { useState } from 'react';
import {
  C, F, Pill, SampleTag, Toggle, overlayStyle, modalBase, btnPrimary, btnCancel,
  fieldLabel, hintStyle, inputBase, chip, chipAdd,
} from './partnerManagementTokens';
import { CRITERIA_OPTIONS, MARKET_OPTIONS, INTEGRATION_TYPES, blankPartner } from './mockPartnerData';
import MultiSelectDropdown from './MultiSelectDropdown';

export default function PartnerFormModal({ partner, mode, onClose, onSave }) {
  const isEdit = !!partner;
  const effectiveMode = mode || (isEdit ? 'edit' : 'add');
  const readOnly = effectiveMode === 'view';

  const [form, setForm] = useState(() => ({ ...blankPartner(), ...(partner || {}) }));
  const [error, setError] = useState('');
  const [addingCriterion, setAddingCriterion] = useState(false);
  const [newCriterionText, setNewCriterionText] = useState('');

  const set = (field, value) => { if (!readOnly) setForm(prev => ({ ...prev, [field]: value })); };

  const toggleCriterion = (c) => {
    if (readOnly) return;
    set('criteria', form.criteria.includes(c) ? form.criteria.filter(x => x !== c) : [...form.criteria, c]);
  };

  const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const addCustomCriterion = () => {
    const text = newCriterionText.trim();
    if (text && !form.criteria.includes(text)) set('criteria', [...form.criteria, text]);
    setNewCriterionText('');
    setAddingCriterion(false);
  };

  const handleSave = () => {
    if (readOnly) return;
    if (!form.name.trim()) { setError('Partner Name is required.'); return; }
    if (form.markets.length === 0) { setError('Select at least one market.'); return; }
    if (form.criteria.length === 0) { setError('Select at least one supported screening criterion.'); return; }
    const key = form.key || slugify(form.name);
    onSave({ ...form, key, id: form.id || `p_${Date.now()}` });
  };

  // Criteria chosen on this partner that aren't in the fixed catalogue —
  // i.e. added via the "+ Add" custom-criterion flow below.
  const customCriteria = form.criteria.filter(c => !CRITERIA_OPTIONS.some(o => o.value === c));

  const titleText = effectiveMode === 'view'
    ? `View Partner — ${partner?.name}`
    : effectiveMode === 'edit'
      ? `Edit Partner — ${partner?.name}`
      : 'Add Partner';

  return (
    <div style={overlayStyle} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalBase}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontFamily: F.headline, fontSize: 22, color: C.primary, margin: 0 }}>{titleText}</h2>
              {readOnly && <Pill bg={C.neutral} color={C.textSecondary}><i className="ti ti-lock" style={{ fontSize: 10 }} /> Protected / Read-only</Pill>}
            </div>
            <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '6px 0 0', maxWidth: 520 }}>
              Configure how this provider is exposed to Property Managers. Credentials are managed separately and never shown here.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.textTertiary }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* ── Status — moved to the top of the form per user feedback ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '12px 16px', margin: '14px 0 16px',
        }}>
          <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textSecondary }}>
            Partner Status
          </span>
          <Toggle checked={form.status === 'Active'} onChange={v => set('status', v ? 'Active' : 'Inactive')} disabled={readOnly} />
        </div>

        <div style={{ marginBottom: 18 }}><SampleTag /></div>

        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '9px 12px', marginBottom: 16, fontFamily: F.body, fontSize: 12.5, color: C.danger }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={fieldLabel}>Partner Name</label>
            <input
              style={{ ...inputBase, background: readOnly ? C.neutral : C.white, color: readOnly ? C.textSecondary : C.textPrimary }}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. CreditLink Verify"
              disabled={readOnly}
            />
          </div>
          <div>
            <label style={fieldLabel}>Unique Partner Key</label>
            <input
              style={{ ...inputBase, background: (isEdit || readOnly) ? C.neutral : C.white, color: (isEdit || readOnly) ? C.textTertiary : C.textPrimary }}
              value={isEdit ? form.key : (form.key || slugify(form.name))}
              onChange={e => set('key', slugify(e.target.value))}
              disabled={isEdit || readOnly}
              placeholder="auto-generated from name"
            />
            {!isEdit && !readOnly && <div style={hintStyle}>Generated from the name; cannot be changed after the partner is saved.</div>}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>Description</label>
          <textarea
            style={{ ...inputBase, minHeight: 56, resize: 'vertical', fontFamily: F.body, background: readOnly ? C.neutral : C.white, color: readOnly ? C.textSecondary : C.textPrimary }}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What this provider does and which report it returns."
            disabled={readOnly}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={fieldLabel}>Supported Markets</label>
            <MultiSelectDropdown
              options={MARKET_OPTIONS}
              values={form.markets}
              onChange={v => set('markets', v)}
              placeholder="Select markets…"
              disabled={readOnly}
            />
          </div>
          <div>
            <label style={fieldLabel}>Integration Type</label>
            <select
              style={{ ...inputBase, background: readOnly ? C.neutral : C.white, color: readOnly ? C.textSecondary : C.textPrimary }}
              value={form.integrationType}
              onChange={e => set('integrationType', e.target.value)}
              disabled={readOnly}
            >
              {INTEGRATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={fieldLabel}>Supported Screening Criteria</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {CRITERIA_OPTIONS.map(c => {
              const picked = form.criteria.includes(c.value);
              return (
                <span
                  key={c.value}
                  onClick={() => toggleCriterion(c.value)}
                  style={picked
                    ? { ...chip, cursor: readOnly ? 'default' : 'pointer', opacity: readOnly ? 0.85 : 1 }
                    : { ...chipAdd, cursor: readOnly ? 'default' : 'pointer', opacity: readOnly ? 0.45 : 1 }}
                >
                  {picked ? `${c.label}${readOnly ? '' : ' ✕'}` : `+ ${c.label}`}
                </span>
              );
            })}

            {customCriteria.map(c => (
              <span
                key={c}
                onClick={() => toggleCriterion(c)}
                style={{ ...chip, cursor: readOnly ? 'default' : 'pointer', opacity: readOnly ? 0.85 : 1 }}
              >
                {c}{!readOnly && ' ✕'}
              </span>
            ))}

            {!readOnly && !addingCriterion && (
              <span onClick={() => setAddingCriterion(true)} style={{ ...chipAdd, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-plus" style={{ fontSize: 10 }} /> Add
              </span>
            )}

            {!readOnly && addingCriterion && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  autoFocus
                  value={newCriterionText}
                  onChange={e => setNewCriterionText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addCustomCriterion();
                    if (e.key === 'Escape') { setAddingCriterion(false); setNewCriterionText(''); }
                  }}
                  placeholder="Criterion name…"
                  style={{ ...inputBase, width: 170, height: 30, padding: '4px 10px', fontSize: 12 }}
                />
                <button
                  onClick={addCustomCriterion}
                  title="Add criterion"
                  style={{ background: C.green, border: 'none', borderRadius: 6, width: 26, height: 26, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="ti ti-check" style={{ fontSize: 13 }} />
                </button>
                <button
                  onClick={() => { setAddingCriterion(false); setNewCriterionText(''); }}
                  title="Cancel"
                  style={{ background: C.neutral, border: 'none', borderRadius: 6, width: 26, height: 26, color: C.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="ti ti-x" style={{ fontSize: 13 }} />
                </button>
              </span>
            )}
          </div>
          <div style={hintStyle}>Only criteria marked here make this partner selectable in a PM's own Provider Selection step — see the Capability Matrix tab. Use "+ Add" for a criterion not yet in the standard list.</div>
        </div>

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ ...fieldLabel, margin: 0 }}>Sandbox / Production Configuration</span>
            <Pill bg={form.environment === 'Production' ? C.greenBg : C.amberBg} color={form.environment === 'Production' ? C.green : C.amberText}>
              {isEdit ? '✓ Configured in backend' : 'Not yet configured'}
            </Pill>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '0 0 12px' }}>
            Credentials (API keys, secrets, OAuth tokens) are configured through the secure backend endpoint — never exposed in this UI, browser storage, or logs.
          </p>
          <label style={fieldLabel}>Environment</label>
          <select
            style={{ ...inputBase, maxWidth: 220, background: readOnly ? C.neutral : C.white, color: readOnly ? C.textSecondary : C.textPrimary }}
            value={form.environment}
            onChange={e => set('environment', e.target.value)}
            disabled={readOnly}
          >
            <option>Sandbox</option>
            <option>Production</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={form.webhookSupport} onChange={e => set('webhookSupport', e.target.checked)} disabled={readOnly} style={{ width: 16, height: 16 }} />
            <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: readOnly ? C.textSecondary : C.textPrimary }}>Webhook / Polling Support</span>
          </div>
          <div>
            <label style={fieldLabel}>Retry Configuration</label>
            <input
              style={{ ...inputBase, background: readOnly ? C.neutral : C.white, color: readOnly ? C.textSecondary : C.textPrimary }}
              value={form.retryConfig}
              onChange={e => set('retryConfig', e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {readOnly ? (
            <button style={btnPrimary} onClick={onClose}>Close</button>
          ) : (
            <>
              <button style={btnCancel} onClick={onClose}>Cancel</button>
              <button style={btnPrimary} onClick={handleSave}>
                <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />
                {isEdit ? 'Save Changes' : 'Save & Activate'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
