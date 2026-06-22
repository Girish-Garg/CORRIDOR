from fastapi import APIRouter
from pydantic import BaseModel

from app import repo
from app.scopes import get_scope
from app.domain.types import ScenarioInputs
from app.domain.scenario import run_scenario
from app.domain.scoring import score_options

router = APIRouter()


class RunRequest(BaseModel):
    overrides: dict[str, float] = {}
    scope: str = "hormuz"


@router.post("/scenario/run")
def run(req: RunRequest):
    scope = get_scope(req.scope)
    values, listed = repo.load_assumption_values(req.overrides)
    if "hormuz_dependency" not in req.overrides:
        values["hormuz_dependency"] = scope["dependency"]
        for a in listed:
            if a["name"] == "hormuz_dependency":
                a["value"] = scope["dependency"]
    inputs = ScenarioInputs(**{k: values[k] for k in ScenarioInputs.model_fields})
    outputs = run_scenario(inputs)
    options = score_options(repo.load_candidates(values["reroute_premium_usd"], scope["id"]))
    return {
        "outputs": outputs.model_dump(),
        "ranking": {"options": [o.model_dump() for o in options]},
        "assumptions": listed,
    }
