import React from 'react';
import { C2, R2, SH2, F2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, pad } from '../../constants';
import HeroStats from './HeroStats';

// ─── ListingsHero (Design System v2) ─────────────────────────────────────────
// Banner for the landlord Listings page. Text, stats and height are the SAME styles as the dashboard hero
// (ProfileHero) and the portfolio hero (WaveHero) — eyebrow pill · Playfair title · lead subtitle · one row of
// stats (round icon box · caps label · KPI figure, hairline separated) · SZ2.waveHeroMin height.
// The only difference: the whole banner art is ONE background image (assets/landlord/listings-hero.jpg —
// Downloads/image 85.png with its baked-in text removed) instead of a feathered photo.
//
//   <ListingsHero eyebrow="Listings Overview" title="Listings" subtitle="…" image={art}
//                 stats={[{ icon: 'ti-speakerphone', tone: TONES2.success, label: 'Active', value: 1 }]} />
//
// Props: eyebrow, title, subtitle, image, imagePosition, stats [{ icon, tone, label, value (node), note, noteTone }],
//        actions (buttons in a row under the stats — same place + spacing as the dashboard hero's buttons)
// Reuses the dashboard hero's layout classes (un2-phero padding, un2-phero-stats row) read-only — nothing shared
// is changed by this component.

const S = {
  hero: (image, position) => ({
    position: 'relative', overflow: 'hidden', isolation: 'isolate', minHeight: SZ2.waveHeroMin,   // same height as the dashboard / portfolio heroes
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    borderRadius: R2.xxl, border: 'none', boxShadow: SH2.glass, fontFamily: F2.body,
    backgroundColor: C2.primaryWash,
    backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: position, backgroundRepeat: 'no-repeat',
  }),
  content: { position: 'relative', zIndex: 1, minWidth: 0 },

  // ↓ identical to ProfileHero / WaveHero
  eyebrow: { ...T2.eyebrow, display: 'inline-block', color: C2.primaryDark, background: C2.primaryTint, border: `1px solid ${C2.chipBlue}`, padding: pad(SP2.xs, SP2.md), borderRadius: R2.pill, lineHeight: LH2.heading },
  title:   { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.snug, letterSpacing: LS2.tight, color: C2.navyDeep, margin: pad(SP2.lg, 0, SP2.xs) },
  sub:     { ...T2.lead },

  stats:   { marginTop: SP2.xxl },   // row itself = HeroStats

  actions: { display: 'flex', flexWrap: 'wrap', gap: SP2.sm, marginTop: SP2.xxl },   // = ProfileHero: button row under the stats
};

export default function ListingsHero({
  eyebrow, title, subtitle, image, imagePosition = 'right bottom', stats = [], actions,
}) {
  return (
    <section className="un2-phero" style={S.hero(image, imagePosition)}>
      <div style={S.content}>
        {eyebrow && <span style={S.eyebrow}>{eyebrow}</span>}
        <h1 style={S.title}>{title}</h1>
        {subtitle && <div style={S.sub}>{subtitle}</div>}

        {/* stats row — the shared HeroStats component (same markup + styles as before, now reusable) */}
        <HeroStats stats={stats} style={S.stats} />

        {actions && <div style={S.actions}>{actions}</div>}
      </div>
    </section>
  );
}
