# Test plan

1. Core isolated suite: npm test. New private test database/storage each run, five fictional accounts. Authentication identity, ownership/file authorization service, upload MIME/signature/size/category checks, schema/date/decimal/currency validation, injected instruction handling, unavailable evidence and provider abort.
2. Approvals: explicit review required, unresolved fields blocked, original extraction retained, one-vs-two reviewer rules, distinct reviewers, self/unauthorized decision rejection, concurrent/repeated actions and exactly one Purchase/Outbox. Pending edit invalidates previous revision. Changes and rejection require reasons.
3. Reliability: expired worker lease, stale/duplicate completion, malformed/image-only retries, terminal states and protected retry; signed/tampered/expired webhooks, duplicate event effects, controlled initial failures, retry exhaustion and recovery. Test harness closes/reopens its persisted database and compares stored request count.
4. HTTP/browser suite: start separate demo DB/web/worker, npm run test:e2e. Verify actual sessions and file endpoints, cross-user denial, origin rejection, role protections, invalid signature, real PDF upload/review/approval, two simulated receiver failures then success, one recorded effect, desktop/mobile rendering and sign-out. No-JavaScript login must submit in POST body, never URL.
5. Evaluation: npm run evaluate. Report mock and live separately. No live credential means live results remain unverified.
6. Quality: npm run typecheck, npm run lint, npm run build, npm audit. Inspect actual screenshots before delivery.

Do not reset the demo database or delete user uploads to rerun tests. Core test data is isolated. Browser tests add labelled fictional demonstration records to the local demo only. Do not run tests against real records or a public deployment without a separate test environment.
