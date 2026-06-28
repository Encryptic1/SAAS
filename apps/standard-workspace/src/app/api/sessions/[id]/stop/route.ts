import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { updateSession } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const session = await updateSession(id, {
    status: "stopped",
    stoppedAt: new Date().toISOString(),
    pid: null,
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ session });
}
