import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listSessions, createSession } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await listSessions(ownerId);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { label?: string; apps?: string; pid?: number | null };
  if (!body.label) return NextResponse.json({ error: "label required" }, { status: 400 });
  const session = await createSession({
    ownerId,
    label: body.label,
    apps: body.apps,
    pid: body.pid ?? null,
  });
  return NextResponse.json({ session }, { status: 201 });
}
