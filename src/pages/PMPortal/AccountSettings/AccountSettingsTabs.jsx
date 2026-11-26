// AccountSettingsTabs.jsx — VERSION 2 Account Settings tab strip (PM Portal)
//
// The standard v2 TabBar (underline + icons) over the same routes as the v1 AccountSettingsSubnav
// (ACCOUNT_SETTINGS_TABS). Every redesigned Account Settings page uses this one strip — the v1 subnav stays
// for the pages not redesigned yet.
//
//   <AccountSettingsTabs active="bank" />

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TabBar } from '../../../components/ui';
import { ACCOUNT_SETTINGS_TABS } from './AccountSettingsSubnav';

const TAB_ICONS = {
  profile: 'ti-user', bank: 'ti-building-bank', subscription: 'ti-credit-card',
  services: 'ti-briefcase', transactions: 'ti-file-invoice', integrations: 'ti-link',
};

export default function AccountSettingsTabs({ active }) {
  const navigate = useNavigate();
  return (
    <TabBar
      variant="underline"
      ariaLabel="Account settings"
      value={active}
      onChange={id => { const t = ACCOUNT_SETTINGS_TABS.find(x => x.id === id); if (t && id !== active) navigate(t.route); }}
      tabs={ACCOUNT_SETTINGS_TABS.map(t => ({ id: t.id, label: t.label, icon: TAB_ICONS[t.id] }))}
    />
  );
}
