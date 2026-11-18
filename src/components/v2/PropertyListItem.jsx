import React from 'react';
import { C2, G2, TONES2, R2, SH2, F2, FS2, FW2, LH2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants/v2';

// ─── PropertyListItem (Design System v2) ─────────────────────────────────────
// One property row: photo (full row height, status tag on it) · details · menu.
//
//   <PropertyListItem
//     image={img} name="Sky Tower" address="Sky, New York, US" units={12}
//     status={{ tone: TONES2.success, label: 'STABILIZED' }}
//     tag={{ tone: TONES2.neutral, label: 'SELF' }}
//     paid
//     metrics={[
//       { icon: 'ti-home-check', label: 'Occupancy', value: '92%' },
//       { icon: 'ti-tool', label: 'Maintenance', value: 'Clear', color: C2.successStrong },
//     ]}
//     actions={<><button …>Details</button><button …>Message Tenants</button></>}
//     onMenu={() => …} />
//
// Rows are separated by a top border; the first row in a card sits under the
// card header divider.

const S = {
  row: {
    display: 'grid',
    fontFamily: F2.body,
    gridTemplateColumns: `${SZ2.thumbLg.w}px minmax(0, 1fr) auto`,
    alignItems: 'stretch',
    gap: SP2.lg,
    padding: pad(SP2.lg, 0),
    borderTop: `1px solid ${C2.border}`,
  },
  thumb: {
    position: 'relative',
    minHeight: SZ2.thumbLg.h,
    borderRadius: R2.lg,
    overflow: 'hidden',
    background: C2.surfaceMuted,
    boxShadow: SH2.md,
  },
  img:   { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  shade: { position: 'absolute', inset: 0, background: G2.thumbShade },
  status:{ position: 'absolute', left: SP2.sm, bottom: SP2.sm, boxShadow: SH2.sm },

  body:  { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: SP2.sm, minWidth: 0 },
  title: { ...UI2.row(LAYOUT2.inlineGap), flexWrap: 'wrap', minWidth: 0 },
  name:  { ...UI2.text.titleLg, ...UI2.truncate, textTransform: 'capitalize' },
  paid:  { ...UI2.pill(TONES2.success), padding: pad(SP2.xxs, SP2.sm) },
  addr:  { ...UI2.row(SP2.xs), ...UI2.text.meta, textTransform: 'capitalize', minWidth: 0 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: LAYOUT2.inlineGap },
  chipVal: { fontWeight: FW2.semibold, color: C2.textPrimary },
  actions: { display: 'flex', flexWrap: 'wrap', gap: LAYOUT2.inlineGap, marginTop: SP2.xs },
};

export default function PropertyListItem({
  image, name, address, units, status, tag, paid = false,
  metrics = [], actions, onMenu, loading = false,
}) {
  if (loading) {
    return (
      <div style={S.row}>
        <div className="un2-skel" style={{ ...S.thumb, boxShadow: 'none' }} />
        <div style={S.body}>
          <div className="un2-skel" style={{ width: '45%', height: SP2.lg }} />
          <div className="un2-skel" style={{ width: '65%', height: SP2.md }} />
          <div className="un2-skel" style={{ width: '55%', height: SZ2.icon.xs }} />
          <div className="un2-skel" style={{ width: '50%', height: SZ2.control.sm }} />
        </div>
        <div />
      </div>
    );
  }

  return (
    <div style={S.row}>
      <div style={S.thumb}>
        {image && <img src={image} alt="" style={S.img} />}
        <div style={S.shade} />
        {status && <span style={{ ...UI2.tag(status.tone), ...S.status }}>{status.label}</span>}
      </div>

      <div style={S.body}>
        <div style={S.title}>
          <span style={S.name}>{name}</span>
          {tag && <span style={UI2.tag(tag.tone)}>{tag.label}</span>}
          {paid && (
            <span style={S.paid}>
              <i className="ti ti-circle-check" style={{ fontSize: FS2.sm }} aria-hidden="true" /> Paid
            </span>
          )}
        </div>

        {(address || units) && (
          <div style={S.addr}>
            <i className="ti ti-map-pin" style={{ fontSize: FS2.sm, flexShrink: 0 }} aria-hidden="true" />
            <span style={UI2.truncate}>
              {address}{units ? ` · ${units} Units` : ''}
            </span>
          </div>
        )}

        {metrics.length > 0 && (
          <div style={S.chips}>
            {metrics.map(m => (
              <span key={m.label} style={UI2.metricChip}>
                {m.icon && <i className={`ti ${m.icon}`} style={{ fontSize: FS2.sm, color: m.color || C2.textSecondary }} aria-hidden="true" />}
                {m.label}
                <span style={{ ...S.chipVal, ...(m.color ? { color: m.color } : {}), lineHeight: LH2.heading }}>{m.value}</span>
              </span>
            ))}
          </div>
        )}

        {actions && <div style={S.actions}>{actions}</div>}
      </div>

      <div>
        <button
          type="button"
          className="un2-raise"
          style={UI2.btn.iconOutline(SZ2.control.sm)}
          onClick={onMenu}
          aria-label={`More actions for ${name}`}
        >
          <i className="ti ti-dots-vertical" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
