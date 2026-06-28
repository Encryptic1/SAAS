import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { embedIncident, getIncident } from "@/lib/postmortem-data";

/**
 * Generate + store an OpenAI text-embedding-3-small embedding for an incident's
 * rootcause_md so the recurrence detector can use cosine similarity. Idempotent
 * — re-embedding replaces the prior vector.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getIncident(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await embedIncident(id);
  return NextResponse.json(result, { status: result.embedded ? 200 : 202 });
}
