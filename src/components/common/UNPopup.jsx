// ─────────────────────────────────────────────────────────────
// UrbanNest — UNPopup
// Path: src/components/common/UNPopup.jsx
//
// System-wide popup component. Covers 4 states:
//   success  — action completed
//   error    — action blocked or failed
//   warning  — confirmation required before proceeding
//   info     — informational, no destructive action
//
// Usage:
//   import UNPopup from '../../../components/common/UNPopup';
//
//   <UNPopup
//     type="success"
//     title="Ownership approved"
//     message="John Honai's ownership for Global 4 has been verified."
//     onClose={() => setPopup(null)}
//   />
//
//   <UNPopup
//     type="warning"
//     title="Confirm rejection"
//     message="Are you sure you want to reject this application? This cannot be undone."
//     confirmLabel="Yes, reject"
//     cancelLabel="Cancel"
//     onConfirm={handleReject}
//     onClose={() => setPopup(null)}
//   />
//
// Props:
//   type          'success' | 'error' | 'warning' | 'info'   (required)
//   title         string                                       (required)
//   message       string                                       (required)
//   onClose       fn — called on X, backdrop click, Dismiss    (required)
//   onConfirm     fn — called on primary CTA                  (optional — warning/info with action)
//   confirmLabel  string — primary CTA label                  (default per type)
//   cancelLabel   string — secondary CTA label                (default 'Cancel')
//   loading       bool — shows spinner on confirm button      (optional)
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';

const C = {
  primary: '#002D5B',
  white:   '#FFFFFF',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const TYPE_CFG = {
  success: {
    iconName:    'ti-circle-check',
    iconColor:   '#16A34A',
    iconBg:      '#F0FDF4',
    iconBorder:  '#BBF7D0',
    ctaBg:       '#002D5B',
    ctaColor:    '#FFFFFF',
    defaultCta:  'Done',
    showCancel:  false,
  },
  error: {
    iconName:    'ti-alert-circle',
    iconColor:   '#DC2626',
    iconBg:      '#FEF2F2',
    iconBorder:  '#FECACA',
    ctaBg:       '#DC2626',
    ctaColor:    '#FFFFFF',
    defaultCta:  'Dismiss',
    showCancel:  false,
  },
  warning: {
    iconName:    'ti-alert-triangle',
    iconColor:   '#D97706',
    iconBg:      '#FEF3C7',
    iconBorder:  '#FCD34D',
    ctaBg:       '#D97706',
    ctaColor:    '#FFFFFF',
    defaultCta:  'Confirm',
    showCancel:  true,
  },
  info: {
    iconName:    'ti-info-circle',
    iconColor:   '#2563EB',
    iconBg:      '#EFF6FF',
    iconBorder:  '#BFDBFE',
    ctaBg:       '#002D5B',
    ctaColor:    '#FFFFFF',
    defaultCta:  'OK',
    showCancel:  true,
  },
};

export default function UNPopup({
  type         = 'info',
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel  = 'Cancel',
  loading      = false,
}) {
  const cfg = TYPE_CFG[type] || TYPE_CFG.info;
  const ctaLabel = confirmLabel || cfg.defaultCta;

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleConfirm() {
    if (loading) return;
    if (onConfirm) {
      onConfirm();
    } else {
      onClose?.();
    }
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes un-popup-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes un-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .un-popup-btn:hover { opacity: 0.88; }
        .un-popup-btn:active { transform: scale(0.98); }
        .un-popup-cancel:hover { background: rgba(0,0,0,0.04) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         900,
          background:     'rgba(0, 0, 0, 0.45)',
          animation:      'un-backdrop-in 0.15s ease',
        }}
      />

      {/* Popup */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="un-popup-title"
        onClick={e => e.stopPropagation()}
        style={{
          position:     'fixed',
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%, -50%)',
          zIndex:       901,
          width:        420,
          maxWidth:     'calc(100vw - 32px)',
          background:   C.white,
          borderRadius: 14,
          overflow:     'hidden',
          boxShadow:    '0 24px 64px rgba(0,0,0,0.20)',
          animation:    'un-popup-in 0.18s ease',
        }}
      >

        {/* ── Header bar ── */}
        <div style={{
          background:  C.primary,
          padding:     '13px 18px',
          display:     'flex',
          alignItems:  'center',
          gap:         10,
          flexShrink:  0,
        }}>
          {/* Logo mark */}
          <div style={{
            width:          24,
            height:         24,
            background:     'rgba(255,255,255,0.15)',
            borderRadius:   6,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}>
            <i className="ti ti-home" aria-hidden="true" style={{ fontSize: 13, color: C.white }} />
          </div>

          {/* Brand name */}
          <span style={{
            fontFamily: F.headline,
            fontSize:   14,
            fontWeight: 700,
            color:      C.white,
            lineHeight: 1,
            letterSpacing: '0.01em',
          }}>
            Urban<span style={{ color: '#60A5FA' }}>Nest</span>
          </span>

          {/* Close X */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft:     'auto',
              width:          24,
              height:         24,
              background:     'none',
              border:         'none',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        0,
              borderRadius:   4,
              opacity:        0.7,
              transition:     'opacity 0.15s',
            }}
          >
            <i className="ti ti-x" aria-hidden="true" style={{ fontSize: 15, color: C.white }} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '22px 22px 20px' }}>

          {/* Icon + text */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>

            {/* Icon circle */}
            <div style={{
              width:          40,
              height:         40,
              borderRadius:   '50%',
              background:     cfg.iconBg,
              border:         `1px solid ${cfg.iconBorder}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}>
              <i className={`ti ${cfg.iconName}`} aria-hidden="true" style={{ fontSize: 20, color: cfg.iconColor }} />
            </div>

            {/* Title + message */}
            <div style={{ paddingTop: 2 }}>
              <p
                id="un-popup-title"
                style={{
                  margin:      '0 0 5px',
                  fontFamily:  F.headline,
                  fontSize:    15,
                  fontWeight:  700,
                  color:       '#0F172A',
                  lineHeight:  1.3,
                }}
              >
                {title}
              </p>
              <p style={{
                margin:     0,
                fontFamily: F.body,
                fontSize:   12,
                color:      '#64748B',
                lineHeight: 1.65,
              }}>
                {message}
              </p>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>

            {/* Cancel — shown for warning + info with onConfirm */}
            {(cfg.showCancel && onConfirm) && (
              <button
                className="un-popup-cancel"
                onClick={onClose}
                style={{
                  height:      36,
                  padding:     '0 18px',
                  background:  'transparent',
                  border:      '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 8,
                  fontFamily:  F.body,
                  fontSize:    12,
                  fontWeight:  600,
                  color:       '#64748B',
                  cursor:      'pointer',
                  transition:  'background 0.15s',
                }}
              >
                {cancelLabel}
              </button>
            )}

            {/* Primary CTA */}
            <button
              className="un-popup-btn"
              onClick={handleConfirm}
              disabled={loading}
              style={{
                height:      36,
                padding:     '0 20px',
                background:  loading ? '#94A3B8' : cfg.ctaBg,
                border:      'none',
                borderRadius: 8,
                fontFamily:  F.body,
                fontSize:    12,
                fontWeight:  700,
                color:       cfg.ctaColor,
                cursor:      loading ? 'not-allowed' : 'pointer',
                display:     'flex',
                alignItems:  'center',
                gap:         6,
                transition:  'opacity 0.15s, transform 0.1s',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width:       13,
                    height:      13,
                    border:      '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: C.white,
                    borderRadius: '50%',
                    animation:   'un-spin 0.7s linear infinite',
                  }} />
                  Processing…
                </>
              ) : ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
