import { NextResponse } from "next/server";
import { listProjectReferences } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * AI-agent reference mode — returns secret keys + versions for agents.
 * No values, no auth — safe to expose to AI agents so they can see what
 * secrets exist without being able to read them.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const references = await listProjectReferences(id);
  return NextResponse.json({ references });
}
