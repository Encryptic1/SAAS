import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getProjectDotenv } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Owner-authorized dotenv export.
 *
 * Returns the project's secrets as a `text/plain` `.env` file
 * (`KEY=value` lines, newline-separated) for local development
 * and CI bootstrapping. Requires the authenticated owner.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const values = await getProjectDotenv(id, ownerId);
  if (values === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  return new NextResponse(body + (body.length > 0 ? "\n" : ""), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
