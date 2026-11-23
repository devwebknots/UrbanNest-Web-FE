import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { C2, R2, SH2, TONES2, F2, FS2, FW2, LH2, T2, SP2, SZ2, ZI2, pad, UI2 } from '../../constants';

// ─── FilterMenu (Design System v2) ───────────────────────────────────────────
// VERSION 2 dropdown — the v1 equivalent in this folder is CustomDropdown.jsx (older screens).
// Filter icon button for a card header (SectionCard `action`). Click → dropdown list to pick one
// option (e.g. one of the landlord's properties); the first row resets to "All".
// A small blue dot on the icon shows a filter is active.
//
//   (⚲)  ┌──────────────────────────┐
//        │ FILTER BY PROPERTY       │
//        │ ✓ All properties         │
//        │   Regent Plaza           │
//        │   Kingston Riverside …   │
//        └──────────────────────────┘
//
//   <FilterMenu title="Filter by property" allLabel="All properties"
//               options={[{ value: 12, label: 'Regent Plaza' }, …]} value={propId} onChange={setPropId} />
//
// Props: options [{ value, label }] · value (null = all) · onChange(value | null) · title (menu heading)
//        allLabel · icon (tabler class, default 'ti-adjustments-horizontal' — three lines with dots) · ariaLabel
//        trigger (node | (open) => node) + triggerStyle → custom trigger instead of the icon (e.g. a property picker)
//        showAll (default true — false hides the "All" row) · matchWidth (menu as wide as the trigger)
// The menu renders in a portal (position: fixed under the button, right-aligned) so no card,
// glass blur or overflow can clip or cover it. Closes on outside click, Esc, scroll and resize.

const S = {
  wrap:   { position: 'relative', display: 'inline-flex' },
  wrapFull: { position: 'relative', display: 'flex', width: '100%' },   // custom trigger (picker) spans its container
  btn:    (active) => ({ ...UI2.btn.icon(SZ2.control.md), fontSize: FS2.lg, color: active ? C2.primary : C2.textSecondary, background: active ? C2.primaryTint : C2.surfaceMuted }),
  dot:    { ...UI2.statusDot(TONES2.primary), position: 'absolute', top: SP2.xs, right: SP2.xs, border: `2px solid ${C2.white}`, boxSizing: 'content-box' },
  menu:   (pos) => ({
    position: 'fixed', top: pos.top, right: pos.right, zIndex: ZI2.menu, width: pos.width || SZ2.menu.w, maxHeight: SZ2.menu.maxH, overflowY: 'auto',
    padding: SP2.xs, background: C2.white, borderRadius: R2.lg, boxShadow: SH2.lg, fontFamily: F2.body,
  }),
  head:   { ...T2.eyebrow, padding: pad(SP2.sm, SP2.sm, SP2.xs) },
  item:   (on) => ({
    ...UI2.row(SP2.sm), width: '100%', padding: pad(SP2.sm, SP2.sm), border: 'none', borderRadius: R2.md, cursor: 'pointer', textAlign: 'left',
    background: on ? C2.primaryTint : 'transparent', color: on ? C2.primary : C2.navyDeep,
    fontFamily: F2.body, fontSize: FS2.base, fontWeight: on ? FW2.medium : FW2.regular, lineHeight: LH2.heading,
  }),
  check:  (on) => ({ width: FS2.lg, flexShrink: 0, fontSize: FS2.lg, visibility: on ? 'visible' : 'hidden' }),
  label:  { ...UI2.truncate, minWidth: 0, flex: 1 },
  empty:  { ...UI2.text.caption, padding: pad(SP2.sm, SP2.sm) },
};

export default function FilterMenu({
  options = [], value = null, onChange, title = 'Filter', allLabel = 'All', icon = 'ti-adjustments-horizontal', ariaLabel,
  trigger, triggerStyle, showAll = true, matchWidth = false,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0, width: null });
  const btnRef  = useRef(null);
  const menuRef = useRef(null);
  const active  = value != null;

  // Place the menu under the button, right edges aligned
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + SP2.xs, right: window.innerWidth - r.right, width: matchWidth ? r.width : null });
  }, [open, matchWidth]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onDown = e => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = e => { if (e.key === 'Escape') { close(); btnRef.current?.focus(); } };
    // scroll inside the menu itself must not close it
    const onScroll = e => { if (!menuRef.current?.contains(e.target)) close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const pick = v => { onChange?.(v); setOpen(false); };
  const rows = showAll ? [{ value: null, label: allLabel }, ...options] : options;

  return (
    <div style={trigger ? S.wrapFull : S.wrap}>
      <button
        ref={btnRef} type="button" className="un2-btn" style={trigger ? triggerStyle : S.btn(active)}
        aria-label={ariaLabel || title} aria-haspopup="listbox" aria-expanded={open} title={title}
        onClick={() => setOpen(o => !o)}
      >
        {trigger ? (typeof trigger === 'function' ? trigger(open) : trigger) : (
          <>
            <i className={`ti ${icon}`} aria-hidden="true" />
            {active && <span style={S.dot} aria-hidden="true" />}
          </>
        )}
      </button>

      {open && createPortal(
        <div ref={menuRef} className="un2-menu" style={S.menu(pos)} role="listbox" aria-label={title}>
          <div style={S.head}>{title}</div>
          {rows.map(o => {
            const on = o.value === value;
            return (
              <button
                key={o.value ?? '__all'} type="button" role="option" aria-selected={on}
                className="un2-menu-item" style={S.item(on)} onClick={() => pick(o.value)} title={o.label}
              >
                <i className="ti ti-check" style={S.check(on)} aria-hidden="true" />
                <span style={S.label}>{o.label}</span>
              </button>
            );
          })}
          {options.length === 0 && <div style={S.empty}>No properties yet.</div>}
        </div>,
        document.body,
      )}
    </div>
  );
}
