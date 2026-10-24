# Security and limitations

## Implemented controls
Better Auth hashed passwords and database sessions; public registration disabled. Server-side active user/role checks on every API path, document read/download and protected mutation. Requester ownership and current-revision reviewer assignment checks. Self-role changes and self-approval blocked. Role changes delete sessions. Same-origin JSON/multipart mutation checks. Password forms use POST even without JavaScript.

PDF MIME/extension/signature, 5 MB file, 6 MB multipart body, ten-page and 24,000-text-character limits. Streaming body bounds apply before parsing. Random storage keys are validated; uploads never enter public/. Files return private/no-store headers through authenticated downloads. PDF parsing runs in a timed subprocess; uploaded PDF JavaScript is not executed by the application. SHA-256 records identify originals. This is not malware scanning or content disarm.

Zod validates extraction and human inputs. Decimal arithmetic and explicit state/version guards prevent unresolved or stale approval. Request-row locks, unique purchase/decision/outbox/effect keys and lease-token comparison protect repeat effects. Admin-controlled signed webhooks reject private destinations and invalid signatures; no document text selects destinations or tools.

## Secrets and data
.env, .local, credentials, uploaded files, test databases, traces and dependency/build folders are ignored. Fictional fixtures and actual sanitized screenshots may be committed. Seed is explicit and refuses production; administrator credentials must never be published. Neither documentation nor logs should contain real passwords or provider keys. Browser tests disable traces because they can capture login request bodies.

## Deployment gaps and unverified claims
This is a portfolio demonstration. No independent security audit, penetration/load/concurrency certification, malware scanner/CDR, shared distributed rate limits, production account recovery, retention UI, multi-tenant isolation, live AI validation or hosted worker verification is claimed. Better Auth rate limiting is process-local. External webhook allowlisting/signature verification, outbound firewall controls, secret rotation, backups, shared storage ACLs and operational alerts need deployment review. Hosted PostgreSQL multi-client concurrency must be verified separately from the constrained local socket adapter.

Only fictional documents should be used. No actual supplier messages, payments or orders. Set PUBLIC_DEMO=true and ALLOW_DEV_SIMULATION=false for a public demonstration; NODE_ENV=production independently disables diagnostic failure controls. Keep administrator access private.

## Hosted portfolio boundary
Public pages are accessible without Vercel account sign-in, explicitly approved by the owner. Workspace/API login and authorization remain required. Private hosted PDFs are PostgreSQL BYTEA rows; they are never public assets. Parser copies use unique temporary directories and are deleted after parsing. Hosted upload limit is 4 MB. Three random hosted secrets and demo passwords are kept in ignored private files and Vercel settings; the publication scanner includes these actual values. Signup and unsafe public controls remain disabled. Authentication rate limits are process-local; this fictional portfolio does not claim hardened shared rate limiting or independent security certification.
