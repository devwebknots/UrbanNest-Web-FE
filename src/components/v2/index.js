// UrbanNest Design System v2 — shared page building blocks.
//   import { PageShell, HeroBanner, SectionCard, StatCard } from '../../components/v2';
//
// Recipe for a new screen (no hand-written spacing needed):
//
//   <PageShell activePage="leases" title="Leases" avatarText="NW">      ← page padding + section gaps
//     <HeroBanner … />                                                   ← optional banner
//     <section className="un2-grid-4"> <StatCard/> ×4 </section>         ← KPI row
//     <section className="un2-grid-wide-left">                           ← 2-column section
//       <SectionCard icon="ti-…" title="…">…</SectionCard>
//       <SectionCard icon="ti-…" title="…">…</SectionCard>
//     </section>
//     <SectionCard as="section" title="…">…</SectionCard>                ← full-width section
//   </PageShell>
//
// Inside cards use UI2 (constants/v2/components.js) and LAYOUT2.rowGap / inlineGap.
export { default as PageShell } from './PageShell';
export { default as TopBar } from './TopBar';
export { default as HeroBanner, HeroStat } from './HeroBanner';
export { default as SectionCard, CardHeader } from './SectionCard';
export { default as StatCard, Wave } from './StatCard';
export { default as PropertyListItem } from './PropertyListItem';
export { default as InsightCard } from './InsightCard';
export { default as CardWave } from './CardWave';
