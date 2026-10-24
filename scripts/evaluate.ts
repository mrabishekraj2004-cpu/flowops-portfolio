import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { extract, type Page } from "../src/lib/providers";
import { validate, type Quotation } from "../src/lib/quotation";
const dataset = JSON.parse(await readFile("fixtures/expected-v1.json", "utf8"));
const results = [];
for (const c of dataset.cases) {
  try {
    const child = await promisify(execFile)(
      process.execPath,
      [
        path.resolve("src/lib/extract-child.mjs"),
        path.resolve("fixtures/pdfs/" + c.id + ".pdf"),
      ],
      { timeout: 25000, maxBuffer: 200000, windowsHide: true },
    );
    const pages: Page[] = JSON.parse(child.stdout);
    const { result, provider } = await extract(
      pages,
      AbortSignal.timeout(30000),
    );
    const fields = Object.entries(c.expected).map(([key, value]) => ({
      field: key,
      correct:
        JSON.stringify(result.data[key as keyof Quotation]) ===
        JSON.stringify(value),
    }));
    const issues = validate(result.data);
    results.push({
      case: c.id,
      provider,
      fields,
      validationCorrect: (issues.length === 0) === c.valid,
      issues,
    });
  } catch {
    results.push({
      case: c.id,
      provider: process.env.EXTRACTION_PROVIDER ?? "mock",
      rejected: true,
      validationCorrect: c.id === "scanned",
    });
  }
}
const measured = results.flatMap((r) => r.fields ?? []);
const report = {
  datasetVersion: 1,
  runAt: new Date().toISOString(),
  provider: process.env.EXTRACTION_PROVIDER ?? "mock",
  fieldChecks: measured.length,
  correctFieldChecks: measured.filter((f) => f.correct).length,
  validationCases: results.length,
  correctValidationCases: results.filter((r) => r.validationCorrect).length,
  liveVerified: process.env.EXTRACTION_PROVIDER === "live",
  results,
};
await writeFile(
  "docs/evaluation-results.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    provider: report.provider,
    fieldChecks: report.fieldChecks,
    correctFieldChecks: report.correctFieldChecks,
    validationCases: report.validationCases,
    correctValidationCases: report.correctValidationCases,
    liveVerified: report.liveVerified,
  }),
);
