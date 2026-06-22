# CORRIDOR: Design Spec

Date: 2026-06-22
Project: ET AI Hackathon 2026, Problem 2 (Energy Supply Chain Resilience)
Status: Approved design, ready for implementation planning

## One-line summary

CORRIDOR fuses public geopolitical, shipping, market, refinery, and sanctions data into one live picture, models oil disruption scenarios with explicit and editable assumptions, and produces ranked, executable crude procurement reroutes, with every number traceable to its source.

## Problem and goal

India imports about 88% of its crude oil, and roughly 40 to 45% of that transits the Strait of Hormuz, a single chokepoint. Strategic reserves cover only about 9.5 days. The warning data already exists in public but lives in disconnected systems, so nobody fuses it into a real-time picture before prices move.

Goal for this build: a working prototype that monitors disruption risk, simulates a Hormuz closure with testable assumptions, and returns ranked reroute recommendations, end to end, with full traceability. The build window is about 24 hours, solo.

## What we are building (the vertical slice)

One scenario, driven end to end through all the layers, deep where it earns marks and seeded where it does not: Strait of Hormuz closure, and its effect on Indian crude procurement.

The demo has two beats:
1. Replay a real past crisis to show the system would have flagged it days before prices moved (lead time and accuracy).
2. Trigger a live forward Hormuz closure scenario, watch the agents run, the map and data update, and a ranked set of executable reroutes appear, with a signal-to-recommendation timer running.

## Scope: real vs seeded depth map

| Layer | What is genuinely real | Depth | Seeded or cached |
|---|---|---|---|
| Auto-extraction | One reader turns raw text into typed records (validate, dedup, timestamp, source link). One live web pull on demand. | Medium | ~30 to 50 committed real source docs. Cached extraction for cold runs. |
| Multi-bucket retrieval | 5 topic stores (geopolitics, shipping, commodities, refinery, policy) plus a router that picks the store. Source link on every chunk. | Medium | Corpus is a curated seed, not a live firehose. |
| Knowledge graph | Nodes and edges in Postgres, every node links to its source doc. Affected part lights up during the scenario. | Medium | Hormuz modeled deeply. Other corridors are lighter nodes. |
| Agent orchestration | Planner plus a 3-agent chain (risk score, scenario sim, procurement rank), sharing graph and retrieval, streaming each step live. | High | None. Core depth. |
| Multi-LLM router | Provider abstraction with per-task routing and cost shown. | Real architecture | Cached responses for cold runs. Live dispatch in live mode. |
| Glass-box UI | Provenance, map, graph, disruption dashboard, replay timeline, editable assumption controls, executable reroute cards, full trace drawer. | High | None. The star. |

Two anchors we refuse to fake: the scenario math is real and editable, and one data source pulls genuinely live on demand. Everything else is honestly labeled as seeded or cached in the UI.

## Architecture overview

- Frontend: React plus Tailwind plus shadcn/ui. A single console with separate panels.
- Backend: one FastAPI service. It serves the API and hosts the Pydantic AI agents. No separate Node server.
- Data: Postgres with the pgvector extension. It holds relational tables, the vector chunks for retrieval, and the graph as node and edge tables. No separate graph database.
- Object storage: MinIO (S3 compatible), env-switchable to Cloudflare R2. Holds raw source documents.
- Everything runs with one Docker Compose command, cold, with no required API keys.

Boundary rule for "judges run the repo": the canonical Hormuz path runs from committed seed data and cached model outputs, fully offline. Live API pulls and premium models are optional enhancements that turn on only if keys are present, and degrade gracefully if not.

## Data model (Postgres)

- `documents`: raw source, url, bucket, fetched_at.
- `chunks`: text, embedding (pgvector), document_id, bucket. Used for retrieval.
- `nodes`: id, type (Supplier, Corridor, Refinery, VesselClass, SanctionRegime, Event), name, attributes, source_doc_id.
- `edges`: source_node, target_node, relation (SUPPLIES, TRANSITS, BLOCKED_BY, SANCTIONED_BY, ALTERNATIVE_TO), source_doc_id.
- `assumptions`: name, value, unit, source_doc_id or "user-set", rationale.
- `runs`: id, trigger, t0, t_final, status.
- `trace_events`: run_id, step, agent, phase, provider, cached_or_live, sources, t_ms, payload.

Every node and edge carries a source doc id. That is the source-linked promise, enforced in the schema.

## Scenario engine (the heart)

Principle: the model never invents a number. Agents gather inputs, attach sources, and narrate. The math is plain Python with explicit formulas, so assumptions are testable instead of hand-waved.

Editable assumptions (each is either a sourced fact or a clearly labeled modeling knob):

| Name | Default (to be sourced in Block A) | Type |
|---|---|---|
| india_daily_imports | ~4.7M bbl/day | sourced fact |
| hormuz_dependency | ~0.42 | sourced fact |
| reserve_days | ~9.5 | sourced fact |
| baseline_brent | set from data | sourced fact |
| closure_severity | 0 to 1 | scenario knob |
| closure_duration_days | user set | scenario knob |
| risk_premium_per_pct_blocked | e.g. 0.5 USD/bbl per percent | modeling knob |
| reroute_premium | e.g. 3 to 5 USD/bbl | modeling knob |
| tanker_rate_multiplier | e.g. 1.5x | modeling knob |

Outputs, each traceable to its formula:
- Barrels at risk per day = india_daily_imports * hormuz_dependency * closure_severity
- Reserve cover for the gap (days) = reserve_days / (hormuz_dependency * closure_severity)
- Price impact = baseline_brent + risk_premium_per_pct_blocked * (closure_severity * hormuz_dependency * 100)
- Economic impact = barrels_rerouted_per_day * (price_delta + reroute_premium) * duration_days

Falsifiability loop: edit any assumption, the engine re-runs, and the trace shows which assumptions moved the outcome and by how much (a simple sensitivity readout). This is the judge probing the model live.

## Procurement reroute ranking

Candidate (source, route) pairs come from the graph (for example Urals via Cape, WTI via Cape, Nigerian via Cape, Saudi via Red Sea or SUMED if open). Each option is scored on weighted factors:

1. Landed price = source_price + freight(route) + reroute_premium
2. Tanker availability (0 to 1 per route)
3. Refinery grade fit (API gravity and sulfur match against the Indian refinery slate)
4. Days to refinery (delivery lead time)
5. Available volume

Output: a ranked list. Each row opens to show its sub-scores, the exact assumptions used, and source links. The extra fields (days to refinery, available volume) make the recommendation executable, not just ranked.

## Agents, orchestration, streaming, timing

The orchestrator is a thin Python coordinator with two calls: `run_agent(task)` for one job and `run_chain([...])` for a workflow. Small UI actions fire single agents; the Hormuz trigger fires the chain.

The Hormuz chain, three agents sharing one run context (graph handle, retriever, assumption set, append-only trace):
1. Risk-scoring agent: reads recent signals from the geo, shipping, and policy stores plus the graph, updates the disruption score per corridor and supplier. Returns `RiskAssessment`.
2. Scenario-simulation agent: takes assumptions, calls the deterministic scenario engine, attaches sources, narrates. Returns `ScenarioResult`.
3. Procurement-ranking agent: pulls candidate pairs from the graph, calls the deterministic ranking function, narrates, links sources. Returns `RerouteRanking`.

Streaming: FastAPI streams over Server-Sent Events (no websocket infra, runs cold). Each agent emits structured trace events (step, agent, phase, provider, cached or live, sources, elapsed ms). The React console renders agents appearing live, the store each is querying, the provider and cost badge, the sources pulled, and the result. Every event is persisted to `trace_events`, so any past recommendation replays its exact trace.

Timing: the orchestrator stamps t0 on trigger and t_final on the final ranking, streams elapsed time, and the UI shows a live counter ending on "X.X s end to end".

Error handling: every external call (model or live fetch) gets a timeout, one retry, then graceful fallback to cached or seeded data, with an honest "degraded" badge in the trace. The chain always completes.

## Multi-LLM provider layer

A provider abstraction wraps local Ollama, Claude CLI, and Gemini CLI behind one interface, with a cache and replay layer. The canonical Hormuz path ships with its model responses cached and committed, so a cold clone runs the whole scenario instantly and offline. The trace honestly labels each step cached or live. In live mode the router dispatches per task: bulk classification to local Ollama, deep synthesis to Claude, long context to Gemini, with the routing and cost decision shown on screen.

## Extraction and ingestion (no scrapers)

No hand-written HTML parsers anywhere. Any source (a pasted bulletin, an RSS item, an API blob, a seeded document) goes through one model-based reader that returns typed Pydantic records, then validate, dedup (content hash plus similarity), timestamp, and source link. Cold mode replays seeded raw docs plus cached extractions. Live mode hands fetch-and-extract to a model with web access (Gemini grounding or Claude web search), so there is still not a single parser in the codebase.

## Frontend (glass-box console)

Built from shadcn/ui primitives, near-zero custom CSS. The no-slop skill is invoked when generating UI: a deliberate non-default typeface (not Inter, Geist, or Space Grotesk), a restrained palette (no purple to lavender gradient, no glassmorphism), real information density.

Panels, each its own file under the 300-line cap:
- Live agent stream plus the signal-to-recommendation timer
- Map (react-leaflet plus OpenStreetMap tiles, free and no key): chokepoint, blocked corridor, seeded vessel points, alternative routes as GeoJSON, each shape source-linked
- Disruption dashboard plus the replay timeline (recharts)
- Scenario modeller with editable assumption sliders and the sensitivity readout
- Executable reroute cards, each expandable to sub-scores, assumptions, and sources
- Connections view (the knowledge graph, react-flow), optional and first to cut
- Provenance drawer (how a given fact was collected and sourced)

## Evaluation criteria mapping

| Criterion | How CORRIDOR earns it |
|---|---|
| Signal lead time and accuracy | Historical replay of a real episode, score crossing threshold before the price spike |
| Alternative quality and executability | Reroute cards with grade, route, landed cost, tanker, days to refinery, available volume |
| Scenario model fidelity | Deterministic engine with explicit, editable, source-linked assumptions and sensitivity |
| Geospatial evidence depth | Map layer with corridor, vessels, and source-linked alternative routes |
| End-to-end response time | Instrumented signal-to-recommendation timer shown live |

## Engineering constraints and conventions

- Stack locked: React, FastAPI, Pydantic AI, Postgres plus pgvector, MinIO (env-switchable to R2), Docker Compose, one-command cold start.
- 300 lines per file, hard cap. Each agent, extractor schema, and UI panel is its own file.
- dev-principles: small single-purpose modules, typed boundaries (Pydantic), explicit error handling, DRY, KISS, YAGNI.
- no-slop: invoked for all UI and user-facing content.
- No AI traces in any output: no em dashes, no AI-tell phrasing, no co-author or generated-by trailers in commits or PRs.

## Build order and MVP cut line

Solo "24 hours" is about 16 to 18 hours of real work. Always keep a working demo.

- Block A, make it run end to end (~6h): one-command stack, small seed plus tables, the scenario math, one rough screen that returns a reroute. Demo exists.
- Block B, make it real and traceable (~6h): the 3 agents and the chain, live streaming with sources and timer, the reader with cached outputs, the main screen with agents and reroute cards. Core submission works.
- Block C, cover every scoring point (~4 to 5h): the map, the assumption sliders plus sensitivity, the historical replay. Connections view if time allows.
- Block D, polish and package (~3h): clean the look, record the video, write the cold-run README.

If behind: always keep Block D. Cut from the bottom of Block C first (connections view, then replay), then trim live mode to cached only. Never cut from A or B.

## Out of scope (future work)

- Live continuous ingestion at firehose scale.
- Many corridors and suppliers modeled deeply (only Hormuz is deep here).
- Real precision and recall evaluation of signal accuracy (the replay is illustrative).
- Cloud deployment and multi-tenant scaling (R2 and Neon are env switches left for later).

## Open items to confirm during Block A

- Source and confirm the assumption defaults (the three background researchers are gathering these now).
- Choose the exact historical episode for the replay based on data quality.
- Finalize the alternative crude grade and route table for the seed.
