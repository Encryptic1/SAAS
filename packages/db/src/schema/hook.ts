import { pgSchema, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

export const hookSchema = pgSchema("hook");

export const webhookInboxes = hookSchema.table("webhook_inboxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull().default("Inbox"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEvents = hookSchema.table("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  inboxId: uuid("inbox_id")
    .notNull()
    .references(() => webhookInboxes.id),
  method: text("method").notNull().default("POST"),
  headers: jsonb("headers").$type<Record<string, string>>(),
  body: text("body"),
  queryParams: jsonb("query_params").$type<Record<string, string>>(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});
