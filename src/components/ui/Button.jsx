// ─────────────────────────────────────────────
// UrbanNest UI — Button
// Variants: primary | secondary | social
// ─────────────────────────────────────────────

import { primaryBtnStyle, secondaryBtnStyle, socialBtnStyle } from '../../constants/styles';
import { C } from '../../constants/colors';

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 15, height: 15,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'un-spin 0.7s linear infinite',
    }} />
  );
}

export default function Button({
  children,
  variant = 'primary',   // 'primary' | 'secondary' | 'social'
  type = 'button',
  loading = false,
  disabled = false,
  onClick,
  style = {},
  fullWidth = true,
}) {
  const base =
    variant === 'primary'   ? primaryBtnStyle :
    variant === 'secondary' ? secondaryBtnStyle :
    socialBtnStyle;

  const hoverClass =
    variant === 'primary'   ? 'un-btn-primary' :
    variant === 'secondary' ? 'un-btn-secondary' :
    'un-btn-social';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={hoverClass}
      style={{
        ...base,
        ...(fullWidth && variant !== 'social' ? { width: '100%' } : {}),
        opacity: (disabled || loading) ? 0.7 : 1,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
