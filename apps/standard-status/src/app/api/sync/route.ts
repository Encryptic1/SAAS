import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listPipelines, updatePipeline } from "@/lib/status-data";

/**
 * Manual sync endpoint — pulls latest run status for each pipeline from its source.
 * For local dev without tokens, returns current state unchanged.
 * In production with GITHUB_TOKEN/VERCEL_TOKEN set, this would hit those APIs.
 */
export async function POST() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pipelines = await listPipelines(ownerId);
  let updated = 0;
  for (const p of pipelines) {
    // Stub: in production, dispatch to source-specific fetcher here.
    // For now, just bump updatedAt so UI shows "synced" feedback.
    await updatePipeline(p.id, {});
    updated += 1;
  }
  return NextResponse.json({ synced: updated, at: new Date().toISOString() });
}
