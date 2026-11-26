import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SP2, UI2, pad } from '../../constants';

// ─── Carousel (Design System v2) ─────────────────────────────────────────────
// THE sideways-scrolling card row with the STANDARD round white arrows (UI2.carouselArrow) on both sides —
// PM Subscription (Available Plans) · PM Services (Add-Ons, More From UrbanNest). Never hand-build a carousel.
//
//   ( ‹ )  [card] [card] [card] [card]  ( › )
//
//   <Carousel label="add-on services" itemWidth={Carousel.cols(3)}>
//     {items.map(i => <article key={i.id} style={{ ...UI2.card }}>…</article>)}
//   </Carousel>
//
// · the arrows sit in the side gutters (never over a card), vertically centred; at each end the arrow is inactive
//   but looks exactly the same (never faded)
// · an arrow scrolls ~one view; the track snaps to cards; the scrollbar is hidden (un2-scroll-hidden)
// · each child gets the item width, so N cards fill one view exactly
//
// Props: label (screen-reader name: "Scroll {label} left / right") · itemWidth (CSS width of each card —
//        Carousel.cols(n) = n cards per view) · minItemWidth (default SZ2.thumbFeature.w via the caller) · children

const GAP = SP2.lg;

const S = {
  wrap:  { position: 'relative', padding: pad(0, SP2.huge) },
  track: { display: 'flex', gap: GAP, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: pad(SP2.xs, SP2.xs, SP2.lg) },
  item:  (w, min) => ({ flex: `0 0 ${w}`, minWidth: min, scrollSnapAlign: 'start', display: 'flex' }),
  arrow: (side, off) => ({ ...UI2.carouselArrow(off), position: 'absolute', top: '50%', [side]: 0, transform: 'translateY(-50%)', zIndex: 1 }),
};

export default function Carousel({ label = 'items', itemWidth = Carousel.cols(3), minItemWidth, children }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const update = useCallback(() => {
    const el = ref.current;
    if (el) setEdges({ atStart: el.scrollLeft <= 2, atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);
  const count = React.Children.count(children);
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, count]);
  const scroll = dir => { const el = ref.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' }); };

  return (
    <div style={S.wrap}>
      <button type="button" style={S.arrow('left', edges.atStart)} onClick={() => scroll(-1)} disabled={edges.atStart} aria-label={`Scroll ${label} left`}>
        <i className="ti ti-chevron-left" aria-hidden="true" />
      </button>
      <div ref={ref} className="un2-scroll-hidden" style={S.track} onScroll={update}>
        {React.Children.map(children, child => child && <div style={S.item(itemWidth, minItemWidth)}>{child}</div>)}
      </div>
      <button type="button" style={S.arrow('right', edges.atEnd)} onClick={() => scroll(1)} disabled={edges.atEnd} aria-label={`Scroll ${label} right`}>
        <i className="ti ti-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}

// width of one card when `n` cards fill the view (accounts for the gaps)
Carousel.cols = n => `calc((100% - ${(n - 1) * GAP}px) / ${n})`;
