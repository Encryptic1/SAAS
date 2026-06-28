import { NextResponse } from "next/server";
import {
  listEnabledPrompts,
  cronMatchesNow,
  renderStandupDmBlocks,
  renderStandupModal,
  dmUserBlocks,
  listWorkspaceMembers,
} from "@/lib/standup-bot";

/** Vercel Cron: POST /api/cron/standup — DMs each workspace member a standup prompt button. */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && !process.env.SLACK_BOT_TOKEN) {
    const prompts = (await listEnabledPrompts()).filter((p) => cronMatchesNow(p.scheduleCron));
    return NextResponse.json({
      ok: true,
      preview: true,
      promptsDue: prompts.length,
      prompts: prompts.map((p) => ({
        id: p.id,
        channelId: p.channelId,
        scheduleCron: p.scheduleCron,
        questions: p.questions,
        dmBlocks: renderStandupDmBlocks(p),
        modalView: renderStandupModal(p, "preview-user"),
      })),
    });
  }

  const prompts = (await listEnabledPrompts()).filter((p) => cronMatchesNow(p.scheduleCron));
  const members = await listWorkspaceMembers();
  const dms: Array<{ slackUserId: string; ok: boolean; error?: string }> = [];

  for (const prompt of prompts) {
    const blocks = renderStandupDmBlocks(prompt);
    for (const userId of members) {
      const result = await dmUserBlocks(userId, blocks);
      dms.push({ slackUserId: userId, ok: result.ok, error: result.ok ? undefined : result.error });
    }
  }

  return NextResponse.json({
    ok: true,
    promptsDue: prompts.length,
    membersReached: dms.filter((d) => d.ok).length,
    failed: dms.filter((d) => !d.ok).length,
    dms,
  });
}
