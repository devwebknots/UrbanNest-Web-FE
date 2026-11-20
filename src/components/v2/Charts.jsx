import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { C2, CHART2, G2, GSTOPS2, SH2, T2, F2, FS2, FW2, LH2, R2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

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
          // Every label stays visible and horizontal (never tilted, never skipped). Room per bar
          // decides the label: ≥ 30px → full label at FS2.xs · ≥ 22px → full label at FS2.xxs ·
          // narrower → first letter only (J F M A …).
          x: {
            grid: { display: false }, border: { display: false },
            ticks: {
              color: CHART2.tick, maxRotation: 0, minRotation: 0, autoSkip: false,
              font: ({ chart }) => {
                const per = (chart.chartArea ? chart.chartArea.width : chart.width) / Math.max(1, labels.length);
                return { ...tickFont, size: per >= 30 ? FS2.xs : FS2.xxs };
              },
              callback(value) {
                const label = String(this.getLabelForValue(value));
                const per = (this.chart.chartArea ? this.chart.chartArea.width : this.chart.width) / Math.max(1, labels.length);
                return per >= 22 ? label : label.charAt(0);
              },
            },
          },
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
// Progress arc is filled with THE standard blue gradient (GSTOPS2.primary, dark → light,
// diagonal — same as ProgressRing / G2.primaryBar); pass `gradient` for another tone's stops.
// Props: value, label, size (default SZ2.donut), gradient ([from, to], default GSTOPS2.primary)
export function DonutChart({ value = 0, label, size = SZ2.donut, gradient = GSTOPS2.primary }) {
  const ref = useChart(() => {
    // Scriptable per segment (Chart.js does NOT call functions placed inside a colour array):
    // segment 0 = value arc → gradient, segment 1 = remainder → track
    const segmentFill = ({ chart, dataIndex }) => {
      if (dataIndex !== 0) return CHART2.track;
      const a = chart.chartArea;
      if (!a) return gradient[0];   // first layout pass — area not measured yet
      const g = chart.ctx.createLinearGradient(a.left, a.top, a.right, a.bottom);
      g.addColorStop(0, gradient[0]);
      g.addColorStop(1, gradient[1]);
      return g;
    };
    return {
      type: 'doughnut',
      data: { datasets: [{ data: [value, 100 - value], backgroundColor: segmentFill, hoverBackgroundColor: segmentFill, borderWidth: 0, borderRadius: value > 0 && value < 100 ? R2.md : 0 }] },
      options: { responsive: false, cutout: '80%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => v.raw + '%' } } } },
    };
  }, [value, gradient[0], gradient[1]]);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <canvas ref={ref} width={size} height={size} role="img" aria-label={`${label || 'Value'} ${value}%`}>{value}%</canvas>
      <div style={{ ...UI2.center, position: 'absolute', inset: 0, flexDirection: 'column', pointerEvents: 'none' }}>
        <div style={T2.figure}>{value}%</div>
        {label && <div style={{ ...T2.label, marginTop: SP2.sm }}>{label}</div>}
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

// Trend line with axes — smooth blue line, white-ringed points, gradient area fill,
// white tooltip (value on top, label under it). Fills its parent (give the parent a height).
// Props: labels, values, formatValue (tooltip), formatTick (y axis), tooltipLabel (label → caption,
//        e.g. month → "Jun 2025"), dark (axis text / grid / line for dark cards), ariaLabel
//   <div style={{ position: 'relative', height: SZ2.chart }}>
//     <LineChart dark labels={months} values={rent} formatValue={fmtMoney} formatTick={fmtK} />
//   </div>
export function LineChart({
  labels = [], values = [], formatValue = identity, formatTick = identity, tooltipLabel = identity,
  dark = false, emptyMax = 1000, ariaLabel = 'Trend chart',
}) {
  const ref = useChart(() => {
    const line = dark ? CHART2.trendOnDark : CHART2.trend;
    const fillTop = dark ? CHART2.trendOnDarkFillTop : CHART2.trendFillTop;
    const fillBottom = dark ? CHART2.trendOnDarkFillBottom : CHART2.trendFillBottom;
    const tickFont = { size: FS2.sm, family: F2.body };
    const maxVal = Math.max(0, ...values);
    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: line, borderWidth: 3, tension: 0.4, fill: true,
          // Area fill fades from the line down to the x axis
          backgroundColor: ({ chart }) => {
            const { ctx, chartArea } = chart;
            if (!chartArea) return fillTop;
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, fillTop);
            g.addColorStop(1, fillBottom);
            return g;
          },
          pointRadius: 5, pointHoverRadius: 7, pointBorderWidth: 2,
          pointBackgroundColor: C2.white, pointBorderColor: line,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: SP2.sm, right: SP2.sm } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: C2.white, titleColor: C2.navyDeep, bodyColor: C2.textSecondary,
            titleFont: { size: FS2.md, weight: FW2.semibold, family: F2.body }, bodyFont: { size: FS2.xs, family: F2.body },
            titleAlign: 'center', bodyAlign: 'center', displayColors: false,
            padding: SP2.sm, cornerRadius: R2.md, caretSize: SP2.sm, yAlign: 'bottom',
            callbacks: { title: items => formatValue(items[0].raw), label: item => tooltipLabel(item.label) },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: tickFont, color: dark ? CHART2.tickOnDark : CHART2.tick } },
          y: {
            beginAtZero: true, suggestedMax: maxVal > 0 ? undefined : emptyMax,
            border: { display: false }, grid: { color: dark ? CHART2.gridOnDark : CHART2.grid },
            ticks: { font: tickFont, color: dark ? CHART2.tickOnDark : CHART2.tick, maxTicksLimit: 4, callback: formatTick },
          },
        },
      },
    };
  }, [JSON.stringify(labels), JSON.stringify(values), dark]);
  return <canvas ref={ref} role="img" aria-label={ariaLabel}>{ariaLabel}</canvas>;
}

// Progress ring — full circle that draws itself in (CSS un2-ring-arc), anything in the middle.
// Props: value (0–100), size (SZ2.ring), stroke (SZ2.ringStroke),
//        gradient ([from, to] stops, default GSTOPS2.success), track (default C2.successLight),
//        ariaLabel, children (centre content — e.g. value + caption)
//   <ProgressRing value={96}><div>96%</div><div>Leased</div></ProgressRing>
let ringSeq = 0;
export function ProgressRing({
  value = 0, size = SZ2.ring, stroke = SZ2.ringStroke, gradient = GSTOPS2.success, track = C2.successLight,
  ariaLabel, children,
}) {
  const gradId = useRef(null);
  if (gradId.current === null) gradId.current = `un2-ring-${++ringSeq}`;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0)) / 100;
  const common = { cx: size / 2, cy: size / 2, r, fill: 'none', strokeWidth: stroke, transform: `rotate(-90 ${size / 2} ${size / 2})` };
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} role="img" aria-label={ariaLabel || `${Math.round(pct * 100)}%`}>
        <defs>
          <linearGradient id={gradId.current} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <circle {...common} stroke={track} />
        {pct > 0 && (
          <circle
            {...common}
            className="un2-ring-arc"
            stroke={`url(#${gradId.current})`}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ '--un2-ring-from': circ }}
          />
        )}
      </svg>
      <div style={{ ...UI2.center, position: 'absolute', inset: 0, flexDirection: 'column', pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  );
}

// Mini bar trend — small column bars with month labels under them, no axes. Bars grow in
// one after another; the active bar (default: the last = current month) is the primary
// gradient, the rest soft blue. Hover shows the formatted value (title).
// Props: items [{ label, value }] (oldest → newest), activeIndex (default last), formatValue,
//        height (SZ2.miniBars.h),
//        fit (true → fills its parent's width: shows the NEWEST months that fit, ending at the right
//             edge; older months that don't fit are left out — bar size / spacing never change)
//   <MiniBars items={[{ label: 'Jun', value: 1200 }, …]} formatValue={v => '$' + v} />
export function MiniBars({ items = [], activeIndex, formatValue = identity, height = SZ2.miniBars.h, fit = false, ariaLabel = 'Trend' }) {
  const active = activeIndex ?? items.length - 1;
  const max = Math.max(0, ...items.map(i => Number(i.value) || 0));
  // fit: newest first in a right-to-left wrapping row, one line tall — columns that don't fit
  // wrap onto a hidden second line, so only whole bars show and the newest sits at the right edge.
  const labelH = Math.ceil(FS2.xs * LH2.heading);
  const rowStyle = fit
    ? { display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: SP2.md, rowGap: height,
        width: '100%', height: height + SP2.xs + labelH, overflow: 'hidden' }
    : { display: 'flex', alignItems: 'flex-end', gap: SP2.md };
  const order = items.map((it, i) => ({ it, i }));
  if (fit) order.reverse();
  return (
    <div role="img" aria-label={ariaLabel} style={rowStyle}>
      {order.map(({ it, i }, pos) => {
        const on = i === active;
        const h = max > 0 ? Math.max(0.08, (Number(it.value) || 0) / max) : 0.08;
        // bars grow in from the left; in fit mode the visible run is the newest end of the list
        const step = fit ? Math.max(0, SZ2.miniBars.fitStagger - pos) : i;
        return (
          <div key={`${it.label}-${i}`} style={{ ...UI2.stack(SP2.xs), alignItems: 'center' }} title={`${it.label}: ${formatValue(it.value)}`}>
            <div style={{ height, display: 'flex', alignItems: 'flex-end' }}>
              <div
                className="un2-bar un2-grow-y"
                style={{
                  width: SZ2.miniBars.w, height: `${h * 100}%`, borderRadius: pad(R2.sm, R2.sm, R2.xs, R2.xs),
                  background: on ? G2.miniBarActive : G2.miniBar, boxShadow: on ? SH2.miniBarActive : 'none',
                  '--un2-delay': `${0.3 + step * 0.04}s`,
                }}
              />
            </div>
            <span style={{ fontSize: FS2.xs, lineHeight: LH2.heading, color: on ? C2.primary : C2.textMuted, fontWeight: on ? FW2.semibold : FW2.regular }}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
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
        <div style={{ ...UI2.text.number, fontSize: FS2.score, fontWeight: FW2.medium, color: dark ? C2.white : C2.navyDeep }}>{value}</div>
        <div style={{ fontSize: FS2.lg, fontWeight: FW2.semibold, color: dark ? C2.onDark.textSoft : C2.textSecondary, marginTop: SP2.xs }}>/ {max}</div>
        {caption && <div style={{ fontSize: FS2.sm, color: dark ? C2.onDark.textMuted : C2.textSecondary, marginTop: SP2.xs }}>{caption}</div>}
      </div>
    </div>
  );
}
