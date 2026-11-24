// ─────────────────────────────────────────────
// UrbanNest — Login (route: /)
// LoginPage (Design System v2) draws its own page background + centred card,
// so this wrapper only renders it. (Was: a 75vw floating card on a dotted backdrop.)
// ─────────────────────────────────────────────

import LoginPage from './LoginPage';

export default function LoginModal() {
  return <LoginPage />;
}
