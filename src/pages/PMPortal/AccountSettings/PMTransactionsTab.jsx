// PMTransactionsTab.jsx — PM Portal: Account Settings → Transactions
// Route: /pm-portal/account/transactions
//
// Session 49, full functional parity round. The earlier version of this
// tab (nav consolidation round) was a thin single table. This rebuild
// matches Landlord's richer Session 52 Transactions tab (see
// src/pages/Landlord/Account Settings/LandlordSettingsPage.jsx) layout and
// interactivity: stat tiles, search + service + date-range filters, a real
// client-side CSV export, master/detail row selection with a line-item
// breakdown panel.
//
// Same backend-gap posture as Landlord's own version, re-confirmed this
// round — no payment-ledger model exists anywhere in this codebase for
// either portal, and the one model that could back it (UNInvoice,
// core/models.py) has no PM-facing endpoint. So, same as Landlord's own
// comment on this, every row below is sample content; search, the two
// filters, row selection, and CSV export are all genuinely wired against
// that sample array (none of those need a backend to be real), while PDF
// receipt / print actions stay disabled with an ARCH_017 tooltip.
//
// PM's own design tokens are kept here (not Landlord's Inter/navy tokens)
// — same judgment call documented on PMBankAccountsTab.jsx and
// PMSubscriptionPage.jsx, for the same reason: visual consistency with the
// rest of PM Portal, which already uses this token set everywhere else.

import React, { useState } from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';
import AccountSettingsSubnav from './AccountSettingsSubnav';
import { CustomDropdown } from '../../../components/ui';

const C = {
  primary:      '#002D5B',
  pageBg:       '#F8FAFC',
  white:        '#FFFFFF',
  border:       'rgba(0,0,0,0.06)',
  borderMedium: 'rgba(0,0,0,0.10)',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  amber:        '#92400E',
  amberBg:      '#FEF3C7',
  amberBorder:  '#FCD34D',
  green:        '#16A34A',
  greenBg:      '#F0FDF4',
  blue:         '#3d8ef0',
  blueBg:       '#EFF6FF',
  red:          '#DC2626',
  redBg:        '#FEF2F2',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

const TX_SERVICE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Services' },
  { value: 'PMS', label: 'PMS' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'Screening', label: 'Screening' },
];
const TX_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];
const TX_RANGE_DAYS = { '7': 7, '30': 30, '90': 90, all: Infinity };

// Sample billing ledger — PM-appropriate charges (subscription, screening,
// marketplace/promotion), mirroring Landlord's own sample shape 1:1 since
// the underlying charge types are identical across portals.
const TRANSACTIONS = [
  { id: 'INV-2041', date: '2026-10-04', dateLabel: 'Oct 04', label: 'Subscription Payment', desc: 'Monthly Subscription - Starter Tier', service: 'PMS', amount: 302.00, status: 'Paid',
    paymentMethod: 'Visa ending 7731', timestamp: 'Oct 04, 2026, 08:50 AM EST', billingType: 'Direct UrbanNest Debit',
    lineItems: [{ label: 'Base Monthly PMS Tier', value: 302.00 }, { label: 'Tax', value: 0 }], total: 302.00 },
  { id: 'TXN-9910', date: '2026-10-01', dateLabel: 'Oct 01', label: 'Tenant Screening', desc: 'Tenant Screening - Applicant #412 (J. Alvarez)', service: 'Screening', amount: 35.00, status: 'Paid',
    paymentMethod: 'Visa ending 7731', timestamp: 'Oct 01, 2026, 03:15 PM EST', billingType: 'Card Charge — One-Time',
    lineItems: [{ label: 'Background & Credit Check', value: 35.00 }, { label: 'Tax', value: 0 }], total: 35.00 },
  { id: 'TXN-9887', date: '2026-09-27', dateLabel: 'Sep 27', label: 'Featured Listing', desc: 'Featured Listing - Idex3 Unit A1', service: 'Marketplace', amount: 15.00, status: 'Paid',
    paymentMethod: 'Visa ending 7731', timestamp: 'Sep 27, 2026, 10:05 AM EST', billingType: 'Card Charge — One-Time',
    lineItems: [{ label: '7-Day Featured Placement', value: 15.00 }, { label: 'Tax', value: 0 }], total: 15.00 },
  { id: 'RF-205', date: '2026-09-24', dateLabel: 'Sep 24', label: 'Refund', desc: 'Refund - Promotion Cancellation (Idex3 Unit A1)', service: 'Marketplace', amount: -15.00, status: 'Refunded',
    paymentMethod: 'Visa ending 7731', timestamp: 'Sep 24, 2026, 01:40 PM EST', billingType: 'Refund to Original Payment Method',
    lineItems: [{ label: '7-Day Featured Placement (Refunded)', value: -15.00 }, { label: 'Tax', value: 0 }], total: -15.00 },
];
const TX_ANCHOR_DATE = new Date(TRANSACTIONS[0].date);

const S = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body },
  main:  { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 },
  content: { flex: 1, minHeight: 0, padding: '28px 32px', overflowY: 'auto' },
  crumb: { fontSize: 12, color: C.textTertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 },
  h1: { fontFamily: F.headline, fontSize: 26, fontWeight: 500, color: C.primary, margin: '0 0 3px' },
  sub: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 18px', maxWidth: 820 },

  introRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 },
  scopeBadge: { display: 'flex', alignItems: 'center', gap: 10, background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 10, padding: '8px 14px' },
  scopeIcon: { width: 28, height: 28, borderRadius: 8, background: C.blueBg, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 },
  scopeLabel: { fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4 },
  scopeValue: { fontSize: 12.5, fontWeight: 600, color: C.textPrimary },

  statRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 },
  statTile: (accent) => ({ background: C.white, border: `1px solid ${C.borderMedium}`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }),
  statTileTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.textTertiary },
  statIconTint: (bg, fg) => ({ width: 24, height: 24, borderRadius: 7, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }),
  statValue: { fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.textPrimary },
  statSub: { fontSize: 11.5, color: C.textTertiary, lineHeight: 1.5 },
  linkBtn: { background: 'none', border: 'none', color: C.primary, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 },

  toolbar: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textTertiary },
  searchInput: { width: '100%', height: 36, border: `1px solid ${C.borderMedium}`, borderRadius: 8, padding: '0 12px 0 34px', fontSize: 12.5, fontFamily: F.body, boxSizing: 'border-box' },
  dropdownWrap: { minWidth: 150 },
  btnOutline: { background: C.white, color: C.textPrimary, border: `1px solid ${C.borderMedium}`, padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: F.body, display: 'flex', alignItems: 'center', gap: 6 },

  layout: { display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(260px,1fr)', gap: 16, alignItems: 'flex-start' },
  tableCard: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' },
  cardHdr: { padding: '14px 16px 10px' },
  cardTitle: { fontSize: 13.5, fontWeight: 700, color: C.textPrimary },
  cardSub: { fontSize: 11.5, color: C.textTertiary, marginTop: 2 },
  divider: { borderBottom: `1px solid ${C.border}` },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px', borderBottom: `1px solid ${C.border}` },
  td: { fontSize: 12.5, color: C.textPrimary, padding: '12px 14px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' },
  emptyRow: { textAlign: 'center', color: C.textTertiary, padding: '20px 14px', fontSize: 12.5 },
  row: (active, hovered) => ({ background: active ? `${C.blueBg}` : hovered ? `${C.blueBg}80` : 'transparent' }),
  ref: { fontFamily: 'monospace', fontSize: 11.5 },
  amountTd: (negative) => ({ fontSize: 12.5, color: negative ? C.red : C.textPrimary, padding: '12px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 600 }),
  viewIconBtn: (active) => ({ width: 26, height: 26, borderRadius: 6, border: `1px solid ${active ? C.primary : C.borderMedium}`, background: active ? C.blueBg : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, color: active ? C.primary : C.textSecondary, cursor: 'pointer' }),
  footerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', fontSize: 11.5, color: C.textTertiary },
  pagination: { display: 'flex', gap: 4 },
  pageBtn: { width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.borderMedium}`, background: C.white, fontSize: 11, color: C.textTertiary, cursor: 'not-allowed' },
  pageBtnActive: { background: C.primary, color: '#fff', borderColor: C.primary },

  detailCard: (refunded) => ({ background: refunded ? C.redBg : C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 12, padding: '18px 20px', position: 'sticky', top: 0 }),
  detailTopRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  detailBadge: (refunded) => ({ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: refunded ? C.red : C.green, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }),
  detailTitle: { fontFamily: F.headline, fontSize: 15, fontWeight: 600, color: C.textPrimary, margin: '0 0 3px' },
  detailRef: { fontFamily: 'monospace', fontSize: 11, color: C.textTertiary },
  detailIconWrap: (refunded) => ({ width: 30, height: 30, borderRadius: 8, background: refunded ? '#FEE2E2' : C.blueBg, color: refunded ? C.red : C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }),
  detailInfoBox: { background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 },
  detailInfoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 },
  detailInfoLabel: { color: C.textTertiary, display: 'flex', alignItems: 'center', gap: 5 },
  detailInfoValue: { color: C.textPrimary, fontWeight: 600 },
  breakdownLabel: { fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textSecondary, padding: '4px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 10, marginBottom: 14 },
  totalLabel: { fontSize: 12, fontWeight: 700, color: C.textPrimary },
  totalValue: (negative) => ({ fontFamily: F.headline, fontSize: 17, fontWeight: 700, color: negative ? C.red : C.textPrimary }),
  btnPrimaryFull: { width: '100%', background: C.primary, color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box' },
  btnOutlineFull: { width: '100%', background: C.white, color: C.textPrimary, border: `1px solid ${C.borderMedium}`, padding: '9px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box' },
  securityNote: { display: 'flex', gap: 7, fontSize: 10.5, color: C.textTertiary, lineHeight: 1.5, marginTop: 14 },
};

export default function PMTransactionsTab() {
  const [txQuery, setTxQuery] = useState('');
  const [txService, setTxService] = useState('ALL');
  const [txRange, setTxRange] = useState('30');
  const [txSelected, setTxSelected] = useState(TRANSACTIONS[0].id);
  const [txHoverId, setTxHoverId] = useState(null);

  const txFilteredRows = TRANSACTIONS.filter(t => {
    const q = txQuery.trim().toLowerCase();
    if (q && !(t.desc.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))) return false;
    if (txService !== 'ALL' && t.service !== txService) return false;
    const days = (TX_ANCHOR_DATE - new Date(t.date)) / 86400000;
    if (days > TX_RANGE_DAYS[txRange]) return false;
    return true;
  });
  const txDetail = TRANSACTIONS.find(t => t.id === txSelected) || null;

  const handleTxExportCsv = () => {
    const header = ['Date', 'Transaction', 'Service', 'Reference', 'Amount', 'Status'];
    const rows = txFilteredRows.map(t => [t.dateLabel, t.label, t.service, t.id, t.amount.toFixed(2), t.status]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbannest-pm-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={S.shell}>
      <NavB activeId="account-transactions" />
      <div style={S.main}>
        <PMTopBar />
        <div style={S.content}>
          <div style={S.crumb}>
            Account Settings <i className="ti ti-chevron-right" style={{ fontSize: 12 }} aria-hidden="true" />
            <span style={{ color: C.textSecondary }}>Transactions</span>
          </div>
          <h1 style={S.h1}>Transactions</h1>
          <p style={S.sub}>A combined ledger of subscription charges, screening charges, and marketplace/promotion charges.</p>

          <AccountSettingsSubnav activeTab="transactions" />

          <div style={S.introRow}>
            <p style={{ fontSize: 12.5, color: C.textSecondary, margin: 0 }}>Historical record of payments made to UrbanNest and direct service charges.</p>
            <div style={S.scopeBadge}>
              <span style={S.scopeIcon}><i className="ti ti-receipt-2" aria-hidden="true" /></span>
              <div>
                <div style={S.scopeLabel}>Scope</div>
                <div style={S.scopeValue}>UrbanNest Platform Billing Only</div>
              </div>
            </div>
          </div>

          <div style={S.statRow}>
            <div style={S.statTile(C.primary)}>
              <div style={S.statTileTop}>
                <span style={S.statLabel}>Total Paid This Month</span>
                <span style={S.statIconTint(C.blueBg, C.primary)}><i className="ti ti-calendar" aria-hidden="true" /></span>
              </div>
              <div style={S.statValue}>$352.00</div>
              <div style={S.statSub}>Includes PMS, screenings &amp; promotions</div>
            </div>
            <div style={S.statTile(C.green)}>
              <div style={S.statTileTop}>
                <span style={S.statLabel}>Last Payment</span>
                <span style={S.statIconTint(C.greenBg, C.green)}><i className="ti ti-rosette-discount-check" aria-hidden="true" /></span>
              </div>
              <div style={S.statValue}>$302.00</div>
              <div style={S.statSub}>Oct 04, 2026 · Processed automatically</div>
            </div>
            <div style={S.statTile(C.blue)}>
              <div style={S.statTileTop}>
                <span style={S.statLabel}>Active Auto-Debit Account</span>
                <a href="/pm-portal/account/subscription" style={S.linkBtn}>Manage</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ width: 28, height: 20, borderRadius: 4, background: C.primary, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>VISA</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>Visa •••• 7731</div>
                  <div style={{ fontSize: 10.5, color: C.textTertiary }}>Expires 11/28</div>
                </div>
              </div>
            </div>
          </div>

          <div style={S.toolbar}>
            <div style={S.searchWrap}>
              <i className="ti ti-search" style={S.searchIcon} aria-hidden="true" />
              <input style={S.searchInput} placeholder="Search description or reference ID…" value={txQuery} onChange={e => setTxQuery(e.target.value)} />
            </div>
            <div style={S.dropdownWrap}><CustomDropdown options={TX_SERVICE_FILTER_OPTIONS} value={txService} onChange={setTxService} placeholder="All Services" /></div>
            <div style={S.dropdownWrap}><CustomDropdown options={TX_RANGE_OPTIONS} value={txRange} onChange={setTxRange} placeholder="Last 30 Days" /></div>
            <button style={S.btnOutline} onClick={handleTxExportCsv}><i className="ti ti-download" aria-hidden="true" /> Export CSV</button>
          </div>

          <div style={S.layout}>
            <div style={S.tableCard}>
              <div style={S.cardHdr}>
                <div style={S.cardTitle}>Billing Activity</div>
                <div style={S.cardSub}>All billing events across subscriptions, marketplace promotions, and screening fees.</div>
              </div>
              <div style={S.divider} />
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Transaction</th>
                    <th style={S.th}>Service</th>
                    <th style={S.th}>Reference</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Amount</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {txFilteredRows.length === 0 ? (
                    <tr><td style={S.emptyRow} colSpan={7}>No transactions match these filters.</td></tr>
                  ) : txFilteredRows.map(t => {
                    const active = t.id === txSelected;
                    const negative = t.amount < 0;
                    return (
                      <tr key={t.id} style={S.row(active, t.id === txHoverId)} onMouseEnter={() => setTxHoverId(t.id)} onMouseLeave={() => setTxHoverId(null)}>
                        <td style={S.td}>{t.dateLabel}</td>
                        <td style={S.td}>{t.label}</td>
                        <td style={S.td}>{t.service}</td>
                        <td style={S.td}><span style={S.ref}>{t.id}</span></td>
                        <td style={S.amountTd(negative)}>{negative ? '-' : ''}${Math.abs(t.amount).toFixed(2)}</td>
                        <td style={S.td}>{t.status}</td>
                        <td style={S.td}>
                          <button style={S.viewIconBtn(active)} onClick={() => setTxSelected(t.id)} title="View Details" aria-label="View Details">
                            <i className="ti ti-eye" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={S.footerRow}>
                <span>Showing {txFilteredRows.length} of {TRANSACTIONS.length} billing entries for current billing cycle</span>
                <div style={S.pagination}>
                  <button style={S.pageBtn} disabled title="Only one page of results today">Prev</button>
                  <button style={{ ...S.pageBtn, ...S.pageBtnActive }} disabled>1</button>
                  <button style={S.pageBtn} disabled title="Only one page of results today">Next</button>
                </div>
              </div>
            </div>

            <div style={S.detailCard(txDetail && txDetail.status === 'Refunded')}>
              {!txDetail ? (
                <div style={{ fontSize: 12.5, color: C.textTertiary, textAlign: 'center', padding: '24px 0' }}>Select a transaction to view its details.</div>
              ) : (
                <>
                  <div style={S.detailTopRow}>
                    <div>
                      <div style={S.detailBadge(txDetail.status === 'Refunded')}>
                        <i className={txDetail.status === 'Refunded' ? 'ti ti-receipt-refund' : 'ti ti-circle-check'} aria-hidden="true" /> {txDetail.status === 'Refunded' ? 'Refund Issued' : 'Settled Charge'}
                      </div>
                      <h4 style={S.detailTitle}>{txDetail.desc.split(' - ')[0]}</h4>
                      <div style={S.detailRef}>{txDetail.id}</div>
                    </div>
                    <span style={S.detailIconWrap(txDetail.status === 'Refunded')}>
                      <i className={txDetail.status === 'Refunded' ? 'ti ti-receipt-refund' : 'ti ti-file-invoice'} aria-hidden="true" />
                    </span>
                  </div>

                  <div style={S.detailInfoBox}>
                    <div style={S.detailInfoRow}>
                      <span style={S.detailInfoLabel}><i className="ti ti-credit-card" aria-hidden="true" /> Payment Method</span>
                      <span style={S.detailInfoValue}>{txDetail.paymentMethod}</span>
                    </div>
                    <div style={S.detailInfoRow}><span style={S.detailInfoLabel}>Timestamp</span><span style={S.detailInfoValue}>{txDetail.timestamp}</span></div>
                    <div style={S.detailInfoRow}><span style={S.detailInfoLabel}>Billing Type</span><span style={S.detailInfoValue}>{txDetail.billingType}</span></div>
                  </div>

                  <div style={S.breakdownLabel}>Line Item Breakdown</div>
                  {txDetail.lineItems.map((li, i) => (
                    <div key={i} style={S.breakdownRow}>
                      <span>{li.label}</span>
                      <span>{li.value < 0 ? '-' : ''}${Math.abs(li.value).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={S.totalRow}>
                    <span style={S.totalLabel}>{txDetail.total < 0 ? 'Total Refunded' : 'Total Charged'}</span>
                    <span style={S.totalValue(txDetail.total < 0)}>{txDetail.total < 0 ? '-' : ''}${Math.abs(txDetail.total).toFixed(2)}</span>
                  </div>

                  <button style={S.btnPrimaryFull} disabled title="PDF receipt generation isn't wired up yet"><i className="ti ti-download" aria-hidden="true" /> Download Receipt (PDF)</button>
                  <button style={S.btnOutlineFull} disabled title="Invoice printing isn't wired up yet"><i className="ti ti-printer" aria-hidden="true" /> Print Invoice</button>

                  <div style={S.securityNote}>
                    <i className="ti ti-lock" aria-hidden="true" />
                    <span>Billing data shown is sample content — no live payment gateway is connected in this environment yet.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
