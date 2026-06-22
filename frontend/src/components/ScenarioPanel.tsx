import { ScenarioOutputs } from "../lib/api"
import { useCountUp } from "../hooks/useCountUp"
import { fmtInt, fmtDays, fmtUsd1 } from "../lib/format"

export function ScenarioPanel({ o, runKey }: { o: ScenarioOutputs; runKey: number }) {
  const econ = useCountUp(o.economic_impact_usd, runKey, 1000)
  const barrels = useCountUp(o.barrels_at_risk_per_day, runKey, 1000)
  const cover = useCountUp(o.reserve_cover_days, runKey, 1000)
  const price = useCountUp(o.price_impact_usd_bbl, runKey, 1000)

  return (
    <div className="tick panel p-6">
      <div className="flex items-center justify-between">
        <div className="label">Projected disruption impact</div>
        <div className="label !text-risk">Severity · High</div>
      </div>

      <div className="mt-4">
        <div className="mono text-[52px] font-bold leading-none tnum text-risk">
          ${(econ / 1e9).toFixed(2)}B
        </div>
        <div className="mt-2 text-[13px] text-dim">
          Additional procurement cost over the modeled closure
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
        <Readout label="Barrels at risk / day" value={fmtInt(barrels)} accent="risk" />
        <Readout label="Reserve cover · gap" value={`${fmtDays(cover)} d`} accent="amber" />
        <Readout label="Price impact" value={`${fmtUsd1(price)}/bbl`} accent="ink" />
      </div>
    </div>
  )
}

function Readout({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: "risk" | "amber" | "ink"
}) {
  const color = accent === "risk" ? "text-risk" : accent === "amber" ? "text-amber" : "text-ink"
  return (
    <div className="bg-panel px-4 py-4">
      <div className="label">{label}</div>
      <div className={`mono mt-3 text-[22px] font-semibold tnum ${color}`}>{value}</div>
    </div>
  )
}
