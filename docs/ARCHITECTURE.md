# Architecture and source map

## Portal frontend

`frontend/` is the complete portal source snapshot from the local `rmu-site` project. It contains the Vinext/React application, server-side portal routes, Cloudflare Worker, research documentation, tests, scripts and public assets. Its source paths retain their internal relationship.

The application uses the existing Cloudflare deployment and bindings. Its staging script remains `frontend/scripts/deploy-rmu-staging.sh`; production still needs separate explicit authorisation. No deployment runs as part of this source import.

## API and database backend

`rmu_backend/`, `migrations/`, `requirements.txt`, root operator scripts and `tests/` retain their existing repository-root locations. This preserves the deployed Render service entry point and migration context. `render.free.yaml` retains automatic deployment disabled. The published API source matches the local backend snapshot byte for byte.

The frontend authenticates its portal-to-API requests using server-side configuration. The backend owns the Neon evidence and analytical records; portal-side bindings have their own responsibilities. Credentials and live data are configured outside Git.

## Additional operator tools

`frontend/backend/` adds local research/operator utilities that were absent from the public repository. Relative links to `../../rmu_backend`, `../../migrations`, `../../requirements.txt` and `../../run_with_env.py` reuse the canonical backend without creating a second implementation. This layout retains the local operator relationship to `frontend/server/`.

These tools may access private evidence or paid APIs. They are included for source review; the repository import does not execute them. Private output directories and environment files remain ignored.

## Provenance and scope

`FRONTEND_SOURCE_MANIFEST.json` records imported file hashes and the local base commit. It explicitly includes later local source additions rather than describing that old base commit as the whole portal. The existing backend base is `9739a338ee1afdccfcae9d14438454d70edb4285`.

The source import excludes raw retained social snapshots, private research runtime data, credentials, dependencies and generated build output. Historical backend operational notes are preserved in `BACKEND.md`; dated notes are not a substitute for checking the current service configuration.
