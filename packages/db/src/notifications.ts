import {
  fetchGateway,
  postGateway,
  patchGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "./index";
import { notifications, notificationDeliveries, type Notification } from "./schema/notifications";
import { eq, desc } from "drizzle-orm";

export type NotificationInput = {
  ownerId: string;
  app: string;
  title: string;
  body?: string;
  href?: string;
  level?: "info" | "success" | "warn" | "error";
};

export type NotificationRow = Omit<Notification, "readAt" | "createdAt"> & {
  readAt: string | null;
  createdAt: string;
};

function serialize(n: Notification): NotificationRow {
  return {
    ...n,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function listNotifications(ownerId: string, limit = 50): Promise<NotificationRow[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ notifications: NotificationRow[] }>(
      `/notifications?ownerId=${encodeURIComponent(ownerId)}&limit=${limit}`,
    );
    return json.notifications;
  }
  const db = await getDbAsync();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.ownerId, ownerId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map(serialize);
}

export async function createNotification(input: NotificationInput): Promise<NotificationRow> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ notification: NotificationRow }>(`/notifications`, input);
    return json.notification;
  }
  const db = await getDbAsync();
  const [row] = await db
    .insert(notifications)
    .values({
      ownerId: input.ownerId,
      app: input.app,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      level: input.level ?? "info",
    })
    .returning();
  if (!row) throw new Error("Failed to create notification");
  // Fire-and-forget delivery fan-out (email / Slack). Off by default — only
  // activates when the relevant provider env var is configured.
  void dispatchDeliveries(row.id, input).catch(() => {});
  return serialize(row);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await patchGateway<{ ok: boolean }>(`/notifications/${id}/read`, {});
    return;
  }
  const db = await getDbAsync();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function markAllRead(ownerId: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await patchGateway<{ ok: boolean }>(`/notifications/read-all`, { ownerId });
    return;
  }
  const db = await getDbAsync();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.ownerId, ownerId));
}

/**
 * Fan a notification out to email + Slack. Records a delivery row per channel
 * with the outcome. Both channels are no-ops until their provider env var is
 * set (RESEND_API_KEY / SLACK_BOT_TOKEN), so this is safe to call from every
 * app in any environment.
 */
async function dispatchDeliveries(
  notificationId: string,
  input: NotificationInput,
): Promise<void> {
  const db = isLocalGatewayMode() ? null : await getDbAsync();
  const channels: Array<{ channel: string; status: string; externalId?: string; error?: string }> = [];

  // Email (Resend)
  if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL_FROM) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.NOTIFICATION_EMAIL_FROM,
          to: process.env.NOTIFICATION_EMAIL_TO ?? input.ownerId,
          subject: input.title,
          text: input.body ?? input.title,
        }),
      });
      channels.push({
        channel: "email",
        status: res.ok ? "sent" : "failed",
        externalId: res.ok ? "resend" : undefined,
        error: res.ok ? undefined : `resend ${res.status}`,
      });
    } catch (e) {
      channels.push({ channel: "email", status: "failed", error: String(e) });
    }
  }

  // Slack DM (chat.postMessage)
  if (process.env.SLACK_BOT_TOKEN && process.env.NOTIFICATION_SLACK_CHANNEL) {
    try {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: process.env.NOTIFICATION_SLACK_CHANNEL,
          text: `*${input.title}*${input.body ? `\n${input.body}` : ""}`,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      channels.push({
        channel: "slack",
        status: data.ok ? "sent" : "failed",
        error: data.ok ? undefined : data.error,
      });
    } catch (e) {
      channels.push({ channel: "slack", status: "failed", error: String(e) });
    }
  }

  if (db && channels.length > 0) {
    for (const c of channels) {
      await db.insert(notificationDeliveries).values({
        notificationId,
        channel: c.channel,
        status: c.status,
        externalId: c.externalId ?? null,
        error: c.error ?? null,
      });
    }
  }
}
