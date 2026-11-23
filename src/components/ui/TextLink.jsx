import React from 'react';
import { FS2, UI2 } from '../../constants';

// ─── TextLink (Design System v2) ─────────────────────────────────────────────
// Inline text action with a trailing arrow that slides right on hover (un2-link-arrow).
// Same type as UI2.btn.link (Inter Medium, primary blue). Use it for "View All →",
// "Manage all properties →", "Assign Vendor →" — never hand-build a link button on a page.
//
//   <TextLink onClick={() => navigate('/landlord-portal/portfolio')}>View Portfolio</TextLink>
//   <TextLink size="xs">Assign Vendor</TextLink>
//   <TextLink arrow={false}>Upload</TextLink>
//
// Props: children, onClick, size ('sm' default 12px | 'xs' 11px), arrow (default true), style

export default function TextLink({ children, onClick, size = 'sm', arrow = true, style }) {
  return (
    <button
      type="button"
      className="un2-link-arrow"
      style={{ ...UI2.btn.link, ...(size === 'xs' ? { fontSize: FS2.xs } : {}), ...style }}
      onClick={onClick}
    >
      {children}
      {arrow && <i className="ti ti-arrow-right" aria-hidden="true" />}
    </button>
  );
}
