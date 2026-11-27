// PMServices.jsx — PM Portal: Account Settings → Services tab BODY (Design System v2)
// Rendered by PMSubscriptionPage (which owns the catalog / plan data, the cart and the promotion + service-detail
// modals) inside its PMPageShell frame — this file is presentation only.
//
// Redesign 2 (client found the first pass cluttered) — each section gets ONE clear presentation:
//   Header stats   — PMServicesStats (below) = this page's own stats card (design 6075650184646956507), rendered by PMSubscriptionPage IN THE PAGE
//                    HEADER under the title / subtitle (= Landlord Dashboard hero), not under the tabs (user 2026-11-27)
//   Gate notice    — plan gate as a soft tinted notice row (UI2.tintRow), only when there is no plan
//   Included       — open section heading (title · count pill · note │ Manage Plan Limits — no white card around the section,
//                    user 2026-11-27); services as a 2-up grid of MediaCards (ui/MediaCard — v2 standard: flush photo │ status · title · text · btnXs actions) — no tags piled on the photo
//   Add-Ons        — open section heading + the standard Carousel of white photo cards (one tag on the photo,
//                    price + caption on a borderless tint row, full-width action)
//   Promotion      — navy banner (NavyGlow): copy + actions on the left, the three figures in one frosted panel
//   More From UN   — same as Add-Ons: open heading + Carousel of the same photo card (glass Coming Soon tag ·
//                    title · description · footer: program icon + tag │ Notify Me)
//
// Not-wired buttons keep their full look (no fade) — disabled + cursor not-allowed + tooltip.
// Sample services (when the real catalog is empty) carry a SAMPLE tag and never buy anything — same rule as v1.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid } from '../../../components/layout';
import { NavyGlow, TextLink, Carousel, MediaCard, PhotoCard } from '../../../components/ui';
import { C2, TONES2, ACCENT2, accentTone, FS2, FW2, R2, SP2, SZ2, T2, UI2, pad } from '../../../constants';

const ON = C2.onDark;
// Listing Promotion banner switched off for now (user 2026-11-27) — code kept as is; flip to true to show it again
const SHOW_PROMO_BANNER = false;
const OFF = { cursor: 'not-allowed' };   // not wired / gated: full look, only the cursor + tooltip say so

const S = {
  // page-section rhythm, roomier on this page only (user 2026-11-27: "tightly packed"): shell gap 16 + 24 above each
  // section = 40 between sections, heading → content 20. Shared UI2.pageSection itself is unchanged.
  section:    { ...UI2.pageSection, paddingTop: SP2.xxl, gap: SP2.xl },
  // FIRST section under the tabs: header block (8) + shell gap (16) only = 24, same gap as Subscription & Billing under its tabs
  overview:   { ...UI2.pageSection, paddingTop: 0, gap: SP2.xl },
  // ── gate notice (no plan yet) — borderless tinted row, not a second card
  gate:       { ...UI2.tintRow, flexWrap: 'wrap', padding: pad(SP2.md, SP2.lg) },
  gateIcon:   UI2.iconBox(SZ2.icon.md, TONES2.primary, { round: true }),
  gateText:   { ...T2.body, color: C2.textPrimary, flex: '1 1 0', minWidth: SZ2.thumbFeature.w, margin: 0 },
  // ── open section heading (Add-Ons)
  // heading + count sit on ONE text baseline (centring an 18px Playfair title against 13px Inter looks off)
  secTitleRow:{ ...UI2.row(SP2.md), flexWrap: 'wrap', alignItems: 'baseline' },
  secTitle:   { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  secSub:     { ...UI2.text.meta, margin: `${SP2.xs}px 0 0` },
  // section counts = the table status style (dot + coloured 13px Regular word, NO box) — user 2026-11-27
  // the word carries the baseline (alignItems baseline); the dot stays centred on the word
  count:      { ...UI2.statusPill(TONES2.primary), alignItems: 'baseline' },
  countDot:   { ...UI2.statusDot(TONES2.primary), alignSelf: 'center' },
  // ── Included (open heading + MediaCard grid)
  // baseline: Manage Plan Limits sits on the SAME text line as the section title (not at the block's top edge)
  secHead:    { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', alignItems: 'baseline' },
  // the bundled Included photos (shared Landlord art) have an "Active" badge painted in their bottom-left —
  // draw the photo taller than the tile, anchored to the top, so that strip is cropped away (our own status shows instead)
  incImg:     { height: '128%', objectPosition: 'center top' },
  sampleTag:  UI2.tag(TONES2.neutral),
  // ── Add-on cards — built on the Portfolio PropertyCard recipe (the confirmed v2 photo card):
  //   photo inset SP2.xs with top-only radius · glass tag on the photo (UI2.photoTagGlass) · body pad(md, lg, lg) with
  //   SP2.lg between zones · title + description (list-row pair) · price footer above a hairline with the btnXs action
  // footer: price + caption on the left │ compact action on the right (wraps under on a very narrow card)
  priceInfo:  { ...UI2.stack(SP2.xs), minWidth: 0 },
  priceLine:  { ...UI2.row(SP2.xs), alignItems: 'baseline' },
  price:      T2.cardFigure,   // standard small figure — 16px · 400
  priceUnit:  UI2.text.label,
  caption:    UI2.context,
  captionIcon:{ color: C2.primary },
  // card actions = the standard extra-small button (UI2.btnXs — user: full-width 40px buttons were bulky on these cards)
  cardBtn:    (kind) => ({ ...(kind === 'brand' ? UI2.btn.brand : UI2.btn.soft), ...UI2.btnXs, flexShrink: 0 }),
  // ── promotion banner
  promo:      { ...UI2.darkCard, position: 'relative', overflow: 'hidden', padding: pad(SP2.xxl, SP2.xxl) },
  promoIn:    { position: 'relative', display: 'flex', alignItems: 'center', gap: SP2.xxl, flexWrap: 'wrap' },
  promoText:  { ...UI2.stack(SP2.md), flex: '1 1 0', minWidth: SZ2.thumbFeature.w * 1.5 },
  promoBadge: { ...UI2.pill(TONES2.success), alignSelf: 'flex-start', gap: SP2.xs, textTransform: 'uppercase', letterSpacing: '0.04em' },
  promoTitle: { ...T2.heroTitle, fontSize: FS2.xxl, margin: 0 },
  promoSub:   { ...T2.body, color: ON.textSoft, margin: 0, maxWidth: SZ2.heroContentMax },
  promoActs:  { ...UI2.row(SP2.sm), flexWrap: 'wrap', marginTop: SP2.xs },
  promoNote:  { ...T2.caption, color: ON.textMuted },
  promoStats: { ...UI2.darkGlass, display: 'flex', borderRadius: R2.xl, padding: pad(SP2.lg, 0) },
  promoStat:  (first) => ({ ...UI2.stack(SP2.xs), padding: pad(0, SP2.xl), ...(first ? {} : { borderLeft: `${SZ2.hairline}px solid ${ON.divider}` }) }),
  promoIcon:  { fontSize: FS2.xl, color: ON.textMuted },
  promoVal:   { ...T2.kpiValue, color: C2.white },
  promoLbl:   { ...T2.eyebrow, color: ON.textMuted },
  // ── More From UrbanNest — same card as Add-Ons (card · cardPhoto · cardBody · cardHead · priceFoot); its footer
  //    holds the program icon + tag line instead of a price
  extIcon:    (i) => UI2.iconBox(SZ2.icon.sm, accentTone([ACCENT2.blue, ACCENT2.teal, ACCENT2.violet][i % 3]), { round: true }),
  extInfo:    { ...UI2.row(SP2.sm), flex: 1, minWidth: 0 },
  extTag:     { ...UI2.context, display: 'block', minWidth: 0, ...UI2.truncate },   // block so the … ellipsis works
  // footer on ONE line, everything centred (icon 28 = btnXs 28); a long tag line truncates instead of pushing the button down
  btnIcon:    UI2.btnIcon,
};

// ── Header stats (Services tab) — THIS PAGE ONLY (not the shared HeroStats), design Downloads/6075650184646956507.jpg
//    (user 2026-11-27): ONE card (UI2.card shadow) with the design's background — white → lightest-blue wash + ONE
//    smooth light-blue swoosh rising into the bottom-right corner (not a wave) ·
//    5 equal columns split by hairlines · rounded-SQUARE tinted icon box · sentence-case label (12 grey) · bold
//    value (20 · 600) · the design's own labels.
const HS = {
  card:  { ...UI2.card, background: `linear-gradient(90deg, ${C2.white} 0%, ${C2.primaryWash} 55%, ${C2.primaryTint} 100%)`,
           borderRadius: R2.panel,   // 10 (user 2026-11-27)
           position: 'relative', overflow: 'hidden', padding: pad(SP2.lg, SP2.xl) },
  swoosh:{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '100%', pointerEvents: 'none' },
  row:   { position: 'relative', display: 'flex', alignItems: 'center' },
  item:  (first) => ({ ...UI2.row(SP2.md), flex: '1 1 0', minWidth: 0, padding: pad(0, SP2.xl, 0, first ? 0 : SP2.xl),
                       ...(first ? {} : { borderLeft: `${SZ2.hairline}px solid ${C2.border}` }) }),
  icon:  (tone) => UI2.iconBox(SZ2.icon.lg, tone),   // rounded square (not round)
  body:  { ...UI2.stack(SP2.xxs), minWidth: 0 },
  label: { ...UI2.text.label, fontWeight: FW2.medium, ...UI2.truncate },
  value: T2.kpiValue,   // the standard 20 · 400 figure (user 2026-11-27)
};
export function PMServicesStats({ ownedCount, subIncludedCount, subAddonCount, availableAddons, activeCampaignsCount }) {
  const stats = [
    ['ti-stack-2',      TONES2.primary,             'Active Services',   ownedCount],
    ['ti-stack-3',      accentTone(ACCENT2.violet), 'In Plan',           subIncludedCount],
    ['ti-puzzle',       accentTone(ACCENT2.blue),   'Active Add-ons',    subAddonCount],
    ['ti-circle-plus',  accentTone(ACCENT2.teal),   'Available Add-ons', availableAddons],
    ['ti-speakerphone', accentTone(ACCENT2.rose),   'Active Campaigns',  activeCampaignsCount],
  ];
  return (
    <div style={HS.card} aria-label="Services summary">
      {/* the design's corner swoosh: one smooth curve from the bottom edge up to ~60% on the right edge */}
      <svg style={HS.swoosh} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="un2-svc-swoosh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C2.chipBlue} stopOpacity="0" />
            <stop offset="100%" stopColor={C2.chipBlue} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M0,100 C45,92 75,70 100,40 L100,100 Z" fill="url(#un2-svc-swoosh)" />
      </svg>
      <div style={HS.row}>
        {stats.map(([icon, tone, label, value], i) => (
          <div key={label} style={HS.item(i === 0)}>
            <span style={HS.icon(tone)} aria-hidden="true"><i className={`ti ${icon}`} /></span>
            <div style={HS.body}>
              <span style={HS.label}>{label}</span>
              <span style={HS.value}>{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PMServices({
  buyGateClosed, subscription, sub, activeCampaignsCount,
  includedReal, displayIncluded, displayAddons, addonsAvailable, addonsAdded, externalPrograms,
  visualIncluded, visualAddon, flavorFor, priceUnitLabels,
  isInCart, onOpenService, onAddToCart, onOpenPromo, activePromoSub, minPromoPrice, promoTierCount,
}) {
  const navigate = useNavigate();
  // shown under the Included title when its real list is empty and sample cards stand in
  const includedNote = includedReal > 0 ? null
    : `${subscription ? 'Your current plan has no services included by default.' : 'Subscribe to a plan to see what’s included.'} Showing sample cards below for preview.`;
  const sampleTip = 'Sample service — not part of your real plan';

  return (
    <>
      {/* ── plan gate (no plan yet) — the stats now live in the page header (PMServicesStats) ── */}
      {buyGateClosed && (
        <section style={S.overview}>
          <div style={S.gate}>
            <span style={S.gateIcon} aria-hidden="true"><i className="ti ti-info-circle" /></span>
            <p style={S.gateText}><strong>Subscribe to a Plan first</strong> — buying an add-on service requires an active subscription.</p>
            <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => navigate('/pm-portal/account/subscription')}>
              Go to Subscription &amp; Billing <i className="ti ti-arrow-right" style={S.btnIcon} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* ── Included with Your Plan — one card, 2-up tinted tiles ── */}
      <section style={buyGateClosed ? S.section : S.overview}>   {/* first section when there is no gate notice → same gap under the tabs as Subscription & Billing */}
        <div style={S.secHead}>
          <div style={UI2.minWidth0}>
            <div style={S.secTitleRow}>
              <h2 style={S.secTitle}>Included with Your Plan</h2>
              <span style={S.count}><span style={S.countDot} /><span>{includedReal} Active Service{includedReal === 1 ? '' : 's'}{subscription && sub?.plan_name ? ` • ${sub.plan_name}` : ''}</span></span>
            </div>
            {includedNote && <p style={S.secSub}>{includedNote}</p>}
          </div>
          <TextLink onClick={() => navigate('/pm-portal/account/subscription')}>Manage Plan Limits</TextLink>
        </div>
          <Grid layout="two" as="div">
            {displayIncluded.map((s, i) => {
              const sample = !!s.isSample;
              return (
                <MediaCard
                  key={`inc-${s.id}`}
                  image={s.image || visualIncluded(i)}
                  imageStyle={S.incImg}
                  status={<>
                    <span style={UI2.statusPill(TONES2.success)}><span style={UI2.statusDot(TONES2.success)} />Active</span>
                    {sample && <span style={S.sampleTag}>SAMPLE</span>}
                  </>}
                  title={s.name}
                  description={s.short_description}
                  actions={<>
                      <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...UI2.btnXs, ...OFF }} disabled
                        title={sample ? sampleTip : "Service configuration isn't built yet"}>Configure</button>
                      <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnXs, ...(sample ? OFF : {}) }} disabled={sample}
                        title={sample ? sampleTip : undefined} onClick={() => !sample && onOpenService(s)}>
                        View Details <i className="ti ti-arrow-right" style={UI2.btnXsIcon} aria-hidden="true" />
                      </button>
                  </>}
                />
              );
            })}
          </Grid>
      </section>

      {/* ── Add-Ons for Your Plan — photo cards carousel ── */}
      <section style={S.section}>
        <div>
          <div style={S.secTitleRow}>
            <h2 style={S.secTitle}>Add-Ons for Your Plan</h2>
            <span style={S.count}><span style={S.countDot} /><span>{addonsAvailable} Available • {addonsAdded} Added</span></span>
          </div>
          <p style={S.secSub}>Extend your plan with optional add-on services — activate instantly, cancel anytime.</p>
        </div>
        <Carousel label="add-on services" itemWidth={Carousel.cols(3)} minItemWidth={SZ2.thumbFeature.w}>
          {displayAddons.map((s, i) => {
            const sample = !!s.isSample;
            const inCart = !sample && isInCart(s.id);
            const flavor = flavorFor(i);
            const priceBig = sample ? s.priceDisplay : `$${(Number(s.price) || 0).toFixed(2)}`;
            const priceUnit = sample ? s.priceUnitDisplay : (priceUnitLabels[s.price_unit] || '');
            let btn;
            if (sample) btn = <button type="button" style={{ ...S.cardBtn('soft'), ...OFF }} disabled title={sampleTip}>{buyGateClosed ? 'Subscribe First' : '+ Add to Plan'}</button>;
            else if (s.owned) btn = <button type="button" style={{ ...S.cardBtn('soft'), ...OFF }} disabled title="Service configuration isn't built yet">Configure Service</button>;
            else btn = (
              <button type="button" className="un2-btn" style={{ ...S.cardBtn(inCart ? 'brand' : 'soft'), ...(buyGateClosed && !inCart ? OFF : {}) }}
                disabled={buyGateClosed && !inCart} title={buyGateClosed ? 'Subscribe to a plan first to buy add-on services' : undefined}
                onClick={() => { if (!inCart && !buyGateClosed) onAddToCart(s); }}>
                {inCart ? '✓ In Cart' : buyGateClosed ? 'Subscribe First' : '+ Add to Plan'}
              </button>
            );
            return (
              <PhotoCard
                key={`addon-${s.id}`}
                image={s.image || visualAddon(i)}
                tags={<>
                  {sample && <span style={UI2.photoTagGlass}>Sample</span>}
                  <span style={UI2.photoTagGlass}>{s.owned ? '✓ Added' : flavor.ribbon}</span>
                </>}
                title={s.name}
                description={s.short_description}
                foot={(
                  <div style={S.priceInfo}>
                    <span style={S.priceLine}><span style={S.price}>{priceBig}</span><span style={S.priceUnit}>{priceUnit}</span></span>
                    <span style={S.caption}><i className="ti ti-sparkles" style={S.captionIcon} aria-hidden="true" />{flavor.caption}</span>
                  </div>
                )}
                action={btn}
              />
            );
          })}
        </Carousel>
      </section>

      {/* ── Listing Promotion banner — HIDDEN for now (user 2026-11-27); set SHOW_PROMO_BANNER = true to bring it back ── */}
      {SHOW_PROMO_BANNER && (
      <section style={S.section}>
        <div style={S.promo}>
          <NavyGlow variant={3} pattern={4} />   {/* banner colours (deep navy → royal blue, glow top-right) + flowing-lines pattern */}
          <div style={S.promoIn}>
            <div style={S.promoText}>
              <span style={S.promoBadge}><i className="ti ti-building-store" aria-hidden="true" /> UrbanNest Marketplace</span>
              <h2 style={S.promoTitle}>Get your listings seen first.</h2>
              <p style={S.promoSub}>Buy a Listing Promotion plan once, then apply it free on any eligible listing later — no extra charge at publish time (“Already Paid”).</p>
              <div style={S.promoActs}>
                <button type="button" className="un2-btn" style={UI2.btn.light} onClick={onOpenPromo}>
                  {activePromoSub ? 'Explore More Plans' : 'Explore Promotion Plans'} <i className="ti ti-arrow-right" style={S.btnIcon} aria-hidden="true" />
                </button>
                <button type="button" className="un2-btn" style={UI2.btn.ghostOnDark} onClick={() => navigate('/pm-portal/marketing/listings')}>
                  <i className="ti ti-eye" style={S.btnIcon} aria-hidden="true" /> Browse Active Inventory
                </button>
              </div>
              {activePromoSub && (
                <span style={S.promoNote}>
                  ✓ Already Paid — {activePromoSub.plan_detail?.name || activePromoSub.plan_name || 'Plan'}
                  {activePromoSub.expires_at ? ` · valid through ${new Date(activePromoSub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                </span>
              )}
            </div>
            <div style={S.promoStats}>
              {[
                ['ti-speakerphone', activeCampaignsCount, 'Active slots'],
                ['ti-tag', minPromoPrice !== null ? `$${minPromoPrice.toFixed(0)}` : '—', 'Starting at'],
                ['ti-layers-subtract', promoTierCount, 'Plan tiers'],
              ].map(([icon, v, l], i) => (
                <div key={l} style={S.promoStat(i === 0)}>
                  <i className={`ti ${icon}`} style={S.promoIcon} aria-hidden="true" />
                  <div style={S.promoVal}>{v}</div>
                  <div style={S.promoLbl}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── More From UrbanNest — same open heading + carousel + card as Add-Ons ── */}
      <section style={S.section}>
        <div>
          <div style={S.secTitleRow}>
            <h2 style={S.secTitle}>More From UrbanNest</h2>
            <span style={S.count}><span style={S.countDot} /><span>Early Access Pipeline</span></span>
          </div>
          <p style={S.secSub}>Exclusive resident perks and auxiliary revenue opportunities designed for your portfolio.</p>
        </div>
        <Carousel label="more from UrbanNest" itemWidth={Carousel.cols(3)} minItemWidth={SZ2.thumbFeature.w}>
          {externalPrograms.map((p, i) => (
            <PhotoCard
              key={p.key}
              image={p.image}
              tags={<span style={UI2.photoTagGlass}>Coming Soon</span>}
              title={p.title}
              description={p.desc}
              footAlign="center"
              foot={(
                <div style={S.extInfo}>
                  <span style={S.extIcon(i)} aria-hidden="true"><i className={`ti ${p.icon}`} /></span>
                  <span style={S.extTag}>{p.tag}</span>
                </div>
              )}
              action={(
                <button type="button" className="un2-btn" style={{ ...S.cardBtn('soft'), ...OFF }} disabled title="Not available yet">
                  <i className="ti ti-bell" style={UI2.btnXsIcon} aria-hidden="true" /> Notify Me
                </button>
              )}
            />
          ))}
        </Carousel>
      </section>
    </>
  );
}
