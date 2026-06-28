import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { listNotifications, createNotification, type NotificationInput } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await listNotifications(ownerId);
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Partial<NotificationInput>;
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const notification = await createNotification({
    ownerId,
    app: "standard-status",
    title: body.title,
    body: body.body,
    href: body.href,
    level: body.level,
  });
  return NextResponse.json({ notification }, { status: 201 });
}
