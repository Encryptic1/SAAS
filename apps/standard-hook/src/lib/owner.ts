import { getUser } from "@market-standard/auth";
import { isLocalGatewayMode } from "@market-standard/db";

export async function getOwnerId(): Promise<string | null> {
  if (isLocalGatewayMode()) return "local-dev";
  const user = await getUser();
  return user?.id ?? null;
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
