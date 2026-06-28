import { pgSchema, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { workspaces } from "./polls";

export const standupSchema = pgSchema("standup");

export const standupPrompts = standupSchema.table("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  channelId: text("channel_id").notNull(),
  scheduleCron: text("schedule_cron").notNull().default("0 9 * * 1-5"),
  questions: text("questions").array().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const standupResponses = standupSchema.table("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptId: uuid("prompt_id")
    .notNull()
    .references(() => standupPrompts.id),
  slackUserId: text("slack_user_id").notNull(),
  answers: text("answers").array().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});
