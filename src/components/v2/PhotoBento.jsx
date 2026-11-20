import React from 'react';
import { SP2, UI2 } from '../../constants/v2';

// ─── PhotoBento (Design System v2) ───────────────────────────────────────────
// Detail-page gallery: one big photo (or autoplaying video) on the left, a 2 × 2 grid on
// the right — up to three photos + an "Add images" tile. Photos zoom gently on hover.
// ≤ 860px: main photo on top, the four tiles in one row under it (utilities.css .un2-bento).
//
//   <PhotoBento
//     main={{ src: heroUrl, video: false, onClick: () => openLightbox(0) }}
//     tiles={[{ src: t1, onClick: … }, { src: t2 }, { src: t3 }]}
//     add={{ label: 'Add images', busy: uploading, onClick: pickFile }} />
//
// Props: main { src, video, onClick }, tiles [{ src, onClick, alt }] (first 3 used),
//        add { label, busy, onClick } (optional 4th tile), height via SZ2.bento / --un2-bento-h
//        stacked  true → ONE column beside the photo: 2 tiles + the Add tile (unit detail, .un2-bento-stacked)
//        onPrev / onNext  round light arrows on the main photo (step through the gallery)
//        badge    small dark chip on the main photo, bottom-left (e.g. "Video Tour")

// Tiles, media, Add tile and the photo arrows are shared UI2 styles (photoTile · photoMedia · addTile ·
// photoArrow) — the floor plan on the unit page uses the same ones.
const S = {
  tile:     (clickable) => ({ ...UI2.photoTile, padding: 0, border: 'none', cursor: clickable ? 'zoom-in' : 'default' }),
  // Main photo wrapper — holds the arrows / badge over the photo (grid so the photo fills it)
  mainWrap: { position: 'relative', display: 'grid', minHeight: 0, minWidth: 0 },
  badge:    { ...UI2.chipOnDark, position: 'absolute', left: SP2.md, bottom: SP2.md, pointerEvents: 'none' },
};

function Tile({ src, video, onClick, alt = '' }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className="un2-zoom" style={S.tile(!!onClick)} onClick={onClick} aria-label={onClick ? 'Open gallery' : undefined}>
      {video
        ? <video src={src} style={UI2.photoMedia} autoPlay muted loop playsInline />
        : src && <img src={src} alt={alt} style={UI2.photoMedia} />}
    </Tag>
  );
}

export default function PhotoBento({ main, tiles = [], add, stacked = false, onPrev, onNext, badge }) {
  return (
    <section className={stacked ? 'un2-bento un2-bento-stacked' : 'un2-bento'}>
      <div style={S.mainWrap}>
        <Tile {...main} />
        {onPrev && (
          <button type="button" className="un2-btn" style={UI2.photoArrow('left')} onClick={onPrev} aria-label="Previous photo">
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
        )}
        {onNext && (
          <button type="button" className="un2-btn" style={UI2.photoArrow('right')} onClick={onNext} aria-label="Next photo">
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        )}
        {badge && <span style={S.badge}>{badge}</span>}
      </div>
      <div className="un2-bento-tiles">
        {tiles.slice(0, stacked ? 2 : 3).map((t, i) => <Tile key={i} {...t} />)}
        {add && (
          <button type="button" className="un2-raise" style={UI2.addTile(add.busy)} onClick={add.busy ? undefined : add.onClick} aria-busy={add.busy || undefined}>
            <i className={`ti ${add.busy ? 'ti-loader-2' : 'ti-plus'}`} style={UI2.addTileIcon} aria-hidden="true" />
            {add.label}
          </button>
        )}
      </div>
    </section>
  );
}
