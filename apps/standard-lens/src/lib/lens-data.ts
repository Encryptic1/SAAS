import {
  fetchGateway,
  postGateway,
  patchGateway,
  deleteGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "@market-standard/db";
import { queries, slowQueries } from "@market-standard/db/schema/lens";
import type { ExplainNode } from "@market-standard/db/schema/lens";
import { eq, desc } from "@market-standard/db/query";

export type Query = Omit<typeof queries.$inferSelect, "lastRunAt" | "createdAt" | "updatedAt"> & {
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SlowQuery = Omit<
  typeof slowQueries.$inferSelect,
  "capturedAt" | "durationMs" | "thresholdMs"
> & {
  capturedAt: string;
  durationMs: number;
  thresholdMs: number;
};

async function getRemoteDb() {
  return getDbAsync();
}

function serializeQuery(r: typeof queries.$inferSelect): Query {
  return {
    ...r,
    lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeSlow(r: typeof slowQueries.$inferSelect): SlowQuery {
  return {
    ...r,
    capturedAt: r.capturedAt.toISOString(),
    durationMs: Number(r.durationMs),
    thresholdMs: Number(r.thresholdMs),
  };
}

export async function listQueries(ownerId: string): Promise<Query[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ queries: Query[] }>(`/lens/queries?ownerId=${encodeURIComponent(ownerId)}`);
    return json.queries;
  }
  const db = await getRemoteDb();
  const rows = await db.select().from(queries).where(eq(queries.ownerId, ownerId)).orderBy(desc(queries.updatedAt));
  return rows.map(serializeQuery);
}

export async function getQuery(id: string): Promise<Query | null> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ query: Query }>(`/lens/queries/${id}`);
    return json.query ?? null;
  }
  const db = await getRemoteDb();
  const [row] = await db.select().from(queries).where(eq(queries.id, id)).limit(1);
  return row ? serializeQuery(row) : null;
}

export async function createQuery(input: {
  ownerId: string;
  name: string;
  sqlText: string;
  databaseLabel?: string;
  tags?: string[];
  isPinned?: boolean;
}): Promise<Query> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ query: Query }>(`/lens/queries`, input);
    return json.query;
  }
  const db = await getRemoteDb();
  const [row] = await db.insert(queries).values(input).returning();
  if (!row) throw new Error("Failed to create query");
  return serializeQuery(row);
}

export async function updateQuery(
  id: string,
  patch: {
    name?: string;
    sqlText?: string;
    databaseLabel?: string;
    avgMs?: number | null;
    lastRunAt?: string | null;
    lastExplain?: ExplainNode | { plan: ExplainNode[] } | null;
    tags?: string[];
    isPinned?: boolean;
  },
): Promise<Query | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ query: Query }>(`/lens/queries/${id}`, patch);
    return json.query ?? null;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.sqlText !== undefined) updates.sqlText = patch.sqlText;
  if (patch.databaseLabel !== undefined) updates.databaseLabel = patch.databaseLabel;
  if (patch.avgMs !== undefined) updates.avgMs = patch.avgMs === null ? null : String(patch.avgMs);
  if (patch.lastRunAt !== undefined) updates.lastRunAt = patch.lastRunAt ? new Date(patch.lastRunAt) : null;
  if (patch.lastExplain !== undefined) updates.lastExplain = patch.lastExplain;
  if (patch.tags !== undefined) updates.tags = patch.tags;
  if (patch.isPinned !== undefined) updates.isPinned = patch.isPinned;
  const [row] = await db.update(queries).set(updates).where(eq(queries.id, id)).returning();
  return row ? serializeQuery(row) : null;
}

export async function deleteQuery(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/lens/queries/${id}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(queries).where(eq(queries.id, id));
}

export async function listSlowQueries(ownerId: string, limit = 50): Promise<SlowQuery[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ slowQueries: SlowQuery[] }>(
      `/lens/slow?ownerId=${encodeURIComponent(ownerId)}&limit=${limit}`,
    );
    return json.slowQueries.map(coerceSlow);
  }
  const db = await getRemoteDb();
  const rows = await db
    .select()
    .from(slowQueries)
    .where(eq(slowQueries.ownerId, ownerId))
    .orderBy(desc(slowQueries.capturedAt))
    .limit(limit);
  return rows.map(serializeSlow);
}

function coerceSlow(r: SlowQuery): SlowQuery {
  return {
    ...r,
    durationMs: Number(r.durationMs),
    thresholdMs: Number(r.thresholdMs),
  };
}

export async function recordSlowQuery(input: {
  ownerId: string;
  queryHash: string;
  sqlText: string;
  durationMs: number;
  thresholdMs: number;
  source?: string;
  databaseLabel?: string;
  metadata?: Record<string, unknown>;
}): Promise<SlowQuery> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ slowQuery: SlowQuery }>(`/lens/slow`, input);
    return coerceSlow(json.slowQuery);
  }
  const db = await getRemoteDb();
  const [row] = await db
    .insert(slowQueries)
    .values({
      ownerId: input.ownerId,
      queryHash: input.queryHash,
      sqlText: input.sqlText,
      durationMs: String(input.durationMs),
      thresholdMs: String(input.thresholdMs),
      source: input.source ?? "postgres",
      databaseLabel: input.databaseLabel ?? "default",
      metadata: input.metadata ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to record slow query");
  return serializeSlow(row);
}
