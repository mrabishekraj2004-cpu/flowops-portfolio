import { upload } from "@/lib/service";
import { respond, identity, origin, limitedBytes } from "@/lib/http";
import { AppError, actor, requester } from "@/lib/access";
export const POST = (r: Request) =>
  respond(async () => {
    origin(r);
    const id = await identity(r);
    requester(await actor(id));
    const bytes = await limitedBytes(r, 6 * 1024 * 1024);
    const form = await new Response(bytes, {
      headers: { "Content-Type": r.headers.get("content-type") ?? "" },
    }).formData();
    const file = form.get("document");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
      throw new AppError(400, "Choose a PDF of at most 5 MB.");
    return upload(id, {
      title: String(form.get("title") ?? ""),
      categoryId: String(form.get("categoryId") ?? ""),
      name: file.name,
      mime: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
  });
