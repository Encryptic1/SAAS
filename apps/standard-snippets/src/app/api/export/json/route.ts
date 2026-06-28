import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { exportOwnerSnippetsJson } from "@/lib/snippets-data";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snippets = await exportOwnerSnippetsJson(ownerId);
  return NextResponse.json({ snippets, exportedAt: new Date().toISOString() });
}
