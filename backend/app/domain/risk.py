from app.domain.trace import SignalRef, RiskAssessment


def compute_risk(corridor: str, signals: list[SignalRef], as_of: str) -> RiskAssessment:
    if not signals:
        score = 0.0
    else:
        sev = [s.severity for s in signals]
        score = round(min(1.0, 0.5 * max(sev) + 0.5 * (sum(sev) / len(sev))), 2)
    return RiskAssessment(corridor=corridor, score=score, signals=signals, as_of=as_of)
