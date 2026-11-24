import React, { useEffect, useRef } from 'react';
import { ILLUS2 } from '../../constants';

// ─── Particles (Design System v2) ────────────────────────────────────────────
// Weather over a photo: falling LEAVES (tumbling, swaying in a light breeze), RAIN (slanted streaks) or a night
// sky of STARS (twinkling, in the upper part only) with an occasional shooting star (comet) streaking across.
// Drawn on a canvas that fills its parent (parent must be position: relative / absolute + overflow: hidden),
// so the photo underneath keeps its full quality. Time-based (same speed on 60 / 120 Hz screens), sharp on
// retina, pauses with the tab, and draws nothing for users who prefer reduced motion. Purely decorative.
//
//   <div style={{ position: 'relative', overflow: 'hidden' }}>
//     <img … />
//     <Particles variant="leaves" />          // or variant="rain"
//   </div>
//
// Props: variant ('leaves' | 'rain' | 'stars'), density (multiplier, default 1), style,
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
  //   stars: sky = the top share of the box the stars live in · r = star radius · twinkleHz = brightness pulse ·
  //          glowFrom = stars at least this big get a soft halo ·
  //          comets: ONE big comet first (first = when), again every bigEvery s; small ones drift by every smallEvery s.
  //          Per kind: speed (px/s — slow, gliding) · len = tail length · width = head / tail thickness · angle =
  //          steepness below horizontal (radians, travelling down-left) · startX / startY = where it appears (share of
  //          the width / height); each flies on until it has left the photo —
  //          sky + startY + angle keep the stars AND the comets in the open sky, never over the building
  stars:  {
    count: 18, sky: 0.36, r: [0.45, 1.5], twinkleHz: [0.12, 0.5], alpha: [0.3, 1], glowFrom: 1.1,
    comets: {
      first: [0.8, 1.4], bigEvery: [16, 22], smallEvery: [3.5, 7],
      // every meteor flies all the way out of the photo (no burning out mid-sky) — shallow angles keep even a full
      // crossing above the roof · fadeIn = px it travels while fading in from nothing
      big:   { speed: [90, 120], fadeIn: 90, len: [190, 260], width: 2.6, angle: [0.2, 0.3],  startX: [0.75, 1.0], startY: [0.02, 0.08] },
      small: { speed: [70, 100], fadeIn: 60, len: [70, 120],  width: 1.3, angle: [0.22, 0.36], startX: [0.35, 1.0], startY: [0.0, 0.1] },
    },
  },
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

function makeStar(w, h, c) {
  return { x: Math.random() * w, y: Math.random() * h * c.sky, r: rand(c.r), hz: rand(c.twinkleHz), phase: Math.random() * Math.PI * 2, alpha: rand(c.alpha) };
}
// meteor (big fireball or small one): fades in out of nothing as a point · the streak behind it is the path it has
// travelled (grows from its start, never longer than len) · glides at a slow, steady speed with a faint flicker ·
// flies on until head AND tail have left the photo
function makeComet(w, h, k) {
  const a = rand(k.angle);
  return {
    x: w * rand(k.startX), y: h * rand(k.startY), width: k.width, fadeIn: k.fadeIn,
    dx: -Math.cos(a), dy: Math.sin(a), speed: rand(k.speed), len: rand(k.len), dist: 0,
  };
}
// returns false once the whole streak (head + tail) is past the left / bottom edge
function stepComet(m, dt, w, h) {
  const step = m.speed * dt;
  m.dist += step; m.x += m.dx * step; m.y += m.dy * step;
  const len = Math.min(m.dist, m.len);
  const tailX = m.x - m.dx * len; const tailY = m.y - m.dy * len;
  return tailX >= 0 && tailY <= h;   // the tail trails up-right of the head, so it leaves last
}
function drawStars(ctx, stars, c, time) {
  stars.forEach(s => {
    const a = s.alpha * (0.55 + 0.45 * Math.sin(time * s.hz * Math.PI * 2 + s.phase));   // twinkle
    if (s.r >= c.glowFrom) {
      ctx.globalAlpha = a;
      ctx.fillStyle = ILLUS2.starGlow;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = ILLUS2.star;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  });
}
function drawComet(ctx, m) {
  // brightness: eases in from nothing over the first fadeIn px, then steady with a faint flicker
  const k = Math.min(1, m.dist / m.fadeIn);
  const bright = k * k * (3 - 2 * k) * (0.9 + Math.random() * 0.1);
  if (bright <= 0.01) return;
  // trail = the path behind the head (never behind the start point)
  const len = Math.min(m.dist, m.len);
  if (len < 1) return;
  const tx = m.x - m.dx * len; const ty = m.y - m.dy * len;
  // tapered streak: full width at the head → a point at the tail, white → pale blue → nothing
  const nx = -m.dy * m.width * 0.5; const ny = m.dx * m.width * 0.5;
  const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
  grad.addColorStop(0, ILLUS2.cometHead);
  grad.addColorStop(0.35, ILLUS2.cometMid);
  grad.addColorStop(1, ILLUS2.cometTail);
  ctx.globalAlpha = bright;
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(m.x + nx, m.y + ny); ctx.lineTo(tx, ty); ctx.lineTo(m.x - nx, m.y - ny); ctx.closePath(); ctx.fill();
  // glowing head: soft halo + bright core
  const r = m.width * 4;
  const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
  glow.addColorStop(0, ILLUS2.cometGlow);
  glow.addColorStop(1, ILLUS2.cometGlowEnd);
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ILLUS2.cometHead;
  ctx.beginPath(); ctx.arc(m.x, m.y, m.width * 0.6, 0, Math.PI * 2); ctx.fill();
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
    const isStars = variant === 'stars';
    const make = isRain ? makeDrop : makeLeaf;
    const src = JSON.parse(sourceKey);
    let w = 0; let h = 0; let parts = []; let raf = 0; let last = 0; let areas = null;
    // stars: comets in flight · seconds to the next big / small one · clock (nextBig < 0 = not scheduled yet)
    let comets = []; let nextBig = -1; let nextSmall = 0; let time = 0;

    const resize = () => {
      const box = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width; h = box.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (isStars) {   // a fresh star field for the new size (the stars don't move, so nothing to carry over)
        const n = Math.max(1, Math.round(((w * h * c.sky) / 100000) * c.count * density));
        parts = Array.from({ length: n }, () => makeStar(w, h, c));
        if (nextBig < 0) { nextBig = rand(c.comets.first); nextSmall = nextBig + rand(c.comets.smallEvery); }   // the big one opens the show
        return;
      }
      areas = isRain ? null : mapAreas(w, h, src);
      const n = Math.max(1, Math.round(((w * h) / 100000) * c.count * density));
      parts = Array.from({ length: n }, (_, i) => parts[i] || make(w, h, c, true, areas));
    };

    const frame = (now) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);   // seconds; capped so a background tab doesn't jump
      last = now;
      ctx.clearRect(0, 0, w, h);
      if (isStars) {
        time += dt;
        drawStars(ctx, parts, c, time);
        nextBig -= dt; nextSmall -= dt;
        if (nextBig <= 0) { comets.push(makeComet(w, h, c.comets.big)); nextBig = rand(c.comets.bigEvery); }
        if (nextSmall <= 0) { comets.push(makeComet(w, h, c.comets.small)); nextSmall = rand(c.comets.smallEvery); }
        comets = comets.filter(m => {
          if (!stepComet(m, dt, w, h)) return false;   // flown out of the photo
          drawComet(ctx, m);
          return true;
        });
      } else if (isRain) {
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
