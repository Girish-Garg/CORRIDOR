import { RerouteOption } from "../lib/api"
import { fmtPct, fmtInt } from "../lib/format"

export function RerouteCards({ options, runKey }: { options: RerouteOption[]; runKey: number }) {
  return (
    <div className="tick panel p-6">
      <div className="flex items-center justify-between">
        <div className="label">Recommended reroutes</div>
        <div className="label">{options.length} options ranked</div>
      </div>
      <div className="mt-4 space-y-2">
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
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 border px-4 py-3 transition-colors ${
        top ? "border-cyan/50 bg-cyan/5" : "border-line bg-bg2 hover:border-linebright"
      }`}
    >
      <div className={`mono text-[26px] font-bold tnum ${top ? "text-cyan" : "text-faint"}`}>{rank}</div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-[16px] font-bold text-ink">{o.source}</span>
          <span className="mono text-[12px] text-dim">{o.grade}</span>
          {o.avoids_hormuz && (
            <span className="mono border border-cyan/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-cyan">
              Avoids Hormuz
            </span>
          )}
        </div>
        <div className="mono mt-1 text-[11px] text-faint">{o.route}</div>
        <div className="mono mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tnum text-dim">
          <span>
            landed <span className="text-ink">${o.landed_price_usd_bbl.toFixed(1)}</span>
          </span>
          <span>{o.days_to_refinery}d to refinery</span>
          <span>
            grade fit <span className="text-ink">{fmtPct(o.grade_fit)}</span>
          </span>
          <span>
            tanker <span className="text-ink">{fmtPct(o.tanker_availability)}</span>
          </span>
          <span>{fmtInt(o.available_volume_bbl / 1000)}k bbl</span>
        </div>
      </div>

      <div className="w-28 text-right">
        <div className={`mono text-[18px] font-bold tnum ${top ? "text-cyan" : "text-ink"}`}>
          {o.composite_score.toFixed(2)}
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden bg-line">
          <div
            className={`gauge-fill h-full ${top ? "bg-cyan" : "bg-dim"}`}
            style={{ width: `${Math.round(o.composite_score * 100)}%` }}
          />
        </div>
        {o.source_doc_id && <div className="label mt-2 !text-[9px]">src · {o.source_doc_id}</div>}
      </div>
    </div>
  )
}
