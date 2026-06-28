import { pgSchema, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";

export const proofSchema = pgSchema("proof");

export const collections = proofSchema.table("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  plan: text("plan").notNull().default("free"),
  showBadge: boolean("show_badge").notNull().default(true),
  theme: text("theme").notNull().default("dark"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const testimonials = proofSchema.table("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => collections.id),
  authorName: text("author_name").notNull(),
  authorTitle: text("author_title"),
  authorAvatarUrl: text("author_avatar_url"),
  content: text("content").notNull(),
  rating: integer("rating"),
  isApproved: boolean("is_approved").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
