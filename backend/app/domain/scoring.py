from app.domain.types import RerouteOption

WEIGHTS = {"price": 0.40, "tanker": 0.20, "grade": 0.25, "speed": 0.15}


def _normalized(value: float, best: float, worst: float) -> float:
    if worst == best:
        return 1.0
    return 1.0 - (value - best) / (worst - best)


def score_options(options: list[RerouteOption]) -> list[RerouteOption]:
    prices = [o.landed_price_usd_bbl for o in options]
    days = [o.days_to_refinery for o in options]
    cheapest, dearest = min(prices), max(prices)
    fastest, slowest = min(days), max(days)
    for o in options:
        price_score = _normalized(o.landed_price_usd_bbl, cheapest, dearest)
        speed_score = _normalized(o.days_to_refinery, fastest, slowest)
        o.composite_score = round(
            WEIGHTS["price"] * price_score
            + WEIGHTS["tanker"] * o.tanker_availability
            + WEIGHTS["grade"] * o.grade_fit
            + WEIGHTS["speed"] * speed_score,
            4,
        )
    return sorted(options, key=lambda o: o.composite_score, reverse=True)
