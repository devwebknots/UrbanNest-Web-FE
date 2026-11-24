import React, { useState } from 'react';
import NavF from './NavF';
import TopBar from './TopBar';
import { C2, F2, SZ2, LAYOUT2, pad } from '../../constants';

// ─── PageShell (Design System v2) ────────────────────────────────────────────
// The full page frame every redesigned Landlord screen uses:
//   sidebar (NavF) │ TopBar
//                  │ scrolling content — page padding + section gap built in
//
//   <PageShell activePage="leases" title="Leases" avatarText="NW">
//     <HeroBanner … />
//     <section className="un2-grid-4">…StatCards…</section>
//     <section className="un2-grid-wide-left">…SectionCards…</section>
//   </PageShell>
//
// Each direct child is one section; they are stacked LAYOUT2.sectionGap apart
// and never shrink. Never add your own margins between sections.
//
// Props: activePage, badges (→ NavF) · title, avatarText, avatarLabel,
//        searchPlaceholder, onSearch, notificationDot, actions (→ TopBar) ·
//        nav (custom sidebar node, replaces NavF) · children
//        animate (true → sections rise in one after another on load; grid rows stagger their
//                 cards — class un2-enter-stagger in utilities.css, off for reduced motion)
//        heroBehindTopBar (true → the first section, an <OpenHero underTopBar>, runs up BEHIND the top
//                 bar: the bar floats transparent over the photo and turns back into the normal glass
//                 bar once the content scrolls. Opt-in per page — Portfolio. Off everywhere else.)
//        backdrop (node, e.g. <PageWave />) → decorative layer at the top of the content that also runs up
//                 BEHIND the top bar (same floating bar as heroBehindTopBar); the content keeps its normal
//                 top spacing below the bar and scrolls over / with it. Opt-in per page — Unit detail.

const S = {
  shell:   { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: F2.body, background: C2.pageBg, color: C2.textPrimary },
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative' },
  content: { flex: 1, overflowY: 'auto', padding: pad(LAYOUT2.pageTop, LAYOUT2.pageX, LAYOUT2.pageBottom) },
  // backdrop: own stacking context (the backdrop sits at z -1 behind the sections) · room for the floating bar
  withBackdrop: { position: 'relative', zIndex: 0, paddingTop: SZ2.topbar + LAYOUT2.pageTop },
};

export default function PageShell({ activePage, badges, nav, animate = false, heroBehindTopBar = false, backdrop, children, ...topBarProps }) {
  const [scrolled, setScrolled] = useState(false);
  const floating = heroBehindTopBar || !!backdrop;
  const onScroll = floating
    ? e => { const s = e.currentTarget.scrollTop > 0; if (s !== scrolled) setScrolled(s); }
    : undefined;
  return (
    <div style={S.shell}>
      {nav || <NavF activePage={activePage} badges={badges} />}
      <div style={S.main}>
        <TopBar {...topBarProps} overlay={floating} solid={scrolled} />
        <main className={animate ? 'un2-stack-sections un2-enter-stagger' : 'un2-stack-sections'} style={backdrop ? { ...S.content, ...S.withBackdrop } : S.content} onScroll={onScroll}>
          {backdrop}
          {children}
        </main>
      </div>
    </div>
  );
}
