# Contextual opinion correction — 15 October 2026

## Completed

- Shared `contextual-opinion-v1` contract separates format, evaluative framing, target, exact framing span, stance basis and reason for no discernible position. Applies to generic campaign workflow, approved chart mapper and legacy classification entrypoint.
- Generic workflow version `campaign-evidence-v2`; new fixed-chart codebook `approved-overview-v2`; legacy codebook `clf-proposed-v2`. Historical labels remain intact and exports retain legacy compatibility; new context is exported in context_json.
- Relevance-aware aggregation counts one account per theme. Only accounts discussing a theme enter its stance denominator, including relevant unclear cases. Not-discussed and relevance-uncertain coverage remain explicit.
- Current 407-post CLF run `0b6e7d76-fd59-49ff-bf5e-d824381c04b4` has new `approved-panels-v3` report aggregation using EXISTING `approved-overview-v1` classifications. Original v2 preserved. Messaging values unchanged.
- 333 public posts, 299 accounts. Theme distributions [support, opposition, mixed, unclear]: frontline [5,1,0,12] (18 relevant / 273 not discussed / 8 uncertain); resilience [1,0,0,2] (3 / 295 / 1); funding [7,0,0,18] (25 / 253 / 21).
- Removed operational draft/requested-window clutter; retained evidence/review limitations in method and source disclosures. No CSS/layout redesign.
- Notion chapter 09 added and synced to Admin document. Live Admin API returned 200 and verified chapter/rules.
- Frontend deployed via existing script: `91c3bd8e-87c8-4cbd-b6a7-1e1765dcc199` at https://rmu.universalmind.tv.
- Backend private GitHub main: `f544bc6e8eb2d943c38b5684e771b110b279ebe8`, tree `d75f836a80400d2653dc5be14d9bb2dec1cad6c7`.

## Validation and current blockers

48 backend unit tests pass. ESLint: no errors, existing image warning. Frontend build/deploy passed. TypeScript noEmit has existing Cloudflare ambient-type and report raw-import errors; not claimed clean.

Muted headless browser rendering checks passed at 1440x1000 and 390x844 USING INTERCEPTED EXACT SAVED DATABASE RESULTS. These prove rendering, preserved headings, source links, GPT values already stored, and nonzero synthetic funnels, NOT live API connectivity or new model accuracy. Scripts `/tmp/qa-rmu-contextual-isolated.mjs` and screenshots `/tmp/rmu-contextual-fans-1440.png` etc. Real live check `/tmp/qa-rmu-contextual.mjs` failed waiting for X data because Render was unavailable.

Render service `srv-db7ev8q5b2lc73fmt2p0` (workspace `tea-db7ebudg1s2s73a79lpg`) deployment trigger returned HTTP 500 three times. No new deploy was created. Latest live commit remains `533ce9d98e0389b49a30fff469301aa5dfa889bc`, deploy `dep-db7s7jq5b2lc739h5sj0`. Direct Render request returned HTTP 502; RMU proxy returned 503. Logs show shutdown 2026-10-14 19:14:28 UTC and no subsequent startup. Service still says not_suspended; autoDeploy off. Render status page did not establish a current general outage. CUA hidden Render dashboard inspection failed at runtime initialization. Do not invent a replacement hosting/deployment method.

User explicitly approved US$40 total GPT ceiling. Local execution enforces 40000000 microusd and max100 calls. Render environment update is unconfirmed because its deployment control plane returns503. No additional X purchases. Initial compact batches: two incomplete max_output_tokens responses (receipts retained and actual usage accounted), one20-post batch completed. At that checkpoint total usage/reservations US$31.150641. Sparse transport now records absent themes explicitly and expands to the same canonical schema; sequential scheduling stops on first error. A bounded continuation is in progress; do not claim all407 reclassified until verified.

## Next steps

1. Recover existing Render deployment/API connection and deploy latest private main; verify deployed commit and health.
2. Resolve pending budget question. Prepare a versioned reclassification using contextual schema, with bounded requests, exact evidence validation and no retries of ambiguous charges. Do not overwrite originals or claim current saved labels have already been reclassified.
3. Update current model labels, aggregate and Messaging values using the corrected contract within approved spending. Preserve signed-off fields and geometry. Assess news framing independently from format; do not presume outlet ideology or force positive sentiment.
4. Run actual staging request -> server -> OpenAI -> stored response -> interface verification. Fixtures and unit tests cannot replace this.
5. Human labelled benchmark and class-level accuracy assessment remain separate; no claim of validated accuracy yet.

Production has not been modified.

## Recovery checkpoint

Frontend v4-compatible rendering deployed to RMU staging as `2ff9e9dd-98f4-4e12-8e09-225dcdec5ffa`. Actual live API/browser QA passed at1440x1000 and390x844 with no page errors, existing saved v3 analysis, approved headings,407original classification coverage, source links, three priorities, messaging values and synthetic funnels. This is not proof that the new contextual reclassification has finished. Backend main3c1896cf2a59d4ba5a4ed24243baf4f8e2337dbd includes sparse transport, fail-stop scheduling, framing aggregate and CSV columns. Render deployment remains pending.51 backend unit tests pass.

## Explicit user pause — 15 October 2026, about09:00Sydney

Ben requested pause to move his laptop. Local runner PID28633 terminated. Last checkpoint160/407 new contextual classifications completed; US$33.620718 accounted before the current in-flight request reservation. Do not restart automatically. On explicit resume, inspect the latest model_request receipt and retain any unresolved charge reservation; never blindly repeat it. No final approved-panels-v4 synthesis has been stored. Current dashboard continues using complete v3 analysis. New backend GitHub main8a77d61481844e81b3ff3925dfed2ba8db86185f, tree45f010007b4a5e7507a746d03f51b7f73d346e2b. Render deployment remains blocked503. Latest frontend staging0b551288-ec58-4aca-92b2-11f62e0e11ba includes synced Notion chapter09 and v4 renderer.52 unit tests pass. Real staging1440/390 browser verification passed on saved v3 results; Admin prompt API200. No production changes.

## Resume — 15 October 2026

User explicitly resumed. Interrupted requestd1a55869-8d0b-4813-988e-22856415563e has no response/usage; full1019588microusd reservation retained. One replacement authorised within unchangedUSD40cap. Starting total34640306microusd. Local runner continues from160posts. Render env update now succeeded; deploydep-db817i8m7kps73ckuvsg is live at8a77d61481844e81b3ff3925dfed2ba8db86185f. Backend budget40000000and max100calls applied.

## Budget stop after resume

Runner finished safely at380/407 contextually reclassified posts. Total known usage plus retained reservations39052882microusd under40000000cap. Next batch rejected before any provider request; no new ambiguous in-flight request. Existing unresolved reservations:2261338microusd older timeout and1019588microusd beach-pause request, both retained.27posts and final Messaging synthesis remain. Async question pending: approve43000000total, no X purchases. Do not increase ceiling or restart until explicit reply. Current staging displays complete saved approved-panels-v3, not incomplete v4. Backend now live8a77d61481844e81b3ff3925dfed2ba8db86185f. On approval, merge remote budget43000000(max100calls unchanged), let deployment complete, then use `/tmp/rmu-resume-hosted-map.mjs` to initiate existing map-approved route through staging; do not restart local worker. This provides staging->server->GPT->interface verification. Poll saved request/job state, preserve all charge receipts, and use `/tmp/qa-rmu-contextual-v4.mjs` after v4 exists. Final export checker `/tmp/rmu-check-context-export.mjs`. User approval question call is pending; no answer yet.

Final pause verification: real staging browser QA passed1440and390 widths, preserved headings/values/source links/three priorities/funnels, no page errors, using existing complete v3. ExportHTTP200,407records,380new contextual records, all380framing quotations source-matched after CSV formula escaping. No active paid runner. Awaiting explicit43000000ceiling reply.

## US$43 approval

Ben explicitly approved US$43 cumulative GPT ceiling. Render budget merged to43000000microusd, max100calls unchanged; deploydep-db822e8n74is73dg0k0g started. Retain both interrupted-request reservations. Resume27remaining posts and final synthesis via hosted staging route after deploy is live. No additional X purchases.

## Completed hosted run and live proof — 15 October 2026

Render deploy dep-db822e8n74is73dg0k0g is live at8a77d61481844e81b3ff3925dfed2ba8db86185f with cumulative GPT cap43000000microusd. Staging map-approved request returned202 and hosted backend completed remaining27 posts plus full407-post Messaging synthesis. Workflow nowready; approved-panels-v4 saved. OpenAI receipts d7a07c27-4b35-4c65-896f-d2f96e977869, b39d471a-7253-496c-9529-d935efbe0ea7 and063cc0f7-b007-414e-a2e1-08826a9fced5 have response IDs, usage and validated outputs. No extra X purchases.

Final accounting40540282microusd (US$40.540282), including3280926microusd retained interrupted-request reservations. All407 posts have1221 contextual theme records. Public333-post framing:105favourable,15critical,1mixed,206descriptive,6uncertain. Specific-theme charts use relevant-account denominators, explicitly separate non-discussion and uncertain relevance; these are machine classifications, not human-validated accuracy.

Actual live staging browser QA passed1440x1000 and390x844 in separate muted headless Chromium, closed afterward. Verified source links, exact approved headings, all407 provenance,299public accounts, allthree priorities per perspective, saved GPT values in Messaging, shared message, unchanged77/86/97 demo scorecards and nonzero synthetic funnels, no page errors. Initial QA incorrectly assumed the first talent theme had evidence; corrected test to select a theme with actual talent evidence (Equitable funding), not the application or data. Both screenshots reviewed. CSV HTTP200,407records,407contextual records; every nonempty framing quote matched source text after formula escaping. Complete staging request -> hosted server -> successful OpenAI -> stored response -> interface verified. Frontend remains approved deployment0b551288-ec58-4aca-92b2-11f62e0e11ba; this completion updates data only. Production has not been modified.
