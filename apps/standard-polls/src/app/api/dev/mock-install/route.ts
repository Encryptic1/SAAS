import { NextResponse } from "next/server";
import { isLocalGatewayMode, postGateway } from "@market-standard/db";
import { getDbAsync } from "@market-standard/db";
import { workspaces } from "@market-standard/db/schema/polls";

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_LOCAL_DEV !== "true") {
    return NextResponse.json({ error: "Not available outside local dev" }, { status: 404 });
  }

  if (isLocalGatewayMode()) {
    await postGateway("/polls/mock-install");
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/?installed=true", url.origin));
  }

  const db = await getDbAsync();
  await db
    .insert(workspaces)
    .values({
      slackTeamId: `T_LOCAL_${Date.now()}`,
      slackTeamName: "Local Dev Workspace",
      botToken: "xoxb-local-mock",
      plan: "free",
      showBadge: true,
    })
    .onConflictDoNothing();

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/?installed=true", url.origin));
}
