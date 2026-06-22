import { TraceEvent } from "../hooks/useEventStream"

const AGENT_COLOR: Record<string, string> = {
  orchestrator: "text-dim",
  risk: "text-risk",
  scenario: "text-amber",
  procurement: "text-cyan",
}

export function AgentStream({
  events,
  totalMs,
  running,
}: {
  events: TraceEvent[]
  totalMs: number | null
  running: boolean
}) {
  return (
    <div className="tick panel p-5">
      <div className="flex items-center justify-between">
        <div className="label">Agent activity</div>
        <div className="flex items-center gap-2">
          {running && <span className="dot" />}
          <span className="mono text-[12px] tnum text-amber">
            {totalMs != null
              ? `${(totalMs / 1000).toFixed(1)}s signal to recommendation`
              : running
                ? "streaming"
                : "idle"}
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {events.length === 0 && <div className="mono text-[11px] text-faint">awaiting trigger…</div>}
        {events.map((e) => (
          <div key={e.seq} className="grid grid-cols-[54px_84px_1fr_auto] items-baseline gap-3">
            <span className="mono text-[11px] tnum text-faint">+{(e.t_ms / 1000).toFixed(1)}s</span>
            <span className={`mono text-[11px] uppercase ${AGENT_COLOR[e.agent] ?? "text-dim"}`}>{e.agent}</span>
            <span className="mono text-[12px] text-ink">{e.message}</span>
            <span className="mono hidden text-[9px] uppercase tracking-wider text-faint sm:block">
              {e.provider}/{e.mode}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
