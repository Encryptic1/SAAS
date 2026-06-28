import { NextResponse } from "next/server";
import { fetchGateway, getDbAsync, isLocalGatewayMode, patchGateway, postGateway } from "@market-standard/db";
import { standupPrompts } from "@market-standard/db/schema/standup";
import { workspaces } from "@market-standard/db/schema/polls";
import { desc, eq } from "@market-standard/db/query";

export async function GET() {
  if (isLocalGatewayMode()) {
    const prompts = await fetchGateway<unknown[]>("/polls/standup/prompts");
    return NextResponse.json({ prompts });
  }

  const db = await getDbAsync();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    return NextResponse.json({ prompts: [] });
  }

  const prompts = await db
    .select()
    .from(standupPrompts)
    .where(eq(standupPrompts.workspaceId, workspace.id))
    .orderBy(desc(standupPrompts.createdAt));

  return NextResponse.json({ prompts });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    channelId?: string;
    scheduleCron?: string;
    questions?: string[];
  };

  if (!body.channelId?.trim() || !body.questions?.length) {
    return NextResponse.json({ error: "channelId and questions required" }, { status: 400 });
  }

  if (isLocalGatewayMode()) {
    const data = await postGateway("/polls/standup/prompts", body);
    return NextResponse.json(data);
  }

  const db = await getDbAsync();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const [prompt] = await db
    .insert(standupPrompts)
    .values({
      workspaceId: workspace.id,
      channelId: body.channelId.trim(),
      scheduleCron: body.scheduleCron?.trim() || "0 9 * * 1-5",
      questions: body.questions.map((q) => q.trim()).filter(Boolean),
      enabled: true,
    })
    .returning();

  return NextResponse.json({ prompt });
}
