import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { updateTunnel, deleteTunnel } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    publicUrl?: string | null;
    status?: string;
    provider?: string;
  };
  const tunnel = await updateTunnel(id, body);
  if (!tunnel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ tunnel });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteTunnel(id);
  return NextResponse.json({ ok: true });
}
