# Re-Model Intelligence

A research and strategy portal connecting observed evidence, reviewed analysis, network exploration and reporting.

**Founder and maintainer:** Ben Korbel<br>
**Copyright holder:** Universal Mind TV, Public Benefit Corporation<br>
**Public proofing portal:** [rmu.universalmind.tv](https://rmu.universalmind.tv)<br>
**Production address:** [re-model.co/intelligence/](https://re-model.co/intelligence/)

This repository presents the complete portal frontend together with its existing database/API backend. The frontend includes dashboard, research, network, laboratory, survey, administration and report interfaces. The backend provides evidence records, collection and model-job infrastructure. Observed evidence, inferred labels, synthetic demonstrations and human-approved recommendations remain distinct.

## Repository map

| Location | Responsibility |
| --- | --- |
| [`frontend/app/`](frontend/app/) | Portal pages, dashboard components, research, network, laboratory, reports and browser interactions. |
| [`frontend/server/`](frontend/server/) and [`frontend/app/api/`](frontend/app/api/) | Portal-side data access and API routes. |
| [`frontend/worker/`](frontend/worker/) | Existing Cloudflare portal worker entry point. |
| [`frontend/docs/`](frontend/docs/) | Research and workflow documentation. |
| [`frontend/tests/`](frontend/tests/) and [`frontend/scripts/`](frontend/scripts/) | Frontend checks and the existing staging deployment script. |
| [`rmu_backend/`](rmu_backend/) | Existing Python API, evidence pipeline, model jobs and analytical workflows. |
| [`migrations/`](migrations/) and [`tests/`](tests/) | Backend database migrations and tests. |
| [`frontend/backend/`](frontend/backend/) | Additional local operator/research tools; links reference the canonical backend above. |
| [`docs/BACKEND.md`](docs/BACKEND.md) | Preserved backend technical documentation and historical activation notes. |

The backend remains at its existing root paths so the current Render configuration and API entry point retain their meaning. The portal is under `frontend/`. [ARCHITECTURE.md](docs/ARCHITECTURE.md) maps the relationship and the service boundaries.

## Academic Context and Doctoral Foundations

The research workflow links source material, evidence records, inferred classifications and human review. [`frontend/app/network/workflow.ts`](frontend/app/network/workflow.ts) defines the progression from observed network to expanded discovery and reviewed recommendations. [`frontend/app/lab/`](frontend/app/lab/), [`frontend/docs/`](frontend/docs/) and [`frontend/app/report/`](frontend/app/report/) expose research and reporting components. [`rmu_backend/`](rmu_backend/) and [`migrations/`](migrations/) expose the corresponding data and analysis infrastructure.

The [doctoral review guide](docs/PHD_REVIEW.md) relates these methods to I AM and Informatics, with explicit distinctions between observed data, demonstrations, model output and approved findings. The existence of software, a report or a model response does not establish scientific or strategic validity.

## Source and reproduction

The portal snapshot is documented in [FRONTEND_SOURCE_MANIFEST.json](docs/FRONTEND_SOURCE_MANIFEST.json). It includes the completed local portal source that previously had no GitHub representation. The existing published API source was verified against the local backend before this import. Private raw social data, participant records, credentials, virtual environments and generated build output are excluded.

After obtaining permission to run the source, use Node.js 22.13 or later and the pinned package manager in `frontend/package.json` for the frontend. The Python backend dependency list is [`requirements.txt`](requirements.txt). Start with [VERIFICATION.md](docs/VERIFICATION.md) for offline checks. Provider credentials and service bindings are configured separately; inspect test instructions before invoking a live integration or a paid collection/model operation.

## Existing hosting

The portal continues to use its existing Cloudflare staging workflow: run `npm run deploy:staging` from `frontend/` only as part of an authorised staging update. The backend keeps its existing Render configuration and Neon database boundary. This repository presentation update does not deploy either service or change either URL. Production publication requires separate explicit approval.

## Ownership, permission and citation

This is source-available software under a [permission-required notice](LICENSE). Academic researchers apply individually before running or modifying the software. Approved organisations below USD 1 million annual revenue receive a fee-free licence within the agreed scope; organisations at or above the threshold negotiate a nominal fee in good faith. Website use remains separate from source-software permission.

See [LICENSING.md](LICENSING.md), [MAINTAINERS.md](MAINTAINERS.md), [CITATION.cff](CITATION.cff) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Related projects: [Universal Mind I AM](https://github.com/universalmindpbc/u-n-i-v-e-r-s-a-l-m-i-n-d) · [Universal Informatics](https://github.com/universalmindpbc/u-n-i-v-e-r-s-a-l-i-n-f-o-r-m-a-t-i-c-s).
