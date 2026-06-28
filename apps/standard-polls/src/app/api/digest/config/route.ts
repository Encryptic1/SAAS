import { NextResponse } from "next/server";
import { getDigestConfig, listSlackChannels, upsertDigestConfig } from "@/lib/digest-config";
import type { DigestSource } from "@/lib/suite-digest";

const OWNER_ID = "local-dev";

export async function GET() {
  const [config, channels] = await Promise.all([getDigestConfig(OWNER_ID), listSlackChannels()]);
  return NextResponse.json({ config, channels });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    frequency?: "daily" | "weekly" | "off";
    sources?: DigestSource[];
    slackChannelId?: string | null;
    enabled?: boolean;
  };

  const validSources: DigestSource[] = ["polls", "metrics", "floodg8", "syncdevtime", "links"];
  const sanitized: Partial<Parameters<typeof upsertDigestConfig>[1]> = {};
  if (body.frequency && ["daily", "weekly", "off"].includes(body.frequency)) {
    sanitized.frequency = body.frequency;
  }
  if (Array.isArray(body.sources)) {
    sanitized.sources = body.sources.filter((s): s is DigestSource => validSources.includes(s));
  }
  if (typeof body.slackChannelId === "string" || body.slackChannelId === null) {
    sanitized.slackChannelId = body.slackChannelId;
  }
  if (typeof body.enabled === "boolean") {
    sanitized.enabled = body.enabled;
  }

  const config = await upsertDigestConfig(OWNER_ID, sanitized);
  return NextResponse.json({ config });
}
