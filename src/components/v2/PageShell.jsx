import React from 'react';
import NavF from '../layout/NavF';
import TopBar from './TopBar';
import { C2, F2, LAYOUT2, pad } from '../../constants/v2';

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

const S = {
  shell:   { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: F2.body, background: C2.pageBg, color: C2.textPrimary },
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  content: { flex: 1, overflowY: 'auto', padding: pad(LAYOUT2.pageTop, LAYOUT2.pageX, LAYOUT2.pageBottom) },
};

export default function PageShell({ activePage, badges, nav, animate = false, children, ...topBarProps }) {
  return (
    <div style={S.shell}>
      {nav || <NavF activePage={activePage} badges={badges} />}
      <div style={S.main}>
        <TopBar {...topBarProps} />
        <main className={animate ? 'un2-stack-sections un2-enter-stagger' : 'un2-stack-sections'} style={S.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
