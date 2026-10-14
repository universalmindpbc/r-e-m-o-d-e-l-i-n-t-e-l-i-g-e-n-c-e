ALTER TABLE rmu.workflows ADD COLUMN codebook_version text NOT NULL DEFAULT 'campaign-evidence-v1';
INSERT INTO rmu.schema_migrations(version) VALUES(5);
