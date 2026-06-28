import { pgSchema, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const notificationsSchema = pgSchema("notifications");

export const notifications = notificationsSchema.table(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    app: text("app").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    level: text("level").notNull().default("info"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_owner_idx").on(t.ownerId), index("notifications_created_idx").on(t.createdAt)],
);

export const notificationDeliveries = notificationsSchema.table(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    status: text("status").notNull().default("pending"),
    externalId: text("external_id"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("deliveries_notification_idx").on(t.notificationId)],
);

export type Notification = typeof notifications.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
