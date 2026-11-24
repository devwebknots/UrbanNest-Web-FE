// Site header and footer, shared by every layout. The layout passes its
// variant ('community' | 'portfolio'); all text comes from site content and
// the navigation from the manifest's enabled pages.

import React, { useState } from 'react';
import { useWebsite, useSite, enabledPages } from './WebsiteContext';
import { Action, Picture } from './primitives';
import { FONT, NEUTRAL, MAX_WIDTH, V } from './websiteTheme';

// Detail pages are reached from property cards, never from the menu.
const OFF_MENU = ['PROPERTY_DETAILS'];

function Brand({ site }) {
  return (
    <div>
      <div style={{ fontFamily: FONT.heading, fontSize: 22, color: NEUTRAL.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>{site.site_name}</div>
      {site.tagline && <div style={{ fontFamily: FONT.body, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: V.accent }}>{site.tagline}</div>}
    </div>
  );
}

export function SiteHeader({ variant }) {
  const { manifest, page, navigate, compact } = useWebsite();
  const site = useSite();
  const [open, setOpen] = useState(false);
  const pages = enabledPages(manifest).filter(p => !OFF_MENU.includes(p.page));
  const current = page === 'PROPERTY_DETAILS' ? 'PROPERTIES' : page;
  const links = pages.map(p => (
    <button key={p.page} type="button" onClick={() => { setOpen(false); navigate(p.page); }}
      style={{
        border: 'none', background: 'none', cursor: 'pointer', padding: compact ? '12px 0' : 0, textAlign: 'left',
        fontFamily: FONT.body, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
        color: p.page === current ? NEUTRAL.text : NEUTRAL.muted, fontWeight: p.page === current ? 600 : 400,
      }}>{p.title}</button>
  ));
  return (
    <header style={{ background: 'rgba(255,255,255,0.7)', borderBottom: `1px solid ${NEUTRAL.border}`, position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(8px)' }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: compact ? '14px 20px' : '16px 40px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Brand site={site} />
        <div style={{ flex: 1 }} />
        {compact ? (
          <button type="button" aria-label="Menu" onClick={() => setOpen(!open)}
            style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: NEUTRAL.text }}>
            <i className={`ti ${open ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
          </button>
        ) : (
          <>
            <nav style={{ display: 'flex', gap: 28 }}>{links}</nav>
            <div style={{ flex: 1 }} />
            {site.contact_phone && (
              <div style={{ textAlign: 'right', fontFamily: FONT.body }}>
                {variant === 'portfolio' && <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: NEUTRAL.muted }}>Direct line</div>}
                <div style={{ fontSize: 12, color: NEUTRAL.text }}>{site.contact_phone}</div>
              </div>
            )}
            <Action small to="PROPERTIES">{site.header_cta_label}</Action>
            {site.header_avatar && <Picture src={site.header_avatar} alt="" height={38} ratio="1 / 1" rounded="50%" />}
          </>
        )}
      </div>
      {compact && open && <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 20px 12px' }}>{links}</nav>}
    </header>
  );
}

export function SiteFooter() {
  const { manifest, navigate, compact } = useWebsite();
  const site = useSite();
  const pages = enabledPages(manifest).filter(p => !OFF_MENU.includes(p.page));
  const col = (title, children) => (
    <div>
      <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: NEUTRAL.text, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: FONT.body, fontSize: 13, color: NEUTRAL.body }}>{children}</div>
    </div>
  );
  return (
    <footer style={{ background: V.panel, marginTop: 24 }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: compact ? '36px 20px' : '56px 40px', display: 'grid', gridTemplateColumns: compact ? '1fr' : '1.4fr 1fr 1.4fr', gap: 32 }}>
        <div>
          <Brand site={site} />
          {site.footer_about && <p style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 1.7, color: NEUTRAL.body, marginTop: 14 }}>{site.footer_about}</p>}
          {site.license_note && <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: V.accent, marginTop: 10 }}>{site.license_note}</div>}
        </div>
        {col('Navigation', pages.map(p => (
          <button key={p.page} type="button" onClick={() => navigate(p.page)}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}>{p.title}</button>
        )))}
        {col('Contact', [
          site.contact_phone && <span key="p">{site.contact_phone}</span>,
          site.contact_email && <span key="e">{site.contact_email}</span>,
          site.footer_hours && <span key="h">{site.footer_hours}</span>,
          site.footer_address && <span key="a" style={{ whiteSpace: 'pre-line' }}>{site.footer_address}</span>,
        ])}
      </div>
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: compact ? '16px 20px 28px' : '18px 40px 32px', borderTop: `1px solid ${NEUTRAL.border}`, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontFamily: FONT.body, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.muted }}>
        <span>{site.legal_name ? `© ${new Date().getFullYear()} ${site.legal_name}. All rights reserved.` : ''}</span>
        {site.footer_motto && <span style={{ color: V.accent }}>{site.footer_motto}</span>}
      </div>
    </footer>
  );
}
