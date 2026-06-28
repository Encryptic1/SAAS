import { NextResponse } from "next/server";
import { exchangeSlackCode } from "@market-standard/auth";
import { getDbAsync } from "@market-standard/db";
import { workspaces } from "@market-standard/db/schema/polls";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const result = await exchangeSlackCode(code);

  if (!result.ok || !result.access_token || !result.team) {
    return NextResponse.redirect(`/?error=${encodeURIComponent(result.error ?? "oauth_failed")}`);
  }

  try {
    const db = await getDbAsync();
    await db
      .insert(workspaces)
      .values({
        slackTeamId: result.team.id,
        slackTeamName: result.team.name,
        botToken: result.access_token,
        plan: "free",
        showBadge: true,
      })
      .onConflictDoUpdate({
        target: workspaces.slackTeamId,
        set: {
          slackTeamName: result.team.name,
          botToken: result.access_token,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[polls] Failed to persist workspace:", err);
  }

  return NextResponse.redirect("/?installed=true");
}
