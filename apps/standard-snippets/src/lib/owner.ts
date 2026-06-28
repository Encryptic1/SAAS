import { getUser } from "@market-standard/auth";
import { isLocalGatewayMode } from "@market-standard/db";

/** Local dev uses a deterministic owner UUID that matches the seeded demo snippet. */
const LOCAL_DEV_OWNER = "00000000-0000-0000-0000-000000000001";

export async function getOwnerId(): Promise<string | null> {
  if (isLocalGatewayMode()) return LOCAL_DEV_OWNER;
  const user = await getUser();
  return user?.id ?? null;
}
