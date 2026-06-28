import {
  fetchGateway,
  postGateway,
  patchGateway,
  deleteGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "@market-standard/db";
import { jobs, runs } from "@market-standard/db/schema/cron";
import { eq, desc } from "@market-standard/db/query";
import { randomUUID } from "node:crypto";
export type Job = Omit<
  typeof jobs.$inferSelect,
  "lastRunAt" | "lastHeartbeatAt" | "createdAt" | "updatedAt"
> & {
  lastRunAt: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Run = Omit<typeof runs.$inferSelect, "startedAt" | "finishedAt"> & {
  startedAt: string;
  finishedAt: string | null;
};

async function getRemoteDb() {
  return getDbAsync();
}

function serializeJob(r: typeof jobs.$inferSelect): Job {
  return {
    ...r,
    lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
    lastHeartbeatAt: r.lastHeartbeatAt ? r.lastHeartbeatAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeRun(r: typeof runs.$inferSelect): Run {
  return {
    ...r,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
  };
}

export async function listJobs(ownerId: string): Promise<Job[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ jobs: Job[] }>(`/cron/jobs?ownerId=${encodeURIComponent(ownerId)}`);
    return json.jobs;
  }
  const db = await getRemoteDb();
  const rows = await db.select().from(jobs).where(eq(jobs.ownerId, ownerId)).orderBy(desc(jobs.updatedAt));
  return rows.map(serializeJob);
}

export async function getJob(id: string): Promise<{ job: Job; runs: Run[] } | null> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ job: Job; runs: Run[] }>(`/cron/jobs/${id}`);
    return json.job ? json : null;
  }
  const db = await getRemoteDb();
  const [row] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!row) return null;
  const recentRuns = await db
    .select()
    .from(runs)
    .where(eq(runs.jobId, id))
    .orderBy(desc(runs.startedAt))
    .limit(30);
  return { job: serializeJob(row), runs: recentRuns.map(serializeRun) };
}

export async function createJob(input: {
  ownerId: string;
  name: string;
  scheduleCron: string;
  source?: string;
  expectedWindowMinutes?: number;
  graceMinutes?: number;
  alertChannel?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<Job> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ job: Job }>(`/cron/jobs`, input);
    return json.job;
  }
  const db = await getRemoteDb();
  const [row] = await db.insert(jobs).values({ ...input, heartbeatToken: randomUUID() }).returning();
  if (!row) throw new Error("Failed to create job");
  return serializeJob(row);
}

export async function updateJob(
  id: string,
  patch: {
    name?: string;
    scheduleCron?: string;
    source?: string;
    expectedWindowMinutes?: number;
    graceMinutes?: number;
    alertChannel?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<Job | null> {
  if (isLocalGatewayMode()) {
    const json = await patchGateway<{ job: Job }>(`/cron/jobs/${id}`, patch);
    return json.job ?? null;
  }
  const db = await getRemoteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.scheduleCron !== undefined) updates.scheduleCron = patch.scheduleCron;
  if (patch.source !== undefined) updates.source = patch.source;
  if (patch.expectedWindowMinutes !== undefined) updates.expectedWindowMinutes = patch.expectedWindowMinutes;
  if (patch.graceMinutes !== undefined) updates.graceMinutes = patch.graceMinutes;
  if (patch.alertChannel !== undefined) updates.alertChannel = patch.alertChannel;
  if (patch.metadata !== undefined) updates.metadata = patch.metadata;
  const [row] = await db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
  return row ? serializeJob(row) : null;
}

export async function deleteJob(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/cron/jobs/${id}`);
    return;
  }
  const db = await getRemoteDb();
  await db.delete(jobs).where(eq(jobs.id, id));
}

export async function addRun(input: {
  jobId: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
}): Promise<Run> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ run: Run }>(`/cron/jobs/${input.jobId}/runs`, input);
    return json.run;
  }
  const db = await getRemoteDb();
  const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
  const finishedAt = input.finishedAt
    ? new Date(input.finishedAt)
    : input.durationMs !== undefined
      ? new Date(startedAt.getTime() + Number(input.durationMs ?? 0))
      : new Date();
  const [row] = await db
    .insert(runs)
    .values({
      jobId: input.jobId,
      status: input.status ?? "ok",
      startedAt,
      finishedAt,
      durationMs: input.durationMs ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to log run");
  await db
    .update(jobs)
    .set({ lastRunAt: startedAt, lastStatus: input.status ?? "ok", lastHeartbeatAt: new Date(), updatedAt: new Date() })
    .where(eq(jobs.id, input.jobId));
  return serializeRun(row);
}

/** Public heartbeat — looks up a job by its token and records a run. */
export async function heartbeatByToken(
  token: string,
  input: { status?: string; durationMs?: number | null; metadata?: Record<string, unknown> },
): Promise<Run | null> {
  if (isLocalGatewayMode()) {
    try {
      const json = await postGateway<{ ok: boolean; run: Run }>(
        `/cron/heartbeat/${encodeURIComponent(token)}`,
        input,
      );
      return json.run ?? null;
    } catch (err) {
      if (err instanceof Error && /failed: 404/.test(err.message)) return null;
      throw err;
    }
  }
  const db = await getRemoteDb();
  const [job] = await db.select().from(jobs).where(eq(jobs.heartbeatToken, token)).limit(1);
  if (!job) return null;
  const now = new Date();
  const status = input.status ?? "ok";
  const [row] = await db
    .insert(runs)
    .values({
      jobId: job.id,
      status,
      startedAt: now,
      finishedAt: now,
      durationMs: input.durationMs ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();
  await db
    .update(jobs)
    .set({ lastRunAt: now, lastStatus: status, lastHeartbeatAt: now, updatedAt: now })
    .where(eq(jobs.id, job.id));
  return row ? serializeRun(row) : null;
}
