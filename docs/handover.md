# Handover

FlowOps is separate from HelpDeskFlow. Local URL when running: http://127.0.0.1:3100. No FlowOps GitHub remote or public demo URL is configured. Do not use HelpDeskFlow's repository or database for this project.

## Operate
Follow README: npm ci, private setup, generate client/fixtures, start database, migrate, explicit seed, then web and dedicated worker. Keep database/web/worker alive in three terminals. Accounts are in ignored .local/credentials.json; never publish them. Use clean.pdf for success, high-value.pdf for two reviewers, arithmetic.pdf for correction and scanned.pdf for manual entry/failure.

## Verification
Read test-results.md for executed checks and remaining gaps, evaluation-results.json for mock-only figures, bug-log.md for actual defects, and progress.md for resumable next steps. A UI screenshot alone does not prove the business workflow.

## Remaining deployment decisions
After local verification, choose a separate GitHub repository/visibility and a host that can support web, persistent private storage and durable worker. Account access and cost approval are required before provisioning. Live AI also requires an explicitly chosen model/account and its own evaluation. No paid service is necessary for the local demonstration.

## Important learning
Practise transactions, current-revision permissions, decimal arithmetic, independent approvals, idempotency, leases, outbox delivery, signatures, safe file access and truthful evidence. See demo-script.md and learning-guide.md.

## Verified local delivery

14 core tests and three final production HTTP/browser tests passed. Typecheck, lint, production build and production/full dependency audits passed. Mock evaluation: 16/16 selected field checks and 8/8 validation/rejection cases. Actual database close/reopen and worker process stop/start recovery passed. The private readable login file is .local/FlowOps-login-details.txt. Actual screenshots are under public/screenshots.

The current local web preview is http://127.0.0.1:3100. Run the database, compiled web app and worker in separate terminals after reopening the project; they are not a public hosted service. Use production mode for the worker when checking production diagnostics. Development failure simulation remains limited to local/non-production mode.
