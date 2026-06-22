from pydantic import BaseModel


class ScenarioInputs(BaseModel):
    india_daily_imports_bbl: float
    hormuz_dependency: float
    reserve_days: float
    baseline_brent_usd: float
    closure_severity: float
    closure_duration_days: float
    risk_premium_per_pct_blocked: float
    reroute_premium_usd: float


class ScenarioOutputs(BaseModel):
    barrels_at_risk_per_day: float
    reserve_cover_days: float
    price_impact_usd_bbl: float
    price_delta_usd_bbl: float
    economic_impact_usd: float


class RerouteOption(BaseModel):
    id: str
    source: str
    grade: str
    route: str
    avoids_label: str
    landed_price_usd_bbl: float
    tanker_availability: float
    grade_fit: float
    days_to_refinery: float
    available_volume_bbl: float
    composite_score: float
    source_doc_id: str | None = None


class RerouteRanking(BaseModel):
    options: list[RerouteOption]
