import { useEffect, useState } from "react"
import { runScenario, RunResult } from "./lib/api"
import { Header } from "./components/Header"
import { ScenarioControls } from "./components/ScenarioControls"
import { ScenarioPanel } from "./components/ScenarioPanel"
import { RerouteCards } from "./components/RerouteCards"

export default function App() {
  const [result, setResult] = useState<RunResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runKey, setRunKey] = useState(0)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const r = await runScenario()
      setResult(r)
      setRunKey((k) => k + 1)
    } catch {
      setError("Backend not reachable on port 8000")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    run()
  }, [])

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto grid max-w-[1180px] grid-cols-1 gap-5 px-6 py-7 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-7 lg:self-start">
          <ScenarioControls assumptions={result?.assumptions ?? []} loading={loading} onRun={run} />
        </div>

        <div className="reveal space-y-5" key={runKey}>
          {error && (
            <div className="tick panel mono border-risk/40 p-5 text-[13px] text-risk">
              {error}. Start it with: docker compose up -d backend
            </div>
          )}
          {result && (
            <>
              <div style={{ animationDelay: "0.02s" }}>
                <ScenarioPanel o={result.outputs} runKey={runKey} />
              </div>
              <div style={{ animationDelay: "0.12s" }}>
                <RerouteCards options={result.ranking.options} runKey={runKey} />
              </div>
            </>
          )}
          {!result && !error && (
            <div className="panel label p-10 text-center">Initializing model…</div>
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
