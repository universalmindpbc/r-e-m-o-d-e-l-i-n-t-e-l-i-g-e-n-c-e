# Rihanna / CLF pilot operations

Prolific study: `6ad17e9c2c65332e2fca0684`. Workspace: `6ac6e23a2606ea93f2521b9b`. Project: `6ac6e23b2606ea93f2521b9f`.

Created unpublished. Exact study quote: USD 88.57, including 70 × $0.60 completions, at most 100 × $0.20 paid screen-outs and corporate platform fees; account VAT is zero. Budget ceiling USD 100. No automatic increases. Latest verified balance: USD 100. Ben and Jo must approve the questions before recruitment; the study remains unpublished.

Permanent survey URL: https://rmu.universalmind.tv/survey/rihanna-clf . Proof URL adds `?preview=1`; preview is browser-only, never writes data, and never issues a payment code. A normal visit shows recruitment closed until the database flag is enabled. All production answers require matching, active Prolific participant/study/submission IDs verified server-side. Completed submissions are idempotent. Earlier-phase responses cannot be rewritten after description exposure. No live response records should ever be seeded for QA.

Survey schema and questionnaire version: `rihanna-clf-us-2022-v1`. Country: US; age: 18–100 (Prolific's full adult range). Eligibility is recalled fan status during January–April 2022, regardless of current fandom. Prior foundation awareness is measured before description exposure. This is retrospective identification with current attitudes, not causal campaign lift.

## Launch prerequisites

1. Ben and Jo proof and explicitly approve the staged instrument. Timed human pilot must support the 3-minute estimate.
2. Funding confirmed: USD 100 available. Recheck the exact study total before launch; it must remain within USD 100, including any payment adjustments.
3. Ben explicitly approved secure key storage after the initial automatic-review block. `PROLIFIC_API_TOKEN` was successfully uploaded as a server-only Cloudflare secret using stdin. No credential was written to repository files or browser code.
4. Confirm live Prolific submission-verification and persistence with an authorised test submission before paid recruitment. The public preview does not test Prolific payment handling.
5. Read back the fixed-screen-out completion action and its 100-slot cap, both completion codes, adult/US filters, reward and estimated duration. The legacy `is_custom_screening` flag may be false even while fixed screen-out actions are present; do not infer payout verification solely from this field.
6. Open intake in `prolific_pilot_settings` only after checks, then publish the existing Prolific draft. This is participant recruitment, not a production website deployment. Do not duplicate the study.

No publish call has been issued. The API may label an unpublished draft `is_ready_to_publish` even though our external-survey QA remains incomplete; this is not launch approval.

## Data management

Raw answers and Prolific IDs live only in the existing staging D1 database, `prolific_pilot_responses`. No public response/export endpoint exists. Use authorised D1 access for research exports, reconciliation and participant withdrawal requests. Store exports privately, exclude identifiers from dashboard/public reporting, and apply the same 90-day deletion policy to any raw exports. Public free text is not automatically published or sent to AI. Daily Worker cleanup deletes source records older than 89 days, keeping retention within 90 days under normal scheduler operation. Contact channel is the researcher's Prolific messaging.

Before changing dates or topics, create a new questionnaire version and study; do not silently reuse these responses for a different campaign.

## Verification on 16 October 2026

- Prolific authentication and USD 100 available balance verified; study readback UNPUBLISHED and USD 88.57 total.
- Five local tests passed, including SQLite persistence, submission identity checks, replay protection and expiry cleanup with mocked Prolific responses.
- Existing staging deploy script passed lint (one pre-existing image warning) and build. Standalone tsc remains blocked by existing Cloudflare/raw-file declarations and work/network-v2 scratch imports; it is not reported as passing.
- Public staging preview passed at 1440×900 and 390×844: awareness Yes/No/Not sure, former fans, both screen-out answers, non-consent, no survey POSTs from preview, closed real intake, cross-origin rejection.
- Remote D1 verified enabled=0 and response count=0 after QA.
- Real participant verification/payout is not yet end-to-end tested. Worker secret storage initially blocked by automatic review; completed after Ben explicitly approved the destination. No Prolific publish or payment action issued.
