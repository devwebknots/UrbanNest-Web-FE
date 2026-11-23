import React, { useId } from 'react';
import { C2, G2, R2, SH2, TONES2, F2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── WaveHero (Design System v2) ─────────────────────────────────────────────
// Light hero for list pages (Landlord Portfolio) that matches the dashboard hero's look while using a
// PLAIN photo: the photo sits on the right with a long soft left feather, a pastel wash turns a deep-blue
// sky into the dashboard art's pale sky, and a glassy wave is drawn along its base.
//
//   [PORTFOLIO OVERVIEW]                       ← eyebrow pill
//   Property List                              ← Playfair title
//   Explore and manage all your properties…    ← subtitle
//   (◎) PROPERTIES    │ (◎) UNITS              ← stats, 2 × 2
//   (◎) AVG OCCUPANCY │ (◎) RENT THIS MONTH
//   Same height as the dashboard hero (SZ2.waveHeroMin), content centred top-to-bottom.
//
//   <WaveHero eyebrow="Portfolio Overview" title="Property List" subtitle="…"
//             image={photo} imagePosition="right 30%" imageSize="auto 125%"
//             stats={[{ icon: 'ti-building', tone: TONES2.primary, label: 'Total Properties', value: 5 }]} />
//
// Props: eyebrow, title (node), subtitle (node), image, imagePosition, imageSize (CSS background-size),
//        stats [{ icon, tone, label, value (node), note, noteTone }]
//
// Completely separate from ProfileHero (own component, own un2-whero* classes in utilities.css, own
// --un2-whero-* tokens, own SZ2.waveHero* sizes) — changing it can never affect the dashboard hero.

// The wave (viewBox 0 0 100 40, stretched across the photo's lower 40%), traced from the dashboard art:
// crest on the left, a dip under the building that stops above the bottom edge, rising up the right edge.
const WAVE = {
  body:  'M0 14 C8 6 18 4 28 8 C38 12 44 24 52 28 C60 32 70 32 80 26 C88 21 95 14 100 8 L100 40 L0 40 Z',
  crest: 'M0 14 C8 6 18 4 28 8 C38 12 44 24 52 28 C60 32 70 32 80 26 C88 21 95 14 100 8',
};

const S = {
  hero: {
    position: 'relative', overflow: 'hidden', isolation: 'isolate', minHeight: SZ2.waveHeroMin,   // dashboard hero height
    display: 'flex', flexDirection: 'column', justifyContent: 'center',                           // content centred in it
    borderRadius: R2.xxl, background: G2.profileHero, border: 'none', boxShadow: SH2.glass,       // same surface as the dashboard hero
    fontFamily: F2.body,
  },
  photo: (image, position, size) => ({
    backgroundImage: `url(${image})`, backgroundSize: size, backgroundPosition: position, backgroundRepeat: 'no-repeat',
    pointerEvents: 'none',
  }),
  sky:     { background: G2.waveHeroSky },                                         // position: .un2-whero-sky (utilities.css)
  wash:    { position: 'absolute', inset: 0, background: G2.profileHeroWash },   // pastel sky like the dashboard art
  // Runs 2px past the bottom edge (clipped by the hero) — at 40% the height lands on a sub-pixel, which left a
  // hairline gap where the dark photo showed through as a line along the base.
  waves:   { position: 'absolute', left: 0, right: 0, bottom: -SZ2.hairline * 2, width: '100%', height: `calc(40% + ${SZ2.hairline * 2}px)`, display: 'block' },

  content: { position: 'relative', zIndex: 1, maxWidth: SZ2.waveHeroContentMax, minWidth: 0 },
  // (No glow box behind the text: the text side is the plain white hero surface — the sky gradient starts after
  //  it — and a glow box showed its top/bottom edges against the gradient.)

  eyebrow: { ...T2.eyebrow, display: 'inline-block', color: C2.primaryDark, background: C2.primaryTint, border: `1px solid ${C2.chipBlue}`, padding: pad(SP2.xs, SP2.md), borderRadius: R2.pill, lineHeight: LH2.heading },
  title:   { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.snug, letterSpacing: LS2.tight, color: C2.navyDeep, margin: pad(SP2.lg, 0, SP2.xs) },
  sub:     { ...T2.lead },

  stats:   { marginTop: SP2.xxl },
  stat:    (first) => ({ ...UI2.row(SP2.md), padding: pad(0, SP2.xl), ...(first ? { paddingLeft: 0 } : {}) }),
  sLabel:  { ...T2.eyebrow, color: C2.textSecondary, letterSpacing: LS2.wide },
  sValue:  { ...T2.kpiValue, lineHeight: LH2.tight, marginTop: SP2.xxs },
  sNote:   { fontSize: FS2.xs, lineHeight: LH2.heading, color: C2.textMuted, marginTop: SP2.xxs },
};

export default function WaveHero({
  eyebrow, title, subtitle, image, imagePosition = 'right center', imageSize = 'cover', stats = [],
}) {
  const uid = useId().replace(/:/g, '');   // unique SVG gradient id per hero
  return (
    <section className="un2-whero" style={S.hero}>
      {/* sky gradient behind the photo — starts after the text (text side white), fills the gap before the photo (off on phones) */}
      <div className="un2-whero-sky" style={S.sky} aria-hidden="true" />
      {image && (
        <div className="un2-whero-photo" style={S.photo(image, imagePosition, imageSize)}>
          <div style={S.wash} aria-hidden="true" />
          <svg style={S.waves} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              {/* glassy wave: pale blue under the crest → deeper blue mid-way → soft light blue at the bottom edge */}
              <linearGradient id={`${uid}-wave`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={C2.heroWaveCrest} />
                <stop offset="0.5" stopColor={C2.heroWaveBase} />
                <stop offset="1" stopColor={C2.chipBlue} />
              </linearGradient>
            </defs>
            <path d={WAVE.body} fill={`url(#${uid}-wave)`} />
            <path d={WAVE.crest} fill="none" stroke={C2.white} strokeWidth={SZ2.hairline * 2} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}

      <div style={S.content}>
        {eyebrow && <span style={S.eyebrow}>{eyebrow}</span>}
        <h1 style={S.title}>{title}</h1>
        {subtitle && <div style={S.sub}>{subtitle}</div>}

        {stats.length > 0 && (
          <div className="un2-whero-stats" style={S.stats}>
            {stats.map((s, i) => {
              const tone = s.tone || TONES2.primary;
              return (
                <div key={s.label} style={S.stat(i === 0)}>
                  <div style={UI2.iconBox(SZ2.icon.lg, tone, { round: true })}><i className={`ti ${s.icon}`} aria-hidden="true" /></div>
                  <div style={UI2.minWidth0}>
                    <div style={S.sLabel}>{s.label}</div>
                    <div style={S.sValue}>{s.value}</div>
                    {s.note && <div style={{ ...S.sNote, ...(s.noteTone ? { color: s.noteTone.strong, fontWeight: FW2.medium } : {}) }}>{s.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
