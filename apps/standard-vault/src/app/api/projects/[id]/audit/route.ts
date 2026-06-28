import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getProject, listAuditLog } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const audit = await listAuditLog(id);
  return NextResponse.json({ audit });
}
