import { useEffect, useState } from "react"
import { SignalRef } from "../lib/api"
import { SectionLabel } from "./Section"

function sevColor(s: number): string {
  if (s >= 0.8) return "#f0503c"
  if (s >= 0.5) return "#e8913c"
  return "#6b6b71"
}

// The feed of dated signals the risk agent scored, framed as a continuous
// monitor. The "synced Ns ago" heartbeat ticks to show the feed is live,
// separate from the (older) dates the signals themselves carry.
export function SignalTicker({ signals }: { signals: SignalRef[] }) {
  const [ago, setAgo] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setAgo((a) => (a + 1) % 9), 1000)
    return () => clearInterval(id)
  }, [])

  const sorted = [...signals].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1))

  return (
    <div className="panel p-6">
      <SectionLabel
        n="1.5"
        title="Live signal feed"
        right={
          <span className="mono inline-flex items-center gap-2 text-[12px] text-faint">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            monitoring · synced {ago}s ago
          </span>
        }
      />
      <div className="reveal max-h-[300px] space-y-3 overflow-y-auto pr-1">
        {sorted.length === 0 && (
          <div className="mono text-[13px] text-faint">no signals in scope</div>
        )}
        {sorted.map((s, i) => (
          <div
            key={`${s.occurred_at}-${i}`}
            className="flex items-start gap-3 border-b border-line pb-3 last:border-0"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: sevColor(s.severity) }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] leading-snug text-fg">{s.headline}</div>
              <div className="mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                <span className="tnum">{s.occurred_at.slice(0, 10)}</span>
                <span className="uppercase tracking-wide">{s.bucket}</span>
                <span>sev {Math.round(s.severity * 100)}</span>
                {s.source_doc_id && <span className="text-faintest">{s.source_doc_id}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
