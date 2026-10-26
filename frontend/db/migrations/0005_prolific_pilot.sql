CREATE TABLE IF NOT EXISTS prolific_pilot_settings (
 id TEXT PRIMARY KEY,
 enabled INTEGER NOT NULL DEFAULT 0,
 study_id TEXT NOT NULL
);
INSERT OR IGNORE INTO prolific_pilot_settings (id, enabled, study_id)
VALUES ('rihanna-clf-us-2022-v1', 0, '6ad17e9c2c65332e2fca0684');
CREATE TABLE IF NOT EXISTS prolific_pilot_responses (
 study_id TEXT NOT NULL,
 participant_id TEXT NOT NULL,
 session_id TEXT NOT NULL,
 version TEXT NOT NULL,
 phase TEXT NOT NULL,
 answers TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 PRIMARY KEY (study_id, participant_id),
 UNIQUE (session_id)
);
CREATE INDEX IF NOT EXISTS prolific_pilot_expiry ON prolific_pilot_responses(created_at);
