import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { digestConfigs } from "@market-standard/db/schema/shared";
import { eq } from "@market-standard/db/query";
import type { DigestSource } from "./suite-digest";

export interface DigestConfigRow {
  id: string;
  ownerId: string;
  slackWorkspaceId: string | null;
  slackChannelId: string | null;
  frequency: "daily" | "weekly" | "off";
  sources: DigestSource[];
  enabled: boolean;
  lastSentAt: string | null;
  lastPreview: string | null;
}

const DEFAULT_SOURCES: DigestSource[] = ["polls", "metrics", "links", "floodg8", "syncdevtime"];

const LOCAL_DEV_FALLBACK: DigestConfigRow = {
  id: "local-dev-config",
  ownerId: "local-dev",
  slackWorkspaceId: null,
  slackChannelId: "#suite-digest",
  frequency: "weekly",
  sources: DEFAULT_SOURCES,
  enabled: true,
  lastSentAt: null,
  lastPreview: null,
};

export async function getDigestConfig(ownerId: string): Promise<DigestConfigRow> {
  if (isLocalGatewayMode()) {
    return LOCAL_DEV_FALLBACK;
  }

  const db = await getDbAsync();
  const [row] = await db.select().from(digestConfigs).where(eq(digestConfigs.ownerId, ownerId)).limit(1);
  if (!row) {
    return {
      id: "default",
      ownerId,
      slackWorkspaceId: null,
      slackChannelId: null,
      frequency: "weekly",
      sources: DEFAULT_SOURCES,
      enabled: false,
      lastSentAt: null,
      lastPreview: null,
    };
  }
  return {
    id: row.id,
    ownerId: row.ownerId,
    slackWorkspaceId: row.slackWorkspaceId ?? null,
    slackChannelId: row.slackChannelId ?? null,
    frequency: (row.frequency as DigestConfigRow["frequency"]) ?? "weekly",
    sources: (row.sources as DigestSource[]) ?? DEFAULT_SOURCES,
    enabled: row.enabled,
    lastSentAt: null,
    lastPreview: null,
  };
}

export async function upsertDigestConfig(
  ownerId: string,
  patch: Partial<Pick<DigestConfigRow, "frequency" | "sources" | "slackChannelId" | "enabled">>,
): Promise<DigestConfigRow> {
  if (isLocalGatewayMode()) {
    return {
      ...LOCAL_DEV_FALLBACK,
      ...patch,
      sources: patch.sources ?? LOCAL_DEV_FALLBACK.sources,
      frequency: patch.frequency ?? LOCAL_DEV_FALLBACK.frequency,
      slackChannelId: patch.slackChannelId ?? LOCAL_DEV_FALLBACK.slackChannelId,
      enabled: patch.enabled ?? LOCAL_DEV_FALLBACK.enabled,
    };
  }

  const db = await getDbAsync();
  const [existing] = await db.select().from(digestConfigs).where(eq(digestConfigs.ownerId, ownerId)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(digestConfigs)
      .set({
        frequency: patch.frequency ?? existing.frequency,
        sources: patch.sources ?? (existing.sources as DigestSource[]),
        slackChannelId: patch.slackChannelId ?? existing.slackChannelId,
        enabled: patch.enabled ?? existing.enabled,
      })
      .where(eq(digestConfigs.id, existing.id))
      .returning();
    return {
      id: updated!.id,
      ownerId: updated!.ownerId,
      slackWorkspaceId: updated!.slackWorkspaceId ?? null,
      slackChannelId: updated!.slackChannelId ?? null,
      frequency: (updated!.frequency as DigestConfigRow["frequency"]) ?? "weekly",
      sources: (updated!.sources as DigestSource[]) ?? DEFAULT_SOURCES,
      enabled: updated!.enabled,
      lastSentAt: null,
      lastPreview: null,
    };
  }

  const [created] = await db
    .insert(digestConfigs)
    .values({
      ownerId,
      frequency: patch.frequency ?? "weekly",
      sources: patch.sources ?? DEFAULT_SOURCES,
      slackChannelId: patch.slackChannelId ?? null,
      enabled: patch.enabled ?? true,
    })
    .returning();
  return {
    id: created!.id,
    ownerId: created!.ownerId,
    slackWorkspaceId: created!.slackWorkspaceId ?? null,
    slackChannelId: created!.slackChannelId ?? null,
    frequency: (created!.frequency as DigestConfigRow["frequency"]) ?? "weekly",
    sources: (created!.sources as DigestSource[]) ?? DEFAULT_SOURCES,
    enabled: created!.enabled,
    lastSentAt: null,
    lastPreview: null,
  };
}

export async function sendTestDigest(): Promise<{
  ok: boolean;
  preview?: unknown;
  error?: string;
}> {
  try {
    const res = await fetch("/api/cron/digest?preview=1", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { previews?: Array<{ blocks: unknown[] }> };
    return { ok: true, preview: data.previews?.[0]?.blocks ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listSlackChannels(): Promise<Array<{ id: string; name: string }>> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await res.json()) as {
      ok: boolean;
      channels?: Array<{ id: string; name: string }>;
    };
    if (!data.ok || !data.channels) return [];
    return data.channels.map((c) => ({ id: c.id, name: c.name }));
  } catch {
    return [];
  }
}

void fetchGateway;
