import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { C2, G2, R2, SH2, TONES2, F2, FS2, FW2, LH2, SP2, SZ2, ZI2, pad, UI2 } from '../../constants';

// ─── FilterMenu (Design System v2) ───────────────────────────────────────────
// VERSION 2 dropdown — the v1 equivalent in this folder is CustomDropdown.jsx (older screens).
// Filter icon button for a card header (SectionCard `action`). Click → dropdown list to pick one
// option (e.g. one of the landlord's properties); the first row resets to "All".
// A small blue dot on the icon shows a filter is active.
//
// STANDARD DROPDOWN LOOK (user design, Downloads/6066815329544902850 1.png — every v2 dropdown, FilterMenu + SelectField):
//   white rounded panel (R2.lg, SH2.lg, no border) · rows SZ2.field (36) high, icon tile SZ2.icon.sm (28) · rows = soft grey icon tile (grey glyph) + Inter 13 label,
//   faint divider between unselected rows (starts at the label) · selected row = light-blue gradient
//   (G2.menuSelected) with a blue icon tile, primary-dark medium label
//   (no ✓ on the right — user removed it; the gradient + blue tile mark the selection).
//
//   (⚲)  ┌──────────────────────────────────┐
//        │ ▐[▦]  All properties             ▌│  ← selected: light-blue gradient
//        │  [▦]  Regent Plaza               │
//        │       ─────────────────────────  │
//        │  [▦]  Kingston Riverside …       │
//        └──────────────────────────────────┘
//
//   <FilterMenu title="Filter by property" allLabel="All properties" itemIcon="ti-building" allIcon="ti-buildings"
//               options={[{ value: 12, label: 'Regent Plaza' }, …]} value={propId} onChange={setPropId} />
//
// Icons: option.icon (tabler class) wins, else itemIcon; the "All" row uses allIcon (default itemIcon).
// Rows without an icon show no tile (plain text rows, same selected / divider style).
//
// Props: options [{ value, label, icon? }] · value (null = all) · onChange(value | null) · title (aria label / tooltip)
//        itemIcon · allIcon (see Icons above)
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
    display: 'flex', flexDirection: 'column', gap: SP2.xxs,
    padding: SP2.xs, background: C2.white, borderRadius: R2.lg, boxShadow: SH2.lg, fontFamily: F2.body,
  }),
  item:   (on, withIcon) => ({
    ...UI2.row(SP2.sm), position: 'relative', flexShrink: 0, width: '100%', minHeight: SZ2.field,   // standard field height (36)
    padding: withIcon ? pad(SP2.xs, SP2.sm, SP2.xs, SP2.xs) : pad(SP2.xs, SP2.sm),
    border: 'none', borderRadius: R2.md, cursor: 'pointer', textAlign: 'left',
    background: on ? G2.menuSelected : 'transparent', color: on ? C2.primaryDark : C2.navyDeep,
    fontFamily: F2.body, fontSize: FS2.base, fontWeight: on ? FW2.medium : FW2.regular, lineHeight: LH2.heading,
  }),
  tile:   (on) => ({ ...UI2.iconBox(SZ2.icon.sm, TONES2.primary), borderRadius: R2.sm, background: on ? C2.primarySoft : C2.surfaceMuted, color: on ? C2.primary : C2.textSecondary }),
  // faint divider above a row, starting where the label starts (never next to the selected row)
  rule:   (withIcon) => ({ position: 'absolute', top: -SP2.xxs / 2, left: withIcon ? SP2.xs + SZ2.icon.sm + SP2.sm : SP2.sm, right: SP2.sm, height: 1, background: C2.divider }),
  label:  { ...UI2.truncate, minWidth: 0, flex: 1 },
  empty:  { ...UI2.text.caption, padding: pad(SP2.sm, SP2.sm) },
};

export default function FilterMenu({
  options = [], value = null, onChange, title = 'Filter', allLabel = 'All', icon = 'ti-adjustments-horizontal', ariaLabel,
  trigger, triggerStyle, showAll = true, matchWidth = false, itemIcon, allIcon,
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
  const rows = (showAll ? [{ value: null, label: allLabel, icon: allIcon || itemIcon }, ...options] : options)
    .map(o => ({ ...o, icon: o.icon || itemIcon }));

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
        <div ref={menuRef} className="un2-menu" style={S.menu(pos)} role="listbox" aria-label={ariaLabel || title}>
          {rows.map((o, i) => {
            const on = o.value === value;
            const ruled = i > 0 && !on && rows[i - 1].value !== value;
            return (
              <button
                key={o.value ?? '__all'} type="button" role="option" aria-selected={on}
                className="un2-menu-item" style={S.item(on, !!o.icon)} onClick={() => pick(o.value)} title={o.label}
              >
                {ruled && <span className="un2-menu-rule" style={S.rule(!!o.icon)} aria-hidden="true" />}
                {o.icon && <span style={S.tile(on)} aria-hidden="true"><i className={`ti ${o.icon}`} /></span>}
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
