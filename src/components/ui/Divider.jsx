// ─────────────────────────────────────────────
// UrbanNest UI — Divider
// Horizontal rule with optional center label
// ─────────────────────────────────────────────

import { C } from '../../constants/colors';
import { F } from '../../constants/fonts';

export default function Divider({ label, margin = '22px 0' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {label && (
        <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: C.textTertiary, whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}
