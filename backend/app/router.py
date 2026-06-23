import json
import urllib.request

from app.scopes import all_scopes, get_scope, DEFAULT

SIDECAR_URL = "http://host.docker.internal:8077/route"


def _prompt(text: str) -> str:
    options = "\n".join(f'- {s["id"]}: {s["title"]} ({", ".join(s["keywords"])})' for s in all_scopes())
    return (
        "You are a strict classifier for oil-supply-corridor disruption scenarios.\n"
        "Ignore any surrounding project or codebase context.\n"
        "Map the scenario to exactly one id from this list:\n"
        f"{options}\n"
        "- none: the scenario is not about a disruption to any corridor above\n\n"
        f"Scenario: {text}\n\n"
        "Reply with the single best id in lowercase, or `none` if nothing fits. "
        "Nothing else, no explanation."
    )


def _llm_route(text: str) -> str | None:
    try:
        body = json.dumps({"prompt": _prompt(text)}).encode()
        req = urllib.request.Request(
            SIDECAR_URL, data=body, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read())
        raw = (data.get("text") or "").strip().lower()
        ids = {s["id"] for s in all_scopes()} | {"none"}
        for token in raw.replace(",", " ").replace(".", " ").split():
            if token in ids:
                return token
        for sid in ids:
            if sid != "none" and sid in raw:
                return sid
    except Exception:
        return None
    return None


def _keyword_scores(text: str) -> dict[str, int]:
    t = text.lower()
    return {s["id"]: sum(1 for k in s["keywords"] if k in t) for s in all_scopes()}


def route_scenario(text: str) -> tuple[dict | None, str]:
    text = (text or "").strip()
    if not text:
        return get_scope(DEFAULT), "default"

    scores = _keyword_scores(text)
    kw_best = max(scores, key=scores.get)
    kw_hits = scores[kw_best]

    llm_id = _llm_route(text)
    if llm_id and llm_id != "none":
        # The CLI sometimes blurts a wrong first token then reconsiders. If the
        # model's pick has no keyword support while another scope clearly does,
        # trust the keywords instead.
        if kw_hits >= 1 and scores.get(llm_id, 0) == 0:
            return get_scope(kw_best), "keyword"
        return get_scope(llm_id), "claude"

    if kw_hits >= 1:
        return get_scope(kw_best), "keyword"

    # The model read the scenario and it fits no corridor, and no keyword
    # supports one either. Say so instead of forcing a wrong pick.
    if llm_id == "none":
        return None, "unmatched"

    # Sidecar unavailable and nothing matched: fall back to the default corridor
    # so a cold clone without the routing sidecar still returns a result.
    return get_scope(DEFAULT), "default"
