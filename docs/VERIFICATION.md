# Verification

The repository import checks the frontend snapshot against its source manifest and confirms that the pre-existing API/backend files remain unchanged. No website deployment, paid collection, model call or live database migration is part of the import.

After obtaining written source-use permission, install dependencies in the appropriate component. The frontend package manager is pinned in `frontend/package.json`; backend requirements are in the root `requirements.txt`.

Offline backend tests:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
```

Frontend tests are in `frontend/tests/`; several test files use the installed TypeScript/Vinext tooling. The standard frontend build is run from `frontend/`. Browser QA that involves media requires a separate Chromium process launched with `--mute-audio` before navigation, followed by closing every automated media page.

Live integration scripts, collection operators, database migrations and model jobs require separate environment configuration and explicit operational authorisation. Do not treat all scripts under `tests/` as offline tests.

The repository's preparation receipt records the exact checks executed for this import, including any pre-existing failures. A successful build or test verifies software behaviour within its scope, not the validity of analytical or scientific conclusions.
