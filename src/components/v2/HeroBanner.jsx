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
// Props: eyebrow, title (node), titleAccent (bold part after title), subtitle,
//        subtitleIcon, image, imagePosition (CSS background-position), stats[], actions

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
  content:  { position: 'relative', zIndex: 1, maxWidth: SZ2.heroContentMax },

  eyebrow: { ...T2.eyebrow, display: 'inline-block', color: C2.onDark.text, padding: pad(SP2.xs, SP2.md), borderRadius: R2.sm, border: `1px solid ${C2.onDark.border}`, background: C2.onDark.surfaceSoft, backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, marginBottom: SP2.sm },
  title:   { ...T2.heroTitle, fontWeight: FW2.regular, marginBottom: SP2.xs },
  accent:  { fontWeight: FW2.bold },
  sub:     { ...UI2.row(SP2.sm), fontFamily: F2.body, fontSize: FS2.sm, color: C2.onDark.textSoft },
  stats:   { display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: LAYOUT2.rowGap, marginTop: SP2.lg },
  stat:    { ...UI2.row(SP2.sm), padding: pad(0, SP2.lg) },
  sep:     { width: SZ2.hairline, height: SZ2.icon.sm, background: C2.onDark.divider },
  icon:    { fontSize: FS2.xl, color: C2.onDark.textSoft },
  value:   { fontSize: FS2.lg, fontWeight: FW2.bold, lineHeight: LH2.none },
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

export default function HeroBanner({
  eyebrow, title, titleAccent, subtitle, subtitleIcon,
  image, imagePosition = 'right center', stats = [], actions,
}) {
  return (
    <section style={S.hero}>
      <div style={S.sky} />
      {image && <div style={S.photo(image, imagePosition)} />}
      <div style={S.glow} />
      <div style={S.scrim} />
      <div style={S.vignette} />

      <div style={S.content}>
        {eyebrow && <div style={S.eyebrow}>{eyebrow}</div>}
        <div style={S.title}>
          {title}{titleAccent != null && <> <span style={S.accent}>{titleAccent}</span></>}
        </div>
        {subtitle && (
          <div style={S.sub}>
            {subtitleIcon && <i className={`ti ${subtitleIcon}`} style={{ fontSize: FS2.md }} aria-hidden="true" />}
            {subtitle}
          </div>
        )}
        {stats.length > 0 && (
          <>
            <div style={S.stats}>
              {stats.map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div style={S.sep} />}
                  <HeroStat {...s} first={i === 0} />
                </React.Fragment>
              ))}
            </div>
          </>
        )}
        {actions && <div style={S.actions}>{actions}</div>}
      </div>
    </section>
  );
}
