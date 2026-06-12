/**
 * CustomDropdown.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable dropdown component — replaces all native <select> elements.
 * Source of truth: UrbanNest Design System §9 — Custom Dropdown Standard
 *
 * Updated: Session 19 —
 *   - Height 38px, bg #fdfeff, border always #E8ECF0 (no dark border on open)
 *   - No blue focus ring
 *   - Border radius 6px
 *   - Font Nunito Sans 13px
 *   - All item weights regular (400) — never bold
 *
 * Usage:
 *   import { CustomDropdown } from '../components/ui';
 *
 *   <CustomDropdown
 *     options={[{ value: 'KEY', label: 'Display Label' }]}
 *     value={selectedValue}
 *     onChange={v => setSelectedValue(v)}
 *     placeholder="Select…"
 *     error={!!errors.field}
 *     disabled={false}
 *   />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';

const C = {
  primary:       '#002D5B',
  inputBg:       '#F8F9FA',      // very light grey — trigger background
  inputBorder:   '#E8ECF0',      // very light border — always, open or closed
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  white:         '#FFFFFF',
  neutral:       '#F8FAFC',      // disabled background
  danger:        '#E53E3E',
  hoverBg:       '#F0F5FF',      // item hover
  selectedBg:    '#EFF6FF',      // selected item background
};
const F = {
  body: "'Nunito Sans', sans-serif",
};

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  error = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  // ← Border: error shows danger, everything else always #E8ECF0
  const borderColor = error ? C.danger : C.inputBorder;

  const handleToggle = () => { if (!disabled) setOpen(prev => !prev); };
  const handleSelect = optValue => { onChange(optValue); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>

      {/* ── Trigger ── */}
      <div
        onClick={handleToggle}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width: '100%',
          height: '38px',
          boxSizing: 'border-box',
          background: disabled ? C.neutral : C.inputBg,
          border: `1px solid ${borderColor}`,
          borderRadius: open ? '6px 6px 0 0' : '6px',
          padding: '0 32px 0 11px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: F.body,
          fontSize: '13px',
          color: selected ? C.textPrimary : C.textTertiary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          // ← No focus ring / box shadow
          boxShadow: 'none',
          transition: 'border-color 0.15s',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: '400',     // ← regular weight
          fontFamily: F.body,
          fontSize: '13px',
          color: selected ? C.textPrimary : C.textTertiary,
        }}>
          {selected ? selected.label : placeholder}
        </span>

        {/* Chevron */}
        <i
          className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`}
          style={{
            position: 'absolute',
            right: '10px',
            fontSize: '13px',
            color: C.textSecondary,
            pointerEvents: 'none',
            transition: 'transform 0.15s',
          }}
        />
      </div>

      {/* ── Dropdown list ── */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 300,
            background: C.white,
            // ← Light border on list too — matches trigger
            border: `1px solid ${C.inputBorder}`,
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 6px 16px rgba(0,45,91,0.08)',
            maxHeight: '220px',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: `#CBD5E1 transparent`,
          }}
        >
          {options
            .filter(o => o.value !== '')
            .map(o => {
              const isSelected = o.value === value;
              return (
                <div
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(o.value)}
                  style={{
                    padding: '9px 12px',
                    fontFamily: F.body,
                    fontSize: '13px',
                    // ← Regular weight for ALL items including selected
                    fontWeight: '400',
                    color: isSelected ? C.primary : C.textPrimary,
                    background: isSelected ? C.selectedBg : C.white,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = C.hoverBg;
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = C.white;
                  }}
                >
                  <span>{o.label}</span>
                  {/* Checkmark for selected item only */}
                  {isSelected && (
                    <i
                      className="ti ti-check"
                      style={{ fontSize: '13px', color: C.primary, flexShrink: 0 }}
                    />
                  )}
                </div>
              );
            })}

          {/* Empty state */}
          {options.filter(o => o.value !== '').length === 0 && (
            <div style={{
              padding: '12px',
              fontFamily: F.body,
              fontSize: '12px',
              color: C.textTertiary,
              textAlign: 'center',
            }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
