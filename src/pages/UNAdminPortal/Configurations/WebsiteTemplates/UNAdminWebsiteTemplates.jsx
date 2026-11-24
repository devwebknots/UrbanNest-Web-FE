// UNAdminWebsiteTemplates.jsx — CONFIGURATIONS → Website Templates
// (Session 60, Website Builder Phase 1).
//
// UN Admin manages the central library of website templates that PM and
// Landlord accounts build their websites from. A template is a manifest for
// an existing coded layout (renderer): Admin configures pages, sections,
// owner-editable fields and capabilities, and publishes versions. Admin does
// not design layouts here.
//
// Backend: /api/admin/website-templates/ (websites app), UN_ADMIN only.
// Every option list — statuses, personas, purposes, renderers, pages,
// sections, field types, capabilities — comes from UNReference module=WEBSITE
// via the references endpoint. Nothing here hardcodes an option value.
// The route is wrapped in UNAdminShell (App.js), which guards the UN_ADMIN persona.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard, DataTable, EmptyState, TabBar } from '../../../../components/v2';
import { C2, SP2, UI2, T2, TONES2 } from '../../../../constants/v2';
import WebsiteTemplateEditor from './WebsiteTemplateEditor';
import { getTemplates, getReferences } from './websiteTemplateApi';
import { labelFor, statusTone, formatDate } from './websiteTemplateShared';

const S = {
  page: UI2.stack(SP2.xl),
  header: { ...UI2.row(SP2.md), justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { ...T2.pageHeroTitle, fontSize: 28 },
  error: { ...UI2.inset, background: C2.errorTint, color: C2.errorDark, ...T2.body },
  nameCell: UI2.stack(SP2.xxs),
  pills: { ...UI2.row(SP2.xs), flexWrap: 'wrap' },
};

export default function UNAdminWebsiteTemplates() {
  const [templates, setTemplates] = useState([]);
  const [refs, setRefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editing, setEditing] = useState(undefined);   // undefined = list, null = new, object = edit
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [list, references] = await Promise.all([getTemplates(), getReferences()]);
      setTemplates(list || []);
      setRefs(references);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSaved = (saved) => {
    setTemplates(prev => {
      const exists = prev.some(t => t.id === saved.id);
      const next = exists ? prev.map(t => (t.id === saved.id ? saved : t)) : [...prev, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const tabs = useMemo(() => {
    const count = (code) => templates.filter(t => t.status === code).length;
    return [
      { id: 'ALL', label: 'All', count: templates.length },
      ...((refs?.statuses) || []).map(s => ({ id: s.code, label: s.label, count: count(s.code) })),
    ];
  }, [templates, refs]);

  const rows = statusFilter === 'ALL' ? templates : templates.filter(t => t.status === statusFilter);

  if (editing !== undefined && refs) {
    return (
      <WebsiteTemplateEditor
        key={editing ? editing.id : 'new'}
        template={editing}
        refs={refs}
        onBack={() => setEditing(undefined)}
        onSaved={onSaved}
      />
    );
  }

  const columns = [
    {
      key: 'name', label: 'Template', type: 'primary', width: 2,
      render: t => (
        <div style={S.nameCell}>
          <span>{t.name}</span>
          {t.description ? <span style={T2.caption}>{t.description}</span> : null}
        </div>
      ),
    },
    {
      key: 'receivers', label: 'Personas', width: 1.2,
      render: t => (
        <div style={S.pills}>
          {(t.receivers || []).map(r => <span key={r} style={UI2.tag(TONES2.primary)}>{labelFor(refs?.personas, r)}</span>)}
        </div>
      ),
    },
    { key: 'purpose', label: 'Purpose', render: t => labelFor(refs?.purposes, t.purpose) },
    {
      key: 'status', label: 'Status', type: 'status', fit: true,
      render: t => (
        <div style={S.pills}>
          <span style={UI2.pill(statusTone(t.status))}>{labelFor(refs?.statuses, t.status)}</span>
          {t.has_unpublished_changes && <span style={UI2.tag(TONES2.warning)}>Unpublished changes</span>}
        </div>
      ),
    },
    { key: 'version', label: 'Version', type: 'secondary', fit: true, render: t => (t.version ? `v${t.version}` : '—') },
    { key: 'published_at', label: 'Published', type: 'secondary', fit: true, render: t => formatDate(t.published_at) },
    {
      key: 'actions', label: '', fit: true,
      render: t => (
        <div style={UI2.row(SP2.xs)}>
          <button type="button" style={{ ...UI2.btn.outline, ...UI2.btnSm }}
            onClick={() => navigate(`/admin-portal/config/website-templates/${t.id}/preview`)}>
            <i className="ti ti-eye" /> Preview
          </button>
          <button type="button" style={{ ...UI2.btn.outline, ...UI2.btnSm }} onClick={() => setEditing(t)}>
            <i className="ti ti-edit" /> Open
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={UI2.stack(SP2.xs)}>
          <div style={UI2.text.eyebrow}>Configurations · Website Builder</div>
          <div style={S.title}>Website Templates</div>
          <div style={T2.label}>
            Templates PM and Landlord accounts build their websites from. Publishing makes a version available;
            websites keep the version they were created from.
          </div>
        </div>
        <button type="button" style={UI2.btn.primary} disabled={!refs} onClick={() => setEditing(null)}>
          <i className="ti ti-plus" /> New template
        </button>
      </div>

      {error && (
        <div style={S.error}>
          {error} <button type="button" style={UI2.btn.link} onClick={load}>Retry</button>
        </div>
      )}

      <SectionCard icon="ti-template" title="Template library" subtitle={loading ? 'Loading…' : `${templates.length} templates`}>
        <div style={UI2.stack(SP2.lg)}>
          <TabBar variant="underline" value={statusFilter} onChange={setStatusFilter} tabs={tabs} />
          {loading ? (
            <div style={UI2.empty}>Loading templates…</div>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={t => t.id}
              empty={<EmptyState icon="ti-template-off" text="No templates in this view." />}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
