import React from 'react';
import { C2, R2, SH2, F2, FS2, FW2, SP2, UI2 } from '../../constants/v2';

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

const tileBase = { position: 'relative', overflow: 'hidden', borderRadius: R2.xl, background: C2.surfaceMuted, boxShadow: SH2.md, minHeight: 0 };
const media = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

const S = {
  tile: (clickable) => ({ ...tileBase, padding: 0, border: 'none', cursor: clickable ? 'zoom-in' : 'default' }),
  // Add tile: the one place a dashed outline is used — it marks an empty drop slot, not a container
  add:  (busy) => ({
    ...UI2.center, flexDirection: 'column', gap: SP2.xs, borderRadius: R2.xl, border: `1.5px dashed ${C2.cardBorder}`,
    background: C2.primaryWash, color: C2.textSecondary, fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium,
    cursor: busy ? 'progress' : 'pointer', minHeight: 0,
  }),
  addIcon: { fontSize: FS2.xxl, color: C2.primary },
};

function Tile({ src, video, onClick, alt = '' }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className="un2-zoom" style={S.tile(!!onClick)} onClick={onClick} aria-label={onClick ? 'Open gallery' : undefined}>
      {video
        ? <video src={src} style={media} autoPlay muted loop playsInline />
        : src && <img src={src} alt={alt} style={media} />}
    </Tag>
  );
}

export default function PhotoBento({ main, tiles = [], add }) {
  return (
    <section className="un2-bento">
      <Tile {...main} />
      <div className="un2-bento-tiles">
        {tiles.slice(0, 3).map((t, i) => <Tile key={i} {...t} />)}
        {add && (
          <button type="button" className="un2-raise" style={S.add(add.busy)} onClick={add.busy ? undefined : add.onClick} aria-busy={add.busy || undefined}>
            <i className={`ti ${add.busy ? 'ti-loader-2' : 'ti-plus'}`} style={S.addIcon} aria-hidden="true" />
            {add.label}
          </button>
        )}
      </div>
    </section>
  );
}
