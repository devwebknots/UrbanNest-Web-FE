import React, { useEffect, useRef } from 'react';
import { ILLUS2 } from '../../constants';

// ─── Particles (Design System v2) ────────────────────────────────────────────
// Weather over a photo: falling LEAVES (tumbling, swaying in a light breeze) or RAIN (slanted streaks).
// Drawn on a canvas that fills its parent (parent must be position: relative / absolute + overflow: hidden),
// so the photo underneath keeps its full quality. Time-based (same speed on 60 / 120 Hz screens), sharp on
// retina, pauses with the tab, and draws nothing for users who prefer reduced motion. Purely decorative.
//
//   <div style={{ position: 'relative', overflow: 'hidden' }}>
//     <img … />
//     <Particles variant="leaves" />          // or variant="rain"
//   </div>
//
// Props: variant ('leaves' | 'rain'), density (multiplier, default 1), style,
//        source (leaves only) — where in the PHOTO the leaves come from, so they drop out of its trees:
//          { ratio: photo width / height, position: [x, y] = the img's object-position as 0–1,
//            areas: [[x0, y0, x1, y1], …] = tree crowns as fractions of the photo (0–1) }
//        The areas are mapped through the same object-fit: cover crop as the <img>, so they stay on the trees
//        at any card size. Each leaf fades in on a branch, then speeds up as it falls (it detaches).
//        Without source, leaves enter from above the top edge.

// Physics per variant — speeds in px / second, sizes in CSS px, times in s. count = particles per 100 000 px².
//   leaves: detach = time to reach full falling speed · fadeIn = time to appear on the branch ·
//           wait = pause before a new leaf lets go (first load: up to 3× this, so they leave one by one)
const CONFIG = {
  leaves: { count: 2.6, detach: 1.2, fadeIn: 0.6, wait: [0, 1.6], size: [5, 9], fall: [28, 62], sway: [18, 46], swayHz: [0.18, 0.42], spin: [-1.4, 1.4], flipHz: [0.25, 0.7], wind: 10, alpha: [0.75, 0.95] },
  rain:   { count: 22, len: [12, 26], fall: [620, 900], wind: 120, width: [0.8, 1.3], alpha: [0.35, 0.8] },
};

const rand = ([a, b]) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// photo-fraction areas → canvas px, through the img's object-fit: cover crop (+ object-position)
function mapAreas(w, h, source) {
  if (!source || !source.areas) return null;
  const imgW = Math.max(w, h * source.ratio);
  const imgH = imgW / source.ratio;
  const [px, py] = source.position || [0.5, 0.5];
  const ox = (w - imgW) * px;
  const oy = (h - imgH) * py;
  const areas = source.areas
    .map(([x0, y0, x1, y1]) => ({
      x0: Math.max(0, ox + x0 * imgW), x1: Math.min(w, ox + x1 * imgW),
      y0: Math.max(0, oy + y0 * imgH), y1: Math.min(h, oy + y1 * imgH),
    }))
    .filter(a => a.x1 - a.x0 > 4 && a.y1 - a.y0 > 4)   // crown cropped out of view → skip it
    .map(a => ({ ...a, weight: (a.x1 - a.x0) * (a.y1 - a.y0) }));
  return areas.length ? areas : null;
}

// a point inside one of the on-screen tree areas (bigger crowns drop more leaves); none → just above the top edge
function spawnPoint(w, areas) {
  if (!areas) return { x: Math.random() * w, y: -rand([10, 40]) };
  let r = Math.random() * areas.reduce((sum, a) => sum + a.weight, 0);
  const a = areas.find(ar => (r -= ar.weight) <= 0) || areas[areas.length - 1];
  return { x: rand([a.x0, a.x1]), y: rand([a.y0, a.y1]) };
}

function makeLeaf(w, h, c, first, areas) {
  const at = spawnPoint(w, areas);
  return {
    x: at.x, y: at.y, wait: first ? rand([0, c.wait[1] * 3]) : rand(c.wait), t: 0,
    size: rand(c.size), fall: rand(c.fall), sway: rand(c.sway), swayHz: rand(c.swayHz), phase: Math.random() * Math.PI * 2,
    rot: Math.random() * Math.PI * 2, spin: rand(c.spin), flipHz: rand(c.flipHz), flip: Math.random() * Math.PI * 2,
    color: pick(ILLUS2.leaves), alpha: rand(c.alpha),
  };
}
function makeDrop(w, h, c, first) {
  return { x: Math.random() * (w + c.wind) - c.wind * 0.5, y: first ? Math.random() * h : -rand([0, h]), len: rand(c.len), fall: rand(c.fall), width: rand(c.width), alpha: rand(c.alpha) };
}

// leaf: small, rounded with a pointed tip (short + wide, not long) + a faint midrib; flip squashes it → 3D tumble
function drawLeaf(ctx, p, alpha) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.flip)));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  // rounded base (left) → pointed tip (right); about 1.5 : 1 long : wide — a small round leaf, not a long one
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, 0);
  ctx.bezierCurveTo(-s * 0.7, -s * 0.55, s * 0.25, -s * 0.6, s * 0.8, 0);
  ctx.bezierCurveTo(s * 0.25, s * 0.6, -s * 0.7, s * 0.55, -s * 0.7, 0);
  ctx.fill();
  ctx.strokeStyle = ILLUS2.leafVein;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, 0);          // short stem poking out of the base
  ctx.lineTo(s * 0.6, 0);
  ctx.stroke();
  ctx.restore();
}

export default function Particles({ variant = 'leaves', density = 1, source, style }) {
  const ref = useRef(null);
  const sourceKey = JSON.stringify(source || null);   // effect re-runs only when the areas really change

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = canvas.getContext('2d');
    const c = CONFIG[variant] || CONFIG.leaves;
    const isRain = variant === 'rain';
    const make = isRain ? makeDrop : makeLeaf;
    const src = JSON.parse(sourceKey);
    let w = 0; let h = 0; let parts = []; let raf = 0; let last = 0; let areas = null;

    const resize = () => {
      const box = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width; h = box.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      areas = isRain ? null : mapAreas(w, h, src);
      const n = Math.max(1, Math.round(((w * h) / 100000) * c.count * density));
      parts = Array.from({ length: n }, (_, i) => parts[i] || make(w, h, c, true, areas));
    };

    const frame = (now) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);   // seconds; capped so a background tab doesn't jump
      last = now;
      ctx.clearRect(0, 0, w, h);
      if (isRain) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = ILLUS2.rain;
        parts.forEach((p, i) => {
          p.y += p.fall * dt; p.x += c.wind * dt;
          if (p.y - p.len > h || p.x > w + c.wind) { parts[i] = make(w, h, c, false); return; }
          const k = p.len / p.fall;   // streak points back along its own direction of travel
          ctx.globalAlpha = p.alpha;
          ctx.lineWidth = p.width;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - c.wind * k, p.y - p.len);
          ctx.stroke();
        });
      } else {
        parts.forEach((p, i) => {
          if (p.wait > 0) { p.wait -= dt; return; }   // not let go of the branch yet
          p.t += dt;
          // detaching: speed eases up from 0 → full over c.detach s (smoothstep), so it drops off the branch
          const k = Math.min(1, p.t / c.detach);
          const go = k * k * (3 - 2 * k);
          p.y += p.fall * go * dt;
          p.x += (c.wind + Math.cos(p.t * p.swayHz * Math.PI * 2 + p.phase) * p.sway) * go * dt;
          p.rot += p.spin * go * dt;
          p.flip += p.flipHz * Math.PI * 2 * dt;
          if (p.y - p.size > h || p.x < -p.size * 3 || p.x > w + p.size * 3) { parts[i] = make(w, h, c, false, areas); return; }
          drawLeaf(ctx, p, p.alpha * Math.min(1, p.t / c.fadeIn));   // fades in out of the tree's own leaves
        });
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [variant, density, sourceKey]);

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }} />;
}
