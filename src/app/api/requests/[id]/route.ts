import { detail, edit, submit, decide } from "@/lib/service";
import { respond, identity, body } from "@/lib/http";
import { AppError } from "@/lib/access";
type Context = { params: Promise<{ id: string }> };
export const GET = (r: Request, c: Context) =>
  respond(async () => detail(await identity(r), (await c.params).id));
export const PATCH = (r: Request, c: Context) =>
  respond(async () => {
    const v = await body(r),
      id = await identity(r),
      requestId = (await c.params).id;
    if (v.action === "edit") return edit(id, requestId, v.input);
    if (v.action === "submit") return submit(id, requestId);
    if (v.action === "decide") return decide(id, requestId, v.input);
    throw new AppError(400, "Unknown action.");
  });
