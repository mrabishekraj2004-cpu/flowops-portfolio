import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdtemp, mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
await mkdir(".local", { recursive: true });
const root = await mkdtemp(path.resolve(".local/test-"));
const env = {
  ...process.env,
  DATABASE_URL: "postgresql://postgres@127.0.0.1:54331/flowops_test",
  STORAGE_DIR: path.join(root, "documents"),
  CREDENTIAL_FILE: path.join(root, "credentials.json"),
  PUBLIC_DEMO: "false",
  ALLOW_DEV_SIMULATION: "true",
  EXTRACTION_PROVIDER: "mock",
};
let data = new PGlite(path.join(root, "postgres"));
await data.waitReady;
await data.exec("SET TIME ZONE 'UTC'");
const server = new PGLiteSocketServer({
  db: data,
  host: "127.0.0.1",
  port: 54331,
  maxConnections: 20,
});
await server.start();
async function run(args: string[]) {
  return new Promise<number>((resolve) => {
    const p = spawn(process.execPath, args, {
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    p.on("error", () => resolve(1));
    p.on("exit", (code) => resolve(code ?? 1));
  });
}
let code = 1;
try {
  if (await run(["node_modules/prisma/build/index.js", "migrate", "deploy"]))
    throw Error("Test migration failed.");
  if (await run(["--import", "tsx", "prisma/seed.ts"]))
    throw Error("Test seed failed.");
  code = await run([
    "--import",
    "tsx",
    "--test",
    "--test-concurrency=1",
    "tests/core.test.ts",
  ]);
  const before = await data.query<{ count: number }>(
    'SELECT count(*)::int AS count FROM "Request"',
  );
  await server.stop();
  await data.close();
  data = new PGlite(path.join(root, "postgres"));
  await data.waitReady;
  const after = await data.query<{ count: number }>(
    'SELECT count(*)::int AS count FROM "Request"',
  );
  if (before.rows[0].count !== after.rows[0].count)
    throw Error("Restart persistence failed.");
  console.log(
    "Database stop/reopen persistence passed: " +
      after.rows[0].count +
      " fictional requests preserved.",
  );
} catch (e) {
  console.error(e instanceof Error ? e.message : "Test harness failed.");
  code = 1;
} finally {
  try {
    await server.stop();
  } catch {}
  await data.close();
}
process.exitCode = code;
