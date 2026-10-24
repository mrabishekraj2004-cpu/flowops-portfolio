import { bootstrap } from "@/lib/service";
import { respond, identity } from "@/lib/http";
export const GET = (r: Request) =>
  respond(async () => bootstrap(await identity(r)));
