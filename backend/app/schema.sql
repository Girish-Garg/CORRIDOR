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

DROP TABLE IF EXISTS reroute_candidates;
CREATE TABLE reroute_candidates (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  source TEXT NOT NULL,
  grade TEXT NOT NULL,
  route TEXT NOT NULL,
  avoids_label TEXT NOT NULL,
  source_price_usd_bbl DOUBLE PRECISION NOT NULL,
  freight_usd_bbl DOUBLE PRECISION NOT NULL,
  tanker_availability DOUBLE PRECISION NOT NULL,
  grade_fit DOUBLE PRECISION NOT NULL,
  days_to_refinery DOUBLE PRECISION NOT NULL,
  available_volume_bbl DOUBLE PRECISION NOT NULL,
  source_doc_id TEXT REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  occurred_at DATE NOT NULL,
  bucket TEXT NOT NULL,
  headline TEXT NOT NULL,
  severity DOUBLE PRECISION NOT NULL,
  source_doc_id TEXT REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS ingest_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
