import React from 'react';
import { C2, R2, SP2, SZ2, UI2, pad } from '../../constants';

// ─── PhotoCard (Design System v2) ────────────────────────────────────────────
// Vertical photo card for carousels / grids — the PropertyCard recipe: photo inset SP2.xs across the top (top-only
// radius) with glass tags on it · title + description (list-row pair) · a footer under a hairline, pinned to the
// bottom so footers line up across a row. Single source for: PM Services (Add-Ons, More From UrbanNest) and
// PM Subscription (Available Plans).
//
//   <PhotoCard
//     image={src}
//     tags={<span style={UI2.photoTagGlass}>Instant Decision</span>}
//     title="Lease Management"
//     description="Streamline your entire rental property lifecycle…"
//     foot={<div>…price…</div>}
//     action={<button style={{ ...UI2.btn.soft, ...UI2.btnXs }}>+ Add to Plan</button>} />
//
// Props: image · imageStyle (extra <img> style, e.g. objectPosition) · tags (node(s) on the photo, top-left) · title ·
//        description · descLines (default 3) · foot (left side of the footer) · action (right side, a btnXs button) ·
//        footAlign 'end' (default — bottom-aligned, wraps under on a narrow card: price + caption) |
//                  'center' (one line, centred: icon + tag line) · as (default 'article') · style

const hairline = `${SZ2.hairline}px solid ${C2.border}`;
const S = {
  card:  { ...UI2.card, padding: SP2.xs, width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  photo: { ...UI2.photoTile, height: SZ2.propertyCardPhoto, boxShadow: 'none', borderRadius: pad(R2.lg, R2.lg, 0, 0) },
  tags:  { position: 'absolute', top: SP2.sm, left: SP2.sm, right: SP2.sm, display: 'flex', flexWrap: 'wrap', gap: SP2.xs },
  body:  { ...UI2.stack(SP2.lg), flex: 1, padding: pad(SP2.md, SP2.lg, SP2.lg) },
  head:  UI2.stack(SP2.xs),
  title: { ...UI2.text.rowTitle, margin: 0, ...UI2.truncate },
  desc:  (lines) => ({ ...UI2.text.meta, margin: 0, ...UI2.clamp(lines) }),
  foot:  {
    end:    { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap', rowGap: SP2.sm, alignItems: 'flex-end', marginTop: 'auto', paddingTop: SP2.lg, borderTop: hairline },
    center: { ...UI2.rowBetween(SP2.md), marginTop: 'auto', paddingTop: SP2.lg, borderTop: hairline },
  },
};

export default function PhotoCard({ image, imageStyle, tags, title, description, descLines = 3, foot, action, footAlign = 'end', as: Tag = 'article', style }) {
  return (
    <Tag style={{ ...S.card, ...style }}>
      <div className="un2-zoom" style={S.photo}>
        {image && <img src={image} alt="" style={{ ...UI2.photoMedia, ...imageStyle }} />}
        {tags && <div style={S.tags}>{tags}</div>}
      </div>
      <div style={S.body}>
        <div style={S.head}>
          <h3 style={S.title}>{title}</h3>
          {description && <p style={S.desc(descLines)}>{description}</p>}
        </div>
        {(foot || action) && (
          <div style={S.foot[footAlign] || S.foot.end}>
            {foot}
            {action}
          </div>
        )}
      </div>
    </Tag>
  );
}
