// WebsiteTemplateVisualPreview.jsx — UN Admin visual preview of a website
// template (Website Builder Phase 2).
// Route: /admin-portal/config/website-templates/:id/preview (inside UNAdminShell).
//
// Container around the shared WebsiteRenderer:
//   manifest — published snapshot or saved draft (switch)
//   content  — the template's sample_content (UN Admin only)
//   data     — public Marketplace listings (previewDataSource.js)
// Desktop / mobile width toggle and page tabs. Preview mode keeps every action
// inert: no application, booking or email call is ever made from here.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SectionCard, TabBar } from '../../../../components/ui';
import { C2, SP2, R2, UI2, T2, TONES2 } from '../../../../constants';
import WebsiteRenderer from '../../../../components/website/WebsiteRenderer';
import { detailView } from '../../../../components/website/propertyData';
import { getTemplate, getReferences } from './websiteTemplateApi';
import { getSampleProperties, getSamplePropertyDetail } from './previewDataSource';
import { labelFor, statusTone } from './websiteTemplateShared';

const WIDTHS = { desktop: 1280, mobile: 390 };

// Scales a fixed-width frame down to fit the stage. The frame keeps its true
// layout width (the renderer measures offsetWidth), only its painted size shrinks.
function useFitScale(frameWidth, ready) {
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, width: frameWidth, height: 0 });
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return undefined;
    const update = () => {
      const cs = window.getComputedStyle(stage);
      const avail = stage.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      const width = frame.offsetWidth || frameWidth; // includes the frame border
      const scale = avail > 0 ? Math.min(1, avail / width) : 1;
      setFit({ scale, width, height: frame.offsetHeight });
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [frameWidth, ready]);
  return [stageRef, frameRef, fit];
}

const S = {
  bar: { ...UI2.row(SP2.md), flexWrap: 'wrap', justifyContent: 'space-between' },
  controls: { ...UI2.row(SP2.sm), flexWrap: 'wrap' },
  stage: { background: C2.surfaceMuted, borderRadius: R2.lg, padding: SP2.xl, overflow: 'hidden' },
  holder: (fit) => ({ width: fit.width * fit.scale, height: fit.height ? fit.height * fit.scale : 'auto', margin: '0 auto' }),
  scaled: (fit) => ({ transform: fit.scale < 1 ? `scale(${fit.scale})` : 'none', transformOrigin: 'top left' }),
  frame: (w) => ({
    width: w, background: C2.white, borderRadius: w < 600 ? 28 : R2.md, overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(15,23,42,0.18)', border: w < 600 ? `10px solid ${C2.navyDeep}` : `1px solid ${C2.cardBorder}`,
  }),
  error: { ...UI2.inset, background: C2.errorTint, color: C2.errorDark, ...T2.body },
  note: { ...T2.caption, ...UI2.row(SP2.xs) },
};

export default function WebsiteTemplateVisualPreview() {
  const { id } = useParams();
  const navigateRoute = useNavigate();
  const [template, setTemplate] = useState(null);
  const [refs, setRefs] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState('draft');
  const [device, setDevice] = useState('desktop');
  const [page, setPage] = useState(null);
  const [properties, setProperties] = useState({ status: 'loading', items: [] });
  const [propertyId, setPropertyId] = useState(null);
  const [property, setProperty] = useState({ status: 'empty', item: null });

  useEffect(() => {
    let alive = true;
    Promise.all([getTemplate(id), getReferences()])
      .then(([t, r]) => { if (alive) { setTemplate(t); setRefs(r); if (t.published_snapshot) setVersion('published'); } })
      .catch(e => alive && setError(e.message));
    getSampleProperties()
      .then(items => { if (alive) { setProperties({ status: 'ready', items }); if (items[0]) setPropertyId(items[0].id); } })
      .catch(() => alive && setProperties({ status: 'error', items: [] }));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!propertyId) { setProperty({ status: 'empty', item: null }); return undefined; }
    let alive = true;
    setProperty({ status: 'loading', item: null });
    getSamplePropertyDetail(propertyId)
      .then(d => alive && setProperty({ status: 'ready', item: detailView(d) }))
      .catch(() => alive && setProperty({ status: 'error', item: null }));
    return () => { alive = false; };
  }, [propertyId]);

  // The manifest being previewed: the published version or the saved draft.
  const manifest = useMemo(() => {
    if (!template) return null;
    if (version === 'published' && template.published_snapshot) return template.published_snapshot;
    const { name, description, receivers, purpose, renderer_key, structure } = template;
    return { name, description, receivers, purpose, renderer_key, structure };
  }, [template, version]);

  const pages = useMemo(() => (manifest?.structure?.pages || []).filter(p => p.enabled), [manifest]);
  const currentPage = pages.some(p => p.page === page) ? page : (pages[0] && pages[0].page);

  const onNavigate = useCallback((to, params) => {
    if (params && params.propertyId) setPropertyId(params.propertyId);
    setPage(to);
    const el = document.getElementById('website-preview-stage');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const data = useMemo(() => ({ properties, property }), [properties, property]);
  const frameWidth = WIDTHS[device];
  const [stageRef, frameRef, fit] = useFitScale(frameWidth, Boolean(template && refs));

  if (error) return <div style={S.error}>{error}</div>;
  if (!template || !refs) return <div style={UI2.empty}>Loading preview…</div>;

  const versionOptions = [
    ...(template.published_snapshot ? [{ id: 'published', label: `Published v${template.version}` }] : []),
    { id: 'draft', label: 'Saved draft' },
  ];

  return (
    <div style={UI2.stack(SP2.xl)}>
      <div style={S.bar}>
        <div style={UI2.stack(SP2.xs)}>
          <button type="button" style={{ ...UI2.btn.link, alignSelf: 'flex-start' }}
            onClick={() => navigateRoute('/admin-portal/config/website-templates')}>
            <i className="ti ti-arrow-left" /> All templates
          </button>
          <div style={{ ...UI2.row(SP2.sm) }}>
            <span style={{ ...T2.pageHeroTitle, fontSize: 26 }}>{template.name}</span>
            <span style={UI2.pill(statusTone(template.status))}>{labelFor(refs.statuses, template.status)}</span>
          </div>
          <div style={S.note}>
            <i className="ti ti-info-circle" />
            Visual preview with sample content and public UrbanNest Marketplace listings as sample property data.
            Apply, viewing, contact and external links are not active here.
          </div>
        </div>
        <div style={S.controls}>
          <select style={{ ...UI2.select, width: 'auto' }} value={version} onChange={e => setVersion(e.target.value)} aria-label="Version">
            {versionOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          {Object.keys(WIDTHS).map(d => (
            <button key={d} type="button" onClick={() => setDevice(d)} style={UI2.filterChip(device === d)}>
              <i className={`ti ${d === 'desktop' ? 'ti-device-desktop' : 'ti-device-mobile'}`} /> {d === 'desktop' ? 'Desktop' : 'Mobile'}
            </button>
          ))}
        </div>
      </div>

      <SectionCard icon="ti-browser" title="Pages"
        subtitle={properties.status === 'ready' ? `${properties.items.length} sample listings available` : (properties.status === 'error' ? 'Sample listings could not be loaded' : 'Loading sample listings…')}
        action={currentPage === 'PROPERTY_DETAILS' && properties.items.length > 0 ? (
          <select style={{ ...UI2.select, width: 260 }} value={propertyId || ''} onChange={e => setPropertyId(e.target.value)} aria-label="Sample property">
            {properties.items.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        ) : null}>
        <TabBar variant="underline" value={currentPage} onChange={setPage}
          tabs={pages.map(p => ({ id: p.page, label: p.title || labelFor(refs.pages, p.page) }))} />
      </SectionCard>

      <div id="website-preview-stage" ref={stageRef} style={S.stage}>
        <div style={S.holder(fit)}>
          <div style={S.scaled(fit)}>
            <div ref={frameRef} style={S.frame(frameWidth)} data-testid="website-preview-frame">
              <WebsiteRenderer manifest={manifest} content={template.sample_content || {}} data={data}
                page={currentPage} mode="preview" onNavigate={onNavigate} />
            </div>
          </div>
        </div>
      </div>
      {fit.scale < 1 && (
        <div style={{ ...S.note, color: TONES2.neutral.fg }}>
          <i className="ti ti-zoom-out" /> Shown at {Math.round(fit.scale * 100)}% to fit; laid out at {frameWidth}px.
        </div>
      )}
      <div style={{ ...S.note, color: TONES2.neutral.fg }}>
        Sample content is edited in the template editor → Sample content tab. It is never part of a published version.
      </div>
    </div>
  );
}
