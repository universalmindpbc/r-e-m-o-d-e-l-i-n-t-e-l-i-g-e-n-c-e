CREATE TABLE IF NOT EXISTS network_review_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 campaign_identity TEXT NOT NULL,
 revision TEXT NOT NULL,
 candidate_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('approved','revise','rejected','pending')),
 reviewer TEXT NOT NULL,
 note TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS network_review_lookup ON network_review_events(campaign_identity,revision,candidate_id,id);
