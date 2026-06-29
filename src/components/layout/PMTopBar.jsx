// ─────────────────────────────────────────────────────────────
// UrbanNest — PM Portal Topbar
// Shared across all PM Portal pages.
// Reads user from AuthContext — no props needed.
// ─────────────────────────────────────────────────────────────

import { useAuth } from '../../context/AuthContext';

const C = {
  white:   '#FFFFFF',
  border:  '#E2E8F0',
  textSec: '#64748B',
  textTert:'#94A3B8',
  primary: '#002D5B',
};

const F = { body: "'Nunito Sans', sans-serif" };

const PERSONA_LABELS = {
  ORGANIZATIONAL_PM: 'Org PMS Admin',
  INDEPENDENT_PM:    'Independent PM',
  PM_STAFF:          'PM Staff',
  UN_ADMIN:          'UN Admin',
  RENTER:            'Renter',
  LANDLORD:          'Landlord',
  TENANT:            'Tenant',
};

export default function PMTopBar({ showSearch = true }) {
  const { user } = useAuth();

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : '—';

  const personaLabel = user
    ? PERSONA_LABELS[user.active_persona] || user.active_persona || 'PM Portal'
    : 'PM Portal';

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{
      height: 52, background: C.white,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 12, flexShrink: 0,
    }}>
      {/* Search */}
      {showSearch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: `1px solid #CBD5E1`, borderRadius: 7,
          padding: '0 10px', height: 32,
          background: '#F8FAFC', flex: 1, maxWidth: 300,
        }}>
          <i className="ti ti-search" style={{ fontSize: 13, color: C.textTert }} />
          <input style={{
            border: 'none', background: 'transparent',
            fontSize: 12, color: '#0F172A',
            outline: 'none', width: '100%', fontFamily: F.body,
          }} placeholder="Search..." />
        </div>
      )}

      {/* Right side — user info */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <i className="ti ti-bell" style={{ fontSize: 18, color: C.textSec }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
              {fullName}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 10, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {personaLabel}
            </div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: C.white, flexShrink: 0,
          }}>
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}