CREATE TABLE IF NOT EXISTS connector_preferences (id INTEGER PRIMARY KEY CHECK(id=1),settings TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO connector_preferences (id,settings,version) VALUES (1,'{"selected":["x"]}',0);
