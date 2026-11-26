// PMTransactionsTab.jsx — PM Portal: Account Settings → Transactions (Design System v2)
// Route: /pm-portal/account/transactions · Layout: Downloads/image 186.png
//
// Same page rhythm as PM Approvals (the reference):
//   header block (UI2.pageHead) — title · subtitle → AccountSettingsTabs → intro │ Scope → HeroStats
//   page section (UI2.pageSection) — "Billing Activity" heading → toolbar row, left-aligned (search · service · date range · Export CSV)
//     <Grid mainSide>  table panel (DataTable · pager)  │  selected charge card (details · line items · total · actions)
//   PageFooter
//
// Every look comes from v2 tokens / components (HeroStats · FilterMenu + filterTrigger · DataTable · UI2.pager ·
// icon · caps label · value detail rows / UI2.subhead / cardFoot) — only page layout lives here.
//
// Data: no payment-ledger model or PM-facing invoice endpoint exists yet (UNInvoice in core/models.py has no
// PM route), so every row is SAMPLE content — same as the v1 page and Landlord's own Transactions tab. Search,
// both filters, row selection and the CSV export are genuinely wired against that sample array; the PDF receipt
// and print actions stay disabled with a tooltip saying why.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PMPageShell, Breadcrumb, PageFooter, ImageBackdrop, Grid } from '../../../components/layout';
import { HeroStats, DataTable, EmptyState, FilterMenu, filterTrigger, ActionTray, TextLink } from '../../../components/ui';
import { C2, TONES2, ACCENT2, accentTone, FS2, SP2, SZ2, T2, UI2 } from '../../../constants';
import AccountSettingsTabs from './AccountSettingsTabs';
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';

const SERVICE_OPTIONS = [
  { value: 'PMS', label: 'PMS', icon: 'ti-stack-2' },
  { value: 'Screening', label: 'Screening', icon: 'ti-user-search' },
  { value: 'Marketplace', label: 'Marketplace', icon: 'ti-building-store' },
];
const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];
const RANGE_DAYS = { '7': 7, '30': 30, '90': 90, all: Infinity };
const SCOPE_OPTIONS = [{ value: 'platform', label: 'UrbanNest Platform Billing Only', icon: 'ti-file-text' }];

// Sample billing ledger — PM charges (subscription, screening, marketplace / promotion)
const TRANSACTIONS = [
  { id: 'INV-2041', date: '2026-10-04', dateLabel: 'Oct 04', label: 'Subscription Payment', title: 'Monthly Subscription', desc: 'Monthly Subscription - Starter Tier', service: 'PMS', amount: 302.00, status: 'Paid',
    paymentMethod: 'Visa ending 7731', timestamp: 'Oct 04, 2026, 08:50 AM EST', billingType: 'Direct UrbanNest Debit',
    lineItems: [{ label: 'Base Monthly PMS Tier', value: 302.00 }, { label: 'Tax', value: 0 }], total: 302.00 },
  { id: 'TXN-9910', date: '2026-10-01', dateLabel: 'Oct 01', label: 'Tenant Screening', title: 'Tenant Screening', desc: 'Tenant Screening - Applicant #412 (J. Alvarez)', service: 'Screening', amount: 35.00, status: 'Paid',
    paymentMethod: 'Visa ending 7731', timestamp: 'Oct 01, 2026, 03:15 PM EST', billingType: 'Card Charge — One-Time',
    lineItems: [{ label: 'Background & Credit Check', value: 35.00 }, { label: 'Tax', value: 0 }], total: 35.00 },
  { id: 'TXN-9887', date: '2026-09-27', dateLabel: 'Sep 27', label: 'Featured Listing', title: 'Featured Listing', desc: 'Featured Listing - Idex3 Unit A1', service: 'Marketplace', amount: 15.00, status: 'Paid',
    paymentMethod: 'Visa ending 7731', timestamp: 'Sep 27, 2026, 10:05 AM EST', billingType: 'Card Charge — One-Time',
    lineItems: [{ label: '7-Day Featured Placement', value: 15.00 }, { label: 'Tax', value: 0 }], total: 15.00 },
  { id: 'RF-205', date: '2026-09-24', dateLabel: 'Sep 24', label: 'Refund', title: 'Refund', desc: 'Refund - Promotion Cancellation (Idex3 Unit A1)', service: 'Marketplace', amount: -15.00, status: 'Refunded',
    paymentMethod: 'Visa ending 7731', timestamp: 'Sep 24, 2026, 01:40 PM EST', billingType: 'Refund to Original Payment Method',
    lineItems: [{ label: '7-Day Featured Placement (Refunded)', value: -15.00 }, { label: 'Tax', value: 0 }], total: -15.00 },
];
const ANCHOR_DATE = new Date(TRANSACTIONS[0].date);

// status → tone (table status = dot + coloured word; detail eyebrow uses the same tone)
const STATUS_TONE = { Paid: TONES2.success, Refunded: accentTone(ACCENT2.violet) };
const money = v => `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`;

// ── Page-specific layout only (every look comes from v2 tokens / components) ──
const S = {
  headBlock: UI2.pageHead.block,
  head:      { ...UI2.rowBetween(SP2.lg), alignItems: 'flex-start', flexWrap: 'wrap' },   // = Subscription / Services header
  title:     { ...T2.heroHeading, margin: 0 },
  sub:       { ...T2.lead, margin: `${SP2.xs}px 0 0` },
  tabs:      UI2.pageHead.next,    // tabs, SP2.xl under the subtitle (= Approvals)
  intro:     { ...UI2.pageHead.next, ...UI2.rowBetween(SP2.md), flexWrap: 'wrap' },   // intro │ scope, SP2.xl under the tabs
  introText: { ...T2.body, color: C2.textSecondary, margin: 0 },
  stats:     UI2.pageHead.stats,   // stats row, SP2.xxl under the row above (= Approvals)
  // table section — heading │ toolbar, then the panels (= Approvals "All Pending Approvals")
  section:   UI2.pageSection,
  secTitle:  { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  secSub:    { ...T2.label, margin: `${SP2.xs}px 0 0` },
  tools:     { ...UI2.toolbar.tools, marginLeft: 0, justifyContent: 'flex-start' },   // own row under the heading, left-aligned (design)
  search:    UI2.toolbar.search,
  searchIcon:UI2.toolbar.searchIcon,
  input:     UI2.searchInput,
  menuWrap:  UI2.toolbar.menuWrap,
  toolBtn:   UI2.toolbar.button,
  softBtn:   UI2.btn.soft,
  btnIcon:   UI2.btnIcon,
  // table panel
  panel:     { ...UI2.card, ...UI2.stack(SP2.lg), minWidth: 0, paddingLeft: SP2.sm, paddingRight: SP2.sm },   // this page only: slimmer sides so the 7-column table fits without sideways scroll
  // selected charge card
  detail:    { ...UI2.card, ...UI2.stack(SP2.xl), alignSelf: 'start', minWidth: 0 },   // a little more air between the card's blocks (narrow column)
  detTop:    { ...UI2.rowBetween(SP2.md), alignItems: 'flex-start' },
  detHead:   { ...UI2.stack(SP2.xs), minWidth: 0 },
  detEyebrow:(tone) => ({ ...T2.eyebrow, ...UI2.row(SP2.xs), color: tone.fg }),
  detEyeIcon:{ fontSize: FS2.md },
  detTitle:  { ...UI2.cardTitle, margin: 0 },
  detRef:    T2.label,
  divider:   UI2.divider,
  detIcon:   UI2.iconBox(SZ2.icon.md, TONES2.neutral),
  // detail rows — label ABOVE value (= PM Integrations details / Subscription "Commercial Entity Info"):
  // round icon box · caps label · value, so nothing squeezes in the narrow side column
  infos:     UI2.stack(SP2.lg),
  info:      { ...UI2.row(SP2.md), minWidth: 0 },
  infoIcon:  UI2.iconBox(SZ2.icon.md, TONES2.primary, { round: true }),
  infoBody:  { ...UI2.stack(SP2.xs), flex: 1, minWidth: 0 },
  infoCaps:  { ...UI2.capsLabel, ...UI2.truncate },
  infoValue: UI2.text.title,
  lineHead:  { ...UI2.subhead, margin: 0 },
  lines:     UI2.stack(SP2.md),
  totalRow:  { ...UI2.cardFoot, marginTop: 0 },
  totalLbl:  UI2.text.titleLg,
  total:     (neg) => ({ ...T2.kpiValue, ...(neg ? UI2.signColor(false) : {}) }),
  acts:      UI2.stack(SP2.sm),
  fullBtn:   (kind) => ({ ...(kind === 'brand' ? UI2.btn.brand : UI2.btn.soft), ...UI2.btnOff, width: '100%', justifyContent: 'center' }),
  note:      { ...UI2.row(SP2.sm), alignItems: 'flex-start', ...T2.caption },
  noteIcon:  { fontSize: FS2.md, flexShrink: 0 },
};

export default function PMTransactionsTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [service, setService] = useState(null);       // null = all services
  const [range, setRange] = useState('30');
  const [selectedId, setSelectedId] = useState(TRANSACTIONS[0].id);

  const rows = TRANSACTIONS.filter(t => {
    const q = query.trim().toLowerCase();
    if (q && !(t.desc.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))) return false;
    if (service && t.service !== service) return false;
    return (ANCHOR_DATE - new Date(t.date)) / 86400000 <= RANGE_DAYS[range];
  });
  const detail = TRANSACTIONS.find(t => t.id === selectedId) || null;
  const detailTone = detail ? STATUS_TONE[detail.status] || TONES2.primary : TONES2.primary;
  const refunded = detail?.status === 'Refunded';

  const exportCsv = () => {
    const header = ['Date', 'Transaction', 'Service', 'Reference', 'Amount', 'Status'];
    const body = rows.map(t => [t.dateLabel, t.label, t.service, t.id, t.amount.toFixed(2), t.status]);
    const csv = [header, ...body].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbannest-pm-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'date',   label: 'Date', type: 'secondary', fit: true, render: t => t.dateLabel },
    { key: 'label',  label: 'Transaction', type: 'primary', width: 1.4, render: t => t.label },
    { key: 'svc',    label: 'Service', render: t => t.service },
    { key: 'ref',    label: 'Reference', type: 'secondary', fit: true, render: t => t.id },
    { key: 'amt',    label: 'Amount', type: 'amount', fit: true, render: t => <span style={t.amount < 0 ? UI2.signColor(false) : undefined}>{money(t.amount)}</span> },
    { key: 'status', label: 'Status', type: 'status', fit: true, render: t => {
      const tone = STATUS_TONE[t.status] || TONES2.neutral;
      return <span style={UI2.statusPill(tone)}><span style={UI2.statusDot(tone)} />{t.status}</span>;
    } },
    { key: 'act',    label: 'Action', fit: true, align: 'right', render: t => {
      const on = t.id === selectedId;
      return (
        <button type="button" style={UI2.btn.rowIcon(on ? TONES2.primary : TONES2.neutral)} onClick={() => setSelectedId(t.id)}
          aria-pressed={on} title="View details" aria-label={`View details for ${t.id}`}>
          <i className="ti ti-eye" aria-hidden="true" />
        </button>
      );
    } },
  ];

  return (
    <PMPageShell activeId="account-transactions" animate backdrop={<ImageBackdrop image={backdropArt} />} searchPlaceholder="Search portfolios, settings, or help…">
      <Breadcrumb items={[{ label: 'Account Settings', href: '/pm-portal/account/profile' }, { label: 'Transactions' }]} />

      {/* ── Header: title · subtitle → Account Settings tabs ── */}
      <section style={S.headBlock}>
        <div style={S.head}>
          <div style={UI2.minWidth0}>
            <h1 style={S.title}>Transactions</h1>
            <p style={S.sub}>A combined ledger of subscription charges, screening charges, and marketplace/promotion charges.</p>
          </div>
        </div>
        <div style={S.tabs}><AccountSettingsTabs active="transactions" /></div>
        <div style={S.intro}>
          <p style={S.introText}>Historical record of payments made to UrbanNest and direct service charges.</p>
          <div style={S.menuWrap}>
            <FilterMenu
              title="Scope" ariaLabel="Transaction scope" showAll={false} options={SCOPE_OPTIONS} value="platform" onChange={() => {}}
              triggerStyle={S.toolBtn}
              trigger={filterTrigger('ti-file-text', <>Scope: <span style={UI2.strong}>{SCOPE_OPTIONS[0].label}</span></>)}
            />
          </div>
        </div>
        <HeroStats className="un2-phero-stats un2-phero-stats-fill" style={S.stats} stats={[
          { icon: 'ti-coins',              tone: TONES2.primary,             label: 'Total Paid This Month',     value: '$352.00', note: 'Includes PMS, screenings & promotions' },
          { icon: 'ti-rosette-discount-check', tone: TONES2.success,         label: 'Last Payment',              value: '$302.00', note: 'Oct 04, 2026 · Processed automatically' },
          { icon: 'ti-credit-card',        tone: accentTone(ACCENT2.blue),   label: 'Active Auto-Debit Account', value: <span style={{ fontSize: FS2.lg }}>Visa •••• 7731</span>,   /* this value only: 16px (FS2.lg) instead of the 20px stat figure */
            note: <span style={UI2.row(SP2.md)}>Expires 11/28 <TextLink onClick={() => navigate('/pm-portal/account/subscription')}>Manage</TextLink></span> },
        ]} />
      </section>

      {/* ── Billing Activity: heading → toolbar (left) → table panel │ selected charge ── */}
      <section className="un2-cq" style={S.section}>
        <div style={UI2.minWidth0}>
          <h2 style={S.secTitle}>Billing Activity</h2>
          <p style={S.secSub}>All billing events across subscriptions, marketplace promotions, and screening fees.</p>
        </div>
        {/* search, then the "Options" toggle — Service / Date range / Export CSV slide out from it (same ActionTray
            setup as Approvals / Listings). On this page the search stays visible while the tray is open (no un2-tray-search). */}
        <div className="un2-tray-tools un2-tray-expand-right" style={S.tools}>
          <label className="un2-focus-ring" style={S.search}>
            <i className="ti ti-search" style={S.searchIcon} aria-hidden="true" />
            <input style={S.input} type="search" placeholder="Search description or reference ID…"
              value={query} onChange={e => setQuery(e.target.value)} aria-label="Search transactions" />
          </label>
          <ActionTray compact label="Options">
            <div style={S.menuWrap}>
              <FilterMenu
                title="Service" allLabel="All Services" ariaLabel="Filter by service" itemIcon="ti-apps" allIcon="ti-list"
                options={SERVICE_OPTIONS} value={service} onChange={setService}
                triggerStyle={S.toolBtn} trigger={filterTrigger('ti-apps', service || 'All Services', !!service)}
              />
            </div>
            <div style={S.menuWrap}>
              <FilterMenu
                title="Date range" ariaLabel="Filter by date range" itemIcon="ti-calendar" showAll={false}
                options={RANGE_OPTIONS} value={range} onChange={v => setRange(v || '30')}
                triggerStyle={S.toolBtn} trigger={filterTrigger('ti-calendar', RANGE_OPTIONS.find(o => o.value === range).label)}
              />
            </div>
            <button type="button" className="un2-btn" style={S.softBtn} onClick={exportCsv}>
              <i className="ti ti-download" style={S.btnIcon} aria-hidden="true" /> Export CSV
            </button>
          </ActionTray>
        </div>

        <Grid layout="mainSide" as="div">   {/* ≈ 69 / 31 — the 7-column table fits without sideways scroll */}
          {/* table panel */}
          <div style={S.panel}>
            <DataTable columns={columns} rows={rows} rowKey={t => t.id}
              empty={<EmptyState icon="ti-receipt-off" text="No transactions match these filters." />} />
            <div style={UI2.pager.foot}>
              <span>Showing {rows.length} of {TRANSACTIONS.length} billing entries for current billing cycle</span>
              <div style={UI2.pager.row}>
                <button type="button" style={UI2.pager.btn} disabled aria-label="Previous page"><i className="ti ti-chevron-left" aria-hidden="true" /></button>
                <span style={UI2.pager.current} aria-current="page">1</span>
                <button type="button" style={UI2.pager.btn} disabled aria-label="Next page"><i className="ti ti-chevron-right" aria-hidden="true" /></button>
              </div>
            </div>
          </div>

          {/* selected charge */}
          <aside style={S.detail}>
            {!detail ? (
              <EmptyState icon="ti-file-invoice" text="Select a transaction to view its details." />
            ) : (
              <>
                <div style={S.detTop}>
                  <div style={S.detHead}>
                    <div style={S.detEyebrow(detailTone)}>
                      <i className={`ti ${refunded ? 'ti-receipt-refund' : 'ti-circle-check-filled'}`} style={S.detEyeIcon} aria-hidden="true" />
                      {refunded ? 'Refund Issued' : 'Settled Charge'}
                    </div>
                    <h2 style={S.detTitle}>{detail.title}</h2>
                    <div style={S.detRef}>{detail.id}</div>
                  </div>
                  <span style={S.detIcon} aria-hidden="true"><i className={`ti ${refunded ? 'ti-receipt-refund' : 'ti-file-invoice'}`} /></span>
                </div>

                <hr style={S.divider} />

                <div style={S.infos}>
                  {[
                    ['ti-credit-card', 'Payment Method', detail.paymentMethod],
                    ['ti-calendar', 'Timestamp', detail.timestamp],
                    ['ti-stack-2', 'Billing Type', detail.billingType],
                  ].map(([icon, k, v]) => (
                    <div key={k} style={S.info}>
                      <span style={S.infoIcon} aria-hidden="true"><i className={`ti ${icon}`} /></span>
                      <div style={S.infoBody}>
                        <span style={S.infoCaps}>{k}</span>
                        <span style={S.infoValue}>{v}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <hr style={S.divider} />

                <div style={S.lines}>
                  <div style={S.lineHead}>Line Item Breakdown</div>
                  {detail.lineItems.map(li => (
                    <div key={li.label} style={UI2.legendRow}><span>{li.label}</span><span>{money(li.value)}</span></div>
                  ))}
                </div>

                <div style={S.totalRow}>
                  <span style={S.totalLbl}>{detail.total < 0 ? 'Total Refunded' : 'Total Charged'}</span>
                  <span style={S.total(detail.total < 0)}>{money(detail.total)}</span>
                </div>

                <div style={S.acts}>
                  <button type="button" className="un2-btn" style={S.fullBtn('brand')} disabled title="PDF receipt generation isn't wired up yet">
                    <i className="ti ti-download" style={S.btnIcon} aria-hidden="true" /> Download Receipt (PDF)
                  </button>
                  <button type="button" className="un2-btn" style={S.fullBtn('soft')} disabled title="Invoice printing isn't wired up yet">
                    <i className="ti ti-printer" style={S.btnIcon} aria-hidden="true" /> Print Invoice
                  </button>
                </div>

                <div style={S.note}>
                  <i className="ti ti-info-circle" style={S.noteIcon} aria-hidden="true" />
                  <span>Billing data shown is sample content — no live payment gateway is connected in this environment yet.</span>
                </div>
              </>
            )}
          </aside>
        </Grid>
      </section>

      <PageFooter />
    </PMPageShell>
  );
}
