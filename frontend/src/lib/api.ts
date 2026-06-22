export type ScenarioOutputs = {
  barrels_at_risk_per_day: number
  reserve_cover_days: number
  price_impact_usd_bbl: number
  price_delta_usd_bbl: number
  economic_impact_usd: number
}

export type RerouteOption = {
  id: string
  source: string
  grade: string
  route: string
  avoids_hormuz: boolean
  landed_price_usd_bbl: number
  tanker_availability: number
  grade_fit: number
  days_to_refinery: number
  available_volume_bbl: number
  composite_score: number
  source_doc_id: string | null
}

export type Assumption = {
  name: string
  value: number
  unit: string
  source: string
  rationale: string
}

export type RunResult = {
  outputs: ScenarioOutputs
  ranking: { options: RerouteOption[] }
  assumptions: Assumption[]
}

export async function runScenario(overrides: Record<string, number> = {}): Promise<RunResult> {
  const res = await fetch("http://localhost:8000/scenario/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
  })
  if (!res.ok) throw new Error("scenario run failed")
  return res.json()
}
