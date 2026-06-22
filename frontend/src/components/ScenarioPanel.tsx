import { ScenarioOutputs } from "../lib/api"
import { useCountUp } from "../hooks/useCountUp"
import { fmtInt, fmtDays, fmtUsd1 } from "../lib/format"
import { SectionLabel } from "./Section"

export function ScenarioPanel({ o, runKey }: { o: ScenarioOutputs; runKey: number }) {
  const econ = useCountUp(o.economic_impact_usd, runKey, 900)
  const barrels = useCountUp(o.barrels_at_risk_per_day, runKey, 900)
  const cover = useCountUp(o.reserve_cover_days, runKey, 900)
  const price = useCountUp(o.price_impact_usd_bbl, runKey, 900)

  return (
    <div className="panel p-5">
      <SectionLabel n="3.0" title="Projected impact" right={<span className="meta">Severity high</span>} />
      <div className="mono text-[44px] font-semibold leading-none tnum text-fg">
        ${(econ / 1e9).toFixed(2)}B
      </div>
      <div className="mt-2 text-[13px] text-muted">Additional procurement cost over the closure</div>

      <div className="mt-5 grid grid-cols-3 border-t border-line">
        <Readout label="Barrels at risk / day" value={fmtInt(barrels)} />
        <Readout label="Reserve cover" value={`${fmtDays(cover)} d`} divider />
        <Readout label="Price impact" value={`${fmtUsd1(price)}/bbl`} divider />
      </div>
    </div>
  )
}

function Readout({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className={`py-4 ${divider ? "border-l border-line pl-4" : "pr-4"}`}>
      <div className="meta">{label}</div>
      <div className="mono mt-2 text-[19px] font-medium tnum text-fg">{value}</div>
    </div>
  )
}
