# Re-Model Intelligence: database and API

Python API on Render Free, PostgreSQL 17 with pgvector on Neon Free, both Singapore. The RMU website remains on its existing Cloudflare staging deployment. This repository contains the backend only; no credentials, posts or private prompt documents belong in Git.

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

The operator must set `RMU_X_COLLECTION_ENABLED=true`, `X_API_BEARER_TOKEN`, `RMU_X_POST_PRICE_MICROUSD`, and `RMU_X_PRICE_VERIFIED_ON` to today's UTC date after checking the developer console. Every request reserves the maximum page cost before network access. No expansions or user lookups are requested. Returned billing estimates are **not** provider-confirmed charges. Successful pages retain their conservative reservations until billing reconciliation; uncertain pages block further collection. Do not blindly retry, release reservations or infer free retries from provider deduplication.

Reference: https://docs.x.com/x-api/getting-started/pricing . Published post-read rate checked 14 October 2026: $0.005, subject to change. Confirm the account-specific endpoint rate before activation. No paid search has been executed by this deployment.

## Validation and remaining release gates

`python -m unittest discover -s tests -v` runs offline API/normalisation checks. `python run_with_env.py tests.integration_pipeline` is an explicit live Neon QA with isolated synthetic fixtures and no paid calls. Local `.env.local` is ignored.

Live generative inference, embedding generation, named reviewer authentication, publication, provider deletion/retention automation and verified backup restoration are not activated. The deletion register blocks re-import; an operational takedown/restore workflow still needs implementation before retaining a paid evidence corpus. The public dashboard keeps its approved synthetic figures. Singapore describes this database and API, not every external provider or Cloudflare processing location.
