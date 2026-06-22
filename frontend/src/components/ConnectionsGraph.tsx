import { RerouteOption, ScenarioScope } from "../lib/api"
import { SectionLabel } from "./Section"

// Supplier - route - risk - refinery relationships, drawn from the live ranking.
// The disrupted corridor is the red node with a blocked edge to the refinery;
// each ranked supplier links in along its route, weighted by composite score.

const REFINERY = { x: 560, y: 168, w: 150, h: 50 }
const RISK = { x: 250, y: 8, w: 210, h: 44 }

export function ConnectionsGraph({
  options,
  scope,
}: {
  options: RerouteOption[]
  scope?: ScenarioScope
}) {
  const top = options.slice(0, 4)
  const rx = REFINERY.x
  const ry = REFINERY.y + REFINERY.h / 2
  const nodeH = 52
  const gap = 18
  const startY = 70

  return (
    <div className="panel p-6">
      <SectionLabel
        n="6.0"
        title="Supply connections"
        right={<span className="meta">{top.length} suppliers · 1 corridor</span>}
      />
      <svg viewBox="0 0 720 360" width="100%" style={{ display: "block" }}>
        {/* blocked corridor edge */}
        <path
          d={`M ${RISK.x + RISK.w / 2} ${RISK.y + RISK.h} C ${RISK.x + RISK.w / 2} 120, ${rx - 40} 110, ${rx} ${ry - 16}`}
          fill="none"
          stroke="#f0503c"
          strokeWidth={1.6}
          strokeDasharray="5 5"
          opacity={0.8}
        />
        <text x={(RISK.x + RISK.w / 2 + rx) / 2 - 6} y={108} fill="#f0503c" fontSize={10} fontFamily="IBM Plex Mono">
          BLOCKS
        </text>

        {/* supplier edges */}
        {top.map((o, i) => {
          const sy = startY + i * (nodeH + gap) + nodeH / 2
          const strong = i === 0
          return (
            <g key={`edge-${o.id}`}>
              <path
                d={`M 190 ${sy} C 330 ${sy}, 420 ${ry}, ${rx} ${ry}`}
                fill="none"
                stroke={strong ? "#e8913c" : "#3a3942"}
                strokeWidth={1.2 + o.composite_score * 2.4}
                opacity={strong ? 0.95 : 0.6}
              />
              <text
                x={300}
                y={(sy + ry) / 2 - 4}
                fill="#6b6b71"
                fontSize={9.5}
                fontFamily="IBM Plex Mono"
              >
                {o.route}
              </text>
            </g>
          )
        })}

        {/* risk node */}
        <g>
          <rect x={RISK.x} y={RISK.y} width={RISK.w} height={RISK.h} rx={7} fill="#1c1316" stroke="#f0503c" />
          <text x={RISK.x + 14} y={RISK.y + 19} fill="#ededec" fontSize={13} fontFamily="Source Serif 4" fontWeight={600}>
            {scope?.corridor ?? "Corridor"}
          </text>
          <text x={RISK.x + 14} y={RISK.y + 34} fill="#f0503c" fontSize={10} fontFamily="IBM Plex Mono">
            disrupted
          </text>
        </g>

        {/* supplier nodes */}
        {top.map((o, i) => {
          const y = startY + i * (nodeH + gap)
          const strong = i === 0
          return (
            <g key={`node-${o.id}`}>
              <rect x={20} y={y} width={170} height={nodeH} rx={7} fill="#16151a" stroke={strong ? "#e8913c" : "#232227"} />
              <text x={34} y={y + 21} fill="#ededec" fontSize={13} fontFamily="Source Serif 4" fontWeight={600}>
                {o.source}
              </text>
              <text x={34} y={y + 38} fill="#a1a1a6" fontSize={10.5} fontFamily="IBM Plex Mono">
                {o.grade} · {o.composite_score.toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* refinery node */}
        <g>
          <rect x={REFINERY.x} y={REFINERY.y} width={REFINERY.w} height={REFINERY.h} rx={8} fill="#16151a" stroke="#ededec" />
          <text x={REFINERY.x + 16} y={REFINERY.y + 22} fill="#ededec" fontSize={13.5} fontFamily="Source Serif 4" fontWeight={600}>
            India refineries
          </text>
          <text x={REFINERY.x + 16} y={REFINERY.y + 38} fill="#a1a1a6" fontSize={10.5} fontFamily="IBM Plex Mono">
            Jamnagar hub
          </text>
        </g>
      </svg>
      <div className="mt-2 flex flex-wrap gap-4">
        <span className="meta"><span style={{ color: "#e8913c" }}>—</span> top-ranked supply</span>
        <span className="meta"><span style={{ color: "#f0503c" }}>- -</span> blocked corridor</span>
        <span className="meta">edge weight = composite score</span>
      </div>
    </div>
  )
}
