import React from 'react';
import { C2, FS2, SP2, LAYOUT2, T2, UI2 } from '../../constants';

// ─── SectionHeader (Design System v2) ────────────────────────────────────────
// Heading for a page section that is NOT inside a card (e.g. a grid of PropertyCards):
// plain icon · Playfair title · optional filters right after the title · optional action at the end.
// Wrap it with its content in one element so PageShell spaces the whole section:
//
//   <section style={UI2.stack(LAYOUT2.cardHeaderGap)}>
//     <SectionHeader icon="ti-home" title="Managed Assets"
//                    filters={chips} action={<SearchField />} />
//     <Grid layout="three" as="div">…</Grid>
//   </section>
//
// Props: icon, title, filters (node), action (node)
// Narrow screens: filters / action move onto their own line instead of squeezing the title.

const S = {
  bar:     { display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: SP2.xl, rowGap: LAYOUT2.rowGap },
  title:   { ...UI2.row(SP2.sm), ...T2.pageTitle, whiteSpace: 'nowrap' },
  icon:    { fontSize: FS2.xxl, color: C2.primary },
  filters: { ...UI2.row(LAYOUT2.inlineGap), flexWrap: 'wrap' },
  action:  { marginLeft: 'auto' },
};

export default function SectionHeader({ icon, title, filters, action }) {
  return (
    <div style={S.bar}>
      <h2 style={{ ...S.title, margin: 0 }}>
        {icon && <i className={`ti ${icon}`} style={S.icon} aria-hidden="true" />}
        {title}
      </h2>
      {filters && <div style={S.filters}>{filters}</div>}
      {action && <div style={S.action}>{action}</div>}
    </div>
  );
}
