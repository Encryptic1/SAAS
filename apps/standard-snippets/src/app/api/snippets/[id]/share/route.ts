import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getSnippet, createShare } from "@/lib/snippets-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getSnippet(id);
  if (!existing || existing.ownerId !== ownerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await request.json()) as { expiresInDays?: number };
  const share = await createShare(id, body.expiresInDays);
  if (!share) return NextResponse.json({ error: "Failed to mint share link" }, { status: 500 });
  return NextResponse.json({ share }, { status: 201 });
}
