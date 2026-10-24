import "dotenv/config";
import { tick } from "../src/lib/worker";
import { db } from "../src/lib/db";
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    stopping = true;
  });
console.log(
  "FlowOps durable worker started. Polling persisted jobs and outbox; no work runs inside web requests.",
);
while (!stopping) {
  try {
    if (!(await tick())) await new Promise((r) => setTimeout(r, 1000));
  } catch {
    console.error(
      "Worker cycle failed; database connectivity or configuration needs attention.",
    );
    await new Promise((r) => setTimeout(r, 2000));
  }
}
await db.$disconnect();
