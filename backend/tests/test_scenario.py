import math
from app.domain.types import ScenarioInputs
from app.domain.scenario import (
    barrels_at_risk_per_day,
    reserve_cover_days,
    price_impact_usd_bbl,
    run_scenario,
)


def _inputs(**kw):
    base = dict(
        india_daily_imports_bbl=4_700_000,
        hormuz_dependency=0.42,
        reserve_days=9.5,
        baseline_brent_usd=80.0,
        closure_severity=1.0,
        closure_duration_days=30,
        risk_premium_per_pct_blocked=0.5,
        reroute_premium_usd=4.0,
    )
    base.update(kw)
    return ScenarioInputs(**base)


def test_barrels_at_risk_full_closure():
    assert barrels_at_risk_per_day(_inputs()) == 1_974_000


def test_reserve_cover_full_closure():
    assert math.isclose(reserve_cover_days(_inputs()), 9.5 / 0.42, rel_tol=1e-9)


def test_reserve_cover_no_closure_is_infinite():
    assert reserve_cover_days(_inputs(closure_severity=0.0)) == float("inf")


def test_price_impact_full_closure():
    assert math.isclose(price_impact_usd_bbl(_inputs()), 101.0, rel_tol=1e-9)


def test_economic_impact_positive_and_scales_with_duration():
    short = run_scenario(_inputs(closure_duration_days=10))
    long = run_scenario(_inputs(closure_duration_days=30))
    assert long.economic_impact_usd > short.economic_impact_usd > 0
