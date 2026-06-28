import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { createSnippet, listOwnerSnippets } from "@/lib/snippets-data";

export async function GET(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") ?? undefined;
  const snippets = await listOwnerSnippets(ownerId, tag);
  return NextResponse.json({ snippets });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    title?: string;
    language?: string;
    body?: string;
    tags?: string[];
  };
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const snippet = await createSnippet({
    ownerId,
    title: body.title.trim(),
    language: body.language?.trim() || "plaintext",
    body: body.body ?? "",
    tags: body.tags ?? [],
  });
  if (!snippet) return NextResponse.json({ error: "Failed to create snippet" }, { status: 500 });
  return NextResponse.json({ snippet }, { status: 201 });
}
