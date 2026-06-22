import { useState } from "react"
import { runScenario, RunResult } from "./lib/api"
import { ScenarioPanel } from "./components/ScenarioPanel"
import { RerouteCards } from "./components/RerouteCards"

export default function App() {
  const [result, setResult] = useState<RunResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function trigger() {
    setLoading(true)
    try {
      setResult(await runScenario())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">CORRIDOR</h1>
      <button onClick={trigger} disabled={loading} className="rounded-md border px-4 py-2">
        {loading ? "Running" : "Trigger Hormuz closure"}
      </button>
      {result && (
        <div className="space-y-6">
          <ScenarioPanel o={result.outputs} />
          <RerouteCards options={result.ranking.options} />
        </div>
      )}
    </div>
  )
}
