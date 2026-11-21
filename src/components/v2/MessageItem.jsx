import React from 'react';
import { C2, FS2, FW2, LH2, LS2, T2, R2, SP2, LAYOUT2, pad, UI2 } from '../../constants/v2';

// ─── MessageItem (Design System v2) ──────────────────────────────────────────
// Message bubble for a dark card (SectionCard variant="dark"): sender · time · text.
//
//   <MessageItem from="Estate Manager" fromColor={C2.skyOnDark} time="14:20">
//     "The inspection is finalized."
//   </MessageItem>

const S = {
  box:  { padding: pad(SP2.sm, SP2.md), borderRadius: R2.lg, background: C2.onDark.surface, marginBottom: LAYOUT2.rowGap },
  from: { fontSize: FS2.xs, fontWeight: FW2.semibold, letterSpacing: LS2.wide, textTransform: 'uppercase' },
  time: { fontSize: FS2.xs, color: C2.onDark.textFaint },
  text: { ...T2.quote, color: C2.onDark.textSoft, marginTop: SP2.xs },
};

export default function MessageItem({ from, fromColor = C2.skyOnDark, time, children }) {
  return (
    <div style={S.box}>
      <div style={UI2.rowBetween()}>
        <span style={{ ...S.from, color: fromColor }}>{from}</span>
        {time && <span style={S.time}>{time}</span>}
      </div>
      <div style={S.text}>{children}</div>
    </div>
  );
}
