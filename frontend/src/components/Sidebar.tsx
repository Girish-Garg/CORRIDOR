import { Assumption, ScenarioScope } from "../lib/api"
import { ScenarioInput } from "./ScenarioInput"
import { AssumptionSliders } from "./AssumptionSliders"
import { SectionLabel } from "./Section"

export function Sidebar({
  scope,
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
    <aside className="flex w-[340px] shrink-0 flex-col gap-7 border-r border-line bg-surface px-6 py-7 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="flex items-center gap-2.5">
        <span className="text-[22px] font-semibold tracking-tightest text-fg">CORRIDOR</span>
        <span className="h-2 w-2 rounded-full bg-accent" />
      </div>

      <div>
        <SectionLabel title="Scenario" />
        <ScenarioInput loading={loading} onSubmit={onRun} />
        {scope && (
          <div className="mt-4">
            <div className="text-[17px] font-semibold tracking-tightest text-fg">{scope.title}</div>
            <div className="mono mt-1 text-[12px] text-faint">{scope.corridor}</div>
          </div>
        )}
      </div>

      {assumptions.length > 0 && <AssumptionSliders assumptions={assumptions} onChange={onTune} />}
    </aside>
  )
}
