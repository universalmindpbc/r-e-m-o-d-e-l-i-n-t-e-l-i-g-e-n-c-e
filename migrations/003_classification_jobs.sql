ALTER TABLE rmu.jobs DROP CONSTRAINT jobs_kind_check;
ALTER TABLE rmu.jobs ADD CONSTRAINT jobs_kind_check CHECK(kind IN ('measure','collect_x','classify'));
INSERT INTO rmu.schema_migrations(version) VALUES(3);
