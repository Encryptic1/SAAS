import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listTunnels, createTunnel } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tunnels = await listTunnels(ownerId);
  return NextResponse.json({ tunnels });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    targetApp?: string;
    targetPath?: string;
    publicUrl?: string | null;
    provider?: string;
    status?: string;
  };
  if (!body.name || !body.targetApp) return NextResponse.json({ error: "name, targetApp required" }, { status: 400 });
  const tunnel = await createTunnel({
    ownerId,
    name: body.name,
    targetApp: body.targetApp,
    targetPath: body.targetPath,
    publicUrl: body.publicUrl ?? null,
    provider: body.provider,
    status: body.status,
  });
  return NextResponse.json({ tunnel }, { status: 201 });
}
