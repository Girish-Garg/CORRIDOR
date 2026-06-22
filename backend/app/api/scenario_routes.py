from fastapi import APIRouter
from pydantic import BaseModel
from app.db import get_conn
from app.domain.types import ScenarioInputs, RerouteOption
from app.domain.scenario import run_scenario
from app.domain.scoring import score_options

router = APIRouter()


class RunRequest(BaseModel):
    overrides: dict[str, float] = {}


def _load_assumptions(overrides: dict[str, float]) -> tuple[dict, list[dict]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT name, value, unit, source, rationale FROM assumptions")
        rows = cur.fetchall()
    values, listed = {}, []
    for name, value, unit, source, rationale in rows:
        v = overrides.get(name, value)
        values[name] = v
        listed.append({"name": name, "value": v, "unit": unit, "source": source, "rationale": rationale})
    return values, listed


def _load_candidates(reroute_premium: float) -> list[RerouteOption]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, source, grade, route, avoids_hormuz, source_price_usd_bbl, freight_usd_bbl, tanker_availability, grade_fit, days_to_refinery, available_volume_bbl, source_doc_id FROM reroute_candidates"
        )
        rows = cur.fetchall()
    options = []
    for r in rows:
        options.append(RerouteOption(
            id=r[0], source=r[1], grade=r[2], route=r[3], avoids_hormuz=r[4],
            landed_price_usd_bbl=r[5] + r[6] + reroute_premium,
            tanker_availability=r[7], grade_fit=r[8], days_to_refinery=r[9],
            available_volume_bbl=r[10], composite_score=0.0, source_doc_id=r[11],
        ))
    return options


@router.post("/scenario/run")
def run(req: RunRequest):
    values, listed = _load_assumptions(req.overrides)
    inputs = ScenarioInputs(**{k: values[k] for k in ScenarioInputs.model_fields})
    outputs = run_scenario(inputs)
    options = score_options(_load_candidates(values["reroute_premium_usd"]))
    return {
        "outputs": outputs.model_dump(),
        "ranking": {"options": [o.model_dump() for o in options]},
        "assumptions": listed,
    }
