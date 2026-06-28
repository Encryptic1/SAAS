import { NextResponse } from "next/server";
import { createIncident } from "@/lib/postmortem-data";

/**
 * Intake webhook for external sources to push incidents into Standard Postmortem.
 *
 * Sources: hook (failed webhook), status (failed pipeline/deploy),
 * pulse (blocker keyword), slack (/postmortem create).
 *
 * Header auth: `Authorization: Bearer <POSTMORTEM_INTAKE_SECRET>`
 * Body: { ownerId, title, severity?, source, summary?, rootcauseMd?, startedAt? }
 */
export async function POST(request: Request) {
  const expected = process.env.POSTMORTEM_INTAKE_SECRET;
  if (expected) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ownerId = String(body.ownerId ?? "");
  const title = String(body.title ?? "");
  const source = String(body.source ?? "manual");
  if (!ownerId || !title) {
    return NextResponse.json({ error: "ownerId and title required" }, { status: 400 });
  }

  const incident = await createIncident({
    ownerId,
    title,
    severity: body.severity ? String(body.severity) : undefined,
    source,
    summary: body.summary ? String(body.summary) : undefined,
    rootcauseMd: body.rootcauseMd ? String(body.rootcauseMd) : undefined,
    startedAt: body.startedAt ? String(body.startedAt) : undefined,
    status: "investigating",
  });
  return NextResponse.json({ incident }, { status: 201 });
}
