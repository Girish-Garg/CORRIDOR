import { ScenarioOutputs } from "../lib/api"
import { useCountUp } from "../hooks/useCountUp"
import { fmtInt, fmtDays, fmtUsd1, fmtInr1, fmtPct2 } from "../lib/format"
import { SectionLabel } from "./Section"

export function ScenarioPanel({ o, runKey }: { o: ScenarioOutputs; runKey: number }) {
  const econ = useCountUp(o.economic_impact_usd, runKey, 900)
  const barrels = useCountUp(o.barrels_at_risk_per_day, runKey, 900)
  const cover = useCountUp(o.reserve_cover_days, runKey, 900)
  const price = useCountUp(o.price_impact_usd_bbl, runKey, 900)
  const pump = useCountUp(o.pump_price_inr_per_l, runKey, 900)
  const gdp = useCountUp(o.gdp_drag_pct, runKey, 900)

  return (
    <div className="panel p-6">
      <SectionLabel title="Projected impact" />
      <div className="mono text-[60px] font-semibold leading-none tnum text-fg">
        ${(econ / 1e9).toFixed(2)}B
      </div>
      <div className="mt-2 text-[14px] text-muted">Added procurement cost over the closure</div>

      <div className="mt-6 grid grid-cols-3 border-t border-line">
        <Readout label="Barrels at risk" value={fmtInt(barrels)} />
        <Readout label="Reserve cover" value={`${fmtDays(cover)} d`} divider />
        <Readout label="Price impact" value={`${fmtUsd1(price)}/bbl`} divider />
      </div>
      <div className="grid grid-cols-3 border-t border-line">
        <Readout label="Pump price" value={`${fmtInr1(pump)}/L`} sub={`+${fmtInr1(o.pump_price_delta_inr_per_l)}`} />
        <Readout label="GDP drag" value={fmtPct2(gdp)} sub="annualized" divider />
        <Readout label="Brent" value={`${fmtUsd1(price)}/bbl`} sub={`+${fmtUsd1(o.price_delta_usd_bbl)}`} divider />
      </div>
    </div>
  )
}

function Readout({ label, value, sub, divider }: { label: string; value: string; sub?: string; divider?: boolean }) {
  return (
    <div className={`py-5 ${divider ? "border-l border-line pl-5" : "pr-5"}`}>
      <div className="meta">{label}</div>
      <div className="mono mt-2.5 text-[26px] font-medium tnum text-fg">{value}</div>
      {sub && <div className="mono mt-1 text-[11px] text-faint">{sub}</div>}
    </div>
  )
}
