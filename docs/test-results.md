# Actual verification results

## Hosted release — 24 October 2026

Verified source: 1665eaa55713ecf1e83ed7c1436a855f4b06960f. Public URL: https://flowops-portfolio.vercel.app. GitHub: https://github.com/mrabishekraj2004-cpu/flowops-portfolio. Vercel reported Ready and assigned the public alias. The first hosted build compiled but failed output packaging; the subsequent .next-on-Vercel fix deployed successfully.

| Check | Executed result |
| --- | --- |
| Updated local core suite | 15 passed, 0 failed; fresh isolated database; 14 fictional requests survived stop/reopen |
| Hosted private storage test | PostgreSQL BYTEA roundtrip, invalid key/file rejection, authenticated shared-storage extraction and deletion passed |
| Release checks | Typecheck, lint and production build passed; Zod and Undici overrides resolved workflow transitive advisories; production audit reported 0 vulnerabilities |
| Live HTTP/browser suite | 3 passed, 0 failed against the public Vercel URL using separate private hosted fictional accounts |
| Live business workflow | Login, private PDF upload, source extraction/evidence, saved human review, one independent approval, unique purchase/outbox, signed controlled notification and Completed state passed |
| Live permissions/UI | Anonymous access denied; another requester denied access to the request/private PDF; requester administration and reviewer upload denied; wrong origin denied; invalid webhook signature denied; production simulation denied; mobile layout and sign-out passed; no-JavaScript form kept password out of URL |
| Live high-value verification | Required two distinct reviewers; self-approval 403; first approval kept Pending Approval with no purchase; concurrent duplicate final decisions both 200; exactly two approval decisions, one purchase/outbox and SUCCEEDED delivery with Completed request |
| Public/recovery access | Landing and login 200; anonymous bootstrap and cron recovery 401 |
| Screenshots | Captured from the live app; desktop source-review view visually inspected |

The hosted checks use ordinary Neon PostgreSQL and actual Vercel Workflow processing; they are not a production load/concurrency certification. Live AI, OCR, external internet webhook delivery, independent security review and shared production rate limiting remain outside these results. No real supplier or payment was contacted. Hosted operation remains subject to free-plan quotas and daily recovery delay if dispatch fails. No destructive database reset or paid upgrade was performed.

## Initial local delivery (historical)

Tested application: **FlowOps 1.0.0**, local initial delivery, 24 October 2026. Tested source snapshot: 55e87be9858c32e299ad5073feb48f4b1a966c35. No public deployment or live AI access was used.

## Environment and boundaries

Windows; Node.js 24.17.0; Next.js 16.4.2; Prisma 7.10.1; PDF.js 6.4.299; pdf-lib 1.17.1; decimal.js 10.6.0; Chromium through Playwright. Database: PGlite with PostgreSQL socket adapter, explicit UTC and constrained local connection pool. Local simultaneous callers are tested, but these results do not certify ordinary hosted PostgreSQL multi-client concurrency or production load capacity.

## Final executed checks

| Check / command | Actual result |
| --- | --- |
| prisma migrate deploy | Initial schema and SQL constraints applied successfully to new FlowOps and isolated test databases |
| Explicit local seed | Five randomly generated fictional accounts, categories and approval policy; credentials excluded from source |
| npm test | 14 tests passed, 0 failed in a new isolated database; demonstration data preserved |
| Database stop/reopen | 13 fictional test requests remained stored after close/reopen |
| Actual worker process stop/start | Queued request persisted as Processing while the worker was stopped; restarted worker moved it to Needs Review with SUCCEEDED extraction |
| npm run evaluate | Deterministic mock: 16/16 selected field checks, 8/8 validation/rejection outcomes; per-case JSON retained |
| npm run typecheck | Passed, exit 0 on final source |
| ESLint final source check | Passed, exit 0 with no final errors or warnings |
| npm run build | Passed; compiled routes and TypeScript checks succeeded using isolated generated output |
| Production HTTP/browser suite | 3 passed, 0 failed; compiled web server and separate worker in production mode |
| Production dependency audit | npm audit --omit=dev --audit-level=high: 0 known vulnerabilities |
| Full dependency audit | npm audit --audit-level=high: 0 known vulnerabilities |
| Signed HTTP receiver check | Valid request 200; repeated event with a new delivery ID 200/duplicate=true; exactly one receiver event |
| Build trace privacy review | 13 trace manifests inspected; no .local, real .env or credential-file paths found |
| Staged private-data review | 95 staged files reviewed; actual local/demo/test secrets and excluded paths absent |
| Screenshot inspection | Actual desktop review/dashboard, run history and mobile screenshots captured and inspected; fictional data only |

## Core suite scenarios

Authentication/role checks; requester isolation and file authorization; role escalation/self-role denial; PDF MIME/signature/size/category checks; extraction schema; required fields; real dates; exact-decimal line/subtotal/tax arithmetic; LKR consistency; missing/unsupported evidence; injected instructions treated as data; provider timeout and controlled failure; explicit human review; immutable original proposals; one/two independent reviewers; self/unauthorized approval denial; repeated/concurrent decisions; one unique Purchase/Outbox; edits invalidate prior approvals; changes/rejection; expired worker lease recovery and stale completion; malformed/image-only retry exhaustion; protected manual retry; manual-entry protection; signed/tampered/expired receiver requests; duplicate receiver effects; retry exhaustion and recovery; public-demo/production diagnostic restrictions and unsafe destination rejection.

The development-only retry scenario executed 503 → 503 → 200 with one purchase and one receiver effect. It was tested in the isolated development core suite. The final production browser run instead verified that the simulation endpoint returns 403 and normal signed notification succeeds. These are distinct checks, not a claim that production diagnostics were enabled.

## Actual browser story

Requester signed in, uploaded the real clean fixture PDF, inspected literal field evidence and the actual parsed original text, saved review, submitted, then an independent reviewer approved. One internal purchase record and signed notification were displayed; the workflow reached Completed. Administrator run history loaded. Anonymous/other-user file access, role/origin checks, invalid signatures and sign-out were checked over HTTP. A no-JavaScript form check confirmed credentials submit by POST without a URL query. Desktop 1440×1000 and mobile 390×844 captures were inspected; the final mobile document had no horizontal overflow. This is not a full screen-reader or WCAG audit.

## Observed failures and unperformed work

Earlier install/database/test attempts encountered memory pressure, a local timezone scheduling defect, PDF.js API changes, a queue-claim regression, cloud-file test discovery/build cleanup, accessible-label and stale-loading defects, and mobile overflow. Corrections and retests are in bug-log.md. Final outcomes above supersede the failed attempts; they do not erase them.

Not executed/claimed: live-provider calls or accuracy, OCR, external internet webhook delivery, public hosting, ordinary PostgreSQL multi-client verification, load/penetration testing, independent security/accessibility audit, real-user/supplier operations, payments or orders. npm's audit is not a security certification.

## Portfolio defect follow-up — 24 October 2026
Local checks executed: typecheck, lint and production build passed; 16 isolated core tests passed, including case-insensitive labels, Date alias, separate item fields, literal evidence, repeated-label ambiguity and orphan-field rejection. Dataset v2 adds the reported label format while preserving v1; actual PDF-parser evaluation passed 24/24 selected field checks and 9/9 validation/rejection outcomes. Browser regressions now assert the previously missed fields, mock limitations, completed-state guidance and deployed homepage copy. Live follow-up source 248cd470c2a3a5272b597ff371f0cce7f9e7cd64 verified: all four HTTP/browser tests passed (0 failures) against https://flowops-portfolio.vercel.app. The labelled-fields PDF populated quotation reference, Date, item description/quantity/unit price/line total and grand total before any human edit. The completed review explicitly showed review/approvals complete and notification delivered; the old still-required message was absent. Homepage deployment copy and mock limitations were asserted. Existing approval, private-file, origin, signature, production diagnostics, mobile and sign-out checks passed. Actual screenshots were refreshed and the source/field review image visually inspected. The first run hit transport ECONNRESET during sign-in; Vercel recorded HTTP 200 and a direct login passed. The final run used at most two transport retries for sign-in only; HTTP failure assertions were not weakened. Existing approved/completed records and original proposals are not rewritten.
