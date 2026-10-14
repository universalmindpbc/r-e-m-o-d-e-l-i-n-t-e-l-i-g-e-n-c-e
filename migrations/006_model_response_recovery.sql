-- Keep paid responses recoverable independently of ephemeral API hosting.
-- Both columns inherit the existing tenant row-level security policy.
ALTER TABLE rmu.model_requests ADD COLUMN response_payload jsonb;
ALTER TABLE rmu.model_requests ADD COLUMN resolution jsonb;
INSERT INTO rmu.schema_migrations(version) VALUES(6);
