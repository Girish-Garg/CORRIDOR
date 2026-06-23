"""Live disruption-signal ingestion.

Pulls recent oil supply-chain headlines from public feeds (GDELT plus a couple
of RSS feeds), classifies each into a bucket, scores a severity with a keyword
heuristic, and upserts them into the same `signals` and `documents` tables the
risk agent already reads from. The scenario pipeline is unchanged: it still just
retrieves scoped signals from the database. If every feed is unreachable the
seeded signals remain and the app shows a seeded feed instead of a live one.
"""

import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import httpx

from app.db import get_conn

GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
GDELT_QUERY = (
    '("strait of hormuz" OR houthi OR "red sea" OR opec OR "russian oil" '
    'OR "crude oil" OR "oil tanker" OR "oil sanctions") sourcelang:english'
)
RSS_FEEDS = [
    ("gcaptain", "https://gcaptain.com/feed/"),
    ("oilprice", "https://oilprice.com/rss/main"),
    ("hellenic", "https://www.hellenicshippingnews.com/feed/"),
    ("rigzone", "https://www.rigzone.com/news/rss/rigzone_latest.aspx"),
]

# Only keep headlines that look relevant to crude supply chains.
RELEVANT = (
    "oil", "crude", "brent", "wti", "tanker", "opec", "hormuz", "red sea",
    "houthi", "suez", "bab-el-mandeb", "refinery", "sanction", "pipeline",
    "gulf", "strait", "shipping", "freight", "urals", "embargo", "barrel",
    "petroleum", "lng",
)

# Severity heuristic. High words imply a hard supply break, medium words imply
# stress or threat, everything else is background.
HIGH = (
    "closure", "close", "blockade", "attack", "strike", "airstrike", "halt",
    "war", "missile", "seiz", "explosion", "blast", "shut", "drone", "sink",
)
MED = (
    "sanction", "disrupt", "threat", "divert", "premium", "surge", "spike",
    "jump", "cut", "tension", "escalat", "block", "ban", "embargo", "warn",
)

# Bucket heuristic, checked in priority order before the geopolitics default.
SHIPPING = ("tanker", "vessel", "ship", "port", "suez", "strait", "freight", "cargo", "convoy", "maritime", "navy")
POLICY = ("sanction", "embargo", "ban", "opec", "quota", "policy", "government", "price cap")
COMMOD = ("brent", "wti", "price", "barrel", "futures", "refinery", "refiner", "crude")


def _hash(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8", "ignore")).hexdigest()[:16]


def _relevant(title: str) -> bool:
    t = title.lower()
    return any(k in t for k in RELEVANT)


def _classify_bucket(title: str) -> str:
    t = title.lower()
    if any(k in t for k in SHIPPING):
        return "shipping"
    if any(k in t for k in POLICY):
        return "policy"
    if any(k in t for k in COMMOD):
        return "commodities"
    return "geopolitics"


def _score_severity(title: str, occurred: datetime) -> float:
    t = title.lower()
    if any(k in t for k in HIGH):
        base = 0.85
    elif any(k in t for k in MED):
        base = 0.6
    else:
        base = 0.4
    age_days = (datetime.now(timezone.utc) - occurred).days
    if age_days <= 2:
        base += 0.05
    return round(min(0.97, base), 2)


def _parse_gdelt_date(s: str) -> datetime:
    try:
        return datetime.strptime(s, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def _parse_rss_date(s) -> datetime:
    if not s:
        return datetime.now(timezone.utc)
    try:
        dt = parsedate_to_datetime(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def _fetch_gdelt(client: httpx.Client) -> list[dict]:
    r = client.get(
        GDELT_URL,
        params={
            "query": GDELT_QUERY, "mode": "ArtList", "format": "json",
            "maxrecords": 75, "timespan": "14d", "sort": "DateDesc",
        },
    )
    r.raise_for_status()
    out = []
    for a in r.json().get("articles", []):
        title = (a.get("title") or "").strip()
        url = a.get("url") or ""
        if title and url:
            out.append({"title": title, "url": url, "occurred": _parse_gdelt_date(a.get("seendate", ""))})
    return out


def _fetch_rss(client: httpx.Client, url: str) -> list[dict]:
    r = client.get(url)
    r.raise_for_status()
    root = ET.fromstring(r.content)
    out = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if title and link:
            out.append({"title": title, "url": link, "occurred": _parse_rss_date(item.findtext("pubDate"))})
    return out


def _store(rows: list[dict]) -> int:
    if not rows:
        return 0
    n = 0
    with get_conn() as conn, conn.cursor() as cur:
        for item in rows:
            h = _hash(item["url"] or item["title"])
            doc_id, sig_id = f"live-doc-{h}", f"live-{h}"
            bucket = _classify_bucket(item["title"])
            sev = _score_severity(item["title"], item["occurred"])
            title = item["title"][:300]
            cur.execute(
                "INSERT INTO documents (id, title, url, bucket, body) VALUES (%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING",
                (doc_id, title, item["url"], bucket, title),
            )
            cur.execute(
                "INSERT INTO signals (id, occurred_at, bucket, headline, severity, source_doc_id) "
                "VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING",
                (sig_id, item["occurred"].date().isoformat(), bucket, title, sev, doc_id),
            )
            n += 1
    return n


def refresh_live_signals() -> dict:
    raw: list[dict] = []
    errors: list[str] = []
    with httpx.Client(timeout=12.0, follow_redirects=True, headers={"User-Agent": "corridor/1.0"}) as client:
        try:
            raw += _fetch_gdelt(client)
        except Exception as e:
            errors.append(f"gdelt: {type(e).__name__}")
        for name, url in RSS_FEEDS:
            try:
                raw += _fetch_rss(client, url)
            except Exception as e:
                errors.append(f"{name}: {type(e).__name__}")

    seen, rows = set(), []
    for item in raw:
        if not _relevant(item["title"]):
            continue
        key = _hash(item["url"] or item["title"])
        if key in seen:
            continue
        seen.add(key)
        rows.append(item)

    stored = _store(rows)
    _set_meta("last_fetch", datetime.now(timezone.utc).isoformat())
    return {"fetched": len(raw), "kept": len(rows), "stored": stored, "errors": errors}


def _set_meta(key: str, value: str) -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO ingest_meta (key, value, updated_at) VALUES (%s,%s, now()) "
            "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()",
            (key, value),
        )


def _get_meta(key: str) -> str | None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT value FROM ingest_meta WHERE key = %s", (key,))
        row = cur.fetchone()
    return row[0] if row else None


def live_status() -> dict:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*), max(occurred_at) FROM signals WHERE id LIKE 'live-%%'")
        cnt, latest = cur.fetchone()
    return {
        "live": (cnt or 0) > 0,
        "live_count": cnt or 0,
        "latest_signal": str(latest) if latest else None,
        "last_fetch": _get_meta("last_fetch"),
        "sources": ["gdelt"] + [name for name, _ in RSS_FEEDS],
    }
