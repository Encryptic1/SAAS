import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { createProject, listOwnerProjects } from "@/lib/vault-data";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await listOwnerProjects(ownerId);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    name?: string;
    environment?: string;
    githubRepo?: string | null;
    description?: string | null;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const project = await createProject({
    ownerId,
    name: body.name.trim(),
    environment: body.environment?.trim() || "production",
    githubRepo: body.githubRepo?.trim() || null,
    description: body.description?.trim() || null,
  });
  if (!project) return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  return NextResponse.json({ project }, { status: 201 });
}
