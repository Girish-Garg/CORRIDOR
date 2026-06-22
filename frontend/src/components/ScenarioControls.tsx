import { Assumption, ScenarioScope } from "../lib/api"
import { fmtPct, fmtMbbl } from "../lib/format"
import { SectionLabel } from "./Section"
import { ScenarioInput } from "./ScenarioInput"

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
  scope,
  routeMethod,
  loading,
  onRun,
}: {
  assumptions: Assumption[]
  scope?: ScenarioScope
  routeMethod?: string
  loading: boolean
  onRun: (text: string) => void
}) {
  const chips = SHOWN.map((n) => assumptions.find((a) => a.name === n)).filter(Boolean) as Assumption[]
  return (
    <div className="panel p-5">
      <SectionLabel n="1.0" title="Define scenario" />
      <ScenarioInput loading={loading} onSubmit={onRun} />

      {scope && (
        <div className="mt-5 border-t border-line pt-4">
          <SectionLabel
            n="1.1"
            title="Active scope"
            right={routeMethod ? <span className="meta">routed via {routeMethod}</span> : undefined}
          />
          <div className="text-[15px] font-semibold tracking-tightest text-fg">{scope.title}</div>
          <div className="mono mt-1 text-[11px] text-faint">corridor · {scope.corridor}</div>
        </div>
      )}

      <div className="mt-5">
        <SectionLabel n="1.2" title="Assumptions · editable · sourced" />
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
