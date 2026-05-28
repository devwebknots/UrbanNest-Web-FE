// ─────────────────────────────────────────────
// UrbanNest UI — Input
// Handles text, password, with optional suffix icon
// ─────────────────────────────────────────────

import { useState } from 'react';
import { inputStyle, labelStyle } from '../../constants/styles';
import { C } from '../../constants/colors';
import { F } from '../../constants/fonts';

function EyeIcon({ open }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  rightAction,        // { label, onClick } — for "Forgot password?"
  style = {},
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPw ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 18, ...style }}>
      {/* Label row */}
      {(label || rightAction) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          {label && <label style={labelStyle}>{label}</label>}
          {rightAction && (
            <button
              type="button"
              onClick={rightAction.onClick}
              className="un-link-btn"
              style={{ fontFamily: F.body, fontSize: 12, fontWeight: 400, color: C.textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.18s' }}
            >
              {rightAction.label}
            </button>
          )}
        </div>
      )}

      {/* Input wrapper */}
      <div style={{ position: 'relative' }}>
        <input
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          style={{
            ...inputStyle(focused),
            ...(isPassword ? { paddingRight: 44 } : {}),
          }}
        />
        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="un-eye-btn"
            style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.18s' }}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={showPw} />
          </button>
        )}
      </div>
    </div>
  );
}
