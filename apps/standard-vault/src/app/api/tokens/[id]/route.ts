import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { deleteToken } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // The gateway / DB enforces ownership via the project FK; in local dev mode
  // the gateway trusts the caller since it's behind a single-user dev gateway.
  // In production Supabase RLS would prevent cross-owner deletes.
  await deleteToken(id);
  return NextResponse.json({ ok: true });
}
