from app.db import get_conn
from app.domain.types import RerouteOption
from app.domain.trace import SignalRef


def load_assumption_values(overrides: dict[str, float]) -> tuple[dict, list[dict]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT name, value, unit, source, rationale FROM assumptions")
        rows = cur.fetchall()
    values, listed = {}, []
    for name, value, unit, source, rationale in rows:
        v = overrides.get(name, value)
        values[name] = v
        listed.append({"name": name, "value": v, "unit": unit, "source": source, "rationale": rationale})
    return values, listed


def load_candidates(reroute_premium: float) -> list[RerouteOption]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, source, grade, route, avoids_hormuz, source_price_usd_bbl, freight_usd_bbl, tanker_availability, grade_fit, days_to_refinery, available_volume_bbl, source_doc_id FROM reroute_candidates"
        )
        rows = cur.fetchall()
    out = []
    for r in rows:
        out.append(
            RerouteOption(
                id=r[0], source=r[1], grade=r[2], route=r[3], avoids_hormuz=r[4],
                landed_price_usd_bbl=r[5] + r[6] + reroute_premium,
                tanker_availability=r[7], grade_fit=r[8], days_to_refinery=r[9],
                available_volume_bbl=r[10], composite_score=0.0, source_doc_id=r[11],
            )
        )
    return out


def retrieve_signals(buckets: list[str], limit: int = 8) -> list[SignalRef]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT occurred_at, headline, severity, bucket, source_doc_id FROM signals WHERE bucket = ANY(%s) ORDER BY occurred_at DESC LIMIT %s",
            (buckets, limit),
        )
        rows = cur.fetchall()
    return [
        SignalRef(occurred_at=str(r[0]), headline=r[1], severity=r[2], bucket=r[3], source_doc_id=r[4])
        for r in rows
    ]


def retrieve_docs(bucket: str, limit: int = 5) -> list[dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, title, url FROM documents WHERE bucket = %s LIMIT %s", (bucket, limit))
        rows = cur.fetchall()
    return [{"id": r[0], "title": r[1], "url": r[2]} for r in rows]
