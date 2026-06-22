import { Assumption } from "../lib/api"
import { fmtPct, fmtMbbl } from "../lib/format"

const SHOWN = ["hormuz_dependency", "reserve_days", "india_daily_imports_bbl", "baseline_brent_usd"]

const LABELS: Record<string, string> = {
  hormuz_dependency: "Hormuz dependency",
  reserve_days: "Reserve cover",
  india_daily_imports_bbl: "Daily imports",
  baseline_brent_usd: "Baseline Brent",
}

function chipValue(a: Assumption): string {
  if (a.name === "hormuz_dependency") return fmtPct(a.value)
  if (a.name === "india_daily_imports_bbl") return `${fmtMbbl(a.value)} bbl/d`
  if (a.name === "reserve_days") return `${a.value.toFixed(1)} d`
  if (a.name === "baseline_brent_usd") return `$${a.value.toFixed(0)}`
  return String(a.value)
}

export function ScenarioControls({
  assumptions,
  loading,
  onRun,
}: {
  assumptions: Assumption[]
  loading: boolean
  onRun: () => void
}) {
  const chips = SHOWN.map((n) => assumptions.find((a) => a.name === n)).filter(Boolean) as Assumption[]
  return (
    <div className="tick panel p-5">
      <div className="label">Active scenario</div>
      <h2 className="mt-3 font-display text-[26px] font-extrabold leading-[1.05] text-ink">
        Strait of Hormuz
        <br />
        <span className="text-amber">Full Closure</span>
      </h2>
      <p className="mt-3 text-[13px] leading-relaxed text-dim">
        Model the procurement shock if transit through Hormuz halts, and rank the crude reroutes that
        keep Indian refineries supplied.
      </p>

      <button
        onClick={onRun}
        disabled={loading}
        className="btn-sweep mt-5 flex w-full items-center justify-center gap-2 border border-amber bg-amber/10 px-4 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-amber transition-colors hover:bg-amber/20 disabled:opacity-60"
      >
        {loading ? (
          <>
            Modeling
            <span className="inline-flex gap-1">
              <span className="h-1 w-1 animate-bounce rounded-full bg-amber [animation-delay:-0.2s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-amber [animation-delay:-0.1s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-amber" />
            </span>
          </>
        ) : (
          "Run disruption model"
        )}
      </button>

      <div className="label mt-6">Assumptions · editable · sourced</div>
      <div className="mt-3 space-y-2">
        {chips.length === 0 && <div className="mono text-[11px] text-faint">loading parameters…</div>}
        {chips.map((a) => (
          <div
            key={a.name}
            title={a.rationale}
            className="flex items-center justify-between border-b border-line/60 pb-2"
          >
            <span className="text-[12px] text-dim">{LABELS[a.name] ?? a.name}</span>
            <span className="mono text-[12px] tnum text-ink">{chipValue(a)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
