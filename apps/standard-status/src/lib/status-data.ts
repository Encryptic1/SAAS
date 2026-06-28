import {
  fetchGateway,
  postGateway,
  patchGateway,
  deleteGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "@market-standard/db";
import { pipelines, deployments, incidents } from "@market-standard/db/schema/status";
import { eq, desc } from "@market-standard/db/query";

/**
 * JSON-shaped versions of the row types (dates become ISO strings when
 * returned from the gateway). We use these for the public API so callers
 * don't have to deal with Date | string ambiguity.
 */
export type Pipeline = Omit<typeof pipelines.$inferSelect, "lastRunAt" | "createdAt" | "updatedAt"> & {
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type Deployment = Omit<typeof deployments.$inferSelect, "deployedAt"> & {
  deployedAt: string;
};
export type Incident = Omit<typeof incidents.$inferSelect, "startedAt" | "resolvedAt" | "createdAt" | "updatedAt"> & {
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function getRemoteDb() {
  return getDbAsync();
}

async function listPipelinesRemote(ownerId: string): Promise<Pipeline[]> {
  const db = await getRemoteDb();
  const rows = await db.select().from(pipelines).where(eq(pipelines.ownerId, ownerId)).orderBy(desc(pipelines.updatedAt));
  return rows.map((r) => ({
    ...r,
    lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

async function getPipelineRemote(id: string): Promise<{ pipeline: Pipeline; deployments: Deployment[] } | null> {
  const db = await getRemoteDb();
  const [pipeline] = await db.select().from(pipelines).where(eq(pipelines.id, id)).limit(1);
  if (!pipeline) return null;
  const deploys = await db
    .select()
    .from(deployments)
    .where(eq(deployments.pipelineId, id))
    .orderBy(desc(deployments.deployedAt))
    .limit(30);
  return {
    pipeline: {
      ...pipeline,
      lastRunAt: pipeline.lastRunAt ? pipeline.lastRunAt.toISOString() : null,
      createdAt: pipeline.createdAt.toISOString(),
      updatedAt: pipeline.updatedAt.toISOString(),
    },
    deployments: deploys.map((d) => ({ ...d, deployedAt: d.deployedAt.toISOString() })),
  };
}

async function listIncidentsRemote(ownerId: string): Promise<Incident[]> {
  const db = await getRemoteDb();
  const rows = await db.select().from(incidents).where(eq(incidents.ownerId, ownerId)).orderBy(desc(incidents.startedAt));
  return rows.map((r) => ({
    ...r,
    startedAt: r.startedAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

// Public API (auto-routes to gateway or remote)

export async function listPipelines(ownerId: string): Promise<Pipeline[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ pipelines: Pipeline[] }>(`/status/pipelines?ownerId=${encodeURIComponent(ownerId)}`);
    return json.pipelines;
  }
  return listPipelinesRemote(ownerId);
}

export async function getPipeline(id: string): Promise<{ pipeline: Pipeline; deployments: Deployment[] } | null> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ pipeline: Pipeline; deployments: Deployment[] }>(`/status/pipelines/${id}`);
    return json.pipeline ? json : null;
  }
  return getPipelineRemote(id);
}
export async function createPipeline(input: {
  ownerId: string;
  source: string;
  name: string;
  repoFullName?: string;
}): Promise<Pipeline> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ pipeline: Pipeline }>(`/status/pipelines`, input);
    return json.pipeline;
  }
  const db = await getRemoteDb();
  const [row] = await db.insert(pipelines).values(input).returning();
  if (!row) throw new Error("Failed to create pipeline");
  return {
    ...row,
    lastRunAt: row.lastRunAt ? row.lastRunAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updatePipeline(
  id: string,
  patch: {
    lastRunAt?: string | null;
    lastStatus?: string | null;
    last30Runs?: Array<{ status: string; at: string }>;
    metadata?: Record<string, unknown>;
    repoFullName?: string | null;
  },
): Promise<Pipeline | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ pipeline: Pipeline }>(`/status/pipelines/${id}`, patch);
    return json.pipeline;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.lastRunAt !== undefined) updates.lastRunAt = patch.lastRunAt ? new Date(patch.lastRunAt) : null;
  if (patch.lastStatus !== undefined) updates.lastStatus = patch.lastStatus;
  if (patch.last30Runs !== undefined) updates.last30Runs = patch.last30Runs;
  if (patch.metadata !== undefined) updates.metadata = patch.metadata;
  if (patch.repoFullName !== undefined) updates.repoFullName = patch.repoFullName;
  const [row] = await db.update(pipelines).set(updates).where(eq(pipelines.id, id)).returning();
  if (!row) return null;
  return {
    ...row,
    lastRunAt: row.lastRunAt ? row.lastRunAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deletePipeline(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/status/pipelines/${id}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(pipelines).where(eq(pipelines.id, id));
}

export async function addDeployment(input: {
  pipelineId: string;
  environment: string;
  sha?: string;
  status: string;
  url?: string;
  metadata?: Record<string, unknown>;
}): Promise<Deployment> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ deployment: Deployment }>(`/status/pipelines/${input.pipelineId}/deployments`, input);
    return json.deployment;
  }
  const db = await getRemoteDb();
  const [row] = await db.insert(deployments).values(input).returning();
  if (!row) throw new Error("Failed to log deployment");
  return { ...row, deployedAt: row.deployedAt.toISOString() };
}

export async function listIncidents(ownerId: string): Promise<Incident[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ incidents: Incident[] }>(`/status/incidents?ownerId=${encodeURIComponent(ownerId)}`);
    return json.incidents;
  }
  return listIncidentsRemote(ownerId);
}

export async function createIncident(input: {
  ownerId: string;
  title: string;
  severity?: string;
  sourcePipelineId?: string;
  summary?: string;
}): Promise<Incident> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ incident: Incident }>(`/status/incidents`, input);
    return json.incident;
  }
  const db = await getRemoteDb();
  const [row] = await db.insert(incidents).values(input).returning();
  if (!row) throw new Error("Failed to create incident");
  return {
    ...row,
    startedAt: row.startedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateIncident(
  id: string,
  patch: {
    status?: string;
    severity?: string;
    summary?: string | null;
    resolvedAt?: string | null;
  },
): Promise<Incident | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ incident: Incident }>(`/status/incidents/${id}`, patch);
    return json.incident;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.severity !== undefined) updates.severity = patch.severity;
  if (patch.summary !== undefined) updates.summary = patch.summary;
  if (patch.resolvedAt !== undefined) {
    updates.resolvedAt = patch.resolvedAt ? new Date(patch.resolvedAt) : null;
  } else if (patch.status === "resolved") {
    updates.resolvedAt = new Date();
  }
  const [row] = await db.update(incidents).set(updates).where(eq(incidents.id, id)).returning();
  if (!row) return null;
  return {
    ...row,
    startedAt: row.startedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteIncident(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/status/incidents/${id}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(incidents).where(eq(incidents.id, id));
}
