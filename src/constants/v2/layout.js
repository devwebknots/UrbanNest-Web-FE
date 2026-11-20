// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Design System v2 · Layout tokens (spacing, sizes, motion)
// 4px grid. Use ONLY these values for padding / margin / gap / sizes.
// ─────────────────────────────────────────────────────────────────────────────

// Spacing scale (px) — same names as mobile `spacing`
export const SP2 = { none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 };

// Shorthand: pad(SP2.sm, SP2.lg) → '8px 16px'
export const pad = (...v) => v.map(n => (typeof n === 'number' ? `${n}px` : n)).join(' ');

// Component sizes (px)
export const SZ2 = {
  icon:    { xs: 20, sm: 28, md: 32, lg: 40 },   // square icon boxes / avatars (compact)
  control: { sm: 28, md: 34, lg: 40 },           // buttons, inputs, nav items (compact)
  hairline:1,                                   // dividers, separators, 1px rules
  dashed:  1.5,                                 // dashed outline of an empty "Add …" upload slot (UI2.addTile)
  pageWave: 240,                                // PageWave backdrop height — top bar + breadcrumb + detail header
  pillFixed: 72,                               // fixed-width status pills in a list column (Critical / Medium / Low) — fits the longest label
  dot:     6,
  menu:    { w: 240, maxH: 280 },           // FilterMenu dropdown: width · max height before it scrolls
  progress:6,
  sidebar: 224,
  topbar:  56,
  search:  320,
  thumb:   { w: 96, h: 72 },                    // list thumbnails
  thumbLg: { w: 112, h: 88 },                   // rich list rows (PropertyListItem)
  thumbXl: { w: 144, h: 104 },                  // photo tiles (MediaListItem)
  thumbFeature: { w: 216, h: 120 },             // featured photo tile (MediaListItem size="lg", unit carousel)
  propertyCardPhoto: 132,                       // PropertyCard photo height (portfolio property grid)
  searchSm: 240,                                // compact search field in a section header (filters row)
  unitCard: 248,                                // unit card width in the Overview's sideways-scrolling unit row (stacked MediaListItem)
  detailLabel: 84,                              // label column in label/value rows
  tableMin: 560,                                // DataTable min width before it scrolls sideways
  tableMinCompact: 320,                         // DataTable with few columns (ledger) — fits a half-width card in a main column
  tableFitCol: 64,                              // DataTable 'fit' column (amounts) — never narrower than this, same in every row
  gauge: 168,                                   // Gauge chart diameter
  heroThumb: { w: 88, h: 64 },                  // PropertyHero photo strip tiles
  propertyHeroMin: 236,                         // PropertyHero min height
  threadMax: 140,                               // expanded chat thread before it scrolls
  donut:   148,
  chart:   180,
  kpiMin:  100,
  heroMin: 196,
  heroImageWidth: '64%',
  heroCompactMin: 132,                          // HeroBanner variant="compact" height (list pages)
  heroCompactImageWidth: '62%',                 // compact hero photo — wide enough to show the whole building
  heroContentMax:640,                           // HeroBanner text column
  labelMax:140,                                 // truncated side labels (e.g. chart summary)
  skeletonTitle:300,                            // loading placeholder for a hero / page title
  panelMin:132,
  insightVisual: { w: 120, h: 56 },             // InsightCard right-hand chart / illustration
  promoMin:240,
  brandLogoRatio:'480 / 464',                   // mobile house mark (assets/v2/brand/urban-nest-logo.png)
  promoPhotoRatio:'640 / 1517',                 // sidebar promo photo (assets/v2/landlord/sidebar-building.jpg)
  promoBleed:120,                               // how far the promo photo runs up behind the nav items
  promoOverlap:64,                              // how far the photo's base slides under the promo copy
  promoGlassBleed:24,                           // how far the frosted copy panel fades in above the title
  emptyMin:140,
  // Landlord dashboard (ProfileHero · KpiStrip · ProgressRing · MiniBars · AssetRow)
  profileHeroMin: 248,                          // light profile hero height
  profileHeroContentMax: 560,                   // its text column
  ring:    120,                                 // ProgressRing diameter
  ringStroke: 10,                               // ProgressRing stroke
  miniBars: { h: 64, w: 18, fitStagger: 24 },   // MiniBars plot height · bar width · bars staggered in fit mode
  assetThumb: { w: 88, h: 64 },                 // AssetRow photo
  assetThumbSm: { w: 72, h: 56 },               // AssetRow photo in the compact spread step — --un2-asset-thumb-*-sm
  accentBar: 3,                                 // coloured left rule on a list item (priority)
  profileHeroTextEnd: 560,                      // hero photo never starts before this (padding + title + 3 stats) — --un2-phero-text-end
  profileHeroPhotoStart: '40%',                 // hero photo start on wide screens — --un2-phero-photo-start
  profileHeroPhotoSm: 180,                      // hero photo strip height on phones (≤ 860px) — --un2-phero-photo-sm
  // Detail pages (property / unit): PhotoBento gallery + DetailHeader
  bento:   { h: 320, hSm: 200, thumbSm: 88 },   // gallery height · main photo height on phones · thumb strip height on phones — --un2-bento-*
  // Open page hero (OpenHero): text block min height · photo width on the right
  openHeroMin: 200,
  openHeroRatio: '5 / 1',                      // OpenHero height follows its width (photo framing like the design)
  openHeroPhotoH: '100%',                      // OpenHero photo height = the hero's: the WHOLE photo shows (nothing cut off), building at design scale
  openHeroPhotoRatio: '3 / 1',                 // portfolio-hero-sunset.jpg (2400 × 800) — keeps the photo unstretched
  // Portfolio (property list): PropertyRow — compact row photo
  propertyRowPhoto: { w: 128, h: 84 },          // PropertyRow photo (compact list row)
  scoreFigure: 40,                             // big health / score figure (Inter Medium) — not on the type scale on purpose: one hero number
};

// Page & section rhythm — the spacing pattern every v2 screen follows.
// PageShell / SectionCard / un2-grid-* already apply these; use them directly
// only when building something custom.
//
//   ┌ topbar (SZ2.topbar) ───────────────────────────────────────────┐
//   │ pageTop                                                        │
//   │ pageX ┌ section ┐ sectionGap ┌ section ┐ … pageX               │
//   │       └─────────┘            └─────────┘                       │
//   │   cards inside a section grid are gridGap apart                │
//   │   card padding = cardY / cardX, header → body = cardHeaderGap  │
//   │   rows inside a card = rowGap · items inside a row = inlineGap │
//   │ pageBottom                                                     │
//   └────────────────────────────────────────────────────────────────┘
export const LAYOUT2 = {
  pageX:         SP2.xxl,   // 24 — left/right page padding
  pageTop:       SP2.xl,    // 20
  pageBottom:    SP2.xxl,   // 24
  sectionGap:    SP2.lg,    // 16 — between stacked sections
  gridGap:       SP2.md,    // 12 — between cards in a grid row
  cardX:         SP2.xl,    // 20 — card horizontal padding
  cardY:         SP2.lg,    // 16 — card vertical padding
  cardHeaderGap: SP2.md,    // 12 — card header → card body
  rowGap:        SP2.sm,    // 8  — between list rows / stacked blocks in a card
  inlineGap:     SP2.sm,    // 8  — between items on one line (icon + text, buttons)
  heroX:         SP2.xxl,   // 24
  heroY:         SP2.xl,    // 20
};

// Breakpoints (px, max-width) — same values as the un2-grid-* media queries
export const BP2 = { xl: 1100, lg: 1024, md: 860, sm: 600 };  // 3-col → 2 at xl · 4-col & 2-col splits → stacked at lg

// Card-width steps (px) for container rules in utilities.css: un2-hide-xs / -narrow / -medium.
// Content inside a card reacts to the CARD's width (un2-cq), not the screen's.
export const CQ2 = { xs: 120, narrow: 300, asset: 560, medium: 720, spread: 820, spreadCompact: 1100 };   // measured on the card's inner (content) width
// (asset = AssetRow compact mode: short button labels, "Paid" hidden — utilities.css @container 560px.
//  CSS can't read variables inside @container / @media conditions, so keep the px there in sync with these.)

// ─── Section grid layouts — the ONLY column splits v2 screens use ────────────
// Each name maps to a CSS class in src/styles/v2/utilities.css (widths from
// tokens.css, responsive collapse built in). Use via <Grid layout="wideLeft">
// (components/v2/Grid.jsx) or className={GRID2.wideLeft}.
//
//   layout      columns (desktop)              ≥1100  1100–1024  1024–860  860–600  <600
//   two         1fr · 1fr                       2      2          2         1        1
//   three       1fr · 1fr · 1fr                 3      2 (+1 full) 2 (+1)   1        1
//   four        1fr ×4 (KPI row)                4      4          2         2        1
//   wideLeft    1.45fr · 1fr   (≈ 60 / 40)      2      2          1         1        1
//   split       1.25fr · 1fr   (≈ 55 / 45)      2      2          1         1        1
//   wideRight   1fr · 1.45fr   (≈ 40 / 60)      2      2          1         1        1
//   aside       1fr · 168px    (inside a card)  2      2          2         1        1
//   mainSide    2.2fr · 1fr    (body + side)    2      2          1         1        1
//
// Gap between cells = LAYOUT2.gridGap (aside uses LAYOUT2.sectionGap).
export const GRID_RATIO2 = { wide: 1.45, split: 1.25, main: 2.2, aside: 168 };   // mirrors --un2-col-wide / --un2-col-split / --un2-col-main / --un2-aside-w
export const GRID2 = {
  two:       'un2-grid-2',
  three:     'un2-grid-3',
  four:      'un2-grid-4',
  wideLeft:  'un2-grid-wide-left',
  split:     'un2-grid-split',
  wideRight: 'un2-grid-wide-right',
  aside:     'un2-grid-aside',
  mainSide:  'un2-grid-main-side',
};

export const MOTION2 = {
  fast: '0.15s ease',
  base: '0.18s ease',
  // Entrance / data motion (un2-enter-stagger, un2-grow-*, ProgressRing, CountUp) — same values as tokens.css
  ease:    'cubic-bezier(0.22, 1, 0.36, 1)',    // soft ease-out
  enter:   '0.6s cubic-bezier(0.22, 1, 0.36, 1)',
  countMs: 900,                                 // CountUp duration
  rise:    12,                                  // px a section travels while entering (un2-rise) — --un2-rise
  nudge:   3,                                   // px a link arrow slides on hover (un2-link-arrow) — --un2-nudge
  stagger: 70,                                  // ms between entering sections — --un2-stagger
};

// Backdrop blurs (frosted glass). Use with backdropFilter + WebkitBackdropFilter.
export const BLUR2 = {
  sm:    'blur(4px)',               // small chips on photos (hero eyebrow)
  md:    'blur(6px)',               // ghost buttons on dark
  glass: 'blur(16px) saturate(140%)', // frosted cards / panels
};

// Opacity steps
export const OP2 = { faint: 0.25, muted: 0.45, soft: 0.7 };

// Stacking order for floating layers (rendered in a portal on document.body)
export const ZI2 = { menu: 1000 };   // FilterMenu dropdown — above cards, top bar and sidebar
