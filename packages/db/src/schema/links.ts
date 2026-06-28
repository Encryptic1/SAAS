import { pgSchema, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const linksSchema = pgSchema("links");

export const linkRecords = linksSchema.table("link_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  stripeUrl: text("stripe_url").notNull(),
  stripeLinkId: text("stripe_link_id"),
  active: boolean("active").notNull().default(true),
  clickCount: integer("click_count").notNull().default(0),
  lastClickedAt: timestamp("last_clicked_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const linkClickEvents = linksSchema.table("link_click_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id")
    .notNull()
    .references(() => linkRecords.id),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  utm: jsonb("utm").$type<Record<string, string>>(),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).defaultNow().notNull(),
});

export type LinkRecord = typeof linkRecords.$inferSelect;
export type NewLinkRecord = typeof linkRecords.$inferInsert;
export type LinkClickEvent = typeof linkClickEvents.$inferSelect;
