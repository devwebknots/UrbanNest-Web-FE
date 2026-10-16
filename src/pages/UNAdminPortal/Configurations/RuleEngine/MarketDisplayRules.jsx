/**
 * MarketDisplayRules.jsx — UN Admin → Configurations → Rule Engine →
 * Market Display tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 50, continued. Phase 1 (marketplace-display/
 * UrbanNest_MarketplaceDisplayRulesEngine_Architecture.md §12/§13) is now
 * built — `MarketplaceDisplayRuleDefinition` (model + migration + seed
 * script + Admin API, rules_engine/marketplace_display/, mounted at
 * /api/admin/marketplace-display-rules/) — so this screen now reads/writes
 * real data via marketplaceDisplayApi.js instead of mockMarketDisplayRules.js's
 * old MOCK_MARKET_DISPLAY_RULES/MOCK_CHANGE_LOG sample arrays. Those two
 * exports are gone; mockMarketDisplayRules.js now holds only FE-only layout
 * metadata (RULE_GROUPS/UI_BY_CODE) with no backend equivalent — see that
 * file's own header.
 *
 * Visual pattern matches UNAdminListingReadiness.jsx's table/pill/toolbar
 * exactly (not approximated) — same grid columns, same group-bar, same
 * breadcrumb/heading sizing. No "Add Rule" — this remains a fixed 7-code
 * catalog (§12), not an open builder like Listing Readiness's Custom Rules.
 * Approved wireframe: https://claude.ai/artifact/8Vj9RwYL1LfowuY1stUaKi
 */
import React, { useEffect, useState } from 'react';
import {
  C, F, Pill,
  overlayStyle, modalBase, btnPrimary, btnCancel, hintStyle,
} from './ruleEngineTokens';
import { RULE_GROUPS, UI_BY_CODE } from './mockMarketDisplayRules';
import {
  apiListMarketplaceDisplayRules,
  apiUpdateMarketplaceDisplayRule,
  apiListMarketplaceDisplayChangeLog,
} from './marketplaceDisplayApi';

// ─── Badges ────────────────────────────────────────────────────────────────
function StatusPill({ enabled, onClick }) {
  const pill = enabled
    ? <Pill bg={C.greenBg} color={C.green}>Enabled</Pill>
    : <Pill bg={C.neutral} color={C.textSecondary}>Disabled</Pill>;
  if (!onClick) return pill;
  return (
    <span onClick={onClick} style={{ cursor: 'pointer' }} title="Click to toggle">
      {pill}
    </span>
  );
}
function DraftPill() {
  return <Pill bg={C.amberBg} color={C.amberText}>Draft</Pill>;
}

const inputStyle = {
  width: '100%', height: 32, borderRadius: 6, border: `1px solid ${C.borderMedium}`,
  padding: '0 9px', fontFamily: F.body, fontSize: 13, color: C.textPrimary,
  outline: 'none', boxSizing: 'border-box',
};

// ─── "Key parameters" summary for the table row ───────────────────────────
function summarize(rule) {
  const ui = UI_BY_CODE[rule.code];
  const { parameters } = rule;
  if (!ui) return '—';
  if (ui.kind === 'weights') {
    const sum = ui.fields.reduce((s, f) => s + (Number(parameters[f.key]) || 0), 0);
    const fmt = (v) => (ui.unit === '%' ? `${v}%` : v.toFixed(ui.decimals));
    const parts = ui.fields.map(f => `${f.label.split(' ')[0].toLowerCase()} ${fmt(Number(parameters[f.key]) || 0)}`);
    return `${parts.join(' · ')} (Σ ${fmt(sum)})`;
  }
  if (ui.kind === 'bucket') {
    return ui.fields.map(f => `${f.label.replace(' Priority', '').replace('No Priority Boost', 'None')} ${parameters[f.key]}`).join(' · ');
  }
  return ui.fields.map(f => `${f.label.split(' ')[0].toLowerCase()} ${parameters[f.key]}`).join(' · ');
}

// ─── Live sum-to-target line inside the edit modal ────────────────────────
function SumLine({ ui, parameters }) {
  const sum = ui.fields.reduce((s, f) => s + (Number(parameters[f.key]) || 0), 0);
  const ok = Math.abs(sum - ui.target) < (ui.unit === '%' ? 0.5 : 0.005);
  const fmt = (v) => (ui.unit === '%' ? `${Math.round(v)}%` : v.toFixed(ui.decimals));
  return (
    <div style={{
      fontSize: 12.5, fontWeight: 500, borderRadius: 8, padding: '8px 12px', marginTop: 4,
      background: ok ? C.greenBg : C.dangerBg, color: ok ? C.green : C.danger,
      border: `1px solid ${ok ? C.greenBorder : C.danger}`,
    }}>
      {ok ? '✓' : '✗'} Σ = {fmt(sum)} — weights must sum to {ui.unit === '%' ? '100%' : '1.00'} to save
    </div>
  );
}

// ─── View / Edit modal — real PATCH via marketplaceDisplayApi.js ──────────
function RuleModal({ rule, onClose, onSaved }) {
  const ui = UI_BY_CODE[rule.code] || { kind: 'fields', fields: [] };
  const [parameters, setParameters] = useState({ ...rule.parameters });
  const [enabled, setEnabled] = useState(rule.enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const setField = (key, value) => {
    setSaved(false);
    setParameters(p => ({ ...p, [key]: value === '' ? '' : Number(value) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await apiUpdateMarketplaceDisplayRule(rule.id, { enabled, parameters });
      setSaved(true);
      onSaved(updated);
    } catch (e) {
      setError(e.message || 'Could not save — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: F.headline, fontSize: 20, fontWeight: 500, color: C.primary, margin: '0 0 3px' }}>
              {rule.name}
            </h3>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.textTertiary }}>{rule.code}</span>
          </div>
          {rule.is_draft && <DraftPill />}
        </div>

        <p style={{ fontSize: 13, color: C.textSecondary, margin: '14px 0 0', lineHeight: 1.55 }}>{rule.description}</p>

        {rule.is_draft && rule.draft_note && (
          <div style={{ marginTop: 14, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 12, color: C.amberText, lineHeight: 1.5 }}>
            {rule.draft_note}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <span style={{ ...hintStyle, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary, marginTop: 0 }}>
            Parameters
          </span>

          {ui.kind === 'bucket' ? (
            <div style={{ marginTop: 8 }}>
              {ui.fields.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.neutral}`, fontSize: 13 }}>
                  <span style={{ color: C.textPrimary }}>{f.label}</span>
                  <input
                    type="number"
                    style={{ ...inputStyle, width: 90, textAlign: 'right' }}
                    value={parameters[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <p style={hintStyle}>Should stay in descending order (Top → No Priority Boost) so a promoted listing always outranks a lower tier.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 8 }}>
              {ui.fields.map(f => (
                <div key={f.key} style={{ background: C.neutral, borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ fontSize: 10, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{f.label}</div>
                  <input
                    type="number"
                    step="any"
                    style={inputStyle}
                    value={parameters[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  />
                  {f.help && <div style={hintStyle}>{f.help}</div>}
                </div>
              ))}
            </div>
          )}

          {ui.kind === 'weights' && <SumLine ui={ui} parameters={parameters} />}
        </div>

        {error && (
          <div style={{ marginTop: 12, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: C.danger }}>
            {error}
          </div>
        )}
        {saved && !error && (
          <div style={{ marginTop: 12, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: C.green }}>
            ✓ Saved
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <StatusPill enabled={enabled} onClick={() => { setSaved(false); setEnabled(v => !v); }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ ...btnCancel, height: 36 }}>Close</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...btnPrimary, height: 36, padding: '0 16px', opacity: saving ? 0.6 : 1, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Change log modal — real data from core.ActivityLog
// (module='MARKETPLACE_DISPLAY') ────────────────────────────────────────────
function ChangeLogModal({ onClose }) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiListMarketplaceDisplayChangeLog()
      .then(data => { if (!cancelled) setLogs(data); })
      .catch(e => { if (!cancelled) setError(e.message || 'Could not load the change log.'); });
    return () => { cancelled = true; };
  }, []);

  const describeChange = (log) => {
    const before = log.before_state || {};
    const after = log.after_state || {};
    const diffs = [];
    if (before.enabled !== after.enabled) diffs.push(`enabled: ${before.enabled} → ${after.enabled}`);
    const beforeParams = before.parameters || {};
    const afterParams = after.parameters || {};
    Object.keys(afterParams).forEach(k => {
      if (beforeParams[k] !== afterParams[k]) diffs.push(`${k}: ${beforeParams[k]} → ${afterParams[k]}`);
    });
    return diffs.length ? diffs.join(', ') : log.action;
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalBase, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontFamily: F.headline, fontSize: 20, fontWeight: 500, color: C.primary, margin: 0 }}>Change Log</h3>
        </div>
        <p style={{ ...hintStyle, marginBottom: 16 }}>
          Reads from the shared <code>un_activity_log</code> table (module <code>MARKETPLACE_DISPLAY</code>) — the same table Promotion Engine writes to.
        </p>

        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: C.danger, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {!error && logs === null && (
          <div style={{ padding: 30, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>Loading…</div>
        )}

        {!error && logs !== null && logs.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>No changes recorded yet.</div>
        )}

        {!error && logs && logs.length > 0 && (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 1fr 1fr', gap: 10, padding: '8px 14px', background: C.neutral }}>
              {['Rule', 'Change', 'By', 'When'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
              ))}
            </div>
            {logs.map((log, i) => (
              <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 1fr 1fr', gap: 10, padding: '9px 14px', fontSize: 12.5, color: C.textPrimary, background: i % 2 ? '#FAFBFC' : C.white, borderTop: `1px solid ${C.neutral}` }}>
                <span>{(log.after_state && log.after_state.name) || '—'}</span>
                <span style={{ color: C.textSecondary }}>{describeChange(log)}</span>
                <span style={{ color: C.textSecondary }}>{log.user_email || '—'}</span>
                <span style={{ color: C.textSecondary }}>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={btnCancel}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function MarketDisplayRules() {
  const [search, setSearch] = useState('');
  const [rules, setRules] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [viewingRule, setViewingRule] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiListMarketplaceDisplayRules()
      .then(data => { if (!cancelled) setRules(data); })
      .catch(e => { if (!cancelled) setLoadError(e.message || 'Could not load the rule catalog.'); });
    return () => { cancelled = true; };
  }, []);

  const handleSaved = (updatedRule) => {
    setRules(rs => rs.map(r => (r.id === updatedRule.id ? updatedRule : r)));
    setViewingRule(updatedRule);
  };

  const q = search.trim().toLowerCase();
  const filtered = (rules || []).filter(r =>
    !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
  );
  const groups = RULE_GROUPS
    .map(g => ({ ...g, rows: filtered.filter(r => r.group === g.id) }))
    .filter(g => g.rows.length > 0);

  return (
    <div style={{ padding: '28px 32px', fontFamily: F.body }}>
      {/* Heading — same padding as the Listings tab's own
          UNAdminListingReadiness.jsx wrapper, so the two tabs line up
          exactly. */}
      <h1 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 500, color: C.primary, margin: '10px 0 20px' }}>
        Marketplace Display Rules
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 14px', maxWidth: 760 }}>
        Every tunable the Marketplace Display ranking formula reads at runtime — recency, quality, fairness, quota mix and placement priority. Nothing here is hardcoded in the engine itself.
      </p>

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
        <button
          onClick={() => setHistoryOpen(true)}
          style={{ ...btnPrimary, height: 37, padding: '0 19px', marginLeft: 'auto' }}
        >
          <i className="ti ti-history" style={{ fontSize: 14 }} />
          View Change Log
        </button>
      </div>

      {loadError && (
        <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: C.danger, marginBottom: 18 }}>
          {loadError}
        </div>
      )}

      {!loadError && rules === null && (
        <div style={{ padding: 60, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>Loading…</div>
      )}

      {/* Rule groups */}
      {!loadError && rules !== null && (
        groups.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>
            No rules matching "{search}"
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} style={{ marginBottom: 20 }}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: C.neutral, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: C.textSecondary, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{group.label.toUpperCase()}</span>
                  <span>{group.rows.length} rule{group.rows.length !== 1 ? 's' : ''}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.3fr 100px 90px', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
                  {['Rule', 'What It Controls', 'Key Parameters', 'Status', 'Actions'].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSecondary }}>{h}</span>
                  ))}
                </div>

                {group.rows.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.3fr 100px 90px', gap: 12, padding: '11px 16px', borderBottom: `1px solid ${C.neutral}`, alignItems: 'center', background: idx % 2 === 1 ? '#FAFBFC' : C.white }}
                  >
                    <span style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 500, color: C.textPrimary }}>{item.name}</span>
                      {item.is_draft && <span style={{ marginLeft: 6 }}><DraftPill /></span>}
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.textTertiary, marginTop: 2 }}>{item.code}</div>
                    </span>
                    <span style={{ fontSize: 12, color: C.textTertiary, lineHeight: 1.4 }}>{item.description}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.textTertiary, lineHeight: 1.5 }}>{summarize(item)}</span>
                    <span><StatusPill enabled={item.enabled} /></span>
                    <span onClick={() => setViewingRule(item)} style={{ color: '#3D8EF0', fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}>View</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )
      )}

      <p style={{ fontSize: 11.5, fontStyle: 'italic', color: C.textTertiary, margin: '-6px 0 0' }}>
        No "Add Rule" — this is a fixed 7-code catalog, not an open builder like Listing Readiness's custom rules.
      </p>

      {viewingRule && <RuleModal rule={viewingRule} onClose={() => setViewingRule(null)} onSaved={handleSaved} />}
      {historyOpen && <ChangeLogModal onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}
