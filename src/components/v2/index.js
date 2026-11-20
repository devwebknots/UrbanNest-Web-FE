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
//   MediaListItem photo tile + label/value rows (units, listings)
//   DataTable   header + rows table (ledgers, directories)
//   ActionTile  tinted 2×2 action tiles · MetricBar label/value + progress bar
//   BarChart · DonutChart · Sparkline · LineChart · Gauge   charts in v2 colours
//   PropertyCard  photo card for portfolio grids · SectionHeader  heading + filters above a card grid
//   PropertyRow wide property row (photo · name/status · ownership ring · stats · links) for the portfolio list
//   AssetRow    light property row (photo · tags · inline metrics · actions) for dashboards
//   ProgressRing · MiniBars  animated ring / small month bars · CountUp  animated number
//
// Dashboard pieces (Landlord dashboard is the reference):
//   ProfileHero light hero, photo feathered in on the right · KpiStrip  4 KPIs in ONE container
//   OpenHero    open page hero (no box, bleeds to the edges) + full-width stats band — list pages (Portfolio)
//   PageWave    soft sky wash + rolling waves behind the top bar / header — <PageShell backdrop={<PageWave />}>
//   <PageShell animate> staggers the sections in on load
//   Detail pages: DetailHeader (title · pill · Edit · address + aside) · StatGroup (stats in one container)
//                 PhotoBento (big photo + 2×2 tiles + Add) · un2-cols (divided columns in one panel)
//   TextLink    "View All →" text action with sliding arrow (never hand-build link buttons)
//   FilterMenu  filter icon in a card header → dropdown to pick one option (e.g. a property)
//   Card patterns in UI2: cardFill · capsLabel · labelRow · context · subhead · cardFoot · strong ·
//   delta() · amount() · legendRow/Key/Val · accentItem() · tintRow  (see constants/v2/components.js)
//
// Page chrome:
//   Breadcrumb  trail above a detail hero · TabBar (pill = page sections, underline = in-card)
//   PropertyHero photo-slider banner for property / unit detail pages (pair with a StatTile snapshot card)
//   StatTile    icon + value + label tile (2×2 snapshot grids)
//   UI2 (constants/v2/components.js) for text, pills, tags, buttons, icon boxes, tiles;
//   LAYOUT2.rowGap / inlineGap for spacing.
export { default as PageShell } from './PageShell';
export { default as TopBar } from './TopBar';
export { default as Grid } from './Grid';
export { default as HeroBanner, HeroStat } from './HeroBanner';
export { default as PropertyHero } from './PropertyHero';
export { default as StatTile } from './StatTile';
export { default as SectionCard, CardHeader } from './SectionCard';
export { default as StatCard, Wave } from './StatCard';
export { default as PropertyListItem } from './PropertyListItem';
export { default as InsightCard } from './InsightCard';
export { default as CardWave } from './CardWave';
export { default as ListRow } from './ListRow';
export { default as EmptyState } from './EmptyState';
export { default as MessageItem } from './MessageItem';
export { default as PageFooter } from './PageFooter';
export { default as Breadcrumb } from './Breadcrumb';
export { default as TabBar } from './TabBar';
export { default as MetricBar } from './MetricBar';
export { default as ActionTile } from './ActionTile';
export { default as MediaListItem } from './MediaListItem';
export { default as PropertyCard, OptionsMenu } from './PropertyCard';
export { default as PropertyRow } from './PropertyRow';
export { default as SectionHeader } from './SectionHeader';
export { default as DataTable } from './DataTable';
export { default as ProfileHero } from './ProfileHero';
export { default as OpenHero } from './OpenHero';
export { default as PageWave } from './PageWave';
export { default as KpiStrip } from './KpiStrip';
export { default as AssetRow } from './AssetRow';
export { default as CountUp } from './CountUp';
export { default as TextLink } from './TextLink';
export { default as DetailHeader } from './DetailHeader';
export { default as StatGroup } from './StatGroup';
export { default as FilterMenu } from './FilterMenu';
export { default as PhotoBento } from './PhotoBento';
export { BarChart, DonutChart, Sparkline, LineChart, Gauge, ProgressRing, MiniBars } from './Charts';
