import { pgSchema, text, timestamp, uuid, bigint } from "drizzle-orm/pg-core";

export const releaseSchema = pgSchema("release");

export const releaseRepos = releaseSchema.table("repos", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  githubInstallationId: bigint("github_installation_id", { mode: "number" }),
  repoFullName: text("repo_full_name").notNull(),
  defaultBranch: text("default_branch").notNull().default("main"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const releaseNotes = releaseSchema.table("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoId: uuid("repo_id")
    .notNull()
    .references(() => releaseRepos.id),
  version: text("version").notNull(),
  title: text("title"),
  bodyMd: text("body_md").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
