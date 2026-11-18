/**
 * MultiSelectDropdown.jsx — scoped multi-select dropdown for Partner
 * Management's "Supported Markets" field (Session 71 revision pass).
 * ─────────────────────────────────────────────────────────────────────────────
 * The codebase's shared dropdowns — src/components/ui/CustomDropdown.jsx
 * (the Design System's "only dropdown component") and Select.jsx — are both
 * single-value only; confirmed by reading both files directly before
 * building this. Bending either to a second, unrelated selection model
 * would fight their own single-`value`/`onChange` contracts, so this
 * feature gets its own small multi-select widget instead, scoped to this
 * one field.
 *
 * Visually it matches CustomDropdown's own trigger exactly — 38px height,
 * #E8ECF0 border (no dark border when open, no focus ring), 6px radius,
 * Nunito Sans 13px, same chevron — so it reads as part of the same
 * dropdown family even though it lives in its own file here rather than in
 * src/components/ui/.
 *
 * Usage:
 *   <MultiSelectDropdown
 *     options={MARKET_OPTIONS}            // array of strings, or {value,label}
 *     values={form.markets}               // array of selected values
 *     onChange={v => set('markets', v)}
 *     disabled={readOnly}
 *   />
 */
import React, { useState, useRef, useEffect } from 'react';
import { C, F } from './partnerManagementTokens';

export default function MultiSelectDropdown({
  options = [],
  values = [],
  onChange,
  placeholder = 'Select…',
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

  const toggle = val => {
    onChange(values.includes(val) ? values.filter(v => v !== val) : [...values, val]);
  };

  const summary = values.length ? values.join(', ') : placeholder;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* ── Trigger — mirrors CustomDropdown.jsx exactly ── */}
      <div
        onClick={() => { if (!disabled) setOpen(prev => !prev); }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width: '100%',
          height: 38,
          boxSizing: 'border-box',
          background: disabled ? '#F8FAFC' : '#F8F9FA',
          border: '1px solid #E8ECF0',
          borderRadius: open ? '6px 6px 0 0' : 6,
          padding: '0 32px 0 11px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: F.body,
          fontSize: 13,
          color: values.length ? C.textPrimary : C.textTertiary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          boxShadow: 'none',
          opacity: disabled ? 0.6 : 1,
          position: 'relative',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {summary}
        </span>
        <i
          className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`}
          style={{ position: 'absolute', right: 10, fontSize: 13, color: C.textSecondary, pointerEvents: 'none' }}
        />
      </div>

      {/* ── List — checkboxes instead of CustomDropdown's single checkmark ── */}
      {open && !disabled && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
            background: C.white, border: '1px solid #E8ECF0', borderTop: 'none',
            borderRadius: '0 0 6px 6px', boxShadow: '0 6px 16px rgba(0,45,91,0.08)',
            maxHeight: 220, overflowY: 'auto',
          }}
        >
          {options.map(o => {
            const val = o.value ?? o;
            const label = o.label ?? o;
            const checked = values.includes(val);
            return (
              <div
                key={val}
                role="option"
                aria-selected={checked}
                onClick={() => toggle(val)}
                style={{
                  padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 9,
                  fontFamily: F.body, fontSize: 13,
                  color: checked ? C.primary : C.textPrimary,
                  background: checked ? '#EFF6FF' : C.white,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#F0F5FF'; }}
                onMouseLeave={e => { if (!checked) e.currentTarget.style.background = C.white; }}
              >
                <span style={{
                  width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${checked ? C.primary : '#CBD5E1'}`,
                  background: checked ? C.primary : C.white,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <i className="ti ti-check" style={{ fontSize: 10, color: C.white }} />}
                </span>
                <span>{label}</span>
              </div>
            );
          })}

          {options.length === 0 && (
            <div style={{ padding: 12, fontFamily: F.body, fontSize: 12, color: C.textTertiary, textAlign: 'center' }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
