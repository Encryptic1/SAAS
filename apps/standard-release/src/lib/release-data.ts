import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { releaseNotes, releaseRepos } from "@market-standard/db/schema/release";
import { and, desc, eq } from "@market-standard/db/query";
import { getOwnerId } from "./owner";

export type RepoRow = typeof releaseRepos.$inferSelect;
export type NoteRow = typeof releaseNotes.$inferSelect;

export async function listOwnerRepos(): Promise<RepoRow[]> {
  if (isLocalGatewayMode()) {
    return fetchGateway<RepoRow[]>("/release/repos");
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return [];

  const db = await getDbAsync();
  return db
    .select()
    .from(releaseRepos)
    .where(eq(releaseRepos.ownerId, ownerId))
    .orderBy(desc(releaseRepos.createdAt));
}

export async function listOwnerNotes(): Promise<(NoteRow & { repoFullName: string })[]> {
  if (isLocalGatewayMode()) {
    return fetchGateway<(NoteRow & { repoFullName: string })[]>("/release/notes");
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return [];

  const db = await getDbAsync();
  const repos = await db
    .select()
    .from(releaseRepos)
    .where(eq(releaseRepos.ownerId, ownerId));

  const results: (NoteRow & { repoFullName: string })[] = [];
  for (const repo of repos) {
    const notes = await db
      .select()
      .from(releaseNotes)
      .where(eq(releaseNotes.repoId, repo.id))
      .orderBy(desc(releaseNotes.createdAt));
    for (const note of notes) {
      results.push({ ...note, repoFullName: repo.repoFullName });
    }
  }

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getOwnerNote(id: string): Promise<{
  note: NoteRow;
  repo: RepoRow;
} | null> {
  if (isLocalGatewayMode()) {
    return fetchGateway<{ note: NoteRow; repo: RepoRow }>(`/release/notes/${id}`).catch(() => null);
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return null;

  const db = await getDbAsync();
  const [note] = await db.select().from(releaseNotes).where(eq(releaseNotes.id, id)).limit(1);
  if (!note) return null;

  const [repo] = await db
    .select()
    .from(releaseRepos)
    .where(and(eq(releaseRepos.id, note.repoId), eq(releaseRepos.ownerId, ownerId)))
    .limit(1);
  if (!repo) return null;

  return { note, repo };
}

export async function getDashboardStats(): Promise<{
  repos: number;
  notes: number;
  published: number;
}> {
  if (isLocalGatewayMode()) {
    const repos = await fetchGateway<RepoRow[]>("/release/repos");
    const notes = await fetchGateway<(NoteRow & { repoFullName: string })[]>("/release/notes");
    return {
      repos: repos.length,
      notes: notes.length,
      published: notes.filter((n) => n.publishedAt).length,
    };
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return { repos: 0, notes: 0, published: 0 };

  const db = await getDbAsync();
  const repos = await db
    .select()
    .from(releaseRepos)
    .where(eq(releaseRepos.ownerId, ownerId));

  let notes = 0;
  let published = 0;
  for (const repo of repos) {
    const items = await db
      .select()
      .from(releaseNotes)
      .where(eq(releaseNotes.repoId, repo.id));
    notes += items.length;
    published += items.filter((n) => n.publishedAt).length;
  }

  return { repos: repos.length, notes, published };
}
