import React, { useEffect, useRef, useState } from 'react';
import { C2, R2, SH2, TONES2, F2, FS2, FW2, LH2, SP2, SZ2, BLUR2, pad, UI2 } from '../../constants/v2';

// ─── PropertyCard (Design System v2) ─────────────────────────────────────────
// Vertical property card for portfolio grids: photo (type label + "…" menu on it) ·
// name · address · share badge · three stats · two buttons. Put them in <Grid layout="three">.
//
//   <PropertyCard
//     image={prop.main_image_url} fallbackImage={placeholder}
//     typeLabel="Condominium" tag={{ tone: TONES2.primary, label: 'PM · ACTIVE' }}
//     name="Sky Tower" address="Sky, New York, US" share="100%"
//     stats={[{ icon: 'ti-building', value: 0, label: 'Total Units' }, …]}
//     primaryAction={{ label: 'View Property', onClick: … }}
//     secondaryAction={{ label: 'View Units', onClick: … }}
//     menu={[{ icon: 'ti-eye', label: 'View property', onClick: … }]} />
//
//   <PropertyCard loading />   ← skeleton while data loads
//
// Props: image, fallbackImage (shown when image is missing / broken), typeLabel, tag ({ tone, label }),
//        name, address, share (string, e.g. "100%"), stats [{ icon, value, label, color? }],
//        primaryAction / secondaryAction ({ label, onClick }), menu [{ icon, label, onClick }], loading
// Narrow cards (< CQ2.narrow): the stat icons hide so the three values stay on one line.

const S = {
  // White card, photo runs edge to edge across the top (card clips its top corners)
  card: {
    fontFamily: F2.body, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', minWidth: 0,
    background: C2.white, border: `1px solid ${C2.border}`, borderRadius: R2.xl, boxShadow: SH2.card, overflow: 'hidden',
  },
  // Small inset (SP2.xs) so the photo sits just inside the card edge; R2.lg = card radius (R2.xl) − inset
  photo:   { position: 'relative', flexShrink: 0, height: SZ2.propertyCardPhoto, margin: pad(SP2.xs, SP2.xs, 0), borderRadius: pad(R2.lg, R2.lg, 0, 0), overflow: 'hidden', background: C2.surfaceMuted },
  img:     { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  ph:      { ...UI2.center, position: 'absolute', inset: 0, color: C2.textMuted, fontSize: FS2.display },
  tags:    { position: 'absolute', top: SP2.sm, left: SP2.sm, right: SZ2.control.lg + SP2.sm, display: 'flex', flexWrap: 'wrap', gap: SP2.xs },
  typeTag: {
    display: 'inline-flex', alignItems: 'center', padding: pad(SP2.xs, SP2.md), borderRadius: R2.pill,
    background: C2.photoBadge, color: C2.white, fontSize: FS2.sm, fontWeight: FW2.semibold, lineHeight: LH2.heading,
    backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, whiteSpace: 'nowrap',
  },
  more:    { ...UI2.btn.light, ...UI2.btnSm, position: 'absolute', top: SP2.sm, right: SP2.sm, borderRadius: R2.pill, padding: pad(0, SP2.md), fontSize: FS2.lg },
  menu:    {
    position: 'absolute', top: SP2.sm + SZ2.control.sm + SP2.xs, right: SP2.sm, zIndex: 2, minWidth: SZ2.panelMin,
    ...UI2.stack(SP2.xxs), padding: SP2.xs, background: C2.white, border: `1px solid ${C2.cardBorder}`, borderRadius: R2.lg, boxShadow: SH2.lg,
  },
  menuItem:{ ...UI2.row(SP2.sm), width: '100%', padding: pad(SP2.sm, SP2.md), border: 'none', background: 'none', borderRadius: R2.md, cursor: 'pointer', textAlign: 'left', ...UI2.text.title, fontWeight: FW2.medium },

  body:    { ...UI2.stack(SP2.lg), flex: 1, padding: pad(SP2.md, SP2.lg, SP2.lg) },
  head:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP2.sm },
  name:    { fontSize: FS2.lg, fontWeight: FW2.bold, color: C2.textPrimary, lineHeight: LH2.heading, ...UI2.truncate },
  addr:    { ...UI2.row(SP2.xs), ...UI2.text.meta, marginTop: SP2.xxs, minWidth: 0 },
  share:   {
    ...UI2.stack(0), alignItems: 'center', flexShrink: 0, padding: pad(SP2.sm, SP2.md), borderRadius: R2.xl,
    background: TONES2.success.soft, color: TONES2.success.fg,
  },
  shareVal:{ fontSize: FS2.md, fontWeight: FW2.bold, lineHeight: LH2.heading },
  shareLbl:{ fontSize: FS2.xs, lineHeight: LH2.heading },

  stats:   { display: 'flex', gap: SP2.sm },
  stat:    { ...UI2.row(SP2.sm), alignItems: 'flex-start', flex: 1, minWidth: 0 },
  statIcon:{ fontSize: FS2.xl, color: C2.navyButton, lineHeight: LH2.none },
  statVal: { fontSize: FS2.md, fontWeight: FW2.bold, color: C2.textPrimary, lineHeight: LH2.heading, ...UI2.truncate },
  statLbl: { ...UI2.text.caption, color: C2.textSecondary, ...UI2.truncate },

  actions: { display: 'flex', gap: SP2.md, marginTop: 'auto' },
  // Design buttons: solid dark navy primary · light grey secondary, both full-height (control.lg)
  btnMain: { ...UI2.btn.brand, flex: 1, minWidth: 0, minHeight: SZ2.control.lg },   // standard v2 primary button (G2.brandButton)
  btnAlt:  { ...UI2.btn.base, flex: 1, minWidth: 0, minHeight: SZ2.control.lg, background: C2.background, color: C2.textPrimary, border: `1px solid ${C2.border}` },
};

function Photo({ image, fallbackImage }) {
  const [broken, setBroken] = useState(false);
  const src = image && !broken ? image : fallbackImage;
  return src
    ? <img src={src} alt="" style={S.img} onError={() => setBroken(true)} />
    : <div style={S.ph}><i className="ti ti-building" aria-hidden="true" /></div>;
}

function Menu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref}>
      <button type="button" className="un2-btn" style={S.more} aria-label="More options" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <i className="ti ti-dots" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" style={S.menu}>
          {items.map(it => (
            <button key={it.label} type="button" role="menuitem" className="un2-row-hover" style={S.menuItem}
              onClick={() => { setOpen(false); it.onClick && it.onClick(); }}>
              {it.icon && <i className={`ti ${it.icon}`} style={{ fontSize: FS2.lg, color: C2.textSecondary }} aria-hidden="true" />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={S.card}>
      <div className="un2-skel" style={{ ...S.photo, borderRadius: R2.lg }} />
      <div style={S.body}>
        <span className="un2-skel" style={UI2.skeleton('60%', FS2.lg)} />
        <span className="un2-skel" style={UI2.skeleton('80%', FS2.sm)} />
        <span className="un2-skel" style={UI2.skeleton('100%', SZ2.icon.md)} />
        <span className="un2-skel" style={UI2.skeleton('100%', SZ2.control.md)} />
      </div>
    </div>
  );
}

export default function PropertyCard({
  image, fallbackImage, typeLabel, tag, name, address, share, stats = [],
  primaryAction, secondaryAction, menu, loading = false,
}) {
  if (loading) return <Skeleton />;
  return (
    <div className="un2-cq un2-hover-lift" style={S.card}>
      <div style={S.photo}>
        <Photo image={image} fallbackImage={fallbackImage} />
        {(typeLabel || tag) && (
          <div style={S.tags}>
            {typeLabel && <span style={S.typeTag}>{typeLabel}</span>}
            {tag && <span style={{ ...S.typeTag, background: tag.tone.strong }}>{tag.label}</span>}
          </div>
        )}
        {menu && menu.length > 0 && <Menu items={menu} />}
      </div>

      <div style={S.body}>
        <div style={S.head}>
          <div style={UI2.minWidth0}>
            <div style={S.name} title={name}>{name}</div>
            {address && (
              <div style={S.addr} title={address}>
                <i className="ti ti-map-pin" style={{ fontSize: FS2.md, flexShrink: 0 }} aria-hidden="true" />
                <span style={UI2.truncate}>{address}</span>
              </div>
            )}
          </div>
          {share && (
            <div style={S.share}>
              <span style={S.shareVal}>{share}</span>
              <span style={S.shareLbl}>Share</span>
            </div>
          )}
        </div>

        {stats.length > 0 && (
          <div style={S.stats}>
            {stats.map(s => (
              <div key={s.label} style={S.stat}>
                <i className={`ti ${s.icon} un2-hide-narrow`} style={S.statIcon} aria-hidden="true" />
                <div style={UI2.minWidth0}>
                  <div style={{ ...S.statVal, ...(s.color ? { color: s.color } : {}) }}>{s.value}</div>
                  <div style={S.statLbl}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(primaryAction || secondaryAction) && (
          <div style={S.actions}>
            {primaryAction && (
              <button type="button" className="un2-btn" style={S.btnMain} onClick={primaryAction.onClick}>
                {primaryAction.label} <i className="ti ti-arrow-right" style={{ fontSize: FS2.lg, marginLeft: SP2.sm }} aria-hidden="true" />
              </button>
            )}
            {secondaryAction && (
              <button type="button" className="un2-raise" style={S.btnAlt} onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
