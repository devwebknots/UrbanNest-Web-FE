// ─────────────────────────────────────────────
// UrbanNest UI — TestimonialCarousel
// Frosted glass card with quote + nav arrows
// Used on: Login page (left panel)
// ─────────────────────────────────────────────

import { useState } from 'react';
import { F } from '../../constants/fonts';

export default function TestimonialCarousel({ testimonials = [] }) {
  const [idx, setIdx] = useState(0);
  const t = testimonials[idx];
  const prev = () => setIdx(i => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIdx(i => (i + 1) % testimonials.length);

  return (
    <div style={{
      position: 'absolute', bottom: 52, left: 40, right: 40,
      background: 'rgba(255,255,255,0.11)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 8, padding: '30px 30px 26px',
    }}>
      <div key={idx} style={{ animation: 'un-fadein 0.3s ease' }}>
        <p style={{ fontFamily: F.headline, fontStyle: 'italic', fontSize: 16, lineHeight: 1.68, color: '#fff', marginBottom: 20 }}>
          {t.quote}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 11, letterSpacing: '0.13em', color: '#fff', marginBottom: 3 }}>
              {t.name}
            </div>
            <div style={{ fontFamily: F.body, fontWeight: 400, fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
              {t.title}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[prev, next].map((fn, i) => (
              <button key={i} onClick={fn}
                className="un-navbtn"
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                aria-label={i === 0 ? 'Previous testimonial' : 'Next testimonial'}>
                {i === 0 ? '‹' : '›'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
