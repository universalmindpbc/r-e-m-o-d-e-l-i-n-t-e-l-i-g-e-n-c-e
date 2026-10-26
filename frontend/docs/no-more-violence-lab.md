# No More Violence Lab — first research edition

Staging: https://rmu.universalmind.tv/intelligence/violence/#lab
Project selector: https://rmu.universalmind.tv/intelligence/
Existing climate workspace: https://rmu.universalmind.tv/intelligence/climate-justice/

The root also presents the selector. Legacy root hashes and `?admin` links continue to the climate workspace. Existing climate API, report, survey, network and settings data are retained; the new workspace never consumes those as No More Violence findings.

## Approved dashboard reuse

Both campaign routes render `RmuDashboard`. No More Violence uses the same video, casing, diagrams, hover cards, research lightboxes, messaging scenarios, Influence, Network, Report reader and Admin components. The menu uses the original unboxed navigation. The Rihanna film remains a labelled placeholder, with the original entry/play/sound controls.

`workspace_settings` in the existing staging D1 database holds separate No More Violence campaign and synthetic records. The existing synthetic editor and settings endpoints accept a validated workspace ID and retain optimistic version checks. Legacy requests default to climate justice; its singleton records are not copied over or rewritten. Synthetic conversations and fictional network placeholders derive from the saved No More Violence settings. They cannot be confused with collected Rihanna evidence. No actual celebrities or endorsements are invented.

## Primary line graph — government data only

The Lab cannot read SyntheticProvider or the dashboard demo settings. Other campaign tabs retain their synthetic facility. The Lab follows the supplied single-line layout, with original unboxed navigation and the translucent black chart backing.

Domestic violence uses the real ABS Recorded Crime – Victims 2025 workbook, Tables 30 and 37. The downloaded workbook was rechecked cell by cell on 20 October 2026 (792 existing observations plus 48 First Nations observations). The source manifest retains the official download URL, publication date, source cells and SHA-256. The source/report dropdown identifies the publisher; Sources & method exposes the workbook, definitions, derivation and exact cells.

The default is one annual line for a derived sum of NSW, SA, WA, TAS, NT and ACT FDV-related assault victim counts. The same six jurisdictions are used in every year, and the graph explicitly says it is not a national total. Victoria has no published ABS assault count and Queensland FDV assault begins in 2023, so neither is silently added. Selecting a state uses its own published annual observations. Sex uses source total/male/female counts, never a sum of sex components. First Nations uses Table 37 for a selected NSW, QLD, SA or NT; unavailable NT values from 2023 remain null. Recording changes and unknown Indigenous status constrain comparisons.

Counts are police-recorded victimisations, not unique people or every incident. Annual data runs through 2025. Dates select overlapping full annual source periods; no daily/monthly estimates or 2026 projections are generated. Day/month choices explain the unsupported annual granularity. Unpublished intersections, international locations and violent-extremism victimisation have explicit source gaps and research routes; no synthetic fallback is permitted. The source gap does not establish zero violence.

## Sourced research

`/api/lab/research` uses a dedicated encrypted Worker secret, the Responses API and required web search. Background requests return a saved job reference; the browser polls to retrieve completed results. Responses without completed web search and citations are not shown as findings. Answers remain drafts, carry their evidence revision and are stored in the dedicated `lab_research_jobs` table with model usage. No paid calls occur on page load or settings changes. Existing network paid-call ledgers and budgets are unchanged; Lab calls are a separate, explicit proofing allowance capped at five starts/day, two/day per hashed visitor. Each request has at most five tool calls and 6,000 output tokens. Retrying a request ID is idempotent. This is bounded research, not an exhaustive review.

The shared workspace is public. Question input asks for no personal case details. Network development preserves Observed network → Expanded discovery → Reviewed recommendations, with explicitly fictional demo nodes and no real partner approvals.

## Google Trends

The lightbox is a read-only view of a shared backend dataset at `/api/lab/trends/`. There are no visitor uploads or browser-local evidence files, and viewing a chart makes no Google request. Development retains original CSV exports in `data/google-trends/` and records their exact terms, geography, channel, window, export date and source URL in `manifest.json`. Run `node scripts/build-trends-data.mjs` to validate the source definitions and compile `server/google-trends.json`, including SHA-256 hashes. Deploy through the existing staging script. Never place test fixtures in the production manifest.

Each manifest entry has `id`, `terms` (array), `geography` (AU, US or empty for Worldwide), `geographyLabel` (exact Google CSV scope), `channel` (Web Search or YouTube Search), `from`, `to`, `exportedAt` (ISO date), `sourceUrl` (the exact Google Trends explore URL), and `timeCsv` and/or `regionCsv` (filenames beside the manifest). Query, geography, channel and dates must match the source URL; CSV term and geography must match the manifest. The developer must verify all export settings before publication. Source files are retained intact. Missing/censored values stay missing, never zero.

Timelines offer 10 years, 20 years and all available source history without rescaling the original index. Regional exports retain their own full-period caption; slicing a timeline does not fabricate a newly aggregated regional view. Search interest, reports and harm are separate measures. Google CSV indices remain relative 0–100, not absolute search counts. The API alpha uses a different scale and needs a separate adapter if approved.

**Published source files, 20 October 2026:** Ben supplied three domestic-violence Web Search timeline CSVs covering Australia, the United States and Worldwide. Each contains 274 monthly observations from January 2004 to October 2026, for 822 values total. The original files are retained byte-for-byte. Their macOS download metadata confirms Google as the source, `property` empty (Web Search), category 0 (All categories), monthly resolution, geography and the exact request range 2004-01-01 to 2026-10-19. Ben also confirmed Web Search. Export timestamps are stored with the Australia/Sydney offset. No transient download tokens are retained.

October 2026 is incomplete as of the request's end date. Its published value is retained and labelled incomplete in the table, and its chart segment is dashed. The 10-year and 20-year windows retain the export's original index scale. The three separate exports are not absolute-volume comparisons. The same backend dataset is served to every visitor; there are no visitor uploads or Google requests when viewing charts.

Regional heat-map data, related topics, related queries, YouTube and violent-extremism exports have not been supplied. These cannot be derived from the three timeline files. Map and topic views require the corresponding original Google Trends exports. Official API alpha access still requires Google approval and covers a rolling five years; no API access is claimed.


## Report navigation

The source/report dropdown always starts with the approved ABS annual count timeline and selects it initially. Nine optional ABS and AIHW views restore recorded-offence counts, survey trends, women/men comparisons, state estimates and First Nations hospitalisation rates. Selecting a report resets incompatible demographic filters and chooses its published reference range while retaining the selected geography. Charts, unit labels, source/method details and research brief all follow the selected report. The original hero geometry, black transparency, unboxed navigation and video are preserved.

## Verification

`node --experimental-strip-types --test tests/lab.test.mjs`
`node scripts/qa-violence-dashboard.mjs` uses only permanent RMU staging and a dedicated muted Chromium process; it verifies geometry, navigation, filters, periods, dialogs and research-brief export.
`node scripts/qa-lab-research.mjs` makes one real bounded model request through the staging interface. Run only when a new API change needs a live check; saved results support subsequent UI checks without additional model calls.
