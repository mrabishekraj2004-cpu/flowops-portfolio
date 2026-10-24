# Data model

User → Request → Revision / Assignment / Decision / Audit / Job. Request has at most one Purchase. Purchase → Outbox → Delivery. ReceiverEvent is unique by event ID. Notification has a unique effect key and recipient user ID. Better Auth owns Account, Session and Verification.

## Important constraints
- User email unique; auth provider/account pair unique; role checked by SQL.
- Request storage key and display number unique; state/size/version/approval-count SQL checks.
- Revision unique by request/version; Assignment and Decision unique by request/reviewer/version.
- Purchase.requestId unique: duplicate clicks cannot create two internal purchases.
- Outbox.eventId, ReceiverEvent.eventId and Notification.key unique.
- Job.key unique per extraction request. Attempts and lease state are persisted.
- Category names unique; Policy is the single main configuration row.

JSON stores validated original proposals, current reviewed fields, source pages, revision snapshots and evidence. Originals are never overwritten after successful extraction. IDs in audit rows may be a human ID or worker; no invented human attribution.

## Monetary representation
All source/edited amounts remain decimal strings in JSON. Validation uses decimal.js, not binary floats. Quantities: up to six fractional places, positive. Unit prices and monetary totals: up to two places, nonnegative. Each quantity × price is rounded to two decimal places with ROUND_HALF_UP, then compared exactly. Sum of supplied line totals must equal subtotal; subtotal + tax must equal grand total. No automatic repair or exchange-rate conversion. Purchase total and threshold use PostgreSQL DECIMAL(18,2). Display formatting does not determine business arithmetic.

The migration is new-project creation only. Future changes must add migrations; do not reset existing databases. Test databases are separate, newly created private directories.
