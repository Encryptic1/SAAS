import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listIncidents, createIncident } from "@/lib/status-data";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listIncidents(ownerId);
  return NextResponse.json({ incidents: rows });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { title?: string; severity?: string; sourcePipelineId?: string; summary?: string };
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const row = await createIncident({
    ownerId,
    title: body.title,
    severity: body.severity,
    sourcePipelineId: body.sourcePipelineId,
    summary: body.summary,
  });
  return NextResponse.json({ incident: row }, { status: 201 });
}
