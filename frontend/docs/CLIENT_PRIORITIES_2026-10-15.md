# Client priorities and engagement — staging verification

Published to https://rmu.universalmind.tv on 15 October 2026.
Production unchanged.

## Scope

Includes the talent and organisation as the client, with separate attribution. The approved main canvas is preserved. Overview lightboxes lead with data-derived campaign priorities, a coloured topic-assignment ring, publication timeline, captured interaction metrics, client/public post-count comparisons and inspectable source posts. Prior research findings remain below.

The generic campaign-priorities-v1 prompt discovers substantive priorities from the supplied campaign and posts. It does not hardcode Rihanna, CLF or three climate themes. Every supplied post must be accounted for, source IDs must exist, client/public attribution is validated, and outside assignments cannot overlap topics. Python computes all displayed metrics from stored observations; GPT does not generate metric totals.

## Live result

Run: 0b6e7d76-fd59-49ff-bf5e-d824381c04b4

- 407 originals reviewed: 33 talent, 41 organisation, 333 public.
- Eight priorities; 37 distinct client posts belong to these priorities. Multi-topic assignments may overlap.
- Captured metrics for these 37 posts: 32,692 likes; 1,280 replies; 3,473 reposts; 399 quotes; 37,844 total interactions.
- Metrics are captured lifetime counts, not interactions specifically occurring during the campaign window.
- Reach and viral diffusion are not measured. Publication timeline shows publication counts, not engagement over time.
- AI assignments are source-validated, not claimed human-validated. Descriptive news coverage is distinguished from support and challenge. Silence is not interpreted as disinterest.

## Execution and accounting

Initial request e5fc458a-55ee-45d3-b2a7-0cb3bd148d1f hit the output limit. Its incomplete response was discarded and actual usage accounted; no partial findings published.
Recovery fc675c2b-7b26-4139-9c6b-b4777b7b41b1 completed and validated. Workflow ready.
Cumulative accounting US$43.327557 including existing reservations, under the approved US$46 ceiling. No additional X purchase.
Backend commit: 9739a338ee1afdccfcae9d14438454d70edb4285.
Frontend staging version: 4a535088-e48b-490a-ab0b-87fcc39f5891.

## Verification

- 62 backend tests pass.
- Frontend lint/build pass (existing image optimisation warning only).
- Full staging request → backend → successful OpenAI response → saved analysis → rendered UI verified.
- All eight topic selections plus all-priorities, across Rihanna/Fans/Alignment, independently reconciled to API metrics.
- 1920, 1440 and 390 viewport checks: no horizontal overflow or page errors; isolated Chromium with process-level mute and playback stub; browser closed after checks.
- Different-client fixture (Maya Chen/public transport) confirms no Rihanna/CLF leakage and correct combined client engagement.
- Messaging retains research and organisation coverage.
- Notion chapter 11 mirrors the executed prompt and measurement contract; Admin prompt endpoint confirms chapter 11. New chapter awaits human review.
