import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { C2, CHART2, F2, FS2, FW2, R2, SP2, SZ2, UI2 } from '../../constants/v2';

Chart.register(...registerables);

// ─── Charts (Design System v2) ───────────────────────────────────────────────
// Chart.js wrappers styled with CHART2 colours and v2 type. Pass plain arrays;
// formatting is up to the page.
//
//   <div style={{ position: 'relative', height: SZ2.chart }}>
//     <BarChart labels={['Jun','Jul']} values={[1200, 900]} formatValue={v => '$' + v} />
//   </div>
//   <DonutChart value={92} label="Leased" />
//   <Sparkline labels={months} values={pcts} min={80} max={101} formatValue={v => v + '%'} />
//
// BarChart / Sparkline fill their parent (give the parent a height).

// Hook: (re)build a Chart.js instance whenever deps change, destroy on unmount.
// Array props are compared by content (JSON) so inline arrays don't rebuild every render.
function useChart(build, deps) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, build());
    return () => { if (chartRef.current) chartRef.current.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const identity = v => v;

// Bar chart — highest bar is highlighted (CHART2.barActive), others CHART2.bar.
// Props: labels, values, formatValue (tooltip), formatTick (y axis),
//        emptyMax (y max when every value is 0), ariaLabel
export function BarChart({ labels = [], values = [], formatValue = identity, formatTick = identity, emptyMax = 1000, ariaLabel = 'Bar chart' }) {
  const ref = useChart(() => {
    const maxVal = Math.max(0, ...values);
    const tickFont = { size: FS2.xs, family: F2.body };
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: values.map(a => (a === maxVal && maxVal > 0 ? CHART2.barActive : CHART2.bar)),
          borderRadius: { topLeft: R2.sm, topRight: R2.sm }, borderSkipped: false, barPercentage: 0.62, minBarLength: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => formatValue(v.raw) } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: tickFont, color: CHART2.tick } },
          y: {
            beginAtZero: true, suggestedMax: maxVal > 0 ? undefined : emptyMax,
            border: { display: false }, grid: { color: CHART2.grid },
            ticks: { font: tickFont, color: CHART2.tick, maxTicksLimit: 6, callback: formatTick },
          },
        },
      },
    };
  }, [JSON.stringify(labels), JSON.stringify(values)]);
  return <canvas ref={ref} role="img" aria-label={ariaLabel}>{ariaLabel}</canvas>;
}

// Donut with the value + label in the centre (0–100).
// Props: value, label, size (default SZ2.donut)
export function DonutChart({ value = 0, label, size = SZ2.donut }) {
  const ref = useChart(() => ({
    type: 'doughnut',
    data: { datasets: [{ data: [value, 100 - value], backgroundColor: [CHART2.barActive, CHART2.track], borderWidth: 0, borderRadius: value > 0 && value < 100 ? R2.md : 0 }] },
    options: { responsive: false, cutout: '80%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => v.raw + '%' } } } },
  }), [value]);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <canvas ref={ref} width={size} height={size} role="img" aria-label={`${label || 'Value'} ${value}%`}>{value}%</canvas>
      <div style={{ ...UI2.center, position: 'absolute', inset: 0, flexDirection: 'column', pointerEvents: 'none' }}>
        <div style={{ ...UI2.text.number, fontSize: FS2.display }}>{value}%</div>
        {label && <div style={{ ...UI2.text.label, fontSize: FS2.base, marginTop: SP2.sm }}>{label}</div>}
      </div>
    </div>
  );
}

// Filled smooth line, no axes — for trend visuals inside cards.
// Props: labels, values, min, max, formatValue (tooltip), ariaLabel
export function Sparkline({ labels = [], values = [], min, max, formatValue = identity, ariaLabel = 'Trend' }) {
  const ref = useChart(() => ({
    type: 'line',
    data: { labels, datasets: [{ data: values, borderColor: CHART2.line, borderWidth: 2.5, pointRadius: 0, fill: true, backgroundColor: CHART2.lineFill, tension: 0.4 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => formatValue(v.raw) } } },
      scales: { x: { display: false }, y: { display: false, min, max } },
    },
  }), [JSON.stringify(labels), JSON.stringify(values), min, max]);
  return <canvas ref={ref} role="img" aria-label={ariaLabel}>{ariaLabel}</canvas>;
}

// Score gauge — 270° arc with the score in the middle (0–100). Pure SVG.
// Props: value, max (default 100), caption, tone (arc colour, TONES2 entry),
//        dark (white text + translucent track for dark cards), size (default SZ2.gauge)
//        gradient (optional [from, to] stops, e.g. GSTOPS2.success — arc runs dark → light,
//                  track uses tone.soft)
//   <Gauge value={60} caption="Overall score" tone={TONES2.success} dark />
//   <Gauge value={60} caption="Overall score" tone={TONES2.success} gradient={GSTOPS2.success} />
let gaugeSeq = 0;
export function Gauge({ value = 0, max = 100, caption, tone, gradient, dark = false, size = SZ2.gauge }) {
  const gradId = useRef(null);
  if (gradId.current === null) gradId.current = `un2-gauge-${++gaugeSeq}`;
  const stroke = SP2.md;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;                                   // 270° sweep
  const pct = Math.max(0, Math.min(1, (Number(value) || 0) / max));
  const color = gradient ? `url(#${gradId.current})` : tone ? (dark ? tone.wave : tone.strong) : CHART2.barActive;
  const track = dark ? C2.onDark.surfaceHover : (gradient && tone ? tone.soft : CHART2.track);
  const common = { cx: size / 2, cy: size / 2, r, fill: 'none', strokeWidth: stroke, strokeLinecap: 'round', transform: `rotate(135 ${size / 2} ${size / 2})` };
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} role="img" aria-label={`${caption || 'Score'} ${value} of ${max}`}>
        {gradient && (
          // Circles are rotated 135°, so (1,1)→(0,0) in their frame runs left → right on screen.
          <defs>
            <linearGradient id={gradId.current} x1="1" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
        )}
        <circle {...common} stroke={track} strokeDasharray={`${arc} ${circ}`} />
        <circle {...common} stroke={color} strokeDasharray={`${arc * pct} ${circ}`} />
      </svg>
      <div style={{ ...UI2.center, position: 'absolute', inset: 0, flexDirection: 'column', pointerEvents: 'none' }}>
        <div style={{ ...UI2.text.number, fontFamily: F2.body, fontSize: FS2.score, color: dark ? C2.white : C2.navyDeep }}>{value}</div>
        <div style={{ fontSize: FS2.lg, fontWeight: FW2.semibold, color: dark ? C2.onDark.textSoft : C2.textSecondary, marginTop: SP2.xs }}>/ {max}</div>
        {caption && <div style={{ fontSize: FS2.sm, color: dark ? C2.onDark.textMuted : C2.textSecondary, marginTop: SP2.xs }}>{caption}</div>}
      </div>
    </div>
  );
}
