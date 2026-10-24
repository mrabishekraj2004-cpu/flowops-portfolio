# Observed bug log

| Issue | Observed evidence | Correction | Retest |
| --- | --- | --- | --- |
| npm/default WASM memory allocation failed | Fatal Node/V8 and esbuild allocation errors on low-memory Windows host | Bounded npm concurrency, restore optional runtimes, lower-memory WASM settings and avoid overlapping heavy tasks | Dependency install and database startup succeeded; core suite later passed |
| PDF.js 6 API mismatch | TypeScript rejected isEvalSupported and PDFDocumentProxy.destroy | Use supported loading-task API; destroy the loading task | Clean PDF extraction and mock evaluation passed |
| Local timezone delayed queued work by five hours | DB timezone Etc/GMT+5 and NOW differed from application timestamps; jobs stayed queued | Explicit UTC before local socket starts; isolated test database also UTC | Thirteen core checks passed after correction |
| Unnecessary parser transpiler subprocess used extra memory | esbuild failed to allocate memory during PDF test children | Plain .mjs PDF parser subprocess, no tsx compiler for each PDF | Core suite passed, including malformed/scanned attempts |
| Reviewer choice sorted random IDs instead of configured order | Review tests could target the other seeded reviewer | Preserve policy reviewer list order | One-reviewer and two-reviewer tests passed |
| Final lint findings | Mutable declaration, unescaped apostrophe, unused imports and internal navigation warning | const, JSX escape, remove imports, Next router | Final retest pending |

No unobserved defect or invented business impact is listed. Code-review hardening also added body-stream bounds, current-revision reviewer visibility and protection against stale retry/recovery effects; final regression is recorded separately in test-results.md.

Further observed defects and corrections:

- Shared queue claim tried to update an updatedAt column absent on Outbox; removed that shared assignment. The final 14-test core regression passed.
- An unreferenced abort timer made the provider-timeout test nondeterministic; used an explicit referenced test timer. The final 14-test regression passed.
- Better Auth correctly returned 429 during rapid role setup; tests now wait/retry instead of weakening rate limits.
- Category selector name included its option text; added an explicit accessible name. Browser upload passed after correction.
- Overlapping/stale workspace loads could clear opened details. Generation checks and non-overlapping polling fixed the loading behavior; the production workflow passed.
- A visually hidden table header escaped its scroll container, causing 637px document width on a 390px viewport. Positioned the scroll container; preview and subsequent browser run verified 390px width.
- OneDrive cloud files reported isSymbolicLink rather than isFile, hiding browser tests. The runner now stages only test source in OS temp; discovery and three browser/HTTP tests passed.
- OneDrive blocked generated build cleanup with EPERM. An isolated generated-output cache avoids synced build files. Its first layout missed runtime module resolution; a dependency parent was added and the production build passed.
- Headless Chromium could not render the embedded PDF. An actual parsed-source-text view was added beside the fields, with original PDF access retained; final browser verification is recorded in test-results.md.

Final retests: lint/typecheck/build passed after the source-text view; all three final production HTTP/browser checks passed, including literal original text beside the fields and mobile overflow. Actual screenshots were recaptured and inspected. No unresolved failed mandatory local check remains.
