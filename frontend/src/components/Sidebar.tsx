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
  open,
  onClose,
}: {
  scope?: ScenarioScope
  routeMethod?: string
  assumptions: Assumption[]
  loading: boolean
  onRun: (text: string) => void
  onTune: (overrides: Record<string, number>) => void
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[300px] max-w-[85vw] flex-col gap-7 overflow-y-auto border-r border-line bg-surface px-6 py-7 transition-transform duration-200 sm:w-[340px] lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0 lg:shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[22px] font-semibold tracking-tightest text-fg">CORRIDOR</span>
            <span className="h-2 w-2 rounded-full bg-accent" />
          </div>
          <button
            onClick={onClose}
            aria-label="Close controls"
            className="-mr-1 p-1 text-faint hover:text-fg lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
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
    </>
  )
}
