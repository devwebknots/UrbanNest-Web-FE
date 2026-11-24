// WebsiteTemplateEditor.jsx — create / edit one website template (Session 60).
//
// Admin configures an existing coded layout: details, personas, purpose,
// renderer, site-wide fields, pages → sections → editable fields, and
// capabilities. Every option list comes from the references endpoint
// (UNReference module=WEBSITE). The server validates everything again.
//
// Saving changes only the draft. Publish turns the saved draft into a new
// version; websites created later copy that version, so editing never
// changes a version that is already published.

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard, TabBar } from '../../../../components/v2';
import { C2, SP2, R2, UI2, T2, TONES2, pad } from '../../../../constants/v2';
import WebsiteTemplatePreview from './WebsiteTemplatePreview';
import ContentForm, { pruneContent } from './ContentForm';
import {
  createTemplate, updateTemplate, publishTemplate, unpublishTemplate,
} from './websiteTemplateApi';
import { labelFor, statusTone, toFieldKey, emptyStructure, formatDate } from './websiteTemplateShared';

const S = {
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(320px, 2fr)', gap: SP2.xl, alignItems: 'start' },
  col: UI2.stack(SP2.xl),
  sticky: { position: 'sticky', top: 0, ...UI2.stack(SP2.xl) },
  field: UI2.stack(SP2.xs),
  label: { ...UI2.text.label, fontWeight: 600 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP2.md },
  textarea: { ...UI2.input, height: 'auto', minHeight: 72, padding: pad(SP2.sm, SP2.md), resize: 'vertical' },
  check: { ...UI2.row(SP2.xs), ...UI2.text.body, cursor: 'pointer' },
  block: { ...UI2.inset, ...UI2.stack(SP2.sm) },
  sectionBox: { background: C2.white, borderRadius: R2.md, padding: SP2.md, ...UI2.stack(SP2.sm) },
  fieldRow: { display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1fr auto auto', gap: SP2.sm, alignItems: 'center' },
  rowBetween: { ...UI2.row(SP2.sm), justifyContent: 'space-between' },
  error: { ...UI2.inset, background: C2.errorTint, color: C2.errorDark, ...T2.body },
  notice: { ...UI2.inset, background: C2.warningTint, color: C2.warningDark, ...T2.body },
  ok: { ...UI2.inset, background: C2.successTint, color: C2.successDark, ...T2.body },
  small: { ...UI2.btn.outline, ...UI2.btnSm },
  smallLink: { ...UI2.btn.link },
};

const clone = (x) => JSON.parse(JSON.stringify(x));

// ─── Field list (site fields or a section's fields) ──────────────────────────
function FieldList({ fields, onChange, refs }) {
  const types = refs.field_types || [];
  const update = (i, patch) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const remove = (i) => onChange(fields.filter((_, j) => j !== i));
  const add = () => {
    const base = 'new_field';
    let key = base; let n = 2;
    while (fields.some(f => f.key === key)) { key = `${base}_${n}`; n += 1; }
    onChange([...fields, { key, label: '', type: types[0]?.code || '', required: false }]);
  };
  return (
    <div style={UI2.stack(SP2.xs)}>
      {fields.length > 0 && (
        <div style={{ ...S.fieldRow, ...T2.caption }}>
          <span>Label</span><span>Key</span><span>Type</span><span>Required</span><span />
        </div>
      )}
      {fields.map((f, i) => (
        <div key={i} style={S.fieldRow}>
          <input style={UI2.input} value={f.label} placeholder="Label shown to the owner"
            onChange={e => update(i, { label: e.target.value, ...(f._keyTouched ? {} : { key: toFieldKey(e.target.value) || f.key }) })} />
          <input style={UI2.input} value={f.key} onChange={e => update(i, { key: e.target.value, _keyTouched: true })} />
          <select style={UI2.select} value={f.type} onChange={e => update(i, { type: e.target.value })}>
            {types.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            {!types.some(t => t.code === f.type) && <option value={f.type}>{f.type} (inactive)</option>}
          </select>
          <label style={{ ...S.check, justifyContent: 'center' }}>
            <input type="checkbox" checked={!!f.required} onChange={e => update(i, { required: e.target.checked })} />
          </label>
          <button type="button" style={S.smallLink} onClick={() => remove(i)} aria-label="Remove field">
            <i className="ti ti-trash" />
          </button>
        </div>
      ))}
      <div><button type="button" style={S.small} onClick={add}><i className="ti ti-plus" /> Add field</button></div>
    </div>
  );
}

// ─── One page with its sections ──────────────────────────────────────────────
function PageEditor({ page, index, count, refs, onChange, onMove, onRemove }) {
  const [open, setOpen] = useState(index === 0);
  const sectionOptions = (refs.sections || []).filter(o => !page.sections.some(s => s.section === o.code));
  const setSections = (sections) => onChange({ ...page, sections });
  const updateSection = (i, patch) => setSections(page.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const moveSection = (i, d) => {
    const next = [...page.sections]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };

  return (
    <div style={S.block}>
      <div style={S.rowBetween}>
        <button type="button" style={{ ...S.smallLink, ...UI2.text.title }} onClick={() => setOpen(!open)}>
          <i className={`ti ti-chevron-${open ? 'down' : 'right'}`} /> {page.title || labelFor(refs.pages, page.page)}
          <span style={{ ...T2.caption, marginLeft: SP2.sm }}>{labelFor(refs.pages, page.page)} · {page.sections.length} sections</span>
        </button>
        <div style={UI2.row(SP2.xs)}>
          <label style={S.check}>
            <input type="checkbox" checked={page.enabled} onChange={e => onChange({ ...page, enabled: e.target.checked })} /> Enabled
          </label>
          <button type="button" style={S.smallLink} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move page up"><i className="ti ti-arrow-up" /></button>
          <button type="button" style={S.smallLink} disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move page down"><i className="ti ti-arrow-down" /></button>
          <button type="button" style={S.smallLink} onClick={onRemove} aria-label="Remove page"><i className="ti ti-trash" /></button>
        </div>
      </div>

      {open && (
        <>
          <div style={S.field}>
            <span style={S.label}>Page title</span>
            <input style={UI2.input} value={page.title} onChange={e => onChange({ ...page, title: e.target.value })} />
          </div>
          {page.sections.map((s, i) => (
            <div key={s.section} style={S.sectionBox}>
              <div style={S.rowBetween}>
                <span style={UI2.text.title}>{labelFor(refs.sections, s.section)}</span>
                <div style={UI2.row(SP2.xs)}>
                  <label style={S.check}>
                    <input type="checkbox" checked={s.enabled} onChange={e => updateSection(i, { enabled: e.target.checked })} /> Enabled
                  </label>
                  <button type="button" style={S.smallLink} disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label="Move section up"><i className="ti ti-arrow-up" /></button>
                  <button type="button" style={S.smallLink} disabled={i === page.sections.length - 1} onClick={() => moveSection(i, 1)} aria-label="Move section down"><i className="ti ti-arrow-down" /></button>
                  <button type="button" style={S.smallLink} onClick={() => setSections(page.sections.filter((_, j) => j !== i))} aria-label="Remove section"><i className="ti ti-trash" /></button>
                </div>
              </div>
              <div style={T2.caption}>{(refs.sections || []).find(o => o.code === s.section)?.description}</div>
              <div style={S.field}>
                <span style={S.label}>Default section title</span>
                <input style={UI2.input} value={s.title} placeholder="Optional" onChange={e => updateSection(i, { title: e.target.value })} />
              </div>
              <span style={S.label}>Editable fields</span>
              <FieldList fields={s.fields} refs={refs} onChange={fields => updateSection(i, { fields })} />
            </div>
          ))}
          {sectionOptions.length > 0 && (
            <select style={{ ...UI2.select, maxWidth: 320 }} value=""
              onChange={e => e.target.value && setSections([...page.sections, { section: e.target.value, title: '', enabled: true, fields: [] }])}>
              <option value="">+ Add section…</option>
              {sectionOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          )}
        </>
      )}
    </div>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────
const toForm = (t) => ({
  name: t?.name || '',
  description: t?.description || '',
  receivers: t?.receivers || [],
  purpose: t?.purpose || '',
  renderer_key: t?.renderer_key || '',
  structure: clone(t?.structure && Object.keys(t.structure).length ? t.structure : emptyStructure()),
  // Phase 2: UN Admin preview content (never part of a published version).
  sample_content: clone(t?.sample_content || {}),
});

// Drops UI-only helper flags before sending.
const toPayload = (form) => {
  const strip = (fields) => (fields || []).map(({ _keyTouched, ...f }) => f);
  const structure = {
    site_fields: strip(form.structure.site_fields),
    pages: form.structure.pages.map(p => ({ ...p, sections: p.sections.map(s => ({ ...s, fields: strip(s.fields) })) })),
    capabilities: form.structure.capabilities,
  };
  // Sample content only keeps values for fields the manifest still defines.
  return { ...form, structure, sample_content: pruneContent(form.sample_content, structure) };
};

export default function WebsiteTemplateEditor({ template, refs, onBack, onSaved }) {
  const [current, setCurrent] = useState(template);       // last server state (null when new)
  const [form, setForm] = useState(() => toForm(template));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [previewMode, setPreviewMode] = useState('draft');
  const [tab, setTab] = useState('structure');
  const navigate = useNavigate();

  const isNew = !current;
  const dirty = useMemo(() => JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(toForm(current))), [form, current]);
  const set = (patch) => { setForm(f => ({ ...f, ...patch })); setMessage(null); };
  const setStructure = (patch) => set({ structure: { ...form.structure, ...patch } });

  const pageOptions = (refs.pages || []).filter(o => !form.structure.pages.some(p => p.page === o.code));

  const run = async (fn, okText) => {
    setSaving(true); setError(null); setMessage(null);
    try {
      const saved = await fn();
      setCurrent(saved);
      setForm(toForm(saved));
      setMessage(okText);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const save = () => run(
    () => (isNew ? createTemplate(toPayload(form)) : updateTemplate(current.id, toPayload(form))),
    isNew ? 'Template created as a draft.' : 'Draft saved.',
  );
  const publish = () => run(() => publishTemplate(current.id), 'Published. New websites can now use this version.');
  const unpublish = () => run(() => unpublishTemplate(current.id), 'Unpublished. Existing websites keep their version.');

  const movePage = (i, d) => {
    const pages = [...form.structure.pages]; const j = i + d;
    if (j < 0 || j >= pages.length) return;
    [pages[i], pages[j]] = [pages[j], pages[i]];
    setStructure({ pages });
  };

  const previewStructure = previewMode === 'published' && current?.published_snapshot
    ? current.published_snapshot.structure : form.structure;

  return (
    <div style={UI2.stack(SP2.xl)}>
      <div style={S.rowBetween}>
        <button type="button" style={S.smallLink} onClick={onBack}><i className="ti ti-arrow-left" /> All templates</button>
        <div style={UI2.row(SP2.sm)}>
          {dirty && <span style={UI2.pill(TONES2.warning)}>Unsaved changes</span>}
          <button type="button" style={UI2.btn.outline} disabled={isNew || dirty}
            title={isNew || dirty ? 'Save first — the visual preview shows the saved template.' : undefined}
            onClick={() => navigate(`/admin-portal/config/website-templates/${current.id}/preview`)}>
            <i className="ti ti-eye" /> Visual preview
          </button>
          <button type="button" style={UI2.btn.primary} disabled={saving || !dirty} onClick={save}>
            <i className="ti ti-device-floppy" /> {isNew ? 'Create template' : 'Save draft'}
          </button>
        </div>
      </div>

      {error && <div style={S.error}>{error}</div>}
      {message && <div style={S.ok}>{message}</div>}

      <div style={S.layout}>
        <div style={S.col}>
          <TabBar variant="underline" value={tab} onChange={setTab}
            tabs={[{ id: 'structure', label: 'Structure', icon: 'ti-layout-list' }, { id: 'sample', label: 'Sample content', icon: 'ti-forms' }]} />
          {tab === 'structure' ? (
          <>
          <SectionCard icon="ti-template" title={isNew ? 'New website template' : form.name || 'Template'} subtitle="Configure an existing coded layout. Admin does not design layouts here.">
            <div style={UI2.stack(SP2.md)}>
              <div style={S.field}>
                <span style={S.label}>Template name *</span>
                <input style={UI2.input} value={form.name} onChange={e => set({ name: e.target.value })} />
              </div>
              <div style={S.field}>
                <span style={S.label}>Description</span>
                <textarea style={S.textarea} value={form.description} onChange={e => set({ description: e.target.value })} />
              </div>
              <div style={S.field}>
                <span style={S.label}>Available to personas *</span>
                <div style={{ ...UI2.row(SP2.lg), flexWrap: 'wrap' }}>
                  {(refs.personas || []).map(p => (
                    <label key={p.code} style={S.check}>
                      <input type="checkbox" checked={form.receivers.includes(p.code)}
                        onChange={e => set({ receivers: e.target.checked ? [...form.receivers, p.code] : form.receivers.filter(r => r !== p.code) })} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={S.grid2}>
                <div style={S.field}>
                  <span style={S.label}>Website purpose *</span>
                  <select style={UI2.select} value={form.purpose} onChange={e => set({ purpose: e.target.value })}>
                    <option value="">Select…</option>
                    {(refs.purposes || []).map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                </div>
                <div style={S.field}>
                  <span style={S.label}>Layout (renderer) *</span>
                  <select style={UI2.select} value={form.renderer_key} onChange={e => set({ renderer_key: e.target.value })}>
                    <option value="">Select…</option>
                    {(refs.renderers || []).map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon="ti-world" title="Site-wide content" subtitle="Branding and contact fields used across every page.">
            <FieldList fields={form.structure.site_fields} refs={refs} onChange={site_fields => setStructure({ site_fields })} />
          </SectionCard>

          <SectionCard icon="ti-layout-list" title="Pages and sections" subtitle="Order, enable and configure the pages of the coded layout.">
            <div style={UI2.stack(SP2.md)}>
              {form.structure.pages.length === 0 && <div style={UI2.emptyInline}>No pages yet.</div>}
              {form.structure.pages.map((p, i) => (
                <PageEditor key={p.page} page={p} index={i} count={form.structure.pages.length} refs={refs}
                  onChange={page => setStructure({ pages: form.structure.pages.map((x, j) => (j === i ? page : x)) })}
                  onMove={d => movePage(i, d)}
                  onRemove={() => setStructure({ pages: form.structure.pages.filter((_, j) => j !== i) })} />
              ))}
              {pageOptions.length > 0 && (
                <select style={{ ...UI2.select, maxWidth: 320 }} value=""
                  onChange={e => {
                    const code = e.target.value;
                    if (!code) return;
                    setStructure({ pages: [...form.structure.pages, { page: code, title: labelFor(refs.pages, code), enabled: true, sections: [] }] });
                  }}>
                  <option value="">+ Add page…</option>
                  {pageOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
              )}
            </div>
          </SectionCard>

          <SectionCard icon="ti-puzzle" title="Capabilities" subtitle="What websites built from this template can do.">
            <div style={UI2.stack(SP2.sm)}>
              {(refs.capabilities || []).map(c => (
                <label key={c.code} style={S.check}>
                  <input type="checkbox" checked={form.structure.capabilities.includes(c.code)}
                    onChange={e => setStructure({ capabilities: e.target.checked
                      ? [...form.structure.capabilities, c.code]
                      : form.structure.capabilities.filter(x => x !== c.code) })} />
                  <span><b>{c.label}</b>{c.description ? <span style={T2.caption}> — {c.description}</span> : null}</span>
                </label>
              ))}
            </div>
          </SectionCard>
          </>
          ) : (
            <SectionCard icon="ti-forms" title="Sample content"
              subtitle="Owner content used only by the UN Admin visual preview. Never part of a published version.">
              <ContentForm structure={form.structure} content={form.sample_content} refs={refs}
                onChange={sample_content => set({ sample_content })} />
            </SectionCard>
          )}
        </div>

        <div style={S.sticky}>
          {!isNew && (
            <SectionCard icon="ti-rocket" title="Publication"
              badge={<span style={UI2.pill(statusTone(current.status))}>{labelFor(refs.statuses, current.status)}</span>}>
              <div style={UI2.stack(SP2.sm)}>
                <div style={T2.body}>
                  {current.version ? `Version ${current.version} · published ${formatDate(current.published_at)}${current.published_by_email ? ` by ${current.published_by_email}` : ''}` : 'Never published.'}
                </div>
                {current.has_unpublished_changes && (
                  <div style={S.notice}>The saved draft differs from the published version. Publish to make it the next version.</div>
                )}
                {dirty && <div style={S.notice}>Save your changes before publishing.</div>}
                <div style={UI2.row(SP2.sm)}>
                  <button type="button" style={UI2.btn.success} disabled={saving || dirty
                    || (current.status === 'PUBLISHED' && !current.has_unpublished_changes)} onClick={publish}>
                    <i className="ti ti-upload" /> {current.version ? 'Publish new version' : 'Publish'}
                  </button>
                  {current.status === 'PUBLISHED' && (
                    <button type="button" style={UI2.btn.outline} disabled={saving} onClick={unpublish}>
                      <i className="ti ti-eye-off" /> Unpublish
                    </button>
                  )}
                </div>
                <div style={T2.caption}>
                  Unpublishing stops new websites from using this template. Websites already using a version keep it.
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard icon="ti-eye" title="Structural preview"
            subtitle="Pages, sections and owner-editable fields. Visual preview comes with the website renderer."
            action={current?.published_snapshot ? (
              <select style={{ ...UI2.select, width: 'auto' }} value={previewMode} onChange={e => setPreviewMode(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published v{current.version}</option>
              </select>
            ) : null}>
            <WebsiteTemplatePreview structure={previewStructure} refs={refs} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
