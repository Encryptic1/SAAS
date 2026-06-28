import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { webhookEvents, webhookInboxes } from "@market-standard/db/schema/hook";
import { eq } from "@market-standard/db/query";
import { getInboxBySlug } from "@/lib/hook-data";

function headersToRecord(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function captureWebhook(slug: string, request: Request) {
  const inbox = await getInboxBySlug(slug);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const bodyText = await request.text();
  const headers = headersToRecord(request);
  const method = request.method;

  if (isLocalGatewayMode()) {
    const row = await postGateway<typeof webhookEvents.$inferSelect>(`/hook/capture/${slug}`, {
      method,
      headers,
      body: bodyText || null,
      queryParams,
    });
    return NextResponse.json({ ok: true, eventId: row.id }, { status: 200 });
  }

  const db = await getDbAsync();
  const [row] = await db
    .insert(webhookEvents)
    .values({
      inboxId: inbox.id,
      method,
      headers,
      body: bodyText || null,
      queryParams,
    })
    .returning();

  return NextResponse.json({ ok: true, eventId: row!.id }, { status: 200 });
}

interface CaptureRouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: CaptureRouteProps) {
  const { slug } = await params;
  return captureWebhook(slug, request);
}

export async function POST(request: Request, { params }: CaptureRouteProps) {
  const { slug } = await params;
  return captureWebhook(slug, request);
}

export async function PUT(request: Request, { params }: CaptureRouteProps) {
  const { slug } = await params;
  return captureWebhook(slug, request);
}

export async function PATCH(request: Request, { params }: CaptureRouteProps) {
  const { slug } = await params;
  return captureWebhook(slug, request);
}

export async function DELETE(request: Request, { params }: CaptureRouteProps) {
  const { slug } = await params;
  return captureWebhook(slug, request);
}

export async function HEAD(request: Request, { params }: CaptureRouteProps) {
  const { slug } = await params;
  return captureWebhook(slug, request);
}

export async function OPTIONS(request: Request, { params }: CaptureRouteProps) {
  const { slug } = await params;
  return captureWebhook(slug, request);
}
