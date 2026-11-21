import React from 'react';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, T2, SP2, SZ2, LAYOUT2, BLUR2, pad, UI2 } from '../../constants/v2';

// ─── HeroBanner + HeroStat (Design System v2) ────────────────────────────────
// Premium navy banner: deep-navy → sunset-sky gradient with the photo on the
// right, its left edge feathered so it melts into the gradient (no seam).
//
// Layers (bottom → top):
//   1. G2.heroBase      deep navy column (vertical)
//   2. G2.heroSky       blue/lilac sky building up towards the right
//   3. photo            right side, masked with G2.heroImageMask
//   4. G2.heroGlow      soft sunset haze over the seam
//   5. G2.heroTextScrim keeps the text side readable
//   6. G2.heroVignette  subtle darkening at the bottom
//   7. content
//
//   <HeroBanner eyebrow="Executive Profile"
//               title="Welcome back," titleAccent="Nick"
//               subtitle="Property Owner · Active Portfolio" subtitleIcon="ti-user-circle"
//               image={heroImg}
//               stats={[{ icon: 'ti-building', label: 'Properties', value: 4 }, …]}
//               actions={<button className="un2-btn" style={UI2.btn.light}>…</button>} />
//
// Props: eyebrow, title (node), titleAccent (bold part after title), titleAction
//        (node right of the title, e.g. an edit button), subtitle, subtitleIcon,
//        image, imagePosition (CSS background-position), stats[], actions,
//        statsVariant 'inline' (default — white stats under the text)
//                     | 'panel' (frosted white panel top-right, e.g. a property hero),
//        children (extra content under the subtitle: description, chips…),
//        variant 'default' | 'compact' (shorter list-page banner: bright blue gradient G2.heroCompact*,
//                whole photo on the right, pill eyebrow, bold Inter title — e.g. Portfolio "Property List"),
//        imageFull (compact only: `image` is complete banner art with its own gradient → fills the
//                   whole banner unmasked; e.g. assets/v2/landlord/portfolio-hero.jpg)
//
// Stat: { icon, label, value, tone? (TONES2 — colours the value/icon in the panel) }
//   compact variant: stats render as a row under the subtitle — { icon, label, value, accent? (ACCENT2 → icon colour), valueColor? }
// The panel sits beside the text and wraps under it on narrow screens.

const fill = { position: 'absolute', inset: 0, pointerEvents: 'none' };

const S = {
  hero: {
    position: 'relative', overflow: 'hidden', isolation: 'isolate',
    minHeight: SZ2.heroMin, borderRadius: R2.xxl, padding: pad(LAYOUT2.heroY, LAYOUT2.heroX),
    color: C2.onDark.text, boxShadow: SH2.hero, background: G2.heroBase,
  },
  sky:   { ...fill, background: G2.heroSky },
  photo: (image, position) => ({
    position: 'absolute', top: 0, right: 0, bottom: 0, width: SZ2.heroImageWidth, pointerEvents: 'none',
    backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: position, backgroundRepeat: 'no-repeat',
    WebkitMaskImage: G2.heroImageMask, maskImage: G2.heroImageMask,
  }),
  glow:     { ...fill, background: G2.heroGlow },
  scrim:    { ...fill, background: G2.heroTextScrim },
  vignette: { ...fill, background: G2.heroVignette },
  layout:   { position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP2.lg },
  content:  { flex: `1 1 ${SZ2.search}px`, maxWidth: SZ2.heroContentMax, minWidth: 0 },
  titleRow: { ...UI2.row(SP2.md) },

  // Frosted stats panel (statsVariant="panel")
  panel:     { display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: SP2.sm, padding: pad(SP2.md, SP2.sm), background: G2.glass, border: `1px solid ${C2.glassBorder}`, borderRadius: R2.xl, boxShadow: SH2.glass },
  pStat:     { ...UI2.row(SP2.sm), padding: pad(0, SP2.lg) },
  pSep:      { width: SZ2.hairline, alignSelf: 'stretch', background: C2.border },
  pIcon:     { fontSize: FS2.xxxl },
  pValue:    { fontSize: FS2.xl, fontWeight: FW2.semibold, lineHeight: LH2.tight, color: C2.textPrimary },
  pLabel:    { fontSize: FS2.sm, color: C2.textSecondary, marginTop: SP2.xxs },

  // variant="compact" — shorter list-page banner: bright blue gradient, whole photo on the right
  cHero:    { position: 'relative', overflow: 'hidden', isolation: 'isolate', minHeight: SZ2.heroCompactMin, borderRadius: R2.xxl, padding: pad(SP2.lg, LAYOUT2.heroX), color: C2.onDark.text, boxShadow: SH2.hero, background: G2.heroCompactBase, display: 'flex', alignItems: 'center' },
  cPhoto:   (image, position) => ({
    position: 'absolute', top: 0, right: 0, bottom: 0, width: SZ2.heroCompactImageWidth, pointerEvents: 'none',
    backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: position, backgroundRepeat: 'no-repeat',
    // left feather × top fade: the photo can sit lower than the banner top (sky above the roof)
    WebkitMaskImage: `${G2.heroCompactMask}, ${G2.heroCompactMaskTop}`, maskImage: `${G2.heroCompactMask}, ${G2.heroCompactMaskTop}`,
    WebkitMaskComposite: 'source-in', maskComposite: 'intersect',
  }),
  // imageFull: banner artwork that already contains its gradient — covers the whole banner, no mask
  cArt:     (image, position) => ({ ...fill, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: position, backgroundRepeat: 'no-repeat' }),
  cScrim:   { ...fill, background: G2.heroCompactScrim },
  cStatsScrim: { ...fill, background: G2.heroStatsScrim },
  cEyebrow: { display: 'inline-block', fontFamily: F2.body, fontSize: FS2.xs, fontWeight: FW2.medium, lineHeight: LH2.heading, color: C2.onDark.text, padding: pad(SP2.xxs, SP2.md), borderRadius: R2.pill, border: `1px solid ${C2.onDark.border}`, background: C2.onDark.surface, backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, marginBottom: SP2.xs },
  cTitle:   { fontFamily: F2.heading, fontSize: FS2.display, fontWeight: FW2.semibold, lineHeight: LH2.tight, color: C2.white, marginBottom: SP2.xs },
  cSub:     { fontFamily: F2.body, fontSize: FS2.base, color: C2.onDark.textSoft },
  // compact stats row (Portfolio "Property List"): icon circle · label · value, split by soft dividers
  cStats:   { display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: SP2.md, marginTop: SP2.xl },
  cStat:    { ...UI2.row(SP2.md), padding: pad(0, SP2.xl), minWidth: 0 },
  cSep:     { width: SZ2.hairline, height: SZ2.icon.lg, background: C2.onDark.divider },
  cStatIcon: { ...UI2.iconBox(SZ2.icon.lg, { soft: C2.onDark.surfaceHover, strong: C2.white }, { round: true }) },   // light (white) icon on a glass circle — readable on the dark banner
  cStatLbl: { ...T2.kpiLabel, color: C2.onDark.textMuted },   // standard KPI label (12 / 500), light on the navy banner
  cStatVal: { ...T2.kpiValue, color: C2.white, marginTop: SP2.xxs, whiteSpace: 'nowrap' },   // standard KPI figure 20 / 400

  eyebrow: { ...T2.eyebrow, display: 'inline-block', color: C2.onDark.text, padding: pad(SP2.xs, SP2.md), borderRadius: R2.sm, border: `1px solid ${C2.onDark.border}`, background: C2.onDark.surfaceSoft, backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, marginBottom: SP2.sm },
  title:   { ...T2.heroTitle, fontWeight: FW2.regular, marginBottom: SP2.xs },
  accent:  { fontWeight: FW2.semibold },
  sub:     { ...UI2.row(SP2.sm), fontFamily: F2.body, fontSize: FS2.sm, color: C2.onDark.textSoft },
  stats:   { display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: LAYOUT2.rowGap, marginTop: SP2.lg },
  stat:    { ...UI2.row(SP2.sm), padding: pad(0, SP2.lg) },
  sep:     { width: SZ2.hairline, height: SZ2.icon.sm, background: C2.onDark.divider },
  icon:    { fontSize: FS2.xl, color: C2.onDark.textSoft },
  value:   { fontSize: FS2.lg, fontWeight: FW2.semibold, lineHeight: LH2.none },
  label:   { fontSize: FS2.xs, color: C2.onDark.textMuted, marginTop: SP2.xxs },
  actions: { display: 'flex', flexWrap: 'wrap', gap: SP2.sm, marginTop: SP2.md },
};

export function HeroStat({ icon, label, value, first = false }) {
  return (
    <div style={{ ...S.stat, ...(first ? { paddingLeft: 0 } : {}) }}>
      {icon && <i className={`ti ${icon}`} style={S.icon} aria-hidden="true" />}
      <div>
        <div style={S.value}>{value}</div>
        <div style={S.label}>{label}</div>
      </div>
    </div>
  );
}

function PanelStat({ icon, label, value, tone }) {
  return (
    <div style={S.pStat}>
      {icon && <i className={`ti ${icon}`} style={{ ...S.pIcon, color: tone ? tone.strong : C2.primary }} aria-hidden="true" />}
      <div>
        <div style={{ ...S.pValue, ...(tone ? { color: tone.strong } : {}) }}>{value}</div>
        <div style={S.pLabel}>{label}</div>
      </div>
    </div>
  );
}

export default function HeroBanner({
  eyebrow, title, titleAccent, titleAction, subtitle, subtitleIcon,
  image, imagePosition = 'right center', stats = [], statsVariant = 'inline', actions, children, variant = 'default',
  imageFull = false,
}) {
  // Compact list-page banner (e.g. Portfolio "Property List"): pill eyebrow · bold title · one line
  if (variant === 'compact') {
    return (
      <section style={S.cHero}>
        {image && <div style={imageFull ? S.cArt(image, imagePosition) : S.cPhoto(image, imagePosition)} />}
        <div style={S.cScrim} />
        {stats.length > 0 && <div style={S.cStatsScrim} />}
        <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: SZ2.heroContentMax }}>
            {eyebrow && <div style={S.cEyebrow}>{eyebrow}</div>}
            <div style={S.cTitle}>{title}{titleAccent != null && <>{title ? ' ' : ''}{titleAccent}</>}</div>
            {subtitle && <div style={S.cSub}>{subtitle}</div>}
          </div>
          {children}
          {/* compact stats: round icon (accent on a glass circle) · label · value (standard KPI figure) */}
          {stats.length > 0 && (
            <div className="un2-hero-stats" style={S.cStats}>
              {stats.map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div style={S.cSep} aria-hidden="true" />}
                  <div style={{ ...S.cStat, ...(i === 0 ? { paddingLeft: 0 } : {}) }}>
                    {s.icon && (
                      <div style={S.cStatIcon}><i className={`ti ${s.icon}`} aria-hidden="true" /></div>
                    )}
                    <div style={UI2.minWidth0}>
                      <div style={S.cStatLbl}>{s.label}</div>
                      <div style={{ ...S.cStatVal, ...(s.valueColor ? { color: s.valueColor } : {}) }}>{s.value}</div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
          {actions && <div style={S.actions}>{actions}</div>}
        </div>
      </section>
    );
  }
  const panel = statsVariant === 'panel';
  return (
    <section style={S.hero}>
      <div style={S.sky} />
      {image && <div style={S.photo(image, imagePosition)} />}
      <div style={S.glow} />
      <div style={S.scrim} />
      <div style={S.vignette} />

      <div style={S.layout}>
        <div style={S.content}>
          {eyebrow && <div style={S.eyebrow}>{eyebrow}</div>}
          <div style={S.titleRow}>
            <div style={S.title}>
              {title}{titleAccent != null && <> <span style={S.accent}>{titleAccent}</span></>}
            </div>
            {titleAction}
          </div>
          {subtitle && (
            <div style={S.sub}>
              {subtitleIcon && <i className={`ti ${subtitleIcon}`} style={{ fontSize: FS2.md }} aria-hidden="true" />}
              {subtitle}
            </div>
          )}
          {children}
          {!panel && stats.length > 0 && (
            <div style={S.stats}>
              {stats.map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div style={S.sep} />}
                  <HeroStat {...s} first={i === 0} />
                </React.Fragment>
              ))}
            </div>
          )}
          {actions && <div style={S.actions}>{actions}</div>}
        </div>

        {panel && stats.length > 0 && (
          <div style={S.panel}>
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div style={S.pSep} />}
                <PanelStat {...s} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
