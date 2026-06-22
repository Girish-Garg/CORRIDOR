import { useEffect } from "react"
import { Header } from "./components/Header"
import { ScenarioControls } from "./components/ScenarioControls"
import { ScenarioPanel } from "./components/ScenarioPanel"
import { RerouteCards } from "./components/RerouteCards"
import { AgentStream } from "./components/AgentStream"
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
      <main className="mx-auto grid max-w-[1180px] grid-cols-1 gap-5 px-6 py-7 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-7 lg:self-start">
          <ScenarioControls assumptions={result?.assumptions ?? []} loading={running} onRun={start} />
        </div>

        <div className="space-y-5">
          <AgentStream events={events} totalMs={totalMs} running={running} />

          {result && (
            <div className="reveal space-y-5" key={runId}>
              {result.risk && (
                <div
                  style={{ animationDelay: "0.02s" }}
                  className="tick panel flex items-center justify-between p-5"
                >
                  <div>
                    <div className="label">Live disruption probability · {result.risk.corridor}</div>
                    <div className="mono mt-2 text-[34px] font-bold tnum text-risk">
                      {Math.round(result.risk.score * 100)}%
                    </div>
                  </div>
                  <div className="w-44">
                    <div className="h-2 w-full overflow-hidden bg-line">
                      <div
                        className="gauge-fill h-full bg-risk"
                        style={{ width: `${Math.round(result.risk.score * 100)}%` }}
                      />
                    </div>
                    <div className="label mt-2 text-right">{result.risk.signals.length} signals fused</div>
                  </div>
                </div>
              )}
              <div style={{ animationDelay: "0.06s" }}>
                <ScenarioPanel o={result.outputs} runKey={runId} />
              </div>
              <div style={{ animationDelay: "0.16s" }}>
                <RerouteCards options={result.ranking.options} runKey={runId} />
              </div>
            </div>
          )}

          {!result && (
            <div className="panel label p-10 text-center">
              {running ? "Agents are computing the reroute…" : "Idle"}
            </div>
          )}
        </div>
      </main>
      <footer className="mx-auto max-w-[1180px] px-6 pb-8">
        <div className="label">
          Sourced from EIA · IEA · CEEW · Deterministic engine, no model-invented numbers
        </div>
      </footer>
    </div>
  )
}
