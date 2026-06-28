import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { addDeployment, updatePipeline } from "@/lib/status-data";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    environment?: string;
    sha?: string;
    status?: string;
    url?: string;
    metadata?: Record<string, unknown>;
    pipelineStatus?: string;
    runAt?: string;
  };
  if (!body.environment || !body.status) {
    return NextResponse.json({ error: "environment and status required" }, { status: 400 });
  }
  const deploy = await addDeployment({
    pipelineId: id,
    environment: body.environment,
    sha: body.sha,
    status: body.status,
    url: body.url,
    metadata: body.metadata,
  });
  if (body.pipelineStatus) {
    await updatePipeline(id, {
      lastStatus: body.pipelineStatus,
      lastRunAt: body.runAt ?? new Date().toISOString(),
    });
  }
  return NextResponse.json({ deployment: deploy }, { status: 201 });
}
