# Re-Model Intelligence — Repository Rules

## Permanent environments

- `https://rmu.universalmind.tv` is the permanent public staging and proofing environment.
- `https://re-model.co/intelligence/` is the eventual production environment.

Every requested Re-Model Intelligence website change includes standing authorisation to publish the verified update to `rmu.universalmind.tv`. Do not ask Ben for staging deployment permission. Develop, verify, publish to RMU staging, verify the public result, and return the staging URL.

Never modify `re-model.co/intelligence/` without Ben's separate, explicit production instruction. Approval of staging and positive feedback do not authorise production.

RMU staging must remain publicly accessible. Never add ChatGPT, OpenAI, workspace, or other sign-in requirements unless Ben explicitly requests authentication.

## Permanent staging deployment method

- Deploy RMU staging only with `npm run deploy:staging`.
- The script publishes the verified Vinext build to the dedicated Cloudflare Worker `rmu-intelligence-staging`.
- The Worker may route only `rmu.universalmind.tv`.
- The script contains no Re-Model production hostname or production target.
- Staging deployment is permanently pre-authorised. Run it after every completed website update without asking Ben again.
- Never reintroduce ChatGPT Sites, OpenAI Sites hosting, or Sites authentication.
- Never add `re-model.co/intelligence/` to the staging Worker or deployment script.

Ben's supplied wording, hierarchy, geometry, imagery, opacity, placement, and approved variants are specifications. Preserve them literally. Circles must remain circles, funnels must remain proportionally locked, and the 16:9 dashboard canvas must scale uniformly without geometric distortion.


## Mandatory Network workflow for every campaign
Every new client, topic or analysis window must include these stages in order: Observed network → Expanded discovery → Reviewed recommendations. `app/network/workflow.ts` is the application contract. Campaign GET/PUT returns a campaign-specific plan; saving settings does not silently spend API budget.
Expanded discovery must research the wider web, beyond social API samples: identity, relevant collaborations, documented cause work, current activity, supporting and conflicting evidence, source dates, confidence and gaps. Feed the sourced evidence into AI synthesis. Keep observed accounts distinct from discovered prospects; never infer personality or sensitive traits, or treat musical proximity as cause alignment.
A named human must approve each client-facing recommendation against the exact campaign identity and research revision. Draft pools and shortlists are not approved strategies. Changed campaign context or revised research invalidates prior approvals. Preserve the shared paid-call ledger and agreed budget. Never fill a target pool with invented or weakly labelled candidates; the UI supports larger pools but shows at most 20 nodes.
See `docs/network-workflow.md` and `backend/network_prompt.md` for the research contract.

Network geometry must reserve exclusion zones around category headings and the central client hub. Candidate nodes, including their maximum pulse and selection rings, must never overlap these zones. Preserve this rule across pages and uniformly scaled viewports; verify against rendered bounds.
