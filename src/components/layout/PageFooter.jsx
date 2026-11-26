import React from 'react';
import { C2, SP2, SZ2, pad, UI2 } from '../../constants';

// ─── PageFooter (Design System v2) ───────────────────────────────────────────
// Last child of PageShell / PMPageShell on every v2 screen. Always sits at the bottom of the screen when the
// page content is shorter than the window (never floats up under short content).
//
//   <PageFooter />
//   <PageFooter links={[{ label: 'Privacy Policy', onClick: … }]} />

const DEFAULT_LINKS = [
  { label: 'Privacy Policy' },
  { label: 'Terms of Service' },
  { label: 'Global Compliance' },
];

const S = {
  // marginTop 'auto' → the shell's content column is a flex column, so on a short page the footer sits at the
  // bottom of the screen instead of floating right under the content; long pages are unaffected
  footer: { marginTop: 'auto', textAlign: 'center', ...UI2.text.caption, padding: pad(SP2.lg, 0, SP2.xs), borderTop: `${SZ2.hairline}px solid ${C2.border}` },
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
