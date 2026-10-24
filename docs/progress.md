# FlowOps resumable progress

## Current delivery — 24 October 2026
- Public full application: https://flowops-portfolio.vercel.app.
- Public source: https://github.com/mrabishekraj2004-cpu/flowops-portfolio, main.
- Verified hosted application source: 1665eaa55713ecf1e83ed7c1436a855f4b06960f.
- Separate Vercel project flowops-portfolio and free Neon database flowops-database; HelpDeskFlow source, repository, database and hosting are unchanged.
- Explicit user approvals received for fictional hosted accounts and public Vercel visitor access. Application login/roles/private documents remain protected. No paid upgrades or live AI calls.
- Local filesystem storage/dedicated worker retained. Hosted adapter stores private PDFs in PostgreSQL; Vercel Workflow runs the persisted worker through retryable steps. Protected daily recovery is configured.
- Typecheck, lint, production build and dependency audit passed. 15 core tests passed. All 3 live HTTP/browser tests passed. Additional live two-reviewer/self-approval/concurrent-duplicate final-approval test passed with one purchase/outbox and signed completion.
- Actual live screenshots and executed evidence updated. See test-results.md, deployment.md and handover.md.
- Hosted login passwords are private in .local/FlowOps-hosted-login-details.txt; local passwords differ.

## Ongoing maintenance
Run relevant checks before future changes, update documentation/evidence, scan actual private values before publication, push main and inspect the resulting Vercel deployment. Never reset the database, publish passwords or reuse HelpDeskFlow resources. Keep AI labelled mock until explicitly configured and evaluated. No account provisioning UI, OCR, independent security/load certification or external internet delivery is claimed. Monitor free quotas and retain backups; do not upgrade automatically.

## Resolved setup issues
Neon terms initially remained unrecorded; the user later supplied Terms Accepted and integration provisioning succeeded. The first Vercel build used the OneDrive-specific output folder and failed packaging; .next on Vercel resolved it. Workflow transitive Zod/Undici advisories were fixed within their existing major versions using package overrides. The local output cache remains .flowops-runtime.

## Current follow-up: three reported portfolio defects
Homepage deployment copy and state-specific review guidance corrected. Mock-v2 supports the exact reported title-case/Date/separate-item-label format without guessing. 16 core tests passed and dataset-v2 evaluation passed 24/24 selected fields, 9/9 outcomes. Existing v1 dataset and original reviewed records are preserved. Local production build passed; four live browser regressions are pending; do not claim follow-up release complete until verified.
