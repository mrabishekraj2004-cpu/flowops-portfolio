# FlowOps hosting

Source: https://github.com/mrabishekraj2004-cpu/flowops-portfolio (main).
Public application: https://flowops-portfolio.vercel.app.
Separate Vercel project: abishek-f58a/flowops-portfolio. Separate free Neon database: flowops-database, AWS US East 2. HelpDeskFlow resources are not reused.

## Runtime responsibilities
- Next.js web and authenticated APIs run on Vercel, Node 24.
- Ordinary Neon PostgreSQL stores application data and private PDFs in PrivateDocument BYTEA rows. The local filesystem adapter remains the default for local development. STORAGE_DRIVER=postgres selects shared hosted storage.
- HOSTED_WORKER=workflow uses Vercel Workflow. Upload and decision routes await durable dispatch; processing runs in retryable Node steps. The same SQL jobs, leases, attempts and outbox protect replayed work. Only pending counts enter workflow results, not PDFs or credentials.
- Each workflow checks the queue up to 120 times, with durable two-second sleeps between pending cycles. A bounded run may leave work for another dispatcher; it is not an always-running loop.
- A daily 03:00 UTC Vercel cron calls /api/worker/recover, authenticated with CRON_SECRET. If initial workflow dispatch fails, pending SQL work remains stored; recovery can be delayed until that daily trigger. Do not promise instant recovery during a platform outage.
- Parser input is a unique private temporary PDF, deleted after parsing. Temporary disk is never the persistent document store. Parser code, PDF.js and its Linux canvas dependency are explicitly included in the function bundle.

## Settings
DATABASE_URL is provisioned by the Neon integration. BETTER_AUTH_URL is the exact public HTTPS origin. BETTER_AUTH_SECRET, WEBHOOK_SECRET and CRON_SECRET are random private values. EXTRACTION_PROVIDER=mock, PUBLIC_DEMO=true and ALLOW_DEV_SIMULATION=false. No paid AI credentials or service upgrades were used. Vercel system variables were already enabled. Public Vercel visitor access was explicitly approved; application login, roles, private file guards and origin validation remain enabled.

## Accounts and migrations
The user explicitly approved initialization of the new empty database and five fictional accounts. Existing users are never overwritten. Hosted passwords are only in ignored .local/hosted-credentials.json and .local/FlowOps-hosted-login-details.txt. Never publish administrator credentials. There is no automatic production seed. Signup is disabled; use the privately provided demo accounts.

The build runs prisma migrate deploy before npm run build. Migrations are versioned and additive; never reset a hosted database. Database backups and retention remain operational responsibilities. GitHub main is connected to Vercel for future deployments; run local checks and inspect the resulting deployment before claiming a release.

## Limits and costs
The selected database plan is free_v3; Vercel remains Hobby. No purchases are authorized. Uploaded PDFs are limited to 4 MB on Vercel to fit its request/response size; local development retains 5 MB. Maximum ten pages and 24,000 extracted characters. This small fictional portfolio stores PDFs in the database for shared private persistence; it is not a large-document storage service. Monitor database storage and platform quotas; do not upgrade automatically.

Workflow Hobby includes 50,000 events/month and 1 GB written/month, subject to platform compute and queue allowances: https://vercel.com/docs/workflows/pricing. Free usage is bounded; this is not an unlimited availability promise.

## Verification and known gaps
See test-results.md for executed checks and source commits. Live AI, OCR, external internet webhook delivery, shared production rate limiting, load testing and independent security review remain unverified/out of scope. Fictional documents only. Check anonymous access denial, role boundaries, private PDFs, source evidence, independent approval, signed delivery, production-disabled diagnostics and mobile layout after a deployment.

## Local OneDrive output
Local Next.js output remains .flowops-runtime; prepare-runtime.mjs links generated build output into a dedicated OS-temp cache on Windows OneDrive. Vercel uses .next, its expected deployment output. Sources and private local database/documents remain inside FlowOps. Rebuild generated output if temp is cleared.

Prisma CLI migrations prefer DATABASE_URL_UNPOOLED from the Neon integration, falling back to DATABASE_URL locally. Application traffic retains pooled DATABASE_URL. Session-level migration advisory locks must not use a transaction pool. No database reset is part of deployment.
