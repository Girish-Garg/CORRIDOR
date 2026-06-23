import { useEffect, useState } from "react"
import { SignalRef, SignalStatus, getSignalStatus } from "../lib/api"
import { SectionLabel } from "./Section"

function sevColor(s: number): string {
  if (s >= 0.8) return "#f0503c"
  if (s >= 0.5) return "#e8913c"
  return "#6b6b71"
}

function relTime(iso: string | null): string {
  if (!iso) return ""
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (secs < 60) return `${secs}s ago`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// The feed of dated signals the risk agent scored. When the live poller has
// pulled headlines from public feeds it shows a live heartbeat and a real
// last-sync time; otherwise it falls back to the seeded set.
export function SignalTicker({ signals }: { signals: SignalRef[] }) {
  const [status, setStatus] = useState<SignalStatus | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    const load = () =>
      getSignalStatus()
        .then((s) => alive && setStatus(s))
        .catch(() => {})
    load()
    const poll = setInterval(load, 30000)
    const tick = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      alive = false
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [])

  const sorted = [...signals].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1))
  const live = status?.live

  return (
    <div className="panel p-6">
      <SectionLabel
        title="Live signal feed"
        right={
          live ? (
            <span className="mono inline-flex items-center gap-2 text-[12px] text-faint">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              live · {status?.live_count} signals · synced {relTime(status?.last_fetch ?? null)}
            </span>
          ) : (
            <span className="mono inline-flex items-center gap-2 text-[12px] text-faint">
              <span className="h-2 w-2 rounded-full bg-faint" />
              seeded feed
            </span>
          )
        }
      />
      <div className="reveal max-h-[300px] space-y-3 overflow-y-auto pr-1">
        {sorted.length === 0 && <div className="mono text-[13px] text-faint">no signals in scope</div>}
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
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[15px] leading-snug text-fg hover:text-accent"
                >
                  {s.headline}
                </a>
              ) : (
                <div className="text-[15px] leading-snug text-fg">{s.headline}</div>
              )}
              <div className="mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                <span className="tnum">{s.occurred_at.slice(0, 10)}</span>
                <span className="uppercase tracking-wide">{s.bucket}</span>
                <span>sev {Math.round(s.severity * 100)}</span>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-faintest hover:text-accent">
                    source
                  </a>
                ) : (
                  s.source_doc_id && <span className="text-faintest">{s.source_doc_id}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
