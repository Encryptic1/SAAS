import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getProject, updateSecret, deleteSecret } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    projectId?: string;
    value?: string;
    agentReference?: boolean;
    notes?: string | null;
  };
  if (!body.projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  // Verify ownership of the parent project
  const project = await getProject(body.projectId, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const secret = await updateSecret(id, body.projectId, {
    value: body.value,
    agentReference: body.agentReference,
    notes: body.notes,
  });
  if (!secret) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ secret });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  const project = await getProject(projectId, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteSecret(id, projectId);
  return NextResponse.json({ ok: true });
}
