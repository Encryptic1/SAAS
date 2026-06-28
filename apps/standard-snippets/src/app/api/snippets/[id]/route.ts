import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getSnippet, updateSnippet, deleteSnippet, listSnippetVersions } from "@/lib/snippets-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snippet = await getSnippet(id);
  if (!snippet || snippet.ownerId !== ownerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const versions = await listSnippetVersions(id);
  return NextResponse.json({ snippet, versions });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getSnippet(id);
  if (!existing || existing.ownerId !== ownerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await request.json()) as {
    title?: string;
    language?: string;
    body?: string;
    tags?: string[];
    versionNote?: string | null;
  };
  const snippet = await updateSnippet(id, body);
  if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ snippet });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getSnippet(id);
  if (!existing || existing.ownerId !== ownerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await deleteSnippet(id);
  return NextResponse.json({ ok: true });
}
