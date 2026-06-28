import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { webhookEvents, webhookInboxes } from "@market-standard/db/schema/hook";
import { and, desc, eq } from "@market-standard/db/query";
import { getOwnerId } from "./owner";

export type InboxRow = typeof webhookInboxes.$inferSelect;
export type EventRow = typeof webhookEvents.$inferSelect;

export async function listOwnerInboxes(): Promise<InboxRow[]> {
  if (isLocalGatewayMode()) {
    return fetchGateway<InboxRow[]>("/hook/inboxes");
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return [];

  const db = await getDbAsync();
  return db
    .select()
    .from(webhookInboxes)
    .where(eq(webhookInboxes.ownerId, ownerId))
    .orderBy(desc(webhookInboxes.createdAt));
}

export async function getOwnerInbox(id: string): Promise<{
  inbox: InboxRow;
  events: EventRow[];
} | null> {
  if (isLocalGatewayMode()) {
    return fetchGateway<{ inbox: InboxRow; events: EventRow[] }>(`/hook/inboxes/${id}`).catch(
      () => null,
    );
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return null;

  const db = await getDbAsync();
  const [inbox] = await db
    .select()
    .from(webhookInboxes)
    .where(and(eq(webhookInboxes.id, id), eq(webhookInboxes.ownerId, ownerId)))
    .limit(1);
  if (!inbox) return null;

  const events = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.inboxId, inbox.id))
    .orderBy(desc(webhookEvents.receivedAt));

  return { inbox, events };
}

export async function getDashboardStats(): Promise<{
  inboxes: number;
  events: number;
  latestEventAt: string | null;
}> {
  if (isLocalGatewayMode()) {
    const rows = await fetchGateway<InboxRow[]>("/hook/inboxes");
    let events = 0;
    let latestEventAt: string | null = null;
    for (const inbox of rows) {
      const detail = await fetchGateway<{ events: EventRow[] }>(`/hook/inboxes/${inbox.id}`).catch(
        () => null,
      );
      if (!detail) continue;
      events += detail.events.length;
      for (const e of detail.events) {
        const at = e.receivedAt?.toString() ?? null;
        if (at && (!latestEventAt || at > latestEventAt)) latestEventAt = at;
      }
    }
    return { inboxes: rows.length, events, latestEventAt };
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return { inboxes: 0, events: 0, latestEventAt: null };

  const db = await getDbAsync();
  const inboxes = await db
    .select()
    .from(webhookInboxes)
    .where(eq(webhookInboxes.ownerId, ownerId));

  let events = 0;
  let latestEventAt: string | null = null;
  for (const inbox of inboxes) {
    const items = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.inboxId, inbox.id));
    events += items.length;
    for (const e of items) {
      const at = e.receivedAt?.toISOString() ?? null;
      if (at && (!latestEventAt || at > latestEventAt)) latestEventAt = at;
    }
  }

  return { inboxes: inboxes.length, events, latestEventAt };
}

export async function getInboxBySlug(slug: string): Promise<InboxRow | null> {
  if (isLocalGatewayMode()) {
    const row = await fetchGateway<InboxRow>(`/hook/inboxes/slug/${slug}`).catch(() => null);
    return row ?? null;
  }

  const db = await getDbAsync();
  const [inbox] = await db.select().from(webhookInboxes).where(eq(webhookInboxes.slug, slug)).limit(1);
  return inbox ?? null;
}
