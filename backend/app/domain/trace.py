from pydantic import BaseModel
from typing import Literal


class TraceEvent(BaseModel):
    seq: int
    t_ms: int
    agent: Literal["orchestrator", "risk", "scenario", "procurement"]
    phase: Literal["start", "retrieve", "compute", "done"]
    message: str
    provider: str = "deterministic"
    mode: str = "cached"
    sources: list[str] = []


class SignalRef(BaseModel):
    occurred_at: str
    headline: str
    severity: float
    bucket: str
    source_doc_id: str | None = None


class RiskAssessment(BaseModel):
    corridor: str
    score: float
    signals: list[SignalRef]
    as_of: str
