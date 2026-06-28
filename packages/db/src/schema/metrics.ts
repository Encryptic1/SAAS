import { pgSchema, text, timestamp, uuid, numeric, jsonb, integer, boolean } from "drizzle-orm/pg-core";

export const metricsSchema = pgSchema("metrics");

export const stripeAccounts = metricsSchema.table("stripe_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeAccountId: text("stripe_account_id").notNull().unique(),
  ownerId: text("owner_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  plan: text("plan").notNull().default("free"),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
});

export const metricSnapshots = metricsSchema.table("metric_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeAccountId: uuid("stripe_account_id")
    .notNull()
    .references(() => stripeAccounts.id),
  snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull(),
  mrr: numeric("mrr", { precision: 12, scale: 2 }).notNull(),
  arr: numeric("arr", { precision: 12, scale: 2 }).notNull(),
  churnRate: numeric("churn_rate", { precision: 5, scale: 4 }),
  ltv: numeric("ltv", { precision: 12, scale: 2 }),
  activeSubscriptions: integer("active_subscriptions").notNull().default(0),
  breakdown: jsonb("breakdown").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentLinks = metricsSchema.table("payment_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeAccountId: uuid("stripe_account_id")
    .notNull()
    .references(() => stripeAccounts.id),
  stripeLinkId: text("stripe_link_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  active: boolean("active").notNull().default(true),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quotaSamples = metricsSchema.table("quota_samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeAccountId: uuid("stripe_account_id").references(() => stripeAccounts.id),
  source: text("source").notNull(),
  quotaLabel: text("quota_label").notNull(),
  used: integer("used").notNull().default(0),
  limit: integer("limit"),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  windowEndsAt: timestamp("window_ends_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  sampledAt: timestamp("sampled_at", { withTimezone: true }).defaultNow().notNull(),
});

export type QuotaSample = typeof quotaSamples.$inferSelect;
export type NewQuotaSample = typeof quotaSamples.$inferInsert;
