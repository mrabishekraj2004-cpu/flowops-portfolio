# Changelog

## 1.0.0 — local implementation
- Created a separate FlowOps project; preserved HelpDeskFlow.
- Added private PDF upload/text processing, page evidence and immutable original extraction.
- Added exact-decimal validation, human corrections and versioned independent approval rules.
- Added transactional unique internal purchase record, notifications and delivery outbox.
- Added durable worker leases, bounded retries/recovery, signed controlled webhook receiver and development-only failure simulation.
- Added role-specific responsive UI, fictional dataset, optional live extraction interface, tests and operational documentation.
- Corrected observed local timezone scheduling and parser-runtime compatibility issues.

Verification status is in docs/test-results.md. No public deployment or live AI result is implied.

### Verified delivery corrections
- Fixed UTC queue scheduling, configured reviewer ordering, stale-worker/retry effects and duplicate-label ambiguity.
- Added bounded multipart/JSON/webhook streams, current-revision reviewer access and readable missing evidence.
- Corrected selector labelling, non-overlapping/stale-response polling and mobile hidden-header overflow.
- Added original parsed-text/PDF review choices and actual inspected screenshots.
- Added OneDrive-safe test discovery and dedicated generated runtime output.
- Final evidence: 14 core tests, 3 production HTTP/browser checks, explicit typecheck/lint/build, zero known audit findings and mock-only evaluation. Public hosting and live extraction remain unverified.

## Hosting preparation — 2026-10-24
- Published the separate FlowOps repository and linked its own Vercel project.
- Provisioned a free Neon database; explicit user-approved migration and fictional account setup completed.
- Added private PostgreSQL PDF storage, temporary parser input cleanup, Vercel Workflow dispatch and daily protected recovery. Hosted upload limit is 4 MB to fit platform request limits; local limit remains 5 MB.
- Type checking and 15 isolated core tests passed, including private database storage and extraction. Live release verification pending.

## Hosted release verified — 2026-10-24
- Full app live at https://flowops-portfolio.vercel.app; separate public source repository connected to Vercel.
- 15 core checks, 3 live browser/HTTP checks and live two-reviewer/duplicate approval verification passed.
- Updated actual screenshots, deployment/operation/security guides and executed evidence; private login handover remains ignored.

## Portfolio corrections — 2026-10-24
- Corrected the homepage deployment claim and made review guidance depend on request/review/delivery state.
- Added mock-v2 case-insensitive known labels, Date alias and separately labelled item blocks; retained explicit no-AI/no-OCR/layout limitations and immutable historical proposals.
- Added dataset v2 and parser/browser regressions. Executed 16 core tests and 24/24 selected field checks with 9/9 validation/rejection outcomes. Local production build passed; all four live HTTP/browser regressions passed. The reported label format, completed-state message, deployment copy and visible mock limitations were verified.
