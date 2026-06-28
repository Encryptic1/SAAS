import {
  fetchGateway,
  postGateway,
  patchGateway,
  deleteGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "@market-standard/db";
import {
  workspaceSessions,
  workspaceHealthChecks,
  workspaceTunnels,
} from "@market-standard/db/schema/workspace";
import { eq, desc, and } from "@market-standard/db/query";

export type Session = Omit<
  typeof workspaceSessions.$inferSelect,
  "startedAt" | "stoppedAt" | "createdAt" | "updatedAt"
> & {
  startedAt: string;
  stoppedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type HealthCheck = Omit<typeof workspaceHealthChecks.$inferSelect, "checkedAt"> & {
  checkedAt: string;
};
export type Tunnel = Omit<
  typeof workspaceTunnels.$inferSelect,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

function toSession(r: typeof workspaceSessions.$inferSelect): Session {
  return {
    ...r,
    startedAt: r.startedAt.toISOString(),
    stoppedAt: r.stoppedAt ? r.stoppedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toCheck(r: typeof workspaceHealthChecks.$inferSelect): HealthCheck {
  return { ...r, checkedAt: r.checkedAt.toISOString() };
}

function toTunnel(r: typeof workspaceTunnels.$inferSelect): Tunnel {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

async function getRemoteDb() {
  return getDbAsync();
}

// ----- Sessions -----

export async function listSessions(ownerId: string): Promise<Session[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ sessions: Session[] }>(`/workspace/sessions?ownerId=${encodeURIComponent(ownerId)}`);
    return json.sessions;
  }
  const db = await getRemoteDb();
  const rows = await db
    .select()
    .from(workspaceSessions)
    .where(eq(workspaceSessions.ownerId, ownerId))
    .orderBy(desc(workspaceSessions.updatedAt));
  return rows.map(toSession);
}

export async function createSession(input: {
  ownerId: string;
  label: string;
  apps?: string;
  pid?: number | null;
  metadata?: Record<string, unknown>;
}): Promise<Session> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ session: Session }>(`/workspace/sessions`, input);
    return json.session;
  }
  const db = await getRemoteDb();
  const [row] = await db
    .insert(workspaceSessions)
    .values({
      ownerId: input.ownerId,
      label: input.label,
      apps: input.apps ?? "",
      pid: input.pid ?? null,
      status: "running",
      metadata: input.metadata ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create session");
  return toSession(row);
}

export async function updateSession(
  id: string,
  patch: {
    status?: string;
    pid?: number | null;
    logCursor?: string | null;
    stoppedAt?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<Session | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ session: Session }>(`/workspace/sessions/${id}`, patch);
    return json.session;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.pid !== undefined) updates.pid = patch.pid;
  if (patch.logCursor !== undefined) updates.logCursor = patch.logCursor;
  if (patch.stoppedAt !== undefined) updates.stoppedAt = patch.stoppedAt ? new Date(patch.stoppedAt) : null;
  if (patch.metadata !== undefined) updates.metadata = patch.metadata;
  const [row] = await db.update(workspaceSessions).set(updates).where(eq(workspaceSessions.id, id)).returning();
  return row ? toSession(row) : null;
}

// ----- Health checks -----

export async function listHealthChecks(ownerId: string, target?: string): Promise<HealthCheck[]> {
  if (isLocalGatewayMode()) {
    const qs = `ownerId=${encodeURIComponent(ownerId)}${target ? `&target=${encodeURIComponent(target)}` : ""}`;
    const json = await fetchGateway<{ checks: HealthCheck[] }>(`/workspace/health?${qs}`);
    return json.checks;
  }
  const db = await getRemoteDb();
  const conds = [eq(workspaceHealthChecks.ownerId, ownerId)];
  if (target) conds.push(eq(workspaceHealthChecks.target, target));
  const rows = await db
    .select()
    .from(workspaceHealthChecks)
    .where(conds.length === 1 ? conds[0]! : and(...conds))
    .orderBy(desc(workspaceHealthChecks.checkedAt))
    .limit(200);
  return rows.map(toCheck);
}

export async function recordHealthCheck(input: {
  ownerId: string;
  target: string;
  url: string;
  status: string;
  latencyMs?: number | null;
  detail?: string | null;
}): Promise<HealthCheck> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ check: HealthCheck }>(`/workspace/health`, input);
    return json.check;
  }
  const db = await getRemoteDb();
  const [row] = await db
    .insert(workspaceHealthChecks)
    .values({
      ownerId: input.ownerId,
      target: input.target,
      url: input.url,
      status: input.status,
      latencyMs: input.latencyMs ?? null,
      detail: input.detail ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to record health check");
  return toCheck(row);
}

// ----- Tunnels -----

export async function listTunnels(ownerId: string): Promise<Tunnel[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ tunnels: Tunnel[] }>(`/workspace/tunnels?ownerId=${encodeURIComponent(ownerId)}`);
    return json.tunnels;
  }
  const db = await getRemoteDb();
  const rows = await db
    .select()
    .from(workspaceTunnels)
    .where(eq(workspaceTunnels.ownerId, ownerId))
    .orderBy(desc(workspaceTunnels.updatedAt));
  return rows.map(toTunnel);
}

export async function createTunnel(input: {
  ownerId: string;
  name: string;
  targetApp: string;
  targetPath?: string;
  publicUrl?: string | null;
  provider?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}): Promise<Tunnel> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ tunnel: Tunnel }>(`/workspace/tunnels`, input);
    return json.tunnel;
  }
  const db = await getRemoteDb();
  const [row] = await db
    .insert(workspaceTunnels)
    .values({
      ownerId: input.ownerId,
      name: input.name,
      targetApp: input.targetApp,
      targetPath: input.targetPath ?? "/",
      publicUrl: input.publicUrl ?? null,
      provider: input.provider ?? "cloudflare",
      status: input.status ?? "inactive",
      metadata: input.metadata ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create tunnel");
  return toTunnel(row);
}

export async function updateTunnel(
  id: string,
  patch: { publicUrl?: string | null; status?: string; provider?: string; metadata?: Record<string, unknown> },
): Promise<Tunnel | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ tunnel: Tunnel }>(`/workspace/tunnels/${id}`, patch);
    return json.tunnel;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.publicUrl !== undefined) updates.publicUrl = patch.publicUrl;
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.provider !== undefined) updates.provider = patch.provider;
  if (patch.metadata !== undefined) updates.metadata = patch.metadata;
  const [row] = await db.update(workspaceTunnels).set(updates).where(eq(workspaceTunnels.id, id)).returning();
  return row ? toTunnel(row) : null;
}

export async function deleteTunnel(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/workspace/tunnels/${id}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(workspaceTunnels).where(eq(workspaceTunnels.id, id));
}
