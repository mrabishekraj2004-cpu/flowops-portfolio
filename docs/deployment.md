# Deployment preparation

FlowOps source is published at https://github.com/mrabishekraj2004-cpu/flowops-portfolio (main). A separate Vercel project, abishek-f58a/flowops-portfolio, is linked. No hosted database, shared document store, worker service or public deployment has been provisioned. HelpDeskFlow's remote and hosted resources remain separate. No service purchase is authorised.

## Local
Follow README setup. DB 54330, web 3100, dedicated worker. Persistent .local/postgres and .local/documents are private. Explicit seed is development-only. Production build may run locally with npm run build then npm start; keep worker separate. Production disables failure simulation.

## Hosted requirements
1. Authorised FlowOps repository and visibility decision, separate from HelpDeskFlow. Inspect existing remote before publication; never force-push or overwrite.
2. Persistent ordinary PostgreSQL with UTC, backups and a separate migration connection where recommended. Apply versioned migrations; do not use reset/db push over existing data.
3. Private persistent storage shared by web and worker. Current adapter is filesystem; choose a shared-volume host or implement/test an object-storage adapter before splitting hosts. Never use public/ or ephemeral function disk as persistent storage.
4. Always-on or supervised durable Node worker using the same database, storage, provider configuration and webhook secret. Do not assume a Next.js web-only deployment runs it.
5. HTTPS web host, exact auth origin, random secrets, private account provisioning, shared production rate limiting, retention and monitoring. No automatic production seed.
6. Set PUBLIC_DEMO=true and ALLOW_DEV_SIMULATION=false; keep administrator credentials private. Verify worker restart/recovery and private file access against ordinary hosted PostgreSQL before claiming release.
7. Optional live AI requires provider account access and potential usage costs; explicitly approve/configure before running it. The mock core requires none.

A single VM/container host with private persistent disk plus managed PostgreSQL is compatible with this implementation; separate web/worker containers need shared document storage. Free-plan suitability and costs must be checked with the chosen provider before any resources are created. No hosted URL is invented here.

## Generated local output

Next.js uses .flowops-runtime. On this Windows OneDrive path, prepare-runtime.mjs creates a link to a dedicated per-project OS-temp build cache with a dependency-resolution parent. Elsewhere it is an ordinary generated project directory. The cache can be regenerated; it is not document storage or a database. Rebuild if the OS clears temp. Only generated contents belong there. Browser test discovery stages test source in OS temp to avoid cloud reparse-point behavior.

## Publication progress — 2026-10-24

Uploaded and verified the source repository, including required documentation, tests and screenshots. The 95 tracked source files passed the actual local/demo/test secret and excluded-path scan. Vercel CLI is authenticated and the separate project is linked. Neon installation requested the free_v3 plan, region cle1, existing application auth preserved, production only, without pulling secrets. Both attempts returned integration_terms_acceptance_required; the user reported acceptance between attempts, but the follow-up installations check returned no marketplace installations. No database was created and no live application is claimed. Continue after acceptance is recorded for team abishek-f58a, then implement and verify shared private storage and durable hosted processing before deployment. Do not rerun provisioning without checking existing resources first.

