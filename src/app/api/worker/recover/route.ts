import { timingSafeEqual } from "node:crypto";
import { wakeWorker } from "@/lib/hosted";
export async function GET(request: Request) {
  const expected = Buffer.from("Bearer " + (process.env.CRON_SECRET ?? ""));
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return new Response("Unauthorized", { status: 401 });
  await wakeWorker();
  return Response.json({ queued: true });
}
