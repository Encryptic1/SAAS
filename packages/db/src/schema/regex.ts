import { pgSchema, uuid, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard Regex — regex pattern builder + debugger.
 *
 * Pairs with VSIX (test from selection), Snippets (save regex),
 * Hook (test webhook payload regex).
 */

export const regexSchema = pgSchema("regex");

export type TestCase = {
  input: string;
  expectedMatches: number | null; // null = no assertion; otherwise expected match count
  note?: string;
};

export const patterns = regexSchema.table(
  "patterns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    pattern: text("pattern").notNull(),
    flags: text("flags").notNull().default("g"),
    description: text("description"),
    testCases: jsonb("test_cases").$type<TestCase[]>().notNull().default([]),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("regex_patterns_owner_idx").on(t.ownerId),
    publicIdx: index("regex_patterns_public_idx").on(t.isPublic),
    nameIdx: index("regex_patterns_name_idx").on(t.name),
  }),
);

export const patternForks = regexSchema.table(
  "pattern_forks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patternId: uuid("pattern_id")
      .notNull()
      .references(() => patterns.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    pattern: text("pattern").notNull(),
    flags: text("flags").notNull().default("g"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patternIdx: index("regex_pattern_forks_pattern_idx").on(t.patternId),
    ownerIdx: index("regex_pattern_forks_owner_idx").on(t.ownerId),
  }),
);
