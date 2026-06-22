from app.domain.types import ScenarioInputs, ScenarioOutputs

# Cascade modeling knobs. Each is a labeled assumption, not a sourced fact.
FX_INR_PER_USD = 86.0
LITERS_PER_BBL = 159.0
PUMP_PASSTHROUGH = 0.45  # share of a crude move that reaches the pump after taxes and margins
BASELINE_PUMP_INR_PER_L = 95.0
INDIA_GDP_USD = 3.9e12


def barrels_at_risk_per_day(i: ScenarioInputs) -> float:
    return i.india_daily_imports_bbl * i.hormuz_dependency * i.closure_severity


def pump_price_delta_inr_per_l(price_delta_usd_bbl: float) -> float:
    return price_delta_usd_bbl * FX_INR_PER_USD / LITERS_PER_BBL * PUMP_PASSTHROUGH


def gdp_drag_pct(economic_impact_usd: float, duration_days: float) -> float:
    if duration_days <= 0:
        return 0.0
    annualized = economic_impact_usd / duration_days * 365.0
    return annualized / INDIA_GDP_USD * 100.0


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
    pump_delta = pump_price_delta_inr_per_l(delta)
    return ScenarioOutputs(
        barrels_at_risk_per_day=risk,
        reserve_cover_days=reserve_cover_days(i),
        price_impact_usd_bbl=price,
        price_delta_usd_bbl=delta,
        economic_impact_usd=economic,
        pump_price_inr_per_l=BASELINE_PUMP_INR_PER_L + pump_delta,
        pump_price_delta_inr_per_l=pump_delta,
        gdp_drag_pct=gdp_drag_pct(economic, i.closure_duration_days),
    )
