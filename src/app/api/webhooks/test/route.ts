import { receive } from "@/lib/webhooks";
import { respond, limitedBytes } from "@/lib/http";
export async function POST(r: Request) {
  let status = 200;
  const result = await respond(async () => {
    const raw = new TextDecoder().decode(await limitedBytes(r, 16000));
    const output = await receive(raw, Object.fromEntries(r.headers));
    status = output.status;
    return output;
  });
  return result.ok
    ? new Response(await result.text(), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    : result;
}
