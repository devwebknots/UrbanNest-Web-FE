// PMServices.jsx — PM Portal: Account Settings → Services tab BODY (Design System v2)
// Layout: Downloads/image 185.png. Rendered by PMSubscriptionPage (which owns the catalog / plan data, the cart
// and the promotion + service-detail modals) inside its PMPageShell frame — this file is presentation only:
//
//   gate bar (no plan yet)  ·  HeroStats (5 stats, the shared stats row)
//   Included with Your Plan — rows: photo │ title + text │ Configure / View Details
//   Add-Ons for Your Plan   — carousel of photo cards (ribbon · price · Subscribe First / + Add to Plan)
//   Listing Promotion banner (navy, NavyGlow) — badge · headline · 3 figures · 2 actions
//   More From UrbanNest     — carousel of Coming Soon cards (Notify Me)
//
// Sample services (when the real catalog is empty) carry a SAMPLE tag and never buy anything — same rule as v1.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroStats, NavyGlow, TextLink, Carousel } from '../../../components/ui';
import { C2, TONES2, ACCENT2, accentTone, FS2, FW2, SP2, SZ2, T2, UI2, pad } from '../../../constants';

const ON = C2.onDark;

const S = {
  // gate bar
  gate:       { ...UI2.card, ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', padding: pad(SP2.md, SP2.lg) },
  gateText:   { ...UI2.row(SP2.md), ...T2.body, color: C2.textPrimary },
  gateIcon:   { fontSize: FS2.xl, color: C2.primary },
  // section headers
  section:    UI2.pageSection,     // standard v2 page-section rhythm (heading → content 16 · extra air above) — same as Approvals / Listings
  secHead:    { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', alignItems: 'flex-start' },
  secTitleRow:{ ...UI2.row(SP2.md), flexWrap: 'wrap' },
  secTitle:   { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  secSub:     { ...UI2.text.meta, fontStyle: 'italic', margin: `${SP2.xs}px 0 0` },
  pillOk:     UI2.pill(TONES2.success),
  pillInfo:   UI2.pill(TONES2.primary),
  // included rows
  incRow:     { display: 'grid', gridTemplateColumns: `minmax(0, ${SZ2.thumbFeature.w * 1.5}px) minmax(0, 1fr) auto`, gap: SP2.xl, alignItems: 'center', padding: pad(SP2.md, 0) },
  incPhoto:   { ...UI2.photoTile, height: SZ2.thumbFeature.h },
  // the bundled Included photos (shared Landlord art) have an "Active" badge painted in their bottom-left —
  // draw the photo taller than the tile, anchored to the top, so that strip is cropped away (our own tag shows instead)
  incImg:     { ...UI2.photoMedia, height: '128%', objectPosition: 'center top' },
  incText:    { ...UI2.stack(SP2.xs), minWidth: 0 },
  incTitle:   { ...T2.sectionTitle, margin: 0 },
  incDesc:    { ...T2.label, margin: 0, ...UI2.clamp(2) },
  incActs:    { ...UI2.stack(SP2.sm), paddingLeft: SP2.xl, borderLeft: `${SZ2.hairline}px solid ${C2.border}` },
  incBtn:     (kind, off) => ({ ...(kind === 'brand' ? UI2.btn.brand : UI2.btn.soft), ...UI2.btnSm, width: SZ2.btnSm.w * 2, justifyContent: 'center', ...(off ? UI2.btnOff : {}) }),
  // photo tags
  tagTL:      { ...UI2.tag(TONES2.neutral), position: 'absolute', top: SP2.sm, left: SP2.sm, background: C2.white },
  tagBL:      { ...UI2.pill(TONES2.neutral), position: 'absolute', bottom: SP2.sm, left: SP2.sm, background: C2.white, gap: SP2.xs },
  tagTR:      { ...UI2.pill(TONES2.neutral), position: 'absolute', top: SP2.sm, right: SP2.sm, background: C2.white, color: C2.textPrimary },
  // carousels
  card:       { ...UI2.card, padding: SP2.md, width: '100%', ...UI2.stack(SP2.sm) },   // width comes from the Carousel slot
  cardPhoto:  { ...UI2.photoTile, height: SZ2.thumbFeature.h },
  cardTitle:  { ...UI2.text.titleLg, margin: 0, ...UI2.truncate },
  cardDesc:   { ...T2.label, margin: 0, ...UI2.clamp(3) },
  priceRow:   { ...UI2.rowBetween(SP2.sm), marginTop: 'auto', paddingTop: SP2.sm, borderTop: `${SZ2.hairline}px solid ${C2.border}` },
  price:      T2.kpiValue,
  priceUnit:  { fontSize: FS2.sm, fontWeight: FW2.regular, color: C2.textSecondary },
  caption:    { fontSize: FS2.sm, fontWeight: FW2.medium, color: TONES2.success.fg, textAlign: 'right' },
  cardBtn:    (kind, off) => ({ ...(kind === 'brand' ? UI2.btn.brand : UI2.btn.soft), width: '100%', justifyContent: 'center', ...(off ? UI2.btnOff : {}) }),
  extHead:    UI2.row(SP2.md),
  extIcon:    (i) => UI2.iconBox(SZ2.icon.md, accentTone([ACCENT2.blue, ACCENT2.teal, ACCENT2.violet][i % 3]), { round: true }),
  extTag:     UI2.text.meta,
  // promotion banner
  promo:      { ...UI2.darkCard, position: 'relative', overflow: 'hidden' },
  promoIn:    { position: 'relative', display: 'flex', alignItems: 'center', gap: SP2.xxl, flexWrap: 'wrap' },
  promoText:  { ...UI2.stack(SP2.sm), flex: '1 1 0', minWidth: SZ2.thumbFeature.w * 1.5 },
  promoBadge: { ...UI2.pill(TONES2.success), alignSelf: 'flex-start', gap: SP2.xs, textTransform: 'uppercase', letterSpacing: '0.04em' },
  promoTitle: { ...T2.heroTitle, fontSize: FS2.xxl, margin: 0 },
  promoSub:   { ...T2.body, color: ON.textSoft, margin: 0 },
  promoStats: { display: 'flex', gap: SP2.xxl, paddingLeft: SP2.xxl, borderLeft: `${SZ2.hairline}px solid ${ON.divider}` },
  promoVal:   { ...T2.kpiValue, color: C2.white },
  promoLbl:   { ...T2.eyebrow, color: ON.textMuted, marginTop: SP2.xs },
  promoActs:  { ...UI2.stack(SP2.sm), minWidth: SZ2.thumbFeature.w },
  promoNote:  { ...T2.caption, color: ON.textMuted },
  btnIcon:    UI2.btnIcon,
};

const Photo = ({ src, style, imgStyle = UI2.photoMedia, children }) => (
  <div className="un2-zoom" style={style}>
    {src && <img src={src} alt="" style={imgStyle} />}
    {children}
  </div>
);

export default function PMServices({
  buyGateClosed, subscription, sub, ownedCount, subIncludedCount, subAddonCount, availableAddons, activeCampaignsCount,
  includedReal, displayIncluded, displayAddons, addonsAvailable, addonsAdded, externalPrograms,
  visualIncluded, visualAddon, flavorFor, priceUnitLabels,
  isInCart, onOpenService, onAddToCart, onOpenPromo, activePromoSub, minPromoPrice, promoTierCount,
}) {
  const navigate = useNavigate();
  // shown under a section title when its real list is empty and sample cards stand in
  const includedNote = includedReal > 0 ? null
    : `${subscription ? 'Your current plan has no services included by default.' : 'Subscribe to a plan to see what’s included.'} Showing sample cards below for preview.`;

  return (
    <>
      {/* overview: plan gate (if any) + the stats row, one section */}
      <section style={S.section}>
      {buyGateClosed && (
        <div style={S.gate}>
          <span style={S.gateText}>
            <i className="ti ti-info-circle" style={S.gateIcon} aria-hidden="true" />
            <span><strong>Subscribe to a Plan first</strong> — buying an add-on service requires an active subscription.</span>
          </span>
          <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => navigate('/pm-portal/account/subscription')}>
            Go to Subscription &amp; Billing <i className="ti ti-arrow-right" style={S.btnIcon} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* the shared stats row (same as Listings / Approvals) */}
      <HeroStats className="un2-phero-stats un2-phero-stats-fill" stats={[
        { icon: 'ti-stack-2',      tone: TONES2.primary,               label: 'Total Active Services', value: ownedCount },
        { icon: 'ti-stack-3',      tone: accentTone(ACCENT2.violet),   label: 'Included with Plan',    value: subIncludedCount },
        { icon: 'ti-puzzle',       tone: accentTone(ACCENT2.blue),     label: "Active Add-on's",       value: subAddonCount },
        { icon: 'ti-circle-plus',  tone: TONES2.success,               label: "Available Add-on's",    value: availableAddons },
        { icon: 'ti-speakerphone', tone: accentTone(ACCENT2.rose),     label: 'Active Campaigns',      value: activeCampaignsCount },
      ]} />
      </section>

      {/* ── Included with Your Plan ── */}
      <section style={S.section}>
        <div style={S.secHead}>
          <div>
            <div style={S.secTitleRow}>
              <h2 style={S.secTitle}>Included with Your Plan</h2>
              <span style={S.pillOk}>{includedReal} Active Service{includedReal === 1 ? '' : 's'}{subscription && sub?.plan_name ? ` • ${sub.plan_name}` : ''}</span>
            </div>
            {includedNote && <p style={S.secSub}>{includedNote}</p>}
          </div>
          <TextLink onClick={() => navigate('/pm-portal/account/subscription')}>Manage Plan Limits</TextLink>
        </div>
        <div>
          {displayIncluded.map((s, i) => {
            const sample = !!s.isSample;
            return (
              <div key={`inc-${s.id}`} className="un2-row-divided" style={S.incRow}>
                <Photo src={s.image || visualIncluded(i)} style={S.incPhoto} imgStyle={S.incImg}>
                  {sample && <span style={S.tagTL}>Sample</span>}
                  <span style={S.tagBL}><span style={UI2.statusDot(TONES2.success)} />Active</span>
                </Photo>
                <div style={S.incText}>
                  <h3 style={S.incTitle}>{s.name}</h3>
                  <p style={S.incDesc}>{s.short_description}</p>
                </div>
                <div style={S.incActs}>
                  <button type="button" className="un2-btn" style={S.incBtn('soft', true)} disabled
                    title={sample ? 'Sample service — not part of your real plan' : "Service configuration isn't built yet"}>Configure</button>
                  <button type="button" className="un2-btn" style={S.incBtn('brand', sample)} disabled={sample}
                    title={sample ? 'Sample service — not part of your real plan' : undefined} onClick={() => !sample && onOpenService(s)}>View Details</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Add-Ons for Your Plan ── */}
      <section style={S.section}>
        <div>
          <div style={S.secTitleRow}>
            <h2 style={S.secTitle}>Add-Ons for Your Plan</h2>
            <span style={S.pillOk}>{addonsAvailable} Available • {addonsAdded} Added</span>
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
            if (sample) btn = <button type="button" style={S.cardBtn('soft', true)} disabled title="Sample service — not part of your real plan">{buyGateClosed ? 'Subscribe First' : '+ Add to Plan'}</button>;
            else if (s.owned) btn = <button type="button" style={S.cardBtn('soft', true)} disabled title="Service configuration isn't built yet">Configure Service</button>;
            else btn = (
              <button type="button" className="un2-btn" style={S.cardBtn(inCart ? 'brand' : 'soft', buyGateClosed && !inCart)}
                disabled={buyGateClosed && !inCart} title={buyGateClosed ? 'Subscribe to a plan first to buy add-on services' : undefined}
                onClick={() => { if (!inCart && !buyGateClosed) onAddToCart(s); }}>
                {inCart ? '✓ In Cart' : buyGateClosed ? 'Subscribe First' : '+ Add to Plan'}
              </button>
            );
            return (
              <article key={`addon-${s.id}`} style={S.card}>
                <Photo src={s.image || visualAddon(i)} style={S.cardPhoto}>
                  {sample && <span style={S.tagTL}>Sample</span>}
                  <span style={S.tagTR}>{s.owned ? '✓ Added' : flavor.ribbon}</span>
                </Photo>
                <h3 style={S.cardTitle}>{s.name}</h3>
                <p style={S.cardDesc}>{s.short_description}</p>
                <div style={S.priceRow}>
                  <span style={S.price}>{priceBig} <span style={S.priceUnit}>{priceUnit}</span></span>
                  <span style={S.caption}>{flavor.caption}</span>
                </div>
                {btn}
              </article>
            );
          })}
        </Carousel>
      </section>

      {/* ── Listing Promotion banner ── */}
      <section style={S.section}>
      <div style={S.promo}>
        <NavyGlow variant={3} pattern={4} />   {/* banner colours (deep navy → royal blue, glow top-right) + the design's flowing-lines pattern */}
        <div style={S.promoIn}>
          <div style={S.promoText}>
            <span style={S.promoBadge}><i className="ti ti-building-store" aria-hidden="true" /> UrbanNest Marketplace</span>
            <h2 style={S.promoTitle}>Get your listings seen first.</h2>
            <p style={S.promoSub}>Buy a Listing Promotion plan once, then apply it free on any eligible listing later — no extra charge at publish time (“Already Paid”).</p>
          </div>
          <div style={S.promoStats}>
            {[[activeCampaignsCount, 'Active slots'], [minPromoPrice !== null ? `$${minPromoPrice.toFixed(0)}` : '—', 'Starting at'], [promoTierCount, 'Plan tiers']].map(([v, l]) => (
              <div key={l}><div style={S.promoVal}>{v}</div><div style={S.promoLbl}>{l}</div></div>
            ))}
          </div>
          <div style={S.promoActs}>
            <button type="button" className="un2-btn" style={UI2.btn.light} onClick={onOpenPromo}>
              {activePromoSub ? 'Explore More Plans' : 'Explore Promotion Plans'} <i className="ti ti-arrow-right" style={S.btnIcon} aria-hidden="true" />
            </button>
            <button type="button" className="un2-btn" style={UI2.btn.ghostOnDark} onClick={() => navigate('/pm-portal/marketing/listings')}>
              <i className="ti ti-eye" style={S.btnIcon} aria-hidden="true" /> Browse Active Inventory
            </button>
            {activePromoSub && (
              <span style={S.promoNote}>
                ✓ Already Paid — {activePromoSub.plan_detail?.name || activePromoSub.plan_name || 'Plan'}
                {activePromoSub.expires_at ? ` · valid through ${new Date(activePromoSub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      </section>

      {/* ── More From UrbanNest ── */}
      <section style={S.section}>
        <div style={S.secHead}>
          <div>
            <h2 style={S.secTitle}>More From UrbanNest</h2>
            <p style={{ ...T2.label, margin: `${SP2.xs}px 0 0` }}>Exclusive resident perks and auxiliary revenue opportunities designed for your portfolio.</p>
          </div>
          <span style={{ ...S.pillInfo, textTransform: 'uppercase' }}>Early Access Pipeline</span>
        </div>
        <Carousel label="more from UrbanNest" itemWidth={Carousel.cols(3)} minItemWidth={SZ2.thumbFeature.w}>
          {externalPrograms.map((p, i) => (
            <article key={p.key} style={S.card}>
              <Photo src={p.image} style={S.cardPhoto}>
                <span style={{ ...S.tagTR, textTransform: 'uppercase' }}>Coming Soon</span>
              </Photo>
              <div style={S.extHead}>
                <span style={S.extIcon(i)} aria-hidden="true"><i className={`ti ${p.icon}`} /></span>
                <div style={UI2.minWidth0}>
                  <h3 style={S.cardTitle}>{p.title}</h3>
                  <div style={S.extTag}>{p.tag}</div>
                </div>
              </div>
              <p style={S.cardDesc}>{p.desc}</p>
              <button type="button" style={{ ...S.cardBtn('soft', true), marginTop: 'auto' }} disabled title="Not available yet">
                <i className="ti ti-bell" style={S.btnIcon} aria-hidden="true" /> Notify Me
              </button>
            </article>
          ))}
        </Carousel>
      </section>
    </>
  );
}
