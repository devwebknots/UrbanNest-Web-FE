/**
 * src/components/ui/index.js
 * Barrel export for all shared UI components.
 * Import from here, never from individual files directly.
 *
 * Usage:
 *   import { Button, Input, CustomDropdown } from '../components/ui';
 */

export { default as Button }              from './Button';
export { default as Input }               from './Input';
export { default as Select }              from './Select';
export { default as Divider }             from './Divider';
export { default as TestimonialCarousel } from './TestimonialCarousel';
export { default as CustomDropdown }      from './CustomDropdown';

// ⏳ Pending:
// export { default as SvgIcon } from './SvgIcon';

// ═════════════════════════════════════════════════════════════════════════════
// VERSION 2 — Design System v2 components (all new / redesigned screens use these).
// Page frame pieces (PageShell, TopBar, Grid, PageFooter, Breadcrumb, PageWave) live in components/layout.
//   import { PageShell, Grid, PageFooter } from '../../components/layout';
//   import { HeroBanner, SectionCard, StatCard } from '../../components/ui';
// ═════════════════════════════════════════════════════════════════════════════
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
// Grid layouts (GRID2 in constants/layout.js): two · three · four · wideLeft · split · wideRight · aside
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
//   ListingsHero dashboard-hero styles + height, banner art as one background image (Listings)
//   OpenHero    open page hero (no box, bleeds to the edges) + full-width stats band — list pages (Portfolio)
//   PageWave    soft sky wash + rolling waves behind the top bar / header — <PageShell backdrop={<PageWave />}>
//   <PageShell animate> staggers the sections in on load
//   Detail pages: DetailHeader (title · pill · Edit · address + aside) · StatGroup (stats in one container)
//                 FactCard (caps label · icon · value · sub — 6 in <Grid layout="six">)
//                 PhotoBento (big photo + 2×2 tiles + Add) · un2-cols (divided columns in one panel)
//   TextLink    "View All →" text action with sliding arrow (never hand-build link buttons)
//   FilterMenu  filter icon in a card header → dropdown to pick one option (e.g. a property)
//   Card patterns in UI2: cardFill · capsLabel · labelRow · context · subhead · cardFoot · strong ·
//   delta() · amount() · legendRow/Key/Val · accentItem() · tintRow  (see constants/components.js)
//
// Page chrome:
//   Breadcrumb  trail above a detail hero · TabBar (pill = page sections, underline = in-card)
//   PropertyHero photo-slider banner for property / unit detail pages (pair with a StatTile snapshot card)
//   StatTile    icon + value + label tile (2×2 snapshot grids)
//   UI2 (constants/components.js) for text, pills, tags, buttons, icon boxes, tiles;
//   LAYOUT2.rowGap / inlineGap for spacing.
export { default as HeroBanner, HeroStat } from './HeroBanner';
export { default as PropertyHero } from './PropertyHero';
export { default as StatTile } from './StatTile';
export { default as SectionCard, CardHeader } from './SectionCard';
export { default as StatCard, Wave } from './StatCard';
export { default as PropertyListItem } from './PropertyListItem';
export { default as InsightCard } from './InsightCard';
export { default as CardWave } from './CardWave';
export { default as CornerArt } from './CornerArt';
export { default as CardPattern, patternFor, CARD_PATTERNS } from './CardPattern';
export { default as ListRow } from './ListRow';
export { default as EmptyState } from './EmptyState';
export { default as MessageItem } from './MessageItem';
export { default as TabBar } from './TabBar';
export { default as MetricBar } from './MetricBar';
export { default as ActionTile } from './ActionTile';
export { default as MediaListItem } from './MediaListItem';
export { default as PropertyCard, OptionsMenu } from './PropertyCard';
export { default as PropertyRow } from './PropertyRow';
export { default as SectionHeader } from './SectionHeader';
export { default as DataTable } from './DataTable';
export { default as ProfileHero } from './ProfileHero';
export { default as WaveHero } from './WaveHero';
export { default as ListingsHero } from './ListingsHero';
export { default as OpenHero } from './OpenHero';
export { default as KpiStrip } from './KpiStrip';
export { default as AssetRow } from './AssetRow';
export { default as CountUp } from './CountUp';
export { default as TextLink } from './TextLink';
export { default as ActionTray } from './ActionTray';
export { default as DetailHeader } from './DetailHeader';
export { default as StatGroup } from './StatGroup';
export { default as FactCard } from './FactCard';
export { default as FilterMenu } from './FilterMenu';
export { default as PhotoBento } from './PhotoBento';
export { BarChart, DonutChart, Sparkline, LineChart, Gauge, ProgressRing, MiniBars } from './Charts';

// Forms + wizards (Create Listing is the reference):
//   Stepper (numbered steps) · FormField + ReadField + FIELD2 (caps label · standard field boxes) ·
//   Switch · Checkbox · RadioPill · ChoiceTile (amenity picker) · MapPreview (static map) · WizardFooter (sticky bar)
export { default as Stepper } from './Stepper';
export { default as FormField, ReadField, SelectField, FIELD2 } from './FormField';
export { Switch, Checkbox, RadioPill, ChoiceTile } from './FormControls';
export { default as MapPreview } from './MapPreview';
export { default as WizardFooter } from './WizardFooter';
