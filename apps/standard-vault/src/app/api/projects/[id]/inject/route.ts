import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getProject, listProjectSecrets } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function maskValue(_value: unknown, valueHash: string | null): string {
  if (valueHash) {
    return `${valueHash.slice(0, 8)}…`;
  }
  return "********";
}

/**
 * Masked secret map for `ms-vault run -- <cmd>` CLI injection.
 *
 * Returns the list of secret keys available in the project plus a masked
 * preview (hash prefix) — never the plaintext values. The CLI uses this to
 * know which env vars to populate, then calls the decrypt endpoint with a
 * vault token to fetch plaintext values at runtime.
 *
 * Also marks which secrets are safe for AI agent reference (`agentReference`).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const secrets = await listProjectSecrets(id);
  return NextResponse.json({
    projectId: project.id,
    projectName: project.name,
    environment: project.environment,
    secrets: secrets.map((s) => ({
      key: s.key,
      maskedValue: maskValue(s, s.valueHash),
      version: s.version,
      agentReference: s.agentReference,
      lastRotatedAt: s.lastRotatedAt ? s.lastRotatedAt.toISOString() : null,
    })),
    injectHint:
      "Use `ms-vault run -- <cmd>` with a VAULT_TOKEN to inject these keys as env vars. " +
      "Agent-reference keys are visible to AI agents without plaintext exposure.",
  });
}
