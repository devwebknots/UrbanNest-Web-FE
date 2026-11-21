import React from 'react';
import { C2, FS2, FW2, SP2, UI2 } from '../../constants/v2';

// ─── Breadcrumb (Design System v2) ───────────────────────────────────────────
// Trail above a detail page's hero. Last item is the current page.
//
//   <Breadcrumb items={[{ label: 'Properties', href: '/landlord-portal/portfolio' }, { label: 'LL01' }]} />
//
// Item: { label, href?, onClick? }

const S = {
  bar:  { ...UI2.row(SP2.sm), fontSize: FS2.md, flexWrap: 'wrap' },
  link: { ...UI2.btn.link, fontSize: FS2.md },
  sep:  { fontSize: FS2.sm, color: C2.textMuted },
  cur:  { fontWeight: FW2.semibold, color: C2.navyDeep },
};

export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" style={S.bar}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const go = it.onClick || (it.href ? () => { window.location.href = it.href; } : undefined);
        return (
          <React.Fragment key={`${it.label}-${i}`}>
            {i > 0 && <i className="ti ti-chevron-right" style={S.sep} aria-hidden="true" />}
            {last || !go
              ? <span style={S.cur} aria-current={last ? 'page' : undefined}>{it.label}</span>
              : <button type="button" className="un2-link" style={S.link} onClick={go}>{it.label}</button>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
