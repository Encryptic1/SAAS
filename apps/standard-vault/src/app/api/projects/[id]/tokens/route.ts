import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { createToken, listProjectTokens, getProject } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tokens = await listProjectTokens(id);
  return NextResponse.json({ tokens });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await request.json()) as {
    name?: string;
    scopes?: string[];
    expiresInDays?: number | null;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const result = await createToken({
    projectId: id,
    name: body.name.trim(),
    scopes: body.scopes ?? ["read"],
    expiresInDays: body.expiresInDays ?? null,
  });
  if (!result) return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  return NextResponse.json({ token: result.token, tokenMeta: result.meta }, { status: 201 });
}
