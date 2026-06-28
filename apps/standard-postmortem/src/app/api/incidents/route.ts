import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listIncidents, createIncident } from "@/lib/postmortem-data";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listIncidents(ownerId);
  return NextResponse.json({ incidents: rows });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    title?: string;
    severity?: string;
    startedAt?: string;
    resolvedAt?: string;
    summary?: string;
    rootcauseMd?: string;
    timeline?: Array<{ at: string; text: string }>;
    sections?: { whatWentWell: string; whatDidnt: string; whereWeGotLucky: string };
    status?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  };
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const { title, ...rest } = body;
  const row = await createIncident({ ownerId, title, ...rest });
  return NextResponse.json({ incident: row }, { status: 201 });
}
