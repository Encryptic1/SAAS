import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { releaseNotes, releaseRepos } from "@market-standard/db/schema/release";
import { and, eq } from "@market-standard/db/query";
import { getOwnerId } from "@/lib/owner";

interface NotePatchRouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: NotePatchRouteProps) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    bodyMd?: string;
    title?: string;
    publish?: boolean;
  };

  if (isLocalGatewayMode()) {
    const { patchGateway } = await import("@market-standard/db");
    const row = await patchGateway<typeof releaseNotes.$inferSelect>(`/release/notes/${id}`, {
      bodyMd: body.bodyMd,
      title: body.title,
      publish: body.publish,
    });
    return NextResponse.json(row);
  }

  const db = await getDbAsync();
  const [note] = await db.select().from(releaseNotes).where(eq(releaseNotes.id, id)).limit(1);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [repo] = await db
    .select()
    .from(releaseRepos)
    .where(and(eq(releaseRepos.id, note.repoId), eq(releaseRepos.ownerId, ownerId)))
    .limit(1);
  if (!repo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [row] = await db
    .update(releaseNotes)
    .set({
      ...(body.bodyMd !== undefined ? { bodyMd: body.bodyMd } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.publish ? { publishedAt: new Date() } : {}),
    })
    .where(eq(releaseNotes.id, id))
    .returning();

  return NextResponse.json(row);
}
