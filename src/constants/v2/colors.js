// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Design System v2 · Color tokens
// Mirrors the UrbanNest mobile app theme (UrbanNestMobile/src/config/theme.ts)
// so web and mobile share one palette. All new / redesigned screens use these.
// Never hard-code a hex/rgba in a page — add it here with a name instead.
//
//   import { C2, G2, R2, SH2, TONES2, CHART2 } from '../../constants/v2';
// ─────────────────────────────────────────────────────────────────────────────

export const C2 = {
  // Brand
  primary:        '#2563EB',
  primaryLight:   '#3B82F6',
  primaryDark:    '#1D4ED8',
  primarySoft:    '#DBEAFE',
  primaryTint:    '#EFF6FF',
  primaryWash:    '#F5F8FF',
  navy:           '#0B2A5B',
  navyDeep:       '#0B1D3A',
  navyHeader:     '#032B57',
  navyButton:     '#0659B2',
  navyHero:       '#05295A',   // hero banner base (matches hero photo's left edge)
  periwinkle:     '#C7D2FE',
  floating:       '#16437E',
  skyOnDark:      '#60A5FA',   // accent text on navy surfaces

  // Secondary / accent
  secondary:      '#64748B',
  accent:         '#F59E0B',
  gold:           '#F5B83D',
  heroAccent:     '#FAD24D',

  // Brand mark
  logoStart:      '#34D399',
  logoEnd:        '#10B981',

  // Status
  success:        '#10B981',
  successDark:    '#15803D',
  successStrong:  '#16A34A',
  successBright:  '#4ADE80',   // mobile "active / move-in ready" green (ResidenceCard, ResidenceHero)
  successLight:   '#DCFCE7',
  successTint:    '#ECFDF5',
  error:          '#EF4444',
  errorDark:      '#DC2626',   // THE red for text (solid — red text never uses a gradient)
  errorDeep:      '#D93636',   // red gradient start (GSTOPS2.error)
  errorBright:    '#F98B8B',   // red gradient end
  errorLight:     '#FEE2E2',
  errorTint:      '#FEF2F2',
  warning:        '#F59E0B',
  warningDark:    '#B45309',
  warningIcon:    '#D97706',
  warningLight:   '#FEF3C7',
  warningTint:    '#FFFBEB',
  info:           '#3B82F6',
  infoLight:      '#DBEAFE',
  purple:         '#6366F1',
  purpleLight:    '#EDE9FE',

  // Neutrals / surfaces
  white:          '#FFFFFF',
  black:          '#0F172A',
  background:     '#F8FAFC',
  pageBg:         '#F3F7FE',   // lighter variant of mobile pageTint (#EEF3F9); same light blue mobile uses for soft surfaces
  backgroundGlass:'rgba(243, 247, 254, 0.92)',  // pageBg at 92% (top bar)
  pageTint:       '#EEF3F9',
  surface:        '#FFFFFF',
  surfaceMuted:   '#F1F5F9',
  border:         '#E2E8F0',
  glassBorder:    'rgba(255, 255, 255, 0.85)',  // frosted-glass edge (with SH2.glass hairline)
  cardBorder:     '#DCE4EE',   // card outline — one step darker than pageBg so edges read
  borderLight:    '#F1F5F9',
  tileBlue:       '#DCE6F4',
  chipBlue:       '#DCE8FB',
  skeleton:       '#E2E8F0',
  photoBadge:     'rgba(11, 29, 58, 0.62)',      // dark translucent label on a photo (PropertyCard type tag)

  // Text
  textPrimary:    '#1E293B',
  textBody:       '#334155',
  textSecondary:  '#64748B',
  textMuted:      '#94A3B8',
  textSubtle:     '#CBD5E1',
  textInverse:    '#FFFFFF',
  textInverseMuted: 'rgba(255, 255, 255, 0.75)',
  textBlue:       '#2563EB',

  // Sidebar (dark navy shell)
  sidebarBg:        '#0B1D3A',
  sidebarText:      'rgba(255, 255, 255, 0.78)',
  sidebarTextMuted: 'rgba(199, 210, 254, 0.55)',
  sidebarHover:     'rgba(255, 255, 255, 0.06)',
  sidebarDivider:   'rgba(255, 255, 255, 0.08)',

  // White-on-dark overlays (hero, dark cards, sidebar)
  onDark: {
    text:         '#FFFFFF',
    textSoft:     'rgba(255, 255, 255, 0.88)',
    textMuted:    'rgba(255, 255, 255, 0.75)',
    textFaint:    'rgba(255, 255, 255, 0.65)',
    border:       'rgba(255, 255, 255, 0.35)',
    borderSoft:   'rgba(255, 255, 255, 0.10)',
    divider:      'rgba(255, 255, 255, 0.20)',
    surface:      'rgba(255, 255, 255, 0.08)',
    surfaceSoft:  'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.16)',
  },
};

// Semantic tone sets — one object per meaning, so a component takes `tone`
// instead of 3–6 loose colors.
//   fg      text/icon on `soft`        strong  solid icon / emphasis
//   soft    pill / icon-box background tint    very light row/icon background
//   card*   KPI card gradient + border  wave   KPI card decoration
//   panel*  insight panel gradient + border
export const TONES2 = {
  success: { fg: C2.successDark, strong: C2.successStrong, soft: C2.successLight, tint: C2.successTint,
             cardTint: '#E8F8EF', cardBorder: '#D1F0DE', wave: '#34D399',
             panelFrom: '#F0FBF5', panelTo: '#E3F7EC', panelBorder: '#C9EBD7' },
  primary: { fg: C2.primaryDark, strong: C2.primary, soft: C2.primarySoft, tint: C2.primaryTint,
             cardTint: '#E6EFFD', cardBorder: '#D6E4FB', wave: C2.skyOnDark,
             panelFrom: C2.primaryTint, panelTo: C2.primaryWash, panelBorder: C2.chipBlue },
  error:   { fg: C2.errorDark, strong: C2.errorDark, soft: C2.errorLight, tint: C2.errorTint,
             cardTint: '#FDECEC', cardBorder: '#FBDADA', wave: '#F87171',
             panelFrom: C2.errorTint, panelTo: '#FDECEC', panelBorder: '#FBDADA' },
  warning: { fg: C2.warningDark, strong: C2.warningIcon, soft: C2.warningLight, tint: C2.warningTint,
             cardTint: '#FEF5E4', cardBorder: '#FCEBC8', wave: '#FBBF24',
             panelFrom: '#FFFBF0', panelTo: '#FEF3DC', panelBorder: '#FBE3B4' },
  purple:  { fg: C2.purple, strong: C2.purple, soft: C2.purpleLight, tint: C2.purpleLight,
             cardTint: C2.purpleLight, cardBorder: C2.periwinkle, wave: C2.periwinkle,
             panelFrom: C2.purpleLight, panelTo: C2.purpleLight, panelBorder: C2.periwinkle },
  neutral: { fg: C2.textBody, strong: C2.textSecondary, soft: C2.surfaceMuted, tint: C2.background,
             cardTint: C2.surfaceMuted, cardBorder: C2.border, wave: C2.textSubtle,
             panelFrom: C2.background, panelTo: C2.surfaceMuted, panelBorder: C2.border },
};

// Harmonised accent set for side-by-side metrics (KpiStrip). Matched lightness + saturation so
// four different colours sit together calmly (no rainbow): teal → blue → violet → rose run around
// one side of the colour wheel. NO yellow / amber anywhere (user decision 2026-11-19).
//   soft  icon background · fg  icon glyph · bar  [from, to] progress gradient (dark → light)
// Status (good / warning / urgent) is NOT shown with these — use a TONES2 status dot instead.
export const ACCENT2 = {
  teal:   { soft: '#E3F6F3', fg: '#0F9488', bar: ['#0F9488', '#5EDACB'] },
  blue:   { soft: '#E6EEFD', fg: '#2563EB', bar: ['#2563EB', '#7AAAF8'] },
  violet: { soft: '#ECEAFD', fg: '#6B5CE7', bar: ['#6B5CE7', '#A9A1F5'] },
  rose:   { soft: '#FCE9EF', fg: '#D6457A', bar: ['#D6457A', '#F19DBA'] },
};

// An ACCENT2 colour shaped like a TONES2 entry, for components that take a `tone`
// (UI2.iconBox, ActionTile, ListRow icons): accentTone(ACCENT2.teal)
export const accentTone = (a) => ({
  fg: a.fg, strong: a.fg, soft: a.soft, tint: a.soft,
  cardTint: a.soft, cardBorder: a.soft, panelFrom: a.soft, panelTo: a.soft, panelBorder: a.soft, wave: a.bar[1],
});

// Avatar color cycle (initials avatars)
export const AVATAR2 = [TONES2.primary, TONES2.purple, TONES2.warning, TONES2.success];

// Charts (Chart.js) + simple illustrations
export const CHART2 = {
  bar:        '#BFD4FB',
  barActive:  C2.primary,
  track:      '#DBE7FB',
  grid:       C2.borderLight,
  tick:       C2.textSecondary,
  line:       C2.successStrong,
  lineFill:   'rgba(22, 163, 74, 0.12)',
  lineFillTop:'rgba(22, 163, 74, 0.28)',
  // Blue trend line with axes (LineChart) — light card / dark card variants
  trend:            C2.primary,
  trendFillTop:     'rgba(37, 99, 235, 0.22)',
  trendFillBottom:  'rgba(37, 99, 235, 0)',
  trendOnDark:      C2.primaryLight,
  trendOnDarkFillTop:    'rgba(59, 130, 246, 0.45)',
  trendOnDarkFillBottom: 'rgba(59, 130, 246, 0)',
  tickOnDark:       C2.onDark.textMuted,
  gridOnDark:       C2.onDark.borderSoft,
};

export const ILLUS2 = {
  personBack:     '#C7D7F5',
  personBackBody: '#DCE6F8',
  personFront:    '#5B8DEF',
  personFrontBody:'#8FB1F3',
};

// Gradient colour stops [from, to] — for places that need the raw colours
// (SVG <linearGradient>, canvas). The CSS gradients below are built from these.
//   <Gauge gradient={GSTOPS2.success} … />
//
// success = THE UrbanNest green gradient. Built from the mobile app's green
// palette (UrbanNestMobile/src/config/theme.ts colors.successDark → the bright
// "active" green), running dark → light like mobile gradients.button.
// Use it for every green fill: score gauges, progress bars, success buttons.
// error = THE UrbanNest red gradient, built like success (deep → bright, left → right).
// Every red FILL uses it (bars, dots, solid icon boxes / pills, danger buttons) — via G2.errorBar /
// G2.errorButton / G2.toneFill(TONES2.error). Red TEXT stays solid C2.errorDark.
// primary = THE UrbanNest blue gradient (dark → light). Every blue progress FILL uses it:
// bars via G2.primaryBar, rings / donut arcs via these stops (DonutChart default, ProgressRing gradient=…).
export const GSTOPS2 = {
  primary: ['#1D4ED8', '#3B82F6'],
  success: [C2.successDark, C2.successBright],
  error:   [C2.errorDeep, C2.errorBright],
};

const G2_ERROR_BAR   = `linear-gradient(90deg, ${GSTOPS2.error[0]} 0%, ${GSTOPS2.error[1]} 100%)`;
const G2_SUCCESS_BAR = `linear-gradient(90deg, ${GSTOPS2.success[0]} 0%, ${GSTOPS2.success[1]} 100%)`;

// Gradients (CSS strings) — same stops as mobile `gradients`
export const G2 = {
  header:        'linear-gradient(135deg, #032B57 0%, #518EF9 100%)',
  button:        'linear-gradient(135deg, #03264C 0%, #0659B2 100%)',
  // Mobile app "brand" button: gradients.button left → right (UrbanNestMobile/src/components/Button.tsx)
  brandButton:   'linear-gradient(90deg, #03264C 0%, #0659B2 100%)',
  primaryButton: `linear-gradient(135deg, ${GSTOPS2.primary[0]} 0%, ${GSTOPS2.primary[1]} 100%)`,
  successButton: `linear-gradient(135deg, ${GSTOPS2.success[0]} 0%, ${GSTOPS2.success[1]} 100%)`,
  successBar:    `linear-gradient(90deg, ${GSTOPS2.success[0]} 0%, ${GSTOPS2.success[1]} 100%)`,   // progress fills, left → right
  primaryBar:    `linear-gradient(90deg, ${GSTOPS2.primary[0]} 0%, ${GSTOPS2.primary[1]} 100%)`,   // brand-blue progress fills (KpiStrip)
  errorButton:   `linear-gradient(135deg, ${GSTOPS2.error[0]} 0%, ${GSTOPS2.error[1]} 100%)`,       // danger buttons
  errorBar:      `linear-gradient(90deg, ${GSTOPS2.error[0]} 0%, ${GSTOPS2.error[1]} 100%)`,        // red progress fills, status dots
  // Standard FILL for a tone: red and green → their gradient, every other tone → its solid strong colour.
  // Use it for any filled shape coloured by a tone (bars, dots, solid icon boxes / pills).
  // Bar fill in a metric's ACCENT2 colour (dark → light, left → right): G2.accentBar(ACCENT2.teal)
  accentBar: (a) => `linear-gradient(90deg, ${a.bar[0]} 0%, ${a.bar[1]} 100%)`,
  toneFill: (t) => (t === TONES2.error ? G2_ERROR_BAR : t === TONES2.success ? G2_SUCCESS_BAR : t.strong),
  sidebar:       'linear-gradient(180deg, #0B1D3A 0%, #0B2A5B 55%, #0B1D3A 100%)',
  sidebarFadeTop:'linear-gradient(180deg, #0B1D3A 0%, rgba(11,29,58,0) 100%)',
  heroScrim:     'linear-gradient(90deg, rgba(3,43,87,0.96) 0%, rgba(3,43,87,0.82) 38%, rgba(3,43,87,0.15) 75%, rgba(3,43,87,0) 100%)',
  // Premium hero (sampled from the landlord dashboard design):
  //   base   — deep navy column on the left, top #093463 → bottom #071526,
  //            warming into the sunset blue/lilac sky towards the right
  //   glow   — soft lilac/peach sunset haze behind the photo
  //   scrim  — keeps text readable on the left, fully clear by ~55%
  //   mask   — feathers the photo's left edge into the gradient (no seam)
  heroBase:      'linear-gradient(180deg, #0A3567 0%, #0D2B52 55%, #071526 100%)',
  heroSky:       'linear-gradient(90deg, rgba(9,52,99,0) 0%, rgba(33,85,147,0.55) 55%, rgba(108,142,213,0.7) 100%)',
  heroGlow:      'radial-gradient(ellipse 45% 70% at 62% 78%, rgba(205,184,232,0.35) 0%, rgba(181,154,163,0.18) 40%, rgba(181,154,163,0) 75%)',
  heroTextScrim: 'linear-gradient(90deg, rgba(7,21,38,0.78) 0%, rgba(9,40,80,0.55) 30%, rgba(9,40,80,0.12) 50%, rgba(9,40,80,0) 62%)',
  heroImageMask: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 14%, rgba(0,0,0,0.85) 30%, #000 42%)',
  heroVignette:  'linear-gradient(180deg, rgba(7,21,38,0) 60%, rgba(7,21,38,0.35) 100%)',
  // Compact list-page hero (HeroBanner variant="compact", design: Portfolio "Property List"):
  //   base  — royal blue, deeper on the left, brightening into the photo's sky on the right
  //   mask  — short feather so the whole photo stays visible
  //   scrim — light shade behind the text only
  heroCompactBase:  'linear-gradient(90deg, #0A2D63 0%, #0E3A80 30%, #1A56B0 58%, #3C7FD8 100%)',
  heroCompactMask:  'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.55) 10%, #000 24%)',
  heroCompactMaskTop: 'linear-gradient(180deg, transparent 0%, #000 34%)',   // fades the photo's top edge when it is pushed down (imagePosition 'center 20px')
  heroCompactScrim: 'linear-gradient(90deg, rgba(8,30,66,0.45) 0%, rgba(8,30,66,0.15) 32%, rgba(8,30,66,0) 50%)',
  // Property hero (full-bleed photo): readable left text column + soft base for the thumbnail strip
  propertyHeroScrim: 'linear-gradient(90deg, rgba(7,21,38,0.82) 0%, rgba(9,40,80,0.62) 28%, rgba(9,40,80,0.18) 52%, rgba(9,40,80,0) 70%)',
  propertyHeroBase:  'linear-gradient(180deg, rgba(7,21,38,0) 55%, rgba(7,21,38,0.45) 100%)',
  imageDark:     'linear-gradient(180deg, rgba(11,29,58,0) 0%, rgba(11,29,58,0.92) 70%, #0B1D3A 100%)',
  // Sidebar promo (NavF):
  //   photoMask  — alpha mask: photo fades in from fully transparent, so it melts into
  //                the sidebar behind the nav items (no top edge / seam)
  //   photoScrim — darkens the lower photo so it sinks under the glass copy panel
  //   glass      — tint of the frosted copy panel; glassMask fades the blur in softly
  sidebarPromoPhotoMask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 14%, #000 34%, #000 100%)',
  sidebarPromoPhotoScrim:'linear-gradient(180deg, rgba(11,29,58,0) 0%, rgba(11,29,58,0) 78%, rgba(11,29,58,0.55) 90%, #0B1D3A 100%)',
  sidebarPromoGlass:     'linear-gradient(180deg, rgba(11,29,58,0) 0%, rgba(11,29,58,0.35) 30%, rgba(11,29,58,0.72) 70%, rgba(11,29,58,0.9) 100%)',
  sidebarPromoGlassMask: 'linear-gradient(180deg, transparent 0%, #000 28%, #000 100%)',
  // Mobile dark cards (FinancialCard / CheckInStatusCard / RentDueCard): gradients.button, top-left → bottom-right
  darkCard:      'linear-gradient(135deg, #03264C 0%, #0659B2 100%)',
  // Light container surfaces — STANDARD = near-white with a very light blue tint (2026-11-18:
  // the original glass tint at roughly half strength over a whiter base). Every card (UI2.card),
  // inner tile (UI2.tile), pill tab bar and hero stats panel uses these. Pair with
  // C2.glassBorder + SH2.glass (faint navy hairline + lift) so edges still show.
  glass: [
    'radial-gradient(120% 90% at 0% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 60%)',
    'radial-gradient(80% 70% at 30% 0%, rgba(226,235,252,0.22) 0%, rgba(226,235,252,0) 70%)',
    'radial-gradient(70% 80% at 100% 30%, rgba(230,239,254,0.35) 0%, rgba(230,239,254,0) 70%)',
    'linear-gradient(180deg, #FBFCFF 0%, #FFFFFF 100%)',
  ].join(', '),
  glassTile: [
    'radial-gradient(100% 100% at 0% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 65%)',
    'radial-gradient(90% 80% at 100% 0%, rgba(230,239,254,0.2) 0%, rgba(230,239,254,0) 70%)',
    'linear-gradient(180deg, #FCFDFF 0%, #FFFFFF 100%)',
  ].join(', '),
  // Light profile hero (ProfileHero, Landlord dashboard): soft blue wash building up towards
  // the photo on the right. The photo's left edge is feathered with profileHeroMask (desktop);
  // on phones the photo sits above the text and fades out with profileHeroMaskTop
  // (widths / heights live on the un2-phero-* classes in utilities.css).
  profileHero: [
    'radial-gradient(70% 120% at 100% 0%, rgba(224,232,252,0.9) 0%, rgba(224,232,252,0) 75%)',
    'radial-gradient(60% 90% at 0% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
    'linear-gradient(180deg, #FBFCFF 0%, #F6F9FF 100%)',
  ].join(', '),
  // Open page hero (OpenHero): same wash as profileHero but no box — runs edge to edge under the
  // top bar and fades into pageBg at the bottom; the stats band under it is a faint white strip.
  openHero: [
    'radial-gradient(60% 110% at 100% 0%, rgba(218,229,248,0.9) 0%, rgba(218,229,248,0) 70%)',   // light sky blue top-right
    'linear-gradient(90deg, #F5F8FE 0%, #EFF4FC 45%, #E5EDFA 100%)',                              // near-white left → pale blue right
  ].join(', '),
  // OpenHero wave: [white edge highlight, periwinkle swell under the curve]
  openHeroWaves: ['#FFFFFF', '#D3DFF5'],   // opacity ramps live in OpenHero's SVG gradients
  openHeroBand: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 100%)',
  // Soft glow behind the hero text column (same tint as the hero surface) — keeps the stats readable
  // where the text runs over the photo on narrower screens; invisible where it sits on plain surface.
  profileHeroGlow: 'linear-gradient(90deg, rgba(249,251,255,0.8) 0%, rgba(249,251,255,0.7) 55%, rgba(249,251,255,0.35) 78%, rgba(249,251,255,0) 100%)',
  // MiniBars (rent trend): past months = soft blue, current month = primary gradient
  miniBar:       'linear-gradient(180deg, #DBE7FB 0%, #C7D9FA 100%)',
  miniBarActive: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
  thumbShade:    'linear-gradient(180deg, rgba(11,29,58,0) 45%, rgba(11,29,58,0.55) 100%)',  // photo bottom fade under overlay tags
  // Light diagonal wash for a tone: G2.tone(TONES2.success) / G2.panel(TONES2.warning)
  tone:  (t) => `linear-gradient(135deg, #FFFFFF 0%, ${t.cardTint} 100%)`,
  panel: (t) => `linear-gradient(135deg, ${t.panelFrom} 0%, ${t.panelTo} 100%)`,
};

// Radii — same scale as mobile `borderRadius`
export const R2 = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, header: 28, button: 10, pill: 9999, round: '50%' };

// Shadows — web equivalents of mobile `shadows`
export const SH2 = {
  sm:         '0 1px 3px rgba(15, 23, 42, 0.04)',
  md:         '0 2px 8px rgba(15, 23, 42, 0.06)',
  lg:         '0 8px 24px rgba(15, 23, 42, 0.08)',
  // Cards sit on the light-blue pageBg, so their shadow is layered and navy-tinted:
  //   contact edge (crisp) + soft spread + wide ambient glow
  card:       '0 1px 2px rgba(16, 24, 40, 0.06), 0 4px 12px rgba(16, 24, 40, 0.05), 0 12px 32px -8px rgba(30, 64, 124, 0.16)',
  // Frosted glass: faint navy hairline + inner top highlight + soft lift
  glass:      '0 0 0 1px rgba(30, 64, 124, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(16, 24, 40, 0.05), 0 12px 32px -8px rgba(30, 64, 124, 0.16)',
  glassTile:  '0 0 0 1px rgba(30, 64, 124, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 10px -2px rgba(30, 64, 124, 0.08)',
  cardHover:  '0 2px 4px rgba(16, 24, 40, 0.06), 0 12px 24px rgba(16, 24, 40, 0.08), 0 24px 48px -12px rgba(30, 64, 124, 0.24)',
  primary:    '0 6px 16px rgba(37, 99, 235, 0.35)',
  success:    '0 6px 14px rgba(16, 185, 129, 0.30)',
  error:      '0 6px 14px rgba(220, 38, 38, 0.28)',
  hero:       '0 10px 28px rgba(3, 43, 87, 0.18)',
  dark:       '0 16px 34px rgba(3, 38, 76, 0.30)',
  // Elevation ladder on the light-blue page (lowest → highest):
  //   tile (inner panels inside a card) → control (inputs, white buttons)
  //   → card → cardHover / hero / dark
  tile:         '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 10px -2px rgba(30, 64, 124, 0.08)',
  control:      '0 1px 2px rgba(16, 24, 40, 0.06), 0 2px 6px rgba(30, 64, 124, 0.08)',
  controlHover: '0 2px 4px rgba(16, 24, 40, 0.08), 0 6px 14px rgba(30, 64, 124, 0.14)',
  darkButton:   '0 6px 14px rgba(15, 23, 42, 0.25)',
  brandButton:  '0 6px 14px rgba(3, 38, 76, 0.28)',
  lightButton:  '0 4px 12px rgba(3, 38, 76, 0.22)',
  focus:      '0 0 0 3px rgba(37, 99, 235, 0.12)',
  avatarRing: '0 0 0 3px #FFFFFF, 0 0 0 4px #E2E8F0',
  dotSuccess: '0 0 0 3px rgba(16, 185, 129, 0.18)',
  miniBarActive: '0 4px 10px -2px rgba(37, 99, 235, 0.45)',
};
