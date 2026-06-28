import { NextResponse } from "next/server";
import {
  listEnabledPrompts,
  listRecentResponses,
  renderDigestBlocks,
  postToChannel,
} from "@/lib/standup-bot";

/** Vercel Cron: POST /api/cron/standup-digest — posts a per-channel digest of today's responses with blocker flags. */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && !process.env.SLACK_BOT_TOKEN) {
    const prompts = await listEnabledPrompts();
    const digests = await Promise.all(
      prompts.map(async (p) => {
        const responses = await listRecentResponses(p.id, 1);
        return {
          promptId: p.id,
          channelId: p.channelId,
          responseCount: responses.length,
          blocks: renderDigestBlocks(p, responses),
        };
      }),
    );
    return NextResponse.json({ ok: true, preview: true, digests });
  }

  const prompts = await listEnabledPrompts();
  const posts: Array<{ channelId: string; ok: boolean; error?: string }> = [];
  for (const prompt of prompts) {
    const responses = await listRecentResponses(prompt.id, 1);
    if (responses.length === 0) continue;
    const blocks = renderDigestBlocks(prompt, responses);
    const result = await postToChannel(prompt.channelId, blocks);
    posts.push({
      channelId: prompt.channelId,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });
  }

  return NextResponse.json({
    ok: true,
    digestsPosted: posts.filter((p) => p.ok).length,
    failed: posts.filter((p) => !p.ok).length,
    posts,
  });
}
