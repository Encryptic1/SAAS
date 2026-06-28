import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { listMembers, getMember } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const actor = await getMember(teamId, ownerId);
  if (!actor) return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  const members = await listMembers(teamId);
  return NextResponse.json({ members });
}
