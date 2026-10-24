import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
// OneDrive cloud reparse points can report neither isFile nor isDirectory to Playwright's scanner.
// Stage only the public test SOURCE into a regular OS-temp directory; credentials stay in the project.
const dir = await mkdtemp(path.join(os.tmpdir(), "flowops-browser-"));
const library = pathToFileURL(
  path.resolve("node_modules/@playwright/test/index.mjs"),
).href;
const source = (await readFile("tests/browser/workflows.spec.ts", "utf8"))
  .replaceAll('from "@playwright/test"', 'from "' + library + '"')
  .replaceAll('from \"@playwright/test\"', 'from "' + library + '"');
await writeFile(path.join(dir, "package.json"), '{"type":"module"}');
await writeFile(path.join(dir, "workflows.spec.ts"), source);
const child = spawn(
  process.execPath,
  [
    path.resolve("node_modules/@playwright/test/cli.js"),
    "test",
    ...process.argv.slice(2),
  ],
  {
    env: { ...process.env, FLOWOPS_BROWSER_TEST_DIR: dir },
    stdio: "inherit",
    windowsHide: true,
  },
);
child.on("error", () => {
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
