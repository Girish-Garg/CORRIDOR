# CORRIDOR Block A: Foundation and Scenario Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the one-command stack and a real, tested scenario engine so a user can trigger a Hormuz closure and see ranked reroutes end to end.

**Architecture:** A single FastAPI backend holds a pure-Python scenario engine and reroute scorer (no model involved, deterministic math). Postgres holds seed data (assumptions, reroute candidates, source documents). A thin React screen triggers a run and renders the result. Everything starts with one Docker Compose command.

**Tech Stack:** Python 3.11, FastAPI, Pydantic v2, psycopg 3, Postgres 16 with pgvector, MinIO, React 18 with Vite and TypeScript, Tailwind, shadcn/ui, Docker Compose.

## Global Constraints

These apply to every task. Copied from the spec.

- 300 lines per file, hard cap. Split by responsibility.
- Stack locked: React, FastAPI, Pydantic AI (later blocks), Postgres plus pgvector, MinIO (env-switchable to R2), Docker Compose, one-command cold start.
- Deterministic math: the model never invents a number. The scenario and scoring math is pure Python with explicit formulas.
- Cold run: the canonical path runs from committed seed data, offline, with no required API keys.
- No AI traces in any output: no em dashes, no AI-tell phrasing, no `Co-Authored-By` or generated-by trailers in commits or PRs.
- UI is built from shadcn/ui primitives. The no-slop skill is invoked when generating UI.
- Commit at task checkpoints (one substantial unit), not after every small edit.

## File Structure

```
ET/
  docker-compose.yml          # db, minio, backend, frontend
  .env.example                # env vars, switchable db/storage targets
  backend/
    Dockerfile
    requirements.txt
    app/
      main.py                 # FastAPI app, startup init, router include
      config.py               # settings from env
      db.py                   # psycopg connection helper
      init_db.py              # run schema.sql, load seed.json
      schema.sql              # tables: documents, assumptions, reroute_candidates
      domain/
        types.py              # Pydantic types shared across blocks
        scenario.py           # pure scenario math
        scoring.py            # pure reroute scoring
      api/
        scenario_routes.py    # POST /scenario/run
      seed/
        seed.json             # assumptions, candidates, documents
    tests/
      test_scenario.py
      test_scoring.py
  frontend/
    Dockerfile
    package.json
    index.html
    tailwind.config.js
    src/
      main.tsx
      App.tsx
      lib/api.ts              # typed fetch wrapper
      components/ScenarioPanel.tsx
      components/RerouteCards.tsx
```

---

### Task 1: Project scaffolding and Docker Compose

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `backend/Dockerfile`, `backend/requirements.txt`, `backend/app/main.py`, `backend/app/config.py`, `frontend/Dockerfile`

**Interfaces:**
- Consumes: nothing.
- Produces: a running stack. Backend serves `GET /health` returning `{"status": "ok"}` on port 8000. Postgres on 5432, MinIO on 9000.

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
psycopg[binary]==3.2.1
pydantic==2.9.2
pydantic-settings==2.5.2
pytest==8.3.3
httpx==0.27.2
```

- [ ] **Step 2: Create `backend/app/config.py`**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://corridor:corridor@db:5432/corridor"
    storage_endpoint: str = "minio:9000"
    storage_key: str = "corridor"
    storage_secret: str = "corridorminio"

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 3: Create `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CORRIDOR")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 5: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

- [ ] **Step 6: Create `.env.example`**

```
DATABASE_URL=postgresql://corridor:corridor@db:5432/corridor
STORAGE_ENDPOINT=minio:9000
STORAGE_KEY=corridor
STORAGE_SECRET=corridorminio
```

- [ ] **Step 7: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: corridor
      POSTGRES_PASSWORD: corridor
      POSTGRES_DB: corridor
    ports: ["5432:5432"]
    volumes: ["dbdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U corridor"]
      interval: 5s
      timeout: 3s
      retries: 10
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: corridor
      MINIO_ROOT_PASSWORD: corridorminio
    ports: ["9000:9000", "9001:9001"]
    volumes: ["miniodata:/data"]
  backend:
    build: ./backend
    env_file: .env
    depends_on:
      db: { condition: service_healthy }
    ports: ["8000:8000"]
    volumes: ["./backend:/app"]
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    volumes: ["./frontend:/app", "/app/node_modules"]
volumes:
  dbdata:
  miniodata:
```

- [ ] **Step 8: Verify backend boots**

The frontend image needs Task 6 files to build. For now verify the backend path only.
Run: `cp .env.example .env && docker compose up -d db minio backend`
Then: `curl http://localhost:8000/health`
Expected: `{"status":"ok"}`

- [ ] **Step 9: Commit**

```bash
git add docker-compose.yml .env.example backend
git commit -m "Scaffold backend service and compose stack"
```

---

### Task 2: Database schema and seed loader

**Files:**
- Create: `backend/app/schema.sql`, `backend/app/db.py`, `backend/app/init_db.py`, `backend/app/seed/seed.json`
- Modify: `backend/app/main.py` (call init on startup)

**Interfaces:**
- Consumes: `settings.database_url` from Task 1.
- Produces: `get_conn()` returning a psycopg connection. Three tables loaded with seed: `documents(id, title, url, bucket, fetched_at, body)`, `assumptions(name, value, unit, source, rationale)`, `reroute_candidates(id, source, grade, route, avoids_hormuz, source_price_usd_bbl, freight_usd_bbl, tanker_availability, grade_fit, days_to_refinery, available_volume_bbl, source_doc_id)`.

- [ ] **Step 1: Create `backend/app/schema.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  bucket TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assumptions (
  name TEXT PRIMARY KEY,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  rationale TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reroute_candidates (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  grade TEXT NOT NULL,
  route TEXT NOT NULL,
  avoids_hormuz BOOLEAN NOT NULL,
  source_price_usd_bbl DOUBLE PRECISION NOT NULL,
  freight_usd_bbl DOUBLE PRECISION NOT NULL,
  tanker_availability DOUBLE PRECISION NOT NULL,
  grade_fit DOUBLE PRECISION NOT NULL,
  days_to_refinery DOUBLE PRECISION NOT NULL,
  available_volume_bbl DOUBLE PRECISION NOT NULL,
  source_doc_id TEXT REFERENCES documents(id)
);
```

- [ ] **Step 2: Create `backend/app/db.py`**

```python
import psycopg
from app.config import settings


def get_conn():
    return psycopg.connect(settings.database_url, autocommit=True)
```

- [ ] **Step 3: Create `backend/app/seed/seed.json`**

Values below are realistic starting defaults from public reporting. They are flagged for sourcing during execution (see Step 6). Crude assay and route figures are approximate.

```json
{
  "documents": [
    {"id": "doc-eia-india", "title": "India crude import overview", "url": "https://www.eia.gov/international/analysis/country/IND", "bucket": "commodities", "body": "India imports more than 88 percent of its crude oil. Daily crude imports are around 4.7 to 5.0 million barrels per day."},
    {"id": "doc-hormuz", "title": "Strait of Hormuz dependency", "url": "https://www.iea.org/about/oil-security-and-emergency-response/strait-of-hormuz", "bucket": "geopolitics", "body": "A large share of India crude transits the Strait of Hormuz. Estimates range from about 30 to 45 percent depending on source and date."}
  ],
  "assumptions": [
    {"name": "india_daily_imports_bbl", "value": 4700000, "unit": "bbl/day", "source": "doc-eia-india", "rationale": "India daily crude imports, public reporting"},
    {"name": "hormuz_dependency", "value": 0.42, "unit": "fraction", "source": "doc-hormuz", "rationale": "Share of India crude via Hormuz, debated 0.30 to 0.45"},
    {"name": "reserve_days", "value": 9.5, "unit": "days", "source": "doc-eia-india", "rationale": "Strategic reserve cover in days"},
    {"name": "baseline_brent_usd", "value": 80.0, "unit": "USD/bbl", "source": "doc-eia-india", "rationale": "Baseline Brent spot, refresh from live in later blocks"},
    {"name": "closure_severity", "value": 1.0, "unit": "fraction", "source": "user-set", "rationale": "Scenario knob, fraction of Hormuz flow blocked"},
    {"name": "closure_duration_days", "value": 30, "unit": "days", "source": "user-set", "rationale": "Scenario knob"},
    {"name": "risk_premium_per_pct_blocked", "value": 0.5, "unit": "USD/bbl per percent", "source": "user-set", "rationale": "Modeling knob, price premium per percent of Hormuz flow blocked"},
    {"name": "reroute_premium_usd", "value": 4.0, "unit": "USD/bbl", "source": "user-set", "rationale": "Modeling knob, spot and rerouting premium"}
  ],
  "reroute_candidates": [
    {"id": "c-urals-cape", "source": "Russia", "grade": "Urals", "route": "Baltic via Cape", "avoids_hormuz": true, "source_price_usd_bbl": 70.0, "freight_usd_bbl": 6.0, "tanker_availability": 0.7, "grade_fit": 0.9, "days_to_refinery": 30, "available_volume_bbl": 1200000, "source_doc_id": "doc-eia-india"},
    {"id": "c-wti-cape", "source": "USA", "grade": "WTI Midland", "route": "US Gulf via Cape", "avoids_hormuz": true, "source_price_usd_bbl": 82.0, "freight_usd_bbl": 9.0, "tanker_availability": 0.8, "grade_fit": 0.6, "days_to_refinery": 40, "available_volume_bbl": 900000, "source_doc_id": "doc-eia-india"},
    {"id": "c-bonny-cape", "source": "Nigeria", "grade": "Bonny Light", "route": "West Africa via Cape", "avoids_hormuz": true, "source_price_usd_bbl": 83.0, "freight_usd_bbl": 7.0, "tanker_availability": 0.6, "grade_fit": 0.65, "days_to_refinery": 28, "available_volume_bbl": 700000, "source_doc_id": "doc-eia-india"},
    {"id": "c-espo-pacific", "source": "Russia", "grade": "ESPO", "route": "Kozmino direct", "avoids_hormuz": true, "source_price_usd_bbl": 75.0, "freight_usd_bbl": 5.0, "tanker_availability": 0.65, "grade_fit": 0.75, "days_to_refinery": 16, "available_volume_bbl": 600000, "source_doc_id": "doc-eia-india"}
  ]
}
```

- [ ] **Step 4: Create `backend/app/init_db.py`**

```python
import json
from pathlib import Path
from app.db import get_conn

SCHEMA = Path(__file__).parent / "schema.sql"
SEED = Path(__file__).parent / "seed" / "seed.json"


def init_db():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(SCHEMA.read_text())
        data = json.loads(SEED.read_text())
        for d in data["documents"]:
            cur.execute(
                "INSERT INTO documents (id, title, url, bucket, body) VALUES (%(id)s, %(title)s, %(url)s, %(bucket)s, %(body)s) ON CONFLICT (id) DO NOTHING",
                d,
            )
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
```

- [ ] **Step 5: Wire init into `backend/app/main.py` startup**

Add to `main.py` after the `app` is created:

```python
from app.init_db import init_db


@app.on_event("startup")
def _startup():
    init_db()
```

- [ ] **Step 6: Verify seed loads, and confirm key numbers live**

Run: `docker compose restart backend && sleep 3 && docker compose exec db psql -U corridor -c "SELECT name, value FROM assumptions;"`
Expected: 8 assumption rows printed.
Then confirm the three core figures (india_daily_imports_bbl, hormuz_dependency, reserve_days) against a current public source using web search, and update `seed.json` values plus the document `url` and `body` if they differ. This is the main-session sourcing step.

- [ ] **Step 7: Commit**

```bash
git add backend/app/schema.sql backend/app/db.py backend/app/init_db.py backend/app/seed backend/app/main.py
git commit -m "Add database schema and seed loader"
```

---

### Task 3: Domain types and scenario engine (TDD)

**Files:**
- Create: `backend/app/domain/__init__.py`, `backend/app/domain/types.py`, `backend/app/domain/scenario.py`, `backend/tests/test_scenario.py`

**Interfaces:**
- Consumes: nothing (pure functions).
- Produces: `ScenarioInputs`, `ScenarioOutputs`, `RerouteOption`, `RerouteRanking` Pydantic models, and `run_scenario(inputs: ScenarioInputs) -> ScenarioOutputs`.

- [ ] **Step 1: Create `backend/app/domain/types.py`**

```python
from pydantic import BaseModel


class ScenarioInputs(BaseModel):
    india_daily_imports_bbl: float
    hormuz_dependency: float
    reserve_days: float
    baseline_brent_usd: float
    closure_severity: float
    closure_duration_days: float
    risk_premium_per_pct_blocked: float
    reroute_premium_usd: float


class ScenarioOutputs(BaseModel):
    barrels_at_risk_per_day: float
    reserve_cover_days: float
    price_impact_usd_bbl: float
    price_delta_usd_bbl: float
    economic_impact_usd: float


class RerouteOption(BaseModel):
    id: str
    source: str
    grade: str
    route: str
    avoids_hormuz: bool
    landed_price_usd_bbl: float
    tanker_availability: float
    grade_fit: float
    days_to_refinery: float
    available_volume_bbl: float
    composite_score: float
    source_doc_id: str | None = None


class RerouteRanking(BaseModel):
    options: list[RerouteOption]
```

- [ ] **Step 2: Write the failing tests `backend/tests/test_scenario.py`**

```python
import math
from app.domain.types import ScenarioInputs
from app.domain.scenario import (
    barrels_at_risk_per_day,
    reserve_cover_days,
    price_impact_usd_bbl,
    run_scenario,
)


def _inputs(**kw):
    base = dict(
        india_daily_imports_bbl=4_700_000,
        hormuz_dependency=0.42,
        reserve_days=9.5,
        baseline_brent_usd=80.0,
        closure_severity=1.0,
        closure_duration_days=30,
        risk_premium_per_pct_blocked=0.5,
        reroute_premium_usd=4.0,
    )
    base.update(kw)
    return ScenarioInputs(**base)


def test_barrels_at_risk_full_closure():
    assert barrels_at_risk_per_day(_inputs()) == 1_974_000


def test_reserve_cover_full_closure():
    assert math.isclose(reserve_cover_days(_inputs()), 9.5 / 0.42, rel_tol=1e-9)


def test_reserve_cover_no_closure_is_infinite():
    assert reserve_cover_days(_inputs(closure_severity=0.0)) == float("inf")


def test_price_impact_full_closure():
    assert math.isclose(price_impact_usd_bbl(_inputs()), 101.0, rel_tol=1e-9)


def test_economic_impact_positive_and_scales_with_duration():
    short = run_scenario(_inputs(closure_duration_days=10))
    long = run_scenario(_inputs(closure_duration_days=30))
    assert long.economic_impact_usd > short.economic_impact_usd > 0
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `docker compose exec backend pytest tests/test_scenario.py -v`
Expected: FAIL, `ModuleNotFoundError: app.domain.scenario`.

- [ ] **Step 4: Create `backend/app/domain/scenario.py`**

```python
from app.domain.types import ScenarioInputs, ScenarioOutputs


def barrels_at_risk_per_day(i: ScenarioInputs) -> float:
    return i.india_daily_imports_bbl * i.hormuz_dependency * i.closure_severity


def reserve_cover_days(i: ScenarioInputs) -> float:
    denom = i.hormuz_dependency * i.closure_severity
    if denom <= 0:
        return float("inf")
    return i.reserve_days / denom


def price_impact_usd_bbl(i: ScenarioInputs) -> float:
    pct_blocked = i.closure_severity * i.hormuz_dependency * 100.0
    return i.baseline_brent_usd + i.risk_premium_per_pct_blocked * pct_blocked


def run_scenario(i: ScenarioInputs) -> ScenarioOutputs:
    risk = barrels_at_risk_per_day(i)
    price = price_impact_usd_bbl(i)
    delta = price - i.baseline_brent_usd
    economic = risk * (delta + i.reroute_premium_usd) * i.closure_duration_days
    return ScenarioOutputs(
        barrels_at_risk_per_day=risk,
        reserve_cover_days=reserve_cover_days(i),
        price_impact_usd_bbl=price,
        price_delta_usd_bbl=delta,
        economic_impact_usd=economic,
    )
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `docker compose exec backend pytest tests/test_scenario.py -v`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add backend/app/domain backend/tests/test_scenario.py
git commit -m "Add scenario engine with tests"
```

---

### Task 4: Reroute scoring (TDD)

**Files:**
- Create: `backend/app/domain/scoring.py`, `backend/tests/test_scoring.py`

**Interfaces:**
- Consumes: `RerouteOption` from Task 3.
- Produces: `score_options(options: list[RerouteOption]) -> list[RerouteOption]`, sorted by `composite_score` descending, each score in 0 to 1.

- [ ] **Step 1: Write the failing tests `backend/tests/test_scoring.py`**

```python
from app.domain.types import RerouteOption
from app.domain.scoring import score_options


def _opt(name, price, tanker, grade, days):
    return RerouteOption(
        id=name, source=name, grade=name, route="Cape", avoids_hormuz=True,
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose exec backend pytest tests/test_scoring.py -v`
Expected: FAIL, `ModuleNotFoundError: app.domain.scoring`.

- [ ] **Step 3: Create `backend/app/domain/scoring.py`**

```python
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose exec backend pytest tests/test_scoring.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/domain/scoring.py backend/tests/test_scoring.py
git commit -m "Add reroute scoring with tests"
```

---

### Task 5: Scenario API endpoint

**Files:**
- Create: `backend/app/api/__init__.py`, `backend/app/api/scenario_routes.py`
- Modify: `backend/app/main.py` (include router)

**Interfaces:**
- Consumes: `get_conn` (Task 2), `ScenarioInputs`, `RerouteOption`, `run_scenario` (Task 3), `score_options` (Task 4).
- Produces: `POST /scenario/run`. Body: optional `{"overrides": {"hormuz_dependency": 0.3}}`. Response: `{"outputs": ScenarioOutputs, "ranking": {"options": [...]}, "assumptions": [...], "sources": [...]}`.

- [ ] **Step 1: Create `backend/app/api/scenario_routes.py`**

```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.db import get_conn
from app.domain.types import ScenarioInputs, RerouteOption
from app.domain.scenario import run_scenario
from app.domain.scoring import score_options

router = APIRouter()


class RunRequest(BaseModel):
    overrides: dict[str, float] = {}


def _load_assumptions(overrides: dict[str, float]) -> tuple[dict, list[dict]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT name, value, unit, source, rationale FROM assumptions")
        rows = cur.fetchall()
    values, listed = {}, []
    for name, value, unit, source, rationale in rows:
        v = overrides.get(name, value)
        values[name] = v
        listed.append({"name": name, "value": v, "unit": unit, "source": source, "rationale": rationale})
    return values, listed


def _load_candidates(reroute_premium: float) -> list[RerouteOption]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, source, grade, route, avoids_hormuz, source_price_usd_bbl, freight_usd_bbl, tanker_availability, grade_fit, days_to_refinery, available_volume_bbl, source_doc_id FROM reroute_candidates"
        )
        rows = cur.fetchall()
    options = []
    for r in rows:
        options.append(RerouteOption(
            id=r[0], source=r[1], grade=r[2], route=r[3], avoids_hormuz=r[4],
            landed_price_usd_bbl=r[5] + r[6] + reroute_premium,
            tanker_availability=r[7], grade_fit=r[8], days_to_refinery=r[9],
            available_volume_bbl=r[10], composite_score=0.0, source_doc_id=r[11],
        ))
    return options


@router.post("/scenario/run")
def run(req: RunRequest):
    values, listed = _load_assumptions(req.overrides)
    inputs = ScenarioInputs(**{k: values[k] for k in ScenarioInputs.model_fields})
    outputs = run_scenario(inputs)
    options = score_options(_load_candidates(values["reroute_premium_usd"]))
    return {
        "outputs": outputs.model_dump(),
        "ranking": {"options": [o.model_dump() for o in options]},
        "assumptions": listed,
    }
```

- [ ] **Step 2: Include the router in `backend/app/main.py`**

Add:

```python
from app.api.scenario_routes import router as scenario_router

app.include_router(scenario_router)
```

- [ ] **Step 3: Verify the endpoint end to end**

Run: `curl -s -X POST http://localhost:8000/scenario/run -H "Content-Type: application/json" -d '{"overrides":{}}'`
Expected: JSON with `outputs.barrels_at_risk_per_day` near 1974000 and a `ranking.options` array sorted by `composite_score`.
Run with an override: `curl -s -X POST http://localhost:8000/scenario/run -H "Content-Type: application/json" -d '{"overrides":{"hormuz_dependency":0.3}}'`
Expected: `barrels_at_risk_per_day` drops to about 1410000.

- [ ] **Step 4: Commit**

```bash
git add backend/app/api backend/app/main.py
git commit -m "Add scenario run endpoint"
```

---

### Task 6: Frontend thin screen

**Files:**
- Create: `frontend/package.json`, `frontend/index.html`, `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/src/lib/api.ts`, `frontend/src/App.tsx`, `frontend/src/components/ScenarioPanel.tsx`, `frontend/src/components/RerouteCards.tsx`

**Interfaces:**
- Consumes: `POST /scenario/run` from Task 5.
- Produces: a screen with a trigger button that renders scenario outputs and ranked reroute cards.

- [ ] **Step 1: Scaffold the Vite app**

Run from the repo root:
```bash
docker run --rm -v "$PWD/frontend":/out -w /out node:20-slim sh -c "npm create vite@latest . -- --template react-ts && npm install && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p"
```
This generates `package.json`, `index.html`, `src/main.tsx`, and Tailwind config. Replace `vite` default files in the next steps.

- [ ] **Step 2: Configure Tailwind in `frontend/tailwind.config.js`**

```javascript
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 3: Set `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Set a deliberate non-default font stack here (not Inter, Geist, or Space Grotesk) when the no-slop pass runs in Block D. A system stack is fine for Block A.

- [ ] **Step 4: Create `frontend/src/lib/api.ts`**

```typescript
export type ScenarioOutputs = {
  barrels_at_risk_per_day: number
  reserve_cover_days: number
  price_impact_usd_bbl: number
  price_delta_usd_bbl: number
  economic_impact_usd: number
}

export type RerouteOption = {
  id: string
  source: string
  grade: string
  route: string
  landed_price_usd_bbl: number
  days_to_refinery: number
  composite_score: number
}

export type RunResult = {
  outputs: ScenarioOutputs
  ranking: { options: RerouteOption[] }
}

export async function runScenario(overrides: Record<string, number> = {}): Promise<RunResult> {
  const res = await fetch("http://localhost:8000/scenario/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
  })
  if (!res.ok) throw new Error("scenario run failed")
  return res.json()
}
```

- [ ] **Step 5: Create `frontend/src/components/RerouteCards.tsx`**

```tsx
import { RerouteOption } from "../lib/api"

export function RerouteCards({ options }: { options: RerouteOption[] }) {
  return (
    <div className="grid gap-3">
      {options.map((o, idx) => (
        <div key={o.id} className="rounded-lg border p-4">
          <div className="flex justify-between">
            <span className="font-semibold">#{idx + 1} {o.source} {o.grade}</span>
            <span>score {o.composite_score.toFixed(2)}</span>
          </div>
          <div className="text-sm opacity-80">
            {o.route} | landed ${o.landed_price_usd_bbl.toFixed(1)}/bbl | {o.days_to_refinery} days
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Create `frontend/src/components/ScenarioPanel.tsx`**

```tsx
import { ScenarioOutputs } from "../lib/api"

export function ScenarioPanel({ o }: { o: ScenarioOutputs }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Metric label="Barrels at risk per day" value={Math.round(o.barrels_at_risk_per_day).toLocaleString()} />
      <Metric label="Reserve cover for the gap" value={`${o.reserve_cover_days.toFixed(1)} days`} />
      <Metric label="Price impact" value={`$${o.price_impact_usd_bbl.toFixed(1)}/bbl`} />
      <Metric label="Extra procurement cost" value={`$${(o.economic_impact_usd / 1e9).toFixed(2)}B`} />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase opacity-60">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
```

- [ ] **Step 7: Create `frontend/src/App.tsx`**

```tsx
import { useState } from "react"
import { runScenario, RunResult } from "./lib/api"
import { ScenarioPanel } from "./components/ScenarioPanel"
import { RerouteCards } from "./components/RerouteCards"

export default function App() {
  const [result, setResult] = useState<RunResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function trigger() {
    setLoading(true)
    try {
      setResult(await runScenario())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">CORRIDOR</h1>
      <button onClick={trigger} disabled={loading} className="rounded-md border px-4 py-2">
        {loading ? "Running" : "Trigger Hormuz closure"}
      </button>
      {result && (
        <div className="space-y-6">
          <ScenarioPanel o={result.outputs} />
          <RerouteCards options={result.ranking.options} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Verify the full path in the browser**

Run: `docker compose up -d --build frontend`
Open `http://localhost:5173`, click "Trigger Hormuz closure".
Expected: four metric tiles and four ranked reroute cards appear, best score first.

- [ ] **Step 9: Commit**

```bash
git add frontend
git commit -m "Add thin scenario trigger screen"
```

---

## Self-Review

**Spec coverage (Block A scope):** one-command stack (Task 1), Postgres seed with source-linked documents (Task 2), deterministic scenario math with explicit editable assumptions (Task 3), reroute scoring on price, tanker, grade fit, and speed (Task 4), an end-to-end run endpoint with assumption overrides (Task 5), and a thin trigger screen (Task 6). This delivers the Block A goal: trigger to ranked reroutes end to end. Buckets, embeddings, the graph, agents, streaming, the map, sliders, and replay are correctly deferred to Blocks B and C per the spec build order.

**Placeholder scan:** seed values are real starting defaults with a live-sourcing step (Task 2 Step 6), not TBDs. Test code and implementation code are complete. The one rough spot, the last scenario test assertion, is fixed inline in Task 3 Step 5.

**Type consistency:** `RerouteOption` fields are defined once in Task 3 `types.py` and consumed unchanged in Tasks 4, 5, and the frontend `api.ts` mirror. `ScenarioInputs` field names match the assumption names in `seed.json`, which is what lets Task 5 build inputs by name. `run_scenario`, `score_options`, and `runScenario` names are consistent across tasks.

## Notes for later blocks

- Block B introduces `chunks` with pgvector embeddings, the bucket router, the model-based reader with cache and replay, the three agents, SSE streaming, the `trace_events` table, and the live timer. Reroute candidates move from a seed table to graph-derived.
- Block C adds the Leaflet map, the assumption sliders with sensitivity, and the historical replay.
- Block D is the no-slop UI pass, the video, and the cold-run README.
