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
  dot:     6,
  progress:6,
  sidebar: 224,
  topbar:  56,
  search:  320,
  thumb:   { w: 96, h: 72 },                    // list thumbnails
  thumbLg: { w: 112, h: 88 },                   // rich list rows (PropertyListItem)
  donut:   148,
  chart:   180,
  kpiMin:  100,
  heroMin: 196,
  heroImageWidth: '64%',
  panelMin:132,
  insightVisual: { w: 120, h: 56 },             // InsightCard right-hand chart / illustration
  promoMin:240,
  emptyMin:140,
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

export const MOTION2 = {
  fast: '0.15s ease',
  base: '0.18s ease',
};
