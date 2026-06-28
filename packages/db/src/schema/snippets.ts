import { pgSchema, uuid, text, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard Snippets — code snippet manager with sharing, tagging, versioning.
 *
 * Lives in the `shared` schema so FloodG8 Plan Editor can resolve
 * `[[snippet:abc]]` references via Supabase from a separate Vercel project.
 */

export const snippetsSchema = pgSchema("shared");

export const snippets = snippetsSchema.table(
  "snippets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull(),
    title: text("title").notNull(),
    language: text("language").notNull().default("plaintext"),
    body: text("body").notNull().default(""),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    teamId: uuid("team_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("snippets_owner_idx").on(t.ownerId),
    teamIdx: index("snippets_team_idx").on(t.teamId),
    titleIdx: index("snippets_title_idx").on(t.title),
  }),
);

export const snippetVersions = snippetsSchema.table(
  "snippet_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    snippetId: uuid("snippet_id")
      .notNull()
      .references(() => snippets.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    versionNote: text("version_note"),
    createdBy: uuid("created_by").notNull(),
    versionNumber: integer("version_number").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    snippetIdx: index("snippet_versions_snippet_idx").on(t.snippetId),
    versionIdx: index("snippet_versions_version_idx").on(t.snippetId, t.versionNumber),
  }),
);

export const snippetShares = snippetsSchema.table(
  "snippet_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    snippetId: uuid("snippet_id")
      .notNull()
      .references(() => snippets.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugUnique: uniqueIndex("snippet_shares_slug_unique").on(t.slug),
    snippetIdx: index("snippet_shares_snippet_idx").on(t.snippetId),
  }),
);
