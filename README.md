# Re-Model Intelligence: database and API

Python API on Render Free, PostgreSQL 17 with pgvector on Neon Free, both Singapore. The RMU website remains on its existing Cloudflare staging deployment. This repository contains the backend only; no credentials or collected posts belong in Git. The approved analytical instructions are versioned in this private repository.

## Implemented

- Authenticated server-to-server API, private environment-bound workspace, row-level tenant policies, a restricted runtime login and pooled database connections.
- Versioned SQL migration; immutable campaign snapshots, stable post IDs, retrieval observations, run/evidence links, jobs and coverage analyses.
- Idempotent run creation, deduplicated imports, sealed measurement inputs, atomic job claims and stored results.
- Source lanes and synthetic/observed separation; no invented alignment scores or audience conclusions.
- Bounded X archive page collector with conservative spend reservations, stored pagination checkpoints and no blind retry after uncertain outcomes. **Off by default.**
- Storage for future classifications, findings, supporting/challenging evidence, reviews and vectors. No embedding model/dimension index selected yet.

## API

All `/v1` routes require `Authorization: Bearer RMU_SERVICE_TOKEN`. The token maps to the one server-configured `RMU_WORKSPACE_ID`; clients cannot choose a workspace. This is an internal single-workspace demo, not a multi-client identity service.

| Method | Path | Behaviour |
|---|---|---|
| GET | `/healthz` | Public liveness only |
| GET | `/v1/status` | Verify DB/schema; reports collection/inference activation |
| POST | `/v1/collection-preview` | Validate query/dates; $50 initial / $2.50 test caps |
| POST | `/v1/runs` | Save an immutable plan using an idempotency key |
| GET | `/v1/runs` | Latest 50 workspace runs |
| GET | `/v1/runs/{id}` | Saved plan, jobs and computed results |
| POST | `/v1/runs/{id}/fixtures` | Import synthetic records into a planned synthetic run |
| POST | `/v1/runs/{id}/measure` | Seal inputs and queue code-calculated coverage |
| POST | `/v1/jobs/process-one` | Execute one bounded measurement job; optional run_id |
| POST | `/v1/runs/{id}/collect-page` | One paid X archive page, only with explicit runtime activation |

The website proxy authenticates the existing Admin session, checks origins on writes, keeps the service secret server-side and does not expose the paid collection route.

## Deployment

Render: Python 3.12.10, Free, Singapore, automatic deploy off. Build `pip install -r requirements.txt`; start `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 90 rmu_backend.app:application`.

Secrets: `DATABASE_URL` (restricted pooled runtime URL), `RMU_SERVICE_TOKEN` (at least 32 random characters). Configuration: `RMU_WORKSPACE_ID`. Do not deploy the owner URL. Cloudflare secrets: `RMU_PIPELINE_URL`, `RMU_PIPELINE_TOKEN`.

Migrations use a separate owner direct URL via `DATABASE_URL_UNPOOLED`. Run `python -m rmu_backend.migrate`. Never run migrations automatically on every web startup.

Free API cold starts are expected. Jobs and data live in PostgreSQL, not Render's ephemeral disk. No recurring paid worker or cron has been provisioned. Measurement requests commit atomically: a crash rolls back the job claim, so the queued job can be retried.

## X activation and spending

The operator must set `RMU_X_COLLECTION_ENABLED=true`, `X_API_BEARER_TOKEN`, `RMU_X_POST_PRICE_MICROUSD`, and `RMU_X_PRICE_VERIFIED_ON` to today's UTC date after checking the developer console. Every request reserves the maximum page cost before network access. Author-profile expansions are included and reserved at their verified resource rate. Returned billing estimates are **not** provider-confirmed charges. Successful pages retain their conservative reservations until billing reconciliation; uncertain pages block further collection. Do not blindly retry, release reservations or infer free retries from provider deduplication.

Reference: https://docs.x.com/x-api/getting-started/pricing . Published post-read rate checked 14 October 2026: $0.005, subject to change. Confirm the account-specific endpoint rate before activation. Paid collection is operator-run; the website does not expose a collection trigger.

## Validation and remaining release gates

`python -m unittest discover -s tests -v` runs offline API/normalisation checks. `python run_with_env.py tests.integration_pipeline` is an explicit live Neon QA with isolated synthetic fixtures and no paid calls. Local `.env.local` is ignored.

Live generative inference, embedding generation, named reviewer authentication, publication and unattended provider deletion/retention automation are not activated. Operator-run takedown and snapshot/restore workflows have been tested; current takedowns must be replayed before restoring older data. The public dashboard keeps its approved synthetic figures. Singapore describes this database and API, not every external provider or Cloudflare processing location.

## October 14 activation work
- Operator collection includes author profiles in the reserved cost ($0.005/post + $0.010/profile, verified October 14). Per-run allocations plus count/identity requests sum to at most the authorised $50. Unknown charges retain their full reservation.
- Gemini's fan rules are versioned in `rmu_backend/fan_rules.json`; output is `inferred_fan`, never verified fandom. Stable resolved account IDs distinguish talent and organisation. Missing profiles and unqualified accounts stay uncertain. Prolific results remain pending.
- `operations.export_snapshot` writes private recovery snapshots. An isolated database restore verified all 14 workspace tables and 50 rows against a synthetic QA snapshot, including the model-request ledger. Never restore an old corpus without replaying current takedowns; restore refuses snapshots carrying tombstones.
- `retention.purge` removes source records and affected derived results, registers no-reimport tombstones and deletes local corpus recovery copies. `expire_demo_evidence` is an operator-run 30-day sweep. No unattended retention scheduler has been installed.
- Astra classification adapter uses the approved instruction text, strict JSON schema, exact source-span checks, explicit per-call token bounds, durable PostgreSQL request receipts, a separately configured monetary allowance and no automatic retries. It has not yet been verified against live OpenAI. No API credential is deployed.
- The web API still cannot initiate paid collection/inference through the staging proxy. Admin displays evidence and research status; no model findings or synthetic headline scores are published automatically.

Model ledger migration 002 is applied in Neon. A mocked Responses API proof stored pending labels and blocked duplicate requests without contacting OpenAI. Exact-span and evidence-ID validation are tested. The synthesis adapter persists seven draft panel contracts only after all eligible evidence has researcher-approved classifications. Its transport is tested with mocks; live OpenAI access and actual interpretation remain pending.
