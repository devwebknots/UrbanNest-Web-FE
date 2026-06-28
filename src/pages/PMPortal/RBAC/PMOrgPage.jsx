/**
 * NavB.jsx — PM Portal Left Navigation (Nav B)
 * Updated: Session 35 — member slide-in panel + member_count fix
 */

// ─────────────────────────────────────────────────────────────
// UrbanNest — PM Portal — HR — Organisation
// Route:   /pm-portal/rbac/org
// NavB activeId: 'rbac-org'
// Path: src/pages/PMPortal/RBAC/PMOrgPage.jsx
//
// Layout:
//   Left  (flex)   — org tree canvas
//   Right (300px)  — selected node detail panel
//   Slide-in       — member detail (appears over right panel)
//
// API:
//   GET    /api/pm/rbac/nodes/              — all nodes
//   POST   /api/pm/rbac/nodes/              — create node
//   PATCH  /api/pm/rbac/nodes/<id>/         — update node
//   DELETE /api/pm/rbac/nodes/<id>/         — delete node
//   GET    /api/pm/rbac/members/?node=<id>  — members at node
//   GET    /api/pm/rbac/members/<id>/       — member detail + effective perms
//   POST   /api/pm/rbac/members/assign/     — assign member to node
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import UNPopup from '../../../components/common/UNPopup';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

const C = {
  primary:     '#002D5B',
  white:       '#FFFFFF',
  pageBg:      '#F1F5F9',
  textPrimary: '#0F172A',
  textSec:     '#64748B',
  textTert:    '#94A3B8',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  success:     '#16A34A',
  danger:      '#DC2626',
  amber:       '#D97706',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const LEVEL_COLORS = [
  { bg: '#002D5B', border: '#002D5B', text: '#fff',    icon: '#fff'    },
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3', icon: '#3730A3' },
  { bg: '#FEF9C3', border: '#FDE68A', text: '#92400E', icon: '#92400E' },
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: '#166534' },
  { bg: '#FEF3C7', border: '#FCD34D', text: '#B45309', icon: '#B45309' },
];

function getLevelColor(level) {
  return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
}

// ─── Member Slide-in Panel ────────────────────────────────────
function MemberSlideIn({ memberId, onClose, onViewFull, token }) {
  const [member,  setMember]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    setMember(null);
    fetch(`${API}/pm/rbac/members/${memberId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setMember(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [memberId, token]);

  const initials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const fullName = member?.user
    ? `${member.user.first_name} ${member.user.last_name}`.trim() || member.email
    : member?.email || '—';

  // Only show modules where member has at least one permission
  const activePerms = (member?.effective_permissions || []).filter(p =>
    p.role_can_view || p.role_can_add || p.role_can_edit || p.role_can_delete ||
    p.override_can_view || p.override_can_add || p.override_can_edit || p.override_can_delete
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.25)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 380, zIndex: 301,
        background: C.white,
        borderLeft: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>
            Member detail
          </div>
          <button
            onClick={onViewFull}
            title="View in Team Members"
            style={{ height: 26, padding: '0 10px', background: '#EEF2FF', border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, color: '#3730A3', cursor: 'pointer', fontFamily: F.body }}
          >
            View full profile →
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTert, fontSize: 16, display: 'flex', padding: 4 }}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.body }}>Loading…</span>
          </div>
        ) : !member ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: C.textTert, fontFamily: F.body }}>Failed to load member</span>
          </div>
        ) : (
          <>
            {/* Identity */}
            <div style={{ padding: '16px', borderBottom: `0.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: C.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: C.white, flexShrink: 0,
                }}>
                  {initials(fullName)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.body }}>{fullName}</div>
                  <div style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{member.email}</div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                  padding: '3px 8px', borderRadius: 99,
                  background: member.is_active ? '#F0FDF4' : '#F1F5F9',
                  color: member.is_active ? C.success : C.textSec,
                  flexShrink: 0,
                }}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                {[
                  { label: 'Role',     value: member.role || '—' },
                  { label: 'Node',     value: member.node_name || '—' },
                  { label: 'Invited by', value: member.assigned_by_name || '—' },
                  { label: 'Since',    value: member.assigned_at ? new Date(member.assigned_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2, fontFamily: F.body }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div style={{ padding: '12px 16px', flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, fontFamily: F.body }}>
                Effective permissions
              </div>

              {activePerms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <i className="ti ti-lock-off" style={{ fontSize: 24, color: C.borderMed }} aria-hidden="true" />
                  <p style={{ fontSize: 11, color: C.textTert, margin: '6px 0 0', fontFamily: F.body }}>No permissions assigned</p>
                </div>
              ) : (
                <>
                  {activePerms.map(p => {
                    const hasOverride = p.override_can_view || p.override_can_add || p.override_can_edit || p.override_can_delete;
                    return (
                      <div key={p.module_code} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 0',
                        borderBottom: `0.5px solid rgba(0,0,0,0.04)`,
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>
                            {p.module_code.replace(/_/g, ' ')}
                          </span>
                          {hasOverride && (
                            <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: '#F0FDF4', color: C.success }}>
                              +override
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[
                            { key: 'view',   label: 'V', role: p.role_can_view,   ov: p.override_can_view },
                            { key: 'add',    label: 'A', role: p.role_can_add,    ov: p.override_can_add },
                            { key: 'edit',   label: 'E', role: p.role_can_edit,   ov: p.override_can_edit },
                            { key: 'delete', label: 'D', role: p.role_can_delete, ov: p.override_can_delete },
                          ].map(({ key, label, role, ov }) => {
                            const active = role || ov;
                            const isOverride = !role && ov;
                            return (
                              <div key={key} title={`${label === 'V' ? 'View' : label === 'A' ? 'Add' : label === 'E' ? 'Edit' : 'Delete'}${isOverride ? ' (override)' : role ? ' (role)' : ''}`} style={{
                                width: 18, height: 18, borderRadius: 4,
                                background: !active ? '#F1F5F9' : isOverride ? '#F0FDF4' : '#EFF6FF',
                                border: `0.5px solid ${!active ? C.border : isOverride ? '#BBF7D0' : '#BFDBFE'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, fontWeight: 700,
                                color: !active ? C.textTert : isOverride ? C.success : '#1D4ED8',
                              }}>
                                {active ? label : '—'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    {[
                      { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', label: 'From role' },
                      { bg: '#F0FDF4', border: '#BBF7D0', color: C.success,  label: 'Override' },
                    ].map(({ bg, border, color, label }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `0.5px solid ${border}` }} />
                        <span style={{ fontSize: 9, color: C.textSec, fontFamily: F.body }}>{label}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 9, color: C.textTert, fontFamily: F.body }}>V=View A=Add E=Edit D=Delete</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Add/Edit Node Modal ──────────────────────────────────────
function NodeModal({ mode, parentNode, editNode, nodes, onSave, onCancel, saving }) {
  const [nodeName,   setNodeName]   = useState(editNode?.node_name   || '');
  const [layerName,  setLayerName]  = useState(editNode?.layer_name  || '');
  const [branchCode, setBranchCode] = useState(editNode?.branch_code || '');
  const [country,    setCountry]    = useState(editNode?.country      || 'US');

  const title = mode === 'edit' ? 'Edit node' : parentNode ? `Add child node under ${parentNode.node_name}` : 'Add root node';

  const inputSt = { height: 32, width: '100%', padding: '0 10px', border: `0.5px solid ${C.border}`, borderRadius: 6, fontFamily: F.body, fontSize: 12, color: C.textPrimary, background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' };
  const labelSt = { display: 'block', fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: F.body };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: 12, overflow: 'hidden', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ background: C.primary, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-home" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 13, fontWeight: 700, color: '#fff' }}>Urban<span style={{ color: '#60A5FA' }}>Nest</span></span>
          <button onClick={onCancel} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 16, display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div style={{ padding: '20px 20px 16px' }}>
          <h3 style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: '0 0 4px' }}>{title}</h3>
          {parentNode && mode !== 'edit' && (
            <p style={{ fontSize: 11, color: C.textSec, margin: '0 0 16px', fontFamily: F.body }}>
              This node will be placed under <strong>{parentNode.node_name}</strong> at level {(parentNode.level || 0) + 1}.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelSt}>Node name *</label>
              <input value={nodeName} onChange={e => setNodeName(e.target.value)} placeholder="e.g. East Region, New York City" style={inputSt} autoFocus />
            </div>
            <div>
              <label style={labelSt}>Layer name *</label>
              <input value={layerName} onChange={e => setLayerName(e.target.value)} placeholder="e.g. Regional, City, District" style={inputSt} />
              <p style={{ fontSize: 10, color: C.textTert, margin: '3px 0 0', fontFamily: F.body }}>Describes this level of the hierarchy</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelSt}>Branch code</label>
                <input value={branchCode} onChange={e => setBranchCode(e.target.value.toUpperCase())} placeholder="e.g. EAST, NYC" style={inputSt} maxLength={10} />
              </div>
              <div>
                <label style={labelSt}>Country</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="US" style={inputSt} maxLength={2} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: `0.5px solid ${C.border}` }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 16px', background: 'transparent', border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>Cancel</button>
          <button
            onClick={() => onSave({ node_name: nodeName, layer_name: layerName, branch_code: branchCode, country })}
            disabled={!nodeName.trim() || !layerName.trim() || saving}
            style={{ height: 32, padding: '0 20px', background: !nodeName.trim() || !layerName.trim() ? C.textTert : C.primary, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: C.white, cursor: !nodeName.trim() || !layerName.trim() ? 'not-allowed' : 'pointer', fontFamily: F.body, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</> : mode === 'edit' ? 'Save changes' : 'Add node'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Member Modal ──────────────────────────────────────
function AssignMemberModal({ node, roles, onAssign, onCancel, saving }) {
  const [email,     setEmail]     = useState('');
  const [roleId,    setRoleId]    = useState('');
  const [scopeType, setScopeType] = useState('Node');
  const [expiresAt, setExpiresAt] = useState('');

  const inputSt = { height: 32, width: '100%', padding: '0 10px', border: `0.5px solid ${C.border}`, borderRadius: 6, fontFamily: F.body, fontSize: 12, color: C.textPrimary, background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' };
  const labelSt = { display: 'block', fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: F.body };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: 12, overflow: 'hidden', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ background: C.primary, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-home" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 13, fontWeight: 700, color: '#fff' }}>Urban<span style={{ color: '#60A5FA' }}>Nest</span></span>
          <button onClick={onCancel} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 16, display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div style={{ padding: '20px 20px 16px' }}>
          <h3 style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: '0 0 4px' }}>Add member to node</h3>
          <p style={{ fontSize: 11, color: C.textSec, margin: '0 0 16px', fontFamily: F.body }}>
            Adding to <strong>{node?.node_name}</strong> ({node?.layer_name})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelSt}>Team member email *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" style={inputSt} autoFocus />
              <p style={{ fontSize: 10, color: C.textTert, margin: '3px 0 0', fontFamily: F.body }}>Must be an existing UrbanNest user</p>
            </div>
            <div>
              <label style={labelSt}>Assign role *</label>
              <select value={roleId} onChange={e => setRoleId(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="">Select a role…</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Scope</label>
              <select value={scopeType} onChange={e => setScopeType(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="Node">Node (full node access)</option>
                <option value="Property">Property (specific property only)</option>
                <option value="Unit">Unit (specific unit only)</option>
              </select>
            </div>
            <div>
              <label style={labelSt}>Expires <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inputSt} />
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: `0.5px solid ${C.border}` }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 16px', background: 'transparent', border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>Cancel</button>
          <button
            onClick={() => onAssign({ email, role_id: roleId, scope_type: scopeType, expires_at: expiresAt || null })}
            disabled={!email.trim() || !roleId || saving}
            style={{ height: 32, padding: '0 20px', background: !email.trim() || !roleId ? C.textTert : C.primary, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: C.white, cursor: !email.trim() || !roleId ? 'not-allowed' : 'pointer', fontFamily: F.body, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Assigning…</> : <><i className="ti ti-user-plus" style={{ fontSize: 12 }} aria-hidden="true" />Add member</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Node Card ────────────────────────────────────────────────
function NodeCard({ node, isSelected, isRoot, onSelect, onAddChild, onEdit, onDelete }) {
  const lc = getLevelColor(node.level || 0);
  return (
    <div
      onClick={() => onSelect(node)}
      style={{
        background:   isRoot ? C.primary : lc.bg,
        border:       `${isSelected ? '2px' : '0.5px'} solid ${isSelected ? '#60A5FA' : lc.border}`,
        borderRadius: 10,
        padding:      '10px 12px',
        cursor:       'pointer',
        position:     'relative',
        transition:   'all 0.15s',
        boxShadow:    isSelected ? '0 0 0 3px rgba(96,165,250,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
        minWidth:     isRoot ? 220 : 190,
      }}
    >
      {/* Action buttons */}
      <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onAddChild(node)} title="Add child node" style={{ width: 22, height: 22, background: isRoot ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-plus" style={{ fontSize: 11, color: isRoot ? '#fff' : lc.text }} aria-hidden="true" />
        </button>
        {!isRoot && (
          <>
            <button onClick={() => onEdit(node)} title="Edit node" style={{ width: 22, height: 22, background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-pencil" style={{ fontSize: 11, color: lc.text }} aria-hidden="true" />
            </button>
            <button onClick={() => onDelete(node)} title="Delete node" style={{ width: 22, height: 22, background: '#FEF2F2', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-trash" style={{ fontSize: 11, color: C.danger }} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Node icon + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingRight: 72 }}>
        <div style={{ width: isRoot ? 28 : 24, height: isRoot ? 28 : 24, borderRadius: 6, background: isRoot ? 'rgba(255,255,255,0.15)' : lc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${isRoot ? 'ti-building-skyscraper' : node.level === 1 ? 'ti-map-pin' : 'ti-city'}`} style={{ fontSize: isRoot ? 14 : 12, color: isRoot ? '#fff' : lc.text }} aria-hidden="true" />
        </div>
        <div>
          <div style={{ fontSize: isRoot ? 13 : 12, fontWeight: 700, color: isRoot ? '#fff' : lc.text, lineHeight: 1.2 }}>{node.node_name}</div>
          <div style={{ fontSize: 10, color: isRoot ? 'rgba(255,255,255,0.6)' : C.textTert }}>{node.layer_name} · Level {node.level}</div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: isRoot ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)', color: isRoot ? '#fff' : lc.text }}>
          {node.hierarchy_id}
        </span>
        {node.branch_code && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: isRoot ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)', color: isRoot ? 'rgba(255,255,255,0.8)' : C.textSec }}>
            {node.branch_code}
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 6, borderTop: `0.5px solid ${isRoot ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}` }}>
        <div style={{ fontSize: 10, color: isRoot ? 'rgba(255,255,255,0.6)' : C.textTert }}>
          <span style={{ fontWeight: 700, color: isRoot ? '#fff' : C.textPrimary }}>{node.member_count || 0}</span> members
        </div>
        <div style={{ fontSize: 10, color: isRoot ? 'rgba(255,255,255,0.6)' : C.textTert }}>
          <span style={{ fontWeight: 700, color: isRoot ? '#fff' : C.textPrimary }}>{node.property_count || 0}</span> properties
        </div>
      </div>
    </div>
  );
}

// ─── Tree Renderer ────────────────────────────────────────────
function TreeLevel({ nodes, parentId, allNodes, selectedNode, onSelect, onAddChild, onEdit, onDelete }) {
  const levelNodes = parentId === null
    ? allNodes.filter(n => !n.parent)
    : allNodes.filter(n => String(n.parent) === String(parentId));

  if (levelNodes.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', justifyContent: 'center' }}>
      {levelNodes.map(node => (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <NodeCard
            node={node}
            isSelected={selectedNode?.id === node.id}
            isRoot={!node.parent}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {allNodes.some(n => String(n.parent) === String(node.id)) && (
            <>
              <div style={{ width: 1.5, height: 24, background: C.borderMed }} />
              <TreeLevel
                nodes={allNodes}
                parentId={node.id}
                allNodes={allNodes}
                selectedNode={selectedNode}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function PMOrgPage() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('access_token');
  const headers  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [nodes,        setNodes]        = useState([]);
  const [roles,        setRoles]        = useState([]);
  const [members,      setMembers]      = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [popup,        setPopup]        = useState(null);
  const [modal,        setModal]        = useState(null);
  const [slideInId,    setSlideInId]    = useState(null); // ← NEW: member slide-in

  const fetchNodes = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/pm/rbac/nodes/`, { headers });
      const data = await res.json();
      setNodes(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/pm/rbac/roles/`, { headers });
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : (data.results ?? []));
    } catch (_) {}
  }, []);

  const fetchMembers = useCallback(async (nodeId) => {
    try {
      const res  = await fetch(`${API}/pm/rbac/members/?node=${nodeId}`, { headers });
      const data = await res.json();
      setMembers(data.results ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchNodes(), fetchRoles()]).finally(() => setLoading(false));
  }, []);

  function handleSelectNode(node) {
    setSelectedNode(node);
    setSlideInId(null); // close any open slide-in when switching nodes
    fetchMembers(node.id);
  }

  // ── Create / edit node ─────────────────────────────────────
  async function handleSaveNode(data) {
    setSaving(true);
    try {
      const isEdit  = modal.type === 'edit';
      const parent  = modal.parent;
      const payload = {
        ...data,
        parent_id: isEdit ? modal.node.parent : (parent?.id || null),
        level:     isEdit ? modal.node.level  : (parent ? (parent.level || 0) + 1 : 0),
      };

      const url    = isEdit ? `${API}/pm/rbac/nodes/${modal.node.id}/` : `${API}/pm/rbac/nodes/`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to save node'); }

      await fetchNodes();
      setModal(null);
      setPopup({ type: 'success', title: isEdit ? 'Node updated' : 'Node created', message: `"${data.node_name}" has been ${isEdit ? 'updated' : 'added to the organisation'}.` });
    } catch (e) {
      setPopup({ type: 'error', title: 'Failed', message: e.message });
    } finally { setSaving(false); }
  }

  // ── Delete node ────────────────────────────────────────────
  function handleDeleteNode(node) {
    setPopup({
      type:         'warning',
      title:        'Delete node',
      message:      `Are you sure you want to delete "${node.node_name}"? All child nodes and member assignments will also be removed.`,
      confirmLabel: 'Yes, delete',
      onConfirm:    async () => {
        setPopup(null);
        try {
          const res = await fetch(`${API}/pm/rbac/nodes/${node.id}/`, { method: 'DELETE', headers });
          if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Delete failed'); }
          await fetchNodes();
          if (selectedNode?.id === node.id) setSelectedNode(null);
          setPopup({ type: 'success', title: 'Node deleted', message: `"${node.node_name}" has been removed.` });
        } catch (e) {
          setPopup({ type: 'error', title: 'Cannot delete', message: e.message });
        }
      },
    });
  }

  // ── Assign member ──────────────────────────────────────────
  async function handleAssignMember(data) {
    setSaving(true);
    try {
      const role = roles.find(r => String(r.id) === String(data.role_id));
      const res  = await fetch(`${API}/pm/rbac/members/assign/`, {
        method: 'POST', headers,
        body: JSON.stringify({
          email:      data.email,
          role:       role?.name,
          node_id:    modal.node.id,
          scope_type: data.scope_type,
          expires_at: data.expires_at,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Assignment failed'); }
      await fetchMembers(modal.node.id);
      await fetchNodes(); // refresh member_count on cards
      setModal(null);
      setPopup({ type: 'success', title: 'Member added', message: `${data.email} has been added to ${modal.node.node_name}.` });
    } catch (e) {
      setPopup({ type: 'error', title: 'Assignment failed', message: e.message });
    } finally { setSaving(false); }
  }

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.pageBg, fontFamily: F.body, overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <NavB activeId="rbac-org" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: 52, background: C.white, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0 }}>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-bell" style={{ fontSize: 18, color: C.textSec }} aria-hidden="true" />
            <span style={{ fontSize: 12, color: C.textSec }}>PM User</span>
          </div>
        </div>

        {/* Page heading */}
        <div style={{ padding: '16px 24px 12px', background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: C.textTert, marginBottom: 4 }}>HR / Organisation</div>
            <h1 style={{ fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.primary, margin: '0 0 3px' }}>Organisation</h1>
            <p style={{ fontSize: 12, color: C.textSec, margin: 0 }}>Build your organisational hierarchy. Click any node to view details and manage members.</p>
          </div>
          <button
            onClick={() => setModal({ type: 'add', parent: null })}
            style={{ height: 32, padding: '0 14px', background: C.primary, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" />Add node
          </button>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

          {/* Tree canvas */}
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: 24 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: 13, color: C.textSec }}>Loading organisation…</span>
              </div>
            ) : nodes.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                <i className="ti ti-sitemap" style={{ fontSize: 40, color: C.borderMed }} aria-hidden="true" />
                <p style={{ fontSize: 13, color: C.textTert }}>No organisation nodes yet</p>
                <button onClick={() => setModal({ type: 'add', parent: null })} style={{ height: 32, padding: '0 16px', background: C.primary, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: C.white, cursor: 'pointer' }}>
                  Create root node
                </button>
              </div>
            ) : (
              <div style={{ minWidth: 'fit-content', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TreeLevel
                  nodes={nodes}
                  parentId={null}
                  allNodes={nodes}
                  selectedNode={selectedNode}
                  onSelect={handleSelectNode}
                  onAddChild={node => setModal({ type: 'add', parent: node })}
                  onEdit={node => setModal({ type: 'edit', node })}
                  onDelete={handleDeleteNode}
                />
              </div>
            )}

            {/* Legend */}
            {nodes.length > 0 && (
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                {[
                  { bg: C.primary,  border: C.primary,  label: 'Root (HQ)' },
                  { bg: '#EEF2FF',  border: '#C7D2FE',  label: 'Level 1' },
                  { bg: '#FEF9C3',  border: '#FDE68A',  label: 'Level 2' },
                  { bg: '#F0FDF4',  border: '#BBF7D0',  label: 'Level 3+' },
                ].map(({ bg, border, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `0.5px solid ${border}` }} />
                    <span style={{ fontSize: 10, color: C.textSec, fontFamily: F.body }}>{label}</span>
                  </div>
                ))}
                <span style={{ fontSize: 10, color: C.textTert, fontFamily: F.body }}>· Click any node to view details</span>
              </div>
            )}
          </div>

          {/* Right detail panel */}
          {selectedNode && (
            <div style={{ width: 300, flexShrink: 0, background: C.white, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

              {/* Node header */}
              <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Selected node</div>
                  <button onClick={() => { setSelectedNode(null); setSlideInId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTert, fontSize: 14, display: 'flex' }}>
                    <i className="ti ti-x" aria-hidden="true" />
                  </button>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{selectedNode.node_name}</div>
                <div style={{ fontSize: 11, color: C.textSec }}>{selectedNode.layer_name} · Level {selectedNode.level}</div>
              </div>

              {/* Node details */}
              <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Node details</div>
                {[
                  { label: 'Hierarchy ID', value: selectedNode.hierarchy_id },
                  { label: 'Layer',        value: selectedNode.layer_name },
                  { label: 'Branch code',  value: selectedNode.branch_code || '—' },
                  { label: 'Country',      value: selectedNode.country || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `0.5px solid rgba(0,0,0,0.04)` }}>
                    <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Members */}
              <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Members</div>
                  <button
                    onClick={() => setModal({ type: 'assign', node: selectedNode })}
                    style={{ height: 24, padding: '0 8px', background: C.primary, border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <i className="ti ti-plus" style={{ fontSize: 10 }} aria-hidden="true" />Add
                  </button>
                </div>

                {members.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <i className="ti ti-users" style={{ fontSize: 24, color: C.borderMed }} aria-hidden="true" />
                    <p style={{ fontSize: 11, color: C.textTert, margin: '6px 0 0', fontFamily: F.body }}>No members yet</p>
                  </div>
                ) : members.map(m => {
                  const name = m.user
                    ? `${m.user.first_name} ${m.user.last_name}`.trim() || m.email
                    : m.email;
                  const isActive = m.is_active;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSlideInId(m.id)} // ← NEW: open slide-in on click
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px',
                        background: slideInId === m.id ? '#EEF2FF' : '#F8FAFC',
                        borderRadius: 7,
                        border: `0.5px solid ${slideInId === m.id ? '#C7D2FE' : C.border}`,
                        marginBottom: 6,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { if (slideInId !== m.id) e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={e => { if (slideInId !== m.id) e.currentTarget.style.background = '#F8FAFC'; }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: C.white, flexShrink: 0 }}>
                        {initials(name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: 10, color: C.textSec }}>{m.role}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: isActive ? '#F0FDF4' : '#F1F5F9', color: isActive ? C.success : C.textSec }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                        <i className="ti ti-chevron-right" style={{ fontSize: 10, color: C.textTert }} aria-hidden="true" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setModal({ type: 'edit', node: selectedNode })}
                    style={{ flex: 1, height: 30, background: 'transparent', border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 11, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: F.body }}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: 12 }} aria-hidden="true" />Edit
                  </button>
                  <button
                    onClick={() => handleDeleteNode(selectedNode)}
                    style={{ flex: 1, height: 30, background: '#FEF2F2', border: `0.5px solid #FECACA`, borderRadius: 6, fontSize: 11, color: C.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: F.body }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 12 }} aria-hidden="true" />Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Member slide-in panel ── */}
      {slideInId && (
        <MemberSlideIn
          memberId={slideInId}
          token={token}
          onClose={() => setSlideInId(null)}
          onViewFull={() => navigate('/pm-portal/rbac/members', { state: { memberId: slideInId } })}
        />
      )}

      {/* Node modal */}
      {modal && modal.type !== 'assign' && (
        <NodeModal
          mode={modal.type}
          parentNode={modal.parent}
          editNode={modal.node}
          nodes={nodes}
          onSave={handleSaveNode}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Assign member modal */}
      {modal && modal.type === 'assign' && (
        <AssignMemberModal
          node={modal.node}
          roles={roles}
          onAssign={handleAssignMember}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* System popup */}
      {popup && (
        <UNPopup
          type={popup.type}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={popup.onConfirm}
          confirmLabel={popup.confirmLabel}
        />
      )}
    </div>
  );
}
