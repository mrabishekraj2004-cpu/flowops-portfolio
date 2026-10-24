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
