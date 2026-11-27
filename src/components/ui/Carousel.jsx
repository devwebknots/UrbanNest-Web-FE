import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SP2, UI2, MOTION2, pad } from '../../constants';

// ─── Carousel (Design System v2) ─────────────────────────────────────────────
// THE sideways-scrolling card row with the STANDARD round white arrows (UI2.carouselArrow) on both sides —
// PM Subscription (Available Plans) · PM Services (Add-Ons). Never hand-build a carousel.
//
//   [card] [card] [card] [card]  ( › )
//
//   <Carousel label="add-on services" itemWidth={Carousel.cols(3)}>
//     {items.map(i => <article key={i.id} style={{ ...UI2.card }}>…</article>)}
//   </Carousel>
//
// · Arrows NEVER sit over a card (user 2026-11-27). Each arrow lives in its own SP2.huge gutter, vertically centred:
//   right gutter always (same as the original carousel); LEFT gutter only while the row is scrolled — at the start
//   there is no left gutter, so the first card starts on the same line as the section heading. When the user
//   scrolls right the row slides over (padding transition) and the left arrow fades into its gutter; back at the
//   start it slides home again. Card widths are measured against the carousel itself (container units, cqw), so
//   opening the gutter never resizes the cards.
// · An arrow only SHOWS when there is somewhere to go that way (left hidden at the start, right hidden at the end).
// · Arrows are never placed above the row or on an edge fade (both rejected).
// · an arrow scrolls ~one view; the track snaps to cards; the scrollbar is hidden (un2-scroll-hidden)
// · each child gets the item width, so N cards fill one view exactly
//
// Props: label (screen-reader name: "Scroll {label} left / right") · itemWidth (CSS width of each card —
//        Carousel.cols(n) = n cards per view) · minItemWidth (default SZ2.thumbFeature.w via the caller) · children

const GAP = SP2.lg;
const EDGE = SP2.sm;   // px from an end that still counts as "at the end" (absorbs sub-pixel / snap offsets)

const S = {
  // right gutter always; left gutter only while scrolled (slides open / closed)
  // outer box = the measuring container (no padding, so 100cqw is its full width) + arrow anchor;
  // inner box = the gutters (right always, left only while scrolled)
  wrap:  { position: 'relative', containerType: 'inline-size' },
  inner: (scrolled) => ({ padding: pad(0, SP2.huge, 0, scrolled ? SP2.huge : 0), transition: `padding-left ${MOTION2.base}` }),
  // scrollPaddingInline = the track's side padding, so snapping keeps the first card at rest (scrollLeft 0).
  // marginLeft -SP2.xs = its left padding, so the first card's edge lands exactly on the heading line while its
  // shadow still has room.
  track: { display: 'flex', gap: GAP, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingInline: SP2.xs, padding: pad(SP2.xs, SP2.xs, SP2.lg), marginLeft: -SP2.xs },
  item:  (w, min) => ({ flex: `0 0 ${w}`, minWidth: min, scrollSnapAlign: 'start', display: 'flex' }),
  arrow: (side, off) => ({
    ...UI2.carouselArrow(off), position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 1,
    [side]: 0,   // each arrow in its own gutter
    opacity: off ? 0 : 1, visibility: off ? 'hidden' : 'visible', pointerEvents: off ? 'none' : 'auto',
    transition: `opacity ${MOTION2.base}, visibility ${MOTION2.base}`,
  }),
};

export default function Carousel({ label = 'items', itemWidth = Carousel.cols(3), minItemWidth, children }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const update = useCallback(() => {
    const el = ref.current;
    if (el) setEdges({ atStart: el.scrollLeft <= EDGE, atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE });
  }, []);
  const count = React.Children.count(children);
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    // re-check whenever the track or its cards change size (photos loading, cards settling after first paint) —
    // otherwise the arrows could stay hidden although the row does overflow
    const el = ref.current;
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(update) : null;
    if (ro) { ro.observe(el); Array.from(el.children).forEach(c => ro.observe(c)); }
    return () => { window.removeEventListener('resize', update); if (ro) ro.disconnect(); };
  }, [update, count]);
  const scroll = dir => { const el = ref.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' }); };

  return (
    <div style={S.wrap}>
      <button type="button" style={S.arrow('left', edges.atStart)} onClick={() => scroll(-1)} disabled={edges.atStart}
        aria-hidden={edges.atStart} tabIndex={edges.atStart ? -1 : 0} aria-label={`Scroll ${label} left`}>
        <i className="ti ti-chevron-left" aria-hidden="true" />
      </button>
      <div style={S.inner(!edges.atStart)}>
        <div ref={ref} className="un2-scroll-hidden" style={S.track} onScroll={update}>
          {/* real cards only — blank text / stray spaces between tags never become an empty card slot */}
          {React.Children.map(children, child => (child && !(typeof child === 'string' && !child.trim())) && <div style={S.item(itemWidth, minItemWidth)}>{child}</div>)}
        </div>
      </div>
      <button type="button" style={S.arrow('right', edges.atEnd)} onClick={() => scroll(1)} disabled={edges.atEnd}
        aria-hidden={edges.atEnd} tabIndex={edges.atEnd ? -1 : 0} aria-label={`Scroll ${label} right`}>
        <i className="ti ti-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}

// width of one card when `n` cards fill the view (accounts for the gaps)
// measured on the carousel box (100cqw), so it stays the same while the left gutter opens. Room for cards at rest =
// full width − right gutter (SP2.huge) − the track's net side padding (SP2.xs: 4 + 4 padding − 4 left bleed) − the gaps
Carousel.cols = n => `calc((100cqw - ${SP2.huge + SP2.xs + (n - 1) * GAP}px) / ${n})`;
