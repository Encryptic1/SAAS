import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getSnippet, listSnippetVersions } from "@/lib/snippets-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * FloodG8 Plan Editor resolution endpoint.
 *
 * When a plan document contains `[[snippet:{id}]]`, the FloodG8 editor calls
 * this route to fetch the latest version body for inline insert.
 *
 * Returns the snippet metadata + the latest version body. Owner-authenticated
 * so private snippets are only resolved by their owner. Public snippets are
 * resolved via the share-slug route (`/api/shared/[slug]`).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snippet = await getSnippet(id);
  if (!snippet || snippet.ownerId !== ownerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const versions = await listSnippetVersions(id);
  const latest = versions[0];
  return NextResponse.json({
    snippet: {
      id: snippet.id,
      title: snippet.title,
      language: snippet.language,
      tags: snippet.tags,
    },
    body: latest?.body ?? snippet.body,
    version: latest?.versionNumber ?? 1,
    versionNote: latest?.versionNote ?? null,
    updatedAt: snippet.updatedAt.toISOString(),
  });
}
