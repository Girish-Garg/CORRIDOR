from app.domain.types import RerouteOption
from app.domain.scoring import score_options


def _opt(name, price, tanker, grade, days):
    return RerouteOption(
        id=name, source=name, grade=name, route="Cape", avoids_label="avoids Hormuz",
        landed_price_usd_bbl=price, tanker_availability=tanker, grade_fit=grade,
        days_to_refinery=days, available_volume_bbl=1_000_000, composite_score=0.0,
    )


def test_cheaper_faster_fitter_ranks_first():
    weak = _opt("weak", price=95, tanker=0.5, grade=0.5, days=40)
    strong = _opt("strong", price=82, tanker=0.9, grade=0.9, days=18)
    ranked = score_options([weak, strong])
    assert ranked[0].source == "strong"


def test_scores_stay_in_unit_range():
    a = _opt("a", 82, 0.9, 0.9, 18)
    b = _opt("b", 95, 0.5, 0.5, 40)
    for o in score_options([a, b]):
        assert 0.0 <= o.composite_score <= 1.0


def test_single_option_scores_without_error():
    ranked = score_options([_opt("solo", 85, 0.7, 0.7, 25)])
    assert len(ranked) == 1
    assert 0.0 <= ranked[0].composite_score <= 1.0
