import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { deleteProject, getProject, updateProject } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    name?: string;
    environment?: string;
    githubRepo?: string | null;
    description?: string | null;
  };
  const project = await updateProject(id, ownerId, body);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteProject(id, ownerId);
  return NextResponse.json({ ok: true });
}
