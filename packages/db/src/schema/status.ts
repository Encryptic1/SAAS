import { pgSchema, uuid, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";

/**
 * Standard Status — build/CI status dashboard.
 *
 * Pulls from GitHub Actions, Vercel deployments, and FloodG8 runner relay.
 * Cross-sells with Hook (failed webhook → CI fail), Release (rollback context),
 * and Postmortem (incident → create postmortem).
 */

export const statusSchema = pgSchema("status");

export const pipelines = statusSchema.table(
  "pipelines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    source: text("source").notNull(), // "github" | "vercel" | "floodg8"
    repoFullName: text("repo_full_name"),
    name: text("name").notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastStatus: text("last_status"), // "success" | "failed" | "running" | "cancelled"
    last30Runs: jsonb("last_30_runs").$type<Array<{ status: string; at: string }>>().default([]),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("status_pipelines_owner_idx").on(t.ownerId),
    sourceIdx: index("status_pipelines_source_idx").on(t.source),
  }),
);

export const deployments = statusSchema.table(
  "deployments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    environment: text("environment").notNull(),
    sha: text("sha"),
    status: text("status").notNull(), // "ready" | "building" | "error" | "canceled"
    deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull().defaultNow(),
    url: text("url"),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    pipelineIdx: index("status_deployments_pipeline_idx").on(t.pipelineId),
    deployedIdx: index("status_deployments_deployed_idx").on(t.deployedAt),
  }),
);

export const incidents = statusSchema.table(
  "incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    severity: text("severity").notNull().default("sev3"), // sev1 | sev2 | sev3 | sev4
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    status: text("status").notNull().default("investigating"), // investigating | identified | monitoring | resolved
    sourcePipelineId: uuid("source_pipeline_id").references(() => pipelines.id, { onDelete: "set null" }),
    summary: text("summary"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("status_incidents_owner_idx").on(t.ownerId),
    statusIdx: index("status_incidents_status_idx").on(t.status),
    startedIdx: index("status_incidents_started_idx").on(t.startedAt),
  }),
);
