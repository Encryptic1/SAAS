import { NextResponse } from "next/server";
import { heartbeatByToken } from "@/lib/cron-data";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    durationMs?: number | null;
    metadata?: Record<string, unknown>;
  };
  const run = await heartbeatByToken(token, body);
  if (!run) return NextResponse.json({ error: "Unknown heartbeat token" }, { status: 404 });
  return NextResponse.json({ ok: true, run }, { status: 201 });
}
