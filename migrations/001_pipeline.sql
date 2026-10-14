-- RMU intelligence storage. New isolated staging database; no existing data altered.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS rmu;
CREATE TABLE rmu.schema_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE rmu.workspaces(id uuid PRIMARY KEY, name text NOT NULL);
CREATE TABLE rmu.runs (
 workspace_id uuid NOT NULL REFERENCES rmu.workspaces(id), id uuid NOT NULL,
 idempotency_key text NOT NULL, request_hash text NOT NULL,
 source_type text NOT NULL CHECK(source_type IN ('synthetic','observed','permissioned_research')),
 provider text NOT NULL CHECK(provider IN ('x','fixture')), evidence_lane text NOT NULL CHECK(evidence_lane IN ('talent','organisation','audience','cause','ground_truth')),
 campaign jsonb NOT NULL, query text NOT NULL, starts_on date NOT NULL, ends_on date NOT NULL,
 status text NOT NULL CHECK(status IN ('planned','queued','running','complete','failed','needs_reconciliation')),
 budget_cents integer NOT NULL CHECK(budget_cents>=0 AND budget_cents<=5000),
 reserved_cents integer NOT NULL DEFAULT 0 CHECK(reserved_cents>=0), charged_cents integer NOT NULL DEFAULT 0 CHECK(charged_cents>=0),
 coverage jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,idempotency_key),
 CHECK(starts_on<=ends_on), CHECK(reserved_cents+charged_cents<=budget_cents),
 CHECK((source_type='synthetic' AND provider='fixture' AND budget_cents=0) OR (source_type='observed' AND provider='x'))
);
CREATE TABLE rmu.posts (
 workspace_id uuid NOT NULL REFERENCES rmu.workspaces(id), provider text NOT NULL, source_type text NOT NULL,
 post_id text NOT NULL, author_id text NOT NULL, created_at timestamptz NOT NULL,
 PRIMARY KEY(workspace_id,provider,source_type,post_id)
);
CREATE TABLE rmu.observations (
 workspace_id uuid NOT NULL, id uuid NOT NULL, provider text NOT NULL, source_type text NOT NULL, post_id text NOT NULL,
 retrieved_at timestamptz NOT NULL, content_hash text NOT NULL, text_content text, source_url text,
 language text, post_type text NOT NULL CHECK(post_type IN ('original','reply','quote','repost')),
 metrics jsonb NOT NULL, references_json jsonb NOT NULL DEFAULT '[]', rights_reference text NOT NULL,
 cohort text NOT NULL DEFAULT 'uncertain', cohort_evidence jsonb NOT NULL DEFAULT '{}',
 PRIMARY KEY(workspace_id,id),
 FOREIGN KEY(workspace_id,provider,source_type,post_id) REFERENCES rmu.posts(workspace_id,provider,source_type,post_id),
 UNIQUE(workspace_id,provider,source_type,post_id,retrieved_at,content_hash)
);
CREATE TABLE rmu.run_observations (
 workspace_id uuid NOT NULL,run_id uuid NOT NULL,observation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,run_id,observation_id),
 FOREIGN KEY(workspace_id,run_id) REFERENCES rmu.runs(workspace_id,id),
 FOREIGN KEY(workspace_id,observation_id) REFERENCES rmu.observations(workspace_id,id)
);
CREATE TABLE rmu.jobs (
 workspace_id uuid NOT NULL, id uuid NOT NULL, run_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('measure','collect_x')), state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','complete','failed','needs_reconciliation')),
 attempts integer NOT NULL DEFAULT 0, lease_until timestamptz, lease_token uuid, error_code text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,id), FOREIGN KEY(workspace_id,run_id) REFERENCES rmu.runs(workspace_id,id), UNIQUE(workspace_id,run_id,kind)
);
CREATE TABLE rmu.collection_pages (
 workspace_id uuid NOT NULL, id uuid NOT NULL,run_id uuid NOT NULL, request_key text NOT NULL,
 state text NOT NULL CHECK(state IN ('reserved','received','uncertain','reconciled')), reserved_cents integer NOT NULL CHECK(reserved_cents>0), charged_cents integer CHECK(charged_cents>=0 AND charged_cents<=reserved_cents),
 checkpoint jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,run_id,request_key), FOREIGN KEY(workspace_id,run_id) REFERENCES rmu.runs(workspace_id,id)
);
CREATE TABLE rmu.analyses (
 workspace_id uuid NOT NULL,id uuid NOT NULL,run_id uuid NOT NULL, metric_version text NOT NULL,
 input_hash text NOT NULL,result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,run_id) REFERENCES rmu.runs(workspace_id,id), UNIQUE(workspace_id,run_id,metric_version,input_hash)
);
CREATE TABLE rmu.classifications (
 workspace_id uuid NOT NULL,id uuid NOT NULL,observation_id uuid NOT NULL,codebook_version text NOT NULL,
 theme text NOT NULL,stance text NOT NULL CHECK(stance IN ('support','opposition','mixed','no_clear_position')),
 evidence_span text,provenance jsonb NOT NULL,review_state text NOT NULL DEFAULT 'pending' CHECK(review_state IN ('pending','approved','rejected')),
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,observation_id) REFERENCES rmu.observations(workspace_id,id)
);
CREATE TABLE rmu.findings (
 workspace_id uuid NOT NULL,id uuid NOT NULL,analysis_id uuid NOT NULL, panel text NOT NULL,
 content jsonb NOT NULL, prompt_hash text NOT NULL, model text NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','withdrawn')),
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,analysis_id) REFERENCES rmu.analyses(workspace_id,id)
);
CREATE TABLE rmu.finding_evidence (
 workspace_id uuid NOT NULL,finding_id uuid NOT NULL,observation_id uuid NOT NULL,
 relation text NOT NULL CHECK(relation IN ('supports','challenges')),
 PRIMARY KEY(workspace_id,finding_id,observation_id,relation),
 FOREIGN KEY(workspace_id,finding_id) REFERENCES rmu.findings(workspace_id,id),
 FOREIGN KEY(workspace_id,observation_id) REFERENCES rmu.observations(workspace_id,id)
);
CREATE TABLE rmu.review_events (
 workspace_id uuid NOT NULL,id uuid NOT NULL,finding_id uuid NOT NULL,reviewer text NOT NULL,decision text NOT NULL CHECK(decision IN ('approve','reject','withdraw')),note text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,finding_id) REFERENCES rmu.findings(workspace_id,id)
);
CREATE TABLE rmu.embeddings (
 workspace_id uuid NOT NULL,observation_id uuid NOT NULL,model text NOT NULL,embedding vector NOT NULL,
 PRIMARY KEY(workspace_id,observation_id,model),FOREIGN KEY(workspace_id,observation_id) REFERENCES rmu.observations(workspace_id,id)
);
CREATE TABLE rmu.deletion_register (
 workspace_id uuid NOT NULL,provider text NOT NULL,post_id text NOT NULL,source_type text NOT NULL,reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,provider,source_type,post_id)
);
CREATE INDEX jobs_ready ON rmu.jobs(workspace_id,state,created_at);
CREATE INDEX posts_date ON rmu.posts(workspace_id,created_at);
CREATE INDEX runs_recent ON rmu.runs(workspace_id,created_at DESC);
-- Application role receives no schema-changing rights and cannot bypass tenant policies.
DO $$ BEGIN
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='rmu_api') THEN CREATE ROLE rmu_api NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF;
END $$;
GRANT rmu_api TO rmu_owner;
GRANT USAGE ON SCHEMA rmu TO rmu_api;
GRANT SELECT ON rmu.schema_migrations TO rmu_api;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['workspaces','runs','posts','observations','run_observations','jobs','collection_pages','analyses','classifications','findings','finding_evidence','review_events','embeddings','deletion_register'] LOOP
 EXECUTE format('ALTER TABLE rmu.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE rmu.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY tenant_isolation ON rmu.%I TO rmu_api USING (%I = nullif(current_setting(''rmu.workspace_id'',true),'''')::uuid) WITH CHECK (%I = nullif(current_setting(''rmu.workspace_id'',true),'''')::uuid)',t,CASE WHEN t='workspaces' THEN 'id' ELSE 'workspace_id' END,CASE WHEN t='workspaces' THEN 'id' ELSE 'workspace_id' END);
 EXECUTE format('GRANT SELECT, INSERT, UPDATE ON rmu.%I TO rmu_api',t);
 END LOOP;
END $$;
INSERT INTO rmu.workspaces(id,name) VALUES('de000000-0000-4000-8000-000000000001','Re-Model Intelligence demo');
INSERT INTO rmu.schema_migrations(version) VALUES(1);
