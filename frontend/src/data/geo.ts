export type Route = { label: string; avoidsDisruption: boolean; coords: [number, number][] }

export type MapData = {
  center: [number, number]
  zoom: number
  chokepoint: { name: string; lat: number; lng: number }
  hub: { name: string; lat: number; lng: number }
  routes: Route[]
  vessels: [number, number][]
}

const INDIA = { name: "Jamnagar refineries", lat: 22.4, lng: 69.8 }

export const MAP_DATA: Record<string, MapData> = {
  hormuz: {
    center: [20, 55],
    zoom: 3,
    chokepoint: { name: "Strait of Hormuz", lat: 26.57, lng: 56.25 },
    hub: INDIA,
    routes: [
      { label: "Russia Urals via Cape", avoidsDisruption: true, coords: [[60.3, 28.7], [36, -6], [-34.35, 18.47], [-5, 55], [22.4, 69.8]] },
      { label: "Nigeria via Cape", avoidsDisruption: true, coords: [[4.5, 7], [-34.35, 18.47], [-5, 55], [22.4, 69.8]] },
      { label: "ESPO Pacific direct", avoidsDisruption: true, coords: [[42.7, 133.1], [5, 105], [10, 80], [22.4, 69.8]] },
      { label: "Gulf via Hormuz, blocked", avoidsDisruption: false, coords: [[26.57, 56.25], [24, 62], [22.4, 69.8]] },
    ],
    vessels: [[25, 58], [20, 64], [-20, 40], [8, 75]],
  },
  redsea: {
    center: [15, 50],
    zoom: 3,
    chokepoint: { name: "Bab-el-Mandeb", lat: 12.6, lng: 43.35 },
    hub: INDIA,
    routes: [
      { label: "West Africa via Cape", avoidsDisruption: true, coords: [[4.5, 7], [-34.35, 18.47], [-5, 55], [22.4, 69.8]] },
      { label: "Gulf via Hormuz, open", avoidsDisruption: true, coords: [[26.57, 56.25], [24, 62], [22.4, 69.8]] },
      { label: "Suez via Bab-el-Mandeb, blocked", avoidsDisruption: false, coords: [[30, 32.55], [20, 38], [12.6, 43.35], [10, 55], [22.4, 69.8]] },
    ],
    vessels: [[14, 44], [18, 40], [8, 60]],
  },
  russia: {
    center: [38, 58],
    zoom: 2,
    chokepoint: { name: "Russian crude exports", lat: 60.3, lng: 28.7 },
    hub: INDIA,
    routes: [
      { label: "US Gulf via Cape", avoidsDisruption: true, coords: [[29, -94], [10, -30], [-34.35, 18.47], [-5, 55], [22.4, 69.8]] },
      { label: "Saudi via Hormuz", avoidsDisruption: true, coords: [[27, 50], [26.57, 56.25], [22.4, 69.8]] },
      { label: "Russia Urals, sanctioned", avoidsDisruption: false, coords: [[60.3, 28.7], [36, -6], [-34.35, 18.47], [22.4, 69.8]] },
    ],
    vessels: [[58, 25], [40, 0], [22, 68]],
  },
}
