/**
 * NavB.jsx — PM Portal Left Navigation
 *
 * Since 2026-11-25 this renders the Design System v2 PM sidebar (NavPM.jsx) so EVERY PM page shows the same
 * sidebar — before, only the redesigned pages (Approvals, Marketing → Listings) had the new look and the rest
 * still showed the old dark one, so the sidebar changed look while navigating.
 *
 * NavPM carries the exact same content NavB had: every menu group / sub-page / route, the RBAC module checks
 * (hasAccess — sections with no access stay hidden), "Create Listing", Help Center and Sign out. Same prop:
 *
 *   <NavB activeId="all-props" />   ≡   <NavPM activeId="all-props" />
 *
 * Kept as a thin wrapper so the ~24 PM pages that import NavB need no change. New PM pages use PMPageShell
 * (NavPM + the PM top bar) directly. (The Tabler icon font NavB used to inject is loaded globally in
 * public/index.html.)
 */

import React from 'react';
import NavPM from './NavPM';

export default function NavB({ activeId = 'my-dashboard' }) {
  return <NavPM activeId={activeId} />;
}
