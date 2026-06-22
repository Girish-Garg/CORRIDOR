import { Assumption, ScenarioScope } from "../lib/api"
import { ScenarioInput } from "./ScenarioInput"
import { AssumptionSliders } from "./AssumptionSliders"
import { SectionLabel } from "./Section"

export function Sidebar({
  scope,
  routeMethod,
  assumptions,
  loading,
  onRun,
  onTune,
}: {
  scope?: ScenarioScope
  routeMethod?: string
  assumptions: Assumption[]
  loading: boolean
  onRun: (text: string) => void
  onTune: (overrides: Record<string, number>) => void
}) {
  return (
    <aside className="flex w-[360px] shrink-0 flex-col gap-6 border-r border-line bg-surface px-6 py-7 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="text-[22px] font-bold tracking-tightest text-fg">CORRIDOR</span>
          <span className="h-2 w-2 rounded-full bg-accent" />
        </div>
        <div className="meta mt-2">Energy supply chain risk intelligence</div>
      </div>

      <div>
        <SectionLabel n="1.0" title="Define scenario" />
        <ScenarioInput loading={loading} onSubmit={onRun} />
      </div>

      {scope && (
        <div className="border-t border-line pt-5">
          <SectionLabel
            n="1.1"
            title="Active scope"
            right={routeMethod ? <span className="meta">via {routeMethod}</span> : undefined}
          />
          <div className="text-[16px] font-semibold tracking-tightest text-fg">{scope.title}</div>
          <div className="mono mt-1 text-[12px] text-faint">corridor · {scope.corridor}</div>
        </div>
      )}

      {assumptions.length > 0 && (
        <div className="border-t border-line pt-5">
          <AssumptionSliders assumptions={assumptions} onChange={onTune} />
        </div>
      )}
    </aside>
  )
}
