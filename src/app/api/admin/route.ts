import { administration, configure, retry } from "@/lib/service";
import { respond, identity, body } from "@/lib/http";
export const GET = (r: Request) =>
  respond(async () => administration(await identity(r)));
export const POST = (r: Request) =>
  respond(async () => {
    const v = await body(r);
    return v.action === "retry"
      ? retry(await identity(r), v.input)
      : configure(await identity(r), v);
  });
