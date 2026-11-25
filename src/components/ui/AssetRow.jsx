import React from 'react';
import { C2, R2, SH2, TONES2, F2, FS2, FW2, LH2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants';

// ─── AssetRow (Design System v2) ─────────────────────────────────────────────
// Light property row for dashboards — photo · name + tags · address · inline metrics · actions.
// No chips or boxes: metrics are plain "Label value" text, rows are split by hairlines.
// The photo zooms gently on hover (un2-zoom). Use inside a SectionCard (a width container):
// when the card is narrower than 560px the actions drop under the details; the photo keeps the same
// size as on wide screens and sits top-aligned with the name (utilities.css).
//
//   <AssetRow image={img} name="Emerald Gardens" address="Chelsea, SW3" units={32}
//             status={{ tone: TONES2.success, label: 'STABILIZED' }}
//             tag={{ tone: TONES2.primary, label: 'PM · ACTIVE' }} paid
//             metrics={[{ label: 'Occupancy', value: '100%' },
//                       { label: 'Maintenance', value: 'Clear', color: C2.successStrong }]}
//             actions={<>…</>} first />
//
// Props: image, name, address, units, status, tag, paid, metrics[{ label, value, color }],
//        actions, first (no divider above), loading (skeleton row),
//        spread (wide lists, e.g. Unit Inventory): on a card wider than CQ2.medium (720px) each metric
//               becomes its own column (label over value, hairline-divided) spread across the row, so a
//               wide card has no empty middle. Narrower cards fall back to the inline metrics.
//               Nothing is ever cut with "…" or wrapped: every column (name included) is at least as
//               wide as its content; the status tag sits under the name. Card widths (CQ2.spread*):
//               > 1100px full · 821–1100px compact (smaller photo / gaps / values / buttons, "View Unit"
//               → "View") · ≤ 820px back to the inline row — utilities.css.
//   photo · name / tag / sub │ Tenant │ Lease ends │ Maintenance │ [View Unit] [Message]

const S = {
  // spread: the column template lives in utilities.css (.un2-asset-spread) so it can step down with
  // the card width; the metric count is passed as --un2-asset-cols.
  row:   (first, cols = 0) => ({
    display: 'grid',
    ...(cols
      ? { '--un2-asset-cols': cols }
      : { gridTemplateColumns: `${SZ2.assetThumb.w}px minmax(0, 1fr) auto` }),
    alignItems: 'center',
    columnGap: SP2.lg, rowGap: SP2.md, padding: pad(LAYOUT2.mediaRowY, 0), fontFamily: F2.body,
    borderTop: first ? 'none' : `${SZ2.hairline}px solid ${C2.divider}`,
  }),
  thumb: { position: 'relative', width: '100%', height: SZ2.assetThumb.h, borderRadius: R2.lg, overflow: 'hidden', background: C2.surfaceMuted, boxShadow: SH2.md },
  img:   { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  body:  { ...UI2.stack(SP2.xs), minWidth: 0 },
  // name + tags: when they don't fit on one line the tags drop under the name (never squeeze the
  // name to "Emer…" or break a tag like "ELITE LISTING" over two lines)
  title: { ...UI2.row(SP2.sm), flexWrap: 'wrap', rowGap: SP2.xs, minWidth: 0 },
  name:  { fontSize: FS2.md, fontWeight: FW2.medium, lineHeight: LH2.heading, color: C2.textPrimary, textTransform: 'capitalize', ...UI2.truncate, minWidth: 0, maxWidth: '100%' },
  tagNo: { whiteSpace: 'nowrap', flexShrink: 0 },
  addr:  { ...UI2.text.meta, ...UI2.truncate, textTransform: 'capitalize' },
  stats: { display: 'flex', flexWrap: 'wrap', columnGap: SP2.lg, rowGap: SP2.xxs, fontSize: FS2.xs, lineHeight: LH2.heading, color: C2.textSecondary },
  val:   { fontWeight: FW2.semibold, color: C2.textPrimary, marginLeft: SP2.xs },
  paid:  { ...UI2.row(SP2.xxs), color: C2.successStrong, fontWeight: FW2.medium },
  actions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: SP2.sm, flexWrap: 'wrap' },
  // spread columns: label over value, split by a hairline — never truncated (column sizes to content)
  col:     { ...UI2.stack(SP2.xxs), paddingLeft: SP2.lg, borderLeft: `${SZ2.hairline}px solid ${C2.border}` },
  colLbl:  { ...UI2.text.caption, whiteSpace: 'nowrap' },
  colVal:  { fontSize: FS2.base, fontWeight: FW2.medium, lineHeight: LH2.heading, color: C2.textPrimary, whiteSpace: 'nowrap' },
  // spread: name in full on one line (its column is never narrower than the name) · tag + sub text below
  nameFull:{ fontSize: FS2.md, fontWeight: FW2.medium, lineHeight: LH2.heading, color: C2.textPrimary, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  subRow:  { ...UI2.row(SP2.sm), whiteSpace: 'nowrap' },
  addrWrap:{ ...UI2.text.meta, textTransform: 'capitalize', whiteSpace: 'nowrap' },
};

export default function AssetRow({
  image, name, address, units, status, tag, paid = false, metrics = [], actions, first = false, loading = false, spread = false,
}) {
  const cols = spread ? metrics.length : 0;
  if (loading) {
    return (
      <div style={S.row(first)}>
        <div className="un2-skel" style={{ ...S.thumb, boxShadow: 'none' }} />
        <div style={S.body}>
          <div className="un2-skel" style={{ width: '50%', height: SP2.lg }} />
          <div className="un2-skel" style={{ width: '70%', height: SP2.md }} />
          <div className="un2-skel" style={{ width: '40%', height: SP2.md }} />
        </div>
        <div />
      </div>
    );
  }

  // Narrow card (< 560px, utilities.css): buttons stay in the row; long labels switch to their
  // short form via un2-label-full / un2-label-short spans inside the action buttons.
  return (
    <div className={spread ? 'un2-asset-row un2-asset-spread un2-zoom' : 'un2-asset-row un2-zoom'} style={S.row(first, cols)}>
      <div className="un2-asset-thumb" style={S.thumb}>{image && <img src={image} alt="" style={S.img} />}</div>

      <div style={S.body}>
        {spread ? (
          // spread: name alone on line 1 (full, one line) · status tag + sub text on line 2
          <>
            <span className="un2-asset-name" style={S.nameFull} title={name}>{name}</span>
            {(status || address || units) && (
              <div style={S.subRow}>
                {status && <span style={UI2.tag(status.tone || TONES2.neutral)}>{status.label}</span>}
                {tag && <span style={UI2.tag(tag.tone)}>{tag.label}</span>}
                {(address || units) && (
                  <span style={S.addrWrap}>{address}{address && units ? ' · ' : ''}{units ? `${units} Units` : ''}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={S.title}>
              <span className="un2-asset-name" style={S.name} title={name}>{name}</span>
              {status && <span style={{ ...UI2.tag(status.tone || TONES2.neutral), ...S.tagNo }}>{status.label}</span>}
              {tag && <span className="un2-hide-narrow" style={{ ...UI2.tag(tag.tone), ...S.tagNo }}>{tag.label}</span>}
            </div>
            {(address || units) && (
              <div style={S.addr}>{address}{address && units ? ' · ' : ''}{units ? `${units} Units` : ''}</div>
            )}
          </>
        )}
        {(metrics.length > 0 || paid) && (
          <div className={spread ? 'un2-asset-inline' : undefined} style={S.stats}>
            {metrics.map(m => (
              <span key={m.label}>{m.label}<span style={{ ...S.val, ...(m.color ? { color: m.color } : {}) }}>{m.value}</span></span>
            ))}
            {paid && <span className="un2-asset-paid" style={S.paid}><i className="ti ti-circle-check" aria-hidden="true" />Paid</span>}
          </div>
        )}
      </div>

      {spread && metrics.map(m => (
        <div key={m.label} className="un2-asset-col" style={S.col}>
          <span style={S.colLbl}>{m.label}</span>
          <span className="un2-asset-colval" style={{ ...S.colVal, ...(m.color ? { color: m.color } : {}) }} title={typeof m.value === 'string' ? m.value : undefined}>{m.value}</span>
        </div>
      ))}

      {actions && <div className="un2-asset-actions" style={S.actions}>{actions}</div>}
    </div>
  );
}
