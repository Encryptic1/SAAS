import { NextResponse } from "next/server";
import { recordQuotaSample } from "../../../lib/metrics-data";

export const dynamic = "force-dynamic";

interface QuotaPostBody {
  source?: string;
  quotaLabel?: string;
  used?: number;
  limit?: number | null;
  windowStartedAt?: string;
  windowEndsAt?: string | null;
  metadata?: Record<string, unknown>;
}

function authorized(request: Request): boolean {
  if (process.env.NEXT_PUBLIC_LOCAL_DEV === "true") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  const provided = request.headers.get("x-cron-secret");
  if (auth === `Bearer ${secret}`) return true;
  if (provided === secret) return true;
  return false;
}

export async function GET() {
  return NextResponse.json(
    { error: "Use the dashboard at /dashboard/quota to view quota samples." },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: QuotaPostBody;
  try {
    body = (await request.json()) as QuotaPostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.source || !body.quotaLabel) {
    return NextResponse.json({ error: "source and quotaLabel are required" }, { status: 400 });
  }
  await recordQuotaSample({
    source: body.source,
    quotaLabel: body.quotaLabel,
    used: body.used ?? 0,
    limit: body.limit ?? null,
    windowStartedAt: body.windowStartedAt ? new Date(body.windowStartedAt) : new Date(),
    windowEndsAt: body.windowEndsAt ? new Date(body.windowEndsAt) : null,
    metadata: body.metadata ?? {},
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
