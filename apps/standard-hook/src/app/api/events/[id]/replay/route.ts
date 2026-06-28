import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { webhookEvents, webhookInboxes } from "@market-standard/db/schema/hook";
import { and, eq } from "@market-standard/db/query";
import { getOwnerId } from "@/lib/owner";

interface ReplayRouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: ReplayRouteProps) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { url?: string };
  if (!body.url?.trim()) {
    return NextResponse.json({ error: "Replay URL required" }, { status: 400 });
  }

  let event: typeof webhookEvents.$inferSelect | null = null;

  if (isLocalGatewayMode()) {
    const { fetchGateway } = await import("@market-standard/db");
    event = await fetchGateway<typeof webhookEvents.$inferSelect>(`/hook/events/${id}`).catch(
      () => null,
    );
  } else {
    const db = await getDbAsync();
    const [row] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id)).limit(1);
    if (row) {
      const [inbox] = await db
        .select()
        .from(webhookInboxes)
        .where(and(eq(webhookInboxes.id, row.inboxId), eq(webhookInboxes.ownerId, ownerId)))
        .limit(1);
      if (inbox) event = row;
    }
  }

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const headers = new Headers(event.headers ?? {});
  if (!headers.has("content-type") && event.body) {
    headers.set("content-type", "application/json");
  }

  try {
    const upstream = await fetch(body.url.trim(), {
      method: event.method || "POST",
      headers,
      body: event.body && event.method !== "GET" && event.method !== "HEAD" ? event.body : undefined,
    });

    return NextResponse.json({
      ok: true,
      status: upstream.status,
      statusText: upstream.statusText,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Replay failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
