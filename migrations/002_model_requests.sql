CREATE TABLE rmu.model_requests (
 workspace_id uuid NOT NULL, id uuid NOT NULL, run_id uuid NOT NULL,
 request_hash text NOT NULL, prompt_hash text NOT NULL, model text NOT NULL,
 state text NOT NULL CHECK(state IN ('reserved','received','validated','uncertain')),
 reserved_microusd bigint NOT NULL CHECK(reserved_microusd>0),
 response_id text, usage jsonb, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,request_hash),
 FOREIGN KEY(workspace_id,run_id) REFERENCES rmu.runs(workspace_id,id)
);
ALTER TABLE rmu.model_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rmu.model_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON rmu.model_requests TO rmu_api
 USING(workspace_id=nullif(current_setting('rmu.workspace_id',true),'')::uuid)
 WITH CHECK(workspace_id=nullif(current_setting('rmu.workspace_id',true),'')::uuid);
GRANT SELECT,INSERT,UPDATE ON rmu.model_requests TO rmu_api;
INSERT INTO rmu.schema_migrations(version) VALUES(2);
