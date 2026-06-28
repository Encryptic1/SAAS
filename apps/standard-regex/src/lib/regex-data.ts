import {
  fetchGateway,
  postGateway,
  patchGateway,
  deleteGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "@market-standard/db";
import { patterns, patternForks } from "@market-standard/db/schema/regex";
import { eq, desc } from "@market-standard/db/query";

export type Pattern = Omit<typeof patterns.$inferSelect, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type PatternFork = Omit<typeof patternForks.$inferSelect, "createdAt"> & {
  createdAt: string;
};

async function getRemoteDb() {
  return getDbAsync();
}

function serializePattern(r: typeof patterns.$inferSelect): Pattern {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeFork(r: typeof patternForks.$inferSelect): PatternFork {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

export async function listPatterns(ownerId: string): Promise<Pattern[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ patterns: Pattern[] }>(`/regex/patterns?ownerId=${encodeURIComponent(ownerId)}`);
    return json.patterns;
  }
  const db = await getRemoteDb();
  const rows = await db.select().from(patterns).where(eq(patterns.ownerId, ownerId)).orderBy(desc(patterns.updatedAt));
  return rows.map(serializePattern);
}

export async function listPublicPatterns(): Promise<Pattern[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ patterns: Pattern[] }>(`/regex/patterns/public`);
    return json.patterns;
  }
  const db = await getRemoteDb();
  const rows = await db.select().from(patterns).where(eq(patterns.isPublic, true)).orderBy(desc(patterns.updatedAt)).limit(50);
  return rows.map(serializePattern);
}

export async function getPattern(id: string): Promise<{ pattern: Pattern; forks: PatternFork[] } | null> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ pattern: Pattern; forks: PatternFork[] }>(`/regex/patterns/${id}`);
    return json.pattern ? json : null;
  }
  const db = await getRemoteDb();
  const [row] = await db.select().from(patterns).where(eq(patterns.id, id)).limit(1);
  if (!row) return null;
  const forks = await db.select().from(patternForks).where(eq(patternForks.patternId, id));
  return { pattern: serializePattern(row), forks: forks.map(serializeFork) };
}

export async function createPattern(input: {
  ownerId: string;
  name: string;
  pattern: string;
  flags?: string;
  description?: string;
  testCases?: Array<{ input: string; expectedMatches: number | null; note?: string }>;
  tags?: string[];
  isPublic?: boolean;
}): Promise<Pattern> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ pattern: Pattern }>(`/regex/patterns`, input);
    return json.pattern;
  }
  const db = await getRemoteDb();
  const [row] = await db.insert(patterns).values(input).returning();
  if (!row) throw new Error("Failed to create pattern");
  return serializePattern(row);
}

export async function updatePattern(
  id: string,
  patch: {
    name?: string;
    pattern?: string;
    flags?: string;
    description?: string | null;
    testCases?: Array<{ input: string; expectedMatches: number | null; note?: string }>;
    tags?: string[];
    isPublic?: boolean;
  },
): Promise<Pattern | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ pattern: Pattern }>(`/regex/patterns/${id}`, patch);
    return json.pattern;
  }
  const db = await getRemoteDb();
  const [row] = await db.update(patterns).set({ ...patch, updatedAt: new Date() }).where(eq(patterns.id, id)).returning();
  if (!row) return null;
  return serializePattern(row);
}

export async function deletePattern(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/regex/patterns/${id}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(patterns).where(eq(patterns.id, id));
}

export async function forkPattern(
  patternId: string,
  ownerId: string,
  pattern: string,
  flags?: string,
): Promise<PatternFork> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ fork: PatternFork }>(`/regex/patterns/${patternId}/forks`, { ownerId, pattern, flags });
    return json.fork;
  }
  const db = await getRemoteDb();
  const [row] = await db.insert(patternForks).values({ patternId, ownerId, pattern, flags: flags ?? "g" }).returning();
  if (!row) throw new Error("Failed to fork pattern");
  return serializeFork(row);
}
