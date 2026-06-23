import asyncio
import time

from app import repo
from app.router import route_scenario
from app.scopes import all_scopes
from app.domain.risk import compute_risk
from app.domain.trace import TraceEvent
from app.domain.types import ScenarioInputs
from app.domain.scenario import run_scenario
from app.domain.scoring import score_options
from app.domain.spr import compute_spr_plan

AS_OF = "2026-06-22"


def _route(task: str) -> tuple[str, str]:
    table = {
        "classify": ("ollama", "cached"),
        "synthesize": ("claude", "cached"),
        "rank": ("deterministic", "cached"),
    }
    return table.get(task, ("deterministic", "cached"))


async def run_stream(overrides: dict[str, float], query: str = ""):
    seq = {"n": 0}

    def ev(base, agent, phase, message, provider="deterministic", mode="cached", sources=None):
        seq["n"] += 1
        return TraceEvent(
            seq=seq["n"],
            t_ms=int((time.monotonic() - base) * 1000),
            agent=agent,
            phase=phase,
            message=message,
            provider=provider,
            mode=mode,
            sources=sources or [],
        )

    # Routing phase. The Claude CLI is slow to invoke, so this is timed and
    # reported separately from the signal-to-recommendation pipeline below.
    route_t0 = time.monotonic()
    yield ("trace", ev(route_t0, "orchestrator", "start", "Interpreting scenario query with Claude", "claude", "live"))
    scope, method = await asyncio.to_thread(route_scenario, query)
    route_ms = int((time.monotonic() - route_t0) * 1000)
    if scope is None:
        yield (
            "trace",
            ev(route_t0, "orchestrator", "done",
               "Scenario does not map to a corridor this system models. Supported: Hormuz, Red Sea, Russian crude, OPEC+.",
               "claude", "live"),
        )
        yield (
            "result",
            {
                "unmatched": True,
                "query": query,
                "supported": [s["title"] for s in all_scopes()],
                "route_method": method,
                "route_ms": route_ms,
                "total_ms": 0,
            },
        )
        return
    prov = "claude" if method == "claude" else "deterministic"
    yield (
        "trace",
        ev(route_t0, "orchestrator", "retrieve", f"Routed to {scope['title']} via {method} ({route_ms / 1000:.1f}s)", prov, "live" if method == "claude" else "cached"),
    )

    # Signal-to-recommendation pipeline. Timer restarts here.
    t0 = time.monotonic()
    yield (
        "trace",
        ev(t0, "risk", "retrieve", f"Scoping retrieval to {', '.join(scope['buckets'])} for {scope['corridor']}", *_route("classify")),
    )
    signals = repo.retrieve_signals(scope["buckets"], scope["keywords"], 8)
    await asyncio.sleep(0.3)
    risk = compute_risk(scope["corridor"], signals, AS_OF)
    src = [s.source_doc_id for s in signals if s.source_doc_id]
    yield (
        "trace",
        ev(t0, "risk", "done", f"Disruption probability {risk.score:.0%} from {len(signals)} scoped signals", "ollama", "cached", src),
    )
    await asyncio.sleep(0.3)

    values, listed = repo.load_assumption_values(overrides)
    values["hormuz_dependency"] = scope["dependency"]
    for a in listed:
        if a["name"] == "hormuz_dependency":
            a["value"] = scope["dependency"]
            a["rationale"] = f"Share of India crude exposed via {scope['corridor']}"
    inputs = ScenarioInputs(**{k: values[k] for k in ScenarioInputs.model_fields})
    yield ("trace", ev(t0, "scenario", "compute", "Running deterministic impact model on editable assumptions", *_route("synthesize")))
    outputs = run_scenario(inputs)
    await asyncio.sleep(0.3)
    yield (
        "trace",
        ev(t0, "scenario", "done", f"Economic impact ${outputs.economic_impact_usd / 1e9:.2f}B, {outputs.barrels_at_risk_per_day:,.0f} bbl/day at risk"),
    )
    await asyncio.sleep(0.3)

    yield ("trace", ev(t0, "procurement", "retrieve", "Pulling candidate sources and routes from graph", *_route("rank")))
    options = score_options(repo.load_candidates(values["reroute_premium_usd"], scope["id"]))
    await asyncio.sleep(0.3)
    top = options[0]
    yield (
        "trace",
        ev(t0, "procurement", "done", f"Ranked {len(options)} reroutes, top: {top.source} {top.grade} (score {top.composite_score:.2f})"),
    )
    await asyncio.sleep(0.3)

    yield ("trace", ev(t0, "reserve", "compute", "Scheduling SPR drawdown against the supply gap", *_route("rank")))
    spr = compute_spr_plan(inputs, outputs.barrels_at_risk_per_day)
    yield (
        "trace",
        ev(t0, "reserve", "done", f"Draw {spr.daily_drawdown_bbl / 1e3:,.0f}k bbl/day, reserve holds {spr.days_to_exhaustion:.0f} days, refill {spr.replenishment_days:.0f} days"),
    )

    total_ms = int((time.monotonic() - t0) * 1000)
    yield (
        "result",
        {
            "outputs": outputs.model_dump(),
            "ranking": {"options": [o.model_dump() for o in options]},
            "spr": spr.model_dump(),
            "assumptions": listed,
            "risk": risk.model_dump(),
            "scope": scope,
            "route_method": method,
            "route_ms": route_ms,
            "total_ms": total_ms,
        },
    )
