# User guide

## Sign in
Start the local database, web and separate worker. Open http://127.0.0.1:3100. Use a fictional account from ignored .local/credentials.json. Keep this file private; never publish the administrator password.

## Requester
1. Choose Upload quotation, select a PDF from fixtures/pdfs, enter a meaningful title and category.
2. Processing refreshes automatically. If it stays queued, check that the worker is running.
3. Compare the original private PDF against proposed fields. Expand field evidence; missing evidence is labelled unavailable.
4. Correct missing or inconsistent fields. Enter a review reason and Save review & validate. This stores a separate revision.
5. Resolve all validation errors, then Submit for independent approval.
6. Follow the timeline and notifications. Respond to Changes Requested by saving a new revision and resubmitting.
7. Approved creates an internal purchase record. Completed means signed notification delivered. Neither places an order.

Image-only/encrypted/malformed documents eventually show Processing Failed. Enter fields manually from the original with a reason, or ask an administrator to retry a corrected processing environment. Approved/completed/rejected records are immutable through this interface.

## Reviewer
The Approval inbox contains assigned current-revision requests. Open a request, inspect PDF/fields/evidence/history, select Approve, Request changes or Reject and enter a reason. You cannot approve your own document or count twice. Above-threshold requests wait for a second distinct reviewer. A requester edit invalidates the prior submission.

## Administrator
Administration manages categories, LKR threshold, ordered reviewer pool, webhook destination and other users' roles. Your own role cannot be changed. Role changes revoke sessions. Ensure at least two active reviewer accounts are available.

Automation runs show attempts and terminal failures. Only FAILED work can be retried; manual corrections are protected from extraction overwrite. The controlled receiver shows unique events. In local development, simulate initial failures to demonstrate retries. Diagnostic changes and retries are disabled in public-demo mode.

Original comparison: Source text shows actual selectable text/page numbers from PDF.js, not an AI summary. PDF view and Open original PDF preserve access to the original formatting; browser PDF preview support varies.
