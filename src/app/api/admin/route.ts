import { wakeWorker } from "@/lib/hosted";
import { administration, configure, retry } from "@/lib/service";
import { respond, identity, body } from "@/lib/http";
export const GET = (r: Request) =>
  respond(async () => administration(await identity(r)));
export const POST = (r: Request) =>
  respond(async () => {
    const v = await body(r);
    const result =
      v.action === "retry"
        ? await retry(await identity(r), v.input)
        : await configure(await identity(r), v);
    await wakeWorker();
    return result;
  });
