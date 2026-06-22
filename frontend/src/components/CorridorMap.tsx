import "leaflet/dist/leaflet.css"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet"
import { MAP_DATA, Route } from "../data/geo"
import { SectionLabel } from "./Section"

function pointAlong(coords: [number, number][], f: number): [number, number] {
  if (coords.length < 2) return coords[0]
  const segs: number[] = []
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const l = Math.hypot(coords[i][1] - coords[i - 1][1], coords[i][0] - coords[i - 1][0])
    segs.push(l)
    total += l
  }
  let d = f * total
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) {
      const r = segs[i] === 0 ? 0 : d / segs[i]
      return [
        coords[i][0] + (coords[i + 1][0] - coords[i][0]) * r,
        coords[i][1] + (coords[i + 1][1] - coords[i][1]) * r,
      ]
    }
    d -= segs[i]
  }
  return coords[coords.length - 1]
}

// Tankers crawling along each open reroute. Pure visual motion to read the
// rerouting live, distinct from the static grey vessels near the disruption.
function MovingVessels({ routes }: { routes: Route[] }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x + 0.0045) % 1), 60)
    return () => clearInterval(id)
  }, [])
  return (
    <>
      {routes.map((r, i) => {
        const p = pointAlong(r.coords, (t + i / routes.length) % 1)
        return (
          <CircleMarker
            key={r.label}
            center={p}
            radius={3.5}
            pathOptions={{ color: "#e8913c", fillColor: "#e8913c", fillOpacity: 0.95, weight: 0 }}
          >
            <Tooltip>{r.label}</Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}

export function CorridorMap({ scopeId }: { scopeId: string }) {
  const data = MAP_DATA[scopeId] ?? MAP_DATA.hormuz
  const moving = data.routes.filter((r) => r.avoidsDisruption)
  return (
    <div className="panel p-5">
      <SectionLabel
        n="5.0"
        title="Geospatial corridors"
        right={<span className="meta">{data.routes.length} routes · {moving.length} rerouting</span>}
      />
      <div className="corridor-map overflow-hidden rounded-md border border-line" style={{ height: 420 }}>
        <MapContainer
          key={scopeId}
          center={data.center}
          zoom={data.zoom}
          style={{ height: "100%", width: "100%", background: "#0a0a0b" }}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {data.routes.map((r) => (
            <Polyline
              key={r.label}
              positions={r.coords}
              pathOptions={{
                color: r.avoidsDisruption ? "#e8913c" : "#6b6b71",
                weight: r.avoidsDisruption ? 2 : 1.5,
                opacity: 0.9,
                dashArray: r.avoidsDisruption ? undefined : "5 6",
              }}
            >
              <Tooltip sticky>{r.label}</Tooltip>
            </Polyline>
          ))}
          {data.vessels.map((v, i) => (
            <CircleMarker
              key={`v${i}`}
              center={v}
              radius={2.5}
              pathOptions={{ color: "#a1a1a6", fillColor: "#a1a1a6", fillOpacity: 0.85, weight: 0 }}
            />
          ))}
          <MovingVessels routes={moving} />
          <CircleMarker
            center={[data.chokepoint.lat, data.chokepoint.lng]}
            radius={7}
            pathOptions={{ color: "#f0503c", fillColor: "#f0503c", fillOpacity: 0.45 }}
          >
            <Tooltip>{data.chokepoint.name} · disrupted</Tooltip>
          </CircleMarker>
          <CircleMarker
            center={[data.hub.lat, data.hub.lng]}
            radius={6}
            pathOptions={{ color: "#ededec", fillColor: "#ededec", fillOpacity: 0.7 }}
          >
            <Tooltip>{data.hub.name}</Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        <span className="meta">
          <span style={{ color: "#e8913c" }}>—</span> reroute avoiding disruption
        </span>
        <span className="meta">
          <span style={{ color: "#f0503c" }}>•</span> disrupted chokepoint
        </span>
        <span className="meta">
          <span style={{ color: "#ededec" }}>•</span> India refineries
        </span>
        <span className="meta">
          <span style={{ color: "#e8913c" }}>•</span> tanker rerouting
        </span>
      </div>
    </div>
  )
}
