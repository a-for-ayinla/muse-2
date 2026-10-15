import { handler, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = handler(async (_req, rid) => {
  await destroySession();
  return ok({ loggedOut: true }, rid);
});
