import { actor, visible } from "@/lib/access";
import { identity, respond } from "@/lib/http";
import { storage } from "@/lib/storage";
export async function GET(r: Request, c: { params: Promise<{ id: string }> }) {
  let response: Response | undefined;
  const error = await respond(async () => {
    const user = await actor(await identity(r));
    const document = await visible(user, (await c.params).id);
    const bytes = await storage.get(document.storageKey);
    response = new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="quotation.pdf"',
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
    return { ok: true };
  });
  return response ?? error;
}
