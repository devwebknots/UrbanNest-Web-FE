import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { C2, G2, R2, SH2, F2, SP2, SZ2, ZI2, pad, T2, UI2 } from '../../constants';

// ─── Modal (Design System v2) ────────────────────────────────────────────────
// Centred white card over a dimmed page (portal on document.body). Closes on the × button, a click on the
// dimmed backdrop and Esc.
//
//   <Modal title="Premium Plan" eyebrow="Popular" onClose={close}
//          footer={<><button style={UI2.btn.soft} onClick={close}>Close</button>
//                    <button style={UI2.btn.brand} onClick={pick}>Select This Plan</button></>}>
//     …body…
//   </Modal>
//
// Props: title (node), eyebrow (small pill above the title), onClose, footer (buttons, right-aligned), width, children

const S = {
  scrim: { position: 'fixed', inset: 0, zIndex: ZI2.modal, background: G2.modalScrim, ...UI2.center, padding: SP2.xxl },
  card:  (w) => ({
    position: 'relative', width: w, maxWidth: '100%', maxHeight: SZ2.modal.maxH, overflowY: 'auto',
    background: C2.white, borderRadius: R2.xxl, boxShadow: SH2.lg, fontFamily: F2.body, padding: pad(SP2.xxl),
  }),
  close: { ...UI2.btn.icon(SZ2.control.md), position: 'absolute', top: SP2.md, right: SP2.md, color: C2.textSecondary },
  eyebrow: { ...UI2.pill(), marginBottom: SP2.sm },
  title: { ...T2.sectionTitle, margin: 0, paddingRight: SZ2.control.md },
  body:  { marginTop: SP2.lg },
  foot:  { display: 'flex', justifyContent: 'flex-end', gap: SP2.sm, flexWrap: 'wrap', marginTop: SP2.xl },
};

export default function Modal({ title, eyebrow, onClose, footer, width = SZ2.modal.w, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div style={S.scrim} onClick={onClose}>
      <div style={S.card(width)} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onClick={e => e.stopPropagation()}>
        <button type="button" style={S.close} onClick={onClose} aria-label="Close"><i className="ti ti-x" aria-hidden="true" /></button>
        {eyebrow && <span style={S.eyebrow}>{eyebrow}</span>}
        {title && <h2 style={S.title}>{title}</h2>}
        <div style={S.body}>{children}</div>
        {footer && <div style={S.foot}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
