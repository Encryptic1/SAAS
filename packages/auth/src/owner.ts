import { getUser } from "./supabase";

/**
 * Resolve the active owner id for the current request.
 *
 * In local gateway mode (NEXT_PUBLIC_LOCAL_DEV=true) every request is
 * attributed to a single demo owner ("local-dev") so the PGlite-backed
 * gateway has a stable key. In production the Supabase session user id is
 * used; anonymous requests return null (callers should 401).
 */
export async function getOwnerId(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_LOCAL_DEV === "true") return "local-dev";
  const user = await getUser();
  return user?.id ?? null;
}
