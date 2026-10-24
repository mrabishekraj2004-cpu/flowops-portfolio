# FlowOps

AI-assisted quotation processing and independent approval for a fictional organisation. Portfolio project by **Abishek Akash**, seeking a first IT opportunity in Colombo. No customer, employer or business-result claims.

## Status

Separate project at `../FlowOps`; HelpDeskFlow is unchanged. Working local document-to-approval workflow verified; see [progress](docs/progress.md) and [executed verification](docs/test-results.md). No FlowOps remote repository or public deployment has been created. Live AI is optional and unverified. Deterministic mock results are not AI accuracy claims.

## Actual screenshots

[Desktop dashboard](public/screenshots/dashboard-desktop.png) · [Original text and human review](public/screenshots/review-desktop.png) · [Automation runs](public/screenshots/runs-desktop.png) · [Mobile dashboard](public/screenshots/dashboard-mobile.png) · [Mobile overview](public/screenshots/portfolio-mobile.png)

## What it does

Private PDF upload → proposed fields and page evidence → decimal validation → explicit human correction/review → one or two independent reviewers → exactly one internal purchase-request record → in-app notification and signed, retryable test delivery.

No payments, real orders, agreements, supplier messages, OCR, currency conversion or general visual workflow builder.

## Start locally

Requires Node.js 24 and npm. Run commands **from the FlowOps folder**, never HelpDeskFlow.

```sh
npm ci
node scripts/setup-local.mjs
npm run db:generate
npm run fixtures
```

Terminal 1 (leave running):

```sh
npm run db:local
```

Terminal 2, first setup only:

```sh
npm run db:migrate
npm run db:seed
```

Then keep the web application and worker running in **separate terminals**:

```sh
npm run build
npm start
```

```sh
npm run worker
```

Open [local FlowOps](http://127.0.0.1:3100). The explicit seed writes five randomly generated fictional login accounts to ignored `.local/credentials.json`. A readable private copy is in .local/FlowOps-login-details.txt after handover. It refuses existing users and production/public-demo environments; it never runs automatically. Repeated seed commands preserve existing credentials.

For editing, use npm run dev instead of the compiled server. The production build is recommended on this low-memory Windows machine because the development compiler restarted under memory pressure. Use NODE_ENV=production for the worker when checking production behavior.

The local PostgreSQL-compatible PGlite database persists under `.local/postgres` on port 54330. It is development-only and binds to loopback. Its startup uses UTC and lower-memory WebAssembly compilation. Ordinary PostgreSQL can replace DATABASE_URL without changing the data model. This adapter is not evidence of hosted PostgreSQL concurrency or production load capacity.

## Verification

```sh
npm test
npm run evaluate
npm run typecheck
npm run lint
npm run build
```

`npm test` creates a **separate fresh test database**, private storage and private seed each run on port 54331, then checks database close/reopen persistence. It preserves the demonstration database. Run one copy at a time. The core tests exercise the worker directly; no permanently running worker is needed for those tests.

For browser tests, run the demonstration database, web server and worker first. Development mode exercises simulated failures. For the local production build, set FLOWOPS_E2E_PRODUCTION=true so the suite checks diagnostic rejection and a normal signed delivery instead. Then run:

```sh
npx playwright install chromium
npm run test:e2e
```

Browser tests create fictional workflow records and capture actual screenshots. The development path simulates two test-receiver failures; production checks that simulation is forbidden. Traces and credential-bearing screenshots are disabled. Do not run these against real data. See the actual results before claiming a check passed.

## Configuration

See [.env.example](.env.example). Keep all real configuration in ignored `.env`.

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | Persistent PostgreSQL connection; use UTC |
| BETTER_AUTH_URL | Exact app origin, locally http://127.0.0.1:3100 |
| BETTER_AUTH_SECRET | Random server-side session secret |
| STORAGE_DIR | Private persistent document root shared by web and worker |
| EXTRACTION_PROVIDER | mock (default) or live |
| OPENAI_API_KEY / OPENAI_MODEL | Optional live structured extraction; explicit model required |
| WEBHOOK_SECRET | Random HMAC secret shared with the controlled receiver |
| PUBLIC_DEMO | true blocks protected administration and manual retries |
| ALLOW_DEV_SIMULATION | true only in local development; NODE_ENV=production always disables simulation |

Use `npm run build` then `npm start` for a local production build. Keep the worker running separately. Production mode disables the failure simulation even if its flag is true. Hosted deployment needs persistent PostgreSQL, shared private storage and a durable worker host; web-only Vercel deployment is insufficient for this implementation.

## Documentation

[Requirements](docs/requirements.md) · [Architecture](docs/architecture.md) · [Data model](docs/data-model.md) · [Workflow](docs/workflows.md) · [Automation](docs/automation.md) · [AI evaluation](docs/ai-evaluation.md) · [Security](docs/security.md) · [Test plan](docs/test-plan.md) · [Results](docs/test-results.md) · [Bug log](docs/bug-log.md) · [User guide](docs/user-guide.md) · [Troubleshooting](docs/troubleshooting.md) · [Deployment](docs/deployment.md) · [Case study](docs/case-study.md) · [Demo script](docs/demo-script.md) · [Learning guide](docs/learning-guide.md) · [Handover](docs/handover.md) · [Progress](docs/progress.md) · [Changelog](CHANGELOG.md).

## Limitations

Mock parsing supports the labelled fictional fixtures; arbitrary PDF layouts require manual correction or the optional live provider. Selectable text only, up to 5 MB, ten pages and 24,000 text characters. Money is nonnegative decimal, at most two places; quantities allow six. Half-up rounding is applied per line before summing. LKR only.

No shared production rate-limit store, antivirus/CDR, OCR, email/password reset delivery, account provisioning UI, live AI validation, independent security review, load test or hosted worker verification is claimed. The role controls protect actions; hidden buttons are not authorization. See [security](docs/security.md) before any real-user deployment.
