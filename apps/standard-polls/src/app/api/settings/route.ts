import { NextResponse } from "next/server";
import { fetchGateway, getDbAsync, isLocalGatewayMode, patchGateway } from "@market-standard/db";
import { workspaces } from "@market-standard/db/schema/polls";
import { eq } from "@market-standard/db/query";

export async function GET() {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ showBadge: boolean; plan: string; slackTeamName: string | null }>(
      "/polls/workspace",
    );
    return NextResponse.json(data);
  }

  const db = await getDbAsync();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    return NextResponse.json({ showBadge: true, plan: "free", slackTeamName: null });
  }

  return NextResponse.json({
    showBadge: workspace.showBadge,
    plan: workspace.plan,
    slackTeamName: workspace.slackTeamName,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { showBadge?: boolean };

  if (isLocalGatewayMode()) {
    const data = await patchGateway("/polls/workspace", body);
    return NextResponse.json(data);
  }

  const db = await getDbAsync();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const [updated] = await db
    .update(workspaces)
    .set({
      showBadge: body.showBadge ?? workspace.showBadge,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspace.id))
    .returning();

  return NextResponse.json({
    showBadge: updated!.showBadge,
    plan: updated!.plan,
    slackTeamName: updated!.slackTeamName,
  });
}
