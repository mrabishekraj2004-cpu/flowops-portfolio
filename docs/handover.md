# Handover

FlowOps is separate from HelpDeskFlow. Local URL when running: http://127.0.0.1:3100. Public repository and live app are linked in the hosted handover below. Do not use HelpDeskFlow's repository or database for this project.

## Operate
Follow README: npm ci, private setup, generate client/fixtures, start database, migrate, explicit seed, then web and dedicated worker. Keep database/web/worker alive in three terminals. Accounts are in ignored .local/credentials.json; never publish them. Use clean.pdf for success, high-value.pdf for two reviewers, arithmetic.pdf for correction and scanned.pdf for manual entry/failure.

## Verification
Read test-results.md for executed checks and remaining gaps, evaluation-results.json for mock-only figures, bug-log.md for actual defects, and progress.md for resumable next steps. A UI screenshot alone does not prove the business workflow.

## Remaining deployment decisions
The separate public repository and free Vercel/Neon deployment are configured and verified. No further hosting selection is pending. Live AI also requires an explicitly chosen model/account and its own evaluation. No paid service is necessary for the local demonstration.

## Important learning
Practise transactions, current-revision permissions, decimal arithmetic, independent approvals, idempotency, leases, outbox delivery, signatures, safe file access and truthful evidence. See demo-script.md and learning-guide.md.

## Verified local delivery

14 core tests and three final production HTTP/browser tests passed. Typecheck, lint, production build and production/full dependency audits passed. Mock evaluation: 16/16 selected field checks and 8/8 validation/rejection cases. Actual database close/reopen and worker process stop/start recovery passed. The private readable login file is .local/FlowOps-login-details.txt. Actual screenshots are under public/screenshots.

The current local web preview is http://127.0.0.1:3100. Run the database, compiled web app and worker in separate terminals after reopening the project; they are not a public hosted service. Use production mode for the worker when checking production diagnostics. Development failure simulation remains limited to local/non-production mode.

Local source snapshot: 55e87be9858c32e299ad5073feb48f4b1a966c35 on branch codex/flowops. No remote is configured. The working tree was reviewed for excluded private data before committing. Subsequent documentation-only commits do not imply new application behavior.

## Hosted handover — 2026-10-24
Source repository: https://github.com/mrabishekraj2004-cpu/flowops-portfolio. Public site: https://flowops-portfolio.vercel.app. Private hosted login details: .local/FlowOps-hosted-login-details.txt (separate passwords from local accounts). Vercel and Neon free resources are FlowOps-specific. Live verification is recorded in test-results.md. Future main pushes deploy automatically; inspect build/runtime results and preserve existing data. No automatic production seeding or paid upgrades.
