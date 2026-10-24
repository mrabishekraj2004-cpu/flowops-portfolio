import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdir } from "node:fs/promises";
await mkdir(".local/postgres", { recursive: true });
const db = new PGlite(".local/postgres");
await db.waitReady;
await db.exec("SET TIME ZONE 'UTC'");
const server = new PGLiteSocketServer({
  db,
  host: "127.0.0.1",
  port: 54330,
  maxConnections: 20,
});
await server.start();
console.log(
  "FlowOps local PostgreSQL-compatible database: 127.0.0.1:54330. Persistent data in .local/postgres. Keep private.",
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
