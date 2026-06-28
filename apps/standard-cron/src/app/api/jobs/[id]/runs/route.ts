import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getJob, addRun } from "@/lib/cron-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getJob(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.job.ownerId !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json()) as {
    status?: string;
    startedAt?: string;
    finishedAt?: string | null;
    durationMs?: number | null;
    metadata?: Record<string, unknown>;
  };
  const run = await addRun({
    jobId: id,
    status: body.status,
    startedAt: body.startedAt,
    finishedAt: body.finishedAt,
    durationMs: body.durationMs,
    metadata: body.metadata,
  });
  return NextResponse.json({ run }, { status: 201 });
}
