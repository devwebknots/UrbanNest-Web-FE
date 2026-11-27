// PMSubscriptionBilling.jsx — PM Portal: Account Settings → Subscription & Billing tab BODY (Design System v2)
// Layout: Downloads/image 181.png. Rendered by PMSubscriptionPage (which owns all data, the cart and the
// promotion modal) inside its PMPageShell frame — this file is presentation only:
//
//   <Grid leadThree>  plan banner (navy, G2.darkCard)  │  3 action cards  │  Allocated Capacity (ProgressRing)
//   Available Plans — header · carousel of plan cards (ui/PhotoCard: photo + glass status tag · name · text · price │ Subscribe)
//   Payment Methods & Details card — 3 divided columns (card visual │ entity info │ linked bank accounts) + note
//   Billing History & Invoices card — toolbar · DataTable · count + pager
//
// Card number / EIN / entity address / invoices are SAMPLE data (no payment gateway or invoice endpoint exists —
// same as the v1 page); every action without a backend is disabled with a tooltip saying why.
// Linked Bank Accounts reads the PM's real accounts (GET /api/pm/bank-accounts/).

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Available Plans thumbnails — plan-themed photos (Unsplash, free licence; assets/landlord/plans/), chosen by the
// plan's SIZE (unit range): starter = home-office desk with a listings dashboard · growth = growth dashboard · scale = team planning ·
// enterprise = executive win
import imgPlanStarter from '../../../assets/landlord/plans/plan-starter.jpg';
import imgPlanGrowth from '../../../assets/landlord/plans/plan-growth.jpg';
import imgPlanScale from '../../../assets/landlord/plans/plan-scale.jpg';
import imgPlanEnterprise from '../../../assets/landlord/plans/plan-enterprise.jpg';
import { Grid } from '../../../components/layout';
import { DataTable, CardWave, NavyGlow, PhotoCard, ProgressRing, Switch, TextLink, Carousel } from '../../../components/ui';
import { C2, G2, GSTOPS2, TONES2, ACCENT2, SH2, FS2, FW2, LH2, LS2, R2, SP2, SZ2, T2, UI2, OP2, pad } from '../../../constants';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });
// plan photo by portfolio size (+ the crop that frames each photo in the card's photo strip):
//   ≤ 50 units → Starter · ≤ 200 → Growth · larger capped range → Scale · no cap / custom pricing → Enterprise
const PLAN_PHOTO = {
  small:  { src: imgPlanStarter,    pos: 'center 60%' },
  medium: { src: imgPlanGrowth,     pos: 'center 40%' },
  large:  { src: imgPlanScale,      pos: 'center 45%' },
  top:    { src: imgPlanEnterprise, pos: 'center 40%' },
};
const planPhotoFor = (plan, custom) => {
  const max = plan.unit_limit_max;
  if (custom || max == null) return PLAN_PHOTO.top;
  if (max <= 50) return PLAN_PHOTO.small;
  if (max <= 200) return PLAN_PHOTO.medium;
  return PLAN_PHOTO.large;
};
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// "ACTIVE" → "Active" (status word reads like the other status words, not shouted)
const titleCase = w => String(w).charAt(0).toUpperCase() + String(w).slice(1).toLowerCase();
// "26th" — billing day label (v1: "Monthly (billed on the 26th)")
const ordinalDay = n => { const v = n % 100; return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'); };

const SAMPLE_INVOICES = [
  { inv: 'INV-2026-009', date: 'Sep 30, 2026' },
  { inv: 'INV-2026-008', date: 'Aug 31, 2026' },
  { inv: 'INV-2026-007', date: 'Jul 31, 2026' },
  { inv: 'INV-2026-006', date: 'Jun 30, 2026' },
];

const ON = C2.onDark;
const S = {
  // ── row 1: plan banner — LIGHT card with the standard light wave artwork (CardWave = Landlord Dashboard
  //    "Occupancy Rate" card), user 2026-11-27; was the navy NavyGlow banner. Text = the light-surface versions.
  banner:     { ...UI2.card, padding: pad(SP2.xl, SP2.xl, SP2.xxl), position: 'relative',   /* 20 top / sides, 24 under the buttons — 16 looked tight (user 2026-11-27) */ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' },
  // grid areas:  head (crown · title) │ art   /   foot (paragraph · button) across both columns
  bannerGrid: { position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gridTemplateAreas: '"head art" "foot foot"', columnGap: SP2.lg, rowGap: SP2.lg, alignItems: 'center' },
  bannerHead: { ...UI2.stack(SP2.md), gridArea: 'head', minWidth: 0 },
  bannerArt:  { gridArea: 'art', width: SZ2.cardsArtSm, pointerEvents: 'none' },
  bannerFoot: { ...UI2.stack(SP2.lg), gridArea: 'foot', minWidth: 0 },
  crown:      { ...UI2.iconBox(SZ2.icon.lg, TONES2.primary, { round: true }), fontSize: FS2.xl },
  bannerEyebrow: { ...T2.eyebrow, color: C2.textSecondary },
  bannerTitle:{ ...T2.heroTitle, fontSize: FS2.xxl, color: C2.textPrimary, margin: 0 },
  bannerText: { ...T2.body, color: C2.textSecondary, margin: 0 },
  bannerPrice:T2.kpiValue,   // standard 20px · 400 figure (user 2026-11-27; was figureMd 24)
  bannerUnit: { fontSize: FS2.base, color: C2.textSecondary, fontWeight: FW2.regular },
  bannerActs: { ...UI2.row(SP2.sm), flexWrap: 'wrap', position: 'relative' },
  progTrack:  UI2.progressTrack,
  progRow:    { ...UI2.rowBetween(SP2.sm), fontSize: FS2.xs, color: C2.textSecondary },
  // current-plan details (the v1 "Active Tier" card content, restored in v2 styles — user 2026-11-27)
  planTop:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP2.lg, flexWrap: 'wrap' },
  // tier · status · persona = the Services standard: NO boxes — dot + coloured word (UI2.statusPill, table status),
  // all on ONE text baseline, each dot centred on its word (= PM Services section counts)
  planTags:   { ...UI2.row(SP2.md), flexWrap: 'wrap', alignItems: 'baseline' },
  planTag:    (tone) => ({ ...UI2.statusPill(tone), alignItems: 'baseline' }),
  planTagDot: (tone) => ({ ...UI2.statusDot(tone), alignSelf: 'center' }),
  planDates:  { ...UI2.context, marginTop: SP2.xs },
  planPriceCol:{ ...UI2.stack(SP2.xxs), alignItems: 'flex-end', textAlign: 'right' },
  curDesc:    { ...UI2.text.meta, margin: 0 },
  planProgHead: { ...UI2.rowBetween(SP2.sm), flexWrap: 'wrap' },
  planChips:  { display: 'flex', flexWrap: 'wrap', gap: SP2.sm },
  // actions (layout = v1): primary · secondary on the left, quiet grey Cancel on the right, no divider; buttons = the
  // standard extra-small size UI2.btnXs (user 2026-11-27)
  planActs:   { ...UI2.row(SP2.sm), flexWrap: 'wrap', rowGap: SP2.sm, position: 'relative', marginTop: SP2.xs },
  // quiet grey text action (= v1) — red drew the eye away from Upgrade / Change Plan (user 2026-11-27); not wired: cursor + tooltip
  planCancel: { ...UI2.btn.link, marginLeft: 'auto', fontSize: FS2.xs, color: C2.textSecondary, fontWeight: FW2.regular, cursor: 'not-allowed' },   // same 11px as the btnXs labels
  // ── Available Plans — vertical photo cards (ui/PhotoCard = the Services Add-On card) in the
  //    standard Carousel, three per view, scrolls sideways (user 2026-11-27 — replaced the tall navy-header cards)
  // footer (= Services add-on price footer): "$199 / mo" on one line · units + yearly price as the caption line
  // footer = the More From UrbanNest footer (PhotoCard footAlign="center"): round icon + text on the left (takes the
  // free space, truncates with …) │ button right — one line, centred, never wraps or clips (user 2026-11-27)
  planInfo:   { ...UI2.row(SP2.sm), flex: 1, minWidth: 0 },
  planIcon:   UI2.iconBox(SZ2.icon.sm, TONES2.primary, { round: true }),
  planText:   { ...UI2.stack(SP2.xxs), minWidth: 0 },
  planCap:    { ...UI2.context, display: 'block', minWidth: 0, ...UI2.truncate },   // block so the … ellipsis works
  planPrice:  { ...UI2.row(SP2.xs), alignItems: 'baseline', whiteSpace: 'nowrap' },
  planOff:    { cursor: 'not-allowed' },   // current plan / contact sales: full look, cursor + tooltip (no fade)
  // ── row 1: action cards ──
  actions:    UI2.stack(SP2.md),
  // side-column cards — the v1 content (middle: Billing Breakdown · Expand Your Plan │ right: Allocated Capacity ·
  // Listing Promotion, the v1 split — user 2026-11-27)
  // in v2 styles, compact so the column never grows past the plan card's height (user 2026-11-27)
  midCard:    { ...UI2.card, ...UI2.stack(SP2.md), flex: 1, padding: pad(SP2.lg, SP2.lg), minWidth: 0 },
  // the card's link pins to the bottom (card footer rhythm) so a stretched card has no empty gap under its content
  midLink:    { marginTop: 'auto', alignSelf: 'flex-start' },
  midHead:    UI2.rowBetween(SP2.sm),
  midTitle:   { ...UI2.text.rowTitleLg, margin: 0 },   // 14 · 400 (user 2026-11-27)
  midIcon:    UI2.iconBox(SZ2.icon.sm, TONES2.primary, { round: true }),
  bbRow:      UI2.rowBetween(SP2.md),
  bbLabel:    { ...UI2.stack(0), minWidth: 0 },
  bbFoot:     { ...UI2.stack(SP2.xs), marginTop: 'auto' },
  bbTotal:    { ...UI2.rowBetween(SP2.md), paddingTop: SP2.sm, borderTop: `${SZ2.hairline}px solid ${C2.border}` },
  bbTotalLbl: UI2.text.rowTitleLg,
  promoName:  { ...UI2.rowBetween(SP2.sm), flexWrap: 'wrap' },
  // ── row 1: capacity ──
  capCard:    { ...UI2.card, ...UI2.stack(SP2.lg) },
  capHead:    UI2.rowBetween(SP2.sm),
  capIcon:    UI2.iconBox(SZ2.icon.sm, TONES2.primary, { round: true }),
  capRow:     { ...UI2.row(SP2.lg), alignItems: 'center' },
  ringVal:    { ...T2.statValue, fontWeight: FW2.semibold, color: C2.navyDeep },
  ringLabel:  UI2.text.rowTitleLg,   // 14 · 400 (user 2026-11-27 — same as the middle-column titles)
  metric:     (first) => ({ ...UI2.kvRow(first), alignItems: 'center' }),
  metricKey:  UI2.row(SP2.sm),
  metricIcon: { fontSize: FS2.lg, color: C2.primary },
  // ── section headers ──
  secHead:    { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', alignItems: 'flex-end' },
  secTitle:   { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  secSub:     { ...T2.label, margin: `${SP2.xs}px 0 0` },
  section:    UI2.stack(SP2.lg),
  // ── payment methods ──
  card:       { ...UI2.card, ...UI2.stack(SP2.xl) },
  colLabel:   { ...UI2.rowBetween(SP2.sm), minHeight: SZ2.control.sm },
  colTitle:   UI2.text.rowTitleLg,   // 14 · 400 (user 2026-11-27; was title 13 · 600)
  col:        { ...UI2.stack(SP2.md), minWidth: 0 },
  // "Default" = the standard boxless status (dot + coloured word, = table status) in primary blue — a selected state,
  // not a success (user 2026-11-27: no tinted pill boxes)
  defPill:    UI2.statusPill(TONES2.primary),
  // payment card visual (design): NavyGlow background · EMV chip + contactless · Mastercard mark · number · holder / expiry
  ccard:      { borderRadius: R2.xl, boxShadow: SH2.dark, padding: pad(SP2.lg, SP2.xl), color: C2.white, position: 'relative', overflow: 'hidden' },
  ccIn:       { ...UI2.stack(SP2.lg), position: 'relative' },
  ccTop:      { ...UI2.rowBetween(SP2.md), alignItems: 'flex-start' },
  ccChipRow:  { ...UI2.row(SP2.sm), paddingTop: SP2.xs },
  ccBrand:    { ...UI2.stack(SP2.xxs), alignItems: 'center' },
  ccBrandName:{ fontSize: FS2.xs, fontWeight: FW2.semibold, color: C2.white },
  ccNumber:   { ...UI2.row(SP2.md), fontVariantNumeric: 'tabular-nums', lineHeight: LH2.none },
  ccDots:     { fontSize: FS2.md, letterSpacing: LS2.caps, color: ON.textSoft },
  ccLast4:    { fontSize: FS2.xl, fontWeight: FW2.semibold, letterSpacing: LS2.wide },
  ccMeta:     { ...UI2.rowBetween(SP2.md), alignItems: 'flex-end' },
  ccLabel:    { ...T2.eyebrow, color: ON.textMuted },
  ccValue:    { fontSize: FS2.sm, fontWeight: FW2.semibold, marginTop: SP2.xxs, ...UI2.truncate },
  autoRow:    { ...UI2.tintRow, ...T2.label, justifyContent: 'space-between' },
  autoText:   UI2.row(SP2.sm),
  cardActs:   { ...UI2.row(SP2.lg), justifyContent: 'space-between', padding: pad(0, SP2.xs) },
  // not wired yet → FULL look (never faded, = v1 / the no-fade rule): disabled + cursor not-allowed + tooltip
  off:        { cursor: 'not-allowed' },
  muteBtn:    { ...UI2.btn.link, color: C2.textSecondary, cursor: 'not-allowed' },
  linkOff:    { ...UI2.btn.link, cursor: 'not-allowed' },
  // Commercial Entity Info / Linked Bank Accounts = boxless details list (user 2026-11-27: grey boxes looked heavy):
  // round icon · caps label · value (14 · 400) · optional grey sub line, thin line BETWEEN rows (un2-row-divided)
  detList:    UI2.stack(0),
  detRow:     (first) => ({ ...UI2.row(SP2.md), alignItems: 'flex-start', padding: pad(first ? 0 : SP2.md, 0, SP2.md) }),   /* 12 above / below each divider (16 felt loose — user 2026-11-27) */   // first row: no space above (lines up with the payment card)
  detBody:    { ...UI2.stack(SP2.xs), minWidth: 0, flex: 1 },   // caps → value 4 (2 looked tight — user 2026-11-27)
  detValue:   { ...UI2.text.rowTitleLg, ...UI2.truncate },
  detSub:     { ...T2.label, lineHeight: LH2.body, marginTop: SP2.xs },   // + 4 → 8 above the grey sub lines
  editOff:    { ...UI2.btn.link, cursor: 'not-allowed' },   // not wired: full look (no fade) + cursor + tooltip
  infoIcon:   UI2.iconBox(SZ2.icon.md, TONES2.primary, { round: true }),
  bankFoot:   { ...UI2.rowBetween(SP2.sm), ...T2.caption, marginTop: 'auto' },   // pinned to the column's bottom edge (user 2026-11-27)
  note:       { ...UI2.tintRow, background: TONES2.success.tint, color: TONES2.success.fg, ...T2.label },
  // ── billing history ──
  tools:      { ...UI2.row(SP2.sm), flexWrap: 'wrap' },
  search:     { ...UI2.toolbar.search, cursor: 'not-allowed' },
  searchIcon: UI2.toolbar.searchIcon,
  input:      UI2.searchInput,
  yearBtn:    { ...UI2.toolbar.button, cursor: 'not-allowed' },
  softOff:    { ...UI2.btn.soft, cursor: 'not-allowed', alignSelf: 'flex-start' },
  paid:       UI2.statusPill(TONES2.success),
  foot:       UI2.pager.foot,     // shared table pager (UI2.pager)
  pager:      UI2.pager.row,
  pageBtn:    UI2.pager.btn,
  pageOn:     UI2.pager.current,
  btnIcon:    UI2.btnIcon,
};

// ── Payment card marks (pure SVG, C2 colours, no filters) ──
// EMV chip: metallic plate with the contact-pad lines (silver-blue — the app never uses gold / yellow)
function CardChip() {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg width={SZ2.icon.md + SP2.xs} viewBox="0 0 36 28" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`chip-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C2.white} />
          <stop offset="0.5" stopColor={C2.chipBlue} />
          <stop offset="1" stopColor={C2.heroWaveBase} />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="35" height="27" rx="5" fill={`url(#chip-${id})`} />
      <path d="M0.5 9.5H11M0.5 18.5H11M25 9.5H35.5M25 18.5H35.5M11 0.5V27.5M25 0.5V27.5M11 14H25" stroke={C2.primary} strokeOpacity="0.35" strokeWidth="1" fill="none" />
      <rect x="11" y="6" width="14" height="16" rx="3" fill="none" stroke={C2.primary} strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}
// contactless waves
function Contactless() {
  return (
    <svg width={SZ2.icon.xs} viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }} fill="none" stroke={C2.white} strokeWidth="1.6" strokeLinecap="round">
      <path d="M5 6.5c1.6 2.2 1.6 4.8 0 7" opacity="0.6" />
      <path d="M9 4.5c2.6 3.4 2.6 7.6 0 11" opacity="0.8" />
      <path d="M13 2.5c3.6 4.6 3.6 10.4 0 15" />
    </svg>
  );
}
// Mastercard: two overlapping circles, the overlap a blend of both
function MastercardMark() {
  return (
    <svg width={SZ2.icon.lg + SP2.sm} viewBox="0 0 48 30" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="15" cy="15" r="14" fill={C2.errorDark} />
      <circle cx="33" cy="15" r="14" fill={ACCENT2.rose.fg} />
      <path d="M24 4.3a14 14 0 0 1 0 21.4a14 14 0 0 1 0-21.4z" fill={ACCENT2.rose.fg} opacity="0.55" />
      <path d="M24 4.3a14 14 0 0 1 0 21.4a14 14 0 0 1 0-21.4z" fill={C2.errorDark} opacity="0.45" />
    </svg>
  );
}

export default function PMSubscriptionBilling({
  plans, sub, currentPlan, includedServices = [], monthlyPrice, addonsList, addonsTotal, totalMonthlySpend, progressPct, daysRemaining, periodStart,
  unitsUsed, totalProperties, capMax, capPct, subIncludedCount, subAddonCount, activePromoSub, onOpenPromo,
  cartItems, onSubscribe, userLabel, email,
}) {
  const navigate = useNavigate();
  const plansRef = useRef(null);
  const toPlans = () => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Linked Bank Accounts — the PM's real payout accounts
  const [banks, setBanks] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/pm/bank-accounts/`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : []))
      .then(list => setBanks(Array.isArray(list) ? list : []))
      .catch(() => setBanks([]));
  }, []);
  const defaultBank = banks ? (banks.find(b => b.is_default) || banks[0]) : null;

  const remaining = capMax != null ? Math.max(0, capMax - unitsUsed) : null;

  // ── Billing history (sample rows) ──
  const invoiceColumns = [
    { key: 'inv',  label: 'Invoice number', type: 'primary', fit: true, render: r => r.inv },
    { key: 'date', label: 'Billing date', type: 'secondary', fit: true, render: r => r.date },
    { key: 'desc', label: 'Description', width: 2, render: () => `${sub?.plan_name || 'Independent PM Plan'} — Monthly Subscription` },
    { key: 'amt',  label: 'Amount', type: 'amount', align: 'left', fit: true, render: () => `$${monthlyPrice.toFixed(2)} ${sub?.currency || 'USD'}` },
    { key: 'st',   label: 'Status', type: 'status', fit: true, render: () => <span style={S.paid}><span style={UI2.statusDot(TONES2.success)} />Paid</span> },
    { key: 'act',  label: 'Action', fit: true, render: () => (   // left-aligned like the confirmed Landlord tables' action column
      <button type="button" style={S.linkOff} disabled title="Invoice downloads aren't wired up yet">
        <i className="ti ti-download" style={S.btnIcon} aria-hidden="true" /> Download PDF
      </button>
    ) },
  ];

  return (
    <>
      {/* ── Row 1: plan banner │ action cards │ allocated capacity ── */}
      <Grid layout="leadThree">
        <div style={S.banner}>
          <CardWave opacity={OP2.muted} />   {/* light wave background (Occupancy Rate artwork) at OP2.muted 45% — a soft wash behind the details (user 2026-11-27) */}
          {sub ? (
            /* ── current plan: every v1 detail (tier · status · persona · dates · price + billing day · description ·
                  entitlement · next charge · billing-period progress · included / add-on services · actions) ── */
            <div style={{ ...UI2.stack(SP2.lg), position: 'relative' }}>
              <div style={S.planTop}>
                <div style={{ ...UI2.stack(SP2.sm), minWidth: 0 }}>
                  <span style={S.crown} aria-hidden="true"><i className="ti ti-crown" /></span>
                  <div style={S.planTags}>
                    <span style={S.bannerEyebrow}>Active tier</span>
                    <span style={S.planTag(TONES2.success)}><span style={S.planTagDot(TONES2.success)} /><span>{titleCase(sub.status || 'Active')}</span></span>
                    <span style={S.planTag(TONES2.primary)}><span style={S.planTagDot(TONES2.primary)} /><span>Independent PM</span></span>
                  </div>
                  <h2 style={S.bannerTitle}>{sub.plan_name}</h2>
                  {sub.created_at && (
                    <span style={S.planDates}>
                      <i className="ti ti-calendar-event" aria-hidden="true" />
                      Active {fmtDate(sub.created_at)}{sub.next_billing_date ? ` – ${fmtDate(sub.next_billing_date)}` : ' – ongoing'}
                    </span>
                  )}
                </div>
                <div style={S.planPriceCol}>
                  <div style={S.bannerPrice}>${monthlyPrice.toFixed(2)}</div>
                  <span style={S.bannerUnit}>
                    {sub.billing_cycle || 'Monthly'}{sub.next_billing_date ? ` (billed on the ${ordinalDay(new Date(sub.next_billing_date).getDate())})` : ''}
                  </span>
                </div>
              </div>

              {currentPlan?.long_description && <p style={S.curDesc}>{currentPlan.long_description}</p>}

              {/* entitlement · billing · next charge — the standard label ……… value details list (UI2.kvRow, = unit / lease
                  facts): no boxes, no icons, hairline between rows (user 2026-11-27: the two tinted tiles looked off) */}
              <div>
                {[
                  ['Entitlement', `${subIncludedCount} included · ${subAddonCount} add-on${subAddonCount === 1 ? '' : 's'}`],
                  ['Billing', `${sub.billing_cycle || 'monthly'} · ${sub.country}`],
                  ['Next charge scheduled', sub.next_billing_date ? fmtDate(sub.next_billing_date) : 'Not scheduled'],
                  ['Automatic charge', `$${monthlyPrice.toFixed(2)}`],
                ].map(([label, value], i) => (
                  <div key={label} style={UI2.kvRow(i === 0)}>
                    <span>{label}</span>
                    <span style={UI2.kvVal}>{value}</span>
                  </div>
                ))}
              </div>

              {progressPct !== null && (
                <div style={UI2.stack(SP2.xs)}>
                  <div style={S.planProgHead}>
                    <span style={UI2.capsLabel}>Billing period progress</span>
                    <span style={UI2.context}>{daysRemaining !== null ? `${daysRemaining} days remaining` : ''}</span>
                  </div>
                  <div style={S.progTrack}><div style={UI2.progressFill(progressPct, G2.primaryBar)} /></div>
                  <div style={S.progRow}>
                    <span>{fmtDate(periodStart)}</span>
                    <span>{fmtDate(sub.next_billing_date)}</span>
                  </div>
                </div>
              )}

              {(includedServices.length > 0 || addonsList.length > 0) && (
                <div style={S.planChips}>
                  {includedServices.map((sv, i) => (
                    <span key={`inc-${sv.id || sv.service_name}`} style={UI2.featureChip()}><i className="ti ti-check" style={UI2.featureChipIcon(i)} aria-hidden="true" />{sv.service_name}</span>
                  ))}
                  {addonsList.map((ad, i) => (
                    <span key={`add-${ad.id || ad.service_name}`} style={UI2.featureChip()}><i className="ti ti-plus" style={UI2.featureChipIcon(i + includedServices.length)} aria-hidden="true" />{ad.service_name} (add-on)</span>
                  ))}
                </div>
              )}

              <div style={S.planActs}>
                <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnXs }} onClick={toPlans}>Upgrade Plan</button>
                <button type="button" className="un2-btn" style={{ ...UI2.btn.light, ...UI2.btnXs }} onClick={toPlans}>Change Plan</button>   {/* white: sits on the blue wave (soft blue vanished there) */}
                <button type="button" style={S.planCancel} disabled title="Cancellation isn't wired up yet">
                  <i className="ti ti-x" style={UI2.btnXsIcon} aria-hidden="true" /> Cancel Subscription
                </button>
              </div>
            </div>
          ) : (
            /* ── no plan yet ── */
            <div style={{ ...UI2.stack(SP2.lg), position: 'relative' }}>
              <span style={S.crown} aria-hidden="true"><i className="ti ti-crown" /></span>
              <h2 style={S.bannerTitle}>Activate a Plan to Unlock More Value</h2>
              <p style={S.bannerText}>Subscribe to a plan to manage more properties, access premium services, and promote your listings.</p>
              <div style={S.planActs}>
                <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnXs }} onClick={toPlans}>
                  Browse Available Plans <i className="ti ti-arrow-right" style={UI2.btnXsIcon} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          {/* glass-cards artwork commented out for now (user 2026-11-27) — to restore: re-import CardsArt and add
              <span style={S.bannerArt}><CardsArt glass width="100%" /></span> */}
        </div>

        <div style={S.actions}>
          {/* Billing Breakdown — base plan · add-ons · total monthly (v1 rows) */}
          <div style={S.midCard}>
            <div style={S.midHead}>
              <h3 style={S.midTitle}>Billing Breakdown</h3>
              <span style={S.midIcon} aria-hidden="true"><i className="ti ti-receipt" /></span>
            </div>
            {sub ? (
              <>
                <div style={S.bbRow}>
                  <span style={S.bbLabel}><span style={UI2.text.rowTitleLg}>Base Plan</span><span style={UI2.text.meta}>{sub.plan_name}</span></span>
                  <span style={UI2.text.rowTitleLg}>${monthlyPrice.toFixed(2)}</span>
                </div>
                <div style={S.bbRow}>
                  <span style={S.bbLabel}><span style={UI2.text.rowTitleLg}>Add-ons</span><span style={UI2.text.meta}>{addonsList.length} active</span></span>
                  <span style={UI2.text.rowTitleLg}>${addonsTotal.toFixed(2)}</span>
                </div>
                {/* total + currency note = the card's footer, pinned to the bottom (no empty gap in a stretched card) */}
                <div style={S.bbFoot}>
                  <div style={S.bbTotal}>
                    <span style={S.bbTotalLbl}>Total Monthly</span>
                    <span style={T2.cardFigure}>${totalMonthlySpend.toFixed(2)}</span>
                  </div>
                  <span style={UI2.text.meta}>{sub.currency || 'USD'} · billed {sub.billing_cycle || 'monthly'}</span>
                </div>
              </>
            ) : (
              <span style={UI2.text.meta}>Subscribe to a plan to see your monthly billing breakdown here.</span>
            )}
          </div>

          {/* Expand Your Plan — CTA to the plan catalog */}
          <div style={S.midCard}>
            <span style={UI2.capsLabel}>Expand your plan</span>
            <h3 style={S.midTitle}>{capMax != null ? `Managing more than ${capMax} units?` : 'Growing your portfolio?'}</h3>
            <span style={UI2.text.meta}>Higher-tier plans widen your unit range and bundle more included services — browse the full catalog below.</span>
            <TextLink onClick={toPlans} style={S.midLink}>Explore Higher-Tier Plans</TextLink>
          </div>
        </div>

        {/* right column (= v1 split): Allocated Capacity + Listing Promotion, so both side columns hold two cards */}
        <div style={S.actions}>
          <div style={S.capCard}>
            <div style={S.capHead}>
              <h3 style={{ ...UI2.cardTitle, margin: 0 }}>Allocated Capacity</h3>
              <span style={S.capIcon} aria-hidden="true"><i className="ti ti-chart-donut" /></span>
            </div>
            <div style={S.capRow}>
              <ProgressRing value={capPct ?? 0} gradient={GSTOPS2.primary} track={C2.chipBlue} ariaLabel="Units used of plan capacity">
                <div style={S.ringVal}>{unitsUsed}{capMax != null ? ` / ${capMax}` : ''}</div>
              </ProgressRing>
              <div style={UI2.stack(SP2.xs)}>
                <span style={S.ringLabel}>Active Units Managed</span>
                <span style={UI2.text.meta}>
                  {remaining != null ? `${remaining} units remaining in your plan` : totalProperties > 0 ? 'No unit cap on current plan' : 'No properties yet'}
                </span>
              </div>
            </div>
            <div>
              {[
                ['ti-home', 'Properties Managed', totalProperties],
                ['ti-stack-2', 'Total Units', unitsUsed],
                ['ti-star', 'Services Active', subIncludedCount + subAddonCount],
              ].map(([icon, label, value], i) => (
                <div key={label} style={S.metric(i === 0)}>
                  <span style={S.metricKey}><i className={`ti ${icon}`} style={S.metricIcon} aria-hidden="true" />{label}</span>
                  <span style={UI2.kvVal}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Listing Promotion — standing plan summary (name · status · price paid · valid through) */}
          <div style={S.midCard}>
            <div style={S.midHead}>
              <h3 style={S.midTitle}>Listing Promotion</h3>
              <span style={S.midIcon} aria-hidden="true"><i className="ti ti-ad-2" /></span>
            </div>
            {activePromoSub ? (
              <>
                <div style={S.promoName}>
                  <span style={UI2.text.rowTitleLg}>{activePromoSub.plan_detail?.name || activePromoSub.plan_name || 'Plan'}</span>
                  <span style={UI2.statusPill(TONES2.success)}><span style={UI2.statusDot(TONES2.success)} />Active</span>
                </div>
                <div>
                  <div style={UI2.kvRow(true)}><span>Price Paid</span><span style={UI2.kvVal}>${Number(activePromoSub.price_paid || 0).toFixed(2)}</span></div>
                  {activePromoSub.expires_at && (
                    <div style={UI2.kvRow(false)}><span>Valid Through</span><span style={UI2.kvVal}>{fmtDate(activePromoSub.expires_at)}</span></div>
                  )}
                </div>
                <TextLink onClick={onOpenPromo} style={S.midLink}>Explore More Plans</TextLink>
              </>
            ) : (
              <>
                <span style={UI2.text.meta}>No standing Listing Promotion plan purchased yet — pre-buy one to skip paying again at your next listing's Step 3.</span>
                <TextLink onClick={onOpenPromo} style={S.midLink}>Explore Plans</TextLink>
              </>
            )}
          </div>
        </div>
      </Grid>

      {/* ── Available Plans ── */}
      <section ref={plansRef} style={S.section}>
        <div style={S.secHead}>
          <div>
            <h2 style={S.secTitle}>Available Plans</h2>
            <p style={S.secSub}>Choose the right plan for your portfolio. Upgrade anytime as you grow.</p>
          </div>
          <span style={T2.label}>{plans.length} plan(s) available for Independent PM</span>
        </div>
        {/* min width = the Services carousels' — 3 always fit the view (a 1.5× minimum clipped the 3rd card).
            Keep comments OUTSIDE <Carousel>: anything inside becomes a child slot (an empty first card). */}
        <Carousel label="plans" itemWidth={Carousel.cols(3)} minItemWidth={SZ2.thumbFeature.w}>
            {plans.map((p, idx) => {
              const isCurrent = sub && sub.plan === p.id;
              const inCart = cartItems.some(i => i.id === `plan-${p.id}`);
              const monthly = Number(p.monthly_price) || 0;
              const custom = !monthly;
              const annual = p.annual_price != null ? Number(p.annual_price) : null;
              const unitLabel = p.unit_limit_max != null ? `${p.unit_limit_min}–${p.unit_limit_max} units` : `${p.unit_limit_min}+ units`;
              const photo = planPhotoFor(p, custom);
              return (
                <PhotoCard
                  key={p.id}
                  image={p.image_url || photo.src}
                  imageStyle={p.image_url ? undefined : { objectPosition: photo.pos }}
                  tags={custom
                    ? <span style={UI2.photoTagGlass}><i className="ti ti-crown" aria-hidden="true" />&nbsp;Custom</span>
                    : <span style={UI2.photoTagGlass}>{isCurrent ? '✓ Current' : 'Active'}</span>}
                  title={p.name}
                  description={p.short_description}
                  descLines={2}
                  footAlign="center"
                  foot={(
                    <div style={S.planInfo}>
                      <span style={S.planIcon} aria-hidden="true"><i className="ti ti-building" /></span>
                      <div style={S.planText}>
                        {custom ? (
                          <span style={T2.cardFigure}>Custom Pricing</span>
                        ) : (
                          <div style={S.planPrice}>
                            <span style={T2.cardFigure}>${monthly.toLocaleString()}</span>
                            <span style={UI2.text.label}>/ mo</span>
                          </div>
                        )}
                        <span style={S.planCap} title={unitLabel + (!custom && annual !== null ? ` · ($${annual.toLocaleString()} / yr)` : '')}>
                          {unitLabel}{!custom && annual !== null ? ` · ($${annual.toLocaleString()} / yr)` : ''}
                        </span>
                      </div>
                    </div>
                  )}
                  action={custom ? (
                    <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnXs, flexShrink: 0, ...S.planOff }} disabled title="Contact Sales isn't wired up yet">
                      Contact Sales
                    </button>
                  ) : (
                    <button type="button" className="un2-btn" style={{ ...(inCart ? UI2.btn.brand : UI2.btn.soft), ...UI2.btnXs, flexShrink: 0, ...(isCurrent ? S.planOff : {}) }}
                      disabled={isCurrent} onClick={() => onSubscribe(p)}
                      title={isCurrent ? 'This is your current plan' : inCart ? 'In your cart — open the cart to review and confirm' : undefined}>
                      {isCurrent ? 'Current Plan' : inCart ? '✓ In Cart — Review' : 'Subscribe'}
                    </button>
                  )}
                />
              );
            })}
        </Carousel>
      </section>

      {/* ── Payment Methods & Details ── */}
      <section style={S.card}>
        <div style={S.secHead}>
          <div>
            <h2 style={S.secTitle}>Payment Methods &amp; Details</h2>
            <p style={S.secSub}>Primary settlement instruments, commercial billing entity identification, and linked settlement accounts.</p>
          </div>
          <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...S.off }} disabled title="Payment gateway not yet integrated">
            <i className="ti ti-plus" style={S.btnIcon} aria-hidden="true" /> Add New Card
          </button>
        </div>

        <div className="un2-cols" style={{ '--un2-cols': 3 }}>
          {/* active payment instrument */}
          <div style={S.col}>
            <div style={S.colLabel}>
              <span style={S.colTitle}>Active Payment Instrument</span>
              <span style={S.defPill}><span style={UI2.statusDot(TONES2.primary)} />Default</span>
            </div>
            <div style={S.ccard}>
              <NavyGlow />
              <div style={S.ccIn}>
                <div style={S.ccTop}>
                  <span style={S.ccChipRow}><CardChip /><Contactless /></span>
                  <span style={S.ccBrand}><MastercardMark /><span style={S.ccBrandName}>Mastercard</span></span>
                </div>
                <div style={S.ccNumber}>
                  <span style={S.ccDots}>••••</span><span style={S.ccDots}>••••</span><span style={S.ccDots}>••••</span>
                  <span style={S.ccLast4}>4242</span>
                </div>
                <div style={S.ccMeta}>
                  <div style={UI2.minWidth0}><div style={S.ccLabel}>Card holder</div><div style={S.ccValue}>{userLabel.toUpperCase()}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={S.ccLabel}>Expires</div><div style={S.ccValue}>08/28</div></div>
                </div>
              </div>
            </div>
            <div style={S.autoRow}>
              <span style={S.autoText}><i className="ti ti-calendar-repeat" aria-hidden="true" /> Auto-debit enabled for scheduled billings.</span>
              <Switch on disabled label="Auto-debit (payment gateway not yet integrated)" />
            </div>
            <div style={S.cardActs}>
              <button type="button" style={S.linkOff} disabled title="Payment gateway not yet integrated">
                <i className="ti ti-refresh" style={S.btnIcon} aria-hidden="true" /> Change Default
              </button>
              <button type="button" style={S.muteBtn} disabled title="Payment gateway not yet integrated">
                <i className="ti ti-trash" style={S.btnIcon} aria-hidden="true" /> Remove Card
              </button>
            </div>
          </div>

          {/* commercial entity info */}
          <div style={S.col}>
            <div style={S.colLabel}>
              <span style={S.colTitle}>Commercial Entity Info</span>
              <button type="button" style={S.editOff} disabled title="Billing entity management isn't wired up yet">
                <i className="ti ti-pencil" style={S.btnIcon} aria-hidden="true" /> Edit Billing Info
              </button>
            </div>
            <div style={S.detList}>
              <div className="un2-row-divided" style={S.detRow(true)}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-building" /></span>
                <div style={S.detBody}>
                  <span style={UI2.capsLabel}>Billing entity</span>
                  <span style={{ ...UI2.text.rowTitleLg }}>{userLabel !== 'Independent PM Account' ? `${userLabel} — Independent PM` : 'Independent PM Account'}</span>
                  <span style={S.detSub}>45 Spring Borough Ct<br />O'Fallon, Missouri, 63368, US</span>
                </div>
              </div>
              <div className="un2-row-divided" style={S.detRow(false)}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-id" /></span>
                <div style={S.detBody}>
                  <span style={UI2.capsLabel}>Federal Tax ID / EIN</span>
                  <span style={S.detValue}>US-EIN-98-7654321</span>
                </div>
              </div>
              <div className="un2-row-divided" style={S.detRow(false)}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-mail" /></span>
                <div style={S.detBody}>
                  <span style={UI2.capsLabel}>Invoicing Email</span>
                  <span style={S.detValue} title={email || 'billing@independentpm.com'}>{email || 'billing@independentpm.com'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* linked bank accounts (real) */}
          <div style={S.col}>
            <div style={S.colLabel}><span style={S.colTitle}>Linked Bank Accounts</span></div>
            <div style={S.detList}>
              <div className="un2-row-divided" style={S.detRow(true)}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-building-bank" /></span>
                <div style={S.detBody}>
                  <span style={UI2.capsLabel}>Payout account</span>
                  {banks === null ? <div style={UI2.skeleton('100%', SZ2.icon.md)} className="un2-skel" />
                    : defaultBank ? (
                      <>
                        <span style={S.detValue}>{defaultBank.bank_name}</span>
                        <span style={S.detSub}>•••• {defaultBank.account_last4 || '····'} · {defaultBank.currency || 'USD'}{defaultBank.is_default ? ' · Default' : ''}</span>
                      </>
                    ) : (
                      <>
                        <span style={S.detValue}>No bank account yet</span>
                        <span style={S.detSub}>Add a payout account on the Bank Accounts tab.</span>
                      </>
                    )}
                </div>
              </div>
              <div className="un2-row-divided" style={S.detRow(false)}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-list" /></span>
                <div style={S.detBody}>
                  <span style={UI2.capsLabel}>Total Linked Accounts</span>
                  <span style={S.detValue}>{banks ? banks.length : '—'}</span>
                </div>
              </div>
            </div>
            <div style={S.bankFoot}>
              <span>Used for rent &amp; service payouts</span>
              <TextLink onClick={() => navigate('/pm-portal/account/bank-accounts')}>Manage</TextLink>
            </div>
          </div>
        </div>

        {/* tax-exemption note — commented out for now (user 2026-11-27); uncomment to restore
        <div style={S.note}>
          <i className="ti ti-shield-check" aria-hidden="true" /> Entity registered for tax exemption under NY State Commercial Realty Statute.
        </div> */}
      </section>

      {/* ── Billing History & Invoices ── */}
      <section style={S.card}>
        <div style={S.secHead}>
          <div>
            <h2 style={S.secTitle}>Billing History &amp; Invoices</h2>
            <p style={S.secSub}>Historical statements, reconciliation vouchers, and official tax receipts.</p>
          </div>
          <div style={S.tools}>
            <label style={S.search} title="Invoice search isn't wired up yet">
              <i className="ti ti-search" style={S.searchIcon} aria-hidden="true" />
              <input style={S.input} type="search" placeholder="Search by invoice ID…" disabled aria-label="Search invoices" />
            </label>
            <button type="button" style={S.yearBtn} disabled title="Invoice filtering isn't wired up yet">
              2026 <i className="ti ti-chevron-down" style={S.btnIcon} aria-hidden="true" />
            </button>
            {/* Export sits in the header toolbar row, after search · year (user 2026-11-27) */}
            <button type="button" className="un2-btn" style={S.softOff} disabled title="Invoice export isn't wired up yet">
              <i className="ti ti-download" style={S.btnIcon} aria-hidden="true" /> Export CSV
            </button>
          </div>
        </div>
        <DataTable columns={invoiceColumns} rows={SAMPLE_INVOICES} rowKey={r => r.inv} />
        <div style={S.foot}>
          <span>Showing {SAMPLE_INVOICES.length} of {SAMPLE_INVOICES.length} generated receipts for current fiscal period</span>
          <div style={S.pager}>
            <button type="button" style={S.pageBtn} disabled aria-label="Previous page"><i className="ti ti-chevron-left" aria-hidden="true" /></button>
            <span style={S.pageOn} aria-current="page">1</span>
            <button type="button" style={S.pageBtn} disabled aria-label="Next page"><i className="ti ti-chevron-right" aria-hidden="true" /></button>
          </div>
        </div>
      </section>
    </>
  );
}
