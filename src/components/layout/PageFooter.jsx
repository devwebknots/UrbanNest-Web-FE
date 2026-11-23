import React from 'react';
import { C2, SP2, SZ2, pad, UI2 } from '../../constants';

// ─── PageFooter (Design System v2) ───────────────────────────────────────────
// Last child of PageShell on every v2 screen.
//
//   <PageFooter />
//   <PageFooter links={[{ label: 'Privacy Policy', onClick: … }]} />

const DEFAULT_LINKS = [
  { label: 'Privacy Policy' },
  { label: 'Terms of Service' },
  { label: 'Global Compliance' },
];

const S = {
  footer: { textAlign: 'center', ...UI2.text.caption, padding: pad(SP2.lg, 0, SP2.xs), borderTop: `${SZ2.hairline}px solid ${C2.border}` },
  links:  { marginTop: SP2.sm, display: 'flex', justifyContent: 'center', gap: SP2.lg },
  link:   { cursor: 'pointer' },
};

export default function PageFooter({
  text = '© 2023 UrbanNest Property Management. All Rights Reserved.',
  links = DEFAULT_LINKS,
}) {
  return (
    <footer style={S.footer}>
      {text}
      <div style={S.links}>
        {links.map(l => (
          <span key={l.label} style={S.link} onClick={l.onClick}>{l.label}</span>
        ))}
      </div>
    </footer>
  );
}
