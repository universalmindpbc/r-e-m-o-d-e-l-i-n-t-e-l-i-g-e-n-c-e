-- Dedicated campaign research records; existing campaign and network ledgers are untouched.
CREATE TABLE IF NOT EXISTS lab_research_jobs (
 id TEXT PRIMARY KEY, campaign TEXT NOT NULL DEFAULT 'no-more-violence',
 question TEXT NOT NULL, context TEXT NOT NULL, status TEXT NOT NULL,
 provider_id TEXT, result TEXT, error TEXT, created_at TEXT NOT NULL,
 visitor_hash TEXT NOT NULL, day TEXT NOT NULL, model TEXT NOT NULL,
 usage_json TEXT, searched INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS lab_research_day ON lab_research_jobs(day,visitor_hash);
