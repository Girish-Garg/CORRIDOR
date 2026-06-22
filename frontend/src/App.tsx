import { useEffect, useState } from "react"
import { runScenario, RiskAssessment } from "./lib/api"
import { Sidebar } from "./components/Sidebar"
import { ScenarioPanel } from "./components/ScenarioPanel"
import { RerouteCards } from "./components/RerouteCards"
import { CorridorMap } from "./components/CorridorMap"
import { ReplayTimeline } from "./components/ReplayTimeline"
import { AgentStream } from "./components/AgentStream"
import { SectionLabel } from "./components/Section"
import { useScenarioStream } from "./hooks/useEventStream"

function Clock() {
  const [t, setT] = useState(() => new Date().toISOString().slice(11, 19))
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toISOString().slice(11, 19)), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="mono text-[13px] tnum text-faint">{t} UTC</span>
}

function DisruptionBand({ risk }: { risk: RiskAssessment }) {
  return (
    <div className="panel p-6">
      <SectionLabel
        n="2.1"
        title={`Disruption probability · ${risk.corridor}`}
        right={<span className="meta">{risk.signals.length} signals</span>}
      />
      <div className="flex items-end gap-5">
        <div className="mono text-[52px] font-semibold leading-none tnum text-accent">
          {Math.round(risk.score * 100)}%
        </div>
        <div className="mb-2.5 h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="gauge h-full bg-accent" style={{ width: `${Math.round(risk.score * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { events, result, running, totalMs, runId, start, setResult } = useScenarioStream()

  useEffect(() => {
    start("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function recompute(overrides: Record<string, number>) {
    try {
      const r = await runScenario(overrides)
      setResult((prev) =>
        prev ? { ...prev, outputs: r.outputs, ranking: r.ranking, assumptions: r.assumptions } : prev,
      )
    } catch {
      // keep last good result
    }
  }

  const scopeId = result?.scope?.id ?? "hormuz"

  return (
    <div className="flex min-h-screen">
      <Sidebar
        scope={result?.scope}
        routeMethod={result?.route_method}
        assumptions={result?.assumptions ?? []}
        loading={running}
        onRun={start}
        onTune={recompute}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line px-7 py-4">
          <span className="meta">Theatre · Indian crude procurement</span>
          <div className="flex items-center gap-6">
            <Clock />
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="meta">Live monitoring</span>
            </span>
          </div>
        </div>
        <main className="flex flex-1 flex-col gap-5 p-7">
          <AgentStream events={events} totalMs={totalMs} running={running} />
          {result ? (
            <>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-5">
                  {result.risk && <DisruptionBand risk={result.risk} />}
                  <CorridorMap scopeId={scopeId} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-5">
                  <ScenarioPanel o={result.outputs} runKey={runId} />
                  <RerouteCards options={result.ranking.options} runKey={runId} />
                </div>
              </div>
              <ReplayTimeline scopeId={scopeId} />
            </>
          ) : (
            <div className="panel meta p-10 text-center">
              {running ? "Routing & computing…" : "Idle"}
            </div>
          )}
        </main>
        <footer className="border-t border-line px-7 py-4">
          <div className="meta">
            Sourced from EIA · IEA · CEEW · Deterministic engine, no model-invented numbers
          </div>
        </footer>
      </div>
    </div>
  )
}
