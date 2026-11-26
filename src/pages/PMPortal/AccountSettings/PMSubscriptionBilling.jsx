// PMSubscriptionBilling.jsx — PM Portal: Account Settings → Subscription & Billing tab BODY (Design System v2)
// Layout: Downloads/image 181.png. Rendered by PMSubscriptionPage (which owns all data, the cart and the
// promotion modal) inside its PMPageShell frame — this file is presentation only:
//
//   <Grid leadThree>  plan banner (navy, G2.darkCard)  │  3 action cards  │  Allocated Capacity (ProgressRing)
//   Available Plans — header · carousel of plan cards (navy head · unit pill · price · Subscribe)
//   Payment Methods & Details card — 3 divided columns (card visual │ entity info │ linked bank accounts) + note
//   Billing History & Invoices card — toolbar · DataTable · count + pager
//
// Card number / EIN / entity address / invoices are SAMPLE data (no payment gateway or invoice endpoint exists —
// same as the v1 page); every action without a backend is disabled with a tooltip saying why.
// Linked Bank Accounts reads the PM's real accounts (GET /api/pm/bank-accounts/).

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid } from '../../../components/layout';
import { DataTable, CardsArt, NavyGlow, LayersArt, ProgressRing, Switch, TextLink, Carousel } from '../../../components/ui';
import { C2, G2, GSTOPS2, TONES2, ACCENT2, SH2, FS2, FW2, LH2, LS2, R2, SP2, SZ2, T2, UI2, pad } from '../../../constants';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const SAMPLE_INVOICES = [
  { inv: 'INV-2026-009', date: 'Sep 30, 2026' },
  { inv: 'INV-2026-008', date: 'Aug 31, 2026' },
  { inv: 'INV-2026-007', date: 'Jul 31, 2026' },
  { inv: 'INV-2026-006', date: 'Jun 30, 2026' },
];

const ON = C2.onDark;
const S = {
  // ── row 1: plan banner ──
  banner:     { ...UI2.darkCard, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' },
  // grid areas:  head (crown · title) │ art   /   foot (paragraph · button) across both columns
  bannerGrid: { position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gridTemplateAreas: '"head art" "foot foot"', columnGap: SP2.lg, rowGap: SP2.lg, alignItems: 'center' },
  bannerHead: { ...UI2.stack(SP2.md), gridArea: 'head', minWidth: 0 },
  bannerArt:  { gridArea: 'art', width: SZ2.cardsArtSm, pointerEvents: 'none' },
  bannerFoot: { ...UI2.stack(SP2.lg), gridArea: 'foot', minWidth: 0 },
  crown:      { ...UI2.iconBox(SZ2.icon.lg, { soft: ON.surface, fg: C2.white }, { round: true }), fontSize: FS2.xl },
  bannerEyebrow: { ...T2.eyebrow, color: ON.textMuted },
  bannerTitle:{ ...T2.heroTitle, fontSize: FS2.xxl, margin: 0 },
  bannerText: { ...T2.body, color: ON.textSoft, margin: 0 },
  bannerPrice:{ ...T2.figureMd, color: C2.white },
  bannerUnit: { fontSize: FS2.base, color: ON.textMuted, fontWeight: FW2.regular },
  bannerActs: { ...UI2.row(SP2.sm), flexWrap: 'wrap', position: 'relative' },
  progTrack:  { ...UI2.progressTrack, background: ON.surface },
  progRow:    { ...UI2.rowBetween(SP2.sm), fontSize: FS2.xs, color: ON.textMuted },
  // ── row 1: action cards ──
  actions:    UI2.stack(SP2.md),
  actCard:    { ...UI2.card, ...UI2.row(SP2.md), flex: 1, border: 'none', cursor: 'pointer', textAlign: 'left', padding: pad(SP2.lg, SP2.lg) },
  actIcon:    UI2.iconBox(SZ2.icon.lg, TONES2.primary, { round: true }),
  actText:    { ...UI2.stack(SP2.xxs), flex: 1, minWidth: 0 },
  actTitle:   UI2.text.titleLg,
  actSub:     { ...UI2.text.meta, ...UI2.clamp(2) },
  // ── row 1: capacity ──
  capCard:    { ...UI2.card, ...UI2.stack(SP2.lg) },
  capHead:    UI2.rowBetween(SP2.sm),
  capIcon:    UI2.iconBox(SZ2.icon.sm, TONES2.primary, { round: true }),
  capRow:     { ...UI2.row(SP2.lg), alignItems: 'center' },
  ringVal:    { ...T2.statValue, fontWeight: FW2.semibold, color: C2.navyDeep },
  ringLabel:  { ...UI2.text.titleLg },
  metric:     (first) => ({ ...UI2.kvRow(first), alignItems: 'center' }),
  metricKey:  UI2.row(SP2.sm),
  metricIcon: { fontSize: FS2.lg, color: C2.primary },
  // ── section headers ──
  secHead:    { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', alignItems: 'flex-end' },
  secTitle:   { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  secSub:     { ...T2.label, margin: `${SP2.xs}px 0 0` },
  section:    UI2.stack(SP2.lg),
  // ── plans carousel ──
  plan:       { ...UI2.card, padding: 0, overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column' },   // width comes from the Carousel slot
  // plan-card head (design: navy glow + waves · small green "Active" pill · bold sans name · glassy layers mark)
  planHead:   { position: 'relative', overflow: 'hidden', padding: pad(SP2.md, SP2.lg), display: 'flex', alignItems: 'center', gap: SP2.md },   // compact: content height only
  planHeadIn: { position: 'relative', flex: 1, minWidth: 0, ...UI2.stack(SP2.xs) },
  planDeco:   { position: 'relative', alignSelf: 'center', flexShrink: 0 },
  planPill:   { ...UI2.pill(TONES2.success), alignSelf: 'flex-start' },
  planCrown:  { ...UI2.iconBox(SZ2.icon.md, { soft: ON.surface, fg: C2.white }), alignSelf: 'flex-start', fontSize: FS2.lg },
  planName:   { ...T2.sectionTitle, color: C2.white, margin: 0, ...UI2.truncate },   // standard v2 section title — Playfair 16 semibold
  planBody:   { ...UI2.stack(SP2.sm), padding: pad(SP2.lg), flex: 1 },
  unitPill:   { ...UI2.pill(TONES2.primary), alignSelf: 'flex-start' },
  price:      T2.kpiValue,                                 // standard v2 figure — Inter 20 / 400, navy
  priceUnit:  { fontSize: FS2.base, fontWeight: FW2.regular, color: C2.textSecondary },
  annual:     T2.label,
  planDesc:   { ...T2.label, margin: 0, ...UI2.clamp(2) },     // standard v2 small text — 12px grey (T2.label)
  planBtn:    (kind) => ({ ...(kind === 'brand' ? UI2.btn.brand : UI2.btn.soft), width: '100%', justifyContent: 'center', marginTop: 'auto' }),
  // ── payment methods ──
  card:       { ...UI2.card, ...UI2.stack(SP2.xl) },
  colLabel:   { ...UI2.rowBetween(SP2.sm), minHeight: SZ2.control.sm },
  colTitle:   UI2.text.title,
  col:        { ...UI2.stack(SP2.md), minWidth: 0 },
  defPill:    { ...UI2.pill(TONES2.success), gap: SP2.xs },
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
  muteBtn:    { ...UI2.btn.link, color: C2.textSecondary, ...UI2.btnOff },
  linkOff:    { ...UI2.btn.link, ...UI2.btnOff },
  inset:      { ...UI2.inset, ...UI2.stack(SP2.md) },
  infoRow:    { ...UI2.row(SP2.md), alignItems: 'flex-start' },
  infoIcon:   UI2.iconBox(SZ2.icon.md, TONES2.primary, { round: true }),
  infoName:   UI2.text.title,
  infoText:   { ...T2.label, lineHeight: LH2.body },
  infoCaps:   UI2.capsLabel,
  infoValue:  { ...UI2.text.title, ...UI2.truncate },
  divider:    UI2.divider,
  bankFoot:   { ...UI2.rowBetween(SP2.sm), ...T2.caption },
  note:       { ...UI2.tintRow, background: TONES2.success.tint, color: TONES2.success.fg, ...T2.label },
  // ── billing history ──
  tools:      { ...UI2.row(SP2.sm), flexWrap: 'wrap' },
  search:     { ...UI2.toolbar.search, ...UI2.btnOff },
  searchIcon: UI2.toolbar.searchIcon,
  input:      UI2.searchInput,
  yearBtn:    { ...UI2.toolbar.button, ...UI2.btnOff },
  softOff:    { ...UI2.btn.soft, ...UI2.btnOff, alignSelf: 'flex-start' },
  paid:       UI2.statusPill(TONES2.success),
  foot:       { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', ...T2.caption },
  pager:      UI2.row(SP2.xs),
  pageBtn:    { ...UI2.btn.iconOutline(SZ2.control.md), ...UI2.btnOff },
  pageOn:     { ...UI2.btn.brand, width: SZ2.control.md, minHeight: SZ2.control.md, padding: 0, justifyContent: 'center', cursor: 'default' },
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
  plans, sub, monthlyPrice, addonsList, addonsTotal, totalMonthlySpend, progressPct, daysRemaining, periodStart,
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
    { key: 'amt',  label: 'Amount', type: 'amount', fit: true, render: () => `$${monthlyPrice.toFixed(2)} ${sub?.currency || 'USD'}` },
    { key: 'st',   label: 'Status', fit: true, render: () => <span style={S.paid}><span style={UI2.statusDot(TONES2.success)} />Paid</span> },
    { key: 'act',  label: 'Action', fit: true, align: 'right', render: () => (
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
          <NavyGlow />
          {/* design layout: crown + title on the left with the glass cards beside them (art centred on that pair),
              paragraph / progress + button underneath at full width — a grid, so nothing can overlap */}
          <div style={S.bannerGrid}>
            <div style={S.bannerHead}>
              <span style={S.crown} aria-hidden="true"><i className="ti ti-crown" /></span>
              {sub && <span style={S.bannerEyebrow}>Current plan · {sub.status || 'Active'}</span>}
              <h2 style={S.bannerTitle}>{sub ? sub.plan_name : 'Activate a Plan to Unlock More Value'}</h2>
              {sub && <div style={S.bannerPrice}>${monthlyPrice.toFixed(2)} <span style={S.bannerUnit}>/ {(sub.billing_cycle || 'month').toLowerCase()}</span></div>}
            </div>
            <span style={S.bannerArt}><CardsArt glass width="100%" /></span>
            <div style={S.bannerFoot}>
              {sub ? (progressPct !== null && (
                <div style={UI2.stack(SP2.xs)}>
                  <div style={S.progTrack}><div style={UI2.progressFill(progressPct, G2.primaryBar)} /></div>
                  <div style={S.progRow}>
                    <span>{fmtDate(periodStart)} – {fmtDate(sub.next_billing_date)}</span>
                    <span>{daysRemaining} days remaining</span>
                  </div>
                </div>
              )) : (
                <p style={S.bannerText}>Subscribe to a plan to manage more properties, access premium services, and promote your listings.</p>
              )}
              <div style={S.bannerActs}>
                <button type="button" className="un2-btn" style={UI2.btn.light} onClick={toPlans}>
                  {sub ? 'Change Plan' : 'Browse Available Plans'} <i className="ti ti-arrow-right" style={S.btnIcon} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={S.actions}>
          <button type="button" className="un2-raise" style={S.actCard} onClick={toPlans}>
            <span style={S.actIcon} aria-hidden="true"><i className="ti ti-file-invoice" /></span>
            <span style={S.actText}>
              <span style={S.actTitle}>Billing Breakdown</span>
              <span style={S.actSub}>
                {sub
                  ? `Base $${monthlyPrice.toFixed(2)} + ${addonsList.length} add-on${addonsList.length === 1 ? '' : 's'} $${addonsTotal.toFixed(2)} = $${totalMonthlySpend.toFixed(2)} / month`
                  : 'Subscribe to a plan to see your monthly billing breakdown here.'}
              </span>
            </span>
            <i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />
          </button>
          <button type="button" className="un2-raise" style={S.actCard} onClick={toPlans}>
            <span style={S.actIcon} aria-hidden="true"><i className="ti ti-bolt" /></span>
            <span style={S.actText}>
              <span style={S.actTitle}>Explore Higher-Tier Plans</span>
              <span style={S.actSub}>{capMax != null ? `Managing more than ${capMax} units? Grow with a bigger plan.` : 'Grow your portfolio with more units and advanced features.'}</span>
            </span>
            <i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />
          </button>
          <button type="button" className="un2-raise" style={S.actCard} onClick={onOpenPromo}>
            <span style={S.actIcon} aria-hidden="true"><i className="ti ti-speakerphone" /></span>
            <span style={S.actText}>
              <span style={S.actTitle}>Listing Promotion</span>
              <span style={S.actSub}>
                {activePromoSub
                  ? `${activePromoSub.plan_detail?.name || activePromoSub.plan_name || 'Plan'} active${activePromoSub.expires_at ? ` · until ${fmtDate(activePromoSub.expires_at)}` : ''}`
                  : 'No standing Listing Promotion plan purchased yet.'}
              </span>
            </span>
            <i className="ti ti-chevron-right" style={UI2.chevron} aria-hidden="true" />
          </button>
        </div>

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
        <Carousel label="plans" itemWidth={Carousel.cols(4)} minItemWidth={SZ2.thumbFeature.w}>
            {plans.map((p, idx) => {
              const isCurrent = sub && sub.plan === p.id;
              const inCart = cartItems.some(i => i.id === `plan-${p.id}`);
              const monthly = Number(p.monthly_price) || 0;
              const custom = !monthly;
              const annual = p.annual_price != null ? Number(p.annual_price) : null;
              const unitLabel = p.unit_limit_max != null ? `${p.unit_limit_min}–${p.unit_limit_max} units` : `${p.unit_limit_min}+ units`;
              return (
                <article key={p.id} style={S.plan}>
                  <div style={S.planHead}>
                    <NavyGlow variant={idx % 4} />   {/* each card its own pattern (cycles 4 variants) */}
                    <div style={S.planHeadIn}>
                      {custom
                        ? <span style={S.planCrown} aria-hidden="true"><i className="ti ti-crown" /></span>
                        : <span style={S.planPill}>{isCurrent ? 'Current' : 'Active'}</span>}
                      <h3 style={S.planName}>{p.name}</h3>
                    </div>
                    {!custom && <span style={S.planDeco}><LayersArt width={SZ2.icon.lg} /></span>}
                  </div>
                  <div style={S.planBody}>
                    <span style={S.unitPill}>{unitLabel}</span>
                    {custom ? (
                      <div style={S.price}>Custom Pricing</div>
                    ) : (
                      <>
                        <div style={S.price}>${monthly.toLocaleString()} <span style={S.priceUnit}>/ mo</span></div>
                        {annual !== null && <div style={S.annual}>(${annual.toLocaleString()} / yr)</div>}
                      </>
                    )}
                    <p style={S.planDesc}>{p.short_description}</p>
                    {custom ? (
                      <button type="button" className="un2-btn" style={{ ...S.planBtn('brand'), ...UI2.btnOff }} disabled title="Contact Sales isn't wired up yet">
                        Contact Sales
                      </button>
                    ) : (
                      <button type="button" className="un2-btn" style={{ ...S.planBtn(inCart ? 'brand' : 'soft'), ...(isCurrent ? UI2.btnOff : {}) }}
                        disabled={isCurrent} onClick={() => onSubscribe(p)}
                        title={inCart ? 'In your cart — open the cart to review and confirm' : undefined}>
                        {isCurrent ? 'Current Plan' : inCart ? '✓ In Cart — Review' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                </article>
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
          <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...UI2.btnOff }} disabled title="Payment gateway not yet integrated">
            <i className="ti ti-plus" style={S.btnIcon} aria-hidden="true" /> Add New Card
          </button>
        </div>

        <div className="un2-cols" style={{ '--un2-cols': 3 }}>
          {/* active payment instrument */}
          <div style={S.col}>
            <div style={S.colLabel}>
              <span style={S.colTitle}>Active Payment Instrument</span>
              <span style={S.defPill}><i className="ti ti-circle-check-filled" aria-hidden="true" />Default</span>
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
              <button type="button" style={S.linkOff} disabled title="Billing entity management isn't wired up yet">
                <i className="ti ti-pencil" style={S.btnIcon} aria-hidden="true" /> Edit Billing Info
              </button>
            </div>
            <div style={S.inset}>
              <div style={S.infoRow}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-building" /></span>
                <div style={UI2.minWidth0}>
                  <div style={S.infoName}>{userLabel !== 'Independent PM Account' ? `${userLabel} — Independent PM` : 'Independent PM Account'}</div>
                  <div style={S.infoText}>45 Spring Borough Ct<br />O'Fallon, Missouri, 63368<br />US</div>
                </div>
              </div>
              <hr style={S.divider} />
              <div style={S.infoRow}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-id" /></span>
                <div style={UI2.minWidth0}><div style={S.infoCaps}>Federal Tax ID / EIN</div><div style={S.infoValue}>US-EIN-98-7654321</div></div>
              </div>
              <hr style={S.divider} />
              <div style={S.infoRow}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-mail" /></span>
                <div style={UI2.minWidth0}><div style={S.infoCaps}>Invoicing Email</div><div style={S.infoValue}>{email || 'billing@independentpm.com'}</div></div>
              </div>
            </div>
          </div>

          {/* linked bank accounts (real) */}
          <div style={S.col}>
            <div style={S.colLabel}><span style={S.colTitle}>Linked Bank Accounts</span></div>
            <div style={S.inset}>
              <div style={S.infoRow}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-building-bank" /></span>
                <div style={UI2.minWidth0}>
                  {banks === null ? <div style={UI2.skeleton('100%', SZ2.icon.md)} className="un2-skel" />
                    : defaultBank ? (
                      <>
                        <div style={S.infoName}>{defaultBank.bank_name}</div>
                        <div style={S.infoText}>•••• {defaultBank.account_last4 || '····'} · {defaultBank.currency || 'USD'}{defaultBank.is_default ? ' · Default' : ''}</div>
                      </>
                    ) : (
                      <>
                        <div style={S.infoName}>No bank account yet</div>
                        <div style={S.infoText}>Add a payout account on the Bank Accounts tab.</div>
                      </>
                    )}
                </div>
              </div>
              <hr style={S.divider} />
              <div style={S.infoRow}>
                <span style={S.infoIcon} aria-hidden="true"><i className="ti ti-list" /></span>
                <div><div style={S.infoCaps}>Total Linked Accounts</div><div style={S.infoValue}>{banks ? banks.length : '—'}</div></div>
              </div>
            </div>
            <div style={S.bankFoot}>
              <span>Used for rent &amp; service payouts</span>
              <TextLink onClick={() => navigate('/pm-portal/account/bank-accounts')}>Manage</TextLink>
            </div>
          </div>
        </div>

        <div style={S.note}>
          <i className="ti ti-shield-check" aria-hidden="true" /> Entity registered for tax exemption under NY State Commercial Realty Statute.
        </div>
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
          </div>
        </div>
        <button type="button" className="un2-btn" style={S.softOff} disabled title="Invoice export isn't wired up yet">
          <i className="ti ti-download" style={S.btnIcon} aria-hidden="true" /> Export CSV
        </button>
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
