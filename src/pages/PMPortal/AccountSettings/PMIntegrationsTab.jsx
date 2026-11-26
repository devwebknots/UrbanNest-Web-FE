// PMIntegrationsTab.jsx — PM Portal: Account Settings → Integrations (Design System v2)
// Route: /pm-portal/account/integrations · Layout: Downloads/image 187.png
//
// Same page rhythm as PM Transactions / Approvals:
//   header block (UI2.pageHead) — title · subtitle → AccountSettingsTabs → preview note │ 2 compact stats (icon · caps label · value)
//   page section — integration rows (un2-row-divided, one column grid shared by every row so the columns line up):
//     icon tile │ caps eyebrow · title · description │ detail rows (UI2.kvRow) │ status pill │ actions │ ⋯ menu
//   page section — Developer banner (navy UI2.darkCard + NavyGlow, same recipe as the Services promotion banner)
//   PageFooter
//
// Data: no integration backend exists on either portal (settings.py only holds placeholder Stripe env keys; there is
// no QuickBooks/Xero, SendGrid, Twilio or webhook / API-key logic anywhere) — every value below is illustrative and
// every connect / configure action is disabled with a tooltip saying why, same as the v1 page. The ⋯ menus only hold
// actions that genuinely work (copy a value · go to a related Account Settings page).

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PMPageShell, Breadcrumb, PageFooter, ImageBackdrop } from '../../../components/layout';
import { NavyGlow, OptionsMenu } from '../../../components/ui';
import { C2, TONES2, ACCENT2, accentTone, FS2, SP2, SZ2, T2, UI2, pad } from '../../../constants';
import AccountSettingsTabs from './AccountSettingsTabs';
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';

const ON = C2.onDark;
const copy = text => { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {}); };

// Sample integrations (illustrative — see header). details: [icon, label, value]; value may be a node.
const INTEGRATIONS = [
  {
    key: 'stripe', eyebrow: 'Payment Provider', title: 'Stripe Connect & Payouts', icon: 'ti-credit-card', tone: accentTone(ACCENT2.violet),
    desc: 'Automated ACH rent processing, credit card disbursements, and instant tenant deposit collection.',
    connected: true, details: [['ti-credit-card', 'Merchant Account', 'acct_1PmW4k92nR1'], ['ti-clock', 'Last Reconciliation', { live: '18 minutes ago' }]],
    menu: nav => [
      { label: 'Copy merchant account', icon: 'ti-copy', onClick: () => copy('acct_1PmW4k92nR1') },
      { label: 'View transactions', icon: 'ti-file-invoice', onClick: () => nav('/pm-portal/account/transactions') },
    ],
  },
  {
    key: 'ledger', eyebrow: 'Accounting', title: 'QuickBooks Online / Xero Sync', icon: 'ti-book-2', tone: TONES2.success,
    desc: 'Real-time ledger synchronization for owner statements, vendor expense categorization, and tax audits.',
    connected: true, details: [['ti-building-bank', 'Mapped Legal Entity', 'Harbor Point PM Services LLC'], ['ti-refresh', 'Automated Cron', 'Daily @ 02:00 UTC']],
    menu: nav => [
      { label: 'Copy legal entity', icon: 'ti-copy', onClick: () => copy('Harbor Point PM Services LLC') },
      { label: 'View bank accounts', icon: 'ti-building-bank', onClick: () => nav('/pm-portal/account/bank-accounts') },
    ],
  },
  {
    key: 'email', eyebrow: 'Email Dispatch', title: 'SendGrid / SMTP Gateway', icon: 'ti-mail', tone: accentTone(ACCENT2.blue),
    desc: 'Transactional owner notices, lease generation dispatch, and automated maintenance alert notifications.',
    connected: false, notice: 'Currently relying on shared UrbanNest mail relay. Connect your dedicated domain to enable custom DKIM/SPF verification.',
    menu: nav => [
      { label: 'View services', icon: 'ti-briefcase', onClick: () => nav('/pm-portal/account/services') },
    ],
  },
  {
    key: 'sms', eyebrow: 'SMS Gateway', title: 'Twilio SMS & Messaging', icon: 'ti-message-circle-2', tone: accentTone(ACCENT2.rose),
    desc: 'Two-factor verification codes, emergency maintenance SMS broadcasts, and instant showing reminders.',
    connected: true, details: [['ti-phone', 'Active Sender ID', '+1 (800) 492-NEST'], ['ti-chart-bar', 'Delivery Performance', { bar: 99.6 }]],
    menu: () => [
      { label: 'Copy sender ID', icon: 'ti-copy', onClick: () => copy('+1 (800) 492-NEST') },
    ],
  },
];
const LIVE = INTEGRATIONS.filter(i => i.connected).length;

// ── Page-specific layout only (every look comes from v2 tokens / components) ──
const S = {
  headBlock: UI2.pageHead.block,
  head:      { ...UI2.rowBetween(SP2.lg), alignItems: 'flex-start', flexWrap: 'wrap' },   // = Transactions / Subscription header
  title:     { ...T2.heroHeading, margin: 0 },
  sub:       { ...T2.lead, margin: `${SP2.xs}px 0 0` },
  tabs:      UI2.pageHead.next,
  intro:     { ...UI2.pageHead.next, ...UI2.rowBetween(SP2.md), flexWrap: 'wrap' },   // = Transactions intro row
  introText: { ...T2.body, color: C2.textSecondary, margin: 0 },
  introStats:UI2.row(SP2.xl),
  introStat: (first) => ({ ...UI2.row(SP2.md), ...(first ? {} : { paddingLeft: SP2.xl, borderLeft: `${SZ2.hairline}px solid ${C2.border}` }) }),   // hairline split (= row divider)
  section:   UI2.pageSection,
  // the rows list has no heading → no extra heading air above it (starts right under the header block, = Approvals panel)
  listSection: { ...UI2.pageSection, paddingTop: 0 },
  // integration rows — ONE grid for the list, every row a subgrid of it (columns line up across rows, = DataTable)
  list:      { display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1.3fr) minmax(0, 1fr) max-content max-content max-content', columnGap: SP2.xl },
  row:       (first) => ({ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'subgrid', alignItems: 'center', padding: pad(first ? 0 : SP2.xl, 0, SP2.xl) }),   // first row: no padding above (nothing to divide from)
  logo:      (tone) => ({ ...UI2.iconBox(SZ2.icon.lg, tone), fontSize: FS2.xl }),
  text:      { ...UI2.stack(SP2.sm), minWidth: 0 },
  eyebrow:   UI2.capsLabel,
  name:      { ...T2.sectionTitle, margin: 0 },                    // = Services "Included" row title
  desc:      { ...T2.label, margin: 0, ...UI2.clamp(2) },
  // detail column — label ABOVE value (= Subscription & Billing "Commercial Entity Info" rows: round icon box ·
  // caps label · value), so nothing wraps or overlaps in a narrow column
  details:   { ...UI2.stack(SP2.lg), minWidth: 0, paddingLeft: SP2.xl, borderLeft: `${SZ2.hairline}px solid ${C2.border}` },   // = Services row divider
  info:      { ...UI2.row(SP2.md), minWidth: 0 },
  infoIcon:  UI2.iconBox(SZ2.icon.md, TONES2.primary, { round: true }),
  infoBody:  { ...UI2.stack(SP2.xs), flex: 1, minWidth: 0 },
  infoCaps:  { ...UI2.capsLabel, ...UI2.truncate },
  infoValue: { ...UI2.text.title, ...UI2.truncate },
  barRow:    { ...UI2.row(SP2.sm), ...UI2.text.title },
  bar:       { ...UI2.progressTrack, flex: 1 },
  notice:    { ...T2.label, margin: 0, ...UI2.clamp(3) },
  noticeIcon:UI2.iconBox(SZ2.icon.md, TONES2.neutral, { round: true }),
  // status = standard v2 status (dot + coloured word, no tinted box) — UI2.statusPill + statusDot
  okStatus:  UI2.statusPill(TONES2.success),
  offStatus: UI2.statusPill(TONES2.neutral),
  acts:      { ...UI2.stack(SP2.md + SP2.xxs), alignItems: 'flex-start' },   // 14 — buttons → Disconnect (user-set)
  actRow:    UI2.row(SP2.sm),
  off:       { cursor: 'not-allowed' },   // not wired up yet: buttons keep their FULL look (never faded) — only the cursor + tooltip say so (= carousel arrow rule)
  danger:    { ...UI2.btn.link, color: C2.errorDark, cursor: 'not-allowed' },
  btnIcon:   UI2.btnIcon,
  // developer banner — same look + height as the Services promotion banner (its exact styles: promo / promoIn / promoText / promoBadge / promoActs)
  dev:       { ...UI2.darkCard, position: 'relative', overflow: 'hidden' },
  devIn:     { position: 'relative', display: 'flex', alignItems: 'center', gap: SP2.xxl, flexWrap: 'wrap' },
  devText:   { ...UI2.stack(SP2.sm), flex: '1 1 0', minWidth: SZ2.thumbFeature.w * 1.5 },
  devTagRow: UI2.row(SP2.sm),
  devTag:    { ...UI2.pill(TONES2.success), alignSelf: 'flex-start', gap: SP2.xs, textTransform: 'uppercase', letterSpacing: '0.04em' },
  devVer:    { ...T2.caption, color: ON.textMuted },
  devTitle:  { ...T2.heroTitle, fontSize: FS2.xxl, margin: 0 },
  devSub:    { ...T2.body, color: ON.textSoft, margin: 0 },
  devActs:   { ...UI2.stack(SP2.sm), minWidth: SZ2.thumbFeature.w },   // buttons stacked in a column (= Services) — gives the banner its height
};

// detail value: plain text · live "x ago" (dot + green word) · delivery bar
function DetailValue({ value }) {
  if (value && value.live) return <span style={UI2.statusPill(TONES2.success)}><span style={UI2.statusDot(TONES2.success)} />{value.live}</span>;
  if (value && value.bar != null) {
    return (
      <div style={S.barRow}>
        <div style={S.bar}><div style={UI2.progressFill(value.bar)} /></div>
        {value.bar}%
      </div>
    );
  }
  return <div style={S.infoValue} title={value}>{value}</div>;
}

export default function PMIntegrationsTab() {
  const navigate = useNavigate();

  return (
    <PMPageShell activeId="account-integrations" animate backdrop={<ImageBackdrop image={backdropArt} />} searchPlaceholder="Search portfolios, settings, or help…">
      <Breadcrumb items={[{ label: 'Account Settings', href: '/pm-portal/account/profile' }, { label: 'Integrations' }]} />

      {/* ── Header: title · subtitle → tabs → preview note │ stats ── */}
      <section style={S.headBlock}>
        <div style={S.head}>
          <div style={UI2.minWidth0}>
            <h1 style={S.title}>Integrations</h1>
            <p style={S.sub}>Manage third-party connections, payment providers, and automated messaging integrations.</p>
          </div>
        </div>
        <div style={S.tabs}><AccountSettingsTabs active="integrations" /></div>
        <div style={S.intro}>
          <p style={S.introText}>Preview — these connections are illustrative; nothing below is wired to a real provider yet.</p>
          {/* compact stats — the same icon · caps label · value block as the row details (not the big HeroStats figures) */}
          <div style={S.introStats}>
            {[
              ['ti-square-check', TONES2.success, 'Live Pipelines', `${LIVE} of ${INTEGRATIONS.length}`],
              ['ti-shield-check', TONES2.primary, 'Relay Health', '99.9%'],
            ].map(([icon, tone, label, value], i) => (
              <div key={label} style={S.introStat(i === 0)}>
                <span style={UI2.iconBox(SZ2.icon.md, tone, { round: true })} aria-hidden="true"><i className={`ti ${icon}`} /></span>
                <div style={S.infoBody}>
                  <span style={S.infoCaps}>{label}</span>
                  <span style={S.infoValue}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integration rows ── */}
      <section style={S.listSection}>
        <div style={S.list}>
          {INTEGRATIONS.map((it, i) => (
            <div key={it.key} className="un2-row-divided" style={S.row(i === 0)}>
              <span style={S.logo(it.tone)} aria-hidden="true"><i className={`ti ${it.icon}`} /></span>

              <div style={S.text}>
                <span style={S.eyebrow}>{it.eyebrow}</span>
                <h2 style={S.name}>{it.title}</h2>
                <p style={S.desc}>{it.desc}</p>
              </div>

              <div style={S.details}>
                {it.notice ? (
                  <div style={S.info}>
                    <span style={S.noticeIcon} aria-hidden="true"><i className="ti ti-info-circle" /></span>
                    <p style={S.notice}>{it.notice}</p>
                  </div>
                ) : it.details.map(([icon, k, v]) => (
                  <div key={k} style={S.info}>
                    <span style={S.infoIcon} aria-hidden="true"><i className={`ti ${icon}`} /></span>
                    <div style={S.infoBody}>
                      <span style={S.infoCaps}>{k}</span>
                      <DetailValue value={v} />
                    </div>
                  </div>
                ))}
              </div>

              {it.connected
                ? <span style={S.okStatus}><span style={UI2.statusDot(TONES2.success)} />Connected</span>
                : <span style={S.offStatus}><span style={UI2.statusDot(TONES2.neutral)} />Not Connected</span>}

              <div style={S.acts}>
                {it.connected ? (
                  <>
                    <div style={S.actRow}>
                      <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...S.off }} disabled title={`${it.title} configuration isn't wired up yet`}>Configure</button>
                      <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...S.off }} disabled title="Reconnect isn't wired up yet">Reconnect</button>
                    </div>
                    <button type="button" style={S.danger} disabled title="Disconnect isn't wired up yet">
                      <i className="ti ti-plug-x" style={S.btnIcon} aria-hidden="true" /> Disconnect
                    </button>
                  </>
                ) : (
                  <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...S.off }} disabled title="Email gateway connection isn't wired up yet">
                    <i className="ti ti-plug-connected" style={S.btnIcon} aria-hidden="true" /> Connect Gateway
                  </button>
                )}
              </div>

              <OptionsMenu inline items={it.menu(navigate)} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Developer banner ── */}
      <section style={S.section}>
        <div style={S.dev}>
          <NavyGlow variant={3} pattern={4} />   {/* same colours + flowing-lines pattern as the Services promotion banner */}
          <div style={S.devIn}>
            <div style={S.devText}>
              <div style={S.devTagRow}>
                <span style={S.devTag}><i className="ti ti-code" aria-hidden="true" /> Developer Protocol</span>
                <span style={S.devVer}>v2.4 LTS</span>
              </div>
              <h2 style={S.devTitle}>Custom Webhooks &amp; Direct API Credentials</h2>
              <p style={S.devSub}>Connect custom ERP endpoints, configure HMAC payload signing, or retrieve scoped production API keys for bespoke owner portals.</p>
            </div>
            <div style={S.devActs}>
              <button type="button" className="un2-btn" style={{ ...UI2.btn.light, ...S.off }} disabled title="Webhook endpoints aren't wired up yet">
                <i className="ti ti-plug-connected" style={S.btnIcon} aria-hidden="true" /> Configure Endpoints
              </button>
              <button type="button" className="un2-btn" style={{ ...UI2.btn.ghostOnDark, ...S.off }} disabled title="API key management isn't wired up yet">
                <i className="ti ti-key" style={S.btnIcon} aria-hidden="true" /> Manage API Keys
              </button>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </PMPageShell>
  );
}
