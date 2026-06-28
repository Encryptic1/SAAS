import { pgSchema, uuid, text, timestamp, index, jsonb, integer } from "drizzle-orm/pg-core";

/**
 * Standard Workspace — portfolio control panel for the Market Standard suite.
 *
 * Live status grid of all 13 apps + FloodG8 + SyncDevTime + Supabase + Stripe.
 * Tracks dev sessions (ms-suite dev), webhook tunnels, health-check history,
 * and dependency parity (depsync). Real-time logs via SSE.
 */

export const workspaceSchema = pgSchema("workspace");

export const workspaceSessions = workspaceSchema.table(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    label: text("label").notNull(),
    /** Apps started in this session (comma-separated product keys). */
    apps: text("apps").notNull().default(""),
    pid: integer("pid"),
    status: text("status").notNull().default("starting"), // starting | running | stopped | crashed
    logCursor: text("log_cursor"),
    metadata: jsonb("metadata"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    stoppedAt: timestamp("stopped_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("workspace_sessions_owner_idx").on(t.ownerId),
    statusIdx: index("workspace_sessions_status_idx").on(t.status),
  }),
);

export const workspaceHealthChecks = workspaceSchema.table(
  "health_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    target: text("target").notNull(), // product key or external name (floodg8, supabase, stripe, syncdevtime)
    url: text("url").notNull(),
    status: text("status").notNull(), // ok | degraded | down
    latencyMs: integer("latency_ms"),
    detail: text("detail"),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("workspace_health_owner_idx").on(t.ownerId),
    targetIdx: index("workspace_health_target_idx").on(t.target),
    checkedIdx: index("workspace_health_checked_idx").on(t.checkedAt),
  }),
);

export const workspaceTunnels = workspaceSchema.table(
  "tunnels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    /** Target app + route the tunnel forwards to (e.g. standard-hook /api/capture). */
    targetApp: text("target_app").notNull(),
    targetPath: text("target_path").notNull().default("/"),
    /** Cloudflare Tunnel URL or localhost proxy URL. */
    publicUrl: text("public_url"),
    provider: text("provider").notNull().default("cloudflare"), // cloudflare | localhost | ngrok
    status: text("status").notNull().default("inactive"), // inactive | active | error
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("workspace_tunnels_owner_idx").on(t.ownerId),
    targetIdx: index("workspace_tunnels_target_idx").on(t.targetApp),
  }),
);
