export async function wakeWorker() {
  if (process.env.HOSTED_WORKER !== "workflow") return;
  const { start } = await import("workflow/api");
  const { processQueue } = await import("./hosted-workflow");
  try {
    await start(processQueue);
  } catch {
    console.error(
      "Hosted worker dispatch failed; persisted work awaits recovery.",
    );
  }
}
