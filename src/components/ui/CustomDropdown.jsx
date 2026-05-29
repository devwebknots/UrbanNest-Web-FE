/**
 * CustomDropdown.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable dropdown component — replaces all native <select> elements.
 * Source of truth: UrbanNest Design System §9 — Custom Dropdown Standard
 *
 * Usage:
 *   import { CustomDropdown } from '../components/ui';
 *
 *   <CustomDropdown
 *     options={[{ value: 'KEY', label: 'Display Label' }]}
 *     value={selectedValue}
 *     onChange={v => setSelectedValue(v)}
 *     placeholder="Select…"
 *     error={!!errors.field}       // optional — shows danger border
 *     disabled={false}             // optional — disables interaction
 *   />
 *
 * Design tokens (UrbanNest Design System):
 *   Closed:   white bg, #CBD5E1 border, chevron-down
 *   Open:     #E4ECFC bg, #BFDBFE border (light blue), chevron-up
 *   Selected: #E4ECFC bg, navy text, bold
 *   Hover:    #F0F5FF bg
 *   Error:    #E53E3E border
 *   Disabled: #F8FAFC bg, not-allowed cursor
 *   Max height: 220px with scroll for long lists
 *   Closes on outside click
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';

// ─── Design tokens (mirrors src/constants/colors.js + fonts.js) ───────────────
const C = {
  primary:       '#002D5B',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  white:         '#FFFFFF',
  neutral:       '#F8FAFC',
  danger:        '#E53E3E',
  dropdownBg:    '#E4ECFC',
  dropdownBorder:'#BFDBFE',
  hoverBg:       '#F0F5FF',
};
const F = {
  body: "'Nunito Sans', sans-serif",
};

// ─── CustomDropdown ────────────────────────────────────────────────────────────
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

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derive the currently selected option object
  const selected = options.find(o => o.value === value);

  // Resolve border color based on state priority: error > open > default
  const borderColor = error
    ? C.danger
    : open
    ? C.dropdownBorder
    : C.borderMedium;

  // Resolve background based on state: disabled > open/selected > default
  const triggerBg = disabled
    ? C.neutral
    : open || value
    ? C.dropdownBg
    : C.white;

  const handleToggle = () => {
    if (!disabled) setOpen(prev => !prev);
  };

  const handleSelect = (optValue) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>

      {/* ── Trigger button ── */}
      <div
        onClick={handleToggle}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width: '100%',
          height: '40px',
          boxSizing: 'border-box',
          background: triggerBg,
          border: `1px solid ${borderColor}`,
          borderRadius: open ? '8px 8px 0 0' : '8px',
          padding: '0 36px 0 12px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: F.body,
          fontSize: '13px',
          color: selected ? C.textPrimary : C.textTertiary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Label */}
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 400,
          color: selected ? C.textPrimary : C.textTertiary,
        }}>
          {selected ? selected.label : placeholder}
        </span>

        {/* Chevron icon */}
        <i
          className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`}
          style={{
            position: 'absolute',
            right: '10px',
            fontSize: '14px',
            color: C.textSecondary,
            transition: 'transform 0.15s',
            pointerEvents: 'none',
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
            zIndex: 200,
            background: C.white,
            border: `1px solid ${C.dropdownBorder}`,
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 12px rgba(0,45,91,0.1)',
            maxHeight: '220px',
            overflowY: 'auto',
            // Scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: `${C.borderMedium} transparent`,
          }}
        >
          {options
            .filter(o => o.value !== '')  // skip blank placeholder option if present
            .map(o => {
              const isSelected = o.value === value;
              return (
                <div
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(o.value)}
                  style={{
                    padding: '10px 12px',
                    fontFamily: F.body,
                    fontSize: '13px',
                    color: isSelected ? C.primary : C.textPrimary,
                    background: isSelected ? C.dropdownBg : C.white,
                    fontWeight: isSelected ? 600 : 400,
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
                  {/* Checkmark for selected item */}
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
