import { RerouteOption } from "../lib/api"

export function RerouteCards({ options }: { options: RerouteOption[] }) {
  return (
    <div className="grid gap-3">
      {options.map((o, idx) => (
        <div key={o.id} className="rounded-lg border p-4">
          <div className="flex justify-between">
            <span className="font-semibold">#{idx + 1} {o.source} {o.grade}</span>
            <span>score {o.composite_score.toFixed(2)}</span>
          </div>
          <div className="text-sm opacity-80">
            {o.route} | landed ${o.landed_price_usd_bbl.toFixed(1)}/bbl | {o.days_to_refinery} days
          </div>
        </div>
      ))}
    </div>
  )
}
