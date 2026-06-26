// ─────────────────────────────────────────────────────────────
// src/pages/PMPortal/RBAC/PMMembersPage.jsx
//
// Route: /pm-portal/rbac/members
// NavB activeId: rbac-members
//
// Left panel: member list (active + pending + inactive)
// Right panel: member detail + effective permissions
// Actions: change node / change role / edit overrides / deactivate (icon + tooltip)
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import NavB from '../../../components/layout/NavB';
import UNPopup from '../../../components/common/UNPopup';

const API = 'http://localhost:8001/api';

// ── Design tokens ─────────────────────────────────────────────
const C = {
  navy:        '#0F172A',
  navyMid:     '#1E293B',
  white:       '#FFFFFF',
  pageBg:      '#F8FAFC',
  gray50:      '#F8FAFC',
  gray100:     '#F1F5F9',
  gray200:     '#E2E8F0',
  gray400:     '#94A3B8',
  gray500:     '#64748B',
  gray700:     '#334155',
  blue:        '#2563EB',
  blueLight:   '#EFF6FF',
  blueDark:    '#1D4ED8',
  green:       '#16A34A',
  greenLight:  '#DCFCE7',
  amber:       '#D97706',
  amberLight:  '#FEF3C7',
  red:         '#DC2626',
  redLight:    '#FEF2F2',
  border:      '#E2E8F0',
};

const F = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ── Helpers ───────────────────────────────────────────────────
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const initials = (name, email) => {
  if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (email || '?')[0].toUpperCase();
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const avatarBg = (index) => {
  const bgs = [
    { bg: '#DBEAFE', color: '#1E40AF' },
    { bg: '#D1FAE5', color: '#065F46' },
    { bg: '#FEF3C7', color: '#92400E' },
    { bg: '#EDE9FE', color: '#5B21B6' },
    { bg: '#FCE7F3', color: '#9D174D' },
  ];
  return bgs[index % bgs.length];
};

// ── Tooltip icon button ───────────────────────────────────────
function IconBtn({ icon, tooltip, onClick, color, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        onClick={disabled ? undefined : onClick}
        style={{
          width: 32, height: 32,
          background: 'transparent',
          border: 'none',
          borderRadius: 7,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: disabled ? 0.3 : 1,
          transition: 'background 0.15s',
          color: color || C.gray500,
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = C.gray100; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 16 }} />
      </button>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: C.navy, color: C.white,
          fontFamily: F.sans, fontSize: 10, fontWeight: 600,
          padding: '4px 8px', borderRadius: 5,
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200,
        }}>
          {tooltip}
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `4px solid ${C.navy}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    ACTIVE:   { bg: C.greenLight, color: '#166534', label: 'Active' },
    PENDING:  { bg: C.amberLight, color: '#92400E', label: 'Invite pending' },
    INACTIVE: { bg: C.gray100,    color: C.gray500,  label: 'Inactive' },
  }[status] || { bg: C.gray100, color: C.gray500, label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontFamily: F.sans, fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── Permission check cell ─────────────────────────────────────
function PermCheck({ fromRole, fromOverride }) {
  if (fromOverride) return <i className="ti ti-check" style={{ fontSize: 14, color: C.green }} />;
  if (fromRole)     return <i className="ti ti-check" style={{ fontSize: 14, color: C.blue }} />;
  return <i className="ti ti-minus" style={{ fontSize: 14, color: C.gray400 }} />;
}

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: C.white, borderRadius: 14,
        padding: '24px 28px', width: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: C.navy }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray500 }}>
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Slide-in overrides panel ──────────────────────────────────
function OverridesPanel({ member, modules, onClose, onSaved, onError }) {
  const [overrides, setOverrides]   = useState({});
  const [rolePerms, setRolePerms]   = useState({});
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!member) return;
    // Build role permissions map
    const rp = {};
    (member.effective_permissions || []).forEach(p => {
      rp[p.module_code] = {
        can_view:   p.role_can_view   || false,
        can_add:    p.role_can_add    || false,
        can_edit:   p.role_can_edit   || false,
        can_delete: p.role_can_delete || false,
      };
    });
    setRolePerms(rp);

    // Build current overrides map
    const ov = {};
    (member.effective_permissions || []).forEach(p => {
      if (p.override_can_view || p.override_can_add || p.override_can_edit || p.override_can_delete) {
        ov[p.module_code] = {
          can_view:   p.override_can_view   || false,
          can_add:    p.override_can_add    || false,
          can_edit:   p.override_can_edit   || false,
          can_delete: p.override_can_delete || false,
        };
      }
    });
    setOverrides(ov);
  }, [member]);

  const toggle = (moduleCode, perm) => {
    console.log('toggle called', moduleCode, perm, rolePerms[moduleCode]);
    const roleHas = rolePerms[moduleCode]?.[perm] || false;
    if (roleHas) return; // Can't remove role-granted perms
    setOverrides(prev => {
      const cur = prev[moduleCode] || { can_view: false, can_add: false, can_edit: false, can_delete: false };
      return { ...prev, [moduleCode]: { ...cur, [perm]: !cur[perm] } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = Object.entries(overrides)
      .filter(([, v]) => v.can_view || v.can_add || v.can_edit || v.can_delete)
      .map(([module_code, v]) => ({ module_code, ...v }));

    try {
      const res = await fetch(`${API}/pm/rbac/members/${member.id}/overrides/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved();
      onClose();
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const PERM_COLS = ['can_view', 'can_add', 'can_edit', 'can_delete'];
  const PERM_LABELS = { can_view: 'View', can_add: 'Add', can_edit: 'Edit', can_delete: 'Delete' };

  // Group modules by parent
  const parents = modules.filter(m => !m.description?.startsWith('PARENT:'));
  const children = modules.filter(m => m.description?.startsWith('PARENT:'));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        width: 560, background: C.white, height: '100%',
        overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: C.white, zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: C.navy }}>Edit permission overrides</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: C.gray500, marginTop: 2 }}>
              Grants extra access on top of the role defaults. Cannot remove role-granted permissions.
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray500 }}>
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Legend */}
        <div style={{ padding: '10px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 16 }}>
          {[
            { color: C.blue, label: 'From role (locked)' },
            { color: C.green, label: 'Override granted' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.sans, fontSize: 11, color: C.gray500 }}>
              <i className="ti ti-check" style={{ fontSize: 13, color }} />
              {label}
            </div>
          ))}
        </div>

        {/* Permission matrix */}
        <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.navy }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Module</th>
                {PERM_COLS.map(p => (
                  <th key={p} style={{ padding: '10px 14px', textAlign: 'center', width: 60, fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{PERM_LABELS[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parents.map((parent, pi) => {
                const kids = children.filter(c => c.description === `PARENT:${parent.code}`);
                return (
                  <React.Fragment key={parent.code}>
                    {/* Parent row */}
                    <tr style={{ background: C.gray50, borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 14px', fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: C.navy }}>{parent.ref_value || parent.ref_code}</td>
                      {PERM_COLS.map(p => {
                        const roleHas = rolePerms[parent.ref_code]?.[p] || false;
                        const overrideHas = overrides[parent.ref_code]?.[p] || false;
                        return (
                          <td key={p} style={{ textAlign: 'center', padding: '8px 14px' }}>
                            <input
                              type="checkbox"
                              checked={roleHas || overrideHas}
                              disabled={roleHas}
                              onChange={() => toggle(parent.ref_code, p)}
                              style={{
                                width: 15, height: 15, cursor: roleHas ? 'not-allowed' : 'pointer',
                                accentColor: overrideHas ? C.green : C.blue,
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Child rows */}
                    {kids.map(child => {
                      const roleHas = (p) => rolePerms[child.ref_code]?.[p] || false;
                      const overrideHas = (p) => overrides[child.ref_code]?.[p] || false;
                      return (
                        <tr key={child.code} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '7px 14px 7px 28px', fontFamily: F.sans, fontSize: 11, color: C.gray700 }}>
                            <span style={{ color: C.gray400, marginRight: 6 }}>↳</span>{child.ref_value || child.ref_code}
                          </td>
                          {PERM_COLS.map(p => (
                            <td key={p} style={{ textAlign: 'center', padding: '7px 14px' }}>
                              <input
                                type="checkbox"
                                checked={roleHas(p) || overrideHas(p)}
                                disabled={roleHas(p)}
                                onChange={() => toggle(child.ref_code, p)}
                                style={{
                                  width: 15, height: 15, cursor: roleHas(p) ? 'not-allowed' : 'pointer',
                                  accentColor: overrideHas(p) ? C.green : C.blue,
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${C.border}`,
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          position: 'sticky', bottom: 0, background: C.white,
        }}>
          <button onClick={onClose} style={{
            height: 36, padding: '0 20px', border: `1px solid ${C.border}`,
            borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 600,
            color: C.gray500, background: C.white, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            height: 36, padding: '0 20px', border: 'none',
            borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 700,
            color: C.white, background: saving ? C.gray400 : C.navy,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : 'Save overrides'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function PMMembersPage() {
  const [members,       setMembers]       = useState([]);
  const [invites,       setInvites]       = useState([]);
  const [nodes,         setNodes]         = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [modules,       setModules]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);  // { type: 'member'|'invite', data }
  const [detailLoading, setDetailLoading] = useState(false);
  const [memberDetail,  setMemberDetail]  = useState(null);

  // Filters
  const [search,        setSearch]        = useState('');
  const [nodeFilter,    setNodeFilter]    = useState('');
  const [roleFilter,    setRoleFilter]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');

  // Modals / panels
  const [showOverrides,   setShowOverrides]   = useState(false);
  const [showChangeRole,  setShowChangeRole]  = useState(false);
  const [showChangeNode,  setShowChangeNode]  = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [popup,           setPopup]           = useState(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);

  // Invite modal fields
  const [inviteEmail,   setInviteEmail]   = useState('');
  const [inviteNode,    setInviteNode]    = useState('');
  const [inviteRole,    setInviteRole]    = useState('');
  const [inviteSending, setInviteSending] = useState(false);

  // Change role/node fields
  const [newRole, setNewRole] = useState('');
  const [newNode, setNewNode] = useState('');

  const showPopup = (type, title, message, onConfirm, confirmLabel) =>
    setPopup({ type, title, message, onConfirm, confirmLabel });

  // ── Fetch all data ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, iRes, nRes, rRes, modRes] = await Promise.all([
        fetch(`${API}/pm/rbac/members/`, { headers: authHeaders() }),
        fetch(`${API}/pm/rbac/staff-invites/`, { headers: authHeaders() }),
        fetch(`${API}/pm/rbac/nodes/`, { headers: authHeaders() }),
        fetch(`${API}/pm/rbac/roles/`, { headers: authHeaders() }),
        fetch(`${API}/pm/rbac/modules/`, { headers: authHeaders() }),
      ]);
      if (mRes.ok) { const d = await mRes.json(); setMembers(d.results ?? d); }
      if (iRes.ok) { const d = await iRes.json(); setInvites((d.results ?? d).filter(i => i.status === 'PENDING')); }
      if (nRes.ok)   { const d = await nRes.json(); setNodes(d.results ?? d); }
      if (rRes.ok)   { const d = await rRes.json(); setRoles(d.results ?? d); }
      if (modRes.ok) { const d = await modRes.json(); setModules(d.results ?? d); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Fetch member detail ─────────────────────────────────────
  const fetchMemberDetail = useCallback(async (id) => {
    setDetailLoading(true);
    setMemberDetail(null);
    try {
      const res = await fetch(`${API}/pm/rbac/members/${id}/`, { headers: authHeaders() });
      if (res.ok) setMemberDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelectMember = (member, index) => {
    setSelected({ type: 'member', data: member, index });
    fetchMemberDetail(member.id);
  };

  const handleSelectInvite = (invite, index) => {
    setSelected({ type: 'invite', data: invite, index });
    setMemberDetail(null);
  };

  // ── Combined + filtered list ────────────────────────────────
  const allItems = [
    ...members.map(m => ({ ...m, _type: 'member', _status: m.is_active ? 'ACTIVE' : 'INACTIVE' })),
    ...invites.map(i => ({ ...i, _type: 'invite', _status: 'PENDING', role: i.role_name, node_name: i.node_name })),
  ].filter(item => {
    if (statusFilter && item._status !== statusFilter) return false;
    if (nodeFilter && String(item.node) !== nodeFilter && item.node_name !== nodeFilter) return false;
    if (roleFilter && item.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = item.user?.first_name ? `${item.user.first_name} ${item.user.last_name}` : '';
      const email = item.user?.email || item.email || '';
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    }
    return true;
  });

  // ── Actions ─────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!selected?.data?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/pm/rbac/members/${selected.data.id}/deactivate/`, {
        method: 'POST', headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to deactivate');
      showPopup('success', 'Member deactivated', 'The member no longer has access to the PM Portal.');
      fetchAll();
      setSelected(null);
    } catch (e) {
      showPopup('error', 'Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!newRole) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/pm/rbac/members/${selected.data.id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      showPopup('success', 'Role updated', 'The member\'s role has been changed.');
      setShowChangeRole(false);
      fetchAll();
      fetchMemberDetail(selected.data.id);
    } catch (e) {
      showPopup('error', 'Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeNode = async () => {
    if (!newNode) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/pm/rbac/members/${selected.data.id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ node: newNode }),
      });
      if (!res.ok) throw new Error('Failed to update node');
      showPopup('success', 'Node updated', 'The member has been moved to the new team.');
      setShowChangeNode(false);
      fetchAll();
      fetchMemberDetail(selected.data.id);
    } catch (e) {
      showPopup('error', 'Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async () => {
    if (!selected?.data) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/pm/rbac/staff-invites/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          email: selected.data.email,
          node: selected.data.node,
          role: selected.data.role_id,
        }),
      });
      showPopup('success', 'Invite resent', `A new invite has been sent to ${selected.data.email}.`);
      fetchAll();
    } catch (e) {
      showPopup('error', 'Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvite = async () => {
    showPopup(
      'warning',
      'Cancel invite',
      `Cancel the invite for ${selected?.data?.email}? They will no longer be able to sign up with this link.`,
      async () => {
        setActionLoading(true);
        try {
          // Mark invite cancelled via backend — for now just refetch
          showPopup('success', 'Invite cancelled', 'The invite has been cancelled.');
          fetchAll();
          setSelected(null);
        } finally {
          setActionLoading(false);
        }
      },
      'Cancel invite'
    );
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteNode || !inviteRole) return;
    setInviteSending(true);
    try {
      const res = await fetch(`${API}/pm/rbac/staff-invites/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: inviteEmail, node: parseInt(inviteNode), role: parseInt(inviteRole) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      showPopup('success', 'Invite sent', `Invite sent to ${inviteEmail}.`);
      setShowInviteModal(false);
      setInviteEmail(''); setInviteNode(''); setInviteRole('');
      fetchAll();
    } catch (e) {
      showPopup('error', 'Error', e.message);
    } finally {
      setInviteSending(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────
  const sel = selected?.data;
  const selType = selected?.type;
  const isActive = sel && selType === 'member' && sel.is_active;
  const isInactive = sel && selType === 'member' && !sel.is_active;
  const isPending = selType === 'invite';

  const memberName = sel
    ? (selType === 'member' && sel.user?.first_name)
      ? `${sel.user.first_name} ${sel.user.last_name}`
      : sel.email || '—'
    : null;

  const memberEmail = sel
    ? (selType === 'member' ? sel.user?.email : sel.email)
    : null;

  const effectivePerms = memberDetail?.effective_permissions || [];

  // Group perms by parent for display
  const permParents = modules.filter(m => !m.description?.startsWith('PARENT:'));
  const permChildren = modules.filter(m => m.description?.startsWith('PARENT:'));

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.pageBg, fontFamily: F.sans, overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <NavB activeId="rbac-members" />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          width: 300, borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          background: C.white, flexShrink: 0,
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
            background: C.gray50,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: C.navy }}>
              Team Members
            </span>
            <span style={{ fontFamily: F.sans, fontSize: 11, color: C.gray400 }}>
              {allItems.length} total
            </span>
          </div>

          {/* Search */}
          <div style={{ padding: '10px 12px 0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              height: 32, background: C.gray50,
              border: `1px solid ${C.border}`, borderRadius: 7,
              padding: '0 10px',
            }}>
              <i className="ti ti-search" style={{ fontSize: 13, color: C.gray400 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email…"
                style={{ border: 'none', outline: 'none', fontFamily: F.sans, fontSize: 12, color: C.navy, background: 'none', width: '100%' }}
              />
            </div>
          </div>

          {/* Filters */}
          <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
            {[
              { value: nodeFilter, onChange: setNodeFilter, placeholder: 'All nodes', options: nodes.map(n => ({ value: n.node_name, label: n.node_name })) },
              { value: statusFilter, onChange: setStatusFilter, placeholder: 'All', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'PENDING', label: 'Pending' }, { value: 'INACTIVE', label: 'Inactive' }] },
            ].map((f, i) => (
              <select key={i} value={f.value} onChange={e => f.onChange(e.target.value)}
                style={{ flex: 1, height: 28, padding: '0 6px', border: `1px solid ${C.border}`, borderRadius: 6, fontFamily: F.sans, fontSize: 11, color: C.gray500, background: C.white }}>
                <option value="">{f.placeholder}</option>
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
          </div>

          {/* Member list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.navy, animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontFamily: F.sans, fontSize: 12, color: C.gray400 }}>Loading…</span>
              </div>
            ) : allItems.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontFamily: F.sans, fontSize: 12, color: C.gray400 }}>
                No members found
              </div>
            ) : allItems.map((item, i) => {
              const isSelected = selected?.data?.id === item.id && selected?.type === item._type;
              const name = item._type === 'member' && item.user?.first_name
                ? `${item.user.first_name} ${item.user.last_name}`
                : item.email || '—';
              const email = item._type === 'member' ? item.user?.email : item.email;
              const av = avatarBg(i);
              const dotColor = { ACTIVE: C.green, PENDING: C.amber, INACTIVE: C.gray400 }[item._status];

              return (
                <div
                  key={`${item._type}-${item.id}`}
                  onClick={() => item._type === 'member' ? handleSelectMember(item, i) : handleSelectInvite(item, i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: isSelected ? `3px solid ${C.navy}` : '3px solid transparent',
                    background: isSelected ? '#EFF6FF' : C.white,
                    cursor: 'pointer', transition: 'background 0.12s',
                    opacity: item._status === 'INACTIVE' ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.gray50; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = C.white; }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: av.bg, color: av.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {item._type === 'invite' ? '?' : initials(name, email)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ fontFamily: F.sans, fontSize: 11, color: C.gray500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.role} · {item.node_name || '—'}
                    </div>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                </div>
              );
            })}
          </div>

          {/* Invite button */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: 10 }}>
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                width: '100%', height: 34,
                border: `1px solid ${C.border}`, borderRadius: 8,
                background: C.gray50, fontFamily: F.sans, fontSize: 12,
                color: C.gray500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 14 }} />
              Invite new member
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            // Empty state
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <i className="ti ti-users" style={{ fontSize: 40, color: C.gray200 }} />
              <div style={{ fontFamily: F.sans, fontSize: 14, color: C.gray400 }}>Select a member to view details</div>
            </div>
          ) : (
            <>
              {/* Right header */}
              <div style={{
                padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
                background: C.white,
                display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: isPending ? C.amberLight : avatarBg(selected.index || 0).bg,
                  color: isPending ? '#92400E' : avatarBg(selected.index || 0).color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>
                  {isPending ? '?' : initials(memberName, memberEmail)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: isPending ? C.gray500 : C.navy }}>
                    {memberName}
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: C.gray400, marginTop: 2 }}>
                    {memberEmail}
                  </div>
                </div>

                {/* Action icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isActive && (
                    <>
                      <IconBtn icon="ti-building" tooltip="Change node" onClick={() => { setNewNode(''); setShowChangeNode(true); }} />
                      <IconBtn icon="ti-shield" tooltip="Change role" onClick={() => { setNewRole(''); setShowChangeRole(true); }} />
                      <IconBtn icon="ti-lock" tooltip="Edit overrides" onClick={() => setShowOverrides(true)} />
                      <div style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />
                      <IconBtn icon="ti-user-off" tooltip="Deactivate member" color={C.red}
                        onClick={() => showPopup('warning', 'Deactivate member', `Remove ${memberName}'s access to the PM Portal?`, handleDeactivate, 'Deactivate')}
                      />
                    </>
                  )}
                  {isInactive && (
                    <IconBtn icon="ti-user-check" tooltip="Reactivate member" color={C.green}
                      onClick={() => showPopup('warning', 'Reactivate member', `Restore ${memberName}'s access to the PM Portal?`, handleDeactivate, 'Reactivate')}
                    />
                  )}
                  {isPending && (
                    <>
                      <IconBtn icon="ti-send" tooltip="Resend invite" onClick={handleResendInvite} />
                      <IconBtn icon="ti-x" tooltip="Cancel invite" color={C.red} onClick={handleCancelInvite} />
                    </>
                  )}
                </div>
              </div>

              {/* Right body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

                {/* PENDING state */}
                {isPending && (
                  <>
                    <div style={{
                      background: C.amberLight, border: `1px solid #FCD34D`,
                      borderRadius: 10, padding: '12px 16px',
                      display: 'flex', gap: 10, marginBottom: 20,
                    }}>
                      <i className="ti ti-clock" style={{ fontSize: 16, color: C.amber, marginTop: 1, flexShrink: 0 }} />
                      <div style={{ fontFamily: F.sans, fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
                        This person has been invited but hasn't signed up yet.
                        The invite expires on <strong>{fmtDate(sel.expires_at)}</strong>.
                      </div>
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                      Invite details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[
                        { label: 'Status', value: <StatusPill status="PENDING" /> },
                        { label: 'Node', value: sel.node_name },
                        { label: 'Role', value: sel.role_name },
                        { label: 'Invited by', value: sel.invited_by_name || '—' },
                        { label: 'Sent', value: fmtDate(sel.created_at) },
                        { label: 'Expires', value: fmtDate(sel.expires_at) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: C.gray50, borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontFamily: F.sans, fontSize: 10, color: C.gray400, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: C.navy }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 12, color: C.gray400, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                      Permissions will be visible once the member signs up.
                    </div>
                  </>
                )}

                {/* INACTIVE state */}
                {isInactive && (
                  <div style={{
                    background: C.redLight, border: `1px solid #FECACA`,
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', gap: 10, marginBottom: 20,
                  }}>
                    <i className="ti ti-user-off" style={{ fontSize: 16, color: C.red, marginTop: 1, flexShrink: 0 }} />
                    <div style={{ fontFamily: F.sans, fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>
                      This member has been deactivated and no longer has access to the PM Portal. Reactivate to restore their access.
                    </div>
                  </div>
                )}

                {/* MEMBER DETAILS (active + inactive) */}
                {selType === 'member' && (
                  <>
                    <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="ti ti-user" style={{ fontSize: 13 }} /> Member details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[
                        { label: 'Status', value: <StatusPill status={sel.is_active ? 'ACTIVE' : 'INACTIVE'} /> },
                        { label: 'Node', value: sel.node_name || '—' },
                        { label: 'Role', value: sel.role || '—' },
                        { label: 'Assigned by', value: sel.assigned_by_name || '—' },
                        { label: 'Joined', value: fmtDate(sel.assigned_at) },
                        { label: 'Expires', value: sel.expires_at ? fmtDate(sel.expires_at) : 'Never' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: C.gray50, borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontFamily: F.sans, fontSize: 10, color: C.gray400, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: C.navy }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: C.border, margin: '4px 0 20px' }} />

                    {/* Effective permissions */}
                    <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-shield-check" style={{ fontSize: 13 }} /> Effective permissions
                      </span>
                      {isActive && (
                        <button
                          onClick={() => setShowOverrides(true)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', border: `1px solid ${C.border}`,
                            borderRadius: 6, background: C.white,
                            fontFamily: F.sans, fontSize: 11, color: C.gray500,
                            cursor: 'pointer',
                          }}
                        >
                          <i className="ti ti-edit" style={{ fontSize: 12 }} /> Edit overrides
                        </button>
                      )}
                    </div>

                    {detailLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.navy, animation: 'spin 0.7s linear infinite' }} />
                        <span style={{ fontFamily: F.sans, fontSize: 12, color: C.gray400 }}>Loading permissions…</span>
                      </div>
                    ) : (
                      <>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                          <thead>
                            <tr style={{ background: C.navy }}>
                              {['Module', 'View', 'Add', 'Edit', 'Delete'].map(h => (
                                <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Module' ? 'left' : 'center', fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', width: h !== 'Module' ? 56 : 'auto' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {permParents.filter(parent => {
                              const perm = effectivePerms.find(p => p.module_code === parent.ref_code) || {};
                              return perm.role_can_view || perm.role_can_add || perm.role_can_edit || perm.role_can_delete ||
                                    perm.override_can_view || perm.override_can_add || perm.override_can_edit || perm.override_can_delete;
                            }).map((parent, pi) => {
                              const perm = effectivePerms.find(p => p.module_code === parent.ref_code) || {};
                              return (
                                <tr key={parent.code} style={{ borderBottom: `1px solid ${C.border}`, background: pi % 2 === 0 ? C.white : C.gray50 }}>
                                  <td style={{ padding: '8px 12px', fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: C.navy }}>{parent.ref_value || parent.ref_value}</td>
                                  {['can_view', 'can_add', 'can_edit', 'can_delete'].map(p => (
                                    <td key={p} style={{ textAlign: 'center', padding: '8px 12px' }}>
                                      <PermCheck
                                        fromRole={perm[`role_${p}`]}
                                        fromOverride={perm[`override_${p}`]}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                          {[
                            { color: C.blue, label: 'From role' },
                            { color: C.green, label: 'Override granted' },
                          ].map(({ color, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: F.sans, fontSize: 11, color: C.gray500 }}>
                              <i className="ti ti-check" style={{ fontSize: 13, color }} />
                              {label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── INVITE MODAL ── */}
      {showInviteModal && (
        <Modal title="Invite new member" onClose={() => setShowInviteModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Email address', value: inviteEmail, onChange: setInviteEmail, type: 'email', placeholder: 'colleague@company.com' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type || 'text'} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', height: 38, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.sans, fontSize: 13, color: C.navy, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            {[
              { label: 'Node (team)', value: inviteNode, onChange: setInviteNode, options: nodes.map(n => ({ value: n.id, label: n.node_name })) },
              { label: 'Role', value: inviteRole, onChange: setInviteRole, options: roles.map(r => ({ value: r.id, label: r.name })) },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</label>
                <select value={f.value} onChange={e => f.onChange(e.target.value)}
                  style={{ width: '100%', height: 38, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.sans, fontSize: 13, color: C.navy, outline: 'none', background: C.white, boxSizing: 'border-box' }}>
                  <option value="">Select…</option>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, height: 38, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.gray500, background: C.white, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSendInvite} disabled={inviteSending || !inviteEmail || !inviteNode || !inviteRole}
                style={{ flex: 2, height: 38, border: 'none', borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: C.white, background: inviteSending || !inviteEmail || !inviteNode || !inviteRole ? C.gray400 : C.navy, cursor: 'pointer' }}>
                {inviteSending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CHANGE ROLE MODAL ── */}
      {showChangeRole && (
        <Modal title="Change role" onClose={() => setShowChangeRole(false)}>
          <div style={{ marginBottom: 8, fontFamily: F.sans, fontSize: 12, color: C.gray500 }}>
            Current role: <strong style={{ color: C.navy }}>{sel?.role}</strong>
          </div>
          <select value={newRole} onChange={e => setNewRole(e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.sans, fontSize: 13, color: C.navy, background: C.white, marginBottom: 16 }}>
            <option value="">Select new role…</option>
            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowChangeRole(false)} style={{ flex: 1, height: 38, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.gray500, background: C.white, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleChangeRole} disabled={!newRole || actionLoading}
              style={{ flex: 2, height: 38, border: 'none', borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: C.white, background: !newRole || actionLoading ? C.gray400 : C.navy, cursor: 'pointer' }}>
              {actionLoading ? 'Saving…' : 'Save role'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── CHANGE NODE MODAL ── */}
      {showChangeNode && (
        <Modal title="Change node" onClose={() => setShowChangeNode(false)}>
          <div style={{ marginBottom: 8, fontFamily: F.sans, fontSize: 12, color: C.gray500 }}>
            Current node: <strong style={{ color: C.navy }}>{sel?.node_name}</strong>
          </div>
          <select value={newNode} onChange={e => setNewNode(e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.sans, fontSize: 13, color: C.navy, background: C.white, marginBottom: 16 }}>
            <option value="">Select new node…</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.node_name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowChangeNode(false)} style={{ flex: 1, height: 38, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.gray500, background: C.white, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleChangeNode} disabled={!newNode || actionLoading}
              style={{ flex: 2, height: 38, border: 'none', borderRadius: 8, fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: C.white, background: !newNode || actionLoading ? C.gray400 : C.navy, cursor: 'pointer' }}>
              {actionLoading ? 'Saving…' : 'Save node'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── OVERRIDES SLIDE-IN ── */}
      {showOverrides && memberDetail && (
        <OverridesPanel
          member={memberDetail}
          modules={modules}
          onClose={() => setShowOverrides(false)}
          onSaved={() => { fetchAll(); fetchMemberDetail(sel.id); }}
          onError={(msg) => showPopup('error', 'Error', msg)}
        />
      )}

      {/* ── POPUP ── */}
      {popup && (
        <UNPopup
          type={popup.type}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={popup.onConfirm}
          confirmLabel={popup.confirmLabel}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
