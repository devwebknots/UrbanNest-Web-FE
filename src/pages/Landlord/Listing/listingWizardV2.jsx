// src/pages/Landlord/Listing/listingWizardV2.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// VERSION 2 frame + shared layout styles for the Landlord "Create Listing" wizard (Design System v2).
// The v1 equivalent is listingWizardShared.jsx (ListingPageShell / ListingFooter / LS) — still used by the
// steps that haven't been redesigned yet. Redesigned steps (1 Property, 2 Unit) use this file so every step
// has the identical frame:
//
//   <WizardPage propertyName="LL01" unitLabel="Unit 013" current={2} subtitle="…optional…">
//     <Grid layout="wideLeft"> … cards … </Grid>
//     <WizardFooter … />
//   </WizardPage>
//
//   WizardPage  PageShell (+ ImageBackdrop waves) · Breadcrumb · header (Create Listing 24px · subtitle │
//               Listing Status pill) · Stepper
//   AiAssist    "AI Assist" soft button — disabled with a tooltip until AI Assist is wired up
//   WZ          page-layout styles shared by the steps (tokens only)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { PageShell, Breadcrumb, ImageBackdrop } from '../../../components/layout';
import { Stepper, FIELD2 } from '../../../components/ui';
import { C2, TONES2, F2, FS2, FW2, LH2, LS2, SP2, SZ2, SH2, LAYOUT2, T2, UI2 } from '../../../constants';
import { STEPS } from './listingWizardShared';
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';   // Downloads/image 86.png — waves behind the header

export const WZ = {
  col:       UI2.stack(LAYOUT2.gridGap),                                   // stacked cards in one column
  body:      { paddingTop: SP2.md },                                       // card body under the header line
  fields:    { columnGap: SP2.lg, rowGap: SP2.lg },                        // <Grid two> of form fields
  tiles:     { gap: SP2.sm },                                              // <Grid three> of amenity tiles
  // "Listing Status: Draft" — white pill on the wave art (grey dot · dark semibold text · soft shadow)
  statusPill:{ ...UI2.pill(TONES2.neutral), minHeight: SZ2.control.md, padding: `0 ${SP2.lg}px`, gap: SP2.sm, background: C2.white, color: C2.textPrimary, fontSize: FS2.base, fontWeight: FW2.semibold, boxShadow: SH2.control, flexShrink: 0 },
  aiBtn:     { ...UI2.btn.soft, ...UI2.btnSm, opacity: 0.5, cursor: 'not-allowed' },
  rule:      { ...UI2.divider, margin: `${SP2.lg}px 0` },
  hint:      { ...UI2.text.meta, marginTop: SP2.xxs },
  strong:    { ...UI2.text.title },
  group:     { ...UI2.capsLabel, display: 'block', marginBottom: SP2.sm },  // caps label above a radio / checkbox group
  radios:    { ...UI2.row(SP2.md), flexWrap: 'wrap' },
  checks:    { display: 'flex', flexWrap: 'wrap', columnGap: SP2.xl, rowGap: SP2.sm },
  // chips + input inside one field box (landmarks, highlights)
  chipBox:   { ...FIELD2.input, height: 'auto', minHeight: FIELD2.input.height, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SP2.xs, padding: `${SP2.xs}px ${SP2.md}px` },
  chip:      { ...UI2.featureChip() },
  chipX:     { padding: 0, border: 'none', background: 'none', cursor: 'pointer', color: C2.textSecondary, fontSize: FS2.sm, display: 'inline-flex' },
  chipIn:    { flex: 1, minWidth: SZ2.searchSm / 3, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: FS2.base, color: C2.textPrimary, height: SZ2.control.md },
  stateBox:  { ...UI2.empty },
  title:     { ...T2.sectionTitle, margin: 0 },
  // Page header — title = the standard page/hero title (Playfair 24 semibold, same as the Dashboard / Portfolio /
  // Listings banners) · subtitle = T2.label · status pill on the right of the title line
  head:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP2.lg, flexWrap: 'wrap' },
  pageTitle: { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.snug, letterSpacing: LS2.tight, color: C2.navyDeep, margin: 0 },
  pageSub:   { ...UI2.text.label, marginTop: SP2.sm },
};

// AI Assist isn't wired to anything yet → visibly disabled with a tooltip (same behaviour as the v1 AiAssistButton)
export function AiAssist() {
  return (
    <button type="button" style={WZ.aiBtn} disabled title="AI Assist isn't available yet — coming soon">
      <i className="ti ti-sparkles" style={UI2.btnIcon} aria-hidden="true" /> AI Assist
    </button>
  );
}

// Chips + "add" input in one field box (Enter adds) — Nearby Landmarks, Listing Highlights
export function ChipInput({ items, draft, onDraft, onAdd, onRemove, placeholder, label }) {
  return (
    <div className="un2-focus-ring" style={WZ.chipBox}>
      {items.map((l, i) => (
        <span key={i} style={WZ.chip}>
          {l}
          <button type="button" style={WZ.chipX} onClick={() => onRemove(i)} aria-label={`Remove ${l}`}><i className="ti ti-x" aria-hidden="true" /></button>
        </span>
      ))}
      <input
        style={WZ.chipIn}
        placeholder={placeholder}
        value={draft}
        onChange={e => onDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
        aria-label={label || placeholder}
      />
    </div>
  );
}

// PageShell + wave backdrop + breadcrumb + "Create Listing" header (status pill) + stepper
const DEFAULT_SUB = 'Define what is being offered and ensure information for prospects is correct.';

export function WizardPage({ propertyName, unitLabel, current, steps = STEPS, subtitle = DEFAULT_SUB, children }) {
  return (
    <PageShell animate backdrop={<ImageBackdrop image={backdropArt} />} activePage="listings" title="UrbanNest Landlord">
      <Breadcrumb items={[
        { label: 'Properties', href: '/landlord-portal/portfolio' },
        { label: propertyName || '…', onClick: () => window.history.back() },
        { label: unitLabel },
      ]} />
      <section style={WZ.head}>
        <div style={UI2.minWidth0}>
          <h1 style={WZ.pageTitle}>Create Listing</h1>
          <div style={WZ.pageSub}>{subtitle}</div>
        </div>
        <span style={WZ.statusPill}><span style={UI2.statusDot(TONES2.neutral)} />Listing Status: Draft</span>
      </section>
      <Stepper steps={steps} current={current} />
      {children}
    </PageShell>
  );
}
