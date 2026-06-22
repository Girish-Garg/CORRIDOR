import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { REPLAY } from "../data/prices"
import { SectionLabel } from "./Section"

export function ReplayTimeline({ scopeId }: { scopeId: string }) {
  const data = REPLAY[scopeId] ?? REPLAY.hormuz
  const firstSignal = data.find((d) => d.event)
  const peak = data.reduce((a, b) => (b.brent > a.brent ? b : a), data[0])

  return (
    <div className="panel p-5">
      <SectionLabel n="6.0" title="Historical replay" right={<span className="meta">lead time before price move</span>} />
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: "#6b6b71", fontSize: 11 }} stroke="#232227" />
            <YAxis yAxisId="score" domain={[0, 1]} hide />
            <YAxis yAxisId="brent" orientation="right" tick={{ fill: "#6b6b71", fontSize: 11 }} stroke="#232227" width={34} />
            <Tooltip
              contentStyle={{ background: "#16151a", border: "1px solid #232227", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "#ededec" }}
            />
            <Line yAxisId="score" dataKey="score" stroke="#e8913c" strokeWidth={2} dot={{ r: 2, fill: "#e8913c" }} name="Disruption score" />
            <Line yAxisId="brent" dataKey="brent" stroke="#a1a1a6" strokeWidth={1.5} dot={false} name="Brent $/bbl" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4">
        <span className="meta">
          <span style={{ color: "#e8913c" }}>—</span> disruption score
        </span>
        <span className="meta">
          <span style={{ color: "#a1a1a6" }}>—</span> Brent $/bbl
        </span>
      </div>
      {firstSignal && (
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Score crossed threshold on {firstSignal.date} ({firstSignal.event}), ahead of Brent peaking at ${peak.brent} on {peak.date}.
        </p>
      )}
    </div>
  )
}
