import {
  fetchGateway,
  getDbAsync,
  isLocalGatewayMode,
  postGateway,
  patchGateway,
  deleteGateway,
} from "@market-standard/db";
import { linkClickEvents, linkRecords } from "@market-standard/db/schema/links";
import { and, desc, eq, gte } from "@market-standard/db/query";
import { getOwnerId } from "./owner";

export type LinkRecord = typeof linkRecords.$inferSelect;
export type LinkClickEvent = typeof linkClickEvents.$inferSelect;

export interface LinkWithEvents extends LinkRecord {
  events: LinkClickEvent[];
}

function normalizeRow(r: LinkRecord): LinkRecord {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    lastClickedAt: r.lastClickedAt ? new Date(r.lastClickedAt) : null,
  };
}

export async function listOwnerLinks(): Promise<LinkRecord[]> {
  if (isLocalGatewayMode()) {
    const ownerId = await getOwnerId();
    const rows = await fetchGateway<LinkRecord[]>(`/links/links?ownerId=${encodeURIComponent(ownerId ?? "")}`);
    return rows.map(normalizeRow);
  }
  const ownerId = await getOwnerId();
  if (!ownerId) return [];
  const db = await getDbAsync();
  const rows = await db
    .select()
    .from(linkRecords)
    .where(eq(linkRecords.ownerId, ownerId))
    .orderBy(desc(linkRecords.createdAt));
  return rows;
}

export async function getOwnerLink(id: string): Promise<LinkWithEvents | null> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ link: LinkRecord; events: LinkClickEvent[] }>(
      `/links/links/${id}`,
    ).catch(() => null);
    if (!data) return null;
    return {
      ...normalizeRow(data.link),
      events: data.events.map((e) => ({ ...e, clickedAt: new Date(e.clickedAt) })),
    };
  }
  const ownerId = await getOwnerId();
  if (!ownerId) return null;
  const db = await getDbAsync();
  const [row] = await db
    .select()
    .from(linkRecords)
    .where(and(eq(linkRecords.id, id), eq(linkRecords.ownerId, ownerId)))
    .limit(1);
  if (!row) return null;
  const events = await db
    .select()
    .from(linkClickEvents)
    .where(eq(linkClickEvents.linkId, row.id))
    .orderBy(desc(linkClickEvents.clickedAt))
    .limit(50);
  return { ...row, events };
}

export async function getLinkBySlug(slug: string): Promise<LinkRecord | null> {
  if (isLocalGatewayMode()) {
    const row = await fetchGateway<LinkRecord>(`/links/links/slug/${encodeURIComponent(slug)}`).catch(
      () => null,
    );
    if (!row) return null;
    return normalizeRow(row);
  }
  const db = await getDbAsync();
  const [row] = await db.select().from(linkRecords).where(eq(linkRecords.slug, slug)).limit(1);
  if (!row) return null;
  return row;
}

export async function recordClick(
  slug: string,
  ctx: { ipHash?: string | null; userAgent?: string | null; referrer?: string | null; utm?: Record<string, string> },
): Promise<string | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ ok: true; stripeUrl: string }>(`/links/click/${encodeURIComponent(slug)}`, {
      ipHash: ctx.ipHash ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
      referrer: ctx.referrer ?? undefined,
      utm: ctx.utm ?? {},
    });
    return data.stripeUrl ?? null;
  }
  const db = await getDbAsync();
  const [row] = await db.select().from(linkRecords).where(eq(linkRecords.slug, slug)).limit(1);
  if (!row || !row.active) return null;
  await db
    .update(linkRecords)
    .set({ clickCount: row.clickCount + 1, lastClickedAt: new Date() })
    .where(eq(linkRecords.id, row.id));
  await db.insert(linkClickEvents).values({
    linkId: row.id,
    ipHash: ctx.ipHash ?? null,
    userAgent: ctx.userAgent ?? null,
    referrer: ctx.referrer ?? null,
    utm: ctx.utm ?? {},
  });
  return row.stripeUrl;
}

export async function createLink(input: {
  ownerId: string;
  name: string;
  slug?: string;
  stripeUrl: string;
  stripeLinkId?: string;
  metadata?: Record<string, unknown>;
}): Promise<LinkRecord | null> {
  if (isLocalGatewayMode()) {
    const row = await postGateway<LinkRecord>("/links/links", input);
    return normalizeRow(row);
  }

  const db = await getDbAsync();
  const [row] = await db
    .insert(linkRecords)
    .values({
      ownerId: input.ownerId,
      slug: input.slug ?? "",
      name: input.name,
      stripeUrl: input.stripeUrl,
      stripeLinkId: input.stripeLinkId ?? null,
      metadata: input.metadata ?? {},
    })
    .returning();
  return row ?? null;
}

export async function updateLink(
  id: string,
  patch: Partial<Pick<LinkRecord, "name" | "stripeUrl" | "stripeLinkId" | "active" | "metadata">>,
): Promise<LinkRecord | null> {
  if (isLocalGatewayMode()) {
    const row = await patchGateway<LinkRecord>(`/links/links/${id}`, patch).catch(() => null);
    if (!row) return null;
    return normalizeRow(row);
  }
  const db = await getDbAsync();
  const [row] = await db
    .update(linkRecords)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(linkRecords.id, id))
    .returning();
  return row ?? null;
}

export async function deleteLink(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/links/links/${id}`);
    return;
  }
  const db = await getDbAsync();
  await db.delete(linkRecords).where(eq(linkRecords.id, id));
}

export interface DashboardStats {
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
  clicksLast7d: number;
  topLink: LinkRecord | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const links = await listOwnerLinks();
  const totalClicks = links.reduce((acc, l) => acc + l.clickCount, 0);
  const activeLinks = links.filter((l) => l.active).length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = links.filter((l) => l.lastClickedAt && new Date(l.lastClickedAt) >= sevenDaysAgo);
  const clicksLast7d = recent.reduce((acc, l) => acc + l.clickCount, 0);
  const topLink = links.slice().sort((a, b) => b.clickCount - a.clickCount)[0] ?? null;
  return {
    totalLinks: links.length,
    activeLinks,
    totalClicks,
    clicksLast7d,
    topLink,
  };
}

export async function getRecentClickEvents(linkId: string): Promise<LinkClickEvent[]> {
  if (isLocalGatewayMode()) {
    return [];
  }
  const db = await getDbAsync();
  return db
    .select()
    .from(linkClickEvents)
    .where(gte(linkClickEvents.clickedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    .orderBy(desc(linkClickEvents.clickedAt));
}
