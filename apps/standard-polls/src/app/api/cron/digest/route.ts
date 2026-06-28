import { NextResponse } from "next/server";
import { runDigestCron } from "@/lib/suite-digest";

/** Vercel Cron: POST /api/cron/digest — aggregates suite metrics and posts to Slack. */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && !process.env.SLACK_BOT_TOKEN) {
    // Local dev: compose but don't actually post to Slack — return a synthetic success so
    // operators can verify the cron runs and inspect the composed payload via /api/cron/digest?preview=1.
    const { composeDigest, renderDigestBlocks, listEnabledDigestConfigs } = await import("@/lib/suite-digest");
    const configs = await listEnabledDigestConfigs();
    const previews = await Promise.all(
      configs.map(async (c) => ({
        channelId: c.slackChannelId,
        frequency: c.frequency,
        sources: c.sources,
        blocks: renderDigestBlocks(await composeDigest(c.sources, c.frequency)),
      })),
    );
    return NextResponse.json({
      ok: true,
      posted: 0,
      preview: true,
      configs: previews.length,
      previews,
    });
  }

  const result = await runDigestCron();
  return NextResponse.json({
    ok: true,
    posted: result.posts.filter((p) => p.ok).length,
    failed: result.posts.filter((p) => !p.ok).length,
    configsProcessed: result.configsProcessed,
    posts: result.posts,
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { composeDigest, renderDigestBlocks, listEnabledDigestConfigs } = await import("@/lib/suite-digest");
  const configs = await listEnabledDigestConfigs();
  const previews = await Promise.all(
    configs.map(async (c) => ({
      channelId: c.slackChannelId,
      frequency: c.frequency,
      sources: c.sources,
      blocks: renderDigestBlocks(await composeDigest(c.sources, c.frequency)),
    })),
  );
  return NextResponse.json({ ok: true, configs: previews.length, previews });
}
