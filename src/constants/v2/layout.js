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
  icon:    { xs: 24, sm: 32, md: 40, lg: 48 },   // square icon boxes / avatars
  control: { sm: 32, md: 40, lg: 48 },           // buttons, inputs, nav items
  dot:     8,
  progress:8,
  sidebar: 248,
  topbar:  64,
  search:  380,
  thumb:   { w: 120, h: 88 },                    // list thumbnails
  donut:   200,
  chart:   240,
  kpiMin:  128,
  heroMin: 248,
  heroImageWidth: '64%',
  panelMin:168,
  promoMin:320,
  emptyMin:192,
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
  pageX:         SP2.xxxl,  // 32 — left/right page padding
  pageTop:       SP2.xxl,   // 24
  pageBottom:    SP2.xxxl,  // 32
  sectionGap:    SP2.xl,    // 20 — between stacked sections
  gridGap:       SP2.lg,    // 16 — between cards in a grid row
  cardX:         SP2.xxl,   // 24 — card horizontal padding
  cardY:         SP2.xl,    // 20 — card vertical padding
  cardHeaderGap: SP2.lg,    // 16 — card header → card body
  rowGap:        SP2.md,    // 12 — between list rows / stacked blocks in a card
  inlineGap:     SP2.sm,    // 8  — between items on one line (icon + text, buttons)
  heroX:         SP2.xxxl,  // 32
  heroY:         SP2.xxl,   // 24
};

// Breakpoints (px, max-width) — same values as the un2-grid-* media queries
export const BP2 = { xl: 1360, lg: 1180, md: 860, sm: 600 };

export const MOTION2 = {
  fast: '0.15s ease',
  base: '0.18s ease',
};
