SCOPES = {
    "hormuz": {
        "id": "hormuz",
        "title": "Strait of Hormuz, full closure",
        "corridor": "Strait of Hormuz",
        "dependency": 0.42,
        "buckets": ["geopolitics", "shipping", "policy", "commodities"],
        "keywords": ["hormuz", "iran", "gulf", "strait"],
    },
    "redsea": {
        "id": "redsea",
        "title": "Red Sea and Bab-el-Mandeb disruption",
        "corridor": "Bab-el-Mandeb",
        "dependency": 0.12,
        "buckets": ["shipping", "geopolitics", "commodities"],
        "keywords": ["red sea", "houthi", "bab", "suez", "yemen"],
    },
    "russia": {
        "id": "russia",
        "title": "Sanctions tighten on Russian crude",
        "corridor": "Russian crude supply",
        "dependency": 0.35,
        "buckets": ["policy", "commodities", "geopolitics"],
        "keywords": ["russia", "urals", "sanction", "shadow", "price cap"],
    },
}

DEFAULT = "hormuz"


def all_scopes() -> list[dict]:
    return list(SCOPES.values())


def get_scope(scope_id: str) -> dict:
    return SCOPES.get(scope_id, SCOPES[DEFAULT])
