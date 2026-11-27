import React from 'react';
import { SP2, SZ2, UI2, pad } from '../../constants';

// ─── MediaCard (Design System v2) ────────────────────────────────────────────
// Horizontal card standing on the page: photo flush to the card's left / top / bottom edge (clipped to the card
// radius, so it starts on the same line as the section heading above) │ status row · title · description · actions.
// Container = the standard v2 card (UI2.card — white, no border, minimal SH2.glass shadow).
// Text = the list-row pair (UI2.text.rowTitle + UI2.text.meta); actions = small buttons, normally UI2.btnXs.
// Put several in <Grid layout="two" as="div">. Reference: PM Services → Included with Your Plan.
//
//   <MediaCard
//     image={src}
//     status={<span style={UI2.statusPill(TONES2.success)}><span style={UI2.statusDot(TONES2.success)} />Active</span>}
//     title="Lease Management"
//     description="Automated digital lease creation…"
//     actions={<>
//       <button className="un2-btn" style={{ ...UI2.btn.soft, ...UI2.btnXs }}>Configure</button>
//       <button className="un2-btn" style={{ ...UI2.btn.brand, ...UI2.btnXs }}>View Details</button>
//     </>} />
//
// Props: image · imageStyle (extra <img> style, e.g. a crop) · status (node, optional) · title · description ·
//        descLines (clamp, default 2) · children (optional block between description and actions, e.g. a price —
//        PM Subscription plan cards) · actions (node, optional) · as (default 'article') · style
//        size  'md' (default — 144 photo, 20 spacing: 2-up grids) | 'sm' = COMPACT for 3-up rows / carousels:
//              112 photo (SZ2.thumbLg) and 16 spacing; everything else identical

const S = {
  card:   { ...UI2.card, position: 'relative', overflow: 'hidden', display: 'flex', gap: SP2.xl, padding: pad(0, SP2.xl, 0, 0), height: '100%', boxSizing: 'border-box' },
  photo:  { ...UI2.photoTile, width: SZ2.thumbXl.w, minHeight: SZ2.thumbXl.h + SP2.xl * 2, flexShrink: 0, alignSelf: 'stretch', borderRadius: 0, boxShadow: 'none' },
  // spacing: status → title 12 · title → text 6 · text → actions ≥ 20 · 20 above / below the text column
  body:   { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, padding: pad(SP2.xl, 0) },
  status: { ...UI2.row(SP2.sm), flexWrap: 'wrap', marginBottom: SP2.md },
  title:  { ...UI2.text.rowTitle, margin: 0 },
  desc:   (lines) => ({ ...UI2.text.meta, margin: pad(SP2.xs + SP2.xxs, 0, 0), ...UI2.clamp(lines) }),
  extra:  { marginTop: SP2.md },
  acts:   { ...UI2.row(SP2.sm), flexWrap: 'wrap', marginTop: 'auto', paddingTop: SP2.xl },
};

// compact size: only the photo width + spacing step down (SZ2.thumbLg · SP2.lg)
const SM = {
  card:  { gap: SP2.lg, padding: pad(0, SP2.lg, 0, 0) },
  photo: { width: SZ2.thumbLg.w, minHeight: SZ2.thumbLg.h + SP2.lg * 2 },
  body:  { padding: pad(SP2.lg, 0) },
  acts:  { paddingTop: SP2.lg },
};

export default function MediaCard({ image, imageStyle, status, title, description, descLines = 2, children, actions, size = 'md', as: Tag = 'article', style }) {
  const sm = size === 'sm';
  return (
    <Tag style={{ ...S.card, ...(sm ? SM.card : {}), ...style }}>
      <div className="un2-zoom" style={sm ? { ...S.photo, ...SM.photo } : S.photo}>
        {image && <img src={image} alt="" style={{ ...UI2.photoMedia, ...imageStyle }} />}
      </div>
      <div style={sm ? { ...S.body, ...SM.body } : S.body}>
        {status && <div style={S.status}>{status}</div>}
        <h3 style={S.title}>{title}</h3>
        {description && <p style={S.desc(descLines)}>{description}</p>}
        {children && <div style={S.extra}>{children}</div>}
        {actions && <div style={sm ? { ...S.acts, ...SM.acts } : S.acts}>{actions}</div>}
      </div>
    </Tag>
  );
}
