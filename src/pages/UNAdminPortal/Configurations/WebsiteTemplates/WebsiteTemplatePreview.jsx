// WebsiteTemplatePreview.jsx — structural preview of a template manifest
// (Session 60, decision D5). Shows the site navigation, every page with its
// sections in order, the editable fields a PM / Landlord will fill in, and
// the capabilities. It is not a visual rendering: the coded website layouts
// arrive with the public website renderer in a later phase.

import React from 'react';
import { C2, SP2, R2, UI2, T2, TONES2, pad } from '../../../../constants/v2';
import { labelFor } from './websiteTemplateShared';

const S = {
  nav: { ...UI2.row(SP2.xs), flexWrap: 'wrap', padding: pad(SP2.sm, SP2.md), background: C2.navyDeep, borderRadius: R2.md },
  navItem: (on) => ({ ...T2.caption, color: on ? C2.white : C2.textMuted, textDecoration: on ? 'none' : 'line-through', padding: pad(0, SP2.sm) }),
  page: (on) => ({ ...UI2.inset, opacity: on ? 1 : 0.55, ...UI2.stack(SP2.sm) }),
  pageHead: { ...UI2.row(SP2.sm), justifyContent: 'space-between' },
  section: (on) => ({ background: C2.white, borderRadius: R2.md, padding: pad(SP2.sm, SP2.md), borderLeft: `3px solid ${on ? C2.primary : C2.border}`, opacity: on ? 1 : 0.55 }),
  chips: { ...UI2.row(SP2.xs), flexWrap: 'wrap', marginTop: SP2.xs },
};

function FieldChips({ fields, refs }) {
  if (!fields || !fields.length) {
    return <div style={T2.caption}>Content from the PMS — nothing for the owner to fill in.</div>;
  }
  return (
    <div style={S.chips}>
      {fields.map(f => (
        <span key={f.key} style={UI2.tag(f.required ? TONES2.primary : TONES2.neutral)} title={`${f.key} · ${labelFor(refs.field_types, f.type)}`}>
          {f.label}{f.required ? ' *' : ''} · {labelFor(refs.field_types, f.type)}
        </span>
      ))}
    </div>
  );
}

export default function WebsiteTemplatePreview({ structure, refs }) {
  const pages = structure?.pages || [];
  const siteFields = structure?.site_fields || [];
  const capabilities = structure?.capabilities || [];

  return (
    <div style={UI2.stack(SP2.md)}>
      <div>
        <div style={{ ...UI2.text.eyebrow, marginBottom: SP2.xs }}>Site navigation</div>
        {pages.length ? (
          <div style={S.nav}>
            {pages.map(p => <span key={p.page} style={S.navItem(p.enabled)}>{p.title || labelFor(refs.pages, p.page)}</span>)}
          </div>
        ) : <div style={UI2.emptyInline}>No pages yet.</div>}
      </div>

      <div>
        <div style={{ ...UI2.text.eyebrow, marginBottom: SP2.xs }}>Site-wide content</div>
        <FieldChips fields={siteFields} refs={refs} />
      </div>

      {pages.map(p => (
        <div key={p.page} style={S.page(p.enabled)}>
          <div style={S.pageHead}>
            <div style={UI2.text.title}>{p.title || labelFor(refs.pages, p.page)}</div>
            <span style={UI2.pill(p.enabled ? TONES2.success : TONES2.neutral)}>{p.enabled ? 'Enabled' : 'Hidden'}</span>
          </div>
          {(p.sections || []).length === 0 && <div style={T2.caption}>No sections.</div>}
          {(p.sections || []).map(s => (
            <div key={s.section} style={S.section(s.enabled)}>
              <div style={{ ...UI2.row(SP2.sm), justifyContent: 'space-between' }}>
                <span style={UI2.text.rowTitle}>{s.title || labelFor(refs.sections, s.section)}</span>
                <span style={T2.caption}>{labelFor(refs.sections, s.section)}{s.enabled ? '' : ' · hidden'}</span>
              </div>
              <FieldChips fields={s.fields} refs={refs} />
            </div>
          ))}
        </div>
      ))}

      <div>
        <div style={{ ...UI2.text.eyebrow, marginBottom: SP2.xs }}>Capabilities</div>
        {capabilities.length ? (
          <div style={S.chips}>
            {capabilities.map(c => <span key={c} style={UI2.pill(TONES2.primary)}>{labelFor(refs.capabilities, c)}</span>)}
          </div>
        ) : <div style={UI2.emptyInline}>None selected.</div>}
      </div>
    </div>
  );
}
