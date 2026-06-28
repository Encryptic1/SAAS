import { NextResponse } from "next/server";
import { fetchGateway, getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { paymentLinks, stripeAccounts } from "@market-standard/db/schema/metrics";
import { desc, eq } from "@market-standard/db/query";

async function resolveAccountId() {
  if (isLocalGatewayMode()) return "local";
  const db = await getDbAsync();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  return account?.id ?? null;
}

export async function GET() {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ links: Array<Record<string, unknown>> }>("/metrics/payment-links");
    return NextResponse.json(data);
  }

  const db = await getDbAsync();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) {
    return NextResponse.json({ links: [] });
  }

  const links = await db
    .select()
    .from(paymentLinks)
    .where(eq(paymentLinks.stripeAccountId, account.id))
    .orderBy(desc(paymentLinks.createdAt));

  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; url?: string };
  const name = body.name?.trim();
  const url = body.url?.trim();

  if (!name || !url) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 });
  }

  if (isLocalGatewayMode()) {
    const data = await postGateway<{ link: Record<string, unknown> }>("/metrics/payment-links", { name, url });
    return NextResponse.json(data);
  }

  const accountId = await resolveAccountId();
  if (!accountId || accountId === "local") {
    return NextResponse.json({ error: "No Stripe account connected" }, { status: 404 });
  }

  const db = await getDbAsync();
  const stripeLinkId = `plink_${Date.now()}`;
  const [link] = await db
    .insert(paymentLinks)
    .values({
      stripeAccountId: accountId,
      stripeLinkId,
      name,
      url,
      active: true,
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ link });
}
