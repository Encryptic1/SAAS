import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { updateMemberRole, removeMember, getMember, RbacError, type Role } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ teamId: string; memberId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId, memberId } = await params;
  const body = (await request.json().catch(() => ({}))) as { role?: string };
  if (!body.role) return NextResponse.json({ error: "role required" }, { status: 400 });
  try {
    await updateMemberRole(teamId, memberId, body.role as Role, ownerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RbacError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ teamId: string; memberId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId, memberId } = await params;
  const target = await getMember(teamId, ownerId);
  if (target?.id === memberId && target.role === "owner") {
    return NextResponse.json({ error: "Owners cannot remove themselves" }, { status: 400 });
  }
  try {
    await removeMember(teamId, memberId, ownerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RbacError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
}
