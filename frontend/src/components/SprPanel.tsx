import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { SprPlan } from "../lib/api"
import { useCountUp } from "../hooks/useCountUp"
import { fmtMbblShort } from "../lib/format"
import { SectionLabel } from "./Section"

export function SprPanel({ spr, runKey }: { spr: SprPlan; runKey: number }) {
  const draw = useCountUp(spr.daily_drawdown_bbl, runKey, 900)
  const total = useCountUp(spr.spr_total_bbl, runKey, 900)
  const drains = spr.schedule.length > 0 && spr.schedule[spr.schedule.length - 1].remaining_pct <= 0
  const holdLabel = drains
    ? `runs dry on day ${spr.days_to_exhaustion}`
    : `holds the full ${spr.schedule.length}-day closure`

  return (
    <div className="panel p-6">
      <SectionLabel
        n="3.5"
        title="Strategic reserve drawdown"
        right={<span className="meta">{holdLabel}</span>}
      />
      <div className="flex items-end gap-3">
        <span className="mono text-[34px] font-semibold leading-none tnum text-accent">
          {fmtMbblShort(draw)}
        </span>
        <span className="meta mb-1.5">bbl/day recommended release</span>
      </div>

      <div className="mt-4" style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spr.schedule} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="sprFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8913c" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e8913c" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "#6b6b71", fontSize: 11 }} stroke="#232227" />
            <YAxis domain={[0, 100]} tick={{ fill: "#6b6b71", fontSize: 11 }} stroke="#232227" width={32} />
            <ReferenceLine y={0} stroke="#f0503c" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{ background: "#16151a", border: "1px solid #232227", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "#ededec" }}
              formatter={(v: number) => [`${v}%`, "reserve left"]}
              labelFormatter={(d) => `day ${d}`}
            />
            <Area dataKey="remaining_pct" stroke="#e8913c" strokeWidth={2} fill="url(#sprFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 border-t border-line">
        <Stat label="Reserve size" value={`${fmtMbblShort(total)} bbl`} />
        <Stat label="Refinery run cut" value={`${spr.refinery_run_cut_pct}%`} divider />
        <Stat label="Refill window" value={`${spr.replenishment_days} d`} divider />
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muted">
        Release ramps down as reroutes come online over {spr.reroute_ramp_days} days; the curve is reserve
        remaining against the supply gap.
      </p>
    </div>
  )
}

function Stat({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className={`py-4 ${divider ? "border-l border-line pl-4" : "pr-4"}`}>
      <div className="meta">{label}</div>
      <div className="mono mt-2 text-[20px] font-medium tnum text-fg">{value}</div>
    </div>
  )
}
