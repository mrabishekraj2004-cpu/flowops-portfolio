# Troubleshooting

| Symptom | Check and fix | Verify |
| --- | --- | --- |
| Cannot sign in | Run explicit seed once; use private local accounts; confirm exact BETTER_AUTH_URL origin | Browser redirects to workspace; anonymous bootstrap returns 401 |
| Jobs never start | Start separate npm run worker; check database connectivity and UTC | Job attempts increase; request enters Needs Review |
| Database out of memory | Stop duplicate FlowOps processes; use provided lower-memory db:local script; avoid concurrent build/test/evaluation | Startup prints loopback port; migration succeeds |
| Address already in use | Run one database on 54330 and one test runner on 54331 | Stop only the duplicate process you started; never another project's database |
| Missing native package | npm ci must include platform optional dependencies | esbuild/Next/PDF parser starts |
| PDF fails | Confirm selectable text, real PDF, not encrypted, <=5 MB, <=10 pages and bounded text | Use clean.pdf; use manual entry after terminal failure |
| Cannot submit | Save a human review first; resolve required fields, arithmetic, date and LKR errors | Validation passed and current revision exists |
| Reviewer sees no inbox item | Check current role, active status, ordered configured reviewers and submission revision | Assigned reviewer can open file; other user cannot |
| Approval seems stuck | High-value requests need two distinct current-revision approvals | Decision history shows both; one Purchase exists |
| Approved but not Completed | Inspect outbox attempts, destination and failure simulation | Delivery SUCCEEDED; event ID has one receiver effect |
| Webhook rejected | Raw body, timestamp, delivery ID and shared HMAC secret must match; public HTTPS destination only | Invalid signatures stay 401; retries keep event ID |
| Stale edit / decision | Another revision or decision committed | Reload; compare current evidence before acting |
| Live provider fails | Configure explicit model/key, verify structured-output support and limits | Run live evaluation separately; do not relabel mock results |

Keep diagnostics free of secrets and uploaded content. Never resolve a problem by deleting the database, disabling server permissions or exposing local storage publicly.

## OneDrive and generated files

Windows cloud reparse points can hide tests from file discovery or block cleanup of generated Next.js output. The browser wrapper stages only test source in OS temp. prepare-runtime.mjs uses a project-specific generated cache through the ignored .flowops-runtime directory on OneDrive Windows paths, with a separate dependency link outside the cleaned build folder. Source, credentials, documents and database data remain in FlowOps. No cache directory contains user data. If the OS clears temp, rebuild before npm start. Do not remove the private document/database directories.
