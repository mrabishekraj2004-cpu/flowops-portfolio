import { auth } from "./auth";
import { AppError } from "./access";
import { ZodError } from "zod";
export async function identity(request: Request) {
  return (await auth.api.getSession({ headers: request.headers }))?.user.id;
}
export function origin(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.BETTER_AUTH_URL ?? request.url).origin
  )
    throw new AppError(403, "Invalid request origin.");
}
export async function limitedBytes(request: Request, max: number) {
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new AppError(413, "Request too large.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new AppError(413, "Request too large.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Uint8Array(Buffer.concat(parts));
}
export async function body(request: Request) {
  origin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError(415, "Send JSON.");
  return JSON.parse(
    new TextDecoder().decode(await limitedBytes(request, 50000)),
  );
}
export async function respond(fn: () => Promise<unknown>) {
  try {
    return Response.json(await fn(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError)
      return Response.json(
        {
          error: e.issues
            .map((x) => x.path.join(".") + ": " + x.message)
            .join("; "),
        },
        { status: 400 },
      );
    if (e instanceof SyntaxError)
      return Response.json({ error: "Invalid input." }, { status: 400 });
    console.error("Request failed", e instanceof Error ? e.name : "Unknown");
    return Response.json(
      { error: "Operation failed. Check the request and try again." },
      { status: 500 },
    );
  }
}
