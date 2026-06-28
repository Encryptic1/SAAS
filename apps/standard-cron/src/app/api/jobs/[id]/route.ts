import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getJob, updateJob, deleteJob } from "@/lib/cron-data";
import { validateCron } from "@/lib/cron-parser";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await getJob(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (data.job.ownerId !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getJob(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.job.ownerId !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json()) as {
    name?: string;
    scheduleCron?: string;
    source?: string;
    expectedWindowMinutes?: number;
    graceMinutes?: number;
    alertChannel?: string | null;
    metadata?: Record<string, unknown>;
  };
  if (body.scheduleCron) {
    const cronErr = validateCron(body.scheduleCron);
    if (cronErr) return NextResponse.json({ error: cronErr }, { status: 400 });
  }
  const job = await updateJob(id, body);
  return NextResponse.json({ job });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getJob(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.job.ownerId !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await deleteJob(id);
  return NextResponse.json({ ok: true });
}
