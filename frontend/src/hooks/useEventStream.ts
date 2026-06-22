import { useRef, useState } from "react"
import { RunResult } from "../lib/api"

export type TraceEvent = {
  seq: number
  t_ms: number
  agent: "orchestrator" | "risk" | "scenario" | "procurement"
  phase: "start" | "retrieve" | "compute" | "done"
  message: string
  provider: string
  mode: string
  sources: string[]
}

export function useScenarioStream() {
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [totalMs, setTotalMs] = useState<number | null>(null)
  const [runId, setRunId] = useState(0)
  const esRef = useRef<EventSource | null>(null)

  function start() {
    esRef.current?.close()
    setEvents([])
    setResult(null)
    setTotalMs(null)
    setRunning(true)
    setRunId((x) => x + 1)
    const es = new EventSource("http://localhost:8000/scenario/stream")
    esRef.current = es
    es.addEventListener("trace", (e) => {
      setEvents((prev) => [...prev, JSON.parse((e as MessageEvent).data)])
    })
    es.addEventListener("result", (e) => {
      const payload = JSON.parse((e as MessageEvent).data)
      setResult(payload)
      setTotalMs(typeof payload.total_ms === "number" ? payload.total_ms : null)
    })
    es.addEventListener("done", () => {
      setRunning(false)
      esRef.current?.close()
    })
    es.onerror = () => {
      setRunning(false)
      esRef.current?.close()
    }
  }

  return { events, result, running, totalMs, runId, start }
}
