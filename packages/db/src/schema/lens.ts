import { pgSchema, uuid, text, timestamp, numeric, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard Lens — DB query optimizer + slow query detection.
 *
 * Pairs with Hook (webhook payload regex), Status (failed pipeline → query
 * blame), and Vault (DB connection string reference). Cross-sells to Pulse.
 */

export const lensSchema = pgSchema("lens");

export type ExplainNode = {
  nodeType: string;
  relation?: string;
  alias?: string;
  indexName?: string;
  rows?: number;
  cost?: number;
  filter?: string;
  children?: ExplainNode[];
};

export const queries = lensSchema.table(
  "queries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    sqlText: text("sql_text").notNull(),
    databaseLabel: text("database_label").notNull().default("default"),
    avgMs: numeric("avg_ms", { precision: 12, scale: 2 }),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastExplain: jsonb("last_explain").$type<ExplainNode | { plan: ExplainNode[] } | null>(),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    isPinned: boolean("is_pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("lens_queries_owner_idx").on(t.ownerId),
    pinnedIdx: index("lens_queries_pinned_idx").on(t.isPinned),
    updatedIdx: index("lens_queries_updated_idx").on(t.updatedAt),
  }),
);

export const slowQueries = lensSchema.table(
  "slow_queries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    queryHash: text("query_hash").notNull(),
    sqlText: text("sql_text").notNull(),
    durationMs: numeric("duration_ms", { precision: 12, scale: 2 }).notNull(),
    thresholdMs: numeric("threshold_ms", { precision: 12, scale: 2 }).notNull(),
    source: text("source").notNull().default("postgres"),
    databaseLabel: text("database_label").notNull().default("default"),
    metadata: jsonb("metadata"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("lens_slow_queries_owner_idx").on(t.ownerId),
    capturedIdx: index("lens_slow_queries_captured_idx").on(t.capturedAt),
    sourceIdx: index("lens_slow_queries_source_idx").on(t.source),
  }),
);
