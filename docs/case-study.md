# FlowOps case study

## Problem
A fictional studio receives quotation PDFs. Values need checking, decisions need independence, and notification failures should not create duplicate purchase requests.

## Implementation
The original document is private. A bounded worker parses selectable text, proposes fields and attaches page excerpts. Decimal validation flags inconsistencies instead of repairing them invisibly. Humans save corrections separately and submit a version. Threshold rules assign one or two independent reviewers. Final approval transactionally creates one internal Purchase and Outbox event. Signed deliveries retry and a receiver deduplicates by event ID.

## Contribution and learning
Abishek Akash is seeking a first IT opportunity in Colombo. AI assisted implementation, interface, tests and documentation. The project demonstrates workflows to practise and explain; it does not establish independent authorship of every line, employment, customers or measured business improvement.

## Evidence
See actual test-results.md and evaluation-results.json. Core local tests exercise permissions, arithmetic, approvals, stale leases, retry exhaustion and duplicate delivery. Screenshots must come from the running app; no fabricated dashboard figures or accuracy claims.

## Tradeoffs
One organisation and one currency keep business rules understandable. A SQL queue/outbox avoids another service and stays persistent. A dedicated worker requires separate deployment operations. Private filesystem storage is simple locally but must be shared/persistent on a host. The deterministic parser makes a no-cost repeatable demo; arbitrary layouts and live AI still need human review and separate evaluation.

## Limitations
No OCR, supplier communication, order placement, payment, live AI validation, external delivery verification, independent security/load assessment or hosted PostgreSQL concurrency evidence is claimed unless recorded later.
