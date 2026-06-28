import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { releaseRepos } from "@market-standard/db/schema/release";
import { and, eq } from "@market-standard/db/query";
import { listOwnerRepos } from "@/lib/release-data";
import { getOwnerId } from "@/lib/owner";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listOwnerRepos();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { repoFullName?: string; defaultBranch?: string };
  const repoFullName = body.repoFullName?.trim();
  if (!repoFullName || !repoFullName.includes("/")) {
    return NextResponse.json({ error: "Valid owner/repo required" }, { status: 400 });
  }

  const defaultBranch = body.defaultBranch?.trim() || "main";

  if (isLocalGatewayMode()) {
    const row = await postGateway<typeof releaseRepos.$inferSelect>("/release/repos", {
      repoFullName,
      defaultBranch,
      ownerId,
    });
    return NextResponse.json(row, { status: 201 });
  }

  const db = await getDbAsync();
  const [existing] = await db
    .select()
    .from(releaseRepos)
    .where(and(eq(releaseRepos.ownerId, ownerId), eq(releaseRepos.repoFullName, repoFullName)))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "Repo already connected" }, { status: 409 });
  }

  const [row] = await db
    .insert(releaseRepos)
    .values({
      ownerId,
      repoFullName,
      defaultBranch,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
