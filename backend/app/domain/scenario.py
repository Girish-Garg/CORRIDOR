from app.domain.types import ScenarioInputs, ScenarioOutputs


def barrels_at_risk_per_day(i: ScenarioInputs) -> float:
    return i.india_daily_imports_bbl * i.hormuz_dependency * i.closure_severity


def reserve_cover_days(i: ScenarioInputs) -> float:
    denom = i.hormuz_dependency * i.closure_severity
    if denom <= 0:
        return float("inf")
    return i.reserve_days / denom


def price_impact_usd_bbl(i: ScenarioInputs) -> float:
    pct_blocked = i.closure_severity * i.hormuz_dependency * 100.0
    return i.baseline_brent_usd + i.risk_premium_per_pct_blocked * pct_blocked


def run_scenario(i: ScenarioInputs) -> ScenarioOutputs:
    risk = barrels_at_risk_per_day(i)
    price = price_impact_usd_bbl(i)
    delta = price - i.baseline_brent_usd
    economic = risk * (delta + i.reroute_premium_usd) * i.closure_duration_days
    return ScenarioOutputs(
        barrels_at_risk_per_day=risk,
        reserve_cover_days=reserve_cover_days(i),
        price_impact_usd_bbl=price,
        price_delta_usd_bbl=delta,
        economic_impact_usd=economic,
    )
