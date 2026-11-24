// WebsiteRenderer — the single renderer for every UrbanNest website
// (Website Builder Phase 2). Pure: it fetches nothing and holds no business
// rules. A container supplies three inputs:
//
//   manifest  the template manifest — WebsiteTemplate.published_snapshot or
//             the saved draft (same shape); later Website.template_snapshot
//   content   owner content { site, pages } — WebsiteTemplate.sample_content
//             in UN Admin preview; later Website.content
//   data      PMS data, using the existing public Marketplace payloads:
//             { properties: { status, items: [card] }, property: { status, item } }
//             item = propertyData.detailView(detail payload)
//
// plus page (current page code), mode ('preview' | 'live') and onNavigate.
//
// The layout comes from manifest.renderer_key (layout registry below). Pages,
// sections, order and visibility come from manifest.structure; capabilities
// switch interactive elements; text and images come from content. Persona is
// never checked here: it only decides which template an account gets.

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { WebsiteContext, enabledPages } from './WebsiteContext';
import { SECTION_REGISTRY, placementOf } from './sectionRegistry';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { ContactPair } from './sections/ContactSections';
import { PropertyHeader } from './sections/PropertySections';
import { Band, EmptyNote } from './primitives';
import { themeVars, FONT, NEUTRAL, V, COMPACT_BELOW } from './websiteTheme';

// Layout registry: renderer_key → layout variant. Both layouts share every
// section; they differ only in chrome and a few presentation choices.
export const LAYOUT_REGISTRY = {
  COMMUNITY_SITE: 'community',
  PORTFOLIO_SITE: 'portfolio',
};

function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(1280);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // offsetWidth is the layout width, unaffected by a CSS scale applied by a
    // preview container, so a scaled-down desktop frame keeps its desktop layout.
    const update = () => setWidth(el.offsetWidth || el.getBoundingClientRect().width || 1280);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function renderSection(section, mode) {
  const entry = SECTION_REGISTRY[section.section];
  if (!entry) {
    // A section with no coded component yet: invisible on a live site,
    // flagged in preview.
    return mode === 'preview'
      ? <Band key={section.section}><EmptyNote icon="ti-puzzle-off">Section “{section.section}” has no layout yet.</EmptyNote></Band>
      : null;
  }
  const Component = entry.component;
  return <Component key={section.section} section={section} />;
}

// Renders a page's enabled sections in order. CONTACT_DETAILS immediately
// followed by CONTACT_FORM render as one paired block (as in the designs).
function PageBody({ pageConfig, mode }) {
  const sections = (pageConfig.sections || []).filter(s => s.enabled);
  const out = [];
  for (let i = 0; i < sections.length; i += 1) {
    const s = sections[i];
    const next = sections[i + 1];
    if (s.section === 'CONTACT_DETAILS' && next && next.section === 'CONTACT_FORM') {
      out.push(<ContactPair key="contact-pair" details={s} form={next} />);
      i += 1;
    } else {
      out.push(renderSection(s, mode));
    }
  }
  return out;
}

// Property Details: fixed property header, full-width sections, then a
// two-column area (main + sticky aside), as in the design.
function PropertyDetailsBody({ pageConfig, mode, compact }) {
  const sections = (pageConfig.sections || []).filter(s => s.enabled);
  const full = sections.filter(s => placementOf(s.section) === 'full');
  const main = sections.filter(s => placementOf(s.section) === 'main');
  const aside = sections.filter(s => placementOf(s.section) === 'aside');
  return (
    <>
      <PropertyHeader />
      {full.map(s => renderSection(s, mode))}
      {(main.length > 0 || aside.length > 0) && (
        <Band style={{ paddingTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'minmax(0, 3fr) minmax(0, 2fr)', gap: compact ? 24 : 40, alignItems: 'start' }}>
            <div style={{ order: compact ? 2 : 1 }}>{main.map(s => renderSection(s, mode))}</div>
            <div style={{ order: compact ? 1 : 2, position: compact ? 'static' : 'sticky', top: 90 }}>{aside.map(s => renderSection(s, mode))}</div>
          </div>
        </Band>
      )}
    </>
  );
}

export default function WebsiteRenderer({ manifest, content, data, page, mode = 'preview', onNavigate }) {
  const [ref, width] = useContainerWidth();
  const compact = width < COMPACT_BELOW;
  const layout = LAYOUT_REGISTRY[manifest?.renderer_key];
  const pages = enabledPages(manifest);
  const pageConfig = pages.find(p => p.page === page) || pages[0];

  const ctx = useMemo(() => ({
    manifest, content: content || {}, data: data || {}, page: pageConfig ? pageConfig.page : null,
    mode, compact, layout, navigate: (to, params) => onNavigate && onNavigate(to, params),
  }), [manifest, content, data, pageConfig, mode, compact, layout, onNavigate]);

  const root = {
    ...themeVars(content?.site), background: V.bg, color: NEUTRAL.text, fontFamily: FONT.body,
    minHeight: '100%', width: '100%',
  };

  let body;
  if (!layout) {
    body = <Band><EmptyNote icon="ti-layout-off">The layout “{manifest?.renderer_key || '—'}” is not available.</EmptyNote></Band>;
  } else if (!pageConfig) {
    body = <Band><EmptyNote icon="ti-file-off">This website has no enabled pages.</EmptyNote></Band>;
  } else if (pageConfig.page === 'PROPERTY_DETAILS') {
    body = <PropertyDetailsBody pageConfig={pageConfig} mode={mode} compact={compact} />;
  } else {
    body = <PageBody pageConfig={pageConfig} mode={mode} />;
  }

  return (
    <div ref={ref} style={root} data-website-layout={layout || 'none'} data-website-page={pageConfig ? pageConfig.page : ''}>
      <WebsiteContext.Provider value={ctx}>
        {layout && <SiteHeader variant={layout} />}
        <main>{body}</main>
        {layout && <SiteFooter />}
      </WebsiteContext.Provider>
    </div>
  );
}
