# Pipeline implementation receipt — 14 October 2026

## Provisioned
- Neon project `summer-leaf-91658221`, branch `br-cool-grass-aovbgl1l`, PostgreSQL 17, Singapore, Free organization verified.
- Database `rmu_intelligence`, schema `rmu`, migration 001 applied. pgvector installed without selecting an embedding model or index dimensions.
- Restricted `rmu_runtime` login, `rmu_api` role, transaction-local workspace and row-level policies. Owner credential retained locally for migrations only.
- RMU staging Worker version `2c075cc5-a436-47a6-974d-7d29cecf6ddd`: Admin Pipeline view and authenticated proxy deployed by the established staging script.

## Verified
- 14 offline tests passed: authentication, budgets, query/date validation, disabled paid execution, record normalization, missing/zero metrics and repost handling.
- Neon integration passed: workspace reads/writes, restricted DDL, duplicate imports, idempotency conflict, sealed runs, durable jobs, computed coverage and reservation guards.
- WSGI API to Neon proof passed: authenticated plan/import/job/result journey. Mocked X transport proved page persistence and ambiguous-outcome handling. No provider network calls or credits used.
- Synthetic QA records retained in a separate verification workspace; they are not client evidence.

## Hosted API deployed
Private repository: `universalmindpbc/re-model-intelligence`. Runtime source commit: `25eb03b2608bb2876e88dcd57f4970f1ea27a2e6`.

Render workspace `tea-db7ebudg1s2s73a79lpg` (Re-Model Intelligence), service `srv-db7ev8q5b2lc73fmt2p0`, deployment `dep-db7ev9i5b2lc73fmt5k0` confirmed live. Plan Free, Singapore, automatic deployment off. Backend URL: `https://rmu-intelligence-demo-api.onrender.com` (API only, not a website preview).

Public liveness returned 200, unauthenticated status 401, authenticated status 200 with verified Neon schema version 1. X collection and model inference both false. RMU_PIPELINE_URL and RMU_PIPELINE_TOKEN added as staging Worker secrets; owner credentials were not sent to Render.

## Remaining activation gates
- Browser proof completed on RMU staging at 1440×1000 and 390×1000: Admin login, database readiness, synthetic import, job execution and persisted results passed. Anonymous requests and cross-origin writes were rejected. No horizontal overflow or JavaScript errors. Browser playback was stubbed and process audio muted; this was not a media test.
- Staging proxy compatibility fix deployed via the established script: Worker version `b89414bc-4aa4-4ec7-9065-d24bf6358e1c`. Redirects are handled manually and rejected before forwarding credentials.
- Keep X and inference off. Retention/deletion operations, billing reconciliation, backup restore and a bounded actual X pilot remain required before retaining purchased evidence or activating findings.
- Cold starts apply on Render Free. No paid recurring worker, cron or hosting plan was provisioned.

Production has not been modified.

## 2026-10-14 — bounded collection and analysis readiness

- Retained 407 distinct X posts: talent lane 33, CLF organisation lane 41, topic lane 334 (one post overlaps lanes). Successful searches exhausted pagination. This is query coverage, not population coverage.
- Gemini's provisional JSON rules classify 2 retained posts as inferred fan; 331 remain uncertain, 33 talent and 41 organisation. These are post counts, not a count of verified fans. Current profile evidence does not establish historical membership. Prolific responses are pending.
- US$50 campaign ceiling; US$10.98 in conservative reservations including checks. Successful returned-resource estimate US$5.33. Actual billing has not been reconciled. The earlier broader query failed with no retained posts and still holds US$1.50; it is not counted as a completed search.
- No live OpenAI request was made. Explicit reuse authorisation was obtained, but an accessible I AM key could not be retrieved. No source-server files were changed to expose it.
- Classifications remain subject to researcher review. Synthesis requires reviewed coding and produces seven unpublished draft panel contracts. Jo's prompt approval is not approval of future classifications or findings.
- Offline tests: 28 passed. Live API/storage and source-evidence interface checks passed on RMU staging at desktop and mobile widths. Anonymous and cross-origin writes rejected. Backup restoration verified 14 tables / 50 synthetic QA rows. Takedown proof was isolated and rolled back.
- Manual retention/takedown operations exist; no unattended scheduler is installed. Restoring older snapshots requires replaying current takedowns. No production website changes.

- Final mocked inference proof passed: exact source binding, duplicate-charge guard, pending coding gate, seven persisted draft panels. Backend commit `2c4c5c6e1210587a07c1c8f2d7b0f9b3e850194b`; Render deployment `dep-db7fv4d9fdbs73e3p16g` confirmed live at 04:06:42 UTC. Live OpenAI verification remains blocked.

## 2026-10-14 — live GPT activation and collection export (supersedes readiness notes above)

- Dedicated RMU OpenAI key installed only in private local/Render server configuration. Model `gpt-6-astra`, reasoning `high`, standard service tier, store=false. Separate US$25 conservative model ceiling, not a spend target or invoice amount. No new hosting plan.
- Real staging journey passed: Admin request → API job → OpenAI response → four persisted synthetic classifications visible in UI. Request receipt confirmed model and token usage. Observed classifications remain pending researcher review; no live narrative synthesis or publication was authorised by prompt approval alone.
- CSV export available via Report → Export data and Admin → Pipeline → selected collection → Download data · CSV. Authenticated, complete collection rather than visible 25 records; 55 columns include exact original text JSON, source IDs/URLs, metrics, provisional cohort evidence, theme labels, source spans, rationale, model/prompt provenance and review state. Formula-like cells escaped.
- Google Sheets currently uses CSV import; disable text-to-number/date/formula conversion to preserve long post IDs. Open Google Sheets link does not claim direct OAuth export or live sync. Direct Google Sheets integration remains separate work.
- Verification: 30 backend unit tests; scoped ESLint; actual database exports (33 talent and 334 topic posts); live CSV downloads and Report navigation at 1440×1000 and 390×1000; anonymous download 401, cross-origin writes 403; no horizontal dialog overflow or JS errors. Muted isolated Chromium, playback/fullscreen stubbed, closed after testing.
- Backend commit `48fbe594fd9104036de722a535ee4e1ec9ace047`; Render deployment `dep-db7gobivcj2c73djjbo0` confirmed live. Permanent RMU staging Worker version `6f48992e-ce91-4947-a727-a4fcbdada601`.
- Two saved GPT batches contained a malformed non-breaking-space escape. Recovery uses only exact source-matching replacement, preserves original archived response and per-label audit provenance, and makes no additional model calls. Researcher approval is still required.
- Production has not been modified.

- Saved-response recovery completed: 160 labels restored across two batches; 13 exact NBSP encoding repairs recorded; zero new API calls. All restored labels remain pending review.
- Final database proof: all 24 model requests validated; observed coverage is 33 talent posts / 132 labels, 41 organisation posts / 164 labels, 334 topic posts / 1,336 labels. Total 408 collection records (407 distinct X posts), 1,632 observed theme classifications, all pending researcher review. Final full topic CSV contains all 334 classified rows; no model requests remain received/reserved.

## 2026-10-14 — unified dashboard workflow (current implementation)

- Research is now available directly from the dashboard. One brief creates an immutable run and automatically collects X posts, computes sample metrics, codes the posts with Astra High, and drafts the seven Overview/Messaging panels. The saved run owns its campaign context and CSV. Reload recovers selection and progress; repeated submission uses an idempotency key.
- Each new X run retains the existing US$2.50 ceiling. The workspace model ceiling remains US$25; maximum request count is 60. These are limits, not invoice totals. Verified unit prices have a 30-day validity window and then fail closed until reviewed.
- New campaigns use the three-theme `campaign-evidence-v1` codebook. Existing CLF evidence retains `clf-proposed-v1`; its 407 distinct posts all have four saved classifications and can be reused without new X collection or recoding.
- New results are visibly unreviewed AI drafts. The seven panels include observations or hypotheses, supporting/challenging source IDs, limitations, suggested changes and proposed tests. A bounded maximum-20-post synthesis selection prioritises dissent and is explicitly not representative. Prolific evidence remains pending. An exact handle can identify retained talent posts; names and public conversation do not establish verified fandom.
- Both funnels retain editable synthetic figures and their demo labels. Synthetic funnel values are excluded from model evidence. Overview observed sample counts replace demo percentage claims only when a live run is selected.
- Render Free remains the existing API host. Checkpoint leases resume on service wake; ambiguous paid outcomes stop for reconciliation rather than issuing another charge. This is a working bounded demo pipeline, not an always-on worker SLA.
- Local proof: 34 backend unit tests; isolated Neon synthetic workflow reached seven panels and three labels, refused duplicate execution and hid records across tenants, with no provider calls.
- Actual staging UI proof: run `31161563-75cc-4f89-ad86-d3ff8b09bc0a` changed the person/topic to Dolly Parton / Imagination Library (19 January 2022), retained 25 posts, automatically produced 75 classifications and all seven panels, and exported a matching 25-row / 47-column CSV. All three actual Astra High responses validated. Browser reload resumed the same run, no second paid start was sent, and no browser errors occurred. Both funnels retained their original nonzero synthetic values and labels.
- Final frontend staging version `93ec07cb-32ea-449b-81cf-ad9700a253f2`; centred responsive lightboxes and numbered human-readable source references. Legacy CLF coding does not fabricate a generic topic-relevance count: the card says Not measured when that codebook is absent.
- Final backend commit `fc155afd09921d870a05ab5c732faed51f7d9c94`, Render deploy `dep-db7hb6k9v7es73c32b80` live. A startup-only hostname codec lookup failure reproduced after deployment; initialising IDNA before request/recovery threads resolved the subsequent startup checks. Repeated authenticated status returned 200 with schema 5 and X/GPT enabled.
- Retained CLF workflow `0b6e7d76-fd59-49ff-bf5e-d824381c04b4` links the existing distinct observations and original codebook. New X calls: none. No production website changes.

- Retained CLF synthesis completed automatically: 407 distinct posts, 1,628 original theme labels, seven persisted draft panels and a 407-row / 55-column CSV. All labels remain pending review; the extra synthesis used one actual Astra High response and no X calls.
- Final public staging browser proof passed at 1440×1000 and 390×844: all seven CLF panels, campaign labels, Not measured for unavailable generic coding, centred lightboxes, numbered source references, clickable Research control, 407-row CSV with all 1,628 classifications marked requires_review, and both nonzero synthetic funnels. Muted dedicated Chromium closed; no failures or browser errors. Production has not been modified.

## 2026-10-14 — approved presentation restored after scope correction

Ben rejected the replacement dashboard labels, generic insight panels and Research interface. Restored the approved Overview scorecards, Rihanna/Fans/Alignment charts and reporting text, Messaging page and MessagingBrief, campaign context and Report presentation. Removed the IntelligenceProvider from the dashboard and its presentation CSS. Existing Admin pipeline/export access remains. No database records, imported posts, GPT classifications or findings were deleted or changed.

Staging version `4ecfb0e2-b8bf-4f98-af5e-2a17a5f36635`. Verified original panels/charts, messaging brief, synthetic nonzero funnels and Report at 1440×1000 and 390×844 in isolated muted Chromium; no browser errors. The approved panels currently retain their labelled demo/research content. Mapping retained evidence into their existing field contracts remains required. Do not replace approved labels, charts, structure or reporting language to accommodate data; explain any proposed design change and obtain Ben's explicit agreement first. Production unchanged.

## 2026-10-14 — data bindings for the locked approved panels

- Presentation remains the signed-off AlignmentInsight/MessagingBrief and main dashboard. No CSS, headings, chart types, tabs or priority titles/questions were redesigned. Added a nonvisual campaign-matched data provider.
- Dedicated `approved-overview-v1` coding covers 33 retained Rihanna posts and two provisional fan posts from one account, across the exact three approved themes (105 labels). Audience aggregation deduplicates authors and retains mixed/unclear positions. Existing broader classifications remain intact.
- `approved-panels-v1` maps structured GPT values into the nine existing research priorities, Shared Values and next-action fields. Sources remain linked in existing evidence disclosures. No new X collection. Model usage stays under the existing US$25 allowance.
- The initial narrative pass omitted Shared Values/actions. Its incomplete output was detected in staging QA; required-field validation and explicit schema instructions were corrected. The staging map-approved API reuses retained coding and completes the field contract without recoding posts.
- Matching uses campaign, talent, topics and date window. Workflow revision changes trigger field refresh; completed unchanged payloads are reused to avoid repeated large transfers. No replacement Research UI is mounted.
- Main scorecards and funnels retain labelled synthetic data, per approved specification. Composite formula, verified delivery, message effects and Prolific survey evidence remain unavailable.
- Final staging proof: the actual staging request reached OpenAI and saved a complete corrected field contract, including Shared Values and next actions. All nine approved research priorities, original chart headings and theme names, source links, 33-post talent denominator and one-account fan denominator rendered at 1440px and 390px. Original 77/86/97 scorecards and both nonzero synthetic funnels remain. No browser errors. Backend unit tests: 36 passed; scoped lint and build passed.
- Final deployed revision-refresh check passed without a reload using a browser-only initial-response fixture followed by the real response. An earlier page opened during deployment did not refresh and timed out; that result is not counted as a pass. Both isolated muted browser processes closed in finally blocks.
- Frontend staging Worker version `f01fe2a2-adb4-4589-962b-a1be4a2e9dd0`; backend commit `554085a155e1750fd4a1a5c7735cdfb9a362e2b1`, Render deploy `dep-db7j5ts9v7es73c8r0e0`. Production has not been modified.


## 14 October — full-conversation mapping in progress

Ben authorised all retained public conversation to populate the approved Overview and Messaging fields, retaining uncertain fan membership as an attribute. The total GPT ceiling was explicitly raised from US$25 to US$30 in chat. No new X collection.

Five expanded batches saved 300 new chart labels, adding to the existing 105. A sixth response was received but rejected by validation; no labels from that batch were accepted. Its response body was only on Render Free's inaccessible ephemeral disk. Receipt `2d157a97-7e96-4343-a82d-4f92fec1e754` retains its usage/cost and an explicit rejection resolution, not a fabricated validated state. A replacement is limited to uncoded records.

Migration 006 adds private durable response payload and resolution columns to the existing tenant-protected model request table. Tested transactionally with rollback before applying. New paid responses persist before local archive writing/validation; public projection does not include response payload. Batch leases renew; three concurrent requests each reserve their allowance atomically. Completion and public QA remain pending.

### Full-collection checkpoint and synthesis timeout

All 407 originals now have the three exact Overview labels (1,221 classifications). The final all-record Messaging request timed out at the five-minute HTTP limit before any response ID/body was saved. Its reservation remains counted; total actual-plus-reserved allowance is US$29.043778, not a reconciled billing total. No automatic retry or new X purchase occurred. Ben's approved ceiling remains US$30; an optional US$32 total recovery ceiling has been requested and is pending.

Extended the full-collection request timeout to fifteen minutes, retaining five minutes for small batches and disabling automatic retries. Backend tests: 38 pass. Backend commit 0855cad5c99b9f84093e4b28d6a3b4af5cac9144, Render deployment dep-db7keg6q1p3s73cqon30 confirmed live. No recovery call has been sent.

Frontend staging a402c9be-6547-4beb-a539-5c05a8e1083d prefers completed v2 and retains the previous saved v1 until then, with existing evidence disclosures identifying its earlier sample. No design/CSS changes. Muted isolated Chromium verified all three original Overview charts, Messaging, nonzero synthetic funnels and Report at 1440px with no page errors. An initial locator attempt timed out; the repeat completed. Full-collection UI and end-to-end GPT verification remain incomplete until synthesis succeeds. Production unchanged.

## 15 October — full collection successfully mapped and published

Ben approved US$32 total and exactly one recovery. Timed-out receipt b32d3a0b-6b79-4e09-bacd-0c7dab22d309 retains its complete US$2.261338 reservation; its resolution explicitly authorises one replacement. Recovery hashes include the original receipt ID, and repeated execution is blocked. A dedicated regression test confirms one provider call maximum. No additional X collection.

The staging map-approved request returned 202, the server submitted Astra High, and the replacement response completed and was durably saved and validated (7,040 output tokens). The workflow is ready. All 407 originals were supplied to Messaging and all 1,221 exact chart labels are saved. Overview covers 33 Rihanna posts, 41 separate CLF organisation posts and 333 public-conversation posts from 299 accounts. Only one account is inferred fan; that attribute does not exclude the other public accounts. All nine existing research priorities, Shared Values and next actions are populated. Findings remain AI drafts; no Prolific data or team/community validation is fabricated.

Backend commit 533ce9d98e0389b49a30fff469301aa5dfa889bc, Render deploy dep-db7s7jq5b2lc739h5sj0 confirmed live. Full-collection timeout is 15 minutes and renewed stage lease is 20 minutes. 39 unit tests pass. Accounted cost including the unresolved full timeout reservation is US$29.877853, below US$32; this is not a reconciled provider invoice.

Frontend published by the established staging script: 0d90f9e4-d7fd-4e22-a117-c20c563f7402. Isolated muted browser checks at 1440x1000 and 390x844 verified full-collection provenance, 407x3 coverage, exact three theme names, 299-account audience, source links, all nine meaning/change/test values, Shared Values, original synthetic scorecards and nonzero funnels. No page errors. Desktop Overview/Report journey also passed; screenshots inspected. No CSS/layout/heading changes. Visual limitation: very small stance segments crowd their inline percentage text in the existing chart; layout correction requires Ben's approval. Production unchanged.
