import { pgSchema, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard Postmortem — blameless incident postmortem + recurrence tracking.
 *
 * Intake from Hook (failed webhooks), Status (failed pipelines/deploys),
 * Pulse (blocker keywords), Slack (/postmortem create).
 */

export const postmortemSchema = pgSchema("postmortem");

export type TimelineEntry = {
  at: string;
  text: string;
};

export type PostmortemSections = {
  whatWentWell: string;
  whatDidnt: string;
  whereWeGotLucky: string;
};

export const postmortemIncidents = postmortemSchema.table(
  "incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    severity: text("severity").notNull().default("sev3"), // sev1 | sev2 | sev3 | sev4
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    summary: text("summary"),
    rootcauseMd: text("rootcause_md"),
    timeline: jsonb("timeline").$type<TimelineEntry[]>().notNull().default([]),
    sections: jsonb("sections").$type<PostmortemSections>().notNull().default({
      whatWentWell: "",
      whatDidnt: "",
      whereWeGotLucky: "",
    }),
    status: text("status").notNull().default("draft"), // draft | investigating | resolved | archived
    source: text("source"), // hook | status | pulse | slack | manual
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("postmortem_incidents_owner_idx").on(t.ownerId),
    statusIdx: index("postmortem_incidents_status_idx").on(t.status),
    startedIdx: index("postmortem_incidents_started_idx").on(t.startedAt),
  }),
);

export const postmortemActionItems = postmortemSchema.table(
  "action_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => postmortemIncidents.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    body: text("body").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    incidentIdx: index("postmortem_actions_incident_idx").on(t.incidentId),
    ownerIdx: index("postmortem_actions_owner_idx").on(t.ownerId),
  }),
);

export const postmortemRecurrenceLinks = postmortemSchema.table(
  "recurrence_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromIncidentId: uuid("from_incident_id")
      .notNull()
      .references(() => postmortemIncidents.id, { onDelete: "cascade" }),
    toIncidentId: uuid("to_incident_id")
      .notNull()
      .references(() => postmortemIncidents.id, { onDelete: "cascade" }),
    similarityNote: text("similarity_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    fromIdx: index("postmortem_recurrence_from_idx").on(t.fromIncidentId),
    toIdx: index("postmortem_recurrence_to_idx").on(t.toIncidentId),
  }),
);
