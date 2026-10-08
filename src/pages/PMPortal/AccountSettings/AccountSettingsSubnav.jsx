// AccountSettingsSubnav.jsx — shared tab strip for PM Portal's consolidated
// "Account Settings" section (Session 49 nav consolidation, reported live —
// see claude/UrbanNest_ActiveBacklog.md).
//
// Why this exists: NavB's L1 "Account Settings" item already expands into 6
// routed children (My Profile, Bank Accounts, Subscription & Billing,
// Services, Transactions, Integrations) — but each child is still its own
// page component, not one page with internal tab state (unlike Landlord's
// LandlordSettingsPage.jsx, which is a single file with a useState tab
// switcher). PM Portal's own NavB convention is L1→L2 routed children for
// every other section too, so this keeps that same shape rather than forcing
// a single-giant-file rewrite. This component is rendered at the top of each
// of the 6 tab pages so they still read as one section with 6 tabs, the way
// the user experiences Landlord's Settings page, even though under the hood
// it's 6 routes instead of 1.
//
// Deliberately NOT styled to match LandlordSettingsPage.jsx's later,
// Figma-polished tab strip (DOM-measured offsets, gradients, etc.) — this
// reuses PM Portal's own existing, simpler design tokens (same C.primary /
// C.textPrimary / C.textTertiary values already used in
// PMSubscriptionPage.jsx), consistent with this portal's current visual
// language. Bringing PM Portal's Account Settings to full visual parity with
// Landlord's later polish passes is tracked as separate, larger follow-up
// work, not done here.

import React from 'react';
import { useNavigate } from 'react-router-dom';

const C = {
  primary:      '#002D5B',
  textPrimary:  '#0F172A',
  textTertiary: '#94A3B8',
  border:       'rgba(0,0,0,0.06)',
};
const F = { body: "'Nunito Sans', sans-serif" };

export const ACCOUNT_SETTINGS_TABS = [
  { id: 'profile',      label: 'My Profile',             route: '/pm-portal/account/profile' },
  { id: 'bank',         label: 'Bank Accounts',          route: '/pm-portal/account/bank-accounts' },
  { id: 'subscription', label: 'Subscription & Billing', route: '/pm-portal/account/subscription' },
  { id: 'services',     label: 'Services',               route: '/pm-portal/account/services' },
  { id: 'transactions', label: 'Transactions',           route: '/pm-portal/account/transactions' },
  { id: 'integrations', label: 'Integrations',           route: '/pm-portal/account/integrations' },
];

export default function AccountSettingsSubnav({ activeTab }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 22,
        flexWrap: 'wrap',
      }}
    >
      {ACCOUNT_SETTINGS_TABS.map(t => {
        const active = t.id === activeTab;
        return (
          <div
            key={t.id}
            onClick={() => { if (!active) navigate(t.route); }}
            style={{
              padding: '10px 18px',
              fontFamily: F.body,
              fontSize: 13.5,
              fontWeight: 600,
              color: active ? C.textPrimary : C.textTertiary,
              borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
              cursor: active ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </div>
        );
      })}
    </div>
  );
}
