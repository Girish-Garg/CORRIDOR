import { Assumption } from "../lib/api"
import { fmtPct, fmtMbbl } from "../lib/format"
import { SectionLabel } from "./Section"

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
    <div className="panel p-5">
      <SectionLabel n="1.0" title="Scenario" />
      <h2 className="text-[22px] font-bold leading-tight tracking-tightest text-fg">
        Strait of Hormuz, full closure
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Model the procurement shock if transit halts, and rank the crude reroutes that keep Indian
        refineries supplied.
      </p>

      <button
        onClick={onRun}
        disabled={loading}
        className="mt-5 w-full rounded-md border border-line2 bg-surface2 px-4 py-2.5 text-[13px] font-semibold text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {loading ? "Running model…" : "Run disruption model"}
      </button>

      <div className="mt-6">
        <SectionLabel n="1.1" title="Assumptions · editable · sourced" />
        <div className="space-y-2.5">
          {chips.length === 0 && <div className="mono text-[12px] text-faint">loading…</div>}
          {chips.map((a) => (
            <div key={a.name} title={a.rationale} className="flex items-center justify-between">
              <span className="text-[13px] text-muted">{LABELS[a.name] ?? a.name}</span>
              <span className="mono text-[13px] tnum text-fg">{chipValue(a)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
