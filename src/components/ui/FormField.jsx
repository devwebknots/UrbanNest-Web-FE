import React from 'react';
import { C2, R2, FS2, LH2, SP2, SZ2, pad, UI2 } from '../../constants';

// ─── FormField (Design System v2) ────────────────────────────────────────────
// Caps label above a field (+ optional action on the label line, e.g. AI Assist), then the control.
// Field styles are the standard UI2.input — exported here so every form uses the same boxes:
//
//   <FormField label="Property name"><ReadField value="LL01" /></FormField>
//   <FormField label="City"><ReadField value="Centerton" icon="ti-chevron-down" /></FormField>
//   <FormField label="Website URL"><input className="un2-focus-ring" style={FIELD2.input} … /></FormField>
//   <FormField label="Description" action={<AiAssist />}><textarea style={FIELD2.textarea} … /></FormField>
//
// ReadField — a value pulled from another record, shown in the standard field box but not editable
// (value · placeholder when empty · optional trailing icon).
// FormField props: label, action, full (span both columns of a FIELD2.grid), children, style

export const FIELD2 = {
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: SP2.lg, rowGap: SP2.lg },
  input:    { ...UI2.input, height: SZ2.control.lg },
  textarea: { ...UI2.input, height: 'auto', minHeight: SZ2.textarea, padding: SP2.md, lineHeight: LH2.body, resize: 'vertical', display: 'block' },
  // compact one-line input (small inline add rows)
  inputSm:  { ...UI2.input, height: SZ2.control.md, fontSize: FS2.sm, padding: pad(0, SP2.sm) },
};

const S = {
  field:   { display: 'flex', flexDirection: 'column', gap: SP2.sm, minWidth: 0 },
  full:    { gridColumn: '1 / -1' },
  head:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP2.sm, minHeight: SZ2.control.sm },
  label:   { ...UI2.capsLabel },
  read:    { ...FIELD2.input, ...UI2.row(SP2.sm), justifyContent: 'space-between', background: C2.background, borderRadius: R2.md, cursor: 'default' },
  value:   { minWidth: 0, ...UI2.truncate, color: C2.textPrimary },
  ph:      { color: C2.textMuted },
  icon:    { fontSize: FS2.lg, color: C2.textSecondary, flexShrink: 0 },
};

export default function FormField({ label, action, full = false, children, style }) {
  return (
    <div style={{ ...S.field, ...(full ? S.full : {}), ...style }}>
      {(label || action) && (
        <div style={S.head}>
          {label && <span style={S.label}>{label}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function ReadField({ value, placeholder = '—', icon }) {
  const empty = value == null || value === '';
  return (
    <div style={S.read} aria-readonly="true">
      <span style={{ ...S.value, ...(empty ? S.ph : {}) }}>{empty ? placeholder : value}</span>
      {icon && <i className={`ti ${icon}`} style={S.icon} aria-hidden="true" />}
    </div>
  );
}
