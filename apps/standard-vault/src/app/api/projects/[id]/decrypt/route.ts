import { NextResponse } from "next/server";
import { decryptProjectSecrets } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Decrypt endpoint used by the env-injection CLI shim (ms-vault run).
 * Auth is via the per-project token in the request body — NOT user session —
 * so the CLI can run in CI without a browser session.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { token?: string };
  if (!body.token) return NextResponse.json({ error: "token required" }, { status: 401 });
  const secrets = await decryptProjectSecrets(id, body.token);
  if (secrets === null) {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 401 });
  }
  return NextResponse.json({ secrets });
}
