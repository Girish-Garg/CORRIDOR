from app.domain.types import ScenarioInputs
from app.domain.scenario import barrels_at_risk_per_day
from app.domain.spr import compute_spr_plan


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


def _plan(**kw):
    i = _inputs(**kw)
    return compute_spr_plan(i, barrels_at_risk_per_day(i))


def test_total_reserve_is_days_times_imports():
    i = _inputs()
    plan = compute_spr_plan(i, barrels_at_risk_per_day(i))
    assert plan.spr_total_bbl == round(i.india_daily_imports_bbl * i.reserve_days)


def test_schedule_spans_duration_and_drains_monotonically():
    plan = _plan(closure_duration_days=30)
    assert len(plan.schedule) == 30
    pcts = [d.remaining_pct for d in plan.schedule]
    assert pcts == sorted(pcts, reverse=True)
    assert plan.schedule[-1].remaining_pct <= plan.schedule[0].remaining_pct


def test_drawdown_and_replenishment_are_positive_under_closure():
    plan = _plan()
    assert plan.daily_drawdown_bbl > 0
    assert plan.replenishment_days > 0


def test_longer_closure_cannot_outlast_a_finite_reserve():
    plan = _plan(closure_duration_days=90)
    assert plan.days_to_exhaustion <= 90
    assert plan.refinery_run_cut_pct >= 0
