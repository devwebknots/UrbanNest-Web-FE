// ─────────────────────────────────────────────────────────────
// UrbanNest — PM Portal — Roles & Access — Assign Role Page
// Route:   /pm-portal/rbac/assign
// NavB activeId: 'rbac-assign'
// Path: src/pages/PMPortal/RBAC/PMAssignPage.jsx
//
// Layout — vertical split:
//   Left  (380px) — Step 1: member + role + node + scope + expiry
//   Right (flex)  — Step 2: permission overrides matrix
//
// API:
//   GET  /api/pm/rbac/roles/                    — role list for dropdown
//   GET  /api/pm/rbac/modules/                  — permission modules
//   POST /api/pm/rbac/members/assign/           — assign member
//   POST /api/pm/rbac/members/<id>/overrides/   — save overrides
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import UNPopup from '../../../components/common/UNPopup';
import PMTopBar from '../../../components/layout/PMTopBar';

const API = 'http://localhost:8001/api';

const C = {
  primary:     '#002D5B',
  white:       '#FFFFFF',
  pageBg:      '#F8FAFC',
  textPrimary: '#0F172A',
  textSec:     '#64748B',
  textTert:    '#94A3B8',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  success:     '#16A34A',
  danger:      '#DC2626',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const inputStyle = {
  height:      34,
  width:       '100%',
  padding:     '0 10px',
  border:      `0.5px solid ${C.border}`,
  borderRadius: 7,
  fontFamily:  F.body,
  fontSize:    12,
  color:       C.textPrimary,
  background:  '#F8FAFC',
  outline:     'none',
  boxSizing:   'border-box',
};

const labelStyle = {
  display:       'block',
  fontSize:      10,
  fontWeight:    700,
  color:         C.textSec,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom:  4,
  fontFamily:    F.body,
};

function OvrCheckbox({ checked, onChange, roleDefault }) {
  const bg     = roleDefault ? C.primary : checked ? '#DCFCE7' : C.white;
  const border = roleDefault ? C.primary : checked ? '#16A34A' : C.borderMed;
  const tick   = roleDefault ? '#fff' : '#16A34A';
  return (
    <div
      onClick={() => !roleDefault && onChange(!checked)}
      title={roleDefault ? 'Granted by role default — edit the role to change' : ''}
      style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${border}`, background: bg, cursor: roleDefault ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s', opacity: roleDefault ? 0.7 : 1 }}
    >
      {(checked || roleDefault) && (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5L4 7.5L8.5 2.5" stroke={tick} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function OverrideRow({ module, rolePerms, overrides, onOverrideChange, isParent, indent }) {
  const rolePerm     = rolePerms[module.ref_code]  || {};
  const overridePerm = overrides[module.ref_code]  || {};
  const handleChange = (field, value) => {
    const updated = { ...(overrides[module.ref_code] || {}), [field]: value };
    onOverrideChange(module.ref_code, updated, field, value);
  };
  const noAccessActive = !rolePerm.can_view && !rolePerm.can_add && !rolePerm.can_edit && !rolePerm.can_delete
                      && !overridePerm.can_view && !overridePerm.can_add && !overridePerm.can_edit && !overridePerm.can_delete;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 56px) 80px', alignItems: 'center', padding: `5px 10px`, paddingLeft: indent ? 28 : 10, borderBottom: `0.5px solid rgba(0,0,0,0.05)`, background: isParent ? '#F8FAFC' : C.white }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.body, fontSize: isParent ? 12 : 11, fontWeight: isParent ? 700 : 400, color: isParent ? C.textPrimary : C.textSec }}>
        {module.ref_value}
        {isParent && !rolePerm.can_view && !rolePerm.can_add && !rolePerm.can_edit && !rolePerm.can_delete && (
          <span style={{ fontSize: 9, background: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>No access by default</span>
        )}
      </div>
      {['can_view', 'can_add', 'can_edit', 'can_delete'].map(field => (
        <div key={field} style={{ display: 'flex', justifyContent: 'center' }}>
          <OvrCheckbox
            checked={overridePerm[field] || rolePerm[field] || false}
            roleDefault={rolePerm[field] || false}
            onChange={val => handleChange(field, val)}
          />
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {noAccessActive && (
          <div style={{ width: 14, height: 14, borderRadius: 3, background: '#DCFCE7', border: '1.5px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PMAssignPage() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('access_token');
  const headers  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [roles,        setRoles]        = useState([]);
  const [modules,      setModules]      = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePerms,    setRolePerms]    = useState({});
  const [overrides,    setOverrides]    = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [popup,        setPopup]        = useState(null);
  const [email,        setEmail]        = useState('');
  const [roleId,       setRoleId]       = useState('');
  const [nodeId,       setNodeId]       = useState('');
  const [scopeType,    setScopeType]    = useState('Node');
  const [expiresAt,    setExpiresAt]    = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/pm/rbac/roles/`,   { headers }).then(r => r.json()),
      fetch(`${API}/pm/rbac/modules/`, { headers }).then(r => r.json()),
    ]).then(([rolesData, modulesData]) => {
      setRoles(Array.isArray(rolesData) ? rolesData : (rolesData.results ?? []));
      setModules(modulesData);
    }).catch(() => {});
  }, []);

  function handleRoleChange(rid) {
    setRoleId(rid);
    setOverrides({});
    if (!rid) { setSelectedRole(null); setRolePerms({}); return; }
    const role = roles.find(r => String(r.id) === String(rid));
    if (!role) return;
    setSelectedRole(role);
    const map = {};
    (role.permissions || []).forEach(p => { map[p.module_code] = { can_view: p.can_view, can_add: p.can_add, can_edit: p.can_edit, can_delete: p.can_delete }; });
    setRolePerms(map);
  }

  function handleOverrideChange(moduleCode, perm, field, value) {
    setOverrides(prev => {
      const updated = { ...prev, [moduleCode]: perm };
      if (field && value !== undefined) {
        modules.filter(m => (m.parent_code?.replace('PARENT:', '') || '') === moduleCode)
          .forEach(child => { updated[child.ref_code] = { ...(updated[child.ref_code] || {}), [field]: value }; });
      }
      return updated;
    });
  }

  function resetForm() {
    setEmail(''); setRoleId(''); setNodeId('');
    setScopeType('Node'); setExpiresAt('');
    setSelectedRole(null); setRolePerms({}); setOverrides({});
  }

  async function handleAssign() {
    if (!email.trim()) { setPopup({ type: 'error', title: 'Email required', message: 'Please enter the team member\'s email address.' }); return; }
    if (!roleId)       { setPopup({ type: 'error', title: 'Role required',  message: 'Please select a role to assign.' }); return; }
    setSubmitting(true);
    try {
      const role = roles.find(r => String(r.id) === String(roleId));
      const assignRes = await fetch(`${API}/pm/rbac/members/assign/`, {
        method: 'POST', headers,
        body: JSON.stringify({ email: email.trim(), role: role.name, node_id: nodeId || null, scope_type: scopeType, expires_at: expiresAt || null }),
      });
      if (!assignRes.ok) { const e = await assignRes.json(); throw new Error(e.message || 'Assignment failed'); }
      const member = await assignRes.json();

      const overrideList = Object.entries(overrides)
        .filter(([, p]) => p.can_view || p.can_add || p.can_edit || p.can_delete)
        .map(([code, p]) => ({ module_code: code, can_view: p.can_view||false, can_add: p.can_add||false, can_edit: p.can_edit||false, can_delete: p.can_delete||false }));

      if (overrideList.length > 0) {
        await fetch(`${API}/pm/rbac/members/${member.id}/overrides/`, { method: 'POST', headers, body: JSON.stringify({ overrides: overrideList }) });
      }

      setPopup({ type: 'success', title: 'Role assigned', message: `${email.trim()} has been assigned the "${role.name}" role successfully.` });
      resetForm();
    } catch (e) {
      setPopup({ type: 'error', title: 'Assignment failed', message: e.message });
    } finally { setSubmitting(false); }
  }

  const tree = (() => {
    const parents  = modules.filter(m => !m.parent_code || m.parent_code === '');
    const children = modules.filter(m => m.parent_code && m.parent_code !== '');
    return parents.map(p => ({ ...p, children: children.filter(c => (c.parent_code?.replace('PARENT:', '') || '') === p.ref_code) }));
  })();

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.pageBg, fontFamily: F.body, overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <NavB activeId="rbac-assign" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <PMTopBar />

        <div style={{ padding: '16px 24px 0', background: C.pageBg, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.textTert, marginBottom: 4 }}>HR / Roles & Access</div>
          <h1 style={{ fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.primary, margin: '0 0 3px' }}>Roles & Access</h1>
          <p style={{ fontSize: 12, color: C.textSec, margin: '0 0 14px' }}>Assign roles to team members and grant individual permission overrides.</p>
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}` }}>
            {[{ label: 'Roles', route: '/pm-portal/rbac/roles', active: false }, { label: 'Assign role', route: '/pm-portal/rbac/assign', active: true }].map(tab => (
              <div key={tab.label} onClick={() => navigate(tab.route)} style={{ padding: '8px 20px', cursor: 'pointer', borderBottom: `2px solid ${tab.active ? C.primary : 'transparent'}`, marginBottom: -1, fontFamily: F.body, fontSize: 12, fontWeight: tab.active ? 700 : 500, color: tab.active ? C.primary : C.textSec, transition: 'all 0.15s' }}>
                {tab.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

          {/* LEFT — Form */}
          <div style={{ width: 380, flexShrink: 0, background: C.white, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px 0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingBottom: 8, borderBottom: `0.5px solid ${C.border}` }}>
                Step 1 — Member & role assignment
              </div>
            </div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>Team member email *</label>
                <div style={{ position: 'relative' }}>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address…" style={{ ...inputStyle, paddingLeft: 32 }} />
                  <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.textTert }} aria-hidden="true" />
                </div>
                <p style={{ fontSize: 10, color: C.textTert, margin: '3px 0 0', fontFamily: F.body }}>Must be an existing UrbanNest user</p>
              </div>
              <div>
                <label style={labelStyle}>Assign role *</label>
                <select value={roleId} onChange={e => handleRoleChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select a role…</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assign to node</label>
                <select value={nodeId} onChange={e => setNodeId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select org node… (optional)</option>
                </select>
                <p style={{ fontSize: 10, color: C.textTert, margin: '3px 0 0', fontFamily: F.body }}>Organisation nodes will appear here once created</p>
              </div>
              <div>
                <label style={labelStyle}>Scope</label>
                <select value={scopeType} onChange={e => setScopeType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="Node">Node (full node access)</option>
                  <option value="Property">Property (specific property only)</option>
                  <option value="Unit">Unit (specific unit only)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Expires <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inputStyle} />
                <p style={{ fontSize: 10, color: C.textTert, margin: '3px 0 0', fontFamily: F.body }}>Leave blank for no expiry</p>
              </div>
              <div>
                <label style={labelStyle}>Assigned by</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F1F5F9', color: C.textSec }}>
                  testuser35@urbannest.com (auto)
                </div>
              </div>
            </div>
            <div style={{ margin: '14px 16px 0', background: '#EFF6FF', border: `0.5px solid #BFDBFE`, borderRadius: 7, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <i className="ti ti-info-circle" style={{ fontSize: 13, color: '#2563EB', marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: '#1E40AF', lineHeight: 1.5, fontFamily: F.body }}>You can only grant permissions you currently hold. Granting access beyond your own level is not permitted.</span>
            </div>
            <div style={{ padding: '14px 16px 16px', marginTop: 'auto', borderTop: `0.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resetForm} style={{ flex: 1, height: 36, background: 'transparent', border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>Cancel</button>
                <button onClick={handleAssign} disabled={submitting} style={{ flex: 2, height: 36, background: submitting ? C.textTert : C.primary, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: C.white, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: F.body }}>
                  {submitting ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Assigning…</> : <><i className="ti ti-user-plus" style={{ fontSize: 13 }} aria-hidden="true" />Assign role</>}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — Overrides */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {!selectedRole ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, background: C.pageBg }}>
                <i className="ti ti-adjustments" style={{ fontSize: 36, color: C.borderMed }} aria-hidden="true" />
                <p style={{ fontSize: 13, color: C.textTert, fontFamily: F.body }}>Select a role to configure permission overrides</p>
                <p style={{ fontSize: 11, color: C.textTert, fontFamily: F.body }}>Optional — override specific permissions beyond role defaults</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 16px', borderBottom: `0.5px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                    Step 2 — Permission overrides <span style={{ fontWeight: 400, textTransform: 'none', color: C.textSec, marginLeft: 6 }}>Optional</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>
                    Grant <strong>{email || 'this member'}</strong> additional access beyond <strong>{selectedRole.name}</strong> defaults.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 56px) 80px', padding: '6px 10px', background: C.primary, flexShrink: 0 }}>
                  {['Section', 'View', 'Add', 'Edit', 'Delete', 'No access'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Section' ? 'left' : 'center', whiteSpace: 'nowrap' }}>{h}</div>
                  ))}
                </div>
                <div style={{ padding: '6px 12px', background: '#F8FAFC', borderBottom: `0.5px solid ${C.border}`, display: 'flex', gap: 16, flexShrink: 0 }}>
                  {[['#002D5B', C.primary, 'Role default (locked)'], ['#DCFCE7', '#16A34A', 'Override granted'], [C.white, C.borderMed, 'Available to grant']].map(([bg, border, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1.5px solid ${border}` }} />
                      <span style={{ fontSize: 10, color: C.textSec, fontFamily: F.body }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {tree.map(parent => (
                    <div key={parent.ref_code}>
                      <OverrideRow module={parent} rolePerms={rolePerms} overrides={overrides} onOverrideChange={handleOverrideChange} isParent={true} indent={false} />
                      {parent.children.map(child => (
                        <OverrideRow key={child.ref_code} module={child} rolePerms={rolePerms} overrides={overrides} onOverrideChange={handleOverrideChange} isParent={false} indent={true} />
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {popup && <UNPopup type={popup.type} title={popup.title} message={popup.message} onClose={() => setPopup(null)} onConfirm={popup.onConfirm} confirmLabel={popup.confirmLabel} />}
    </div>
  );
}
