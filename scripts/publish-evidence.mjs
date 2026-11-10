import { mkdir, readFile, writeFile } from "node:fs/promises";
await mkdir("public/evidence", { recursive: true });
const content = await readFile("docs/evaluation-results.json", "utf8");
await writeFile("public/evidence/evaluation-results.json", content);
console.log("Published mock evaluation data.");
