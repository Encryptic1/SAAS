import { NextResponse } from "next/server";
import { createPipeline, updatePipeline, addDeployment, createIncident, listPipelines } from "@/lib/status-data";

/**
 * Intake webhook for external CI/CD sources to push events into Standard Status.
 *
 * Header auth: `Authorization: Bearer <STATUS_INTAKE_SECRET>`
 * Body shape (unified):
 *   { source: "github"|"vercel"|"floodg8", event: "pipeline"|"deployment"|"incident",
 *     ownerId, repoFullName?, pipelineName?, pipelineId?, environment?, sha?, status, url?, runAt?, title?, severity?, summary? }
 *
 * For GitHub: map workflow_run status → pipeline; map deployment_status → deployment.
 * For Vercel: map deployment → deployment with environment "preview"|"production".
 * For FloodG8: map runner heartbeat → pipeline (status running/success/failed).
 */
export async function POST(request: Request) {
  const expected = process.env.STATUS_INTAKE_SECRET;
  if (expected) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const source = String(body.source ?? "");
  const event = String(body.event ?? "");
  const ownerId = String(body.ownerId ?? "");
  if (!source || !event || !ownerId) {
    return NextResponse.json({ error: "source, event, ownerId required" }, { status: 400 });
  }

  if (event === "pipeline") {
    const name = String(body.pipelineName ?? "untitled");
    const repo = body.repoFullName ? String(body.repoFullName) : undefined;
    const status = String(body.status ?? "running");
    const runAt = body.runAt ? String(body.runAt) : new Date().toISOString();

    // Find existing pipeline (by name + source + owner) or create
    const existing = (await listPipelines(ownerId)).find((p) => p.source === source && p.name === name);
    if (existing) {
      const updated = await updatePipeline(existing.id, {
        lastStatus: status,
        lastRunAt: runAt,
        repoFullName: repo ?? existing.repoFullName,
      });
      return NextResponse.json({ pipeline: updated, created: false });
    }
    const created = await createPipeline({ ownerId, source, name, repoFullName: repo });
    await updatePipeline(created.id, { lastStatus: status, lastRunAt: runAt });
    return NextResponse.json({ pipeline: created, created: true });
  }

  if (event === "deployment") {
    const pipelineId = String(body.pipelineId ?? "");
    const environment = String(body.environment ?? "production");
    const status = String(body.status ?? "ready");
    if (!pipelineId) {
      return NextResponse.json({ error: "pipelineId required for deployment event" }, { status: 400 });
    }
    const deploy = await addDeployment({
      pipelineId,
      environment,
      sha: body.sha ? String(body.sha) : undefined,
      status,
      url: body.url ? String(body.url) : undefined,
      metadata: (body.metadata as Record<string, unknown>) ?? undefined,
    });
    await updatePipeline(pipelineId, { lastStatus: status, lastRunAt: new Date().toISOString() });
    return NextResponse.json({ deployment: deploy }, { status: 201 });
  }

  if (event === "incident") {
    const title = String(body.title ?? "");
    if (!title) return NextResponse.json({ error: "title required for incident event" }, { status: 400 });
    const incident = await createIncident({
      ownerId,
      title,
      severity: body.severity ? String(body.severity) : undefined,
      sourcePipelineId: body.pipelineId ? String(body.pipelineId) : undefined,
      summary: body.summary ? String(body.summary) : undefined,
    });
    return NextResponse.json({ incident }, { status: 201 });
  }

  return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
}
