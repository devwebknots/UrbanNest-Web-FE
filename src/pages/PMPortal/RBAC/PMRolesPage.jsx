// ─────────────────────────────────────────────────────────────
// UrbanNest — PM Portal — Roles & Access — Roles Page
// Route:   /pm-portal/rbac/roles
// NavB activeId: 'rbac-roles'
// Path: src/pages/PMPortal/RBAC/PMRolesPage.jsx
//
// Layout:
//   Left panel  (240px) — role list + add role button
//   Right panel (flex)  — permission matrix for selected role
//
// API:
//   GET    /api/pm/rbac/modules/          — permission modules from UNReference
//   GET    /api/pm/rbac/roles/            — all roles for this account
//   POST   /api/pm/rbac/roles/            — create role
//   PATCH  /api/pm/rbac/roles/<id>/       — update role + permissions
//   DELETE /api/pm/rbac/roles/<id>/       — delete role
//   POST   /api/pm/rbac/roles/<id>/duplicate/ — duplicate role
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import UNPopup from '../../../components/common/UNPopup';

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

// ─── Checkbox ─────────────────────────────────────────────────
function Checkbox({ checked, onChange, locked }) {
  return (
    <div
      onClick={() => !locked && onChange(!checked)}
      style={{
        width:          14,
        height:         14,
        borderRadius:   3,
        border: `1.5px solid ${checked ? '#29bc5f' : C.borderMed}`,
        background:     checked ? '#29bc5f' : C.white,
        cursor:         locked ? 'not-allowed' : 'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        opacity:        locked ? 0.6 : 1,
        transition:     'all 0.1s',
      }}
    >
      {checked && (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

// ─── Permission Matrix Row ─────────────────────────────────────
function MatrixRow({ module, permissions, onChange, isParent, indent, locked }) {
  const perm = permissions[module.ref_code] || {
    can_view: false, can_add: false, can_edit: false, can_delete: false
  };

  const handleChange = (field, value) => {
    const updated = { ...perm, [field]: value };
    const anyGranted = updated.can_view || updated.can_add || updated.can_edit || updated.can_delete;
    updated.no_access = !anyGranted;
    onChange(module.ref_code, updated, field, value);
  };
  
  const noAccess = !perm.can_view && !perm.can_add && !perm.can_edit && !perm.can_delete;

  return (
    <div style={{
      display:       'grid',
      gridTemplateColumns: '1fr repeat(4, 56px) 80px',
      alignItems:    'center',
      padding:       `5px ${indent ? '10px 5px 28px' : '10px'}`,
      borderBottom:  `0.5px solid rgba(0,0,0,0.05)`,
      background:    isParent ? '#F8FAFC' : C.white,
      paddingLeft:   indent ? 28 : 10,
    }}>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        6,
        fontFamily: F.body,
        fontSize:   isParent ? 13 : 12,
        fontWeight: isParent ? 700 : 400,
        color:      isParent ? C.textPrimary : C.textSec,
      }}>
        {isParent && module.icon && (
          <i className={`ti ${module.icon}`} style={{ fontSize: 13, color: C.primary }} aria-hidden="true" />
        )}
        {module.ref_value}
      </div>
      {['can_view', 'can_add', 'can_edit', 'can_delete'].map(field => (
        <div key={field} style={{ display: 'flex', justifyContent: 'center' }}>
          <Checkbox
            checked={perm[field] || false}
            onChange={val => handleChange(field, val)}
            locked={locked}
          />
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Checkbox
          checked={noAccess}
          locked={locked}
          onChange={val => {
            if (val) {
              onChange(module.ref_code, { can_view: false, can_add: false, can_edit: false, can_delete: false, no_access: true }, null, null);
            }
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function PMRolesPage() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('access_token');
  const headers  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [modules,      setModules]      = useState([]);
  const [roles,        setRoles]        = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions,  setPermissions]  = useState({});
  const [roleName,     setRoleName]     = useState('');
  const [roleDesc,     setRoleDesc]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [isNew,        setIsNew]        = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [popup,        setPopup]        = useState(null);

  // ── Fetch modules ──────────────────────────────────────────
  const fetchModules = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/pm/rbac/modules/`, { headers });
      const data = await res.json();
      setModules(data);
    } catch (_) {}
  }, []);

  // ── Fetch roles ────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/pm/rbac/roles/`, { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setRoles(list);
      if (list.length > 0) {
        // Re-select current role or default to first
        const current = selectedRole ? list.find(r => r.id === selectedRole.id) : null;
        selectRole(current || list[0]);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchModules();
    fetchRoles();
  }, []);

  // ── Select role ────────────────────────────────────────────
  function selectRole(role) {
    setSelectedRole(role);
    setEditMode(false);
    setIsNew(false);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    // Build permissions map
    const map = {};
    (role.permissions || []).forEach(p => {
      map[p.module_code] = {
        can_view:   p.can_view,
        can_add:    p.can_add,
        can_edit:   p.can_edit,
        can_delete: p.can_delete,
        no_access:  p.no_access,
      };
    });
    setPermissions(map);
  }

  // ── New role ───────────────────────────────────────────────
  function handleNewRole() {
    setSelectedRole(null);
    setIsNew(true);
    setRoleName('');
    setRoleDesc('');
    setPermissions({});
  }

  // ── Permission change ──────────────────────────────────────
  function handlePermissionChange(moduleCode, perm, field, value) {
    setPermissions(prev => {
      const updated = { ...prev, [moduleCode]: perm };

      // If a parent module changed, cascade to all children
      if (field && value !== undefined) {
        const children = modules.filter(m => {
          const pc = m.parent_code?.replace('PARENT:', '') || '';
          return pc === moduleCode;
        });
        children.forEach(child => {
          const childPerm = { ...(updated[child.ref_code] || { can_view: false, can_add: false, can_edit: false, can_delete: false }) };
          childPerm[field] = value;
          const anyGranted = childPerm.can_view || childPerm.can_add || childPerm.can_edit || childPerm.can_delete;
          childPerm.no_access = !anyGranted;
          updated[child.ref_code] = childPerm;
        });
      }

      return updated;
    });
  }
  

  // ── Build permissions payload ──────────────────────────────
  function buildPermissionsPayload() {
    return modules.map(m => ({
      module_code: m.ref_code,
      can_view:    permissions[m.ref_code]?.can_view   || false,
      can_add:     permissions[m.ref_code]?.can_add    || false,
      can_edit:    permissions[m.ref_code]?.can_edit   || false,
      can_delete:  permissions[m.ref_code]?.can_delete || false,
      no_access:   !(
        permissions[m.ref_code]?.can_view   ||
        permissions[m.ref_code]?.can_add    ||
        permissions[m.ref_code]?.can_edit   ||
        permissions[m.ref_code]?.can_delete
      ),
    }));
  }

  // ── Save role ──────────────────────────────────────────────
  async function handleSave() {
    if (!roleName.trim()) {
      setPopup({ type: 'error', title: 'Role name required', message: 'Please enter a name for this role before saving.' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name:        roleName.trim(),
        description: roleDesc.trim(),
        permissions: buildPermissionsPayload(),
      };

      let res;
      if (isNew) {
        res = await fetch(`${API}/pm/rbac/roles/`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/pm/rbac/roles/${selectedRole.id}/`, {
          method: 'PATCH', headers, body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save role');
      }

      const data = await res.json();
      setEditMode(false);
      setIsNew(false);
      setSelectedRole(data);
      setRoleName(data.name);
      setRoleDesc(data.description || '');
      const map = {};
      (data.permissions || []).forEach(p => {
        map[p.module_code] = {
          can_view: p.can_view, can_add: p.can_add,
          can_edit: p.can_edit, can_delete: p.can_delete, no_access: p.no_access,
        };
      });
      setPermissions(map);
      await fetchRoles();
      setPopup({ type: 'success', title: 'Role saved', message: `"${data.name}" has been saved successfully.` });
    } finally {
      setSaving(false);
    }
  }

  // ── Duplicate role ─────────────────────────────────────────
  async function handleDuplicate() {
    try {
      const res = await fetch(`${API}/pm/rbac/roles/${selectedRole.id}/duplicate/`, {
        method: 'POST', headers,
      });
      if (!res.ok) throw new Error('Duplication failed');
      const duped = await res.json();
      await fetchRoles();
      selectRole(duped);
      setPopup({ type: 'success', title: 'Role duplicated', message: `"${duped.name}" created as a copy.` });
    } catch (e) {
      setPopup({ type: 'error', title: 'Error', message: e.message });
    }
  }

  // ── Delete role ────────────────────────────────────────────
  function handleDelete() {
    setPopup({
      type:         'warning',
      title:        'Delete role',
      message:      `Are you sure you want to delete "${selectedRole?.name}"? This cannot be undone. All members must be reassigned first.`,
      confirmLabel: 'Yes, delete',
      onConfirm:    async () => {
        setPopup(null);
        try {
          const res = await fetch(`${API}/pm/rbac/roles/${selectedRole.id}/`, {
            method: 'DELETE', headers,
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Delete failed');
          }
          await fetchRoles();
          setSelectedRole(null);
          setIsNew(false);
        } catch (e) {
          setPopup({ type: 'error', title: 'Cannot delete', message: e.message });
        }
      },
    });
  }

  // ── Build tree structure from flat modules list ────────────
  function buildTree() {
    const parents  = modules.filter(m => !m.parent_code || m.parent_code === '');
    const children = modules.filter(m => m.parent_code && m.parent_code !== '');
    return parents.map(p => ({
      ...p,
      children: children.filter(c => {
        const pc = c.parent_code?.replace('PARENT:', '') || '';
        return pc === p.ref_code;
      }),
    }));
  }

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const tree = buildTree();

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.pageBg, fontFamily: F.body, overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <NavB activeId="rbac-roles" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: 52, background: C.white, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.borderMed}`, borderRadius: 7, padding: '0 10px', height: 32, background: '#F8FAFC', flex: 1, maxWidth: 300 }}>
            <i className="ti ti-search" style={{ fontSize: 13, color: C.textTert }} aria-hidden="true" />
            <input style={{ border: 'none', background: 'transparent', fontSize: 12, color: C.textPrimary, outline: 'none', width: '100%', fontFamily: F.body }} placeholder="Search..." />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-bell" style={{ fontSize: 18, color: C.textSec }} aria-hidden="true" />
            <span style={{ fontSize: 12, color: C.textSec }}>PM User</span>
          </div>
        </div>

        {/* Page heading */}
        <div style={{ padding: '16px 24px 0', background: C.pageBg, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.textTert, marginBottom: 4 }}>HR / Roles & Access</div>
          <h1 style={{ fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.primary, margin: '0 0 3px' }}>Roles & Access</h1>
          <p style={{ fontSize: 12, color: C.textSec, margin: '0 0 14px' }}>Define roles and control what each role can see and do across all sections.</p>

          {/* Tab strip */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}` }}>
            {[
              { label: 'Roles',        route: '/pm-portal/rbac/roles',   active: true  },
              { label: 'Assign role',  route: '/pm-portal/rbac/assign',  active: false },
            ].map(tab => (
              <div
                key={tab.label}
                onClick={() => navigate(tab.route)}
                style={{
                  padding:      '8px 20px',
                  cursor:       'pointer',
                  borderBottom: `2px solid ${tab.active ? C.primary : 'transparent'}`,
                  marginBottom: -1,
                  fontFamily:   F.body,
                  fontSize:     12,
                  fontWeight:   tab.active ? 700 : 500,
                  color:        tab.active ? C.primary : C.textSec,
                  transition:   'all 0.15s',
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>

        {/* Main content — split */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

          {/* ── LEFT PANEL — Role list ── */}
          <div style={{ width: 240, flexShrink: 0, background: C.white, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>

            {/* Search */}
            <div style={{ padding: 10, borderBottom: `0.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, background: '#F8FAFC', border: `0.5px solid ${C.border}`, borderRadius: 6, padding: '0 9px' }}>
                <i className="ti ti-search" style={{ fontSize: 11, color: C.textTert }} aria-hidden="true" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search roles…"
                  style={{ border: 'none', background: 'transparent', fontSize: 11, color: C.textPrimary, outline: 'none', width: '100%', fontFamily: F.body }}
                />
              </div>
            </div>

            {/* Role list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
                </div>
              ) : filteredRoles.length === 0 ? (
                <div style={{ padding: 20, fontSize: 11, color: C.textTert, textAlign: 'center' }}>No roles found</div>
              ) : filteredRoles.map(role => {
                const isSelected = selectedRole?.id === role.id && !isNew;
                return (
                  <div
                    key={role.id}
                    onClick={() => selectRole(role)}
                    style={{
                      padding:     '9px 10px',
                      borderBottom: `0.5px solid rgba(0,0,0,0.05)`,
                      cursor:      'pointer',
                      display:     'flex',
                      alignItems:  'center',
                      gap:         7,
                      borderLeft:  `3px solid ${isSelected ? C.primary : 'transparent'}`,
                      background:  isSelected ? '#EEF2FF' : 'transparent',
                      transition:  'all 0.1s',
                    }}
                  >
                    <i className="ti ti-shield-check" style={{ fontSize: 13, color: isSelected ? C.primary : C.textTert }} aria-hidden="true" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isSelected ? C.primary : C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {role.name}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, background: isSelected ? '#E0E7FF' : '#F1F5F9', color: isSelected ? '#3730A3' : C.textSec, padding: '1px 6px', borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>
                      {role.member_count || 0}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Add role button */}
            <div style={{ padding: 10, borderTop: `0.5px solid ${C.border}` }}>
              <button
                onClick={handleNewRole}
                style={{ width: '100%', height: 32, background: C.primary, border: 'none', borderRadius: 6, color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
                Add role
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL — Permission matrix ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {!selectedRole && !isNew ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                <i className="ti ti-shield-check" style={{ fontSize: 36, color: C.borderMed }} aria-hidden="true" />
                <p style={{ fontSize: 13, color: C.textTert }}>Select a role to view permissions</p>
              </div>
            ) : (
              <>
                {/* Role header */}
                <div style={{ padding: '10px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: C.white }}>
                  <div style={{ flex: 1 }}>
                    {isNew ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          value={roleName}
                          onChange={e => setRoleName(e.target.value)}
                          placeholder="Role name e.g. Regional Manager"
                          autoFocus
                          style={{ height: 32, padding: '0 10px', border: `1px solid ${C.primary}`, borderRadius: 6, fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary, outline: 'none', minWidth: 240 }}
                        />
                        <input
                          value={roleDesc}
                          onChange={e => setRoleDesc(e.target.value)}
                          placeholder="Description (optional)"
                          style={{ height: 32, padding: '0 10px', border: `0.5px solid ${C.border}`, borderRadius: 6, fontFamily: F.body, fontSize: 12, color: C.textSec, outline: 'none', flex: 1 }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{selectedRole?.name}</div>
                        <div style={{ fontSize: 10, color: C.textSec }}>
                          {selectedRole?.member_count || 0} member{selectedRole?.member_count !== 1 ? 's' : ''} · Permissions loaded from Reference Data
                        </div>
                      </div>
                    )}
                  </div>
                  {!isNew && (
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                        onClick={() => setEditMode(true)}
                        title="Edit role"
                        style={{ width: 32, height: 32, background: 'transparent', border: `0.5px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                        <i className="ti ti-pencil" style={{ fontSize: 15, color: C.textSec }} aria-hidden="true" />
                        </button>
                        <button
                        onClick={handleDuplicate}
                        title="Duplicate role"
                        style={{ width: 32, height: 32, background: 'transparent', border: `0.5px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                        <i className="ti ti-copy" style={{ fontSize: 15, color: C.textSec }} aria-hidden="true" />
                        </button>
                        <button
                        onClick={handleDelete}
                        title="Delete role"
                        style={{ width: 32, height: 32, background: '#FEF2F2', border: `0.5px solid #FECACA`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                        <i className="ti ti-trash" style={{ fontSize: 15, color: C.danger }} aria-hidden="true" />
                        </button>
                    </div>
                  )}
                </div>

                {/* Matrix header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 56px) 80px', padding: '6px 10px', background: C.primary, flexShrink: 0 }}>
                  {['Section', 'View', 'Add', 'Edit', 'Delete', 'No access'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Section' ? 'left' : 'center', whiteSpace: 'nowrap' }}>
                      {h}
                    </div>
                  ))}
                </div>

                {/* Matrix body */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {tree.map(parent => (
                    <div key={parent.ref_code}>
                      <MatrixRow
                        module={parent}
                        permissions={permissions}
                        onChange={handlePermissionChange}
                        isParent={true}
                        indent={false}
                        locked={!editMode && !isNew}
                      />
                      {parent.children.map(child => (
                        <MatrixRow
                          key={child.ref_code}
                          module={child}
                          permissions={permissions}
                          onChange={handlePermissionChange}
                          isParent={false}
                          indent={true}
                          locked={!editMode && !isNew}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Footer — only in edit or new mode */}
                {(editMode || isNew) && (
                <div style={{ padding: '10px 16px', borderTop: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, background: '#F8FAFC', flexShrink: 0 }}>
                    <button
                    onClick={() => { setEditMode(false); selectRole(selectedRole); }}
                    style={{ height: 32, padding: '0 16px', background: 'transparent', border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.textSec, cursor: 'pointer' }}
                    >
                    Cancel
                    </button>
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ height: 32, padding: '0 20px', background: saving ? C.textTert : C.primary, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: C.white, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                    {saving ? (
                        <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</>
                    ) : 'Save role'}
                    </button>
                </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
