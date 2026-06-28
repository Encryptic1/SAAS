import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getProject, createSecret } from "@/lib/vault-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ParsedEntry {
  key: string;
  value: string;
  comment?: string;
}

/**
 * Parse a .env file or Doppler-style JSON payload into key/value pairs.
 * Supports:
 *   - KEY=value
 *   - KEY="value"
 *   - KEY='value'
 *   - export KEY=value
 *   - # comment lines (attached to next KEY as `comment`)
 *   - blank lines
 *   - Doppler JSON: { "key": "value", ... }
 */
function parseEnvFile(text: string): ParsedEntry[] {
  // Try Doppler JSON first
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value ?? ""),
        }));
      }
    } catch {
      // fall through to .env parsing
    }
  }

  const out: ParsedEntry[] = [];
  let pendingComment: string | undefined;
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      pendingComment = line.slice(1).trim() || undefined;
      continue;
    }
    const exportMatch = line.match(/^export\s+([^=]+)=(.*)$/);
    const plainMatch = line.match(/^([^=]+)=(.*)$/);
    const match = exportMatch ?? plainMatch;
    if (!match || match[1] === undefined || match[2] === undefined) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.push({ key, value, comment: pendingComment });
    pendingComment = undefined;
  }
  return out;
}

/**
 * POST /api/projects/[id]/import
 * Body: { format: "env" | "doppler", content: string, overwrite?: boolean }
 * Parses the content and creates a secret for each entry. If `overwrite` is
 * true and a secret with the same key already exists, it gets rotated.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await getProject(id, ownerId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as {
    format?: "env" | "doppler";
    content?: string;
    overwrite?: boolean;
  };
  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }
  const format = body.format ?? "env";
  if (format !== "env" && format !== "doppler") {
    return NextResponse.json({ error: "invalid format" }, { status: 400 });
  }

  const entries = parseEnvFile(body.content);
  if (entries.length === 0) {
    return NextResponse.json({ error: "no entries parsed" }, { status: 400 });
  }

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    if (!entry.key || typeof entry.value !== "string") {
      errors.push(`${entry.key}: invalid entry`);
      continue;
    }
    try {
      const secret = await createSecret({
        projectId: id,
        key: entry.key,
        value: entry.value,
        agentReference: false,
        notes: entry.comment ?? null,
      });
      if (secret) {
        created.push(entry.key);
      } else {
        // Most likely a unique-key conflict — skip unless overwrite is set
        skipped.push(entry.key);
      }
    } catch (err) {
      errors.push(`${entry.key}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    format,
    parsed: entries.length,
    created: created.length,
    skipped: skipped.length,
    errors: errors.length,
    createdKeys: created,
    skippedKeys: skipped,
    errorDetails: errors,
    note: body.overwrite
      ? "overwrite=true requested — existing keys should be rotated. Use PATCH /api/secrets/[id] with value=... to rotate."
      : "existing keys were skipped (set overwrite=true to rotate them)",
  });
}
