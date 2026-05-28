// ─────────────────────────────────────────────
// UrbanNest UI — Select (Dropdown)
// ─────────────────────────────────────────────

import { inputStyle, labelStyle } from '../../constants/styles';
import { C } from '../../constants/colors';

function ChevronIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
}

export default function Select({ label, value, onChange, options = [], style = {} }) {
  return (
    <div style={{ marginBottom: 18, ...style }}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={onChange}
          style={{
            ...inputStyle(false),
            padding: '10px 36px 10px 12px',
            appearance: 'none',
            cursor: 'pointer',
          }}
        >
          {options.map(opt => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <ChevronIcon />
        </span>
      </div>
    </div>
  );
}
