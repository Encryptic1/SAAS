import { pgSchema, uuid, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Standard Cron — cron monitor for Vercel Cron, GitHub Actions, FloodG8 runners.
 *
 * Jobs register a heartbeat URL; missed windows alert via Slack + Suite Pulse.
 * Cross-sells with Hook (failed webhook → cron blame), Status (CI pane), Vault.
 */

export const cronSchema = pgSchema("cron");

export const jobs = cronSchema.table(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    scheduleCron: text("schedule_cron").notNull(),
    source: text("source").notNull().default("custom"), // "vercel" | "github" | "floodg8" | "custom"
    expectedWindowMinutes: integer("expected_window_minutes").notNull().default(5),
    graceMinutes: integer("grace_minutes").notNull().default(2),
    alertChannel: text("alert_channel"), // slack webhook URL, "pulse", or null
    heartbeatToken: text("heartbeat_token").notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastStatus: text("last_status"), // "ok" | "failed" | "running" | "missed"
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("cron_jobs_owner_idx").on(t.ownerId),
    tokenIdx: index("cron_jobs_token_idx").on(t.heartbeatToken),
    sourceIdx: index("cron_jobs_source_idx").on(t.source),
  }),
);

export const runs = cronSchema.table(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // "ok" | "failed" | "running" | "missed"
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    jobIdx: index("cron_runs_job_idx").on(t.jobId),
    startedIdx: index("cron_runs_started_idx").on(t.startedAt),
    statusIdx: index("cron_runs_status_idx").on(t.status),
  }),
);
