import React from 'react';
import { C2, G2, R2, SH2, TONES2, F2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── ProfileHero (Design System v2) ──────────────────────────────────────────
// LIGHT dashboard hero: soft blue-glass surface, the artwork on the right (bright building framed
// by soft waves — assets/v2/landlord/dashboard-hero-light.jpg) with its
// left edge feathered into the surface (no seam, no hard box), and on the left:
//
//   [EXECUTIVE PROFILE]  ● Active Portfolio        ← eyebrow pill + live status
//   Vance Residential Holdings                      ← Playfair title (semibold, not bold)
//   Welcome back · Property Owner                   ← subtitle
//   (◎) PROPERTIES │ (◎) TOTAL UNITS │ (◎) TENANTS  ← stats, hairline separated
//       12             84               81
//       note           note             note
//   [ Primary action ] [ Secondary ]
//
//   <ProfileHero eyebrow="Executive Profile" status="Active Portfolio"
//                title="Nick Vance" subtitle="Welcome back · Property Owner"
//                image={heroImg}
//                stats={[{ icon: 'ti-building', label: 'Properties', value: 12, note: '+1 new', noteTone: TONES2.success }]}
//                actions={<>…buttons…</>} />
//
// Props: eyebrow, status (text next to a pulsing green dot), title (node), subtitle (node),
//        image, imagePosition, stats [{ icon, tone, label, value (node), note, noteTone }], actions
// Layout / responsive rules live on the un2-phero* classes (utilities.css):
//   desktop → photo behind the right side · ≤ 860px → photo strip above the text · ≤ 600px → stats 2 × 2.

const S = {
  hero: {
    position: 'relative', overflow: 'hidden', isolation: 'isolate', minHeight: SZ2.profileHeroMin,
    borderRadius: R2.xxl, background: G2.profileHero, border: 'none', boxShadow: SH2.glass,   // container standard: no border, minimal shadow
    fontFamily: F2.body,
  },
  photo: (image, position) => ({
    backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: position, backgroundRepeat: 'no-repeat',
    pointerEvents: 'none',
  }),
  content: { position: 'relative', zIndex: 1, maxWidth: SZ2.profileHeroContentMax, minWidth: 0 },
  // Readability glow behind the text column: bleeds past the column's right edge and fades out,
  // sits above the photo but below the text (inside content's stacking context). Off on phones.
  glow:    { position: 'absolute', top: -SP2.xxl, bottom: -SP2.xxl, left: -SP2.xxxl, right: -SZ2.icon.lg * 2, zIndex: -1, pointerEvents: 'none', background: G2.profileHeroGlow },

  topRow:  { ...UI2.row(SP2.lg), flexWrap: 'wrap', rowGap: SP2.sm },
  eyebrow: { ...T2.eyebrow, color: C2.primaryDark, background: C2.primaryTint, border: `1px solid ${C2.chipBlue}`, padding: pad(SP2.xs, SP2.md), borderRadius: R2.pill, lineHeight: LH2.heading },
  status:  { ...UI2.row(SP2.sm), fontSize: FS2.sm, fontWeight: FW2.medium, color: C2.textBody },
  dot:     { ...UI2.dot(C2.success) },

  title:   { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.snug, letterSpacing: LS2.tight, color: C2.navyDeep, margin: pad(SP2.lg, 0, SP2.xs) },
  sub:     { ...T2.lead },

  stats:   { marginTop: SP2.xxl },
  stat:    (first) => ({ ...UI2.row(SP2.md), padding: pad(0, SP2.xl), ...(first ? { paddingLeft: 0 } : {}) }),
  sLabel:  { ...T2.eyebrow, color: C2.textSecondary, letterSpacing: LS2.wide },
  sValue:  { ...T2.kpiValue, lineHeight: LH2.tight, marginTop: SP2.xxs },   // standard KPI figure — 20px / 400
  sNote:   { fontSize: FS2.xs, lineHeight: LH2.heading, color: C2.textMuted, marginTop: SP2.xxs },

  actions: { display: 'flex', flexWrap: 'wrap', gap: SP2.sm, marginTop: SP2.xxl },
};

export default function ProfileHero({
  eyebrow, status, title, subtitle, image, imagePosition = 'left center', stats = [], actions,
}) {
  return (
    <section className="un2-phero" style={S.hero}>
      {image && (
        <div className="un2-phero-photo" style={S.photo(image, imagePosition)} />
      )}

      <div style={S.content}>
        <div className="un2-phero-glow" style={S.glow} aria-hidden="true" />
        {(eyebrow || status) && (
          <div style={S.topRow}>
            {eyebrow && <span style={S.eyebrow}>{eyebrow}</span>}
            {status && (
              <span style={S.status}>
                <span className="un2-live-dot" style={S.dot} aria-hidden="true" />
                {status}
              </span>
            )}
          </div>
        )}

        <h1 style={S.title}>{title}</h1>
        {subtitle && <div style={S.sub}>{subtitle}</div>}

        {stats.length > 0 && (
          <div className="un2-phero-stats" style={S.stats}>
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

        {actions && <div style={S.actions}>{actions}</div>}
      </div>
    </section>
  );
}
