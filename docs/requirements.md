# Requirements and acceptance criteria

## Scope
One fictional Northstar Studio organisation processes supplier quotation PDFs into internal purchase requests. No supplier communication, payments or orders. Core runs without paid AI.

## Roles
- Requester: own uploads/downloads, human corrections, submissions, permitted history and notifications.
- Reviewer: current-revision assigned documents only; original-versus-proposal comparison; approve, reject or request changes with a reason. Never own requests.
- Administrator: categories, LKR threshold, ordered reviewer pool, controlled webhook destination, role changes, audit/run inspection and eligible manual retry. Cannot change own role. Role changes revoke sessions.

## Acceptance
1. Invalid MIME/signature/size is rejected server-side; files never enter public/.
2. Original PDF and extraction remain unchanged. Corrections create versioned records with actor/reason/time.
3. Required fields, real dates, positive quantities, decimal arithmetic and LKR consistency are checked server-side. Missing evidence is explicitly unavailable; no confidence probabilities.
4. Every submission requires an explicitly saved human review and no validation issues.
5. Below threshold: one independent reviewer. At or above: two distinct reviewers. Not enough eligible reviewers blocks submission.
6. Material edit while pending increments version, clears submission and requires new decisions. Approved/completed/rejected records cannot be silently edited.
7. Final approval atomically creates one purchase record, one owner notification and one outbox event. Unique constraints and row locking prevent duplicate effects.
8. Persistent worker jobs/outbox have leases, deadlines, bounded exponential retries, terminal failure, visible attempts and protected retry.
9. Signed test notifications verify timestamp, delivery ID and HMAC; event-ID uniqueness prevents duplicate receiver effects.
10. UI supports keyboard operation, labelled controls, visible errors, responsive layout, source evidence and actual stored figures.

Live AI, external HTTPS delivery and public hosting are separate integrations. Their existence in source is not evidence of executed verification.
