import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { createSecret, listProjectSecrets, getProject } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const secrets = await listProjectSecrets(id);
  return NextResponse.json({ secrets });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await request.json()) as {
    key?: string;
    value?: string;
    agentReference?: boolean;
    notes?: string | null;
  };
  if (!body.key?.trim() || typeof body.value !== "string") {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }
  const secret = await createSecret({
    projectId: id,
    key: body.key.trim(),
    value: body.value,
    agentReference: body.agentReference ?? false,
    notes: body.notes?.trim() || null,
  });
  if (!secret) return NextResponse.json({ error: "Failed to create secret" }, { status: 500 });
  return NextResponse.json({ secret }, { status: 201 });
}
