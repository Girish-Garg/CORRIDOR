import json
from pathlib import Path
from app.db import get_conn

SCHEMA = Path(__file__).parent / "schema.sql"
SEED = Path(__file__).parent / "seed" / "seed.json"
SIGNALS = Path(__file__).parent / "seed" / "signals.json"
SIGNALS2 = Path(__file__).parent / "seed" / "signals2.json"


def _load_documents(cur, docs):
    for d in docs:
        cur.execute(
            "INSERT INTO documents (id, title, url, bucket, body) VALUES (%(id)s, %(title)s, %(url)s, %(bucket)s, %(body)s) ON CONFLICT (id) DO NOTHING",
            d,
        )


def _load_signals(cur, signals):
    for s in signals:
        cur.execute(
            "INSERT INTO signals (id, occurred_at, bucket, headline, severity, source_doc_id) VALUES (%(id)s, %(occurred_at)s, %(bucket)s, %(headline)s, %(severity)s, %(source_doc_id)s) ON CONFLICT (id) DO NOTHING",
            s,
        )


def init_db():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(SCHEMA.read_text())
        data = json.loads(SEED.read_text())
        _load_documents(cur, data["documents"])
        for a in data["assumptions"]:
            cur.execute(
                "INSERT INTO assumptions (name, value, unit, source, rationale) VALUES (%(name)s, %(value)s, %(unit)s, %(source)s, %(rationale)s) ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value",
                a,
            )
        for c in data["reroute_candidates"]:
            cur.execute(
                """INSERT INTO reroute_candidates
                (id, source, grade, route, avoids_hormuz, source_price_usd_bbl, freight_usd_bbl, tanker_availability, grade_fit, days_to_refinery, available_volume_bbl, source_doc_id)
                VALUES (%(id)s, %(source)s, %(grade)s, %(route)s, %(avoids_hormuz)s, %(source_price_usd_bbl)s, %(freight_usd_bbl)s, %(tanker_availability)s, %(grade_fit)s, %(days_to_refinery)s, %(available_volume_bbl)s, %(source_doc_id)s)
                ON CONFLICT (id) DO NOTHING""",
                c,
            )
        for path in (SIGNALS, SIGNALS2):
            payload = json.loads(path.read_text())
            _load_documents(cur, payload["documents"])
            _load_signals(cur, payload["signals"])
