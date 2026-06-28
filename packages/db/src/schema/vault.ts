import { pgSchema, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";

// Schema is named `msvault` (not `vault`) to avoid colliding with Supabase's
// built-in `vault` extension (pgsodium) which reserves that schema name.
export const vaultSchema = pgSchema("msvault");

/** A grouping of secrets for a project (e.g. "my-app production"). */
export const vaultProjects = vaultSchema.table("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  environment: text("environment").notNull().default("production"),
  /** GitHub repository full name (owner/repo) for GitHub Actions sync. */
  githubRepo: text("github_repo"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** An encrypted secret value. Ciphertext + nonce are stored as base64 strings. */
export const vaultSecrets = vaultSchema.table("secrets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => vaultProjects.id),
  key: text("key").notNull(),
  /** AES-256-GCM ciphertext, base64. */
  ciphertext: text("ciphertext").notNull(),
  /** AES-256-GCM nonce, base64. */
  nonce: text("nonce").notNull(),
  /** SHA-256 hash of the plaintext, used for "did this value change?" detection. */
  valueHash: text("value_hash"),
  version: integer("version").notNull().default(1),
  /** When true, AI agents may see that this key exists (via the reference endpoint) without seeing the value. */
  agentReference: boolean("agent_reference").notNull().default(false),
  notes: text("notes"),
  lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Every read/write/rotate is audited. */
export const vaultAuditLog = vaultSchema.table("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => vaultProjects.id),
  secretId: uuid("secret_id"),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  /** Snapshot of metadata (never the secret value). */
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Long-lived tokens for the env-injection CLI shim. */
export const vaultTokens = vaultSchema.table("tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => vaultProjects.id),
  name: text("name").notNull(),
  /** SHA-256 hash of the token; the plaintext is shown once at creation time. */
  tokenHash: text("token_hash").notNull().unique(),
  /** Last 4 chars of the plaintext token, for display. */
  last4: text("last4").notNull(),
  scopes: jsonb("scopes").$type<string[]>().notNull().default(["read"]),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type VaultProject = typeof vaultProjects.$inferSelect;
export type NewVaultProject = typeof vaultProjects.$inferInsert;
export type VaultSecret = typeof vaultSecrets.$inferSelect;
export type NewVaultSecret = typeof vaultSecrets.$inferInsert;
export type VaultAuditLog = typeof vaultAuditLog.$inferSelect;
export type VaultToken = typeof vaultTokens.$inferSelect;
