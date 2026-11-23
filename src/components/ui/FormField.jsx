import React from 'react';
import FilterMenu from './FilterMenu';
import { C2, R2, FS2, LH2, SP2, SZ2, UI2 } from '../../constants';

// ═════════════════════════════════════════════════════════════════════════════
// VERSION 2 FORM STANDARD (confirmed by the user 2026-11-23 on the Create Listing wizard) — every v2 form uses this.
// Never restyle fields per page; build forms only from these pieces:
//
//   LAYOUT      fields in <Grid layout="two" as="div" style={{ columnGap: SP2.lg, rowGap: SP2.lg }}>, full-width
//               fields with <FormField full>. Card body starts SP2.md under the card header line.
//   LABEL       FormField → caps label (UI2.capsLabel) above the field, optional action on the right (AI Assist,
//               NEW tag). Group labels above radio / checkbox rows use the same caps label.
//   FIELD       FIELD2.input — 36px high (SZ2.field) · white (C2.white) · 1px C2.cardBorder · radius R2.md ·
//               Inter 13px (FS2.base) · className="un2-focus-ring" for the blue focus border + glow.
//   READ-ONLY   ReadField — same box, background C2.fieldReadOnly (#FBFCFE, just off-white), optional trailing icon.
//   DROPDOWN    SelectField — same box + chevron, opens our FilterMenu list as wide as the field (never <select>).
//   TEXTAREA    FIELD2.textarea — same box, min height SZ2.textarea (88), vertical resize.
//   CHIP INPUT  chips + input in one field box (listingWizardV2 ChipInput) — min height = the field height.
//   COMPACT     FIELD2.inputSm / ChoiceTile — UI2.compact: 34px (SZ2.control.md) · 8px side padding · 12px text.
//   SELECTION   Checkbox · RadioPill · Switch (FormControls.jsx) — on = light primary blue (G2.primaryButton /
//               C2.primaryLight), never green. ChoiceTile (amenity) selected = C2.chipBlueHover + navy icon / text.
//   HINT        description under a field / control = UI2.text.meta.
// ═════════════════════════════════════════════════════════════════════════════
//
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
// SelectField — VERSION 2 dropdown in the standard field box (v1 equivalent: CustomDropdown). Opens our
// FilterMenu list under the field, as wide as the field:
//   <SelectField label="Lease term" value={v} onChange={setV} options={[{ value: '12', label: '12 months' }]} />
// FormField props: label, action, full (span both columns of a FIELD2.grid), children, style

export const FIELD2 = {
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: SP2.lg, rowGap: SP2.lg },
  input:    { ...UI2.input, height: SZ2.field },   // 36 — standard form field height
  textarea: { ...UI2.input, height: 'auto', minHeight: SZ2.textarea, padding: SP2.md, lineHeight: LH2.body, resize: 'vertical', display: 'block' },
  // compact one-line input (small inline add rows)
  inputSm:  { ...UI2.input, ...UI2.compact, height: SZ2.control.md },   // standard compact size (UI2.compact)
};

const S = {
  field:   { display: 'flex', flexDirection: 'column', gap: SP2.sm, minWidth: 0 },
  full:    { gridColumn: '1 / -1' },
  head:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP2.sm, minHeight: SZ2.control.sm },
  label:   { ...UI2.capsLabel },
  read:    { ...FIELD2.input, ...UI2.row(SP2.sm), justifyContent: 'space-between', background: C2.fieldReadOnly, borderRadius: R2.md, cursor: 'default' },
  value:   { minWidth: 0, ...UI2.truncate, color: C2.textPrimary },
  ph:      { color: C2.textMuted },
  icon:    { fontSize: FS2.lg, color: C2.textSecondary, flexShrink: 0 },
  select:  { ...FIELD2.input, ...UI2.row(SP2.sm), justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' },
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

export function SelectField({ value, options = [], onChange, placeholder = 'Select…', label }) {
  const cur = options.find(o => o.value === value);
  return (
    <FilterMenu
      title={label || placeholder} ariaLabel={label || placeholder} showAll={false} matchWidth
      options={options} value={value === '' || value === undefined ? null : value} onChange={onChange}
      triggerStyle={S.select}
      trigger={open => (
        <>
          <span style={{ ...S.value, ...(cur ? {} : S.ph) }}>{cur ? cur.label : placeholder}</span>
          <i className="ti ti-chevron-down" style={{ ...S.icon, transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
        </>
      )}
    />
  );
}
