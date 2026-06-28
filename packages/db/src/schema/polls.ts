import { pgSchema, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";

export const pollsSchema = pgSchema("polls");

export const workspaces = pollsSchema.table("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  slackTeamId: text("slack_team_id").notNull().unique(),
  slackTeamName: text("slack_team_name"),
  botToken: text("bot_token").notNull(),
  plan: text("plan").notNull().default("free"),
  showBadge: boolean("show_badge").notNull().default(true),
  installedAt: timestamp("installed_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaceMembers = pollsSchema.table("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const polls = pollsSchema.table("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  channelId: text("channel_id").notNull(),
  messageTs: text("message_ts"),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  createdBy: text("created_by").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  isClosed: boolean("is_closed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const votes = pollsSchema.table("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id")
    .notNull()
    .references(() => polls.id),
  slackUserId: text("slack_user_id").notNull(),
  optionIndex: integer("option_index").notNull(),
  votedAt: timestamp("voted_at", { withTimezone: true }).defaultNow().notNull(),
});
