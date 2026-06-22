import { useEffect } from "react"
import { Header } from "./components/Header"
import { ScenarioControls } from "./components/ScenarioControls"
import { ScenarioPanel } from "./components/ScenarioPanel"
import { RerouteCards } from "./components/RerouteCards"
import { AgentStream } from "./components/AgentStream"
import { SectionLabel } from "./components/Section"
import { useScenarioStream } from "./hooks/useEventStream"

export default function App() {
  const { events, result, running, totalMs, runId, start } = useScenarioStream()

  useEffect(() => {
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 px-6 py-6 lg:grid-cols-[320px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ScenarioControls assumptions={result?.assumptions ?? []} loading={running} onRun={start} />
        </div>

        <div className="space-y-4">
          <AgentStream events={events} totalMs={totalMs} running={running} />

          {result && (
            <div className="reveal space-y-4" key={runId}>
              {result.risk && (
                <div style={{ animationDelay: "0.02s" }} className="panel p-5">
                  <SectionLabel
                    n="2.1"
                    title={`Disruption probability · ${result.risk.corridor}`}
                    right={<span className="meta">{result.risk.signals.length} signals</span>}
                  />
                  <div className="flex items-end gap-4">
                    <div className="mono text-[40px] font-semibold leading-none tnum text-accent">
                      {Math.round(result.risk.score * 100)}%
                    </div>
                    <div className="mb-1.5 h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="gauge h-full bg-accent"
                        style={{ width: `${Math.round(result.risk.score * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div style={{ animationDelay: "0.06s" }}>
                <ScenarioPanel o={result.outputs} runKey={runId} />
              </div>
              <div style={{ animationDelay: "0.1s" }}>
                <RerouteCards options={result.ranking.options} runKey={runId} />
              </div>
            </div>
          )}

          {!result && (
            <div className="panel meta p-8 text-center">{running ? "Computing…" : "Idle"}</div>
          )}
        </div>
      </main>
      <footer className="mx-auto max-w-[1100px] px-6 pb-8">
        <div className="meta">
          Sourced from EIA · IEA · CEEW · Deterministic engine, no model-invented numbers
        </div>
      </footer>
    </div>
  )
}
