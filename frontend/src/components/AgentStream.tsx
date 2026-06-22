import { TraceEvent } from "../hooks/useEventStream"
import { SectionLabel } from "./Section"

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
    <div className="panel p-6">
      <SectionLabel
        n="2.0"
        title="Agent trace"
        right={
          <span className="mono text-[13px] tnum text-accent">
            {totalMs != null
              ? `${(totalMs / 1000).toFixed(1)}s signal to recommendation`
              : running
                ? "streaming"
                : "idle"}
          </span>
        }
      />
      <div className="space-y-2">
        {events.length === 0 && <div className="mono text-[13px] text-faint">awaiting trigger…</div>}
        {events.map((e) => (
          <div key={e.seq} className="grid grid-cols-[58px_104px_1fr_auto] items-baseline gap-4">
            <span className="mono text-[13px] tnum text-faintest">+{(e.t_ms / 1000).toFixed(1)}s</span>
            <span className="mono text-[13px] uppercase tracking-wide text-muted">{e.agent}</span>
            <span className="mono text-[14px] text-fg">{e.message}</span>
            <span className="mono hidden text-[11px] text-faintest lg:block">{e.provider}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
