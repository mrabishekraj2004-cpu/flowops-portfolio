# Learning guide

Practise explaining these ideas in your own words:

1. **Authentication vs authorization:** a session says who is signed in; ownership, role and current assignment say what they may do. A hidden button proves neither.
2. **Validation vs extraction:** extraction proposes values. Validation checks required facts and exact arithmetic. Human review owns the final correction.
3. **Decimal money:** binary floating point can misrepresent currency fractions. This project keeps decimal strings and rounds line multiplication half-up to two places.
4. **State machine:** Processing is technical work; Pending Approval is a human wait; Processing Failed is a terminal technical failure. They need different next steps.
5. **Transaction:** final approval, unique purchase, in-app notification and outbox intent commit together or roll back together.
6. **Idempotency:** the same input/operation repeated should not create a second purchase or receiver effect. Unique keys and checked leases enforce it.
7. **Lease and recovery:** a worker temporarily claims a persistent row. If it stops, the lease expires. A new worker can retry; an old token cannot commit late results.
8. **Outbox:** store delivery intent beside the business record before sending. Delivery can happen more than once, so receivers deduplicate event IDs.
9. **Webhook signature:** HMAC proves shared-secret possession over the exact body and delivery metadata. It is not a substitute for safe destinations or access control.
10. **Prompt injection:** document text is data, not permission to call tools or approve. The provider has no approval tools, and server rules validate its output.
11. **Evidence:** sixteen mock field checks are a small repeatable exercise, not a universal AI accuracy figure. Local tests are not production concurrency certification.
12. **Operations:** web, database, storage and worker are separate responsibilities. A live web page does not prove the worker is running.

Interview practice: draw the architecture; trace one request; explain a failure and recovery; find the unique purchase constraint; point to a test that blocks a forbidden action; describe AI assistance honestly and what you still need to learn.
