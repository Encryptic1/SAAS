import { pgSchema, uuid, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";

export const teamsSchema = pgSchema("teams");

export const teams = teamsSchema.table("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamMembers = teamsSchema.table(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    role: text("role").notNull().default("member"),
    invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("team_members_team_idx").on(t.teamId),
    index("team_members_owner_idx").on(t.ownerId),
  ],
);

export const invitations = teamsSchema.table(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by").notNull(),
    acceptedBy: text("accepted_by"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("invitations_team_idx").on(t.teamId),
    index("invitations_email_idx").on(t.email),
  ],
);

export const roles = teamsSchema.table("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  permissions: jsonb("permissions").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type Role = typeof roles.$inferSelect;
