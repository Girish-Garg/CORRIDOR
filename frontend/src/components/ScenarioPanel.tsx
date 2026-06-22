import { ScenarioOutputs } from "../lib/api"

export function ScenarioPanel({ o }: { o: ScenarioOutputs }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Metric label="Barrels at risk per day" value={Math.round(o.barrels_at_risk_per_day).toLocaleString()} />
      <Metric label="Reserve cover for the gap" value={`${o.reserve_cover_days.toFixed(1)} days`} />
      <Metric label="Price impact" value={`$${o.price_impact_usd_bbl.toFixed(1)}/bbl`} />
      <Metric label="Extra procurement cost" value={`$${(o.economic_impact_usd / 1e9).toFixed(2)}B`} />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase opacity-60">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
