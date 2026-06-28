import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listJobs, createJob } from "@/lib/cron-data";
import { validateCron } from "@/lib/cron-parser";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listJobs(ownerId);
  return NextResponse.json({ jobs: rows });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    name?: string;
    scheduleCron?: string;
    source?: string;
    expectedWindowMinutes?: number;
    graceMinutes?: number;
    alertChannel?: string | null;
    metadata?: Record<string, unknown>;
  };
  if (!body.name || !body.scheduleCron) {
    return NextResponse.json({ error: "name and scheduleCron required" }, { status: 400 });
  }
  const cronErr = validateCron(body.scheduleCron);
  if (cronErr) {
    return NextResponse.json({ error: cronErr }, { status: 400 });
  }
  const row = await createJob({
    ownerId,
    name: body.name,
    scheduleCron: body.scheduleCron,
    source: body.source,
    expectedWindowMinutes: body.expectedWindowMinutes,
    graceMinutes: body.graceMinutes,
    alertChannel: body.alertChannel,
    metadata: body.metadata,
  });
  return NextResponse.json({ job: row }, { status: 201 });
}
