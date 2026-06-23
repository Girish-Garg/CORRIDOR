import { useEffect, useState } from "react"
import { runScenario, RiskAssessment } from "./lib/api"
import { Sidebar } from "./components/Sidebar"
import { ScenarioPanel } from "./components/ScenarioPanel"
import { RerouteCards } from "./components/RerouteCards"
import { CorridorMap } from "./components/CorridorMap"
import { ReplayTimeline } from "./components/ReplayTimeline"
import { AgentStream } from "./components/AgentStream"
import { SignalTicker } from "./components/SignalTicker"
import { SprPanel } from "./components/SprPanel"
import { ConnectionsGraph } from "./components/ConnectionsGraph"
import { SectionLabel } from "./components/Section"
import { useScenarioStream } from "./hooks/useEventStream"

const TABS = [
  { id: "risk", label: "Risk & signals" },
  { id: "impact", label: "Impact & reserve" },
  { id: "procurement", label: "Procurement" },
  { id: "map", label: "Geospatial" },
] as const

type TabId = (typeof TABS)[number]["id"]

function Clock() {
  const [t, setT] = useState(() => new Date().toISOString().slice(11, 19))
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toISOString().slice(11, 19)), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="mono text-[12px] tnum text-faint">{t} UTC</span>
}

function DisruptionBand({ risk }: { risk: RiskAssessment }) {
  return (
    <div className="panel p-6">
      <SectionLabel
        title="Disruption probability"
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

function UnmatchedNotice({ supported, onPick }: { supported: string[]; onPick: (t: string) => void }) {
  return (
    <div className="panel p-8">
      <SectionLabel title="Scenario not recognized" />
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
        This scenario does not map to a corridor the system currently models. It covers four
        disruption types. Pick one to run it, or rephrase your scenario around one of these
        corridors.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {supported.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="mono rounded border border-line px-3 py-2 text-[13px] text-fg transition-colors hover:border-accent hover:text-accent"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { events, result, running, totalMs, runId, start, setResult } = useScenarioStream()
  const [tab, setTab] = useState<TabId>("risk")
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    start("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function runAndClose(text: string) {
    setNavOpen(false)
    start(text)
  }

  async function recompute(overrides: Record<string, number>) {
    try {
      const r = await runScenario(overrides, result?.scope?.id ?? "hormuz")
      setResult((prev) =>
        prev ? { ...prev, outputs: r.outputs, ranking: r.ranking, spr: r.spr, assumptions: r.assumptions } : prev,
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
        assumptions={result?.assumptions ?? []}
        loading={running}
        onRun={runAndClose}
        onTune={recompute}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open controls"
              className="-ml-1 p-1 text-muted hover:text-fg lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-[15px] font-semibold tracking-tightest text-fg lg:hidden">CORRIDOR</span>
            <span className="meta hidden sm:inline">Indian crude procurement</span>
          </div>
          <div className="flex items-center gap-6">
            <Clock />
            <span className="h-2 w-2 rounded-full bg-accent" />
          </div>
        </div>
        <main className="flex flex-1 flex-col gap-5 p-4 sm:p-7">
          <AgentStream events={events} totalMs={totalMs} running={running} />
          {result?.unmatched ? (
            <UnmatchedNotice supported={result.supported ?? []} onPick={runAndClose} />
          ) : result ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-line">
                {TABS.map((t) => {
                  const active = tab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`mono -mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[12px] uppercase tracking-wide transition-colors sm:px-4 ${
                        active ? "border-accent text-fg" : "border-transparent text-faint hover:text-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {tab === "risk" && (
                <div className="flex flex-col gap-5">
                  {result.risk && <DisruptionBand risk={result.risk} />}
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                    {result.risk && (
                      <div className="min-w-0 flex-1">
                        <SignalTicker signals={result.risk.signals} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <ReplayTimeline scopeId={scopeId} />
                    </div>
                  </div>
                </div>
              )}

              {tab === "impact" && (
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1">
                    <ScenarioPanel o={result.outputs} runKey={runId} />
                  </div>
                  {result.spr && (
                    <div className="min-w-0 flex-1">
                      <SprPanel spr={result.spr} runKey={runId} />
                    </div>
                  )}
                </div>
              )}

              {tab === "procurement" && (
                <div className="flex flex-col gap-5">
                  <RerouteCards options={result.ranking.options} runKey={runId} />
                  <ConnectionsGraph options={result.ranking.options} scope={result.scope} />
                </div>
              )}

              {tab === "map" && <CorridorMap scopeId={scopeId} />}
            </>
          ) : (
            <div className="panel meta p-10 text-center">{running ? "Computing…" : "Idle"}</div>
          )}
        </main>
        <footer className="border-t border-line px-7 py-4">
          <div className="meta">EIA · IEA · CEEW · deterministic engine</div>
        </footer>
      </div>
    </div>
  )
}
