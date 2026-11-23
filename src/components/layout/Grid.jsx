import React from 'react';
import { GRID2 } from '../../constants';

// ─── Grid (Design System v2) ─────────────────────────────────────────────────
// Responsive section grid. The column split, gap and breakpoints are fixed by
// the design system (see GRID2 in constants/layout.js) — pick a layout name,
// never write your own grid-template-columns.
//
//   <Grid layout="four">      {kpis.map(k => <StatCard {...k} />)}  </Grid>
//   <Grid layout="wideLeft">  <SectionCard …/> <SectionCard …/>      </Grid>
//   <Grid layout="aside" as="div">  <Chart/> <Summary/>              </Grid>   ← inside a card
//
// Props: layout ('two' | 'three' | 'four' | 'wideLeft' | 'split' | 'wideRight' | 'aside' | 'mainSide')
//        as (default 'section') · className · style · children

export default function Grid({ layout = 'two', as: Tag = 'section', className, style, children }) {
  const cls = GRID2[layout];
  if (!cls && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[v2 Grid] unknown layout "${layout}". Use one of: ${Object.keys(GRID2).join(', ')}`);
  }
  return (
    <Tag className={[cls, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </Tag>
  );
}
