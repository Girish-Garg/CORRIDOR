import { useEffect, useRef, useState } from "react"
import { Assumption } from "../lib/api"
import { SectionLabel } from "./Section"

const FIELDS = [
  { name: "closure_severity", label: "Closure severity", min: 0, max: 1, step: 0.05, fmt: (v: number) => `${Math.round(v * 100)}%` },
  { name: "hormuz_dependency", label: "Hormuz dependency", min: 0.2, max: 0.6, step: 0.01, fmt: (v: number) => `${Math.round(v * 100)}%` },
  { name: "risk_premium_per_pct_blocked", label: "Risk premium per %", min: 0, max: 1.5, step: 0.05, fmt: (v: number) => `$${v.toFixed(2)}` },
  { name: "reroute_premium_usd", label: "Reroute premium", min: 0, max: 12, step: 0.5, fmt: (v: number) => `$${v.toFixed(1)}` },
  { name: "closure_duration_days", label: "Closure duration", min: 5, max: 90, step: 5, fmt: (v: number) => `${v}d` },
]

export function AssumptionSliders({
  assumptions,
  onChange,
}: {
  assumptions: Assumption[]
  onChange: (overrides: Record<string, number>) => void
}) {
  const [vals, setVals] = useState<Record<string, number>>({})
  const inited = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (inited.current || assumptions.length === 0) return
    const base = Object.fromEntries(assumptions.map((a) => [a.name, a.value]))
    setVals(Object.fromEntries(FIELDS.map((f) => [f.name, base[f.name] ?? f.min])))
    inited.current = true
  }, [assumptions])

  function set(name: string, v: number) {
    const next = { ...vals, [name]: v }
    setVals(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onChange(next), 250)
  }

  return (
    <div>
      <SectionLabel n="1.2" title="Assumptions, drag to test" right={<span className="meta">live re-run</span>} />
      <div className="space-y-4">
        {FIELDS.map((f) => {
          const v = vals[f.name] ?? f.min
          return (
            <div key={f.name}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-muted">{f.label}</span>
                <span className="mono tnum text-fg">{f.fmt(v)}</span>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={v}
                onChange={(e) => set(f.name, parseFloat(e.target.value))}
                className="mt-1.5 w-full accent-accent"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
