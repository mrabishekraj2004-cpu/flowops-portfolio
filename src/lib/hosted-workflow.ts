import { sleep } from "workflow";
async function cycle() {
  "use step";
  const { tick } = await import("./worker");
  const { db } = await import("./db");
  await tick();
  const [jobs, deliveries] = await Promise.all([
    db.job.count({ where: { state: { in: ["QUEUED", "RUNNING"] } } }),
    db.outbox.count({ where: { state: { in: ["QUEUED", "RUNNING"] } } }),
  ]);
  return jobs + deliveries;
}
export async function processQueue() {
  "use workflow";
  for (let attempt = 0; attempt < 120; attempt++) {
    if (!(await cycle())) return;
    await sleep("2s");
  }
}
