import React, { useState } from 'react';
import { C2, GSTOPS2, R2, SH2, T2, F2, FS2, FW2, LH2, SP2, SZ2, pad, UI2 } from '../../constants/v2';
import { ProgressRing } from './Charts';
import { OptionsMenu } from './PropertyCard';
import TextLink from './TextLink';

// ─── PropertyRow (Design System v2) ──────────────────────────────────────────
// Wide property row for the portfolio list (Landlord → Properties):
//
//   ┌──────────┐  Sky Tower  [Active]                       ◯ 100%    …
//   │  photo   │  ⌖ Sky, New York, US · Condominium           Ownership
//   │          │  ▦ 0 Total Units │ % 0% Occupancy │ ▣ 0 Upcoming
//   └──────────┘  View Property →    View Units
//
//   <PropertyRow image={url} fallbackImage={placeholder} name="Sky Tower"
//                status={{ tone: TONES2.success, label: 'Active' }}
//                address="Sky, New York, US" typeLabel="Condominium" share={100}
//                stats={[{ icon: 'ti-buildings', value: 0, label: 'Total Units' }, …]}
//                primaryAction={{ label: 'View Property', onClick }} secondaryAction={{ label: 'View Units', onClick }}
//                menu={[{ icon: 'ti-eye', label: 'View property', onClick }]} first />
//   <PropertyRow loading />
//
// Props: image, fallbackImage, name, status ({ tone, label }), address, typeLabel,
//        share (0–100 → ownership ring), stats [{ icon, value, label }], primaryAction / secondaryAction,
//        menu, first (no hairline above), loading
// Put rows inside a SectionCard (a width container). Card narrower than 600px → photo stacks on top
// (un2-prow in utilities.css); narrower than 300px → stat icons hide.

const S = {
  row:     (first) => ({ fontFamily: F2.body, paddingTop: first ? 0 : SP2.xl, marginTop: first ? 0 : SP2.xl, borderTop: first ? 'none' : `${SZ2.hairline}px solid ${C2.border}` }),
  photo:   { position: 'relative', overflow: 'hidden', borderRadius: R2.lg, background: C2.surfaceMuted, boxShadow: SH2.md },
  img:     { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  ph:      { ...UI2.center, position: 'absolute', inset: 0, color: C2.textMuted, fontSize: FS2.display },

  body:    { ...UI2.stack(SP2.lg), minWidth: 0, justifyContent: 'center' },
  head:    { display: 'flex', alignItems: 'flex-start', gap: SP2.md },
  titleRow:{ ...UI2.row(SP2.sm), flexWrap: 'wrap', rowGap: SP2.xs },
  name:    { fontFamily: F2.heading, fontSize: FS2.xl, fontWeight: FW2.semibold, lineHeight: LH2.heading, color: C2.textPrimary },
  addr:    { ...UI2.row(SP2.xs), ...T2.label, marginTop: SP2.xs, flexWrap: 'wrap' },
  addrIcon:{ fontSize: FS2.md, color: C2.textMuted },
  sep:     { color: C2.textSubtle },

  share:   { ...UI2.stack(SP2.xs), alignItems: 'center', flexShrink: 0, marginLeft: 'auto' },
  shareVal:{ ...T2.bodyBold, color: C2.navyDeep, lineHeight: LH2.none },
  shareLbl:{ ...T2.caption, color: C2.textSecondary },

  stats:   { display: 'flex', flexWrap: 'wrap', rowGap: SP2.md },
  stat:    (first) => ({ ...UI2.row(SP2.sm), alignItems: 'flex-start', flex: '1 1 0', minWidth: 0, padding: pad(0, SP2.lg), ...(first ? { paddingLeft: 0 } : { borderLeft: `${SZ2.hairline}px solid ${C2.border}` }) }),
  statIcon:{ fontSize: FS2.xl, color: C2.navyButton, lineHeight: LH2.none },
  statVal: { ...T2.statInline, ...UI2.truncate },
  statLbl: { ...T2.label, ...UI2.truncate },

  actions: { ...UI2.row(SP2.xxl), flexWrap: 'wrap', rowGap: SP2.sm },
  altLink: { color: C2.textSecondary },
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
    <div className="un2-prow" style={S.row(first)}>
      <div className="un2-prow-photo un2-skel" style={{ borderRadius: R2.lg }} />
      <div style={S.body}>
        <span className="un2-skel" style={UI2.skeleton('45%', FS2.xl)} />
        <span className="un2-skel" style={UI2.skeleton('70%', FS2.sm)} />
        <span className="un2-skel" style={UI2.skeleton('100%', SZ2.icon.md)} />
        <span className="un2-skel" style={UI2.skeleton('40%', FS2.sm)} />
      </div>
    </div>
  );
}

export default function PropertyRow({
  image, fallbackImage, name, status, address, typeLabel, share, stats = [],
  primaryAction, secondaryAction, menu, first = false, loading = false,
}) {
  if (loading) return <Skeleton first={first} />;
  const sharePct = share != null ? Math.max(0, Math.min(100, Number(share) || 0)) : null;
  return (
    <div className="un2-prow un2-zoom" style={S.row(first)}>
      <div className="un2-prow-photo" style={S.photo}>
        <Photo image={image} fallbackImage={fallbackImage} />
      </div>

      <div style={S.body}>
        <div style={S.head}>
          <div style={UI2.minWidth0}>
            <div style={S.titleRow}>
              <span style={S.name}>{name}</span>
              {status && <span style={UI2.pill(status.tone)}>{status.label}</span>}
            </div>
            {(address || typeLabel) && (
              <div style={S.addr}>
                <i className="ti ti-map-pin" style={S.addrIcon} aria-hidden="true" />
                {address && <span>{address}</span>}
                {address && typeLabel && <span style={S.sep} aria-hidden="true">·</span>}
                {typeLabel && <span>{typeLabel}</span>}
              </div>
            )}
          </div>

          {sharePct != null && (
            <div style={S.share}>
              <ProgressRing value={sharePct} size={SZ2.ownershipRing} stroke={SP2.xs} gradient={GSTOPS2.success} track={C2.successLight} ariaLabel={`Ownership ${sharePct}%`}>
                <span style={S.shareVal}>{sharePct}%</span>
              </ProgressRing>
              <span style={S.shareLbl}>Ownership</span>
            </div>
          )}
          {menu && menu.length > 0 && <OptionsMenu items={menu} inline />}
        </div>

        {stats.length > 0 && (
          <div style={S.stats}>
            {stats.map((s, i) => (
              <div key={s.label} style={S.stat(i === 0)}>
                <i className={`ti ${s.icon} un2-hide-narrow`} style={S.statIcon} aria-hidden="true" />
                <div style={UI2.minWidth0}>
                  <div style={S.statVal}>{s.value}</div>
                  <div style={S.statLbl}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(primaryAction || secondaryAction) && (
          <div style={S.actions}>
            {primaryAction && <TextLink onClick={primaryAction.onClick}>{primaryAction.label}</TextLink>}
            {secondaryAction && <TextLink arrow={false} style={S.altLink} onClick={secondaryAction.onClick}>{secondaryAction.label}</TextLink>}
          </div>
        )}
      </div>
    </div>
  );
}
