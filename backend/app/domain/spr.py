from app.domain.types import ScenarioInputs, SprDay, SprPlan

# Strategic Petroleum Reserve drawdown model. Deterministic and editable, in
# the same style as the scenario engine. Given a daily supply gap, it schedules
# how fast to release the reserve while reroutes ramp in, reports when the
# reserve runs dry, how far refinery runs would still be cut, and the window to
# refill the reserve once the disruption ends.

REROUTE_OFFSET_SHARE = 0.6   # share of the gap reroutes can carry once fully online
REROUTE_RAMP_DAYS = 14       # lead time for alternative cargoes to reach refineries
REFILL_SHARE_OF_IMPORTS = 0.08  # daily SPR refill rate as a share of normal imports


def _reroute_online(day: int, gap: float, ramp_days: float) -> float:
    ramped = gap * REROUTE_OFFSET_SHARE
    if ramp_days <= 0:
        return ramped
    return min(ramped, ramped * day / ramp_days)


def compute_spr_plan(inputs: ScenarioInputs, gap_per_day: float) -> SprPlan:
    spr_total = inputs.india_daily_imports_bbl * inputs.reserve_days
    duration = max(1, int(round(inputs.closure_duration_days)))
    ramp = REROUTE_RAMP_DAYS

    remaining = spr_total
    schedule: list[SprDay] = []
    peak_drawdown = 0.0
    exhaustion = float(duration)
    exhausted = False
    final_unmet = 0.0

    for day in range(1, duration + 1):
        reroute = _reroute_online(day, gap_per_day, ramp)
        want = max(0.0, gap_per_day - reroute)
        drawn = min(want, remaining)
        remaining = max(0.0, remaining - drawn)
        unmet = want - drawn
        final_unmet = unmet
        peak_drawdown = max(peak_drawdown, drawn)
        if remaining <= 0 and not exhausted:
            exhaustion = float(day)
            exhausted = True
        schedule.append(
            SprDay(
                day=day,
                gap_bbl=round(gap_per_day),
                reroute_bbl=round(reroute),
                drawdown_bbl=round(drawn),
                remaining_pct=round(remaining / spr_total * 100, 1) if spr_total > 0 else 0.0,
            )
        )

    # Refinery run cut is the share of normal throughput still unmet on the last
    # modeled day, after reroutes and whatever SPR is left.
    run_cut = 0.0
    if inputs.india_daily_imports_bbl > 0:
        run_cut = round(final_unmet / inputs.india_daily_imports_bbl * 100, 1)

    used = spr_total - remaining
    refill_rate = inputs.india_daily_imports_bbl * REFILL_SHARE_OF_IMPORTS
    replenishment = round(used / refill_rate, 1) if refill_rate > 0 else 0.0

    return SprPlan(
        spr_total_bbl=round(spr_total),
        daily_drawdown_bbl=round(peak_drawdown),
        days_to_exhaustion=round(exhaustion, 1),
        covered_days=round(min(exhaustion, float(duration)), 1),
        refinery_run_cut_pct=run_cut,
        replenishment_days=replenishment,
        reroute_ramp_days=ramp,
        schedule=schedule,
    )
