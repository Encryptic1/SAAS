import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode, patchGateway } from "@market-standard/db";
import { standupPrompts } from "@market-standard/db/schema/standup";
import { eq } from "@market-standard/db/query";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { enabled?: boolean; questions?: string[] };

  if (isLocalGatewayMode()) {
    const data = await patchGateway(`/polls/standup/prompts/${id}`, body);
    return NextResponse.json(data);
  }

  const db = await getDbAsync();
  const updates: Partial<typeof standupPrompts.$inferInsert> = {};
  if (body.enabled !== undefined) updates.enabled = body.enabled;
  if (body.questions !== undefined) updates.questions = body.questions;

  const [prompt] = await db.update(standupPrompts).set(updates).where(eq(standupPrompts.id, id)).returning();
  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ prompt });
}
