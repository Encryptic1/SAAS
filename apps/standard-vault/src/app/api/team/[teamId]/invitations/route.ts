import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { createInvitation, listInvitations, getMember, hasRole } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const actor = await getMember(teamId, ownerId);
  if (!actor) return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  const invitations = await listInvitations(teamId);
  return NextResponse.json({ invitations });
}

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const actor = await getMember(teamId, ownerId);
  if (!actor || !hasRole(actor.role, "admin")) {
    return NextResponse.json({ error: "Admin role required to invite" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string; role?: string };
  if (!body.email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const invitation = await createInvitation({
    teamId,
    email: body.email,
    role: body.role ?? "member",
    invitedBy: ownerId,
  });
  return NextResponse.json({ invitation }, { status: 201 });
}
