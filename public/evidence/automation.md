# Durable automation

Start npm run worker as a separate process. It polls PostgreSQL, recovers expired leases and processes one extraction and one outbox entry per cycle. No workflow work is detached inside a web request.

## Extraction jobs
Atomic UPDATE with SELECT … FOR UPDATE SKIP LOCKED claims a queued due row, increments attempts and assigns a random lease token. Lease duration: 90 seconds. PDF subprocess timeout: 25 seconds. Provider deadline: 30 seconds. Output/body/text limits are bounded. Completion compares current lease token and running state; stale completion has no effect. A recovery worker locks an expired job before returning it to the queue or recording terminal failure.

Maximum three extraction attempts. Retry delays are 1s, 2s, then terminal failure (the helper caps future delays at 60s). JobAttempt retains started/failed/interrupted/succeeded details. Worker failure logs omit document contents and credentials. A failed PDF may instead be entered manually; the original file remains available privately.

## Transactional outbox
The same transaction that creates the unique Purchase creates one in-app owner notification and one Outbox event. A crash cannot leave a committed purchase with no recorded delivery intent. Maximum four delivery attempts, 1/2/4-second backoff. A delivery timeout is 12 seconds. Owner inactivity and request state are checked before dispatch. Terminal delivery failure keeps the purchase Approved and is distinct from waiting for approval.

Manual retries are administrator-only, terminal-failure-only and disabled in PUBLIC_DEMO. Each retry starts a new bounded attempt cycle while preserving history. Extraction retries cannot overwrite a request already moved into human review.

## Signed receiver
Payload includes stable event ID, purchase/request IDs, internal number, currency and total. Each delivery has a distinct ID. HMAC-SHA256 signs timestamp.deliveryId.rawBody. Receiver checks signature in constant time, five-minute timestamp tolerance and body schema/size. ReceiverEvent uniqueness makes duplicate deliveries one effect. The controlled test://flowops destination uses the same signing and verification functions without a network loopback exception. /api/webhooks/test permits external HTTP signature verification tests.

External destinations are administrator-controlled public HTTPS DNS names, port 443, no URL credentials or IP literals. All resolved IPv4 addresses must be public; connection is pinned to a checked address while TLS uses the original hostname. Redirects are not followed. Private/reserved destinations are blocked. External internet delivery has not been verified unless recorded in results.

## Simulation
Only non-production, non-public-demo environments with ALLOW_DEV_SIMULATION=true may configure initial receiver failures. Set two failures, approve a fictional request, and inspect 503 → 503 → 200 deliveries with one purchase and one receiver event. NODE_ENV=production disables simulation even when the flag is set.

## Delivery semantics
At least once, not exactly once. A receiver may commit before a sender crashes; retry must use the same event ID. External receiver idempotency is that receiver's responsibility. No guarantees are claimed for a destination that ignores event IDs. Database/shared-storage backup, monitoring and worker supervision remain deployment responsibilities.
