import { NextResponse } from "next/server";
import { getSharedSnippet } from "@/lib/snippets-data";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** Public endpoint — no auth. Returns the snippet + share metadata for a shared slug. */
export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const result = await getSharedSnippet(slug);
  if (!result) return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
  return NextResponse.json(result);
}
