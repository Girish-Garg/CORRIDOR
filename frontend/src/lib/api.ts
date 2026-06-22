export type ScenarioOutputs = {
  barrels_at_risk_per_day: number
  reserve_cover_days: number
  price_impact_usd_bbl: number
  price_delta_usd_bbl: number
  economic_impact_usd: number
  pump_price_inr_per_l: number
  pump_price_delta_inr_per_l: number
  gdp_drag_pct: number
}

export type SprDay = {
  day: number
  gap_bbl: number
  reroute_bbl: number
  drawdown_bbl: number
  remaining_pct: number
}

export type SprPlan = {
  spr_total_bbl: number
  daily_drawdown_bbl: number
  days_to_exhaustion: number
  covered_days: number
  refinery_run_cut_pct: number
  replenishment_days: number
  reroute_ramp_days: number
  schedule: SprDay[]
}

export type RerouteOption = {
  id: string
  source: string
  grade: string
  route: string
  avoids_label: string
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

export type SignalRef = {
  occurred_at: string
  headline: string
  severity: number
  bucket: string
  source_doc_id: string | null
}

export type RiskAssessment = {
  corridor: string
  score: number
  signals: SignalRef[]
  as_of: string
}

export type ScenarioScope = {
  id: string
  title: string
  corridor: string
  buckets: string[]
  keywords: string[]
}

export type RunResult = {
  outputs: ScenarioOutputs
  ranking: { options: RerouteOption[] }
  spr?: SprPlan
  assumptions: Assumption[]
  risk?: RiskAssessment
  scope?: ScenarioScope
  route_method?: string
  total_ms?: number
}

export async function runScenario(
  overrides: Record<string, number> = {},
  scope = "hormuz",
): Promise<RunResult> {
  const res = await fetch("http://localhost:8000/scenario/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides, scope }),
  })
  if (!res.ok) throw new Error("scenario run failed")
  return res.json()
}
