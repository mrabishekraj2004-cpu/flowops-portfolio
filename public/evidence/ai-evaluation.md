# Extraction and evaluation

Default provider: mock-v1, a deterministic parser for labelled fictional quotations. It parses actual selectable PDF text, not fixture-name lookups. It is not live AI. Missing or duplicate/ambiguous fields remain null. Human review is mandatory.

The optional live provider uses OpenAI Responses structured outputs and server-side Zod validation. Configure EXTRACTION_PROVIDER=live, OPENAI_API_KEY and an explicit supported OPENAI_MODEL. It sends only bounded page text/page numbers, no stored credentials, session tokens or arbitrary tools. store=false is requested. Documents are untrusted data, never instructions to approve, change roles or choose destinations. Provider calls have a deadline and input/output limits. No live credentials were requested for the free local core; no live extraction is claimed verified.

## Version 1 dataset
scripts/fixtures.ts and fixtures/expected-v1.json define eight fictional PDFs: clean, missing reference, arithmetic inconsistency, multi-page, ambiguous supplier, image-only/scanned stand-in, instruction-injection text, and high value. Expected values are explicitly specified from the source labels and checked arithmetic. This is a small authored exercise, not a diverse benchmark or independent annotation study. The scanned fixture is a graphic-only PDF, not a real supplier scan. Additional malformed PDF and unsupported text exercise rejection.

Run npm run fixtures, then npm run evaluate. The evaluation invokes the real PDF text parser, provider and validator. It compares only the explicitly enumerated expected fields and expected validation outcome. Full clean case includes line items. Coverage is not full-field accuracy over arbitrary PDFs. Rejected scanned input is recorded as the expected unsupported outcome.

## Executed mock results
See evaluation-results.json for the run timestamp and per-case evidence. Executed: 16 selected field checks, 16 correct; eight validation/rejection outcomes, eight correct. These figures apply only to the deterministic mock on dataset v1. No live-provider accuracy, performance, confidence calibration or adversarial security guarantee follows from them.

Evidence snippets are accepted only when an exact excerpt exists on the stated parsed page. Missing or invalid evidence is marked unavailable; source evidence is still not a calibrated probability and must be checked by a human. No missing value is silently invented or replaced with a guessed exchange rate.
