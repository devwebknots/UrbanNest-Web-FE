import React, { useState, useRef, useEffect } from 'react';
import { C2, G2, TONES2, R2, SH2, T2, FS2, LH2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants/v2';
import { OptionsMenu } from './PropertyCard';
import TextLink from './TextLink';

// ─── PropertyRow (Design System v2) ──────────────────────────────────────────
// Compact property row for the portfolio list (Landlord → Properties). Rows are split by hairlines.
//
//   ┌──────┐  Sky Tower [Active]                         (✓ 100% Ownership)  …
//   │photo │  ⌖ Sky, New York, US · Condominium
//   └──────┘  ▦ 0 Units   % 0% Occupancy   ▣ 0 Upcoming   View Property →  [Units]
//
//   <PropertyRow image={url} fallbackImage={placeholder} name="Sky Tower"
//                status={{ tone: TONES2.success, label: 'Active' }}
//                address="Sky, New York, US" typeLabel="Condominium" share={100}
//                stats={[{ icon: 'ti-buildings', value: 0, label: 'Units' }, …]}
//                primaryAction={{ label: 'View Property', onClick }} secondaryAction={{ label: 'Units', onClick }}
//                menu={[{ icon: 'ti-eye', label: 'View property', onClick }]} first />
//   <PropertyRow loading />
//
// Props: image, fallbackImage, name, status ({ tone, label }), address, typeLabel,
//        share (0–100 → "✓ 100% Ownership" pill), stats [{ icon, value, label }],
//        primaryAction / secondaryAction ({ label, onClick }), menu, first (no hairline above), loading,
//        onSelect (row click / Enter / ↑↓ selects it) · selected (gradient pill on the left · soft side wash ·
//        name in primary blue)
// Type: name = UI2.cardTitle (Playfair 16) · address = UI2.text.meta (the standard description line) ·
//       stat value T2.bodyBold + label T2.body (grey) · View Property = TextLink (same as "View all") ·
//       secondary = UI2.btn.soft + btnSm (button rule: secondary on light surfaces is always soft).
// Layout: details │ ownership pill over View Property │ "…" menu over Units — each pair centred on one
// vertical line (grid columns). The stats wrap onto two lines on narrow cards; the photo stays beside.

const S = {
  row:     (first) => ({ display: 'flex', alignItems: 'center', gap: SP2.lg, padding: pad(LAYOUT2.mediaRowY, 0), borderTop: first ? 'none' : `${SZ2.hairline}px solid ${C2.border}` }),
  photo:   { position: 'relative', flexShrink: 0, width: SZ2.propertyRowPhoto.w, height: SZ2.propertyRowPhoto.h, overflow: 'hidden', borderRadius: R2.md, background: C2.surfaceMuted, boxShadow: SH2.md },
  img:     { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  ph:      { ...UI2.center, position: 'absolute', inset: 0, color: C2.textMuted, fontSize: FS2.xl },

  // 3 columns × 2 lines: details │ ownership over View Property │ menu over Units — each column centred
  body:    { flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', columnGap: SP2.lg, rowGap: SP2.md, alignItems: 'center' },
  info:    { gridColumn: 1, gridRow: 1, minWidth: 0 },
  colA1:   { gridColumn: 2, gridRow: 1, justifySelf: 'center' },
  colA2:   { gridColumn: 2, gridRow: 2, justifySelf: 'center' },
  colB1:   { gridColumn: 3, gridRow: 1, justifySelf: 'center' },
  colB2:   { gridColumn: 3, gridRow: 2, justifySelf: 'center' },
  titleRow:{ ...UI2.row(SP2.sm), flexWrap: 'wrap', rowGap: SP2.xxs },
  name:    { ...UI2.cardTitle },
  addr:    { ...UI2.row(SP2.xs), ...UI2.text.meta, marginTop: SP2.xs, flexWrap: 'wrap' },
  addrIcon:{ fontSize: FS2.sm },

  stats:   { ...UI2.row(SP2.lg), gridColumn: 1, gridRow: 2, flexWrap: 'wrap', rowGap: SP2.xs, minWidth: 0 },
  stat:    { ...UI2.row(SP2.xs), whiteSpace: 'nowrap' },
  statIcon:{ fontSize: FS2.md, color: C2.textSecondary, lineHeight: LH2.none },
  statVal: { ...T2.bodyBold },
  statLbl: { ...T2.body, color: C2.textSecondary },

  btnAlt:  { ...UI2.btn.soft, ...UI2.btnSm },   // standard secondary on a light surface (never a white button)

  // Selectable rows (onSelect) — premium selected look, no box / border / shadow:
  //   · a short rounded GRADIENT PILL on the left edge (grows in from the middle)
  //   · one soft edgeless blue glow from the left (G2.selectedRow)
  //   (no ring on the photo)
  //   · the property name turns primary blue
  // borderTop none: with rounded corners a top border bends round them — the divider is its own straight line (S.divider)
  selectable: { position: 'relative', borderTop: 'none', paddingLeft: SP2.lg, paddingRight: SP2.md, borderRadius: R2.lg, cursor: 'pointer', transition: 'background 0.3s ease' },
  divider:    { position: 'absolute', top: 0, left: SP2.md, right: SP2.md, height: SZ2.hairline, background: C2.border, pointerEvents: 'none' },
  // selected: soft edgeless glow (no box, no shadow), a blue bar along the left edge and a small ✓ badge
  // on the photo
  selected:   { background: G2.selectedRow },   // soft edgeless blue glow from the left — never a box / shadow
  check:      { ...UI2.center, position: 'absolute', top: SP2.xs, left: SP2.xs, zIndex: 1, width: SZ2.icon.xs - SP2.xxs, height: SZ2.icon.xs - SP2.xxs, borderRadius: R2.round, background: C2.primary, color: C2.white, fontSize: FS2.xxs, boxShadow: `0 0 0 1.5px ${C2.white}` },   // small, light ✓ badge
  indicator:  (on) => ({
    position: 'absolute', left: 0, top: SP2.md, bottom: SP2.md, width: SZ2.accentBar + 1, borderRadius: R2.pill,   // runs (almost) the full row height
    background: G2.brandBar,   // dark brand gradient (same as the main buttons), vertical
    transform: on ? 'scaleY(1)' : 'scaleY(0)', opacity: on ? 1 : 0,
    transition: 'transform 0.35s var(--un2-spring), opacity 0.2s ease', pointerEvents: 'none',
  }),
  nameOn:     { color: C2.primary, transition: 'color 0.2s ease' },
};

function Photo({ image, fallbackImage }) {
  const [broken, setBroken] = useState(false);
  const src = image && !broken ? image : fallbackImage;
  return src
    ? <img src={src} alt="" style={S.img} onError={() => setBroken(true)} />
    : <div style={S.ph}><i className="ti ti-building" aria-hidden="true" /></div>;
}

function Skeleton({ first }) {
  return (
    <div style={S.row(first)}>
      <div className="un2-skel" style={{ ...S.photo, boxShadow: 'none' }} />
      <div style={S.body}>
        <span className="un2-skel" style={UI2.skeleton('35%', FS2.lg)} />
        <span className="un2-skel" style={UI2.skeleton('55%', FS2.sm)} />
        <span className="un2-skel" style={UI2.skeleton('80%', FS2.md)} />
      </div>
    </div>
  );
}

export default function PropertyRow({
  image, fallbackImage, name, status, address, typeLabel, share, stats = [],
  primaryAction, secondaryAction, menu, first = false, loading = false, selected = false, onSelect,
}) {
  const rowRef = useRef(null);
  const wasSelected = useRef(selected);
  // Selected from elsewhere (e.g. a picker) → glide the row into view if it's off-screen
  // (never on first render, so the page doesn't jump on load)
  useEffect(() => {
    if (selected && !wasSelected.current && rowRef.current) rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    wasSelected.current = selected;
  }, [selected]);

  if (loading) return <Skeleton first={first} />;
  const sharePct = share != null ? Math.max(0, Math.min(100, Number(share) || 0)) : null;
  // Row click selects it — except clicks on its own buttons / links / menu (they keep their action)
  const select = e => { if (onSelect && !e.target.closest('button, a, [role="menu"]')) onSelect(); };
  const onKey = e => {
    if (!onSelect || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); return; }
    // ↑ / ↓ move the selection to the previous / next selectable row
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const rows = [...(e.currentTarget.parentElement?.querySelectorAll(':scope > .un2-select-row') || [])];
      const next = rows[rows.indexOf(e.currentTarget) + (e.key === 'ArrowDown' ? 1 : -1)];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    }
  };
  return (
    <div
      ref={rowRef}
      className={onSelect ? "un2-zoom un2-select-row" : "un2-zoom"}
      style={{ ...S.row(first), ...(onSelect ? S.selectable : {}), ...(selected ? S.selected : {}) }}
      onClick={onSelect ? select : undefined}
      onKeyDown={onSelect ? onKey : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-selected={onSelect ? selected : undefined}
      role={onSelect ? 'option' : undefined}
    >
      {onSelect && !first && !selected && <span style={S.divider} aria-hidden="true" />}
      {onSelect && <span style={S.indicator(selected)} aria-hidden="true" />}
      <div style={S.photo}>
        {selected && <span style={S.check} aria-hidden="true"><i className="ti ti-check" /></span>}
        <Photo image={image} fallbackImage={fallbackImage} />
      </div>

      <div style={S.body}>
          <div style={S.info}>
            <div style={S.titleRow}>
              <span className="un2-row-name" style={{ ...S.name, ...(selected ? S.nameOn : {}) }}>{name}</span>
              {status && <span style={UI2.pill(status.tone)}>{status.label}</span>}
            </div>
            {(address || typeLabel) && (
              <div style={S.addr}>
                <i className="ti ti-map-pin" style={S.addrIcon} aria-hidden="true" />
                {address && <span>{address}</span>}
                {address && typeLabel && <span aria-hidden="true">·</span>}
                {typeLabel && <span>{typeLabel}</span>}
              </div>
            )}
          </div>
          {sharePct != null && (
            <span style={{ ...UI2.pill(TONES2.success), ...S.colA1 }}>
              <i className="ti ti-shield-check" aria-hidden="true" /> {sharePct}% Ownership
            </span>
          )}
          {menu && menu.length > 0 && <div style={S.colB1}><OptionsMenu items={menu} inline /></div>}

          {stats.length > 0 && (
            <div style={S.stats}>
              {stats.map(s => (
                <span key={s.label} style={S.stat}>
                  <i className={`ti ${s.icon}`} style={S.statIcon} aria-hidden="true" />
                  <span style={S.statVal}>{s.value}</span>
                  <span style={S.statLbl}>{s.label}</span>
                </span>
              ))}
            </div>
          )}
          {primaryAction && (
            <div style={S.colA2}><TextLink onClick={primaryAction.onClick}>{primaryAction.label}</TextLink></div>
          )}
          {secondaryAction && (
            <button type="button" className="un2-btn" style={{ ...S.btnAlt, ...S.colB2 }} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
      </div>
    </div>
  );
}
