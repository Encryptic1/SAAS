import {
  fetchGateway,
  getDbAsync,
  isLocalGatewayMode,
  postGateway,
  patchGateway,
  deleteGateway,
} from "@market-standard/db";
import { snippets, snippetVersions, snippetShares } from "@market-standard/db/schema/snippets";
import { and, eq, sql, desc } from "@market-standard/db/query";

export type SnippetSummary = {
  id: string;
  ownerId: string;
  title: string;
  language: string;
  body: string;
  tags: string[];
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SnippetVersionRow = {
  id: string;
  snippetId: string;
  body: string;
  versionNote: string | null;
  createdBy: string;
  versionNumber: number;
  createdAt: Date;
};

export type SnippetShareRow = {
  id: string;
  snippetId: string;
  slug: string;
  expiresAt: Date | null;
  createdAt: Date;
};

export async function listOwnerSnippets(ownerId: string, tag?: string): Promise<SnippetSummary[]> {
  if (isLocalGatewayMode()) {
    const params = new URLSearchParams({ ownerId });
    if (tag) params.set("tag", tag);
    const data = await fetchGateway<{ snippets: SnippetSummary[] }>(`/snippets/snippets?${params}`);
    return data.snippets.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));
  }
  const db = await getDbAsync();
  const rows = tag
    ? await db
        .select()
        .from(snippets)
        .where(and(eq(snippets.ownerId, ownerId), sql`${snippets.tags} @> ARRAY[${tag}]::text[]`))
        .orderBy(desc(snippets.updatedAt))
    : await db.select().from(snippets).where(eq(snippets.ownerId, ownerId)).orderBy(desc(snippets.updatedAt));
  return rows;
}

export async function getSnippet(id: string): Promise<SnippetSummary | null> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ snippet: SnippetSummary }>(`/snippets/snippets/${id}`);
    return data.snippet ? { ...data.snippet, createdAt: new Date(data.snippet.createdAt), updatedAt: new Date(data.snippet.updatedAt) } : null;
  }
  const db = await getDbAsync();
  const [row] = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
  return row ?? null;
}

export async function createSnippet(input: {
  ownerId: string;
  title: string;
  language?: string;
  body?: string;
  tags?: string[];
}): Promise<SnippetSummary | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ snippet: SnippetSummary }>("/snippets/snippets", input);
    return data.snippet ? { ...data.snippet, createdAt: new Date(data.snippet.createdAt), updatedAt: new Date(data.snippet.updatedAt) } : null;
  }
  const db = await getDbAsync();
  const [row] = await db
    .insert(snippets)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      language: input.language ?? "plaintext",
      body: input.body ?? "",
      tags: input.tags ?? [],
    })
    .returning();
  if (!row) return null;
  await db.insert(snippetVersions).values({
    snippetId: row.id,
    body: row.body,
    versionNote: "initial",
    createdBy: row.ownerId,
    versionNumber: 1,
  });
  return row;
}

export async function updateSnippet(
  id: string,
  updates: { title?: string; language?: string; body?: string; tags?: string[]; versionNote?: string | null },
): Promise<SnippetSummary | null> {
  if (isLocalGatewayMode()) {
    const data = await patchGateway<{ snippet: SnippetSummary }>(`/snippets/snippets/${id}`, updates);
    return data.snippet ? { ...data.snippet, createdAt: new Date(data.snippet.createdAt), updatedAt: new Date(data.snippet.updatedAt) } : null;
  }
  const db = await getDbAsync();
  const [existing] = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
  if (!existing) return null;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.title !== undefined) set.title = updates.title;
  if (updates.language !== undefined) set.language = updates.language;
  if (updates.body !== undefined) set.body = updates.body;
  if (updates.tags !== undefined) set.tags = updates.tags;
  const [row] = await db.update(snippets).set(set).where(eq(snippets.id, id)).returning();
  if (!row) return null;
  // Auto-create a version row when body changes
  if (updates.body !== undefined) {
    const [lastVer] = await db
      .select({ max: sql<number>`max(version_number)` })
      .from(snippetVersions)
      .where(eq(snippetVersions.snippetId, id));
    const nextVer = (Number(lastVer?.max ?? 0) || 0) + 1;
    await db.insert(snippetVersions).values({
      snippetId: id,
      body: updates.body,
      versionNote: updates.versionNote ?? null,
      createdBy: existing.ownerId,
      versionNumber: nextVer,
    });
  }
  return row;
}

export async function deleteSnippet(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/snippets/snippets/${id}`);
    return;
  }
  const db = await getDbAsync();
  await db.delete(snippets).where(eq(snippets.id, id));
}

export async function listSnippetVersions(id: string): Promise<SnippetVersionRow[]> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ versions: SnippetVersionRow[] }>(`/snippets/snippets/${id}/versions`);
    return data.versions.map((v) => ({ ...v, createdAt: new Date(v.createdAt) }));
  }
  const db = await getDbAsync();
  const rows = await db
    .select()
    .from(snippetVersions)
    .where(eq(snippetVersions.snippetId, id))
    .orderBy(desc(snippetVersions.versionNumber));
  return rows;
}

export async function createShare(id: string, expiresInDays?: number): Promise<SnippetShareRow | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ share: SnippetShareRow }>(`/snippets/snippets/${id}/share`, {
      expiresInDays: expiresInDays ?? null,
    });
    return data.share ? { ...data.share, expiresAt: data.share.expiresAt ? new Date(data.share.expiresAt) : null, createdAt: new Date(data.share.createdAt) } : null;
  }
  const db = await getDbAsync();
  const slug = generateShareSlug();
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;
  const [row] = await db.insert(snippetShares).values({ snippetId: id, slug, expiresAt }).returning();
  return row ?? null;
}

export async function getSharedSnippet(slug: string): Promise<{ snippet: SnippetSummary; share: SnippetShareRow } | null> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ snippet: SnippetSummary; share: SnippetShareRow }>(`/snippets/shared/${slug}`);
    if (!data.snippet || !data.share) return null;
    return {
      snippet: { ...data.snippet, createdAt: new Date(data.snippet.createdAt), updatedAt: new Date(data.snippet.updatedAt) },
      share: { ...data.share, expiresAt: data.share.expiresAt ? new Date(data.share.expiresAt) : null, createdAt: new Date(data.share.createdAt) },
    };
  }
  const db = await getDbAsync();
  const [share] = await db.select().from(snippetShares).where(eq(snippetShares.slug, slug)).limit(1);
  if (!share) return null;
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) return null;
  const [snippet] = await db.select().from(snippets).where(eq(snippets.id, share.snippetId)).limit(1);
  if (!snippet) return null;
  return { snippet, share };
}

export async function exportOwnerSnippetsJson(ownerId: string): Promise<SnippetSummary[]> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ snippets: SnippetSummary[] }>(`/snippets/export/json?ownerId=${encodeURIComponent(ownerId)}`);
    return data.snippets.map((s) => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) }));
  }
  const db = await getDbAsync();
  const rows = await db.select().from(snippets).where(eq(snippets.ownerId, ownerId));
  return rows;
}

function generateShareSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
