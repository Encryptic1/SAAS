import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listPipelines, createPipeline } from "@/lib/status-data";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listPipelines(ownerId);
  return NextResponse.json({ pipelines: rows });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { source?: string; name?: string; repoFullName?: string };
  if (!body.source || !body.name) {
    return NextResponse.json({ error: "source and name required" }, { status: 400 });
  }
  const row = await createPipeline({ ownerId, source: body.source, name: body.name, repoFullName: body.repoFullName });
  return NextResponse.json({ pipeline: row }, { status: 201 });
}
