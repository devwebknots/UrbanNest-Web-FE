// UrbanNest Design System v2 — shared page building blocks.
//   import { PageShell, Grid, HeroBanner, SectionCard, StatCard } from '../../components/v2';
//
// Recipe for a new screen (no hand-written spacing, sizes or grid columns):
//
//   <PageShell activePage="leases" title="Leases" avatarText="NW">      ← sidebar + topbar + page padding + section gaps
//     <HeroBanner … />                                                   ← optional banner
//     <Grid layout="four"> <StatCard/> ×4 </Grid>                        ← KPI row
//     <Grid layout="wideLeft">                                           ← 2-column section (≈ 60 / 40)
//       <SectionCard icon="ti-…" title="…">…</SectionCard>
//       <SectionCard icon="ti-…" title="…">…</SectionCard>
//     </Grid>
//     <Grid layout="three"> …3 SectionCards… </Grid>
//     <SectionCard as="section" title="…">…</SectionCard>                ← full-width section
//     <PageFooter />
//   </PageShell>
//
// Grid layouts (GRID2 in constants/v2/layout.js): two · three · four · wideLeft · split · wideRight · aside
//
// Inside cards:
//   ListRow     icon/avatar + title + meta + trailing action (divided or hover rows)
//   EmptyState  illustration + message for empty card bodies (UI2.empty / UI2.emptyInline for text only)
//   MessageItem message bubble for dark cards
//   BarChart · DonutChart · Sparkline   Chart.js wrappers in v2 colours
//   UI2 (constants/v2/components.js) for text, pills, tags, buttons, icon boxes, tiles;
//   LAYOUT2.rowGap / inlineGap for spacing.
export { default as PageShell } from './PageShell';
export { default as TopBar } from './TopBar';
export { default as Grid } from './Grid';
export { default as HeroBanner, HeroStat } from './HeroBanner';
export { default as SectionCard, CardHeader } from './SectionCard';
export { default as StatCard, Wave } from './StatCard';
export { default as PropertyListItem } from './PropertyListItem';
export { default as InsightCard } from './InsightCard';
export { default as CardWave } from './CardWave';
export { default as ListRow } from './ListRow';
export { default as EmptyState } from './EmptyState';
export { default as MessageItem } from './MessageItem';
export { default as PageFooter } from './PageFooter';
export { BarChart, DonutChart, Sparkline } from './Charts';
