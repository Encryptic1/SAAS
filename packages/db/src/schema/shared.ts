import { pgSchema, text, timestamp, uuid, jsonb, boolean, integer, numeric } from "drizzle-orm/pg-core";

export const sharedSchema = pgSchema("shared");

export const kpiEvents = sharedSchema.table("kpi_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  product: text("product").notNull(),
  event: text("event").notNull(),
  userId: text("user_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const billingCustomers = sharedSchema.table("billing_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  product: text("product").notNull(),
  externalUserId: text("external_user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("free"),
  showBadge: boolean("show_badge").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ssoCodes = sharedSchema.table("sso_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  code: text("code").notNull().unique(),
  targetApp: text("target_app").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const digestConfigs = sharedSchema.table("digest_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  slackWorkspaceId: uuid("slack_workspace_id"),
  slackChannelId: text("slack_channel_id"),
  frequency: text("frequency").notNull().default("weekly"),
  sources: jsonb("sources").$type<string[]>().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pulseEvents = sharedSchema.table("pulse_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id"),
  userId: text("user_id"),
  source: text("source").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Agent activity report posted by `ms-agent report` (CLI). */
export const agentReports = sharedSchema.table("agent_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").notNull(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name"),
  tool: text("tool").notNull(),
  action: text("action").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull().default("ok"),
  detailJson: jsonb("detail_json").$type<Record<string, unknown>>(),
  repoFullName: text("repo_full_name"),
  branch: text("branch"),
  commitSha: text("commit_sha"),
  prUrl: text("pr_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One AI agent session — a single Claude Code/Cursor run, summarized. */
export const agentSessions = sharedSchema.table("agent_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").notNull(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name"),
  tool: text("tool").notNull(),
  sessionId: text("session_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  modelId: text("model_id"),
  cwd: text("cwd"),
  repoFullName: text("repo_full_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Cost line item — one per session or per aggregated batch. */
export const agentCosts = sharedSchema.table("agent_costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").notNull(),
  agentId: text("agent_id").notNull(),
  sessionId: text("session_id"),
  tool: text("tool").notNull(),
  modelId: text("model_id").notNull(),
  costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
  ratePromptUsd: numeric("rate_prompt_usd", { precision: 12, scale: 8 }),
  rateCompletionUsd: numeric("rate_completion_usd", { precision: 12, scale: 8 }),
  rateCacheReadUsd: numeric("rate_cache_read_usd", { precision: 12, scale: 8 }),
  rateCacheWriteUsd: numeric("rate_cache_write_usd", { precision: 12, scale: 8 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
