import asyncio
import time

from app import repo
from app.domain.risk import compute_risk
from app.domain.trace import TraceEvent
from app.domain.types import ScenarioInputs
from app.domain.scenario import run_scenario
from app.domain.scoring import score_options

AS_OF = "2026-06-22"


def _route(task: str) -> tuple[str, str]:
    table = {
        "classify": ("ollama", "cached"),
        "synthesize": ("claude", "cached"),
        "rank": ("deterministic", "cached"),
    }
    return table.get(task, ("deterministic", "cached"))


async def run_stream(overrides: dict[str, float]):
    start = time.monotonic()
    seq = {"n": 0}

    def ev(agent, phase, message, provider="deterministic", mode="cached", sources=None):
        seq["n"] += 1
        return TraceEvent(
            seq=seq["n"],
            t_ms=int((time.monotonic() - start) * 1000),
            agent=agent,
            phase=phase,
            message=message,
            provider=provider,
            mode=mode,
            sources=sources or [],
        )

    yield ("trace", ev("orchestrator", "start", "Spawning agent chain: Strait of Hormuz closure"))
    await asyncio.sleep(0.35)

    yield ("trace", ev("risk", "retrieve", "Querying geopolitics, shipping, policy buckets", *_route("classify")))
    signals = repo.retrieve_signals(["geopolitics", "shipping", "policy", "commodities"], 8)
    await asyncio.sleep(0.35)
    risk = compute_risk("Strait of Hormuz", signals, AS_OF)
    src = [s.source_doc_id for s in signals if s.source_doc_id]
    yield (
        "trace",
        ev("risk", "done", f"Disruption probability {risk.score:.0%} from {len(signals)} signals", "ollama", "cached", src),
    )
    await asyncio.sleep(0.3)

    values, listed = repo.load_assumption_values(overrides)
    inputs = ScenarioInputs(**{k: values[k] for k in ScenarioInputs.model_fields})
    yield ("trace", ev("scenario", "compute", "Running deterministic impact model on editable assumptions", *_route("synthesize")))
    outputs = run_scenario(inputs)
    await asyncio.sleep(0.35)
    yield (
        "trace",
        ev(
            "scenario",
            "done",
            f"Economic impact ${outputs.economic_impact_usd / 1e9:.2f}B, {outputs.barrels_at_risk_per_day:,.0f} bbl/day at risk",
        ),
    )
    await asyncio.sleep(0.3)

    yield ("trace", ev("procurement", "retrieve", "Pulling candidate sources and routes from graph", *_route("rank")))
    options = score_options(repo.load_candidates(values["reroute_premium_usd"]))
    await asyncio.sleep(0.35)
    top = options[0]
    yield (
        "trace",
        ev("procurement", "done", f"Ranked {len(options)} reroutes, top: {top.source} {top.grade} (score {top.composite_score:.2f})"),
    )

    total_ms = int((time.monotonic() - start) * 1000)
    yield (
        "result",
        {
            "outputs": outputs.model_dump(),
            "ranking": {"options": [o.model_dump() for o in options]},
            "assumptions": listed,
            "risk": risk.model_dump(),
            "total_ms": total_ms,
        },
    )
