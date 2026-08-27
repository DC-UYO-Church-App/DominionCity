"use client"

/* ============================================================================
   DASHBOARD CHART PRIMITIVES
   ----------------------------------------------------------------------------
   Hand-rolled SVG rather than Recharts: the specs these follow (4px rounded
   data-ends anchored to the baseline, a 2px surface gap between adjacent
   marks, >=8px hover targets, selective direct labels, recessive grid) are
   easier to hold exactly than to argue a chart library out of its defaults.

   Colour is assigned by the job it does, and the categorical set was validated
   rather than eyeballed — see --viz-* in dashboard-ui.css for the report.
   Every chart here is single-series except AttendanceBars, which ships a
   legend and direct labels so identity is never carried by colour alone.
   ========================================================================== */

import { Fragment, useState } from "react"

const fmtMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "short" })

/* ---- Tooltip ------------------------------------------------------------- */
function Tip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div className="viz-tip" style={{ left: `${x}%`, top: `${y}%` }} role="status">
      {children}
    </div>
  )
}

/* ---- 1 · Radial gauge — a single value, so no legend and no axis ---------- */
export function Gauge({
  value,
  label,
  caption,
}: {
  value: number | null
  label: string
  caption: string
}) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value))
  const r = 52
  const circ = 2 * Math.PI * r
  /* A segmented ring reads as "services", not as a smooth percentage — 34
     ticks is meaningless, so the ring is continuous and the count sits in the
     caption underneath where it can be read exactly. */
  return (
    <div className="viz-gauge">
      <svg viewBox="0 0 140 140" role="img" aria-label={`${label}: ${pct}%`}>
        <circle cx="70" cy="70" r={r} className="viz-gauge__track" />
        <circle
          cx="70" cy="70" r={r}
          className="viz-gauge__fill"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" className="viz-gauge__val">{value == null ? "—" : `${Math.round(pct)}%`}</text>
        <text x="70" y="86" className="viz-gauge__lab">{label}</text>
      </svg>
      <p className="viz-gauge__cap">{caption}</p>
    </div>
  )
}

/* ---- 2 · Trend line — one series, one axis, direct label on the peak ------ */
export function TrendLine({
  points,
  unit = "%",
}: {
  points: { date: Date; value: number }[]
  unit?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) return <p className="viz-empty">Not enough history yet to draw a trend.</p>

  const W = 560, H = 190, PAD_L = 30, PAD_R = 16, PAD_T = 34, PAD_B = 26
  const max = Math.max(...points.map((p) => p.value), 100)
  const min = 0
  const x = (i: number) => PAD_L + (i / (points.length - 1)) * (W - PAD_L - PAD_R)
  const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B)

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ")
  const area = `${line} L${x(points.length - 1)},${H - PAD_B} L${x(0)},${H - PAD_B} Z`
  const peak = points.reduce((a, p, i) => (p.value > points[a].value ? i : a), 0)

  return (
    <div className="viz-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Attendance over time">
        <defs>
          <linearGradient id="vizFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--viz-1)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--viz-1)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(g)} y2={y(g)} className="viz-grid" />
            <text x={PAD_L - 8} y={y(g) + 4} className="viz-axis" textAnchor="end">{g}</text>
          </g>
        ))}
        <path d={area} className="viz-area" />
        <path d={line} className="viz-line" />

        {/* Selective direct label: the best month only, never every point. */}
        <g transform={`translate(${x(peak)},${y(points[peak].value)})`}>
          <rect x="-22" y="-30" width="44" height="20" rx="6" className="viz-callout" />
          <text x="0" y="-16" className="viz-callout__t" textAnchor="middle">
            {Math.round(points[peak].value)}{unit}
          </text>
        </g>

        {points.map((p, i) => (
          <circle
            key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 6 : 4}
            className="viz-dot"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {points.map((p, i) => (
          <text key={`l${i}`} x={x(i)} y={H - 8} className="viz-axis" textAnchor="middle">
            {fmtMonth(p.date)}
          </text>
        ))}
      </svg>
      {hover !== null && (
        <Tip x={(x(hover) / W) * 100} y={(y(points[hover].value) / H) * 100}>
          <b>{Math.round(points[hover].value)}{unit}</b> · {fmtMonth(points[hover].date)}
        </Tip>
      )}
    </div>
  )
}

/* ---- 3 · Bars — one series; the current period gets relief, not a hue ----- */
export function Bars({
  bars,
  format,
}: {
  bars: { label: string; value: number; current?: boolean }[]
  format: (n: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  if (!bars.length) return <p className="viz-empty">No records in this period.</p>

  const max = Math.max(...bars.map((b) => b.value), 1)
  return (
    <div className="viz-wrap">
      <div className="viz-bars">
        {bars.map((b, i) => (
          <div
            key={b.label}
            className="viz-bars__col"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="viz-bars__track">
              <div
                className={`viz-bars__bar${b.current ? " is-current" : ""}`}
                style={{ height: `${Math.max((b.value / max) * 100, 2)}%` }}
              >
                {b.current && <span className="viz-bars__val">{format(b.value)}</span>}
              </div>
            </div>
            <span className="viz-bars__lab">{b.label}</span>
          </div>
        ))}
      </div>
      {hover !== null && (
        <div className="viz-tip viz-tip--bar">
          <b>{format(bars[hover].value)}</b> · {bars[hover].label}
        </div>
      )}
    </div>
  )
}

/* ---- 4 · Heatmap — sequential, one hue light→dark, with a range legend ---- */
const SEQ = ["viz-c0", "viz-c1", "viz-c2", "viz-c3", "viz-c4"]

export function Heatmap({
  rows,
  columns,
  legend,
}: {
  rows: { label: string; cells: { step: number; title: string }[] }[]
  columns: string[]
  legend: string[]
}) {
  return (
    <div className="viz-heat">
      <div className="viz-heat__grid" style={{ gridTemplateColumns: `6.5rem repeat(${columns.length}, 1fr)` }}>
        <span />
        {columns.map((c, i) => (
          <span key={i} className="viz-heat__col">{c}</span>
        ))}
        {rows.map((row) => (
          <Fragment key={row.label}>
            <span className="viz-heat__row">{row.label}</span>
            {row.cells.map((cell, i) => (
              <span
                key={`${row.label}-${i}`}
                className={`viz-heat__cell ${SEQ[cell.step]}`}
                title={cell.title}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div className="viz-heat__key">
        {legend.map((l, i) => (
          <span key={l} className="viz-heat__keyitem">
            <i className={`viz-heat__sw ${SEQ[i]}`} />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---- 5 · Meter — a single proportion, labelled ---------------------------- */
export function Meter({ pct, left, right }: { pct: number; left: string; right: string }) {
  const v = Math.max(0, Math.min(100, pct))
  return (
    <div className="viz-meter">
      <div className="viz-meter__track" role="img" aria-label={`${left}: ${Math.round(v)}%`}>
        <div className="viz-meter__fill" style={{ width: `${v}%` }} />
      </div>
      <div className="viz-meter__foot">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}
