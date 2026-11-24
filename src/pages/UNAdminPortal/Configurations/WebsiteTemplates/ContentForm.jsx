// ContentForm.jsx — owner-content editor generated from a template manifest
// (Website Builder Phase 2). Today it edits a template's SAMPLE content for
// the UN Admin preview; Phase 3 reuses it unchanged as the owner's website
// content editor. Every input comes from the manifest's own field
// definitions (label, type, required); nothing here is template-specific.
//
// Content shape: { site: {key: value}, pages: { PAGE: { SECTION: {key: value} } } }

import React, { useState } from 'react';
import { C2, SP2, R2, UI2, T2, pad } from '../../../../constants/v2';
import { labelFor } from './websiteTemplateShared';

const S = {
  group: { ...UI2.inset, ...UI2.stack(SP2.md) },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: SP2.md },
  field: UI2.stack(SP2.xs),
  label: { ...UI2.text.label, fontWeight: 600 },
  textarea: { ...UI2.input, height: 'auto', minHeight: 72, padding: pad(SP2.sm, SP2.md), resize: 'vertical' },
  head: { ...UI2.row(SP2.sm), justifyContent: 'space-between', cursor: 'pointer', background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left' },
  color: { width: 40, height: 34, padding: 0, border: `1px solid ${C2.cardBorder}`, borderRadius: R2.md, background: C2.white },
};

// Keeps only keys the manifest defines (drops values for removed fields).
export function pruneContent(content, structure) {
  const out = { site: {}, pages: {} };
  const siteKeys = new Set((structure?.site_fields || []).map(f => f.key));
  Object.entries(content?.site || {}).forEach(([k, v]) => { if (siteKeys.has(k) && v !== '') out.site[k] = v; });
  (structure?.pages || []).forEach(p => {
    (p.sections || []).forEach(s => {
      const keys = new Set((s.fields || []).map(f => f.key));
      const values = content?.pages?.[p.page]?.[s.section] || {};
      Object.entries(values).forEach(([k, v]) => {
        if (keys.has(k) && v !== '') {
          out.pages[p.page] = out.pages[p.page] || {};
          out.pages[p.page][s.section] = out.pages[p.page][s.section] || {};
          out.pages[p.page][s.section][k] = v;
        }
      });
    });
  });
  return out;
}

function Input({ field, value, onChange, refs }) {
  const typeLabel = labelFor(refs.field_types, field.type);
  const common = { value: value || '', onChange: e => onChange(e.target.value), placeholder: typeLabel };
  let control;
  if (field.type === 'LONG_TEXT') {
    control = <textarea style={S.textarea} {...common} />;
  } else if (field.type === 'COLOR') {
    control = (
      <div style={UI2.row(SP2.sm)}>
        <input type="color" style={S.color} value={/^#[0-9A-Fa-f]{6}$/.test(value || '') ? value : '#000000'}
          onChange={e => onChange(e.target.value.toUpperCase())} aria-label={field.label} />
        <input style={UI2.input} {...common} placeholder="#RRGGBB" />
      </div>
    );
  } else {
    const htmlType = { EMAIL: 'email', URL: 'url', PHONE: 'tel' }[field.type] || 'text';
    control = <input type={htmlType} style={UI2.input} {...common}
      placeholder={field.type === 'IMAGE' ? 'Image web address (upload comes with websites)' : typeLabel} />;
  }
  return (
    <label style={S.field}>
      <span style={S.label}>{field.label}{field.required ? ' *' : ''}</span>
      {control}
    </label>
  );
}

function Group({ title, subtitle, fields, values, onChange, refs, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!fields.length) return null;
  const filled = fields.filter(f => values[f.key]).length;
  return (
    <div style={S.group}>
      <button type="button" style={S.head} onClick={() => setOpen(!open)}>
        <span style={UI2.text.title}><i className={`ti ti-chevron-${open ? 'down' : 'right'}`} /> {title}
          {subtitle && <span style={{ ...T2.caption, marginLeft: SP2.sm }}>{subtitle}</span>}</span>
        <span style={T2.caption}>{filled} / {fields.length} filled</span>
      </button>
      {open && (
        <div style={S.grid}>
          {fields.map(f => (
            <Input key={f.key} field={f} refs={refs} value={values[f.key]} onChange={v => onChange(f.key, v)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContentForm({ structure, content, onChange, refs }) {
  const site = content?.site || {};
  const pages = content?.pages || {};
  const setSite = (key, value) => onChange({ ...content, site: { ...site, [key]: value } });
  const setSection = (page, section, key, value) => onChange({
    ...content,
    pages: { ...pages, [page]: { ...(pages[page] || {}), [section]: { ...((pages[page] || {})[section] || {}), [key]: value } } },
  });

  return (
    <div style={UI2.stack(SP2.md)}>
      <Group title="Site-wide content" fields={structure?.site_fields || []} values={site} onChange={setSite} refs={refs} defaultOpen />
      {(structure?.pages || []).map(p => (
        <div key={p.page} style={UI2.stack(SP2.sm)}>
          <div style={{ ...UI2.text.eyebrow, marginTop: SP2.sm }}>{p.title || labelFor(refs.pages, p.page)}{p.enabled ? '' : ' · hidden'}</div>
          {(p.sections || []).map(s => (
            <Group key={s.section}
              title={s.title || labelFor(refs.sections, s.section)}
              subtitle={labelFor(refs.sections, s.section)}
              fields={s.fields || []}
              values={(pages[p.page] || {})[s.section] || {}}
              onChange={(key, value) => setSection(p.page, s.section, key, value)}
              refs={refs} defaultOpen={false} />
          ))}
        </div>
      ))}
    </div>
  );
}
