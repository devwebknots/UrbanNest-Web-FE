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
  successLight:   '#DCFCE7',
  successTint:    '#ECFDF5',
  error:          '#EF4444',
  errorDark:      '#DC2626',
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
};

export const ILLUS2 = {
  personBack:     '#C7D7F5',
  personBackBody: '#DCE6F8',
  personFront:    '#5B8DEF',
  personFrontBody:'#8FB1F3',
};

// Gradients (CSS strings) — same stops as mobile `gradients`
export const G2 = {
  header:        'linear-gradient(135deg, #032B57 0%, #518EF9 100%)',
  button:        'linear-gradient(135deg, #03264C 0%, #0659B2 100%)',
  // Mobile app "brand" button: gradients.button left → right (UrbanNestMobile/src/components/Button.tsx)
  brandButton:   'linear-gradient(90deg, #03264C 0%, #0659B2 100%)',
  primaryButton: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
  successButton: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
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
  imageDark:     'linear-gradient(180deg, rgba(11,29,58,0) 0%, rgba(11,29,58,0.92) 70%, #0B1D3A 100%)',
  // Mobile dark cards (FinancialCard / CheckInStatusCard / RentDueCard): gradients.button, top-left → bottom-right
  darkCard:      'linear-gradient(135deg, #03264C 0%, #0659B2 100%)',
  // Frosted-glass light surface (sampled from the reference frame):
  //   white glow bottom-left · soft blue tint across the top · cool tint on the right
  //   over a near-white base. Pair with C2.glassBorder + SH2.glass + backdrop blur (UI2.glass).
  glass: [
    'radial-gradient(120% 90% at 0% 100%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 60%)',
    'radial-gradient(80% 70% at 30% 0%, rgba(226,235,252,0.40) 0%, rgba(226,235,252,0) 70%)',
    'radial-gradient(70% 80% at 100% 30%, rgba(230,239,254,0.65) 0%, rgba(230,239,254,0) 70%)',
    'linear-gradient(180deg, #F7F9FE 0%, #FBFCFF 100%)',
  ].join(', '),
  glassTile: [
    'radial-gradient(100% 100% at 0% 100%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 65%)',
    'radial-gradient(90% 80% at 100% 0%, rgba(230,239,254,0.35) 0%, rgba(230,239,254,0) 70%)',
    'linear-gradient(180deg, #F9FBFE 0%, #FDFEFF 100%)',
  ].join(', '),
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
};
