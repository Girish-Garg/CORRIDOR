import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet"
import { MAP_DATA } from "../data/geo"
import { SectionLabel } from "./Section"

export function CorridorMap({ scopeId }: { scopeId: string }) {
  const data = MAP_DATA[scopeId] ?? MAP_DATA.hormuz
  return (
    <div className="panel p-5">
      <SectionLabel
        n="5.0"
        title="Geospatial corridors"
        right={<span className="meta">{data.routes.length} routes</span>}
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
      </div>
    </div>
  )
}
