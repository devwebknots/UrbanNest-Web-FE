// PMIntegrationsTab.jsx — PM Portal: Account Settings → Integrations
// Route: /pm-portal/account/integrations
//
// Session 49, full functional parity round. Rebuilt to match Landlord's
// Integrations tab (src/pages/Landlord/Account Settings/
// LandlordSettingsPage.jsx, Figma round) layout: a stat-badge intro row, a
// 4-card grid (Payment Provider / Accounting / Email Dispatch / SMS
// Gateway), and a developer webhooks/API-keys banner below.
//
// None of these connections are backed by a real integration on either
// portal — settings.py only has placeholder Stripe env keys, and there is
// no QuickBooks/Xero, Twilio, SendGrid, or webhook/API-key logic anywhere
// in this codebase (re-confirmed this round). So, same as Landlord's own
// version, every value below is static sample content and every action is
// disabled with an ARCH_017 tooltip — nothing here claims to be real.
//
// PM's own design tokens are kept here (not Landlord's Inter/navy tokens)
// — same judgment call documented on the other 3 rebuilt tabs this round.

import React from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';
import AccountSettingsSubnav from './AccountSettingsSubnav';

const C = {
  primary:      '#002D5B',
  pageBg:       '#F8FAFC',
  white:        '#FFFFFF',
  border:       'rgba(0,0,0,0.06)',
  borderMedium: 'rgba(0,0,0,0.10)',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  neutral:      '#F1F5F9',
  green:        '#16A34A',
  greenBg:      '#F0FDF4',
  blue:         '#3d8ef0',
  blueBg:       '#EFF6FF',
  red:          '#DC2626',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

const S = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body },
  main:  { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 },
  content: { flex: 1, minHeight: 0, padding: '28px 32px', overflowY: 'auto' },
  crumb: { fontSize: 12, color: C.textTertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 },
  h1: { fontFamily: F.headline, fontSize: 26, fontWeight: 500, color: C.primary, margin: '0 0 3px' },
  sub: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 18px', maxWidth: 820 },

  introRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  introSub: { fontSize: 12.5, color: C.textSecondary, margin: 0, maxWidth: 520 },
  statBadgeRow: { display: 'flex', gap: 10 },
  statBadge: { display: 'flex', alignItems: 'center', gap: 10, background: C.white, border: `1px solid ${C.borderMedium}`, borderRadius: 10, padding: '8px 14px' },
  statIcon: (bg, fg) => ({ width: 28, height: 28, borderRadius: 8, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }),
  statValue: { fontSize: 13.5, fontWeight: 700, color: C.textPrimary },
  statCaption: { fontSize: 10.5, color: C.textTertiary },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 },
  card: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  cardHeadRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardIconTitleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 9, background: C.blueBg, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline },
  statusPill: (connected) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: connected ? C.greenBg : C.neutral, color: connected ? C.green : C.textSecondary, whiteSpace: 'nowrap', flexShrink: 0 }),
  desc: { fontSize: 12, color: C.textSecondary, lineHeight: 1.5, margin: 0 },

  infoBox: { background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 },
  infoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 },
  infoLabel: { color: C.textTertiary },
  infoValueMono: { color: C.textPrimary, fontWeight: 600, fontFamily: 'monospace', fontSize: 11 },
  infoValueOk: { color: C.green, fontWeight: 600 },
  infoValueText: { color: C.textPrimary, fontWeight: 600 },
  infoNotice: { display: 'flex', gap: 7, fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5 },
  infoNoticeIcon: { flexShrink: 0, color: C.textTertiary },
  barTrack: { width: 70, height: 6, borderRadius: 20, background: C.neutral, overflow: 'hidden' },
  barFill: (pct) => ({ width: `${pct}%`, height: '100%', background: C.green, borderRadius: 20 }),

  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btnPrimary: { background: C.primary, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6, fontFamily: F.body },
  btnSecondary: { background: C.white, color: C.textPrimary, border: `1px solid ${C.borderMedium}`, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', opacity: 0.8, fontFamily: F.body },
  dangerLink: { background: 'none', border: 'none', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 4px' },

  devBanner: { background: `linear-gradient(135deg, ${C.primary} 0%, #0a4a8a 100%)`, borderRadius: 14, padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' },
  devEyebrowRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  devTag: { fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.18)', padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.4 },
  devVersion: { fontSize: 10.5, color: 'rgba(255,255,255,0.65)' },
  devTitle: { fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: F.headline, marginBottom: 4 },
  devDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0, maxWidth: 480 },
  devBtnRow: { display: 'flex', gap: 10, flexShrink: 0 },
  devBtnGhost: { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '9px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 },
  devBtnSolid: { background: '#fff', color: C.primary, border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 },
};

export default function PMIntegrationsTab() {
  return (
    <div style={S.shell}>
      <NavB activeId="account-integrations" />
      <div style={S.main}>
        <PMTopBar />
        <div style={S.content}>
          <div style={S.crumb}>
            Account Settings <i className="ti ti-chevron-right" style={{ fontSize: 12 }} aria-hidden="true" />
            <span style={{ color: C.textSecondary }}>Integrations</span>
          </div>
          <h1 style={S.h1}>Integrations</h1>
          <p style={S.sub}>Manage third-party connections, payment providers, and automated messaging integrations.</p>

          <AccountSettingsSubnav activeTab="integrations" />

          <div style={S.introRow}>
            <p style={S.introSub}>Preview — these connections are illustrative; nothing below is wired to a real provider yet.</p>
            <div style={S.statBadgeRow}>
              <div style={S.statBadge}>
                <span style={S.statIcon(C.greenBg, C.green)}><i className="ti ti-square-check" aria-hidden="true" /></span>
                <div><div style={S.statValue}>3 of 4</div><div style={S.statCaption}>Live Pipelines</div></div>
              </div>
              <div style={S.statBadge}>
                <span style={S.statIcon(C.primary, '#fff')}><i className="ti ti-shield-check" aria-hidden="true" /></span>
                <div><div style={S.statValue}>99.9%</div><div style={S.statCaption}>Relay Health</div></div>
              </div>
            </div>
          </div>

          <div style={S.grid}>
            <div style={S.card}>
              <div style={S.cardHeadRow}>
                <div style={S.cardIconTitleRow}>
                  <span style={S.iconBox}><i className="ti ti-credit-card" aria-hidden="true" /></span>
                  <div><div style={S.eyebrow}>Payment Provider</div><div style={S.title}>Stripe Connect &amp; Payouts</div></div>
                </div>
                <span style={S.statusPill(true)}><i className="ti ti-circle-check" aria-hidden="true" /> Connected</span>
              </div>
              <p style={S.desc}>Automated ACH rent processing, credit card disbursements, and instant tenant deposit collection.</p>
              <div style={S.infoBox}>
                <div style={S.infoRow}><span style={S.infoLabel}>Merchant Account</span><span style={S.infoValueMono}>acct_1PmW4k92nR1</span></div>
                <div style={S.infoRow}><span style={S.infoLabel}>Last Reconciliation</span><span style={S.infoValueOk}>● 18 minutes ago</span></div>
              </div>
              <div style={S.btnRow}>
                <button style={S.btnPrimary} disabled title="Stripe configuration isn't wired up yet">Configure</button>
                <button style={S.btnSecondary} disabled title="Reconnect isn't wired up yet">Reconnect</button>
                <button style={S.dangerLink} disabled title="Disconnect isn't wired up yet"><i className="ti ti-plug-x" aria-hidden="true" /> Disconnect</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardHeadRow}>
                <div style={S.cardIconTitleRow}>
                  <span style={S.iconBox}><i className="ti ti-building-bank" aria-hidden="true" /></span>
                  <div><div style={S.eyebrow}>Accounting</div><div style={S.title}>QuickBooks Online / Xero Sync</div></div>
                </div>
                <span style={S.statusPill(true)}><i className="ti ti-circle-check" aria-hidden="true" /> Connected</span>
              </div>
              <p style={S.desc}>Real-time ledger synchronization for owner statements, vendor expense categorization, and tax audits.</p>
              <div style={S.infoBox}>
                <div style={S.infoRow}><span style={S.infoLabel}>Mapped Legal Entity</span><span style={S.infoValueText}>Harbor Point PM Services LLC</span></div>
                <div style={S.infoRow}><span style={S.infoLabel}>Automated Cron</span><span style={S.infoValueMono}>Daily @ 02:00 UTC</span></div>
              </div>
              <div style={S.btnRow}>
                <button style={S.btnPrimary} disabled title="QuickBooks configuration isn't wired up yet">Configure</button>
                <button style={S.btnSecondary} disabled title="Reconnect isn't wired up yet">Reconnect</button>
                <button style={S.dangerLink} disabled title="Disconnect isn't wired up yet"><i className="ti ti-plug-x" aria-hidden="true" /> Disconnect</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardHeadRow}>
                <div style={S.cardIconTitleRow}>
                  <span style={S.iconBox}><i className="ti ti-mail" aria-hidden="true" /></span>
                  <div><div style={S.eyebrow}>Email Dispatch</div><div style={S.title}>SendGrid / SMTP Gateway</div></div>
                </div>
                <span style={S.statusPill(false)}>● Not Connected</span>
              </div>
              <p style={S.desc}>Transactional owner notices, lease generation dispatch, and automated maintenance alert notifications.</p>
              <div style={S.infoBox}>
                <div style={S.infoNotice}>
                  <span style={S.infoNoticeIcon}><i className="ti ti-info-circle" aria-hidden="true" /></span>
                  <span>Currently relying on shared UrbanNest mail relay. Connect your dedicated domain to enable custom DKIM/SPF verification.</span>
                </div>
              </div>
              <div style={{ ...S.btnRow, justifyContent: 'flex-end' }}>
                <button style={{ ...S.btnPrimary, display: 'inline-flex', alignItems: 'center', gap: 7 }} disabled title="Email gateway connection isn't wired up yet"><i className="ti ti-plug-connected" aria-hidden="true" /> Connect Gateway</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardHeadRow}>
                <div style={S.cardIconTitleRow}>
                  <span style={S.iconBox}><i className="ti ti-message-circle-2" aria-hidden="true" /></span>
                  <div><div style={S.eyebrow}>SMS Gateway</div><div style={S.title}>Twilio SMS &amp; Messaging</div></div>
                </div>
                <span style={S.statusPill(true)}><i className="ti ti-circle-check" aria-hidden="true" /> Connected</span>
              </div>
              <p style={S.desc}>Two-factor verification codes, emergency maintenance SMS broadcasts, and instant showing reminders.</p>
              <div style={S.infoBox}>
                <div style={S.infoRow}><span style={S.infoLabel}>Active Sender ID</span><span style={S.infoValueMono}>+1 (800) 492-NEST</span></div>
                <div style={S.infoRow}>
                  <span style={S.infoLabel}>Delivery Performance</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={S.barTrack}><div style={S.barFill(99.6)} /></div>
                    <span style={S.infoValueMono}>99.6%</span>
                  </div>
                </div>
              </div>
              <div style={S.btnRow}>
                <button style={S.btnPrimary} disabled title="Twilio configuration isn't wired up yet">Configure</button>
                <button style={S.btnSecondary} disabled title="Reconnect isn't wired up yet">Reconnect</button>
                <button style={S.dangerLink} disabled title="Disconnect isn't wired up yet"><i className="ti ti-plug-x" aria-hidden="true" /> Disconnect</button>
              </div>
            </div>
          </div>

          <div style={S.devBanner}>
            <div>
              <div style={S.devEyebrowRow}>
                <span style={S.devTag}>Developer Protocol</span>
                <span style={S.devVersion}>v2.4 LTS</span>
              </div>
              <div style={S.devTitle}>Custom Webhooks &amp; Direct API Credentials</div>
              <p style={S.devDesc}>Connect custom ERP endpoints, configure HMAC payload signing, or retrieve scoped production API keys for bespoke owner portals.</p>
            </div>
            <div style={S.devBtnRow}>
              <button style={S.devBtnGhost} disabled title="API key management isn't wired up yet"><i className="ti ti-key" aria-hidden="true" /> Manage API Keys</button>
              <button style={S.devBtnSolid} disabled title="Webhook endpoints aren't wired up yet"><i className="ti ti-plug-connected" aria-hidden="true" /> Configure Endpoints</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
