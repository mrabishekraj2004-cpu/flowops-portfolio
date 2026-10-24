# Workflow rules

The allowed transition map is in src/lib/quotation.ts; service and worker guards enforce the applicable transitions.

| State | Next step |
| --- | --- |
| Draft | Private upload is immediately queued as Processing |
| Processing | Needs Review, or Processing Failed after bounded technical retries |
| Processing Failed | Administrator retry to Processing; requester manual correction to Needs Review |
| Needs Review | Save human review, fix all validation issues, then submit to Pending Approval |
| Pending Approval | Independent approve/reject/request changes; owner edit returns to Needs Review and increments revision |
| Changes Requested | Owner correction creates a new revision in Needs Review |
| Approved | Purchase is already created transactionally; outbox delivery moves to Completed |
| Rejected | Terminal; create a new request for a new quotation |
| Completed | Terminal immutable purchase workflow |

Policy uses one base currency, LKR. Below threshold requires one eligible reviewer; at or above requires two. The ordered configured reviewer list determines assignments, excluding the requester, inactive users and users no longer in the reviewer role. Insufficient reviewers prevents submission. Each submission stores required count and assignment/version rows; later policy changes do not rewrite an existing submission.

Every decision requires an assigned active reviewer, current version, pending state and a meaningful reason. A requester cannot self-approve. Repeating the same decision/reason is idempotent; changing an existing decision is rejected. Final approval locks the request row, creates the unique internal Purchase and outbox transactionally, and never places an order.

Edits while pending invalidate prior-version assignments and approvals. History remains visible to permitted users, but only current-revision assigned reviewers can read the current document. Approved/completed information cannot be changed through the correction endpoint. Manual correction of a failed document prevents a later extraction retry from overwriting the review.
