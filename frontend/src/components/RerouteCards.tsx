import { RerouteOption } from "../lib/api"
import { fmtPct } from "../lib/format"
import { SectionLabel } from "./Section"

export function RerouteCards({ options, runKey }: { options: RerouteOption[]; runKey: number }) {
  return (
    <div className="panel p-5">
      <SectionLabel
        n="4.0"
        title="Recommended reroutes"
        right={<span className="meta">{options.length} ranked</span>}
      />
      <div className="divide-y divide-line">
        {options.map((o, i) => (
          <Row key={`${runKey}-${o.id}`} o={o} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}

function Row({ o, rank }: { o: RerouteOption; rank: number }) {
  const top = rank === 1
  return (
    <div className="grid grid-cols-[26px_1fr_auto] items-center gap-4 py-3.5">
      <span className={`mono text-[14px] tnum ${top ? "text-accent" : "text-faint"}`}>
        {String(rank).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[14px] font-semibold tracking-tight text-fg">{o.source}</span>
          <span className="mono text-[12px] text-muted">{o.grade}</span>
          {o.avoids_hormuz && (
            <span className="mono rounded border border-line2 px-1.5 py-px text-[10px] text-faint">
              avoids Hormuz
            </span>
          )}
        </div>
        <div className="mono mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] tnum text-faint">
          <span>{o.route}</span>
          <span>landed ${o.landed_price_usd_bbl.toFixed(1)}</span>
          <span>{o.days_to_refinery}d</span>
          <span>grade {fmtPct(o.grade_fit)}</span>
          <span>tanker {fmtPct(o.tanker_availability)}</span>
        </div>
      </div>
      <div className="w-24 text-right">
        <div className="mono text-[15px] font-medium tnum text-fg">{o.composite_score.toFixed(2)}</div>
        <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-line">
          <div
            className={`gauge h-full ${top ? "bg-accent" : "bg-faint"}`}
            style={{ width: `${Math.round(o.composite_score * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
