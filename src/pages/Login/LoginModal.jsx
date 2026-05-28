// ─────────────────────────────────────────────
// UrbanNest — Login Modal Wrapper
// Displays LoginPage as a 75vw floating card
// on a dotted backdrop. Route: /
// ─────────────────────────────────────────────

import LoginPage from './LoginPage';
import { dotGridBg } from '../../constants/styles';

export default function LoginModal() {
  return (
    <div style={dotGridBg}>
      <div style={{
        width: '75vw',
        maxHeight: '90vh',
        height: 'auto',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <LoginPage />
        </div>
      </div>
    </div>
  );
}
