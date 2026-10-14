CREATE TABLE rmu.workflows(workspace_id uuid NOT NULL,run_id uuid NOT NULL,state text NOT NULL,error text,lease_token uuid,lease_until timestamptz,updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,run_id),FOREIGN KEY(workspace_id,run_id) REFERENCES rmu.runs(workspace_id,id));
ALTER TABLE rmu.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE rmu.workflows FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON rmu.workflows TO rmu_api USING(workspace_id=nullif(current_setting('rmu.workspace_id',true),'')::uuid) WITH CHECK(workspace_id=nullif(current_setting('rmu.workspace_id',true),'')::uuid);
GRANT SELECT,INSERT,UPDATE ON rmu.workflows TO rmu_api;
INSERT INTO rmu.schema_migrations(version) VALUES(4);
