import {
  fetchGateway,
  postGateway,
  patchGateway,
  deleteGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "@market-standard/db";
import {
  postmortemIncidents as incidents,
  postmortemActionItems as actionItems,
  postmortemRecurrenceLinks as recurrenceLinks,
} from "@market-standard/db/schema/postmortem";
import { eq, desc } from "@market-standard/db/query";

export type Incident = Omit<
  typeof incidents.$inferSelect,
  "startedAt" | "resolvedAt" | "createdAt" | "updatedAt"
> & {
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActionItem = Omit<typeof actionItems.$inferSelect, "dueAt" | "completedAt" | "createdAt"> & {
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type RecurrenceLink = Omit<typeof recurrenceLinks.$inferSelect, "createdAt"> & {
  createdAt: string;
};

export type RecurrenceSuggestion = {
  fromId: string;
  toId: string;
  fromTitle: string;
  toTitle: string;
  similarity: number;
};

async function getRemoteDb() {
  return getDbAsync();
}

function serializeIncident(r: typeof incidents.$inferSelect): Incident {
  return {
    ...r,
    startedAt: r.startedAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeAction(r: typeof actionItems.$inferSelect): ActionItem {
  return {
    ...r,
    dueAt: r.dueAt ? r.dueAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

function serializeLink(r: typeof recurrenceLinks.$inferSelect): RecurrenceLink {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

export async function listIncidents(ownerId: string): Promise<Incident[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ incidents: Incident[] }>(`/postmortem/incidents?ownerId=${encodeURIComponent(ownerId)}`);
    return json.incidents;
  }
  const db = await getRemoteDb();
  const rows = await db.select().from(incidents).where(eq(incidents.ownerId, ownerId)).orderBy(desc(incidents.startedAt));
  return rows.map(serializeIncident);
}

export async function getIncident(id: string): Promise<{
  incident: Incident;
  actionItems: ActionItem[];
  recurrenceLinks: RecurrenceLink[];
} | null> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ incident: Incident; actionItems: ActionItem[]; recurrenceLinks: RecurrenceLink[] }>(`/postmortem/incidents/${id}`);
    return json.incident ? json : null;
  }
  const db = await getRemoteDb();
  const [row] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  if (!row) return null;
  const [actions, linksFrom, linksTo] = await Promise.all([
    db.select().from(actionItems).where(eq(actionItems.incidentId, id)),
    db.select().from(recurrenceLinks).where(eq(recurrenceLinks.fromIncidentId, id)),
    db.select().from(recurrenceLinks).where(eq(recurrenceLinks.toIncidentId, id)),
  ]);
  return {
    incident: serializeIncident(row),
    actionItems: actions.map(serializeAction),
    recurrenceLinks: [...linksFrom, ...linksTo].map(serializeLink),
  };
}

export async function createIncident(input: {
  ownerId: string;
  title: string;
  severity?: string;
  startedAt?: string;
  resolvedAt?: string;
  summary?: string;
  rootcauseMd?: string;
  timeline?: Array<{ at: string; text: string }>;
  sections?: { whatWentWell: string; whatDidnt: string; whereWeGotLucky: string };
  status?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<Incident> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ incident: Incident }>(`/postmortem/incidents`, input);
    return json.incident;
  }
  const db = await getRemoteDb();
  const [row] = await db
    .insert(incidents)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      severity: input.severity ?? "sev3",
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      resolvedAt: input.resolvedAt ? new Date(input.resolvedAt) : null,
      summary: input.summary ?? null,
      rootcauseMd: input.rootcauseMd ?? null,
      timeline: input.timeline ?? [],
      sections: input.sections ?? { whatWentWell: "", whatDidnt: "", whereWeGotLucky: "" },
      status: input.status ?? "draft",
      source: input.source ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create incident");
  return serializeIncident(row);
}

export async function updateIncident(
  id: string,
  patch: {
    title?: string;
    severity?: string;
    startedAt?: string;
    resolvedAt?: string | null;
    summary?: string | null;
    rootcauseMd?: string | null;
    timeline?: Array<{ at: string; text: string }>;
    sections?: { whatWentWell: string; whatDidnt: string; whereWeGotLucky: string };
    status?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<Incident | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ incident: Incident }>(`/postmortem/incidents/${id}`, patch);
    return json.incident;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.severity !== undefined) updates.severity = patch.severity;
  if (patch.startedAt !== undefined) updates.startedAt = new Date(patch.startedAt);
  if (patch.resolvedAt !== undefined) updates.resolvedAt = patch.resolvedAt ? new Date(patch.resolvedAt) : null;
  if (patch.summary !== undefined) updates.summary = patch.summary;
  if (patch.rootcauseMd !== undefined) updates.rootcauseMd = patch.rootcauseMd;
  if (patch.timeline !== undefined) updates.timeline = patch.timeline;
  if (patch.sections !== undefined) updates.sections = patch.sections;
  if (patch.status !== undefined) {
    updates.status = patch.status;
    if (patch.status === "resolved" && !patch.resolvedAt) {
      updates.resolvedAt = new Date();
    }
  }
  if (patch.metadata !== undefined) updates.metadata = patch.metadata;
  const [row] = await db.update(incidents).set(updates).where(eq(incidents.id, id)).returning();
  if (!row) return null;
  return serializeIncident(row);
}

export async function deleteIncident(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/postmortem/incidents/${id}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(incidents).where(eq(incidents.id, id));
}

export async function addActionItem(input: {
  incidentId: string;
  ownerId: string;
  body: string;
  dueAt?: string;
}): Promise<ActionItem> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ actionItem: ActionItem }>(`/postmortem/incidents/${input.incidentId}/actions`, input);
    return json.actionItem;
  }
  const db = await getRemoteDb();
  const [row] = await db
    .insert(actionItems)
    .values({
      incidentId: input.incidentId,
      ownerId: input.ownerId,
      body: input.body,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    })
    .returning();
  if (!row) throw new Error("Failed to add action item");
  return serializeAction(row);
}

export async function updateActionItem(
  actionId: string,
  patch: { body?: string; dueAt?: string | null; completedAt?: string | null },
): Promise<ActionItem | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ actionItem: ActionItem }>(`/postmortem/actions/${actionId}`, patch);
    return json.actionItem;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = {};
  if (patch.body !== undefined) updates.body = patch.body;
  if (patch.dueAt !== undefined) updates.dueAt = patch.dueAt ? new Date(patch.dueAt) : null;
  if (patch.completedAt !== undefined) updates.completedAt = patch.completedAt ? new Date(patch.completedAt) : null;
  const [row] = await db.update(actionItems).set(updates).where(eq(actionItems.id, actionId)).returning();
  if (!row) return null;
  return serializeAction(row);
}

export async function deleteActionItem(actionId: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/postmortem/actions/${actionId}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(actionItems).where(eq(actionItems.id, actionId));
}

export async function linkIncidents(
  fromId: string,
  toIncidentId: string,
  similarityNote?: string,
): Promise<RecurrenceLink> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ link: RecurrenceLink }>(`/postmortem/incidents/${fromId}/links`, {
      toIncidentId,
      similarityNote,
    });
    return json.link;
  }
  const db = await getRemoteDb();
  const [row] = await db
    .insert(recurrenceLinks)
    .values({ fromIncidentId: fromId, toIncidentId, similarityNote: similarityNote ?? null })
    .returning();
  if (!row) throw new Error("Failed to link incidents");
  return serializeLink(row);
}

export async function unlinkIncidents(linkId: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/postmortem/links/${linkId}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(recurrenceLinks).where(eq(recurrenceLinks.id, linkId));
}

export async function getRecurrenceSuggestions(ownerId: string, threshold = 0.4): Promise<RecurrenceSuggestion[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ suggestions: RecurrenceSuggestion[] }>(
      `/postmortem/recurrence?ownerId=${encodeURIComponent(ownerId)}&threshold=${threshold}`,
    );
    return json.suggestions;
  }
  // Remote: pgvector cosine similarity on rootcause_md embeddings (production path).
  // For the local-dev parity path we fall back to the same Jaccard token-overlap
  // the gateway uses; the production migration wires pgvector instead.
  const db = await getRemoteDb();
  const rows = await db.select().from(incidents).where(eq(incidents.ownerId, ownerId));
  const tokenized = rows.map((r) => ({
    id: r.id,
    title: r.title,
    tokens: tokenize(r.rootcauseMd ?? r.summary ?? r.title),
  }));
  const out: RecurrenceSuggestion[] = [];
  for (let i = 0; i < tokenized.length; i += 1) {
    const a = tokenized[i]!;
    for (let j = i + 1; j < tokenized.length; j += 1) {
      const b = tokenized[j]!;
      const sim = jaccard(a.tokens, b.tokens);
      if (sim >= threshold) {
        out.push({
          fromId: a.id,
          toId: b.id,
          fromTitle: a.title,
          toTitle: b.title,
          similarity: sim,
        });
      }
    }
  }
  out.sort((a, b) => b.similarity - a.similarity);
  return out.slice(0, 20);
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
