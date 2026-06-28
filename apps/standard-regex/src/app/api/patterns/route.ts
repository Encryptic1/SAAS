import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listPatterns, createPattern, listPublicPatterns } from "@/lib/regex-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const publicOnly = searchParams.get("public") === "1";
  const ownerId = await getOwnerId();

  if (publicOnly) {
    const rows = await listPublicPatterns();
    return NextResponse.json({ patterns: rows });
  }
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let rows = await listPatterns(ownerId);
  if (tag) {
    rows = rows.filter((p) => p.tags?.includes(tag));
  }
  return NextResponse.json({ patterns: rows });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    name?: string;
    pattern?: string;
    flags?: string;
    description?: string;
    testCases?: Array<{ input: string; expectedMatches: number | null; note?: string }>;
    tags?: string[];
    isPublic?: boolean;
  };
  if (!body.name || !body.pattern) {
    return NextResponse.json({ error: "name and pattern required" }, { status: 400 });
  }
  const row = await createPattern({
    ownerId,
    name: body.name,
    pattern: body.pattern,
    flags: body.flags,
    description: body.description,
    testCases: body.testCases,
    tags: body.tags,
    isPublic: body.isPublic,
  });
  return NextResponse.json({ pattern: row }, { status: 201 });
}
