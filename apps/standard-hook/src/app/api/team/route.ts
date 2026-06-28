import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { createTeam, listTeamsForOwner, RbacError } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const teams = await listTeamsForOwner(ownerId);
  return NextResponse.json({ teams });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { name?: string; slug?: string };
  if (!body.name || !body.slug) return NextResponse.json({ error: "name, slug required" }, { status: 400 });
  try {
    const team = await createTeam({ name: body.name, slug: body.slug, ownerId });
    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
